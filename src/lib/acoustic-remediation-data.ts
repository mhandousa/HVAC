// Silencer and duct modification catalog for acoustic remediation

export interface SilencerModel {
  id: string;
  manufacturer: string;
  model: string;
  type: 'rectangular' | 'round';
  sizeRange: {
    minIn: number;
    maxIn: number;
  };
  lengthFt: number;
  insertionLoss: number;       // dB attenuation at 1000 Hz
  pressureDropIn: number;      // Pressure drop (in. w.g. at rated velocity)
  maxVelocityFpm: number;
  selfNoise: number;           // NC rating when operating
  estimatedCost: '$' | '$$' | '$$$';
}

export interface DuctModification {
  id: string;
  name: string;
  description: string;
  applicability: ('vav' | 'fcu' | 'all')[];
  attenuationDb: number;
  pressureDropIn: number;
  installationComplexity: 'low' | 'medium' | 'high';
  costEstimate: '$' | '$$' | '$$$';
  effectivenessPerDollar: number;
}

// Standard silencer catalog (industry-typical values)
export const SILENCER_CATALOG: SilencerModel[] = [
  // 6" Round Silencers
  { id: 'SA-R-6-1', manufacturer: 'Generic', model: '6" Round 1ft',
    type: 'round', sizeRange: { minIn: 5, maxIn: 7 }, lengthFt: 1,
    insertionLoss: 4, pressureDropIn: 0.12, maxVelocityFpm: 2000,
    selfNoise: 22, estimatedCost: '$' },
  { id: 'SA-R-6-3', manufacturer: 'Generic', model: '6" Round 3ft',
    type: 'round', sizeRange: { minIn: 5, maxIn: 7 }, lengthFt: 3,
    insertionLoss: 10, pressureDropIn: 0.22, maxVelocityFpm: 2000,
    selfNoise: 18, estimatedCost: '$$' },
  { id: 'SA-R-6-5', manufacturer: 'Generic', model: '6" Round 5ft',
    type: 'round', sizeRange: { minIn: 5, maxIn: 7 }, lengthFt: 5,
    insertionLoss: 15, pressureDropIn: 0.32, maxVelocityFpm: 2000,
    selfNoise: 15, estimatedCost: '$$$' },

  // 8" Round Silencers
  { id: 'SA-R-8-1', manufacturer: 'Generic', model: '8" Round 1ft',
    type: 'round', sizeRange: { minIn: 7, maxIn: 9 }, lengthFt: 1,
    insertionLoss: 5, pressureDropIn: 0.13, maxVelocityFpm: 2000,
    selfNoise: 23, estimatedCost: '$' },
  { id: 'SA-R-8-3', manufacturer: 'Generic', model: '8" Round 3ft',
    type: 'round', sizeRange: { minIn: 7, maxIn: 9 }, lengthFt: 3,
    insertionLoss: 11, pressureDropIn: 0.24, maxVelocityFpm: 2000,
    selfNoise: 19, estimatedCost: '$$' },
  { id: 'SA-R-8-5', manufacturer: 'Generic', model: '8" Round 5ft',
    type: 'round', sizeRange: { minIn: 7, maxIn: 9 }, lengthFt: 5,
    insertionLoss: 16, pressureDropIn: 0.34, maxVelocityFpm: 2000,
    selfNoise: 16, estimatedCost: '$$$' },

  // 10" Round Silencers
  { id: 'SA-R-10-1', manufacturer: 'Generic', model: '10" Round 1ft',
    type: 'round', sizeRange: { minIn: 9, maxIn: 11 }, lengthFt: 1,
    insertionLoss: 5, pressureDropIn: 0.14, maxVelocityFpm: 2000,
    selfNoise: 24, estimatedCost: '$' },
  { id: 'SA-R-10-3', manufacturer: 'Generic', model: '10" Round 3ft',
    type: 'round', sizeRange: { minIn: 9, maxIn: 11 }, lengthFt: 3,
    insertionLoss: 12, pressureDropIn: 0.25, maxVelocityFpm: 2000,
    selfNoise: 20, estimatedCost: '$$' },
  { id: 'SA-R-10-5', manufacturer: 'Generic', model: '10" Round 5ft',
    type: 'round', sizeRange: { minIn: 9, maxIn: 11 }, lengthFt: 5,
    insertionLoss: 17, pressureDropIn: 0.35, maxVelocityFpm: 2000,
    selfNoise: 17, estimatedCost: '$$$' },

  // 12" Round Silencers
  { id: 'SA-R-12-1', manufacturer: 'Generic', model: '12" Round 1ft',
    type: 'round', sizeRange: { minIn: 10, maxIn: 14 }, lengthFt: 1,
    insertionLoss: 5, pressureDropIn: 0.15, maxVelocityFpm: 2000,
    selfNoise: 25, estimatedCost: '$' },
  { id: 'SA-R-12-3', manufacturer: 'Generic', model: '12" Round 3ft',
    type: 'round', sizeRange: { minIn: 10, maxIn: 14 }, lengthFt: 3,
    insertionLoss: 12, pressureDropIn: 0.25, maxVelocityFpm: 2000,
    selfNoise: 20, estimatedCost: '$$' },
  { id: 'SA-R-12-5', manufacturer: 'Generic', model: '12" Round 5ft',
    type: 'round', sizeRange: { minIn: 10, maxIn: 14 }, lengthFt: 5,
    insertionLoss: 18, pressureDropIn: 0.35, maxVelocityFpm: 2000,
    selfNoise: 18, estimatedCost: '$$$' },

  // 14" Round Silencers
  { id: 'SA-R-14-1', manufacturer: 'Generic', model: '14" Round 1ft',
    type: 'round', sizeRange: { minIn: 12, maxIn: 16 }, lengthFt: 1,
    insertionLoss: 5, pressureDropIn: 0.16, maxVelocityFpm: 2000,
    selfNoise: 26, estimatedCost: '$' },
  { id: 'SA-R-14-3', manufacturer: 'Generic', model: '14" Round 3ft',
    type: 'round', sizeRange: { minIn: 12, maxIn: 16 }, lengthFt: 3,
    insertionLoss: 13, pressureDropIn: 0.26, maxVelocityFpm: 2000,
    selfNoise: 21, estimatedCost: '$$' },
  { id: 'SA-R-14-5', manufacturer: 'Generic', model: '14" Round 5ft',
    type: 'round', sizeRange: { minIn: 12, maxIn: 16 }, lengthFt: 5,
    insertionLoss: 19, pressureDropIn: 0.36, maxVelocityFpm: 2000,
    selfNoise: 19, estimatedCost: '$$$' },

  // 16" Round Silencers
  { id: 'SA-R-16-1', manufacturer: 'Generic', model: '16" Round 1ft',
    type: 'round', sizeRange: { minIn: 14, maxIn: 18 }, lengthFt: 1,
    insertionLoss: 6, pressureDropIn: 0.17, maxVelocityFpm: 2000,
    selfNoise: 27, estimatedCost: '$' },
  { id: 'SA-R-16-3', manufacturer: 'Generic', model: '16" Round 3ft',
    type: 'round', sizeRange: { minIn: 14, maxIn: 18 }, lengthFt: 3,
    insertionLoss: 14, pressureDropIn: 0.27, maxVelocityFpm: 2000,
    selfNoise: 22, estimatedCost: '$$' },
  { id: 'SA-R-16-5', manufacturer: 'Generic', model: '16" Round 5ft',
    type: 'round', sizeRange: { minIn: 14, maxIn: 18 }, lengthFt: 5,
    insertionLoss: 20, pressureDropIn: 0.37, maxVelocityFpm: 2000,
    selfNoise: 20, estimatedCost: '$$$' },

  // Rectangular Silencers (12x12)
  { id: 'SA-REC-12x12-3', manufacturer: 'Generic', model: '12x12" Rect 3ft',
    type: 'rectangular', sizeRange: { minIn: 10, maxIn: 14 }, lengthFt: 3,
    insertionLoss: 11, pressureDropIn: 0.28, maxVelocityFpm: 1800,
    selfNoise: 22, estimatedCost: '$$' },
  { id: 'SA-REC-12x12-5', manufacturer: 'Generic', model: '12x12" Rect 5ft',
    type: 'rectangular', sizeRange: { minIn: 10, maxIn: 14 }, lengthFt: 5,
    insertionLoss: 17, pressureDropIn: 0.38, maxVelocityFpm: 1800,
    selfNoise: 19, estimatedCost: '$$$' },

  // Rectangular Silencers (18x18)
  { id: 'SA-REC-18x18-3', manufacturer: 'Generic', model: '18x18" Rect 3ft',
    type: 'rectangular', sizeRange: { minIn: 16, maxIn: 20 }, lengthFt: 3,
    insertionLoss: 12, pressureDropIn: 0.30, maxVelocityFpm: 1800,
    selfNoise: 24, estimatedCost: '$$' },
  { id: 'SA-REC-18x18-5', manufacturer: 'Generic', model: '18x18" Rect 5ft',
    type: 'rectangular', sizeRange: { minIn: 16, maxIn: 20 }, lengthFt: 5,
    insertionLoss: 18, pressureDropIn: 0.40, maxVelocityFpm: 1800,
    selfNoise: 21, estimatedCost: '$$$' },

  // Rectangular Silencers (24x24)
  { id: 'SA-REC-24x24-3', manufacturer: 'Generic', model: '24x24" Rect 3ft',
    type: 'rectangular', sizeRange: { minIn: 22, maxIn: 28 }, lengthFt: 3,
    insertionLoss: 13, pressureDropIn: 0.32, maxVelocityFpm: 1800,
    selfNoise: 26, estimatedCost: '$$' },
  { id: 'SA-REC-24x24-5', manufacturer: 'Generic', model: '24x24" Rect 5ft',
    type: 'rectangular', sizeRange: { minIn: 22, maxIn: 28 }, lengthFt: 5,
    insertionLoss: 19, pressureDropIn: 0.42, maxVelocityFpm: 1800,
    selfNoise: 23, estimatedCost: '$$$' },
];

// Duct modification options
export const DUCT_MODIFICATIONS: DuctModification[] = [
  {
    id: 'lined-duct-1in',
    name: '1" Internal Duct Lining',
    description: 'Add 1" thick fiberglass duct lining for 10 linear feet upstream of terminal',
    applicability: ['vav', 'fcu', 'all'],
    attenuationDb: 4,
    pressureDropIn: 0.03,
    installationComplexity: 'low',
    costEstimate: '$',
    effectivenessPerDollar: 8,
  },
  {
    id: 'lined-duct-2in',
    name: '2" Internal Duct Lining',
    description: 'Add 2" thick fiberglass duct lining for 10 linear feet upstream of terminal',
    applicability: ['all'],
    attenuationDb: 7,
    pressureDropIn: 0.05,
    installationComplexity: 'low',
    costEstimate: '$',
    effectivenessPerDollar: 9,
  },
  {
    id: 'acoustic-flex-duct',
    name: 'Insulated Flex Duct Section',
    description: 'Install 6-8 ft acoustic flex duct between VAV and diffuser',
    applicability: ['vav'],
    attenuationDb: 6,
    pressureDropIn: 0.10,
    installationComplexity: 'low',
    costEstimate: '$',
    effectivenessPerDollar: 7,
  },
  {
    id: 'plenum-boot',
    name: 'Lined Plenum Boot',
    description: 'Install acoustically lined plenum box at diffuser connection',
    applicability: ['vav', 'fcu'],
    attenuationDb: 5,
    pressureDropIn: 0.05,
    installationComplexity: 'medium',
    costEstimate: '$$',
    effectivenessPerDollar: 5,
  },
  {
    id: 'vav-upsizing',
    name: 'Upsize VAV Inlet',
    description: 'Increase VAV inlet diameter by 2" to reduce velocity noise',
    applicability: ['vav'],
    attenuationDb: 4,
    pressureDropIn: -0.05, // Actually reduces pressure drop
    installationComplexity: 'high',
    costEstimate: '$$',
    effectivenessPerDollar: 4,
  },
  {
    id: 'nc-rated-diffuser',
    name: 'NC-Rated Diffuser',
    description: 'Replace diffuser with low-NC model (perforated or slot type)',
    applicability: ['vav'],
    attenuationDb: 3,
    pressureDropIn: 0.02,
    installationComplexity: 'low',
    costEstimate: '$',
    effectivenessPerDollar: 6,
  },
  {
    id: 'fcu-speed-reduction',
    name: 'FCU Speed Reduction',
    description: 'Operate FCU at medium or low fan speed with slight capacity derating',
    applicability: ['fcu'],
    attenuationDb: 5,
    pressureDropIn: 0.0,
    installationComplexity: 'low',
    costEstimate: '$',
    effectivenessPerDollar: 10,
  },
  {
    id: 'transfer-duct-silencer',
    name: 'Transfer Duct Silencer',
    description: 'Add cross-talk attenuator for partition transfer ducts',
    applicability: ['all'],
    attenuationDb: 8,
    pressureDropIn: 0.08,
    installationComplexity: 'medium',
    costEstimate: '$$',
    effectivenessPerDollar: 6,
  },
  {
    id: 'vibration-isolators',
    name: 'Vibration Isolators',
    description: 'Install spring or neoprene isolators under FCU or AHU',
    applicability: ['fcu'],
    attenuationDb: 3,
    pressureDropIn: 0.0,
    installationComplexity: 'medium',
    costEstimate: '$',
    effectivenessPerDollar: 5,
  },
];
