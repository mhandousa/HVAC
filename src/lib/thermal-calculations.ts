/**
 * Thermal Calculations Library for HVAC Insulation Design
 * Optimized for Saudi Arabia climate conditions
 */

// Insulation material properties
export interface InsulationMaterial {
  id: string;
  name: string;
  nameAr: string;
  kValue: number; // W/m·K at 24°C
  maxTemp: number; // °C
  minTemp: number; // °C
  vaporResistance: number; // μ factor
  closedCell: boolean;
  commonFor: string[];
  costPerM2: number; // SAR per m² at 25mm thickness
}

export const INSULATION_MATERIALS: InsulationMaterial[] = [
  {
    id: 'elastomeric_foam',
    name: 'Elastomeric Foam (Armaflex)',
    nameAr: 'رغوة مطاطية (أرمافليكس)',
    kValue: 0.036,
    maxTemp: 105,
    minTemp: -50,
    vaporResistance: 7000,
    closedCell: true,
    commonFor: ['chilled_water', 'refrigerant'],
    costPerM2: 45,
  },
  {
    id: 'fiberglass',
    name: 'Fiberglass with ASJ Jacket',
    nameAr: 'ألياف زجاجية مع غلاف ASJ',
    kValue: 0.040,
    maxTemp: 454,
    minTemp: -18,
    vaporResistance: 50,
    closedCell: false,
    commonFor: ['hot_water', 'steam', 'duct'],
    costPerM2: 25,
  },
  {
    id: 'mineral_wool',
    name: 'Mineral Wool',
    nameAr: 'صوف معدني',
    kValue: 0.038,
    maxTemp: 650,
    minTemp: -180,
    vaporResistance: 1,
    closedCell: false,
    commonFor: ['high_temp', 'fire_rated'],
    costPerM2: 30,
  },
  {
    id: 'polyisocyanurate',
    name: 'Polyisocyanurate (PIR)',
    nameAr: 'بولي إيزوسيانورات (PIR)',
    kValue: 0.022,
    maxTemp: 120,
    minTemp: -180,
    vaporResistance: 50,
    closedCell: true,
    commonFor: ['chilled_water', 'refrigerant', 'duct'],
    costPerM2: 55,
  },
  {
    id: 'phenolic_foam',
    name: 'Phenolic Foam',
    nameAr: 'رغوة فينولية',
    kValue: 0.021,
    maxTemp: 120,
    minTemp: -180,
    vaporResistance: 35,
    closedCell: true,
    commonFor: ['duct', 'chilled_water'],
    costPerM2: 60,
  },
];

// Saudi Arabia climate data (ASHRAE Design Data)
export interface ClimateData {
  id: string;
  name: string;
  nameAr: string;
  summerDB: number; // °C
  summerWB: number; // °C
  summerRH: number; // %
  winterDB: number; // °C
  designDewPoint: number; // °C (summer)
  climateZone: 'hot_dry' | 'hot_humid';
}

export const SAUDI_CLIMATE_DATA: ClimateData[] = [
  {
    id: 'riyadh',
    name: 'Riyadh',
    nameAr: 'الرياض',
    summerDB: 46.0,
    summerWB: 21.0,
    summerRH: 10,
    winterDB: 7.0,
    designDewPoint: 8.0,
    climateZone: 'hot_dry',
  },
  {
    id: 'jeddah',
    name: 'Jeddah',
    nameAr: 'جدة',
    summerDB: 43.0,
    summerWB: 29.0,
    summerRH: 65,
    winterDB: 15.0,
    designDewPoint: 28.5,
    climateZone: 'hot_humid',
  },
  {
    id: 'dammam',
    name: 'Dammam',
    nameAr: 'الدمام',
    summerDB: 45.0,
    summerWB: 30.0,
    summerRH: 70,
    winterDB: 10.0,
    designDewPoint: 29.0,
    climateZone: 'hot_humid',
  },
  {
    id: 'makkah',
    name: 'Makkah',
    nameAr: 'مكة المكرمة',
    summerDB: 48.0,
    summerWB: 24.0,
    summerRH: 25,
    winterDB: 18.0,
    designDewPoint: 18.0,
    climateZone: 'hot_dry',
  },
  {
    id: 'madinah',
    name: 'Madinah',
    nameAr: 'المدينة المنورة',
    summerDB: 47.0,
    summerWB: 22.0,
    summerRH: 15,
    winterDB: 10.0,
    designDewPoint: 12.0,
    climateZone: 'hot_dry',
  },
  {
    id: 'khobar',
    name: 'Al-Khobar',
    nameAr: 'الخبر',
    summerDB: 44.0,
    summerWB: 31.0,
    summerRH: 75,
    winterDB: 12.0,
    designDewPoint: 30.0,
    climateZone: 'hot_humid',
  },
  {
    id: 'abha',
    name: 'Abha',
    nameAr: 'أبها',
    summerDB: 32.0,
    summerWB: 18.0,
    summerRH: 35,
    winterDB: 5.0,
    designDewPoint: 14.0,
    climateZone: 'hot_dry',
  },
  {
    id: 'tabuk',
    name: 'Tabuk',
    nameAr: 'تبوك',
    summerDB: 42.0,
    summerWB: 19.0,
    summerRH: 12,
    winterDB: 4.0,
    designDewPoint: 6.0,
    climateZone: 'hot_dry',
  },
];

// Service types with typical operating temperatures
export interface ServiceType {
  id: string;
  name: string;
  nameAr: string;
  typicalTemp: number; // °C
  tempRange: { min: number; max: number };
  category: 'cold' | 'hot';
}

export const SERVICE_TYPES: ServiceType[] = [
  {
    id: 'chilled_water_supply',
    name: 'Chilled Water Supply',
    nameAr: 'مياه مبردة - ذهاب',
    typicalTemp: 6,
    tempRange: { min: 4, max: 8 },
    category: 'cold',
  },
  {
    id: 'chilled_water_return',
    name: 'Chilled Water Return',
    nameAr: 'مياه مبردة - راجع',
    typicalTemp: 12,
    tempRange: { min: 10, max: 14 },
    category: 'cold',
  },
  {
    id: 'hot_water_supply',
    name: 'Hot Water Supply (LTHW)',
    nameAr: 'مياه ساخنة - ذهاب',
    typicalTemp: 80,
    tempRange: { min: 60, max: 90 },
    category: 'hot',
  },
  {
    id: 'hot_water_return',
    name: 'Hot Water Return (LTHW)',
    nameAr: 'مياه ساخنة - راجع',
    typicalTemp: 60,
    tempRange: { min: 45, max: 70 },
    category: 'hot',
  },
  {
    id: 'steam_lp',
    name: 'Steam (Low Pressure)',
    nameAr: 'بخار ضغط منخفض',
    typicalTemp: 120,
    tempRange: { min: 100, max: 135 },
    category: 'hot',
  },
  {
    id: 'steam_hp',
    name: 'Steam (High Pressure)',
    nameAr: 'بخار ضغط عالي',
    typicalTemp: 180,
    tempRange: { min: 150, max: 200 },
    category: 'hot',
  },
  {
    id: 'refrigerant_suction',
    name: 'Refrigerant Suction',
    nameAr: 'خط سحب المبرد',
    typicalTemp: -5,
    tempRange: { min: -20, max: 10 },
    category: 'cold',
  },
  {
    id: 'refrigerant_liquid',
    name: 'Refrigerant Liquid',
    nameAr: 'خط سائل المبرد',
    typicalTemp: 40,
    tempRange: { min: 30, max: 50 },
    category: 'hot',
  },
  {
    id: 'condenser_water',
    name: 'Condenser Water',
    nameAr: 'مياه المكثف',
    typicalTemp: 35,
    tempRange: { min: 30, max: 40 },
    category: 'hot',
  },
];

// Standard pipe sizes (inches)
export const PIPE_SIZES = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 24];

// Convert pipe size to outer diameter in mm
export function pipeOD(sizeInches: number): number {
  const odMap: Record<number, number> = {
    0.5: 21.3, 0.75: 26.7, 1: 33.4, 1.25: 42.2, 1.5: 48.3, 2: 60.3, 2.5: 73.0,
    3: 88.9, 4: 114.3, 5: 141.3, 6: 168.3, 8: 219.1, 10: 273.0, 12: 323.8,
    14: 355.6, 16: 406.4, 18: 457.2, 20: 508.0, 24: 609.6,
  };
  return odMap[sizeInches] || sizeInches * 25.4;
}

/**
 * Calculate dew point temperature from dry-bulb and relative humidity
 * Using Magnus formula approximation
 */
export function calculateDewPoint(tempC: number, rhPercent: number): number {
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * tempC) / (b + tempC)) + Math.log(rhPercent / 100);
  return (b * alpha) / (a - alpha);
}

/**
 * Calculate minimum insulation thickness to prevent condensation
 * Surface temperature must be > dew point + safety margin
 */
export function calculateMinInsulationThickness(params: {
  fluidTempC: number;
  ambientTempC: number;
  dewPointC: number;
  pipeODmm: number;
  kValueInsulation: number;
  safetyMarginC?: number;
  hOutside?: number; // Outside film coefficient W/m²·K
}): number {
  const {
    fluidTempC,
    ambientTempC,
    dewPointC,
    pipeODmm,
    kValueInsulation,
    safetyMarginC = 2.0,
    hOutside = 10, // Still air
  } = params;

  const minSurfaceTemp = dewPointC + safetyMarginC;
  
  // For cold services: surface must be above dew point
  if (fluidTempC >= ambientTempC) {
    return 0; // No condensation risk for hot services
  }

  // Iterative calculation for cylindrical insulation
  const r1 = pipeODmm / 2000; // Pipe outer radius in meters
  let thickness = 0.006; // Start with 6mm
  
  for (let i = 0; i < 100; i++) {
    const r2 = r1 + thickness;
    
    // Thermal resistances
    const Rins = Math.log(r2 / r1) / (2 * Math.PI * kValueInsulation);
    const Rsurf = 1 / (2 * Math.PI * r2 * hOutside);
    const Rtotal = Rins + Rsurf;
    
    // Surface temperature
    const Q = (ambientTempC - fluidTempC) / Rtotal;
    const Tsurf = ambientTempC - Q * Rsurf;
    
    if (Tsurf >= minSurfaceTemp) {
      return thickness * 1000; // Convert to mm
    }
    
    thickness += 0.001; // Increment by 1mm
  }
  
  return 100; // Return max if not converged
}

/**
 * Calculate heat gain/loss through insulation (W/m of pipe length)
 */
export function calculateHeatTransfer(params: {
  fluidTempC: number;
  ambientTempC: number;
  pipeODmm: number;
  insulationThicknessMm: number;
  kValueInsulation: number;
  hOutside?: number;
}): number {
  const {
    fluidTempC,
    ambientTempC,
    pipeODmm,
    insulationThicknessMm,
    kValueInsulation,
    hOutside = 10,
  } = params;

  const r1 = pipeODmm / 2000; // meters
  const r2 = r1 + insulationThicknessMm / 1000; // meters
  
  // Thermal resistances per meter length
  const Rins = Math.log(r2 / r1) / (2 * Math.PI * kValueInsulation);
  const Rsurf = 1 / (2 * Math.PI * r2 * hOutside);
  const Rtotal = Rins + Rsurf;
  
  // Heat transfer per meter (positive = heat gain for cold pipes)
  return (ambientTempC - fluidTempC) / Rtotal;
}

/**
 * Calculate surface temperature of insulation
 */
export function calculateSurfaceTemperature(params: {
  fluidTempC: number;
  ambientTempC: number;
  pipeODmm: number;
  insulationThicknessMm: number;
  kValueInsulation: number;
  hOutside?: number;
}): number {
  const {
    fluidTempC,
    ambientTempC,
    pipeODmm,
    insulationThicknessMm,
    kValueInsulation,
    hOutside = 10,
  } = params;

  const r1 = pipeODmm / 2000;
  const r2 = r1 + insulationThicknessMm / 1000;
  
  const Rins = Math.log(r2 / r1) / (2 * Math.PI * kValueInsulation);
  const Rsurf = 1 / (2 * Math.PI * r2 * hOutside);
  const Rtotal = Rins + Rsurf;
  
  const Q = (ambientTempC - fluidTempC) / Rtotal;
  return ambientTempC - Q * Rsurf;
}

/**
 * Calculate R-value of insulation
 */
export function calculateRValue(thicknessMm: number, kValue: number): number {
  return (thicknessMm / 1000) / kValue; // m²·K/W
}

/**
 * Get SBC recommended minimum R-value
 */
export function getSBCMinRValue(serviceType: string): number {
  const rValues: Record<string, number> = {
    'chilled_water_supply': 4.2,
    'chilled_water_return': 3.5,
    'refrigerant_suction': 5.0,
    'refrigerant_liquid': 2.5,
    'hot_water_supply': 2.5,
    'hot_water_return': 2.0,
    'steam_lp': 3.0,
    'steam_hp': 3.5,
    'condenser_water': 1.5,
  };
  return rValues[serviceType] || 2.5;
}

/**
 * Standard insulation thicknesses available in market (mm)
 */
export const STANDARD_THICKNESSES = [6, 9, 13, 19, 25, 32, 38, 50, 75, 100];

/**
 * Round up to nearest standard thickness
 */
export function roundToStandardThickness(thicknessMm: number): number {
  for (const std of STANDARD_THICKNESSES) {
    if (thicknessMm <= std) return std;
  }
  return 100;
}

/**
 * Calculate annual energy cost
 */
export function calculateAnnualEnergyCost(params: {
  heatTransferWPerM: number;
  pipeLengthM: number;
  operatingHoursPerYear?: number;
  electricityCostPerKWh?: number; // SAR
  coolingCOP?: number;
}): number {
  const {
    heatTransferWPerM,
    pipeLengthM,
    operatingHoursPerYear = 8760, // 24/7
    electricityCostPerKWh = 0.18, // Saudi tariff
    coolingCOP = 3.5,
  } = params;

  const totalHeatW = Math.abs(heatTransferWPerM) * pipeLengthM;
  const energyKWh = (totalHeatW / 1000) * operatingHoursPerYear / coolingCOP;
  return energyKWh * electricityCostPerKWh;
}

/**
 * Comprehensive insulation recommendation
 */
export interface InsulationRecommendation {
  materialId: string;
  materialName: string;
  recommendedThicknessMm: number;
  standardThicknessMm: number;
  surfaceTempC: number;
  heatTransferWPerM: number;
  rValue: number;
  meetsCondensation: boolean;
  meetsSBCCode: boolean;
  annualEnergyCostPerM: number;
  vaporBarrierRequired: boolean;
}

export function getInsulationRecommendations(params: {
  serviceTypeId: string;
  fluidTempC: number;
  ambientTempC: number;
  relativeHumidity: number;
  pipeSizeInches: number;
  pipeLengthM?: number;
}): InsulationRecommendation[] {
  const {
    serviceTypeId,
    fluidTempC,
    ambientTempC,
    relativeHumidity,
    pipeSizeInches,
    pipeLengthM = 1,
  } = params;

  const dewPointC = calculateDewPoint(ambientTempC, relativeHumidity);
  const pipeODmm = pipeOD(pipeSizeInches);
  const sbcMinR = getSBCMinRValue(serviceTypeId);
  const isColdService = fluidTempC < ambientTempC;

  return INSULATION_MATERIALS.map(material => {
    // Calculate minimum thickness for condensation prevention
    const minThickness = isColdService 
      ? calculateMinInsulationThickness({
          fluidTempC,
          ambientTempC,
          dewPointC,
          pipeODmm,
          kValueInsulation: material.kValue,
        })
      : 0;

    // Calculate thickness for SBC R-value compliance
    const thicknessForRValue = sbcMinR * material.kValue * 1000; // mm
    
    // Use the larger of the two
    const recommendedThickness = Math.max(minThickness, thicknessForRValue);
    const standardThickness = roundToStandardThickness(recommendedThickness);

    // Calculate performance at standard thickness
    const surfaceTemp = calculateSurfaceTemperature({
      fluidTempC,
      ambientTempC,
      pipeODmm,
      insulationThicknessMm: standardThickness,
      kValueInsulation: material.kValue,
    });

    const heatTransfer = calculateHeatTransfer({
      fluidTempC,
      ambientTempC,
      pipeODmm,
      insulationThicknessMm: standardThickness,
      kValueInsulation: material.kValue,
    });

    const rValue = calculateRValue(standardThickness, material.kValue);

    const annualEnergyCost = calculateAnnualEnergyCost({
      heatTransferWPerM: heatTransfer,
      pipeLengthM,
    });

    return {
      materialId: material.id,
      materialName: material.name,
      recommendedThicknessMm: recommendedThickness,
      standardThicknessMm: standardThickness,
      surfaceTempC: surfaceTemp,
      heatTransferWPerM: heatTransfer,
      rValue,
      meetsCondensation: !isColdService || surfaceTemp > dewPointC + 2,
      meetsSBCCode: rValue >= sbcMinR,
      annualEnergyCostPerM: annualEnergyCost,
      vaporBarrierRequired: isColdService && !material.closedCell,
    };
  });
}

// Duct-specific calculations
export interface DuctInsulationResult {
  thicknessMm: number;
  rValue: number;
  surfaceTempC: number;
  heatGainWPerM2: number;
  tempRisePerM: number; // °C per meter of duct
  condensationRisk: 'low' | 'medium' | 'high';
}

export function calculateDuctInsulation(params: {
  airTempC: number;
  ambientTempC: number;
  relativeHumidity: number;
  ductWidthMm: number;
  ductHeightMm: number;
  airVelocityMps: number;
  kValueInsulation: number;
  insulationThicknessMm: number;
}): DuctInsulationResult {
  const {
    airTempC,
    ambientTempC,
    relativeHumidity,
    ductWidthMm,
    ductHeightMm,
    airVelocityMps,
    kValueInsulation,
    insulationThicknessMm,
  } = params;

  const dewPointC = calculateDewPoint(ambientTempC, relativeHumidity);
  
  // Duct perimeter and area
  const perimeterM = 2 * (ductWidthMm + ductHeightMm) / 1000;
  const crossAreaM2 = (ductWidthMm * ductHeightMm) / 1e6;
  
  // U-value calculation for flat surface
  const hInside = 6 + 4 * airVelocityMps; // Approximate internal coefficient
  const hOutside = 10; // Still air
  const Rins = (insulationThicknessMm / 1000) / kValueInsulation;
  const Rtotal = (1 / hInside) + Rins + (1 / hOutside);
  const U = 1 / Rtotal;
  
  // Heat gain per m² of duct surface
  const heatGainWPerM2 = U * (ambientTempC - airTempC);
  
  // Surface temperature
  const surfaceTempC = ambientTempC - heatGainWPerM2 / hOutside;
  
  // Temperature rise per meter of duct
  const airDensity = 1.2; // kg/m³
  const airCp = 1005; // J/kg·K
  const massFlowKgPerS = airDensity * crossAreaM2 * airVelocityMps;
  const heatGainPerMeterW = heatGainWPerM2 * perimeterM;
  const tempRisePerM = heatGainPerMeterW / (massFlowKgPerS * airCp);
  
  // Condensation risk assessment
  let condensationRisk: 'low' | 'medium' | 'high' = 'low';
  if (surfaceTempC < dewPointC) {
    condensationRisk = 'high';
  } else if (surfaceTempC < dewPointC + 3) {
    condensationRisk = 'medium';
  }
  
  return {
    thicknessMm: insulationThicknessMm,
    rValue: Rins,
    surfaceTempC,
    heatGainWPerM2,
    tempRisePerM,
    condensationRisk,
  };
}
