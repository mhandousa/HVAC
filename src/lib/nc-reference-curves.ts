// Standard NC (Noise Criteria) Reference Curves
// Based on ASHRAE Handbook - Fundamentals

export interface OctaveBandData {
  '63Hz': number;
  '125Hz': number;
  '250Hz': number;
  '500Hz': number;
  '1kHz': number;
  '2kHz': number;
  '4kHz': number;
  '8kHz': number;
}

export const OCTAVE_BAND_FREQUENCIES = [
  '63Hz',
  '125Hz',
  '250Hz',
  '500Hz',
  '1kHz',
  '2kHz',
  '4kHz',
  '8kHz',
] as const;

export type OctaveBandFrequency = typeof OCTAVE_BAND_FREQUENCIES[number];

// Standard NC curves from NC-15 to NC-65
// Values are sound pressure levels in dB for each octave band
export const NC_REFERENCE_CURVES: Record<number, OctaveBandData> = {
  15: { '63Hz': 47, '125Hz': 36, '250Hz': 29, '500Hz': 22, '1kHz': 17, '2kHz': 14, '4kHz': 12, '8kHz': 11 },
  20: { '63Hz': 51, '125Hz': 40, '250Hz': 33, '500Hz': 26, '1kHz': 22, '2kHz': 19, '4kHz': 17, '8kHz': 16 },
  25: { '63Hz': 54, '125Hz': 44, '250Hz': 37, '500Hz': 31, '1kHz': 27, '2kHz': 24, '4kHz': 22, '8kHz': 21 },
  30: { '63Hz': 57, '125Hz': 48, '250Hz': 41, '500Hz': 35, '1kHz': 31, '2kHz': 29, '4kHz': 28, '8kHz': 27 },
  35: { '63Hz': 60, '125Hz': 52, '250Hz': 45, '500Hz': 40, '1kHz': 36, '2kHz': 34, '4kHz': 33, '8kHz': 32 },
  40: { '63Hz': 64, '125Hz': 56, '250Hz': 50, '500Hz': 45, '1kHz': 41, '2kHz': 39, '4kHz': 38, '8kHz': 37 },
  45: { '63Hz': 67, '125Hz': 60, '250Hz': 54, '500Hz': 49, '1kHz': 46, '2kHz': 44, '4kHz': 43, '8kHz': 42 },
  50: { '63Hz': 71, '125Hz': 64, '250Hz': 58, '500Hz': 54, '1kHz': 51, '2kHz': 49, '4kHz': 48, '8kHz': 47 },
  55: { '63Hz': 74, '125Hz': 67, '250Hz': 62, '500Hz': 58, '1kHz': 56, '2kHz': 54, '4kHz': 53, '8kHz': 52 },
  60: { '63Hz': 77, '125Hz': 71, '250Hz': 67, '500Hz': 63, '1kHz': 61, '2kHz': 59, '4kHz': 58, '8kHz': 57 },
  65: { '63Hz': 80, '125Hz': 75, '250Hz': 71, '500Hz': 68, '1kHz': 66, '2kHz': 64, '4kHz': 63, '8kHz': 62 },
};
// Available NC levels for display
export const AVAILABLE_NC_LEVELS = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65];

// Legacy aliases for backward compatibility
export const FREQUENCY_BANDS = ['63', '125', '250', '500', '1000', '2000', '4000', '8000'] as const;
export type FrequencyBand = typeof FREQUENCY_BANDS[number];
export const NC_CURVES = NC_REFERENCE_CURVES;

// Mapping between legacy format (hz63) and new format ('63Hz')
export const FREQ_KEY_MAP: Record<FrequencyBand, OctaveBandFrequency> = {
  '63': '63Hz',
  '125': '125Hz',
  '250': '250Hz',
  '500': '500Hz',
  '1000': '1kHz',
  '2000': '2kHz',
  '4000': '4kHz',
  '8000': '8kHz',
};

// Saudi Building Code NC requirements by space type
export const SAUDI_NC_REQUIREMENTS: Record<string, { target: number; max: number }> = {
  'recording_studio': { target: 15, max: 20 },
  'concert_hall': { target: 15, max: 20 },
  'theater': { target: 20, max: 25 },
  'courtroom': { target: 25, max: 30 },
  'executive_office': { target: 25, max: 35 },
  'conference_room': { target: 25, max: 35 },
  'private_office': { target: 30, max: 40 },
  'open_office': { target: 40, max: 45 },
  'hotel_room': { target: 25, max: 35 },
  'hospital_room': { target: 25, max: 35 },
  'classroom': { target: 25, max: 35 },
  'library': { target: 30, max: 40 },
  'restaurant': { target: 40, max: 50 },
  'lobby': { target: 40, max: 45 },
  'retail': { target: 40, max: 50 },
  'gymnasium': { target: 45, max: 55 },
  'kitchen': { target: 50, max: 60 },
  'mechanical_room': { target: 55, max: 65 },
  'data_center': { target: 55, max: 65 },
};

// Get the closest NC curve for a given NC value
export function getClosestNCCurve(ncValue: number): OctaveBandData {
  const closestLevel = AVAILABLE_NC_LEVELS.reduce((prev, curr) => 
    Math.abs(curr - ncValue) < Math.abs(prev - ncValue) ? curr : prev
  );
  return NC_REFERENCE_CURVES[closestLevel];
}

// Interpolate NC curve for non-standard values
export function interpolateNCCurve(ncValue: number): OctaveBandData {
  if (ncValue <= 15) return NC_REFERENCE_CURVES[15];
  if (ncValue >= 65) return NC_REFERENCE_CURVES[65];
  
  const lowerNC = Math.floor(ncValue / 5) * 5;
  const upperNC = lowerNC + 5;
  const fraction = (ncValue - lowerNC) / 5;
  
  const lowerCurve = NC_REFERENCE_CURVES[lowerNC];
  const upperCurve = NC_REFERENCE_CURVES[upperNC];
  
  return {
    '63Hz': lowerCurve['63Hz'] + (upperCurve['63Hz'] - lowerCurve['63Hz']) * fraction,
    '125Hz': lowerCurve['125Hz'] + (upperCurve['125Hz'] - lowerCurve['125Hz']) * fraction,
    '250Hz': lowerCurve['250Hz'] + (upperCurve['250Hz'] - lowerCurve['250Hz']) * fraction,
    '500Hz': lowerCurve['500Hz'] + (upperCurve['500Hz'] - lowerCurve['500Hz']) * fraction,
    '1kHz': lowerCurve['1kHz'] + (upperCurve['1kHz'] - lowerCurve['1kHz']) * fraction,
    '2kHz': lowerCurve['2kHz'] + (upperCurve['2kHz'] - lowerCurve['2kHz']) * fraction,
    '4kHz': lowerCurve['4kHz'] + (upperCurve['4kHz'] - lowerCurve['4kHz']) * fraction,
    '8kHz': lowerCurve['8kHz'] + (upperCurve['8kHz'] - lowerCurve['8kHz']) * fraction,
  };
}

// Calculate NC rating from octave band data
export function calculateNCFromOctaveBands(octaveBands: OctaveBandData): number {
  let highestNC = 0;
  
  for (const ncLevel of AVAILABLE_NC_LEVELS) {
    const ncCurve = NC_REFERENCE_CURVES[ncLevel];
    let exceeds = false;
    
    for (const freq of OCTAVE_BAND_FREQUENCIES) {
      if (octaveBands[freq] > ncCurve[freq]) {
        exceeds = true;
        break;
      }
    }
    
    if (!exceeds) {
      return highestNC > 0 ? highestNC : ncLevel;
    }
    highestNC = ncLevel;
  }
  
  return 65; // Exceeds NC-65
}

// Determine which frequencies exceed the target NC curve
export function getExceedingFrequencies(
  measured: OctaveBandData,
  targetNC: number
): { frequency: OctaveBandFrequency; measured: number; target: number; delta: number }[] {
  const targetCurve = interpolateNCCurve(targetNC);
  const exceeding: { frequency: OctaveBandFrequency; measured: number; target: number; delta: number }[] = [];
  
  for (const freq of OCTAVE_BAND_FREQUENCIES) {
    const delta = measured[freq] - targetCurve[freq];
    if (delta > 0) {
      exceeding.push({
        frequency: freq,
        measured: measured[freq],
        target: targetCurve[freq],
        delta: Math.round(delta * 10) / 10,
      });
    }
  }
  
  return exceeding;
}

// Get compliance status for each frequency band
export function getFrequencyComplianceStatus(
  measured: OctaveBandData,
  targetNC: number
): Record<OctaveBandFrequency, 'compliant' | 'marginal' | 'exceeds'> {
  const targetCurve = interpolateNCCurve(targetNC);
  const result: Record<string, 'compliant' | 'marginal' | 'exceeds'> = {};
  
  for (const freq of OCTAVE_BAND_FREQUENCIES) {
    const delta = measured[freq] - targetCurve[freq];
    if (delta > 3) {
      result[freq] = 'exceeds';
    } else if (delta > 0) {
      result[freq] = 'marginal';
    } else {
      result[freq] = 'compliant';
    }
  }
  
  return result as Record<OctaveBandFrequency, 'compliant' | 'marginal' | 'exceeds'>;
}

// Calculate required attenuation per frequency band
export function calculateRequiredAttenuation(
  measured: OctaveBandData,
  targetNC: number,
  safetyMargin: number = 3
): OctaveBandData {
  const targetCurve = interpolateNCCurve(targetNC);
  
  const calcReq = (freq: OctaveBandFrequency) => 
    Math.max(0, measured[freq] - targetCurve[freq] + safetyMargin);
  
  return {
    '63Hz': calcReq('63Hz'),
    '125Hz': calcReq('125Hz'),
    '250Hz': calcReq('250Hz'),
    '500Hz': calcReq('500Hz'),
    '1kHz': calcReq('1kHz'),
    '2kHz': calcReq('2kHz'),
    '4kHz': calcReq('4kHz'),
    '8kHz': calcReq('8kHz'),
  };
}

// Generate chart data format for Recharts
export function generateChartData(
  measured: OctaveBandData | null,
  targetNC: number,
  referenceNCLevels: number[] = [25, 30, 35, 40, 45, 50]
): Array<{
  frequency: string;
  measured?: number;
  target: number;
  [key: string]: number | string | undefined;
}> {
  const targetCurve = interpolateNCCurve(targetNC);
  
  return OCTAVE_BAND_FREQUENCIES.map((freq) => {
    const dataPoint: Record<string, number | string | undefined> = {
      frequency: freq,
      target: Math.round(targetCurve[freq] * 10) / 10,
    };
    
    if (measured) {
      dataPoint.measured = Math.round(measured[freq] * 10) / 10;
    }
    
    // Add reference NC curves
    for (const ncLevel of referenceNCLevels) {
      dataPoint[`NC-${ncLevel}`] = NC_REFERENCE_CURVES[ncLevel][freq];
    }
    
    return dataPoint as {
      frequency: string;
      measured?: number;
      target: number;
      [key: string]: number | string | undefined;
    };
  });
}

// Calculate improvement between two measurements
export function calculateImprovement(
  before: OctaveBandData,
  after: OctaveBandData
): {
  overallImprovement: number;
  frequencyImprovements: Record<OctaveBandFrequency, number>;
  beforeNC: number;
  afterNC: number;
} {
  const beforeNC = calculateNCFromOctaveBands(before);
  const afterNC = calculateNCFromOctaveBands(after);
  
  const frequencyImprovements: Record<string, number> = {};
  for (const freq of OCTAVE_BAND_FREQUENCIES) {
    frequencyImprovements[freq] = before[freq] - after[freq];
  }
  
  return {
    overallImprovement: beforeNC - afterNC,
    frequencyImprovements: frequencyImprovements as Record<OctaveBandFrequency, number>,
    beforeNC,
    afterNC,
  };
}

// Get color for dB value relative to target
export function getDbValueColor(
  value: number,
  targetValue: number
): 'green' | 'amber' | 'red' {
  const delta = value - targetValue;
  if (delta > 3) return 'red';
  if (delta > 0) return 'amber';
  return 'green';
}
