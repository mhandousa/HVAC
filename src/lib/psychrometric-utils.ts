// Psychrometric utility functions for HVAC calculations
// Based on ASHRAE Fundamentals

const STANDARD_PRESSURE = 14.696; // psia at sea level

/**
 * Calculate saturation vapor pressure at a given temperature
 * Using simplified Antoine equation
 */
export function calcSaturationPressure(tempF: number): number {
  const tempR = tempF + 459.67;
  const c1 = -10214.165;
  const c2 = -4.8932428;
  const c3 = -0.0053765794;
  const c4 = 0.00000019202377;
  const c5 = 3.5575832e-10;
  const c6 = -9.0344688e-14;
  const c7 = 4.1635019;
  
  const lnPws = c1/tempR + c2 + c3*tempR + c4*tempR*tempR + 
                c5*Math.pow(tempR, 3) + c6*Math.pow(tempR, 4) + c7*Math.log(tempR);
  
  return Math.exp(lnPws);
}

/**
 * Calculate humidity ratio from vapor pressure
 */
export function calcHumidityRatio(pv: number, pAtm: number = STANDARD_PRESSURE): number {
  return 0.62198 * pv / (pAtm - pv);
}

/**
 * Calculate enthalpy of moist air (BTU/lb dry air)
 */
export function calcEnthalpy(dryBulbF: number, humidityRatio: number): number {
  return 0.24 * dryBulbF + humidityRatio * (1061 + 0.444 * dryBulbF);
}

/**
 * Calculate dew point temperature (°F)
 */
export function calcDewPoint(humidityRatio: number, pAtm: number = STANDARD_PRESSURE): number {
  const pv = pAtm * humidityRatio / (0.62198 + humidityRatio);
  const alpha = Math.log(pv);
  const tdp = 100.45 + 33.193 * alpha + 2.319 * alpha * alpha + 
              0.17074 * Math.pow(alpha, 3) + 1.2063 * Math.pow(pv, 0.1984);
  return tdp;
}

/**
 * Calculate wet bulb temperature using iterative method (°F)
 */
export function calcWetBulb(dryBulbF: number, rhPercent: number, pAtm: number = STANDARD_PRESSURE): number {
  const pws = calcSaturationPressure(dryBulbF);
  const pv = (rhPercent / 100) * pws;
  const w = calcHumidityRatio(pv, pAtm);
  
  // Iterative solution for wet bulb
  let twb = dryBulbF;
  for (let i = 0; i < 50; i++) {
    const pwsWb = calcSaturationPressure(twb);
    const wsWb = calcHumidityRatio(pwsWb, pAtm);
    const wCalc = ((1093 - 0.556 * twb) * wsWb - 0.24 * (dryBulbF - twb)) / 
                  (1093 + 0.444 * dryBulbF - twb);
    
    if (Math.abs(w - wCalc) < 0.00001) break;
    twb = twb - (wCalc - w) * 1500;
  }
  
  return twb;
}

/**
 * Calculate specific volume (ft³/lb dry air)
 */
export function calcSpecificVolume(dryBulbF: number, humidityRatio: number, pAtm: number = STANDARD_PRESSURE): number {
  const tempR = dryBulbF + 459.67;
  return 0.370486 * tempR * (1 + 1.6078 * humidityRatio) / pAtm;
}

/**
 * Calculate atmospheric pressure at altitude (psia)
 */
export function calcAtmosphericPressure(altitudeFt: number): number {
  return STANDARD_PRESSURE * Math.pow(1 - 0.0000068753 * altitudeFt, 5.2559);
}

export interface AirProperties {
  dryBulb: number;        // °F
  wetBulb: number;        // °F
  rh: number;             // %
  dewPoint: number;       // °F
  humidityRatio: number;  // lb/lb
  enthalpy: number;       // BTU/lb
  specificVolume: number; // ft³/lb
  vaporPressure: number;  // psia
}

/**
 * Calculate all air properties from dry bulb and RH
 */
export function calculateAirProperties(
  dryBulbF: number,
  rhPercent: number,
  altitudeFt: number = 0
): AirProperties {
  const pAtm = calcAtmosphericPressure(altitudeFt);
  const pws = calcSaturationPressure(dryBulbF);
  const pv = (rhPercent / 100) * pws;
  const w = calcHumidityRatio(pv, pAtm);
  
  return {
    dryBulb: dryBulbF,
    wetBulb: calcWetBulb(dryBulbF, rhPercent, pAtm),
    rh: rhPercent,
    dewPoint: calcDewPoint(w, pAtm),
    humidityRatio: w,
    enthalpy: calcEnthalpy(dryBulbF, w),
    specificVolume: calcSpecificVolume(dryBulbF, w, pAtm),
    vaporPressure: pv,
  };
}

/**
 * Convert Celsius to Fahrenheit
 */
export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9/5) + 32;
}

/**
 * Convert Fahrenheit to Celsius
 */
export function fahrenheitToCelsius(fahrenheit: number): number {
  return (fahrenheit - 32) * 5/9;
}

// Saudi Arabia climate presets for ERV calculations
export interface ClimatePreset {
  name: string;
  nameAr: string;
  summer: {
    dryBulbC: number;
    wetBulbC: number;
    rhPercent: number;
  };
  winter: {
    dryBulbC: number;
    wetBulbC: number;
    rhPercent: number;
  };
  altitude: number; // meters
}

export const SAUDI_CLIMATE_PRESETS: ClimatePreset[] = [
  {
    name: 'Riyadh',
    nameAr: 'الرياض',
    summer: { dryBulbC: 46, wetBulbC: 21, rhPercent: 10 },
    winter: { dryBulbC: 8, wetBulbC: 6, rhPercent: 55 },
    altitude: 612,
  },
  {
    name: 'Jeddah',
    nameAr: 'جدة',
    summer: { dryBulbC: 43, wetBulbC: 28, rhPercent: 35 },
    winter: { dryBulbC: 18, wetBulbC: 15, rhPercent: 65 },
    altitude: 12,
  },
  {
    name: 'Dammam',
    nameAr: 'الدمام',
    summer: { dryBulbC: 45, wetBulbC: 30, rhPercent: 40 },
    winter: { dryBulbC: 12, wetBulbC: 10, rhPercent: 60 },
    altitude: 10,
  },
  {
    name: 'Makkah',
    nameAr: 'مكة المكرمة',
    summer: { dryBulbC: 48, wetBulbC: 23, rhPercent: 15 },
    winter: { dryBulbC: 18, wetBulbC: 14, rhPercent: 50 },
    altitude: 277,
  },
  {
    name: 'Madinah',
    nameAr: 'المدينة المنورة',
    summer: { dryBulbC: 47, wetBulbC: 22, rhPercent: 12 },
    winter: { dryBulbC: 10, wetBulbC: 8, rhPercent: 50 },
    altitude: 608,
  },
  {
    name: 'Abha',
    nameAr: 'أبها',
    summer: { dryBulbC: 32, wetBulbC: 18, rhPercent: 25 },
    winter: { dryBulbC: 5, wetBulbC: 3, rhPercent: 55 },
    altitude: 2200,
  },
  {
    name: 'Tabuk',
    nameAr: 'تبوك',
    summer: { dryBulbC: 42, wetBulbC: 19, rhPercent: 12 },
    winter: { dryBulbC: 4, wetBulbC: 2, rhPercent: 50 },
    altitude: 768,
  },
];

// Indoor design conditions
export const INDOOR_DESIGN_CONDITIONS = {
  cooling: {
    dryBulbC: 24,
    rhPercent: 50,
  },
  heating: {
    dryBulbC: 21,
    rhPercent: 40,
  },
};
