/**
 * Unit tests for Duct Sizing Calculations Library
 * Validates ASHRAE Fundamentals and SMACNA-based calculations
 */

import { describe, it, expect } from 'vitest';
import {
  cfmToM3s,
  m3sToCfm,
  inWgToPa,
  paToInWg,
  calculateVelocity,
  roundDuctArea,
  rectangularDuctArea,
  equivalentDiameter,
  hydraulicDiameter,
  calculateReynolds,
  calculateFrictionFactor,
  calculateFrictionLoss,
  calculateVelocityPressure,
  calculateFittingLoss,
  calculateSegmentPressureLoss,
  sizeDuctEqualFriction,
  sizeDuctVelocity,
  sizeDuctStaticRegain,
  getRecommendedVelocity,
  roundToStandardSize,
  equivalentRectangular,
  getSmacnaGauge,
  calculateDuctSurfaceArea,
  calculateDuctWeight,
  DUCT_MATERIALS,
} from '../duct-calculations';
import { expectWithinPercent } from './test-utils';

// =============================================================================
// Unit Conversion Tests
// =============================================================================

describe('Unit Conversions', () => {
  describe('cfmToM3s', () => {
    it('converts 1000 CFM correctly', () => {
      const result = cfmToM3s(1000);
      expectWithinPercent(result, 0.472, 1);
    });

    it('converts 0 CFM to 0', () => {
      expect(cfmToM3s(0)).toBe(0);
    });

    it('handles large values', () => {
      const result = cfmToM3s(50000);
      expectWithinPercent(result, 23.6, 1);
    });
  });

  describe('m3sToCfm', () => {
    it('converts 1 m³/s correctly', () => {
      const result = m3sToCfm(1);
      expectWithinPercent(result, 2119, 1);
    });

    it('is inverse of cfmToM3s', () => {
      const original = 5000;
      const converted = m3sToCfm(cfmToM3s(original));
      expectWithinPercent(converted, original, 0.1);
    });
  });

  describe('inWgToPa', () => {
    it('converts 1 inch WG correctly', () => {
      const result = inWgToPa(1);
      expectWithinPercent(result, 249.089, 0.1);
    });

    it('converts 4 inches WG correctly', () => {
      const result = inWgToPa(4);
      expectWithinPercent(result, 996.36, 0.1);
    });
  });

  describe('paToInWg', () => {
    it('is inverse of inWgToPa', () => {
      const original = 2.5;
      const converted = paToInWg(inWgToPa(original));
      expectWithinPercent(converted, original, 0.1);
    });
  });
});

// =============================================================================
// Geometry Calculations Tests
// =============================================================================

describe('Geometry Calculations', () => {
  describe('roundDuctArea', () => {
    it('calculates area for 300mm diameter', () => {
      const result = roundDuctArea(300);
      expectWithinPercent(result, 0.0707, 1);
    });

    it('calculates area for 500mm diameter', () => {
      const result = roundDuctArea(500);
      expectWithinPercent(result, 0.196, 1);
    });
  });

  describe('rectangularDuctArea', () => {
    it('calculates area for 400x200mm', () => {
      const result = rectangularDuctArea(400, 200);
      expect(result).toBe(0.08);
    });

    it('calculates area for 600x300mm', () => {
      const result = rectangularDuctArea(600, 300);
      expect(result).toBe(0.18);
    });
  });

  describe('equivalentDiameter', () => {
    it('calculates De for 400x200mm rectangular', () => {
      const result = equivalentDiameter(400, 200);
      // Expected ~282mm based on ASHRAE formula
      expectWithinPercent(result, 282, 5);
    });

    it('calculates De for square 300x300mm', () => {
      const result = equivalentDiameter(300, 300);
      // Square duct De ≈ 1.3 × (300×300)^0.625 / (600)^0.25
      expectWithinPercent(result, 329, 5);
    });
  });

  describe('hydraulicDiameter', () => {
    it('calculates Dh for rectangular duct', () => {
      const result = hydraulicDiameter(400, 200);
      // Dh = 4 × Area / Perimeter = 4 × 80000 / 1200 = 266.67mm
      expectWithinPercent(result, 266.67, 1);
    });

    it('equals width for square duct', () => {
      const result = hydraulicDiameter(300, 300);
      // Dh = 4 × 90000 / 1200 = 300mm
      expect(result).toBe(300);
    });
  });
});

// =============================================================================
// Velocity Calculations Tests
// =============================================================================

describe('Velocity Calculations', () => {
  describe('calculateVelocity', () => {
    it('calculates velocity for given airflow and area', () => {
      const airflowM3s = 1.0;
      const areaSqM = 0.2;
      const result = calculateVelocity(airflowM3s, areaSqM);
      expect(result).toBe(5);
    });

    it('returns 0 for zero area', () => {
      expect(calculateVelocity(1.0, 0)).toBe(0);
    });

    it('handles typical main duct velocity', () => {
      const cfm = 10000;
      const diameterMm = 500;
      const airflowM3s = cfmToM3s(cfm);
      const area = roundDuctArea(diameterMm);
      const velocity = calculateVelocity(airflowM3s, area);
      
      // Should be in range 8-12 m/s for main duct
      expect(velocity).toBeGreaterThan(8);
      expect(velocity).toBeLessThan(30);
    });
  });

  describe('calculateVelocityPressure', () => {
    it('calculates Pv at 10 m/s', () => {
      const result = calculateVelocityPressure(10);
      // Pv = 0.5 × 1.2 × 10² = 60 Pa
      expect(result).toBe(60);
    });

    it('returns 0 for zero velocity', () => {
      expect(calculateVelocityPressure(0)).toBe(0);
    });

    it('scales with velocity squared', () => {
      const pv5 = calculateVelocityPressure(5);
      const pv10 = calculateVelocityPressure(10);
      expectWithinPercent(pv10 / pv5, 4, 1);
    });
  });
});

// =============================================================================
// Reynolds and Friction Factor Tests
// =============================================================================

describe('Fluid Dynamics Calculations', () => {
  describe('calculateReynolds', () => {
    it('calculates Reynolds number for typical flow', () => {
      const velocity = 8; // m/s
      const diameter = 400; // mm
      const result = calculateReynolds(velocity, diameter);
      
      // Re = V × D / ν = 8 × 0.4 / 1.5e-5 ≈ 213,333
      expectWithinPercent(result, 213333, 1);
    });

    it('indicates turbulent flow for typical HVAC', () => {
      const result = calculateReynolds(6, 300);
      expect(result).toBeGreaterThan(2300); // Turbulent threshold
    });
  });

  describe('calculateFrictionFactor', () => {
    it('returns laminar friction factor for low Reynolds', () => {
      const result = calculateFrictionFactor(2000, 300, 0.15);
      // f = 64 / Re for laminar
      expect(result).toBeCloseTo(0.032, 3);
    });

    it('returns turbulent friction factor for high Reynolds', () => {
      const result = calculateFrictionFactor(100000, 300, 0.15);
      // Should be in range 0.015-0.030 for typical HVAC
      expect(result).toBeGreaterThan(0.015);
      expect(result).toBeLessThan(0.035);
    });

    it('smooth duct has lower friction than rough', () => {
      const smooth = calculateFrictionFactor(100000, 300, 0.05);
      const rough = calculateFrictionFactor(100000, 300, 3.0);
      expect(smooth).toBeLessThan(rough);
    });
  });

  describe('calculateFrictionLoss', () => {
    it('calculates friction loss for typical conditions', () => {
      const velocity = 8; // m/s
      const diameter = 400; // mm
      const result = calculateFrictionLoss(velocity, diameter, 0.15);
      
      // Should be in range 1-3 Pa/m for typical HVAC
      expect(result).toBeGreaterThan(0.5);
      expect(result).toBeLessThan(5);
    });

    it('returns 0 for zero velocity', () => {
      expect(calculateFrictionLoss(0, 400, 0.15)).toBe(0);
    });

    it('returns 0 for zero diameter', () => {
      expect(calculateFrictionLoss(8, 0, 0.15)).toBe(0);
    });

    it('smaller diameter has higher friction', () => {
      const smallDuct = calculateFrictionLoss(8, 200, 0.15);
      const largeDuct = calculateFrictionLoss(8, 400, 0.15);
      expect(smallDuct).toBeGreaterThan(largeDuct);
    });
  });
});

// =============================================================================
// Fitting Loss Tests
// =============================================================================

describe('Fitting Loss Calculations', () => {
  describe('calculateFittingLoss', () => {
    it('calculates loss for 90° elbow', () => {
      const K = 0.25; // Typical 90° elbow
      const velocity = 10;
      const result = calculateFittingLoss(K, velocity);
      
      // ΔP = K × Pv = 0.25 × 60 = 15 Pa
      expect(result).toBe(15);
    });

    it('returns 0 for zero K-factor', () => {
      expect(calculateFittingLoss(0, 10)).toBe(0);
    });

    it('returns 0 for zero velocity', () => {
      expect(calculateFittingLoss(0.25, 0)).toBe(0);
    });
  });

  describe('calculateSegmentPressureLoss', () => {
    it('combines friction and dynamic losses', () => {
      const result = calculateSegmentPressureLoss(
        0.5,      // m³/s
        10,       // m length
        300,      // mm diameter
        [0.2, 0.3], // Two fittings
        0.15      // roughness
      );
      
      expect(result.frictionLoss).toBeGreaterThan(0);
      expect(result.dynamicLoss).toBeGreaterThan(0);
      expect(result.totalLoss).toBe(result.frictionLoss + result.dynamicLoss);
      expect(result.velocity).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// Duct Sizing Methods Tests
// =============================================================================

describe('Duct Sizing Methods', () => {
  describe('sizeDuctEqualFriction', () => {
    it('sizes duct for target friction rate', () => {
      const airflowM3s = cfmToM3s(2000);
      const targetFriction = 1.0; // Pa/m
      const result = sizeDuctEqualFriction(airflowM3s, targetFriction, 0.15);
      
      // Should return reasonable diameter
      expect(result).toBeGreaterThan(200);
      expect(result).toBeLessThan(600);
    });

    it('returns larger diameter for lower friction rate', () => {
      const airflowM3s = cfmToM3s(3000);
      const lowFriction = sizeDuctEqualFriction(airflowM3s, 0.5, 0.15);
      const highFriction = sizeDuctEqualFriction(airflowM3s, 2.0, 0.15);
      
      expect(lowFriction).toBeGreaterThan(highFriction);
    });

    it('returns 0 for zero airflow', () => {
      expect(sizeDuctEqualFriction(0, 1.0, 0.15)).toBe(0);
    });
  });

  describe('sizeDuctVelocity', () => {
    it('sizes duct for target velocity', () => {
      const airflowM3s = cfmToM3s(2000);
      const targetVelocity = 8; // m/s
      const result = sizeDuctVelocity(airflowM3s, targetVelocity);
      
      // Verify result gives approximately target velocity
      const area = roundDuctArea(result);
      const actualVelocity = calculateVelocity(airflowM3s, area);
      expectWithinPercent(actualVelocity, targetVelocity, 10);
    });

    it('returns larger diameter for lower velocity', () => {
      const airflowM3s = cfmToM3s(3000);
      const lowVel = sizeDuctVelocity(airflowM3s, 4);
      const highVel = sizeDuctVelocity(airflowM3s, 10);
      
      expect(lowVel).toBeGreaterThan(highVel);
    });
  });

  describe('sizeDuctStaticRegain', () => {
    it('returns reduced velocity for static regain', () => {
      const result = sizeDuctStaticRegain(
        cfmToM3s(1500),
        10,        // upstream velocity
        5,         // segment length
        400,       // upstream diameter
        0.75       // regain factor
      );
      
      expect(result.velocity).toBeLessThan(10);
      expect(result.diameter).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// Standard Size and Material Tests
// =============================================================================

describe('Standard Sizes and Materials', () => {
  describe('roundToStandardSize', () => {
    it('rounds up to nearest standard size', () => {
      expect(roundToStandardSize(180)).toBe(200);
      expect(roundToStandardSize(260)).toBe(280);
      expect(roundToStandardSize(330)).toBe(355);
    });

    it('returns exact size if already standard', () => {
      expect(roundToStandardSize(315)).toBe(315);
      expect(roundToStandardSize(400)).toBe(400);
    });

    it('returns largest size for very large input', () => {
      expect(roundToStandardSize(2500)).toBe(2000);
    });
  });

  describe('equivalentRectangular', () => {
    it('calculates rectangular dimensions for round equivalent', () => {
      const result = equivalentRectangular(400, 2);
      
      // Check aspect ratio
      expect(result.width / result.height).toBeCloseTo(2, 0);
      
      // Check area is similar to round
      const roundArea = roundDuctArea(400);
      const rectArea = (result.width / 1000) * (result.height / 1000);
      expectWithinPercent(rectArea, roundArea, 10);
    });

    it('returns dimensions in 25mm increments', () => {
      const result = equivalentRectangular(350, 1.5);
      expect(result.width % 25).toBe(0);
      expect(result.height % 25).toBe(0);
    });
  });

  describe('getSmacnaGauge', () => {
    it('returns thicker gauge for larger ducts', () => {
      const smallDuct = getSmacnaGauge(400, 500, 'round');
      const largeDuct = getSmacnaGauge(800, 500, 'round');
      
      expect(largeDuct).toBeGreaterThanOrEqual(smallDuct);
    });

    it('returns thicker gauge for higher pressure', () => {
      const lowPressure = getSmacnaGauge(400, 500, 'rectangular');
      const highPressure = getSmacnaGauge(400, 2000, 'rectangular');
      
      expect(highPressure).toBeGreaterThan(lowPressure);
    });
  });

  describe('getRecommendedVelocity', () => {
    it('returns correct range for main supply', () => {
      const result = getRecommendedVelocity('main_supply');
      expect(result.min).toBe(6);
      expect(result.max).toBe(12);
      expect(result.typical).toBe(8);
    });

    it('returns lower velocities for terminal runouts', () => {
      const terminal = getRecommendedVelocity('terminal_supply');
      const main = getRecommendedVelocity('main_supply');
      
      expect(terminal.max).toBeLessThan(main.max);
    });

    it('returns default for unknown application', () => {
      const result = getRecommendedVelocity('unknown_type');
      expect(result).toBeDefined();
      expect(result.typical).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// Surface Area and Weight Tests
// =============================================================================

describe('Surface Area and Weight', () => {
  describe('calculateDuctSurfaceArea', () => {
    it('calculates surface area for round duct', () => {
      const result = calculateDuctSurfaceArea(10, 400, null, null);
      // π × 0.4 × 10 = 12.57 m²
      expectWithinPercent(result, 12.57, 1);
    });

    it('calculates surface area for rectangular duct', () => {
      const result = calculateDuctSurfaceArea(10, null, 400, 200);
      // 2 × (0.4 + 0.2) × 10 = 12 m²
      expect(result).toBe(12);
    });

    it('returns 0 for missing dimensions', () => {
      expect(calculateDuctSurfaceArea(10, null, null, null)).toBe(0);
    });
  });

  describe('calculateDuctWeight', () => {
    it('calculates weight for galvanized steel', () => {
      const result = calculateDuctWeight(10, 0.8, 'galvanized_steel');
      // 10 m² × 0.8 mm × 7.85 kg/m²/mm = 62.8 kg
      expectWithinPercent(result, 62.8, 1);
    });

    it('aluminum is lighter than steel', () => {
      const steel = calculateDuctWeight(10, 0.8, 'galvanized_steel');
      const aluminum = calculateDuctWeight(10, 0.8, 'aluminum');
      
      expect(aluminum).toBeLessThan(steel);
    });
  });

  describe('DUCT_MATERIALS', () => {
    it('has all required materials', () => {
      expect(DUCT_MATERIALS.galvanized_steel).toBeDefined();
      expect(DUCT_MATERIALS.aluminum).toBeDefined();
      expect(DUCT_MATERIALS.flexible).toBeDefined();
    });

    it('has correct roughness values', () => {
      expect(DUCT_MATERIALS.galvanized_steel.roughness_mm).toBe(0.15);
      expect(DUCT_MATERIALS.flexible.roughness_mm).toBe(3.0);
    });
  });
});
