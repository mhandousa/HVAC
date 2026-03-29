/**
 * Terminal Unit Calculations Library
 * Engineering calculations for VAV boxes and Fan Coil Units
 */

// Terminal unit types
export type TerminalUnitType = 
  | 'vav_cooling' 
  | 'vav_reheat' 
  | 'fcu_2pipe' 
  | 'fcu_4pipe' 
  | 'fcu_electric';

export interface TerminalUnitConfig {
  id: TerminalUnitType;
  name: string;
  description: string;
  hasReheat: boolean;
  hasCoolingCoil: boolean;
  hasHeatingCoil: boolean;
  isFCU: boolean;
}

export const TERMINAL_UNIT_TYPES: TerminalUnitConfig[] = [
  {
    id: 'vav_cooling',
    name: 'VAV Cooling Only',
    description: 'Variable air volume box for cooling applications',
    hasReheat: false,
    hasCoolingCoil: false,
    hasHeatingCoil: false,
    isFCU: false,
  },
  {
    id: 'vav_reheat',
    name: 'VAV with Reheat',
    description: 'Variable air volume box with hot water or electric reheat',
    hasReheat: true,
    hasCoolingCoil: false,
    hasHeatingCoil: true,
    isFCU: false,
  },
  {
    id: 'fcu_2pipe',
    name: 'FCU 2-Pipe',
    description: 'Fan coil unit with single coil for heating or cooling',
    hasReheat: false,
    hasCoolingCoil: true,
    hasHeatingCoil: false,
    isFCU: true,
  },
  {
    id: 'fcu_4pipe',
    name: 'FCU 4-Pipe',
    description: 'Fan coil unit with separate cooling and heating coils',
    hasReheat: false,
    hasCoolingCoil: true,
    hasHeatingCoil: true,
    isFCU: true,
  },
  {
    id: 'fcu_electric',
    name: 'FCU Electric Heat',
    description: 'Fan coil unit with cooling coil and electric heater',
    hasReheat: false,
    hasCoolingCoil: true,
    hasHeatingCoil: true,
    isFCU: true,
  },
];

// Standard VAV sizes catalog
export interface VAVStandardSize {
  inlet: number;  // inches
  maxCfm: number;
  minCfm: number;
  typicalNC: number;
}

export const VAV_STANDARD_SIZES: VAVStandardSize[] = [
  { inlet: 4, maxCfm: 100, minCfm: 30, typicalNC: 20 },
  { inlet: 5, maxCfm: 175, minCfm: 50, typicalNC: 22 },
  { inlet: 6, maxCfm: 275, minCfm: 80, typicalNC: 25 },
  { inlet: 7, maxCfm: 400, minCfm: 120, typicalNC: 27 },
  { inlet: 8, maxCfm: 550, minCfm: 165, typicalNC: 30 },
  { inlet: 10, maxCfm: 900, minCfm: 270, typicalNC: 33 },
  { inlet: 12, maxCfm: 1400, minCfm: 420, typicalNC: 35 },
  { inlet: 14, maxCfm: 2000, minCfm: 600, typicalNC: 38 },
  { inlet: 16, maxCfm: 2800, minCfm: 840, typicalNC: 40 },
];

// Standard FCU sizes catalog
export interface FCUStandardSize {
  model: string;
  cfm: number;
  coolingMbh: number;
  heatingMbh: number;
  typicalNC: number;
  motorHp: number;
}

export const FCU_STANDARD_SIZES: FCUStandardSize[] = [
  { model: '200', cfm: 200, coolingMbh: 6, heatingMbh: 8, typicalNC: 30, motorHp: 0.125 },
  { model: '300', cfm: 300, coolingMbh: 9, heatingMbh: 12, typicalNC: 32, motorHp: 0.125 },
  { model: '400', cfm: 400, coolingMbh: 12, heatingMbh: 16, typicalNC: 34, motorHp: 0.25 },
  { model: '600', cfm: 600, coolingMbh: 18, heatingMbh: 24, typicalNC: 36, motorHp: 0.33 },
  { model: '800', cfm: 800, coolingMbh: 24, heatingMbh: 32, typicalNC: 38, motorHp: 0.5 },
  { model: '1000', cfm: 1000, coolingMbh: 30, heatingMbh: 40, typicalNC: 40, motorHp: 0.5 },
  { model: '1200', cfm: 1200, coolingMbh: 36, heatingMbh: 48, typicalNC: 42, motorHp: 0.75 },
];

// Saudi NC standards for terminal units
export interface NCStandard {
  spaceType: string;
  targetNC: number;
  maxInletVelocity: number;
}

export const SAUDI_NC_STANDARDS: NCStandard[] = [
  { spaceType: 'Prayer Hall', targetNC: 25, maxInletVelocity: 1500 },
  { spaceType: 'Hospital', targetNC: 30, maxInletVelocity: 1800 },
  { spaceType: 'Hotel Room', targetNC: 35, maxInletVelocity: 2000 },
  { spaceType: 'Office', targetNC: 40, maxInletVelocity: 2200 },
  { spaceType: 'Retail', targetNC: 45, maxInletVelocity: 2500 },
  { spaceType: 'Industrial', targetNC: 50, maxInletVelocity: 3000 },
];

// VAV Sizing Interfaces
export interface VAVSizingInput {
  maxCfm: number;
  minCfmRatio?: number;
  ventilationCfm?: number;
  supplyTempF?: number;
  roomTempF?: number;
  hasReheat?: boolean;
  reheatType?: 'hot_water' | 'electric' | 'none';
  hwEnteringTempF?: number;
  hwLeavingTempF?: number;
}

export interface VAVSizingResult {
  inletSizeIn: number;
  maxCfm: number;
  minCfm: number;
  inletVelocityFpm: number;
  estimatedNC: number;
  reheatCapacityBtuh: number;
  reheatKw: number;
  hwFlowGpm: number;
  selectedSize: VAVStandardSize;
  isWithinCapacity: boolean;
  velocityStatus: 'good' | 'warning' | 'high';
}

// FCU Sizing Interfaces
export interface FCUSizingInput {
  coolingLoadBtuh: number;
  heatingLoadBtuh?: number;
  cfmRequired: number;
  unitType: 'fcu_2pipe' | 'fcu_4pipe' | 'fcu_electric';
  chwEnteringTempF?: number;
  chwLeavingTempF?: number;
  hwEnteringTempF?: number;
  hwLeavingTempF?: number;
}

export interface FCUSizingResult {
  model: string;
  nominalCfm: number;
  coolingCapacityMbh: number;
  heatingCapacityMbh: number;
  chwFlowGpm: number;
  hwFlowGpm: number;
  coilRows: number;
  finsPerInch: number;
  estimatedNC: number;
  motorHp: number;
  selectedSize: FCUStandardSize;
  isWithinCapacity: boolean;
  electricHeatKw?: number;
}

/**
 * Calculate VAV inlet size based on CFM
 */
export function calculateVAVInletSize(maxCfm: number): number {
  const size = VAV_STANDARD_SIZES.find(s => s.maxCfm >= maxCfm);
  return size?.inlet || 16;
}

/**
 * Calculate minimum CFM for VAV box
 * Must meet both minimum ratio AND ventilation requirement
 */
export function calculateVAVMinCfm(
  maxCfm: number, 
  ventilationCfm: number = 0, 
  minRatio: number = 0.3
): number {
  const minByRatio = maxCfm * minRatio;
  return Math.max(minByRatio, ventilationCfm);
}

/**
 * Calculate reheat capacity for VAV box
 * Based on minimum CFM and temperature rise needed
 */
export function calculateReheatCapacity(
  minCfm: number, 
  supplyTempF: number = 55, 
  roomTempF: number = 72
): number {
  // Q = 1.08 × CFM × ΔT
  const deltaT = roomTempF - supplyTempF;
  return minCfm * 1.08 * deltaT;
}

/**
 * Calculate hot water flow for reheat coil
 */
export function calculateHWFlow(
  capacityBtuh: number,
  enteringTempF: number = 140,
  leavingTempF: number = 120
): number {
  // GPM = Q / (500 × ΔT)
  const deltaT = enteringTempF - leavingTempF;
  if (deltaT <= 0) return 0;
  return capacityBtuh / (500 * deltaT);
}

/**
 * Estimate inlet velocity for VAV box
 */
export function calculateInletVelocity(cfm: number, inletSizeIn: number): number {
  // Area in sq ft
  const areaFt2 = Math.PI * Math.pow(inletSizeIn / 24, 2);
  return cfm / areaFt2;
}

/**
 * Estimate NC rating for VAV based on velocity
 */
export function estimateVAVNoise(velocity: number): number {
  // Approximate NC = 15 + (velocity / 100)
  return Math.round(15 + (velocity / 100));
}

/**
 * Complete VAV box sizing
 */
export function sizeVAVBox(params: VAVSizingInput): VAVSizingResult {
  const {
    maxCfm,
    minCfmRatio = 0.3,
    ventilationCfm = 0,
    supplyTempF = 55,
    roomTempF = 72,
    hasReheat = false,
    hwEnteringTempF = 140,
    hwLeavingTempF = 120,
  } = params;

  // Find appropriate inlet size
  const selectedSize = VAV_STANDARD_SIZES.find(s => s.maxCfm >= maxCfm) 
    || VAV_STANDARD_SIZES[VAV_STANDARD_SIZES.length - 1];
  
  // Calculate minimum CFM
  const minCfm = calculateVAVMinCfm(maxCfm, ventilationCfm, minCfmRatio);
  
  // Calculate inlet velocity
  const inletVelocity = calculateInletVelocity(maxCfm, selectedSize.inlet);
  
  // Estimate NC rating
  const estimatedNC = Math.max(selectedSize.typicalNC, estimateVAVNoise(inletVelocity));
  
  // Calculate reheat if needed
  let reheatCapacityBtuh = 0;
  let hwFlowGpm = 0;
  
  if (hasReheat) {
    reheatCapacityBtuh = calculateReheatCapacity(minCfm, supplyTempF, roomTempF);
    hwFlowGpm = calculateHWFlow(reheatCapacityBtuh, hwEnteringTempF, hwLeavingTempF);
  }
  
  // Velocity status
  let velocityStatus: 'good' | 'warning' | 'high' = 'good';
  if (inletVelocity > 2500) {
    velocityStatus = 'high';
  } else if (inletVelocity > 2000) {
    velocityStatus = 'warning';
  }

  return {
    inletSizeIn: selectedSize.inlet,
    maxCfm,
    minCfm: Math.round(minCfm),
    inletVelocityFpm: Math.round(inletVelocity),
    estimatedNC,
    reheatCapacityBtuh: Math.round(reheatCapacityBtuh),
    reheatKw: Math.round(reheatCapacityBtuh / 3412 * 10) / 10,
    hwFlowGpm: Math.round(hwFlowGpm * 10) / 10,
    selectedSize,
    isWithinCapacity: maxCfm <= selectedSize.maxCfm,
    velocityStatus,
  };
}

/**
 * Calculate FCU coil capacity
 */
export function calculateFCUCoilCapacity(
  cfm: number, 
  enteringTemp: number, 
  leavingTemp: number
): number {
  // Sensible heat: Q = 1.08 × CFM × ΔT
  return cfm * 1.08 * Math.abs(enteringTemp - leavingTemp);
}

/**
 * Calculate water flow for FCU coils
 */
export function calculateFCUWaterFlow(
  capacityBtuh: number, 
  enteringTempF: number,
  leavingTempF: number
): number {
  // GPM = Q / (500 × ΔT)
  const deltaT = Math.abs(enteringTempF - leavingTempF);
  if (deltaT <= 0) return 0;
  return capacityBtuh / (500 * deltaT);
}

/**
 * Estimate NC rating for FCU
 */
export function estimateFCUNoise(cfm: number): number {
  // Approximate based on airflow
  return Math.round(25 + (cfm / 200));
}

/**
 * Determine coil configuration based on capacity
 */
export function determineCoilConfig(capacityBtuh: number): { rows: number; finsPerInch: number } {
  if (capacityBtuh > 30000) {
    return { rows: 4, finsPerInch: 12 };
  } else if (capacityBtuh > 18000) {
    return { rows: 3, finsPerInch: 12 };
  } else if (capacityBtuh > 9000) {
    return { rows: 2, finsPerInch: 10 };
  }
  return { rows: 1, finsPerInch: 8 };
}

/**
 * Complete FCU sizing
 */
export function sizeFCU(params: FCUSizingInput): FCUSizingResult {
  const {
    coolingLoadBtuh,
    heatingLoadBtuh = 0,
    cfmRequired,
    unitType,
    chwEnteringTempF = 44,
    chwLeavingTempF = 54,
    hwEnteringTempF = 140,
    hwLeavingTempF = 120,
  } = params;

  // Find appropriate unit size (size by cooling capacity)
  const selectedSize = FCU_STANDARD_SIZES.find(
    u => u.coolingMbh * 1000 >= coolingLoadBtuh && u.cfm >= cfmRequired
  ) || FCU_STANDARD_SIZES[FCU_STANDARD_SIZES.length - 1];

  // Calculate CHW flow
  const chwDeltaT = chwLeavingTempF - chwEnteringTempF;
  const chwGpm = coolingLoadBtuh / (500 * Math.abs(chwDeltaT));

  // Calculate HW flow (if 4-pipe)
  let hwGpm = 0;
  let electricHeatKw: number | undefined;
  
  if (unitType === 'fcu_4pipe' && heatingLoadBtuh > 0) {
    const hwDeltaT = hwEnteringTempF - hwLeavingTempF;
    hwGpm = heatingLoadBtuh / (500 * Math.abs(hwDeltaT));
  } else if (unitType === 'fcu_electric' && heatingLoadBtuh > 0) {
    electricHeatKw = Math.ceil(heatingLoadBtuh / 3412);
  }

  // Determine coil configuration
  const coilConfig = determineCoilConfig(coolingLoadBtuh);

  // Estimate NC
  const estimatedNC = Math.max(selectedSize.typicalNC, estimateFCUNoise(cfmRequired));

  return {
    model: selectedSize.model,
    nominalCfm: selectedSize.cfm,
    coolingCapacityMbh: selectedSize.coolingMbh,
    heatingCapacityMbh: heatingLoadBtuh > 0 ? selectedSize.heatingMbh : 0,
    chwFlowGpm: Math.round(chwGpm * 10) / 10,
    hwFlowGpm: Math.round(hwGpm * 10) / 10,
    coilRows: coilConfig.rows,
    finsPerInch: coilConfig.finsPerInch,
    estimatedNC,
    motorHp: selectedSize.motorHp,
    selectedSize,
    isWithinCapacity: coolingLoadBtuh <= selectedSize.coolingMbh * 1000,
    electricHeatKw,
  };
}

/**
 * Get unit type configuration
 */
export function getUnitTypeConfig(type: TerminalUnitType): TerminalUnitConfig | undefined {
  return TERMINAL_UNIT_TYPES.find(t => t.id === type);
}

/**
 * Check if unit type is VAV
 */
export function isVAVType(type: TerminalUnitType): boolean {
  return type === 'vav_cooling' || type === 'vav_reheat';
}

/**
 * Check if unit type is FCU
 */
export function isFCUType(type: TerminalUnitType): boolean {
  return type === 'fcu_2pipe' || type === 'fcu_4pipe' || type === 'fcu_electric';
}

/**
 * Generate unit tag based on type and index
 */
export function generateUnitTag(
  type: TerminalUnitType, 
  index: number, 
  zonePrefix?: string
): string {
  const prefix = isVAVType(type) ? 'VAV' : 'FCU';
  const zoneTag = zonePrefix ? `${zonePrefix}-` : '';
  return `${prefix}-${zoneTag}${String(index).padStart(2, '0')}`;
}
