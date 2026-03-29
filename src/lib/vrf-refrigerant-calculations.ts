// VRF Refrigerant Piping Calculations
// Based on ASHRAE Refrigeration Handbook and manufacturer guidelines

export type RefrigerantType = 'R410A' | 'R32';
export type LineType = 'liquid' | 'suction' | 'discharge';

export interface RefrigerantProperties {
  name: string;
  liquidDensity_lb_ft3: number;
  vaporDensity_lb_ft3: number;
  satPressure_psi: { cooling: number; heating: number };
  oilMiscible: boolean;
  minOilReturnVelocity_fpm: { horizontal: number; riser: number };
  latentHeat_btu_lb: number;
}

export const REFRIGERANT_PROPERTIES: Record<RefrigerantType, RefrigerantProperties> = {
  'R410A': {
    name: 'R-410A',
    liquidDensity_lb_ft3: 66.7,
    vaporDensity_lb_ft3: 2.43,
    satPressure_psi: { cooling: 410, heating: 250 },
    oilMiscible: true,
    minOilReturnVelocity_fpm: { horizontal: 500, riser: 1000 },
    latentHeat_btu_lb: 91.5,
  },
  'R32': {
    name: 'R-32',
    liquidDensity_lb_ft3: 61.3,
    vaporDensity_lb_ft3: 2.15,
    satPressure_psi: { cooling: 450, heating: 280 },
    oilMiscible: true,
    minOilReturnVelocity_fpm: { horizontal: 500, riser: 1000 },
    latentHeat_btu_lb: 104.5,
  },
};

export interface ACRCopperSize {
  od: number;
  id: number;
  name: string;
  areaIn2: number;
}

// ACR Copper tubing sizes (OD in inches)
export const ACR_COPPER_SIZES: ACRCopperSize[] = [
  { od: 0.25, id: 0.19, name: '1/4"', areaIn2: 0.0284 },
  { od: 0.375, id: 0.315, name: '3/8"', areaIn2: 0.0779 },
  { od: 0.5, id: 0.43, name: '1/2"', areaIn2: 0.1452 },
  { od: 0.625, id: 0.545, name: '5/8"', areaIn2: 0.2333 },
  { od: 0.75, id: 0.666, name: '3/4"', areaIn2: 0.3483 },
  { od: 0.875, id: 0.785, name: '7/8"', areaIn2: 0.4840 },
  { od: 1.125, id: 1.025, name: '1-1/8"', areaIn2: 0.8252 },
  { od: 1.375, id: 1.265, name: '1-3/8"', areaIn2: 1.2566 },
  { od: 1.625, id: 1.505, name: '1-5/8"', areaIn2: 1.7787 },
  { od: 2.125, id: 1.985, name: '2-1/8"', areaIn2: 3.0941 },
  { od: 2.625, id: 2.465, name: '2-5/8"', areaIn2: 4.7713 },
  { od: 3.125, id: 2.945, name: '3-1/8"', areaIn2: 6.8097 },
  { od: 3.625, id: 3.425, name: '3-5/8"', areaIn2: 9.2117 },
];

// Typical VRF Capacity Tables (kW) for line sizing - based on equivalent length
// Format: [capacity_kw, liquid_size_od, suction_size_od]
export interface CapacitySizeTable {
  maxCapacity_kw: number;
  liquidSize_od: number;
  suctionSize_od: number;
  dischargeSize_od: number;
}

// Approximate sizing table for R410A VRF systems
export const VRF_CAPACITY_SIZE_TABLE: CapacitySizeTable[] = [
  { maxCapacity_kw: 2.8, liquidSize_od: 0.25, suctionSize_od: 0.5, dischargeSize_od: 0.375 },
  { maxCapacity_kw: 4.5, liquidSize_od: 0.25, suctionSize_od: 0.5, dischargeSize_od: 0.375 },
  { maxCapacity_kw: 7.1, liquidSize_od: 0.375, suctionSize_od: 0.625, dischargeSize_od: 0.5 },
  { maxCapacity_kw: 11.2, liquidSize_od: 0.375, suctionSize_od: 0.75, dischargeSize_od: 0.5 },
  { maxCapacity_kw: 14.0, liquidSize_od: 0.375, suctionSize_od: 0.875, dischargeSize_od: 0.625 },
  { maxCapacity_kw: 22.4, liquidSize_od: 0.5, suctionSize_od: 1.125, dischargeSize_od: 0.75 },
  { maxCapacity_kw: 33.5, liquidSize_od: 0.5, suctionSize_od: 1.375, dischargeSize_od: 0.875 },
  { maxCapacity_kw: 45.0, liquidSize_od: 0.625, suctionSize_od: 1.375, dischargeSize_od: 1.125 },
  { maxCapacity_kw: 56.0, liquidSize_od: 0.625, suctionSize_od: 1.625, dischargeSize_od: 1.125 },
  { maxCapacity_kw: 73.0, liquidSize_od: 0.75, suctionSize_od: 1.625, dischargeSize_od: 1.375 },
  { maxCapacity_kw: 90.0, liquidSize_od: 0.875, suctionSize_od: 2.125, dischargeSize_od: 1.375 },
  { maxCapacity_kw: 120.0, liquidSize_od: 0.875, suctionSize_od: 2.125, dischargeSize_od: 1.625 },
  { maxCapacity_kw: 150.0, liquidSize_od: 1.125, suctionSize_od: 2.625, dischargeSize_od: 1.625 },
  { maxCapacity_kw: 200.0, liquidSize_od: 1.125, suctionSize_od: 2.625, dischargeSize_od: 2.125 },
  { maxCapacity_kw: 280.0, liquidSize_od: 1.375, suctionSize_od: 3.125, dischargeSize_od: 2.125 },
];

// Fitting equivalent lengths (in feet of straight pipe)
export interface FittingType {
  name: string;
  category: 'elbow' | 'tee' | 'valve' | 'accessory';
  equivalentLengthFactor: number; // multiply by pipe diameter (in) to get equiv length (ft)
}

export const REFRIGERANT_FITTINGS: FittingType[] = [
  { name: 'Long Radius 90° Elbow', category: 'elbow', equivalentLengthFactor: 1.0 },
  { name: 'Short Radius 90° Elbow', category: 'elbow', equivalentLengthFactor: 1.5 },
  { name: '45° Elbow', category: 'elbow', equivalentLengthFactor: 0.5 },
  { name: 'Tee - Straight Through', category: 'tee', equivalentLengthFactor: 0.5 },
  { name: 'Tee - Branch', category: 'tee', equivalentLengthFactor: 2.0 },
  { name: 'Ball Valve (Full Port)', category: 'valve', equivalentLengthFactor: 0.5 },
  { name: 'Solenoid Valve', category: 'valve', equivalentLengthFactor: 3.0 },
  { name: 'Check Valve', category: 'valve', equivalentLengthFactor: 4.0 },
  { name: 'Filter Drier', category: 'accessory', equivalentLengthFactor: 5.0 },
  { name: 'Sight Glass', category: 'accessory', equivalentLengthFactor: 1.0 },
  { name: 'Reducer', category: 'accessory', equivalentLengthFactor: 0.5 },
  { name: 'Y-Branch', category: 'tee', equivalentLengthFactor: 1.5 },
];

export interface RefrigerantSizingParams {
  capacityKw: number;
  lengthFt: number;
  equivalentLengthFt: number;
  lineType: LineType;
  refrigerant: RefrigerantType;
  isRiser: boolean;
  elevationChangeFt: number;
}

export interface RefrigerantSizingResult {
  recommendedSize: ACRCopperSize;
  velocity_fps: number;
  velocity_fpm: number;
  pressureDrop_psi: number;
  pressureDrop_psi_per_100ft: number;
  massFlow_lb_hr: number;
  oilReturnOk: boolean;
  oilReturnMinVelocity_fpm: number;
  warnings: string[];
}

export interface OilReturnResult {
  ok: boolean;
  actualVelocity_fpm: number;
  requiredVelocity_fpm: number;
  margin: number;
  recommendation: string;
}

export interface ValidationMessage {
  level: 'info' | 'warning' | 'error';
  message: string;
  field?: string;
}

// Convert kW to BTU/hr
export function kwToBtu(kw: number): number {
  return kw * 3412.14;
}

// Convert BTU/hr to tons
export function btuToTons(btu: number): number {
  return btu / 12000;
}

// Calculate refrigerant mass flow rate (lb/hr)
export function calculateRefrigerantFlow(capacityKw: number, refrigerant: RefrigerantType): number {
  const props = REFRIGERANT_PROPERTIES[refrigerant];
  const capacityBtu = kwToBtu(capacityKw);
  // Mass flow = Capacity / Latent Heat
  return capacityBtu / props.latentHeat_btu_lb;
}

// Calculate velocity (fps) for given flow and pipe size
export function calculateVelocity(
  massFlow_lb_hr: number,
  pipeSize: ACRCopperSize,
  lineType: LineType,
  refrigerant: RefrigerantType
): number {
  const props = REFRIGERANT_PROPERTIES[refrigerant];
  const density = lineType === 'liquid' ? props.liquidDensity_lb_ft3 : props.vaporDensity_lb_ft3;
  
  // Volume flow (ft³/hr)
  const volumeFlow = massFlow_lb_hr / density;
  
  // Convert to ft³/sec
  const volumeFlowPerSec = volumeFlow / 3600;
  
  // Pipe area in ft²
  const areaFt2 = pipeSize.areaIn2 / 144;
  
  // Velocity (ft/s)
  return volumeFlowPerSec / areaFt2;
}

// Approximate pressure drop calculation (simplified)
export function calculatePressureDrop(
  massFlow_lb_hr: number,
  lengthFt: number,
  pipeSize: ACRCopperSize,
  lineType: LineType,
  refrigerant: RefrigerantType
): number {
  const props = REFRIGERANT_PROPERTIES[refrigerant];
  const density = lineType === 'liquid' ? props.liquidDensity_lb_ft3 : props.vaporDensity_lb_ft3;
  
  // Simplified pressure drop using Darcy-Weisbach approximation
  // ΔP = f * (L/D) * (ρ * V²) / 2
  const velocity = calculateVelocity(massFlow_lb_hr, pipeSize, lineType, refrigerant);
  const frictionFactor = lineType === 'liquid' ? 0.02 : 0.015;
  const diameterFt = pipeSize.id / 12;
  
  // Pressure drop in lb/ft² then convert to psi
  const pressureDropLbFt2 = frictionFactor * (lengthFt / diameterFt) * density * (velocity ** 2) / 2;
  return pressureDropLbFt2 / 144;
}

// Check oil return velocity
export function checkOilReturn(
  velocity_fps: number,
  isRiser: boolean,
  refrigerant: RefrigerantType
): OilReturnResult {
  const props = REFRIGERANT_PROPERTIES[refrigerant];
  const requiredVelocity_fpm = isRiser 
    ? props.minOilReturnVelocity_fpm.riser 
    : props.minOilReturnVelocity_fpm.horizontal;
  
  const actualVelocity_fpm = velocity_fps * 60;
  const ok = actualVelocity_fpm >= requiredVelocity_fpm;
  const margin = ((actualVelocity_fpm - requiredVelocity_fpm) / requiredVelocity_fpm) * 100;
  
  let recommendation = '';
  if (!ok) {
    if (isRiser) {
      recommendation = 'Consider using a double riser configuration or smaller pipe size for part-load oil return';
    } else {
      recommendation = 'Velocity too low for reliable oil return. Consider smaller pipe size or adding oil trap';
    }
  }
  
  return { ok, actualVelocity_fpm, requiredVelocity_fpm, margin, recommendation };
}

// Select pipe size based on capacity
export function selectPipeSize(capacityKw: number, lineType: LineType): ACRCopperSize {
  // Find appropriate size from capacity table
  const entry = VRF_CAPACITY_SIZE_TABLE.find(e => capacityKw <= e.maxCapacity_kw);
  
  if (!entry) {
    // Use largest size
    const lastEntry = VRF_CAPACITY_SIZE_TABLE[VRF_CAPACITY_SIZE_TABLE.length - 1];
    const sizeOd = lineType === 'liquid' ? lastEntry.liquidSize_od 
      : lineType === 'suction' ? lastEntry.suctionSize_od 
      : lastEntry.dischargeSize_od;
    return ACR_COPPER_SIZES.find(s => s.od === sizeOd) || ACR_COPPER_SIZES[ACR_COPPER_SIZES.length - 1];
  }
  
  const sizeOd = lineType === 'liquid' ? entry.liquidSize_od 
    : lineType === 'suction' ? entry.suctionSize_od 
    : entry.dischargeSize_od;
  
  return ACR_COPPER_SIZES.find(s => s.od === sizeOd) || ACR_COPPER_SIZES[0];
}

// Main sizing function
export function sizeRefrigerantLine(params: RefrigerantSizingParams): RefrigerantSizingResult {
  const { capacityKw, lengthFt, equivalentLengthFt, lineType, refrigerant, isRiser } = params;
  const warnings: string[] = [];
  
  // Calculate mass flow
  const massFlow = calculateRefrigerantFlow(capacityKw, refrigerant);
  
  // Select initial pipe size from capacity table
  let selectedSize = selectPipeSize(capacityKw, lineType);
  
  // Calculate velocity
  let velocity_fps = calculateVelocity(massFlow, selectedSize, lineType, refrigerant);
  let velocity_fpm = velocity_fps * 60;
  
  // Check velocity limits
  const maxVelocity_fps = lineType === 'liquid' ? 5 : 65; // ~300 fpm liquid, ~4000 fpm vapor
  const minVelocity_fps = lineType === 'liquid' ? 0.5 : (isRiser ? 16.7 : 8.3); // Oil return velocities
  
  // If velocity too high, upsize
  if (velocity_fps > maxVelocity_fps) {
    const currentIndex = ACR_COPPER_SIZES.findIndex(s => s.od === selectedSize.od);
    if (currentIndex < ACR_COPPER_SIZES.length - 1) {
      selectedSize = ACR_COPPER_SIZES[currentIndex + 1];
      velocity_fps = calculateVelocity(massFlow, selectedSize, lineType, refrigerant);
      velocity_fpm = velocity_fps * 60;
    }
    if (velocity_fps > maxVelocity_fps) {
      warnings.push(`Velocity (${velocity_fpm.toFixed(0)} fpm) exceeds recommended maximum. Consider multiple parallel lines.`);
    }
  }
  
  // If velocity too low for oil return (vapor lines only)
  if (lineType !== 'liquid' && velocity_fps < minVelocity_fps) {
    const currentIndex = ACR_COPPER_SIZES.findIndex(s => s.od === selectedSize.od);
    if (currentIndex > 0) {
      // Try smaller size
      const smallerSize = ACR_COPPER_SIZES[currentIndex - 1];
      const smallerVelocity = calculateVelocity(massFlow, smallerSize, lineType, refrigerant);
      if (smallerVelocity <= maxVelocity_fps) {
        selectedSize = smallerSize;
        velocity_fps = smallerVelocity;
        velocity_fpm = velocity_fps * 60;
      }
    }
    if (velocity_fps < minVelocity_fps) {
      warnings.push(`Low velocity may affect oil return. Consider double riser or oil separator.`);
    }
  }
  
  // Calculate pressure drop
  const totalLength = lengthFt + equivalentLengthFt;
  const pressureDrop = calculatePressureDrop(massFlow, totalLength, selectedSize, lineType, refrigerant);
  const pressureDropPer100ft = (pressureDrop / totalLength) * 100;
  
  // Check oil return
  const oilReturnCheck = checkOilReturn(velocity_fps, isRiser, refrigerant);
  if (!oilReturnCheck.ok && lineType !== 'liquid') {
    warnings.push(oilReturnCheck.recommendation);
  }
  
  return {
    recommendedSize: selectedSize,
    velocity_fps,
    velocity_fpm,
    pressureDrop_psi: pressureDrop,
    pressureDrop_psi_per_100ft: pressureDropPer100ft,
    massFlow_lb_hr: massFlow,
    oilReturnOk: lineType === 'liquid' ? true : oilReturnCheck.ok,
    oilReturnMinVelocity_fpm: oilReturnCheck.requiredVelocity_fpm,
    warnings,
  };
}

// Calculate total equivalent length from fittings
export function calculateEquivalentLength(
  fittings: { type: string; quantity: number; pipeSize: number }[]
): number {
  let total = 0;
  
  for (const fitting of fittings) {
    const fittingType = REFRIGERANT_FITTINGS.find(f => f.name === fitting.type);
    if (fittingType) {
      total += fittingType.equivalentLengthFactor * fitting.pipeSize * fitting.quantity;
    }
  }
  
  return total;
}

// VRF System limits validation
export interface VRFSystemLimits {
  maxPipingLengthFt: number;
  maxElevationOduAbove: number;
  maxElevationOduBelow: number;
  maxCapacityRatio: number;
  minCapacityRatio: number;
  maxFirstBranchLength: number;
  maxIndoorUnitsPerOdu: number;
  maxBranchLength: number;
}

export const DEFAULT_VRF_LIMITS: VRFSystemLimits = {
  maxPipingLengthFt: 540,
  maxElevationOduAbove: 160,
  maxElevationOduBelow: 130,
  maxCapacityRatio: 1.3,
  minCapacityRatio: 0.5,
  maxFirstBranchLength: 130,
  maxIndoorUnitsPerOdu: 64,
  maxBranchLength: 130,
};

export interface VRFSystemValidation {
  outdoorCapacity: number;
  totalIndoorCapacity: number;
  totalPipingLength: number;
  maxElevation: number;
  indoorUnitCount: number;
  firstBranchLength: number;
}

export function validateVRFSystem(
  system: VRFSystemValidation,
  limits: VRFSystemLimits = DEFAULT_VRF_LIMITS
): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  
  // Check total piping length
  if (system.totalPipingLength > limits.maxPipingLengthFt) {
    messages.push({
      level: 'error',
      message: `Total piping length (${system.totalPipingLength.toFixed(0)} ft) exceeds maximum limit (${limits.maxPipingLengthFt} ft)`,
      field: 'totalPipingLength',
    });
  } else if (system.totalPipingLength > limits.maxPipingLengthFt * 0.9) {
    messages.push({
      level: 'warning',
      message: `Total piping length (${system.totalPipingLength.toFixed(0)} ft) is approaching maximum limit (${limits.maxPipingLengthFt} ft)`,
      field: 'totalPipingLength',
    });
  }
  
  // Check capacity ratio
  if (system.outdoorCapacity > 0) {
    const ratio = system.totalIndoorCapacity / system.outdoorCapacity;
    if (ratio > limits.maxCapacityRatio) {
      messages.push({
        level: 'error',
        message: `Capacity ratio (${(ratio * 100).toFixed(0)}%) exceeds maximum (${limits.maxCapacityRatio * 100}%)`,
        field: 'capacityRatio',
      });
    } else if (ratio < limits.minCapacityRatio) {
      messages.push({
        level: 'warning',
        message: `Capacity ratio (${(ratio * 100).toFixed(0)}%) is below minimum (${limits.minCapacityRatio * 100}%). System may be oversized.`,
        field: 'capacityRatio',
      });
    }
  }
  
  // Check elevation
  if (system.maxElevation > limits.maxElevationOduAbove) {
    messages.push({
      level: 'error',
      message: `Maximum elevation (${system.maxElevation.toFixed(0)} ft) exceeds limit (${limits.maxElevationOduAbove} ft)`,
      field: 'elevation',
    });
  }
  
  // Check indoor unit count
  if (system.indoorUnitCount > limits.maxIndoorUnitsPerOdu) {
    messages.push({
      level: 'error',
      message: `Indoor unit count (${system.indoorUnitCount}) exceeds maximum (${limits.maxIndoorUnitsPerOdu})`,
      field: 'unitCount',
    });
  }
  
  // Check first branch length
  if (system.firstBranchLength > limits.maxFirstBranchLength) {
    messages.push({
      level: 'warning',
      message: `First branch length (${system.firstBranchLength.toFixed(0)} ft) exceeds recommended (${limits.maxFirstBranchLength} ft)`,
      field: 'firstBranchLength',
    });
  }
  
  return messages;
}

// Get pipe size display name
export function getPipeSizeName(od: number): string {
  const size = ACR_COPPER_SIZES.find(s => s.od === od);
  return size?.name || `${od}"`;
}
