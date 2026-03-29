// Silencer Sizing Calculator Library
// Calculates optimal silencer dimensions based on airflow, pressure, and attenuation requirements

export interface SilencerSizingInput {
  airflowCfm: number;
  maxVelocityFpm: number;
  maxPressureDropIn: number;
  requiredAttenuationDb: number;
  ductType: 'round' | 'rectangular';
  ductDiameterIn?: number;
  ductWidthIn?: number;
  ductHeightIn?: number;
  spaceConstraintLengthIn?: number;
  targetFrequency?: '125' | '250' | '500' | '1000' | '2000' | '4000';
}

export interface SilencerDimensions {
  type: 'round' | 'rectangular';
  diameterIn?: number;
  widthIn?: number;
  heightIn?: number;
  lengthIn: number;
  freeAreaSqFt: number;
}

export interface SilencerPerformance {
  expectedAttenuationDb: number;
  expectedPressureDropIn: number;
  velocityFpm: number;
  selfNoiseNC: number;
  meetsAttenuationRequirement: boolean;
  meetsPressureRequirement: boolean;
  meetsVelocityRequirement: boolean;
}

export interface AlternativeSize {
  dimensions: SilencerDimensions;
  performance: SilencerPerformance;
  description: string;
  tradeoff: string;
}

export interface SilencerSizingResult {
  input: SilencerSizingInput;
  recommended: SilencerDimensions;
  performance: SilencerPerformance;
  alternatives: AlternativeSize[];
  sizingNotes: string[];
  warnings: string[];
}

// Standard silencer lengths (inches)
const STANDARD_LENGTHS = [36, 48, 60, 72, 84, 96, 120];

// Standard round silencer diameters (inches)
const STANDARD_ROUND_DIAMETERS = [6, 8, 10, 12, 14, 16, 18, 20, 24, 30, 36, 42, 48];

// Standard rectangular silencer widths (inches)
const STANDARD_RECT_WIDTHS = [12, 18, 24, 30, 36, 42, 48, 60, 72];

// Insertion loss per foot of silencer length at different frequencies (dB/ft)
// Based on typical lined silencer performance
const INSERTION_LOSS_PER_FT: Record<string, number> = {
  '63': 1.0,
  '125': 2.5,
  '250': 5.0,
  '500': 7.0,
  '1000': 6.5,
  '2000': 5.0,
  '4000': 3.5,
  '8000': 2.0,
};

// Pressure drop coefficient (inches w.g. per (fpm/1000)^2 per foot of length)
const PRESSURE_DROP_COEFF = 0.015;

// Self-noise generation constants
const SELF_NOISE_BASE_NC = 15;
const SELF_NOISE_VELOCITY_FACTOR = 0.012; // NC increase per FPM above 1500

/**
 * Calculate minimum free area required to meet velocity limit
 */
function calculateMinFreeArea(airflowCfm: number, maxVelocityFpm: number): number {
  return airflowCfm / maxVelocityFpm;
}

/**
 * Calculate round silencer diameter for given free area
 */
function calculateRoundDiameter(freeAreaSqFt: number): number {
  // Area = π * (d/2)^2, solve for d in inches
  const areaSquareIn = freeAreaSqFt * 144;
  return Math.sqrt((4 * areaSquareIn) / Math.PI);
}

/**
 * Find next standard size up from calculated dimension
 */
function findNextStandardSize(calculated: number, standardSizes: number[]): number {
  for (const size of standardSizes) {
    if (size >= calculated) return size;
  }
  return standardSizes[standardSizes.length - 1];
}

/**
 * Calculate expected insertion loss for a given silencer configuration
 */
function calculateInsertionLoss(
  lengthIn: number,
  targetFrequency: string = '500'
): number {
  const lengthFt = lengthIn / 12;
  const lossPerFt = INSERTION_LOSS_PER_FT[targetFrequency] || INSERTION_LOSS_PER_FT['500'];
  return lengthFt * lossPerFt;
}

/**
 * Calculate average insertion loss across all frequency bands
 */
function calculateAverageInsertionLoss(lengthIn: number): number {
  const lengthFt = lengthIn / 12;
  const frequencies = Object.keys(INSERTION_LOSS_PER_FT);
  const totalLoss = frequencies.reduce((sum, freq) => 
    sum + INSERTION_LOSS_PER_FT[freq] * lengthFt, 0
  );
  return totalLoss / frequencies.length;
}

/**
 * Calculate pressure drop through silencer
 */
function calculatePressureDrop(
  velocityFpm: number,
  lengthIn: number
): number {
  const lengthFt = lengthIn / 12;
  const velocityFactor = Math.pow(velocityFpm / 1000, 2);
  return PRESSURE_DROP_COEFF * velocityFactor * lengthFt;
}

/**
 * Estimate self-noise NC rating
 */
function calculateSelfNoiseNC(velocityFpm: number): number {
  if (velocityFpm <= 1500) return SELF_NOISE_BASE_NC;
  return Math.round(SELF_NOISE_BASE_NC + (velocityFpm - 1500) * SELF_NOISE_VELOCITY_FACTOR);
}

/**
 * Calculate required silencer length to achieve target attenuation
 */
function calculateRequiredLength(
  requiredAttenuation: number,
  targetFrequency: string = '500'
): number {
  const lossPerFt = INSERTION_LOSS_PER_FT[targetFrequency] || INSERTION_LOSS_PER_FT['500'];
  const requiredLengthFt = requiredAttenuation / lossPerFt;
  const requiredLengthIn = requiredLengthFt * 12;
  return findNextStandardSize(requiredLengthIn, STANDARD_LENGTHS);
}

/**
 * Evaluate silencer performance
 */
function evaluatePerformance(
  dimensions: SilencerDimensions,
  airflowCfm: number,
  maxVelocityFpm: number,
  maxPressureDropIn: number,
  requiredAttenuationDb: number,
  targetFrequency: string = '500'
): SilencerPerformance {
  const velocity = airflowCfm / dimensions.freeAreaSqFt;
  const pressureDrop = calculatePressureDrop(velocity, dimensions.lengthIn);
  const attenuation = calculateInsertionLoss(dimensions.lengthIn, targetFrequency);
  const selfNoise = calculateSelfNoiseNC(velocity);

  return {
    expectedAttenuationDb: Math.round(attenuation * 10) / 10,
    expectedPressureDropIn: Math.round(pressureDrop * 100) / 100,
    velocityFpm: Math.round(velocity),
    selfNoiseNC: selfNoise,
    meetsAttenuationRequirement: attenuation >= requiredAttenuationDb,
    meetsPressureRequirement: pressureDrop <= maxPressureDropIn,
    meetsVelocityRequirement: velocity <= maxVelocityFpm,
  };
}

/**
 * Generate alternative silencer sizes
 */
function generateAlternatives(
  input: SilencerSizingInput,
  recommended: SilencerDimensions
): AlternativeSize[] {
  const alternatives: AlternativeSize[] = [];
  const targetFreq = input.targetFrequency || '500';

  // Shorter length, larger diameter (lower pressure drop)
  if (recommended.type === 'round' && recommended.diameterIn) {
    const shorterLength = STANDARD_LENGTHS.find(l => l < recommended.lengthIn) || recommended.lengthIn;
    const largerDiameterIdx = STANDARD_ROUND_DIAMETERS.indexOf(recommended.diameterIn) + 1;
    if (largerDiameterIdx < STANDARD_ROUND_DIAMETERS.length) {
      const largerDiameter = STANDARD_ROUND_DIAMETERS[largerDiameterIdx];
      const freeArea = Math.PI * Math.pow(largerDiameter / 24, 2);
      const dims: SilencerDimensions = {
        type: 'round',
        diameterIn: largerDiameter,
        lengthIn: recommended.lengthIn,
        freeAreaSqFt: freeArea,
      };
      const perf = evaluatePerformance(
        dims, input.airflowCfm, input.maxVelocityFpm,
        input.maxPressureDropIn, input.requiredAttenuationDb, targetFreq
      );
      alternatives.push({
        dimensions: dims,
        performance: perf,
        description: `${largerDiameter}" dia × ${recommended.lengthIn}" L`,
        tradeoff: 'Lower velocity and pressure drop, larger footprint',
      });
    }
  }

  // Longer length for more attenuation
  const longerLengthIdx = STANDARD_LENGTHS.indexOf(recommended.lengthIn) + 1;
  if (longerLengthIdx < STANDARD_LENGTHS.length) {
    const longerLength = STANDARD_LENGTHS[longerLengthIdx];
    const dims: SilencerDimensions = {
      ...recommended,
      lengthIn: longerLength,
    };
    const perf = evaluatePerformance(
      dims, input.airflowCfm, input.maxVelocityFpm,
      input.maxPressureDropIn, input.requiredAttenuationDb, targetFreq
    );
    alternatives.push({
      dimensions: dims,
      performance: perf,
      description: dims.type === 'round' 
        ? `${dims.diameterIn}" dia × ${longerLength}" L`
        : `${dims.widthIn}"W × ${dims.heightIn}"H × ${longerLength}" L`,
      tradeoff: 'Higher attenuation, increased pressure drop and space',
    });
  }

  // Shorter length for space constraints
  const shorterLengthIdx = STANDARD_LENGTHS.indexOf(recommended.lengthIn) - 1;
  if (shorterLengthIdx >= 0) {
    const shorterLength = STANDARD_LENGTHS[shorterLengthIdx];
    const dims: SilencerDimensions = {
      ...recommended,
      lengthIn: shorterLength,
    };
    const perf = evaluatePerformance(
      dims, input.airflowCfm, input.maxVelocityFpm,
      input.maxPressureDropIn, input.requiredAttenuationDb, targetFreq
    );
    alternatives.push({
      dimensions: dims,
      performance: perf,
      description: dims.type === 'round'
        ? `${dims.diameterIn}" dia × ${shorterLength}" L`
        : `${dims.widthIn}"W × ${dims.heightIn}"H × ${shorterLength}" L`,
      tradeoff: 'Compact size, reduced attenuation',
    });
  }

  return alternatives;
}

/**
 * Main silencer sizing calculation
 */
export function calculateSilencerSize(input: SilencerSizingInput): SilencerSizingResult {
  const notes: string[] = [];
  const warnings: string[] = [];
  const targetFreq = input.targetFrequency || '500';

  // Calculate minimum free area for velocity limit
  const minFreeArea = calculateMinFreeArea(input.airflowCfm, input.maxVelocityFpm);
  notes.push(`Minimum free area for ${input.maxVelocityFpm} FPM: ${minFreeArea.toFixed(2)} sq ft`);

  // Calculate required length for attenuation
  const requiredLength = calculateRequiredLength(input.requiredAttenuationDb, targetFreq);
  notes.push(`Required length for ${input.requiredAttenuationDb} dB at ${targetFreq} Hz: ${requiredLength}" `);

  // Check space constraint
  let selectedLength = requiredLength;
  if (input.spaceConstraintLengthIn && requiredLength > input.spaceConstraintLengthIn) {
    selectedLength = findNextStandardSize(input.spaceConstraintLengthIn, STANDARD_LENGTHS.filter(l => l <= input.spaceConstraintLengthIn!));
    warnings.push(`Space constraint limits length to ${selectedLength}". May not achieve full attenuation.`);
  }

  let recommended: SilencerDimensions;

  if (input.ductType === 'round') {
    // Size round silencer
    const minDiameter = calculateRoundDiameter(minFreeArea);
    const selectedDiameter = findNextStandardSize(minDiameter, STANDARD_ROUND_DIAMETERS);
    
    // If inlet duct is specified, don't go smaller
    const finalDiameter = input.ductDiameterIn 
      ? Math.max(selectedDiameter, input.ductDiameterIn)
      : selectedDiameter;

    const actualFreeArea = Math.PI * Math.pow(finalDiameter / 24, 2);
    
    recommended = {
      type: 'round',
      diameterIn: finalDiameter,
      lengthIn: selectedLength,
      freeAreaSqFt: actualFreeArea,
    };
    
    notes.push(`Selected ${finalDiameter}" diameter round silencer`);
  } else {
    // Size rectangular silencer
    // Try to match aspect ratio of inlet duct if specified
    let width: number;
    let height: number;

    if (input.ductWidthIn && input.ductHeightIn) {
      width = input.ductWidthIn;
      height = input.ductHeightIn;
      
      // Check if this meets free area requirement
      const ductFreeArea = (width * height) / 144;
      if (ductFreeArea < minFreeArea) {
        // Need larger silencer
        const scaleFactor = Math.sqrt(minFreeArea / ductFreeArea);
        width = findNextStandardSize(width * scaleFactor, STANDARD_RECT_WIDTHS);
        height = Math.round((width / input.ductWidthIn) * input.ductHeightIn);
        notes.push('Silencer sized larger than duct to meet velocity requirement');
      }
    } else {
      // Default to square aspect ratio
      const sideLengthIn = Math.sqrt(minFreeArea * 144);
      width = findNextStandardSize(sideLengthIn, STANDARD_RECT_WIDTHS);
      height = width;
    }

    const actualFreeArea = (width * height) / 144;
    
    recommended = {
      type: 'rectangular',
      widthIn: width,
      heightIn: height,
      lengthIn: selectedLength,
      freeAreaSqFt: actualFreeArea,
    };
    
    notes.push(`Selected ${width}"W × ${height}"H rectangular silencer`);
  }

  // Evaluate performance
  const performance = evaluatePerformance(
    recommended,
    input.airflowCfm,
    input.maxVelocityFpm,
    input.maxPressureDropIn,
    input.requiredAttenuationDb,
    targetFreq
  );

  // Add performance notes
  if (!performance.meetsAttenuationRequirement) {
    warnings.push(`Achieves ${performance.expectedAttenuationDb} dB, short of ${input.requiredAttenuationDb} dB requirement`);
  }
  if (!performance.meetsPressureRequirement) {
    warnings.push(`Pressure drop ${performance.expectedPressureDropIn}" exceeds ${input.maxPressureDropIn}" limit`);
  }
  if (performance.selfNoiseNC > 35) {
    warnings.push(`Self-noise NC ${performance.selfNoiseNC} may contribute to zone noise`);
  }

  // Generate alternatives
  const alternatives = generateAlternatives(input, recommended);

  return {
    input,
    recommended,
    performance,
    alternatives,
    sizingNotes: notes,
    warnings,
  };
}

/**
 * Get insertion loss across all octave bands for a silencer
 */
export function getSilencerInsertionLoss(lengthIn: number): Record<string, number> {
  const lengthFt = lengthIn / 12;
  const result: Record<string, number> = {};
  
  for (const [freq, lossPerFt] of Object.entries(INSERTION_LOSS_PER_FT)) {
    result[freq] = Math.round(lossPerFt * lengthFt * 10) / 10;
  }
  
  return result;
}

/**
 * Recommend silencer type based on application
 */
export function recommendSilencerType(
  application: 'supply' | 'return' | 'exhaust' | 'outdoor',
  noiseCharacteristic: 'low_freq' | 'mid_freq' | 'high_freq' | 'broadband'
): { type: string; description: string } {
  const recommendations: Record<string, Record<string, { type: string; description: string }>> = {
    supply: {
      low_freq: { type: 'Reactive/Combination', description: 'Lined silencer with internal baffles for enhanced low-frequency performance' },
      mid_freq: { type: 'Dissipative', description: 'Standard acoustically lined silencer, most efficient for mid-frequencies' },
      high_freq: { type: 'Dissipative', description: 'Lined silencer with perforated facing, good high-frequency absorption' },
      broadband: { type: 'Combination', description: 'Combination reactive/dissipative for broad spectrum attenuation' },
    },
    return: {
      low_freq: { type: 'Reactive', description: 'Expansion chamber type for low-frequency rumble' },
      mid_freq: { type: 'Dissipative', description: 'Standard lined silencer' },
      high_freq: { type: 'Dissipative', description: 'Lined silencer, can be shorter due to natural high-freq roll-off' },
      broadband: { type: 'Dissipative', description: 'Standard lined return silencer' },
    },
    exhaust: {
      low_freq: { type: 'Reactive/Combination', description: 'Heavy-duty combination silencer for fan rumble' },
      mid_freq: { type: 'Dissipative', description: 'Weather-protected lined silencer' },
      high_freq: { type: 'Dissipative', description: 'Standard exhaust silencer with rain protection' },
      broadband: { type: 'Combination', description: 'Combination type with weather louvers' },
    },
    outdoor: {
      low_freq: { type: 'Reactive', description: 'Large reactive silencer for equipment yard' },
      mid_freq: { type: 'Dissipative', description: 'Outdoor-rated lined silencer' },
      high_freq: { type: 'Barrier/Enclosure', description: 'Consider acoustic barriers for high-freq equipment' },
      broadband: { type: 'Combination + Barrier', description: 'Combination silencer with acoustic barrier panels' },
    },
  };

  return recommendations[application]?.[noiseCharacteristic] || {
    type: 'Dissipative',
    description: 'Standard acoustically lined silencer',
  };
}
