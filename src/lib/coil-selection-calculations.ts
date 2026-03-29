// Coil Selection Calculations Library
// Provides sizing, selection scoring, and catalog data for HVAC coils

export type CoilType = 'cooling' | 'heating' | 'preheat' | 'reheat';
export type FluidType = 'water' | 'glycol-25' | 'glycol-50' | 'refrigerant';

export interface CoilRequirements {
  coilType: CoilType;
  designCfm: number;
  enteringAirDbF: number;
  leavingAirDbF: number;
  enteringAirWbF?: number;
  leavingAirWbF?: number;
  fluidType: FluidType;
  supplyTempF: number;
  returnTempF: number;
  maxAirPressureDropIn?: number;
  maxWaterPressureDropFt?: number;
  maxFaceVelocityFpm?: number;
}

export interface CoilCatalogItem {
  id: string;
  manufacturer: string;
  model: string;
  type: CoilType;
  rows: number;
  finsPerInch: number;
  faceAreaSqFt: number;
  capacityTons: number;
  capacityMbh: number;
  airPressureDropIn: number;
  waterPressureDropFt: number;
  waterFlowGpm: number;
  faceVelocityFpm: number;
  fluidVelocityFps: number;
  tubeMaterial: string;
  finMaterial: string;
  connectionSize: string;
  listPriceSar?: number;
}

export interface CoilSelectionResult {
  selectedCoil: CoilCatalogItem;
  fitScore: number;
  operatingPoint: {
    capacity: number;
    airPressureDrop: number;
    waterPressureDrop: number;
    waterFlow: number;
    faceVelocity: number;
  };
  alternates: CoilCatalogItem[];
  warnings: string[];
}

// Coil catalog data - representative samples from major manufacturers
export const COIL_CATALOG: CoilCatalogItem[] = [
  // Cooling Coils - 4 Row
  { id: 'cc-4r-24x24', manufacturer: 'Trane', model: 'CC-4R-24x24', type: 'cooling', rows: 4, finsPerInch: 12, faceAreaSqFt: 4, capacityTons: 5, capacityMbh: 60, airPressureDropIn: 0.35, waterPressureDropFt: 8, waterFlowGpm: 12, faceVelocityFpm: 450, fluidVelocityFps: 4, tubeMaterial: 'copper', finMaterial: 'aluminum', connectionSize: '1.25"' },
  { id: 'cc-4r-36x36', manufacturer: 'Trane', model: 'CC-4R-36x36', type: 'cooling', rows: 4, finsPerInch: 12, faceAreaSqFt: 9, capacityTons: 12, capacityMbh: 144, airPressureDropIn: 0.38, waterPressureDropFt: 10, waterFlowGpm: 29, faceVelocityFpm: 450, fluidVelocityFps: 4.2, tubeMaterial: 'copper', finMaterial: 'aluminum', connectionSize: '2"' },
  { id: 'cc-4r-48x48', manufacturer: 'Trane', model: 'CC-4R-48x48', type: 'cooling', rows: 4, finsPerInch: 12, faceAreaSqFt: 16, capacityTons: 22, capacityMbh: 264, airPressureDropIn: 0.40, waterPressureDropFt: 12, waterFlowGpm: 53, faceVelocityFpm: 450, fluidVelocityFps: 4.5, tubeMaterial: 'copper', finMaterial: 'aluminum', connectionSize: '2.5"' },
  { id: 'cc-4r-60x60', manufacturer: 'Carrier', model: 'CC-4R-60x60', type: 'cooling', rows: 4, finsPerInch: 12, faceAreaSqFt: 25, capacityTons: 35, capacityMbh: 420, airPressureDropIn: 0.42, waterPressureDropFt: 14, waterFlowGpm: 84, faceVelocityFpm: 450, fluidVelocityFps: 4.8, tubeMaterial: 'copper', finMaterial: 'aluminum', connectionSize: '3"' },
  
  // Cooling Coils - 6 Row (Higher capacity)
  { id: 'cc-6r-24x24', manufacturer: 'Trane', model: 'CC-6R-24x24', type: 'cooling', rows: 6, finsPerInch: 12, faceAreaSqFt: 4, capacityTons: 7, capacityMbh: 84, airPressureDropIn: 0.55, waterPressureDropFt: 12, waterFlowGpm: 17, faceVelocityFpm: 450, fluidVelocityFps: 4, tubeMaterial: 'copper', finMaterial: 'aluminum', connectionSize: '1.5"' },
  { id: 'cc-6r-36x36', manufacturer: 'Trane', model: 'CC-6R-36x36', type: 'cooling', rows: 6, finsPerInch: 12, faceAreaSqFt: 9, capacityTons: 17, capacityMbh: 204, airPressureDropIn: 0.58, waterPressureDropFt: 14, waterFlowGpm: 41, faceVelocityFpm: 450, fluidVelocityFps: 4.2, tubeMaterial: 'copper', finMaterial: 'aluminum', connectionSize: '2.5"' },
  { id: 'cc-6r-48x48', manufacturer: 'Carrier', model: 'CC-6R-48x48', type: 'cooling', rows: 6, finsPerInch: 12, faceAreaSqFt: 16, capacityTons: 30, capacityMbh: 360, airPressureDropIn: 0.62, waterPressureDropFt: 16, waterFlowGpm: 72, faceVelocityFpm: 450, fluidVelocityFps: 4.5, tubeMaterial: 'copper', finMaterial: 'aluminum', connectionSize: '3"' },
  { id: 'cc-6r-60x60', manufacturer: 'Carrier', model: 'CC-6R-60x60', type: 'cooling', rows: 6, finsPerInch: 12, faceAreaSqFt: 25, capacityTons: 48, capacityMbh: 576, airPressureDropIn: 0.65, waterPressureDropFt: 18, waterFlowGpm: 115, faceVelocityFpm: 450, fluidVelocityFps: 4.8, tubeMaterial: 'copper', finMaterial: 'aluminum', connectionSize: '4"' },
  
  // Heating Coils - 1 Row
  { id: 'hc-1r-24x24', manufacturer: 'Trane', model: 'HC-1R-24x24', type: 'heating', rows: 1, finsPerInch: 8, faceAreaSqFt: 4, capacityTons: 0, capacityMbh: 80, airPressureDropIn: 0.12, waterPressureDropFt: 3, waterFlowGpm: 8, faceVelocityFpm: 500, fluidVelocityFps: 3, tubeMaterial: 'copper', finMaterial: 'aluminum', connectionSize: '1"' },
  { id: 'hc-1r-36x36', manufacturer: 'Trane', model: 'HC-1R-36x36', type: 'heating', rows: 1, finsPerInch: 8, faceAreaSqFt: 9, capacityTons: 0, capacityMbh: 180, airPressureDropIn: 0.14, waterPressureDropFt: 4, waterFlowGpm: 18, faceVelocityFpm: 500, fluidVelocityFps: 3.2, tubeMaterial: 'copper', finMaterial: 'aluminum', connectionSize: '1.5"' },
  { id: 'hc-1r-48x48', manufacturer: 'Carrier', model: 'HC-1R-48x48', type: 'heating', rows: 1, finsPerInch: 8, faceAreaSqFt: 16, capacityTons: 0, capacityMbh: 320, airPressureDropIn: 0.16, waterPressureDropFt: 5, waterFlowGpm: 32, faceVelocityFpm: 500, fluidVelocityFps: 3.5, tubeMaterial: 'copper', finMaterial: 'aluminum', connectionSize: '2"' },
  
  // Heating Coils - 2 Row
  { id: 'hc-2r-24x24', manufacturer: 'Trane', model: 'HC-2R-24x24', type: 'heating', rows: 2, finsPerInch: 8, faceAreaSqFt: 4, capacityTons: 0, capacityMbh: 150, airPressureDropIn: 0.22, waterPressureDropFt: 5, waterFlowGpm: 15, faceVelocityFpm: 500, fluidVelocityFps: 3.5, tubeMaterial: 'copper', finMaterial: 'aluminum', connectionSize: '1.25"' },
  { id: 'hc-2r-36x36', manufacturer: 'Carrier', model: 'HC-2R-36x36', type: 'heating', rows: 2, finsPerInch: 8, faceAreaSqFt: 9, capacityTons: 0, capacityMbh: 340, airPressureDropIn: 0.25, waterPressureDropFt: 6, waterFlowGpm: 34, faceVelocityFpm: 500, fluidVelocityFps: 3.8, tubeMaterial: 'copper', finMaterial: 'aluminum', connectionSize: '2"' },
  { id: 'hc-2r-48x48', manufacturer: 'Carrier', model: 'HC-2R-48x48', type: 'heating', rows: 2, finsPerInch: 8, faceAreaSqFt: 16, capacityTons: 0, capacityMbh: 600, airPressureDropIn: 0.28, waterPressureDropFt: 7, waterFlowGpm: 60, faceVelocityFpm: 500, fluidVelocityFps: 4, tubeMaterial: 'copper', finMaterial: 'aluminum', connectionSize: '2.5"' },
  
  // Preheat Coils - Steam
  { id: 'ph-1r-24x24', manufacturer: 'Trane', model: 'PH-1R-24x24', type: 'preheat', rows: 1, finsPerInch: 6, faceAreaSqFt: 4, capacityTons: 0, capacityMbh: 120, airPressureDropIn: 0.10, waterPressureDropFt: 2, waterFlowGpm: 0, faceVelocityFpm: 600, fluidVelocityFps: 0, tubeMaterial: 'copper', finMaterial: 'aluminum', connectionSize: '1"' },
  { id: 'ph-1r-36x36', manufacturer: 'Trane', model: 'PH-1R-36x36', type: 'preheat', rows: 1, finsPerInch: 6, faceAreaSqFt: 9, capacityTons: 0, capacityMbh: 270, airPressureDropIn: 0.12, waterPressureDropFt: 2.5, waterFlowGpm: 0, faceVelocityFpm: 600, fluidVelocityFps: 0, tubeMaterial: 'copper', finMaterial: 'aluminum', connectionSize: '1.5"' },
];

/**
 * Calculate required cooling coil capacity
 */
export function calculateCoolingCoilCapacity(
  cfm: number,
  enteringDbF: number,
  leavingDbF: number,
  enteringWbF: number,
  leavingWbF: number
): { sensibleBtuh: number; latentBtuh: number; totalBtuh: number; totalTons: number } {
  // Standard air density at sea level
  const airDensity = 0.075; // lb/ft³
  const specificHeat = 0.24; // BTU/lb-°F
  
  // Sensible heat calculation
  const sensibleBtuh = 1.08 * cfm * (enteringDbF - leavingDbF);
  
  // Latent heat calculation (simplified)
  // Using humidity ratio difference based on wet bulb temperatures
  const enteringHumidityRatio = calculateHumidityRatio(enteringDbF, enteringWbF);
  const leavingHumidityRatio = calculateHumidityRatio(leavingDbF, leavingWbF);
  const latentBtuh = 4840 * cfm * (enteringHumidityRatio - leavingHumidityRatio);
  
  const totalBtuh = sensibleBtuh + Math.max(0, latentBtuh);
  const totalTons = totalBtuh / 12000;
  
  return { sensibleBtuh, latentBtuh: Math.max(0, latentBtuh), totalBtuh, totalTons };
}

/**
 * Calculate required heating coil capacity
 */
export function calculateHeatingCoilCapacity(
  cfm: number,
  enteringDbF: number,
  leavingDbF: number
): { capacityBtuh: number; capacityMbh: number } {
  const capacityBtuh = 1.08 * cfm * (leavingDbF - enteringDbF);
  const capacityMbh = capacityBtuh / 1000;
  
  return { capacityBtuh, capacityMbh };
}

/**
 * Calculate water flow rate for coil
 */
export function calculateWaterFlowGpm(
  capacityBtuh: number,
  supplyTempF: number,
  returnTempF: number,
  fluidType: FluidType = 'water'
): number {
  const deltaT = Math.abs(returnTempF - supplyTempF);
  if (deltaT === 0) return 0;
  
  // Specific heat varies by fluid type
  const specificHeat = getFluidSpecificHeat(fluidType);
  const density = getFluidDensity(fluidType);
  
  // GPM = BTUH / (500 × ΔT) for water, adjusted for other fluids
  const correctionFactor = (specificHeat * density) / (1.0 * 8.33);
  const gpm = capacityBtuh / (500 * deltaT * correctionFactor);
  
  return gpm;
}

/**
 * Calculate face velocity
 */
export function calculateFaceVelocity(cfm: number, faceAreaSqFt: number): number {
  if (faceAreaSqFt === 0) return 0;
  return cfm / faceAreaSqFt;
}

/**
 * Select best coil from catalog
 */
export function selectCoil(requirements: CoilRequirements): CoilSelectionResult | null {
  const { coilType, designCfm, enteringAirDbF, leavingAirDbF, enteringAirWbF, leavingAirWbF, supplyTempF, returnTempF } = requirements;
  
  // Calculate required capacity
  let requiredCapacity: number;
  if (coilType === 'cooling') {
    const result = calculateCoolingCoilCapacity(
      designCfm,
      enteringAirDbF,
      leavingAirDbF,
      enteringAirWbF || enteringAirDbF - 10,
      leavingAirWbF || leavingAirDbF - 5
    );
    requiredCapacity = result.totalTons;
  } else {
    const result = calculateHeatingCoilCapacity(designCfm, enteringAirDbF, leavingAirDbF);
    requiredCapacity = result.capacityMbh;
  }
  
  // Filter catalog by coil type
  const candidates = COIL_CATALOG.filter(c => c.type === coilType);
  
  if (candidates.length === 0) return null;
  
  // Score each candidate
  const scored = candidates.map(coil => {
    let score = 100;
    const warnings: string[] = [];
    
    // Capacity match (40% weight)
    const capacity = coilType === 'cooling' ? coil.capacityTons : coil.capacityMbh;
    const capacityRatio = capacity / requiredCapacity;
    
    if (capacityRatio < 1.0) {
      score -= 40 * (1 - capacityRatio);
      warnings.push(`Undersized by ${((1 - capacityRatio) * 100).toFixed(0)}%`);
    } else if (capacityRatio > 1.25) {
      score -= 20 * (capacityRatio - 1.25);
      warnings.push(`Oversized by ${((capacityRatio - 1) * 100).toFixed(0)}%`);
    } else {
      score -= 5 * (capacityRatio - 1); // Small penalty for oversizing
    }
    
    // Face velocity check (20% weight)
    const faceVelocity = calculateFaceVelocity(designCfm, coil.faceAreaSqFt);
    const maxVelocity = requirements.maxFaceVelocityFpm || 550;
    
    if (faceVelocity > maxVelocity) {
      score -= 20 * (faceVelocity - maxVelocity) / maxVelocity;
      warnings.push(`Face velocity ${faceVelocity.toFixed(0)} FPM exceeds ${maxVelocity} FPM`);
    }
    
    // Air pressure drop (20% weight)
    const maxAirPd = requirements.maxAirPressureDropIn || 0.75;
    if (coil.airPressureDropIn > maxAirPd) {
      score -= 20 * (coil.airPressureDropIn - maxAirPd) / maxAirPd;
      warnings.push(`Air PD ${coil.airPressureDropIn}" exceeds ${maxAirPd}"`);
    }
    
    // Water pressure drop (20% weight)
    const maxWaterPd = requirements.maxWaterPressureDropFt || 20;
    if (coil.waterPressureDropFt > maxWaterPd) {
      score -= 20 * (coil.waterPressureDropFt - maxWaterPd) / maxWaterPd;
      warnings.push(`Water PD ${coil.waterPressureDropFt}' exceeds ${maxWaterPd}'`);
    }
    
    return {
      coil,
      score: Math.max(0, Math.min(100, score)),
      warnings,
      operatingPoint: {
        capacity: capacity,
        airPressureDrop: coil.airPressureDropIn,
        waterPressureDrop: coil.waterPressureDropFt,
        waterFlow: calculateWaterFlowGpm(
          coilType === 'cooling' ? coil.capacityTons * 12000 : coil.capacityMbh * 1000,
          supplyTempF,
          returnTempF,
          requirements.fluidType
        ),
        faceVelocity: calculateFaceVelocity(designCfm, coil.faceAreaSqFt)
      }
    };
  });
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  if (scored.length === 0) return null;
  
  const best = scored[0];
  
  return {
    selectedCoil: best.coil,
    fitScore: best.score,
    operatingPoint: best.operatingPoint,
    alternates: scored.slice(1, 4).map(s => s.coil),
    warnings: best.warnings
  };
}

// Helper functions
function calculateHumidityRatio(dbF: number, wbF: number): number {
  // Simplified psychrometric calculation
  const pws = Math.exp(17.67 * (wbF - 32) / 1.8 / ((wbF - 32) / 1.8 + 243.5)) * 6.1078;
  const pw = pws - 0.000662 * 14.696 * (dbF - wbF);
  return 0.62198 * pw / (14.696 - pw);
}

function getFluidSpecificHeat(fluidType: FluidType): number {
  switch (fluidType) {
    case 'glycol-25': return 0.92;
    case 'glycol-50': return 0.82;
    default: return 1.0;
  }
}

function getFluidDensity(fluidType: FluidType): number {
  switch (fluidType) {
    case 'glycol-25': return 8.5;
    case 'glycol-50': return 8.8;
    default: return 8.33;
  }
}

export function getCoilTypeLabel(type: CoilType): string {
  switch (type) {
    case 'cooling': return 'Cooling Coil (CHW)';
    case 'heating': return 'Heating Coil (HW)';
    case 'preheat': return 'Preheat Coil';
    case 'reheat': return 'Reheat Coil';
    default: return type;
  }
}
