// Vibration Isolation Calculator Library
// Based on ASHRAE Handbook - HVAC Applications, Chapter 48

export interface VibrationEquipmentType {
  id: string;
  name: string;
  description: string;
  typicalRPM: { min: number; max: number };
  typicalWeight: { min: number; max: number; unit: 'kg' | 'lbs' };
  recommendedIsolatorType: IsolatorType[];
}

export type IsolatorType = 'rubber_pad' | 'rubber_mount' | 'spring' | 'spring_restrained' | 'air_spring' | 'inertia_base';

export interface IsolatorSpec {
  type: IsolatorType;
  name: string;
  description: string;
  frequencyRange: { min: number; max: number };  // Hz
  deflectionRange: { min: number; max: number }; // mm
  efficiencyRange: { min: number; max: number }; // %
  applications: string[];
}

export interface FloorType {
  id: string;
  name: string;
  description: string;
  stiffnessFactor: number;  // Relative to slab-on-grade (1.0)
  frequencyLimit: number;   // Maximum disturbing frequency suitable
}

export interface LocationSensitivity {
  id: string;
  name: string;
  description: string;
  requiredEfficiency: number;  // % minimum
  maxTransmissibility: number;
}

export interface VibrationIsolationInput {
  equipmentType: string;
  equipmentWeight: number;      // kg
  operatingSpeedRPM: number;
  floorType: string;
  locationSensitivity: string;
  numberOfMounts: number;
}

export interface IsolatorRecommendation {
  type: IsolatorType;
  staticDeflection: number;     // mm
  naturalFrequency: number;     // Hz
  transmissibility: number;     // ratio (0-1)
  isolationEfficiency: number;  // %
  loadPerMount: number;         // kg
  springRate: number;           // N/mm
  isSuitable: boolean;
  notes: string[];
}

export interface VibrationIsolationResult {
  disturbingFrequency: number;        // Hz
  requiredEfficiency: number;         // %
  recommendations: IsolatorRecommendation[];
  preferredOption: IsolatorRecommendation | null;
  inertiaBaseRequired: boolean;
  inertiaBaseMass: number;            // kg (if required)
  warnings: string[];
  notes: string[];
}

// Equipment type database
export const EQUIPMENT_TYPES: Record<string, VibrationEquipmentType> = {
  ahu_small: {
    id: 'ahu_small',
    name: 'Small AHU',
    description: 'Air handling unit under 5,000 CFM',
    typicalRPM: { min: 800, max: 1200 },
    typicalWeight: { min: 100, max: 500, unit: 'kg' },
    recommendedIsolatorType: ['spring', 'rubber_mount'],
  },
  ahu_large: {
    id: 'ahu_large',
    name: 'Large AHU',
    description: 'Air handling unit over 5,000 CFM',
    typicalRPM: { min: 600, max: 1000 },
    typicalWeight: { min: 500, max: 5000, unit: 'kg' },
    recommendedIsolatorType: ['spring', 'spring_restrained', 'inertia_base'],
  },
  pump_small: {
    id: 'pump_small',
    name: 'Small Pump',
    description: 'Inline or end-suction pump under 10 HP',
    typicalRPM: { min: 1750, max: 3500 },
    typicalWeight: { min: 20, max: 100, unit: 'kg' },
    recommendedIsolatorType: ['rubber_mount', 'spring'],
  },
  pump_large: {
    id: 'pump_large',
    name: 'Large Pump',
    description: 'Base-mounted pump over 10 HP',
    typicalRPM: { min: 1150, max: 1750 },
    typicalWeight: { min: 100, max: 1000, unit: 'kg' },
    recommendedIsolatorType: ['spring', 'inertia_base'],
  },
  chiller: {
    id: 'chiller',
    name: 'Chiller',
    description: 'Water-cooled or air-cooled chiller',
    typicalRPM: { min: 1750, max: 3600 },
    typicalWeight: { min: 1000, max: 20000, unit: 'kg' },
    recommendedIsolatorType: ['spring_restrained', 'inertia_base'],
  },
  fan_inline: {
    id: 'fan_inline',
    name: 'Inline Fan',
    description: 'Duct-mounted inline fan',
    typicalRPM: { min: 1000, max: 3000 },
    typicalWeight: { min: 10, max: 100, unit: 'kg' },
    recommendedIsolatorType: ['rubber_mount', 'spring'],
  },
  fan_centrifugal: {
    id: 'fan_centrifugal',
    name: 'Centrifugal Fan',
    description: 'Base-mounted centrifugal fan',
    typicalRPM: { min: 600, max: 1800 },
    typicalWeight: { min: 50, max: 500, unit: 'kg' },
    recommendedIsolatorType: ['spring', 'spring_restrained'],
  },
  cooling_tower: {
    id: 'cooling_tower',
    name: 'Cooling Tower',
    description: 'Induced or forced draft cooling tower',
    typicalRPM: { min: 200, max: 600 },
    typicalWeight: { min: 500, max: 10000, unit: 'kg' },
    recommendedIsolatorType: ['spring_restrained', 'inertia_base'],
  },
  compressor: {
    id: 'compressor',
    name: 'Compressor',
    description: 'Reciprocating or screw compressor',
    typicalRPM: { min: 1750, max: 3500 },
    typicalWeight: { min: 100, max: 2000, unit: 'kg' },
    recommendedIsolatorType: ['spring_restrained', 'inertia_base'],
  },
  generator: {
    id: 'generator',
    name: 'Generator',
    description: 'Diesel or gas generator',
    typicalRPM: { min: 1500, max: 1800 },
    typicalWeight: { min: 500, max: 10000, unit: 'kg' },
    recommendedIsolatorType: ['spring_restrained', 'inertia_base', 'air_spring'],
  },
};

// Isolator specifications
export const ISOLATOR_SPECS: Record<IsolatorType, IsolatorSpec> = {
  rubber_pad: {
    type: 'rubber_pad',
    name: 'Rubber Pad',
    description: 'Molded neoprene pad for high-frequency isolation',
    frequencyRange: { min: 15, max: 100 },
    deflectionRange: { min: 2, max: 10 },
    efficiencyRange: { min: 50, max: 80 },
    applications: ['Small fans', 'Pumps under 5 HP', 'Light equipment'],
  },
  rubber_mount: {
    type: 'rubber_mount',
    name: 'Rubber Mount',
    description: 'Molded rubber isolator with metal plates',
    frequencyRange: { min: 10, max: 50 },
    deflectionRange: { min: 5, max: 20 },
    efficiencyRange: { min: 70, max: 90 },
    applications: ['Small AHUs', 'Inline fans', 'Pumps under 10 HP'],
  },
  spring: {
    type: 'spring',
    name: 'Spring Isolator',
    description: 'Steel spring isolator for low-frequency equipment',
    frequencyRange: { min: 3, max: 20 },
    deflectionRange: { min: 25, max: 75 },
    efficiencyRange: { min: 90, max: 98 },
    applications: ['AHUs', 'Large fans', 'Pumps', 'Base-mounted equipment'],
  },
  spring_restrained: {
    type: 'spring_restrained',
    name: 'Restrained Spring',
    description: 'Spring isolator with seismic restraint',
    frequencyRange: { min: 3, max: 20 },
    deflectionRange: { min: 25, max: 75 },
    efficiencyRange: { min: 90, max: 98 },
    applications: ['Chillers', 'Rooftop equipment', 'Seismic zones'],
  },
  air_spring: {
    type: 'air_spring',
    name: 'Air Spring',
    description: 'Pneumatic isolator for very low frequencies',
    frequencyRange: { min: 0.5, max: 5 },
    deflectionRange: { min: 50, max: 200 },
    efficiencyRange: { min: 95, max: 99 },
    applications: ['Sensitive equipment', 'Research facilities', 'Precision machines'],
  },
  inertia_base: {
    type: 'inertia_base',
    name: 'Inertia Base',
    description: 'Concrete base with spring isolators',
    frequencyRange: { min: 2, max: 15 },
    deflectionRange: { min: 25, max: 100 },
    efficiencyRange: { min: 95, max: 99 },
    applications: ['Reciprocating equipment', 'Sensitive locations', 'Large rotating equipment'],
  },
};

// Floor types
export const FLOOR_TYPES: Record<string, FloorType> = {
  slab_on_grade: {
    id: 'slab_on_grade',
    name: 'Slab on Grade',
    description: 'Concrete slab on ground',
    stiffnessFactor: 1.0,
    frequencyLimit: 50,
  },
  suspended_concrete: {
    id: 'suspended_concrete',
    name: 'Suspended Concrete Slab',
    description: 'Reinforced concrete floor slab',
    stiffnessFactor: 1.3,
    frequencyLimit: 25,
  },
  steel_deck: {
    id: 'steel_deck',
    name: 'Steel Deck',
    description: 'Steel deck with concrete topping',
    stiffnessFactor: 1.5,
    frequencyLimit: 15,
  },
  lightweight: {
    id: 'lightweight',
    name: 'Lightweight Construction',
    description: 'Wood or light steel framing',
    stiffnessFactor: 2.0,
    frequencyLimit: 10,
  },
  rooftop: {
    id: 'rooftop',
    name: 'Rooftop',
    description: 'Equipment on roof structure',
    stiffnessFactor: 1.8,
    frequencyLimit: 12,
  },
};

// Location sensitivity levels
export const LOCATION_SENSITIVITIES: Record<string, LocationSensitivity> = {
  mechanical_room: {
    id: 'mechanical_room',
    name: 'Mechanical Room Only',
    description: 'No sensitive spaces nearby',
    requiredEfficiency: 80,
    maxTransmissibility: 0.20,
  },
  adjacent_office: {
    id: 'adjacent_office',
    name: 'Adjacent to Office',
    description: 'Office space nearby',
    requiredEfficiency: 90,
    maxTransmissibility: 0.10,
  },
  above_office: {
    id: 'above_office',
    name: 'Above Occupied Space',
    description: 'Equipment above offices',
    requiredEfficiency: 95,
    maxTransmissibility: 0.05,
  },
  sensitive_space: {
    id: 'sensitive_space',
    name: 'Near Sensitive Space',
    description: 'Near conference room, studio, or lab',
    requiredEfficiency: 98,
    maxTransmissibility: 0.02,
  },
  critical: {
    id: 'critical',
    name: 'Critical Application',
    description: 'Vibration-sensitive equipment nearby',
    requiredEfficiency: 99,
    maxTransmissibility: 0.01,
  },
};

/**
 * Convert RPM to frequency in Hz
 */
export function rpmToHz(rpm: number): number {
  return rpm / 60;
}

/**
 * Calculate natural frequency from static deflection
 * fn = (1/2π) × √(g/δ) where g = 9810 mm/s², δ in mm
 */
export function calculateNaturalFrequency(deflectionMm: number): number {
  if (deflectionMm <= 0) return 0;
  return (1 / (2 * Math.PI)) * Math.sqrt(9810 / deflectionMm);
}

/**
 * Calculate static deflection from natural frequency
 * δ = g / (4π² × fn²)
 */
export function calculateDeflection(naturalFrequencyHz: number): number {
  if (naturalFrequencyHz <= 0) return 0;
  return 9810 / (4 * Math.PI * Math.PI * naturalFrequencyHz * naturalFrequencyHz);
}

/**
 * Calculate transmissibility
 * T = 1 / |1 - (fd/fn)²|  (for undamped system, fd > fn√2)
 */
export function calculateTransmissibility(disturbingFreq: number, naturalFreq: number): number {
  if (naturalFreq <= 0) return 1;
  const ratio = disturbingFreq / naturalFreq;
  const ratioSquared = ratio * ratio;
  
  if (ratioSquared <= 1) {
    // At or below resonance - no isolation
    return 1;
  }
  
  // Above resonance - isolation occurs
  return 1 / Math.abs(ratioSquared - 1);
}

/**
 * Calculate isolation efficiency from transmissibility
 */
export function calculateEfficiency(transmissibility: number): number {
  return Math.max(0, (1 - transmissibility) * 100);
}

/**
 * Calculate required natural frequency for desired efficiency
 */
export function calculateRequiredNaturalFrequency(
  disturbingFreq: number,
  targetEfficiency: number
): number {
  const targetTransmissibility = 1 - (targetEfficiency / 100);
  if (targetTransmissibility <= 0) return disturbingFreq / 10;
  
  // From T = 1/(r² - 1), solve for r = √(1/T + 1)
  const ratioSquared = 1 / targetTransmissibility + 1;
  const ratio = Math.sqrt(ratioSquared);
  
  return disturbingFreq / ratio;
}

/**
 * Calculate spring rate from load and deflection
 * k = W/δ where W in N, δ in mm
 */
export function calculateSpringRate(loadKg: number, deflectionMm: number): number {
  if (deflectionMm <= 0) return 0;
  const weightN = loadKg * 9.81;
  return weightN / deflectionMm;  // N/mm
}

/**
 * Calculate inertia base mass (typically 1-3x equipment weight)
 */
export function calculateInertiaBaseMass(
  equipmentWeight: number,
  disturbingFreq: number,
  sensitivity: string
): number {
  let multiplier = 1.0;
  
  // Lower frequencies need more mass
  if (disturbingFreq < 10) {
    multiplier += 0.5;
  } else if (disturbingFreq < 20) {
    multiplier += 0.25;
  }
  
  // More sensitive locations need more mass
  const sens = LOCATION_SENSITIVITIES[sensitivity];
  if (sens && sens.requiredEfficiency >= 98) {
    multiplier += 1.0;
  } else if (sens && sens.requiredEfficiency >= 95) {
    multiplier += 0.5;
  }
  
  return equipmentWeight * multiplier;
}

/**
 * Evaluate an isolator type for the given conditions
 */
function evaluateIsolator(
  type: IsolatorType,
  disturbingFreq: number,
  loadPerMount: number,
  requiredEfficiency: number,
  floorStiffnessFactor: number
): IsolatorRecommendation {
  const spec = ISOLATOR_SPECS[type];
  const notes: string[] = [];
  
  // Calculate required natural frequency for target efficiency
  const requiredFn = calculateRequiredNaturalFrequency(disturbingFreq, requiredEfficiency);
  
  // Calculate required deflection
  let deflection = calculateDeflection(requiredFn);
  
  // Adjust for floor stiffness
  deflection *= floorStiffnessFactor;
  
  // Clamp to isolator's deflection range
  const clampedDeflection = Math.max(
    spec.deflectionRange.min,
    Math.min(spec.deflectionRange.max, deflection)
  );
  
  const actualFn = calculateNaturalFrequency(clampedDeflection);
  const transmissibility = calculateTransmissibility(disturbingFreq, actualFn);
  const efficiency = calculateEfficiency(transmissibility);
  const springRate = calculateSpringRate(loadPerMount, clampedDeflection);
  
  // Check suitability
  let isSuitable = true;
  
  if (disturbingFreq < spec.frequencyRange.min) {
    notes.push(`Disturbing frequency too low for ${spec.name}`);
    isSuitable = false;
  }
  if (disturbingFreq > spec.frequencyRange.max) {
    notes.push(`Disturbing frequency too high for ${spec.name}`);
    isSuitable = false;
  }
  if (efficiency < requiredEfficiency) {
    notes.push(`Cannot achieve ${requiredEfficiency}% efficiency (max ${efficiency.toFixed(0)}%)`);
    isSuitable = false;
  }
  if (deflection > spec.deflectionRange.max) {
    notes.push(`Required deflection exceeds ${spec.name} capability`);
  }
  
  if (isSuitable) {
    notes.push(...spec.applications.slice(0, 2));
  }
  
  return {
    type,
    staticDeflection: Math.round(clampedDeflection * 10) / 10,
    naturalFrequency: Math.round(actualFn * 100) / 100,
    transmissibility: Math.round(transmissibility * 1000) / 1000,
    isolationEfficiency: Math.round(efficiency * 10) / 10,
    loadPerMount: Math.round(loadPerMount * 10) / 10,
    springRate: Math.round(springRate * 10) / 10,
    isSuitable,
    notes,
  };
}

/**
 * Perform complete vibration isolation analysis
 */
export function analyzeVibrationIsolation(input: VibrationIsolationInput): VibrationIsolationResult {
  const disturbingFreq = rpmToHz(input.operatingSpeedRPM);
  const floor = FLOOR_TYPES[input.floorType] || FLOOR_TYPES.suspended_concrete;
  const sensitivity = LOCATION_SENSITIVITIES[input.locationSensitivity] || LOCATION_SENSITIVITIES.adjacent_office;
  const equipment = EQUIPMENT_TYPES[input.equipmentType];
  
  const loadPerMount = input.equipmentWeight / Math.max(1, input.numberOfMounts);
  const requiredEfficiency = sensitivity.requiredEfficiency;
  
  const warnings: string[] = [];
  const notes: string[] = [];
  
  // Check floor frequency limit
  if (disturbingFreq < floor.frequencyLimit * 0.5) {
    warnings.push(`Low disturbing frequency (${disturbingFreq.toFixed(1)} Hz) may cause resonance with floor structure.`);
  }
  
  // Evaluate all isolator types
  const recommendations: IsolatorRecommendation[] = [];
  const isolatorTypes: IsolatorType[] = ['rubber_pad', 'rubber_mount', 'spring', 'spring_restrained', 'air_spring'];
  
  for (const type of isolatorTypes) {
    const rec = evaluateIsolator(type, disturbingFreq, loadPerMount, requiredEfficiency, floor.stiffnessFactor);
    recommendations.push(rec);
  }
  
  // Check if inertia base is needed
  let inertiaBaseRequired = false;
  let inertiaBaseMass = 0;
  
  const suitableOptions = recommendations.filter(r => r.isSuitable);
  
  if (suitableOptions.length === 0 || sensitivity.requiredEfficiency >= 95) {
    // May need inertia base
    if (equipment?.recommendedIsolatorType.includes('inertia_base') || 
        disturbingFreq < 10 ||
        sensitivity.requiredEfficiency >= 98) {
      inertiaBaseRequired = true;
      inertiaBaseMass = calculateInertiaBaseMass(input.equipmentWeight, disturbingFreq, input.locationSensitivity);
      notes.push(`Inertia base recommended: ${Math.round(inertiaBaseMass)} kg concrete base with spring isolators.`);
    }
  }
  
  // Find preferred option
  let preferredOption: IsolatorRecommendation | null = null;
  if (suitableOptions.length > 0) {
    // Prefer springs for best isolation, rubber for simpler installation
    const springs = suitableOptions.filter(r => r.type === 'spring' || r.type === 'spring_restrained');
    preferredOption = springs.length > 0 ? springs[0] : suitableOptions[0];
  }
  
  // Add general notes
  if (equipment) {
    notes.push(`Typical for ${equipment.name}: ${equipment.description}`);
  }
  notes.push(`Floor type factor: ${floor.stiffnessFactor.toFixed(1)}x deflection required.`);
  
  return {
    disturbingFrequency: Math.round(disturbingFreq * 100) / 100,
    requiredEfficiency,
    recommendations,
    preferredOption,
    inertiaBaseRequired,
    inertiaBaseMass: Math.round(inertiaBaseMass),
    warnings,
    notes,
  };
}
