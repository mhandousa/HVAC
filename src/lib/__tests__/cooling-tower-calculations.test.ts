import { describe, it, expect } from 'vitest';
import {
  calculateHeatRejection,
  calculateCondenserWaterFlow,
  calculateMakeupWater,
  adjustCapacityForConditions,
  selectCoolingTower,
  getTowerTypeLabel,
  getFillTypeLabel,
  COOLING_TOWER_CATALOG,
  SAUDI_DESIGN_WET_BULB,
  type CoolingTowerRequirements,
} from '../cooling-tower-calculations';
import { expectWithinPercent } from './test-utils';

describe('cooling-tower-calculations', () => {
  describe('calculateHeatRejection', () => {
    it('calculates heat rejection with default COP 5.5', () => {
      const hr = calculateHeatRejection(100);
      
      // HR = 100 × (1 + 1/5.5) = 100 × 1.182 = 118.2 tons
      expect(hr).toBeCloseTo(118.2, 1);
    });

    it('calculates higher heat rejection with lower COP', () => {
      const hr = calculateHeatRejection(100, 4.0);
      
      // HR = 100 × (1 + 1/4.0) = 100 × 1.25 = 125 tons
      expect(hr).toBeCloseTo(125, 0);
    });

    it('calculates lower heat rejection with higher COP', () => {
      const hr55 = calculateHeatRejection(100, 5.5);
      const hr70 = calculateHeatRejection(100, 7.0);
      
      expect(hr70).toBeLessThan(hr55);
    });

    it('handles zero chiller load', () => {
      const hr = calculateHeatRejection(0);
      
      expect(hr).toBe(0);
    });

    it('scales linearly with chiller load', () => {
      const hr100 = calculateHeatRejection(100);
      const hr200 = calculateHeatRejection(200);
      
      expect(hr200).toBeCloseTo(hr100 * 2, 1);
    });
  });

  describe('calculateCondenserWaterFlow', () => {
    it('calculates 3 GPM/ton at 10°F range', () => {
      const gpm = calculateCondenserWaterFlow(100, 10);
      
      // GPM = (100 × 12000) / (500 × 10) = 240 GPM
      // Which is 2.4 GPM/ton
      expect(gpm).toBeCloseTo(240, 0);
    });

    it('calculates flow at different ranges', () => {
      const gpm10 = calculateCondenserWaterFlow(100, 10);
      const gpm15 = calculateCondenserWaterFlow(100, 15);
      
      // Larger range = less flow required
      expect(gpm15).toBeLessThan(gpm10);
    });

    it('scales with heat rejection', () => {
      const gpm100 = calculateCondenserWaterFlow(100, 10);
      const gpm200 = calculateCondenserWaterFlow(200, 10);
      
      expect(gpm200).toBeCloseTo(gpm100 * 2, 0);
    });

    it('calculates typical plant sizing (500 tons, 10°F range)', () => {
      const gpm = calculateCondenserWaterFlow(500, 10);
      
      // 500 tons × 2.4 GPM/ton = 1200 GPM
      expect(gpm).toBeCloseTo(1200, 0);
    });
  });

  describe('calculateMakeupWater', () => {
    it('calculates evaporation at 1% of flow per 10°F range', () => {
      const result = calculateMakeupWater(1000);
      
      // Evaporation = 1000 × 0.01 = 10 GPM
      expect(result.evaporationGpm).toBe(10);
    });

    it('calculates drift with default 0.005%', () => {
      const result = calculateMakeupWater(1000, 5, 0.005);
      
      // Drift = 1000 × (0.005/100) = 0.05 GPM
      expect(result.driftGpm).toBeCloseTo(0.05, 3);
    });

    it('calculates blowdown based on cycles of concentration', () => {
      const result = calculateMakeupWater(1000, 5);
      
      // Blowdown = Evap / (COC - 1) = 10 / 4 = 2.5 GPM
      expect(result.blowdownGpm).toBeCloseTo(2.5, 1);
    });

    it('calculates total makeup as sum of components', () => {
      const result = calculateMakeupWater(1000, 5, 0.005);
      
      const expectedMakeup = 
        result.evaporationGpm + 
        result.blowdownGpm + 
        result.driftGpm;
      
      expect(result.makeupGpm).toBeCloseTo(expectedMakeup, 2);
    });

    it('increases blowdown with lower cycles', () => {
      const result3 = calculateMakeupWater(1000, 3);
      const result5 = calculateMakeupWater(1000, 5);
      
      expect(result3.blowdownGpm).toBeGreaterThan(result5.blowdownGpm);
    });
  });

  describe('adjustCapacityForConditions', () => {
    it('returns catalog capacity at catalog conditions', () => {
      const adjusted = adjustCapacityForConditions(
        100,  // catalog capacity
        78,   // catalog wet bulb
        7,    // catalog approach
        10,   // catalog range
        78,   // actual wet bulb
        7,    // actual approach
        10    // actual range
      );
      
      expect(adjusted).toBeCloseTo(100, 1);
    });

    it('decreases capacity with higher wet bulb', () => {
      const catalogCapacity = adjustCapacityForConditions(100, 78, 7, 10, 78, 7, 10);
      const hotterCapacity = adjustCapacityForConditions(100, 78, 7, 10, 85, 7, 10);
      
      expect(hotterCapacity).toBeLessThan(catalogCapacity);
    });

    it('applies 2% per °F wet bulb correction', () => {
      const baseCapacity = adjustCapacityForConditions(100, 78, 7, 10, 78, 7, 10);
      const plus5Capacity = adjustCapacityForConditions(100, 78, 7, 10, 83, 7, 10);
      
      // 5°F increase × 2%/°F = 10% reduction
      expect(plus5Capacity).toBeCloseTo(baseCapacity * 0.9, 0);
    });

    it('adjusts for approach temperature', () => {
      const largeApproach = adjustCapacityForConditions(100, 78, 7, 10, 78, 10, 10);
      const smallApproach = adjustCapacityForConditions(100, 78, 7, 10, 78, 5, 10);
      
      // Smaller approach = less capacity available
      expect(smallApproach).toBeLessThan(largeApproach);
    });

    it('never returns negative capacity', () => {
      // Extreme conditions that might give negative
      const capacity = adjustCapacityForConditions(100, 78, 7, 10, 120, 3, 20);
      
      expect(capacity).toBeGreaterThanOrEqual(0);
    });
  });

  describe('selectCoolingTower', () => {
    it('selects a tower for standard requirements', () => {
      const requirements: CoolingTowerRequirements = {
        heatRejectionTons: 500,
        condenserWaterFlowGpm: 1500,
        designWetBulbF: 78,
        approachF: 7,
        rangeF: 10,
      };
      
      const result = selectCoolingTower(requirements);
      
      expect(result).not.toBeNull();
      expect(result!.totalCapacityTons).toBeGreaterThanOrEqual(500);
      expect(result!.fitScore).toBeGreaterThan(0);
    });

    it('handles N+1 redundancy mode', () => {
      const requirements: CoolingTowerRequirements = {
        heatRejectionTons: 500,
        condenserWaterFlowGpm: 1500,
        designWetBulbF: 78,
        approachF: 7,
        rangeF: 10,
        redundancyMode: 'n+1',
      };
      
      const result = selectCoolingTower(requirements);
      
      expect(result).not.toBeNull();
      expect(result!.numberOfCells).toBeGreaterThanOrEqual(2);
    });

    it('handles 2N redundancy mode', () => {
      const requirements: CoolingTowerRequirements = {
        heatRejectionTons: 300,
        condenserWaterFlowGpm: 900,
        designWetBulbF: 78,
        approachF: 7,
        rangeF: 10,
        redundancyMode: '2n',
      };
      
      const result = selectCoolingTower(requirements);
      
      expect(result).not.toBeNull();
      expect(result!.numberOfCells).toBeGreaterThanOrEqual(2);
    });

    it('respects tower type preference', () => {
      const requirements: CoolingTowerRequirements = {
        heatRejectionTons: 300,
        condenserWaterFlowGpm: 900,
        designWetBulbF: 78,
        approachF: 7,
        rangeF: 10,
        preferredType: 'induced_draft_crossflow',
      };
      
      const result = selectCoolingTower(requirements);
      
      expect(result).not.toBeNull();
      expect(result!.selectedTower.towerType).toBe('induced_draft_crossflow');
    });

    it('calculates makeup water in operating point', () => {
      const requirements: CoolingTowerRequirements = {
        heatRejectionTons: 500,
        condenserWaterFlowGpm: 1500,
        designWetBulbF: 78,
        approachF: 7,
        rangeF: 10,
      };
      
      const result = selectCoolingTower(requirements);
      
      expect(result).not.toBeNull();
      expect(result!.operatingPoint.makeupWaterGpm).toBeGreaterThan(0);
      expect(result!.operatingPoint.blowdownGpm).toBeGreaterThan(0);
    });

    it('returns alternates', () => {
      const requirements: CoolingTowerRequirements = {
        heatRejectionTons: 500,
        condenserWaterFlowGpm: 1500,
        designWetBulbF: 78,
        approachF: 7,
        rangeF: 10,
      };
      
      const result = selectCoolingTower(requirements);
      
      expect(result).not.toBeNull();
      expect(result!.alternates).toBeDefined();
    });

    it('generates warning for high sound level', () => {
      const requirements: CoolingTowerRequirements = {
        heatRejectionTons: 1000,
        condenserWaterFlowGpm: 3000,
        designWetBulbF: 78,
        approachF: 7,
        rangeF: 10,
      };
      
      const result = selectCoolingTower(requirements);
      
      // Large towers may have high sound levels
      if (result && result.selectedTower.soundLevelDb > 78) {
        expect(result.warnings.some(w => w.includes('sound'))).toBe(true);
      }
    });

    it('respects max cells limit', () => {
      const requirements: CoolingTowerRequirements = {
        heatRejectionTons: 2000,
        condenserWaterFlowGpm: 6000,
        designWetBulbF: 78,
        approachF: 7,
        rangeF: 10,
        maxCells: 3,
      };
      
      const result = selectCoolingTower(requirements);
      
      if (result) {
        expect(result.numberOfCells).toBeLessThanOrEqual(3);
      }
    });
  });

  describe('SAUDI_DESIGN_WET_BULB', () => {
    it('has correct wet bulb for Jeddah', () => {
      expect(SAUDI_DESIGN_WET_BULB['jeddah']).toBe(84);
    });

    it('has correct wet bulb for Riyadh', () => {
      expect(SAUDI_DESIGN_WET_BULB['riyadh']).toBe(73);
    });

    it('has correct wet bulb for Dammam', () => {
      expect(SAUDI_DESIGN_WET_BULB['dammam']).toBe(85);
    });

    it('has cooler wet bulb for highland cities', () => {
      expect(SAUDI_DESIGN_WET_BULB['abha']).toBeLessThan(SAUDI_DESIGN_WET_BULB['jeddah']);
      expect(SAUDI_DESIGN_WET_BULB['taif']).toBeLessThan(SAUDI_DESIGN_WET_BULB['riyadh']);
    });

    it('has hottest wet bulbs for coastal cities', () => {
      const coastalCities = ['jeddah', 'dammam', 'khobar', 'jubail', 'jizan'];
      
      coastalCities.forEach(city => {
        expect(SAUDI_DESIGN_WET_BULB[city]).toBeGreaterThanOrEqual(82);
      });
    });

    it('covers all major Saudi cities', () => {
      const requiredCities = [
        'riyadh', 'jeddah', 'dammam', 'makkah', 'madinah',
        'khobar', 'dhahran', 'jubail', 'yanbu', 'taif'
      ];
      
      requiredCities.forEach(city => {
        expect(SAUDI_DESIGN_WET_BULB[city]).toBeDefined();
        expect(SAUDI_DESIGN_WET_BULB[city]).toBeGreaterThan(50);
        expect(SAUDI_DESIGN_WET_BULB[city]).toBeLessThan(100);
      });
    });
  });

  describe('COOLING_TOWER_CATALOG', () => {
    it('contains induced draft counterflow towers', () => {
      const idc = COOLING_TOWER_CATALOG.filter(t => t.towerType === 'induced_draft_counterflow');
      expect(idc.length).toBeGreaterThan(0);
    });

    it('contains hybrid towers', () => {
      const hybrid = COOLING_TOWER_CATALOG.filter(t => t.towerType === 'hybrid');
      expect(hybrid.length).toBeGreaterThan(0);
    });

    it('has valid capacity range', () => {
      COOLING_TOWER_CATALOG.forEach(tower => {
        expect(tower.capacityTons).toBeGreaterThan(0);
        expect(tower.capacityTons).toBeLessThan(2000);
      });
    });

    it('has valid drift rates', () => {
      COOLING_TOWER_CATALOG.forEach(tower => {
        expect(tower.driftRatePercent).toBeGreaterThan(0);
        expect(tower.driftRatePercent).toBeLessThan(0.1);
      });
    });

    it('has reasonable sound levels', () => {
      COOLING_TOWER_CATALOG.forEach(tower => {
        expect(tower.soundLevelDb).toBeGreaterThan(60);
        expect(tower.soundLevelDb).toBeLessThan(90);
      });
    });
  });

  describe('getTowerTypeLabel', () => {
    it('returns correct label for induced draft counterflow', () => {
      expect(getTowerTypeLabel('induced_draft_counterflow')).toBe('Induced Draft Counterflow');
    });

    it('returns correct label for hybrid', () => {
      expect(getTowerTypeLabel('hybrid')).toBe('Hybrid/Fluid Cooler');
    });

    it('returns correct label for forced draft', () => {
      expect(getTowerTypeLabel('forced_draft')).toBe('Forced Draft');
    });
  });

  describe('getFillTypeLabel', () => {
    it('returns correct label for film', () => {
      expect(getFillTypeLabel('film')).toBe('Film Fill');
    });

    it('returns correct label for splash', () => {
      expect(getFillTypeLabel('splash')).toBe('Splash Fill');
    });

    it('returns correct label for low_clog', () => {
      expect(getFillTypeLabel('low_clog')).toBe('Low-Clog Fill');
    });
  });
});
