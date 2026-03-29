import { describe, it, expect } from 'vitest';
import {
  calculateCoolingCoilCapacity,
  calculateHeatingCoilCapacity,
  calculateWaterFlowGpm,
  calculateFaceVelocity,
  selectCoil,
  getCoilTypeLabel,
  COIL_CATALOG,
  type CoilRequirements,
  type FluidType,
} from '../coil-selection-calculations';
import { expectWithinPercent, STANDARD_CONDITIONS } from './test-utils';

describe('coil-selection-calculations', () => {
  describe('calculateCoolingCoilCapacity', () => {
    it('calculates sensible heat correctly for standard conditions', () => {
      const result = calculateCoolingCoilCapacity(
        10000, // CFM
        80,    // entering DB
        55,    // leaving DB
        67,    // entering WB
        54     // leaving WB
      );
      
      // Sensible = 1.08 × CFM × ΔT = 1.08 × 10000 × 25 = 270,000 BTU/h
      expect(result.sensibleBtuh).toBeCloseTo(270000, -2);
    });

    it('calculates total capacity in tons', () => {
      const result = calculateCoolingCoilCapacity(10000, 80, 55, 67, 54);
      
      // Total capacity should be > sensible due to latent
      expect(result.totalTons).toBeGreaterThan(result.sensibleBtuh / 12000);
      expect(result.totalTons).toBeGreaterThan(20);
    });

    it('returns zero latent when no dehumidification occurs', () => {
      // When leaving WB equals entering WB, no dehumidification
      const result = calculateCoolingCoilCapacity(10000, 80, 70, 67, 67);
      
      expect(result.latentBtuh).toBe(0);
    });

    it('handles zero CFM', () => {
      const result = calculateCoolingCoilCapacity(0, 80, 55, 67, 54);
      
      expect(result.sensibleBtuh).toBe(0);
      expect(result.totalBtuh).toBe(0);
      expect(result.totalTons).toBe(0);
    });

    it('handles negative temperature differential correctly', () => {
      const result = calculateCoolingCoilCapacity(10000, 55, 80, 54, 67);
      
      // Sensible will be negative (heating), formula still applies
      expect(result.sensibleBtuh).toBeLessThan(0);
    });
  });

  describe('calculateHeatingCoilCapacity', () => {
    it('calculates heating capacity correctly', () => {
      const result = calculateHeatingCoilCapacity(
        5000,  // CFM
        55,    // entering temp
        95     // leaving temp
      );
      
      // Capacity = 1.08 × CFM × ΔT = 1.08 × 5000 × 40 = 216,000 BTU/h
      expect(result.capacityBtuh).toBeCloseTo(216000, -2);
      expect(result.capacityMbh).toBeCloseTo(216, 0);
    });

    it('handles zero temperature differential', () => {
      const result = calculateHeatingCoilCapacity(5000, 70, 70);
      
      expect(result.capacityBtuh).toBe(0);
      expect(result.capacityMbh).toBe(0);
    });

    it('handles zero CFM', () => {
      const result = calculateHeatingCoilCapacity(0, 55, 95);
      
      expect(result.capacityBtuh).toBe(0);
    });
  });

  describe('calculateWaterFlowGpm', () => {
    it('calculates water flow for standard chilled water conditions', () => {
      // 12 tons = 144,000 BTU/h, 12°F ΔT
      const gpm = calculateWaterFlowGpm(144000, 44, 56, 'water');
      
      // GPM = BTUH / (500 × ΔT) = 144000 / (500 × 12) = 24 GPM
      expect(gpm).toBeCloseTo(24, 0);
    });

    it('returns zero when temperature differential is zero', () => {
      const gpm = calculateWaterFlowGpm(100000, 44, 44, 'water');
      
      expect(gpm).toBe(0);
    });

    it('adjusts flow for glycol-25', () => {
      const waterGpm = calculateWaterFlowGpm(144000, 44, 56, 'water');
      const glycolGpm = calculateWaterFlowGpm(144000, 44, 56, 'glycol-25');
      
      // Glycol has lower specific heat, so requires more flow
      expect(glycolGpm).toBeGreaterThan(waterGpm);
    });

    it('adjusts flow for glycol-50', () => {
      const glycol25Gpm = calculateWaterFlowGpm(144000, 44, 56, 'glycol-25');
      const glycol50Gpm = calculateWaterFlowGpm(144000, 44, 56, 'glycol-50');
      
      // Higher glycol concentration = even lower specific heat
      expect(glycol50Gpm).toBeGreaterThan(glycol25Gpm);
    });

    it('handles hot water conditions', () => {
      // 100 MBH heating coil, 20°F ΔT
      const gpm = calculateWaterFlowGpm(100000, 140, 120, 'water');
      
      // GPM = 100000 / (500 × 20) = 10 GPM
      expect(gpm).toBeCloseTo(10, 0);
    });
  });

  describe('calculateFaceVelocity', () => {
    it('calculates face velocity correctly', () => {
      const velocity = calculateFaceVelocity(4500, 10);
      
      // 4500 CFM / 10 sqft = 450 FPM
      expect(velocity).toBe(450);
    });

    it('returns zero when face area is zero', () => {
      const velocity = calculateFaceVelocity(4500, 0);
      
      expect(velocity).toBe(0);
    });

    it('handles high airflow correctly', () => {
      const velocity = calculateFaceVelocity(20000, 25);
      
      expect(velocity).toBe(800);
    });
  });

  describe('selectCoil', () => {
    it('selects a cooling coil for standard requirements', () => {
      const requirements: CoilRequirements = {
        coilType: 'cooling',
        designCfm: 5000,
        enteringAirDbF: 80,
        leavingAirDbF: 55,
        enteringAirWbF: 67,
        leavingAirWbF: 54,
        fluidType: 'water',
        supplyTempF: 44,
        returnTempF: 56,
      };
      
      const result = selectCoil(requirements);
      
      expect(result).not.toBeNull();
      expect(result!.selectedCoil.type).toBe('cooling');
      expect(result!.fitScore).toBeGreaterThan(0);
      expect(result!.fitScore).toBeLessThanOrEqual(100);
    });

    it('returns alternates', () => {
      const requirements: CoilRequirements = {
        coilType: 'cooling',
        designCfm: 5000,
        enteringAirDbF: 80,
        leavingAirDbF: 55,
        fluidType: 'water',
        supplyTempF: 44,
        returnTempF: 56,
      };
      
      const result = selectCoil(requirements);
      
      expect(result).not.toBeNull();
      expect(result!.alternates.length).toBeLessThanOrEqual(3);
    });

    it('generates warnings for exceeded pressure drop', () => {
      const requirements: CoilRequirements = {
        coilType: 'cooling',
        designCfm: 5000,
        enteringAirDbF: 80,
        leavingAirDbF: 55,
        fluidType: 'water',
        supplyTempF: 44,
        returnTempF: 56,
        maxAirPressureDropIn: 0.1, // Very low limit
      };
      
      const result = selectCoil(requirements);
      
      expect(result).not.toBeNull();
      expect(result!.warnings.some(w => w.includes('Air PD'))).toBe(true);
    });

    it('selects a heating coil', () => {
      const requirements: CoilRequirements = {
        coilType: 'heating',
        designCfm: 3000,
        enteringAirDbF: 55,
        leavingAirDbF: 95,
        fluidType: 'water',
        supplyTempF: 140,
        returnTempF: 120,
      };
      
      const result = selectCoil(requirements);
      
      expect(result).not.toBeNull();
      expect(result!.selectedCoil.type).toBe('heating');
    });

    it('returns null when no matching coils exist', () => {
      const requirements: CoilRequirements = {
        coilType: 'reheat', // Few reheat coils in catalog
        designCfm: 50000,   // Huge requirement
        enteringAirDbF: 55,
        leavingAirDbF: 95,
        fluidType: 'water',
        supplyTempF: 140,
        returnTempF: 120,
      };
      
      const result = selectCoil(requirements);
      
      // May return null or a coil with warnings
      if (result) {
        expect(result.warnings.length).toBeGreaterThan(0);
      }
    });

    it('calculates operating point', () => {
      const requirements: CoilRequirements = {
        coilType: 'cooling',
        designCfm: 5000,
        enteringAirDbF: 80,
        leavingAirDbF: 55,
        fluidType: 'water',
        supplyTempF: 44,
        returnTempF: 56,
      };
      
      const result = selectCoil(requirements);
      
      expect(result).not.toBeNull();
      expect(result!.operatingPoint.capacity).toBeGreaterThan(0);
      expect(result!.operatingPoint.faceVelocity).toBeGreaterThan(0);
      expect(result!.operatingPoint.waterFlow).toBeGreaterThan(0);
    });
  });

  describe('COIL_CATALOG', () => {
    it('contains cooling coils', () => {
      const coolingCoils = COIL_CATALOG.filter(c => c.type === 'cooling');
      expect(coolingCoils.length).toBeGreaterThan(0);
    });

    it('contains heating coils', () => {
      const heatingCoils = COIL_CATALOG.filter(c => c.type === 'heating');
      expect(heatingCoils.length).toBeGreaterThan(0);
    });

    it('has valid pressure drop values', () => {
      COIL_CATALOG.forEach(coil => {
        expect(coil.airPressureDropIn).toBeGreaterThan(0);
        expect(coil.airPressureDropIn).toBeLessThan(2);
      });
    });
  });

  describe('getCoilTypeLabel', () => {
    it('returns correct label for cooling', () => {
      expect(getCoilTypeLabel('cooling')).toBe('Cooling Coil (CHW)');
    });

    it('returns correct label for heating', () => {
      expect(getCoilTypeLabel('heating')).toBe('Heating Coil (HW)');
    });

    it('returns correct label for preheat', () => {
      expect(getCoilTypeLabel('preheat')).toBe('Preheat Coil');
    });

    it('returns correct label for reheat', () => {
      expect(getCoilTypeLabel('reheat')).toBe('Reheat Coil');
    });
  });
});
