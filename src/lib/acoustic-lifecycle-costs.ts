/**
 * Acoustic Treatment Lifecycle Cost Analysis
 * 
 * Provides comprehensive lifecycle cost modeling including:
 * - Maintenance costs over time
 * - Replacement intervals and costs
 * - Performance degradation tracking
 * - NPV and Annual Equivalent Cost comparisons
 */

import { TreatmentCategory, TreatmentCostItem, TREATMENT_CATALOG, formatCurrencySAR } from './acoustic-cost-calculations';

// ============================================================================
// Types
// ============================================================================

export interface LifecycleCharacteristics {
  treatmentCategory: TreatmentCategory;
  expectedLifespanYears: number;
  warrantyYears: number;
  annualMaintenanceCostPercent: number;  // % of initial material cost
  maintenanceIntervalYears: number;      // How often maintenance is performed
  inspectionIntervalYears: number;       // How often inspections occur
  inspectionCostSAR: number;             // Cost per inspection
  performanceDegradationPerYear: number; // % effectiveness loss per year
  maxDegradationPercent: number;         // % at which replacement is needed
  replacementCostMultiplier: number;     // Multiplier vs. initial install (usually < 1)
  disposalCostSAR: number;               // Cost to remove and dispose
}

export interface YearlyBreakdown {
  year: number;
  maintenance: number;
  inspection: number;
  replacement: number;
  cumulative: number;
  cumulativeNPV: number;
  performance: number;  // % of original effectiveness
  eventType: 'routine' | 'inspection' | 'replacement' | 'none';
}

export interface LifecycleCostResult {
  treatmentId: string;
  treatmentName: string;
  quantity: number;
  analysisYears: number;
  
  // Initial Costs
  initialCapitalCost: number;
  installationCost: number;
  totalInitialCost: number;
  
  // Recurring Costs
  totalMaintenanceCost: number;
  totalInspectionCost: number;
  
  // Replacement Costs
  replacementYears: number[];
  replacementCosts: number[];
  totalReplacementCost: number;
  
  // Performance
  avgPerformance: number;
  finalPerformance: number;
  
  // Summary Metrics
  totalLifecycleCost: number;
  npvLifecycleCost: number;
  annualEquivalentCost: number;
  costPerYear: number;
  
  // Timeline
  yearlyBreakdown: YearlyBreakdown[];
  
  // Lifecycle characteristics used
  characteristics: LifecycleCharacteristics;
}

export interface LifecycleComparisonResult {
  treatments: LifecycleCostResult[];
  analysisYears: number;
  discountRate: number;
  inflationRate: number;
  
  // Rankings
  lowestTotalCost: string;
  lowestNPV: string;
  lowestAnnualEquivalent: string;
  bestPerformance: string;
  
  // Comparison metrics
  maxCostDifference: number;
  maxNPVDifference: number;
}

export type MaintenanceScenario = 'minimal' | 'standard' | 'enhanced';

// ============================================================================
// Lifecycle Characteristics Database
// ============================================================================

export const LIFECYCLE_CHARACTERISTICS: Record<string, LifecycleCharacteristics> = {
  // Silencers
  'silencer-round-6': {
    treatmentCategory: 'silencer',
    expectedLifespanYears: 25,
    warrantyYears: 5,
    annualMaintenanceCostPercent: 1.0,
    maintenanceIntervalYears: 1,
    inspectionIntervalYears: 3,
    inspectionCostSAR: 150,
    performanceDegradationPerYear: 0.2,
    maxDegradationPercent: 15,
    replacementCostMultiplier: 0.85,
    disposalCostSAR: 100,
  },
  'silencer-round-8': {
    treatmentCategory: 'silencer',
    expectedLifespanYears: 25,
    warrantyYears: 5,
    annualMaintenanceCostPercent: 1.0,
    maintenanceIntervalYears: 1,
    inspectionIntervalYears: 3,
    inspectionCostSAR: 175,
    performanceDegradationPerYear: 0.2,
    maxDegradationPercent: 15,
    replacementCostMultiplier: 0.85,
    disposalCostSAR: 125,
  },
  'silencer-round-10': {
    treatmentCategory: 'silencer',
    expectedLifespanYears: 25,
    warrantyYears: 5,
    annualMaintenanceCostPercent: 1.0,
    maintenanceIntervalYears: 1,
    inspectionIntervalYears: 3,
    inspectionCostSAR: 200,
    performanceDegradationPerYear: 0.2,
    maxDegradationPercent: 15,
    replacementCostMultiplier: 0.85,
    disposalCostSAR: 150,
  },
  'silencer-round-12': {
    treatmentCategory: 'silencer',
    expectedLifespanYears: 25,
    warrantyYears: 5,
    annualMaintenanceCostPercent: 1.0,
    maintenanceIntervalYears: 1,
    inspectionIntervalYears: 3,
    inspectionCostSAR: 200,
    performanceDegradationPerYear: 0.2,
    maxDegradationPercent: 15,
    replacementCostMultiplier: 0.85,
    disposalCostSAR: 175,
  },
  'silencer-round-14': {
    treatmentCategory: 'silencer',
    expectedLifespanYears: 25,
    warrantyYears: 5,
    annualMaintenanceCostPercent: 1.0,
    maintenanceIntervalYears: 1,
    inspectionIntervalYears: 3,
    inspectionCostSAR: 225,
    performanceDegradationPerYear: 0.2,
    maxDegradationPercent: 15,
    replacementCostMultiplier: 0.85,
    disposalCostSAR: 200,
  },
  'silencer-round-16': {
    treatmentCategory: 'silencer',
    expectedLifespanYears: 25,
    warrantyYears: 5,
    annualMaintenanceCostPercent: 1.0,
    maintenanceIntervalYears: 1,
    inspectionIntervalYears: 3,
    inspectionCostSAR: 250,
    performanceDegradationPerYear: 0.2,
    maxDegradationPercent: 15,
    replacementCostMultiplier: 0.85,
    disposalCostSAR: 225,
  },
  'silencer-rect-12x12': {
    treatmentCategory: 'silencer',
    expectedLifespanYears: 25,
    warrantyYears: 5,
    annualMaintenanceCostPercent: 1.0,
    maintenanceIntervalYears: 1,
    inspectionIntervalYears: 3,
    inspectionCostSAR: 250,
    performanceDegradationPerYear: 0.2,
    maxDegradationPercent: 15,
    replacementCostMultiplier: 0.85,
    disposalCostSAR: 200,
  },
  'silencer-rect-18x18': {
    treatmentCategory: 'silencer',
    expectedLifespanYears: 25,
    warrantyYears: 5,
    annualMaintenanceCostPercent: 1.0,
    maintenanceIntervalYears: 1,
    inspectionIntervalYears: 3,
    inspectionCostSAR: 300,
    performanceDegradationPerYear: 0.2,
    maxDegradationPercent: 15,
    replacementCostMultiplier: 0.85,
    disposalCostSAR: 250,
  },
  'silencer-rect-24x24': {
    treatmentCategory: 'silencer',
    expectedLifespanYears: 25,
    warrantyYears: 5,
    annualMaintenanceCostPercent: 1.0,
    maintenanceIntervalYears: 1,
    inspectionIntervalYears: 3,
    inspectionCostSAR: 350,
    performanceDegradationPerYear: 0.2,
    maxDegradationPercent: 15,
    replacementCostMultiplier: 0.85,
    disposalCostSAR: 300,
  },
  
  // Duct Lining
  'lining-1in': {
    treatmentCategory: 'lining',
    expectedLifespanYears: 15,
    warrantyYears: 3,
    annualMaintenanceCostPercent: 0.5,
    maintenanceIntervalYears: 1,
    inspectionIntervalYears: 2,
    inspectionCostSAR: 100,
    performanceDegradationPerYear: 0.8,
    maxDegradationPercent: 25,
    replacementCostMultiplier: 0.9,
    disposalCostSAR: 50,
  },
  'lining-2in': {
    treatmentCategory: 'lining',
    expectedLifespanYears: 15,
    warrantyYears: 3,
    annualMaintenanceCostPercent: 0.5,
    maintenanceIntervalYears: 1,
    inspectionIntervalYears: 2,
    inspectionCostSAR: 100,
    performanceDegradationPerYear: 0.8,
    maxDegradationPercent: 25,
    replacementCostMultiplier: 0.9,
    disposalCostSAR: 75,
  },
  
  // Vibration Isolators
  'spring-isolator-500': {
    treatmentCategory: 'isolator',
    expectedLifespanYears: 20,
    warrantyYears: 5,
    annualMaintenanceCostPercent: 2.0,
    maintenanceIntervalYears: 1,
    inspectionIntervalYears: 1,
    inspectionCostSAR: 75,
    performanceDegradationPerYear: 0.3,
    maxDegradationPercent: 20,
    replacementCostMultiplier: 0.8,
    disposalCostSAR: 50,
  },
  'spring-isolator-1000': {
    treatmentCategory: 'isolator',
    expectedLifespanYears: 20,
    warrantyYears: 5,
    annualMaintenanceCostPercent: 2.0,
    maintenanceIntervalYears: 1,
    inspectionIntervalYears: 1,
    inspectionCostSAR: 100,
    performanceDegradationPerYear: 0.3,
    maxDegradationPercent: 20,
    replacementCostMultiplier: 0.8,
    disposalCostSAR: 75,
  },
  'spring-isolator-2000': {
    treatmentCategory: 'isolator',
    expectedLifespanYears: 20,
    warrantyYears: 5,
    annualMaintenanceCostPercent: 2.0,
    maintenanceIntervalYears: 1,
    inspectionIntervalYears: 1,
    inspectionCostSAR: 125,
    performanceDegradationPerYear: 0.3,
    maxDegradationPercent: 20,
    replacementCostMultiplier: 0.8,
    disposalCostSAR: 100,
  },
  'neoprene-pad-light': {
    treatmentCategory: 'isolator',
    expectedLifespanYears: 10,
    warrantyYears: 2,
    annualMaintenanceCostPercent: 1.0,
    maintenanceIntervalYears: 1,
    inspectionIntervalYears: 1,
    inspectionCostSAR: 50,
    performanceDegradationPerYear: 1.5,
    maxDegradationPercent: 30,
    replacementCostMultiplier: 0.95,
    disposalCostSAR: 25,
  },
  'neoprene-pad-medium': {
    treatmentCategory: 'isolator',
    expectedLifespanYears: 10,
    warrantyYears: 2,
    annualMaintenanceCostPercent: 1.0,
    maintenanceIntervalYears: 1,
    inspectionIntervalYears: 1,
    inspectionCostSAR: 50,
    performanceDegradationPerYear: 1.5,
    maxDegradationPercent: 30,
    replacementCostMultiplier: 0.95,
    disposalCostSAR: 30,
  },
  'neoprene-pad-heavy': {
    treatmentCategory: 'isolator',
    expectedLifespanYears: 10,
    warrantyYears: 2,
    annualMaintenanceCostPercent: 1.0,
    maintenanceIntervalYears: 1,
    inspectionIntervalYears: 1,
    inspectionCostSAR: 50,
    performanceDegradationPerYear: 1.5,
    maxDegradationPercent: 30,
    replacementCostMultiplier: 0.95,
    disposalCostSAR: 35,
  },
  'inertia-base-small': {
    treatmentCategory: 'isolator',
    expectedLifespanYears: 30,
    warrantyYears: 10,
    annualMaintenanceCostPercent: 0.5,
    maintenanceIntervalYears: 2,
    inspectionIntervalYears: 3,
    inspectionCostSAR: 150,
    performanceDegradationPerYear: 0.1,
    maxDegradationPercent: 10,
    replacementCostMultiplier: 0.7,
    disposalCostSAR: 200,
  },
  'inertia-base-medium': {
    treatmentCategory: 'isolator',
    expectedLifespanYears: 30,
    warrantyYears: 10,
    annualMaintenanceCostPercent: 0.5,
    maintenanceIntervalYears: 2,
    inspectionIntervalYears: 3,
    inspectionCostSAR: 200,
    performanceDegradationPerYear: 0.1,
    maxDegradationPercent: 10,
    replacementCostMultiplier: 0.7,
    disposalCostSAR: 300,
  },
  'inertia-base-large': {
    treatmentCategory: 'isolator',
    expectedLifespanYears: 30,
    warrantyYears: 10,
    annualMaintenanceCostPercent: 0.5,
    maintenanceIntervalYears: 2,
    inspectionIntervalYears: 3,
    inspectionCostSAR: 250,
    performanceDegradationPerYear: 0.1,
    maxDegradationPercent: 10,
    replacementCostMultiplier: 0.7,
    disposalCostSAR: 400,
  },
  
  // Acoustic Panels
  'acoustic-panel-fabric': {
    treatmentCategory: 'panel',
    expectedLifespanYears: 20,
    warrantyYears: 5,
    annualMaintenanceCostPercent: 3.0,
    maintenanceIntervalYears: 1,
    inspectionIntervalYears: 2,
    inspectionCostSAR: 75,
    performanceDegradationPerYear: 0.5,
    maxDegradationPercent: 20,
    replacementCostMultiplier: 0.9,
    disposalCostSAR: 30,
  },
  'acoustic-panel-perforated': {
    treatmentCategory: 'panel',
    expectedLifespanYears: 25,
    warrantyYears: 7,
    annualMaintenanceCostPercent: 2.0,
    maintenanceIntervalYears: 1,
    inspectionIntervalYears: 3,
    inspectionCostSAR: 100,
    performanceDegradationPerYear: 0.3,
    maxDegradationPercent: 15,
    replacementCostMultiplier: 0.85,
    disposalCostSAR: 50,
  },
  'acoustic-ceiling-tiles': {
    treatmentCategory: 'panel',
    expectedLifespanYears: 12,
    warrantyYears: 3,
    annualMaintenanceCostPercent: 2.0,
    maintenanceIntervalYears: 1,
    inspectionIntervalYears: 1,
    inspectionCostSAR: 50,
    performanceDegradationPerYear: 1.0,
    maxDegradationPercent: 25,
    replacementCostMultiplier: 0.95,
    disposalCostSAR: 25,
  },
};

// Default characteristics for unknown treatments
const DEFAULT_CHARACTERISTICS: Record<TreatmentCategory, LifecycleCharacteristics> = {
  silencer: {
    treatmentCategory: 'silencer',
    expectedLifespanYears: 25,
    warrantyYears: 5,
    annualMaintenanceCostPercent: 1.0,
    maintenanceIntervalYears: 1,
    inspectionIntervalYears: 3,
    inspectionCostSAR: 200,
    performanceDegradationPerYear: 0.2,
    maxDegradationPercent: 15,
    replacementCostMultiplier: 0.85,
    disposalCostSAR: 175,
  },
  lining: {
    treatmentCategory: 'lining',
    expectedLifespanYears: 15,
    warrantyYears: 3,
    annualMaintenanceCostPercent: 0.5,
    maintenanceIntervalYears: 1,
    inspectionIntervalYears: 2,
    inspectionCostSAR: 100,
    performanceDegradationPerYear: 0.8,
    maxDegradationPercent: 25,
    replacementCostMultiplier: 0.9,
    disposalCostSAR: 60,
  },
  isolator: {
    treatmentCategory: 'isolator',
    expectedLifespanYears: 18,
    warrantyYears: 5,
    annualMaintenanceCostPercent: 1.5,
    maintenanceIntervalYears: 1,
    inspectionIntervalYears: 1,
    inspectionCostSAR: 75,
    performanceDegradationPerYear: 0.5,
    maxDegradationPercent: 25,
    replacementCostMultiplier: 0.85,
    disposalCostSAR: 75,
  },
  panel: {
    treatmentCategory: 'panel',
    expectedLifespanYears: 18,
    warrantyYears: 5,
    annualMaintenanceCostPercent: 2.5,
    maintenanceIntervalYears: 1,
    inspectionIntervalYears: 2,
    inspectionCostSAR: 75,
    performanceDegradationPerYear: 0.6,
    maxDegradationPercent: 20,
    replacementCostMultiplier: 0.9,
    disposalCostSAR: 35,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get lifecycle characteristics for a treatment
 */
export function getLifecycleCharacteristics(treatmentId: string, category: TreatmentCategory): LifecycleCharacteristics {
  return LIFECYCLE_CHARACTERISTICS[treatmentId] || DEFAULT_CHARACTERISTICS[category];
}

/**
 * Adjust characteristics based on maintenance scenario
 */
export function adjustForMaintenanceScenario(
  characteristics: LifecycleCharacteristics,
  scenario: MaintenanceScenario
): LifecycleCharacteristics {
  switch (scenario) {
    case 'minimal':
      return {
        ...characteristics,
        annualMaintenanceCostPercent: characteristics.annualMaintenanceCostPercent * 0.5,
        inspectionIntervalYears: characteristics.inspectionIntervalYears * 2,
        performanceDegradationPerYear: characteristics.performanceDegradationPerYear * 1.5,
        expectedLifespanYears: Math.round(characteristics.expectedLifespanYears * 0.75),
      };
    case 'enhanced':
      return {
        ...characteristics,
        annualMaintenanceCostPercent: characteristics.annualMaintenanceCostPercent * 1.5,
        inspectionIntervalYears: Math.max(1, Math.floor(characteristics.inspectionIntervalYears * 0.5)),
        performanceDegradationPerYear: characteristics.performanceDegradationPerYear * 0.6,
        expectedLifespanYears: Math.round(characteristics.expectedLifespanYears * 1.25),
      };
    case 'standard':
    default:
      return characteristics;
  }
}

/**
 * Calculate Net Present Value discount factor
 */
function npvFactor(rate: number, year: number): number {
  return 1 / Math.pow(1 + rate, year);
}

/**
 * Calculate Annual Equivalent Cost from NPV
 */
function calculateAnnualEquivalent(npv: number, rate: number, years: number): number {
  if (rate === 0) return npv / years;
  const factor = (rate * Math.pow(1 + rate, years)) / (Math.pow(1 + rate, years) - 1);
  return npv * factor;
}

/**
 * Apply inflation to a cost
 */
function applyInflation(cost: number, inflationRate: number, years: number): number {
  return cost * Math.pow(1 + inflationRate, years);
}

// ============================================================================
// Main Calculation Functions
// ============================================================================

/**
 * Calculate comprehensive lifecycle cost for a single treatment
 */
export function calculateLifecycleCost(
  treatment: TreatmentCostItem,
  quantity: number,
  analysisYears: number,
  discountRate: number,
  inflationRate: number = 0.03,
  scenario: MaintenanceScenario = 'standard'
): LifecycleCostResult {
  // Get and adjust characteristics
  const baseCharacteristics = getLifecycleCharacteristics(treatment.id, treatment.category);
  const characteristics = adjustForMaintenanceScenario(baseCharacteristics, scenario);
  
  // Calculate initial costs
  const initialCapitalCost = treatment.materialCostSAR * quantity;
  const installationCost = treatment.laborCostSAR * quantity;
  const totalInitialCost = initialCapitalCost + installationCost;
  
  // Track costs and performance over time
  const yearlyBreakdown: YearlyBreakdown[] = [];
  let cumulativeCost = totalInitialCost;
  let cumulativeNPV = totalInitialCost; // Year 0, no discount
  let totalMaintenanceCost = 0;
  let totalInspectionCost = 0;
  let totalReplacementCost = 0;
  const replacementYears: number[] = [];
  const replacementCosts: number[] = [];
  
  let currentPerformance = 100;
  let performanceSum = 100;
  let lastReplacementYear = 0;
  
  for (let year = 1; year <= analysisYears; year++) {
    let yearMaintenance = 0;
    let yearInspection = 0;
    let yearReplacement = 0;
    let eventType: YearlyBreakdown['eventType'] = 'none';
    
    // Calculate years since last replacement
    const yearsSinceReplacement = year - lastReplacementYear;
    
    // Apply performance degradation
    currentPerformance = Math.max(
      100 - characteristics.maxDegradationPercent,
      100 - (yearsSinceReplacement * characteristics.performanceDegradationPerYear)
    );
    
    // Check if replacement is needed (lifespan exceeded or performance too low)
    const needsReplacement = 
      yearsSinceReplacement >= characteristics.expectedLifespanYears ||
      currentPerformance <= (100 - characteristics.maxDegradationPercent);
    
    if (needsReplacement) {
      // Calculate replacement cost (with inflation)
      const baseReplacementCost = (
        treatment.materialCostSAR * characteristics.replacementCostMultiplier +
        treatment.laborCostSAR * 0.8 + // Slightly less labor for replacement
        characteristics.disposalCostSAR
      ) * quantity;
      
      yearReplacement = applyInflation(baseReplacementCost, inflationRate, year);
      replacementYears.push(year);
      replacementCosts.push(yearReplacement);
      totalReplacementCost += yearReplacement;
      eventType = 'replacement';
      
      // Reset performance and tracking
      currentPerformance = 100;
      lastReplacementYear = year;
    } else {
      // Annual maintenance (with inflation)
      if (year % characteristics.maintenanceIntervalYears === 0) {
        const baseMaintenance = initialCapitalCost * (characteristics.annualMaintenanceCostPercent / 100);
        yearMaintenance = applyInflation(baseMaintenance, inflationRate, year);
        totalMaintenanceCost += yearMaintenance;
        eventType = 'routine';
      }
      
      // Inspection (with inflation)
      if (year % characteristics.inspectionIntervalYears === 0) {
        const baseInspection = characteristics.inspectionCostSAR * quantity;
        yearInspection = applyInflation(baseInspection, inflationRate, year);
        totalInspectionCost += yearInspection;
        if (eventType === 'none') eventType = 'inspection';
      }
    }
    
    // Update cumulative totals
    const yearTotal = yearMaintenance + yearInspection + yearReplacement;
    cumulativeCost += yearTotal;
    cumulativeNPV += yearTotal * npvFactor(discountRate, year);
    performanceSum += currentPerformance;
    
    yearlyBreakdown.push({
      year,
      maintenance: yearMaintenance,
      inspection: yearInspection,
      replacement: yearReplacement,
      cumulative: cumulativeCost,
      cumulativeNPV,
      performance: currentPerformance,
      eventType,
    });
  }
  
  const totalLifecycleCost = cumulativeCost;
  const npvLifecycleCost = cumulativeNPV;
  const avgPerformance = performanceSum / (analysisYears + 1);
  
  return {
    treatmentId: treatment.id,
    treatmentName: treatment.name,
    quantity,
    analysisYears,
    initialCapitalCost,
    installationCost,
    totalInitialCost,
    totalMaintenanceCost,
    totalInspectionCost,
    replacementYears,
    replacementCosts,
    totalReplacementCost,
    avgPerformance,
    finalPerformance: currentPerformance,
    totalLifecycleCost,
    npvLifecycleCost,
    annualEquivalentCost: calculateAnnualEquivalent(npvLifecycleCost, discountRate, analysisYears),
    costPerYear: totalLifecycleCost / analysisYears,
    yearlyBreakdown,
    characteristics,
  };
}

/**
 * Compare lifecycle costs across multiple treatments
 */
export function compareLifecycleCosts(
  treatments: { treatment: TreatmentCostItem; quantity: number }[],
  analysisYears: number,
  discountRate: number,
  inflationRate: number = 0.03,
  scenario: MaintenanceScenario = 'standard'
): LifecycleComparisonResult {
  const results = treatments.map(({ treatment, quantity }) =>
    calculateLifecycleCost(treatment, quantity, analysisYears, discountRate, inflationRate, scenario)
  );
  
  // Find best performers
  const sortedByTotal = [...results].sort((a, b) => a.totalLifecycleCost - b.totalLifecycleCost);
  const sortedByNPV = [...results].sort((a, b) => a.npvLifecycleCost - b.npvLifecycleCost);
  const sortedByAEC = [...results].sort((a, b) => a.annualEquivalentCost - b.annualEquivalentCost);
  const sortedByPerformance = [...results].sort((a, b) => b.avgPerformance - a.avgPerformance);
  
  return {
    treatments: results,
    analysisYears,
    discountRate,
    inflationRate,
    lowestTotalCost: sortedByTotal[0]?.treatmentId || '',
    lowestNPV: sortedByNPV[0]?.treatmentId || '',
    lowestAnnualEquivalent: sortedByAEC[0]?.treatmentId || '',
    bestPerformance: sortedByPerformance[0]?.treatmentId || '',
    maxCostDifference: (sortedByTotal[sortedByTotal.length - 1]?.totalLifecycleCost || 0) - (sortedByTotal[0]?.totalLifecycleCost || 0),
    maxNPVDifference: (sortedByNPV[sortedByNPV.length - 1]?.npvLifecycleCost || 0) - (sortedByNPV[0]?.npvLifecycleCost || 0),
  };
}

/**
 * Get all treatments from catalog with lifecycle info
 */
export function getTreatmentsWithLifecycleInfo(): (TreatmentCostItem & { lifecycle: LifecycleCharacteristics })[] {
  return TREATMENT_CATALOG.map(treatment => ({
    ...treatment,
    lifecycle: getLifecycleCharacteristics(treatment.id, treatment.category),
  }));
}

/**
 * Calculate replacement break-even year
 * The year at which cumulative maintenance exceeds replacement cost
 */
export function calculateReplacementBreakeven(
  treatment: TreatmentCostItem,
  quantity: number,
  discountRate: number
): number {
  const characteristics = getLifecycleCharacteristics(treatment.id, treatment.category);
  const initialCost = treatment.materialCostSAR * quantity;
  const replacementCost = (
    treatment.materialCostSAR * characteristics.replacementCostMultiplier +
    treatment.laborCostSAR * 0.8 +
    characteristics.disposalCostSAR
  ) * quantity;
  
  let cumulativeMaintenance = 0;
  for (let year = 1; year <= 50; year++) {
    const annualMaintenance = initialCost * (characteristics.annualMaintenanceCostPercent / 100);
    const inspection = year % characteristics.inspectionIntervalYears === 0 
      ? characteristics.inspectionCostSAR * quantity 
      : 0;
    cumulativeMaintenance += (annualMaintenance + inspection) * npvFactor(discountRate, year);
    
    if (cumulativeMaintenance >= replacementCost * npvFactor(discountRate, year)) {
      return year;
    }
  }
  
  return -1; // Never breaks even (replacement is always cheaper)
}

// Re-export utility
export { formatCurrencySAR };
