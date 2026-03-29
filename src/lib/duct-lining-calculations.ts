// Duct Lining Optimization Calculations
// Based on ASHRAE Handbook - HVAC Applications, Chapter 48

import { OctaveBandData, OCTAVE_BAND_FREQUENCIES, OctaveBandFrequency, interpolateNCCurve, calculateNCFromOctaveBands } from './nc-reference-curves';

export interface DuctLiningType {
  id: string;
  name: string;
  description: string;
  material: 'fiberglass' | 'mineral_wool' | 'foam';
  thickness: number;  // inches
  insertionLoss: OctaveBandData;  // dB per linear foot
  frictionFactor: number;  // relative to bare metal (1.0)
  maxVelocity: number;  // FPM
  applications: string[];
}

// Standard duct lining types with insertion loss data
export const DUCT_LINING_TYPES: Record<string, DuctLiningType> = {
  fiberglass_1in: {
    id: 'fiberglass_1in',
    name: '1" Fiberglass',
    description: '1-inch fiberglass duct liner',
    material: 'fiberglass',
    thickness: 1,
    insertionLoss: { '63Hz': 0.05, '125Hz': 0.10, '250Hz': 0.25, '500Hz': 0.55, '1kHz': 0.80, '2kHz': 0.90, '4kHz': 0.85, '8kHz': 0.80 },
    frictionFactor: 1.15,
    maxVelocity: 4000,
    applications: ['Standard HVAC', 'Office buildings', 'Hospitals'],
  },
  fiberglass_1_5in: {
    id: 'fiberglass_1_5in',
    name: '1.5" Fiberglass',
    description: '1.5-inch fiberglass duct liner',
    material: 'fiberglass',
    thickness: 1.5,
    insertionLoss: { '63Hz': 0.10, '125Hz': 0.20, '250Hz': 0.40, '500Hz': 0.75, '1kHz': 1.00, '2kHz': 1.05, '4kHz': 0.95, '8kHz': 0.85 },
    frictionFactor: 1.20,
    maxVelocity: 3500,
    applications: ['Noise-sensitive areas', 'Conference rooms', 'Theaters'],
  },
  fiberglass_2in: {
    id: 'fiberglass_2in',
    name: '2" Fiberglass',
    description: '2-inch fiberglass duct liner',
    material: 'fiberglass',
    thickness: 2,
    insertionLoss: { '63Hz': 0.15, '125Hz': 0.30, '250Hz': 0.55, '500Hz': 0.95, '1kHz': 1.20, '2kHz': 1.15, '4kHz': 1.00, '8kHz': 0.90 },
    frictionFactor: 1.25,
    maxVelocity: 3000,
    applications: ['Critical acoustic applications', 'Studios', 'Auditoriums'],
  },
  mineral_wool_1in: {
    id: 'mineral_wool_1in',
    name: '1" Mineral Wool',
    description: '1-inch mineral wool duct liner',
    material: 'mineral_wool',
    thickness: 1,
    insertionLoss: { '63Hz': 0.08, '125Hz': 0.15, '250Hz': 0.30, '500Hz': 0.60, '1kHz': 0.85, '2kHz': 0.95, '4kHz': 0.90, '8kHz': 0.85 },
    frictionFactor: 1.18,
    maxVelocity: 4000,
    applications: ['Higher temperature applications', 'Industrial'],
  },
  mineral_wool_2in: {
    id: 'mineral_wool_2in',
    name: '2" Mineral Wool',
    description: '2-inch mineral wool duct liner',
    material: 'mineral_wool',
    thickness: 2,
    insertionLoss: { '63Hz': 0.18, '125Hz': 0.35, '250Hz': 0.60, '500Hz': 1.00, '1kHz': 1.25, '2kHz': 1.20, '4kHz': 1.05, '8kHz': 0.95 },
    frictionFactor: 1.28,
    maxVelocity: 3000,
    applications: ['High-performance acoustic', 'Fire-rated applications'],
  },
  foam_1in: {
    id: 'foam_1in',
    name: '1" Closed-Cell Foam',
    description: '1-inch closed-cell foam liner',
    material: 'foam',
    thickness: 1,
    insertionLoss: { '63Hz': 0.02, '125Hz': 0.05, '250Hz': 0.15, '500Hz': 0.35, '1kHz': 0.60, '2kHz': 0.75, '4kHz': 0.70, '8kHz': 0.65 },
    frictionFactor: 1.08,
    maxVelocity: 5000,
    applications: ['Clean rooms', 'Hospitals', 'Labs'],
  },
};

export interface DuctLiningInput {
  sourceLevels: OctaveBandData;       // Current noise levels (dB)
  targetNC: number;                    // Target NC rating
  ductWidthIn: number;                 // Duct width (inches)
  ductHeightIn: number;                // Duct height (inches)
  velocityFpm: number;                 // Air velocity (FPM)
  maxPressureDropPa: number;           // Maximum allowable pressure drop (Pa)
  availableLengthFt: number;           // Maximum available duct length for lining
}

export interface LiningOption {
  liningType: DuctLiningType;
  requiredLengthFt: number;
  achievedAttenuation: OctaveBandData;
  resultingLevels: OctaveBandData;
  resultingNC: number;
  pressureDropPa: number;
  pressureDropPercent: number;         // Of max allowed
  selfNoiseNC: number;                 // Generated noise from lined duct
  isWithinLength: boolean;
  isWithinPressure: boolean;
  isSuitable: boolean;
  notes: string[];
}

export interface DuctLiningResult {
  currentNC: number;
  targetNC: number;
  requiredReduction: number;           // dB
  criticalFrequencies: OctaveBandFrequency[];
  options: LiningOption[];
  recommendedOption: LiningOption | null;
  alternativeRecommendations: string[];
}

/**
 * Calculate self-noise from lined duct based on velocity
 * Higher velocities generate more noise, especially at high frequencies
 */
export function calculateLinedDuctSelfNoise(velocityFpm: number): OctaveBandData {
  // Based on ASHRAE empirical data
  // Noise increases roughly with velocity^5 power law
  const baseNC = 15 + 20 * Math.log10(velocityFpm / 1000);
  
  return {
    '63Hz': baseNC + 5,
    '125Hz': baseNC + 3,
    '250Hz': baseNC + 1,
    '500Hz': baseNC,
    '1kHz': baseNC - 2,
    '2kHz': baseNC - 4,
    '4kHz': baseNC - 7,
    '8kHz': baseNC - 10,
  };
}

/**
 * Calculate pressure drop for lined duct section
 * ΔP = f × (L/D) × (ρV²/2)
 */
export function calculateLinedDuctPressureDrop(
  lengthFt: number,
  widthIn: number,
  heightIn: number,
  velocityFpm: number,
  frictionFactor: number
): number {
  // Convert to metric for calculation
  const lengthM = lengthFt * 0.3048;
  const widthM = widthIn * 0.0254;
  const heightM = heightIn * 0.0254;
  const velocityMs = velocityFpm * 0.00508;
  
  // Hydraulic diameter for rectangular duct
  const area = widthM * heightM;
  const perimeter = 2 * (widthM + heightM);
  const Dh = (4 * area) / perimeter;
  
  // Air density at standard conditions
  const rho = 1.2;  // kg/m³
  
  // Base friction factor for smooth duct ≈ 0.02
  const f = 0.02 * frictionFactor;
  
  // Darcy-Weisbach equation
  const pressureDrop = f * (lengthM / Dh) * (rho * velocityMs * velocityMs / 2);
  
  return pressureDrop;  // Pa
}

/**
 * Calculate perimeter/area ratio correction factor
 * Larger ducts have less attenuation per foot
 */
function getPerimeterAreaFactor(widthIn: number, heightIn: number): number {
  const perimeterIn = 2 * (widthIn + heightIn);
  const areaIn2 = widthIn * heightIn;
  const ratio = perimeterIn / areaIn2;
  
  // Normalize to 12x12 duct (ratio = 0.333)
  // Smaller ducts (higher ratio) have more attenuation
  // Larger ducts (lower ratio) have less attenuation
  return ratio / 0.333;
}

/**
 * Calculate required lining length to achieve target attenuation
 */
function calculateRequiredLength(
  sourceLevels: OctaveBandData,
  targetCurve: OctaveBandData,
  insertionLoss: OctaveBandData,
  paFactor: number
): { length: number; criticalFrequency: OctaveBandFrequency } {
  let maxLength = 0;
  let criticalFreq: OctaveBandFrequency = '500Hz';
  
  for (const freq of OCTAVE_BAND_FREQUENCIES) {
    const required = Math.max(0, sourceLevels[freq] - targetCurve[freq] + 3);  // +3 dB safety margin
    const effectiveIL = insertionLoss[freq] * paFactor;
    
    if (effectiveIL > 0) {
      const length = required / effectiveIL;
      if (length > maxLength) {
        maxLength = length;
        criticalFreq = freq;
      }
    }
  }
  
  return { length: maxLength, criticalFrequency: criticalFreq };
}

/**
 * Calculate resulting sound levels after lining
 */
function calculateResultingLevels(
  sourceLevels: OctaveBandData,
  insertionLoss: OctaveBandData,
  lengthFt: number,
  paFactor: number,
  selfNoise: OctaveBandData
): OctaveBandData {
  const result: OctaveBandData = {
    '63Hz': 0, '125Hz': 0, '250Hz': 0, '500Hz': 0,
    '1kHz': 0, '2kHz': 0, '4kHz': 0, '8kHz': 0,
  };
  
  for (const freq of OCTAVE_BAND_FREQUENCIES) {
    const attenuatedLevel = sourceLevels[freq] - (insertionLoss[freq] * lengthFt * paFactor);
    // Combine with self-noise (logarithmic addition)
    const sourceEnergy = Math.pow(10, attenuatedLevel / 10);
    const selfEnergy = Math.pow(10, selfNoise[freq] / 10);
    result[freq] = 10 * Math.log10(sourceEnergy + selfEnergy);
  }
  
  return result;
}

/**
 * Evaluate a single lining option
 */
function evaluateLiningOption(
  liningType: DuctLiningType,
  input: DuctLiningInput,
  targetCurve: OctaveBandData,
  paFactor: number
): LiningOption {
  const notes: string[] = [];
  
  // Check velocity limit
  if (input.velocityFpm > liningType.maxVelocity) {
    notes.push(`Velocity (${input.velocityFpm} FPM) exceeds max (${liningType.maxVelocity} FPM)`);
  }
  
  // Calculate required length
  const { length: requiredLength, criticalFrequency } = calculateRequiredLength(
    input.sourceLevels,
    targetCurve,
    liningType.insertionLoss,
    paFactor
  );
  
  // Calculate self-noise
  const selfNoise = calculateLinedDuctSelfNoise(input.velocityFpm);
  const selfNoiseNC = calculateNCFromOctaveBands(selfNoise);
  
  // Use available length or required length, whichever is less
  const actualLength = Math.min(requiredLength, input.availableLengthFt);
  
  // Calculate resulting levels
  const resultingLevels = calculateResultingLevels(
    input.sourceLevels,
    liningType.insertionLoss,
    actualLength,
    paFactor,
    selfNoise
  );
  
  // Calculate achieved attenuation
  const achievedAttenuation: OctaveBandData = {
    '63Hz': input.sourceLevels['63Hz'] - resultingLevels['63Hz'],
    '125Hz': input.sourceLevels['125Hz'] - resultingLevels['125Hz'],
    '250Hz': input.sourceLevels['250Hz'] - resultingLevels['250Hz'],
    '500Hz': input.sourceLevels['500Hz'] - resultingLevels['500Hz'],
    '1kHz': input.sourceLevels['1kHz'] - resultingLevels['1kHz'],
    '2kHz': input.sourceLevels['2kHz'] - resultingLevels['2kHz'],
    '4kHz': input.sourceLevels['4kHz'] - resultingLevels['4kHz'],
    '8kHz': input.sourceLevels['8kHz'] - resultingLevels['8kHz'],
  };
  
  const resultingNC = calculateNCFromOctaveBands(resultingLevels);
  
  // Calculate pressure drop
  const pressureDrop = calculateLinedDuctPressureDrop(
    actualLength,
    input.ductWidthIn - 2 * liningType.thickness,  // Effective inside dimension
    input.ductHeightIn - 2 * liningType.thickness,
    input.velocityFpm,
    liningType.frictionFactor
  );
  
  const pressureDropPercent = (pressureDrop / input.maxPressureDropPa) * 100;
  
  const isWithinLength = requiredLength <= input.availableLengthFt;
  const isWithinPressure = pressureDrop <= input.maxPressureDropPa;
  const achievesTarget = resultingNC <= input.targetNC;
  
  if (!isWithinLength) {
    notes.push(`Requires ${requiredLength.toFixed(1)} ft (${input.availableLengthFt} ft available)`);
  }
  if (!isWithinPressure) {
    notes.push(`Pressure drop exceeds limit (${pressureDrop.toFixed(0)} Pa vs ${input.maxPressureDropPa} Pa)`);
  }
  if (!achievesTarget) {
    notes.push(`Resulting NC-${resultingNC} exceeds target NC-${input.targetNC}`);
  }
  if (selfNoiseNC > input.targetNC - 5) {
    notes.push(`Self-noise (NC-${selfNoiseNC}) may limit performance`);
  }
  
  const isSuitable = isWithinLength && isWithinPressure && achievesTarget && 
                     input.velocityFpm <= liningType.maxVelocity;
  
  if (isSuitable) {
    notes.push(`Critical frequency: ${criticalFrequency}`);
    notes.push(...liningType.applications.slice(0, 2));
  }
  
  return {
    liningType,
    requiredLengthFt: Math.round(requiredLength * 10) / 10,
    achievedAttenuation,
    resultingLevels,
    resultingNC,
    pressureDropPa: Math.round(pressureDrop * 10) / 10,
    pressureDropPercent: Math.round(pressureDropPercent),
    selfNoiseNC,
    isWithinLength,
    isWithinPressure,
    isSuitable,
    notes,
  };
}

/**
 * Perform complete duct lining optimization analysis
 */
export function analyzeDuctLining(input: DuctLiningInput): DuctLiningResult {
  const currentNC = calculateNCFromOctaveBands(input.sourceLevels);
  const targetCurve = interpolateNCCurve(input.targetNC);
  const requiredReduction = Math.max(0, currentNC - input.targetNC);
  
  // Calculate P/A factor for this duct size
  const paFactor = getPerimeterAreaFactor(input.ductWidthIn, input.ductHeightIn);
  
  // Find critical frequencies (where source exceeds target most)
  const criticalFrequencies: OctaveBandFrequency[] = [];
  for (const freq of OCTAVE_BAND_FREQUENCIES) {
    if (input.sourceLevels[freq] > targetCurve[freq]) {
      criticalFrequencies.push(freq);
    }
  }
  
  // Evaluate all lining options
  const options: LiningOption[] = Object.values(DUCT_LINING_TYPES).map(liningType =>
    evaluateLiningOption(liningType, input, targetCurve, paFactor)
  );
  
  // Find recommended option (suitable with shortest length)
  const suitableOptions = options.filter(o => o.isSuitable);
  let recommendedOption: LiningOption | null = null;
  
  if (suitableOptions.length > 0) {
    // Prefer shorter length with lower pressure drop
    recommendedOption = suitableOptions.reduce((best, current) => {
      const bestScore = best.requiredLengthFt + best.pressureDropPercent / 10;
      const currentScore = current.requiredLengthFt + current.pressureDropPercent / 10;
      return currentScore < bestScore ? current : best;
    });
  }
  
  // Generate alternative recommendations if no suitable options
  const alternativeRecommendations: string[] = [];
  if (!recommendedOption) {
    if (criticalFrequencies.includes('63Hz') || criticalFrequencies.includes('125Hz')) {
      alternativeRecommendations.push('Low-frequency dominance detected. Consider silencer instead of lining.');
    }
    if (options.every(o => !o.isWithinLength)) {
      alternativeRecommendations.push('Insufficient duct length. Consider additional treatment downstream.');
    }
    if (options.every(o => !o.isWithinPressure)) {
      alternativeRecommendations.push('Pressure drop too high. Consider larger duct size or external treatment.');
    }
    if (input.velocityFpm > 2500) {
      alternativeRecommendations.push('High velocity increases self-noise. Consider reducing velocity or adding silencer.');
    }
  }
  
  return {
    currentNC,
    targetNC: input.targetNC,
    requiredReduction,
    criticalFrequencies,
    options,
    recommendedOption,
    alternativeRecommendations,
  };
}
