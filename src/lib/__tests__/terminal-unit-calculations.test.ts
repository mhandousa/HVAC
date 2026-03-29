/**
 * Unit tests for Terminal Unit Calculations Library
 * Validates VAV box and FCU sizing calculations
 */

import { describe, it, expect } from 'vitest';
import {
  calculateVAVInletSize,
  calculateVAVMinCfm,
  calculateReheatCapacity,
  calculateHWFlow,
  calculateInletVelocity,
  estimateVAVNoise,
  sizeVAVBox,
  calculateFCUCoilCapacity,
  calculateFCUWaterFlow,
  estimateFCUNoise,
  determineCoilConfig,
  sizeFCU,
  getUnitTypeConfig,
  isVAVType,
  isFCUType,
  generateUnitTag,
  VAV_STANDARD_SIZES,
  FCU_STANDARD_SIZES,
  SAUDI_NC_STANDARDS,
  TERMINAL_UNIT_TYPES,
  type VAVSizingInput,
  type FCUSizingInput,
} from '../terminal-unit-calculations';
import { expectWithinPercent } from './test-utils';

// =============================================================================
// VAV Box Sizing Tests
// =============================================================================

describe('VAV Box Calculations', () => {
  describe('calculateVAVInletSize', () => {
    it('selects 6" for 250 CFM', () => {
      const result = calculateVAVInletSize(250);
      expect(result).toBe(6);
    });

    it('selects 8" for 500 CFM', () => {
      const result = calculateVAVInletSize(500);
      expect(result).toBe(8);
    });

    it('selects 10" for 800 CFM', () => {
      const result = calculateVAVInletSize(800);
      expect(result).toBe(10);
    });

    it('selects 12" for 1200 CFM', () => {
      const result = calculateVAVInletSize(1200);
      expect(result).toBe(12);
    });

    it('returns largest size for very high CFM', () => {
      const result = calculateVAVInletSize(5000);
      expect(result).toBe(16);
    });

    it('selects smallest size for very low CFM', () => {
      const result = calculateVAVInletSize(50);
      expect(result).toBe(4);
    });
  });

  describe('calculateVAVMinCfm', () => {
    it('uses 30% ratio by default', () => {
      const result = calculateVAVMinCfm(1000, 0, 0.3);
      expect(result).toBe(300);
    });

    it('uses ventilation CFM when greater than ratio', () => {
      const result = calculateVAVMinCfm(1000, 400, 0.3);
      expect(result).toBe(400); // Ventilation > 30% of max
    });

    it('uses ratio when greater than ventilation', () => {
      const result = calculateVAVMinCfm(1000, 200, 0.3);
      expect(result).toBe(300); // 30% > 200 CFM ventilation
    });

    it('handles custom ratio', () => {
      const result = calculateVAVMinCfm(1000, 0, 0.4);
      expect(result).toBe(400);
    });
  });

  describe('calculateReheatCapacity', () => {
    it('calculates reheat for standard conditions', () => {
      // Q = 1.08 × CFM × ΔT
      // 300 CFM, 55°F supply, 72°F room = 1.08 × 300 × 17 = 5,508 BTU/h
      const result = calculateReheatCapacity(300, 55, 72);
      expectWithinPercent(result, 5508, 1);
    });

    it('uses default temperatures when not specified', () => {
      const result = calculateReheatCapacity(300);
      // Default: 55°F supply, 72°F room
      expectWithinPercent(result, 5508, 1);
    });

    it('higher CFM requires more reheat', () => {
      const low = calculateReheatCapacity(200, 55, 72);
      const high = calculateReheatCapacity(400, 55, 72);
      expect(high).toBeGreaterThan(low);
    });

    it('larger ΔT requires more reheat', () => {
      const small = calculateReheatCapacity(300, 60, 72); // 12°F ΔT
      const large = calculateReheatCapacity(300, 50, 72); // 22°F ΔT
      expect(large).toBeGreaterThan(small);
    });
  });

  describe('calculateHWFlow', () => {
    it('calculates flow for standard conditions', () => {
      // GPM = Q / (500 × ΔT)
      // 10,000 BTU/h, 140-120°F = 10,000 / (500 × 20) = 1.0 GPM
      const result = calculateHWFlow(10000, 140, 120);
      expect(result).toBe(1);
    });

    it('uses default temperatures when not specified', () => {
      const result = calculateHWFlow(10000);
      expect(result).toBe(1); // Default 140-120°F ΔT = 20°F
    });

    it('returns 0 for zero or negative ΔT', () => {
      expect(calculateHWFlow(10000, 140, 140)).toBe(0);
      expect(calculateHWFlow(10000, 120, 140)).toBe(0);
    });
  });

  describe('calculateInletVelocity', () => {
    it('calculates velocity for given CFM and inlet', () => {
      // Area = π × (8/24)² = 0.349 ft²
      // Velocity = 500 / 0.349 = 1,432 FPM
      const result = calculateInletVelocity(500, 8);
      expectWithinPercent(result, 1432, 5);
    });

    it('higher CFM gives higher velocity', () => {
      const low = calculateInletVelocity(300, 8);
      const high = calculateInletVelocity(600, 8);
      expect(high).toBeGreaterThan(low);
    });

    it('larger inlet gives lower velocity', () => {
      const small = calculateInletVelocity(500, 6);
      const large = calculateInletVelocity(500, 10);
      expect(large).toBeLessThan(small);
    });
  });

  describe('estimateVAVNoise', () => {
    it('estimates NC for typical velocity', () => {
      // NC ≈ 15 + (velocity / 100)
      const result = estimateVAVNoise(1500);
      expect(result).toBe(30);
    });

    it('higher velocity gives higher NC', () => {
      const low = estimateVAVNoise(1000);
      const high = estimateVAVNoise(2500);
      expect(high).toBeGreaterThan(low);
    });
  });

  describe('sizeVAVBox', () => {
    it('returns complete sizing result', () => {
      const input: VAVSizingInput = {
        maxCfm: 500,
        minCfmRatio: 0.3,
        ventilationCfm: 100,
        hasReheat: true,
      };

      const result = sizeVAVBox(input);

      expect(result.inletSizeIn).toBe(8);
      expect(result.maxCfm).toBe(500);
      expect(result.minCfm).toBe(150); // 30% of 500 > 100 ventilation
      expect(result.inletVelocityFpm).toBeGreaterThan(0);
      expect(result.estimatedNC).toBeGreaterThan(0);
      expect(result.reheatCapacityBtuh).toBeGreaterThan(0);
      expect(result.hwFlowGpm).toBeGreaterThan(0);
      expect(result.isWithinCapacity).toBe(true);
    });

    it('no reheat when not specified', () => {
      const input: VAVSizingInput = {
        maxCfm: 500,
        hasReheat: false,
      };

      const result = sizeVAVBox(input);

      expect(result.reheatCapacityBtuh).toBe(0);
      expect(result.hwFlowGpm).toBe(0);
    });

    it('flags high velocity', () => {
      const input: VAVSizingInput = {
        maxCfm: 2800, // Max for 16" box
      };

      const result = sizeVAVBox(input);

      // 2800 CFM in 16" box should be at upper limit
      expect(['warning', 'high']).toContain(result.velocityStatus);
    });

    it('marks within capacity correctly', () => {
      const withinCapacity = sizeVAVBox({ maxCfm: 500 });
      const overCapacity = sizeVAVBox({ maxCfm: 3000 }); // Exceeds 16" max

      expect(withinCapacity.isWithinCapacity).toBe(true);
      expect(overCapacity.isWithinCapacity).toBe(false);
    });
  });
});

// =============================================================================
// FCU Sizing Tests
// =============================================================================

describe('FCU Calculations', () => {
  describe('calculateFCUCoilCapacity', () => {
    it('calculates sensible capacity', () => {
      // Q = 1.08 × CFM × ΔT
      // 400 CFM, 75°F entering, 55°F leaving = 1.08 × 400 × 20 = 8,640 BTU/h
      const result = calculateFCUCoilCapacity(400, 75, 55);
      expectWithinPercent(result, 8640, 1);
    });

    it('handles heating mode', () => {
      const result = calculateFCUCoilCapacity(400, 55, 100);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('calculateFCUWaterFlow', () => {
    it('calculates CHW flow for cooling', () => {
      // GPM = Q / (500 × ΔT)
      // 12,000 BTU/h, 44-54°F = 12,000 / (500 × 10) = 2.4 GPM
      const result = calculateFCUWaterFlow(12000, 44, 54);
      expectWithinPercent(result, 2.4, 1);
    });

    it('calculates HW flow for heating', () => {
      // 8,000 BTU/h, 140-120°F = 8,000 / (500 × 20) = 0.8 GPM
      const result = calculateFCUWaterFlow(8000, 140, 120);
      expectWithinPercent(result, 0.8, 1);
    });

    it('returns 0 for zero ΔT', () => {
      expect(calculateFCUWaterFlow(12000, 44, 44)).toBe(0);
    });
  });

  describe('estimateFCUNoise', () => {
    it('estimates NC for typical FCU', () => {
      // NC ≈ 25 + (CFM / 200)
      const result = estimateFCUNoise(400);
      expect(result).toBe(27);
    });

    it('higher CFM gives higher NC', () => {
      const low = estimateFCUNoise(200);
      const high = estimateFCUNoise(800);
      expect(high).toBeGreaterThan(low);
    });
  });

  describe('determineCoilConfig', () => {
    it('returns 1 row for small capacity', () => {
      const result = determineCoilConfig(6000);
      expect(result.rows).toBe(1);
      expect(result.finsPerInch).toBe(8);
    });

    it('returns 2 rows for medium capacity', () => {
      const result = determineCoilConfig(12000);
      expect(result.rows).toBe(2);
      expect(result.finsPerInch).toBe(10);
    });

    it('returns 3 rows for larger capacity', () => {
      const result = determineCoilConfig(24000);
      expect(result.rows).toBe(3);
      expect(result.finsPerInch).toBe(12);
    });

    it('returns 4 rows for largest capacity', () => {
      const result = determineCoilConfig(40000);
      expect(result.rows).toBe(4);
      expect(result.finsPerInch).toBe(12);
    });
  });

  describe('sizeFCU', () => {
    it('returns complete sizing result for 4-pipe', () => {
      const input: FCUSizingInput = {
        coolingLoadBtuh: 12000,
        heatingLoadBtuh: 8000,
        cfmRequired: 400,
        unitType: 'fcu_4pipe',
      };

      const result = sizeFCU(input);

      expect(result.model).toBeDefined();
      expect(result.nominalCfm).toBeGreaterThanOrEqual(400);
      expect(result.coolingCapacityMbh).toBeGreaterThan(0);
      expect(result.heatingCapacityMbh).toBeGreaterThan(0);
      expect(result.chwFlowGpm).toBeGreaterThan(0);
      expect(result.hwFlowGpm).toBeGreaterThan(0);
      expect(result.coilRows).toBeGreaterThan(0);
      expect(result.finsPerInch).toBeGreaterThan(0);
      expect(result.isWithinCapacity).toBe(true);
    });

    it('returns electric heat for electric type', () => {
      const input: FCUSizingInput = {
        coolingLoadBtuh: 12000,
        heatingLoadBtuh: 8000,
        cfmRequired: 400,
        unitType: 'fcu_electric',
      };

      const result = sizeFCU(input);

      expect(result.electricHeatKw).toBeDefined();
      expect(result.electricHeatKw).toBeGreaterThan(0);
      expect(result.hwFlowGpm).toBe(0);
    });

    it('handles 2-pipe cooling only', () => {
      const input: FCUSizingInput = {
        coolingLoadBtuh: 12000,
        cfmRequired: 400,
        unitType: 'fcu_2pipe',
      };

      const result = sizeFCU(input);

      expect(result.heatingCapacityMbh).toBe(0);
      expect(result.hwFlowGpm).toBe(0);
    });
  });
});

// =============================================================================
// Unit Type Configuration Tests
// =============================================================================

describe('Unit Type Configuration', () => {
  describe('getUnitTypeConfig', () => {
    it('returns config for VAV cooling', () => {
      const config = getUnitTypeConfig('vav_cooling');
      expect(config).toBeDefined();
      expect(config!.hasReheat).toBe(false);
      expect(config!.isFCU).toBe(false);
    });

    it('returns config for VAV reheat', () => {
      const config = getUnitTypeConfig('vav_reheat');
      expect(config).toBeDefined();
      expect(config!.hasReheat).toBe(true);
      expect(config!.hasHeatingCoil).toBe(true);
    });

    it('returns config for FCU 4-pipe', () => {
      const config = getUnitTypeConfig('fcu_4pipe');
      expect(config).toBeDefined();
      expect(config!.hasCoolingCoil).toBe(true);
      expect(config!.hasHeatingCoil).toBe(true);
      expect(config!.isFCU).toBe(true);
    });
  });

  describe('isVAVType', () => {
    it('returns true for VAV types', () => {
      expect(isVAVType('vav_cooling')).toBe(true);
      expect(isVAVType('vav_reheat')).toBe(true);
    });

    it('returns false for FCU types', () => {
      expect(isVAVType('fcu_2pipe')).toBe(false);
      expect(isVAVType('fcu_4pipe')).toBe(false);
      expect(isVAVType('fcu_electric')).toBe(false);
    });
  });

  describe('isFCUType', () => {
    it('returns true for FCU types', () => {
      expect(isFCUType('fcu_2pipe')).toBe(true);
      expect(isFCUType('fcu_4pipe')).toBe(true);
      expect(isFCUType('fcu_electric')).toBe(true);
    });

    it('returns false for VAV types', () => {
      expect(isFCUType('vav_cooling')).toBe(false);
      expect(isFCUType('vav_reheat')).toBe(false);
    });
  });

  describe('generateUnitTag', () => {
    it('generates VAV tag', () => {
      expect(generateUnitTag('vav_reheat', 1)).toBe('VAV-01');
      expect(generateUnitTag('vav_cooling', 15)).toBe('VAV-15');
    });

    it('generates FCU tag', () => {
      expect(generateUnitTag('fcu_4pipe', 1)).toBe('FCU-01');
      expect(generateUnitTag('fcu_electric', 5)).toBe('FCU-05');
    });

    it('includes zone prefix', () => {
      expect(generateUnitTag('vav_reheat', 3, 'L1')).toBe('VAV-L1-03');
      expect(generateUnitTag('fcu_2pipe', 7, 'B2')).toBe('FCU-B2-07');
    });
  });
});

// =============================================================================
// Standard Sizes and NC Standards Tests
// =============================================================================

describe('Standard Sizes', () => {
  describe('VAV_STANDARD_SIZES', () => {
    it('has all required sizes', () => {
      expect(VAV_STANDARD_SIZES.length).toBeGreaterThan(5);
      
      const sizes = VAV_STANDARD_SIZES.map(s => s.inlet);
      expect(sizes).toContain(6);
      expect(sizes).toContain(8);
      expect(sizes).toContain(10);
      expect(sizes).toContain(12);
    });

    it('has increasing capacity with size', () => {
      for (let i = 1; i < VAV_STANDARD_SIZES.length; i++) {
        expect(VAV_STANDARD_SIZES[i].maxCfm).toBeGreaterThan(
          VAV_STANDARD_SIZES[i - 1].maxCfm
        );
      }
    });

    it('has min CFM less than max', () => {
      VAV_STANDARD_SIZES.forEach(size => {
        expect(size.minCfm).toBeLessThan(size.maxCfm);
      });
    });
  });

  describe('FCU_STANDARD_SIZES', () => {
    it('has all required sizes', () => {
      expect(FCU_STANDARD_SIZES.length).toBeGreaterThan(5);
    });

    it('has increasing capacity with size', () => {
      for (let i = 1; i < FCU_STANDARD_SIZES.length; i++) {
        expect(FCU_STANDARD_SIZES[i].coolingMbh).toBeGreaterThan(
          FCU_STANDARD_SIZES[i - 1].coolingMbh
        );
      }
    });
  });

  describe('SAUDI_NC_STANDARDS', () => {
    it('has Prayer Hall as quietest space', () => {
      const prayerHall = SAUDI_NC_STANDARDS.find(s => s.spaceType === 'Prayer Hall');
      expect(prayerHall).toBeDefined();
      expect(prayerHall!.targetNC).toBe(25);
    });

    it('has Office with NC-40', () => {
      const office = SAUDI_NC_STANDARDS.find(s => s.spaceType === 'Office');
      expect(office).toBeDefined();
      expect(office!.targetNC).toBe(40);
    });

    it('quieter spaces have lower velocity limits', () => {
      const prayerHall = SAUDI_NC_STANDARDS.find(s => s.spaceType === 'Prayer Hall')!;
      const industrial = SAUDI_NC_STANDARDS.find(s => s.spaceType === 'Industrial')!;
      
      expect(prayerHall.maxInletVelocity).toBeLessThan(industrial.maxInletVelocity);
    });
  });

  describe('TERMINAL_UNIT_TYPES', () => {
    it('has all unit types', () => {
      expect(TERMINAL_UNIT_TYPES.length).toBe(5);
      
      const ids = TERMINAL_UNIT_TYPES.map(t => t.id);
      expect(ids).toContain('vav_cooling');
      expect(ids).toContain('vav_reheat');
      expect(ids).toContain('fcu_2pipe');
      expect(ids).toContain('fcu_4pipe');
      expect(ids).toContain('fcu_electric');
    });
  });
});
