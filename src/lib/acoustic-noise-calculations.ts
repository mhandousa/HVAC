// Acoustic Noise Calculations Library
// Based on ASHRAE Fundamentals and industry standards

import { DuctFitting } from '@/hooks/useFittingsLibrary';

// ============ DUCT FITTING NOISE COEFFICIENTS ============
// Maps fitting categories to noise generation characteristics
// Based on ASHRAE Fundamentals Chapter 48 - Sound and Vibration

export interface FittingNoiseCharacteristics {
  basedB: number;       // Base noise factor at reference velocity
  velocityExp: number;  // Velocity exponent (noise ∝ V^exp)
  turbulenceFactor: number; // Additional turbulence-induced noise
}

export const DUCT_FITTING_NOISE_MAP: Record<string, FittingNoiseCharacteristics> = {
  elbow: { basedB: 5, velocityExp: 1.6, turbulenceFactor: 1.2 },
  tee: { basedB: 10, velocityExp: 1.9, turbulenceFactor: 1.5 },
  transition: { basedB: 4, velocityExp: 1.4, turbulenceFactor: 1.0 },
  damper: { basedB: 8, velocityExp: 1.8, turbulenceFactor: 1.3 },
  entry: { basedB: 6, velocityExp: 1.5, turbulenceFactor: 1.1 },
  exit: { basedB: 3, velocityExp: 1.3, turbulenceFactor: 0.8 },
  takeoff: { basedB: 7, velocityExp: 1.7, turbulenceFactor: 1.4 },
  flex: { basedB: 2, velocityExp: 1.2, turbulenceFactor: 0.6 },
};

// Detailed elbow coefficients based on geometry
export const ELBOW_NOISE_COEFFICIENTS: Record<string, number> = {
  'sharp-90': 12,       // Sharp 90° elbow - high turbulence
  'radius-90-r1.0': 8,  // R/D = 1.0
  'radius-90-r1.5': 5,  // R/D = 1.5 (recommended)
  'radius-90-r2.0': 4,  // R/D = 2.0
  'mitered-90': 10,     // Mitered with no vanes
  'mitered-vanes': 6,   // Mitered with turning vanes
  'sharp-45': 6,        // Sharp 45° elbow
  'radius-45': 3,       // Radius 45° elbow
};

// ============ PIPE FITTING NOISE COEFFICIENTS ============
export const PIPE_FITTING_NOISE_MAP: Record<string, FittingNoiseCharacteristics> = {
  valve: { basedB: 12, velocityExp: 2.0, turbulenceFactor: 1.6 },
  elbow: { basedB: 5, velocityExp: 1.5, turbulenceFactor: 1.0 },
  tee: { basedB: 8, velocityExp: 1.7, turbulenceFactor: 1.3 },
  reducer: { basedB: 6, velocityExp: 1.5, turbulenceFactor: 1.1 },
  strainer: { basedB: 10, velocityExp: 1.8, turbulenceFactor: 1.4 },
  equipment: { basedB: 20, velocityExp: 2.2, turbulenceFactor: 2.0 },
  check_valve: { basedB: 15, velocityExp: 2.0, turbulenceFactor: 1.5 },
  balance_valve: { basedB: 14, velocityExp: 1.9, turbulenceFactor: 1.4 },
};

// Valve-specific coefficients
export const VALVE_NOISE_COEFFICIENTS: Record<string, number> = {
  'globe-full-open': 15,
  'globe-half-open': 25,
  'gate-full-open': 5,
  'ball-full-open': 8,
  'butterfly-full-open': 10,
  'butterfly-half-open': 20,
  'check-swing': 12,
  'check-spring': 15,
};

// ============ CALCULATION FUNCTIONS ============

/**
 * Calculate duct velocity noise (dB)
 * Based on ASHRAE empirical formula: Lw = 10 + 50*log10(V/1000) + 10*log10(A)
 */
export function calculateDuctVelocityNoise(velocityFpm: number, areaSqIn: number): number {
  if (velocityFpm <= 0) return 0;
  
  const areaSqFt = areaSqIn / 144;
  const lw = 10 + 50 * Math.log10(velocityFpm / 1000) + 10 * Math.log10(Math.max(areaSqFt, 0.1));
  
  return Math.max(0, lw);
}

/**
 * Calculate pipe velocity noise (dB)
 * Based on ASHRAE formula: Lw = 10*log10(K) + 35*log10(V) + 10*log10(d) + C
 */
export function calculatePipeVelocityNoise(velocityFps: number, diameterIn: number): number {
  if (velocityFps <= 0) return 0;
  
  let baseNoise = 35 * Math.log10(Math.max(velocityFps, 0.1));
  const diameterFactor = 10 * Math.log10(Math.max(diameterIn, 0.5));
  
  // Add penalty for high velocities (above 8 fps for closed systems)
  if (velocityFps > 8) {
    baseNoise += (velocityFps - 8) * 2;
  }
  if (velocityFps > 12) {
    baseNoise += (velocityFps - 12) * 4;
  }
  
  return Math.max(0, baseNoise + diameterFactor + 10);
}

/**
 * Calculate noise from a specific duct fitting
 */
export function calculateDuctFittingNoise(
  fittingCategory: string,
  lossCoefficient: number,
  velocityFpm: number,
  quantity: number = 1
): number {
  const characteristics = DUCT_FITTING_NOISE_MAP[fittingCategory.toLowerCase()] || 
    { basedB: 6, velocityExp: 1.6, turbulenceFactor: 1.0 };
  
  // Base noise from fitting type
  const baseNoise = characteristics.basedB;
  
  // Velocity contribution
  const velocityFactor = characteristics.velocityExp * 10 * Math.log10(Math.max(velocityFpm, 500) / 1000);
  
  // Loss coefficient contribution (higher K = more turbulence = more noise)
  const kFactor = 5 * Math.log10(Math.max(lossCoefficient, 0.01) * 10);
  
  // Turbulence factor
  const turbulence = 3 * Math.log10(characteristics.turbulenceFactor);
  
  // Single fitting noise
  const singleNoise = baseNoise + velocityFactor + kFactor + turbulence;
  
  // Multiple fittings (logarithmic addition)
  if (quantity > 1) {
    return singleNoise + 10 * Math.log10(quantity);
  }
  
  return Math.max(0, singleNoise);
}

/**
 * Calculate noise from a specific pipe fitting
 */
export function calculatePipeFittingNoise(
  fittingCategory: string,
  kFactor: number,
  velocityFps: number,
  diameterIn: number,
  quantity: number = 1
): number {
  const characteristics = PIPE_FITTING_NOISE_MAP[fittingCategory.toLowerCase()] || 
    { basedB: 8, velocityExp: 1.8, turbulenceFactor: 1.2 };
  
  // Base noise from fitting type
  const baseNoise = characteristics.basedB;
  
  // Velocity contribution
  const velocityFactor = characteristics.velocityExp * 10 * Math.log10(Math.max(velocityFps, 1) / 4);
  
  // K-factor contribution
  const kContribution = 10 * Math.log10(Math.max(kFactor, 0.1));
  
  // Diameter factor
  const diameterFactor = 5 * Math.log10(Math.max(diameterIn, 0.5));
  
  // Single fitting noise
  const singleNoise = baseNoise + velocityFactor + kContribution + diameterFactor;
  
  // Multiple fittings (logarithmic addition)
  if (quantity > 1) {
    return singleNoise + 10 * Math.log10(quantity);
  }
  
  return Math.max(0, singleNoise);
}

/**
 * Combine multiple noise sources (logarithmic addition)
 */
export function combineNoiseLevels(levels: number[]): number {
  const validLevels = levels.filter(l => l > 0);
  if (validLevels.length === 0) return 0;
  if (validLevels.length === 1) return validLevels[0];
  
  const sum = validLevels.reduce((acc, level) => acc + Math.pow(10, level / 10), 0);
  return 10 * Math.log10(sum);
}

/**
 * Convert dB to NC rating (approximate)
 * NC is typically 5-7 dB below A-weighted sound level
 */
export function dbToNC(db: number): number {
  return Math.round(db - 7);
}

/**
 * Convert NC rating to dB (approximate)
 */
export function ncToDb(nc: number): number {
  return nc + 7;
}

/**
 * Get compliance status based on NC rating vs target
 */
export function getNCComplianceStatus(
  ncRating: number, 
  targetNC: number
): 'compliant' | 'marginal' | 'exceeds' {
  if (ncRating <= targetNC) return 'compliant';
  if (ncRating <= targetNC + 5) return 'marginal';
  return 'exceeds';
}

/**
 * Calculate duct cross-sectional area in sq inches
 */
export function calculateDuctArea(
  shape: 'round' | 'rectangular',
  diameterIn?: number,
  widthIn?: number,
  heightIn?: number
): number {
  if (shape === 'round' && diameterIn) {
    return Math.PI * Math.pow(diameterIn / 2, 2);
  } else if (widthIn && heightIn) {
    return widthIn * heightIn;
  }
  return 100; // Default
}

/**
 * Calculate velocity from airflow and area
 */
export function calculateDuctVelocity(airflowCfm: number, areaSqIn: number): number {
  if (areaSqIn <= 0) return 0;
  return (airflowCfm * 144) / areaSqIn;
}

/**
 * Calculate pipe velocity from flow and diameter
 */
export function calculatePipeVelocity(flowGpm: number, insideDiameterIn: number): number {
  if (insideDiameterIn <= 0) return 0;
  const areaSqIn = Math.PI * Math.pow(insideDiameterIn / 2, 2);
  // Convert GPM to cubic inches per second: GPM * 231 / 60
  // Velocity in in/s, then convert to fps
  return (flowGpm * 231 / 60) / areaSqIn / 12;
}

// ============ FITTING ANALYSIS INTERFACE ============

export interface FittingNoiseAnalysis {
  fittingId: string;
  fittingCode: string;
  fittingName: string;
  fittingCategory: string;
  quantity: number;
  coefficient: number; // K-factor or loss coefficient
  noiseContribution: number; // dB
  percentOfTotal: number;
  status: 'low' | 'moderate' | 'high';
}

export interface SystemNoiseAnalysis {
  velocityNoise: number;
  fittingNoise: number;
  totalNoise: number;
  ncRating: number;
  targetNC: number;
  status: 'compliant' | 'marginal' | 'exceeds';
  attenuationRequired: number;
  fittingBreakdown: FittingNoiseAnalysis[];
}

/**
 * Analyze complete duct system with fittings
 */
export function analyzeSystemNoise(
  velocityNoise: number,
  fittings: Array<{
    id: string;
    code: string;
    name: string;
    category: string;
    coefficient: number;
    quantity: number;
    noiseDb: number;
  }>,
  targetNC: number
): SystemNoiseAnalysis {
  const fittingNoises = fittings.map(f => f.noiseDb);
  const combinedFittingNoise = combineNoiseLevels(fittingNoises);
  const totalNoise = combineNoiseLevels([velocityNoise, combinedFittingNoise]);
  const ncRating = dbToNC(totalNoise);
  
  const fittingBreakdown: FittingNoiseAnalysis[] = fittings.map(f => ({
    fittingId: f.id,
    fittingCode: f.code,
    fittingName: f.name,
    fittingCategory: f.category,
    quantity: f.quantity,
    coefficient: f.coefficient,
    noiseContribution: f.noiseDb,
    percentOfTotal: totalNoise > 0 ? (f.noiseDb / totalNoise) * 100 : 0,
    status: f.noiseDb > 30 ? 'high' : f.noiseDb > 20 ? 'moderate' : 'low',
  }));
  
  return {
    velocityNoise,
    fittingNoise: combinedFittingNoise,
    totalNoise,
    ncRating,
    targetNC,
    status: getNCComplianceStatus(ncRating, targetNC),
    attenuationRequired: Math.max(0, ncRating - targetNC),
    fittingBreakdown: fittingBreakdown.sort((a, b) => b.noiseContribution - a.noiseContribution),
  };
}

// ============ QUIETER ALTERNATIVE SUGGESTIONS ============

export interface QuieterAlternative {
  originalCategory: string;
  suggestion: string;
  estimatedReduction: number; // dB reduction
  recommendation: string;
}

export const QUIETER_ALTERNATIVES: Record<string, QuieterAlternative> = {
  'elbow': {
    originalCategory: 'Sharp elbow',
    suggestion: 'Radius elbow (R/D ≥ 1.5)',
    estimatedReduction: 6,
    recommendation: 'Replace sharp 90° elbow with smooth radius elbow to reduce turbulence noise by ~6 dB',
  },
  'tee': {
    originalCategory: 'Tee branch',
    suggestion: 'Conical tee or radius tee',
    estimatedReduction: 4,
    recommendation: 'Use conical or radius tee design to reduce branch takeoff noise by ~4 dB',
  },
  'damper': {
    originalCategory: 'Damper',
    suggestion: 'Opposed blade damper',
    estimatedReduction: 3,
    recommendation: 'Use opposed blade damper instead of parallel blade for quieter operation',
  },
  'transition': {
    originalCategory: 'Abrupt transition',
    suggestion: 'Gradual transition (≤15° angle)',
    estimatedReduction: 5,
    recommendation: 'Use gradual transition with maximum 15° included angle to minimize turbulence',
  },
  'takeoff': {
    originalCategory: 'Sharp takeoff',
    suggestion: 'Radius takeoff or bell-mouth',
    estimatedReduction: 4,
    recommendation: 'Replace sharp-edge takeoff with radius or bell-mouth entry',
  },
  'valve': {
    originalCategory: 'Globe valve',
    suggestion: 'Ball or butterfly valve',
    estimatedReduction: 8,
    recommendation: 'Replace globe valve with ball valve for lower pressure drop and noise',
  },
};

/**
 * Get quieter alternative suggestion for a fitting category
 */
export function getQuieterAlternative(category: string): QuieterAlternative | null {
  const key = category.toLowerCase();
  return QUIETER_ALTERNATIVES[key] || null;
}
