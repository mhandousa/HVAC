/**
 * Boiler Selection Calculations Library
 * ASHRAE-compliant efficiency ratings, fuel consumption, and selection scoring
 */

export type BoilerType = 
  | 'condensing-gas'
  | 'non-condensing-gas'
  | 'oil-fired'
  | 'electric'
  | 'steam';

export type FuelType = 'natural-gas' | 'propane' | 'fuel-oil' | 'electric';

export interface BoilerCatalogItem {
  id: string;
  manufacturer: string;
  model: string;
  boilerType: BoilerType;
  fuelType: FuelType;
  capacityBtuh: number;
  capacityKw: number;
  afue: number;              // Annual Fuel Utilization Efficiency (%)
  thermalEfficiency: number; // Steady-state thermal efficiency (%)
  combustionEfficiency: number;
  turndownRatio: number;     // e.g., 10:1 = 10
  minModulation: number;     // Minimum firing rate (%)
  supplyTempRange: { min: number; max: number };
  returnTempRange: { min: number; max: number };
  voltage: string;
  fla: number;               // Full Load Amps
  noxEmissions: number;      // ppm
  soundDb: number;
  weightLbs: number;
  asmeCompliant: boolean;
  ahriCertified: boolean;
  ahriCertNumber?: string;
  listPriceSar: number;
}

export interface BoilerRequirements {
  requiredCapacityBtuh: number;
  boilerType?: BoilerType;
  fuelType?: FuelType;
  hwSupplyTempF?: number;
  hwReturnTempF?: number;
  combustionAirTempF?: number;  // Optional: entering combustion air temperature
  minAfue?: number;
  minTurndown?: number;
  asmeRequired?: boolean;
  manufacturerPreference?: string;
}

export interface BoilerSelectionResult {
  selectedBoiler: BoilerCatalogItem;
  fitScore: number;
  capacityMatch: {
    required: number;
    selected: number;
    percentOver: number;
  };
  efficiencyAnalysis: {
    afue: number;
    thermalEfficiency: number;
    ashrae90_1_baseline: number;
    percentBetterThanBaseline: number;
  };
  operatingCosts: {
    annualFuelConsumption: number;
    annualFuelCostSar: number;
    electricityCostSar: number;
    totalAnnualCostSar: number;
  };
  alternates: BoilerCatalogItem[];
  warnings: string[];
}

// ASHRAE 90.1-2019 Minimum Efficiency Standards for Boilers
// Values are thermal efficiency percentages
export const ASHRAE_90_1_BOILER_MINIMUMS: Record<BoilerType, { thermalEfficiency: number; afue: number }> = {
  'condensing-gas': { thermalEfficiency: 90, afue: 90 },
  'non-condensing-gas': { thermalEfficiency: 80, afue: 80 },
  'oil-fired': { thermalEfficiency: 82, afue: 82 },
  'electric': { thermalEfficiency: 99, afue: 99 },
  'steam': { thermalEfficiency: 77, afue: 77 },
};

// AHRI 1500 Standard Rating Conditions for Boilers
export const AHRI_STANDARD_CONDITIONS_BOILER = {
  condensing: {
    hwSupplyTemp: 180,    // Standard HW Supply (°F)
    hwReturnTemp: 160,    // Standard HW Return (°F) - 20°F ΔT
    combustionAirTemp: 60, // Standard entering air (°F)
  },
  nonCondensing: {
    hwSupplyTemp: 180,
    hwReturnTemp: 140,    // 40°F ΔT typical for non-condensing
    combustionAirTemp: 60,
  },
};

// Efficiency correction factors per degree Fahrenheit deviation
// Based on AHRI 1500 and industry field data
export const BOILER_CORRECTION_FACTORS = {
  // Condensing boilers: lower return temp = more condensation = higher efficiency
  returnTemp: 0.004,      // ~0.4% per °F (lower return = better for condensing)
  combustionAir: 0.002,   // ~0.2% per °F (colder air = slightly less efficient)
  supplyTemp: 0.003,      // ~0.3% per °F (higher supply = more stack loss)
};

// Condensing threshold temperature - below this, flue gas condensation occurs
export const CONDENSING_THRESHOLD_TEMP = 130; // °F

export interface AdjustedBoilerEfficiencyResult {
  baseAfue: number;
  adjustedAfue: number;
  correctionFactor: number; // Total correction as percentage
  corrections: {
    returnTemp: { deviation: number; effect: number };
    combustionAir: { deviation: number; effect: number };
  };
  explanation: string;
  isCondensing: boolean;
  isCondensingMode: boolean; // True when return temp is below condensing threshold
}

/**
 * Calculate adjusted boiler efficiency based on actual operating conditions
 * Applies AHRI 1500 correction methodology for field conditions
 */
export function calculateAdjustedBoilerEfficiency(
  baseAfue: number,
  boilerType: BoilerType,
  actualReturnTempF: number,
  actualSupplyTempF?: number,
  combustionAirTempF?: number
): AdjustedBoilerEfficiencyResult {
  const isCondensing = boilerType === 'condensing-gas';
  const standard = isCondensing 
    ? AHRI_STANDARD_CONDITIONS_BOILER.condensing 
    : AHRI_STANDARD_CONDITIONS_BOILER.nonCondensing;
  
  // Return temperature deviation (positive = lower than standard = better for condensing)
  const returnDeviation = standard.hwReturnTemp - actualReturnTempF;
  
  // Combustion air deviation (positive = colder than standard = slight efficiency loss)
  const combustionDeviation = combustionAirTempF !== undefined 
    ? standard.combustionAirTemp - combustionAirTempF 
    : 0;
  
  // Calculate efficiency effects
  let returnEffect = 0;
  if (isCondensing) {
    // Condensing boilers gain significant efficiency with lower return temps
    // Effect is stronger when below condensing threshold
    if (actualReturnTempF < CONDENSING_THRESHOLD_TEMP) {
      returnEffect = returnDeviation * BOILER_CORRECTION_FACTORS.returnTemp * 1.5; // Enhanced effect
    } else {
      returnEffect = returnDeviation * BOILER_CORRECTION_FACTORS.returnTemp;
    }
  } else {
    // Non-condensing boilers have minimal effect (and must avoid condensation)
    returnEffect = returnDeviation * BOILER_CORRECTION_FACTORS.returnTemp * 0.3;
  }
  
  // Combustion air effect (colder air = slightly lower efficiency)
  const combustionEffect = -combustionDeviation * BOILER_CORRECTION_FACTORS.combustionAir;
  
  // Total correction factor
  const totalCorrection = returnEffect + combustionEffect;
  
  // Calculate adjusted AFUE
  const adjustedAfue = Math.min(99.5, Math.max(baseAfue * 0.9, baseAfue * (1 + totalCorrection / 100)));
  
  // Determine if in condensing mode
  const isCondensingMode = isCondensing && actualReturnTempF < CONDENSING_THRESHOLD_TEMP;
  
  // Build explanation
  const explanationParts: string[] = [];
  if (Math.abs(returnEffect) > 0.1) {
    if (returnEffect > 0) {
      explanationParts.push(`+${returnEffect.toFixed(1)}% from ${Math.abs(returnDeviation).toFixed(0)}°F lower return water temp`);
    } else {
      explanationParts.push(`${returnEffect.toFixed(1)}% from ${Math.abs(returnDeviation).toFixed(0)}°F higher return water temp`);
    }
  }
  if (Math.abs(combustionEffect) > 0.1) {
    if (combustionEffect > 0) {
      explanationParts.push(`+${combustionEffect.toFixed(1)}% from warmer combustion air`);
    } else {
      explanationParts.push(`${combustionEffect.toFixed(1)}% from ${Math.abs(combustionDeviation).toFixed(0)}°F colder combustion air`);
    }
  }
  
  return {
    baseAfue,
    adjustedAfue: Math.round(adjustedAfue * 10) / 10,
    correctionFactor: Math.round(totalCorrection * 10) / 10,
    corrections: {
      returnTemp: { deviation: returnDeviation, effect: Math.round(returnEffect * 10) / 10 },
      combustionAir: { deviation: combustionDeviation, effect: Math.round(combustionEffect * 10) / 10 },
    },
    explanation: explanationParts.join('; ') || 'Operating at standard rating conditions',
    isCondensing,
    isCondensingMode,
  };
}

// Fuel costs (SAR per unit) - Saudi Arabia typical rates
export const FUEL_COSTS_SAR = {
  'natural-gas': 0.12,      // SAR per cubic foot
  'propane': 0.85,          // SAR per liter
  'fuel-oil': 0.65,         // SAR per liter
  'electric': 0.18,         // SAR per kWh
};

// Fuel heating values
export const FUEL_HEATING_VALUES = {
  'natural-gas': 1030,      // BTU per cubic foot
  'propane': 91500,         // BTU per gallon (converted from liters)
  'fuel-oil': 138500,       // BTU per gallon (converted from liters)
  'electric': 3412,         // BTU per kWh
};

// Representative boiler catalog with AHRI-compliant data
export const BOILER_CATALOG: BoilerCatalogItem[] = [
  // Condensing Gas Boilers
  {
    id: 'lochinvar-knight-500',
    manufacturer: 'Lochinvar',
    model: 'Knight XL 500',
    boilerType: 'condensing-gas',
    fuelType: 'natural-gas',
    capacityBtuh: 500000,
    capacityKw: 146.5,
    afue: 96,
    thermalEfficiency: 95.5,
    combustionEfficiency: 97,
    turndownRatio: 10,
    minModulation: 10,
    supplyTempRange: { min: 70, max: 180 },
    returnTempRange: { min: 60, max: 160 },
    voltage: '120V/1Ph/60Hz',
    fla: 8,
    noxEmissions: 20,
    soundDb: 55,
    weightLbs: 485,
    asmeCompliant: true,
    ahriCertified: true,
    ahriCertNumber: 'AHRI-B-2024-001',
    listPriceSar: 45000,
  },
  {
    id: 'lochinvar-knight-850',
    manufacturer: 'Lochinvar',
    model: 'Knight XL 850',
    boilerType: 'condensing-gas',
    fuelType: 'natural-gas',
    capacityBtuh: 850000,
    capacityKw: 249.0,
    afue: 96,
    thermalEfficiency: 95.3,
    combustionEfficiency: 97,
    turndownRatio: 10,
    minModulation: 10,
    supplyTempRange: { min: 70, max: 180 },
    returnTempRange: { min: 60, max: 160 },
    voltage: '120V/1Ph/60Hz',
    fla: 10,
    noxEmissions: 20,
    soundDb: 58,
    weightLbs: 650,
    asmeCompliant: true,
    ahriCertified: true,
    ahriCertNumber: 'AHRI-B-2024-002',
    listPriceSar: 68000,
  },
  {
    id: 'lochinvar-crest-1000',
    manufacturer: 'Lochinvar',
    model: 'CREST 1000',
    boilerType: 'condensing-gas',
    fuelType: 'natural-gas',
    capacityBtuh: 1000000,
    capacityKw: 293.1,
    afue: 97,
    thermalEfficiency: 96.5,
    combustionEfficiency: 98,
    turndownRatio: 15,
    minModulation: 7,
    supplyTempRange: { min: 70, max: 185 },
    returnTempRange: { min: 60, max: 165 },
    voltage: '120V/1Ph/60Hz',
    fla: 12,
    noxEmissions: 15,
    soundDb: 60,
    weightLbs: 780,
    asmeCompliant: true,
    ahriCertified: true,
    ahriCertNumber: 'AHRI-B-2024-003',
    listPriceSar: 85000,
  },
  {
    id: 'weil-mclain-evergreen-750',
    manufacturer: 'Weil-McLain',
    model: 'Evergreen Pro 750',
    boilerType: 'condensing-gas',
    fuelType: 'natural-gas',
    capacityBtuh: 750000,
    capacityKw: 219.8,
    afue: 95,
    thermalEfficiency: 94.8,
    combustionEfficiency: 96,
    turndownRatio: 8,
    minModulation: 12,
    supplyTempRange: { min: 75, max: 180 },
    returnTempRange: { min: 65, max: 160 },
    voltage: '120V/1Ph/60Hz',
    fla: 9,
    noxEmissions: 22,
    soundDb: 56,
    weightLbs: 580,
    asmeCompliant: true,
    ahriCertified: true,
    ahriCertNumber: 'AHRI-B-2024-010',
    listPriceSar: 58000,
  },
  {
    id: 'weil-mclain-slimfit-1200',
    manufacturer: 'Weil-McLain',
    model: 'SlimFit 1200',
    boilerType: 'condensing-gas',
    fuelType: 'natural-gas',
    capacityBtuh: 1200000,
    capacityKw: 351.7,
    afue: 95,
    thermalEfficiency: 94.5,
    combustionEfficiency: 96,
    turndownRatio: 10,
    minModulation: 10,
    supplyTempRange: { min: 75, max: 180 },
    returnTempRange: { min: 65, max: 160 },
    voltage: '120V/1Ph/60Hz',
    fla: 14,
    noxEmissions: 22,
    soundDb: 62,
    weightLbs: 920,
    asmeCompliant: true,
    ahriCertified: true,
    ahriCertNumber: 'AHRI-B-2024-011',
    listPriceSar: 98000,
  },
  // Non-Condensing Gas Boilers
  {
    id: 'cleaver-brooks-cbex-2000',
    manufacturer: 'Cleaver-Brooks',
    model: 'CBEX Elite 2000',
    boilerType: 'non-condensing-gas',
    fuelType: 'natural-gas',
    capacityBtuh: 2000000,
    capacityKw: 586.2,
    afue: 84,
    thermalEfficiency: 83.5,
    combustionEfficiency: 85,
    turndownRatio: 4,
    minModulation: 25,
    supplyTempRange: { min: 140, max: 200 },
    returnTempRange: { min: 120, max: 180 },
    voltage: '460V/3Ph/60Hz',
    fla: 45,
    noxEmissions: 30,
    soundDb: 72,
    weightLbs: 3200,
    asmeCompliant: true,
    ahriCertified: true,
    ahriCertNumber: 'AHRI-B-2024-020',
    listPriceSar: 145000,
  },
  {
    id: 'cleaver-brooks-clearfire-1500',
    manufacturer: 'Cleaver-Brooks',
    model: 'ClearFire-C 1500',
    boilerType: 'condensing-gas',
    fuelType: 'natural-gas',
    capacityBtuh: 1500000,
    capacityKw: 439.6,
    afue: 98,
    thermalEfficiency: 97.2,
    combustionEfficiency: 99,
    turndownRatio: 20,
    minModulation: 5,
    supplyTempRange: { min: 70, max: 185 },
    returnTempRange: { min: 60, max: 165 },
    voltage: '460V/3Ph/60Hz',
    fla: 25,
    noxEmissions: 9,
    soundDb: 65,
    weightLbs: 1850,
    asmeCompliant: true,
    ahriCertified: true,
    ahriCertNumber: 'AHRI-B-2024-021',
    listPriceSar: 185000,
  },
  // Fulton Boilers
  {
    id: 'fulton-vantage-600',
    manufacturer: 'Fulton',
    model: 'Vantage VTG-600',
    boilerType: 'condensing-gas',
    fuelType: 'natural-gas',
    capacityBtuh: 600000,
    capacityKw: 175.8,
    afue: 95,
    thermalEfficiency: 94.6,
    combustionEfficiency: 96,
    turndownRatio: 8,
    minModulation: 12,
    supplyTempRange: { min: 70, max: 180 },
    returnTempRange: { min: 60, max: 160 },
    voltage: '120V/1Ph/60Hz',
    fla: 8,
    noxEmissions: 20,
    soundDb: 54,
    weightLbs: 520,
    asmeCompliant: true,
    ahriCertified: true,
    ahriCertNumber: 'AHRI-B-2024-030',
    listPriceSar: 52000,
  },
  {
    id: 'fulton-tribute-1000',
    manufacturer: 'Fulton',
    model: 'Tribute 1000',
    boilerType: 'non-condensing-gas',
    fuelType: 'natural-gas',
    capacityBtuh: 1000000,
    capacityKw: 293.1,
    afue: 83,
    thermalEfficiency: 82.5,
    combustionEfficiency: 84,
    turndownRatio: 4,
    minModulation: 25,
    supplyTempRange: { min: 140, max: 200 },
    returnTempRange: { min: 120, max: 180 },
    voltage: '460V/3Ph/60Hz',
    fla: 22,
    noxEmissions: 35,
    soundDb: 68,
    weightLbs: 1800,
    asmeCompliant: true,
    ahriCertified: true,
    ahriCertNumber: 'AHRI-B-2024-031',
    listPriceSar: 78000,
  },
  // Electric Boilers
  {
    id: 'chromalox-electric-500',
    manufacturer: 'Chromalox',
    model: 'CXN-500',
    boilerType: 'electric',
    fuelType: 'electric',
    capacityBtuh: 500000,
    capacityKw: 146.5,
    afue: 99,
    thermalEfficiency: 99.5,
    combustionEfficiency: 100,
    turndownRatio: 20,
    minModulation: 5,
    supplyTempRange: { min: 70, max: 200 },
    returnTempRange: { min: 60, max: 180 },
    voltage: '480V/3Ph/60Hz',
    fla: 180,
    noxEmissions: 0,
    soundDb: 45,
    weightLbs: 650,
    asmeCompliant: true,
    ahriCertified: true,
    ahriCertNumber: 'AHRI-B-2024-040',
    listPriceSar: 38000,
  },
];

/**
 * Calculate hot water flow rate (GPM)
 */
export function calculateHWFlowGpm(capacityBtuh: number, deltaT: number = 20): number {
  // Q = GPM × 500 × ΔT (where 500 = 8.33 lb/gal × 60 min/hr × 1 BTU/lb°F)
  // GPM = Q / (500 × ΔT)
  return capacityBtuh / (500 * deltaT);
}

/**
 * Calculate annual fuel consumption
 */
export function calculateAnnualFuelConsumption(
  capacityBtuh: number,
  efficiency: number,
  fuelType: FuelType,
  equivalentFullLoadHours: number = 1500
): { consumption: number; unit: string; costSar: number } {
  const heatingValue = FUEL_HEATING_VALUES[fuelType];
  const costPerUnit = FUEL_COSTS_SAR[fuelType];
  
  // Annual BTU = Capacity × EFLH / Efficiency
  const annualBtu = (capacityBtuh * equivalentFullLoadHours) / (efficiency / 100);
  
  // Convert to fuel units
  let consumption: number;
  let unit: string;
  
  switch (fuelType) {
    case 'natural-gas':
      consumption = annualBtu / heatingValue; // cubic feet
      unit = 'cf';
      break;
    case 'propane':
      consumption = (annualBtu / heatingValue) * 3.785; // liters
      unit = 'liters';
      break;
    case 'fuel-oil':
      consumption = (annualBtu / heatingValue) * 3.785; // liters
      unit = 'liters';
      break;
    case 'electric':
      consumption = annualBtu / heatingValue; // kWh
      unit = 'kWh';
      break;
  }
  
  return {
    consumption: Math.round(consumption),
    unit,
    costSar: Math.round(consumption * costPerUnit),
  };
}

/**
 * Calculate fit score for a boiler against requirements (0-100)
 */
export function calculateBoilerFitScore(boiler: BoilerCatalogItem, requirements: BoilerRequirements): number {
  let score = 100;
  
  // Capacity match (30 points) - prefer 10-25% oversized
  const capacityRatio = boiler.capacityBtuh / requirements.requiredCapacityBtuh;
  if (capacityRatio < 1.0) {
    score -= 30 * (1 - capacityRatio); // Undersized penalty
  } else if (capacityRatio > 1.5) {
    score -= 15; // Over 50% oversized penalty
  } else if (capacityRatio >= 1.1 && capacityRatio <= 1.25) {
    score += 5; // Bonus for ideal sizing
  }
  
  // Efficiency (25 points)
  const baseline = ASHRAE_90_1_BOILER_MINIMUMS[boiler.boilerType];
  if (boiler.afue > baseline.afue + 5) {
    score += 10; // High efficiency bonus
  } else if (boiler.afue < baseline.afue) {
    score -= 20; // Below code minimum
  }
  
  // AFUE target match (15 points)
  if (requirements.minAfue && boiler.afue < requirements.minAfue) {
    score -= 15;
  }
  
  // Turndown ratio (10 points)
  if (requirements.minTurndown && boiler.turndownRatio < requirements.minTurndown) {
    score -= 10;
  } else if (boiler.turndownRatio >= 10) {
    score += 5; // Bonus for high turndown
  }
  
  // ASME compliance (10 points)
  if (requirements.asmeRequired && !boiler.asmeCompliant) {
    score -= 10;
  }
  
  // AHRI certification (5 points)
  if (!boiler.ahriCertified) {
    score -= 5;
  }
  
  // Manufacturer preference (5 points)
  if (requirements.manufacturerPreference && 
      boiler.manufacturer.toLowerCase() !== requirements.manufacturerPreference.toLowerCase()) {
    score -= 5;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Select the best boiler from catalog based on requirements
 */
export function selectBoiler(requirements: BoilerRequirements): BoilerSelectionResult | null {
  // Filter by boiler type if specified
  let candidates = requirements.boilerType 
    ? BOILER_CATALOG.filter(b => b.boilerType === requirements.boilerType)
    : BOILER_CATALOG;
  
  // Filter by fuel type if specified
  if (requirements.fuelType) {
    candidates = candidates.filter(b => b.fuelType === requirements.fuelType);
  }
  
  // Filter by capacity (80% to 150% of required)
  candidates = candidates.filter(b => 
    b.capacityBtuh >= requirements.requiredCapacityBtuh * 0.8 &&
    b.capacityBtuh <= requirements.requiredCapacityBtuh * 1.5
  );
  
  if (candidates.length === 0) {
    return null;
  }
  
  // Score all candidates
  const scored = candidates.map(b => ({
    boiler: b,
    score: calculateBoilerFitScore(b, requirements),
  })).sort((a, b) => b.score - a.score);
  
  const selected = scored[0].boiler;
  const baseline = ASHRAE_90_1_BOILER_MINIMUMS[selected.boilerType];
  const warnings: string[] = [];
  
  // Generate warnings
  if (selected.capacityBtuh < requirements.requiredCapacityBtuh) {
    warnings.push(`Selected capacity (${(selected.capacityBtuh / 1000).toFixed(0)} MBH) is below required (${(requirements.requiredCapacityBtuh / 1000).toFixed(0)} MBH)`);
  }
  if (selected.afue < baseline.afue) {
    warnings.push(`AFUE (${selected.afue}%) is below ASHRAE 90.1 minimum (${baseline.afue}%)`);
  }
  if (requirements.asmeRequired && !selected.asmeCompliant) {
    warnings.push('Boiler is not ASME certified');
  }
  
  // Calculate operating costs
  const fuelCalc = calculateAnnualFuelConsumption(
    selected.capacityBtuh,
    selected.afue,
    selected.fuelType
  );
  
  const electricityCost = selected.fuelType !== 'electric' 
    ? Math.round(selected.fla * 480 * 0.001 * 1500 * 0.18) // Auxiliary power
    : 0;
  
  return {
    selectedBoiler: selected,
    fitScore: scored[0].score,
    capacityMatch: {
      required: requirements.requiredCapacityBtuh,
      selected: selected.capacityBtuh,
      percentOver: Math.round((selected.capacityBtuh / requirements.requiredCapacityBtuh - 1) * 100),
    },
    efficiencyAnalysis: {
      afue: selected.afue,
      thermalEfficiency: selected.thermalEfficiency,
      ashrae90_1_baseline: baseline.thermalEfficiency,
      percentBetterThanBaseline: Math.round((selected.thermalEfficiency / baseline.thermalEfficiency - 1) * 100),
    },
    operatingCosts: {
      annualFuelConsumption: fuelCalc.consumption,
      annualFuelCostSar: fuelCalc.costSar,
      electricityCostSar: electricityCost,
      totalAnnualCostSar: fuelCalc.costSar + electricityCost,
    },
    alternates: scored.slice(1, 4).map(s => s.boiler),
    warnings,
  };
}

/**
 * Get boiler type display name
 */
export function getBoilerTypeDisplayName(type: BoilerType): string {
  const names: Record<BoilerType, string> = {
    'condensing-gas': 'Condensing Gas',
    'non-condensing-gas': 'Non-Condensing Gas',
    'oil-fired': 'Oil-Fired',
    'electric': 'Electric',
    'steam': 'Steam',
  };
  return names[type];
}

/**
 * Get fuel type display name
 */
export function getFuelTypeDisplayName(type: FuelType): string {
  const names: Record<FuelType, string> = {
    'natural-gas': 'Natural Gas',
    'propane': 'Propane',
    'fuel-oil': 'Fuel Oil',
    'electric': 'Electric',
  };
  return names[type];
}

/**
 * Get all unique manufacturers from catalog
 */
export function getBoilerManufacturers(): string[] {
  return [...new Set(BOILER_CATALOG.map(b => b.manufacturer))].sort();
}

/**
 * Get capacity range from catalog
 */
export function getBoilerCapacityRange(boilerType?: BoilerType): { min: number; max: number } {
  const filtered = boilerType 
    ? BOILER_CATALOG.filter(b => b.boilerType === boilerType)
    : BOILER_CATALOG;
  
  if (filtered.length === 0) {
    return { min: 0, max: 0 };
  }
  
  return {
    min: Math.min(...filtered.map(b => b.capacityBtuh)),
    max: Math.max(...filtered.map(b => b.capacityBtuh)),
  };
}
