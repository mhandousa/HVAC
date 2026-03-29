/**
 * Saudi Arabia Hourly Bin Weather Data
 * Based on ASHRAE weather data and TMY3 analysis
 * Temperature bins in 5°F (2.8°C) increments
 */

export interface WeatherBin {
  tempCenterF: number;        // Bin center temperature (°F)
  tempCenterC: number;        // Bin center temperature (°C)
  rhPercent: number;          // Average RH for this bin
  annualHours: number;        // Hours per year in this bin
  coolingHours: number;       // Hours requiring cooling (above 75°F)
  heatingHours: number;       // Hours requiring heating (below 65°F)
}

export interface MonthlyWeatherProfile {
  month: string;
  avgTempC: number;
  avgRH: number;
  coolingHours: number;
  heatingHours: number;
  totalHours: number;
}

export type ClimateZone = 'hot_dry' | 'hot_humid' | 'moderate';

export interface CityWeatherProfile {
  cityId: string;
  name: string;
  nameAr: string;
  climateZone: ClimateZone;
  latitude: number;
  longitude: number;
  elevation: number; // meters
  bins: WeatherBin[];
  monthlyData: MonthlyWeatherProfile[];
  designConditions: {
    coolingDB99: number;     // 0.4% cooling DB °C
    coolingWB99: number;     // 0.4% coincident WB °C
    heatingDB99: number;     // 99% heating DB °C
    annualCoolingHours: number;
    annualHeatingHours: number;
  };
  degreeDays: {
    heatingBase65F: number;  // HDD base 65°F (18°C)
    coolingBase65F: number;  // CDD base 65°F (18°C)
    coolingBase50F: number;  // CDD base 50°F for enthalpy analysis
  };
}

// Monthly hour distribution for each month (approximate)
const MONTHLY_HOURS = [744, 672, 744, 720, 744, 720, 744, 744, 720, 744, 720, 744];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Generate temperature bins from 30°F to 125°F in 5°F increments
function generateBins(
  avgMonthlyTemps: number[], // °C for each month
  avgMonthlyRH: number[],    // % for each month
  climateZone: ClimateZone
): WeatherBin[] {
  const bins: WeatherBin[] = [];
  
  for (let tempF = 32; tempF <= 125; tempF += 5) {
    const tempC = (tempF - 32) * 5 / 9;
    let totalHours = 0;
    let avgRH = 0;
    
    // Estimate hours in this bin based on monthly distribution
    for (let m = 0; m < 12; m++) {
      const monthAvgC = avgMonthlyTemps[m];
      const monthAvgF = monthAvgC * 9/5 + 32;
      const stdDev = climateZone === 'moderate' ? 8 : 12; // Temperature variation
      
      // Normal distribution approximation
      const zscore = Math.abs(tempF - monthAvgF) / stdDev;
      const probability = Math.exp(-0.5 * zscore * zscore) / (stdDev * 2.5);
      const hoursInBin = Math.round(MONTHLY_HOURS[m] * probability * 5);
      
      totalHours += hoursInBin;
      avgRH += avgMonthlyRH[m] * hoursInBin;
    }
    
    avgRH = totalHours > 0 ? avgRH / totalHours : 30;
    
    bins.push({
      tempCenterF: tempF,
      tempCenterC: tempC,
      rhPercent: Math.round(avgRH),
      annualHours: totalHours,
      coolingHours: tempF >= 75 ? totalHours : 0,
      heatingHours: tempF <= 65 ? totalHours : 0,
    });
  }
  
  return bins.filter(b => b.annualHours > 0);
}

function generateMonthlyData(
  avgMonthlyTemps: number[],
  avgMonthlyRH: number[]
): MonthlyWeatherProfile[] {
  return avgMonthlyTemps.map((temp, i) => ({
    month: MONTH_NAMES[i],
    avgTempC: temp,
    avgRH: avgMonthlyRH[i],
    coolingHours: temp > 24 ? Math.round(MONTHLY_HOURS[i] * 0.7) : Math.round(MONTHLY_HOURS[i] * 0.3 * (temp / 24)),
    heatingHours: temp < 18 ? Math.round(MONTHLY_HOURS[i] * 0.5 * ((18 - temp) / 18)) : 0,
    totalHours: MONTHLY_HOURS[i],
  }));
}

// Riyadh - Hot-Dry Desert Climate (BWh)
const RIYADH_TEMPS = [14.5, 17.0, 21.5, 27.0, 33.0, 36.5, 38.0, 38.0, 34.5, 29.0, 22.0, 16.0];
const RIYADH_RH = [45, 35, 28, 22, 15, 10, 10, 12, 15, 22, 35, 45];

// Jeddah - Hot-Humid Coastal (BWh with maritime influence)
const JEDDAH_TEMPS = [23.0, 23.5, 25.5, 28.5, 31.5, 33.0, 34.0, 34.5, 33.5, 31.0, 28.0, 24.5];
const JEDDAH_RH = [60, 58, 56, 55, 52, 48, 50, 55, 60, 62, 62, 62];

// Dammam - Hot-Humid Coastal Gulf
const DAMMAM_TEMPS = [15.0, 17.0, 21.0, 26.5, 33.0, 36.0, 37.5, 37.0, 34.0, 29.0, 22.5, 17.0];
const DAMMAM_RH = [65, 60, 50, 42, 35, 30, 35, 45, 55, 55, 60, 65];

// Makkah - Hot-Dry Interior
const MAKKAH_TEMPS = [24.0, 24.5, 27.0, 31.0, 34.5, 36.5, 37.0, 37.0, 36.0, 33.0, 29.0, 25.5];
const MAKKAH_RH = [55, 50, 45, 38, 32, 28, 30, 35, 42, 48, 52, 55];

// Madinah - Hot-Dry Interior
const MADINAH_TEMPS = [15.5, 18.0, 22.5, 28.0, 33.5, 36.5, 37.5, 37.5, 35.0, 29.5, 23.0, 17.0];
const MADINAH_RH = [45, 38, 30, 22, 15, 10, 12, 15, 18, 25, 35, 45];

// Abha - Moderate Highland (Cwb)
const ABHA_TEMPS = [13.0, 14.5, 16.5, 18.5, 21.0, 23.5, 24.0, 24.0, 22.0, 18.5, 15.0, 13.0];
const ABHA_RH = [55, 50, 48, 50, 45, 35, 40, 50, 55, 55, 55, 55];

// Tabuk - Hot-Dry with Cool Winters
const TABUK_TEMPS = [9.0, 11.5, 15.5, 21.0, 26.5, 30.5, 32.0, 32.0, 29.0, 23.0, 16.0, 10.5];
const TABUK_RH = [50, 42, 32, 25, 18, 12, 12, 15, 20, 28, 40, 50];

export const SAUDI_WEATHER_BINS: CityWeatherProfile[] = [
  {
    cityId: 'riyadh',
    name: 'Riyadh',
    nameAr: 'الرياض',
    climateZone: 'hot_dry',
    latitude: 24.7136,
    longitude: 46.6753,
    elevation: 612,
    bins: generateBins(RIYADH_TEMPS, RIYADH_RH, 'hot_dry'),
    monthlyData: generateMonthlyData(RIYADH_TEMPS, RIYADH_RH),
    designConditions: {
      coolingDB99: 46.0,
      coolingWB99: 22.5,
      heatingDB99: 6.0,
      annualCoolingHours: 4500,
      annualHeatingHours: 600,
    },
    degreeDays: {
      heatingBase65F: 400,
      coolingBase65F: 4200,
      coolingBase50F: 5800,
    },
  },
  {
    cityId: 'jeddah',
    name: 'Jeddah',
    nameAr: 'جدة',
    climateZone: 'hot_humid',
    latitude: 21.4858,
    longitude: 39.1925,
    elevation: 12,
    bins: generateBins(JEDDAH_TEMPS, JEDDAH_RH, 'hot_humid'),
    monthlyData: generateMonthlyData(JEDDAH_TEMPS, JEDDAH_RH),
    designConditions: {
      coolingDB99: 43.0,
      coolingWB99: 30.5,
      heatingDB99: 16.0,
      annualCoolingHours: 5200,
      annualHeatingHours: 100,
    },
    degreeDays: {
      heatingBase65F: 50,
      coolingBase65F: 4800,
      coolingBase50F: 6500,
    },
  },
  {
    cityId: 'dammam',
    name: 'Dammam',
    nameAr: 'الدمام',
    climateZone: 'hot_humid',
    latitude: 26.4207,
    longitude: 50.0888,
    elevation: 10,
    bins: generateBins(DAMMAM_TEMPS, DAMMAM_RH, 'hot_humid'),
    monthlyData: generateMonthlyData(DAMMAM_TEMPS, DAMMAM_RH),
    designConditions: {
      coolingDB99: 46.0,
      coolingWB99: 28.5,
      heatingDB99: 5.0,
      annualCoolingHours: 4800,
      annualHeatingHours: 400,
    },
    degreeDays: {
      heatingBase65F: 300,
      coolingBase65F: 4400,
      coolingBase50F: 6000,
    },
  },
  {
    cityId: 'makkah',
    name: 'Makkah',
    nameAr: 'مكة المكرمة',
    climateZone: 'hot_dry',
    latitude: 21.3891,
    longitude: 39.8579,
    elevation: 277,
    bins: generateBins(MAKKAH_TEMPS, MAKKAH_RH, 'hot_dry'),
    monthlyData: generateMonthlyData(MAKKAH_TEMPS, MAKKAH_RH),
    designConditions: {
      coolingDB99: 47.0,
      coolingWB99: 26.0,
      heatingDB99: 14.0,
      annualCoolingHours: 5500,
      annualHeatingHours: 50,
    },
    degreeDays: {
      heatingBase65F: 20,
      coolingBase65F: 5000,
      coolingBase50F: 6800,
    },
  },
  {
    cityId: 'madinah',
    name: 'Madinah',
    nameAr: 'المدينة المنورة',
    climateZone: 'hot_dry',
    latitude: 24.5247,
    longitude: 39.5692,
    elevation: 608,
    bins: generateBins(MADINAH_TEMPS, MADINAH_RH, 'hot_dry'),
    monthlyData: generateMonthlyData(MADINAH_TEMPS, MADINAH_RH),
    designConditions: {
      coolingDB99: 46.5,
      coolingWB99: 21.0,
      heatingDB99: 6.5,
      annualCoolingHours: 4600,
      annualHeatingHours: 500,
    },
    degreeDays: {
      heatingBase65F: 350,
      coolingBase65F: 4300,
      coolingBase50F: 5900,
    },
  },
  {
    cityId: 'abha',
    name: 'Abha',
    nameAr: 'أبها',
    climateZone: 'moderate',
    latitude: 18.2164,
    longitude: 42.5053,
    elevation: 2270,
    bins: generateBins(ABHA_TEMPS, ABHA_RH, 'moderate'),
    monthlyData: generateMonthlyData(ABHA_TEMPS, ABHA_RH),
    designConditions: {
      coolingDB99: 32.0,
      coolingWB99: 18.0,
      heatingDB99: 4.0,
      annualCoolingHours: 2000,
      annualHeatingHours: 1200,
    },
    degreeDays: {
      heatingBase65F: 1400,
      coolingBase65F: 1500,
      coolingBase50F: 3200,
    },
  },
  {
    cityId: 'tabuk',
    name: 'Tabuk',
    nameAr: 'تبوك',
    climateZone: 'hot_dry',
    latitude: 28.3998,
    longitude: 36.5715,
    elevation: 770,
    bins: generateBins(TABUK_TEMPS, TABUK_RH, 'hot_dry'),
    monthlyData: generateMonthlyData(TABUK_TEMPS, TABUK_RH),
    designConditions: {
      coolingDB99: 42.0,
      coolingWB99: 19.0,
      heatingDB99: 0.0,
      annualCoolingHours: 3800,
      annualHeatingHours: 800,
    },
    degreeDays: {
      heatingBase65F: 900,
      coolingBase65F: 3200,
      coolingBase50F: 4600,
    },
  },
];

/**
 * Get city weather profile by ID
 */
export function getCityWeatherProfile(cityId: string): CityWeatherProfile | undefined {
  return SAUDI_WEATHER_BINS.find(c => c.cityId === cityId);
}

/**
 * Get cities by climate zone
 */
export function getCitiesByClimateZone(zone: ClimateZone): CityWeatherProfile[] {
  return SAUDI_WEATHER_BINS.filter(c => c.climateZone === zone);
}

/**
 * Calculate bin hours for a specific temperature range
 */
export function getBinHoursInRange(
  cityId: string,
  minTempF: number,
  maxTempF: number
): number {
  const city = getCityWeatherProfile(cityId);
  if (!city) return 0;
  
  return city.bins
    .filter(b => b.tempCenterF >= minTempF && b.tempCenterF <= maxTempF)
    .reduce((sum, b) => sum + b.annualHours, 0);
}

/**
 * Get climate zone description
 */
export function getClimateZoneDescription(zone: ClimateZone): string {
  switch (zone) {
    case 'hot_dry':
      return 'Hot-Dry Desert: High cooling loads, minimal latent loads in summer, some heating needed in winter';
    case 'hot_humid':
      return 'Hot-Humid Coastal: Year-round cooling, significant latent loads, ERV strongly recommended';
    case 'moderate':
      return 'Moderate Highland: Balanced heating and cooling, lower peak loads';
    default:
      return '';
  }
}

/**
 * Get ERV recommendation based on climate zone
 */
export function getERVRecommendation(zone: ClimateZone): {
  recommended: 'erv' | 'hrv' | 'either';
  reason: string;
  latentLoadPercent: string;
} {
  switch (zone) {
    case 'hot_humid':
      return {
        recommended: 'erv',
        reason: 'ERV strongly recommended - significant latent loads require moisture transfer',
        latentLoadPercent: '35-45%',
      };
    case 'hot_dry':
      return {
        recommended: 'either',
        reason: 'HRV acceptable for cost savings, ERV provides marginal benefit in humid months',
        latentLoadPercent: '10-20%',
      };
    case 'moderate':
      return {
        recommended: 'erv',
        reason: 'ERV preferred for balanced performance across seasons',
        latentLoadPercent: '20-30%',
      };
    default:
      return {
        recommended: 'either',
        reason: 'Consider project-specific requirements',
        latentLoadPercent: '15-25%',
      };
  }
}
