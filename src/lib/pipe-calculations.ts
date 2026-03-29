/**
 * Pipe sizing and hydraulic calculations for hydronic systems
 * Based on ASHRAE Fundamentals and CRANE Technical Paper No. 410
 */

// Pipe material data - inside diameters in inches
export const PIPE_DATA = {
  steel_schedule_40: {
    name: 'Steel Schedule 40',
    roughness: 0.00015, // ft (clean commercial steel)
    sizes: [
      { nominal: 0.5, id: 0.622, od: 0.840, wall: 0.109 },
      { nominal: 0.75, id: 0.824, od: 1.050, wall: 0.113 },
      { nominal: 1.0, id: 1.049, od: 1.315, wall: 0.133 },
      { nominal: 1.25, id: 1.380, od: 1.660, wall: 0.140 },
      { nominal: 1.5, id: 1.610, od: 1.900, wall: 0.145 },
      { nominal: 2.0, id: 2.067, od: 2.375, wall: 0.154 },
      { nominal: 2.5, id: 2.469, od: 2.875, wall: 0.203 },
      { nominal: 3.0, id: 3.068, od: 3.500, wall: 0.216 },
      { nominal: 4.0, id: 4.026, od: 4.500, wall: 0.237 },
      { nominal: 5.0, id: 5.047, od: 5.563, wall: 0.258 },
      { nominal: 6.0, id: 6.065, od: 6.625, wall: 0.280 },
      { nominal: 8.0, id: 7.981, od: 8.625, wall: 0.322 },
      { nominal: 10.0, id: 10.020, od: 10.750, wall: 0.365 },
      { nominal: 12.0, id: 11.938, od: 12.750, wall: 0.406 },
    ],
  },
  steel_schedule_80: {
    name: 'Steel Schedule 80',
    roughness: 0.00015,
    sizes: [
      { nominal: 0.5, id: 0.546, od: 0.840, wall: 0.147 },
      { nominal: 0.75, id: 0.742, od: 1.050, wall: 0.154 },
      { nominal: 1.0, id: 0.957, od: 1.315, wall: 0.179 },
      { nominal: 1.25, id: 1.278, od: 1.660, wall: 0.191 },
      { nominal: 1.5, id: 1.500, od: 1.900, wall: 0.200 },
      { nominal: 2.0, id: 1.939, od: 2.375, wall: 0.218 },
      { nominal: 2.5, id: 2.323, od: 2.875, wall: 0.276 },
      { nominal: 3.0, id: 2.900, od: 3.500, wall: 0.300 },
      { nominal: 4.0, id: 3.826, od: 4.500, wall: 0.337 },
      { nominal: 5.0, id: 4.813, od: 5.563, wall: 0.375 },
      { nominal: 6.0, id: 5.761, od: 6.625, wall: 0.432 },
      { nominal: 8.0, id: 7.625, od: 8.625, wall: 0.500 },
    ],
  },
  copper_type_l: {
    name: 'Copper Type L',
    roughness: 0.000005, // ft (smooth copper)
    sizes: [
      { nominal: 0.5, id: 0.545, od: 0.625, wall: 0.040 },
      { nominal: 0.75, id: 0.785, od: 0.875, wall: 0.045 },
      { nominal: 1.0, id: 1.025, od: 1.125, wall: 0.050 },
      { nominal: 1.25, id: 1.265, od: 1.375, wall: 0.055 },
      { nominal: 1.5, id: 1.505, od: 1.625, wall: 0.060 },
      { nominal: 2.0, id: 1.985, od: 2.125, wall: 0.070 },
      { nominal: 2.5, id: 2.465, od: 2.625, wall: 0.080 },
      { nominal: 3.0, id: 2.945, od: 3.125, wall: 0.090 },
      { nominal: 4.0, id: 3.905, od: 4.125, wall: 0.110 },
    ],
  },
  copper_type_m: {
    name: 'Copper Type M',
    roughness: 0.000005,
    sizes: [
      { nominal: 0.5, id: 0.569, od: 0.625, wall: 0.028 },
      { nominal: 0.75, id: 0.811, od: 0.875, wall: 0.032 },
      { nominal: 1.0, id: 1.055, od: 1.125, wall: 0.035 },
      { nominal: 1.25, id: 1.291, od: 1.375, wall: 0.042 },
      { nominal: 1.5, id: 1.541, od: 1.625, wall: 0.042 },
      { nominal: 2.0, id: 2.041, od: 2.125, wall: 0.042 },
      { nominal: 2.5, id: 2.495, od: 2.625, wall: 0.065 },
      { nominal: 3.0, id: 2.981, od: 3.125, wall: 0.072 },
      { nominal: 4.0, id: 3.935, od: 4.125, wall: 0.095 },
    ],
  },
  pvc_schedule_40: {
    name: 'PVC Schedule 40',
    roughness: 0.000007, // ft (smooth plastic)
    sizes: [
      { nominal: 0.5, id: 0.622, od: 0.840, wall: 0.109 },
      { nominal: 0.75, id: 0.824, od: 1.050, wall: 0.113 },
      { nominal: 1.0, id: 1.049, od: 1.315, wall: 0.133 },
      { nominal: 1.25, id: 1.380, od: 1.660, wall: 0.140 },
      { nominal: 1.5, id: 1.610, od: 1.900, wall: 0.145 },
      { nominal: 2.0, id: 2.067, od: 2.375, wall: 0.154 },
      { nominal: 2.5, id: 2.469, od: 2.875, wall: 0.203 },
      { nominal: 3.0, id: 3.068, od: 3.500, wall: 0.216 },
      { nominal: 4.0, id: 4.026, od: 4.500, wall: 0.237 },
      { nominal: 6.0, id: 6.065, od: 6.625, wall: 0.280 },
    ],
  },
};

export type PipeMaterial = keyof typeof PIPE_DATA;

// Fluid property data
interface FluidProperties {
  density: number; // lb/ft³
  viscosity: number; // lb/(ft·s)
  specificHeat: number; // BTU/(lb·°F)
}

// Water properties at various temperatures (°F)
const WATER_PROPERTIES: Record<number, FluidProperties> = {
  40: { density: 62.42, viscosity: 0.001038, specificHeat: 1.005 },
  45: { density: 62.42, viscosity: 0.000962, specificHeat: 1.004 },
  50: { density: 62.41, viscosity: 0.000894, specificHeat: 1.002 },
  55: { density: 62.38, viscosity: 0.000833, specificHeat: 1.001 },
  60: { density: 62.34, viscosity: 0.000778, specificHeat: 1.000 },
  70: { density: 62.27, viscosity: 0.000685, specificHeat: 0.999 },
  80: { density: 62.17, viscosity: 0.000609, specificHeat: 0.998 },
  100: { density: 61.94, viscosity: 0.000490, specificHeat: 0.998 },
  120: { density: 61.68, viscosity: 0.000410, specificHeat: 0.999 },
  140: { density: 61.38, viscosity: 0.000352, specificHeat: 1.000 },
  160: { density: 61.00, viscosity: 0.000307, specificHeat: 1.002 },
  180: { density: 60.57, viscosity: 0.000271, specificHeat: 1.004 },
  200: { density: 60.12, viscosity: 0.000242, specificHeat: 1.007 },
};

// Glycol correction factors (multipliers for density and viscosity)
const GLYCOL_FACTORS: Record<number, { density: number; viscosity: number }> = {
  0: { density: 1.0, viscosity: 1.0 },
  10: { density: 1.015, viscosity: 1.15 },
  20: { density: 1.030, viscosity: 1.35 },
  25: { density: 1.038, viscosity: 1.50 },
  30: { density: 1.045, viscosity: 1.70 },
  40: { density: 1.060, viscosity: 2.20 },
  50: { density: 1.075, viscosity: 3.00 },
};

/**
 * Get fluid properties with glycol correction
 */
export function getFluidProperties(
  tempF: number,
  glycolPercent: number = 0
): FluidProperties {
  // Interpolate water properties
  const temps = Object.keys(WATER_PROPERTIES).map(Number).sort((a, b) => a - b);
  let lowerTemp = temps[0];
  let upperTemp = temps[temps.length - 1];

  for (let i = 0; i < temps.length - 1; i++) {
    if (tempF >= temps[i] && tempF <= temps[i + 1]) {
      lowerTemp = temps[i];
      upperTemp = temps[i + 1];
      break;
    }
  }

  const fraction = upperTemp === lowerTemp ? 0 : (tempF - lowerTemp) / (upperTemp - lowerTemp);
  const lowerProps = WATER_PROPERTIES[lowerTemp];
  const upperProps = WATER_PROPERTIES[upperTemp];

  const waterProps: FluidProperties = {
    density: lowerProps.density + fraction * (upperProps.density - lowerProps.density),
    viscosity: lowerProps.viscosity + fraction * (upperProps.viscosity - lowerProps.viscosity),
    specificHeat: lowerProps.specificHeat + fraction * (upperProps.specificHeat - lowerProps.specificHeat),
  };

  // Apply glycol correction
  const glycolPercentages = Object.keys(GLYCOL_FACTORS).map(Number).sort((a, b) => a - b);
  let lowerGlycol = glycolPercentages[0];
  let upperGlycol = glycolPercentages[glycolPercentages.length - 1];

  for (let i = 0; i < glycolPercentages.length - 1; i++) {
    if (glycolPercent >= glycolPercentages[i] && glycolPercent <= glycolPercentages[i + 1]) {
      lowerGlycol = glycolPercentages[i];
      upperGlycol = glycolPercentages[i + 1];
      break;
    }
  }

  const glycolFraction = upperGlycol === lowerGlycol ? 0 : 
    (glycolPercent - lowerGlycol) / (upperGlycol - lowerGlycol);
  const lowerFactor = GLYCOL_FACTORS[lowerGlycol];
  const upperFactor = GLYCOL_FACTORS[upperGlycol];

  const densityFactor = lowerFactor.density + glycolFraction * (upperFactor.density - lowerFactor.density);
  const viscosityFactor = lowerFactor.viscosity + glycolFraction * (upperFactor.viscosity - lowerFactor.viscosity);

  return {
    density: waterProps.density * densityFactor,
    viscosity: waterProps.viscosity * viscosityFactor,
    specificHeat: waterProps.specificHeat * (1 - glycolPercent / 200), // Glycol reduces specific heat
  };
}

/**
 * Get pipe inside diameter for a given material and nominal size
 */
export function getPipeID(material: PipeMaterial, nominalSize: number): number | null {
  const pipeData = PIPE_DATA[material];
  if (!pipeData) return null;

  const size = pipeData.sizes.find(s => s.nominal === nominalSize);
  return size ? size.id : null;
}

/**
 * Get all available nominal sizes for a pipe material
 */
export function getAvailableSizes(material: PipeMaterial): number[] {
  const pipeData = PIPE_DATA[material];
  if (!pipeData) return [];
  return pipeData.sizes.map(s => s.nominal);
}

/**
 * Calculate velocity in fps
 * V = Q / A where Q is in GPM and A is cross-sectional area
 */
export function calculateVelocity(flowGPM: number, diameterIn: number): number {
  // V = (0.4085 × Q) / d²  where Q in GPM, d in inches, V in fps
  return (0.4085 * flowGPM) / (diameterIn * diameterIn);
}

/**
 * Calculate Reynolds number
 * Re = ρVD/μ
 */
export function calculateReynoldsNumber(
  velocityFPS: number,
  diameterIn: number,
  fluidProps: FluidProperties
): number {
  const diameterFt = diameterIn / 12;
  // Re = (ρ × V × D) / μ
  return (fluidProps.density * velocityFPS * diameterFt) / fluidProps.viscosity;
}

/**
 * Calculate friction factor using Colebrook-White equation (iterative)
 * For turbulent flow: 1/√f = -2 log₁₀(ε/3.7D + 2.51/(Re√f))
 */
export function calculateFrictionFactor(
  reynoldsNumber: number,
  roughness: number, // ft
  diameterIn: number
): number {
  const diameterFt = diameterIn / 12;
  const relativeRoughness = roughness / diameterFt;

  // Laminar flow
  if (reynoldsNumber < 2300) {
    return 64 / reynoldsNumber;
  }

  // Turbulent flow - Swamee-Jain approximation (accurate within 1%)
  const term1 = relativeRoughness / 3.7;
  const term2 = 5.74 / Math.pow(reynoldsNumber, 0.9);
  const f = 0.25 / Math.pow(Math.log10(term1 + term2), 2);

  return f;
}

/**
 * Calculate friction head loss using Darcy-Weisbach equation
 * h_f = f × (L/D) × (V²/2g)
 * Returns head loss in feet
 */
export function calculateFrictionLoss(
  lengthFt: number,
  diameterIn: number,
  velocityFPS: number,
  frictionFactor: number
): number {
  const diameterFt = diameterIn / 12;
  const g = 32.174; // ft/s²
  return frictionFactor * (lengthFt / diameterFt) * (velocityFPS * velocityFPS) / (2 * g);
}

/**
 * Calculate friction loss per 100 ft of pipe
 */
export function calculateFrictionLossPer100ft(
  diameterIn: number,
  velocityFPS: number,
  frictionFactor: number
): number {
  return calculateFrictionLoss(100, diameterIn, velocityFPS, frictionFactor);
}

/**
 * Calculate fitting head loss using K-factor method
 * h = K × (V²/2g)
 */
export function calculateFittingLoss(kFactor: number, velocityFPS: number): number {
  const g = 32.174; // ft/s²
  return kFactor * (velocityFPS * velocityFPS) / (2 * g);
}

/**
 * Size pipe for target velocity
 * Returns the smallest pipe size that keeps velocity at or below target
 */
export function sizePipeByVelocity(
  flowGPM: number,
  material: PipeMaterial,
  targetVelocityFPS: number = 6
): { nominalSize: number; actualVelocity: number; diameterIn: number } | null {
  const sizes = getAvailableSizes(material);
  
  for (const nominalSize of sizes) {
    const diameter = getPipeID(material, nominalSize);
    if (!diameter) continue;

    const velocity = calculateVelocity(flowGPM, diameter);
    if (velocity <= targetVelocityFPS) {
      return { nominalSize, actualVelocity: velocity, diameterIn: diameter };
    }
  }

  // If no size fits, return largest
  const largestSize = sizes[sizes.length - 1];
  const largestDiameter = getPipeID(material, largestSize)!;
  return {
    nominalSize: largestSize,
    actualVelocity: calculateVelocity(flowGPM, largestDiameter),
    diameterIn: largestDiameter,
  };
}

/**
 * Size pipe for maximum friction loss per 100 ft
 */
export function sizePipeByFriction(
  flowGPM: number,
  material: PipeMaterial,
  fluidProps: FluidProperties,
  maxFrictionPer100ft: number = 4
): { nominalSize: number; actualFriction: number; actualVelocity: number; diameterIn: number } | null {
  const sizes = getAvailableSizes(material);
  const roughness = PIPE_DATA[material].roughness;

  for (const nominalSize of sizes) {
    const diameter = getPipeID(material, nominalSize);
    if (!diameter) continue;

    const velocity = calculateVelocity(flowGPM, diameter);
    const reynolds = calculateReynoldsNumber(velocity, diameter, fluidProps);
    const frictionFactor = calculateFrictionFactor(reynolds, roughness, diameter);
    const frictionPer100ft = calculateFrictionLossPer100ft(diameter, velocity, frictionFactor);

    if (frictionPer100ft <= maxFrictionPer100ft) {
      return {
        nominalSize,
        actualFriction: frictionPer100ft,
        actualVelocity: velocity,
        diameterIn: diameter,
      };
    }
  }

  // If no size fits, return largest
  const largestSize = sizes[sizes.length - 1];
  const largestDiameter = getPipeID(material, largestSize)!;
  const velocity = calculateVelocity(flowGPM, largestDiameter);
  const reynolds = calculateReynoldsNumber(velocity, largestDiameter, fluidProps);
  const frictionFactor = calculateFrictionFactor(reynolds, roughness, largestDiameter);

  return {
    nominalSize: largestSize,
    actualFriction: calculateFrictionLossPer100ft(largestDiameter, velocity, frictionFactor),
    actualVelocity: velocity,
    diameterIn: largestDiameter,
  };
}

/**
 * Calculate complete segment hydraulics
 */
export interface SegmentHydraulics {
  velocity: number; // fps
  reynoldsNumber: number;
  frictionFactor: number;
  frictionLossFt: number; // Total friction loss
  frictionPer100ft: number;
  fittingsLossFt: number;
  totalHeadLossFt: number;
  elevationHeadFt: number;
}

export function calculateSegmentHydraulics(
  flowGPM: number,
  lengthFt: number,
  diameterIn: number,
  material: PipeMaterial,
  fluidProps: FluidProperties,
  fittingsKTotal: number = 0,
  elevationChangeFt: number = 0
): SegmentHydraulics {
  const roughness = PIPE_DATA[material].roughness;
  const velocity = calculateVelocity(flowGPM, diameterIn);
  const reynoldsNumber = calculateReynoldsNumber(velocity, diameterIn, fluidProps);
  const frictionFactor = calculateFrictionFactor(reynoldsNumber, roughness, diameterIn);
  const frictionLossFt = calculateFrictionLoss(lengthFt, diameterIn, velocity, frictionFactor);
  const frictionPer100ft = calculateFrictionLossPer100ft(diameterIn, velocity, frictionFactor);
  const fittingsLossFt = calculateFittingLoss(fittingsKTotal, velocity);
  const elevationHeadFt = elevationChangeFt; // 1 ft elevation = 1 ft head

  return {
    velocity,
    reynoldsNumber,
    frictionFactor,
    frictionLossFt,
    frictionPer100ft,
    fittingsLossFt,
    totalHeadLossFt: frictionLossFt + fittingsLossFt + elevationHeadFt,
    elevationHeadFt,
  };
}

/**
 * Calculate pump power requirements
 * BHP = (Q × H × SG) / (3960 × η)
 */
export function calculatePumpPower(
  flowGPM: number,
  headFt: number,
  specificGravity: number = 1.0,
  pumpEfficiency: number = 0.70
): { hydraulicHP: number; brakeHP: number; motorHP: number } {
  const hydraulicHP = (flowGPM * headFt * specificGravity) / 3960;
  const brakeHP = hydraulicHP / pumpEfficiency;
  
  // Round up to standard motor sizes
  const standardMotorSizes = [0.5, 0.75, 1, 1.5, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100];
  const motorHP = standardMotorSizes.find(size => size >= brakeHP * 1.15) || brakeHP * 1.15;

  return { hydraulicHP, brakeHP, motorHP };
}

/**
 * Calculate flow rate from cooling load
 * GPM = BTU/h / (500 × ΔT)
 */
export function calculateFlowFromLoad(loadBTUH: number, deltaTF: number = 10): number {
  return loadBTUH / (500 * deltaTF);
}

/**
 * Get velocity status color and label
 */
export function getVelocityStatus(velocityFPS: number): { color: string; label: string } {
  if (velocityFPS < 2) return { color: 'text-yellow-600', label: 'Low' };
  if (velocityFPS <= 4) return { color: 'text-green-600', label: 'Good' };
  if (velocityFPS <= 8) return { color: 'text-blue-600', label: 'Normal' };
  if (velocityFPS <= 10) return { color: 'text-orange-600', label: 'High' };
  return { color: 'text-red-600', label: 'Too High' };
}

/**
 * Format nominal pipe size for display
 */
export function formatNominalSize(size: number): string {
  if (size < 1) return `${size * 4}/4"`;
  return `${size}"`;
}
