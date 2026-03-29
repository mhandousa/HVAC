// ASHRAE Standard 55 Thermal Comfort Calculations
// PMV-PPD Model and Adaptive Comfort

export interface ThermalComfortInputs {
  airTemp_C: number;
  meanRadiantTemp_C: number;
  airVelocity_m_s: number;
  relativeHumidity_percent: number;
  metabolicRate_met: number;
  clothingInsulation_clo: number;
}

export interface PMVResult {
  pmv: number;
  ppd: number;
  thermalSensation: string;
  withinComfortZone: boolean;
}

export interface AdaptiveComfortResult {
  neutralTemp_C: number;
  comfortRangeLower_C: number;
  comfortRangeUpper_C: number;
  operativeTemp_C: number;
  withinComfortZone: boolean;
  acceptability: '80%' | '90%';
}

export interface LocalDiscomfortResult {
  draftRisk_percent: number;
  verticalTempDiff_acceptable: boolean;
  radiantAsymmetry_acceptable: boolean;
  floorTemp_acceptable: boolean;
}

// Standard metabolic rates (met)
export const METABOLIC_RATES = [
  { id: 'seated-quiet', name: 'Seated, quiet', met: 1.0 },
  { id: 'seated-office', name: 'Seated, office work', met: 1.1 },
  { id: 'standing-relaxed', name: 'Standing, relaxed', met: 1.2 },
  { id: 'standing-light', name: 'Standing, light activity', met: 1.6 },
  { id: 'walking-slow', name: 'Walking (0.9 m/s)', met: 2.0 },
  { id: 'walking-moderate', name: 'Walking (1.2 m/s)', met: 2.6 },
  { id: 'cooking', name: 'Cooking', met: 1.8 },
  { id: 'cleaning', name: 'House cleaning', met: 2.7 },
  { id: 'exercise-moderate', name: 'Moderate exercise', met: 3.5 },
  { id: 'exercise-heavy', name: 'Heavy exercise', met: 5.0 },
];

// Standard clothing insulation (clo)
export const CLOTHING_ENSEMBLES = [
  { id: 'nude', name: 'Nude', clo: 0.0 },
  { id: 'shorts', name: 'Shorts', clo: 0.1 },
  { id: 'light-summer', name: 'Light summer clothing', clo: 0.3 },
  { id: 'typical-summer', name: 'Typical summer indoor', clo: 0.5 },
  { id: 'light-trousers', name: 'Trousers + short-sleeve shirt', clo: 0.57 },
  { id: 'office-summer', name: 'Summer office attire', clo: 0.6 },
  { id: 'typical-winter', name: 'Typical winter indoor', clo: 1.0 },
  { id: 'winter-suit', name: 'Business suit', clo: 1.0 },
  { id: 'heavy-winter', name: 'Heavy winter clothing', clo: 1.5 },
];

// Calculate operative temperature
export function calculateOperativeTemp(
  airTemp_C: number,
  meanRadiantTemp_C: number,
  airVelocity_m_s: number
): number {
  // Simplified: for low air velocities (<0.2 m/s), operative temp ≈ average
  if (airVelocity_m_s < 0.2) {
    return (airTemp_C + meanRadiantTemp_C) / 2;
  }
  
  // For higher velocities, weight more toward air temperature
  const A = airVelocity_m_s < 0.6 ? 0.5 : 0.6;
  return A * airTemp_C + (1 - A) * meanRadiantTemp_C;
}

// Calculate saturation vapor pressure (kPa)
function saturationVaporPressure(temp_C: number): number {
  return 0.6108 * Math.exp((17.27 * temp_C) / (temp_C + 237.3));
}

// Calculate PMV (Predicted Mean Vote)
// Based on ISO 7730 / ASHRAE Standard 55
export function calculatePMV(inputs: ThermalComfortInputs): PMVResult {
  const {
    airTemp_C,
    meanRadiantTemp_C,
    airVelocity_m_s,
    relativeHumidity_percent,
    metabolicRate_met,
    clothingInsulation_clo,
  } = inputs;

  // Convert to SI units for calculations
  const M = metabolicRate_met * 58.15; // W/m²
  const W = 0; // External work (typically 0 for sedentary)
  const Icl = clothingInsulation_clo * 0.155; // m²·K/W
  const ta = airTemp_C;
  const tr = meanRadiantTemp_C;
  const va = Math.max(airVelocity_m_s, 0.05); // Minimum velocity
  const pa = (relativeHumidity_percent / 100) * saturationVaporPressure(ta) * 1000; // Pa

  // Clothing surface area factor
  let fcl: number;
  if (Icl <= 0.078) {
    fcl = 1.0 + 1.29 * Icl;
  } else {
    fcl = 1.05 + 0.645 * Icl;
  }

  // Heat transfer coefficient by convection
  const hc_forced = 12.1 * Math.sqrt(va);
  
  // Iterative calculation for clothing surface temperature
  let tcl = ta + (35.5 - ta) / (3.5 * (6.45 * Icl + 0.1));
  const maxIterations = 100;
  
  for (let i = 0; i < maxIterations; i++) {
    const hc_natural = 2.38 * Math.pow(Math.abs(tcl - ta), 0.25);
    const hc = Math.max(hc_forced, hc_natural);
    
    const tcl_new = 35.7 - 0.028 * (M - W) - Icl * (
      3.96e-8 * fcl * (Math.pow(tcl + 273, 4) - Math.pow(tr + 273, 4)) +
      fcl * hc * (tcl - ta)
    );
    
    if (Math.abs(tcl_new - tcl) < 0.001) {
      tcl = tcl_new;
      break;
    }
    tcl = tcl_new;
  }

  // Recalculate hc with final tcl
  const hc_natural_final = 2.38 * Math.pow(Math.abs(tcl - ta), 0.25);
  const hc = Math.max(hc_forced, hc_natural_final);

  // PMV calculation
  const PMV = (0.303 * Math.exp(-0.036 * M) + 0.028) * (
    (M - W) -
    3.05e-3 * (5733 - 6.99 * (M - W) - pa) -
    0.42 * ((M - W) - 58.15) -
    1.7e-5 * M * (5867 - pa) -
    0.0014 * M * (34 - ta) -
    3.96e-8 * fcl * (Math.pow(tcl + 273, 4) - Math.pow(tr + 273, 4)) -
    fcl * hc * (tcl - ta)
  );

  // Clamp PMV to valid range
  const pmv = Math.max(-3, Math.min(3, PMV));

  // PPD calculation
  const PPD = 100 - 95 * Math.exp(-0.03353 * Math.pow(pmv, 4) - 0.2179 * Math.pow(pmv, 2));
  const ppd = Math.max(5, Math.min(100, PPD));

  // Thermal sensation description
  let thermalSensation: string;
  if (pmv <= -2.5) thermalSensation = 'Cold';
  else if (pmv <= -1.5) thermalSensation = 'Cool';
  else if (pmv <= -0.5) thermalSensation = 'Slightly Cool';
  else if (pmv <= 0.5) thermalSensation = 'Neutral';
  else if (pmv <= 1.5) thermalSensation = 'Slightly Warm';
  else if (pmv <= 2.5) thermalSensation = 'Warm';
  else thermalSensation = 'Hot';

  // ASHRAE 55 comfort zone: -0.5 ≤ PMV ≤ +0.5
  const withinComfortZone = pmv >= -0.5 && pmv <= 0.5;

  return { pmv, ppd, thermalSensation, withinComfortZone };
}

// Calculate adaptive comfort (for naturally ventilated spaces)
export function calculateAdaptiveComfort(
  operativeTemp_C: number,
  prevailingMeanOutdoorTemp_C: number,
  acceptability: '80%' | '90%' = '80%'
): AdaptiveComfortResult {
  // Adaptive model only valid for:
  // - Naturally conditioned spaces
  // - Prevailing outdoor temp between 10-33.5°C
  // - Sedentary activity (1.0-1.3 met)
  
  const t_out = Math.max(10, Math.min(33.5, prevailingMeanOutdoorTemp_C));
  
  // Neutral (comfort) temperature
  const neutralTemp = 0.31 * t_out + 17.8;
  
  // Acceptable range
  const acceptableRange = acceptability === '90%' ? 2.5 : 3.5;
  
  const comfortRangeLower = neutralTemp - acceptableRange;
  const comfortRangeUpper = neutralTemp + acceptableRange;
  
  const withinComfortZone = operativeTemp_C >= comfortRangeLower && operativeTemp_C <= comfortRangeUpper;
  
  return {
    neutralTemp_C: neutralTemp,
    comfortRangeLower_C: comfortRangeLower,
    comfortRangeUpper_C: comfortRangeUpper,
    operativeTemp_C,
    withinComfortZone,
    acceptability,
  };
}

// Draft Risk calculation (ASHRAE 55 Section 5.3.4)
export function calculateDraftRisk(
  airTemp_C: number,
  meanAirVelocity_m_s: number,
  turbulenceIntensity_percent: number = 40
): number {
  // DR = (34 - ta) × (v - 0.05)^0.62 × (0.37 × v × Tu + 3.14)
  // Where:
  // ta = local air temperature (°C)
  // v = local mean air velocity (m/s)
  // Tu = turbulence intensity (%)
  
  if (meanAirVelocity_m_s < 0.05) return 0;
  
  const v = meanAirVelocity_m_s;
  const Tu = turbulenceIntensity_percent;
  
  const DR = (34 - airTemp_C) * Math.pow(v - 0.05, 0.62) * (0.37 * v * Tu + 3.14);
  
  return Math.max(0, Math.min(100, DR));
}

// Local discomfort checks
export function checkLocalDiscomfort(
  ankleTemp_C: number,
  headTemp_C: number,
  floorTemp_C: number,
  ceilingTemp_C: number,
  wallTemp_C: number,
  draftRisk_percent: number
): LocalDiscomfortResult {
  // Vertical temperature difference (head to ankle)
  // Should be less than 3°C for comfort
  const verticalDiff = Math.abs(headTemp_C - ankleTemp_C);
  const verticalTempDiff_acceptable = verticalDiff < 3;
  
  // Radiant temperature asymmetry limits
  // Warm ceiling: <5°C, Cool wall: <10°C, Cool ceiling: <14°C, Warm wall: <23°C
  const ceilingAsymmetry = Math.abs(ceilingTemp_C - ankleTemp_C);
  const wallAsymmetry = Math.abs(wallTemp_C - ankleTemp_C);
  const radiantAsymmetry_acceptable = ceilingAsymmetry < 5 && wallAsymmetry < 10;
  
  // Floor temperature (for seated/standing occupants)
  // Should be between 19-29°C
  const floorTemp_acceptable = floorTemp_C >= 19 && floorTemp_C <= 29;
  
  return {
    draftRisk_percent,
    verticalTempDiff_acceptable,
    radiantAsymmetry_acceptable,
    floorTemp_acceptable,
  };
}

// Calculate SET* (Standard Effective Temperature)
export function calculateSET(inputs: ThermalComfortInputs): number {
  // Simplified SET* calculation
  // SET* is the temperature of a standard environment (50% RH, 0.15 m/s air, MRT=air temp)
  // that would produce the same thermal strain as the actual environment
  
  const pmvResult = calculatePMV(inputs);
  
  // Approximate: SET* ≈ operative temp adjusted for humidity and air movement
  const operativeTemp = calculateOperativeTemp(
    inputs.airTemp_C,
    inputs.meanRadiantTemp_C,
    inputs.airVelocity_m_s
  );
  
  // Humidity adjustment (simplified)
  const humidityEffect = (inputs.relativeHumidity_percent - 50) * 0.02;
  
  // Activity adjustment
  const activityEffect = (inputs.metabolicRate_met - 1.0) * 2;
  
  // Clothing adjustment
  const clothingEffect = (0.5 - inputs.clothingInsulation_clo) * 3;
  
  return operativeTemp + humidityEffect + activityEffect + clothingEffect;
}

// Celsius to Fahrenheit
export function cToF(celsius: number): number {
  return celsius * 9 / 5 + 32;
}

// Fahrenheit to Celsius
export function fToC(fahrenheit: number): number {
  return (fahrenheit - 32) * 5 / 9;
}

// Comfort zone boundaries for psychrometric chart
export function getComfortZoneBoundaries(clothingLevel: 'summer' | 'winter'): {
  tempRange: { min: number; max: number };
  humidityRange: { min: number; max: number };
} {
  if (clothingLevel === 'summer') {
    // 0.5 clo
    return {
      tempRange: { min: 23, max: 27 },
      humidityRange: { min: 30, max: 60 },
    };
  } else {
    // 1.0 clo
    return {
      tempRange: { min: 20, max: 24 },
      humidityRange: { min: 30, max: 60 },
    };
  }
}
