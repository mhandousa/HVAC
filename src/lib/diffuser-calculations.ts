// Diffuser/Grille Selection Calculations
// Based on ASHRAE Fundamentals and manufacturer data

// Diffuser types with characteristics
export interface DiffuserType {
  id: string;
  name: string;
  pattern: 'radial' | '4-way' | '3-way' | '2-way' | '1-way' | 'linear' | 'slot';
  category: 'supply' | 'return' | 'transfer';
  maxVelocityFpm: number;
  throwFactor: number; // K-factor for throw calculation
  ncCorrection: number; // NC adjustment for type
  description: string;
}

export const DIFFUSER_TYPES: DiffuserType[] = [
  { id: 'square-4way', name: 'Square 4-Way', pattern: '4-way', category: 'supply', maxVelocityFpm: 700, throwFactor: 1.0, ncCorrection: 0, description: 'Standard ceiling diffuser, radial pattern' },
  { id: 'square-3way', name: 'Square 3-Way', pattern: '3-way', category: 'supply', maxVelocityFpm: 700, throwFactor: 1.1, ncCorrection: 0, description: 'Corner installation diffuser' },
  { id: 'square-2way', name: 'Square 2-Way', pattern: '2-way', category: 'supply', maxVelocityFpm: 750, throwFactor: 1.2, ncCorrection: 2, description: 'Linear pattern, opposite directions' },
  { id: 'square-1way', name: 'Square 1-Way', pattern: '1-way', category: 'supply', maxVelocityFpm: 750, throwFactor: 1.3, ncCorrection: 3, description: 'Wall-mounted or perimeter' },
  { id: 'linear-slot', name: 'Linear Slot', pattern: 'linear', category: 'supply', maxVelocityFpm: 800, throwFactor: 0.8, ncCorrection: 3, description: 'Architectural slot diffuser' },
  { id: 'round-cone', name: 'Round Cone', pattern: 'radial', category: 'supply', maxVelocityFpm: 600, throwFactor: 0.9, ncCorrection: -2, description: 'Round ceiling diffuser with cone' },
  { id: 'perforated', name: 'Perforated Panel', pattern: 'radial', category: 'supply', maxVelocityFpm: 400, throwFactor: 0.6, ncCorrection: -5, description: 'Low velocity perforated face' },
  { id: 'swirl', name: 'Swirl Diffuser', pattern: 'radial', category: 'supply', maxVelocityFpm: 550, throwFactor: 0.7, ncCorrection: -3, description: 'High induction swirl pattern' },
  { id: 'return-grille', name: 'Return Grille', pattern: 'radial', category: 'return', maxVelocityFpm: 500, throwFactor: 0, ncCorrection: 5, description: 'Return air grille' },
  { id: 'transfer-grille', name: 'Transfer Grille', pattern: 'radial', category: 'transfer', maxVelocityFpm: 400, throwFactor: 0, ncCorrection: 3, description: 'Door or wall transfer grille' },
];

// Standard diffuser sizes (inches)
export const STANDARD_SIZES_SQUARE = ['6x6', '8x8', '10x10', '12x12', '14x14', '16x16', '18x18', '20x20', '24x24'];
export const STANDARD_SIZES_ROUND = ['6', '8', '10', '12', '14', '16'];
export const STANDARD_SIZES_LINEAR_2IN = ['2x24', '2x36', '2x48', '2x60'];
export const STANDARD_SIZES_LINEAR_4IN = ['4x24', '4x36', '4x48', '4x60'];

// Core area ratios for different diffuser styles (based on manufacturer data)
const CORE_AREA_RATIOS: Record<string, number> = {
  'square-4way': 0.85,
  'square-3way': 0.82,
  'square-2way': 0.80,
  'square-1way': 0.78,
  'linear-slot': 0.65,
  'round-cone': 0.88,
  'perforated': 0.40,
  'swirl': 0.75,
  'return-grille': 0.80,
  'transfer-grille': 0.50,
};

export interface DiffuserSizingInput {
  cfm: number;
  diffuserTypeId: string;
  ceilingHeightFt: number;
  maxFaceVelocityFpm?: number;
  targetNCRating?: number;
}

export interface DiffuserSizingResult {
  size: string;
  neckSizeIn: number;
  faceAreaSqIn: number;
  coreAreaSqIn: number;
  faceVelocityFpm: number;
  neckVelocityFpm: number;
  throwDistanceFt: number;
  dropDistanceFt: number;
  estimatedNC: number;
  pressureDropInWg: number;
  meetsNCTarget: boolean;
  velocityStatus: 'good' | 'warning' | 'critical';
}

export interface MultiDiffuserResult {
  quantity: number;
  cfmEach: number;
  diffuserResult: DiffuserSizingResult;
  totalThrowCoverage: number;
  recommendedSpacing: number;
}

/**
 * Calculate face velocity from CFM and face area
 */
export function calculateFaceVelocity(cfm: number, faceAreaSqIn: number): number {
  const faceAreaSqFt = faceAreaSqIn / 144;
  return cfm / faceAreaSqFt;
}

/**
 * Calculate neck velocity from CFM and neck diameter
 */
export function calculateNeckVelocity(cfm: number, neckDiameterIn: number): number {
  const neckAreaSqFt = (Math.PI * Math.pow(neckDiameterIn / 12, 2)) / 4;
  return cfm / neckAreaSqFt;
}

/**
 * Calculate throw distance using ASHRAE formula
 * T = K × √(CFM) × (1 / V_terminal)
 * Simplified for practical use: T ≈ K × (CFM/100)^0.5 × adjustment
 */
export function calculateThrowDistance(
  cfm: number,
  throwFactor: number,
  faceVelocityFpm: number
): number {
  // Empirical throw formula based on manufacturer data
  const baseThrow = throwFactor * Math.sqrt(cfm) * 0.4;
  
  // Adjust for velocity (higher velocity = longer throw)
  const velocityFactor = Math.sqrt(faceVelocityFpm / 500);
  
  return Math.round(baseThrow * velocityFactor * 10) / 10;
}

/**
 * Calculate vertical drop distance (for ceiling diffusers)
 * Drop depends on supply air temperature differential and throw
 */
export function calculateDropDistance(
  throwDistanceFt: number,
  ceilingHeightFt: number,
  supplyTempDeltaF: number = 20
): number {
  // Approximate drop based on throw and temperature differential
  // Higher delta-T = more drop due to cold air sinking
  const dropRatio = 0.1 + (supplyTempDeltaF / 100);
  const drop = throwDistanceFt * dropRatio;
  
  // Ensure drop doesn't exceed ceiling height minus occupied zone (typically 6 ft from floor)
  const maxDrop = ceilingHeightFt - 6;
  return Math.min(drop, maxDrop);
}

/**
 * Estimate NC rating based on face velocity and diffuser type
 * Based on ASHRAE empirical data for ceiling diffusers
 */
export function estimateNCRating(
  faceVelocityFpm: number,
  diffuserType: DiffuserType
): number {
  // Base NC from velocity (empirical curve fit)
  // NC ≈ 10 + 0.035 × Velocity
  const baseNC = 10 + 0.035 * faceVelocityFpm;
  
  // Apply diffuser-type correction
  const correctedNC = baseNC + diffuserType.ncCorrection;
  
  return Math.round(Math.max(15, Math.min(60, correctedNC)));
}

/**
 * Calculate pressure drop across diffuser
 * Based on velocity pressure and K-factor
 */
export function calculatePressureDrop(
  faceVelocityFpm: number,
  diffuserTypeId: string
): number {
  // Velocity pressure in inches w.g.
  const velocityPressure = Math.pow(faceVelocityFpm / 4005, 2);
  
  // K-factor varies by diffuser type (typically 1.5-3.0)
  const kFactors: Record<string, number> = {
    'square-4way': 2.0,
    'square-3way': 2.2,
    'square-2way': 2.5,
    'square-1way': 2.8,
    'linear-slot': 3.0,
    'round-cone': 1.8,
    'perforated': 1.5,
    'swirl': 2.5,
    'return-grille': 1.2,
    'transfer-grille': 2.0,
  };
  
  const kFactor = kFactors[diffuserTypeId] || 2.0;
  
  return Math.round(velocityPressure * kFactor * 100) / 100;
}

/**
 * Get velocity status based on diffuser type limits
 */
export function getVelocityStatus(
  faceVelocityFpm: number,
  maxVelocityFpm: number
): 'good' | 'warning' | 'critical' {
  const ratio = faceVelocityFpm / maxVelocityFpm;
  
  if (ratio <= 0.85) return 'good';
  if (ratio <= 1.0) return 'warning';
  return 'critical';
}

/**
 * Find the optimal diffuser size for given CFM and constraints
 */
export function sizeDiffuser(input: DiffuserSizingInput): DiffuserSizingResult | null {
  const diffuserType = DIFFUSER_TYPES.find(t => t.id === input.diffuserTypeId);
  if (!diffuserType) return null;
  
  const maxVelocity = input.maxFaceVelocityFpm || diffuserType.maxVelocityFpm;
  const targetNC = input.targetNCRating || 40;
  const coreAreaRatio = CORE_AREA_RATIOS[input.diffuserTypeId] || 0.80;
  
  // Determine available sizes based on diffuser pattern
  let availableSizes: { size: string; faceAreaSqIn: number; neckSizeIn: number }[] = [];
  
  if (diffuserType.pattern === 'linear' || diffuserType.pattern === 'slot') {
    // Linear slot diffusers
    availableSizes = [...STANDARD_SIZES_LINEAR_2IN, ...STANDARD_SIZES_LINEAR_4IN].map(size => {
      const [width, length] = size.split('x').map(Number);
      return {
        size,
        faceAreaSqIn: width * length,
        neckSizeIn: width, // Neck is the slot width
      };
    });
  } else if (diffuserType.id === 'round-cone') {
    // Round diffusers
    availableSizes = STANDARD_SIZES_ROUND.map(size => {
      const diameter = parseInt(size);
      return {
        size: `${size}"Ø`,
        faceAreaSqIn: Math.PI * Math.pow(diameter / 2, 2),
        neckSizeIn: diameter,
      };
    });
  } else {
    // Square diffusers
    availableSizes = STANDARD_SIZES_SQUARE.map(size => {
      const [width, height] = size.split('x').map(Number);
      return {
        size,
        faceAreaSqIn: width * height,
        neckSizeIn: Math.sqrt(width * height), // Equivalent circular neck
      };
    });
  }
  
  // Find the smallest size that meets velocity and NC requirements
  for (const sizeOption of availableSizes) {
    const coreAreaSqIn = sizeOption.faceAreaSqIn * coreAreaRatio;
    const faceVelocity = calculateFaceVelocity(input.cfm, coreAreaSqIn);
    
    if (faceVelocity <= maxVelocity) {
      const neckVelocity = calculateNeckVelocity(input.cfm, sizeOption.neckSizeIn);
      const throwDistance = calculateThrowDistance(input.cfm, diffuserType.throwFactor, faceVelocity);
      const dropDistance = calculateDropDistance(throwDistance, input.ceilingHeightFt);
      const estimatedNC = estimateNCRating(faceVelocity, diffuserType);
      const pressureDrop = calculatePressureDrop(faceVelocity, input.diffuserTypeId);
      const velocityStatus = getVelocityStatus(faceVelocity, diffuserType.maxVelocityFpm);
      
      return {
        size: sizeOption.size,
        neckSizeIn: sizeOption.neckSizeIn,
        faceAreaSqIn: sizeOption.faceAreaSqIn,
        coreAreaSqIn,
        faceVelocityFpm: Math.round(faceVelocity),
        neckVelocityFpm: Math.round(neckVelocity),
        throwDistanceFt: throwDistance,
        dropDistanceFt: dropDistance,
        estimatedNC,
        pressureDropInWg: pressureDrop,
        meetsNCTarget: estimatedNC <= targetNC,
        velocityStatus,
      };
    }
  }
  
  // If no single size works, return the largest available
  const largestSize = availableSizes[availableSizes.length - 1];
  const coreAreaSqIn = largestSize.faceAreaSqIn * coreAreaRatio;
  const faceVelocity = calculateFaceVelocity(input.cfm, coreAreaSqIn);
  const neckVelocity = calculateNeckVelocity(input.cfm, largestSize.neckSizeIn);
  const throwDistance = calculateThrowDistance(input.cfm, diffuserType.throwFactor, faceVelocity);
  const dropDistance = calculateDropDistance(throwDistance, input.ceilingHeightFt);
  const estimatedNC = estimateNCRating(faceVelocity, diffuserType);
  const pressureDrop = calculatePressureDrop(faceVelocity, input.diffuserTypeId);
  const velocityStatus = getVelocityStatus(faceVelocity, diffuserType.maxVelocityFpm);
  
  return {
    size: largestSize.size,
    neckSizeIn: largestSize.neckSizeIn,
    faceAreaSqIn: largestSize.faceAreaSqIn,
    coreAreaSqIn,
    faceVelocityFpm: Math.round(faceVelocity),
    neckVelocityFpm: Math.round(neckVelocity),
    throwDistanceFt: throwDistance,
    dropDistanceFt: dropDistance,
    estimatedNC,
    pressureDropInWg: pressureDrop,
    meetsNCTarget: estimatedNC <= targetNC,
    velocityStatus,
  };
}

/**
 * Calculate how many diffusers are needed for a zone
 * and return sizing for each
 */
export function calculateMultipleDiffusers(
  totalCfm: number,
  diffuserTypeId: string,
  ceilingHeightFt: number,
  roomLengthFt: number,
  roomWidthFt: number,
  targetNCRating: number = 40,
  maxCfmPerDiffuser: number = 400
): MultiDiffuserResult | null {
  const diffuserType = DIFFUSER_TYPES.find(t => t.id === diffuserTypeId);
  if (!diffuserType) return null;
  
  // Calculate minimum number of diffusers based on max CFM each
  const minByAirflow = Math.ceil(totalCfm / maxCfmPerDiffuser);
  
  // Calculate recommended spacing based on throw (typically throw = 0.75 × spacing)
  // Start with estimated throw for single diffuser at max CFM
  const singleDiffuserResult = sizeDiffuser({
    cfm: maxCfmPerDiffuser,
    diffuserTypeId,
    ceilingHeightFt,
    targetNCRating,
  });
  
  if (!singleDiffuserResult) return null;
  
  const recommendedSpacing = singleDiffuserResult.throwDistanceFt / 0.75;
  
  // Calculate number based on room coverage
  const diffusersPerLength = Math.ceil(roomLengthFt / recommendedSpacing);
  const diffusersPerWidth = Math.ceil(roomWidthFt / recommendedSpacing);
  const minByCoverage = diffusersPerLength * diffusersPerWidth;
  
  // Use the larger of the two
  const quantity = Math.max(minByAirflow, minByCoverage, 1);
  const cfmEach = totalCfm / quantity;
  
  // Size individual diffuser
  const diffuserResult = sizeDiffuser({
    cfm: cfmEach,
    diffuserTypeId,
    ceilingHeightFt,
    targetNCRating,
  });
  
  if (!diffuserResult) return null;
  
  const totalThrowCoverage = diffuserResult.throwDistanceFt * 2 * quantity;
  const actualSpacing = Math.sqrt((roomLengthFt * roomWidthFt) / quantity);
  
  return {
    quantity,
    cfmEach: Math.round(cfmEach),
    diffuserResult,
    totalThrowCoverage,
    recommendedSpacing: Math.round(actualSpacing * 10) / 10,
  };
}

/**
 * Get recommended diffuser types for a space type
 */
export function getRecommendedDiffuserTypes(
  spaceType: string
): { primary: string[]; acceptable: string[] } {
  const recommendations: Record<string, { primary: string[]; acceptable: string[] }> = {
    'office': {
      primary: ['square-4way', 'linear-slot'],
      acceptable: ['square-2way', 'round-cone', 'perforated'],
    },
    'open-office': {
      primary: ['linear-slot', 'square-4way'],
      acceptable: ['square-2way', 'perforated'],
    },
    'conference-room': {
      primary: ['perforated', 'linear-slot'],
      acceptable: ['square-4way', 'swirl'],
    },
    'classroom': {
      primary: ['square-4way', 'linear-slot'],
      acceptable: ['square-2way', 'perforated'],
    },
    'hospital-patient-room': {
      primary: ['perforated', 'swirl'],
      acceptable: ['square-4way'],
    },
    'hotel-bedroom': {
      primary: ['linear-slot', 'perforated'],
      acceptable: ['square-4way', 'swirl'],
    },
    'restaurant': {
      primary: ['square-4way', 'linear-slot'],
      acceptable: ['square-2way', 'round-cone'],
    },
    'retail': {
      primary: ['square-4way', 'linear-slot'],
      acceptable: ['round-cone', 'square-2way'],
    },
    'gymnasium': {
      primary: ['square-2way', 'square-1way'],
      acceptable: ['round-cone'],
    },
    'lobby': {
      primary: ['linear-slot', 'perforated'],
      acceptable: ['square-4way'],
    },
    default: {
      primary: ['square-4way'],
      acceptable: ['linear-slot', 'round-cone', 'square-2way'],
    },
  };
  
  return recommendations[spaceType] || recommendations['default'];
}
