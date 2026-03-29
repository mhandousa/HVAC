// Noise Path Calculator Library
// Traces sound transmission from equipment through ductwork to occupied spaces

import { OctaveBandData, FREQUENCY_BANDS, NC_CURVES } from './nc-reference-curves';
import { combineDbLevels, calculateNCFromOctaveBands, getNCCurve } from './octave-band-analysis';

export type PathElementType = 
  | 'source' 
  | 'duct_straight' 
  | 'duct_elbow' 
  | 'duct_branch' 
  | 'silencer' 
  | 'duct_lining'
  | 'plenum' 
  | 'end_reflection' 
  | 'terminal' 
  | 'diffuser'
  | 'room_effect';

export interface NoisePathElement {
  id: string;
  type: PathElementType;
  name: string;
  description: string;
  
  // Physical parameters
  lengthFt?: number;
  sizeIn?: number;
  
  // Sound levels at this point
  inputLevel: OctaveBandData;
  attenuation: OctaveBandData;
  outputLevel: OctaveBandData;
  
  // NC rating at this point
  inputNC: number;
  outputNC: number;
  
  // Additional display info
  parameters: Record<string, string | number>;
}

export interface NoisePath {
  id: string;
  name: string;
  sourceEquipment: string;
  sourceNC: number;
  elements: NoisePathElement[];
  destinationZone: string;
  finalNC: number;
  targetNC: number;
  isCompliant: boolean;
  complianceMargin: number;
  totalAttenuation: number;
  criticalElement?: string;
}

// Duct attenuation coefficients (dB per foot) - based on ASHRAE data
const DUCT_ATTENUATION_UNLINED: Record<string, Record<string, number>> = {
  // Round duct attenuation by diameter range (inches)
  'small': {  // 6-12"
    '63': 0.03, '125': 0.03, '250': 0.05, '500': 0.05,
    '1000': 0.07, '2000': 0.07, '4000': 0.07, '8000': 0.05,
  },
  'medium': { // 13-24"
    '63': 0.02, '125': 0.02, '250': 0.03, '500': 0.03,
    '1000': 0.05, '2000': 0.05, '4000': 0.05, '8000': 0.03,
  },
  'large': {  // 25"+
    '63': 0.01, '125': 0.01, '250': 0.02, '500': 0.02,
    '1000': 0.03, '2000': 0.03, '4000': 0.03, '8000': 0.02,
  },
};

const DUCT_ATTENUATION_LINED: Record<string, Record<string, number>> = {
  'small': {
    '63': 0.10, '125': 0.30, '250': 0.70, '500': 1.00,
    '1000': 1.00, '2000': 0.80, '4000': 0.50, '8000': 0.30,
  },
  'medium': {
    '63': 0.08, '125': 0.25, '250': 0.60, '500': 0.90,
    '1000': 0.90, '2000': 0.70, '4000': 0.45, '8000': 0.25,
  },
  'large': {
    '63': 0.05, '125': 0.20, '250': 0.50, '500': 0.80,
    '1000': 0.80, '2000': 0.60, '4000': 0.40, '8000': 0.20,
  },
};

// Elbow/fitting attenuation (dB) - based on ASHRAE
const ELBOW_ATTENUATION: Record<string, Record<string, number>> = {
  'square_no_vanes': {
    '63': 0, '125': 0, '250': 1, '500': 2,
    '1000': 3, '2000': 3, '4000': 3, '8000': 3,
  },
  'square_with_vanes': {
    '63': 0, '125': 0, '250': 0, '500': 1,
    '1000': 2, '2000': 2, '4000': 2, '8000': 2,
  },
  'round_smooth': {
    '63': 0, '125': 0, '250': 0, '500': 0,
    '1000': 1, '2000': 1, '4000': 1, '8000': 1,
  },
  'round_5_piece': {
    '63': 0, '125': 0, '250': 1, '500': 2,
    '1000': 3, '2000': 3, '4000': 3, '8000': 3,
  },
};

// Branch power division (dB) - based on area ratio
function calculateBranchAttenuation(branchAreaRatio: number): OctaveBandData {
  // dB reduction = 10 * log10(1/ratio)
  const reduction = 10 * Math.log10(1 / branchAreaRatio);
  return createUniformAttenuation(reduction);
}

// End reflection (dB) - sound reflecting back into duct at termination
const END_REFLECTION: Record<string, Record<string, number>> = {
  // By equivalent diameter range
  'small': {  // <12"
    '63': 12, '125': 8, '250': 4, '500': 2,
    '1000': 1, '2000': 0, '4000': 0, '8000': 0,
  },
  'medium': { // 12-24"
    '63': 8, '125': 5, '250': 2, '500': 1,
    '1000': 0, '2000': 0, '4000': 0, '8000': 0,
  },
  'large': {  // >24"
    '63': 5, '125': 3, '250': 1, '500': 0,
    '1000': 0, '2000': 0, '4000': 0, '8000': 0,
  },
};

// Silencer insertion loss (dB per foot)
const SILENCER_INSERTION_LOSS: Record<string, number> = {
  '63': 1.0, '125': 2.5, '250': 5.0, '500': 7.0,
  '1000': 6.5, '2000': 5.0, '4000': 3.5, '8000': 2.0,
};

// Room effect (space absorption) - rough estimates
const ROOM_EFFECT: Record<string, Record<string, number>> = {
  'small': {   // <500 sq ft
    '63': 2, '125': 3, '250': 4, '500': 5,
    '1000': 6, '2000': 6, '4000': 5, '8000': 4,
  },
  'medium': {  // 500-2000 sq ft
    '63': 4, '125': 5, '250': 6, '500': 7,
    '1000': 8, '2000': 8, '4000': 7, '8000': 6,
  },
  'large': {   // >2000 sq ft
    '63': 6, '125': 7, '250': 8, '500': 10,
    '1000': 11, '2000': 11, '4000': 10, '8000': 9,
  },
};

/**
 * Create uniform attenuation across all bands
 */
function createUniformAttenuation(db: number): OctaveBandData {
  return {
    '63Hz': db, '125Hz': db, '250Hz': db, '500Hz': db,
    '1kHz': db, '2kHz': db, '4kHz': db, '8kHz': db,
  };
}

/**
 * Convert frequency record to OctaveBandData
 */
function recordToOctaveBand(record: Record<string, number>): OctaveBandData {
  return {
    '63Hz': record['63'] || 0,
    '125Hz': record['125'] || 0,
    '250Hz': record['250'] || 0,
    '500Hz': record['500'] || 0,
    '1kHz': record['1000'] || 0,
    '2kHz': record['2000'] || 0,
    '4kHz': record['4000'] || 0,
    '8kHz': record['8000'] || 0,
  };
}

/**
 * Get size category from dimension
 */
function getSizeCategory(sizeIn: number): 'small' | 'medium' | 'large' {
  if (sizeIn <= 12) return 'small';
  if (sizeIn <= 24) return 'medium';
  return 'large';
}

/**
 * Subtract attenuation from input level
 */
function applyAttenuation(input: OctaveBandData, attenuation: OctaveBandData): OctaveBandData {
  return {
    '63Hz': Math.max(0, input['63Hz'] - attenuation['63Hz']),
    '125Hz': Math.max(0, input['125Hz'] - attenuation['125Hz']),
    '250Hz': Math.max(0, input['250Hz'] - attenuation['250Hz']),
    '500Hz': Math.max(0, input['500Hz'] - attenuation['500Hz']),
    '1kHz': Math.max(0, input['1kHz'] - attenuation['1kHz']),
    '2kHz': Math.max(0, input['2kHz'] - attenuation['2kHz']),
    '4kHz': Math.max(0, input['4kHz'] - attenuation['4kHz']),
    '8kHz': Math.max(0, input['8kHz'] - attenuation['8kHz']),
  };
}

/**
 * Calculate total dB reduction from attenuation data
 */
function calculateTotalAttenuation(attenuation: OctaveBandData): number {
  const values = [
    attenuation['63Hz'], attenuation['125Hz'], attenuation['250Hz'], attenuation['500Hz'],
    attenuation['1kHz'], attenuation['2kHz'], attenuation['4kHz'], attenuation['8kHz'],
  ];
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate straight duct attenuation
 */
export function calculateDuctAttenuation(
  lengthFt: number,
  sizeIn: number,
  isLined: boolean
): OctaveBandData {
  const sizeCategory = getSizeCategory(sizeIn);
  const coefficients = isLined 
    ? DUCT_ATTENUATION_LINED[sizeCategory]
    : DUCT_ATTENUATION_UNLINED[sizeCategory];
  
  const attenuation: Record<string, number> = {};
  for (const freq of FREQUENCY_BANDS) {
    attenuation[freq] = (coefficients[freq] || 0) * lengthFt;
  }
  
  return recordToOctaveBand(attenuation);
}

/**
 * Calculate elbow/fitting attenuation
 */
export function calculateElbowAttenuation(
  elbowType: keyof typeof ELBOW_ATTENUATION
): OctaveBandData {
  return recordToOctaveBand(ELBOW_ATTENUATION[elbowType] || ELBOW_ATTENUATION['square_no_vanes']);
}

/**
 * Calculate silencer attenuation
 */
export function calculateSilencerAttenuation(lengthFt: number): OctaveBandData {
  const attenuation: Record<string, number> = {};
  for (const freq of FREQUENCY_BANDS) {
    attenuation[freq] = (SILENCER_INSERTION_LOSS[freq] || 0) * lengthFt;
  }
  return recordToOctaveBand(attenuation);
}

/**
 * Calculate end reflection at duct termination
 */
export function calculateEndReflection(sizeIn: number): OctaveBandData {
  const sizeCategory = getSizeCategory(sizeIn);
  return recordToOctaveBand(END_REFLECTION[sizeCategory]);
}

/**
 * Calculate room absorption effect
 */
export function calculateRoomEffect(roomAreaSqFt: number): OctaveBandData {
  let sizeCategory: 'small' | 'medium' | 'large';
  if (roomAreaSqFt < 500) sizeCategory = 'small';
  else if (roomAreaSqFt < 2000) sizeCategory = 'medium';
  else sizeCategory = 'large';
  
  return recordToOctaveBand(ROOM_EFFECT[sizeCategory]);
}

/**
 * Build a path element with computed levels
 */
function buildPathElement(
  id: string,
  type: PathElementType,
  name: string,
  description: string,
  inputLevel: OctaveBandData,
  attenuation: OctaveBandData,
  params: Record<string, string | number> = {}
): NoisePathElement {
  const outputLevel = applyAttenuation(inputLevel, attenuation);
  
  return {
    id,
    type,
    name,
    description,
    inputLevel,
    attenuation,
    outputLevel,
    inputNC: calculateNCFromOctaveBands(inputLevel),
    outputNC: calculateNCFromOctaveBands(outputLevel),
    parameters: params,
  };
}

export interface PathSegment {
  type: PathElementType;
  name: string;
  lengthFt?: number;
  sizeIn?: number;
  isLined?: boolean;
  elbowType?: keyof typeof ELBOW_ATTENUATION;
  branchRatio?: number;
  roomAreaSqFt?: number;
}

/**
 * Build a noise path from segments (wrapper for tracePath)
 * Simplified interface for UI components
 */
export function buildNoisePath(
  sourceEquipment: string,
  sourceLevels: OctaveBandData,
  segments: PathSegment[],
  destinationZone: string,
  targetNC: number
): NoisePath {
  return tracePath(
    `path-${Date.now()}`,
    `${sourceEquipment} to ${destinationZone}`,
    sourceEquipment,
    sourceLevels,
    segments,
    destinationZone,
    targetNC
  );
}

/**
 * Trace a complete noise path from source to receiver
 */
export function tracePath(
  pathId: string,
  pathName: string,
  sourceEquipment: string,
  sourceLevels: OctaveBandData,
  segments: PathSegment[],
  destinationZone: string,
  targetNC: number
): NoisePath {
  const elements: NoisePathElement[] = [];
  let currentLevel = { ...sourceLevels };
  let totalAttenuation = 0;
  
  // Add source as first element
  elements.push(buildPathElement(
    `${pathId}-source`,
    'source',
    sourceEquipment,
    'Sound source (equipment)',
    currentLevel,
    createUniformAttenuation(0),
    { 'Source Type': 'Equipment' }
  ));

  // Process each segment
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    let attenuation: OctaveBandData;
    let description: string;
    const params: Record<string, string | number> = {};

    switch (segment.type) {
      case 'duct_straight':
        attenuation = calculateDuctAttenuation(
          segment.lengthFt || 0,
          segment.sizeIn || 12,
          segment.isLined || false
        );
        description = `${segment.lengthFt}' ${segment.isLined ? 'lined' : 'unlined'} duct`;
        params['Length'] = `${segment.lengthFt} ft`;
        params['Size'] = `${segment.sizeIn}"`;
        params['Lined'] = segment.isLined ? 'Yes' : 'No';
        break;

      case 'duct_elbow':
        attenuation = calculateElbowAttenuation(segment.elbowType || 'square_no_vanes');
        description = `Elbow (${segment.elbowType?.replace(/_/g, ' ')})`;
        params['Type'] = segment.elbowType || 'square';
        break;

      case 'duct_branch':
        attenuation = calculateBranchAttenuation(segment.branchRatio || 0.5);
        description = `Branch takeoff (${Math.round((segment.branchRatio || 0.5) * 100)}% of main)`;
        params['Branch Ratio'] = `${Math.round((segment.branchRatio || 0.5) * 100)}%`;
        break;

      case 'silencer':
        attenuation = calculateSilencerAttenuation((segment.lengthFt || 4));
        description = `Silencer (${segment.lengthFt}' length)`;
        params['Length'] = `${segment.lengthFt} ft`;
        break;

      case 'duct_lining':
        attenuation = calculateDuctAttenuation(
          segment.lengthFt || 0,
          segment.sizeIn || 12,
          true
        );
        description = `Lined duct section (${segment.lengthFt}')`;
        params['Length'] = `${segment.lengthFt} ft`;
        break;

      case 'end_reflection':
        attenuation = calculateEndReflection(segment.sizeIn || 12);
        description = 'End reflection at terminal';
        params['Terminal Size'] = `${segment.sizeIn}"`;
        break;

      case 'room_effect':
        attenuation = calculateRoomEffect(segment.roomAreaSqFt || 500);
        description = `Room absorption (${segment.roomAreaSqFt} sq ft)`;
        params['Room Area'] = `${segment.roomAreaSqFt} sq ft`;
        break;

      default:
        attenuation = createUniformAttenuation(0);
        description = segment.name;
    }

    const element = buildPathElement(
      `${pathId}-${i}`,
      segment.type,
      segment.name,
      description,
      currentLevel,
      attenuation,
      params
    );

    elements.push(element);
    currentLevel = element.outputLevel;
    totalAttenuation += calculateTotalAttenuation(attenuation);
  }

  const finalNC = calculateNCFromOctaveBands(currentLevel);
  const sourceNC = calculateNCFromOctaveBands(sourceLevels);

  // Find critical element (one providing most attenuation)
  let criticalElement: string | undefined;
  let maxAttenuation = 0;
  for (const element of elements) {
    const elementAttenuation = calculateTotalAttenuation(element.attenuation);
    if (elementAttenuation > maxAttenuation) {
      maxAttenuation = elementAttenuation;
      criticalElement = element.name;
    }
  }

  return {
    id: pathId,
    name: pathName,
    sourceEquipment,
    sourceNC,
    elements,
    destinationZone,
    finalNC,
    targetNC,
    isCompliant: finalNC <= targetNC,
    complianceMargin: targetNC - finalNC,
    totalAttenuation: Math.round(totalAttenuation * 10) / 10,
    criticalElement,
  };
}

/**
 * Generate path chart data for visualization
 */
export function generatePathChartData(path: NoisePath) {
  return path.elements.map((element, index) => ({
    step: index,
    name: element.name,
    type: element.type,
    inputNC: element.inputNC,
    outputNC: element.outputNC,
    attenuation: element.inputNC - element.outputNC,
    description: element.description,
    ...element.parameters,
  }));
}

/**
 * Get recommendations for improving path compliance
 */
export function getPathRecommendations(path: NoisePath): string[] {
  const recommendations: string[] = [];
  
  if (path.isCompliant) {
    recommendations.push(`Path is compliant with ${path.complianceMargin} dB margin`);
    return recommendations;
  }

  const excess = path.finalNC - path.targetNC;
  
  // Check for missing silencer
  const hasSilencer = path.elements.some(e => e.type === 'silencer');
  if (!hasSilencer) {
    recommendations.push(`Add a silencer to reduce noise by ${excess + 5} dB`);
  }

  // Check for unlined duct
  const unlinedDuct = path.elements.filter(e => 
    e.type === 'duct_straight' && e.parameters['Lined'] === 'No'
  );
  if (unlinedDuct.length > 0) {
    const totalUnlinedLength = unlinedDuct.reduce((sum, e) => 
      sum + (parseFloat(String(e.parameters['Length'])) || 0), 0
    );
    if (totalUnlinedLength > 5) {
      recommendations.push(`Line ${Math.min(totalUnlinedLength, 20)}' of ductwork for additional attenuation`);
    }
  }

  // Check for high-attenuation elbows
  const elbows = path.elements.filter(e => e.type === 'duct_elbow');
  const squareElbows = elbows.filter(e => 
    String(e.parameters['Type']).includes('square') && 
    !String(e.parameters['Type']).includes('vanes')
  );
  if (squareElbows.length > 0) {
    recommendations.push('Add turning vanes to square elbows to reduce regenerated noise');
  }

  // Suggest longer silencer if present
  if (hasSilencer && excess > 0) {
    recommendations.push(`Increase silencer length to achieve additional ${excess + 3} dB attenuation`);
  }

  return recommendations;
}
