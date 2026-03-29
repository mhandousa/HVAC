// Room Acoustics Calculations Library
// Sound Power (Lw) to Sound Pressure (Lp) conversion with room correction

import { OctaveBandData, OCTAVE_BAND_FREQUENCIES, OctaveBandFrequency, interpolateNCCurve, calculateNCFromOctaveBands } from './nc-reference-curves';

// Surface material absorption coefficients by frequency
// Based on ASHRAE Handbook - Fundamentals, Chapter 8
export interface AbsorptionCoefficients {
  name: string;
  description: string;
  coefficients: OctaveBandData;
}

export const SURFACE_MATERIALS: Record<string, AbsorptionCoefficients> = {
  concrete: {
    name: 'Concrete (unpainted)',
    description: 'Bare concrete floor or wall',
    coefficients: { '63Hz': 0.01, '125Hz': 0.01, '250Hz': 0.01, '500Hz': 0.02, '1kHz': 0.02, '2kHz': 0.02, '4kHz': 0.03, '8kHz': 0.03 },
  },
  concrete_painted: {
    name: 'Concrete (painted)',
    description: 'Painted concrete surface',
    coefficients: { '63Hz': 0.01, '125Hz': 0.01, '250Hz': 0.01, '500Hz': 0.01, '1kHz': 0.02, '2kHz': 0.02, '4kHz': 0.02, '8kHz': 0.02 },
  },
  carpet_thin: {
    name: 'Carpet (thin)',
    description: 'Thin carpet on concrete',
    coefficients: { '63Hz': 0.02, '125Hz': 0.03, '250Hz': 0.05, '500Hz': 0.10, '1kHz': 0.30, '2kHz': 0.50, '4kHz': 0.60, '8kHz': 0.65 },
  },
  carpet_heavy: {
    name: 'Carpet (heavy)',
    description: 'Heavy carpet with pad',
    coefficients: { '63Hz': 0.08, '125Hz': 0.10, '250Hz': 0.15, '500Hz': 0.30, '1kHz': 0.50, '2kHz': 0.65, '4kHz': 0.70, '8kHz': 0.70 },
  },
  acoustic_tile: {
    name: 'Acoustic Ceiling Tile',
    description: 'Standard acoustic ceiling tile',
    coefficients: { '63Hz': 0.20, '125Hz': 0.25, '250Hz': 0.45, '500Hz': 0.70, '1kHz': 0.80, '2kHz': 0.80, '4kHz': 0.75, '8kHz': 0.70 },
  },
  acoustic_tile_mineral: {
    name: 'Mineral Fiber Tile',
    description: 'High-performance mineral fiber',
    coefficients: { '63Hz': 0.30, '125Hz': 0.40, '250Hz': 0.65, '500Hz': 0.85, '1kHz': 0.90, '2kHz': 0.90, '4kHz': 0.85, '8kHz': 0.80 },
  },
  glass: {
    name: 'Glass (window)',
    description: 'Standard window glass',
    coefficients: { '63Hz': 0.18, '125Hz': 0.15, '250Hz': 0.10, '500Hz': 0.07, '1kHz': 0.05, '2kHz': 0.04, '4kHz': 0.03, '8kHz': 0.02 },
  },
  drywall: {
    name: 'Drywall (gypsum)',
    description: 'Standard gypsum board',
    coefficients: { '63Hz': 0.10, '125Hz': 0.08, '250Hz': 0.05, '500Hz': 0.03, '1kHz': 0.03, '2kHz': 0.03, '4kHz': 0.03, '8kHz': 0.03 },
  },
  drywall_insulated: {
    name: 'Drywall (with insulation)',
    description: 'Gypsum board with cavity insulation',
    coefficients: { '63Hz': 0.29, '125Hz': 0.20, '250Hz': 0.10, '500Hz': 0.05, '1kHz': 0.04, '2kHz': 0.07, '4kHz': 0.09, '8kHz': 0.10 },
  },
  wood_paneling: {
    name: 'Wood Paneling',
    description: 'Plywood or wood panels',
    coefficients: { '63Hz': 0.28, '125Hz': 0.22, '250Hz': 0.17, '500Hz': 0.09, '1kHz': 0.10, '2kHz': 0.11, '4kHz': 0.11, '8kHz': 0.11 },
  },
  curtains_heavy: {
    name: 'Heavy Curtains',
    description: 'Heavy drapes with pleats',
    coefficients: { '63Hz': 0.07, '125Hz': 0.14, '250Hz': 0.35, '500Hz': 0.55, '1kHz': 0.70, '2kHz': 0.80, '4kHz': 0.80, '8kHz': 0.80 },
  },
  brick: {
    name: 'Brick (unpainted)',
    description: 'Exposed brick wall',
    coefficients: { '63Hz': 0.02, '125Hz': 0.02, '250Hz': 0.03, '500Hz': 0.04, '1kHz': 0.05, '2kHz': 0.07, '4kHz': 0.07, '8kHz': 0.07 },
  },
  fabric_wall: {
    name: 'Fabric-Wrapped Panel',
    description: 'Acoustic fabric panel with absorber',
    coefficients: { '63Hz': 0.25, '125Hz': 0.35, '250Hz': 0.60, '500Hz': 0.80, '1kHz': 0.85, '2kHz': 0.85, '4kHz': 0.80, '8kHz': 0.75 },
  },
};

// Directivity factors for different source positions
export const DIRECTIVITY_FACTORS: Record<string, { Q: number; description: string }> = {
  center: { Q: 1, description: 'Center of room (free field)' },
  floor: { Q: 2, description: 'On floor or ceiling' },
  wall: { Q: 2, description: 'Near one wall' },
  wall_floor: { Q: 4, description: 'Wall-floor junction' },
  corner_floor: { Q: 8, description: 'Floor corner (2 walls)' },
  corner_ceiling: { Q: 8, description: 'Ceiling corner' },
};

// Room type presets with typical surface materials
export interface RoomPreset {
  name: string;
  description: string;
  targetNC: number;
  floor: string;
  walls: string;
  ceiling: string;
}

export const ROOM_PRESETS: Record<string, RoomPreset> = {
  office_private: {
    name: 'Private Office',
    description: 'Executive or private office',
    targetNC: 30,
    floor: 'carpet_heavy',
    walls: 'drywall',
    ceiling: 'acoustic_tile',
  },
  office_open: {
    name: 'Open Office',
    description: 'Open plan office space',
    targetNC: 40,
    floor: 'carpet_thin',
    walls: 'drywall',
    ceiling: 'acoustic_tile',
  },
  conference: {
    name: 'Conference Room',
    description: 'Meeting or conference room',
    targetNC: 30,
    floor: 'carpet_heavy',
    walls: 'drywall_insulated',
    ceiling: 'acoustic_tile_mineral',
  },
  classroom: {
    name: 'Classroom',
    description: 'Educational classroom',
    targetNC: 30,
    floor: 'carpet_thin',
    walls: 'drywall',
    ceiling: 'acoustic_tile',
  },
  hospital_room: {
    name: 'Hospital Room',
    description: 'Patient room',
    targetNC: 30,
    floor: 'carpet_thin',
    walls: 'drywall',
    ceiling: 'acoustic_tile_mineral',
  },
  lobby: {
    name: 'Lobby',
    description: 'Building lobby or atrium',
    targetNC: 40,
    floor: 'concrete',
    walls: 'glass',
    ceiling: 'acoustic_tile',
  },
  mechanical: {
    name: 'Mechanical Room',
    description: 'Equipment room',
    targetNC: 55,
    floor: 'concrete',
    walls: 'concrete',
    ceiling: 'concrete',
  },
};

export interface RoomDimensions {
  length: number;  // meters
  width: number;   // meters
  height: number;  // meters
}

export interface RoomSurfaces {
  floor: string;   // key from SURFACE_MATERIALS
  walls: string;   // key from SURFACE_MATERIALS
  ceiling: string; // key from SURFACE_MATERIALS
}

export interface RoomAcousticsInput {
  dimensions: RoomDimensions;
  surfaces: RoomSurfaces;
  sourceLw: OctaveBandData;           // Source sound power level (dB)
  sourcePosition: string;              // key from DIRECTIVITY_FACTORS
  receiverDistance: number;            // meters from source
  targetNC: number;
}

export interface RoomAcousticsResult {
  // Room properties
  volume: number;                      // m³
  totalSurfaceArea: number;            // m²
  meanFreePathLength: number;          // m
  
  // Acoustic properties per frequency
  absorptionPerBand: OctaveBandData;   // Total absorption (Sabins)
  roomConstantPerBand: OctaveBandData; // Room constant R
  rt60PerBand: OctaveBandData;         // Reverberation time T60 (seconds)
  
  // Sound pressure at receiver
  lpDirect: OctaveBandData;            // Direct field component
  lpReverberant: OctaveBandData;       // Reverberant field component
  lpTotal: OctaveBandData;             // Total Lp at receiver
  
  // Summary
  averageRT60: number;                 // Average RT60 (500Hz-1kHz)
  calculatedNC: number;                // NC rating at receiver
  targetNC: number;
  isCompliant: boolean;
  complianceMargin: number;            // dB
  
  // Recommendations
  recommendations: string[];
}

/**
 * Calculate room volume
 */
export function calculateRoomVolume(dimensions: RoomDimensions): number {
  return dimensions.length * dimensions.width * dimensions.height;
}

/**
 * Calculate total surface area
 */
export function calculateSurfaceArea(dimensions: RoomDimensions): {
  floor: number;
  ceiling: number;
  walls: number;
  total: number;
} {
  const floor = dimensions.length * dimensions.width;
  const ceiling = floor;
  const walls = 2 * (dimensions.length + dimensions.width) * dimensions.height;
  return {
    floor,
    ceiling,
    walls,
    total: floor + ceiling + walls,
  };
}

/**
 * Calculate total absorption for a room at each frequency band
 */
export function calculateRoomAbsorption(
  dimensions: RoomDimensions,
  surfaces: RoomSurfaces
): OctaveBandData {
  const areas = calculateSurfaceArea(dimensions);
  
  const floorMaterial = SURFACE_MATERIALS[surfaces.floor] || SURFACE_MATERIALS.concrete;
  const wallMaterial = SURFACE_MATERIALS[surfaces.walls] || SURFACE_MATERIALS.drywall;
  const ceilingMaterial = SURFACE_MATERIALS[surfaces.ceiling] || SURFACE_MATERIALS.acoustic_tile;
  
  const absorption: OctaveBandData = {
    '63Hz': 0, '125Hz': 0, '250Hz': 0, '500Hz': 0,
    '1kHz': 0, '2kHz': 0, '4kHz': 0, '8kHz': 0,
  };
  
  for (const freq of OCTAVE_BAND_FREQUENCIES) {
    absorption[freq] = 
      areas.floor * floorMaterial.coefficients[freq] +
      areas.walls * wallMaterial.coefficients[freq] +
      areas.ceiling * ceilingMaterial.coefficients[freq];
  }
  
  return absorption;
}

/**
 * Calculate room constant R for each frequency band
 * R = Sα / (1 - α_avg)
 */
export function calculateRoomConstant(
  totalArea: number,
  absorption: OctaveBandData
): OctaveBandData {
  const roomConstant: OctaveBandData = {
    '63Hz': 0, '125Hz': 0, '250Hz': 0, '500Hz': 0,
    '1kHz': 0, '2kHz': 0, '4kHz': 0, '8kHz': 0,
  };
  
  for (const freq of OCTAVE_BAND_FREQUENCIES) {
    const avgAlpha = absorption[freq] / totalArea;
    // Clamp to avoid division by zero or negative values
    const clampedAlpha = Math.min(0.99, Math.max(0.01, avgAlpha));
    roomConstant[freq] = absorption[freq] / (1 - clampedAlpha);
  }
  
  return roomConstant;
}

/**
 * Calculate reverberation time T60 using Sabine equation
 * T60 = 0.161 × V / A
 */
export function calculateRT60(volume: number, absorption: OctaveBandData): OctaveBandData {
  const rt60: OctaveBandData = {
    '63Hz': 0, '125Hz': 0, '250Hz': 0, '500Hz': 0,
    '1kHz': 0, '2kHz': 0, '4kHz': 0, '8kHz': 0,
  };
  
  for (const freq of OCTAVE_BAND_FREQUENCIES) {
    // Minimum absorption to avoid infinite RT60
    const effectiveAbsorption = Math.max(0.1, absorption[freq]);
    rt60[freq] = (0.161 * volume) / effectiveAbsorption;
  }
  
  return rt60;
}

/**
 * Calculate direct field sound pressure level
 * Lp_direct = Lw - 20*log10(r) - 11 + 10*log10(Q)
 */
export function calculateDirectField(
  sourceLw: OctaveBandData,
  distance: number,
  directivity: number
): OctaveBandData {
  const lpDirect: OctaveBandData = {
    '63Hz': 0, '125Hz': 0, '250Hz': 0, '500Hz': 0,
    '1kHz': 0, '2kHz': 0, '4kHz': 0, '8kHz': 0,
  };
  
  // Minimum distance to avoid extreme values
  const r = Math.max(0.1, distance);
  const directCorrection = -20 * Math.log10(r) - 11 + 10 * Math.log10(directivity);
  
  for (const freq of OCTAVE_BAND_FREQUENCIES) {
    lpDirect[freq] = sourceLw[freq] + directCorrection;
  }
  
  return lpDirect;
}

/**
 * Calculate reverberant field sound pressure level
 * Lp_reverb = Lw - 10*log10(R) + 6
 */
export function calculateReverberantField(
  sourceLw: OctaveBandData,
  roomConstant: OctaveBandData
): OctaveBandData {
  const lpReverb: OctaveBandData = {
    '63Hz': 0, '125Hz': 0, '250Hz': 0, '500Hz': 0,
    '1kHz': 0, '2kHz': 0, '4kHz': 0, '8kHz': 0,
  };
  
  for (const freq of OCTAVE_BAND_FREQUENCIES) {
    const R = Math.max(1, roomConstant[freq]);
    lpReverb[freq] = sourceLw[freq] - 10 * Math.log10(R) + 6;
  }
  
  return lpReverb;
}

/**
 * Combine direct and reverberant fields (logarithmic addition)
 */
export function combineFields(
  lpDirect: OctaveBandData,
  lpReverb: OctaveBandData
): OctaveBandData {
  const lpTotal: OctaveBandData = {
    '63Hz': 0, '125Hz': 0, '250Hz': 0, '500Hz': 0,
    '1kHz': 0, '2kHz': 0, '4kHz': 0, '8kHz': 0,
  };
  
  for (const freq of OCTAVE_BAND_FREQUENCIES) {
    const direct = Math.pow(10, lpDirect[freq] / 10);
    const reverb = Math.pow(10, lpReverb[freq] / 10);
    lpTotal[freq] = 10 * Math.log10(direct + reverb);
  }
  
  return lpTotal;
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(result: Omit<RoomAcousticsResult, 'recommendations'>): string[] {
  const recommendations: string[] = [];
  
  // NC compliance
  if (!result.isCompliant) {
    const excess = Math.abs(result.complianceMargin);
    if (excess > 10) {
      recommendations.push(`Noise level exceeds target by ${excess.toFixed(0)} dB. Consider silencers or equipment relocation.`);
    } else if (excess > 5) {
      recommendations.push(`Noise level exceeds target by ${excess.toFixed(0)} dB. Add acoustic treatment or increase distance.`);
    } else {
      recommendations.push(`Noise level marginally exceeds target by ${excess.toFixed(0)} dB. Minor treatment may help.`);
    }
  }
  
  // RT60 analysis (using 500Hz-1kHz average for speech frequencies)
  if (result.averageRT60 > 1.5) {
    recommendations.push(`Reverberation time (${result.averageRT60.toFixed(1)}s) is high. Add absorptive treatments.`);
  } else if (result.averageRT60 < 0.3) {
    recommendations.push(`Room may be over-damped (RT60: ${result.averageRT60.toFixed(1)}s). Reduce absorption if needed.`);
  }
  
  // Low frequency issues
  if (result.lpTotal['63Hz'] > result.lpTotal['1kHz'] + 10) {
    recommendations.push('Low-frequency dominance detected. Consider bass traps or vibration isolation.');
  }
  
  // High frequency issues
  if (result.lpTotal['4kHz'] > result.lpTotal['1kHz']) {
    recommendations.push('High-frequency noise present. Check for air leaks or turbulence in ducts.');
  }
  
  return recommendations;
}

/**
 * Perform complete room acoustics analysis
 */
export function analyzeRoomAcoustics(input: RoomAcousticsInput): RoomAcousticsResult {
  const volume = calculateRoomVolume(input.dimensions);
  const areas = calculateSurfaceArea(input.dimensions);
  const meanFreePathLength = (4 * volume) / areas.total;
  
  const absorption = calculateRoomAbsorption(input.dimensions, input.surfaces);
  const roomConstant = calculateRoomConstant(areas.total, absorption);
  const rt60 = calculateRT60(volume, absorption);
  
  const directivity = DIRECTIVITY_FACTORS[input.sourcePosition]?.Q || 2;
  const lpDirect = calculateDirectField(input.sourceLw, input.receiverDistance, directivity);
  const lpReverb = calculateReverberantField(input.sourceLw, roomConstant);
  const lpTotal = combineFields(lpDirect, lpReverb);
  
  const averageRT60 = (rt60['500Hz'] + rt60['1kHz']) / 2;
  const calculatedNC = calculateNCFromOctaveBands(lpTotal);
  const isCompliant = calculatedNC <= input.targetNC;
  const complianceMargin = input.targetNC - calculatedNC;
  
  const partialResult = {
    volume,
    totalSurfaceArea: areas.total,
    meanFreePathLength,
    absorptionPerBand: absorption,
    roomConstantPerBand: roomConstant,
    rt60PerBand: rt60,
    lpDirect,
    lpReverberant: lpReverb,
    lpTotal,
    averageRT60,
    calculatedNC,
    targetNC: input.targetNC,
    isCompliant,
    complianceMargin,
  };
  
  return {
    ...partialResult,
    recommendations: generateRecommendations(partialResult),
  };
}

/**
 * Calculate critical distance (where direct = reverberant field)
 * Dc = 0.141 × √(Q × R)
 */
export function calculateCriticalDistance(
  directivity: number,
  roomConstant: number
): number {
  return 0.141 * Math.sqrt(directivity * roomConstant);
}

/**
 * Get average room constant (500Hz-1kHz average)
 */
export function getAverageRoomConstant(roomConstant: OctaveBandData): number {
  return (roomConstant['500Hz'] + roomConstant['1kHz']) / 2;
}
