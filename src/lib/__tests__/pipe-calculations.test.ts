/**
 * Unit tests for Pipe Sizing Calculations Library
 * Validates ASHRAE Fundamentals and Crane Technical Paper 410 based calculations
 */

import { describe, it, expect } from 'vitest';
import {
  getFluidProperties,
  getPipeID,
  getAvailableSizes,
  calculateVelocity,
  calculateReynoldsNumber,
  calculateFrictionFactor,
  calculateFrictionLoss,
  calculateFrictionLossPer100ft,
  calculateFittingLoss,
  sizePipeByVelocity,
  sizePipeByFriction,
  calculateSegmentHydraulics,
  calculatePumpPower,
  calculateFlowFromLoad,
  getVelocityStatus,
  formatNominalSize,
  PIPE_DATA,
  type PipeMaterial,
} from '../pipe-calculations';
import { expectWithinPercent } from './test-utils';

// =============================================================================
// Fluid Properties Tests
// =============================================================================

describe('getFluidProperties', () => {
  describe('water properties', () => {
    it('returns correct density at 60°F', () => {
      const props = getFluidProperties(60, 0);
      expectWithinPercent(props.density, 62.34, 1);
    });

    it('density decreases with temperature', () => {
      const cold = getFluidProperties(40, 0);
      const hot = getFluidProperties(180, 0);
      expect(hot.density).toBeLessThan(cold.density);
    });

    it('viscosity decreases with temperature', () => {
      const cold = getFluidProperties(40, 0);
      const hot = getFluidProperties(180, 0);
      expect(hot.viscosity).toBeLessThan(cold.viscosity);
    });

    it('interpolates between table values', () => {
      const props = getFluidProperties(65, 0); // Between 60 and 70
      const props60 = getFluidProperties(60, 0);
      const props70 = getFluidProperties(70, 0);
      
      expect(props.density).toBeLessThan(props60.density);
      expect(props.density).toBeGreaterThan(props70.density);
    });
  });

  describe('glycol correction', () => {
    it('increases density with glycol', () => {
      const water = getFluidProperties(60, 0);
      const glycol30 = getFluidProperties(60, 30);
      
      expect(glycol30.density).toBeGreaterThan(water.density);
    });

    it('increases viscosity with glycol', () => {
      const water = getFluidProperties(60, 0);
      const glycol30 = getFluidProperties(60, 30);
      
      expect(glycol30.viscosity).toBeGreaterThan(water.viscosity);
    });

    it('reduces specific heat with glycol', () => {
      const water = getFluidProperties(60, 0);
      const glycol50 = getFluidProperties(60, 50);
      
      expect(glycol50.specificHeat).toBeLessThan(water.specificHeat);
    });
  });
});

// =============================================================================
// Pipe Data Tests
// =============================================================================

describe('Pipe Data Functions', () => {
  describe('getPipeID', () => {
    it('returns correct ID for steel schedule 40', () => {
      expect(getPipeID('steel_schedule_40', 2.0)).toBe(2.067);
      expect(getPipeID('steel_schedule_40', 4.0)).toBe(4.026);
    });

    it('returns correct ID for copper type L', () => {
      expect(getPipeID('copper_type_l', 1.0)).toBe(1.025);
      expect(getPipeID('copper_type_l', 2.0)).toBe(1.985);
    });

    it('returns null for invalid size', () => {
      expect(getPipeID('steel_schedule_40', 99)).toBeNull();
    });

    it('returns null for invalid material', () => {
      expect(getPipeID('invalid_material' as PipeMaterial, 2.0)).toBeNull();
    });
  });

  describe('getAvailableSizes', () => {
    it('returns all sizes for steel schedule 40', () => {
      const sizes = getAvailableSizes('steel_schedule_40');
      expect(sizes.length).toBeGreaterThan(10);
      expect(sizes).toContain(0.5);
      expect(sizes).toContain(2.0);
      expect(sizes).toContain(6.0);
    });

    it('returns fewer sizes for copper', () => {
      const steel = getAvailableSizes('steel_schedule_40');
      const copper = getAvailableSizes('copper_type_l');
      expect(copper.length).toBeLessThan(steel.length);
    });

    it('returns empty array for invalid material', () => {
      expect(getAvailableSizes('invalid' as PipeMaterial)).toEqual([]);
    });
  });

  describe('PIPE_DATA', () => {
    it('has correct roughness values', () => {
      expect(PIPE_DATA.steel_schedule_40.roughness).toBe(0.00015);
      expect(PIPE_DATA.copper_type_l.roughness).toBe(0.000005);
    });

    it('copper is smoother than steel', () => {
      expect(PIPE_DATA.copper_type_l.roughness).toBeLessThan(
        PIPE_DATA.steel_schedule_40.roughness
      );
    });
  });
});

// =============================================================================
// Velocity Calculations Tests
// =============================================================================

describe('Velocity Calculations', () => {
  describe('calculateVelocity', () => {
    it('calculates velocity correctly', () => {
      // V = (0.4085 × Q) / d²
      // 100 GPM in 2" pipe: V = (0.4085 × 100) / 2² = 10.2 fps
      const result = calculateVelocity(100, 2.0);
      expectWithinPercent(result, 10.2, 1);
    });

    it('velocity increases with flow', () => {
      const low = calculateVelocity(50, 2.0);
      const high = calculateVelocity(100, 2.0);
      expect(high).toBeGreaterThan(low);
    });

    it('velocity decreases with larger pipe', () => {
      const small = calculateVelocity(100, 2.0);
      const large = calculateVelocity(100, 4.0);
      expect(large).toBeLessThan(small);
    });
  });

  describe('getVelocityStatus', () => {
    it('returns "Low" for velocity < 2 fps', () => {
      const result = getVelocityStatus(1.5);
      expect(result.label).toBe('Low');
    });

    it('returns "Good" for velocity 2-4 fps', () => {
      const result = getVelocityStatus(3.0);
      expect(result.label).toBe('Good');
    });

    it('returns "Normal" for velocity 4-8 fps', () => {
      const result = getVelocityStatus(6.0);
      expect(result.label).toBe('Normal');
    });

    it('returns "High" for velocity 8-10 fps', () => {
      const result = getVelocityStatus(9.0);
      expect(result.label).toBe('High');
    });

    it('returns "Too High" for velocity > 10 fps', () => {
      const result = getVelocityStatus(12.0);
      expect(result.label).toBe('Too High');
    });
  });
});

// =============================================================================
// Friction Factor Tests
// =============================================================================

describe('Friction Factor Calculations', () => {
  describe('calculateReynoldsNumber', () => {
    it('calculates Reynolds for typical conditions', () => {
      const props = getFluidProperties(60, 0);
      const result = calculateReynoldsNumber(5, 2.0, props);
      
      // Should be in turbulent range for HVAC applications
      expect(result).toBeGreaterThan(2300);
    });

    it('higher velocity gives higher Reynolds', () => {
      const props = getFluidProperties(60, 0);
      const low = calculateReynoldsNumber(3, 2.0, props);
      const high = calculateReynoldsNumber(6, 2.0, props);
      expect(high).toBeGreaterThan(low);
    });

    it('larger pipe gives higher Reynolds', () => {
      const props = getFluidProperties(60, 0);
      const small = calculateReynoldsNumber(5, 1.0, props);
      const large = calculateReynoldsNumber(5, 4.0, props);
      expect(large).toBeGreaterThan(small);
    });
  });

  describe('calculateFrictionFactor', () => {
    it('returns laminar friction factor for low Re', () => {
      const result = calculateFrictionFactor(2000, 0.00015, 2.0);
      // f = 64/Re for laminar
      expect(result).toBeCloseTo(0.032, 3);
    });

    it('returns reasonable turbulent friction factor', () => {
      const result = calculateFrictionFactor(100000, 0.00015, 2.0);
      // Should be in range 0.015-0.025 for turbulent flow
      expect(result).toBeGreaterThan(0.015);
      expect(result).toBeLessThan(0.030);
    });

    it('rougher pipe has higher friction', () => {
      const smooth = calculateFrictionFactor(100000, 0.000005, 2.0);
      const rough = calculateFrictionFactor(100000, 0.00015, 2.0);
      expect(rough).toBeGreaterThan(smooth);
    });
  });
});

// =============================================================================
// Friction Loss Tests
// =============================================================================

describe('Friction Loss Calculations', () => {
  describe('calculateFrictionLoss', () => {
    it('calculates loss for given length', () => {
      const result = calculateFrictionLoss(100, 2.0, 5, 0.02);
      // h_f = f × (L/D) × (V²/2g)
      expect(result).toBeGreaterThan(0);
    });

    it('loss increases with length', () => {
      const short = calculateFrictionLoss(50, 2.0, 5, 0.02);
      const long = calculateFrictionLoss(200, 2.0, 5, 0.02);
      expectWithinPercent(long / short, 4, 1);
    });

    it('loss increases with velocity squared', () => {
      const slow = calculateFrictionLoss(100, 2.0, 3, 0.02);
      const fast = calculateFrictionLoss(100, 2.0, 6, 0.02);
      expectWithinPercent(fast / slow, 4, 5);
    });
  });

  describe('calculateFrictionLossPer100ft', () => {
    it('returns typical range for HVAC applications', () => {
      const result = calculateFrictionLossPer100ft(2.0, 5, 0.02);
      // Typically 1-4 ft/100ft for hydronic systems
      expect(result).toBeGreaterThan(0.5);
      expect(result).toBeLessThan(10);
    });
  });

  describe('calculateFittingLoss', () => {
    it('calculates loss for fitting K-factor', () => {
      const result = calculateFittingLoss(0.5, 5); // K=0.5, V=5 fps
      // h = K × V²/2g = 0.5 × 25 / 64.35 = 0.19 ft
      expectWithinPercent(result, 0.19, 5);
    });

    it('returns 0 for zero K-factor', () => {
      expect(calculateFittingLoss(0, 5)).toBe(0);
    });
  });
});

// =============================================================================
// Pipe Sizing Tests
// =============================================================================

describe('Pipe Sizing', () => {
  describe('sizePipeByVelocity', () => {
    it('returns appropriate pipe size for flow', () => {
      const result = sizePipeByVelocity(100, 'steel_schedule_40', 6);
      
      expect(result).not.toBeNull();
      expect(result!.nominalSize).toBeGreaterThan(0);
      expect(result!.actualVelocity).toBeLessThanOrEqual(6);
    });

    it('returns larger pipe for lower target velocity', () => {
      const slowFlow = sizePipeByVelocity(100, 'steel_schedule_40', 4);
      const fastFlow = sizePipeByVelocity(100, 'steel_schedule_40', 8);
      
      expect(slowFlow!.nominalSize).toBeGreaterThan(fastFlow!.nominalSize);
    });

    it('returns velocity at or below target', () => {
      const result = sizePipeByVelocity(200, 'steel_schedule_40', 6);
      expect(result!.actualVelocity).toBeLessThanOrEqual(6);
    });
  });

  describe('sizePipeByFriction', () => {
    it('returns pipe size for target friction', () => {
      const props = getFluidProperties(60, 0);
      const result = sizePipeByFriction(100, 'steel_schedule_40', props, 4);
      
      expect(result).not.toBeNull();
      expect(result!.actualFriction).toBeLessThanOrEqual(4);
    });

    it('returns larger pipe for lower friction limit', () => {
      const props = getFluidProperties(60, 0);
      const lowFriction = sizePipeByFriction(100, 'steel_schedule_40', props, 2);
      const highFriction = sizePipeByFriction(100, 'steel_schedule_40', props, 6);
      
      expect(lowFriction!.nominalSize).toBeGreaterThanOrEqual(highFriction!.nominalSize);
    });
  });
});

// =============================================================================
// Segment Hydraulics Tests
// =============================================================================

describe('calculateSegmentHydraulics', () => {
  it('calculates complete hydraulics for segment', () => {
    const props = getFluidProperties(60, 0);
    const result = calculateSegmentHydraulics(
      100,          // GPM
      100,          // ft length
      2.067,        // 2" pipe ID
      'steel_schedule_40',
      props,
      1.5,          // fittings K-total
      5             // elevation change
    );

    expect(result.velocity).toBeGreaterThan(0);
    expect(result.reynoldsNumber).toBeGreaterThan(2300);
    expect(result.frictionLossFt).toBeGreaterThan(0);
    expect(result.fittingsLossFt).toBeGreaterThan(0);
    expect(result.elevationHeadFt).toBe(5);
    expect(result.totalHeadLossFt).toBe(
      result.frictionLossFt + result.fittingsLossFt + result.elevationHeadFt
    );
  });

  it('handles zero fittings', () => {
    const props = getFluidProperties(60, 0);
    const result = calculateSegmentHydraulics(
      100, 100, 2.067, 'steel_schedule_40', props, 0, 0
    );

    expect(result.fittingsLossFt).toBe(0);
    expect(result.totalHeadLossFt).toBe(result.frictionLossFt);
  });
});

// =============================================================================
// Pump Power Tests
// =============================================================================

describe('calculatePumpPower', () => {
  it('calculates power for typical pump', () => {
    const result = calculatePumpPower(100, 50, 1.0, 0.70);
    
    // BHP = (100 × 50 × 1.0) / (3960 × 0.70) = 1.80 HP
    expectWithinPercent(result.brakeHP, 1.80, 5);
    expect(result.hydraulicHP).toBeLessThan(result.brakeHP);
    expect(result.motorHP).toBeGreaterThanOrEqual(result.brakeHP);
  });

  it('rounds up to standard motor size', () => {
    const result = calculatePumpPower(100, 50, 1.0, 0.70);
    
    // Standard sizes: 0.5, 0.75, 1, 1.5, 2, 3, 5...
    const standardSizes = [0.5, 0.75, 1, 1.5, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50];
    expect(standardSizes).toContain(result.motorHP);
  });

  it('higher flow requires more power', () => {
    const low = calculatePumpPower(50, 50, 1.0, 0.70);
    const high = calculatePumpPower(200, 50, 1.0, 0.70);
    expect(high.brakeHP).toBeGreaterThan(low.brakeHP);
  });

  it('higher head requires more power', () => {
    const low = calculatePumpPower(100, 30, 1.0, 0.70);
    const high = calculatePumpPower(100, 80, 1.0, 0.70);
    expect(high.brakeHP).toBeGreaterThan(low.brakeHP);
  });

  it('higher efficiency reduces brake HP', () => {
    const lowEff = calculatePumpPower(100, 50, 1.0, 0.60);
    const highEff = calculatePumpPower(100, 50, 1.0, 0.80);
    expect(highEff.brakeHP).toBeLessThan(lowEff.brakeHP);
  });
});

// =============================================================================
// Flow From Load Tests
// =============================================================================

describe('calculateFlowFromLoad', () => {
  it('calculates flow for standard ΔT', () => {
    // 500,000 BTU/h, 10°F ΔT
    // GPM = 500000 / (500 × 10) = 100 GPM
    const result = calculateFlowFromLoad(500000, 10);
    expect(result).toBe(100);
  });

  it('smaller ΔT requires more flow', () => {
    const smallDeltaT = calculateFlowFromLoad(500000, 10);
    const largeDeltaT = calculateFlowFromLoad(500000, 20);
    expect(smallDeltaT).toBeGreaterThan(largeDeltaT);
  });

  it('uses standard 10°F ΔT for CHW', () => {
    const result = calculateFlowFromLoad(1200000, 10);
    expect(result).toBe(240); // 1.2 MMBH / 5000 = 240 GPM
  });
});

// =============================================================================
// Utility Function Tests
// =============================================================================

describe('Utility Functions', () => {
  describe('formatNominalSize', () => {
    it('formats fractional sizes correctly', () => {
      expect(formatNominalSize(0.5)).toBe('2/4"');
      expect(formatNominalSize(0.75)).toBe('3/4"');
    });

    it('formats whole sizes correctly', () => {
      expect(formatNominalSize(1)).toBe('1"');
      expect(formatNominalSize(2)).toBe('2"');
      expect(formatNominalSize(6)).toBe('6"');
    });
  });
});
