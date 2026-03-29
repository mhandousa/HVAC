// Treatment Package Optimizer
// Generates optimized treatment packages based on zones, budget, and performance requirements

import { ZoneAcousticData } from '@/hooks/useZoneAcousticAnalysis';
import { 
  TreatmentCostItem, 
  TREATMENT_CATALOG, 
  selectSilencerBySize,
  calculateLiningArea,
  getTreatmentById,
  formatCurrencySAR,
} from './acoustic-cost-calculations';
import { SILENCER_CATALOG, DUCT_MODIFICATIONS } from './acoustic-remediation-data';

export type PriorityMode = 'cost-effective' | 'balanced' | 'performance-first';
export type PackageTier = 'budget' | 'balanced' | 'premium';

export interface OptimizationConstraints {
  maxBudgetSAR: number;
  maxPressureDropIn: number;
  priorityMode: PriorityMode;
  includeLifecycleCosts: boolean;
  analysisYears: number;
  discountRate: number;
}

export interface PerformanceRequirements {
  targetNCDelta: number;
  minimumCompliance: number;
  sensitiveSpacesPriority: boolean;
  includeVibrationTreatment: boolean;
}

export interface RecommendedTreatment {
  treatmentId: string;
  name: string;
  category: 'silencer' | 'lining' | 'isolator' | 'panel';
  quantity: number;
  unitCost: number;
  totalCost: number;
  expectedAttenuation: number;
  pressureDrop: number;
  rationale: string;
}

export interface ZoneTreatmentPlan {
  zoneId: string;
  zoneName: string;
  spaceType: string;
  floorId: string;
  currentNC: number;
  targetNC: number;
  ncDelta: number;
  priority: number;
  treatments: RecommendedTreatment[];
  totalCost: number;
  expectedNCReduction: number;
  estimatedFinalNC: number;
  willBeCompliant: boolean;
}

export interface TreatmentPackage {
  id: string;
  tier: PackageTier;
  name: string;
  description: string;
  zones: ZoneTreatmentPlan[];
  totalCost: number;
  totalLifecycleCost: number;
  expectedCompliancePercent: number;
  totalPressureDrop: number;
  zonesAddressed: number;
  zonesFullyCompliant: number;
  avgNCReduction: number;
  costBreakdown: {
    silencers: number;
    lining: number;
    vibrationIsolation: number;
    panels: number;
  };
}

export interface TieredPackages {
  budget: TreatmentPackage;
  balanced: TreatmentPackage;
  premium: TreatmentPackage;
}

// Sensitive space types that get priority treatment
const SENSITIVE_SPACE_TYPES = [
  'executive office', 'private office', 'conference', 'conference room',
  'meeting room', 'auditorium', 'theater', 'library', 'hospital room',
  'patient room', 'operating room', 'classroom'
];

// Default cost per category for quick estimates
const CATEGORY_COSTS = {
  silencer: { budget: 850, balanced: 1200, premium: 2100 },
  lining: { budget: 1000, balanced: 1800, premium: 2500 },
  isolator: { budget: 800, balanced: 1400, premium: 2200 },
  panel: { budget: 500, balanced: 1000, premium: 1500 },
};

/**
 * Calculate zone priority score for treatment ordering
 */
export function calculateZonePriority(
  zone: ZoneAcousticData,
  sensitiveFirst: boolean
): number {
  let priority = zone.ncDelta * 10; // Base priority from NC delta
  
  // Boost priority for sensitive spaces
  if (sensitiveFirst) {
    const normalizedType = zone.spaceType.toLowerCase();
    if (SENSITIVE_SPACE_TYPES.some(st => normalizedType.includes(st))) {
      priority += 50;
    }
  }
  
  // Boost priority for exceeding zones
  if (zone.status === 'exceeds') {
    priority += 20;
  }
  
  return priority;
}

/**
 * Generate treatments for a zone based on tier
 */
function generateZoneTreatments(
  zone: ZoneAcousticData,
  tier: PackageTier,
  includeVibration: boolean,
  ductSize: number = 12
): { treatments: RecommendedTreatment[]; totalCost: number; ncReduction: number } {
  const treatments: RecommendedTreatment[] = [];
  let totalCost = 0;
  let ncReduction = 0;

  const delta = zone.ncDelta;

  // Tier-based treatment selection
  if (tier === 'budget') {
    // Minimal treatments - focus on high-impact, low-cost options
    if (delta > 5) {
      // Add basic duct lining
      const liningArea = calculateLiningArea(ductSize, ductSize, 15);
      const liningCost = liningArea * 60;
      treatments.push({
        treatmentId: 'lining-1in',
        name: '1" Duct Lining',
        category: 'lining',
        quantity: Math.ceil(liningArea),
        unitCost: 60,
        totalCost: liningCost,
        expectedAttenuation: 4,
        pressureDrop: 0.03,
        rationale: 'Cost-effective noise reduction for moderate exceedance',
      });
      totalCost += liningCost;
      ncReduction += 4;
    }
    
    if (delta > 8 && ncReduction < delta - 2) {
      // Add small silencer only if really needed
      const silencer = selectSilencerBySize(ductSize);
      if (silencer) {
        treatments.push({
          treatmentId: silencer.id,
          name: silencer.name,
          category: 'silencer',
          quantity: 1,
          unitCost: silencer.materialCostSAR + silencer.laborCostSAR,
          totalCost: silencer.materialCostSAR + silencer.laborCostSAR,
          expectedAttenuation: 6,
          pressureDrop: 0.15,
          rationale: 'Inline silencer for significant noise reduction',
        });
        totalCost += silencer.materialCostSAR + silencer.laborCostSAR;
        ncReduction += 6;
      }
    }
  } else if (tier === 'balanced') {
    // Standard treatments - good balance of cost and performance
    if (delta > 3) {
      const silencer = selectSilencerBySize(ductSize);
      if (silencer) {
        treatments.push({
          treatmentId: silencer.id,
          name: silencer.name,
          category: 'silencer',
          quantity: 1,
          unitCost: silencer.materialCostSAR + silencer.laborCostSAR,
          totalCost: silencer.materialCostSAR + silencer.laborCostSAR,
          expectedAttenuation: 8,
          pressureDrop: 0.20,
          rationale: 'Primary noise reduction through inline silencer',
        });
        totalCost += silencer.materialCostSAR + silencer.laborCostSAR;
        ncReduction += 8;
      }
    }
    
    if (delta > 6) {
      // Add duct lining for additional reduction
      const liningArea = calculateLiningArea(ductSize, ductSize, 20);
      const liningCost = liningArea * 85;
      treatments.push({
        treatmentId: 'lining-2in',
        name: '2" Duct Lining',
        category: 'lining',
        quantity: Math.ceil(liningArea),
        unitCost: 85,
        totalCost: liningCost,
        expectedAttenuation: 6,
        pressureDrop: 0.05,
        rationale: 'Enhanced lining for high-frequency attenuation',
      });
      totalCost += liningCost;
      ncReduction += 6;
    }
    
    if (includeVibration && zone.terminalUnits.some(u => u.unitType?.includes('fcu'))) {
      treatments.push({
        treatmentId: 'isolator-spring-medium',
        name: 'Spring Isolators (Medium Duty)',
        category: 'isolator',
        quantity: 1,
        unitCost: 1850,
        totalCost: 1850,
        expectedAttenuation: 3,
        pressureDrop: 0,
        rationale: 'Vibration isolation for FCU equipment',
      });
      totalCost += 1850;
      ncReduction += 3;
    }
  } else if (tier === 'premium') {
    // Maximum performance - best products and comprehensive treatment
    // Always add high-performance silencer
    const silencerSize = Math.min(ductSize + 2, 24);
    const silencer = selectSilencerBySize(silencerSize) || selectSilencerBySize(ductSize);
    if (silencer) {
      const upgradedCost = (silencer.materialCostSAR + silencer.laborCostSAR) * 1.4;
      treatments.push({
        treatmentId: silencer.id + '-premium',
        name: `${silencer.name} (High Performance)`,
        category: 'silencer',
        quantity: 1,
        unitCost: upgradedCost,
        totalCost: upgradedCost,
        expectedAttenuation: 12,
        pressureDrop: 0.25,
        rationale: 'Premium high-attenuation silencer for maximum noise reduction',
      });
      totalCost += upgradedCost;
      ncReduction += 12;
    }
    
    // Add 2" lining
    const liningArea = calculateLiningArea(ductSize, ductSize, 25);
    const liningCost = liningArea * 85;
    treatments.push({
      treatmentId: 'lining-2in',
      name: '2" Duct Lining',
      category: 'lining',
      quantity: Math.ceil(liningArea),
      unitCost: 85,
      totalCost: liningCost,
      expectedAttenuation: 7,
      pressureDrop: 0.05,
      rationale: 'Premium 2" lining for broadband attenuation',
    });
    totalCost += liningCost;
    ncReduction += 7;
    
    // Add lined plenum boot
    treatments.push({
      treatmentId: 'plenum-boot',
      name: 'Lined Plenum Boot',
      category: 'lining',
      quantity: zone.terminalUnits.length || 1,
      unitCost: 450,
      totalCost: 450 * (zone.terminalUnits.length || 1),
      expectedAttenuation: 5,
      pressureDrop: 0.05,
      rationale: 'Acoustic plenum at each diffuser connection',
    });
    totalCost += 450 * (zone.terminalUnits.length || 1);
    ncReduction += 5;
    
    // Always include vibration isolation for premium
    if (zone.terminalUnits.length > 0) {
      treatments.push({
        treatmentId: 'isolator-spring-medium',
        name: 'Spring Isolators (Medium Duty)',
        category: 'isolator',
        quantity: 1,
        unitCost: 1850,
        totalCost: 1850,
        expectedAttenuation: 3,
        pressureDrop: 0,
        rationale: 'Comprehensive vibration isolation for all equipment',
      });
      totalCost += 1850;
      ncReduction += 3;
    }
  }

  return { treatments, totalCost, ncReduction };
}

/**
 * Generate a single treatment package for a tier
 */
function generatePackageForTier(
  zones: ZoneAcousticData[],
  tier: PackageTier,
  constraints: OptimizationConstraints,
  requirements: PerformanceRequirements
): TreatmentPackage {
  const packageId = `pkg-${tier}-${Date.now()}`;
  
  // Sort zones by priority
  const prioritizedZones = [...zones]
    .filter(z => z.ncDelta > 0)
    .map(zone => ({
      zone,
      priority: calculateZonePriority(zone, requirements.sensitiveSpacesPriority),
    }))
    .sort((a, b) => b.priority - a.priority);

  const zonePlans: ZoneTreatmentPlan[] = [];
  let remainingBudget = constraints.maxBudgetSAR;
  let totalPressureDrop = 0;

  // Budget allocation multipliers
  const budgetMultiplier = tier === 'budget' ? 0.5 : tier === 'balanced' ? 0.8 : 1.2;
  const effectiveBudget = constraints.maxBudgetSAR * budgetMultiplier;

  for (const { zone, priority } of prioritizedZones) {
    // Generate treatments for this zone
    const { treatments, totalCost, ncReduction } = generateZoneTreatments(
      zone,
      tier,
      requirements.includeVibrationTreatment,
      12 // Default duct size
    );

    // Check budget constraints
    if (totalCost > remainingBudget && tier !== 'premium') {
      // Skip zone if over budget (except for premium which shows full cost)
      continue;
    }

    // Check pressure drop constraints
    const zonePressureDrop = treatments.reduce((sum, t) => sum + t.pressureDrop, 0);
    if (totalPressureDrop + zonePressureDrop > constraints.maxPressureDropIn && tier === 'budget') {
      continue;
    }

    const estimatedFinalNC = Math.max(zone.targetNC - 5, (zone.estimatedNC || zone.targetNC) - ncReduction);
    const willBeCompliant = estimatedFinalNC <= zone.targetNC;

    zonePlans.push({
      zoneId: zone.zoneId,
      zoneName: zone.zoneName,
      spaceType: zone.spaceType,
      floorId: zone.floorId,
      currentNC: zone.estimatedNC || zone.targetNC + zone.ncDelta,
      targetNC: zone.targetNC,
      ncDelta: zone.ncDelta,
      priority,
      treatments,
      totalCost,
      expectedNCReduction: ncReduction,
      estimatedFinalNC,
      willBeCompliant,
    });

    remainingBudget -= totalCost;
    totalPressureDrop += zonePressureDrop;
  }

  // Calculate package totals
  const totalCost = zonePlans.reduce((sum, z) => sum + z.totalCost, 0);
  const zonesFullyCompliant = zonePlans.filter(z => z.willBeCompliant).length;
  const totalZones = zones.filter(z => z.ncDelta > 0).length;
  const compliancePercent = totalZones > 0 ? Math.round((zonesFullyCompliant / totalZones) * 100) : 100;
  const avgNCReduction = zonePlans.length > 0 
    ? Math.round(zonePlans.reduce((sum, z) => sum + z.expectedNCReduction, 0) / zonePlans.length)
    : 0;

  // Calculate cost breakdown
  const costBreakdown = {
    silencers: zonePlans.reduce((sum, z) => 
      sum + z.treatments.filter(t => t.category === 'silencer').reduce((s, t) => s + t.totalCost, 0), 0),
    lining: zonePlans.reduce((sum, z) => 
      sum + z.treatments.filter(t => t.category === 'lining').reduce((s, t) => s + t.totalCost, 0), 0),
    vibrationIsolation: zonePlans.reduce((sum, z) => 
      sum + z.treatments.filter(t => t.category === 'isolator').reduce((s, t) => s + t.totalCost, 0), 0),
    panels: zonePlans.reduce((sum, z) => 
      sum + z.treatments.filter(t => t.category === 'panel').reduce((s, t) => s + t.totalCost, 0), 0),
  };

  // Lifecycle cost estimate (simplified: 25 year NPV)
  const annualMaintenance = totalCost * 0.02; // 2% annual maintenance
  let lifecycleCost = totalCost;
  if (constraints.includeLifecycleCosts) {
    for (let year = 1; year <= constraints.analysisYears; year++) {
      lifecycleCost += annualMaintenance / Math.pow(1 + constraints.discountRate / 100, year);
    }
  }

  const tierDescriptions = {
    budget: 'Essential treatments for critical zones only. Focuses on highest-impact, lowest-cost solutions.',
    balanced: 'Comprehensive coverage with cost-effective treatments. Best value for full compliance.',
    premium: 'Maximum performance with premium products. Exceeds target NC levels for optimal acoustics.',
  };

  const tierNames = {
    budget: 'Budget Package',
    balanced: 'Balanced Package',
    premium: 'Premium Package',
  };

  return {
    id: packageId,
    tier,
    name: tierNames[tier],
    description: tierDescriptions[tier],
    zones: zonePlans,
    totalCost,
    totalLifecycleCost: Math.round(lifecycleCost),
    expectedCompliancePercent: compliancePercent,
    totalPressureDrop,
    zonesAddressed: zonePlans.length,
    zonesFullyCompliant,
    avgNCReduction,
    costBreakdown,
  };
}

/**
 * Generate three tiered packages (Budget, Balanced, Premium)
 */
export function generateTieredPackages(
  zones: ZoneAcousticData[],
  constraints: OptimizationConstraints,
  requirements: PerformanceRequirements
): TieredPackages {
  return {
    budget: generatePackageForTier(zones, 'budget', constraints, requirements),
    balanced: generatePackageForTier(zones, 'balanced', constraints, requirements),
    premium: generatePackageForTier(zones, 'premium', constraints, requirements),
  };
}

/**
 * Generate optimized packages (main entry point)
 */
export function generateOptimizedPackages(
  zones: ZoneAcousticData[],
  constraints: OptimizationConstraints,
  requirements: PerformanceRequirements
): TreatmentPackage[] {
  const tiered = generateTieredPackages(zones, constraints, requirements);
  return [tiered.budget, tiered.balanced, tiered.premium];
}

/**
 * Default constraints
 */
export const DEFAULT_CONSTRAINTS: OptimizationConstraints = {
  maxBudgetSAR: 50000,
  maxPressureDropIn: 0.5,
  priorityMode: 'balanced',
  includeLifecycleCosts: false,
  analysisYears: 25,
  discountRate: 5,
};

/**
 * Default requirements
 */
export const DEFAULT_REQUIREMENTS: PerformanceRequirements = {
  targetNCDelta: 3,
  minimumCompliance: 80,
  sensitiveSpacesPriority: true,
  includeVibrationTreatment: false,
};
