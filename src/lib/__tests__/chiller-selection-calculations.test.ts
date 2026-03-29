/**
 * Unit tests for Chiller Selection Calculations Library
 * Validates AHRI 551/591 temperature corrections, IPLV adjustments, and selection logic
 */

import { describe, it, expect } from 'vitest';
import {
  calculateAdjustedIplv,
  calculateFitScore,
  selectChiller,
  calculateChwFlowGpm,
  ASHRAE_90_1_MINIMUMS,
  AHRI_STANDARD_CONDITIONS,
  AHRI_CORRECTION_FACTORS,
  CHILLER_CATALOG,
  type ChillerRequirements,
  type ChillerType,
  type ChillerCatalogItem,
} from '../chiller-selection-calculations';
import { expectWithinPercent } from './test-utils';

// =============================================================================
// calculateAdjustedIplv Tests (AHRI 551/591 Temperature Corrections)
// =============================================================================

describe('calculateAdjustedIplv', () => {
  describe('water-cooled chillers', () => {
    it('returns no adjustment at AHRI standard conditions', () => {
      const result = calculateAdjustedIplv(
        10.2,                      // base IPLV
        'water-cooled-centrifugal',
        44,                        // standard LCHWT
        85                         // standard ECWT
      );
      
      // At standard conditions, correction should be minimal
      expect(Math.abs(result.correctionFactor - 1)).toBeLessThan(0.01);
      expect(result.adjustedIplv).toBeCloseTo(10.2, 1);
    });

    it('decreases efficiency with lower LCHWT', () => {
      const result = calculateAdjustedIplv(
        10.2,
        'water-cooled-centrifugal',
        40,  // 4°F below standard (harder to reach)
        85
      );
      
      expect(result.adjustedIplv).toBeLessThan(10.2);
      expect(result.corrections.lchwt.deviation).toBe(-4);
      expect(result.corrections.lchwt.effect).toBeLessThan(0);
    });

    it('increases efficiency with higher LCHWT', () => {
      const result = calculateAdjustedIplv(
        10.2,
        'water-cooled-centrifugal',
        48,  // 4°F above standard (easier)
        85
      );
      
      expect(result.adjustedIplv).toBeGreaterThan(10.2);
      expect(result.corrections.lchwt.deviation).toBe(4);
      expect(result.corrections.lchwt.effect).toBeGreaterThan(0);
    });

    it('decreases efficiency with higher ECWT', () => {
      const result = calculateAdjustedIplv(
        10.2,
        'water-cooled-centrifugal',
        44,
        95  // 10°F above standard (harder to reject heat)
      );
      
      expect(result.adjustedIplv).toBeLessThan(10.2);
      expect(result.corrections.ecwt?.deviation).toBe(10);
      expect(result.corrections.ecwt?.effect).toBeLessThan(0);
    });

    it('increases efficiency with lower ECWT', () => {
      const result = calculateAdjustedIplv(
        10.2,
        'water-cooled-centrifugal',
        44,
        75  // 10°F below standard (easier to reject)
      );
      
      expect(result.adjustedIplv).toBeGreaterThan(10.2);
      expect(result.corrections.ecwt?.deviation).toBe(-10);
      expect(result.corrections.ecwt?.effect).toBeGreaterThan(0);
    });

    it('combines LCHWT and ECWT effects correctly', () => {
      const result = calculateAdjustedIplv(
        10.0,
        'water-cooled-screw',
        40,  // 4°F below standard (negative effect)
        90   // 5°F above standard (negative effect)
      );
      
      // Both effects should compound negatively
      expect(result.adjustedIplv).toBeLessThan(10.0);
      expect(result.correctionFactor).toBeLessThan(1);
    });

    it('applies correct correction factor magnitude per AHRI', () => {
      const result = calculateAdjustedIplv(
        10.0,
        'water-cooled-centrifugal',
        44,
        95  // 10°F above standard
      );
      
      // Expected effect: -10°F × 1.2% = -12% efficiency loss
      const expectedAdjustment = 10 * AHRI_CORRECTION_FACTORS.ecwt;
      expectWithinPercent(1 - result.correctionFactor, expectedAdjustment, 20);
    });
  });

  describe('air-cooled chillers', () => {
    it('returns no adjustment at AHRI standard conditions', () => {
      const result = calculateAdjustedIplv(
        4.6,
        'air-cooled-scroll',
        44,   // standard LCHWT
        undefined,
        95    // standard ambient
      );
      
      expect(Math.abs(result.correctionFactor - 1)).toBeLessThan(0.01);
    });

    it('decreases efficiency with higher ambient', () => {
      const result = calculateAdjustedIplv(
        4.6,
        'air-cooled-screw',
        44,
        undefined,
        115  // 20°F above standard (Saudi summer)
      );
      
      expect(result.adjustedIplv).toBeLessThan(4.6);
      expect(result.corrections.ambient?.deviation).toBe(20);
      expect(result.corrections.ambient?.effect).toBeLessThan(0);
    });

    it('increases efficiency with lower ambient', () => {
      const result = calculateAdjustedIplv(
        4.6,
        'air-cooled-scroll',
        44,
        undefined,
        75  // 20°F below standard
      );
      
      expect(result.adjustedIplv).toBeGreaterThan(4.6);
      expect(result.corrections.ambient?.effect).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('handles missing ECWT for water-cooled', () => {
      const result = calculateAdjustedIplv(
        10.0,
        'water-cooled-centrifugal',
        44
        // No ECWT provided
      );
      
      expect(result.corrections.ecwt).toBeUndefined();
      expect(result.adjustedIplv).toBeDefined();
    });

    it('handles missing ambient for air-cooled', () => {
      const result = calculateAdjustedIplv(
        4.6,
        'air-cooled-scroll',
        44
        // No ambient provided
      );
      
      expect(result.corrections.ambient).toBeUndefined();
      expect(result.adjustedIplv).toBeDefined();
    });

    it('generates explanation for corrections', () => {
      const result = calculateAdjustedIplv(
        10.0,
        'water-cooled-centrifugal',
        40,  // 4°F below standard
        90   // 5°F above standard
      );
      
      expect(result.explanation).toBeDefined();
      expect(result.explanation.length).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// calculateChillerFitScore Tests
// =============================================================================

describe('calculateFitScore', () => {
  const sampleChiller: ChillerCatalogItem = CHILLER_CATALOG.find(
    c => c.id === 'carrier-19xr-350'
  )!;

  it('scores ideal sizing (100-115% capacity) highly', () => {
    const requirements: ChillerRequirements = {
      requiredCapacityTons: 320, // 350 is 109% = ideal
    };
    
    const score = calculateFitScore(sampleChiller, requirements);
    expect(score).toBeGreaterThanOrEqual(100);
  });

  it('penalizes undersized chillers', () => {
    const requirements: ChillerRequirements = {
      requiredCapacityTons: 400, // 350 is 87.5% = undersized
    };
    
    const score = calculateFitScore(sampleChiller, requirements);
    expect(score).toBeLessThan(100);
  });

  it('penalizes significantly oversized chillers', () => {
    const requirements: ChillerRequirements = {
      requiredCapacityTons: 200, // 350 is 175% = way oversized
    };
    
    const score = calculateFitScore(sampleChiller, requirements);
    expect(score).toBeLessThan(100);
  });

  it('gives bonus for efficiency above ASHRAE baseline', () => {
    const requirements: ChillerRequirements = {
      requiredCapacityTons: 350,
    };
    
    // Carrier 19XR-350 has IPLV 10.2, baseline is 9.7
    const score = calculateFitScore(sampleChiller, requirements);
    expect(score).toBeGreaterThanOrEqual(100);
  });

  it('penalizes chillers below minimum IPLV requirement', () => {
    const requirements: ChillerRequirements = {
      requiredCapacityTons: 350,
      minIplv: 11.0, // Higher than chiller's 10.2
    };
    
    const score = calculateFitScore(sampleChiller, requirements);
    expect(score).toBeLessThan(100);
  });

  it('considers manufacturer preference', () => {
    const carrierRequirements: ChillerRequirements = {
      requiredCapacityTons: 350,
      manufacturerPreference: 'Carrier',
    };
    
    const traneRequirements: ChillerRequirements = {
      requiredCapacityTons: 350,
      manufacturerPreference: 'Trane',
    };
    
    const carrierScore = calculateFitScore(sampleChiller, carrierRequirements);
    const traneScore = calculateFitScore(sampleChiller, traneRequirements);
    
    // Carrier preference should score higher for Carrier chiller
    expect(carrierScore).toBeGreaterThan(traneScore);
  });

  it('checks SASO compliance when required', () => {
    const requirements: ChillerRequirements = {
      requiredCapacityTons: 350,
      sasoRequired: true,
    };
    
    const score = calculateFitScore(sampleChiller, requirements);
    // Carrier 19XR-350 is SASO compliant
    expect(score).toBeGreaterThanOrEqual(100);
  });
});

// =============================================================================
// selectChiller Tests
// =============================================================================

describe('selectChiller', () => {
  it('selects appropriate chiller for requirements', () => {
    const requirements: ChillerRequirements = {
      requiredCapacityTons: 400,
      chillerType: 'water-cooled-centrifugal',
    };
    
    const result = selectChiller(requirements);
    
    expect(result.selectedChiller).toBeDefined();
    expect(result.selectedChiller.capacityTons).toBeGreaterThanOrEqual(400);
    expect(result.selectedChiller.chillerType).toBe('water-cooled-centrifugal');
  });

  it('provides fit score in result', () => {
    const requirements: ChillerRequirements = {
      requiredCapacityTons: 200,
      chillerType: 'water-cooled-screw',
    };
    
    const result = selectChiller(requirements);
    
    expect(result.fitScore).toBeDefined();
    expect(result.fitScore).toBeGreaterThan(0);
  });

  it('calculates capacity match metrics', () => {
    const requirements: ChillerRequirements = {
      requiredCapacityTons: 180,
    };
    
    const result = selectChiller(requirements);
    
    expect(result.capacityMatch).toBeDefined();
    expect(result.capacityMatch.required).toBe(180);
    expect(result.capacityMatch.selected).toBeGreaterThan(0);
    expect(result.capacityMatch.percentOver).toBeDefined();
  });

  it('includes efficiency analysis', () => {
    const requirements: ChillerRequirements = {
      requiredCapacityTons: 350,
    };
    
    const result = selectChiller(requirements);
    
    expect(result.efficiencyAnalysis).toBeDefined();
    expect(result.efficiencyAnalysis.iplv).toBeGreaterThan(0);
    expect(result.efficiencyAnalysis.cop).toBeGreaterThan(0);
    expect(result.efficiencyAnalysis.percentBetterThanBaseline).toBeDefined();
  });

  it('provides part load performance data', () => {
    const requirements: ChillerRequirements = {
      requiredCapacityTons: 350,
    };
    
    const result = selectChiller(requirements);
    
    expect(result.partLoadPerformance).toBeDefined();
    expect(result.partLoadPerformance.load100).toBeDefined();
    expect(result.partLoadPerformance.load75).toBeDefined();
    expect(result.partLoadPerformance.load50).toBeDefined();
    expect(result.partLoadPerformance.load25).toBeDefined();
  });

  it('provides alternates list', () => {
    const requirements: ChillerRequirements = {
      requiredCapacityTons: 400,
    };
    
    const result = selectChiller(requirements);
    
    expect(result.alternates).toBeDefined();
    expect(Array.isArray(result.alternates)).toBe(true);
  });

  it('generates warnings for edge cases', () => {
    const requirements: ChillerRequirements = {
      requiredCapacityTons: 50, // Very small - may not find good match
    };
    
    const result = selectChiller(requirements);
    
    expect(result.warnings).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});

// =============================================================================
// calculateCHWFlowGpm Tests
// =============================================================================

describe('calculateChwFlowGpm', () => {
  it('calculates flow for standard 10°F ΔT', () => {
    // Q = 200 tons = 2,400,000 BTU/h
    // GPM = 2,400,000 / (500 × 10) = 480 GPM
    const result = calculateChwFlowGpm(200, 10);
    expect(result).toBe(480);
  });

  it('calculates flow for 12°F ΔT', () => {
    // 200 tons, 12°F ΔT
    // GPM = 2,400,000 / (500 × 12) = 400 GPM
    const result = calculateChwFlowGpm(200, 12);
    expect(result).toBe(400);
  });

  it('uses default 10°F ΔT when not specified', () => {
    const result = calculateChwFlowGpm(100); // 100 tons
    expect(result).toBe(240); // 1,200,000 / (500 × 10)
  });

  it('handles large capacity values', () => {
    const result = calculateChwFlowGpm(1000, 10); // 1000 tons
    expect(result).toBe(2400);
  });

  it('handles fractional tons', () => {
    const result = calculateChwFlowGpm(150.5, 10);
    expectWithinPercent(result, 361.2, 1);
  });
});

// =============================================================================
// ASHRAE 90.1 Compliance Tests
// =============================================================================

describe('ASHRAE 90.1 Compliance', () => {
  it('has correct baseline values for water-cooled centrifugal', () => {
    const baseline = ASHRAE_90_1_MINIMUMS['water-cooled-centrifugal'];
    expect(baseline.iplv).toBeCloseTo(9.7, 1);
    expect(baseline.cop).toBeCloseTo(6.1, 1);
  });

  it('has correct baseline values for air-cooled scroll', () => {
    const baseline = ASHRAE_90_1_MINIMUMS['air-cooled-scroll'];
    expect(baseline.iplv).toBeCloseTo(4.6, 1);
    expect(baseline.eer).toBeCloseTo(3.1, 1);
  });

  it('all catalog chillers exceed ASHRAE minimums', () => {
    CHILLER_CATALOG.forEach(chiller => {
      const baseline = ASHRAE_90_1_MINIMUMS[chiller.chillerType];
      
      expect(chiller.iplv).toBeGreaterThanOrEqual(baseline.iplv);
      expect(chiller.cop).toBeGreaterThanOrEqual(baseline.cop);
    });
  });

  it('all catalog chillers are AHRI certified', () => {
    CHILLER_CATALOG.forEach(chiller => {
      expect(chiller.ahriCertified).toBe(true);
    });
  });

  it('all catalog chillers are SASO compliant', () => {
    CHILLER_CATALOG.forEach(chiller => {
      expect(chiller.sasoCompliant).toBe(true);
    });
  });
});

// =============================================================================
// AHRI Standard Conditions Tests
// =============================================================================

describe('AHRI Standard Conditions', () => {
  it('has correct water-cooled standard conditions', () => {
    expect(AHRI_STANDARD_CONDITIONS.waterCooled.lchwt).toBe(44);
    expect(AHRI_STANDARD_CONDITIONS.waterCooled.ecwt).toBe(85);
  });

  it('has correct air-cooled standard conditions', () => {
    expect(AHRI_STANDARD_CONDITIONS.airCooled.lchwt).toBe(44);
    expect(AHRI_STANDARD_CONDITIONS.airCooled.ambient).toBe(95);
  });

  it('has reasonable correction factors', () => {
    // Verify correction factors are in reasonable range
    expect(AHRI_CORRECTION_FACTORS.lchwt).toBeGreaterThan(0);
    expect(AHRI_CORRECTION_FACTORS.lchwt).toBeLessThan(0.05);
    
    expect(AHRI_CORRECTION_FACTORS.ecwt).toBeGreaterThan(0);
    expect(AHRI_CORRECTION_FACTORS.ecwt).toBeLessThan(0.05);
    
    expect(AHRI_CORRECTION_FACTORS.ambient).toBeGreaterThan(0);
    expect(AHRI_CORRECTION_FACTORS.ambient).toBeLessThan(0.03);
  });
});
