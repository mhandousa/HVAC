// Silencer frequency-based matching algorithm
// Scores silencers based on how well they meet attenuation requirements at each octave band

import { ManufacturerSilencer, OctaveBandData, MANUFACTURER_SILENCER_CATALOG } from './manufacturer-silencer-catalog';

export const FREQUENCY_BANDS = ['63Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz'] as const;
export type FrequencyBand = typeof FREQUENCY_BANDS[number];

export interface FrequencyBandRequirements {
  '63Hz': number;
  '125Hz': number;
  '250Hz': number;
  '500Hz': number;
  '1kHz': number;
  '2kHz': number;
  '4kHz': number;
  '8kHz': number;
}

export interface BandScore {
  band: FrequencyBand;
  required: number;
  provided: number;
  margin: number;
  score: number;
  status: 'exceeds' | 'meets' | 'marginal' | 'deficient';
}

export interface SilencerMatch {
  silencer: ManufacturerSilencer;
  overallScore: number;
  bandScores: BandScore[];
  deficientBands: FrequencyBand[];
  marginalBands: FrequencyBand[];
  meetsAllBands: boolean;
  minMargin: number;
  avgMargin: number;
  recommendation: string;
}

export interface SilencerFilterCriteria {
  ductType?: 'round' | 'rectangular';
  minDiameter?: number;
  maxDiameter?: number;
  maxLength?: number;
  maxPressureDrop?: number;
  manufacturers?: string[];
  maxCost?: '$' | '$$' | '$$$' | '$$$$';
  application?: 'supply' | 'return' | 'exhaust' | 'transfer';
  availability?: 'in-stock' | 'regional' | 'import';
}

// NC reference curves (dB values at each octave band)
// Used to convert NC rating gaps to frequency-specific requirements
export const NC_CURVES: Record<number, OctaveBandData> = {
  15: { '63Hz': 47, '125Hz': 36, '250Hz': 29, '500Hz': 22, '1kHz': 17, '2kHz': 14, '4kHz': 12, '8kHz': 11 },
  20: { '63Hz': 51, '125Hz': 40, '250Hz': 33, '500Hz': 26, '1kHz': 22, '2kHz': 19, '4kHz': 17, '8kHz': 16 },
  25: { '63Hz': 54, '125Hz': 44, '250Hz': 37, '500Hz': 31, '1kHz': 27, '2kHz': 24, '4kHz': 22, '8kHz': 21 },
  30: { '63Hz': 57, '125Hz': 48, '250Hz': 41, '500Hz': 35, '1kHz': 31, '2kHz': 29, '4kHz': 28, '8kHz': 27 },
  35: { '63Hz': 60, '125Hz': 52, '250Hz': 45, '500Hz': 40, '1kHz': 36, '2kHz': 34, '4kHz': 33, '8kHz': 32 },
  40: { '63Hz': 64, '125Hz': 56, '250Hz': 50, '500Hz': 45, '1kHz': 41, '2kHz': 39, '4kHz': 38, '8kHz': 37 },
  45: { '63Hz': 67, '125Hz': 60, '250Hz': 54, '500Hz': 49, '1kHz': 46, '2kHz': 44, '4kHz': 43, '8kHz': 42 },
  50: { '63Hz': 71, '125Hz': 64, '250Hz': 58, '500Hz': 54, '1kHz': 51, '2kHz': 49, '4kHz': 48, '8kHz': 47 },
};

// Preset requirement patterns for common acoustic problems
export const REQUIREMENT_PRESETS: Record<string, { name: string; description: string; requirements: FrequencyBandRequirements }> = {
  'low-frequency': {
    name: 'Low Frequency Problem',
    description: 'Higher attenuation needed at 63-250Hz (fan rumble, equipment vibration)',
    requirements: { '63Hz': 8, '125Hz': 10, '250Hz': 8, '500Hz': 5, '1kHz': 4, '2kHz': 3, '4kHz': 2, '8kHz': 2 },
  },
  'mid-frequency': {
    name: 'Mid Frequency Problem',
    description: 'Higher attenuation needed at 500Hz-2kHz (speech interference)',
    requirements: { '63Hz': 3, '125Hz': 5, '250Hz': 8, '500Hz': 12, '1kHz': 15, '2kHz': 12, '4kHz': 8, '8kHz': 5 },
  },
  'high-frequency': {
    name: 'High Frequency Problem',
    description: 'Higher attenuation needed at 2-8kHz (air noise, damper hiss)',
    requirements: { '63Hz': 2, '125Hz': 3, '250Hz': 5, '500Hz': 6, '1kHz': 8, '2kHz': 12, '4kHz': 15, '8kHz': 12 },
  },
  'balanced': {
    name: 'Balanced',
    description: 'Equal attenuation across all bands',
    requirements: { '63Hz': 8, '125Hz': 8, '250Hz': 8, '500Hz': 8, '1kHz': 8, '2kHz': 8, '4kHz': 8, '8kHz': 8 },
  },
  'vav-terminal': {
    name: 'VAV Terminal Noise',
    description: 'Typical VAV box regenerated noise spectrum',
    requirements: { '63Hz': 4, '125Hz': 6, '250Hz': 10, '500Hz': 14, '1kHz': 16, '2kHz': 14, '4kHz': 10, '8kHz': 6 },
  },
  'ahu-breakout': {
    name: 'AHU Breakout',
    description: 'Air handling unit fan noise typical spectrum',
    requirements: { '63Hz': 10, '125Hz': 12, '250Hz': 14, '500Hz': 12, '1kHz': 10, '2kHz': 8, '4kHz': 6, '8kHz': 4 },
  },
};

/**
 * Convert NC rating gap to frequency-specific attenuation requirements
 */
export function ncGapToFrequencyRequirements(
  currentNC: number,
  targetNC: number
): FrequencyBandRequirements {
  // Round to nearest standard NC curve
  const currentNCRounded = Math.round(currentNC / 5) * 5;
  const targetNCRounded = Math.round(targetNC / 5) * 5;
  
  // Clamp to available curves
  const currentCurve = NC_CURVES[Math.min(50, Math.max(15, currentNCRounded))] || NC_CURVES[40];
  const targetCurve = NC_CURVES[Math.min(50, Math.max(15, targetNCRounded))] || NC_CURVES[35];
  
  // Calculate required reduction at each band
  const requirements: FrequencyBandRequirements = {
    '63Hz': Math.max(0, currentCurve['63Hz'] - targetCurve['63Hz']),
    '125Hz': Math.max(0, currentCurve['125Hz'] - targetCurve['125Hz']),
    '250Hz': Math.max(0, currentCurve['250Hz'] - targetCurve['250Hz']),
    '500Hz': Math.max(0, currentCurve['500Hz'] - targetCurve['500Hz']),
    '1kHz': Math.max(0, currentCurve['1kHz'] - targetCurve['1kHz']),
    '2kHz': Math.max(0, currentCurve['2kHz'] - targetCurve['2kHz']),
    '4kHz': Math.max(0, currentCurve['4kHz'] - targetCurve['4kHz']),
    '8kHz': Math.max(0, currentCurve['8kHz'] - targetCurve['8kHz']),
  };
  
  return requirements;
}

/**
 * Calculate score for a single frequency band
 */
function scoreBand(required: number, provided: number): BandScore & { band: FrequencyBand } {
  const margin = provided - required;
  let score: number;
  let status: BandScore['status'];
  
  if (margin >= 5) {
    // Exceeds by 5+ dB - penalize over-specification slightly
    score = 95 - (margin - 5) * 0.5;
    status = 'exceeds';
  } else if (margin >= 0) {
    // Meets requirement with 0-5 dB margin - optimal
    score = 100;
    status = 'meets';
  } else if (margin >= -3) {
    // Marginal - within 3 dB of requirement
    score = 80 + (margin + 3) * 6.67; // 80-100 range
    status = 'marginal';
  } else {
    // Deficient - more than 3 dB below requirement
    score = Math.max(0, 60 + margin * 10); // Drops rapidly
    status = 'deficient';
  }
  
  return {
    band: '63Hz' as FrequencyBand, // Will be overwritten
    required,
    provided,
    margin,
    score: Math.round(score),
    status,
  };
}

/**
 * Score a silencer against frequency band requirements
 */
export function scoreSilencer(
  silencer: ManufacturerSilencer,
  requirements: FrequencyBandRequirements
): SilencerMatch {
  const bandScores: BandScore[] = FREQUENCY_BANDS.map(band => ({
    ...scoreBand(requirements[band], silencer.insertionLoss.octaveBands[band]),
    band,
  }));
  
  // Weight critical speech frequencies (500Hz-2kHz) slightly higher
  const weights: Record<FrequencyBand, number> = {
    '63Hz': 0.8,
    '125Hz': 0.9,
    '250Hz': 1.0,
    '500Hz': 1.2,
    '1kHz': 1.3,
    '2kHz': 1.2,
    '4kHz': 1.0,
    '8kHz': 0.8,
  };
  
  // Calculate weighted average score
  let totalWeight = 0;
  let weightedSum = 0;
  bandScores.forEach(bs => {
    const weight = weights[bs.band];
    weightedSum += bs.score * weight;
    totalWeight += weight;
  });
  
  const overallScore = Math.round(weightedSum / totalWeight);
  
  // Identify problem bands
  const deficientBands = bandScores
    .filter(bs => bs.status === 'deficient')
    .map(bs => bs.band);
  
  const marginalBands = bandScores
    .filter(bs => bs.status === 'marginal')
    .map(bs => bs.band);
  
  // Calculate margins
  const margins = bandScores.map(bs => bs.margin);
  const minMargin = Math.min(...margins);
  const avgMargin = margins.reduce((a, b) => a + b, 0) / margins.length;
  
  // Generate recommendation text
  let recommendation = '';
  if (deficientBands.length === 0 && marginalBands.length === 0) {
    recommendation = 'Excellent match - meets all frequency requirements with comfortable margins';
  } else if (deficientBands.length === 0) {
    recommendation = `Good match - marginal at ${marginalBands.join(', ')}. Consider if additional margin needed.`;
  } else if (deficientBands.length <= 2) {
    recommendation = `Partial match - deficient at ${deficientBands.join(', ')}. May need supplemental treatment.`;
  } else {
    recommendation = 'Poor match - significant deficiency across multiple frequency bands';
  }
  
  return {
    silencer,
    overallScore,
    bandScores,
    deficientBands,
    marginalBands,
    meetsAllBands: deficientBands.length === 0 && marginalBands.length === 0,
    minMargin: Math.round(minMargin * 10) / 10,
    avgMargin: Math.round(avgMargin * 10) / 10,
    recommendation,
  };
}

/**
 * Filter silencers by physical and preference criteria
 */
export function filterSilencers(
  criteria: SilencerFilterCriteria
): ManufacturerSilencer[] {
  return MANUFACTURER_SILENCER_CATALOG.filter(silencer => {
    // Duct type
    if (criteria.ductType && silencer.type !== criteria.ductType) {
      return false;
    }
    
    // Size range
    const size = silencer.type === 'round' 
      ? silencer.dimensions.diameterIn 
      : Math.max(silencer.dimensions.heightIn || 0, silencer.dimensions.widthIn || 0);
    
    if (criteria.minDiameter && size && size < criteria.minDiameter) {
      return false;
    }
    if (criteria.maxDiameter && size && size > criteria.maxDiameter) {
      return false;
    }
    
    // Length
    if (criteria.maxLength && silencer.dimensions.lengthIn > criteria.maxLength) {
      return false;
    }
    
    // Pressure drop
    if (criteria.maxPressureDrop && silencer.pressureDropIn > criteria.maxPressureDrop) {
      return false;
    }
    
    // Manufacturers
    if (criteria.manufacturers && criteria.manufacturers.length > 0) {
      if (!criteria.manufacturers.includes(silencer.manufacturer)) {
        return false;
      }
    }
    
    // Cost level
    if (criteria.maxCost) {
      const costLevels = ['$', '$$', '$$$', '$$$$'];
      const maxLevel = costLevels.indexOf(criteria.maxCost);
      const silencerLevel = costLevels.indexOf(silencer.estimatedCost);
      if (silencerLevel > maxLevel) {
        return false;
      }
    }
    
    // Application
    if (criteria.application && !silencer.hvacApplication.includes(criteria.application)) {
      return false;
    }
    
    // Availability
    if (criteria.availability) {
      const availabilityOrder = ['in-stock', 'regional', 'import'];
      const requiredLevel = availabilityOrder.indexOf(criteria.availability);
      const silencerLevel = availabilityOrder.indexOf(silencer.localAvailability);
      if (silencerLevel > requiredLevel) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Find and rank silencers matching frequency band requirements
 */
export function findMatchingSilencers(
  requirements: FrequencyBandRequirements,
  criteria: SilencerFilterCriteria = {},
  minScore: number = 60
): SilencerMatch[] {
  // First filter by physical criteria
  const filtered = filterSilencers(criteria);
  
  // Score each silencer
  const matches = filtered.map(silencer => scoreSilencer(silencer, requirements));
  
  // Filter by minimum score
  const qualified = matches.filter(m => m.overallScore >= minScore);
  
  // Sort by score (descending), then by min margin (descending)
  qualified.sort((a, b) => {
    if (b.overallScore !== a.overallScore) {
      return b.overallScore - a.overallScore;
    }
    return b.minMargin - a.minMargin;
  });
  
  return qualified;
}

/**
 * Get default frequency requirements based on overall attenuation needed
 */
export function getDefaultRequirements(overallAttenuationDb: number): FrequencyBandRequirements {
  // Scale based on typical silencer performance curves
  // Mid-frequencies typically need more attenuation
  const factor = overallAttenuationDb / 15; // Normalize to typical 15dB silencer
  
  return {
    '63Hz': Math.round(overallAttenuationDb * 0.3),
    '125Hz': Math.round(overallAttenuationDb * 0.5),
    '250Hz': Math.round(overallAttenuationDb * 0.75),
    '500Hz': Math.round(overallAttenuationDb * 1.0),
    '1kHz': Math.round(overallAttenuationDb * 1.2),
    '2kHz': Math.round(overallAttenuationDb * 1.1),
    '4kHz': Math.round(overallAttenuationDb * 0.9),
    '8kHz': Math.round(overallAttenuationDb * 0.7),
  };
}

/**
 * Generate specification text for selected silencer
 */
export function generateSilencerSpec(
  silencer: ManufacturerSilencer,
  match: SilencerMatch
): string {
  const lines = [
    `SILENCER SPECIFICATION`,
    `=====================`,
    ``,
    `Manufacturer: ${silencer.manufacturer}`,
    `Model: ${silencer.model}`,
    `Series: ${silencer.series}`,
    `Catalog Number: ${silencer.catalogNumber}`,
    ``,
    `DIMENSIONS`,
    `----------`,
    `Type: ${silencer.type === 'round' ? 'Round' : 'Rectangular'}`,
  ];
  
  if (silencer.type === 'round') {
    lines.push(`Diameter: ${silencer.dimensions.diameterIn}" (${Math.round(silencer.dimensions.diameterIn! * 25.4)}mm)`);
  } else {
    lines.push(`Width: ${silencer.dimensions.widthIn}" (${Math.round(silencer.dimensions.widthIn! * 25.4)}mm)`);
    lines.push(`Height: ${silencer.dimensions.heightIn}" (${Math.round(silencer.dimensions.heightIn! * 25.4)}mm)`);
  }
  lines.push(`Length: ${silencer.dimensions.lengthIn}" (${Math.round(silencer.dimensions.lengthIn * 25.4)}mm)`);
  
  lines.push(
    ``,
    `ACOUSTIC PERFORMANCE`,
    `--------------------`,
    `Overall Insertion Loss: ${silencer.insertionLoss.overall} dB`,
    `Self-Generated Noise: NC-${silencer.selfNoiseNC}`,
    ``,
    `Octave Band Insertion Loss (dB):`,
    `  63Hz: ${silencer.insertionLoss.octaveBands['63Hz']}`,
    `  125Hz: ${silencer.insertionLoss.octaveBands['125Hz']}`,
    `  250Hz: ${silencer.insertionLoss.octaveBands['250Hz']}`,
    `  500Hz: ${silencer.insertionLoss.octaveBands['500Hz']}`,
    `  1kHz: ${silencer.insertionLoss.octaveBands['1kHz']}`,
    `  2kHz: ${silencer.insertionLoss.octaveBands['2kHz']}`,
    `  4kHz: ${silencer.insertionLoss.octaveBands['4kHz']}`,
    `  8kHz: ${silencer.insertionLoss.octaveBands['8kHz']}`,
    ``,
    `AERODYNAMIC PERFORMANCE`,
    `-----------------------`,
    `Pressure Drop: ${silencer.pressureDropIn}" w.g. (${Math.round(silencer.pressureDropIn * 249)}Pa)`,
    `Maximum Velocity: ${silencer.maxVelocityFpm} FPM`,
    ``,
    `APPLICATION`,
    `-----------`,
    `HVAC Application: ${silencer.hvacApplication.join(', ')}`,
    `${silencer.applicationNotes ? `Notes: ${silencer.applicationNotes}` : ''}`,
    ``,
    `MATCH ANALYSIS`,
    `--------------`,
    `Overall Score: ${match.overallScore}/100`,
    `Minimum Margin: ${match.minMargin >= 0 ? '+' : ''}${match.minMargin} dB`,
    `${match.deficientBands.length > 0 ? `Deficient Bands: ${match.deficientBands.join(', ')}` : 'All bands meet requirements'}`,
    ``,
    `${match.recommendation}`,
  );
  
  return lines.join('\n');
}
