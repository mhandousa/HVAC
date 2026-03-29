/**
 * Chiller Selection Calculations Library
 * AHRI-compliant performance data, IPLV calculations, and selection scoring
 */

export type ChillerType = 
  | 'water-cooled-centrifugal' 
  | 'water-cooled-screw' 
  | 'air-cooled-scroll' 
  | 'air-cooled-screw' 
  | 'absorption';

export type CompressorType = 'centrifugal' | 'screw' | 'scroll' | 'reciprocating';

export interface PartLoadCurve {
  pct100: number; // kW/ton at 100% load
  pct75: number;  // kW/ton at 75% load
  pct50: number;  // kW/ton at 50% load
  pct25: number;  // kW/ton at 25% load
}

export interface ChillerCatalogItem {
  id: string;
  manufacturer: string;
  model: string;
  chillerType: ChillerType;
  compressorType: CompressorType;
  refrigerant: string;
  capacityTons: number;
  capacityKw: number;
  eer: number;
  cop: number;
  iplv: number;
  partLoad: PartLoadCurve;
  chwDeltaT: number;
  cwDeltaT: number;
  evapPressureDropFt: number;
  condPressureDropFt: number;
  voltage: string;
  fla: number;
  lra: number;
  powerInputKw: number;
  soundDb: number;
  weightOperatingLbs: number;
  sasoCompliant: boolean;
  ahriCertified: boolean;
  ahriCertNumber?: string;
  listPriceSar: number;
}

export interface ChillerRequirements {
  requiredCapacityTons: number;
  chillerType?: ChillerType;
  chwSupplyF?: number;
  chwReturnF?: number;
  cwSupplyF?: number; // For water-cooled
  ambientDesignF?: number; // For air-cooled
  minIplv?: number;
  minCop?: number;
  maxPowerKw?: number;
  sasoRequired?: boolean;
  manufacturerPreference?: string;
}

export interface ChillerSelectionResult {
  selectedChiller: ChillerCatalogItem;
  fitScore: number; // 0-100
  capacityMatch: {
    required: number;
    selected: number;
    percentOver: number;
  };
  efficiencyAnalysis: {
    eer: number;
    cop: number;
    iplv: number;
    ashrae90_1_baseline: number;
    percentBetterThanBaseline: number;
  };
  partLoadPerformance: {
    load100: { percent: number; kwPerTon: number; inputKw: number };
    load75: { percent: number; kwPerTon: number; inputKw: number };
    load50: { percent: number; kwPerTon: number; inputKw: number };
    load25: { percent: number; kwPerTon: number; inputKw: number };
  };
  annualEnergyEstimate: {
    equivalentFullLoadHours: number;
    annualKwh: number;
    annualCostSar: number;
  };
  alternates: ChillerCatalogItem[];
  warnings: string[];
}

// ASHRAE 90.1-2019 minimum efficiency baselines (Path B)
export const ASHRAE_90_1_MINIMUMS: Record<ChillerType, { eer: number; iplv: number; cop: number }> = {
  'water-cooled-centrifugal': { eer: 6.10, iplv: 9.70, cop: 6.10 },
  'water-cooled-screw': { eer: 5.50, iplv: 9.30, cop: 5.50 },
  'air-cooled-scroll': { eer: 3.10, iplv: 4.60, cop: 3.10 },
  'air-cooled-screw': { eer: 3.00, iplv: 4.40, cop: 3.00 },
  'absorption': { eer: 0.70, iplv: 0.80, cop: 0.70 },
};

// Representative chiller catalog with AHRI-compliant data
export const CHILLER_CATALOG: ChillerCatalogItem[] = [
  // Water-Cooled Centrifugal Chillers
  {
    id: 'carrier-19xr-350',
    manufacturer: 'Carrier',
    model: '19XR-0350',
    chillerType: 'water-cooled-centrifugal',
    compressorType: 'centrifugal',
    refrigerant: 'R-134a',
    capacityTons: 350,
    capacityKw: 1231,
    eer: 6.40,
    cop: 6.40,
    iplv: 10.20,
    partLoad: { pct100: 0.540, pct75: 0.480, pct50: 0.420, pct25: 0.380 },
    chwDeltaT: 10,
    cwDeltaT: 10,
    evapPressureDropFt: 15.2,
    condPressureDropFt: 12.8,
    voltage: '380V/3Ph/50Hz',
    fla: 285,
    lra: 1450,
    powerInputKw: 189,
    soundDb: 85,
    weightOperatingLbs: 12500,
    sasoCompliant: true,
    ahriCertified: true,
    ahriCertNumber: 'AHRI-2024-001',
    listPriceSar: 485000,
  },
  {
    id: 'carrier-19xr-500',
    manufacturer: 'Carrier',
    model: '19XR-0500',
    chillerType: 'water-cooled-centrifugal',
    compressorType: 'centrifugal',
    refrigerant: 'R-134a',
    capacityTons: 500,
    capacityKw: 1758,
    eer: 6.50,
    cop: 6.50,
    iplv: 10.50,
    partLoad: { pct100: 0.530, pct75: 0.465, pct50: 0.410, pct25: 0.370 },
    chwDeltaT: 10,
    cwDeltaT: 10,
    evapPressureDropFt: 16.5,
    condPressureDropFt: 14.2,
    voltage: '380V/3Ph/50Hz',
    fla: 385,
    lra: 1950,
    powerInputKw: 265,
    soundDb: 87,
    weightOperatingLbs: 16800,
    sasoCompliant: true,
    ahriCertified: true,
    ahriCertNumber: 'AHRI-2024-002',
    listPriceSar: 625000,
  },
  {
    id: 'trane-cvhf-400',
    manufacturer: 'Trane',
    model: 'CVHF-400',
    chillerType: 'water-cooled-centrifugal',
    compressorType: 'centrifugal',
    refrigerant: 'R-134a',
    capacityTons: 400,
    capacityKw: 1407,
    eer: 6.35,
    cop: 6.35,
    iplv: 10.10,
    partLoad: { pct100: 0.545, pct75: 0.485, pct50: 0.425, pct25: 0.385 },
    chwDeltaT: 10,
    cwDeltaT: 10,
    evapPressureDropFt: 15.8,
    condPressureDropFt: 13.5,
    voltage: '380V/3Ph/50Hz',
    fla: 320,
    lra: 1620,
    powerInputKw: 218,
    soundDb: 86,
    weightOperatingLbs: 14200,
    sasoCompliant: true,
    ahriCertified: true,
    ahriCertNumber: 'AHRI-2024-010',
    listPriceSar: 545000,
  },
  {
    id: 'york-yk-450',
    manufacturer: 'York',
    model: 'YK-0450-EP',
    chillerType: 'water-cooled-centrifugal',
    compressorType: 'centrifugal',
    refrigerant: 'R-134a',
    capacityTons: 450,
    capacityKw: 1582,
    eer: 6.45,
    cop: 6.45,
    iplv: 10.35,
    partLoad: { pct100: 0.535, pct75: 0.472, pct50: 0.415, pct25: 0.375 },
    chwDeltaT: 10,
    cwDeltaT: 10,
    evapPressureDropFt: 16.0,
    condPressureDropFt: 13.8,
    voltage: '380V/3Ph/50Hz',
    fla: 355,
    lra: 1780,
    powerInputKw: 241,
    soundDb: 86,
    weightOperatingLbs: 15500,
    sasoCompliant: true,
    ahriCertified: true,
    ahriCertNumber: 'AHRI-2024-020',
    listPriceSar: 585000,
  },
  // Water-Cooled Screw Chillers
  {
    id: 'carrier-30xw-200',
    manufacturer: 'Carrier',
    model: '30XW-0200',
    chillerType: 'water-cooled-screw',
    compressorType: 'screw',
    refrigerant: 'R-134a',
    capacityTons: 200,
    capacityKw: 703,
    eer: 5.80,
    cop: 5.80,
    iplv: 9.60,
    partLoad: { pct100: 0.595, pct75: 0.520, pct50: 0.455, pct25: 0.410 },
    chwDeltaT: 10,
    cwDeltaT: 10,
    evapPressureDropFt: 12.5,
    condPressureDropFt: 10.8,
    voltage: '380V/3Ph/50Hz',
    fla: 175,
    lra: 890,
    powerInputKw: 121,
    soundDb: 82,
    weightOperatingLbs: 8500,
    sasoCompliant: true,
    ahriCertified: true,
    ahriCertNumber: 'AHRI-2024-030',
    listPriceSar: 295000,
  },
  {
    id: 'trane-rtwd-250',
    manufacturer: 'Trane',
    model: 'RTWD-250',
    chillerType: 'water-cooled-screw',
    compressorType: 'screw',
    refrigerant: 'R-134a',
    capacityTons: 250,
    capacityKw: 879,
    eer: 5.75,
    cop: 5.75,
    iplv: 9.50,
    partLoad: { pct100: 0.600, pct75: 0.525, pct50: 0.460, pct25: 0.415 },
    chwDeltaT: 10,
    cwDeltaT: 10,
    evapPressureDropFt: 13.2,
    condPressureDropFt: 11.5,
    voltage: '380V/3Ph/50Hz',
    fla: 215,
    lra: 1080,
    powerInputKw: 150,
    soundDb: 83,
    weightOperatingLbs: 10200,
    sasoCompliant: true,
    ahriCertified: true,
    ahriCertNumber: 'AHRI-2024-035',
    listPriceSar: 345000,
  },
  // Air-Cooled Screw Chillers
  {
    id: 'carrier-30xa-150',
    manufacturer: 'Carrier',
    model: '30XA-0150',
    chillerType: 'air-cooled-screw',
    compressorType: 'screw',
    refrigerant: 'R-410A',
    capacityTons: 150,
    capacityKw: 527,
    eer: 3.15,
    cop: 3.15,
    iplv: 4.65,
    partLoad: { pct100: 1.095, pct75: 0.950, pct50: 0.840, pct25: 0.760 },
    chwDeltaT: 10,
    cwDeltaT: 0,
    evapPressureDropFt: 10.5,
    condPressureDropFt: 0,
    voltage: '380V/3Ph/50Hz',
    fla: 245,
    lra: 1200,
    powerInputKw: 164,
    soundDb: 88,
    weightOperatingLbs: 9800,
    sasoCompliant: true,
    ahriCertified: true,
    ahriCertNumber: 'AHRI-2024-040',
    listPriceSar: 265000,
  },
  {
    id: 'trane-rtac-200',
    manufacturer: 'Trane',
    model: 'RTAC-200',
    chillerType: 'air-cooled-screw',
    compressorType: 'screw',
    refrigerant: 'R-410A',
    capacityTons: 200,
    capacityKw: 703,
    eer: 3.10,
    cop: 3.10,
    iplv: 4.55,
    partLoad: { pct100: 1.115, pct75: 0.965, pct50: 0.855, pct25: 0.775 },
    chwDeltaT: 10,
    cwDeltaT: 0,
    evapPressureDropFt: 11.2,
    condPressureDropFt: 0,
    voltage: '380V/3Ph/50Hz',
    fla: 325,
    lra: 1580,
    powerInputKw: 222,
    soundDb: 89,
    weightOperatingLbs: 12400,
    sasoCompliant: true,
    ahriCertified: true,
    ahriCertNumber: 'AHRI-2024-045',
    listPriceSar: 325000,
  },
  // Air-Cooled Scroll Chillers
  {
    id: 'carrier-30rb-080',
    manufacturer: 'Carrier',
    model: '30RB-080',
    chillerType: 'air-cooled-scroll',
    compressorType: 'scroll',
    refrigerant: 'R-410A',
    capacityTons: 80,
    capacityKw: 281,
    eer: 3.25,
    cop: 3.25,
    iplv: 4.80,
    partLoad: { pct100: 1.065, pct75: 0.920, pct50: 0.810, pct25: 0.730 },
    chwDeltaT: 10,
    cwDeltaT: 0,
    evapPressureDropFt: 8.5,
    condPressureDropFt: 0,
    voltage: '380V/3Ph/50Hz',
    fla: 125,
    lra: 640,
    powerInputKw: 85,
    soundDb: 80,
    weightOperatingLbs: 4200,
    sasoCompliant: true,
    ahriCertified: true,
    ahriCertNumber: 'AHRI-2024-050',
    listPriceSar: 145000,
  },
  {
    id: 'trane-cgam-100',
    manufacturer: 'Trane',
    model: 'CGAM-100',
    chillerType: 'air-cooled-scroll',
    compressorType: 'scroll',
    refrigerant: 'R-410A',
    capacityTons: 100,
    capacityKw: 352,
    eer: 3.20,
    cop: 3.20,
    iplv: 4.70,
    partLoad: { pct100: 1.080, pct75: 0.935, pct50: 0.825, pct25: 0.745 },
    chwDeltaT: 10,
    cwDeltaT: 0,
    evapPressureDropFt: 9.2,
    condPressureDropFt: 0,
    voltage: '380V/3Ph/50Hz',
    fla: 155,
    lra: 780,
    powerInputKw: 108,
    soundDb: 81,
    weightOperatingLbs: 5100,
    sasoCompliant: true,
    ahriCertified: true,
    ahriCertNumber: 'AHRI-2024-055',
    listPriceSar: 175000,
  },
];

/**
 * AHRI 551/591 Standard Rating Conditions
 */
export const AHRI_STANDARD_CONDITIONS = {
  waterCooled: {
    lchwt: 44, // Leaving Chilled Water Temperature (°F)
    ecwt: 85,  // Entering Condenser Water Temperature (°F)
  },
  airCooled: {
    lchwt: 44, // Leaving Chilled Water Temperature (°F)
    ambient: 95, // Entering Air Temperature (°F)
  },
};

/**
 * AHRI 551/591 Temperature Correction Factors
 * These represent approximate efficiency change per degree Fahrenheit deviation from standard conditions
 */
export const AHRI_CORRECTION_FACTORS = {
  lchwt: 0.015,    // ~1.5% per °F change in LCHWT (lower temp = harder to reach = less efficient)
  ecwt: 0.012,     // ~1.2% per °F change in ECWT (higher temp = harder to reject heat = less efficient)
  ambient: 0.008,  // ~0.8% per °F change in ambient (higher temp = less efficient)
};

export interface AdjustedIplvResult {
  baseIplv: number;
  adjustedIplv: number;
  correctionFactor: number;
  corrections: {
    lchwt: { deviation: number; effect: number };
    ecwt?: { deviation: number; effect: number };
    ambient?: { deviation: number; effect: number };
  };
  explanation: string;
}

/**
 * Calculate temperature-adjusted IPLV per AHRI 551/591
 * Adjusts base IPLV rating for actual operating conditions
 */
export function calculateAdjustedIplv(
  baseIplv: number,
  chillerType: ChillerType,
  actualLchwt: number,
  actualEcwt?: number,
  actualAmbient?: number
): AdjustedIplvResult {
  const isWaterCooled = chillerType.startsWith('water-cooled');
  const standardConditions = isWaterCooled 
    ? AHRI_STANDARD_CONDITIONS.waterCooled 
    : AHRI_STANDARD_CONDITIONS.airCooled;
  
  const corrections: AdjustedIplvResult['corrections'] = {
    lchwt: { deviation: 0, effect: 0 },
  };
  
  let totalCorrectionFactor = 1.0;
  const explanationParts: string[] = [];
  
  // LCHWT correction (lower temp = less efficient, higher temp = more efficient)
  const lchwDeviation = actualLchwt - standardConditions.lchwt;
  if (lchwDeviation !== 0) {
    // Positive deviation (warmer leaving water) = easier = more efficient
    // Negative deviation (colder leaving water) = harder = less efficient
    const lchwEffect = lchwDeviation * AHRI_CORRECTION_FACTORS.lchwt;
    corrections.lchwt = { deviation: lchwDeviation, effect: lchwEffect };
    totalCorrectionFactor += lchwEffect;
    
    if (lchwDeviation > 0) {
      explanationParts.push(`+${(lchwEffect * 100).toFixed(1)}% from ${lchwDeviation}°F warmer LCHWT`);
    } else {
      explanationParts.push(`${(lchwEffect * 100).toFixed(1)}% from ${Math.abs(lchwDeviation)}°F colder LCHWT`);
    }
  }
  
  // ECWT correction for water-cooled (higher temp = less efficient)
  if (isWaterCooled && actualEcwt !== undefined) {
    const wcConditions = standardConditions as typeof AHRI_STANDARD_CONDITIONS.waterCooled;
    const ecwtDeviation = actualEcwt - wcConditions.ecwt;
    if (ecwtDeviation !== 0) {
      // Positive deviation (warmer condenser water) = harder to reject heat = less efficient
      // Negative deviation (colder condenser water) = easier to reject heat = more efficient
      const ecwtEffect = -ecwtDeviation * AHRI_CORRECTION_FACTORS.ecwt;
      corrections.ecwt = { deviation: ecwtDeviation, effect: ecwtEffect };
      totalCorrectionFactor += ecwtEffect;
      
      if (ecwtDeviation > 0) {
        explanationParts.push(`${(ecwtEffect * 100).toFixed(1)}% from ${ecwtDeviation}°F warmer ECWT`);
      } else {
        explanationParts.push(`+${(-ecwtEffect * 100).toFixed(1)}% from ${Math.abs(ecwtDeviation)}°F colder ECWT`);
      }
    }
  }
  
  // Ambient correction for air-cooled (higher temp = less efficient)
  if (!isWaterCooled && actualAmbient !== undefined) {
    const ambientDeviation = actualAmbient - (standardConditions as typeof AHRI_STANDARD_CONDITIONS.airCooled).ambient;
    if (ambientDeviation !== 0) {
      // Positive deviation (hotter ambient) = harder to reject heat = less efficient
      // Negative deviation (cooler ambient) = easier = more efficient
      const ambientEffect = -ambientDeviation * AHRI_CORRECTION_FACTORS.ambient;
      corrections.ambient = { deviation: ambientDeviation, effect: ambientEffect };
      totalCorrectionFactor += ambientEffect;
      
      if (ambientDeviation > 0) {
        explanationParts.push(`${(ambientEffect * 100).toFixed(1)}% from ${ambientDeviation}°F warmer ambient`);
      } else {
        explanationParts.push(`+${(-ambientEffect * 100).toFixed(1)}% from ${Math.abs(ambientDeviation)}°F cooler ambient`);
      }
    }
  }
  
  const adjustedIplv = baseIplv * totalCorrectionFactor;
  const explanation = explanationParts.length > 0 
    ? `Adjusted IPLV: ${explanationParts.join(', ')}`
    : 'Operating at AHRI standard conditions';
  
  return {
    baseIplv,
    adjustedIplv: Math.round(adjustedIplv * 100) / 100,
    correctionFactor: Math.round((totalCorrectionFactor - 1) * 10000) / 100, // as percentage
    corrections,
    explanation,
  };
}

/**
 * Calculate IPLV (Integrated Part Load Value) per AHRI Standard 551/591
 * Weighting: 1% at 100%, 42% at 75%, 45% at 50%, 12% at 25%
 */
export function calculateIplv(partLoad: PartLoadCurve): number {
  // IPLV = 1/(0.01/A + 0.42/B + 0.45/C + 0.12/D)
  // where A, B, C, D are EER at 100%, 75%, 50%, 25% load
  // EER = 12/kW per ton
  const eerAt100 = 12 / partLoad.pct100;
  const eerAt75 = 12 / partLoad.pct75;
  const eerAt50 = 12 / partLoad.pct50;
  const eerAt25 = 12 / partLoad.pct25;
  
  const iplv = 1 / (0.01 / eerAt100 + 0.42 / eerAt75 + 0.45 / eerAt50 + 0.12 / eerAt25);
  return Math.round(iplv * 100) / 100;
}

/**
 * Calculate kW/ton at a specific part load percentage (linear interpolation)
 */
export function calculatePartLoadKwPerTon(partLoad: PartLoadCurve, loadPercent: number): number {
  if (loadPercent >= 100) return partLoad.pct100;
  if (loadPercent <= 25) return partLoad.pct25;
  
  if (loadPercent >= 75) {
    const ratio = (loadPercent - 75) / 25;
    return partLoad.pct75 + ratio * (partLoad.pct100 - partLoad.pct75);
  } else if (loadPercent >= 50) {
    const ratio = (loadPercent - 50) / 25;
    return partLoad.pct50 + ratio * (partLoad.pct75 - partLoad.pct50);
  } else {
    const ratio = (loadPercent - 25) / 25;
    return partLoad.pct25 + ratio * (partLoad.pct50 - partLoad.pct25);
  }
}

/**
 * Calculate chilled water flow rate (GPM)
 */
export function calculateChwFlowGpm(capacityTons: number, deltaT: number = 10): number {
  // GPM = (Tons × 24) / ΔT
  return (capacityTons * 24) / deltaT;
}

/**
 * Calculate condenser water flow rate (GPM)
 */
export function calculateCwFlowGpm(capacityTons: number, deltaT: number = 10, heatRejectionFactor: number = 1.15): number {
  // Heat rejection = capacity + power input ≈ 1.15 × capacity for typical chillers
  // GPM = (Tons × 24 × heatRejectionFactor) / ΔT
  return (capacityTons * 24 * heatRejectionFactor) / deltaT;
}

/**
 * Estimate annual energy consumption
 */
export function calculateAnnualEnergy(
  capacityTons: number,
  partLoad: PartLoadCurve,
  equivalentFullLoadHours: number = 2500,
  electricityRateSarPerKwh: number = 0.18
): { annualKwh: number; annualCostSar: number } {
  // Use weighted average kW/ton based on typical load profile
  // Approximate: 5% at 100%, 30% at 75%, 40% at 50%, 25% at 25%
  const weightedKwPerTon = 
    0.05 * partLoad.pct100 + 
    0.30 * partLoad.pct75 + 
    0.40 * partLoad.pct50 + 
    0.25 * partLoad.pct25;
  
  const averageKw = capacityTons * weightedKwPerTon;
  const annualKwh = averageKw * equivalentFullLoadHours;
  const annualCostSar = annualKwh * electricityRateSarPerKwh;
  
  return {
    annualKwh: Math.round(annualKwh),
    annualCostSar: Math.round(annualCostSar),
  };
}

/**
 * Calculate fit score for a chiller against requirements (0-100)
 */
export function calculateFitScore(chiller: ChillerCatalogItem, requirements: ChillerRequirements): number {
  let score = 100;
  const warnings: string[] = [];
  
  // Capacity match (25 points) - prefer 10-20% oversized
  const capacityRatio = chiller.capacityTons / requirements.requiredCapacityTons;
  if (capacityRatio < 1.0) {
    score -= 25 * (1 - capacityRatio); // Undersized penalty
  } else if (capacityRatio > 1.5) {
    score -= 15; // Over 50% oversized penalty
  } else if (capacityRatio >= 1.1 && capacityRatio <= 1.2) {
    score += 5; // Bonus for ideal sizing
  }
  
  // Efficiency (25 points)
  const baseline = ASHRAE_90_1_MINIMUMS[chiller.chillerType];
  if (chiller.iplv > baseline.iplv * 1.15) {
    score += 10; // High efficiency bonus
  } else if (chiller.iplv < baseline.iplv) {
    score -= 20; // Below code minimum
  }
  
  // IPLV target match (15 points)
  if (requirements.minIplv && chiller.iplv < requirements.minIplv) {
    score -= 15;
  }
  
  // SASO compliance (10 points)
  if (requirements.sasoRequired && !chiller.sasoCompliant) {
    score -= 10;
  }
  
  // AHRI certification (5 points)
  if (!chiller.ahriCertified) {
    score -= 5;
  }
  
  // Manufacturer preference (5 points)
  if (requirements.manufacturerPreference && 
      chiller.manufacturer.toLowerCase() !== requirements.manufacturerPreference.toLowerCase()) {
    score -= 5;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Select the best chiller from catalog based on requirements
 */
export function selectChiller(requirements: ChillerRequirements): ChillerSelectionResult | null {
  // Filter by chiller type if specified
  let candidates = requirements.chillerType 
    ? CHILLER_CATALOG.filter(c => c.chillerType === requirements.chillerType)
    : CHILLER_CATALOG;
  
  // Filter by capacity (80% to 150% of required)
  candidates = candidates.filter(c => 
    c.capacityTons >= requirements.requiredCapacityTons * 0.8 &&
    c.capacityTons <= requirements.requiredCapacityTons * 1.5
  );
  
  if (candidates.length === 0) {
    return null;
  }
  
  // Score all candidates
  const scored = candidates.map(c => ({
    chiller: c,
    score: calculateFitScore(c, requirements),
  })).sort((a, b) => b.score - a.score);
  
  const selected = scored[0].chiller;
  const baseline = ASHRAE_90_1_MINIMUMS[selected.chillerType];
  const warnings: string[] = [];
  
  // Generate warnings
  if (selected.capacityTons < requirements.requiredCapacityTons) {
    warnings.push(`Selected capacity (${selected.capacityTons} tons) is below required (${requirements.requiredCapacityTons} tons)`);
  }
  if (selected.iplv < baseline.iplv) {
    warnings.push(`IPLV (${selected.iplv}) is below ASHRAE 90.1 minimum (${baseline.iplv})`);
  }
  if (requirements.sasoRequired && !selected.sasoCompliant) {
    warnings.push('Chiller is not SASO certified');
  }
  
  // Calculate energy estimates
  const annualEnergy = calculateAnnualEnergy(selected.capacityTons, selected.partLoad);
  
  return {
    selectedChiller: selected,
    fitScore: scored[0].score,
    capacityMatch: {
      required: requirements.requiredCapacityTons,
      selected: selected.capacityTons,
      percentOver: Math.round((selected.capacityTons / requirements.requiredCapacityTons - 1) * 100),
    },
    efficiencyAnalysis: {
      eer: selected.eer,
      cop: selected.cop,
      iplv: selected.iplv,
      ashrae90_1_baseline: baseline.iplv,
      percentBetterThanBaseline: Math.round((selected.iplv / baseline.iplv - 1) * 100),
    },
    partLoadPerformance: {
      load100: { percent: 100, kwPerTon: selected.partLoad.pct100, inputKw: selected.capacityTons * selected.partLoad.pct100 },
      load75: { percent: 75, kwPerTon: selected.partLoad.pct75, inputKw: selected.capacityTons * 0.75 * selected.partLoad.pct75 },
      load50: { percent: 50, kwPerTon: selected.partLoad.pct50, inputKw: selected.capacityTons * 0.50 * selected.partLoad.pct50 },
      load25: { percent: 25, kwPerTon: selected.partLoad.pct25, inputKw: selected.capacityTons * 0.25 * selected.partLoad.pct25 },
    },
    annualEnergyEstimate: {
      equivalentFullLoadHours: 2500,
      ...annualEnergy,
    },
    alternates: scored.slice(1, 4).map(s => s.chiller),
    warnings,
  };
}

/**
 * Get all chillers matching a type filter
 */
export function getChillersByType(chillerType?: ChillerType): ChillerCatalogItem[] {
  if (!chillerType) return CHILLER_CATALOG;
  return CHILLER_CATALOG.filter(c => c.chillerType === chillerType);
}

/**
 * Get chiller type display name
 */
export function getChillerTypeDisplayName(type: ChillerType): string {
  const names: Record<ChillerType, string> = {
    'water-cooled-centrifugal': 'Water-Cooled Centrifugal',
    'water-cooled-screw': 'Water-Cooled Screw',
    'air-cooled-scroll': 'Air-Cooled Scroll',
    'air-cooled-screw': 'Air-Cooled Screw',
    'absorption': 'Absorption',
  };
  return names[type];
}

/**
 * Get all unique manufacturers from catalog
 */
export function getManufacturers(): string[] {
  return [...new Set(CHILLER_CATALOG.map(c => c.manufacturer))].sort();
}

/**
 * Get capacity range from catalog
 */
export function getCapacityRange(chillerType?: ChillerType): { min: number; max: number } {
  const filtered = chillerType 
    ? CHILLER_CATALOG.filter(c => c.chillerType === chillerType)
    : CHILLER_CATALOG;
  
  if (filtered.length === 0) {
    return { min: 0, max: 0 };
  }
  
  return {
    min: Math.min(...filtered.map(c => c.capacityTons)),
    max: Math.max(...filtered.map(c => c.capacityTons)),
  };
}
