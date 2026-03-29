// Equipment Sound Power Database
// Based on ASHRAE Handbook - HVAC Applications, Chapter 48

import { OctaveBandData } from './nc-reference-curves';

export interface EquipmentSoundPowerEntry {
  id: string;
  category: 'ahu' | 'chiller' | 'pump' | 'fan' | 'vav' | 'fcu' | 'cooling_tower' | 'boiler' | 'compressor';
  subcategory?: string;
  name: string;
  manufacturer?: string;
  capacityRange: {
    min: number;
    max: number;
    unit: string;
  };
  soundPowerLevels: OctaveBandData;  // Lw at rated capacity (dB re 10⁻¹² W)
  overallLw: number;                  // Overall A-weighted sound power
  correctionPerDoubling?: number;     // dB per doubling of capacity
  source: 'ASHRAE' | 'ARI' | 'Manufacturer' | 'Typical';
  notes?: string;
}

// ASHRAE-based typical sound power levels for HVAC equipment
export const EQUIPMENT_SOUND_POWER_DATABASE: EquipmentSoundPowerEntry[] = [
  // ==================== AHUs ====================
  {
    id: 'ahu-small',
    category: 'ahu',
    subcategory: 'small',
    name: 'Small AHU (1,000-5,000 CFM)',
    capacityRange: { min: 1000, max: 5000, unit: 'CFM' },
    soundPowerLevels: { '63Hz': 75, '125Hz': 73, '250Hz': 70, '500Hz': 68, '1kHz': 65, '2kHz': 61, '4kHz': 57, '8kHz': 52 },
    overallLw: 75,
    correctionPerDoubling: 3,
    source: 'ASHRAE',
    notes: 'Typical packaged unit with forward-curved fan',
  },
  {
    id: 'ahu-medium',
    category: 'ahu',
    subcategory: 'medium',
    name: 'Medium AHU (5,000-15,000 CFM)',
    capacityRange: { min: 5000, max: 15000, unit: 'CFM' },
    soundPowerLevels: { '63Hz': 82, '125Hz': 80, '250Hz': 77, '500Hz': 74, '1kHz': 71, '2kHz': 67, '4kHz': 63, '8kHz': 58 },
    overallLw: 82,
    correctionPerDoubling: 3,
    source: 'ASHRAE',
    notes: 'Built-up AHU with plenum fan',
  },
  {
    id: 'ahu-large',
    category: 'ahu',
    subcategory: 'large',
    name: 'Large AHU (15,000-50,000 CFM)',
    capacityRange: { min: 15000, max: 50000, unit: 'CFM' },
    soundPowerLevels: { '63Hz': 88, '125Hz': 86, '250Hz': 83, '500Hz': 80, '1kHz': 77, '2kHz': 73, '4kHz': 69, '8kHz': 64 },
    overallLw: 88,
    correctionPerDoubling: 3,
    source: 'ASHRAE',
    notes: 'Custom built-up unit with airfoil fan',
  },
  {
    id: 'ahu-very-large',
    category: 'ahu',
    subcategory: 'very-large',
    name: 'Very Large AHU (50,000+ CFM)',
    capacityRange: { min: 50000, max: 150000, unit: 'CFM' },
    soundPowerLevels: { '63Hz': 93, '125Hz': 91, '250Hz': 88, '500Hz': 85, '1kHz': 82, '2kHz': 78, '4kHz': 74, '8kHz': 69 },
    overallLw: 93,
    correctionPerDoubling: 3,
    source: 'ASHRAE',
  },
  
  // ==================== Chillers ====================
  {
    id: 'chiller-air-small',
    category: 'chiller',
    subcategory: 'air-cooled',
    name: 'Air-Cooled Chiller (50-150 tons)',
    capacityRange: { min: 50, max: 150, unit: 'tons' },
    soundPowerLevels: { '63Hz': 88, '125Hz': 86, '250Hz': 83, '500Hz': 82, '1kHz': 80, '2kHz': 77, '4kHz': 73, '8kHz': 68 },
    overallLw: 90,
    correctionPerDoubling: 3,
    source: 'ASHRAE',
    notes: 'Scroll compressor type',
  },
  {
    id: 'chiller-air-medium',
    category: 'chiller',
    subcategory: 'air-cooled',
    name: 'Air-Cooled Chiller (150-300 tons)',
    capacityRange: { min: 150, max: 300, unit: 'tons' },
    soundPowerLevels: { '63Hz': 92, '125Hz': 90, '250Hz': 87, '500Hz': 85, '1kHz': 83, '2kHz': 80, '4kHz': 76, '8kHz': 71 },
    overallLw: 93,
    correctionPerDoubling: 3,
    source: 'ASHRAE',
    notes: 'Screw compressor type',
  },
  {
    id: 'chiller-water-centrifugal',
    category: 'chiller',
    subcategory: 'water-cooled',
    name: 'Centrifugal Chiller (300-1000 tons)',
    capacityRange: { min: 300, max: 1000, unit: 'tons' },
    soundPowerLevels: { '63Hz': 90, '125Hz': 88, '250Hz': 85, '500Hz': 83, '1kHz': 81, '2kHz': 78, '4kHz': 74, '8kHz': 69 },
    overallLw: 91,
    correctionPerDoubling: 2,
    source: 'ASHRAE',
    notes: 'Variable speed centrifugal',
  },
  {
    id: 'chiller-water-large',
    category: 'chiller',
    subcategory: 'water-cooled',
    name: 'Large Centrifugal Chiller (1000+ tons)',
    capacityRange: { min: 1000, max: 3000, unit: 'tons' },
    soundPowerLevels: { '63Hz': 95, '125Hz': 93, '250Hz': 90, '500Hz': 87, '1kHz': 85, '2kHz': 82, '4kHz': 78, '8kHz': 73 },
    overallLw: 95,
    correctionPerDoubling: 2,
    source: 'ASHRAE',
  },
  
  // ==================== Pumps ====================
  {
    id: 'pump-inline-small',
    category: 'pump',
    subcategory: 'inline',
    name: 'Inline Pump (1-5 HP)',
    capacityRange: { min: 1, max: 5, unit: 'HP' },
    soundPowerLevels: { '63Hz': 65, '125Hz': 63, '250Hz': 60, '500Hz': 58, '1kHz': 56, '2kHz': 53, '4kHz': 49, '8kHz': 44 },
    overallLw: 67,
    correctionPerDoubling: 4,
    source: 'ASHRAE',
  },
  {
    id: 'pump-inline-medium',
    category: 'pump',
    subcategory: 'inline',
    name: 'Inline Pump (5-20 HP)',
    capacityRange: { min: 5, max: 20, unit: 'HP' },
    soundPowerLevels: { '63Hz': 72, '125Hz': 70, '250Hz': 67, '500Hz': 65, '1kHz': 63, '2kHz': 60, '4kHz': 56, '8kHz': 51 },
    overallLw: 74,
    correctionPerDoubling: 4,
    source: 'ASHRAE',
  },
  {
    id: 'pump-endsuction',
    category: 'pump',
    subcategory: 'end-suction',
    name: 'End-Suction Pump (20-75 HP)',
    capacityRange: { min: 20, max: 75, unit: 'HP' },
    soundPowerLevels: { '63Hz': 78, '125Hz': 76, '250Hz': 73, '500Hz': 71, '1kHz': 69, '2kHz': 66, '4kHz': 62, '8kHz': 57 },
    overallLw: 80,
    correctionPerDoubling: 4,
    source: 'ASHRAE',
  },
  {
    id: 'pump-splitcase',
    category: 'pump',
    subcategory: 'split-case',
    name: 'Split-Case Pump (75-200 HP)',
    capacityRange: { min: 75, max: 200, unit: 'HP' },
    soundPowerLevels: { '63Hz': 85, '125Hz': 83, '250Hz': 80, '500Hz': 78, '1kHz': 76, '2kHz': 73, '4kHz': 69, '8kHz': 64 },
    overallLw: 87,
    correctionPerDoubling: 4,
    source: 'ASHRAE',
  },
  
  // ==================== Fans ====================
  {
    id: 'fan-centrifugal-fc',
    category: 'fan',
    subcategory: 'forward-curved',
    name: 'Forward-Curved Centrifugal',
    capacityRange: { min: 500, max: 10000, unit: 'CFM' },
    soundPowerLevels: { '63Hz': 70, '125Hz': 68, '250Hz': 65, '500Hz': 63, '1kHz': 60, '2kHz': 56, '4kHz': 52, '8kHz': 47 },
    overallLw: 72,
    correctionPerDoubling: 3,
    source: 'ASHRAE',
  },
  {
    id: 'fan-centrifugal-bi',
    category: 'fan',
    subcategory: 'backward-inclined',
    name: 'Backward-Inclined Centrifugal',
    capacityRange: { min: 2000, max: 30000, unit: 'CFM' },
    soundPowerLevels: { '63Hz': 75, '125Hz': 73, '250Hz': 70, '500Hz': 67, '1kHz': 64, '2kHz': 60, '4kHz': 56, '8kHz': 51 },
    overallLw: 77,
    correctionPerDoubling: 3,
    source: 'ASHRAE',
  },
  {
    id: 'fan-axial-vaneaxial',
    category: 'fan',
    subcategory: 'vaneaxial',
    name: 'Vaneaxial Fan',
    capacityRange: { min: 5000, max: 50000, unit: 'CFM' },
    soundPowerLevels: { '63Hz': 80, '125Hz': 78, '250Hz': 75, '500Hz': 73, '1kHz': 71, '2kHz': 68, '4kHz': 64, '8kHz': 59 },
    overallLw: 82,
    correctionPerDoubling: 3,
    source: 'ASHRAE',
  },
  {
    id: 'fan-plenum',
    category: 'fan',
    subcategory: 'plenum',
    name: 'Plenum Fan (EC Motor)',
    capacityRange: { min: 1000, max: 20000, unit: 'CFM' },
    soundPowerLevels: { '63Hz': 68, '125Hz': 66, '250Hz': 63, '500Hz': 61, '1kHz': 58, '2kHz': 54, '4kHz': 50, '8kHz': 45 },
    overallLw: 70,
    correctionPerDoubling: 3,
    source: 'ASHRAE',
    notes: 'EC motor direct drive, quieter than belt-driven',
  },
  
  // ==================== VAV Boxes ====================
  {
    id: 'vav-small',
    category: 'vav',
    subcategory: 'pressure-independent',
    name: 'VAV Box (50-200 CFM)',
    capacityRange: { min: 50, max: 200, unit: 'CFM' },
    soundPowerLevels: { '63Hz': 30, '125Hz': 32, '250Hz': 35, '500Hz': 38, '1kHz': 35, '2kHz': 30, '4kHz': 25, '8kHz': 20 },
    overallLw: 42,
    correctionPerDoubling: 5,
    source: 'ASHRAE',
    notes: 'Without reheat',
  },
  {
    id: 'vav-medium',
    category: 'vav',
    subcategory: 'pressure-independent',
    name: 'VAV Box (200-500 CFM)',
    capacityRange: { min: 200, max: 500, unit: 'CFM' },
    soundPowerLevels: { '63Hz': 35, '125Hz': 38, '250Hz': 42, '500Hz': 45, '1kHz': 42, '2kHz': 37, '4kHz': 32, '8kHz': 27 },
    overallLw: 48,
    correctionPerDoubling: 5,
    source: 'ASHRAE',
  },
  {
    id: 'vav-large',
    category: 'vav',
    subcategory: 'pressure-independent',
    name: 'VAV Box (500-1500 CFM)',
    capacityRange: { min: 500, max: 1500, unit: 'CFM' },
    soundPowerLevels: { '63Hz': 42, '125Hz': 45, '250Hz': 48, '500Hz': 52, '1kHz': 48, '2kHz': 43, '4kHz': 38, '8kHz': 33 },
    overallLw: 55,
    correctionPerDoubling: 5,
    source: 'ASHRAE',
  },
  {
    id: 'vav-fan-powered',
    category: 'vav',
    subcategory: 'fan-powered',
    name: 'Fan-Powered VAV (Series)',
    capacityRange: { min: 200, max: 1500, unit: 'CFM' },
    soundPowerLevels: { '63Hz': 52, '125Hz': 55, '250Hz': 58, '500Hz': 60, '1kHz': 57, '2kHz': 52, '4kHz': 47, '8kHz': 42 },
    overallLw: 63,
    correctionPerDoubling: 4,
    source: 'ASHRAE',
    notes: 'Series fan-powered box, noisier than pressure-independent',
  },
  
  // ==================== FCUs ====================
  {
    id: 'fcu-2pipe',
    category: 'fcu',
    subcategory: '2-pipe',
    name: 'Fan Coil Unit 2-Pipe (200-600 CFM)',
    capacityRange: { min: 200, max: 600, unit: 'CFM' },
    soundPowerLevels: { '63Hz': 45, '125Hz': 48, '250Hz': 50, '500Hz': 48, '1kHz': 45, '2kHz': 40, '4kHz': 35, '8kHz': 30 },
    overallLw: 53,
    correctionPerDoubling: 4,
    source: 'ASHRAE',
    notes: 'Medium speed operation',
  },
  {
    id: 'fcu-4pipe',
    category: 'fcu',
    subcategory: '4-pipe',
    name: 'Fan Coil Unit 4-Pipe (400-1200 CFM)',
    capacityRange: { min: 400, max: 1200, unit: 'CFM' },
    soundPowerLevels: { '63Hz': 50, '125Hz': 53, '250Hz': 55, '500Hz': 53, '1kHz': 50, '2kHz': 45, '4kHz': 40, '8kHz': 35 },
    overallLw: 58,
    correctionPerDoubling: 4,
    source: 'ASHRAE',
  },
  
  // ==================== Cooling Towers ====================
  {
    id: 'cooling-tower-small',
    category: 'cooling_tower',
    subcategory: 'induced-draft',
    name: 'Induced Draft Tower (100-300 tons)',
    capacityRange: { min: 100, max: 300, unit: 'tons' },
    soundPowerLevels: { '63Hz': 95, '125Hz': 92, '250Hz': 88, '500Hz': 85, '1kHz': 82, '2kHz': 79, '4kHz': 75, '8kHz': 70 },
    overallLw: 96,
    correctionPerDoubling: 3,
    source: 'ASHRAE',
  },
  {
    id: 'cooling-tower-large',
    category: 'cooling_tower',
    subcategory: 'induced-draft',
    name: 'Induced Draft Tower (500-1500 tons)',
    capacityRange: { min: 500, max: 1500, unit: 'tons' },
    soundPowerLevels: { '63Hz': 100, '125Hz': 97, '250Hz': 93, '500Hz': 90, '1kHz': 87, '2kHz': 84, '4kHz': 80, '8kHz': 75 },
    overallLw: 101,
    correctionPerDoubling: 3,
    source: 'ASHRAE',
  },
  
  // ==================== Boilers ====================
  {
    id: 'boiler-gas-small',
    category: 'boiler',
    subcategory: 'gas-fired',
    name: 'Gas-Fired Boiler (500-2000 MBH)',
    capacityRange: { min: 500, max: 2000, unit: 'MBH' },
    soundPowerLevels: { '63Hz': 78, '125Hz': 76, '250Hz': 73, '500Hz': 70, '1kHz': 67, '2kHz': 64, '4kHz': 60, '8kHz': 55 },
    overallLw: 80,
    correctionPerDoubling: 3,
    source: 'ASHRAE',
  },
  {
    id: 'boiler-gas-large',
    category: 'boiler',
    subcategory: 'gas-fired',
    name: 'Gas-Fired Boiler (2000-6000 MBH)',
    capacityRange: { min: 2000, max: 6000, unit: 'MBH' },
    soundPowerLevels: { '63Hz': 85, '125Hz': 83, '250Hz': 80, '500Hz': 77, '1kHz': 74, '2kHz': 71, '4kHz': 67, '8kHz': 62 },
    overallLw: 87,
    correctionPerDoubling: 3,
    source: 'ASHRAE',
  },
];

/**
 * Get equipment by category
 */
export function getEquipmentByCategory(category: EquipmentSoundPowerEntry['category']): EquipmentSoundPowerEntry[] {
  return EQUIPMENT_SOUND_POWER_DATABASE.filter(e => e.category === category);
}

/**
 * Find equipment matching a capacity
 */
export function findEquipmentByCapacity(
  category: EquipmentSoundPowerEntry['category'],
  capacity: number
): EquipmentSoundPowerEntry | undefined {
  return EQUIPMENT_SOUND_POWER_DATABASE.find(e => 
    e.category === category && 
    capacity >= e.capacityRange.min && 
    capacity <= e.capacityRange.max
  );
}

/**
 * Adjust sound power levels for a specific capacity within the range
 */
export function adjustSoundPowerForCapacity(
  equipment: EquipmentSoundPowerEntry,
  actualCapacity: number
): OctaveBandData {
  const midpoint = (equipment.capacityRange.min + equipment.capacityRange.max) / 2;
  const ratio = actualCapacity / midpoint;
  
  // Use the correction per doubling if available, otherwise assume 3 dB
  const dbPerDoubling = equipment.correctionPerDoubling || 3;
  
  // Calculate correction: dB = dbPerDoubling * log2(ratio)
  const correction = dbPerDoubling * (Math.log2(ratio) || 0);
  
  const adjusted: OctaveBandData = {
    '63Hz': equipment.soundPowerLevels['63Hz'] + correction,
    '125Hz': equipment.soundPowerLevels['125Hz'] + correction,
    '250Hz': equipment.soundPowerLevels['250Hz'] + correction,
    '500Hz': equipment.soundPowerLevels['500Hz'] + correction,
    '1kHz': equipment.soundPowerLevels['1kHz'] + correction,
    '2kHz': equipment.soundPowerLevels['2kHz'] + correction,
    '4kHz': equipment.soundPowerLevels['4kHz'] + correction,
    '8kHz': equipment.soundPowerLevels['8kHz'] + correction,
  };
  
  return adjusted;
}

/**
 * Get all unique equipment categories
 */
export function getEquipmentCategories(): { value: string; label: string }[] {
  const categories: Record<string, string> = {
    ahu: 'Air Handling Units',
    chiller: 'Chillers',
    pump: 'Pumps',
    fan: 'Fans',
    vav: 'VAV Boxes',
    fcu: 'Fan Coil Units',
    cooling_tower: 'Cooling Towers',
    boiler: 'Boilers',
    compressor: 'Compressors',
  };
  
  return Object.entries(categories).map(([value, label]) => ({ value, label }));
}

/**
 * Calculate overall A-weighted sound power from octave bands
 */
export function calculateOverallLwA(levels: OctaveBandData): number {
  // A-weighting corrections for each octave band
  const aWeighting: Record<keyof OctaveBandData, number> = {
    '63Hz': -26.2,
    '125Hz': -16.1,
    '250Hz': -8.6,
    '500Hz': -3.2,
    '1kHz': 0,
    '2kHz': 1.2,
    '4kHz': 1.0,
    '8kHz': -1.1,
  };
  
  let sum = 0;
  for (const [freq, level] of Object.entries(levels) as [keyof OctaveBandData, number][]) {
    const aWeightedLevel = level + aWeighting[freq];
    sum += Math.pow(10, aWeightedLevel / 10);
  }
  
  return 10 * Math.log10(sum);
}
