import { describe, it, expect } from 'vitest';
import {
  calculateFaceVelocity,
  calculateOperatingPressureDrop,
  calculateAnnualEnergyCost,
  calculateFilterQuantity,
  selectFilter,
  getFilterTypeLabel,
  getFilterPositionLabel,
  getMervRatingDescription,
  FILTER_CATALOG,
  MERV_RECOMMENDATIONS,
  type FilterRequirements,
} from '../filter-selection-calculations';
import { expectWithinPercent } from './test-utils';

describe('filter-selection-calculations', () => {
  describe('calculateFaceVelocity', () => {
    it('calculates face velocity correctly', () => {
      const velocity = calculateFaceVelocity(2000, 4);
      
      // 2000 CFM / 4 sqft = 500 FPM
      expect(velocity).toBe(500);
    });

    it('returns zero when face area is zero', () => {
      const velocity = calculateFaceVelocity(2000, 0);
      
      expect(velocity).toBe(0);
    });

    it('handles fractional face areas', () => {
      const velocity = calculateFaceVelocity(1000, 2.78);
      
      expect(velocity).toBeCloseTo(359.7, 0);
    });
  });

  describe('calculateOperatingPressureDrop', () => {
    it('returns catalog value at rated flow', () => {
      const pd = calculateOperatingPressureDrop(0.25, 1000, 1000);
      
      expect(pd).toBe(0.25);
    });

    it('increases with velocity squared', () => {
      const pdAtRated = calculateOperatingPressureDrop(0.25, 1000, 1000);
      const pdAtDouble = calculateOperatingPressureDrop(0.25, 1000, 2000);
      
      // Double velocity = 4x pressure drop
      expect(pdAtDouble).toBeCloseTo(pdAtRated * 4, 2);
    });

    it('decreases at lower flow', () => {
      const pdAtRated = calculateOperatingPressureDrop(0.25, 1000, 1000);
      const pdAtHalf = calculateOperatingPressureDrop(0.25, 1000, 500);
      
      // Half velocity = 1/4 pressure drop
      expect(pdAtHalf).toBeCloseTo(pdAtRated / 4, 3);
    });
  });

  describe('calculateAnnualEnergyCost', () => {
    it('calculates energy cost with Saudi electricity rate', () => {
      const cost = calculateAnnualEnergyCost(
        0.5,     // pressure drop (inches)
        10000,   // CFM
        0.18,    // SAR/kWh
        8760,    // hours/year
        0.65     // fan efficiency
      );
      
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(5000); // Reasonable range
    });

    it('increases with pressure drop', () => {
      const cost1 = calculateAnnualEnergyCost(0.25, 10000);
      const cost2 = calculateAnnualEnergyCost(0.50, 10000);
      
      expect(cost2).toBeGreaterThan(cost1);
    });

    it('increases with airflow', () => {
      const cost1 = calculateAnnualEnergyCost(0.5, 5000);
      const cost2 = calculateAnnualEnergyCost(0.5, 10000);
      
      expect(cost2).toBeGreaterThan(cost1);
    });

    it('uses default Saudi electricity rate', () => {
      const costWithDefault = calculateAnnualEnergyCost(0.5, 10000);
      const costWithExplicit = calculateAnnualEnergyCost(0.5, 10000, 0.18);
      
      expect(costWithDefault).toBeCloseTo(costWithExplicit, 2);
    });
  });

  describe('calculateFilterQuantity', () => {
    it('returns 1 when flow is below rated', () => {
      const qty = calculateFilterQuantity(800, 1000);
      
      expect(qty).toBe(1);
    });

    it('returns ceiling value for partial filters', () => {
      const qty = calculateFilterQuantity(2500, 1000);
      
      expect(qty).toBe(3);
    });

    it('returns exact division when flows match', () => {
      const qty = calculateFilterQuantity(4000, 1000);
      
      expect(qty).toBe(4);
    });

    it('handles large airflows', () => {
      const qty = calculateFilterQuantity(50000, 2000);
      
      expect(qty).toBe(25);
    });
  });

  describe('selectFilter', () => {
    it('selects a prefilter for office space', () => {
      const requirements: FilterRequirements = {
        designCfm: 5000,
        filterPosition: 'prefilter',
        spaceType: 'office',
      };
      
      const result = selectFilter(requirements);
      
      expect(result).not.toBeNull();
      expect(result!.selectedFilter.filterType).toBe('pleated');
      expect(result!.selectedFilter.mervRating).toBeGreaterThanOrEqual(8);
    });

    it('selects a final filter for hospital', () => {
      const requirements: FilterRequirements = {
        designCfm: 3000,
        filterPosition: 'final',
        spaceType: 'hospital',
      };
      
      const result = selectFilter(requirements);
      
      expect(result).not.toBeNull();
      expect(result!.selectedFilter.mervRating).toBeGreaterThanOrEqual(15);
    });

    it('selects HEPA filter for cleanroom', () => {
      const requirements: FilterRequirements = {
        designCfm: 2000,
        filterPosition: 'hepa',
      };
      
      const result = selectFilter(requirements);
      
      expect(result).not.toBeNull();
      expect(result!.selectedFilter.filterType).toBe('hepa');
    });

    it('calculates correct filter quantity', () => {
      const requirements: FilterRequirements = {
        designCfm: 8000,
        filterPosition: 'prefilter',
      };
      
      const result = selectFilter(requirements);
      
      expect(result).not.toBeNull();
      expect(result!.quantity).toBeGreaterThan(1);
    });

    it('adjusts for Saudi dust load factor', () => {
      const normalReq: FilterRequirements = {
        designCfm: 5000,
        filterPosition: 'prefilter',
        dustLoadFactor: 1.0,
      };
      
      const highDustReq: FilterRequirements = {
        designCfm: 5000,
        filterPosition: 'prefilter',
        dustLoadFactor: 1.5,
      };
      
      const normalResult = selectFilter(normalReq);
      const highDustResult = selectFilter(highDustReq);
      
      expect(normalResult).not.toBeNull();
      expect(highDustResult).not.toBeNull();
      // High dust may affect score or generate warnings
    });

    it('returns alternates', () => {
      const requirements: FilterRequirements = {
        designCfm: 5000,
        filterPosition: 'prefilter',
      };
      
      const result = selectFilter(requirements);
      
      expect(result).not.toBeNull();
      expect(result!.alternates).toBeDefined();
    });

    it('calculates operating point with costs', () => {
      const requirements: FilterRequirements = {
        designCfm: 5000,
        filterPosition: 'prefilter',
      };
      
      const result = selectFilter(requirements);
      
      expect(result).not.toBeNull();
      expect(result!.operatingPoint.faceVelocity).toBeGreaterThan(0);
      expect(result!.operatingPoint.annualEnergyCostSar).toBeGreaterThan(0);
      expect(result!.operatingPoint.annualReplacementCostSar).toBeGreaterThan(0);
      expect(result!.operatingPoint.totalAnnualCostSar).toBe(
        result!.operatingPoint.annualEnergyCostSar + 
        result!.operatingPoint.annualReplacementCostSar
      );
    });

    it('generates warning for exceeded face velocity', () => {
      const requirements: FilterRequirements = {
        designCfm: 10000,
        filterPosition: 'prefilter',
        maxFaceVelocityFpm: 300, // Very low limit
      };
      
      const result = selectFilter(requirements);
      
      expect(result).not.toBeNull();
      expect(result!.warnings.some(w => w.includes('Face velocity'))).toBe(true);
    });
  });

  describe('FILTER_CATALOG', () => {
    it('contains pleated filters', () => {
      const pleated = FILTER_CATALOG.filter(f => f.filterType === 'pleated');
      expect(pleated.length).toBeGreaterThan(0);
    });

    it('contains bag filters', () => {
      const bag = FILTER_CATALOG.filter(f => f.filterType === 'bag');
      expect(bag.length).toBeGreaterThan(0);
    });

    it('contains HEPA filters', () => {
      const hepa = FILTER_CATALOG.filter(f => f.filterType === 'hepa');
      expect(hepa.length).toBeGreaterThan(0);
    });

    it('has valid MERV ratings', () => {
      FILTER_CATALOG.forEach(filter => {
        expect(filter.mervRating).toBeGreaterThanOrEqual(1);
        expect(filter.mervRating).toBeLessThanOrEqual(20);
      });
    });

    it('has positive pressure drops', () => {
      FILTER_CATALOG.forEach(filter => {
        expect(filter.cleanPressureDropIn).toBeGreaterThan(0);
        expect(filter.dirtyPressureDropIn).toBeGreaterThan(filter.cleanPressureDropIn);
      });
    });
  });

  describe('MERV_RECOMMENDATIONS', () => {
    it('has office recommendations', () => {
      expect(MERV_RECOMMENDATIONS['office']).toBeDefined();
      expect(MERV_RECOMMENDATIONS['office'].prefilter).toBe(8);
      expect(MERV_RECOMMENDATIONS['office'].final).toBe(11);
    });

    it('recommends MERV 15 final filter for hospitals', () => {
      expect(MERV_RECOMMENDATIONS['hospital'].final).toBe(15);
    });

    it('recommends MERV 17 final filter for cleanrooms', () => {
      expect(MERV_RECOMMENDATIONS['cleanroom'].final).toBe(17);
    });

    it('has recommendations for all common space types', () => {
      const requiredTypes = ['office', 'retail', 'school', 'hospital', 'laboratory'];
      
      requiredTypes.forEach(type => {
        expect(MERV_RECOMMENDATIONS[type]).toBeDefined();
        expect(MERV_RECOMMENDATIONS[type].prefilter).toBeGreaterThan(0);
        expect(MERV_RECOMMENDATIONS[type].final).toBeGreaterThan(0);
      });
    });
  });

  describe('getFilterTypeLabel', () => {
    it('returns correct label for pleated', () => {
      expect(getFilterTypeLabel('pleated')).toBe('Pleated Panel');
    });

    it('returns correct label for bag', () => {
      expect(getFilterTypeLabel('bag')).toBe('Bag/Pocket');
    });

    it('returns correct label for hepa', () => {
      expect(getFilterTypeLabel('hepa')).toBe('HEPA');
    });

    it('returns correct label for carbon', () => {
      expect(getFilterTypeLabel('carbon')).toBe('Activated Carbon');
    });
  });

  describe('getFilterPositionLabel', () => {
    it('returns correct label for prefilter', () => {
      expect(getFilterPositionLabel('prefilter')).toBe('Pre-Filter');
    });

    it('returns correct label for final', () => {
      expect(getFilterPositionLabel('final')).toBe('Final Filter');
    });

    it('returns correct label for hepa', () => {
      expect(getFilterPositionLabel('hepa')).toBe('HEPA Filter');
    });
  });

  describe('getMervRatingDescription', () => {
    it('describes low MERV ratings', () => {
      expect(getMervRatingDescription(4)).toBe('Minimal filtration');
    });

    it('describes mid MERV ratings', () => {
      expect(getMervRatingDescription(8)).toBe('Good residential/commercial');
    });

    it('describes high MERV ratings', () => {
      expect(getMervRatingDescription(15)).toBe('Hospital/cleanroom');
    });

    it('describes HEPA grade', () => {
      expect(getMervRatingDescription(17)).toBe('HEPA grade');
    });
  });
});
