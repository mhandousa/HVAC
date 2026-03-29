/**
 * AHU Configuration Calculations
 * Engineering calculations for air handling unit component sizing
 */

// ============ Types ============

export interface CoolingCoilConfig {
  coilType: 'chilled_water' | 'dx';
  rows: number;
  finsPerInch: number;
  faceVelocityFpm: number;
  enteringAirDb: number;
  enteringAirWb: number;
  leavingAirDb: number;
  leavingAirWb: number;
  chwSupplyTemp?: number;
  chwReturnTemp?: number;
  // Calculated
  faceAreaSqFt?: number;
  airPressureDropIn?: number;
  waterPressureDropFt?: number;
  totalCapacityTons?: number;
  sensibleCapacityMbh?: number;
  latentCapacityMbh?: number;
  waterFlowGpm?: number;
}

export interface HeatingCoilConfig {
  coilType: 'hot_water' | 'electric' | 'gas';
  rows?: number;
  enteringAirTemp: number;
  leavingAirTemp: number;
  hwSupplyTemp?: number;
  hwReturnTemp?: number;
  // Calculated
  capacityMbh?: number;
  waterFlowGpm?: number;
  airPressureDropIn?: number;
  electricKw?: number;
}

export interface PreheatCoilConfig {
  enabled: boolean;
  freezeProtectionSetpoint: number;
  glycolPercent: number;
  capacityMbh?: number;
}

export interface FanConfig {
  fanType: 'plenum' | 'airfoil' | 'fc_centrifugal' | 'vaneaxial';
  arrangement: 'single' | 'parallel_2' | 'parallel_3' | 'parallel_4';
  redundancy: 'n' | 'n_plus_1';
  motorType: 'premium_efficiency' | 'standard';
  hasVfd: boolean;
  vfdBrand?: string;
  designCfm: number;
  designStaticIn: number;
  // Calculated
  motorHp?: number;
  bhp?: number;
  fanEfficiency?: number;
  rpm?: number;
}

export interface FilterConfig {
  preFilterMerv: number | null;
  finalFilterMerv: number;
  filterType: 'pleated' | 'bag' | 'rigid' | 'hepa';
  faceVelocityFpm: number;
  // Calculated
  cleanPressureDropIn?: number;
  dirtyPressureDropIn?: number;
  filterBankSizeSqFt?: number;
}

export interface DamperConfig {
  outsideAir: {
    widthIn: number;
    heightIn: number;
    actuatorType: 'modulating' | 'two_position';
    failPosition: 'open' | 'closed';
  };
  returnAir: {
    widthIn: number;
    heightIn: number;
    actuatorType: 'modulating' | 'two_position';
    failPosition: 'open' | 'closed';
  };
  exhaust: {
    enabled: boolean;
    widthIn?: number;
    heightIn?: number;
    actuatorType?: 'modulating' | 'two_position';
    failPosition?: 'open' | 'closed';
  };
  isolation: {
    enabled: boolean;
    motorized: boolean;
  };
}

export interface ControlSequenceConfig {
  controlStrategy: 'vav' | 'cav' | 'doas' | 'dual_duct';
  economizerType: 'none' | 'dry_bulb' | 'enthalpy' | 'differential_enthalpy';
  economizerLockoutTempF: number;
  supplyAirTempSetpointF: number;
  ductStaticSetpointIn: number;
  minOaDamperPosition: number;
  mixedAirLowLimitF: number;
  hasCo2Sensors: boolean;
  hasDcv: boolean;
}

export interface CoilSizingResult {
  faceAreaSqFt: number;
  faceVelocityFpm: number;
  airPressureDropIn: number;
  waterPressureDropFt: number;
  totalCapacityTons: number;
  sensibleCapacityMbh: number;
  latentCapacityMbh: number;
  waterFlowGpm: number;
}

export interface FanPowerResult {
  bhp: number;
  motorHp: number;
  fanEfficiency: number;
  estimatedRpm: number;
  annualEnergyKwh: number;
}

export interface PressureDropSummary {
  coolingCoilIn: number;
  heatingCoilIn: number;
  preheatCoilIn: number;
  filtersCleanIn: number;
  filtersDirtyIn: number;
  dampersIn: number;
  ductworkIn: number;
  diffusersIn: number;
  totalCleanIn: number;
  totalDirtyIn: number;
}

// ============ Constants ============

const AIR_DENSITY_LBM_FT3 = 0.075;
const AIR_SPECIFIC_HEAT_BTU_LBM_F = 0.24;
const WATER_DENSITY_LBM_GAL = 8.33;
const WATER_SPECIFIC_HEAT_BTU_LBM_F = 1.0;
const BTU_PER_TON = 12000;
const BTU_PER_MBH = 1000;

// ============ Cooling Coil Calculations ============

export function sizeCoolingCoil(params: {
  airflowCfm: number;
  enteringAirDb: number;
  enteringAirWb: number;
  leavingAirDb: number;
  leavingAirWb: number;
  chwSupplyTemp: number;
  chwReturnTemp: number;
  rows?: number;
  finsPerInch?: number;
  targetFaceVelocity?: number;
}): CoilSizingResult {
  const {
    airflowCfm,
    enteringAirDb,
    enteringAirWb,
    leavingAirDb,
    leavingAirWb,
    chwSupplyTemp,
    chwReturnTemp,
    rows = 6,
    finsPerInch = 12,
    targetFaceVelocity = 500,
  } = params;

  // Calculate face area based on target velocity
  const faceAreaSqFt = airflowCfm / targetFaceVelocity;
  const actualFaceVelocity = airflowCfm / faceAreaSqFt;

  // Sensible capacity: Q = 1.08 × CFM × ΔT
  const sensibleDeltaT = enteringAirDb - leavingAirDb;
  const sensibleCapacityBtuh = 1.08 * airflowCfm * sensibleDeltaT;
  const sensibleCapacityMbh = sensibleCapacityBtuh / BTU_PER_MBH;

  // Estimate total capacity using enthalpy difference (simplified)
  // Using approximation: total ≈ sensible × 1.3 for typical cooling conditions
  const enthalpyRatio = 1 + (enteringAirWb - leavingAirWb) / (enteringAirDb - leavingAirDb + 0.1);
  const totalCapacityBtuh = sensibleCapacityBtuh * Math.max(1, enthalpyRatio);
  const totalCapacityTons = totalCapacityBtuh / BTU_PER_TON;

  const latentCapacityMbh = (totalCapacityBtuh - sensibleCapacityBtuh) / BTU_PER_MBH;

  // Water flow: GPM = Btuh / (500 × ΔT)
  const waterDeltaT = chwReturnTemp - chwSupplyTemp;
  const waterFlowGpm = totalCapacityBtuh / (500 * waterDeltaT);

  // Pressure drop estimates based on rows and velocity
  // Air side: approximately 0.15" per row at 500 fpm, scales with velocity squared
  const velocityFactor = (actualFaceVelocity / 500) ** 2;
  const airPressureDropIn = 0.15 * rows * velocityFactor * (finsPerInch / 12);

  // Water side: approximately 2-3 ft per row for typical coils
  const waterPressureDropFt = 2.5 * rows;

  return {
    faceAreaSqFt: Math.round(faceAreaSqFt * 10) / 10,
    faceVelocityFpm: Math.round(actualFaceVelocity),
    airPressureDropIn: Math.round(airPressureDropIn * 100) / 100,
    waterPressureDropFt: Math.round(waterPressureDropFt * 10) / 10,
    totalCapacityTons: Math.round(totalCapacityTons * 10) / 10,
    sensibleCapacityMbh: Math.round(sensibleCapacityMbh * 10) / 10,
    latentCapacityMbh: Math.round(latentCapacityMbh * 10) / 10,
    waterFlowGpm: Math.round(waterFlowGpm * 10) / 10,
  };
}

// ============ Heating Coil Calculations ============

export function sizeHeatingCoil(params: {
  airflowCfm: number;
  enteringAirTemp: number;
  leavingAirTemp: number;
  coilType: 'hot_water' | 'electric' | 'gas';
  hwSupplyTemp?: number;
  hwReturnTemp?: number;
  rows?: number;
}): {
  capacityMbh: number;
  waterFlowGpm: number | null;
  electricKw: number | null;
  airPressureDropIn: number;
} {
  const {
    airflowCfm,
    enteringAirTemp,
    leavingAirTemp,
    coilType,
    hwSupplyTemp = 180,
    hwReturnTemp = 160,
    rows = 1,
  } = params;

  // Heating capacity: Q = 1.08 × CFM × ΔT
  const deltaT = leavingAirTemp - enteringAirTemp;
  const capacityBtuh = 1.08 * airflowCfm * deltaT;
  const capacityMbh = capacityBtuh / BTU_PER_MBH;

  let waterFlowGpm: number | null = null;
  let electricKw: number | null = null;

  if (coilType === 'hot_water') {
    const waterDeltaT = hwSupplyTemp - hwReturnTemp;
    waterFlowGpm = capacityBtuh / (500 * waterDeltaT);
    waterFlowGpm = Math.round(waterFlowGpm * 10) / 10;
  } else if (coilType === 'electric') {
    // 3412 BTU/hr per kW
    electricKw = capacityBtuh / 3412;
    electricKw = Math.round(electricKw * 10) / 10;
  }

  // Air pressure drop: approximately 0.08" per row for heating coils
  const airPressureDropIn = 0.08 * rows;

  return {
    capacityMbh: Math.round(capacityMbh * 10) / 10,
    waterFlowGpm,
    electricKw,
    airPressureDropIn: Math.round(airPressureDropIn * 100) / 100,
  };
}

// ============ Fan Power Calculations ============

export function calculateFanPower(params: {
  cfm: number;
  staticPressureIn: number;
  fanEfficiency?: number;
  motorEfficiency?: number;
  driveType?: 'direct' | 'belt';
  operatingHoursPerYear?: number;
}): FanPowerResult {
  const {
    cfm,
    staticPressureIn,
    fanEfficiency = 0.65,
    motorEfficiency = 0.93,
    driveType = 'direct',
    operatingHoursPerYear = 4380, // 12 hrs/day × 365 days
  } = params;

  // BHP = (CFM × SP) / (6356 × Fan Efficiency)
  const bhp = (cfm * staticPressureIn) / (6356 * fanEfficiency);

  // Account for drive losses
  const driveLoss = driveType === 'belt' ? 0.95 : 1.0;
  const shaftPower = bhp / driveLoss;

  // Motor HP sizing (next standard size with safety factor)
  const motorHpRaw = shaftPower / motorEfficiency * 1.1; // 10% safety
  const standardHpSizes = [0.5, 0.75, 1, 1.5, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200];
  const motorHp = standardHpSizes.find(hp => hp >= motorHpRaw) || motorHpRaw;

  // Estimate RPM based on fan type and size (simplified)
  const estimatedRpm = cfm < 5000 ? 1750 : cfm < 20000 ? 1150 : 850;

  // Annual energy consumption
  const kw = (bhp * 0.746) / motorEfficiency;
  const annualEnergyKwh = kw * operatingHoursPerYear;

  return {
    bhp: Math.round(bhp * 100) / 100,
    motorHp,
    fanEfficiency,
    estimatedRpm,
    annualEnergyKwh: Math.round(annualEnergyKwh),
  };
}

// ============ Filter Pressure Drop ============

export function calculateFilterPressureDrop(params: {
  airflowCfm: number;
  filterMerv: number;
  filterType: 'pleated' | 'bag' | 'rigid' | 'hepa';
  faceVelocityFpm?: number;
}): { cleanIn: number; dirtyIn: number; filterAreaSqFt: number } {
  const { airflowCfm, filterMerv, filterType, faceVelocityFpm = 400 } = params;

  // Base pressure drops by MERV rating (clean)
  const mervBasePressure: Record<number, number> = {
    8: 0.15,
    10: 0.20,
    13: 0.35,
    14: 0.40,
    15: 0.50,
    16: 0.60,
    17: 1.0,  // HEPA
    18: 1.2,
  };

  // Filter type multipliers
  const typeMultiplier: Record<string, number> = {
    pleated: 1.0,
    bag: 0.8,
    rigid: 1.1,
    hepa: 1.5,
  };

  const basePressure = mervBasePressure[filterMerv] || 0.3;
  const cleanIn = basePressure * (typeMultiplier[filterType] || 1.0);

  // Dirty filter is typically 2-3x clean
  const dirtyMultiplier = filterType === 'hepa' ? 2.0 : 2.5;
  const dirtyIn = cleanIn * dirtyMultiplier;

  // Filter face area
  const filterAreaSqFt = airflowCfm / faceVelocityFpm;

  return {
    cleanIn: Math.round(cleanIn * 100) / 100,
    dirtyIn: Math.round(dirtyIn * 100) / 100,
    filterAreaSqFt: Math.round(filterAreaSqFt * 10) / 10,
  };
}

// ============ Damper Sizing ============

export function calculateDamperSize(params: {
  airflowCfm: number;
  targetVelocityFpm?: number;
}): { widthIn: number; heightIn: number; velocityFpm: number } {
  const { airflowCfm, targetVelocityFpm = 1500 } = params;

  // Calculate required area in sq inches
  const areaSqFt = airflowCfm / targetVelocityFpm;
  const areaSqIn = areaSqFt * 144;

  // Assume roughly square damper, round to nearest 2"
  const sideIn = Math.sqrt(areaSqIn);
  const roundedSide = Math.ceil(sideIn / 2) * 2;

  const actualVelocity = airflowCfm / ((roundedSide * roundedSide) / 144);

  return {
    widthIn: roundedSide,
    heightIn: roundedSide,
    velocityFpm: Math.round(actualVelocity),
  };
}

// ============ Total Pressure Drop ============

export function calculateTotalPressureDrop(components: {
  coolingCoilIn?: number;
  heatingCoilIn?: number;
  preheatCoilIn?: number;
  filtersCleanIn?: number;
  filtersDirtyIn?: number;
  dampersIn?: number;
  ductworkIn?: number;
  diffusersIn?: number;
  otherIn?: number;
}): PressureDropSummary {
  const {
    coolingCoilIn = 0,
    heatingCoilIn = 0,
    preheatCoilIn = 0,
    filtersCleanIn = 0,
    filtersDirtyIn = 0,
    dampersIn = 0.1,
    ductworkIn = 0,
    diffusersIn = 0,
    otherIn = 0,
  } = components;

  const totalCleanIn = coolingCoilIn + heatingCoilIn + preheatCoilIn + 
    filtersCleanIn + dampersIn + ductworkIn + diffusersIn + otherIn;

  const totalDirtyIn = coolingCoilIn + heatingCoilIn + preheatCoilIn + 
    filtersDirtyIn + dampersIn + ductworkIn + diffusersIn + otherIn;

  return {
    coolingCoilIn,
    heatingCoilIn,
    preheatCoilIn,
    filtersCleanIn,
    filtersDirtyIn,
    dampersIn,
    ductworkIn,
    diffusersIn,
    totalCleanIn: Math.round(totalCleanIn * 100) / 100,
    totalDirtyIn: Math.round(totalDirtyIn * 100) / 100,
  };
}

// ============ ASHRAE Compliance Checks ============

export function checkASHRAE901FanPower(params: {
  bhp: number;
  cfm: number;
  staticPressureIn: number;
}): { compliant: boolean; allowedBhp: number; actualWPerCfm: number; limitWPerCfm: number } {
  const { bhp, cfm, staticPressureIn } = params;

  // ASHRAE 90.1-2019 Table 6.5.3.1.1A - Fan Power Limitation
  // Simplified: allowed fan power varies by system type and pressure
  // Base limit: 0.0013 bhp/cfm × (static pressure adjustment)
  const baseLimitBhpPerCfm = 0.0013;
  const pressureAdjustment = 1 + (staticPressureIn - 2.5) * 0.1; // Adjust from 2.5" baseline
  const allowedBhpPerCfm = baseLimitBhpPerCfm * Math.max(1, pressureAdjustment);
  const allowedBhp = allowedBhpPerCfm * cfm;

  const actualWPerCfm = (bhp * 746) / cfm;
  const limitWPerCfm = allowedBhpPerCfm * 746;

  return {
    compliant: bhp <= allowedBhp,
    allowedBhp: Math.round(allowedBhp * 100) / 100,
    actualWPerCfm: Math.round(actualWPerCfm * 100) / 100,
    limitWPerCfm: Math.round(limitWPerCfm * 100) / 100,
  };
}

export function checkASHRAE621Ventilation(params: {
  outdoorAirCfm: number;
  designCfm: number;
  occupancy: number;
  floorAreaSqFt: number;
  spaceType?: string;
}): { compliant: boolean; requiredOaCfm: number; actualOaPercent: number } {
  const { outdoorAirCfm, designCfm, occupancy, floorAreaSqFt, spaceType = 'office' } = params;

  // ASHRAE 62.1 Table 6-1 simplified rates
  const ratePerPerson: Record<string, number> = {
    office: 5,
    conference: 5,
    retail: 7.5,
    classroom: 10,
    lobby: 5,
  };

  const ratePerSqFt: Record<string, number> = {
    office: 0.06,
    conference: 0.06,
    retail: 0.12,
    classroom: 0.12,
    lobby: 0.06,
  };

  const Rp = ratePerPerson[spaceType] || 5;
  const Ra = ratePerSqFt[spaceType] || 0.06;
  const requiredOaCfm = Rp * occupancy + Ra * floorAreaSqFt;

  const actualOaPercent = (outdoorAirCfm / designCfm) * 100;

  return {
    compliant: outdoorAirCfm >= requiredOaCfm,
    requiredOaCfm: Math.round(requiredOaCfm),
    actualOaPercent: Math.round(actualOaPercent * 10) / 10,
  };
}

// ============ Generate AHU Tag ============

export function generateAHUTag(params: {
  buildingCode?: string;
  floor?: string;
  sequence?: number;
  systemType?: string;
}): string {
  const {
    buildingCode = 'BLD',
    floor = '01',
    sequence = 1,
    systemType = 'AHU',
  } = params;

  const seqStr = sequence.toString().padStart(2, '0');
  return `${systemType}-${buildingCode}-${floor}-${seqStr}`;
}
