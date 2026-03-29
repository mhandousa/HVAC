/**
 * Support Cost Database
 * Unit prices for hangers, supports, and seismic bracing components
 * Prices in SAR and USD with labor hours
 */

export interface SupportUnitCost {
  id: string;
  category: 'hanger' | 'rod' | 'accessory' | 'seismic' | 'pipe_support';
  description: string;
  descriptionAr?: string;
  unitOfMeasure: 'each' | 'ft' | 'set' | 'lb';
  baseCostSAR: number;
  baseCostUSD: number;
  laborHours: number;
  sizeVariants?: Record<string, number>; // Size-based cost multipliers
  notes?: string;
}

// Labor rates by region
export interface LaborRates {
  SAR_per_hour: number;
  USD_per_hour: number;
  description: string;
}

export const LABOR_RATES: Record<string, LaborRates> = {
  standard: {
    SAR_per_hour: 75,
    USD_per_hour: 45,
    description: 'Standard HVAC Installer',
  },
  premium: {
    SAR_per_hour: 110,
    USD_per_hour: 65,
    description: 'Certified Seismic Installer',
  },
  helper: {
    SAR_per_hour: 45,
    USD_per_hour: 25,
    description: 'Helper/Apprentice',
  },
};

// Comprehensive support cost database
export const SUPPORT_COSTS: Record<string, SupportUnitCost> = {
  // ============ DUCT HANGERS ============
  trapeze_hanger_light: {
    id: 'trapeze_light',
    category: 'hanger',
    description: 'Trapeze Hanger - Light Duty (up to 30")',
    descriptionAr: 'حامل ترابيز - خفيف',
    unitOfMeasure: 'each',
    baseCostSAR: 85,
    baseCostUSD: 23,
    laborHours: 0.5,
    sizeVariants: {
      'up_to_18': 0.8,
      '19_to_30': 1.0,
      '31_to_48': 1.4,
      'over_48': 1.8,
    },
  },
  trapeze_hanger_medium: {
    id: 'trapeze_medium',
    category: 'hanger',
    description: 'Trapeze Hanger - Medium Duty (30"-48")',
    descriptionAr: 'حامل ترابيز - متوسط',
    unitOfMeasure: 'each',
    baseCostSAR: 120,
    baseCostUSD: 32,
    laborHours: 0.65,
    sizeVariants: {
      '31_to_48': 1.0,
      '49_to_60': 1.3,
      'over_60': 1.6,
    },
  },
  trapeze_hanger_heavy: {
    id: 'trapeze_heavy',
    category: 'hanger',
    description: 'Trapeze Hanger - Heavy Duty (48"+)',
    descriptionAr: 'حامل ترابيز - ثقيل',
    unitOfMeasure: 'each',
    baseCostSAR: 175,
    baseCostUSD: 47,
    laborHours: 0.85,
    sizeVariants: {
      '49_to_72': 1.0,
      '73_to_96': 1.25,
      'over_96': 1.5,
    },
  },
  strap_hanger: {
    id: 'strap',
    category: 'hanger',
    description: 'Strap Hanger - Galvanized',
    descriptionAr: 'حامل شريطي',
    unitOfMeasure: 'each',
    baseCostSAR: 25,
    baseCostUSD: 7,
    laborHours: 0.2,
    sizeVariants: {
      'up_to_12': 0.8,
      '13_to_18': 1.0,
      '19_to_24': 1.3,
    },
  },

  // ============ PIPE HANGERS ============
  clevis_hanger: {
    id: 'clevis',
    category: 'pipe_support',
    description: 'Clevis Hanger - Carbon Steel',
    descriptionAr: 'حامل كليفيس',
    unitOfMeasure: 'each',
    baseCostSAR: 45,
    baseCostUSD: 12,
    laborHours: 0.25,
    sizeVariants: {
      '1/2_to_1': 0.7,
      '1-1/4_to_2': 1.0,
      '2-1/2_to_4': 1.4,
      '5_to_6': 1.8,
      '8_to_10': 2.4,
      '12': 3.0,
    },
  },
  riser_clamp: {
    id: 'riser_clamp',
    category: 'pipe_support',
    description: 'Riser Clamp - Heavy Duty',
    descriptionAr: 'مشبك رايزر',
    unitOfMeasure: 'each',
    baseCostSAR: 85,
    baseCostUSD: 23,
    laborHours: 0.4,
    sizeVariants: {
      '1_to_2': 0.8,
      '2-1/2_to_4': 1.0,
      '5_to_8': 1.5,
      '10_to_12': 2.0,
    },
  },
  pipe_guide: {
    id: 'pipe_guide',
    category: 'pipe_support',
    description: 'Pipe Guide - Slide Type',
    descriptionAr: 'موجه أنابيب',
    unitOfMeasure: 'each',
    baseCostSAR: 65,
    baseCostUSD: 17,
    laborHours: 0.35,
    sizeVariants: {
      '1_to_2': 0.8,
      '2-1/2_to_4': 1.0,
      '5_to_8': 1.4,
    },
  },
  pipe_anchor: {
    id: 'pipe_anchor',
    category: 'pipe_support',
    description: 'Pipe Anchor - Welded',
    descriptionAr: 'مرساة أنابيب',
    unitOfMeasure: 'each',
    baseCostSAR: 120,
    baseCostUSD: 32,
    laborHours: 0.75,
    sizeVariants: {
      '1_to_2': 0.7,
      '2-1/2_to_4': 1.0,
      '5_to_8': 1.5,
      '10_to_12': 2.2,
    },
  },
  spring_hanger: {
    id: 'spring_hanger',
    category: 'pipe_support',
    description: 'Spring Hanger - Variable',
    descriptionAr: 'حامل زنبركي',
    unitOfMeasure: 'each',
    baseCostSAR: 450,
    baseCostUSD: 120,
    laborHours: 1.0,
    sizeVariants: {
      'light': 0.8,
      'medium': 1.0,
      'heavy': 1.5,
    },
  },

  // ============ THREADED RODS ============
  threaded_rod: {
    id: 'rod',
    category: 'rod',
    description: 'All-Thread Rod - Zinc Plated',
    descriptionAr: 'قضيب ملولب',
    unitOfMeasure: 'ft',
    baseCostSAR: 8,
    baseCostUSD: 2.15,
    laborHours: 0.05,
    sizeVariants: {
      '1/4': 0.6,
      '3/8': 1.0,
      '1/2': 1.4,
      '5/8': 1.8,
      '3/4': 2.3,
      '7/8': 2.8,
      '1': 3.5,
    },
  },
  threaded_rod_ss: {
    id: 'rod_ss',
    category: 'rod',
    description: 'All-Thread Rod - Stainless Steel',
    descriptionAr: 'قضيب ملولب ستانلس',
    unitOfMeasure: 'ft',
    baseCostSAR: 28,
    baseCostUSD: 7.50,
    laborHours: 0.05,
    sizeVariants: {
      '3/8': 1.0,
      '1/2': 1.35,
      '5/8': 1.7,
      '3/4': 2.1,
    },
  },

  // ============ ACCESSORIES ============
  beam_clamp: {
    id: 'beam_clamp',
    category: 'accessory',
    description: 'Beam Clamp - Universal',
    descriptionAr: 'مشبك كمرة',
    unitOfMeasure: 'each',
    baseCostSAR: 35,
    baseCostUSD: 9.50,
    laborHours: 0.15,
  },
  beam_clamp_heavy: {
    id: 'beam_clamp_heavy',
    category: 'accessory',
    description: 'Beam Clamp - Heavy Duty',
    descriptionAr: 'مشبك كمرة ثقيل',
    unitOfMeasure: 'each',
    baseCostSAR: 55,
    baseCostUSD: 15,
    laborHours: 0.2,
  },
  concrete_insert: {
    id: 'concrete_insert',
    category: 'accessory',
    description: 'Concrete Insert - Drop-In Anchor',
    descriptionAr: 'مثبت خرساني',
    unitOfMeasure: 'each',
    baseCostSAR: 12,
    baseCostUSD: 3.25,
    laborHours: 0.15,
    sizeVariants: {
      '3/8': 1.0,
      '1/2': 1.3,
      '5/8': 1.6,
      '3/4': 2.0,
    },
  },
  wedge_anchor: {
    id: 'wedge_anchor',
    category: 'accessory',
    description: 'Wedge Anchor - Mechanical',
    descriptionAr: 'مرساة إسفينية',
    unitOfMeasure: 'each',
    baseCostSAR: 8,
    baseCostUSD: 2.15,
    laborHours: 0.1,
    sizeVariants: {
      '3/8x3': 1.0,
      '1/2x4': 1.4,
      '5/8x5': 1.8,
      '3/4x6': 2.3,
    },
  },
  hex_nut: {
    id: 'hex_nut',
    category: 'accessory',
    description: 'Hex Nut - Zinc Plated',
    descriptionAr: 'صامولة سداسية',
    unitOfMeasure: 'each',
    baseCostSAR: 1.5,
    baseCostUSD: 0.40,
    laborHours: 0.02,
  },
  flat_washer: {
    id: 'flat_washer',
    category: 'accessory',
    description: 'Flat Washer - USS',
    descriptionAr: 'ورده مسطحة',
    unitOfMeasure: 'each',
    baseCostSAR: 0.75,
    baseCostUSD: 0.20,
    laborHours: 0.01,
  },
  lock_washer: {
    id: 'lock_washer',
    category: 'accessory',
    description: 'Lock Washer - Split Ring',
    descriptionAr: 'ورده قفل',
    unitOfMeasure: 'each',
    baseCostSAR: 1.0,
    baseCostUSD: 0.27,
    laborHours: 0.01,
  },

  // ============ SEISMIC COMPONENTS ============
  seismic_cable_brace_1_4: {
    id: 'cable_brace_1_4',
    category: 'seismic',
    description: 'Seismic Cable Brace Kit - 1/4"',
    descriptionAr: 'مجموعة كيبل زلزالي 1/4"',
    unitOfMeasure: 'each',
    baseCostSAR: 145,
    baseCostUSD: 39,
    laborHours: 0.75,
    notes: 'Includes cable, turnbuckle, clamps, and hardware',
  },
  seismic_cable_brace_3_8: {
    id: 'cable_brace_3_8',
    category: 'seismic',
    description: 'Seismic Cable Brace Kit - 3/8"',
    descriptionAr: 'مجموعة كيبل زلزالي 3/8"',
    unitOfMeasure: 'each',
    baseCostSAR: 185,
    baseCostUSD: 49,
    laborHours: 0.85,
    notes: 'Includes cable, turnbuckle, clamps, and hardware',
  },
  seismic_cable_brace_1_2: {
    id: 'cable_brace_1_2',
    category: 'seismic',
    description: 'Seismic Cable Brace Kit - 1/2"',
    descriptionAr: 'مجموعة كيبل زلزالي 1/2"',
    unitOfMeasure: 'each',
    baseCostSAR: 240,
    baseCostUSD: 64,
    laborHours: 1.0,
    notes: 'Includes cable, turnbuckle, clamps, and hardware',
  },
  seismic_strut_brace: {
    id: 'strut_brace',
    category: 'seismic',
    description: 'Seismic Strut Brace Assembly - 1-5/8"',
    descriptionAr: 'تجميع دعامة زلزالية',
    unitOfMeasure: 'each',
    baseCostSAR: 320,
    baseCostUSD: 85,
    laborHours: 1.25,
    notes: 'Channel strut with fittings and anchors',
  },
  seismic_strut_double: {
    id: 'strut_double',
    category: 'seismic',
    description: 'Seismic Strut Brace - Double Channel',
    descriptionAr: 'دعامة زلزالية مزدوجة',
    unitOfMeasure: 'each',
    baseCostSAR: 485,
    baseCostUSD: 130,
    laborHours: 1.75,
  },
  seismic_sway_brace: {
    id: 'sway_brace',
    category: 'seismic',
    description: 'Sway Brace Assembly',
    descriptionAr: 'تجميع دعامة تأرجح',
    unitOfMeasure: 'each',
    baseCostSAR: 165,
    baseCostUSD: 44,
    laborHours: 0.65,
  },
  seismic_isolation_mount: {
    id: 'isolation_mount',
    category: 'seismic',
    description: 'Seismic Isolation Mount',
    descriptionAr: 'قاعدة عزل زلزالي',
    unitOfMeasure: 'each',
    baseCostSAR: 280,
    baseCostUSD: 75,
    laborHours: 0.5,
  },

  // ============ STRUT CHANNEL ============
  strut_channel_plain: {
    id: 'strut_plain',
    category: 'accessory',
    description: 'Strut Channel 1-5/8" x 1-5/8" - Plain',
    descriptionAr: 'قناة سترت عادية',
    unitOfMeasure: 'ft',
    baseCostSAR: 18,
    baseCostUSD: 4.80,
    laborHours: 0.08,
  },
  strut_channel_slotted: {
    id: 'strut_slotted',
    category: 'accessory',
    description: 'Strut Channel 1-5/8" x 1-5/8" - Slotted',
    descriptionAr: 'قناة سترت مشقوقة',
    unitOfMeasure: 'ft',
    baseCostSAR: 22,
    baseCostUSD: 5.90,
    laborHours: 0.08,
  },
  strut_fitting: {
    id: 'strut_fitting',
    category: 'accessory',
    description: 'Strut Fitting - Assorted',
    descriptionAr: 'تركيبات سترت',
    unitOfMeasure: 'each',
    baseCostSAR: 15,
    baseCostUSD: 4,
    laborHours: 0.05,
  },
};

// Get cost item by support type
export function getSupportCostItem(supportType: string): SupportUnitCost | null {
  // Map support types to cost database keys
  const typeMapping: Record<string, string> = {
    'trapeze': 'trapeze_hanger_light',
    'trapeze_light': 'trapeze_hanger_light',
    'trapeze_medium': 'trapeze_hanger_medium',
    'trapeze_heavy': 'trapeze_hanger_heavy',
    'clevis': 'clevis_hanger',
    'strap': 'strap_hanger',
    'riser_clamp': 'riser_clamp',
    'pipe_guide': 'pipe_guide',
    'pipe_anchor': 'pipe_anchor',
    'spring_hanger': 'spring_hanger',
    'beam_clamp': 'beam_clamp',
    'concrete_insert': 'concrete_insert',
    'seismic_cable': 'seismic_cable_brace_3_8',
    'seismic_strut': 'seismic_strut_brace',
    'seismic_brace': 'seismic_cable_brace_3_8',
    'sway_brace': 'seismic_sway_brace',
  };

  const key = typeMapping[supportType] || supportType;
  return SUPPORT_COSTS[key] || null;
}

// Get size multiplier for a given size range
export function getSizeMultiplier(costItem: SupportUnitCost, size: string): number {
  if (!costItem.sizeVariants) return 1.0;
  
  // Try direct match first
  if (costItem.sizeVariants[size]) {
    return costItem.sizeVariants[size];
  }
  
  // Try to find matching range
  const sizeNum = parseFloat(size.replace(/[^0-9.]/g, ''));
  if (isNaN(sizeNum)) return 1.0;
  
  for (const [range, multiplier] of Object.entries(costItem.sizeVariants)) {
    if (range.includes('_to_')) {
      const [min, max] = range.split('_to_').map(s => parseFloat(s.replace(/[^0-9.]/g, '')));
      if (sizeNum >= min && sizeNum <= max) {
        return multiplier;
      }
    } else if (range.startsWith('up_to_')) {
      const max = parseFloat(range.replace('up_to_', ''));
      if (sizeNum <= max) {
        return multiplier;
      }
    } else if (range.startsWith('over_')) {
      const min = parseFloat(range.replace('over_', ''));
      if (sizeNum > min) {
        return multiplier;
      }
    }
  }
  
  return 1.0;
}
