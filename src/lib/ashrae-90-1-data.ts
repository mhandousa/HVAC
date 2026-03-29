// ASHRAE 90.1-2022 Energy Code Compliance Data for Saudi Arabia

export interface EfficiencyRequirement {
  equipmentType: string;
  category: 'chiller' | 'package_unit' | 'split_system' | 'vrf' | 'fan' | 'pump';
  subcategory?: string;
  minCapacity?: number;
  maxCapacity?: number;
  capacityUnit: 'tons' | 'kBtu/h' | 'kW';
  coolingType?: 'air-cooled' | 'water-cooled';
  compressorType?: 'centrifugal' | 'screw' | 'scroll' | 'reciprocating';
  requirements: {
    metric: 'cop' | 'eer' | 'seer' | 'iplv' | 'ieer' | 'kw_per_ton';
    minValue: number;
    path: 'prescriptive' | 'performance';
    notes?: string;
  }[];
}

export interface ClimateZone {
  id: string;
  name: string;
  description: string;
  type: 'hot_humid' | 'hot_dry' | 'moderate';
  ashraeZone: string;
  coolingDegreeDays: number;
  heatingDegreeDays: number;
}

export interface SaudiCity {
  id: string;
  nameEn: string;
  nameAr: string;
  climateZoneId: string;
  latitude: number;
  longitude: number;
}

export interface EconomizerRequirement {
  climateZone: string;
  required: boolean;
  minCapacityBtuh: number;
  controlType: 'dry_bulb' | 'enthalpy' | 'differential_enthalpy';
  dryBulbSwitchpointF?: number;
  enthalpySwitchpointBtuLb?: number;
  notes?: string;
}

export interface FanPowerLimit {
  systemType: 'vav' | 'cav' | 'doas';
  maxBhpPer1000Cfm: number;
  pressureDropCredits?: {
    component: string;
    creditBhpPer1000Cfm: number;
  }[];
}

export interface PumpPowerLimit {
  systemType: 'chw' | 'hw' | 'cw';
  flowType: 'variable' | 'constant';
  maxWPerGpm: number;
}

// ASHRAE Climate Zones for Saudi Arabia
export const SAUDI_CLIMATE_ZONES: ClimateZone[] = [
  {
    id: 'zone_0a',
    name: 'Zone 0A - Extremely Hot Humid',
    description: 'Coastal areas with high humidity',
    type: 'hot_humid',
    ashraeZone: '0A',
    coolingDegreeDays: 6500,
    heatingDegreeDays: 0,
  },
  {
    id: 'zone_0b',
    name: 'Zone 0B - Extremely Hot Dry',
    description: 'Desert interior with extreme heat',
    type: 'hot_dry',
    ashraeZone: '0B',
    coolingDegreeDays: 6000,
    heatingDegreeDays: 100,
  },
  {
    id: 'zone_1a',
    name: 'Zone 1A - Very Hot Humid',
    description: 'Coastal regions',
    type: 'hot_humid',
    ashraeZone: '1A',
    coolingDegreeDays: 5500,
    heatingDegreeDays: 0,
  },
  {
    id: 'zone_1b',
    name: 'Zone 1B - Very Hot Dry',
    description: 'Interior desert regions',
    type: 'hot_dry',
    ashraeZone: '1B',
    coolingDegreeDays: 5000,
    heatingDegreeDays: 200,
  },
  {
    id: 'zone_2b',
    name: 'Zone 2B - Hot Dry',
    description: 'Highland areas',
    type: 'moderate',
    ashraeZone: '2B',
    coolingDegreeDays: 3500,
    heatingDegreeDays: 800,
  },
];

// Saudi Arabian Cities with Climate Zone Mapping
export const SAUDI_CITIES: SaudiCity[] = [
  { id: 'riyadh', nameEn: 'Riyadh', nameAr: 'الرياض', climateZoneId: 'zone_0b', latitude: 24.7136, longitude: 46.6753 },
  { id: 'jeddah', nameEn: 'Jeddah', nameAr: 'جدة', climateZoneId: 'zone_1a', latitude: 21.4858, longitude: 39.1925 },
  { id: 'dammam', nameEn: 'Dammam', nameAr: 'الدمام', climateZoneId: 'zone_0a', latitude: 26.4207, longitude: 50.0888 },
  { id: 'makkah', nameEn: 'Makkah', nameAr: 'مكة المكرمة', climateZoneId: 'zone_1b', latitude: 21.3891, longitude: 39.8579 },
  { id: 'madinah', nameEn: 'Madinah', nameAr: 'المدينة المنورة', climateZoneId: 'zone_1b', latitude: 24.5247, longitude: 39.5692 },
  { id: 'khobar', nameEn: 'Khobar', nameAr: 'الخبر', climateZoneId: 'zone_0a', latitude: 26.2172, longitude: 50.1971 },
  { id: 'dhahran', nameEn: 'Dhahran', nameAr: 'الظهران', climateZoneId: 'zone_0a', latitude: 26.2361, longitude: 50.0393 },
  { id: 'jubail', nameEn: 'Jubail', nameAr: 'الجبيل', climateZoneId: 'zone_0a', latitude: 27.0046, longitude: 49.6225 },
  { id: 'yanbu', nameEn: 'Yanbu', nameAr: 'ينبع', climateZoneId: 'zone_1a', latitude: 24.0895, longitude: 38.0618 },
  { id: 'tabuk', nameEn: 'Tabuk', nameAr: 'تبوك', climateZoneId: 'zone_2b', latitude: 28.3838, longitude: 36.5550 },
  { id: 'abha', nameEn: 'Abha', nameAr: 'أبها', climateZoneId: 'zone_2b', latitude: 18.2164, longitude: 42.5053 },
  { id: 'taif', nameEn: 'Taif', nameAr: 'الطائف', climateZoneId: 'zone_2b', latitude: 21.2703, longitude: 40.4158 },
  { id: 'hofuf', nameEn: 'Hofuf', nameAr: 'الهفوف', climateZoneId: 'zone_0b', latitude: 25.3648, longitude: 49.5855 },
  { id: 'buraidah', nameEn: 'Buraidah', nameAr: 'بريدة', climateZoneId: 'zone_1b', latitude: 26.3260, longitude: 43.9750 },
  { id: 'hail', nameEn: 'Hail', nameAr: 'حائل', climateZoneId: 'zone_1b', latitude: 27.5114, longitude: 41.7208 },
];

// ASHRAE 90.1-2022 Minimum Efficiency Requirements
export const EFFICIENCY_REQUIREMENTS: EfficiencyRequirement[] = [
  // Air-Cooled Chillers
  {
    equipmentType: 'Air-Cooled Chiller',
    category: 'chiller',
    subcategory: 'air-cooled',
    maxCapacity: 150,
    capacityUnit: 'tons',
    coolingType: 'air-cooled',
    requirements: [
      { metric: 'cop', minValue: 2.80, path: 'prescriptive' },
      { metric: 'iplv', minValue: 12.5, path: 'performance' },
    ],
  },
  {
    equipmentType: 'Air-Cooled Chiller',
    category: 'chiller',
    subcategory: 'air-cooled',
    minCapacity: 150,
    capacityUnit: 'tons',
    coolingType: 'air-cooled',
    requirements: [
      { metric: 'cop', minValue: 2.96, path: 'prescriptive' },
      { metric: 'iplv', minValue: 13.5, path: 'performance' },
    ],
  },
  // Water-Cooled Centrifugal Chillers
  {
    equipmentType: 'Water-Cooled Centrifugal Chiller',
    category: 'chiller',
    subcategory: 'water-cooled',
    maxCapacity: 150,
    capacityUnit: 'tons',
    coolingType: 'water-cooled',
    compressorType: 'centrifugal',
    requirements: [
      { metric: 'cop', minValue: 5.80, path: 'prescriptive' },
      { metric: 'iplv', minValue: 19.5, path: 'performance' },
    ],
  },
  {
    equipmentType: 'Water-Cooled Centrifugal Chiller',
    category: 'chiller',
    subcategory: 'water-cooled',
    minCapacity: 150,
    maxCapacity: 300,
    capacityUnit: 'tons',
    coolingType: 'water-cooled',
    compressorType: 'centrifugal',
    requirements: [
      { metric: 'cop', minValue: 6.10, path: 'prescriptive' },
      { metric: 'iplv', minValue: 20.5, path: 'performance' },
    ],
  },
  {
    equipmentType: 'Water-Cooled Centrifugal Chiller',
    category: 'chiller',
    subcategory: 'water-cooled',
    minCapacity: 300,
    capacityUnit: 'tons',
    coolingType: 'water-cooled',
    compressorType: 'centrifugal',
    requirements: [
      { metric: 'cop', minValue: 6.40, path: 'prescriptive' },
      { metric: 'iplv', minValue: 21.5, path: 'performance' },
    ],
  },
  // Water-Cooled Screw Chillers
  {
    equipmentType: 'Water-Cooled Screw Chiller',
    category: 'chiller',
    subcategory: 'water-cooled',
    maxCapacity: 150,
    capacityUnit: 'tons',
    coolingType: 'water-cooled',
    compressorType: 'screw',
    requirements: [
      { metric: 'cop', minValue: 5.20, path: 'prescriptive' },
      { metric: 'iplv', minValue: 17.5, path: 'performance' },
    ],
  },
  {
    equipmentType: 'Water-Cooled Screw Chiller',
    category: 'chiller',
    subcategory: 'water-cooled',
    minCapacity: 150,
    capacityUnit: 'tons',
    coolingType: 'water-cooled',
    compressorType: 'screw',
    requirements: [
      { metric: 'cop', minValue: 5.50, path: 'prescriptive' },
      { metric: 'iplv', minValue: 18.5, path: 'performance' },
    ],
  },
  // Package Rooftop Units
  {
    equipmentType: 'Package Rooftop Unit',
    category: 'package_unit',
    maxCapacity: 65,
    capacityUnit: 'kBtu/h',
    requirements: [
      { metric: 'seer', minValue: 14.0, path: 'prescriptive' },
    ],
  },
  {
    equipmentType: 'Package Rooftop Unit',
    category: 'package_unit',
    minCapacity: 65,
    maxCapacity: 135,
    capacityUnit: 'kBtu/h',
    requirements: [
      { metric: 'eer', minValue: 11.0, path: 'prescriptive' },
      { metric: 'ieer', minValue: 13.0, path: 'performance' },
    ],
  },
  {
    equipmentType: 'Package Rooftop Unit',
    category: 'package_unit',
    minCapacity: 135,
    maxCapacity: 240,
    capacityUnit: 'kBtu/h',
    requirements: [
      { metric: 'eer', minValue: 10.6, path: 'prescriptive' },
      { metric: 'ieer', minValue: 12.6, path: 'performance' },
    ],
  },
  {
    equipmentType: 'Package Rooftop Unit',
    category: 'package_unit',
    minCapacity: 240,
    maxCapacity: 760,
    capacityUnit: 'kBtu/h',
    requirements: [
      { metric: 'eer', minValue: 10.0, path: 'prescriptive' },
      { metric: 'ieer', minValue: 12.0, path: 'performance' },
    ],
  },
  {
    equipmentType: 'Package Rooftop Unit',
    category: 'package_unit',
    minCapacity: 760,
    capacityUnit: 'kBtu/h',
    requirements: [
      { metric: 'eer', minValue: 9.5, path: 'prescriptive' },
      { metric: 'ieer', minValue: 11.5, path: 'performance' },
    ],
  },
  // Split Systems
  {
    equipmentType: 'Split System',
    category: 'split_system',
    maxCapacity: 65,
    capacityUnit: 'kBtu/h',
    requirements: [
      { metric: 'seer', minValue: 15.0, path: 'prescriptive' },
    ],
  },
  {
    equipmentType: 'Split System',
    category: 'split_system',
    minCapacity: 65,
    maxCapacity: 135,
    capacityUnit: 'kBtu/h',
    requirements: [
      { metric: 'eer', minValue: 11.5, path: 'prescriptive' },
      { metric: 'ieer', minValue: 13.5, path: 'performance' },
    ],
  },
  {
    equipmentType: 'Split System',
    category: 'split_system',
    minCapacity: 135,
    capacityUnit: 'kBtu/h',
    requirements: [
      { metric: 'eer', minValue: 10.5, path: 'prescriptive' },
      { metric: 'ieer', minValue: 12.5, path: 'performance' },
    ],
  },
  // VRF Systems
  {
    equipmentType: 'VRF System',
    category: 'vrf',
    maxCapacity: 65,
    capacityUnit: 'kBtu/h',
    requirements: [
      { metric: 'eer', minValue: 11.2, path: 'prescriptive' },
      { metric: 'ieer', minValue: 15.5, path: 'performance' },
    ],
  },
  {
    equipmentType: 'VRF System',
    category: 'vrf',
    minCapacity: 65,
    maxCapacity: 135,
    capacityUnit: 'kBtu/h',
    requirements: [
      { metric: 'eer', minValue: 10.8, path: 'prescriptive' },
      { metric: 'ieer', minValue: 14.8, path: 'performance' },
    ],
  },
  {
    equipmentType: 'VRF System',
    category: 'vrf',
    minCapacity: 135,
    capacityUnit: 'kBtu/h',
    requirements: [
      { metric: 'eer', minValue: 10.5, path: 'prescriptive' },
      { metric: 'ieer', minValue: 14.0, path: 'performance' },
    ],
  },
];

// Economizer Requirements by Climate Zone
export const ECONOMIZER_REQUIREMENTS: EconomizerRequirement[] = [
  {
    climateZone: '0A',
    required: false,
    minCapacityBtuh: 0,
    controlType: 'dry_bulb',
    notes: 'No economizer required for hot-humid climate zones',
  },
  {
    climateZone: '1A',
    required: false,
    minCapacityBtuh: 0,
    controlType: 'dry_bulb',
    notes: 'No economizer required for hot-humid climate zones',
  },
  {
    climateZone: '0B',
    required: true,
    minCapacityBtuh: 54000,
    controlType: 'dry_bulb',
    dryBulbSwitchpointF: 75,
    notes: 'Economizer required for cooling capacity ≥54,000 Btu/h',
  },
  {
    climateZone: '1B',
    required: true,
    minCapacityBtuh: 54000,
    controlType: 'dry_bulb',
    dryBulbSwitchpointF: 75,
    notes: 'Economizer required for cooling capacity ≥54,000 Btu/h',
  },
  {
    climateZone: '2B',
    required: true,
    minCapacityBtuh: 54000,
    controlType: 'dry_bulb',
    dryBulbSwitchpointF: 75,
    notes: 'Economizer required for cooling capacity ≥54,000 Btu/h',
  },
];

// Fan Power Limits
export const FAN_POWER_LIMITS: FanPowerLimit[] = [
  {
    systemType: 'vav',
    maxBhpPer1000Cfm: 1.30,
    pressureDropCredits: [
      { component: 'Sound attenuation section', creditBhpPer1000Cfm: 0.15 },
      { component: 'HEPA filter', creditBhpPer1000Cfm: 0.35 },
      { component: 'Electronic air cleaner', creditBhpPer1000Cfm: 0.20 },
      { component: 'Energy recovery (50% effective)', creditBhpPer1000Cfm: 0.30 },
      { component: 'Energy recovery (75% effective)', creditBhpPer1000Cfm: 0.50 },
      { component: 'Evaporative cooler', creditBhpPer1000Cfm: 0.20 },
      { component: 'Heat pipe', creditBhpPer1000Cfm: 0.15 },
    ],
  },
  {
    systemType: 'cav',
    maxBhpPer1000Cfm: 1.10,
    pressureDropCredits: [
      { component: 'Sound attenuation section', creditBhpPer1000Cfm: 0.15 },
      { component: 'HEPA filter', creditBhpPer1000Cfm: 0.35 },
      { component: 'Electronic air cleaner', creditBhpPer1000Cfm: 0.20 },
    ],
  },
  {
    systemType: 'doas',
    maxBhpPer1000Cfm: 1.50,
    pressureDropCredits: [
      { component: 'Energy recovery (50% effective)', creditBhpPer1000Cfm: 0.30 },
      { component: 'Energy recovery (75% effective)', creditBhpPer1000Cfm: 0.50 },
    ],
  },
];

// Pump Power Limits
export const PUMP_POWER_LIMITS: PumpPowerLimit[] = [
  { systemType: 'chw', flowType: 'variable', maxWPerGpm: 22 },
  { systemType: 'chw', flowType: 'constant', maxWPerGpm: 19 },
  { systemType: 'hw', flowType: 'variable', maxWPerGpm: 19 },
  { systemType: 'hw', flowType: 'constant', maxWPerGpm: 14 },
  { systemType: 'cw', flowType: 'variable', maxWPerGpm: 19 },
  { systemType: 'cw', flowType: 'constant', maxWPerGpm: 14 },
];

// Mandatory Requirements
export interface MandatoryRequirement {
  id: string;
  category: string;
  title: string;
  description: string;
  reference: string;
  checkFunction?: string;
}

export const MANDATORY_REQUIREMENTS: MandatoryRequirement[] = [
  {
    id: 'min_ventilation',
    category: 'ventilation',
    title: 'Minimum Outdoor Air',
    description: 'Systems must provide outdoor air ventilation per ASHRAE 62.1',
    reference: 'Section 6.4.3.3',
  },
  {
    id: 'zone_controls',
    category: 'controls',
    title: 'Zone-Level Controls',
    description: 'Each zone must have individual temperature controls capable of operating independently',
    reference: 'Section 6.4.3.4',
  },
  {
    id: 'setpoint_deadband',
    category: 'controls',
    title: 'Setpoint Deadband',
    description: 'Minimum 5°F (3°C) deadband between heating and cooling setpoints',
    reference: 'Section 6.4.3.1.1',
  },
  {
    id: 'off_hour_controls',
    category: 'controls',
    title: 'Off-Hour Controls',
    description: 'HVAC systems must have automatic shutoff capability and setback/setup controls',
    reference: 'Section 6.4.3.2',
  },
  {
    id: 'vav_box_controls',
    category: 'controls',
    title: 'VAV Box Controls',
    description: 'VAV terminal boxes must have DDC controls with two-way communication',
    reference: 'Section 6.4.3.6',
  },
  {
    id: 'demand_control_ventilation',
    category: 'ventilation',
    title: 'Demand Control Ventilation',
    description: 'DCV required for spaces >500 ft² with design occupancy >25 people per 1000 ft²',
    reference: 'Section 6.4.3.9',
  },
  {
    id: 'energy_recovery',
    category: 'ventilation',
    title: 'Energy Recovery',
    description: 'ERV/HRV required for systems with >5000 CFM outdoor air and specific OA fractions',
    reference: 'Section 6.5.6.1',
  },
  {
    id: 'simultaneous_heating_cooling',
    category: 'controls',
    title: 'Simultaneous Heating/Cooling',
    description: 'Controls must prevent simultaneous heating and cooling except for specific exceptions',
    reference: 'Section 6.4.3.5',
  },
  {
    id: 'duct_insulation',
    category: 'insulation',
    title: 'Duct Insulation',
    description: 'Supply and return ducts must be insulated per Table 6.8.2-1',
    reference: 'Section 6.4.4.1',
  },
  {
    id: 'pipe_insulation',
    category: 'insulation',
    title: 'Pipe Insulation',
    description: 'Piping for HVAC systems must be insulated per Table 6.8.3-1',
    reference: 'Section 6.4.4.2',
  },
  {
    id: 'duct_sealing',
    category: 'construction',
    title: 'Duct Sealing',
    description: 'All duct joints must be sealed per SMACNA duct construction standards',
    reference: 'Section 6.4.4.1.1',
  },
  {
    id: 'variable_flow_hydronic',
    category: 'systems',
    title: 'Variable Flow Hydronic Systems',
    description: 'CHW and HW systems >300,000 Btu/h must have variable flow pumping',
    reference: 'Section 6.5.4.2',
  },
];

// Utility Functions
export function getCityClimateZone(cityId: string): ClimateZone | undefined {
  const city = SAUDI_CITIES.find(c => c.id === cityId);
  if (!city) return undefined;
  return SAUDI_CLIMATE_ZONES.find(z => z.id === city.climateZoneId);
}

export function getEconomizerRequirement(ashraeZone: string): EconomizerRequirement | undefined {
  return ECONOMIZER_REQUIREMENTS.find(e => e.climateZone === ashraeZone);
}

export function getEfficiencyRequirement(
  category: string,
  capacityValue: number,
  capacityUnit: 'tons' | 'kBtu/h' | 'kW'
): EfficiencyRequirement | undefined {
  // Convert to standard units if needed
  let normalizedCapacity = capacityValue;
  if (capacityUnit === 'kW') {
    normalizedCapacity = capacityValue * 3.412; // Convert kW to kBtu/h
  }
  
  return EFFICIENCY_REQUIREMENTS.find(req => {
    if (req.category !== category) return false;
    
    // Check capacity range
    const minOk = req.minCapacity === undefined || normalizedCapacity >= req.minCapacity;
    const maxOk = req.maxCapacity === undefined || normalizedCapacity < req.maxCapacity;
    
    return minOk && maxOk;
  });
}

export function getFanPowerLimit(systemType: 'vav' | 'cav' | 'doas'): FanPowerLimit | undefined {
  return FAN_POWER_LIMITS.find(f => f.systemType === systemType);
}

export function getPumpPowerLimit(
  systemType: 'chw' | 'hw' | 'cw',
  flowType: 'variable' | 'constant'
): PumpPowerLimit | undefined {
  return PUMP_POWER_LIMITS.find(p => p.systemType === systemType && p.flowType === flowType);
}

// SEC Energy Rating Correlation (Saudi-specific)
export const SEC_ENERGY_RATINGS = {
  5: { minSeer: 21, minEer: 13, label: '5 Stars - Most Efficient' },
  4: { minSeer: 18, minEer: 11.5, label: '4 Stars' },
  3: { minSeer: 15, minEer: 10, label: '3 Stars' },
  2: { minSeer: 13, minEer: 9, label: '2 Stars' },
  1: { minSeer: 11, minEer: 8, label: '1 Star - Minimum Allowed' },
};

export function getSECRating(seer?: number, eer?: number): number {
  if (seer && seer >= 21) return 5;
  if (seer && seer >= 18) return 4;
  if (seer && seer >= 15) return 3;
  if (seer && seer >= 13) return 2;
  if (seer && seer >= 11) return 1;
  
  if (eer && eer >= 13) return 5;
  if (eer && eer >= 11.5) return 4;
  if (eer && eer >= 10) return 3;
  if (eer && eer >= 9) return 2;
  if (eer && eer >= 8) return 1;
  
  return 0;
}
