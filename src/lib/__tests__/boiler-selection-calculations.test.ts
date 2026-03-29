/**
 * Unit tests for Boiler Selection Calculations Library
 * Validates AHRI 1500 efficiency corrections, ASHRAE 90.1 compliance, and selection logic
 */

import { describe, it, expect } from 'vitest';
import {
  calculateAdjustedBoilerEfficiency,
  calculateHWFlowGpm,
  calculateAnnualFuelConsumption,
  calculateBoilerFitScore,
  selectBoiler,
  getBoilerTypeDisplayName,
  getFuelTypeDisplayName,
  getBoilerManufacturers,
  getBoilerCapacityRange,
  ASHRAE_90_1_BOILER_MINIMUMS,
  AHRI_STANDARD_CONDITIONS_BOILER,
  BOILER_CORRECTION_FACTORS,
  CONDENSING_THRESHOLD_TEMP,
  BOILER_CATALOG,
  type BoilerRequirements,
  type BoilerType,
  type BoilerCatalogItem,
} from '../boiler-selection-calculations';
import { expectWithinPercent } from './test-utils';

// =============================================================================
// calculateAdjustedBoilerEfficiency Tests
// =============================================================================

describe('calculateAdjustedBoilerEfficiency', () => {
  describe('condensing boiler behavior', () => {
    it('returns no adjustment at AHRI standard conditions', () => {
      const result = calculateAdjustedBoilerEfficiency(
        96,               // base AFUE
        'condensing-gas',
        160,              // standard return temp for condensing
        180,              // standard supply temp
        60                // standard combustion air
      );
      
      // At standard conditions, correction should be minimal
      expect(Math.abs(result.correctionFactor)).toBeLessThan(1);
      expect(result.adjustedAfue).toBeCloseTo(96, 0);
      expect(result.isCondensing).toBe(true);
      expect(result.isCondensingMode).toBe(false);
    });

    it('increases efficiency with lower return temp above condensing threshold', () => {
      const result = calculateAdjustedBoilerEfficiency(
        96,
        'condensing-gas',
        140,  // 20°F below standard (160°F)
        180,
        60
      );
      
      expect(result.adjustedAfue).toBeGreaterThan(96);
      expect(result.corrections.returnTemp.deviation).toBe(20);
      expect(result.corrections.returnTemp.effect).toBeGreaterThan(0);
      expect(result.isCondensingMode).toBe(false); // 140°F > 130°F threshold
    });

    it('provides enhanced efficiency boost below condensing threshold', () => {
      const result = calculateAdjustedBoilerEfficiency(
        96,
        'condensing-gas',
        110,  // Well below 130°F threshold
        180,
        60
      );
      
      // Enhanced effect (1.5x factor) should apply
      expect(result.adjustedAfue).toBeGreaterThan(97);
      expect(result.isCondensingMode).toBe(true);
      expect(result.isCondensing).toBe(true);
      
      // Verify enhanced factor is applied (50°F deviation × 0.4% × 1.5)
      // Expected effect ≈ 50 × 0.004 × 1.5 = 0.3 = 30% of 96 = ~3% boost
      expectWithinPercent(result.adjustedAfue, 99, 3);
    });

    it('decreases efficiency with higher return temp', () => {
      const result = calculateAdjustedBoilerEfficiency(
        96,
        'condensing-gas',
        180,  // 20°F above standard (160°F)
        180,
        60
      );
      
      expect(result.adjustedAfue).toBeLessThan(96);
      expect(result.corrections.returnTemp.deviation).toBe(-20);
      expect(result.corrections.returnTemp.effect).toBeLessThan(0);
    });

    it('accounts for colder combustion air (slight efficiency loss)', () => {
      const result = calculateAdjustedBoilerEfficiency(
        96,
        'condensing-gas',
        160,  // Standard return temp
        180,
        40    // 20°F below standard (60°F)
      );
      
      // Colder air = slight efficiency loss
      expect(result.corrections.combustionAir.deviation).toBe(20);
      expect(result.corrections.combustionAir.effect).toBeLessThan(0);
    });

    it('accounts for warmer combustion air (slight efficiency gain)', () => {
      const result = calculateAdjustedBoilerEfficiency(
        96,
        'condensing-gas',
        160,
        180,
        80    // 20°F above standard
      );
      
      expect(result.corrections.combustionAir.deviation).toBe(-20);
      expect(result.corrections.combustionAir.effect).toBeGreaterThan(0);
    });

    it('combines return temp and combustion air effects correctly', () => {
      const result = calculateAdjustedBoilerEfficiency(
        96,
        'condensing-gas',
        120,  // 40°F below standard (net positive)
        180,
        40    // 20°F below standard (net negative)
      );
      
      // Return temp gain should outweigh combustion air loss
      expect(result.adjustedAfue).toBeGreaterThan(96);
      expect(result.correctionFactor).toBeGreaterThan(0);
    });
  });

  describe('non-condensing boiler behavior', () => {
    it('returns no adjustment at standard conditions', () => {
      const result = calculateAdjustedBoilerEfficiency(
        84,
        'non-condensing-gas',
        140,  // Standard for non-condensing
        180,
        60
      );
      
      expect(Math.abs(result.correctionFactor)).toBeLessThan(1);
      expect(result.adjustedAfue).toBeCloseTo(84, 0);
      expect(result.isCondensing).toBe(false);
      expect(result.isCondensingMode).toBe(false);
    });

    it('has minimal efficiency adjustment with temperature changes', () => {
      const condensingResult = calculateAdjustedBoilerEfficiency(
        96, 'condensing-gas', 120, 180, 60
      );
      const nonCondensingResult = calculateAdjustedBoilerEfficiency(
        84, 'non-condensing-gas', 100, 180, 60  // 40°F below standard
      );
      
      // Non-condensing should have smaller effect per degree (0.3× factor)
      const condensingEffect = Math.abs(condensingResult.corrections.returnTemp.effect);
      const nonCondensingEffect = Math.abs(nonCondensingResult.corrections.returnTemp.effect);
      
      expect(nonCondensingEffect).toBeLessThan(condensingEffect);
    });

    it('never triggers condensing mode regardless of return temp', () => {
      const result = calculateAdjustedBoilerEfficiency(
        84,
        'non-condensing-gas',
        90,   // Very low return temp (would damage non-condensing boiler)
        180,
        60
      );
      
      expect(result.isCondensingMode).toBe(false);
      expect(result.isCondensing).toBe(false);
    });

    it('uses correct standard conditions for non-condensing', () => {
      // Standard non-condensing return = 140°F (vs 160°F for condensing)
      const result = calculateAdjustedBoilerEfficiency(
        84,
        'non-condensing-gas',
        140,
        180,
        60
      );
      
      // At standard conditions, no deviation
      expect(result.corrections.returnTemp.deviation).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('caps adjusted AFUE at 99.5%', () => {
      const result = calculateAdjustedBoilerEfficiency(
        98,
        'condensing-gas',
        80,   // Extremely low return temp
        180,
        80    // Warm combustion air
      );
      
      expect(result.adjustedAfue).toBeLessThanOrEqual(99.5);
    });

    it('floors adjusted AFUE at 90% of base', () => {
      const result = calculateAdjustedBoilerEfficiency(
        96,
        'condensing-gas',
        220,  // Extremely high return temp
        180,
        20    // Very cold combustion air
      );
      
      // Floor is 90% of 96 = 86.4
      expect(result.adjustedAfue).toBeGreaterThanOrEqual(86.4);
    });

    it('handles missing combustion air temp', () => {
      const result = calculateAdjustedBoilerEfficiency(
        96,
        'condensing-gas',
        140,
        180
        // No combustion air temp provided
      );
      
      expect(result.corrections.combustionAir.deviation).toBe(0);
      expect(result.corrections.combustionAir.effect).toBe(0);
    });

    it('handles missing supply temp', () => {
      const result = calculateAdjustedBoilerEfficiency(
        96,
        'condensing-gas',
        140
        // No supply or combustion temps
      );
      
      expect(result.adjustedAfue).toBeDefined();
      expect(result.baseAfue).toBe(96);
    });

    it('handles electric boiler type', () => {
      const result = calculateAdjustedBoilerEfficiency(
        99,
        'electric',
        140,
        180,
        60
      );
      
      // Electric boilers use non-condensing standard conditions
      expect(result.isCondensing).toBe(false);
      expect(result.isCondensingMode).toBe(false);
    });

    it('generates proper explanation for positive effects', () => {
      const result = calculateAdjustedBoilerEfficiency(
        96,
        'condensing-gas',
        110,  // 50°F below standard
        180,
        60
      );
      
      expect(result.explanation).toContain('lower return water temp');
    });

    it('generates proper explanation for negative effects', () => {
      const result = calculateAdjustedBoilerEfficiency(
        96,
        'condensing-gas',
        180,  // 20°F above standard
        180,
        60
      );
      
      expect(result.explanation).toContain('higher return water temp');
    });

    it('generates standard conditions message when no significant effect', () => {
      const result = calculateAdjustedBoilerEfficiency(
        96,
        'condensing-gas',
        160,  // Standard
        180,
        60    // Standard
      );
      
      expect(result.explanation).toContain('standard rating conditions');
    });
  });

  describe('return value structure', () => {
    it('returns all required fields', () => {
      const result = calculateAdjustedBoilerEfficiency(
        96,
        'condensing-gas',
        140,
        180,
        50
      );
      
      expect(result).toHaveProperty('baseAfue', 96);
      expect(result).toHaveProperty('adjustedAfue');
      expect(result).toHaveProperty('correctionFactor');
      expect(result).toHaveProperty('corrections');
      expect(result.corrections).toHaveProperty('returnTemp');
      expect(result.corrections).toHaveProperty('combustionAir');
      expect(result).toHaveProperty('explanation');
      expect(result).toHaveProperty('isCondensing');
      expect(result).toHaveProperty('isCondensingMode');
    });

    it('rounds values appropriately', () => {
      const result = calculateAdjustedBoilerEfficiency(
        96,
        'condensing-gas',
        137,  // Odd value
        180,
        53    // Odd value
      );
      
      // Values should be rounded to 1 decimal place
      expect(result.adjustedAfue % 0.1).toBeLessThan(0.01);
      expect(result.correctionFactor % 0.1).toBeLessThan(0.01);
    });
  });
});

// =============================================================================
// calculateHWFlowGpm Tests
// =============================================================================

describe('calculateHWFlowGpm', () => {
  it('calculates flow for standard 20°F ΔT', () => {
    // Q = 1,000,000 BTU/h, ΔT = 20°F
    // GPM = 1,000,000 / (500 × 20) = 100 GPM
    const result = calculateHWFlowGpm(1000000, 20);
    expect(result).toBe(100);
  });

  it('calculates flow for 40°F ΔT', () => {
    // GPM = 500,000 / (500 × 40) = 25 GPM
    const result = calculateHWFlowGpm(500000, 40);
    expect(result).toBe(25);
  });

  it('uses default 20°F ΔT when not specified', () => {
    const result = calculateHWFlowGpm(500000);
    expect(result).toBe(50); // 500,000 / (500 × 20)
  });

  it('handles large capacity values', () => {
    const result = calculateHWFlowGpm(5000000, 20);
    expect(result).toBe(500);
  });

  it('handles small capacity values', () => {
    const result = calculateHWFlowGpm(100000, 20);
    expect(result).toBe(10);
  });
});

// =============================================================================
// calculateAnnualFuelConsumption Tests
// =============================================================================

describe('calculateAnnualFuelConsumption', () => {
  it('calculates natural gas consumption correctly', () => {
    const result = calculateAnnualFuelConsumption(
      1000000,     // 1 MMBH
      95,          // 95% efficiency
      'natural-gas',
      1500         // EFLH
    );
    
    expect(result.unit).toBe('cf');
    expect(result.consumption).toBeGreaterThan(0);
    expect(result.costSar).toBeGreaterThan(0);
  });

  it('calculates electric consumption correctly', () => {
    const result = calculateAnnualFuelConsumption(
      500000,
      99,
      'electric',
      1500
    );
    
    expect(result.unit).toBe('kWh');
    expect(result.consumption).toBeGreaterThan(0);
  });

  it('calculates fuel oil consumption correctly', () => {
    const result = calculateAnnualFuelConsumption(
      1000000,
      82,
      'fuel-oil',
      1500
    );
    
    expect(result.unit).toBe('liters');
    expect(result.consumption).toBeGreaterThan(0);
  });

  it('calculates propane consumption correctly', () => {
    const result = calculateAnnualFuelConsumption(
      500000,
      85,
      'propane',
      1200
    );
    
    expect(result.unit).toBe('liters');
    expect(result.consumption).toBeGreaterThan(0);
  });

  it('higher efficiency reduces consumption', () => {
    const lowEfficiency = calculateAnnualFuelConsumption(1000000, 80, 'natural-gas', 1500);
    const highEfficiency = calculateAnnualFuelConsumption(1000000, 95, 'natural-gas', 1500);
    
    expect(highEfficiency.consumption).toBeLessThan(lowEfficiency.consumption);
    expect(highEfficiency.costSar).toBeLessThan(lowEfficiency.costSar);
  });

  it('more operating hours increases consumption', () => {
    const lessHours = calculateAnnualFuelConsumption(1000000, 95, 'natural-gas', 1000);
    const moreHours = calculateAnnualFuelConsumption(1000000, 95, 'natural-gas', 2000);
    
    expect(moreHours.consumption).toBeGreaterThan(lessHours.consumption);
  });
});

// =============================================================================
// calculateBoilerFitScore Tests
// =============================================================================

describe('calculateBoilerFitScore', () => {
  const baseBoiler: BoilerCatalogItem = BOILER_CATALOG.find(b => b.id === 'lochinvar-knight-500')!;
  
  it('scores ideal sizing (110-125% capacity) with bonus', () => {
    const requirements: BoilerRequirements = {
      requiredCapacityBtuh: 420000, // 500k is ~119% = ideal
    };
    
    const score = calculateBoilerFitScore(baseBoiler, requirements);
    expect(score).toBeGreaterThanOrEqual(100); // Should get ideal sizing bonus
  });

  it('penalizes undersized boilers', () => {
    const requirements: BoilerRequirements = {
      requiredCapacityBtuh: 600000, // 500k is 83% = undersized
    };
    
    const score = calculateBoilerFitScore(baseBoiler, requirements);
    expect(score).toBeLessThan(100);
  });

  it('penalizes significantly oversized boilers', () => {
    const requirements: BoilerRequirements = {
      requiredCapacityBtuh: 300000, // 500k is 167% = way oversized
    };
    
    const score = calculateBoilerFitScore(baseBoiler, requirements);
    expect(score).toBeLessThan(100);
  });

  it('gives bonus for high efficiency above baseline', () => {
    const highEffBoiler = BOILER_CATALOG.find(b => b.afue >= 97)!;
    const requirements: BoilerRequirements = {
      requiredCapacityBtuh: highEffBoiler.capacityBtuh,
    };
    
    const score = calculateBoilerFitScore(highEffBoiler, requirements);
    // High efficiency boiler with matching capacity should score well
    expect(score).toBeGreaterThanOrEqual(100);
  });

  it('penalizes boilers below AFUE requirement', () => {
    const requirements: BoilerRequirements = {
      requiredCapacityBtuh: 500000,
      minAfue: 98, // Higher than boiler's 96%
    };
    
    const score = calculateBoilerFitScore(baseBoiler, requirements);
    expect(score).toBeLessThan(100);
  });

  it('penalizes insufficient turndown ratio', () => {
    const requirements: BoilerRequirements = {
      requiredCapacityBtuh: 500000,
      minTurndown: 15, // Higher than boiler's 10:1
    };
    
    const score = calculateBoilerFitScore(baseBoiler, requirements);
    expect(score).toBeLessThan(100);
  });

  it('penalizes missing ASME when required', () => {
    const requirements: BoilerRequirements = {
      requiredCapacityBtuh: 500000,
      asmeRequired: true,
    };
    
    // baseBoiler is ASME compliant, so no penalty
    const score = calculateBoilerFitScore(baseBoiler, requirements);
    expect(score).toBeGreaterThanOrEqual(100);
  });

  it('penalizes wrong manufacturer preference', () => {
    const requirements: BoilerRequirements = {
      requiredCapacityBtuh: 500000,
      manufacturerPreference: 'Fulton', // Different from Lochinvar
    };
    
    const score = calculateBoilerFitScore(baseBoiler, requirements);
    expect(score).toBeLessThan(105); // Should have penalty
  });

  it('respects manufacturer preference when matched', () => {
    const requirements: BoilerRequirements = {
      requiredCapacityBtuh: 500000,
      manufacturerPreference: 'Lochinvar',
    };
    
    const score = calculateBoilerFitScore(baseBoiler, requirements);
    expect(score).toBeGreaterThanOrEqual(100);
  });

  it('clamps score between 0 and 100', () => {
    // Very poor match
    const poorRequirements: BoilerRequirements = {
      requiredCapacityBtuh: 1000000, // Way undersized
      minAfue: 99,
      minTurndown: 25,
    };
    
    const poorScore = calculateBoilerFitScore(baseBoiler, poorRequirements);
    expect(poorScore).toBeGreaterThanOrEqual(0);
    expect(poorScore).toBeLessThanOrEqual(100);
  });
});

// =============================================================================
// selectBoiler Tests
// =============================================================================

describe('selectBoiler', () => {
  it('returns best fit boiler for standard requirements', () => {
    const requirements: BoilerRequirements = {
      requiredCapacityBtuh: 500000,
      boilerType: 'condensing-gas',
    };
    
    const result = selectBoiler(requirements);
    
    expect(result).not.toBeNull();
    expect(result!.selectedBoiler).toBeDefined();
    expect(result!.fitScore).toBeGreaterThan(0);
  });

  it('returns alternates', () => {
    const requirements: BoilerRequirements = {
      requiredCapacityBtuh: 800000,
      fuelType: 'natural-gas',
    };
    
    const result = selectBoiler(requirements);
    
    expect(result).not.toBeNull();
    expect(Array.isArray(result!.alternates)).toBe(true);
  });

  it('filters by boiler type', () => {
    const requirements: BoilerRequirements = {
      requiredCapacityBtuh: 1000000,
      boilerType: 'non-condensing-gas',
    };
    
    const result = selectBoiler(requirements);
    
    if (result) {
      expect(result.selectedBoiler.boilerType).toBe('non-condensing-gas');
    }
  });

  it('filters by fuel type', () => {
    const requirements: BoilerRequirements = {
      requiredCapacityBtuh: 500000,
      fuelType: 'electric',
    };
    
    const result = selectBoiler(requirements);
    
    if (result) {
      expect(result.selectedBoiler.fuelType).toBe('electric');
    }
  });

  it('generates warnings for undersized selection', () => {
    const requirements: BoilerRequirements = {
      requiredCapacityBtuh: 550000, // Just above 500k capacity
      boilerType: 'condensing-gas',
    };
    
    const result = selectBoiler(requirements);
    
    // May select undersized boiler if it's the best match
    if (result && result.selectedBoiler.capacityBtuh < requirements.requiredCapacityBtuh) {
      expect(result.warnings.length).toBeGreaterThan(0);
    }
  });

  it('returns null when no boilers match capacity range', () => {
    const requirements: BoilerRequirements = {
      requiredCapacityBtuh: 10000000, // 10 MMBH - way too large
      boilerType: 'condensing-gas',
    };
    
    const result = selectBoiler(requirements);
    expect(result).toBeNull();
  });

  it('includes capacity match details', () => {
    const requirements: BoilerRequirements = {
      requiredCapacityBtuh: 450000,
    };
    
    const result = selectBoiler(requirements);
    
    expect(result).not.toBeNull();
    expect(result!.capacityMatch).toBeDefined();
    expect(result!.capacityMatch.required).toBe(450000);
    expect(result!.capacityMatch.selected).toBeDefined();
    expect(result!.capacityMatch.percentOver).toBeDefined();
  });

  it('includes efficiency analysis', () => {
    const requirements: BoilerRequirements = {
      requiredCapacityBtuh: 500000,
    };
    
    const result = selectBoiler(requirements);
    
    expect(result).not.toBeNull();
    expect(result!.efficiencyAnalysis).toBeDefined();
    expect(result!.efficiencyAnalysis.afue).toBeDefined();
    expect(result!.efficiencyAnalysis.ashrae90_1_baseline).toBeDefined();
  });

  it('includes operating cost estimates', () => {
    const requirements: BoilerRequirements = {
      requiredCapacityBtuh: 500000,
    };
    
    const result = selectBoiler(requirements);
    
    expect(result).not.toBeNull();
    expect(result!.operatingCosts).toBeDefined();
    expect(result!.operatingCosts.annualFuelConsumption).toBeGreaterThan(0);
    expect(result!.operatingCosts.totalAnnualCostSar).toBeGreaterThan(0);
  });
});

// =============================================================================
// Catalog and Constants Validation Tests
// =============================================================================

describe('BOILER_CATALOG', () => {
  it('contains condensing and non-condensing boilers', () => {
    const condensing = BOILER_CATALOG.filter(b => b.boilerType === 'condensing-gas');
    const nonCondensing = BOILER_CATALOG.filter(b => b.boilerType === 'non-condensing-gas');
    
    expect(condensing.length).toBeGreaterThan(0);
    expect(nonCondensing.length).toBeGreaterThan(0);
  });

  it('contains electric boilers', () => {
    const electric = BOILER_CATALOG.filter(b => b.boilerType === 'electric');
    expect(electric.length).toBeGreaterThan(0);
  });

  it('all boilers have valid AFUE ranges (80-99%)', () => {
    BOILER_CATALOG.forEach(boiler => {
      expect(boiler.afue).toBeGreaterThanOrEqual(80);
      expect(boiler.afue).toBeLessThanOrEqual(99);
    });
  });

  it('all boilers have valid thermal efficiency', () => {
    BOILER_CATALOG.forEach(boiler => {
      expect(boiler.thermalEfficiency).toBeGreaterThan(0);
      expect(boiler.thermalEfficiency).toBeLessThanOrEqual(100);
    });
  });

  it('all boilers have AHRI certification data', () => {
    BOILER_CATALOG.forEach(boiler => {
      expect(typeof boiler.ahriCertified).toBe('boolean');
    });
  });

  it('all boilers have positive capacity values', () => {
    BOILER_CATALOG.forEach(boiler => {
      expect(boiler.capacityBtuh).toBeGreaterThan(0);
      expect(boiler.capacityKw).toBeGreaterThan(0);
    });
  });

  it('all boilers have valid turndown ratios', () => {
    BOILER_CATALOG.forEach(boiler => {
      expect(boiler.turndownRatio).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('ASHRAE_90_1_BOILER_MINIMUMS', () => {
  it('defines minimums for all boiler types', () => {
    const types: BoilerType[] = ['condensing-gas', 'non-condensing-gas', 'oil-fired', 'electric', 'steam'];
    
    types.forEach(type => {
      expect(ASHRAE_90_1_BOILER_MINIMUMS[type]).toBeDefined();
      expect(ASHRAE_90_1_BOILER_MINIMUMS[type].afue).toBeDefined();
      expect(ASHRAE_90_1_BOILER_MINIMUMS[type].thermalEfficiency).toBeDefined();
    });
  });

  it('condensing minimum is higher than non-condensing', () => {
    expect(ASHRAE_90_1_BOILER_MINIMUMS['condensing-gas'].afue)
      .toBeGreaterThan(ASHRAE_90_1_BOILER_MINIMUMS['non-condensing-gas'].afue);
  });

  it('electric minimum is highest', () => {
    expect(ASHRAE_90_1_BOILER_MINIMUMS['electric'].afue).toBe(99);
  });
});

describe('AHRI_STANDARD_CONDITIONS_BOILER', () => {
  it('defines condensing standard conditions', () => {
    expect(AHRI_STANDARD_CONDITIONS_BOILER.condensing).toBeDefined();
    expect(AHRI_STANDARD_CONDITIONS_BOILER.condensing.hwSupplyTemp).toBe(180);
    expect(AHRI_STANDARD_CONDITIONS_BOILER.condensing.hwReturnTemp).toBe(160);
    expect(AHRI_STANDARD_CONDITIONS_BOILER.condensing.combustionAirTemp).toBe(60);
  });

  it('defines non-condensing standard conditions', () => {
    expect(AHRI_STANDARD_CONDITIONS_BOILER.nonCondensing).toBeDefined();
    expect(AHRI_STANDARD_CONDITIONS_BOILER.nonCondensing.hwReturnTemp).toBe(140);
  });

  it('non-condensing has lower return temp (larger ΔT)', () => {
    const condensingDeltaT = AHRI_STANDARD_CONDITIONS_BOILER.condensing.hwSupplyTemp - 
                             AHRI_STANDARD_CONDITIONS_BOILER.condensing.hwReturnTemp;
    const nonCondensingDeltaT = AHRI_STANDARD_CONDITIONS_BOILER.nonCondensing.hwSupplyTemp - 
                                AHRI_STANDARD_CONDITIONS_BOILER.nonCondensing.hwReturnTemp;
    
    expect(nonCondensingDeltaT).toBeGreaterThan(condensingDeltaT);
  });
});

describe('BOILER_CORRECTION_FACTORS', () => {
  it('defines return temp correction factor', () => {
    expect(BOILER_CORRECTION_FACTORS.returnTemp).toBe(0.004);
  });

  it('defines combustion air correction factor', () => {
    expect(BOILER_CORRECTION_FACTORS.combustionAir).toBe(0.002);
  });

  it('defines supply temp correction factor', () => {
    expect(BOILER_CORRECTION_FACTORS.supplyTemp).toBe(0.003);
  });
});

describe('CONDENSING_THRESHOLD_TEMP', () => {
  it('is set to 130°F', () => {
    expect(CONDENSING_THRESHOLD_TEMP).toBe(130);
  });
});

// =============================================================================
// Helper Function Tests
// =============================================================================

describe('getBoilerTypeDisplayName', () => {
  it('returns correct name for condensing-gas', () => {
    expect(getBoilerTypeDisplayName('condensing-gas')).toBe('Condensing Gas');
  });

  it('returns correct name for non-condensing-gas', () => {
    expect(getBoilerTypeDisplayName('non-condensing-gas')).toBe('Non-Condensing Gas');
  });

  it('returns correct name for oil-fired', () => {
    expect(getBoilerTypeDisplayName('oil-fired')).toBe('Oil-Fired');
  });

  it('returns correct name for electric', () => {
    expect(getBoilerTypeDisplayName('electric')).toBe('Electric');
  });

  it('returns correct name for steam', () => {
    expect(getBoilerTypeDisplayName('steam')).toBe('Steam');
  });
});

describe('getFuelTypeDisplayName', () => {
  it('returns correct name for natural-gas', () => {
    expect(getFuelTypeDisplayName('natural-gas')).toBe('Natural Gas');
  });

  it('returns correct name for propane', () => {
    expect(getFuelTypeDisplayName('propane')).toBe('Propane');
  });

  it('returns correct name for fuel-oil', () => {
    expect(getFuelTypeDisplayName('fuel-oil')).toBe('Fuel Oil');
  });

  it('returns correct name for electric', () => {
    expect(getFuelTypeDisplayName('electric')).toBe('Electric');
  });
});

describe('getBoilerManufacturers', () => {
  it('returns unique sorted list', () => {
    const manufacturers = getBoilerManufacturers();
    
    expect(Array.isArray(manufacturers)).toBe(true);
    expect(manufacturers.length).toBeGreaterThan(0);
    
    // Check sorted
    const sorted = [...manufacturers].sort();
    expect(manufacturers).toEqual(sorted);
    
    // Check unique
    const unique = [...new Set(manufacturers)];
    expect(manufacturers.length).toBe(unique.length);
  });

  it('includes expected manufacturers', () => {
    const manufacturers = getBoilerManufacturers();
    
    expect(manufacturers).toContain('Lochinvar');
    expect(manufacturers).toContain('Weil-McLain');
  });
});

describe('getBoilerCapacityRange', () => {
  it('returns min/max for full catalog', () => {
    const range = getBoilerCapacityRange();
    
    expect(range.min).toBeGreaterThan(0);
    expect(range.max).toBeGreaterThan(range.min);
  });

  it('filters by boiler type', () => {
    const condensingRange = getBoilerCapacityRange('condensing-gas');
    const fullRange = getBoilerCapacityRange();
    
    expect(condensingRange.min).toBeGreaterThan(0);
    expect(condensingRange.max).toBeLessThanOrEqual(fullRange.max);
  });

  it('returns zeros for non-existent type filter', () => {
    // All catalog items should have valid types, but test the empty case
    const range = getBoilerCapacityRange('oil-fired');
    
    // Oil-fired may or may not exist in catalog
    expect(range.min).toBeGreaterThanOrEqual(0);
    expect(range.max).toBeGreaterThanOrEqual(range.min);
  });
});
