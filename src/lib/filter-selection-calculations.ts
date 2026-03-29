// Filter Selection Calculations Library
// Provides sizing, selection scoring, and catalog data for air filters

export type FilterType = 'pleated' | 'bag' | 'rigid' | 'hepa' | 'carbon' | 'electrostatic';
export type FilterPosition = 'prefilter' | 'final' | 'hepa' | 'carbon';

export interface FilterRequirements {
  designCfm: number;
  filterPosition: FilterPosition;
  targetMervRating?: number;
  maxCleanPressureDropIn?: number;
  maxFaceVelocityFpm?: number;
  spaceType?: string;
  dustLoadFactor?: number; // 1.0 = normal, 1.5 = high dust (Saudi)
}

export interface FilterCatalogItem {
  id: string;
  manufacturer: string;
  model: string;
  filterType: FilterType;
  mervRating: number;
  nominalSize: string;
  widthIn: number;
  heightIn: number;
  depthIn: number;
  faceAreaSqFt: number;
  ratedCfm: number;
  cleanPressureDropIn: number;
  dirtyPressureDropIn: number;
  finalPressureDropIn: number;
  dustHoldingCapacityG: number;
  efficiencyPercent: number;
  replacementIntervalMonths: number;
  listPriceSar: number;
}

export interface FilterSelectionResult {
  selectedFilter: FilterCatalogItem;
  quantity: number;
  fitScore: number;
  operatingPoint: {
    faceVelocity: number;
    cleanPressureDrop: number;
    annualEnergyCostSar: number;
    annualReplacementCostSar: number;
    totalAnnualCostSar: number;
  };
  alternates: FilterCatalogItem[];
  warnings: string[];
}

// Filter catalog data - representative samples
export const FILTER_CATALOG: FilterCatalogItem[] = [
  // Pleated Filters - MERV 8 (Prefilter)
  { id: 'pl-m8-20x20x2', manufacturer: 'Camfil', model: 'Farr 30/30', filterType: 'pleated', mervRating: 8, nominalSize: '20x20x2', widthIn: 20, heightIn: 20, depthIn: 2, faceAreaSqFt: 2.78, ratedCfm: 1000, cleanPressureDropIn: 0.25, dirtyPressureDropIn: 0.75, finalPressureDropIn: 1.0, dustHoldingCapacityG: 180, efficiencyPercent: 70, replacementIntervalMonths: 3, listPriceSar: 45 },
  { id: 'pl-m8-24x24x2', manufacturer: 'Camfil', model: 'Farr 30/30', filterType: 'pleated', mervRating: 8, nominalSize: '24x24x2', widthIn: 24, heightIn: 24, depthIn: 2, faceAreaSqFt: 4.0, ratedCfm: 1500, cleanPressureDropIn: 0.25, dirtyPressureDropIn: 0.75, finalPressureDropIn: 1.0, dustHoldingCapacityG: 260, efficiencyPercent: 70, replacementIntervalMonths: 3, listPriceSar: 55 },
  { id: 'pl-m8-24x24x4', manufacturer: 'AAF', model: 'PerfectPleat', filterType: 'pleated', mervRating: 8, nominalSize: '24x24x4', widthIn: 24, heightIn: 24, depthIn: 4, faceAreaSqFt: 4.0, ratedCfm: 2000, cleanPressureDropIn: 0.20, dirtyPressureDropIn: 0.65, finalPressureDropIn: 0.85, dustHoldingCapacityG: 400, efficiencyPercent: 75, replacementIntervalMonths: 4, listPriceSar: 75 },
  
  // Pleated Filters - MERV 11
  { id: 'pl-m11-20x20x2', manufacturer: 'Camfil', model: 'Farr 30/30', filterType: 'pleated', mervRating: 11, nominalSize: '20x20x2', widthIn: 20, heightIn: 20, depthIn: 2, faceAreaSqFt: 2.78, ratedCfm: 1000, cleanPressureDropIn: 0.32, dirtyPressureDropIn: 0.85, finalPressureDropIn: 1.0, dustHoldingCapacityG: 150, efficiencyPercent: 85, replacementIntervalMonths: 3, listPriceSar: 65 },
  { id: 'pl-m11-24x24x2', manufacturer: 'Camfil', model: 'Farr 30/30', filterType: 'pleated', mervRating: 11, nominalSize: '24x24x2', widthIn: 24, heightIn: 24, depthIn: 2, faceAreaSqFt: 4.0, ratedCfm: 1500, cleanPressureDropIn: 0.32, dirtyPressureDropIn: 0.85, finalPressureDropIn: 1.0, dustHoldingCapacityG: 220, efficiencyPercent: 85, replacementIntervalMonths: 3, listPriceSar: 80 },
  
  // Bag Filters - MERV 11-14 (Final filters)
  { id: 'bag-m11-24x24x15', manufacturer: 'Camfil', model: 'Hi-Flo ES', filterType: 'bag', mervRating: 11, nominalSize: '24x24x15', widthIn: 24, heightIn: 24, depthIn: 15, faceAreaSqFt: 4.0, ratedCfm: 2000, cleanPressureDropIn: 0.35, dirtyPressureDropIn: 0.90, finalPressureDropIn: 1.0, dustHoldingCapacityG: 450, efficiencyPercent: 85, replacementIntervalMonths: 9, listPriceSar: 180 },
  { id: 'bag-m13-24x24x15', manufacturer: 'Camfil', model: 'Hi-Flo ES', filterType: 'bag', mervRating: 13, nominalSize: '24x24x15', widthIn: 24, heightIn: 24, depthIn: 15, faceAreaSqFt: 4.0, ratedCfm: 2000, cleanPressureDropIn: 0.45, dirtyPressureDropIn: 1.0, finalPressureDropIn: 1.25, dustHoldingCapacityG: 400, efficiencyPercent: 90, replacementIntervalMonths: 9, listPriceSar: 220 },
  { id: 'bag-m14-24x24x22', manufacturer: 'AAF', model: 'DriPak', filterType: 'bag', mervRating: 14, nominalSize: '24x24x22', widthIn: 24, heightIn: 24, depthIn: 22, faceAreaSqFt: 4.0, ratedCfm: 2000, cleanPressureDropIn: 0.50, dirtyPressureDropIn: 1.1, finalPressureDropIn: 1.5, dustHoldingCapacityG: 500, efficiencyPercent: 95, replacementIntervalMonths: 12, listPriceSar: 280 },
  
  // Rigid Box Filters - MERV 13-15
  { id: 'rig-m13-24x24x12', manufacturer: 'Camfil', model: 'Opakfil', filterType: 'rigid', mervRating: 13, nominalSize: '24x24x12', widthIn: 24, heightIn: 24, depthIn: 12, faceAreaSqFt: 4.0, ratedCfm: 1800, cleanPressureDropIn: 0.42, dirtyPressureDropIn: 0.95, finalPressureDropIn: 1.2, dustHoldingCapacityG: 550, efficiencyPercent: 92, replacementIntervalMonths: 12, listPriceSar: 320 },
  { id: 'rig-m15-24x24x12', manufacturer: 'Camfil', model: 'Opakfil', filterType: 'rigid', mervRating: 15, nominalSize: '24x24x12', widthIn: 24, heightIn: 24, depthIn: 12, faceAreaSqFt: 4.0, ratedCfm: 1600, cleanPressureDropIn: 0.55, dirtyPressureDropIn: 1.1, finalPressureDropIn: 1.5, dustHoldingCapacityG: 480, efficiencyPercent: 97, replacementIntervalMonths: 12, listPriceSar: 380 },
  
  // HEPA Filters - MERV 17+
  { id: 'hepa-h13-24x24x12', manufacturer: 'Camfil', model: 'Absolute', filterType: 'hepa', mervRating: 17, nominalSize: '24x24x12', widthIn: 24, heightIn: 24, depthIn: 12, faceAreaSqFt: 4.0, ratedCfm: 1000, cleanPressureDropIn: 0.85, dirtyPressureDropIn: 1.5, finalPressureDropIn: 2.0, dustHoldingCapacityG: 300, efficiencyPercent: 99.97, replacementIntervalMonths: 24, listPriceSar: 850 },
  { id: 'hepa-h14-24x24x12', manufacturer: 'AAF', model: 'MEGAcel', filterType: 'hepa', mervRating: 18, nominalSize: '24x24x12', widthIn: 24, heightIn: 24, depthIn: 12, faceAreaSqFt: 4.0, ratedCfm: 900, cleanPressureDropIn: 0.95, dirtyPressureDropIn: 1.6, finalPressureDropIn: 2.2, dustHoldingCapacityG: 280, efficiencyPercent: 99.995, replacementIntervalMonths: 24, listPriceSar: 1100 },
  
  // Carbon Filters
  { id: 'carb-24x24x2', manufacturer: 'Camfil', model: 'CamCarb', filterType: 'carbon', mervRating: 8, nominalSize: '24x24x2', widthIn: 24, heightIn: 24, depthIn: 2, faceAreaSqFt: 4.0, ratedCfm: 1200, cleanPressureDropIn: 0.30, dirtyPressureDropIn: 0.45, finalPressureDropIn: 0.6, dustHoldingCapacityG: 0, efficiencyPercent: 95, replacementIntervalMonths: 6, listPriceSar: 250 },
];

// MERV rating recommendations by space type
export const MERV_RECOMMENDATIONS: Record<string, { prefilter: number; final: number }> = {
  'office': { prefilter: 8, final: 11 },
  'retail': { prefilter: 8, final: 11 },
  'school': { prefilter: 8, final: 13 },
  'hospital': { prefilter: 11, final: 15 },
  'laboratory': { prefilter: 11, final: 14 },
  'cleanroom': { prefilter: 13, final: 17 },
  'datacenter': { prefilter: 8, final: 13 },
  'industrial': { prefilter: 8, final: 11 },
  'residential': { prefilter: 8, final: 11 },
  'restaurant': { prefilter: 8, final: 13 },
};

/**
 * Calculate face velocity at operating conditions
 */
export function calculateFaceVelocity(cfm: number, faceAreaSqFt: number): number {
  if (faceAreaSqFt === 0) return 0;
  return cfm / faceAreaSqFt;
}

/**
 * Calculate pressure drop at operating conditions
 */
export function calculateOperatingPressureDrop(
  catalogPressureDrop: number,
  catalogCfm: number,
  operatingCfm: number
): number {
  // Pressure drop varies with velocity squared
  const velocityRatio = operatingCfm / catalogCfm;
  return catalogPressureDrop * velocityRatio * velocityRatio;
}

/**
 * Calculate annual energy cost from filter pressure drop
 */
export function calculateAnnualEnergyCost(
  pressureDropIn: number,
  cfm: number,
  electricityCostSarPerKwh: number = 0.18,
  operatingHoursPerYear: number = 8760,
  fanEfficiency: number = 0.65
): number {
  // Convert pressure drop to pascals
  const pressureDropPa = pressureDropIn * 249.089;
  
  // Power = (CFM × ΔP) / (6356 × η)
  const powerKw = (cfm * pressureDropPa) / (1000 * fanEfficiency * 6356);
  
  // Average pressure drop over filter life (clean to final)
  const averagePowerKw = powerKw * 0.75; // Assume 75% of final
  
  return averagePowerKw * operatingHoursPerYear * electricityCostSarPerKwh;
}

/**
 * Calculate filter quantity needed for design airflow
 */
export function calculateFilterQuantity(designCfm: number, filterRatedCfm: number): number {
  return Math.ceil(designCfm / filterRatedCfm);
}

/**
 * Select best filter from catalog
 */
export function selectFilter(requirements: FilterRequirements): FilterSelectionResult | null {
  const { 
    designCfm, 
    filterPosition, 
    targetMervRating, 
    maxCleanPressureDropIn = 0.5,
    maxFaceVelocityFpm = 500,
    dustLoadFactor = 1.0
  } = requirements;
  
  // Determine minimum MERV rating
  let minMerv = targetMervRating || 8;
  if (!targetMervRating && requirements.spaceType) {
    const rec = MERV_RECOMMENDATIONS[requirements.spaceType.toLowerCase()];
    if (rec) {
      minMerv = filterPosition === 'prefilter' ? rec.prefilter : rec.final;
    }
  }
  
  // Filter catalog by position and MERV
  let candidates = FILTER_CATALOG.filter(f => {
    if (filterPosition === 'prefilter') {
      return f.filterType === 'pleated' && f.mervRating >= minMerv && f.mervRating <= 11;
    } else if (filterPosition === 'final') {
      return (f.filterType === 'bag' || f.filterType === 'rigid') && f.mervRating >= minMerv;
    } else if (filterPosition === 'hepa') {
      return f.filterType === 'hepa';
    } else if (filterPosition === 'carbon') {
      return f.filterType === 'carbon';
    }
    return f.mervRating >= minMerv;
  });
  
  if (candidates.length === 0) return null;
  
  // Score each candidate
  const scored = candidates.map(filter => {
    let score = 100;
    const warnings: string[] = [];
    
    // Calculate quantity needed
    const quantity = calculateFilterQuantity(designCfm, filter.ratedCfm);
    const totalFaceArea = filter.faceAreaSqFt * quantity;
    const faceVelocity = designCfm / totalFaceArea;
    
    // Pressure drop at operating conditions
    const operatingPd = calculateOperatingPressureDrop(
      filter.cleanPressureDropIn,
      filter.ratedCfm,
      designCfm / quantity
    );
    
    // Face velocity check (25% weight)
    if (faceVelocity > maxFaceVelocityFpm) {
      score -= 25 * (faceVelocity - maxFaceVelocityFpm) / maxFaceVelocityFpm;
      warnings.push(`Face velocity ${faceVelocity.toFixed(0)} FPM exceeds ${maxFaceVelocityFpm} FPM`);
    }
    
    // Pressure drop check (25% weight)
    if (operatingPd > maxCleanPressureDropIn) {
      score -= 25 * (operatingPd - maxCleanPressureDropIn) / maxCleanPressureDropIn;
      warnings.push(`Pressure drop ${operatingPd.toFixed(2)}" exceeds ${maxCleanPressureDropIn}"`);
    }
    
    // MERV rating match (20% weight)
    if (filter.mervRating < minMerv) {
      score -= 20;
      warnings.push(`MERV ${filter.mervRating} below required ${minMerv}`);
    }
    
    // Dust holding capacity with Saudi adjustment (15% weight)
    const adjustedReplacement = filter.replacementIntervalMonths / dustLoadFactor;
    if (adjustedReplacement < 3) {
      score -= 15;
      warnings.push(`Short replacement interval: ${adjustedReplacement.toFixed(0)} months`);
    }
    
    // Cost efficiency (15% weight)
    const annualEnergyCost = calculateAnnualEnergyCost(operatingPd, designCfm);
    const annualReplacementCost = (filter.listPriceSar * quantity * 12) / filter.replacementIntervalMonths;
    const totalAnnualCost = annualEnergyCost + annualReplacementCost;
    
    // Normalize cost score (lower is better)
    const costScore = Math.max(0, 15 - totalAnnualCost / 200);
    score += costScore - 7.5; // Center around neutral
    
    return {
      filter,
      quantity,
      score: Math.max(0, Math.min(100, score)),
      warnings,
      operatingPoint: {
        faceVelocity,
        cleanPressureDrop: operatingPd,
        annualEnergyCostSar: annualEnergyCost,
        annualReplacementCostSar: annualReplacementCost,
        totalAnnualCostSar: totalAnnualCost
      }
    };
  });
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  if (scored.length === 0) return null;
  
  const best = scored[0];
  
  return {
    selectedFilter: best.filter,
    quantity: best.quantity,
    fitScore: best.score,
    operatingPoint: best.operatingPoint,
    alternates: scored.slice(1, 4).map(s => s.filter),
    warnings: best.warnings
  };
}

export function getFilterTypeLabel(type: FilterType): string {
  switch (type) {
    case 'pleated': return 'Pleated Panel';
    case 'bag': return 'Bag/Pocket';
    case 'rigid': return 'Rigid Box';
    case 'hepa': return 'HEPA';
    case 'carbon': return 'Activated Carbon';
    case 'electrostatic': return 'Electrostatic';
    default: return type;
  }
}

export function getFilterPositionLabel(position: FilterPosition): string {
  switch (position) {
    case 'prefilter': return 'Pre-Filter';
    case 'final': return 'Final Filter';
    case 'hepa': return 'HEPA Filter';
    case 'carbon': return 'Carbon/Gas Phase';
    default: return position;
  }
}

export function getMervRatingDescription(merv: number): string {
  if (merv <= 4) return 'Minimal filtration';
  if (merv <= 8) return 'Good residential/commercial';
  if (merv <= 12) return 'Better commercial';
  if (merv <= 14) return 'Superior commercial/hospital';
  if (merv <= 16) return 'Hospital/cleanroom';
  return 'HEPA grade';
}
