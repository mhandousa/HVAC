// Chilled Water Plant Sizing Calculations
// Based on ASHRAE Handbook - HVAC Systems and Equipment

export interface ChillerSizingInput {
  designLoadTons: number;
  diversityFactor: number;
  futureExpansionPercent: number;
  redundancyMode: 'n' | 'n+1' | '2n';
  preferredChillerCount?: number;
  chillerType: 'water-cooled' | 'air-cooled';
}

export interface ChillerSizingResult {
  totalRequiredCapacityTons: number;
  numberOfChillers: number;
  capacityPerChillerTons: number;
  installedCapacityTons: number;
  redundancyPercent: number;
  partLoadAtDesign: number;
}

export interface PumpSizingInput {
  flowGpm: number;
  headFt: number;
  efficiency?: number;
  motorEfficiency?: number;
  numberOfPumps: number;
  redundancy: boolean;
}

export interface PumpSizingResult {
  flowPerPumpGpm: number;
  headFt: number;
  hydraulicHp: number;
  brakeHp: number;
  motorHp: number;
  motorKw: number;
  numberOfPumps: number;
  runningPumps: number;
}

export interface CoolingTowerInput {
  heatRejectionTons: number;
  approachF: number;
  rangeF: number;
  wetBulbF: number;
  numberOfCells?: number;
}

export interface CoolingTowerResult {
  totalCapacityTons: number;
  numberOfCells: number;
  capacityPerCellTons: number;
  estimatedFanHp: number;
  estimatedFanKw: number;
  designWetBulbF: number;
  leavingWaterTempF: number;
  enteringWaterTempF: number;
}

export interface HeaderPipeSizingInput {
  flowGpm: number;
  fluidType: 'chw' | 'cw';
  maxVelocityFps?: number;
}

export interface HeaderPipeSizingResult {
  flowGpm: number;
  pipeSizeIn: number;
  velocityFps: number;
  frictionLossFtPer100Ft: number;
}

export interface PlantSummary {
  designLoadTons: number;
  installedCapacityTons: number;
  chwFlowGpm: number;
  cwFlowGpm: number;
  totalPumpPowerKw: number;
  totalTowerFanPowerKw: number;
  estimatedPlantKwPerTon: number;
}

// Standard motor sizes (HP)
const STANDARD_MOTOR_SIZES = [1, 1.5, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300, 350, 400, 450, 500];

// Standard pipe sizes (inches)
const STANDARD_PIPE_SIZES = [2, 2.5, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 24, 30, 36];

/**
 * Calculate chilled water flow rate from cooling load
 * Formula: GPM = Tons × 24 / Delta-T
 */
export function calculateChwFlow(tons: number, deltaT: number = 10): number {
  return (tons * 24) / deltaT;
}

/**
 * Calculate condenser water flow rate
 * Typical: 3.0 GPM per ton for water-cooled chillers
 */
export function calculateCwFlow(tons: number, gpmPerTon: number = 3.0): number {
  return tons * gpmPerTon;
}

/**
 * Calculate cooling tower heat rejection capacity
 * Heat rejection = Chiller load × (1 + 1/COP)
 * Simplified: approximately 1.25× chiller load
 */
export function calculateHeatRejection(chillerTons: number, cop: number = 5.0): number {
  return chillerTons * (1 + 1 / cop);
}

/**
 * Select next standard motor size
 */
export function selectMotorSize(requiredHp: number): number {
  for (const size of STANDARD_MOTOR_SIZES) {
    if (size >= requiredHp) {
      return size;
    }
  }
  return STANDARD_MOTOR_SIZES[STANDARD_MOTOR_SIZES.length - 1];
}

/**
 * Select pipe size based on flow and velocity limits
 */
export function selectPipeSize(flowGpm: number, maxVelocityFps: number = 8): number {
  // Velocity = 0.4085 × GPM / D²  (where D is in inches)
  // Therefore: D = sqrt(0.4085 × GPM / V)
  const minDiameter = Math.sqrt((0.4085 * flowGpm) / maxVelocityFps);
  
  for (const size of STANDARD_PIPE_SIZES) {
    if (size >= minDiameter) {
      return size;
    }
  }
  return STANDARD_PIPE_SIZES[STANDARD_PIPE_SIZES.length - 1];
}

/**
 * Calculate actual velocity in pipe
 */
export function calculatePipeVelocity(flowGpm: number, pipeDiameterIn: number): number {
  return 0.4085 * flowGpm / (pipeDiameterIn * pipeDiameterIn);
}

/**
 * Estimate friction loss in pipe (Hazen-Williams)
 * Assumes C = 150 for steel pipe
 */
export function calculateFrictionLoss(flowGpm: number, pipeDiameterIn: number, cFactor: number = 150): number {
  // Hazen-Williams: hf = 10.44 × L × Q^1.85 / (C^1.85 × D^4.87)
  // For 100 ft length:
  const q = flowGpm;
  const d = pipeDiameterIn;
  return 10.44 * 100 * Math.pow(q, 1.85) / (Math.pow(cFactor, 1.85) * Math.pow(d, 4.87));
}

/**
 * Size chillers based on load and configuration
 */
export function calculateChillerSizing(input: ChillerSizingInput): ChillerSizingResult {
  const { designLoadTons, diversityFactor, futureExpansionPercent, redundancyMode, preferredChillerCount, chillerType } = input;
  
  // Calculate total required capacity
  const diversifiedLoad = designLoadTons * diversityFactor;
  const futureLoad = diversifiedLoad * (1 + futureExpansionPercent / 100);
  
  // Determine number of chillers
  let numberOfChillers: number;
  let runningChillers: number;
  
  if (preferredChillerCount && preferredChillerCount >= 1) {
    numberOfChillers = preferredChillerCount;
  } else {
    // Auto-calculate based on load
    if (futureLoad <= 200) {
      numberOfChillers = redundancyMode === 'n' ? 1 : 2;
    } else if (futureLoad <= 500) {
      numberOfChillers = redundancyMode === '2n' ? 4 : (redundancyMode === 'n+1' ? 3 : 2);
    } else if (futureLoad <= 1000) {
      numberOfChillers = redundancyMode === '2n' ? 6 : (redundancyMode === 'n+1' ? 4 : 3);
    } else {
      numberOfChillers = redundancyMode === '2n' ? 8 : (redundancyMode === 'n+1' ? 5 : 4);
    }
  }
  
  // Adjust for redundancy
  switch (redundancyMode) {
    case 'n+1':
      runningChillers = numberOfChillers - 1;
      break;
    case '2n':
      runningChillers = numberOfChillers / 2;
      break;
    default: // 'n'
      runningChillers = numberOfChillers;
  }
  
  // Calculate capacity per chiller
  const capacityPerChiller = Math.ceil(futureLoad / runningChillers);
  const installedCapacity = capacityPerChiller * numberOfChillers;
  
  // Calculate redundancy and part load
  const redundancyPercent = ((installedCapacity - futureLoad) / futureLoad) * 100;
  const partLoadAtDesign = (diversifiedLoad / (capacityPerChiller * runningChillers)) * 100;
  
  return {
    totalRequiredCapacityTons: Math.round(futureLoad),
    numberOfChillers,
    capacityPerChillerTons: Math.round(capacityPerChiller),
    installedCapacityTons: Math.round(installedCapacity),
    redundancyPercent: Math.round(redundancyPercent),
    partLoadAtDesign: Math.round(partLoadAtDesign),
  };
}

/**
 * Size pumps based on flow and head requirements
 */
export function calculatePumpSizing(input: PumpSizingInput): PumpSizingResult {
  const { flowGpm, headFt, efficiency = 0.75, motorEfficiency = 0.93, numberOfPumps, redundancy } = input;
  
  // Calculate running pumps
  const runningPumps = redundancy ? numberOfPumps - 1 : numberOfPumps;
  const flowPerPump = flowGpm / runningPumps;
  
  // Hydraulic horsepower: HP = (GPM × Head) / 3960
  const hydraulicHp = (flowPerPump * headFt) / 3960;
  
  // Brake horsepower: BHP = Hydraulic HP / Pump Efficiency
  const brakeHp = hydraulicHp / efficiency;
  
  // Select standard motor size
  const motorHp = selectMotorSize(brakeHp * 1.1); // 10% safety factor
  
  // Motor power in kW
  const motorKw = (motorHp * 0.746) / motorEfficiency;
  
  return {
    flowPerPumpGpm: Math.round(flowPerPump),
    headFt: Math.round(headFt),
    hydraulicHp: Math.round(hydraulicHp * 10) / 10,
    brakeHp: Math.round(brakeHp * 10) / 10,
    motorHp,
    motorKw: Math.round(motorKw * 10) / 10,
    numberOfPumps,
    runningPumps,
  };
}

/**
 * Size cooling towers based on heat rejection requirements
 */
export function calculateCoolingTower(input: CoolingTowerInput): CoolingTowerResult {
  const { heatRejectionTons, approachF = 7, rangeF = 10, wetBulbF = 78, numberOfCells } = input;
  
  // Calculate number of cells if not specified
  let cells: number;
  if (numberOfCells) {
    cells = numberOfCells;
  } else {
    // Typical sizing: 200-400 tons per cell
    if (heatRejectionTons <= 300) {
      cells = 1;
    } else if (heatRejectionTons <= 600) {
      cells = 2;
    } else if (heatRejectionTons <= 1000) {
      cells = 3;
    } else {
      cells = Math.ceil(heatRejectionTons / 350);
    }
  }
  
  const capacityPerCell = heatRejectionTons / cells;
  
  // Estimate fan power: approximately 0.05-0.08 HP per ton
  const fanHpPerCell = capacityPerCell * 0.06;
  const totalFanHp = fanHpPerCell * cells;
  
  // Calculate water temperatures
  const leavingWaterTemp = wetBulbF + approachF;
  const enteringWaterTemp = leavingWaterTemp + rangeF;
  
  return {
    totalCapacityTons: Math.round(heatRejectionTons),
    numberOfCells: cells,
    capacityPerCellTons: Math.round(capacityPerCell),
    estimatedFanHp: Math.round(totalFanHp),
    estimatedFanKw: Math.round(totalFanHp * 0.746 * 10) / 10,
    designWetBulbF: wetBulbF,
    leavingWaterTempF: leavingWaterTemp,
    enteringWaterTempF: enteringWaterTemp,
  };
}

/**
 * Size header pipes based on flow requirements
 */
export function calculateHeaderPipe(input: HeaderPipeSizingInput): HeaderPipeSizingResult {
  const { flowGpm, fluidType, maxVelocityFps } = input;
  
  // Set velocity limits based on fluid type
  // CHW: 4-8 fps for mains, CW: 8-12 fps
  const velocityLimit = maxVelocityFps || (fluidType === 'chw' ? 6 : 10);
  
  const pipeSize = selectPipeSize(flowGpm, velocityLimit);
  const velocity = calculatePipeVelocity(flowGpm, pipeSize);
  const frictionLoss = calculateFrictionLoss(flowGpm, pipeSize);
  
  return {
    flowGpm: Math.round(flowGpm),
    pipeSizeIn: pipeSize,
    velocityFps: Math.round(velocity * 10) / 10,
    frictionLossFtPer100Ft: Math.round(frictionLoss * 100) / 100,
  };
}

/**
 * Calculate complete plant summary
 */
export function calculatePlantSummary(
  chillerResult: ChillerSizingResult,
  primaryPumpResult: PumpSizingResult,
  secondaryPumpResult: PumpSizingResult | null,
  condenserPumpResult: PumpSizingResult | null,
  coolingTowerResult: CoolingTowerResult | null,
  designLoadTons: number
): PlantSummary {
  // Calculate total pump power
  let totalPumpPowerKw = primaryPumpResult.motorKw * primaryPumpResult.runningPumps;
  
  if (secondaryPumpResult) {
    totalPumpPowerKw += secondaryPumpResult.motorKw * secondaryPumpResult.runningPumps;
  }
  
  if (condenserPumpResult) {
    totalPumpPowerKw += condenserPumpResult.motorKw * condenserPumpResult.runningPumps;
  }
  
  // Tower fan power
  const towerFanPowerKw = coolingTowerResult?.estimatedFanKw || 0;
  
  // Estimate chiller power (assuming 0.6 kW/ton average)
  const chillerPowerKw = designLoadTons * 0.6;
  
  // Total plant auxiliary power (pumps + fans) per ton
  const auxiliaryPowerPerTon = (totalPumpPowerKw + towerFanPowerKw) / designLoadTons;
  
  // Total plant kW/ton including chiller
  const totalPlantKwPerTon = (chillerPowerKw + totalPumpPowerKw + towerFanPowerKw) / designLoadTons;
  
  return {
    designLoadTons: Math.round(designLoadTons),
    installedCapacityTons: chillerResult.installedCapacityTons,
    chwFlowGpm: primaryPumpResult.flowPerPumpGpm * primaryPumpResult.runningPumps,
    cwFlowGpm: condenserPumpResult ? condenserPumpResult.flowPerPumpGpm * condenserPumpResult.runningPumps : 0,
    totalPumpPowerKw: Math.round(totalPumpPowerKw * 10) / 10,
    totalTowerFanPowerKw: Math.round(towerFanPowerKw * 10) / 10,
    estimatedPlantKwPerTon: Math.round(totalPlantKwPerTon * 100) / 100,
  };
}

/**
 * Estimate pump head for different pump types
 */
export function estimatePumpHead(
  pumpType: 'primary' | 'secondary' | 'condenser',
  chillerPressureDropFt?: number,
  staticHeadFt?: number,
  frictionAllowanceFt?: number
): number {
  const defaultChillerDrop = 25; // ft
  const defaultStaticHead = 0;
  
  switch (pumpType) {
    case 'primary':
      // Chiller evaporator + distribution piping
      return (chillerPressureDropFt || defaultChillerDrop) + (frictionAllowanceFt || 15) + (staticHeadFt || defaultStaticHead);
    
    case 'secondary':
      // Building distribution only (no chiller)
      return (staticHeadFt || 40) + (frictionAllowanceFt || 30);
    
    case 'condenser':
      // Chiller condenser + cooling tower + piping
      return (chillerPressureDropFt || 20) + 15 + (staticHeadFt || 10) + (frictionAllowanceFt || 10);
    
    default:
      return 50;
  }
}
