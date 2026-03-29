// Hot Water Plant Sizing Calculations
// Based on ASHRAE Handbook and industry practices

export interface BoilerType {
  id: string;
  name: string;
  fuelType: 'gas' | 'oil' | 'electric';
  minEfficiency: number;
  maxEfficiency: number;
  minCapacity_btuh: number;
  maxCapacity_btuh: number;
  turndownRatio: number;
}

export const BOILER_TYPES: BoilerType[] = [
  { id: 'condensing-gas', name: 'Condensing Gas Boiler', fuelType: 'gas', minEfficiency: 0.90, maxEfficiency: 0.98, minCapacity_btuh: 50000, maxCapacity_btuh: 6000000, turndownRatio: 10 },
  { id: 'non-condensing-gas', name: 'Non-Condensing Gas Boiler', fuelType: 'gas', minEfficiency: 0.80, maxEfficiency: 0.85, minCapacity_btuh: 100000, maxCapacity_btuh: 10000000, turndownRatio: 4 },
  { id: 'oil-fired', name: 'Oil-Fired Boiler', fuelType: 'oil', minEfficiency: 0.80, maxEfficiency: 0.87, minCapacity_btuh: 100000, maxCapacity_btuh: 5000000, turndownRatio: 4 },
  { id: 'electric', name: 'Electric Boiler', fuelType: 'electric', minEfficiency: 0.98, maxEfficiency: 0.99, minCapacity_btuh: 10000, maxCapacity_btuh: 2000000, turndownRatio: 20 },
];

export interface HWPlantConfig {
  heatingLoadBtuh: number;
  supplyTempF: number;
  returnTempF: number;
  boilerType: string;
  boilerCount: number;
  redundancyMode: 'N' | 'N+1' | '2N';
  pumpingConfig: 'primary_only' | 'primary_secondary';
  diversityFactor: number;
  futureExpansionPercent: number;
}

export interface BoilerSizing {
  requiredCapacity_btuh: number;
  capacityPerBoiler_btuh: number;
  totalInstalledCapacity_btuh: number;
  redundancyCapacity_btuh: number;
  efficiency: number;
  fuelConsumption: { value: number; unit: string };
}

export interface HWPumpSizing {
  flowGpm: number;
  headFt: number;
  pumpPowerBhp: number;
  motorHp: number;
  pumpCount: number;
}

export interface ExpansionTankSizing {
  systemVolume_gal: number;
  expansionVolume_gal: number;
  tankVolume_gal: number;
  acceptanceFactor: number;
  fillPressure_psi: number;
  maxPressure_psi: number;
}

export interface HWPlantResults {
  boiler: BoilerSizing;
  primaryPump: HWPumpSizing;
  secondaryPump?: HWPumpSizing;
  expansionTank: ExpansionTankSizing;
  pipingSize: { supply: number; return: number };
}

// Water properties at temperature
function getWaterDensity(tempF: number): number {
  // lb/gal (approximate)
  return 8.34 - 0.0004 * (tempF - 60);
}

function getWaterSpecificHeat(): number {
  return 1.0; // BTU/lb-°F
}

// Calculate hot water flow rate
export function calculateHWFlow(loadBtuh: number, supplyTempF: number, returnTempF: number): number {
  const deltaT = supplyTempF - returnTempF;
  const cp = getWaterSpecificHeat();
  const density = getWaterDensity((supplyTempF + returnTempF) / 2);
  
  // Q = m * cp * ΔT, where m = ρ * V
  // Load (BTU/hr) = GPM * 60 min/hr * 8.34 lb/gal * 1 BTU/lb-°F * ΔT
  // GPM = Load / (500 * ΔT) where 500 = 60 * 8.34 * 1
  const gpm = loadBtuh / (500 * deltaT);
  return gpm;
}

// Size boilers
export function sizeBoilers(config: HWPlantConfig): BoilerSizing {
  const boilerType = BOILER_TYPES.find(b => b.id === config.boilerType) || BOILER_TYPES[0];
  
  // Apply diversity and future expansion
  const designLoad = config.heatingLoadBtuh * config.diversityFactor * (1 + config.futureExpansionPercent / 100);
  
  // Determine capacity per boiler based on redundancy
  let operatingBoilers = config.boilerCount;
  let redundantBoilers = 0;
  
  switch (config.redundancyMode) {
    case 'N+1':
      redundantBoilers = 1;
      operatingBoilers = config.boilerCount - 1;
      break;
    case '2N':
      redundantBoilers = Math.ceil(config.boilerCount / 2);
      operatingBoilers = config.boilerCount - redundantBoilers;
      break;
    default:
      redundantBoilers = 0;
  }
  
  const capacityPerBoiler = designLoad / operatingBoilers;
  const totalInstalled = capacityPerBoiler * config.boilerCount;
  const redundancy = capacityPerBoiler * redundantBoilers;
  
  // Average efficiency
  const efficiency = (boilerType.minEfficiency + boilerType.maxEfficiency) / 2;
  
  // Fuel consumption (approximate)
  let fuelValue: number;
  let fuelUnit: string;
  
  switch (boilerType.fuelType) {
    case 'gas':
      fuelValue = designLoad / (efficiency * 100000); // therms/hr (1 therm = 100,000 BTU)
      fuelUnit = 'therms/hr';
      break;
    case 'oil':
      fuelValue = designLoad / (efficiency * 140000); // gal/hr (1 gal #2 oil ≈ 140,000 BTU)
      fuelUnit = 'gal/hr';
      break;
    case 'electric':
      fuelValue = designLoad / (efficiency * 3412); // kW
      fuelUnit = 'kW';
      break;
    default:
      fuelValue = 0;
      fuelUnit = '';
  }
  
  return {
    requiredCapacity_btuh: designLoad,
    capacityPerBoiler_btuh: capacityPerBoiler,
    totalInstalledCapacity_btuh: totalInstalled,
    redundancyCapacity_btuh: redundancy,
    efficiency,
    fuelConsumption: { value: fuelValue, unit: fuelUnit },
  };
}

// Size pumps
export function sizeHWPump(
  flowGpm: number,
  headFt: number,
  pumpCount: number,
  redundancy: boolean
): HWPumpSizing {
  const operatingPumps = redundancy ? pumpCount - 1 : pumpCount;
  const flowPerPump = flowGpm / operatingPumps;
  
  // Pump power: BHP = (GPM × Head) / (3960 × Efficiency)
  const pumpEfficiency = 0.70; // Typical
  const bhp = (flowPerPump * headFt) / (3960 * pumpEfficiency);
  
  // Select next standard motor size
  const standardHp = [0.5, 0.75, 1, 1.5, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100];
  const motorHp = standardHp.find(hp => hp >= bhp * 1.15) || bhp * 1.2; // 15% safety factor
  
  return {
    flowGpm: flowPerPump,
    headFt,
    pumpPowerBhp: bhp,
    motorHp,
    pumpCount,
  };
}

// Size expansion tank
export function sizeExpansionTank(
  systemVolume_gal: number,
  coldFillTempF: number,
  maxOperatingTempF: number,
  staticHead_ft: number
): ExpansionTankSizing {
  // Expansion coefficient for water
  // Approximate: ΔV/V ≈ 0.00004 × ΔT (°F)
  const tempRise = maxOperatingTempF - coldFillTempF;
  const expansionFactor = 0.00004 * tempRise;
  const expansionVolume = systemVolume_gal * expansionFactor;
  
  // Pressures
  const fillPressure = (staticHead_ft / 2.31) + 5; // psi (5 psi above static)
  const reliefPressure = 30; // psi (typical relief valve)
  const maxPressure = reliefPressure - 5; // psi (operating below relief)
  
  // Acceptance factor (diaphragm tank)
  const p1 = fillPressure + 14.7; // Absolute
  const p2 = maxPressure + 14.7;
  const acceptanceFactor = (p2 - p1) / p2;
  
  // Tank volume
  const tankVolume = expansionVolume / acceptanceFactor;
  
  // Round up to standard size
  const standardSizes = [2, 4.4, 6, 8, 10.3, 14, 20, 26, 34, 44, 62, 86, 119, 158, 211, 317, 528];
  const selectedSize = standardSizes.find(s => s >= tankVolume) || Math.ceil(tankVolume);
  
  return {
    systemVolume_gal: systemVolume_gal,
    expansionVolume_gal: expansionVolume,
    tankVolume_gal: selectedSize,
    acceptanceFactor,
    fillPressure_psi: fillPressure,
    maxPressure_psi: maxPressure,
  };
}

// Calculate pipe size from flow
export function calculatePipeSize(flowGpm: number, maxVelocity_fps: number = 6): number {
  // Area = Flow / Velocity
  // A = Q / V, where Q in ft³/s, A in ft²
  const flowCfs = flowGpm / 448.8; // Convert GPM to CFS
  const areaFt2 = flowCfs / maxVelocity_fps;
  const areaIn2 = areaFt2 * 144;
  const diameter = Math.sqrt((4 * areaIn2) / Math.PI);
  
  // Round up to standard pipe size
  const standardSizes = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 24];
  return standardSizes.find(s => s >= diameter) || diameter;
}

// Main sizing function
export function sizeHotWaterPlant(config: HWPlantConfig): HWPlantResults {
  // Size boilers
  const boiler = sizeBoilers(config);
  
  // Calculate flow
  const totalFlow = calculateHWFlow(
    boiler.requiredCapacity_btuh,
    config.supplyTempF,
    config.returnTempF
  );
  
  // Primary pump (boiler loop)
  const primaryHead = 25; // ft (typical boiler loop)
  const primaryPump = sizeHWPump(
    totalFlow,
    primaryHead,
    config.boilerCount,
    config.redundancyMode !== 'N'
  );
  
  // Secondary pump (if primary-secondary)
  let secondaryPump: HWPumpSizing | undefined;
  if (config.pumpingConfig === 'primary_secondary') {
    const secondaryHead = 50; // ft (typical building loop)
    secondaryPump = sizeHWPump(
      totalFlow,
      secondaryHead,
      2, // Typically 2 secondary pumps
      true
    );
  }
  
  // Expansion tank
  // Estimate system volume: 2-3 gal per 1000 BTU/hr capacity
  const systemVolume = (boiler.totalInstalledCapacity_btuh / 1000) * 2.5;
  const expansionTank = sizeExpansionTank(
    systemVolume,
    60, // Cold fill temp
    config.supplyTempF + 10, // Max operating (safety margin)
    30 // Typical static head
  );
  
  // Pipe sizing
  const supplyPipe = calculatePipeSize(totalFlow, 6);
  const returnPipe = calculatePipeSize(totalFlow, 6);
  
  return {
    boiler,
    primaryPump,
    secondaryPump,
    expansionTank,
    pipingSize: { supply: supplyPipe, return: returnPipe },
  };
}

// Convert BTU/hr to kW
export function btuhToKw(btuh: number): number {
  return btuh / 3412.14;
}

// Convert kW to BTU/hr
export function kwToBtuh(kw: number): number {
  return kw * 3412.14;
}
