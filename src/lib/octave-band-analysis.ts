// Octave Band Spectrum Analysis Library
// Provides functions for analyzing noise across frequency bands

import { 
  OctaveBandData, 
  FrequencyBand, 
  FREQUENCY_BANDS, 
  NC_CURVES,
  OCTAVE_BAND_FREQUENCIES,
  OctaveBandFrequency,
  FREQ_KEY_MAP
} from './nc-reference-curves';

export interface OctaveBandSource {
  id: string;
  name: string;
  type: 'equipment' | 'duct' | 'fitting' | 'terminal' | 'diffuser' | 'external';
  levels: OctaveBandData;
  location?: string;
  color?: string;
}

export interface FrequencyExceedance {
  band: FrequencyBand;
  measured: number;
  target: number;
  excess: number;
  sources: { name: string; contribution: number }[];
}

export interface SpectrumAnalysis {
  sources: OctaveBandSource[];
  combined: OctaveBandData;
  calculatedNC: number;
  targetNC: number;
  exceedingBands: FrequencyExceedance[];
  dominantSource: string;
  dominantFrequency: FrequencyBand;
  isCompliant: boolean;
  complianceMargin: number;
  sourceContributions: { source: string; percentage: number; color: string }[];
}

// Standard colors for source types
export const SOURCE_TYPE_COLORS: Record<OctaveBandSource['type'], string> = {
  equipment: 'hsl(var(--chart-1))',
  duct: 'hsl(var(--chart-2))',
  fitting: 'hsl(var(--chart-3))',
  terminal: 'hsl(var(--chart-4))',
  diffuser: 'hsl(var(--chart-5))',
  external: 'hsl(var(--muted-foreground))',
};

// Equipment type spectral shapes (relative dB distribution across octave bands)
// Based on ASHRAE Handbook - HVAC Applications, Chapter 48
const EQUIPMENT_SPECTRAL_SHAPES: Record<string, number[]> = {
  // Format: [63Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz] relative to overall level
  'ahu': [8, 6, 4, 2, 0, -2, -5, -9],
  'chiller': [10, 8, 5, 2, 0, -3, -7, -12],
  'pump': [6, 4, 2, 0, -2, -5, -8, -12],
  'fan': [7, 5, 3, 1, 0, -2, -5, -9],
  'vav': [2, 0, -2, -3, -5, -7, -10, -14],
  'fcu': [4, 2, 0, -2, -4, -6, -9, -13],
  'diffuser': [0, -2, -4, -5, -6, -8, -11, -15],
  'compressor': [12, 9, 6, 3, 0, -3, -7, -12],
  'cooling_tower': [14, 11, 7, 3, 0, -4, -8, -13],
  'boiler': [8, 6, 4, 2, 0, -3, -6, -10],
  'default': [5, 3, 1, 0, -1, -3, -6, -10],
};

/**
 * Logarithmically combine multiple sound levels (dB addition)
 */
export function combineDbLevels(levels: number[]): number {
  if (levels.length === 0) return 0;
  if (levels.length === 1) return levels[0];
  
  const sum = levels.reduce((acc, level) => {
    if (level <= 0) return acc;
    return acc + Math.pow(10, level / 10);
  }, 0);
  
  return sum > 0 ? 10 * Math.log10(sum) : 0;
}

/**
 * Combine multiple octave band sources into a single combined spectrum
 */
export function combineOctaveBandSources(sources: OctaveBandSource[]): OctaveBandData {
  if (sources.length === 0) {
    return {
      '63Hz': 0, '125Hz': 0, '250Hz': 0, '500Hz': 0,
      '1kHz': 0, '2kHz': 0, '4kHz': 0, '8kHz': 0,
    };
  }

  const combined: OctaveBandData = {
    '63Hz': combineDbLevels(sources.map(s => s.levels['63Hz'])),
    '125Hz': combineDbLevels(sources.map(s => s.levels['125Hz'])),
    '250Hz': combineDbLevels(sources.map(s => s.levels['250Hz'])),
    '500Hz': combineDbLevels(sources.map(s => s.levels['500Hz'])),
    '1kHz': combineDbLevels(sources.map(s => s.levels['1kHz'])),
    '2kHz': combineDbLevels(sources.map(s => s.levels['2kHz'])),
    '4kHz': combineDbLevels(sources.map(s => s.levels['4kHz'])),
    '8kHz': combineDbLevels(sources.map(s => s.levels['8kHz'])),
  };

  return combined;
}

/**
 * Calculate NC rating from octave band data
 */
export function calculateNCFromOctaveBands(data: OctaveBandData): number {
  const dataArray = [
    data['63Hz'], data['125Hz'], data['250Hz'], data['500Hz'],
    data['1kHz'], data['2kHz'], data['4kHz'], data['8kHz'],
  ];

  // Find the highest NC curve that the data exceeds
  let highestNC = 15;
  for (let nc = 70; nc >= 15; nc -= 5) {
    const curve = NC_CURVES[nc];
    if (!curve) continue;
    
    const curveArray = [
      curve['63Hz'], curve['125Hz'], curve['250Hz'], curve['500Hz'],
      curve['1kHz'], curve['2kHz'], curve['4kHz'], curve['8kHz'],
    ];
    
    const exceeds = dataArray.some((val, idx) => val > curveArray[idx]);
    if (exceeds) {
      highestNC = nc;
      break;
    }
  }

  return highestNC;
}

/**
 * Get NC curve data for a given NC rating
 */
export function getNCCurve(ncRating: number): OctaveBandData {
  // Find the closest NC curve
  const availableNC = Object.keys(NC_CURVES).map(Number).sort((a, b) => a - b);
  const closestNC = availableNC.reduce((prev, curr) =>
    Math.abs(curr - ncRating) < Math.abs(prev - ncRating) ? curr : prev
  );
  
  return NC_CURVES[closestNC] || NC_CURVES[35];
}

/**
 * Estimate octave band levels from a single overall sound power level
 */
export function estimateEquipmentOctaveBands(
  soundPowerDb: number,
  equipmentType: string
): OctaveBandData {
  const typeKey = equipmentType.toLowerCase().replace(/[^a-z]/g, '');
  const shape = EQUIPMENT_SPECTRAL_SHAPES[typeKey] || EQUIPMENT_SPECTRAL_SHAPES['default'];
  
  // Apply spectral shape to the overall level
  return {
    '63Hz': soundPowerDb + shape[0],
    '125Hz': soundPowerDb + shape[1],
    '250Hz': soundPowerDb + shape[2],
    '500Hz': soundPowerDb + shape[3],
    '1kHz': soundPowerDb + shape[4],
    '2kHz': soundPowerDb + shape[5],
    '4kHz': soundPowerDb + shape[6],
    '8kHz': soundPowerDb + shape[7],
  };
}

/**
 * Calculate relative contribution of each source to the combined level
 */
export function calculateSourceContributions(
  sources: OctaveBandSource[]
): { source: string; percentage: number; color: string }[] {
  if (sources.length === 0) return [];

  // Calculate total energy for each source (sum across all bands)
  const sourceEnergies = sources.map(source => {
    const bands = [
      source.levels['63Hz'], source.levels['125Hz'], source.levels['250Hz'], source.levels['500Hz'],
      source.levels['1kHz'], source.levels['2kHz'], source.levels['4kHz'], source.levels['8kHz'],
    ];
    const energy = bands.reduce((sum, db) => sum + Math.pow(10, db / 10), 0);
    return {
      name: source.name,
      energy,
      color: source.color || SOURCE_TYPE_COLORS[source.type],
    };
  });

  const totalEnergy = sourceEnergies.reduce((sum, s) => sum + s.energy, 0);

  return sourceEnergies.map(s => ({
    source: s.name,
    percentage: totalEnergy > 0 ? (s.energy / totalEnergy) * 100 : 0,
    color: s.color,
  })).sort((a, b) => b.percentage - a.percentage);
}

/**
 * Identify frequency bands that exceed the target NC curve
 */
export function identifyExceedingBands(
  sources: OctaveBandSource[],
  combined: OctaveBandData,
  targetNC: number
): FrequencyExceedance[] {
  const targetCurve = getNCCurve(targetNC);
  const exceedances: FrequencyExceedance[] = [];

  const bands: { key: keyof OctaveBandData; band: FrequencyBand }[] = [
    { key: '63Hz', band: '63' },
    { key: '125Hz', band: '125' },
    { key: '250Hz', band: '250' },
    { key: '500Hz', band: '500' },
    { key: '1kHz', band: '1000' },
    { key: '2kHz', band: '2000' },
    { key: '4kHz', band: '4000' },
    { key: '8kHz', band: '8000' },
  ];

  for (const { key, band } of bands) {
    const measured = combined[key];
    const target = targetCurve[key];
    
    if (measured > target) {
      // Calculate contribution of each source at this frequency
      const sourceContributions = sources.map(source => ({
        name: source.name,
        contribution: source.levels[key],
      })).sort((a, b) => b.contribution - a.contribution);

      exceedances.push({
        band,
        measured,
        target,
        excess: measured - target,
        sources: sourceContributions,
      });
    }
  }

  return exceedances;
}

/**
 * Find the dominant frequency band in a spectrum
 */
export function findDominantFrequency(data: OctaveBandData): FrequencyBand {
  const bands: { key: keyof OctaveBandData; band: FrequencyBand }[] = [
    { key: '63Hz', band: '63' },
    { key: '125Hz', band: '125' },
    { key: '250Hz', band: '250' },
    { key: '500Hz', band: '500' },
    { key: '1kHz', band: '1000' },
    { key: '2kHz', band: '2000' },
    { key: '4kHz', band: '4000' },
    { key: '8kHz', band: '8000' },
  ];

  let maxBand = bands[0];
  let maxValue = data[bands[0].key];

  for (const item of bands) {
    if (data[item.key] > maxValue) {
      maxValue = data[item.key];
      maxBand = item;
    }
  }

  return maxBand.band;
}

/**
 * Perform complete spectrum analysis
 */
export function analyzeSpectrum(
  sources: OctaveBandSource[],
  targetNC: number
): SpectrumAnalysis {
  const combined = combineOctaveBandSources(sources);
  const calculatedNC = calculateNCFromOctaveBands(combined);
  const exceedingBands = identifyExceedingBands(sources, combined, targetNC);
  const sourceContributions = calculateSourceContributions(sources);
  const dominantFrequency = findDominantFrequency(combined);
  
  // Find dominant source
  const dominantSource = sourceContributions.length > 0 
    ? sourceContributions[0].source 
    : 'None';

  return {
    sources,
    combined,
    calculatedNC,
    targetNC,
    exceedingBands,
    dominantSource,
    dominantFrequency,
    isCompliant: calculatedNC <= targetNC,
    complianceMargin: targetNC - calculatedNC,
    sourceContributions,
  };
}

/**
 * Generate chart data for spectrum visualization
 */
export function generateSpectrumChartData(analysis: SpectrumAnalysis) {
  const targetCurve = getNCCurve(analysis.targetNC);
  
  return FREQUENCY_BANDS.map(band => {
    const key = FREQ_KEY_MAP[band];
    const measured = analysis.combined[key];
    const target = targetCurve[key];
    
    // Build source breakdown for stacked chart
    const sourceData: Record<string, number> = {};
    for (const source of analysis.sources) {
      sourceData[source.name] = source.levels[key];
    }

    return {
      frequency: `${band} Hz`,
      frequencyShort: band,
      measured,
      target,
      delta: measured - target,
      isExceeding: measured > target,
      ...sourceData,
    };
  });
}

/**
 * Estimate duct-generated noise based on velocity
 */
export function estimateDuctNoise(velocityFpm: number, sizeIn: number): OctaveBandData {
  // Based on ASHRAE empirical data for duct noise
  // Higher velocities = more high-frequency noise
  const baseLevel = 10 * Math.log10(velocityFpm / 1000) * 10 + 25;
  
  return {
    '63Hz': baseLevel - 5,
    '125Hz': baseLevel - 3,
    '250Hz': baseLevel - 1,
    '500Hz': baseLevel,
    '1kHz': baseLevel - 2,
    '2kHz': baseLevel - 5,
    '4kHz': baseLevel - 9,
    '8kHz': baseLevel - 14,
  };
}

/**
 * Estimate diffuser/grille noise from face velocity
 */
export function estimateDiffuserNoise(faceVelocityFpm: number, ncRating?: number): OctaveBandData {
  if (ncRating) {
    return getNCCurve(ncRating);
  }
  
  // Estimate NC from face velocity (empirical relationship)
  // NC ≈ 10 + (velocity - 300) / 40 for typical diffusers
  const estimatedNC = Math.min(65, Math.max(15, 10 + (faceVelocityFpm - 300) / 40));
  return getNCCurve(Math.round(estimatedNC / 5) * 5);
}

/**
 * Estimate octave band levels from a single NC value
 * Uses the NC curve as a reference with slight variation for realism
 */
export function estimateOctaveBandFromNC(ncValue: number): OctaveBandData {
  const ncCurve = getNCCurve(Math.round(ncValue / 5) * 5);
  
  // Add slight variation to make it more realistic (±1 dB)
  return {
    '63Hz': ncCurve['63Hz'] + (Math.random() * 2 - 1),
    '125Hz': ncCurve['125Hz'] + (Math.random() * 2 - 1),
    '250Hz': ncCurve['250Hz'] + (Math.random() * 2 - 1),
    '500Hz': ncCurve['500Hz'] + (Math.random() * 2 - 1),
    '1kHz': ncCurve['1kHz'] + (Math.random() * 2 - 1),
    '2kHz': ncCurve['2kHz'] + (Math.random() * 2 - 1),
    '4kHz': ncCurve['4kHz'] + (Math.random() * 2 - 1),
    '8kHz': ncCurve['8kHz'] + (Math.random() * 2 - 1),
  };
}
