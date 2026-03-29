// Acoustic Treatment Cost Estimator Library
// Calculates material and installation costs for silencers, duct lining, and vibration isolators

export type TreatmentCategory = 'silencer' | 'lining' | 'isolator' | 'panel';
export type CostUnit = 'each' | 'linear-ft' | 'sq-ft' | 'set';

export interface TreatmentCostItem {
  id: string;
  category: TreatmentCategory;
  name: string;
  description: string;
  materialCostSAR: number;
  laborCostSAR: number;
  unit: CostUnit;
  installationHours: number;
  specifications?: {
    minSize?: number;
    maxSize?: number;
    sizeDependentCost?: boolean;
  };
}

export interface TreatmentLineItem {
  itemId: string;
  quantity: number;
  size?: number; // inches for ducts, lbs for isolators
  notes?: string;
}

export interface CostBreakdown {
  items: {
    item: TreatmentCostItem;
    quantity: number;
    size?: number;
    materialCost: number;
    laborCost: number;
    totalCost: number;
  }[];
  subtotalMaterial: number;
  subtotalLabor: number;
  contingencyPercent: number;
  contingencyAmount: number;
  grandTotal: number;
}

// Saudi Arabia regional pricing (SAR)
// Labor rate: Average HVAC technician rate
const LABOR_RATE_SAR_PER_HOUR = 75;

// Treatment cost catalog
export const TREATMENT_CATALOG: TreatmentCostItem[] = [
  // Silencers
  {
    id: 'silencer-6in',
    category: 'silencer',
    name: 'Rectangular Silencer 6"',
    description: '6" round/square duct silencer, 3 ft length, 15 dB IL',
    materialCostSAR: 850,
    laborCostSAR: 150,
    unit: 'each',
    installationHours: 2,
    specifications: { minSize: 6, maxSize: 8 },
  },
  {
    id: 'silencer-10in',
    category: 'silencer',
    name: 'Rectangular Silencer 10"',
    description: '10" round/square duct silencer, 4 ft length, 18 dB IL',
    materialCostSAR: 1200,
    laborCostSAR: 225,
    unit: 'each',
    installationHours: 3,
    specifications: { minSize: 9, maxSize: 12 },
  },
  {
    id: 'silencer-14in',
    category: 'silencer',
    name: 'Rectangular Silencer 14"',
    description: '14" round/square duct silencer, 4 ft length, 20 dB IL',
    materialCostSAR: 1650,
    laborCostSAR: 300,
    unit: 'each',
    installationHours: 4,
    specifications: { minSize: 13, maxSize: 16 },
  },
  {
    id: 'silencer-18in',
    category: 'silencer',
    name: 'Rectangular Silencer 18"',
    description: '18" round/square duct silencer, 5 ft length, 22 dB IL',
    materialCostSAR: 2100,
    laborCostSAR: 375,
    unit: 'each',
    installationHours: 5,
    specifications: { minSize: 17, maxSize: 20 },
  },
  {
    id: 'silencer-24in',
    category: 'silencer',
    name: 'Rectangular Silencer 24"',
    description: '24" round/square duct silencer, 5 ft length, 25 dB IL',
    materialCostSAR: 2800,
    laborCostSAR: 450,
    unit: 'each',
    installationHours: 6,
    specifications: { minSize: 21, maxSize: 30 },
  },
  {
    id: 'silencer-36in',
    category: 'silencer',
    name: 'Rectangular Silencer 36"',
    description: '36" rectangular duct silencer, 6 ft length, 28 dB IL',
    materialCostSAR: 4200,
    laborCostSAR: 600,
    unit: 'each',
    installationHours: 8,
    specifications: { minSize: 31, maxSize: 48 },
  },

  // Duct Lining
  {
    id: 'lining-1in',
    category: 'lining',
    name: 'Duct Lining 1"',
    description: '1" fiberglass duct liner, NRC 0.65',
    materialCostSAR: 35,
    laborCostSAR: 25,
    unit: 'sq-ft',
    installationHours: 0.1,
  },
  {
    id: 'lining-2in',
    category: 'lining',
    name: 'Duct Lining 2"',
    description: '2" fiberglass duct liner, NRC 0.85',
    materialCostSAR: 55,
    laborCostSAR: 30,
    unit: 'sq-ft',
    installationHours: 0.15,
  },
  {
    id: 'lining-external-wrap',
    category: 'lining',
    name: 'External Duct Wrap',
    description: 'External fiberglass wrap with vapor barrier',
    materialCostSAR: 28,
    laborCostSAR: 20,
    unit: 'sq-ft',
    installationHours: 0.08,
  },
  {
    id: 'lined-flex-duct',
    category: 'lining',
    name: 'Lined Flexible Duct',
    description: 'Pre-insulated flexible duct per linear foot',
    materialCostSAR: 45,
    laborCostSAR: 15,
    unit: 'linear-ft',
    installationHours: 0.1,
  },

  // Vibration Isolators
  {
    id: 'isolator-spring-light',
    category: 'isolator',
    name: 'Spring Isolators (Light Duty)',
    description: 'Spring mounts for equipment up to 500 lbs, set of 4',
    materialCostSAR: 800,
    laborCostSAR: 300,
    unit: 'set',
    installationHours: 4,
    specifications: { minSize: 0, maxSize: 500 },
  },
  {
    id: 'isolator-spring-medium',
    category: 'isolator',
    name: 'Spring Isolators (Medium Duty)',
    description: 'Spring mounts for equipment 500-2000 lbs, set of 4',
    materialCostSAR: 1400,
    laborCostSAR: 450,
    unit: 'set',
    installationHours: 6,
    specifications: { minSize: 500, maxSize: 2000 },
  },
  {
    id: 'isolator-spring-heavy',
    category: 'isolator',
    name: 'Spring Isolators (Heavy Duty)',
    description: 'Spring mounts for equipment 2000-5000 lbs, set of 4',
    materialCostSAR: 2200,
    laborCostSAR: 600,
    unit: 'set',
    installationHours: 8,
    specifications: { minSize: 2000, maxSize: 5000 },
  },
  {
    id: 'isolator-rubber-pad',
    category: 'isolator',
    name: 'Neoprene Pad Mounts',
    description: 'Rubber pad isolators for light equipment, set of 4',
    materialCostSAR: 350,
    laborCostSAR: 150,
    unit: 'set',
    installationHours: 2,
  },
  {
    id: 'isolator-inertia-base',
    category: 'isolator',
    name: 'Inertia Base (Steel)',
    description: 'Structural steel inertia base frame',
    materialCostSAR: 3500,
    laborCostSAR: 800,
    unit: 'each',
    installationHours: 10,
  },
  {
    id: 'isolator-concrete-base',
    category: 'isolator',
    name: 'Concrete Inertia Base',
    description: 'Concrete inertia base with reinforcement',
    materialCostSAR: 2800,
    laborCostSAR: 1200,
    unit: 'each',
    installationHours: 16,
  },

  // Acoustic Panels
  {
    id: 'panel-wall-2in',
    category: 'panel',
    name: 'Wall Acoustic Panel 2"',
    description: '2" fabric-wrapped acoustic panel for walls',
    materialCostSAR: 180,
    laborCostSAR: 45,
    unit: 'sq-ft',
    installationHours: 0.2,
  },
  {
    id: 'panel-ceiling-tile',
    category: 'panel',
    name: 'High-NRC Ceiling Tile',
    description: 'NRC 0.90 mineral fiber ceiling tile (2x2 ft)',
    materialCostSAR: 85,
    laborCostSAR: 20,
    unit: 'each',
    installationHours: 0.1,
  },
  {
    id: 'panel-baffle',
    category: 'panel',
    name: 'Hanging Acoustic Baffle',
    description: 'Suspended acoustic baffle for open ceilings',
    materialCostSAR: 350,
    laborCostSAR: 75,
    unit: 'each',
    installationHours: 0.5,
  },
];

/**
 * Get treatment items by category
 */
export function getTreatmentsByCategory(category: TreatmentCategory): TreatmentCostItem[] {
  return TREATMENT_CATALOG.filter(item => item.category === category);
}

/**
 * Get a treatment item by ID
 */
export function getTreatmentById(id: string): TreatmentCostItem | undefined {
  return TREATMENT_CATALOG.find(item => item.id === id);
}

/**
 * Select appropriate silencer based on duct size
 */
export function selectSilencerBySize(ductSizeIn: number): TreatmentCostItem | undefined {
  return TREATMENT_CATALOG.find(item => 
    item.category === 'silencer' &&
    item.specifications?.minSize !== undefined &&
    item.specifications?.maxSize !== undefined &&
    ductSizeIn >= item.specifications.minSize &&
    ductSizeIn <= item.specifications.maxSize
  );
}

/**
 * Select appropriate isolators based on equipment weight
 */
export function selectIsolatorByWeight(weightLbs: number): TreatmentCostItem | undefined {
  return TREATMENT_CATALOG.find(item =>
    item.category === 'isolator' &&
    item.id.includes('spring') &&
    item.specifications?.minSize !== undefined &&
    item.specifications?.maxSize !== undefined &&
    weightLbs >= item.specifications.minSize &&
    weightLbs <= item.specifications.maxSize
  );
}

/**
 * Calculate duct lining area needed
 */
export function calculateLiningArea(ductWidthIn: number, ductHeightIn: number, lengthFt: number): number {
  // Perimeter in feet × length
  const perimeter = 2 * (ductWidthIn + ductHeightIn) / 12; // convert to feet
  return perimeter * lengthFt;
}

/**
 * Calculate complete cost breakdown for treatment items
 */
export function calculateTreatmentCost(
  lineItems: TreatmentLineItem[],
  contingencyPercent: number = 15
): CostBreakdown {
  const items = lineItems.map(li => {
    const item = getTreatmentById(li.itemId);
    if (!item) {
      throw new Error(`Treatment item not found: ${li.itemId}`);
    }

    const materialCost = item.materialCostSAR * li.quantity;
    const laborCost = item.laborCostSAR * li.quantity;
    
    return {
      item,
      quantity: li.quantity,
      size: li.size,
      materialCost,
      laborCost,
      totalCost: materialCost + laborCost,
    };
  });

  const subtotalMaterial = items.reduce((sum, i) => sum + i.materialCost, 0);
  const subtotalLabor = items.reduce((sum, i) => sum + i.laborCost, 0);
  const subtotal = subtotalMaterial + subtotalLabor;
  const contingencyAmount = subtotal * (contingencyPercent / 100);

  return {
    items,
    subtotalMaterial,
    subtotalLabor,
    contingencyPercent,
    contingencyAmount,
    grandTotal: subtotal + contingencyAmount,
  };
}

/**
 * Auto-estimate treatment costs based on zone acoustic analysis
 */
export interface ZoneRemediationEstimate {
  zoneId: string;
  zoneName: string;
  ncDelta: number;
  recommendedTreatments: TreatmentLineItem[];
  estimatedCost: number;
}

export function estimateZoneRemediation(
  zoneId: string,
  zoneName: string,
  ncDelta: number,
  ductSizeIn: number = 12,
  hasVibrationIssue: boolean = false
): ZoneRemediationEstimate {
  const treatments: TreatmentLineItem[] = [];

  if (ncDelta > 0) {
    // Add silencer if NC exceeds target by more than 3 dB
    if (ncDelta > 3) {
      const silencer = selectSilencerBySize(ductSizeIn);
      if (silencer) {
        treatments.push({ itemId: silencer.id, quantity: 1, size: ductSizeIn });
      }
    }

    // Add duct lining for moderate exceedance
    if (ncDelta > 5) {
      // Estimate 20 linear feet of lined duct
      const liningArea = calculateLiningArea(ductSizeIn, ductSizeIn, 20);
      treatments.push({ itemId: 'lining-1in', quantity: Math.ceil(liningArea) });
    }

    // Add additional treatment for severe exceedance
    if (ncDelta > 10) {
      treatments.push({ itemId: 'lining-2in', quantity: Math.ceil(calculateLiningArea(ductSizeIn, ductSizeIn, 10)) });
    }
  }

  // Add vibration isolation if needed
  if (hasVibrationIssue) {
    treatments.push({ itemId: 'isolator-spring-medium', quantity: 1 });
  }

  // Calculate cost
  let estimatedCost = 0;
  if (treatments.length > 0) {
    try {
      const breakdown = calculateTreatmentCost(treatments, 15);
      estimatedCost = breakdown.grandTotal;
    } catch {
      // Fallback estimate
      estimatedCost = ncDelta * 500; // Rough estimate: 500 SAR per dB reduction needed
    }
  }

  return {
    zoneId,
    zoneName,
    ncDelta,
    recommendedTreatments: treatments,
    estimatedCost,
  };
}

/**
 * Format currency for display
 */
export function formatCurrencySAR(amount: number): string {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Detailed zone estimate with itemized breakdown
 */
export interface DetailedZoneEstimate {
  zoneId: string;
  zoneName: string;
  spaceType: string;
  targetNC: number;
  estimatedNC: number;
  ncDelta: number;
  treatments: {
    category: TreatmentCategory;
    item: TreatmentCostItem;
    quantity: number;
    materialCost: number;
    laborCost: number;
    laborHours: number;
    totalCost: number;
    rationale: string;
  }[];
  costBreakdown: CostBreakdown;
  expectedNCReduction: number;
  estimatedFinalNC: number;
}

/**
 * Generate detailed zone estimate with itemized costs and expected outcomes
 */
export function generateDetailedZoneEstimate(
  zoneId: string,
  zoneName: string,
  spaceType: string,
  targetNC: number,
  estimatedNC: number,
  ncDelta: number,
  ductSizeIn: number = 12,
  includeVibration: boolean = false
): DetailedZoneEstimate {
  const treatments: DetailedZoneEstimate['treatments'] = [];
  let expectedNCReduction = 0;

  // Add silencer if NC exceeds target by more than 3 dB
  if (ncDelta > 3) {
    const silencer = selectSilencerBySize(ductSizeIn);
    if (silencer) {
      const quantity = 1;
      const materialCost = silencer.materialCostSAR * quantity;
      const laborCost = silencer.laborCostSAR * quantity;
      const laborHours = silencer.installationHours * quantity;
      
      treatments.push({
        category: 'silencer',
        item: silencer,
        quantity,
        materialCost,
        laborCost,
        laborHours,
        totalCost: materialCost + laborCost,
        rationale: `Inline silencer to reduce ductborne noise by 15-25 dB`,
      });
      expectedNCReduction += 8; // Conservative estimate of NC reduction from silencer
    }
  }

  // Add duct lining for moderate exceedance
  if (ncDelta > 5) {
    const lining = getTreatmentById('lining-1in');
    if (lining) {
      // Estimate 20 linear feet of lined duct
      const liningArea = calculateLiningArea(ductSizeIn, ductSizeIn, 20);
      const quantity = Math.ceil(liningArea);
      const materialCost = lining.materialCostSAR * quantity;
      const laborCost = lining.laborCostSAR * quantity;
      const laborHours = lining.installationHours * quantity;
      
      treatments.push({
        category: 'lining',
        item: lining,
        quantity,
        materialCost,
        laborCost,
        laborHours,
        totalCost: materialCost + laborCost,
        rationale: `1" fiberglass liner for 20 ft of ductwork (${quantity} sq-ft)`,
      });
      expectedNCReduction += 3;
    }
  }

  // Add 2" lining for severe exceedance
  if (ncDelta > 10) {
    const lining2in = getTreatmentById('lining-2in');
    if (lining2in) {
      const liningArea = calculateLiningArea(ductSizeIn, ductSizeIn, 10);
      const quantity = Math.ceil(liningArea);
      const materialCost = lining2in.materialCostSAR * quantity;
      const laborCost = lining2in.laborCostSAR * quantity;
      const laborHours = lining2in.installationHours * quantity;
      
      treatments.push({
        category: 'lining',
        item: lining2in,
        quantity,
        materialCost,
        laborCost,
        laborHours,
        totalCost: materialCost + laborCost,
        rationale: `2" fiberglass liner for additional 10 ft near terminals (${quantity} sq-ft)`,
      });
      expectedNCReduction += 4;
    }
  }

  // Add vibration isolation if requested
  if (includeVibration) {
    const isolator = getTreatmentById('isolator-spring-medium');
    if (isolator) {
      const quantity = 1;
      const materialCost = isolator.materialCostSAR * quantity;
      const laborCost = isolator.laborCostSAR * quantity;
      const laborHours = isolator.installationHours * quantity;
      
      treatments.push({
        category: 'isolator',
        item: isolator,
        quantity,
        materialCost,
        laborCost,
        laborHours,
        totalCost: materialCost + laborCost,
        rationale: `Spring isolators for nearby mechanical equipment`,
      });
      expectedNCReduction += 2;
    }
  }

  // Calculate cost breakdown
  const lineItems: TreatmentLineItem[] = treatments.map(t => ({
    itemId: t.item.id,
    quantity: t.quantity,
  }));

  let costBreakdown: CostBreakdown;
  try {
    costBreakdown = calculateTreatmentCost(lineItems, 15);
  } catch {
    costBreakdown = {
      items: [],
      subtotalMaterial: 0,
      subtotalLabor: 0,
      contingencyPercent: 15,
      contingencyAmount: 0,
      grandTotal: 0,
    };
  }

  const estimatedFinalNC = Math.max(targetNC, estimatedNC - expectedNCReduction);

  return {
    zoneId,
    zoneName,
    spaceType,
    targetNC,
    estimatedNC,
    ncDelta,
    treatments,
    costBreakdown,
    expectedNCReduction,
    estimatedFinalNC,
  };
}

/**
 * Calculate total labor hours for treatments
 */
export function calculateTotalLaborHours(treatments: TreatmentLineItem[]): number {
  return treatments.reduce((total, li) => {
    const item = getTreatmentById(li.itemId);
    if (!item) return total;
    return total + item.installationHours * li.quantity;
  }, 0);
}
