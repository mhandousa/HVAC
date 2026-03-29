/**
 * HVAC Duct Sizing Calculations Library
 * Based on ASHRAE Fundamentals and SMACNA Standards
 */

// Constants
const AIR_DENSITY_KG_M3 = 1.2; // Standard air density at 20°C
const KINEMATIC_VISCOSITY_M2_S = 1.5e-5; // Air at 20°C
const ROUGHNESS_GALVANIZED_MM = 0.15; // Galvanized steel
const ROUGHNESS_FLEX_MM = 3.0; // Flexible duct

export interface DuctMaterial {
  name: string;
  roughness_mm: number;
  density_kg_m2_mm: number; // kg per m² per mm thickness
}

export const DUCT_MATERIALS: Record<string, DuctMaterial> = {
  galvanized_steel: { name: 'Galvanized Steel', roughness_mm: 0.15, density_kg_m2_mm: 7.85 },
  aluminum: { name: 'Aluminum', roughness_mm: 0.05, density_kg_m2_mm: 2.7 },
  stainless_steel: { name: 'Stainless Steel', roughness_mm: 0.05, density_kg_m2_mm: 8.0 },
  fiberglass_lined: { name: 'Fiberglass Lined', roughness_mm: 0.9, density_kg_m2_mm: 7.85 },
  flexible: { name: 'Flexible Duct', roughness_mm: 3.0, density_kg_m2_mm: 0.5 },
  pvc: { name: 'PVC', roughness_mm: 0.01, density_kg_m2_mm: 1.4 },
};

// SMACNA Gauge Table for Rectangular Ducts (mm thickness)
export const SMACNA_GAUGE_RECTANGULAR: Record<number, Record<string, number>> = {
  500: { // 500 Pa pressure class
    '0-750': 0.63,    // 24 gauge
    '751-1350': 0.80, // 22 gauge
    '1351-2100': 1.00, // 20 gauge
    '2101-2700': 1.25, // 18 gauge
  },
  1000: { // 1000 Pa pressure class
    '0-750': 0.80,
    '751-1350': 1.00,
    '1351-2100': 1.25,
    '2101-2700': 1.60,
  },
  2000: { // 2000 Pa pressure class
    '0-750': 1.00,
    '751-1350': 1.25,
    '1351-2100': 1.60,
    '2101-2700': 2.00,
  },
};

// SMACNA Gauge Table for Round Ducts (mm thickness)
export const SMACNA_GAUGE_ROUND: Record<number, Record<string, number>> = {
  500: {
    '0-200': 0.55,
    '201-450': 0.63,
    '451-750': 0.80,
    '751-1000': 1.00,
  },
  1000: {
    '0-200': 0.63,
    '201-450': 0.80,
    '451-750': 1.00,
    '751-1000': 1.25,
  },
  2000: {
    '0-200': 0.80,
    '201-450': 1.00,
    '451-750': 1.25,
    '751-1000': 1.60,
  },
};

/**
 * Convert airflow from CFM to m³/s
 */
export function cfmToM3s(cfm: number): number {
  return cfm * 0.000471947;
}

/**
 * Convert airflow from m³/s to CFM
 */
export function m3sToCfm(m3s: number): number {
  return m3s / 0.000471947;
}

/**
 * Convert airflow from L/s to m³/s
 */
export function lsToM3s(ls: number): number {
  return ls / 1000;
}

/**
 * Convert pressure from inches WG to Pa
 */
export function inWgToPa(inWg: number): number {
  return inWg * 249.089;
}

/**
 * Convert pressure from Pa to inches WG
 */
export function paToInWg(pa: number): number {
  return pa / 249.089;
}

/**
 * Calculate velocity (m/s) from airflow and area
 */
export function calculateVelocity(airflowM3s: number, areaSqM: number): number {
  if (areaSqM <= 0) return 0;
  return airflowM3s / areaSqM;
}

/**
 * Calculate cross-sectional area of round duct (m²)
 */
export function roundDuctArea(diameterMm: number): number {
  const radiusM = (diameterMm / 1000) / 2;
  return Math.PI * radiusM * radiusM;
}

/**
 * Calculate cross-sectional area of rectangular duct (m²)
 */
export function rectangularDuctArea(widthMm: number, heightMm: number): number {
  return (widthMm / 1000) * (heightMm / 1000);
}

/**
 * Calculate equivalent diameter for rectangular duct (mm)
 * Uses ASHRAE formula: De = 1.3 * (a*b)^0.625 / (a+b)^0.25
 */
export function equivalentDiameter(widthMm: number, heightMm: number): number {
  const a = widthMm;
  const b = heightMm;
  return 1.3 * Math.pow(a * b, 0.625) / Math.pow(a + b, 0.25);
}

/**
 * Calculate hydraulic diameter (mm)
 * Dh = 4 * Area / Perimeter
 */
export function hydraulicDiameter(widthMm: number, heightMm: number): number {
  const area = widthMm * heightMm;
  const perimeter = 2 * (widthMm + heightMm);
  return (4 * area) / perimeter;
}

/**
 * Calculate Reynolds number
 */
export function calculateReynolds(velocityMs: number, diameterMm: number): number {
  const diameterM = diameterMm / 1000;
  return (velocityMs * diameterM) / KINEMATIC_VISCOSITY_M2_S;
}

/**
 * Calculate friction factor using Colebrook-White equation (iterative)
 */
export function calculateFrictionFactor(
  reynolds: number,
  diameterMm: number,
  roughnessMm: number = ROUGHNESS_GALVANIZED_MM
): number {
  if (reynolds < 2300) {
    // Laminar flow
    return 64 / reynolds;
  }

  const relativeRoughness = roughnessMm / diameterMm;
  
  // Initial guess using Swamee-Jain approximation
  let f = 0.25 / Math.pow(
    Math.log10(relativeRoughness / 3.7 + 5.74 / Math.pow(reynolds, 0.9)),
    2
  );

  // Iterate using Colebrook-White
  for (let i = 0; i < 10; i++) {
    const fNew = 1 / Math.pow(
      -2 * Math.log10(relativeRoughness / 3.7 + 2.51 / (reynolds * Math.sqrt(f))),
      2
    );
    if (Math.abs(fNew - f) < 0.0001) break;
    f = fNew;
  }

  return f;
}

/**
 * Calculate friction loss (Pa/m) using Darcy-Weisbach equation
 */
export function calculateFrictionLoss(
  velocityMs: number,
  diameterMm: number,
  roughnessMm: number = ROUGHNESS_GALVANIZED_MM
): number {
  if (velocityMs <= 0 || diameterMm <= 0) return 0;

  const reynolds = calculateReynolds(velocityMs, diameterMm);
  const f = calculateFrictionFactor(reynolds, diameterMm, roughnessMm);
  const diameterM = diameterMm / 1000;

  // Darcy-Weisbach: ΔP/L = f * (ρ * v²) / (2 * D)
  return f * (AIR_DENSITY_KG_M3 * velocityMs * velocityMs) / (2 * diameterM);
}

/**
 * Calculate velocity pressure (Pa)
 * Pv = 0.5 * ρ * v²
 */
export function calculateVelocityPressure(velocityMs: number): number {
  return 0.5 * AIR_DENSITY_KG_M3 * velocityMs * velocityMs;
}

/**
 * Calculate dynamic loss through fitting (Pa)
 * ΔP = C * Pv where C is loss coefficient
 */
export function calculateFittingLoss(lossCoefficient: number, velocityMs: number): number {
  const velocityPressure = calculateVelocityPressure(velocityMs);
  return lossCoefficient * velocityPressure;
}

/**
 * Calculate total pressure loss for a duct segment (Pa)
 */
export function calculateSegmentPressureLoss(
  airflowM3s: number,
  lengthM: number,
  diameterMm: number,
  fittingLossCoefficients: number[],
  roughnessMm: number = ROUGHNESS_GALVANIZED_MM
): { frictionLoss: number; dynamicLoss: number; totalLoss: number; velocity: number } {
  const area = roundDuctArea(diameterMm);
  const velocity = calculateVelocity(airflowM3s, area);
  const frictionLossPerM = calculateFrictionLoss(velocity, diameterMm, roughnessMm);
  const frictionLoss = frictionLossPerM * lengthM;

  const dynamicLoss = fittingLossCoefficients.reduce(
    (sum, coeff) => sum + calculateFittingLoss(coeff, velocity),
    0
  );

  return {
    frictionLoss,
    dynamicLoss,
    totalLoss: frictionLoss + dynamicLoss,
    velocity,
  };
}

/**
 * Size duct for target friction rate (Equal Friction Method)
 * Returns diameter in mm
 */
export function sizeDuctEqualFriction(
  airflowM3s: number,
  targetFrictionPaPerM: number,
  roughnessMm: number = ROUGHNESS_GALVANIZED_MM
): number {
  if (airflowM3s <= 0 || targetFrictionPaPerM <= 0) return 0;

  // Start with initial guess based on typical velocity
  let diameter = Math.sqrt((4 * airflowM3s) / (Math.PI * 6)) * 1000; // Assume 6 m/s

  // Iterate to find diameter that gives target friction
  for (let i = 0; i < 20; i++) {
    const area = roundDuctArea(diameter);
    const velocity = calculateVelocity(airflowM3s, area);
    const friction = calculateFrictionLoss(velocity, diameter, roughnessMm);

    if (Math.abs(friction - targetFrictionPaPerM) < 0.01) break;

    // Adjust diameter
    const ratio = Math.pow(friction / targetFrictionPaPerM, 0.2);
    diameter = diameter * ratio;
  }

  return Math.round(diameter);
}

/**
 * Size duct for target velocity (Velocity Method)
 * Returns diameter in mm
 */
export function sizeDuctVelocity(
  airflowM3s: number,
  targetVelocityMs: number
): number {
  if (airflowM3s <= 0 || targetVelocityMs <= 0) return 0;

  // A = Q / V, D = sqrt(4A / π)
  const area = airflowM3s / targetVelocityMs;
  const diameter = Math.sqrt((4 * area) / Math.PI) * 1000;

  return Math.round(diameter);
}

/**
 * Static Regain Method - Calculate velocity for downstream section
 * The new velocity should recover friction loss through velocity pressure reduction
 */
export function staticRegainVelocity(
  upstreamVelocity: number,
  segmentLength: number,
  diameterMm: number,
  regainFactor: number = 0.75
): number {
  // Calculate friction loss at upstream velocity
  const frictionLoss = calculateFrictionLoss(upstreamVelocity, diameterMm) * segmentLength;
  
  // Velocity pressure at upstream
  const vpUpstream = calculateVelocityPressure(upstreamVelocity);
  
  // Required velocity pressure reduction (with regain factor)
  const vpReduction = frictionLoss / regainFactor;
  
  // New velocity pressure
  const vpDownstream = Math.max(vpUpstream - vpReduction, calculateVelocityPressure(2)); // Min 2 m/s
  
  // Calculate new velocity from velocity pressure
  return Math.sqrt((2 * vpDownstream) / AIR_DENSITY_KG_M3);
}

/**
 * Size duct using Static Regain method
 */
export function sizeDuctStaticRegain(
  airflowM3s: number,
  upstreamVelocity: number,
  segmentLength: number,
  upstreamDiameter: number,
  regainFactor: number = 0.75
): { diameter: number; velocity: number } {
  const newVelocity = staticRegainVelocity(
    upstreamVelocity,
    segmentLength,
    upstreamDiameter,
    regainFactor
  );

  const diameter = sizeDuctVelocity(airflowM3s, newVelocity);

  return { diameter, velocity: newVelocity };
}

/**
 * Get recommended velocity based on application
 */
export function getRecommendedVelocity(application: string): { min: number; max: number; typical: number } {
  const velocities: Record<string, { min: number; max: number; typical: number }> = {
    main_supply: { min: 6, max: 12, typical: 8 },
    main_return: { min: 5, max: 10, typical: 7 },
    branch_supply: { min: 4, max: 8, typical: 6 },
    branch_return: { min: 4, max: 7, typical: 5 },
    terminal_supply: { min: 3, max: 5, typical: 4 },
    terminal_return: { min: 2.5, max: 4, typical: 3 },
    outdoor_air: { min: 6, max: 10, typical: 8 },
    exhaust: { min: 6, max: 12, typical: 9 },
    kitchen_exhaust: { min: 8, max: 15, typical: 12 },
    industrial: { min: 10, max: 25, typical: 15 },
  };

  return velocities[application] || velocities.branch_supply;
}

/**
 * Round to standard duct size (mm)
 */
export function roundToStandardSize(diameterMm: number): number {
  const standardSizes = [
    100, 125, 150, 175, 200, 225, 250, 280, 315, 355,
    400, 450, 500, 560, 630, 710, 800, 900, 1000, 1120,
    1250, 1400, 1600, 1800, 2000
  ];

  // Find nearest standard size (round up)
  for (const size of standardSizes) {
    if (size >= diameterMm) return size;
  }

  return standardSizes[standardSizes.length - 1];
}

/**
 * Calculate rectangular dimensions for equivalent round duct
 */
export function equivalentRectangular(
  roundDiameterMm: number,
  aspectRatio: number = 2
): { width: number; height: number } {
  // Area of round duct
  const area = roundDuctArea(roundDiameterMm);
  
  // Find width and height with given aspect ratio
  // w * h = Area, w/h = aspectRatio
  // h² * aspectRatio = Area
  const heightM = Math.sqrt(area / aspectRatio);
  const widthM = heightM * aspectRatio;

  // Convert to mm and round to 25mm increments
  const roundTo25 = (mm: number) => Math.ceil(mm / 25) * 25;

  return {
    width: roundTo25(widthM * 1000),
    height: roundTo25(heightM * 1000),
  };
}

/**
 * Get SMACNA gauge thickness based on duct size and pressure class
 */
export function getSmacnaGauge(
  sizeMm: number,
  pressureClassPa: number,
  shape: 'round' | 'rectangular'
): number {
  const gaugeTable = shape === 'round' ? SMACNA_GAUGE_ROUND : SMACNA_GAUGE_RECTANGULAR;
  
  // Find nearest pressure class
  const pressureClasses = Object.keys(gaugeTable).map(Number).sort((a, b) => a - b);
  let selectedClass = pressureClasses[0];
  for (const pc of pressureClasses) {
    if (pressureClassPa >= pc) selectedClass = pc;
  }

  const sizeRanges = gaugeTable[selectedClass];
  
  // Find matching size range
  for (const [range, thickness] of Object.entries(sizeRanges)) {
    const [min, max] = range.split('-').map(Number);
    if (sizeMm >= min && sizeMm <= max) {
      return thickness;
    }
  }

  // Return thickest gauge if size exceeds table
  const thicknesses = Object.values(sizeRanges);
  return thicknesses[thicknesses.length - 1];
}

/**
 * Calculate duct surface area (m²)
 */
export function calculateDuctSurfaceArea(
  lengthM: number,
  diameterMm: number | null,
  widthMm: number | null,
  heightMm: number | null
): number {
  if (diameterMm) {
    // Round duct: circumference × length
    return Math.PI * (diameterMm / 1000) * lengthM;
  } else if (widthMm && heightMm) {
    // Rectangular duct: perimeter × length
    return 2 * ((widthMm / 1000) + (heightMm / 1000)) * lengthM;
  }
  return 0;
}

/**
 * Calculate duct weight (kg)
 */
export function calculateDuctWeight(
  surfaceAreaM2: number,
  thicknessMm: number,
  material: string = 'galvanized_steel'
): number {
  const materialData = DUCT_MATERIALS[material] || DUCT_MATERIALS.galvanized_steel;
  return surfaceAreaM2 * thicknessMm * materialData.density_kg_m2_mm;
}

export interface DuctSystemSummary {
  totalAirflowM3s: number;
  totalAirflowCfm: number;
  totalLengthM: number;
  totalPressureLossPa: number;
  totalSurfaceAreaM2: number;
  totalWeightKg: number;
  criticalPathPressurePa: number;
  averageVelocityMs: number;
  maxVelocityMs: number;
}

/**
 * Calculate system summary metrics
 */
export function calculateSystemSummary(
  segments: Array<{
    airflowM3s: number;
    lengthM: number;
    diameterMm: number;
    widthMm?: number;
    heightMm?: number;
    pressureLossPa: number;
    velocityMs: number;
    thicknessMm: number;
    material?: string;
    isCriticalPath?: boolean;
  }>
): DuctSystemSummary {
  let totalAirflow = 0;
  let totalLength = 0;
  let totalPressure = 0;
  let totalArea = 0;
  let totalWeight = 0;
  let criticalPressure = 0;
  let velocitySum = 0;
  let maxVelocity = 0;

  for (const seg of segments) {
    totalAirflow = Math.max(totalAirflow, seg.airflowM3s); // System CFM is max segment
    totalLength += seg.lengthM;
    totalPressure += seg.pressureLossPa;

    const surfaceArea = calculateDuctSurfaceArea(
      seg.lengthM,
      seg.diameterMm,
      seg.widthMm || null,
      seg.heightMm || null
    );
    totalArea += surfaceArea;
    totalWeight += calculateDuctWeight(surfaceArea, seg.thicknessMm, seg.material);

    if (seg.isCriticalPath) {
      criticalPressure += seg.pressureLossPa;
    }

    velocitySum += seg.velocityMs;
    maxVelocity = Math.max(maxVelocity, seg.velocityMs);
  }

  return {
    totalAirflowM3s: totalAirflow,
    totalAirflowCfm: m3sToCfm(totalAirflow),
    totalLengthM: totalLength,
    totalPressureLossPa: totalPressure,
    totalSurfaceAreaM2: totalArea,
    totalWeightKg: totalWeight,
    criticalPathPressurePa: criticalPressure || totalPressure,
    averageVelocityMs: segments.length > 0 ? velocitySum / segments.length : 0,
    maxVelocityMs: maxVelocity,
  };
}
