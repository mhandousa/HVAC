/**
 * Economizer Sizing Calculations
 * Per ASHRAE 90.1-2019 Section 6.5.1 and ASHRAE Handbook - HVAC Systems and Equipment
 */

export interface EconomizerConfig {
  designCfm: number;
  outdoorAirCfm: number;
  climateZone: string;
  coolingCapacityTons: number;
  economizerType: 'dry_bulb' | 'enthalpy' | 'differential_enthalpy';
  maxDamperVelocityFpm?: number;
  outdoorDesignDb?: number;
  outdoorDesignWb?: number;
  indoorDesignDb?: number;
  indoorDesignRh?: number;
}

export interface DamperSizing {
  oaDamperSqFt: number;
  oaDamperWidth: number;
  oaDamperHeight: number;
  raDamperSqFt: number;
  raDamperWidth: number;
  raDamperHeight: number;
  maDamperSqFt: number;
  maDamperWidth: number;
  maDamperHeight: number;
  faceVelocityFpm: number;
}

export interface HighLimitShutoff {
  type: 'fixed_dry_bulb' | 'fixed_enthalpy' | 'differential_dry_bulb' | 'differential_enthalpy';
  value: number;
  unit: string;
  description: string;
}

export interface EnergyAnalysis {
  annualFreeHours: number;
  annualCoolingHours: number;
  percentFreeHours: number;
  estimatedSavingsKwh: number;
  estimatedSavingsCost: number;
  coolingTonHoursSaved: number;
}

export interface EconomizerResults {
  required: boolean;
  requirementReason: string;
  capacityThreshold: number;
  damperSizing: DamperSizing;
  highLimitShutoff: HighLimitShutoff;
  energyAnalysis: EnergyAnalysis;
  mixedAirTempF: number;
  recommendations: string[];
  warnings: string[];
}

// ASHRAE 90.1-2019 Table 6.5.1-1: Economizer Requirements
interface ClimateZoneRequirement {
  required: boolean;
  capacityThreshold: number; // tons
  highLimitType: HighLimitShutoff['type'];
  highLimitValue: number;
  highLimitUnit: string;
}

const CLIMATE_ZONE_REQUIREMENTS: Record<string, ClimateZoneRequirement> = {
  '0A': { required: false, capacityThreshold: Infinity, highLimitType: 'fixed_dry_bulb', highLimitValue: 0, highLimitUnit: '°F' },
  '0B': { required: false, capacityThreshold: Infinity, highLimitType: 'fixed_dry_bulb', highLimitValue: 0, highLimitUnit: '°F' },
  '1A': { required: false, capacityThreshold: Infinity, highLimitType: 'fixed_dry_bulb', highLimitValue: 0, highLimitUnit: '°F' },
  '1B': { required: true, capacityThreshold: 54, highLimitType: 'fixed_dry_bulb', highLimitValue: 75, highLimitUnit: '°F' },
  '2A': { required: true, capacityThreshold: 54, highLimitType: 'fixed_enthalpy', highLimitValue: 28, highLimitUnit: 'Btu/lb' },
  '2B': { required: true, capacityThreshold: 54, highLimitType: 'fixed_dry_bulb', highLimitValue: 75, highLimitUnit: '°F' },
  '3A': { required: true, capacityThreshold: 54, highLimitType: 'fixed_enthalpy', highLimitValue: 28, highLimitUnit: 'Btu/lb' },
  '3B': { required: true, capacityThreshold: 54, highLimitType: 'fixed_dry_bulb', highLimitValue: 75, highLimitUnit: '°F' },
  '3C': { required: true, capacityThreshold: 54, highLimitType: 'fixed_dry_bulb', highLimitValue: 75, highLimitUnit: '°F' },
  '4A': { required: true, capacityThreshold: 54, highLimitType: 'fixed_enthalpy', highLimitValue: 28, highLimitUnit: 'Btu/lb' },
  '4B': { required: true, capacityThreshold: 54, highLimitType: 'fixed_dry_bulb', highLimitValue: 75, highLimitUnit: '°F' },
  '4C': { required: true, capacityThreshold: 54, highLimitType: 'fixed_dry_bulb', highLimitValue: 75, highLimitUnit: '°F' },
  '5A': { required: true, capacityThreshold: 54, highLimitType: 'fixed_enthalpy', highLimitValue: 28, highLimitUnit: 'Btu/lb' },
  '5B': { required: true, capacityThreshold: 54, highLimitType: 'fixed_dry_bulb', highLimitValue: 75, highLimitUnit: '°F' },
  '5C': { required: true, capacityThreshold: 54, highLimitType: 'fixed_dry_bulb', highLimitValue: 75, highLimitUnit: '°F' },
  '6A': { required: true, capacityThreshold: 54, highLimitType: 'fixed_enthalpy', highLimitValue: 28, highLimitUnit: 'Btu/lb' },
  '6B': { required: true, capacityThreshold: 54, highLimitType: 'fixed_dry_bulb', highLimitValue: 75, highLimitUnit: '°F' },
  '7': { required: true, capacityThreshold: 54, highLimitType: 'fixed_dry_bulb', highLimitValue: 75, highLimitUnit: '°F' },
  '8': { required: true, capacityThreshold: 54, highLimitType: 'fixed_dry_bulb', highLimitValue: 75, highLimitUnit: '°F' },
};

// Saudi Arabia specific climate zones
const SAUDI_CLIMATE_ZONES: Record<string, string> = {
  'Riyadh': '0B',
  'Jeddah': '0A',
  'Dammam': '1A',
  'Mecca': '0A',
  'Medina': '0B',
  'Tabuk': '1B',
  'Abha': '3B',
  'Khobar': '1A',
  'Yanbu': '1A',
  'Jubail': '1A',
};

// Bin hours data for Saudi cities (simplified - hours below economizer lockout)
const ANNUAL_FREE_COOLING_HOURS: Record<string, number> = {
  '0A': 200,
  '0B': 800,
  '1A': 400,
  '1B': 1200,
  '2A': 1500,
  '2B': 2000,
  '3A': 2500,
  '3B': 3000,
  '3C': 3500,
  '4A': 3000,
  '4B': 3200,
  '4C': 3500,
  '5A': 3500,
  '5B': 3800,
  '5C': 4000,
  '6A': 4000,
  '6B': 4200,
  '7': 4500,
  '8': 5000,
};

/**
 * Check if economizer is required per ASHRAE 90.1
 */
export function checkEconomizerRequirement(
  climateZone: string,
  coolingCapacityTons: number
): { required: boolean; reason: string; threshold: number } {
  const req = CLIMATE_ZONE_REQUIREMENTS[climateZone];
  
  if (!req) {
    return {
      required: false,
      reason: `Unknown climate zone: ${climateZone}`,
      threshold: 0,
    };
  }

  if (!req.required) {
    return {
      required: false,
      reason: `Economizers not required in climate zone ${climateZone} per ASHRAE 90.1-2019`,
      threshold: req.capacityThreshold,
    };
  }

  if (coolingCapacityTons < req.capacityThreshold) {
    return {
      required: false,
      reason: `Cooling capacity (${coolingCapacityTons} tons) is below ${req.capacityThreshold} ton threshold for climate zone ${climateZone}`,
      threshold: req.capacityThreshold,
    };
  }

  return {
    required: true,
    reason: `Economizer required for systems ≥${req.capacityThreshold} tons in climate zone ${climateZone} per ASHRAE 90.1-2019 Section 6.5.1`,
    threshold: req.capacityThreshold,
  };
}

/**
 * Get high-limit shutoff settings for climate zone
 */
export function getHighLimitShutoff(
  climateZone: string,
  economizerType: EconomizerConfig['economizerType']
): HighLimitShutoff {
  const req = CLIMATE_ZONE_REQUIREMENTS[climateZone] || CLIMATE_ZONE_REQUIREMENTS['3B'];

  // Override based on user-selected economizer type
  let type = req.highLimitType;
  let value = req.highLimitValue;
  let unit = req.highLimitUnit;

  if (economizerType === 'dry_bulb') {
    type = 'fixed_dry_bulb';
    value = 75;
    unit = '°F';
  } else if (economizerType === 'enthalpy') {
    type = 'fixed_enthalpy';
    value = 28;
    unit = 'Btu/lb';
  } else if (economizerType === 'differential_enthalpy') {
    type = 'differential_enthalpy';
    value = 0;
    unit = 'Btu/lb (compared to return air)';
  }

  const descriptions: Record<HighLimitShutoff['type'], string> = {
    'fixed_dry_bulb': `Disable economizer when outdoor dry-bulb exceeds ${value}°F`,
    'fixed_enthalpy': `Disable economizer when outdoor enthalpy exceeds ${value} Btu/lb`,
    'differential_dry_bulb': 'Disable economizer when outdoor dry-bulb exceeds return air dry-bulb',
    'differential_enthalpy': 'Disable economizer when outdoor enthalpy exceeds return air enthalpy',
  };

  return {
    type,
    value,
    unit,
    description: descriptions[type],
  };
}

/**
 * Size economizer dampers
 */
export function sizeDampers(
  designCfm: number,
  outdoorAirCfm: number,
  maxVelocityFpm: number = 2000
): DamperSizing {
  // OA damper sized for minimum OA flow at reasonable velocity
  const oaMinVelocity = Math.min(maxVelocityFpm, 1500); // Lower velocity for OA
  const oaDamperSqFt = outdoorAirCfm / oaMinVelocity;
  
  // RA damper sized for full design flow minus min OA
  const raFlow = designCfm - outdoorAirCfm;
  const raDamperSqFt = raFlow / maxVelocityFpm;
  
  // MA (mixed air) damper sized for full design flow
  const maDamperSqFt = designCfm / maxVelocityFpm;
  
  // Calculate dimensions (assume 4:3 aspect ratio)
  const calcDimensions = (area: number) => {
    const height = Math.sqrt(area * 0.75); // 3/4 of width
    const width = height * (4/3);
    return {
      width: Math.ceil(width * 12) / 12, // Round to nearest inch
      height: Math.ceil(height * 12) / 12,
    };
  };

  const oaDims = calcDimensions(oaDamperSqFt);
  const raDims = calcDimensions(raDamperSqFt);
  const maDims = calcDimensions(maDamperSqFt);

  return {
    oaDamperSqFt: Math.round(oaDamperSqFt * 100) / 100,
    oaDamperWidth: oaDims.width,
    oaDamperHeight: oaDims.height,
    raDamperSqFt: Math.round(raDamperSqFt * 100) / 100,
    raDamperWidth: raDims.width,
    raDamperHeight: raDims.height,
    maDamperSqFt: Math.round(maDamperSqFt * 100) / 100,
    maDamperWidth: maDims.width,
    maDamperHeight: maDims.height,
    faceVelocityFpm: maxVelocityFpm,
  };
}

/**
 * Calculate mixed air temperature
 */
export function calculateMixedAirTemp(
  outdoorAirCfm: number,
  designCfm: number,
  outdoorTempF: number,
  returnTempF: number
): number {
  const oaFraction = outdoorAirCfm / designCfm;
  const raFraction = 1 - oaFraction;
  return oaFraction * outdoorTempF + raFraction * returnTempF;
}

/**
 * Estimate annual energy savings
 */
export function estimateEnergySavings(
  climateZone: string,
  coolingCapacityTons: number,
  electricityRatePerKwh: number = 0.10
): EnergyAnalysis {
  const annualCoolingHours = 4000; // Typical for hot climates
  const freeHours = ANNUAL_FREE_COOLING_HOURS[climateZone] || 500;
  
  // Assume average part-load during free cooling hours
  const avgPartLoad = 0.6;
  const coolingTonHoursSaved = freeHours * coolingCapacityTons * avgPartLoad;
  
  // kW/ton for typical chiller
  const kwPerTon = 0.6;
  const estimatedSavingsKwh = coolingTonHoursSaved * kwPerTon;
  const estimatedSavingsCost = estimatedSavingsKwh * electricityRatePerKwh;

  return {
    annualFreeHours: freeHours,
    annualCoolingHours,
    percentFreeHours: Math.round((freeHours / annualCoolingHours) * 100),
    estimatedSavingsKwh: Math.round(estimatedSavingsKwh),
    estimatedSavingsCost: Math.round(estimatedSavingsCost),
    coolingTonHoursSaved: Math.round(coolingTonHoursSaved),
  };
}

/**
 * Main economizer sizing function
 */
export function sizeEconomizer(config: EconomizerConfig): EconomizerResults {
  const {
    designCfm,
    outdoorAirCfm,
    climateZone,
    coolingCapacityTons,
    economizerType,
    maxDamperVelocityFpm = 2000,
    outdoorDesignDb = 95,
    indoorDesignDb = 75,
  } = config;

  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check requirement
  const requirement = checkEconomizerRequirement(climateZone, coolingCapacityTons);
  
  // Size dampers
  const damperSizing = sizeDampers(designCfm, outdoorAirCfm, maxDamperVelocityFpm);
  
  // Get high-limit shutoff
  const highLimitShutoff = getHighLimitShutoff(climateZone, economizerType);
  
  // Calculate mixed air at design OA
  const mixedAirTempF = calculateMixedAirTemp(
    outdoorAirCfm,
    designCfm,
    outdoorDesignDb,
    indoorDesignDb
  );
  
  // Estimate energy savings
  const energyAnalysis = estimateEnergySavings(climateZone, coolingCapacityTons);

  // Validation and recommendations
  const oaPercent = (outdoorAirCfm / designCfm) * 100;
  
  if (oaPercent < 15) {
    warnings.push('Minimum outdoor air percentage is below 15% - verify ventilation requirements');
  }
  
  if (oaPercent > 100) {
    warnings.push('Outdoor air exceeds design CFM - check inputs');
  }

  if (damperSizing.faceVelocityFpm > 2500) {
    warnings.push('Damper face velocity exceeds 2500 FPM - consider larger dampers');
  }

  if (requirement.required) {
    recommendations.push('Install motorized dampers with modulating actuators');
    recommendations.push('Provide outdoor air temperature sensor');
    
    if (economizerType === 'enthalpy' || economizerType === 'differential_enthalpy') {
      recommendations.push('Provide outdoor air humidity sensor or enthalpy sensor');
    }
    
    recommendations.push('Include economizer status indication in BAS');
  }

  if (energyAnalysis.percentFreeHours > 20) {
    recommendations.push(`Economizer can provide ${energyAnalysis.percentFreeHours}% free cooling hours annually`);
  }

  return {
    required: requirement.required,
    requirementReason: requirement.reason,
    capacityThreshold: requirement.threshold,
    damperSizing,
    highLimitShutoff,
    energyAnalysis,
    mixedAirTempF: Math.round(mixedAirTempF * 10) / 10,
    recommendations,
    warnings,
  };
}

/**
 * Get Saudi city climate zone
 */
export function getSaudiClimateZone(city: string): string {
  return SAUDI_CLIMATE_ZONES[city] || '0B';
}

/**
 * Get all available climate zones
 */
export function getClimateZones(): string[] {
  return Object.keys(CLIMATE_ZONE_REQUIREMENTS);
}

/**
 * Get Saudi cities with climate zones
 */
export function getSaudiCities(): Array<{ city: string; zone: string }> {
  return Object.entries(SAUDI_CLIMATE_ZONES).map(([city, zone]) => ({ city, zone }));
}
