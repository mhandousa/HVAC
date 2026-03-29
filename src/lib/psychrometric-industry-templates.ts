import { PresetAirState, PresetCategory } from '@/hooks/usePsychrometricPresets';

export type ClimateZone = 'hot_dry' | 'hot_humid' | 'moderate' | 'cold' | 'mixed' | 'all';
export type BuildingType = 'commercial' | 'healthcare' | 'hospitality' | 'retail' | 'educational' | 'industrial' | 'residential' | 'religious' | 'all';
export type ApplicationType = 'full_ahu' | 'cooling_only' | 'economizer' | 'reheat' | 'dehumidification' | 'heating_only';

export interface IndustryTemplate {
  id: string;
  name: string;
  description: string;
  category: PresetCategory;
  climateZone: ClimateZone;
  buildingType: BuildingType;
  application: ApplicationType;
  iconName: string;
  airStates: PresetAirState[];
  designNotes: string[];
  standards: string[];
  altitudeFt: number;
  source: string;
}

export const CLIMATE_ZONE_LABELS: Record<ClimateZone, string> = {
  hot_dry: 'Hot-Dry',
  hot_humid: 'Hot-Humid',
  moderate: 'Moderate',
  cold: 'Cold',
  mixed: 'Mixed',
  all: 'All Climates',
};

export const CLIMATE_ZONE_COLORS: Record<ClimateZone, string> = {
  hot_dry: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  hot_humid: 'bg-teal-500/10 text-teal-600 border-teal-500/30',
  moderate: 'bg-green-500/10 text-green-600 border-green-500/30',
  cold: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  mixed: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  all: 'bg-muted text-muted-foreground border-border',
};

export const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  commercial: 'Commercial',
  healthcare: 'Healthcare',
  hospitality: 'Hospitality',
  retail: 'Retail',
  educational: 'Educational',
  industrial: 'Industrial',
  residential: 'Residential',
  religious: 'Religious',
  all: 'All Buildings',
};

export const BUILDING_TYPE_ICONS: Record<BuildingType, string> = {
  commercial: 'Building2',
  healthcare: 'HeartPulse',
  hospitality: 'Hotel',
  retail: 'Store',
  educational: 'GraduationCap',
  industrial: 'Factory',
  residential: 'Home',
  religious: 'Church',
  all: 'Building',
};

export const APPLICATION_LABELS: Record<ApplicationType, string> = {
  full_ahu: 'Full AHU Cycle',
  cooling_only: 'Cooling Only',
  economizer: 'Economizer',
  reheat: 'Terminal Reheat',
  dehumidification: 'Dehumidification',
  heating_only: 'Heating Only',
};

// Saudi Arabia city data for context
export const SAUDI_CITIES: Record<string, { climateZone: ClimateZone; altitudeFt: number }> = {
  riyadh: { climateZone: 'hot_dry', altitudeFt: 2034 },
  jeddah: { climateZone: 'hot_humid', altitudeFt: 40 },
  dammam: { climateZone: 'hot_humid', altitudeFt: 10 },
  madinah: { climateZone: 'hot_dry', altitudeFt: 2050 },
  makkah: { climateZone: 'hot_dry', altitudeFt: 909 },
  tabuk: { climateZone: 'hot_dry', altitudeFt: 2500 },
  abha: { climateZone: 'moderate', altitudeFt: 7218 },
  najran: { climateZone: 'hot_dry', altitudeFt: 4300 },
};

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  // ============================================
  // HOT-DRY CLIMATE TEMPLATES (Riyadh, Madinah)
  // ============================================
  {
    id: 'hot_dry_office_ahu',
    name: 'Office AHU - Hot Dry Desert',
    description: 'Typical office cooling for arid desert climate with low latent load. Optimized for Riyadh conditions.',
    category: 'cooling',
    climateZone: 'hot_dry',
    buildingType: 'commercial',
    application: 'full_ahu',
    iconName: 'Building2',
    airStates: [
      { name: 'Outdoor Air', dryBulb: 46, humidity: 15, humidityType: 'relative' },
      { name: 'Return Air', dryBulb: 24, humidity: 50, humidityType: 'relative' },
      { name: 'Mixed Air', dryBulb: 32, humidity: 35, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 13, humidity: 95, humidityType: 'relative' },
    ],
    designNotes: [
      'Low latent load typical for desert climates',
      'Consider economizer for mild months (Nov-Feb)',
      'High outdoor temp requires robust cooling capacity',
      'Typical 20% outdoor air fraction for offices',
    ],
    standards: ['ASHRAE 62.1', 'SBC 201'],
    altitudeFt: 2034,
    source: 'ASHRAE Handbook - HVAC Applications',
  },
  {
    id: 'hot_dry_evap_precool',
    name: 'Evaporative Pre-Cooling',
    description: 'Two-stage indirect evaporative + DX cooling for extreme dry heat. Reduces compressor load.',
    category: 'cooling',
    climateZone: 'hot_dry',
    buildingType: 'commercial',
    application: 'cooling_only',
    iconName: 'Droplets',
    airStates: [
      { name: 'Hot Outdoor Air', dryBulb: 46, humidity: 10, humidityType: 'relative' },
      { name: 'After IEC', dryBulb: 28, humidity: 40, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 14, humidity: 85, humidityType: 'relative' },
    ],
    designNotes: [
      'Indirect evaporative pre-cooling reduces DX load by 40%',
      'Only effective when outdoor RH < 30%',
      'Water consumption: ~2-4 L/kWh cooling',
      'Minimal humidity addition with indirect type',
    ],
    standards: ['ASHRAE 90.1', 'SBC 601'],
    altitudeFt: 2034,
    source: 'ASHRAE Handbook - Fundamentals',
  },
  {
    id: 'hot_dry_mosque',
    name: 'Mosque - Intermittent Cooling',
    description: 'High occupancy religious facility with intermittent use pattern. Peak load during prayer times.',
    category: 'cooling',
    climateZone: 'hot_dry',
    buildingType: 'religious',
    application: 'cooling_only',
    iconName: 'Church',
    airStates: [
      { name: 'Outdoor Air', dryBulb: 45, humidity: 12, humidityType: 'relative' },
      { name: 'Return Air', dryBulb: 26, humidity: 55, humidityType: 'relative' },
      { name: 'Mixed Air', dryBulb: 33, humidity: 40, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 16, humidity: 85, humidityType: 'relative' },
    ],
    designNotes: [
      'Design for peak Jummah (Friday) occupancy',
      'Quick cool-down required before prayer times',
      'Higher ventilation rate during peak occupancy',
      'Consider thermal mass pre-cooling strategy',
    ],
    standards: ['ASHRAE 62.1', 'SBC 201', 'MoMRA Guidelines'],
    altitudeFt: 2034,
    source: 'Saudi Building Code - Religious Facilities',
  },
  {
    id: 'hot_dry_data_center',
    name: 'Data Center - Desert Climate',
    description: 'Precision cooling for IT equipment with economizer potential in winter months.',
    category: 'cooling',
    climateZone: 'hot_dry',
    buildingType: 'commercial',
    application: 'cooling_only',
    iconName: 'Server',
    airStates: [
      { name: 'Hot Aisle', dryBulb: 35, humidity: 30, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 18, humidity: 50, humidityType: 'relative' },
    ],
    designNotes: [
      'ASHRAE A1 envelope: 18-27°C, 20-80% RH',
      'Free cooling possible when OA < 18°C',
      'Consider adiabatic cooling for makeup air',
      'Delta-T: 15-17°C typical',
    ],
    standards: ['ASHRAE TC 9.9', 'ASHRAE 90.1'],
    altitudeFt: 2034,
    source: 'ASHRAE Thermal Guidelines for Data Centers',
  },
  {
    id: 'hot_dry_mall',
    name: 'Shopping Mall - Hot Dry',
    description: 'Large retail space with high occupancy variation and entry door infiltration.',
    category: 'cooling',
    climateZone: 'hot_dry',
    buildingType: 'retail',
    application: 'full_ahu',
    iconName: 'Store',
    airStates: [
      { name: 'Outdoor Air', dryBulb: 44, humidity: 18, humidityType: 'relative' },
      { name: 'Return Air', dryBulb: 23, humidity: 55, humidityType: 'relative' },
      { name: 'Mixed Air', dryBulb: 30, humidity: 42, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 14, humidity: 90, humidityType: 'relative' },
    ],
    designNotes: [
      'Account for vestibule and entry door heat gain',
      'Variable load from occupancy patterns',
      'Food court areas may need separate zones',
      'Consider demand-controlled ventilation',
    ],
    standards: ['ASHRAE 62.1', 'SBC 201'],
    altitudeFt: 2034,
    source: 'ASHRAE Applications Handbook - Retail',
  },

  // ============================================
  // HOT-HUMID CLIMATE TEMPLATES (Jeddah, Dammam)
  // ============================================
  {
    id: 'hot_humid_office_ahu',
    name: 'Office AHU - Coastal Humid',
    description: 'High latent load office cooling with dehumidification. Optimized for Jeddah coastal conditions.',
    category: 'cooling',
    climateZone: 'hot_humid',
    buildingType: 'commercial',
    application: 'full_ahu',
    iconName: 'Building2',
    airStates: [
      { name: 'Outdoor Air', dryBulb: 34, humidity: 65, humidityType: 'relative' },
      { name: 'Return Air', dryBulb: 24, humidity: 50, humidityType: 'relative' },
      { name: 'Mixed Air', dryBulb: 28, humidity: 55, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 13, humidity: 95, humidityType: 'relative' },
    ],
    designNotes: [
      'High latent load requires deep cooling',
      'Consider dedicated outdoor air system (DOAS)',
      'Reheat may be needed for humidity control',
      'Condensate management critical',
    ],
    standards: ['ASHRAE 62.1', 'SBC 201'],
    altitudeFt: 40,
    source: 'ASHRAE Handbook - HVAC Applications',
  },
  {
    id: 'hot_humid_hospital_or',
    name: 'Operating Room - Humid Climate',
    description: 'Precision temperature and humidity control for surgical suites in coastal areas.',
    category: 'cooling',
    climateZone: 'hot_humid',
    buildingType: 'healthcare',
    application: 'full_ahu',
    iconName: 'HeartPulse',
    airStates: [
      { name: 'Outdoor Air', dryBulb: 35, humidity: 70, humidityType: 'relative' },
      { name: 'Mixed Air', dryBulb: 28, humidity: 65, humidityType: 'relative' },
      { name: 'Cooled Air', dryBulb: 12, humidity: 95, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 16, humidity: 50, humidityType: 'relative' },
    ],
    designNotes: [
      'Terminal reheat required for precise humidity control',
      'Maintain 30-60% RH per ASHRAE 170',
      'Positive pressure differential required',
      '100% outdoor air system typical',
    ],
    standards: ['ASHRAE 170', 'ASHRAE 62.1', 'SBC 201'],
    altitudeFt: 40,
    source: 'ASHRAE 170 - Healthcare Facilities',
  },
  {
    id: 'hot_humid_hotel',
    name: 'Hotel Guest Room - Coastal',
    description: 'Individual room comfort control with high humidity outdoor conditions.',
    category: 'cooling',
    climateZone: 'hot_humid',
    buildingType: 'hospitality',
    application: 'cooling_only',
    iconName: 'Hotel',
    airStates: [
      { name: 'Outdoor Air', dryBulb: 32, humidity: 70, humidityType: 'relative' },
      { name: 'Room Air', dryBulb: 22, humidity: 55, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 14, humidity: 90, humidityType: 'relative' },
    ],
    designNotes: [
      'Fan coil or PTAC typical for guest rooms',
      'Consider ERV for corridor makeup air',
      'Bathroom exhaust provides natural ventilation',
      'Guest control within 18-26°C range',
    ],
    standards: ['ASHRAE 62.1', 'ASHRAE 55'],
    altitudeFt: 40,
    source: 'ASHRAE Applications - Hospitality',
  },
  {
    id: 'hot_humid_reheat',
    name: 'Terminal Reheat - Coastal',
    description: 'Central cooling with zone reheat for humidity control in multi-zone buildings.',
    category: 'cooling',
    climateZone: 'hot_humid',
    buildingType: 'commercial',
    application: 'reheat',
    iconName: 'Zap',
    airStates: [
      { name: 'Mixed Air', dryBulb: 28, humidity: 60, humidityType: 'relative' },
      { name: 'Cooled Air', dryBulb: 12, humidity: 95, humidityType: 'relative' },
      { name: 'Reheat Air', dryBulb: 16, humidity: 70, humidityType: 'relative' },
    ],
    designNotes: [
      'Overcool then reheat for humidity control',
      'Energy penalty but necessary for comfort',
      'Consider heat recovery for reheat energy',
      'Alternative: desiccant dehumidification',
    ],
    standards: ['ASHRAE 62.1', 'ASHRAE 90.1'],
    altitudeFt: 40,
    source: 'ASHRAE Fundamentals',
  },
  {
    id: 'hot_humid_patient_room',
    name: 'Hospital Patient Room - Humid',
    description: 'Patient comfort with infection control and humidity management.',
    category: 'cooling',
    climateZone: 'hot_humid',
    buildingType: 'healthcare',
    application: 'full_ahu',
    iconName: 'HeartPulse',
    airStates: [
      { name: 'Outdoor Air', dryBulb: 33, humidity: 75, humidityType: 'relative' },
      { name: 'Return Air', dryBulb: 22, humidity: 50, humidityType: 'relative' },
      { name: 'Mixed Air', dryBulb: 26, humidity: 60, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 14, humidity: 90, humidityType: 'relative' },
    ],
    designNotes: [
      'Minimum 6 ACH per ASHRAE 170',
      '2 ACH minimum outdoor air',
      'Pressure relationship depends on patient type',
      'Temperature 21-24°C, RH 30-60%',
    ],
    standards: ['ASHRAE 170', 'FGI Guidelines'],
    altitudeFt: 40,
    source: 'ASHRAE 170 - Healthcare Facilities',
  },

  // ============================================
  // MODERATE CLIMATE TEMPLATES (Abha)
  // ============================================
  {
    id: 'moderate_office',
    name: 'Highland Office - Abha',
    description: 'Balanced heating/cooling for mountain highland climate with mild conditions.',
    category: 'cooling',
    climateZone: 'moderate',
    buildingType: 'commercial',
    application: 'full_ahu',
    iconName: 'Building2',
    airStates: [
      { name: 'Outdoor Air', dryBulb: 32, humidity: 45, humidityType: 'relative' },
      { name: 'Return Air', dryBulb: 23, humidity: 50, humidityType: 'relative' },
      { name: 'Mixed Air', dryBulb: 26, humidity: 48, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 14, humidity: 75, humidityType: 'relative' },
    ],
    designNotes: [
      'Significant economizer hours available',
      'Consider natural ventilation for mild periods',
      'Lower design temperatures than coastal',
      'Altitude correction for equipment sizing',
    ],
    standards: ['ASHRAE 62.1', 'SBC 201'],
    altitudeFt: 7218,
    source: 'ASHRAE Handbook - Applications',
  },
  {
    id: 'moderate_winter',
    name: 'Highland Winter Heating',
    description: 'Winter heating mode for highland climate with cool outdoor conditions.',
    category: 'heating',
    climateZone: 'moderate',
    buildingType: 'commercial',
    application: 'heating_only',
    iconName: 'Flame',
    airStates: [
      { name: 'Outdoor Air', dryBulb: 4, humidity: 55, humidityType: 'relative' },
      { name: 'Return Air', dryBulb: 22, humidity: 35, humidityType: 'relative' },
      { name: 'Mixed Air', dryBulb: 16, humidity: 42, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 32, humidity: 18, humidityType: 'relative' },
    ],
    designNotes: [
      'Winter heating required in highland areas',
      'Consider humidification in dry winter',
      'Heat recovery from exhaust air',
      'Setback control for unoccupied periods',
    ],
    standards: ['ASHRAE 62.1', 'ASHRAE 90.1'],
    altitudeFt: 7218,
    source: 'ASHRAE Handbook - Fundamentals',
  },
  {
    id: 'moderate_school',
    name: 'School Classroom - Highland',
    description: 'Classroom ventilation and comfort for highland educational facilities.',
    category: 'cooling',
    climateZone: 'moderate',
    buildingType: 'educational',
    application: 'full_ahu',
    iconName: 'GraduationCap',
    airStates: [
      { name: 'Outdoor Air', dryBulb: 30, humidity: 50, humidityType: 'relative' },
      { name: 'Return Air', dryBulb: 24, humidity: 55, humidityType: 'relative' },
      { name: 'Mixed Air', dryBulb: 26, humidity: 53, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 16, humidity: 70, humidityType: 'relative' },
    ],
    designNotes: [
      'CO2-based DCV recommended',
      'High ventilation rate per ASHRAE 62.1',
      'Economizer beneficial for mild climate',
      'Consider operable windows as backup',
    ],
    standards: ['ASHRAE 62.1', 'SBC 201'],
    altitudeFt: 7218,
    source: 'ASHRAE 62.1 - Schools',
  },

  // ============================================
  // COLD CLIMATE TEMPLATES (International)
  // ============================================
  {
    id: 'cold_office',
    name: 'Cold Climate Office',
    description: 'Office building in cold climate with heating-dominated design.',
    category: 'heating',
    climateZone: 'cold',
    buildingType: 'commercial',
    application: 'full_ahu',
    iconName: 'Building2',
    airStates: [
      { name: 'Outdoor Air', dryBulb: -10, humidity: 70, humidityType: 'relative' },
      { name: 'Return Air', dryBulb: 22, humidity: 30, humidityType: 'relative' },
      { name: 'Mixed Air', dryBulb: 12, humidity: 40, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 35, humidity: 15, humidityType: 'relative' },
    ],
    designNotes: [
      'Preheat coil required to prevent freezing',
      'Humidification needed in winter',
      'High insulation and low infiltration critical',
      'Consider energy recovery ventilator',
    ],
    standards: ['ASHRAE 62.1', 'ASHRAE 90.1'],
    altitudeFt: 500,
    source: 'ASHRAE Handbook - Cold Climates',
  },
  {
    id: 'cold_hospital',
    name: 'Hospital - Cold Climate',
    description: 'Healthcare facility in cold climate with heating and humidification.',
    category: 'heating',
    climateZone: 'cold',
    buildingType: 'healthcare',
    application: 'full_ahu',
    iconName: 'HeartPulse',
    airStates: [
      { name: 'Outdoor Air', dryBulb: -15, humidity: 80, humidityType: 'relative' },
      { name: 'Preheated Air', dryBulb: 10, humidity: 20, humidityType: 'relative' },
      { name: 'Humidified Air', dryBulb: 12, humidity: 50, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 20, humidity: 40, humidityType: 'relative' },
    ],
    designNotes: [
      'Steam humidification for hygiene',
      'Glycol preheat coil for freeze protection',
      'Maintain 30-60% RH per ASHRAE 170',
      'High energy recovery effectiveness',
    ],
    standards: ['ASHRAE 170', 'ASHRAE 62.1'],
    altitudeFt: 500,
    source: 'ASHRAE 170 - Healthcare',
  },

  // ============================================
  // MIXED CLIMATE TEMPLATES
  // ============================================
  {
    id: 'mixed_economizer',
    name: 'Economizer Cycle - Mixed Climate',
    description: 'Variable outdoor air system for climates with significant free cooling potential.',
    category: 'mixing',
    climateZone: 'mixed',
    buildingType: 'commercial',
    application: 'economizer',
    iconName: 'Wind',
    airStates: [
      { name: 'Outdoor Air', dryBulb: 18, humidity: 50, humidityType: 'relative' },
      { name: 'Return Air', dryBulb: 24, humidity: 50, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 18, humidity: 50, humidityType: 'relative' },
    ],
    designNotes: [
      '100% outdoor air when conditions permit',
      'Enthalpy control for humid climates',
      'Dry-bulb control for dry climates',
      'Significant energy savings potential',
    ],
    standards: ['ASHRAE 90.1', 'SBC 601'],
    altitudeFt: 1000,
    source: 'ASHRAE 90.1 - Economizer Requirements',
  },
  {
    id: 'mixed_var_ref',
    name: 'Variable Refrigerant Flow',
    description: 'VRF system operation with simultaneous heating and cooling zones.',
    category: 'cooling',
    climateZone: 'mixed',
    buildingType: 'commercial',
    application: 'cooling_only',
    iconName: 'Settings2',
    airStates: [
      { name: 'Room Air - Cooling', dryBulb: 26, humidity: 50, humidityType: 'relative' },
      { name: 'Supply Air - Cooling', dryBulb: 14, humidity: 85, humidityType: 'relative' },
      { name: 'Room Air - Heating', dryBulb: 20, humidity: 35, humidityType: 'relative' },
      { name: 'Supply Air - Heating', dryBulb: 35, humidity: 18, humidityType: 'relative' },
    ],
    designNotes: [
      'Heat recovery between zones',
      'High part-load efficiency',
      'Individual zone control',
      'Limited ventilation capability',
    ],
    standards: ['ASHRAE 90.1', 'ASHRAE 62.1'],
    altitudeFt: 1000,
    source: 'ASHRAE Applications - VRF',
  },

  // ============================================
  // HEALTHCARE TEMPLATES (All Climates)
  // ============================================
  {
    id: 'healthcare_icu',
    name: 'ICU Critical Care',
    description: 'Intensive care unit with strict temperature, humidity, and pressure control.',
    category: 'cooling',
    climateZone: 'all',
    buildingType: 'healthcare',
    application: 'full_ahu',
    iconName: 'HeartPulse',
    airStates: [
      { name: 'Outdoor Air', dryBulb: 32, humidity: 50, humidityType: 'relative' },
      { name: 'Mixed Air', dryBulb: 26, humidity: 55, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 16, humidity: 50, humidityType: 'relative' },
    ],
    designNotes: [
      'Negative pressure for isolation rooms',
      'Positive pressure for protective isolation',
      'Minimum 6 ACH total, 2 ACH outdoor',
      'Temperature 21-24°C, RH 30-60%',
    ],
    standards: ['ASHRAE 170', 'FGI Guidelines', 'CDC Guidelines'],
    altitudeFt: 0,
    source: 'ASHRAE 170 - Healthcare Facilities',
  },
  {
    id: 'healthcare_pharmacy',
    name: 'Pharmacy Compounding',
    description: 'Cleanroom environment for sterile compounding with strict air quality.',
    category: 'dehumidification',
    climateZone: 'all',
    buildingType: 'healthcare',
    application: 'dehumidification',
    iconName: 'Beaker',
    airStates: [
      { name: 'Outdoor Air', dryBulb: 30, humidity: 60, humidityType: 'relative' },
      { name: 'HEPA Filtered', dryBulb: 20, humidity: 45, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 18, humidity: 35, humidityType: 'relative' },
    ],
    designNotes: [
      'ISO 7 cleanroom (Class 10,000)',
      'HEPA filtration required',
      'Positive pressure cascade',
      'Temperature 18-21°C, RH 30-40%',
    ],
    standards: ['USP 797', 'ASHRAE 170', 'ISO 14644'],
    altitudeFt: 0,
    source: 'USP 797 Pharmaceutical Compounding',
  },
  {
    id: 'healthcare_dental',
    name: 'Dental Operatory',
    description: 'Dental treatment room with aerosol control considerations.',
    category: 'cooling',
    climateZone: 'all',
    buildingType: 'healthcare',
    application: 'full_ahu',
    iconName: 'HeartPulse',
    airStates: [
      { name: 'Outdoor Air', dryBulb: 32, humidity: 55, humidityType: 'relative' },
      { name: 'Return Air', dryBulb: 22, humidity: 50, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 16, humidity: 60, humidityType: 'relative' },
    ],
    designNotes: [
      'Enhanced ventilation for aerosol control',
      '6-12 ACH recommended post-COVID',
      'Consider portable HEPA units',
      'Negative pressure optional',
    ],
    standards: ['ASHRAE 62.1', 'ADA Guidelines'],
    altitudeFt: 0,
    source: 'ADA/CDC Dental Guidelines',
  },

  // ============================================
  // HOSPITALITY TEMPLATES (All Climates)
  // ============================================
  {
    id: 'hospitality_lobby',
    name: 'Hotel Lobby - Variable Occupancy',
    description: 'Large open lobby with high ceiling and variable occupancy patterns.',
    category: 'cooling',
    climateZone: 'all',
    buildingType: 'hospitality',
    application: 'full_ahu',
    iconName: 'Hotel',
    airStates: [
      { name: 'Outdoor Air', dryBulb: 35, humidity: 50, humidityType: 'relative' },
      { name: 'Return Air', dryBulb: 24, humidity: 50, humidityType: 'relative' },
      { name: 'Mixed Air', dryBulb: 28, humidity: 50, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 14, humidity: 85, humidityType: 'relative' },
    ],
    designNotes: [
      'Account for entry door infiltration',
      'Stratification in high ceilings',
      'Consider air curtains at entries',
      'Variable occupancy with DCV',
    ],
    standards: ['ASHRAE 62.1', 'ASHRAE 55'],
    altitudeFt: 0,
    source: 'ASHRAE Applications - Hospitality',
  },
  {
    id: 'hospitality_ballroom',
    name: 'Ballroom / Conference',
    description: 'Large assembly space with highly variable occupancy and event-driven loads.',
    category: 'cooling',
    climateZone: 'all',
    buildingType: 'hospitality',
    application: 'full_ahu',
    iconName: 'Users',
    airStates: [
      { name: 'Outdoor Air', dryBulb: 34, humidity: 55, humidityType: 'relative' },
      { name: 'Return Air', dryBulb: 24, humidity: 55, humidityType: 'relative' },
      { name: 'Mixed Air', dryBulb: 27, humidity: 55, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 13, humidity: 92, humidityType: 'relative' },
    ],
    designNotes: [
      'Size for maximum assembly occupancy',
      'High outdoor air requirement at peak',
      'CO2-based DCV essential',
      'Consider portable supplemental units',
    ],
    standards: ['ASHRAE 62.1', 'Fire Code'],
    altitudeFt: 0,
    source: 'ASHRAE 62.1 - Assembly Spaces',
  },
  {
    id: 'hospitality_kitchen',
    name: 'Commercial Kitchen Makeup Air',
    description: 'Kitchen makeup air system to balance exhaust hoods.',
    category: 'cooling',
    climateZone: 'all',
    buildingType: 'hospitality',
    application: 'cooling_only',
    iconName: 'ChefHat',
    airStates: [
      { name: 'Outdoor Air', dryBulb: 38, humidity: 45, humidityType: 'relative' },
      { name: 'Conditioned Makeup', dryBulb: 24, humidity: 50, humidityType: 'relative' },
    ],
    designNotes: [
      'Makeup air 80-90% of exhaust rate',
      'Tempered to prevent drafts',
      'Consider short-circuit transfer',
      'Dedicated makeup air unit typical',
    ],
    standards: ['ASHRAE 62.1', 'IMC/NFPA 96'],
    altitudeFt: 0,
    source: 'ASHRAE Applications - Kitchens',
  },

  // ============================================
  // EDUCATIONAL TEMPLATES
  // ============================================
  {
    id: 'educational_classroom_dcv',
    name: 'Classroom - CO2 DCV Ready',
    description: 'Standard classroom with demand-controlled ventilation based on occupancy.',
    category: 'cooling',
    climateZone: 'all',
    buildingType: 'educational',
    application: 'full_ahu',
    iconName: 'GraduationCap',
    airStates: [
      { name: 'Outdoor Air', dryBulb: 35, humidity: 50, humidityType: 'relative' },
      { name: 'Return Air', dryBulb: 24, humidity: 55, humidityType: 'relative' },
      { name: 'Mixed Air', dryBulb: 28, humidity: 53, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 15, humidity: 80, humidityType: 'relative' },
    ],
    designNotes: [
      '35 students × 10 CFM/person = 350 CFM OA',
      'CO2 setpoint: 1000-1200 ppm',
      'Consider operable windows as backup',
      'Learning performance tied to IAQ',
    ],
    standards: ['ASHRAE 62.1', 'EPA IAQ Tools for Schools'],
    altitudeFt: 0,
    source: 'ASHRAE 62.1 - Educational Facilities',
  },
  {
    id: 'educational_gym',
    name: 'School Gymnasium',
    description: 'Large volume athletic space with high occupancy events.',
    category: 'cooling',
    climateZone: 'all',
    buildingType: 'educational',
    application: 'full_ahu',
    iconName: 'Dumbbell',
    airStates: [
      { name: 'Outdoor Air', dryBulb: 36, humidity: 45, humidityType: 'relative' },
      { name: 'Return Air', dryBulb: 26, humidity: 60, humidityType: 'relative' },
      { name: 'Mixed Air', dryBulb: 29, humidity: 55, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 16, humidity: 80, humidityType: 'relative' },
    ],
    designNotes: [
      'Size for assembly events, not just PE',
      'High ceiling stratification management',
      'Consider destratification fans',
      'Variable speed for different uses',
    ],
    standards: ['ASHRAE 62.1', 'Fire Code'],
    altitudeFt: 0,
    source: 'ASHRAE Applications - Athletics',
  },
  {
    id: 'educational_lab',
    name: 'Science Laboratory',
    description: 'Laboratory with fume hoods and 100% outdoor air requirement.',
    category: 'cooling',
    climateZone: 'all',
    buildingType: 'educational',
    application: 'full_ahu',
    iconName: 'FlaskConical',
    airStates: [
      { name: 'Outdoor Air', dryBulb: 34, humidity: 50, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 18, humidity: 55, humidityType: 'relative' },
    ],
    designNotes: [
      '100% outdoor air - no recirculation',
      'Negative pressure relative to corridor',
      'Makeup for fume hood exhaust',
      'High energy use - consider recovery',
    ],
    standards: ['ASHRAE 62.1', 'NFPA 45', 'ANSI Z9.5'],
    altitudeFt: 0,
    source: 'ASHRAE Laboratory Design Guide',
  },

  // ============================================
  // INDUSTRIAL TEMPLATES
  // ============================================
  {
    id: 'industrial_cleanroom',
    name: 'Clean Room ISO 7 (Class 10,000)',
    description: 'Controlled environment for manufacturing with particle count requirements.',
    category: 'cooling',
    climateZone: 'all',
    buildingType: 'industrial',
    application: 'full_ahu',
    iconName: 'Factory',
    airStates: [
      { name: 'Makeup Air', dryBulb: 35, humidity: 50, humidityType: 'relative' },
      { name: 'Recirculation', dryBulb: 21, humidity: 45, humidityType: 'relative' },
      { name: 'HEPA Supply', dryBulb: 20, humidity: 45, humidityType: 'relative' },
    ],
    designNotes: [
      '60+ ACH typical for ISO 7',
      'Laminar flow or non-unidirectional',
      'Gowning room airlock',
      'Tight temperature/humidity control',
    ],
    standards: ['ISO 14644', 'ASHRAE 62.1'],
    altitudeFt: 0,
    source: 'ISO 14644-1 - Cleanrooms',
  },
  {
    id: 'industrial_warehouse',
    name: 'Warehouse Spot Cooling',
    description: 'Large warehouse with localized cooling for worker comfort zones.',
    category: 'cooling',
    climateZone: 'all',
    buildingType: 'industrial',
    application: 'cooling_only',
    iconName: 'Warehouse',
    airStates: [
      { name: 'Ambient Warehouse', dryBulb: 40, humidity: 35, humidityType: 'relative' },
      { name: 'Spot Cooled Zone', dryBulb: 28, humidity: 50, humidityType: 'relative' },
    ],
    designNotes: [
      'Not economical to condition entire volume',
      'Evaporative cooling effective in dry climates',
      'High-volume low-speed (HVLS) fans',
      'Personal cooling stations at work areas',
    ],
    standards: ['OSHA Heat Guidelines', 'ASHRAE 55'],
    altitudeFt: 0,
    source: 'ASHRAE Applications - Warehouses',
  },
  {
    id: 'industrial_paint_booth',
    name: 'Paint Booth Makeup Air',
    description: 'Automotive paint booth with temperature and humidity control for finish quality.',
    category: 'cooling',
    climateZone: 'all',
    buildingType: 'industrial',
    application: 'cooling_only',
    iconName: 'Paintbrush',
    airStates: [
      { name: 'Outdoor Air', dryBulb: 35, humidity: 50, humidityType: 'relative' },
      { name: 'Conditioned Supply', dryBulb: 22, humidity: 55, humidityType: 'relative' },
    ],
    designNotes: [
      'Temperature critical for paint viscosity',
      'RH affects flash-off rate',
      '100% outdoor air - no recirculation',
      'Direct-fired gas heaters common',
    ],
    standards: ['NFPA 33', 'OSHA 1910.94'],
    altitudeFt: 0,
    source: 'NFPA 33 - Spray Application',
  },

  // ============================================
  // RETAIL TEMPLATES
  // ============================================
  {
    id: 'retail_supermarket',
    name: 'Supermarket - Mixed Loads',
    description: 'Grocery store with refrigeration case heat rejection and high door traffic.',
    category: 'cooling',
    climateZone: 'all',
    buildingType: 'retail',
    application: 'full_ahu',
    iconName: 'Store',
    airStates: [
      { name: 'Outdoor Air', dryBulb: 35, humidity: 55, humidityType: 'relative' },
      { name: 'Sales Floor Return', dryBulb: 22, humidity: 50, humidityType: 'relative' },
      { name: 'Mixed Air', dryBulb: 26, humidity: 52, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 14, humidity: 85, humidityType: 'relative' },
    ],
    designNotes: [
      'Refrigeration cases reject heat to space',
      'High dehumidification need near cases',
      'Vestibule or air curtain at entries',
      'Consider night setback carefully',
    ],
    standards: ['ASHRAE 62.1', 'ASHRAE 90.1'],
    altitudeFt: 0,
    source: 'ASHRAE Applications - Retail',
  },
  {
    id: 'retail_boutique',
    name: 'Boutique Retail Store',
    description: 'Small retail space with display lighting loads and customer comfort focus.',
    category: 'cooling',
    climateZone: 'all',
    buildingType: 'retail',
    application: 'cooling_only',
    iconName: 'Store',
    airStates: [
      { name: 'Outdoor Air', dryBulb: 34, humidity: 50, humidityType: 'relative' },
      { name: 'Room Air', dryBulb: 22, humidity: 50, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 14, humidity: 80, humidityType: 'relative' },
    ],
    designNotes: [
      'High lighting load from displays',
      'Maintain comfort for browsing customers',
      'Consider split system or VRF',
      'Entry door traffic management',
    ],
    standards: ['ASHRAE 62.1', 'ASHRAE 55'],
    altitudeFt: 0,
    source: 'ASHRAE Applications - Retail',
  },
];

// Helper function to filter templates
export function filterIndustryTemplates(options: {
  climateZone?: ClimateZone | 'all';
  buildingType?: BuildingType | 'all';
  application?: ApplicationType | 'all';
  searchQuery?: string;
}): IndustryTemplate[] {
  return INDUSTRY_TEMPLATES.filter(template => {
    // Climate zone filter
    if (options.climateZone && options.climateZone !== 'all') {
      if (template.climateZone !== options.climateZone && template.climateZone !== 'all') {
        return false;
      }
    }

    // Building type filter
    if (options.buildingType && options.buildingType !== 'all') {
      if (template.buildingType !== options.buildingType && template.buildingType !== 'all') {
        return false;
      }
    }

    // Application filter
    if (options.application && options.application !== 'all') {
      if (template.application !== options.application) {
        return false;
      }
    }

    // Search query filter
    if (options.searchQuery) {
      const query = options.searchQuery.toLowerCase();
      const matchesName = template.name.toLowerCase().includes(query);
      const matchesDescription = template.description.toLowerCase().includes(query);
      const matchesNotes = template.designNotes.some(note => note.toLowerCase().includes(query));
      const matchesStandards = template.standards.some(std => std.toLowerCase().includes(query));
      
      if (!matchesName && !matchesDescription && !matchesNotes && !matchesStandards) {
        return false;
      }
    }

    return true;
  });
}

// Get recommended templates based on project context
export function getRecommendedTemplates(
  climateZone?: ClimateZone,
  buildingType?: BuildingType,
  limit: number = 6
): IndustryTemplate[] {
  // Priority scoring for recommendations
  const scored = INDUSTRY_TEMPLATES.map(template => {
    let score = 0;
    
    // Exact climate match: +10 points
    if (climateZone && template.climateZone === climateZone) {
      score += 10;
    }
    // Climate is 'all' (universal): +3 points
    else if (template.climateZone === 'all') {
      score += 3;
    }
    
    // Exact building type match: +10 points
    if (buildingType && template.buildingType === buildingType) {
      score += 10;
    }
    // Building type is 'all' (universal): +2 points
    else if (template.buildingType === 'all') {
      score += 2;
    }
    
    // Full AHU cycle templates are most comprehensive: +1 point
    if (template.application === 'full_ahu') {
      score += 1;
    }
    
    return { template, score };
  });
  
  // Sort by score descending, then by name
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.template.name.localeCompare(b.template.name);
  });
  
  return scored.slice(0, limit).map(s => s.template);
}
