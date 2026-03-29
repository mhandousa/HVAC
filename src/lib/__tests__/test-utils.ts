/**
 * Test utilities for HVAC calculation libraries
 */

/**
 * Assert that a value is within a percentage tolerance of expected
 */
export function expectWithinPercent(
  actual: number,
  expected: number,
  percentTolerance: number
): void {
  const diff = Math.abs(actual - expected);
  const allowedDiff = Math.abs(expected * (percentTolerance / 100));
  
  if (diff > allowedDiff) {
    throw new Error(
      `Expected ${actual} to be within ${percentTolerance}% of ${expected}, ` +
      `but difference was ${((diff / expected) * 100).toFixed(2)}%`
    );
  }
}

/**
 * Assert that a value is within a range
 */
export function expectInRange(
  actual: number,
  min: number,
  max: number
): void {
  if (actual < min || actual > max) {
    throw new Error(
      `Expected ${actual} to be between ${min} and ${max}`
    );
  }
}

/**
 * Standard test conditions for HVAC calculations
 */
export const STANDARD_CONDITIONS = {
  cooling: {
    enteringDbF: 80,
    leavingDbF: 55,
    enteringWbF: 67,
    leavingWbF: 54,
  },
  heating: {
    enteringDbF: 55,
    leavingDbF: 95,
  },
  water: {
    chwSupplyF: 44,
    chwReturnF: 56,
    hwSupplyF: 140,
    hwReturnF: 120,
  },
  tower: {
    wetBulbF: 78,
    approachF: 7,
    rangeF: 10,
  },
};
