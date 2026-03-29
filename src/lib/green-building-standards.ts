// LEED v4.1 Indoor Environmental Quality Credits
export interface LEEDCredit {
  id: string;
  name: string;
  category: string;
  maxPoints: number;
  requirements: LEEDRequirement[];
  documentation: string[];
}

export interface LEEDRequirement {
  param: string;
  type: string;
  threshold?: number;
  unit?: string;
  description: string;
  monitoringRequired?: boolean;
}

export const LEED_IEQ_CREDITS: LEEDCredit[] = [
  {
    id: 'EQp1',
    name: 'Minimum Indoor Air Quality Performance',
    category: 'Indoor Environmental Quality',
    maxPoints: 0, // Prerequisite
    requirements: [
      { param: 'ventilation', type: 'ashrae_62.1', description: 'Meet ASHRAE 62.1 ventilation requirements', monitoringRequired: false },
      { param: 'filtration', type: 'merv', threshold: 8, description: 'Minimum MERV 8 filtration', monitoringRequired: false },
    ],
    documentation: ['Ventilation calculations', 'Filter specifications', 'Outdoor air monitoring plan'],
  },
  {
    id: 'EQc1',
    name: 'Enhanced Indoor Air Quality Strategies',
    category: 'Indoor Environmental Quality',
    maxPoints: 2,
    requirements: [
      { param: 'co2', type: 'outdoor_air_monitoring', threshold: 800, unit: 'ppm', description: 'CO2 monitoring with setpoint', monitoringRequired: true },
      { param: 'pm25', type: 'air_filtration', threshold: 13, description: 'MERV 13+ filtration', monitoringRequired: false },
      { param: 'entryway', type: 'walk_off_mat', threshold: 3, unit: 'm', description: '3m entryway systems', monitoringRequired: false },
    ],
    documentation: ['CO2 sensor locations', 'Filter specifications', 'Entryway design'],
  },
  {
    id: 'EQc2',
    name: 'Low-Emitting Materials',
    category: 'Indoor Environmental Quality',
    maxPoints: 3,
    requirements: [
      { param: 'voc', type: 'material_emissions', threshold: 0.5, unit: 'mg/m³', description: 'Low VOC materials', monitoringRequired: false },
      { param: 'formaldehyde', type: 'material_emissions', threshold: 16.5, unit: 'ppb', description: 'Low formaldehyde materials', monitoringRequired: false },
    ],
    documentation: ['Material certifications', 'VOC testing reports'],
  },
  {
    id: 'EQc4',
    name: 'Indoor Air Quality Assessment',
    category: 'Indoor Environmental Quality',
    maxPoints: 2,
    requirements: [
      { param: 'formaldehyde', type: 'air_testing', threshold: 27, unit: 'ppb', description: 'Formaldehyde < 27 ppb', monitoringRequired: true },
      { param: 'voc', type: 'air_testing', threshold: 500, unit: 'µg/m³', description: 'Total VOCs < 500 µg/m³', monitoringRequired: true },
      { param: 'pm10', type: 'air_testing', threshold: 50, unit: 'µg/m³', description: 'PM10 < 50 µg/m³', monitoringRequired: true },
      { param: 'pm25', type: 'air_testing', threshold: 15, unit: 'µg/m³', description: 'PM2.5 < 15 µg/m³', monitoringRequired: true },
      { param: 'co', type: 'air_testing', threshold: 9, unit: 'ppm', description: 'CO < 9 ppm', monitoringRequired: true },
      { param: 'ozone', type: 'air_testing', threshold: 0.075, unit: 'ppm', description: 'Ozone < 0.075 ppm', monitoringRequired: true },
    ],
    documentation: ['Air quality test results', 'Sampling methodology', 'Corrective actions'],
  },
  {
    id: 'EQc5',
    name: 'Thermal Comfort',
    category: 'Indoor Environmental Quality',
    maxPoints: 1,
    requirements: [
      { param: 'temperature', type: 'ashrae_55', description: 'Meet ASHRAE 55 thermal comfort', monitoringRequired: true },
      { param: 'humidity', type: 'range', threshold: 60, unit: '%', description: 'Humidity control 30-60%', monitoringRequired: true },
    ],
    documentation: ['Thermal comfort analysis', 'HVAC design documentation'],
  },
  {
    id: 'EQc6',
    name: 'Interior Lighting',
    category: 'Indoor Environmental Quality',
    maxPoints: 2,
    requirements: [
      { param: 'lighting', type: 'illuminance', threshold: 300, unit: 'lux', description: 'Adequate illuminance levels', monitoringRequired: false },
      { param: 'glare', type: 'control', description: 'Glare control for occupants', monitoringRequired: false },
    ],
    documentation: ['Lighting calculations', 'Control strategies'],
  },
  {
    id: 'EQc9',
    name: 'Acoustic Performance',
    category: 'Indoor Environmental Quality',
    maxPoints: 1,
    requirements: [
      { param: 'background_noise', type: 'nc', threshold: 40, unit: 'NC', description: 'Background noise NC-40 or less', monitoringRequired: false },
      { param: 'reverberation', type: 'rt60', threshold: 0.8, unit: 's', description: 'Appropriate reverberation time', monitoringRequired: false },
    ],
    documentation: ['Acoustic analysis', 'Sound measurements'],
  },
];

// WELL v2 Air Concept Features
export interface WELLFeature {
  id: string;
  name: string;
  concept: string;
  type: 'precondition' | 'optimization';
  maxPoints: number;
  requirements: WELLRequirement[];
}

export interface WELLRequirement {
  param: string;
  threshold: number;
  unit: string;
  percentCompliance?: number; // e.g., 95% of readings must comply
  description: string;
  samplingPeriod?: string; // e.g., '24hr', '1hr', 'annual'
}

export const WELL_AIR_FEATURES: WELLFeature[] = [
  {
    id: 'A01',
    name: 'Air Quality',
    concept: 'Air',
    type: 'precondition',
    maxPoints: 0,
    requirements: [
      { param: 'pm25', threshold: 15, unit: 'µg/m³', percentCompliance: 95, samplingPeriod: '24hr', description: 'PM2.5 ≤ 15 µg/m³ (24-hr avg)' },
      { param: 'pm10', threshold: 50, unit: 'µg/m³', percentCompliance: 95, samplingPeriod: '24hr', description: 'PM10 ≤ 50 µg/m³ (24-hr avg)' },
      { param: 'co', threshold: 9, unit: 'ppm', percentCompliance: 95, samplingPeriod: '8hr', description: 'CO ≤ 9 ppm (8-hr avg)' },
      { param: 'ozone', threshold: 51, unit: 'ppb', percentCompliance: 95, samplingPeriod: '8hr', description: 'Ozone ≤ 51 ppb (8-hr avg)' },
    ],
  },
  {
    id: 'A02',
    name: 'Smoke-Free Environment',
    concept: 'Air',
    type: 'precondition',
    maxPoints: 0,
    requirements: [
      { param: 'smoking', threshold: 0, unit: 'zones', description: 'No smoking within 7.5m of building entries' },
    ],
  },
  {
    id: 'A03',
    name: 'Ventilation Design',
    concept: 'Air',
    type: 'precondition',
    maxPoints: 0,
    requirements: [
      { param: 'ventilation', threshold: 100, unit: '%', description: 'Meet ASHRAE 62.1 minimum rates' },
      { param: 'co2', threshold: 800, unit: 'ppm', percentCompliance: 95, description: 'CO2 ≤ 800 ppm (95% of occupied hours)' },
    ],
  },
  {
    id: 'A05',
    name: 'Enhanced Air Quality',
    concept: 'Air',
    type: 'optimization',
    maxPoints: 3,
    requirements: [
      { param: 'pm25', threshold: 12, unit: 'µg/m³', percentCompliance: 95, samplingPeriod: '24hr', description: 'PM2.5 ≤ 12 µg/m³ (24-hr avg)' },
      { param: 'formaldehyde', threshold: 27, unit: 'ppb', percentCompliance: 95, description: 'Formaldehyde ≤ 27 ppb' },
      { param: 'voc', threshold: 500, unit: 'µg/m³', percentCompliance: 95, description: 'Total VOC ≤ 500 µg/m³' },
    ],
  },
  {
    id: 'A06',
    name: 'Enhanced Ventilation',
    concept: 'Air',
    type: 'optimization',
    maxPoints: 3,
    requirements: [
      { param: 'ventilation', threshold: 130, unit: '%', description: '30% above ASHRAE 62.1 minimum' },
      { param: 'co2', threshold: 700, unit: 'ppm', percentCompliance: 95, description: 'CO2 ≤ 700 ppm (95% of occupied hours)' },
    ],
  },
  {
    id: 'A07',
    name: 'Operable Windows',
    concept: 'Air',
    type: 'optimization',
    maxPoints: 2,
    requirements: [
      { param: 'operable_windows', threshold: 75, unit: '%', description: '75% of regularly occupied spaces have operable windows' },
    ],
  },
  {
    id: 'A08',
    name: 'Air Quality Monitoring and Awareness',
    concept: 'Air',
    type: 'optimization',
    maxPoints: 3,
    requirements: [
      { param: 'pm25_monitoring', threshold: 1, unit: 'sensors', description: 'Continuous PM2.5 monitoring' },
      { param: 'co2_monitoring', threshold: 1, unit: 'sensors', description: 'Continuous CO2 monitoring' },
      { param: 'display', threshold: 1, unit: 'displays', description: 'Real-time air quality displays' },
    ],
  },
  {
    id: 'A14',
    name: 'Air Filtration',
    concept: 'Air',
    type: 'optimization',
    maxPoints: 3,
    requirements: [
      { param: 'filtration', threshold: 14, unit: 'MERV', description: 'MERV 14+ filtration' },
      { param: 'carbon_filtration', threshold: 1, unit: 'installed', description: 'Activated carbon or equivalent' },
    ],
  },
];

// WELL Thermal Comfort Features
export const WELL_THERMAL_FEATURES: WELLFeature[] = [
  {
    id: 'T01',
    name: 'Thermal Performance',
    concept: 'Thermal Comfort',
    type: 'precondition',
    maxPoints: 0,
    requirements: [
      { param: 'temperature', threshold: 24, unit: '°C', description: 'Operative temperature 20-24°C (heating), 23-27°C (cooling)' },
      { param: 'humidity', threshold: 60, unit: '%', description: 'Relative humidity 30-60%' },
    ],
  },
  {
    id: 'T02',
    name: 'Verified Thermal Comfort',
    concept: 'Thermal Comfort',
    type: 'optimization',
    maxPoints: 2,
    requirements: [
      { param: 'pmv', threshold: 0.5, unit: 'PMV', description: 'Predicted Mean Vote within ±0.5' },
      { param: 'ppd', threshold: 10, unit: '%', description: 'Predicted Percentage Dissatisfied < 10%' },
    ],
  },
  {
    id: 'T07',
    name: 'Thermal Comfort Monitoring',
    concept: 'Thermal Comfort',
    type: 'optimization',
    maxPoints: 1,
    requirements: [
      { param: 'temperature_monitoring', threshold: 1, unit: 'per zone', description: 'Temperature sensor per thermal zone' },
      { param: 'humidity_monitoring', threshold: 1, unit: 'per zone', description: 'Humidity sensor per thermal zone' },
    ],
  },
];

// Mostadam (Saudi Green Building Rating System) - IEQ Section
export interface MostadamCredit {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  maxPoints: number;
  requirements: MostadamRequirement[];
}

export interface MostadamRequirement {
  param: string;
  threshold: number;
  unit: string;
  description: string;
  descriptionAr: string;
}

export const MOSTADAM_IEQ_CREDITS: MostadamCredit[] = [
  {
    id: 'IEQ-1',
    name: 'Minimum IAQ Performance',
    nameAr: 'الحد الأدنى لأداء جودة الهواء الداخلي',
    category: 'Indoor Environmental Quality',
    maxPoints: 0, // Mandatory
    requirements: [
      { param: 'ventilation', threshold: 100, unit: '%', description: 'ASHRAE 62.1 compliance', descriptionAr: 'الامتثال لمعيار ASHRAE 62.1' },
      { param: 'filtration', threshold: 8, unit: 'MERV', description: 'Minimum MERV 8', descriptionAr: 'الحد الأدنى MERV 8' },
    ],
  },
  {
    id: 'IEQ-2',
    name: 'Enhanced Ventilation',
    nameAr: 'التهوية المحسنة',
    category: 'Indoor Environmental Quality',
    maxPoints: 2,
    requirements: [
      { param: 'ventilation', threshold: 130, unit: '%', description: '30% above ASHRAE 62.1', descriptionAr: '30% أعلى من ASHRAE 62.1' },
      { param: 'co2', threshold: 800, unit: 'ppm', description: 'CO2 below 800 ppm', descriptionAr: 'CO2 أقل من 800 جزء في المليون' },
    ],
  },
  {
    id: 'IEQ-3',
    name: 'Thermal Comfort',
    nameAr: 'الراحة الحرارية',
    category: 'Indoor Environmental Quality',
    maxPoints: 2,
    requirements: [
      { param: 'temperature', threshold: 24, unit: '°C', description: 'Temperature 23-26°C', descriptionAr: 'درجة الحرارة 23-26 درجة مئوية' },
      { param: 'humidity', threshold: 60, unit: '%', description: 'Humidity 30-60%', descriptionAr: 'الرطوبة 30-60%' },
    ],
  },
  {
    id: 'IEQ-4',
    name: 'Air Quality Monitoring',
    nameAr: 'مراقبة جودة الهواء',
    category: 'Indoor Environmental Quality',
    maxPoints: 2,
    requirements: [
      { param: 'co2_monitoring', threshold: 1, unit: 'system', description: 'CO2 monitoring system', descriptionAr: 'نظام مراقبة CO2' },
      { param: 'pm_monitoring', threshold: 1, unit: 'system', description: 'PM monitoring system', descriptionAr: 'نظام مراقبة الجسيمات' },
    ],
  },
];

// Helper function to calculate compliance percentage
export function calculateCompliancePercentage(
  readings: { value: number; timestamp: Date }[],
  threshold: number,
  isLessThan: boolean = true,
  percentRequired: number = 95
): { compliant: boolean; percentage: number; passingReadings: number; totalReadings: number } {
  if (readings.length === 0) {
    return { compliant: false, percentage: 0, passingReadings: 0, totalReadings: 0 };
  }

  const passingReadings = readings.filter(r => 
    isLessThan ? r.value <= threshold : r.value >= threshold
  ).length;
  
  const percentage = (passingReadings / readings.length) * 100;
  
  return {
    compliant: percentage >= percentRequired,
    percentage: Math.round(percentage * 10) / 10,
    passingReadings,
    totalReadings: readings.length,
  };
}

// Helper function to get certification level based on points
export function getLEEDLevel(totalPoints: number): string {
  if (totalPoints >= 80) return 'Platinum';
  if (totalPoints >= 60) return 'Gold';
  if (totalPoints >= 50) return 'Silver';
  if (totalPoints >= 40) return 'Certified';
  return 'Not Certified';
}

export function getWELLLevel(totalPoints: number): string {
  if (totalPoints >= 80) return 'Platinum';
  if (totalPoints >= 60) return 'Gold';
  if (totalPoints >= 50) return 'Silver';
  if (totalPoints >= 40) return 'Bronze';
  return 'Not Certified';
}

export function getMostadamLevel(totalPoints: number): string {
  if (totalPoints >= 90) return 'Platinum';
  if (totalPoints >= 75) return 'Gold';
  if (totalPoints >= 60) return 'Silver';
  if (totalPoints >= 45) return 'Bronze';
  return 'Not Certified';
}
