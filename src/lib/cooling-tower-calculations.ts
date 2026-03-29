// Cooling Tower Calculations Library
// Provides sizing, selection, and performance calculations for cooling towers

export type TowerType = 'induced_draft_counterflow' | 'induced_draft_crossflow' | 'forced_draft' | 'hybrid';
export type FillType = 'film' | 'splash' | 'low_clog';
export type TowerMaterial = 'frp' | 'galvanized' | 'stainless' | 'concrete';

export interface CoolingTowerRequirements {
  heatRejectionTons: number;
  condenserWaterFlowGpm: number;
  designWetBulbF: number;
  approachF: number;
  rangeF: number;
  redundancyMode?: 'n' | 'n+1' | '2n';
  maxCells?: number;
  preferredType?: TowerType;
}

export interface CoolingTowerCatalogItem {
  id: string;
  manufacturer: string;
  model: string;
  towerType: TowerType;
  capacityTons: number;
  maxFlowGpm: number;
  designWetBulbF: number;
  designApproachF: number;
  designRangeF: number;
  fanHp: number;
  fanMotorKw: number;
  fanType: 'axial' | 'centrifugal';
  motorEfficiency: number;
  driftRatePercent: number;
  fillType: FillType;
  material: TowerMaterial;
  soundLevelDb: number;
  lengthFt: number;
  widthFt: number;
  heightFt: number;
  operatingWeightLbs: number;
  listPriceSar?: number;
}

export interface CoolingTowerSelectionResult {
  selectedTower: CoolingTowerCatalogItem;
  numberOfCells: number;
  totalCapacityTons: number;
  fitScore: number;
  operatingPoint: {
    heatRejection: number;
    totalFlowGpm: number;
    totalFanKw: number;
    makeupWaterGpm: number;
    blowdownGpm: number;
  };
  alternates: CoolingTowerCatalogItem[];
  warnings: string[];
}

// Saudi Arabia design wet bulb temperatures by city
export const SAUDI_DESIGN_WET_BULB: Record<string, number> = {
  'riyadh': 73,
  'jeddah': 84,
  'dammam': 85,
  'makkah': 79,
  'madinah': 75,
  'khobar': 85,
  'dhahran': 85,
  'jubail': 86,
  'yanbu': 82,
  'taif': 68,
  'tabuk': 66,
  'abha': 62,
  'jizan': 86,
  'najran': 65,
  'hofuf': 82,
};

// Cooling tower catalog data
export const COOLING_TOWER_CATALOG: CoolingTowerCatalogItem[] = [
  // Induced Draft Counterflow - Small
  { id: 'ct-idc-100', manufacturer: 'BAC', model: 'Series 3000-100', towerType: 'induced_draft_counterflow', capacityTons: 100, maxFlowGpm: 300, designWetBulbF: 78, designApproachF: 7, designRangeF: 10, fanHp: 7.5, fanMotorKw: 5.6, fanType: 'axial', motorEfficiency: 92, driftRatePercent: 0.005, fillType: 'film', material: 'frp', soundLevelDb: 72, lengthFt: 6, widthFt: 6, heightFt: 10, operatingWeightLbs: 8500, listPriceSar: 85000 },
  { id: 'ct-idc-150', manufacturer: 'BAC', model: 'Series 3000-150', towerType: 'induced_draft_counterflow', capacityTons: 150, maxFlowGpm: 450, designWetBulbF: 78, designApproachF: 7, designRangeF: 10, fanHp: 10, fanMotorKw: 7.5, fanType: 'axial', motorEfficiency: 92, driftRatePercent: 0.005, fillType: 'film', material: 'frp', soundLevelDb: 74, lengthFt: 7, widthFt: 7, heightFt: 11, operatingWeightLbs: 11000, listPriceSar: 105000 },
  
  // Induced Draft Counterflow - Medium
  { id: 'ct-idc-200', manufacturer: 'Evapco', model: 'AT-200', towerType: 'induced_draft_counterflow', capacityTons: 200, maxFlowGpm: 600, designWetBulbF: 78, designApproachF: 7, designRangeF: 10, fanHp: 15, fanMotorKw: 11.2, fanType: 'axial', motorEfficiency: 93, driftRatePercent: 0.005, fillType: 'film', material: 'frp', soundLevelDb: 75, lengthFt: 8, widthFt: 8, heightFt: 12, operatingWeightLbs: 14000, listPriceSar: 135000 },
  { id: 'ct-idc-300', manufacturer: 'Evapco', model: 'AT-300', towerType: 'induced_draft_counterflow', capacityTons: 300, maxFlowGpm: 900, designWetBulbF: 78, designApproachF: 7, designRangeF: 10, fanHp: 20, fanMotorKw: 15, fanType: 'axial', motorEfficiency: 93, driftRatePercent: 0.005, fillType: 'film', material: 'frp', soundLevelDb: 76, lengthFt: 10, widthFt: 10, heightFt: 13, operatingWeightLbs: 18000, listPriceSar: 175000 },
  { id: 'ct-idc-400', manufacturer: 'Marley', model: 'NC-400', towerType: 'induced_draft_counterflow', capacityTons: 400, maxFlowGpm: 1200, designWetBulbF: 78, designApproachF: 7, designRangeF: 10, fanHp: 25, fanMotorKw: 18.7, fanType: 'axial', motorEfficiency: 94, driftRatePercent: 0.005, fillType: 'film', material: 'frp', soundLevelDb: 77, lengthFt: 12, widthFt: 12, heightFt: 14, operatingWeightLbs: 24000, listPriceSar: 220000 },
  
  // Induced Draft Counterflow - Large
  { id: 'ct-idc-500', manufacturer: 'Marley', model: 'NC-500', towerType: 'induced_draft_counterflow', capacityTons: 500, maxFlowGpm: 1500, designWetBulbF: 78, designApproachF: 7, designRangeF: 10, fanHp: 30, fanMotorKw: 22.4, fanType: 'axial', motorEfficiency: 94, driftRatePercent: 0.005, fillType: 'film', material: 'frp', soundLevelDb: 78, lengthFt: 14, widthFt: 14, heightFt: 15, operatingWeightLbs: 32000, listPriceSar: 275000 },
  { id: 'ct-idc-750', manufacturer: 'BAC', model: 'Series 3000-750', towerType: 'induced_draft_counterflow', capacityTons: 750, maxFlowGpm: 2250, designWetBulbF: 78, designApproachF: 7, designRangeF: 10, fanHp: 50, fanMotorKw: 37, fanType: 'axial', motorEfficiency: 95, driftRatePercent: 0.005, fillType: 'film', material: 'frp', soundLevelDb: 80, lengthFt: 18, widthFt: 14, heightFt: 16, operatingWeightLbs: 48000, listPriceSar: 395000 },
  { id: 'ct-idc-1000', manufacturer: 'Evapco', model: 'AT-1000', towerType: 'induced_draft_counterflow', capacityTons: 1000, maxFlowGpm: 3000, designWetBulbF: 78, designApproachF: 7, designRangeF: 10, fanHp: 60, fanMotorKw: 45, fanType: 'axial', motorEfficiency: 95, driftRatePercent: 0.005, fillType: 'film', material: 'frp', soundLevelDb: 82, lengthFt: 22, widthFt: 16, heightFt: 18, operatingWeightLbs: 65000, listPriceSar: 520000 },
  
  // Induced Draft Crossflow
  { id: 'ct-idx-200', manufacturer: 'Marley', model: 'MD-200', towerType: 'induced_draft_crossflow', capacityTons: 200, maxFlowGpm: 600, designWetBulbF: 78, designApproachF: 8, designRangeF: 10, fanHp: 12, fanMotorKw: 9, fanType: 'axial', motorEfficiency: 92, driftRatePercent: 0.005, fillType: 'splash', material: 'frp', soundLevelDb: 73, lengthFt: 12, widthFt: 6, heightFt: 10, operatingWeightLbs: 12000, listPriceSar: 125000 },
  { id: 'ct-idx-400', manufacturer: 'Marley', model: 'MD-400', towerType: 'induced_draft_crossflow', capacityTons: 400, maxFlowGpm: 1200, designWetBulbF: 78, designApproachF: 8, designRangeF: 10, fanHp: 20, fanMotorKw: 15, fanType: 'axial', motorEfficiency: 93, driftRatePercent: 0.005, fillType: 'splash', material: 'frp', soundLevelDb: 75, lengthFt: 18, widthFt: 8, heightFt: 12, operatingWeightLbs: 22000, listPriceSar: 210000 },
  
  // Hybrid (Fluid Cooler)
  { id: 'ct-hyb-150', manufacturer: 'BAC', model: 'TrilliumSeries-150', towerType: 'hybrid', capacityTons: 150, maxFlowGpm: 450, designWetBulbF: 78, designApproachF: 5, designRangeF: 10, fanHp: 15, fanMotorKw: 11.2, fanType: 'axial', motorEfficiency: 93, driftRatePercent: 0.001, fillType: 'film', material: 'stainless', soundLevelDb: 70, lengthFt: 10, widthFt: 6, heightFt: 12, operatingWeightLbs: 9500, listPriceSar: 185000 },
  { id: 'ct-hyb-300', manufacturer: 'Evapco', model: 'eco-ATWB-300', towerType: 'hybrid', capacityTons: 300, maxFlowGpm: 900, designWetBulbF: 78, designApproachF: 5, designRangeF: 10, fanHp: 25, fanMotorKw: 18.7, fanType: 'axial', motorEfficiency: 94, driftRatePercent: 0.001, fillType: 'film', material: 'stainless', soundLevelDb: 72, lengthFt: 14, widthFt: 8, heightFt: 14, operatingWeightLbs: 16000, listPriceSar: 320000 },
];

/**
 * Calculate heat rejection from chiller load
 */
export function calculateHeatRejection(
  chillerLoadTons: number,
  chillerCop: number = 5.5
): number {
  // Heat rejection = Evaporator load + Compressor work
  // HR = Q_evap × (1 + 1/COP)
  const heatRejectionTons = chillerLoadTons * (1 + 1 / chillerCop);
  return heatRejectionTons;
}

/**
 * Calculate condenser water flow rate
 */
export function calculateCondenserWaterFlow(
  heatRejectionTons: number,
  rangeF: number
): number {
  // GPM = (Tons × 12000) / (500 × Range)
  // Or approximately: GPM = Tons × 3 / Range (for 10°F range = 3 GPM/ton)
  const gpm = (heatRejectionTons * 12000) / (500 * rangeF);
  return gpm;
}

/**
 * Calculate makeup water requirement
 */
export function calculateMakeupWater(
  circulatingFlowGpm: number,
  cyclesOfConcentration: number = 5,
  driftRatePercent: number = 0.005
): { evaporationGpm: number; blowdownGpm: number; driftGpm: number; makeupGpm: number } {
  // Evaporation ≈ 1% of flow per 10°F range (for typical 10°F range)
  const evaporationGpm = circulatingFlowGpm * 0.01;
  
  // Drift loss
  const driftGpm = circulatingFlowGpm * (driftRatePercent / 100);
  
  // Blowdown = Evaporation / (Cycles - 1)
  const blowdownGpm = evaporationGpm / (cyclesOfConcentration - 1);
  
  // Makeup = Evaporation + Drift + Blowdown
  const makeupGpm = evaporationGpm + driftGpm + blowdownGpm;
  
  return { evaporationGpm, blowdownGpm, driftGpm, makeupGpm };
}

/**
 * Adjust tower capacity for different conditions
 */
export function adjustCapacityForConditions(
  catalogCapacity: number,
  catalogWetBulb: number,
  catalogApproach: number,
  catalogRange: number,
  actualWetBulb: number,
  actualApproach: number,
  actualRange: number
): number {
  // Capacity correction factors (simplified CTI methodology)
  
  // Wet bulb correction: Capacity decreases ~2% per °F increase in wet bulb
  const wetBulbFactor = 1 - 0.02 * (actualWetBulb - catalogWetBulb);
  
  // Approach correction: Smaller approach = less capacity
  const approachFactor = actualApproach / catalogApproach;
  
  // Range correction: Larger range = slightly less capacity
  const rangeFactor = 1 - 0.01 * (actualRange - catalogRange);
  
  const adjustedCapacity = catalogCapacity * wetBulbFactor * approachFactor * rangeFactor;
  
  return Math.max(0, adjustedCapacity);
}

/**
 * Select cooling tower configuration
 */
export function selectCoolingTower(requirements: CoolingTowerRequirements): CoolingTowerSelectionResult | null {
  const {
    heatRejectionTons,
    condenserWaterFlowGpm,
    designWetBulbF,
    approachF,
    rangeF,
    redundancyMode = 'n',
    maxCells = 6,
    preferredType
  } = requirements;
  
  // Calculate required capacity with redundancy
  let requiredCapacityPerCell: number;
  let minCells: number;
  
  switch (redundancyMode) {
    case 'n+1':
      // Size for N cells, install N+1
      minCells = 2;
      break;
    case '2n':
      // 100% redundancy
      minCells = 2;
      break;
    default:
      minCells = 1;
  }
  
  // Filter by type if specified
  let candidates = preferredType
    ? COOLING_TOWER_CATALOG.filter(t => t.towerType === preferredType)
    : COOLING_TOWER_CATALOG;
  
  if (candidates.length === 0) {
    candidates = COOLING_TOWER_CATALOG;
  }
  
  // Score each candidate with various cell configurations
  const configurations: Array<{
    tower: CoolingTowerCatalogItem;
    cells: number;
    score: number;
    warnings: string[];
    adjustedCapacity: number;
  }> = [];
  
  for (const tower of candidates) {
    // Calculate adjusted capacity for actual conditions
    const adjustedCapacity = adjustCapacityForConditions(
      tower.capacityTons,
      tower.designWetBulbF,
      tower.designApproachF,
      tower.designRangeF,
      designWetBulbF,
      approachF,
      rangeF
    );
    
    // Try different cell counts
    for (let cells = minCells; cells <= maxCells; cells++) {
      let effectiveCells = cells;
      if (redundancyMode === 'n+1') effectiveCells = cells - 1;
      if (redundancyMode === '2n') effectiveCells = cells / 2;
      
      const totalCapacity = adjustedCapacity * effectiveCells;
      const totalFlow = tower.maxFlowGpm * cells;
      
      // Skip if insufficient
      if (totalCapacity < heatRejectionTons * 0.95) continue;
      if (totalFlow < condenserWaterFlowGpm * 0.95) continue;
      
      let score = 100;
      const warnings: string[] = [];
      
      // Capacity margin (30% weight)
      const capacityRatio = totalCapacity / heatRejectionTons;
      if (capacityRatio < 1.0) {
        score -= 30 * (1 - capacityRatio);
        warnings.push(`Capacity ${capacityRatio * 100}% of required`);
      } else if (capacityRatio > 1.3) {
        score -= 10 * (capacityRatio - 1.3);
        warnings.push(`Oversized by ${((capacityRatio - 1) * 100).toFixed(0)}%`);
      }
      
      // Flow capacity (20% weight)
      const flowRatio = totalFlow / condenserWaterFlowGpm;
      if (flowRatio < 1.0) {
        score -= 20 * (1 - flowRatio);
        warnings.push(`Flow capacity insufficient`);
      }
      
      // Approach temperature (20% weight)
      if (tower.designApproachF > approachF) {
        score -= 20 * (tower.designApproachF - approachF) / approachF;
        warnings.push(`Tower approach ${tower.designApproachF}°F > required ${approachF}°F`);
      }
      
      // Energy efficiency (15% weight)
      const fanKwPerTon = (tower.fanMotorKw * cells) / totalCapacity;
      if (fanKwPerTon > 0.05) {
        score -= 15 * (fanKwPerTon - 0.05) / 0.05;
      }
      
      // Cell count preference (10% weight) - fewer is better
      score -= cells * 2;
      
      // Sound level (5% weight)
      if (tower.soundLevelDb > 78) {
        score -= 5 * (tower.soundLevelDb - 78) / 10;
        warnings.push(`High sound level: ${tower.soundLevelDb} dB`);
      }
      
      configurations.push({
        tower,
        cells,
        score: Math.max(0, Math.min(100, score)),
        warnings,
        adjustedCapacity
      });
    }
  }
  
  if (configurations.length === 0) return null;
  
  // Sort by score
  configurations.sort((a, b) => b.score - a.score);
  
  const best = configurations[0];
  const waterCalcs = calculateMakeupWater(
    condenserWaterFlowGpm,
    5,
    best.tower.driftRatePercent
  );
  
  return {
    selectedTower: best.tower,
    numberOfCells: best.cells,
    totalCapacityTons: best.adjustedCapacity * best.cells,
    fitScore: best.score,
    operatingPoint: {
      heatRejection: heatRejectionTons,
      totalFlowGpm: condenserWaterFlowGpm,
      totalFanKw: best.tower.fanMotorKw * best.cells,
      makeupWaterGpm: waterCalcs.makeupGpm,
      blowdownGpm: waterCalcs.blowdownGpm
    },
    alternates: configurations.slice(1, 4).map(c => c.tower),
    warnings: best.warnings
  };
}

export function getTowerTypeLabel(type: TowerType): string {
  switch (type) {
    case 'induced_draft_counterflow': return 'Induced Draft Counterflow';
    case 'induced_draft_crossflow': return 'Induced Draft Crossflow';
    case 'forced_draft': return 'Forced Draft';
    case 'hybrid': return 'Hybrid/Fluid Cooler';
    default: return type;
  }
}

export function getFillTypeLabel(type: FillType): string {
  switch (type) {
    case 'film': return 'Film Fill';
    case 'splash': return 'Splash Fill';
    case 'low_clog': return 'Low-Clog Fill';
    default: return type;
  }
}
