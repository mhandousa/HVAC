/**
 * ASCE 7-22 Seismic Design Standards for HVAC Components
 * Based on ASCE 7-22 Chapter 13 and SMACNA Seismic Restraint Manual
 */

// Seismic Design Categories
export const SEISMIC_DESIGN_CATEGORIES = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
export type SeismicDesignCategory = typeof SEISMIC_DESIGN_CATEGORIES[number];

// Component types with ASCE 7 Table 13.5-1/13.6-1 factors
export const COMPONENT_FACTORS = {
  ductwork: { 
    ap: 2.5, 
    Rp: 6.0, 
    description: 'HVAC Ductwork',
    minWeight: 0 
  },
  ductwork_inline: { 
    ap: 2.5, 
    Rp: 4.5, 
    description: 'In-line Duct Components >75 lbs',
    minWeight: 75 
  },
  piping_threaded: { 
    ap: 1.0, 
    Rp: 2.5, 
    description: 'Piping with Threaded Joints',
    minWeight: 0 
  },
  piping_welded: { 
    ap: 1.0, 
    Rp: 3.5, 
    description: 'Piping with Welded/Brazed Joints',
    minWeight: 0 
  },
  piping_grooved: { 
    ap: 1.0, 
    Rp: 4.5, 
    description: 'Piping with Grooved Couplings',
    minWeight: 0 
  },
  equipment_rigid: { 
    ap: 1.0, 
    Rp: 2.5, 
    description: 'Rigidly Mounted Equipment',
    minWeight: 0 
  },
  equipment_vibiso: { 
    ap: 2.5, 
    Rp: 2.5, 
    description: 'Vibration Isolated Equipment',
    minWeight: 0 
  },
  equipment_spring: { 
    ap: 2.5, 
    Rp: 2.0, 
    description: 'Spring Isolated Equipment',
    minWeight: 0 
  },
} as const;

export type ComponentType = keyof typeof COMPONENT_FACTORS;

// SDS Values for common locations (Saudi Arabia and reference US cities)
export interface LocationSeismicData {
  sds: number;
  sd1: number;
  sdc: SeismicDesignCategory;
  name: string;
  nameAr?: string;
  country: 'SA' | 'US' | 'AE' | 'custom';
}

export const SEISMIC_LOCATIONS: Record<string, LocationSeismicData> = {
  // Saudi Arabia
  riyadh: { sds: 0.25, sd1: 0.10, sdc: 'C', name: 'Riyadh', nameAr: 'الرياض', country: 'SA' },
  jeddah: { sds: 0.35, sd1: 0.14, sdc: 'C', name: 'Jeddah', nameAr: 'جدة', country: 'SA' },
  dammam: { sds: 0.20, sd1: 0.08, sdc: 'B', name: 'Dammam', nameAr: 'الدمام', country: 'SA' },
  makkah: { sds: 0.40, sd1: 0.16, sdc: 'C', name: 'Makkah', nameAr: 'مكة', country: 'SA' },
  madinah: { sds: 0.30, sd1: 0.12, sdc: 'C', name: 'Madinah', nameAr: 'المدينة', country: 'SA' },
  tabuk: { sds: 0.45, sd1: 0.18, sdc: 'D', name: 'Tabuk', nameAr: 'تبوك', country: 'SA' },
  abha: { sds: 0.35, sd1: 0.14, sdc: 'C', name: 'Abha', nameAr: 'أبها', country: 'SA' },
  neom: { sds: 0.50, sd1: 0.20, sdc: 'D', name: 'NEOM', nameAr: 'نيوم', country: 'SA' },
  
  // UAE
  dubai: { sds: 0.15, sd1: 0.06, sdc: 'B', name: 'Dubai', nameAr: 'دبي', country: 'AE' },
  abu_dhabi: { sds: 0.12, sd1: 0.05, sdc: 'A', name: 'Abu Dhabi', nameAr: 'أبوظبي', country: 'AE' },
  
  // US Reference Cities
  los_angeles: { sds: 1.10, sd1: 0.60, sdc: 'D', name: 'Los Angeles, CA', country: 'US' },
  san_francisco: { sds: 1.20, sd1: 0.70, sdc: 'E', name: 'San Francisco, CA', country: 'US' },
  seattle: { sds: 0.95, sd1: 0.52, sdc: 'D', name: 'Seattle, WA', country: 'US' },
  new_york: { sds: 0.35, sd1: 0.14, sdc: 'C', name: 'New York, NY', country: 'US' },
  miami: { sds: 0.15, sd1: 0.06, sdc: 'B', name: 'Miami, FL', country: 'US' },
  chicago: { sds: 0.20, sd1: 0.08, sdc: 'B', name: 'Chicago, IL', country: 'US' },
  
  // Custom entry
  custom: { sds: 0, sd1: 0, sdc: 'D', name: 'Custom Location', country: 'custom' },
};

// SMACNA Seismic Bracing Spacing Requirements
export const SMACNA_BRACE_SPACING = {
  transverse: {
    maxSpacingFt: 30,
    firstBraceMaxFt: 12, // First brace within 12 ft of fan/equipment
    basis: 'SMACNA Seismic Restraint Manual Table 5-1',
  },
  longitudinal: {
    maxSpacingFt: 40,
    firstBraceMaxFt: 12,
    basis: 'SMACNA Seismic Restraint Manual Table 5-1',
  },
  combined_4way: {
    maxSpacingFt: 24, // For SDC D, E, F
    firstBraceMaxFt: 8,
    basis: 'SMACNA for High Seismic Zones (SDC D/E/F)',
  },
} as const;

// SMACNA exemption thresholds
export const SMACNA_EXEMPTIONS = {
  duct: {
    // Ducts less than 6 sq ft cross-section may be exempt in SDC A/B/C
    maxCrossSectionSqFt: 6,
    applicableSDC: ['A', 'B', 'C'] as SeismicDesignCategory[],
    maxWeightPerFt: 17, // lbs per linear foot
  },
  pipe: {
    // Pipes 2" and smaller may be exempt
    maxNominalSizeIn: 2,
    applicableSDC: ['A', 'B', 'C'] as SeismicDesignCategory[],
  },
} as const;

// Brace capacity table based on cable/strut size
export interface BraceCapacity {
  capacity: number; // lbs lateral force
  cableSize?: string;
  strutSize?: string;
  rodDia: string;
  type: 'cable' | 'strut' | 'angle' | 'sway_brace';
  description: string;
}

export const BRACE_CAPACITIES: Record<string, BraceCapacity> = {
  cable_1_4: { 
    capacity: 320, 
    cableSize: '1/4"', 
    rodDia: '1/4"', 
    type: 'cable',
    description: '1/4" Cable Brace Kit' 
  },
  cable_3_8: { 
    capacity: 710, 
    cableSize: '3/8"', 
    rodDia: '3/8"', 
    type: 'cable',
    description: '3/8" Cable Brace Kit' 
  },
  cable_1_2: { 
    capacity: 1260, 
    cableSize: '1/2"', 
    rodDia: '1/2"', 
    type: 'cable',
    description: '1/2" Cable Brace Kit' 
  },
  strut_1_5_8: { 
    capacity: 1200, 
    strutSize: '1-5/8"', 
    rodDia: 'N/A', 
    type: 'strut',
    description: '1-5/8" Strut Brace' 
  },
  strut_1_5_8_double: { 
    capacity: 2400, 
    strutSize: '1-5/8" x 2', 
    rodDia: 'N/A', 
    type: 'strut',
    description: 'Double 1-5/8" Strut Brace' 
  },
  angle_2x2: { 
    capacity: 800, 
    rodDia: 'N/A', 
    type: 'angle',
    description: '2"x2"x1/4" Angle Brace' 
  },
  sway_brace_light: { 
    capacity: 450, 
    rodDia: '3/8"', 
    type: 'sway_brace',
    description: 'Sway Brace - Light Duty' 
  },
  sway_brace_heavy: { 
    capacity: 900, 
    rodDia: '1/2"', 
    type: 'sway_brace',
    description: 'Sway Brace - Heavy Duty' 
  },
};

// Seismic calculation input interface
export interface SeismicForceInput {
  componentType: ComponentType;
  weightLbs: number;
  locationId: string;
  customSds?: number;
  customSd1?: number;
  heightRatioZH: number; // z/h ratio (0 to 1)
  componentImportanceFactor: 1.0 | 1.5; // Ip = 1.5 for life-safety systems
}

// Seismic calculation result interface
export interface SeismicForceResult {
  fpLbs: number;            // Horizontal seismic force (governing value)
  fpCalculated: number;     // Calculated Fp from equation
  fpMin: number;            // Minimum Fp per ASCE 7
  fpMax: number;            // Maximum Fp per ASCE 7
  sds: number;              // Site Design Spectral Acceleration
  ap: number;               // Component amplification factor
  rp: number;               // Component response factor
  ip: number;               // Component importance factor
  wp: number;               // Component weight
  zh: number;               // Height ratio z/h
  formula: string;          // Display formula
  governsCase: 'calculated' | 'minimum' | 'maximum';
  sdc: SeismicDesignCategory;
  requiresBracing: boolean;
  bracingType: 'transverse' | 'longitudinal' | '4-way' | 'none';
}

/**
 * Calculate seismic horizontal force per ASCE 7-22 Equation 13.3-1
 * 
 * Fp = (0.4 × ap × SDS × Wp × (1 + 2 × z/h)) / (Rp / Ip)
 * 
 * Constraints:
 * - Fp(min) = 0.3 × SDS × Ip × Wp
 * - Fp(max) = 1.6 × SDS × Ip × Wp
 */
export function calculateSeismicForce(input: SeismicForceInput): SeismicForceResult {
  // Get location data
  const locationData = SEISMIC_LOCATIONS[input.locationId] || SEISMIC_LOCATIONS.custom;
  const sds = input.customSds ?? locationData.sds;
  const sdc = locationData.sdc;
  
  // Get component factors
  const factors = COMPONENT_FACTORS[input.componentType];
  const ap = factors.ap;
  const rp = factors.Rp;
  const ip = input.componentImportanceFactor;
  const wp = input.weightLbs;
  const zh = Math.max(0, Math.min(1, input.heightRatioZH)); // Clamp to 0-1
  
  // Calculate Fp using ASCE 7-22 Equation 13.3-1
  // Fp = (0.4 × ap × SDS × Wp × (1 + 2 × z/h)) / (Rp / Ip)
  const fpCalculated = (0.4 * ap * sds * wp * (1 + 2 * zh)) / (rp / ip);
  
  // Calculate minimum and maximum bounds
  const fpMin = 0.3 * sds * ip * wp;
  const fpMax = 1.6 * sds * ip * wp;
  
  // Determine governing value
  let fpLbs: number;
  let governsCase: 'calculated' | 'minimum' | 'maximum';
  
  if (fpCalculated < fpMin) {
    fpLbs = fpMin;
    governsCase = 'minimum';
  } else if (fpCalculated > fpMax) {
    fpLbs = fpMax;
    governsCase = 'maximum';
  } else {
    fpLbs = fpCalculated;
    governsCase = 'calculated';
  }
  
  // Determine if bracing is required based on SDC
  const requiresBracing = sdc !== 'A';
  
  // Determine bracing type based on SDC
  let bracingType: 'transverse' | 'longitudinal' | '4-way' | 'none';
  if (!requiresBracing) {
    bracingType = 'none';
  } else if (['D', 'E', 'F'].includes(sdc)) {
    bracingType = '4-way';
  } else {
    bracingType = 'transverse'; // SDC B, C typically need at least transverse
  }
  
  // Build formula string for display
  const formula = `Fp = (0.4 × ${ap} × ${sds.toFixed(2)} × ${wp.toFixed(0)} × (1 + 2 × ${zh.toFixed(2)})) / (${rp} / ${ip}) = ${fpCalculated.toFixed(0)} lbs`;
  
  return {
    fpLbs: Math.round(fpLbs),
    fpCalculated: Math.round(fpCalculated),
    fpMin: Math.round(fpMin),
    fpMax: Math.round(fpMax),
    sds,
    ap,
    rp,
    ip,
    wp,
    zh,
    formula,
    governsCase,
    sdc,
    requiresBracing,
    bracingType,
  };
}

/**
 * Calculate required number of seismic braces based on force and spacing
 */
export interface SeismicBraceCalculation {
  transverseBraces: number;
  longitudinalBraces: number;
  totalBraces: number;
  braceType: string;
  braceCapacity: number;
  totalLateralForce: number;
  forcePerBrace: number;
  transverseSpacing: number;
  longitudinalSpacing: number;
  is4Way: boolean;
  basis: string;
}

export function calculateSeismicBraces(
  lengthFt: number,
  seismicForce: SeismicForceResult,
  options?: {
    preferredBraceType?: keyof typeof BRACE_CAPACITIES;
    is4Way?: boolean;
  }
): SeismicBraceCalculation {
  if (!seismicForce.requiresBracing || seismicForce.fpLbs <= 0) {
    return {
      transverseBraces: 0,
      longitudinalBraces: 0,
      totalBraces: 0,
      braceType: 'none',
      braceCapacity: 0,
      totalLateralForce: 0,
      forcePerBrace: 0,
      transverseSpacing: 0,
      longitudinalSpacing: 0,
      is4Way: false,
      basis: 'Seismic bracing not required for SDC A',
    };
  }
  
  const is4Way = options?.is4Way ?? seismicForce.bracingType === '4-way';
  const spacingConfig = is4Way ? SMACNA_BRACE_SPACING.combined_4way : SMACNA_BRACE_SPACING.transverse;
  
  // Select brace type based on force
  let selectedBrace = BRACE_CAPACITIES.cable_3_8; // Default
  const forcePerSide = seismicForce.fpLbs / (is4Way ? 2 : 1);
  
  if (options?.preferredBraceType && BRACE_CAPACITIES[options.preferredBraceType]) {
    selectedBrace = BRACE_CAPACITIES[options.preferredBraceType];
  } else {
    // Auto-select based on force
    const braceOptions = Object.values(BRACE_CAPACITIES).sort((a, b) => a.capacity - b.capacity);
    for (const brace of braceOptions) {
      if (brace.capacity >= forcePerSide / 2) { // Safety factor of 2
        selectedBrace = brace;
        break;
      }
    }
  }
  
  // Calculate number of braces based on spacing
  const maxSpacing = spacingConfig.maxSpacingFt;
  const transverseBraces = Math.max(2, Math.ceil(lengthFt / maxSpacing) + 1);
  const longitudinalBraces = is4Way ? transverseBraces : Math.max(1, Math.ceil(lengthFt / SMACNA_BRACE_SPACING.longitudinal.maxSpacingFt));
  
  const totalBraces = is4Way ? transverseBraces * 2 : transverseBraces + longitudinalBraces;
  const actualTransverseSpacing = lengthFt / Math.max(1, transverseBraces - 1);
  const actualLongitudinalSpacing = is4Way ? actualTransverseSpacing : lengthFt / Math.max(1, longitudinalBraces - 1);
  
  return {
    transverseBraces,
    longitudinalBraces: is4Way ? transverseBraces : longitudinalBraces,
    totalBraces,
    braceType: selectedBrace.description,
    braceCapacity: selectedBrace.capacity,
    totalLateralForce: seismicForce.fpLbs,
    forcePerBrace: Math.round(seismicForce.fpLbs / totalBraces),
    transverseSpacing: Math.round(actualTransverseSpacing * 10) / 10,
    longitudinalSpacing: Math.round(actualLongitudinalSpacing * 10) / 10,
    is4Way,
    basis: is4Way ? SMACNA_BRACE_SPACING.combined_4way.basis : SMACNA_BRACE_SPACING.transverse.basis,
  };
}

/**
 * Check if component is exempt from seismic bracing per SMACNA
 */
export function checkSeismicExemption(
  application: 'duct' | 'pipe',
  sdc: SeismicDesignCategory,
  crossSectionSqFt?: number,
  nominalSizeIn?: number,
  weightPerFt?: number
): { isExempt: boolean; reason: string } {
  // SDC D, E, F - no exemptions
  if (['D', 'E', 'F'].includes(sdc)) {
    return { isExempt: false, reason: 'No exemptions for SDC D, E, or F' };
  }
  
  // SDC A - always exempt
  if (sdc === 'A') {
    return { isExempt: true, reason: 'SDC A - seismic bracing not required' };
  }
  
  // Check specific exemptions for SDC B, C
  if (application === 'duct') {
    const exemption = SMACNA_EXEMPTIONS.duct;
    if (crossSectionSqFt && crossSectionSqFt < exemption.maxCrossSectionSqFt) {
      return { 
        isExempt: true, 
        reason: `Duct cross-section < ${exemption.maxCrossSectionSqFt} sq ft (SDC ${sdc})` 
      };
    }
    if (weightPerFt && weightPerFt < exemption.maxWeightPerFt) {
      return { 
        isExempt: true, 
        reason: `Duct weight < ${exemption.maxWeightPerFt} lbs/ft (SDC ${sdc})` 
      };
    }
  }
  
  if (application === 'pipe') {
    const exemption = SMACNA_EXEMPTIONS.pipe;
    if (nominalSizeIn && nominalSizeIn <= exemption.maxNominalSizeIn) {
      return { 
        isExempt: true, 
        reason: `Pipe size ≤ ${exemption.maxNominalSizeIn}" (SDC ${sdc})` 
      };
    }
  }
  
  return { isExempt: false, reason: 'Component does not qualify for exemption' };
}
