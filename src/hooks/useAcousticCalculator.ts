import { useMemo } from 'react';
import { DuctSegment } from './useDuctSystems';
import { PipeSegment } from './usePipeSystems';

// NC (Noise Criteria) ratings for Saudi indoor spaces per SASO/ASHRAE
export const SAUDI_NC_STANDARDS: Record<string, { nc: number; description: string }> = {
  'mosque-prayer-hall': { nc: 25, description: 'Mosque Prayer Hall - Very quiet' },
  'hospital-patient-room': { nc: 30, description: 'Hospital Patient Room' },
  'library-reading': { nc: 30, description: 'Library Reading Areas' },
  'hotel-bedroom': { nc: 35, description: 'Hotel/Apartment Bedroom' },
  'conference-room': { nc: 35, description: 'Conference Room' },
  'private-office': { nc: 40, description: 'Private Office' },
  'open-office': { nc: 45, description: 'Open Plan Office' },
  'restaurant': { nc: 45, description: 'Restaurant/Cafeteria' },
  'retail-store': { nc: 50, description: 'Retail Store' },
  'sports-arena': { nc: 55, description: 'Sports Arena/Gymnasium' },
  'factory-light': { nc: 60, description: 'Light Manufacturing' },
  'factory-heavy': { nc: 70, description: 'Heavy Manufacturing' },
};

// Fitting noise generation coefficients (based on ASHRAE data)
const FITTING_NOISE_COEFFICIENTS: Record<string, number> = {
  'elbow-90-sharp': 12,
  'elbow-90-radius': 6,
  'elbow-45': 4,
  'tee-branch': 10,
  'tee-main': 5,
  'transition': 8,
  'damper-open': 6,
  'damper-throttled': 15,
  'diffuser': 8,
  'grille': 10,
  'vav-box': 25,
  'flex-duct': 5,
  'silencer': -15, // Reduces noise
};

// Pipe flow noise coefficients
const PIPE_NOISE_COEFFICIENTS: Record<string, number> = {
  'valve-globe': 20,
  'valve-gate': 8,
  'valve-ball': 10,
  'valve-butterfly': 12,
  'elbow-90': 5,
  'elbow-45': 3,
  'tee': 8,
  'reducer': 10,
  'check-valve': 15,
  'strainer': 12,
  'pump': 45, // Major noise source
};

export interface NoiseSource {
  id: string;
  name: string;
  type: 'duct' | 'pipe' | 'fitting' | 'equipment';
  noiseLevel: number; // dB
  frequency?: string;
  location: string;
}

export interface AcousticAnalysis {
  sources: NoiseSource[];
  totalNoiseLevel: number; // dB(A)
  ncRating: number;
  targetNC: number;
  passesCriteria: boolean;
  recommendations: string[];
  attenuationRequired: number; // dB
}

export interface SegmentAcoustics {
  segmentId: string;
  segmentName: string;
  velocity: number;
  velocityNoise: number; // dB from velocity
  fittingNoise: number; // dB from fittings
  totalNoise: number; // dB
  ncEquivalent: number;
  status: 'good' | 'warning' | 'critical';
}

// Calculate noise from duct velocity (dB)
// Based on ASHRAE empirical formula: Lw = 10 + 50*log10(V/1000) + 10*log10(A)
function calculateDuctVelocityNoise(velocityFpm: number, areaSqIn: number): number {
  if (velocityFpm <= 0) return 0;
  
  const areaSqFt = areaSqIn / 144;
  // Simplified ASHRAE formula
  const lw = 10 + 50 * Math.log10(velocityFpm / 1000) + 10 * Math.log10(Math.max(areaSqFt, 0.1));
  
  return Math.max(0, lw);
}

// Calculate noise from pipe flow velocity (dB)
// Based on velocity and pipe diameter
function calculatePipeFlowNoise(velocityFps: number, diameterIn: number): number {
  if (velocityFps <= 0) return 0;
  
  // Higher velocity = more noise, especially above 8 fps
  let baseNoise = 20 * Math.log10(velocityFps);
  
  // Add penalty for high velocities
  if (velocityFps > 8) {
    baseNoise += (velocityFps - 8) * 3;
  }
  if (velocityFps > 12) {
    baseNoise += (velocityFps - 12) * 5;
  }
  
  return Math.max(0, baseNoise);
}

// Calculate duct cross-sectional area in sq inches
function getDuctArea(segment: DuctSegment): number {
  if (segment.duct_shape === 'round' && segment.diameter_in) {
    return Math.PI * Math.pow(segment.diameter_in / 2, 2);
  } else if (segment.width_in && segment.height_in) {
    return segment.width_in * segment.height_in;
  }
  return 100; // Default
}

// Estimate fitting noise contribution
function estimateFittingNoise(equivalentLength: number, velocity: number): number {
  if (equivalentLength <= 0) return 0;
  
  // Approximate number of fittings based on equivalent length
  const estimatedFittings = Math.ceil(equivalentLength / 15);
  
  // Average fitting coefficient
  const avgCoefficient = 8;
  
  // Noise increases with velocity and number of fittings
  const fittingNoise = avgCoefficient + 10 * Math.log10(estimatedFittings) + 
    15 * Math.log10(Math.max(velocity, 500) / 1000);
  
  return Math.max(0, fittingNoise);
}

// Convert dB to NC rating (approximate)
function dbToNC(db: number): number {
  // Rough conversion - NC is typically 5-10 dB below sound power level
  return Math.round(db - 7);
}

// NC to status
function getNCStatus(nc: number, targetNC: number): 'good' | 'warning' | 'critical' {
  if (nc <= targetNC) return 'good';
  if (nc <= targetNC + 5) return 'warning';
  return 'critical';
}

// Combine multiple noise sources (logarithmic addition)
function combineNoiseLevels(levels: number[]): number {
  if (levels.length === 0) return 0;
  if (levels.length === 1) return levels[0];
  
  const sum = levels.reduce((acc, level) => acc + Math.pow(10, level / 10), 0);
  return 10 * Math.log10(sum);
}

// Analyze duct segments for acoustics
export function analyzeDuctAcoustics(
  segments: DuctSegment[],
  targetNC: number = 40
): SegmentAcoustics[] {
  return segments.map(segment => {
    const velocity = segment.velocity_fpm || 0;
    const area = getDuctArea(segment);
    const eqLength = segment.fittings_equivalent_length_ft || 0;
    
    const velocityNoise = calculateDuctVelocityNoise(velocity, area);
    const fittingNoise = estimateFittingNoise(eqLength, velocity);
    const totalNoise = combineNoiseLevels([velocityNoise, fittingNoise]);
    const ncEquivalent = dbToNC(totalNoise);
    
    return {
      segmentId: segment.id,
      segmentName: segment.segment_name,
      velocity,
      velocityNoise: Math.round(velocityNoise * 10) / 10,
      fittingNoise: Math.round(fittingNoise * 10) / 10,
      totalNoise: Math.round(totalNoise * 10) / 10,
      ncEquivalent,
      status: getNCStatus(ncEquivalent, targetNC),
    };
  });
}

// Analyze pipe segments for acoustics
export function analyzePipeAcoustics(
  segments: PipeSegment[],
  targetNC: number = 40
): SegmentAcoustics[] {
  return segments.map(segment => {
    const velocity = segment.velocity_fps || 0;
    const diameter = segment.inside_diameter_in || segment.nominal_size_in || 2;
    const eqLength = segment.fittings_equivalent_length_ft || 0;
    
    const velocityNoise = calculatePipeFlowNoise(velocity, diameter);
    const fittingNoise = estimateFittingNoise(eqLength / 2, velocity * 100); // Scale for comparison
    const totalNoise = combineNoiseLevels([velocityNoise, fittingNoise]);
    const ncEquivalent = dbToNC(totalNoise);
    
    return {
      segmentId: segment.id,
      segmentName: segment.segment_name,
      velocity,
      velocityNoise: Math.round(velocityNoise * 10) / 10,
      fittingNoise: Math.round(fittingNoise * 10) / 10,
      totalNoise: Math.round(totalNoise * 10) / 10,
      ncEquivalent,
      status: getNCStatus(ncEquivalent, targetNC),
    };
  });
}

// Generate recommendations based on analysis
function generateRecommendations(
  segmentAnalysis: SegmentAcoustics[],
  systemType: 'duct' | 'pipe',
  targetNC: number
): string[] {
  const recommendations: string[] = [];
  
  const criticalSegments = segmentAnalysis.filter(s => s.status === 'critical');
  const warningSegments = segmentAnalysis.filter(s => s.status === 'warning');
  
  if (criticalSegments.length > 0) {
    recommendations.push(
      `${criticalSegments.length} segment(s) exceed NC ${targetNC} significantly. Consider:`
    );
    
    if (systemType === 'duct') {
      recommendations.push('• Reduce duct velocities below 1000 FPM for quiet spaces');
      recommendations.push('• Use lined duct or duct silencers before terminal units');
      recommendations.push('• Replace sharp elbows with radius elbows (R/D ≥ 1.5)');
      recommendations.push('• Add acoustic lining (1" minimum) on main ducts');
    } else {
      recommendations.push('• Reduce pipe velocities below 8 FPS');
      recommendations.push('• Use vibration isolators on pumps');
      recommendations.push('• Install flexible connections near equipment');
      recommendations.push('• Consider pipe insulation for noise dampening');
    }
  }
  
  if (warningSegments.length > 0 && criticalSegments.length === 0) {
    recommendations.push(
      `${warningSegments.length} segment(s) are marginally acceptable for NC ${targetNC}.`
    );
    recommendations.push('• Monitor noise levels during commissioning');
    recommendations.push('• Have silencers available as contingency');
  }
  
  if (criticalSegments.length === 0 && warningSegments.length === 0) {
    recommendations.push(`All segments meet NC ${targetNC} criteria.`);
    recommendations.push('• System should perform within acceptable noise levels');
  }
  
  return recommendations;
}

// Main analysis hook
export function useAcousticAnalysis(
  ductSegments: DuctSegment[],
  pipeSegments: PipeSegment[],
  spaceType: string = 'open-office'
): AcousticAnalysis {
  return useMemo(() => {
    const targetNC = SAUDI_NC_STANDARDS[spaceType]?.nc || 40;
    
    const ductAnalysis = analyzeDuctAcoustics(ductSegments, targetNC);
    const pipeAnalysis = analyzePipeAcoustics(pipeSegments, targetNC);
    
    // Combine all noise sources
    const allNoiseLevels = [
      ...ductAnalysis.map(d => d.totalNoise),
      ...pipeAnalysis.map(p => p.totalNoise),
    ].filter(n => n > 0);
    
    const totalNoiseLevel = combineNoiseLevels(allNoiseLevels);
    const ncRating = dbToNC(totalNoiseLevel);
    
    // Build noise sources list
    const sources: NoiseSource[] = [
      ...ductAnalysis.map(d => ({
        id: d.segmentId,
        name: d.segmentName,
        type: 'duct' as const,
        noiseLevel: d.totalNoise,
        location: `Velocity: ${d.velocity} FPM`,
      })),
      ...pipeAnalysis.map(p => ({
        id: p.segmentId,
        name: p.segmentName,
        type: 'pipe' as const,
        noiseLevel: p.totalNoise,
        location: `Velocity: ${p.velocity} FPS`,
      })),
    ];
    
    // Generate recommendations
    const allSegmentAnalysis = [...ductAnalysis, ...pipeAnalysis];
    const recommendations = generateRecommendations(
      allSegmentAnalysis,
      ductSegments.length > 0 ? 'duct' : 'pipe',
      targetNC
    );
    
    const attenuationRequired = Math.max(0, ncRating - targetNC);
    
    return {
      sources,
      totalNoiseLevel: Math.round(totalNoiseLevel * 10) / 10,
      ncRating,
      targetNC,
      passesCriteria: ncRating <= targetNC,
      recommendations,
      attenuationRequired,
    };
  }, [ductSegments, pipeSegments, spaceType]);
}

// Get color for NC status
export function getNCStatusColor(status: 'good' | 'warning' | 'critical'): string {
  switch (status) {
    case 'good': return 'text-green-600';
    case 'warning': return 'text-amber-600';
    case 'critical': return 'text-red-600';
  }
}

// Get background color for NC status
export function getNCStatusBg(status: 'good' | 'warning' | 'critical'): string {
  switch (status) {
    case 'good': return 'bg-green-100';
    case 'warning': return 'bg-amber-100';
    case 'critical': return 'bg-red-100';
  }
}

// Format NC rating display
export function formatNCRating(nc: number): string {
  return `NC-${nc}`;
}
