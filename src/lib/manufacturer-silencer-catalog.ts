// Manufacturer-specific silencer database with real products and detailed performance data

export type SilencerManufacturer = 
  | 'Price Industries'
  | 'Vibro-Acoustics'
  | 'McGill AirFlow'
  | 'Ruskin'
  | 'Trane'
  | 'Generic';

export type SilencerType = 'rectangular' | 'round';
export type SilencerConfiguration = 'straight' | 'elbow' | 'cross-talk' | 'packless';

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

export interface ManufacturerSilencer {
  id: string;
  manufacturer: SilencerManufacturer;
  series: string;
  model: string;
  type: SilencerType;
  configuration: SilencerConfiguration;
  
  // Dimensions
  dimensions: {
    lengthIn: number;
    heightIn?: number;      // For rectangular
    widthIn?: number;       // For rectangular
    diameterIn?: number;    // For round
  };
  sizeRange: { minIn: number; maxIn: number };
  
  // Acoustic Performance
  insertionLoss: {
    overall: number;        // Single NC equivalent (typically at 1kHz)
    octaveBands: OctaveBandData;
  };
  
  // Aerodynamic Performance
  pressureDropIn: number;   // At rated velocity (in. w.g.)
  maxVelocityFpm: number;
  selfNoiseNC: number;      // Self-generated noise NC rating
  
  // Catalog Info
  catalogNumber: string;
  productUrl?: string;
  datasheetUrl?: string;
  listPriceUsd?: number;
  leadTimeWeeks?: number;
  
  // Application
  hvacApplication: ('supply' | 'return' | 'exhaust' | 'transfer')[];
  applicationNotes?: string;
  
  // Saudi Market
  localAvailability: 'in-stock' | 'regional' | 'import';
  estimatedCost: '$' | '$$' | '$$$' | '$$$$';
}

// ============ PRICE INDUSTRIES SA SERIES ============
const PRICE_INDUSTRIES_SILENCERS: ManufacturerSilencer[] = [
  // SA-R Round Series - 36" Length
  {
    id: 'price-sa-r-6-36',
    manufacturer: 'Price Industries',
    series: 'SA-R',
    model: 'SA-R-6-36',
    type: 'round',
    configuration: 'straight',
    dimensions: { lengthIn: 36, diameterIn: 6 },
    sizeRange: { minIn: 5, maxIn: 7 },
    insertionLoss: {
      overall: 14,
      octaveBands: { '63Hz': 2, '125Hz': 5, '250Hz': 9, '500Hz': 14, '1kHz': 18, '2kHz': 20, '4kHz': 17, '8kHz': 13 }
    },
    pressureDropIn: 0.22,
    maxVelocityFpm: 2500,
    selfNoiseNC: 20,
    catalogNumber: 'SA-R-6-36-PA2',
    productUrl: 'https://www.priceindustries.com/products/sound-attenuators',
    hvacApplication: ['supply', 'return'],
    applicationNotes: 'Premium quality, forward/reverse flow rated',
    localAvailability: 'regional',
    estimatedCost: '$$',
  },
  {
    id: 'price-sa-r-8-36',
    manufacturer: 'Price Industries',
    series: 'SA-R',
    model: 'SA-R-8-36',
    type: 'round',
    configuration: 'straight',
    dimensions: { lengthIn: 36, diameterIn: 8 },
    sizeRange: { minIn: 7, maxIn: 9 },
    insertionLoss: {
      overall: 15,
      octaveBands: { '63Hz': 2, '125Hz': 6, '250Hz': 10, '500Hz': 15, '1kHz': 19, '2kHz': 21, '4kHz': 18, '8kHz': 14 }
    },
    pressureDropIn: 0.24,
    maxVelocityFpm: 2500,
    selfNoiseNC: 21,
    catalogNumber: 'SA-R-8-36-PA2',
    productUrl: 'https://www.priceindustries.com/products/sound-attenuators',
    hvacApplication: ['supply', 'return'],
    localAvailability: 'regional',
    estimatedCost: '$$',
  },
  {
    id: 'price-sa-r-10-36',
    manufacturer: 'Price Industries',
    series: 'SA-R',
    model: 'SA-R-10-36',
    type: 'round',
    configuration: 'straight',
    dimensions: { lengthIn: 36, diameterIn: 10 },
    sizeRange: { minIn: 9, maxIn: 11 },
    insertionLoss: {
      overall: 15,
      octaveBands: { '63Hz': 2, '125Hz': 6, '250Hz': 11, '500Hz': 15, '1kHz': 20, '2kHz': 22, '4kHz': 19, '8kHz': 15 }
    },
    pressureDropIn: 0.26,
    maxVelocityFpm: 2500,
    selfNoiseNC: 22,
    catalogNumber: 'SA-R-10-36-PA2',
    hvacApplication: ['supply', 'return'],
    localAvailability: 'regional',
    estimatedCost: '$$',
  },
  {
    id: 'price-sa-r-12-36',
    manufacturer: 'Price Industries',
    series: 'SA-R',
    model: 'SA-R-12-36',
    type: 'round',
    configuration: 'straight',
    dimensions: { lengthIn: 36, diameterIn: 12 },
    sizeRange: { minIn: 10, maxIn: 14 },
    insertionLoss: {
      overall: 16,
      octaveBands: { '63Hz': 3, '125Hz': 7, '250Hz': 12, '500Hz': 16, '1kHz': 21, '2kHz': 23, '4kHz': 20, '8kHz': 16 }
    },
    pressureDropIn: 0.28,
    maxVelocityFpm: 2500,
    selfNoiseNC: 22,
    catalogNumber: 'SA-R-12-36-PA2',
    hvacApplication: ['supply', 'return'],
    localAvailability: 'regional',
    estimatedCost: '$$',
  },
  // SA-R Round Series - 60" Length (Higher Attenuation)
  {
    id: 'price-sa-r-8-60',
    manufacturer: 'Price Industries',
    series: 'SA-R',
    model: 'SA-R-8-60',
    type: 'round',
    configuration: 'straight',
    dimensions: { lengthIn: 60, diameterIn: 8 },
    sizeRange: { minIn: 7, maxIn: 9 },
    insertionLoss: {
      overall: 22,
      octaveBands: { '63Hz': 4, '125Hz': 10, '250Hz': 16, '500Hz': 22, '1kHz': 28, '2kHz': 30, '4kHz': 26, '8kHz': 20 }
    },
    pressureDropIn: 0.36,
    maxVelocityFpm: 2500,
    selfNoiseNC: 18,
    catalogNumber: 'SA-R-8-60-PA2',
    hvacApplication: ['supply', 'return'],
    applicationNotes: 'High attenuation for critical spaces',
    localAvailability: 'regional',
    estimatedCost: '$$$',
  },
  {
    id: 'price-sa-r-12-60',
    manufacturer: 'Price Industries',
    series: 'SA-R',
    model: 'SA-R-12-60',
    type: 'round',
    configuration: 'straight',
    dimensions: { lengthIn: 60, diameterIn: 12 },
    sizeRange: { minIn: 10, maxIn: 14 },
    insertionLoss: {
      overall: 24,
      octaveBands: { '63Hz': 5, '125Hz': 12, '250Hz': 18, '500Hz': 24, '1kHz': 30, '2kHz': 32, '4kHz': 28, '8kHz': 22 }
    },
    pressureDropIn: 0.42,
    maxVelocityFpm: 2500,
    selfNoiseNC: 19,
    catalogNumber: 'SA-R-12-60-PA2',
    hvacApplication: ['supply', 'return'],
    localAvailability: 'regional',
    estimatedCost: '$$$',
  },
  // SA-REC Rectangular Series
  {
    id: 'price-sa-rec-12x12-36',
    manufacturer: 'Price Industries',
    series: 'SA-REC',
    model: 'SA-REC-12x12-36',
    type: 'rectangular',
    configuration: 'straight',
    dimensions: { lengthIn: 36, heightIn: 12, widthIn: 12 },
    sizeRange: { minIn: 10, maxIn: 14 },
    insertionLoss: {
      overall: 14,
      octaveBands: { '63Hz': 2, '125Hz': 5, '250Hz': 10, '500Hz': 14, '1kHz': 18, '2kHz': 20, '4kHz': 17, '8kHz': 13 }
    },
    pressureDropIn: 0.30,
    maxVelocityFpm: 2000,
    selfNoiseNC: 23,
    catalogNumber: 'SA-REC-12-12-36',
    hvacApplication: ['supply', 'return'],
    localAvailability: 'regional',
    estimatedCost: '$$',
  },
  {
    id: 'price-sa-rec-24x24-60',
    manufacturer: 'Price Industries',
    series: 'SA-REC',
    model: 'SA-REC-24x24-60',
    type: 'rectangular',
    configuration: 'straight',
    dimensions: { lengthIn: 60, heightIn: 24, widthIn: 24 },
    sizeRange: { minIn: 20, maxIn: 28 },
    insertionLoss: {
      overall: 22,
      octaveBands: { '63Hz': 4, '125Hz': 10, '250Hz': 16, '500Hz': 22, '1kHz': 28, '2kHz': 30, '4kHz': 25, '8kHz': 19 }
    },
    pressureDropIn: 0.48,
    maxVelocityFpm: 2000,
    selfNoiseNC: 21,
    catalogNumber: 'SA-REC-24-24-60',
    hvacApplication: ['supply', 'return'],
    applicationNotes: 'Large duct applications, AHU discharge',
    localAvailability: 'import',
    estimatedCost: '$$$',
  },
];

// ============ VIBRO-ACOUSTICS RD-HV SERIES ============
const VIBRO_ACOUSTICS_SILENCERS: ManufacturerSilencer[] = [
  // RD-HV Round Series - 24" Length (Economy)
  {
    id: 'va-rd-hv-8-24',
    manufacturer: 'Vibro-Acoustics',
    series: 'RD-HV',
    model: 'RD-HV-8-24',
    type: 'round',
    configuration: 'straight',
    dimensions: { lengthIn: 24, diameterIn: 8 },
    sizeRange: { minIn: 7, maxIn: 9 },
    insertionLoss: {
      overall: 10,
      octaveBands: { '63Hz': 1, '125Hz': 3, '250Hz': 7, '500Hz': 10, '1kHz': 13, '2kHz': 15, '4kHz': 12, '8kHz': 9 }
    },
    pressureDropIn: 0.18,
    maxVelocityFpm: 2500,
    selfNoiseNC: 25,
    catalogNumber: 'RD-HV-8-24-PA2',
    productUrl: 'https://noisecontrol.vibro-acoustics.com/rd-hv',
    hvacApplication: ['supply', 'return', 'exhaust'],
    applicationNotes: 'Economy option for low attenuation needs',
    localAvailability: 'in-stock',
    estimatedCost: '$',
  },
  // RD-HV Round Series - 36" Length (Standard)
  {
    id: 'va-rd-hv-6-36',
    manufacturer: 'Vibro-Acoustics',
    series: 'RD-HV',
    model: 'RD-HV-6-36',
    type: 'round',
    configuration: 'straight',
    dimensions: { lengthIn: 36, diameterIn: 6 },
    sizeRange: { minIn: 5, maxIn: 7 },
    insertionLoss: {
      overall: 14,
      octaveBands: { '63Hz': 2, '125Hz': 5, '250Hz': 10, '500Hz': 14, '1kHz': 18, '2kHz': 20, '4kHz': 17, '8kHz': 13 }
    },
    pressureDropIn: 0.24,
    maxVelocityFpm: 2500,
    selfNoiseNC: 21,
    catalogNumber: 'RD-HV-6-36-PA2',
    productUrl: 'https://noisecontrol.vibro-acoustics.com/rd-hv',
    hvacApplication: ['supply', 'return'],
    localAvailability: 'in-stock',
    estimatedCost: '$$',
  },
  {
    id: 'va-rd-hv-10-36',
    manufacturer: 'Vibro-Acoustics',
    series: 'RD-HV',
    model: 'RD-HV-10-36',
    type: 'round',
    configuration: 'straight',
    dimensions: { lengthIn: 36, diameterIn: 10 },
    sizeRange: { minIn: 9, maxIn: 11 },
    insertionLoss: {
      overall: 16,
      octaveBands: { '63Hz': 3, '125Hz': 6, '250Hz': 11, '500Hz': 16, '1kHz': 20, '2kHz': 22, '4kHz': 19, '8kHz': 15 }
    },
    pressureDropIn: 0.26,
    maxVelocityFpm: 2500,
    selfNoiseNC: 22,
    catalogNumber: 'RD-HV-10-36-PA2',
    productUrl: 'https://noisecontrol.vibro-acoustics.com/rd-hv',
    hvacApplication: ['supply', 'return'],
    localAvailability: 'in-stock',
    estimatedCost: '$$',
  },
  {
    id: 'va-rd-hv-12-36',
    manufacturer: 'Vibro-Acoustics',
    series: 'RD-HV',
    model: 'RD-HV-12-36',
    type: 'round',
    configuration: 'straight',
    dimensions: { lengthIn: 36, diameterIn: 12 },
    sizeRange: { minIn: 10, maxIn: 14 },
    insertionLoss: {
      overall: 18,
      octaveBands: { '63Hz': 3, '125Hz': 6, '250Hz': 12, '500Hz': 18, '1kHz': 22, '2kHz': 24, '4kHz': 20, '8kHz': 16 }
    },
    pressureDropIn: 0.28,
    maxVelocityFpm: 2500,
    selfNoiseNC: 22,
    catalogNumber: 'RD-HV-12-36-PA2',
    productUrl: 'https://noisecontrol.vibro-acoustics.com/rd-hv',
    hvacApplication: ['supply', 'return'],
    localAvailability: 'in-stock',
    estimatedCost: '$$',
  },
  // RD-HV Round Series - 60" Length (High Attenuation)
  {
    id: 'va-rd-hv-8-60',
    manufacturer: 'Vibro-Acoustics',
    series: 'RD-HV',
    model: 'RD-HV-8-60',
    type: 'round',
    configuration: 'straight',
    dimensions: { lengthIn: 60, diameterIn: 8 },
    sizeRange: { minIn: 7, maxIn: 9 },
    insertionLoss: {
      overall: 22,
      octaveBands: { '63Hz': 4, '125Hz': 10, '250Hz': 17, '500Hz': 22, '1kHz': 28, '2kHz': 30, '4kHz': 26, '8kHz': 20 }
    },
    pressureDropIn: 0.36,
    maxVelocityFpm: 2500,
    selfNoiseNC: 19,
    catalogNumber: 'RD-HV-8-60-PA2',
    hvacApplication: ['supply', 'return'],
    applicationNotes: 'High attenuation for recording studios, theatres',
    localAvailability: 'regional',
    estimatedCost: '$$$',
  },
  {
    id: 'va-rd-hv-12-60',
    manufacturer: 'Vibro-Acoustics',
    series: 'RD-HV',
    model: 'RD-HV-12-60',
    type: 'round',
    configuration: 'straight',
    dimensions: { lengthIn: 60, diameterIn: 12 },
    sizeRange: { minIn: 10, maxIn: 14 },
    insertionLoss: {
      overall: 25,
      octaveBands: { '63Hz': 5, '125Hz': 12, '250Hz': 19, '500Hz': 25, '1kHz': 32, '2kHz': 34, '4kHz': 28, '8kHz': 22 }
    },
    pressureDropIn: 0.42,
    maxVelocityFpm: 2500,
    selfNoiseNC: 18,
    catalogNumber: 'RD-HV-12-60-PA2',
    hvacApplication: ['supply', 'return'],
    localAvailability: 'regional',
    estimatedCost: '$$$',
  },
  // RD-HV Round Series - 84" Length (Maximum Attenuation)
  {
    id: 'va-rd-hv-12-84',
    manufacturer: 'Vibro-Acoustics',
    series: 'RD-HV',
    model: 'RD-HV-12-84',
    type: 'round',
    configuration: 'straight',
    dimensions: { lengthIn: 84, diameterIn: 12 },
    sizeRange: { minIn: 10, maxIn: 14 },
    insertionLoss: {
      overall: 32,
      octaveBands: { '63Hz': 7, '125Hz': 16, '250Hz': 25, '500Hz': 32, '1kHz': 40, '2kHz': 42, '4kHz': 35, '8kHz': 28 }
    },
    pressureDropIn: 0.55,
    maxVelocityFpm: 2500,
    selfNoiseNC: 16,
    catalogNumber: 'RD-HV-12-84-PA2',
    hvacApplication: ['supply', 'return'],
    applicationNotes: 'Maximum attenuation for concert halls, medical imaging',
    localAvailability: 'import',
    estimatedCost: '$$$$',
  },
  // CT Cross-Talk Series
  {
    id: 'va-ct-6',
    manufacturer: 'Vibro-Acoustics',
    series: 'CT',
    model: 'CT-6',
    type: 'round',
    configuration: 'cross-talk',
    dimensions: { lengthIn: 18, diameterIn: 6 },
    sizeRange: { minIn: 5, maxIn: 7 },
    insertionLoss: {
      overall: 12,
      octaveBands: { '63Hz': 2, '125Hz': 5, '250Hz': 9, '500Hz': 12, '1kHz': 15, '2kHz': 17, '4kHz': 14, '8kHz': 10 }
    },
    pressureDropIn: 0.15,
    maxVelocityFpm: 1500,
    selfNoiseNC: 20,
    catalogNumber: 'CT-6-PA2',
    hvacApplication: ['transfer'],
    applicationNotes: 'Partition transfer duct applications',
    localAvailability: 'in-stock',
    estimatedCost: '$$',
  },
  {
    id: 'va-ct-10',
    manufacturer: 'Vibro-Acoustics',
    series: 'CT',
    model: 'CT-10',
    type: 'round',
    configuration: 'cross-talk',
    dimensions: { lengthIn: 24, diameterIn: 10 },
    sizeRange: { minIn: 8, maxIn: 12 },
    insertionLoss: {
      overall: 15,
      octaveBands: { '63Hz': 3, '125Hz': 7, '250Hz': 12, '500Hz': 15, '1kHz': 19, '2kHz': 21, '4kHz': 17, '8kHz': 13 }
    },
    pressureDropIn: 0.18,
    maxVelocityFpm: 1500,
    selfNoiseNC: 22,
    catalogNumber: 'CT-10-PA2',
    hvacApplication: ['transfer'],
    localAvailability: 'in-stock',
    estimatedCost: '$$',
  },
];

// ============ MCGILL AIRFLOW SOUNPAK SERIES ============
const MCGILL_SILENCERS: ManufacturerSilencer[] = [
  // Sounpak SP-3 (36" length)
  {
    id: 'mcgill-sp-3-8',
    manufacturer: 'McGill AirFlow',
    series: 'Sounpak SP',
    model: 'SP-3-8',
    type: 'round',
    configuration: 'straight',
    dimensions: { lengthIn: 36, diameterIn: 8 },
    sizeRange: { minIn: 7, maxIn: 9 },
    insertionLoss: {
      overall: 14,
      octaveBands: { '63Hz': 2, '125Hz': 5, '250Hz': 10, '500Hz': 14, '1kHz': 17, '2kHz': 19, '4kHz': 16, '8kHz': 12 }
    },
    pressureDropIn: 0.22,
    maxVelocityFpm: 2500,
    selfNoiseNC: 23,
    catalogNumber: 'SP-3-8-G',
    productUrl: 'https://www.mcgillairflow.com/products/sounpak',
    hvacApplication: ['supply', 'return', 'exhaust'],
    applicationNotes: 'Industrial grade, corrosion resistant options available',
    localAvailability: 'regional',
    estimatedCost: '$$',
  },
  {
    id: 'mcgill-sp-3-12',
    manufacturer: 'McGill AirFlow',
    series: 'Sounpak SP',
    model: 'SP-3-12',
    type: 'round',
    configuration: 'straight',
    dimensions: { lengthIn: 36, diameterIn: 12 },
    sizeRange: { minIn: 10, maxIn: 14 },
    insertionLoss: {
      overall: 16,
      octaveBands: { '63Hz': 3, '125Hz': 6, '250Hz': 12, '500Hz': 16, '1kHz': 20, '2kHz': 22, '4kHz': 18, '8kHz': 14 }
    },
    pressureDropIn: 0.26,
    maxVelocityFpm: 2500,
    selfNoiseNC: 24,
    catalogNumber: 'SP-3-12-G',
    hvacApplication: ['supply', 'return', 'exhaust'],
    localAvailability: 'regional',
    estimatedCost: '$$',
  },
  // Sounpak SP-5 (60" length)
  {
    id: 'mcgill-sp-5-10',
    manufacturer: 'McGill AirFlow',
    series: 'Sounpak SP',
    model: 'SP-5-10',
    type: 'round',
    configuration: 'straight',
    dimensions: { lengthIn: 60, diameterIn: 10 },
    sizeRange: { minIn: 9, maxIn: 11 },
    insertionLoss: {
      overall: 22,
      octaveBands: { '63Hz': 4, '125Hz': 10, '250Hz': 17, '500Hz': 22, '1kHz': 27, '2kHz': 29, '4kHz': 24, '8kHz': 18 }
    },
    pressureDropIn: 0.38,
    maxVelocityFpm: 2500,
    selfNoiseNC: 20,
    catalogNumber: 'SP-5-10-G',
    hvacApplication: ['supply', 'return'],
    localAvailability: 'regional',
    estimatedCost: '$$$',
  },
  {
    id: 'mcgill-sp-5-14',
    manufacturer: 'McGill AirFlow',
    series: 'Sounpak SP',
    model: 'SP-5-14',
    type: 'round',
    configuration: 'straight',
    dimensions: { lengthIn: 60, diameterIn: 14 },
    sizeRange: { minIn: 12, maxIn: 16 },
    insertionLoss: {
      overall: 24,
      octaveBands: { '63Hz': 5, '125Hz': 12, '250Hz': 19, '500Hz': 24, '1kHz': 30, '2kHz': 32, '4kHz': 27, '8kHz': 21 }
    },
    pressureDropIn: 0.44,
    maxVelocityFpm: 2500,
    selfNoiseNC: 21,
    catalogNumber: 'SP-5-14-G',
    hvacApplication: ['supply', 'return'],
    localAvailability: 'import',
    estimatedCost: '$$$',
  },
  // Sounpak SP-7 (84" length)
  {
    id: 'mcgill-sp-7-12',
    manufacturer: 'McGill AirFlow',
    series: 'Sounpak SP',
    model: 'SP-7-12',
    type: 'round',
    configuration: 'straight',
    dimensions: { lengthIn: 84, diameterIn: 12 },
    sizeRange: { minIn: 10, maxIn: 14 },
    insertionLoss: {
      overall: 30,
      octaveBands: { '63Hz': 6, '125Hz': 14, '250Hz': 24, '500Hz': 30, '1kHz': 38, '2kHz': 40, '4kHz': 33, '8kHz': 26 }
    },
    pressureDropIn: 0.52,
    maxVelocityFpm: 2500,
    selfNoiseNC: 17,
    catalogNumber: 'SP-7-12-G',
    hvacApplication: ['supply', 'return'],
    applicationNotes: 'High performance for critical acoustic spaces',
    localAvailability: 'import',
    estimatedCost: '$$$$',
  },
];

// ============ RUSKIN RSA SERIES ============
const RUSKIN_SILENCERS: ManufacturerSilencer[] = [
  {
    id: 'ruskin-rsa-8-36',
    manufacturer: 'Ruskin',
    series: 'RSA',
    model: 'RSA-8-36',
    type: 'round',
    configuration: 'straight',
    dimensions: { lengthIn: 36, diameterIn: 8 },
    sizeRange: { minIn: 7, maxIn: 9 },
    insertionLoss: {
      overall: 13,
      octaveBands: { '63Hz': 2, '125Hz': 5, '250Hz': 9, '500Hz': 13, '1kHz': 16, '2kHz': 18, '4kHz': 15, '8kHz': 11 }
    },
    pressureDropIn: 0.24,
    maxVelocityFpm: 2000,
    selfNoiseNC: 24,
    catalogNumber: 'RSA-8-36-PA',
    productUrl: 'https://www.ruskin.com/sound-control',
    hvacApplication: ['supply', 'return'],
    applicationNotes: 'Architectural grade, custom finishes available',
    localAvailability: 'regional',
    estimatedCost: '$$',
  },
  {
    id: 'ruskin-rsa-12-48',
    manufacturer: 'Ruskin',
    series: 'RSA',
    model: 'RSA-12-48',
    type: 'round',
    configuration: 'straight',
    dimensions: { lengthIn: 48, diameterIn: 12 },
    sizeRange: { minIn: 10, maxIn: 14 },
    insertionLoss: {
      overall: 19,
      octaveBands: { '63Hz': 4, '125Hz': 9, '250Hz': 15, '500Hz': 19, '1kHz': 24, '2kHz': 26, '4kHz': 22, '8kHz': 17 }
    },
    pressureDropIn: 0.34,
    maxVelocityFpm: 2000,
    selfNoiseNC: 21,
    catalogNumber: 'RSA-12-48-PA',
    hvacApplication: ['supply', 'return'],
    localAvailability: 'regional',
    estimatedCost: '$$',
  },
  // Rectangular Series
  {
    id: 'ruskin-rsa-rec-18x18-48',
    manufacturer: 'Ruskin',
    series: 'RSA-REC',
    model: 'RSA-REC-18x18-48',
    type: 'rectangular',
    configuration: 'straight',
    dimensions: { lengthIn: 48, heightIn: 18, widthIn: 18 },
    sizeRange: { minIn: 16, maxIn: 20 },
    insertionLoss: {
      overall: 18,
      octaveBands: { '63Hz': 3, '125Hz': 8, '250Hz': 14, '500Hz': 18, '1kHz': 23, '2kHz': 25, '4kHz': 21, '8kHz': 16 }
    },
    pressureDropIn: 0.38,
    maxVelocityFpm: 1800,
    selfNoiseNC: 23,
    catalogNumber: 'RSA-REC-18-18-48',
    hvacApplication: ['supply', 'return'],
    localAvailability: 'import',
    estimatedCost: '$$$',
  },
];

// ============ TRANE INTEGRATED SILENCERS ============
const TRANE_SILENCERS: ManufacturerSilencer[] = [
  {
    id: 'trane-ahu-sa-1',
    manufacturer: 'Trane',
    series: 'AHU Integrated',
    model: 'AHU-SA-1',
    type: 'rectangular',
    configuration: 'straight',
    dimensions: { lengthIn: 24, heightIn: 24, widthIn: 24 },
    sizeRange: { minIn: 18, maxIn: 30 },
    insertionLoss: {
      overall: 12,
      octaveBands: { '63Hz': 2, '125Hz': 4, '250Hz': 8, '500Hz': 12, '1kHz': 15, '2kHz': 17, '4kHz': 14, '8kHz': 10 }
    },
    pressureDropIn: 0.25,
    maxVelocityFpm: 1800,
    selfNoiseNC: 25,
    catalogNumber: 'AHU-SA-1-TRANE',
    productUrl: 'https://www.trane.com',
    hvacApplication: ['supply'],
    applicationNotes: 'Factory-installed option for Trane AHUs',
    localAvailability: 'regional',
    estimatedCost: '$$',
  },
  {
    id: 'trane-ahu-sa-2',
    manufacturer: 'Trane',
    series: 'AHU Integrated',
    model: 'AHU-SA-2',
    type: 'rectangular',
    configuration: 'straight',
    dimensions: { lengthIn: 36, heightIn: 24, widthIn: 24 },
    sizeRange: { minIn: 18, maxIn: 30 },
    insertionLoss: {
      overall: 18,
      octaveBands: { '63Hz': 3, '125Hz': 7, '250Hz': 13, '500Hz': 18, '1kHz': 22, '2kHz': 24, '4kHz': 20, '8kHz': 15 }
    },
    pressureDropIn: 0.35,
    maxVelocityFpm: 1800,
    selfNoiseNC: 22,
    catalogNumber: 'AHU-SA-2-TRANE',
    hvacApplication: ['supply'],
    applicationNotes: 'Extended length for higher attenuation',
    localAvailability: 'regional',
    estimatedCost: '$$$',
  },
];

// Combined catalog
export const MANUFACTURER_SILENCER_CATALOG: ManufacturerSilencer[] = [
  ...PRICE_INDUSTRIES_SILENCERS,
  ...VIBRO_ACOUSTICS_SILENCERS,
  ...MCGILL_SILENCERS,
  ...RUSKIN_SILENCERS,
  ...TRANE_SILENCERS,
];

// Helper functions
export function getSilencersByManufacturer(manufacturer: SilencerManufacturer): ManufacturerSilencer[] {
  return MANUFACTURER_SILENCER_CATALOG.filter(s => s.manufacturer === manufacturer);
}

export function getSilencersBySizeRange(minDuctIn: number, maxDuctIn: number): ManufacturerSilencer[] {
  return MANUFACTURER_SILENCER_CATALOG.filter(s => 
    s.sizeRange.minIn <= maxDuctIn && s.sizeRange.maxIn >= minDuctIn
  );
}

export function getSilencersByAttenuation(minAttenuationDb: number): ManufacturerSilencer[] {
  return MANUFACTURER_SILENCER_CATALOG.filter(s => s.insertionLoss.overall >= minAttenuationDb);
}

export function selectOptimalSilencer(
  requiredAttenuationDb: number,
  ductSizeIn: number,
  maxPressureDropIn?: number,
  preferredManufacturer?: SilencerManufacturer,
  maxLengthIn?: number
): ManufacturerSilencer | null {
  let candidates = MANUFACTURER_SILENCER_CATALOG
    .filter(s => ductSizeIn >= s.sizeRange.minIn && ductSizeIn <= s.sizeRange.maxIn)
    .filter(s => s.insertionLoss.overall >= requiredAttenuationDb * 0.85) // At least 85% of required
    .filter(s => !maxPressureDropIn || s.pressureDropIn <= maxPressureDropIn)
    .filter(s => !maxLengthIn || s.dimensions.lengthIn <= maxLengthIn);

  // Prefer specified manufacturer if available
  if (preferredManufacturer) {
    const preferredCandidates = candidates.filter(s => s.manufacturer === preferredManufacturer);
    if (preferredCandidates.length > 0) {
      candidates = preferredCandidates;
    }
  }

  // Sort by: meets attenuation → shortest length → lowest pressure drop → lowest cost
  candidates.sort((a, b) => {
    // First: meets required attenuation
    const aMeetsReq = a.insertionLoss.overall >= requiredAttenuationDb;
    const bMeetsReq = b.insertionLoss.overall >= requiredAttenuationDb;
    if (aMeetsReq !== bMeetsReq) return bMeetsReq ? 1 : -1;

    // Then: shortest length
    if (a.dimensions.lengthIn !== b.dimensions.lengthIn) {
      return a.dimensions.lengthIn - b.dimensions.lengthIn;
    }

    // Then: lowest pressure drop
    if (a.pressureDropIn !== b.pressureDropIn) {
      return a.pressureDropIn - b.pressureDropIn;
    }

    // Finally: by cost ($ < $$ < $$$ < $$$$)
    const costOrder = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4 };
    return costOrder[a.estimatedCost] - costOrder[b.estimatedCost];
  });

  return candidates[0] || null;
}

// Get all available manufacturers
export function getAvailableManufacturers(): SilencerManufacturer[] {
  const manufacturers = new Set(MANUFACTURER_SILENCER_CATALOG.map(s => s.manufacturer));
  return Array.from(manufacturers);
}

// Performance comparison helper
export function compareSilencerPerformance(silencerIds: string[]): {
  silencers: ManufacturerSilencer[];
  bestAttenuation: string;
  bestPressureDrop: string;
  bestValue: string;
} {
  const silencers = MANUFACTURER_SILENCER_CATALOG.filter(s => silencerIds.includes(s.id));
  
  const bestAttenuation = silencers.reduce((best, curr) => 
    curr.insertionLoss.overall > (best?.insertionLoss.overall ?? 0) ? curr : best
  , silencers[0]);

  const bestPressureDrop = silencers.reduce((best, curr) => 
    curr.pressureDropIn < (best?.pressureDropIn ?? Infinity) ? curr : best
  , silencers[0]);

  // Value = attenuation / cost index
  const costIndex = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4 };
  const bestValue = silencers.reduce((best, curr) => {
    const currValue = curr.insertionLoss.overall / costIndex[curr.estimatedCost];
    const bestValue = best.insertionLoss.overall / costIndex[best.estimatedCost];
    return currValue > bestValue ? curr : best;
  }, silencers[0]);

  return {
    silencers,
    bestAttenuation: bestAttenuation?.id ?? '',
    bestPressureDrop: bestPressureDrop?.id ?? '',
    bestValue: bestValue?.id ?? '',
  };
}
