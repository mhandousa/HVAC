// Smoke Control System Calculations
// Based on NFPA 92, IBC, and ASHRAE Handbook - HVAC Applications

export type SmokeControlMode = 'pressurization' | 'exhaust' | 'pressurization_exhaust';
export type PressurizedSpace = 'stairwell' | 'elevator_shaft' | 'vestibule' | 'refuge_area';
export type ExhaustSpace = 'atrium' | 'corridor' | 'mall' | 'underground';

export interface StairwellPressurization {
  stairwellHeight_ft: number;
  stairwellArea_sqft: number;
  numberOfDoors: number;
  doorWidth_ft: number;
  doorHeight_ft: number;
  simultaneousDoorsOpen: number;
  targetPressure_inWC: number;
  stackEffectConsideration: boolean;
  winterOutdoorTemp_F: number;
  indoorTemp_F: number;
}

export interface ElevatorPressurization {
  shaftHeight_ft: number;
  shaftArea_sqft: number;
  numberOfElevators: number;
  doorWidth_ft: number;
  doorHeight_ft: number;
  lobbyVestibule: boolean;
  targetPressure_inWC: number;
}

export interface AtriumExhaust {
  atriumHeight_ft: number;
  atriumFloorArea_sqft: number;
  fireSize_btu_s: number; // Heat release rate
  smokeLayerHeight_ft: number; // Target clear height
  perimeter_ft: number;
  makeupAirTemp_F: number;
  ambientTemp_F: number;
}

export interface SmokeExhaustResult {
  exhaustRate_cfm: number;
  makeupAirRate_cfm: number;
  fanPressure_inWC: number;
  smokeLayerTemp_F: number;
  plumeRadius_ft: number;
  numberOfFans: number;
  fanSize_cfm: number;
}

export interface PressurizeResult {
  supplyAir_cfm: number;
  leakageAir_cfm: number;
  doorLeakage_cfm: number;
  otherLeakage_cfm: number;
  fanPressure_inWC: number;
  numberOfFans: number;
  fanSize_cfm: number;
  stackEffectCorrection_cfm: number;
}

// Constants
const AIR_DENSITY_LB_FT3 = 0.075; // Standard conditions
const CP_AIR = 0.24; // BTU/lb-°F
const GRAVITY = 32.2; // ft/s²

// Calculate stack effect pressure
export function calculateStackEffect(
  height_ft: number,
  outdoorTemp_F: number,
  indoorTemp_F: number
): number {
  // Stack pressure (in W.C.) = 7.64 × h × (1/To - 1/Ti)
  // Where To and Ti are absolute temperatures in Rankine
  const To_R = outdoorTemp_F + 459.67;
  const Ti_R = indoorTemp_F + 459.67;
  
  const stackPressure = 7.64 * height_ft * (1 / To_R - 1 / Ti_R);
  return stackPressure; // Positive = upward stack effect (winter)
}

// Calculate door leakage
function calculateDoorLeakage(
  doorWidth_ft: number,
  doorHeight_ft: number,
  pressureDiff_inWC: number,
  numberOfDoors: number,
  crackWidth_in: number = 0.125 // 1/8" typical
): number {
  // Door crack area
  const perimeter = 2 * doorHeight_ft + doorWidth_ft; // Bottom typically sealed
  const crackArea_sqft = perimeter * (crackWidth_in / 12);
  
  // Flow through crack: Q = C × A × √(ΔP)
  // C ≈ 2610 for flow in CFM, area in ft², ΔP in in W.C.
  const C = 2610;
  const leakage = C * crackArea_sqft * Math.sqrt(pressureDiff_inWC) * numberOfDoors;
  
  return leakage;
}

// Calculate open door airflow
function calculateOpenDoorFlow(
  doorWidth_ft: number,
  doorHeight_ft: number,
  pressureDiff_inWC: number
): number {
  // Flow through open door
  // V = 4005 × √(ΔP / ρ)
  const velocity = 4005 * Math.sqrt(pressureDiff_inWC / AIR_DENSITY_LB_FT3);
  const area = doorWidth_ft * doorHeight_ft;
  const Cd = 0.65; // Discharge coefficient for door
  
  return Cd * area * velocity;
}

// Stairwell pressurization calculation (NFPA 92)
export function calculateStairwellPressurization(params: StairwellPressurization): PressurizeResult {
  const {
    stairwellHeight_ft,
    numberOfDoors,
    doorWidth_ft,
    doorHeight_ft,
    simultaneousDoorsOpen,
    targetPressure_inWC,
    stackEffectConsideration,
    winterOutdoorTemp_F,
    indoorTemp_F,
  } = params;
  
  // Calculate closed door leakage
  const closedDoors = numberOfDoors - simultaneousDoorsOpen;
  const closedDoorLeakage = calculateDoorLeakage(
    doorWidth_ft,
    doorHeight_ft,
    targetPressure_inWC,
    closedDoors
  );
  
  // Calculate open door flow
  const openDoorFlow = simultaneousDoorsOpen > 0
    ? calculateOpenDoorFlow(doorWidth_ft, doorHeight_ft, targetPressure_inWC / 3) * simultaneousDoorsOpen
    : 0;
  
  // Calculate wall/floor leakage (estimate 0.5 CFM per ft² of stair area)
  const stairArea = params.stairwellArea_sqft;
  const envelopeArea = stairArea * (stairwellHeight_ft / 10); // Rough estimate
  const wallLeakage = envelopeArea * 0.5;
  
  // Stack effect correction
  let stackCorrection = 0;
  if (stackEffectConsideration) {
    const stackPressure = calculateStackEffect(stairwellHeight_ft, winterOutdoorTemp_F, indoorTemp_F);
    // Need to compensate for stack effect
    stackCorrection = stackPressure > 0 
      ? envelopeArea * 0.3 * Math.sqrt(Math.abs(stackPressure))
      : 0;
  }
  
  // Total supply air required
  const totalLeakage = closedDoorLeakage + openDoorFlow + wallLeakage;
  const supplyAir = totalLeakage + stackCorrection;
  
  // Fan pressure (target + losses)
  const fanPressure = targetPressure_inWC + 1.5; // Add for duct losses
  
  // Determine number of fans (typically distributed for tall stairwells)
  const maxFanSize = 10000; // CFM
  const numberOfFans = Math.ceil(supplyAir / maxFanSize);
  const fanSize = Math.ceil(supplyAir / numberOfFans);
  
  return {
    supplyAir_cfm: supplyAir,
    leakageAir_cfm: totalLeakage,
    doorLeakage_cfm: closedDoorLeakage + openDoorFlow,
    otherLeakage_cfm: wallLeakage,
    fanPressure_inWC: fanPressure,
    numberOfFans,
    fanSize_cfm: fanSize,
    stackEffectCorrection_cfm: stackCorrection,
  };
}

// Elevator shaft pressurization
export function calculateElevatorPressurization(params: ElevatorPressurization): PressurizeResult {
  const {
    shaftHeight_ft,
    shaftArea_sqft,
    numberOfElevators,
    doorWidth_ft,
    doorHeight_ft,
    lobbyVestibule,
    targetPressure_inWC,
  } = params;
  
  // Elevator door leakage (larger gaps than swing doors)
  const doorLeakage = calculateDoorLeakage(
    doorWidth_ft,
    doorHeight_ft,
    targetPressure_inWC,
    numberOfElevators * Math.ceil(shaftHeight_ft / 12), // Doors per floor
    0.25 // 1/4" gap for elevator doors
  );
  
  // Shaft leakage
  const shaftPerimeter = 4 * Math.sqrt(shaftArea_sqft);
  const shaftWallArea = shaftPerimeter * shaftHeight_ft;
  const wallLeakage = shaftWallArea * 0.3; // CFM
  
  // Vestibule reduces leakage
  const vestibuleFactor = lobbyVestibule ? 0.7 : 1.0;
  
  const totalLeakage = (doorLeakage + wallLeakage) * vestibuleFactor;
  const supplyAir = totalLeakage * 1.1; // 10% safety factor
  
  const fanPressure = targetPressure_inWC + 2.0;
  const numberOfFans = Math.ceil(supplyAir / 15000);
  
  return {
    supplyAir_cfm: supplyAir,
    leakageAir_cfm: totalLeakage,
    doorLeakage_cfm: doorLeakage * vestibuleFactor,
    otherLeakage_cfm: wallLeakage * vestibuleFactor,
    fanPressure_inWC: fanPressure,
    numberOfFans,
    fanSize_cfm: Math.ceil(supplyAir / numberOfFans),
    stackEffectCorrection_cfm: 0,
  };
}

// Atrium smoke exhaust (NFPA 92 plume equations)
export function calculateAtriumExhaust(params: AtriumExhaust): SmokeExhaustResult {
  const {
    atriumHeight_ft,
    atriumFloorArea_sqft,
    fireSize_btu_s,
    smokeLayerHeight_ft,
    perimeter_ft,
    makeupAirTemp_F,
    ambientTemp_F,
  } = params;
  
  // Convert fire size to kW for calculations
  const Q_kw = fireSize_btu_s / 0.9478; // BTU/s to kW
  const Q_btu_s = fireSize_btu_s;
  
  // Plume height (z) is from fuel surface to smoke layer
  const z = smokeLayerHeight_ft;
  
  // Axisymmetric plume mass flow rate (NFPA 92 Equation 5.5.1.1a)
  // m = 0.071 × Q^(1/3) × z^(5/3) + 0.0018 × Q (for z > limiting height)
  // m is in lb/s, Q in BTU/s, z in ft
  
  const limitingHeight = 7.2 * Math.pow(Q_btu_s, 0.4); // ft
  let massFlow_lb_s: number;
  
  if (z > limitingHeight) {
    massFlow_lb_s = 0.071 * Math.pow(Q_btu_s, 1/3) * Math.pow(z, 5/3) + 0.0018 * Q_btu_s;
  } else {
    massFlow_lb_s = 0.022 * Math.pow(Q_btu_s, 3/5) * Math.pow(z, 1);
  }
  
  // Convert to CFM
  // Volume flow = mass flow / density (accounting for temperature)
  const smokeTemp_R = ambientTemp_F + 459.67 + (Q_btu_s / (massFlow_lb_s * CP_AIR));
  const ambientTemp_R = ambientTemp_F + 459.67;
  const smokeDensity = AIR_DENSITY_LB_FT3 * (ambientTemp_R / smokeTemp_R);
  
  const volumeFlow_cfs = massFlow_lb_s / smokeDensity;
  const exhaustRate_cfm = volumeFlow_cfs * 60;
  
  // Smoke layer temperature
  const smokeLayerTemp_F = (smokeTemp_R - 459.67);
  
  // Plume radius at smoke layer (approximate)
  const plumeRadius_ft = 0.15 * z + Math.pow(Q_btu_s, 0.4) / 10;
  
  // Makeup air (equal to exhaust, typically delivered at low velocity)
  const makeupAirRate = exhaustRate_cfm * 1.0;
  
  // Fan pressure (typically 0.5-1.0 in W.C. for roof exhaust)
  const fanPressure = 0.75;
  
  // Size fans (typically multiple for redundancy)
  const maxFanSize = 50000; // CFM
  const numberOfFans = Math.max(2, Math.ceil(exhaustRate_cfm / maxFanSize));
  const fanSize = Math.ceil(exhaustRate_cfm / numberOfFans);
  
  return {
    exhaustRate_cfm: exhaustRate_cfm,
    makeupAirRate_cfm: makeupAirRate,
    fanPressure_inWC: fanPressure,
    smokeLayerTemp_F,
    plumeRadius_ft,
    numberOfFans,
    fanSize_cfm: fanSize,
  };
}

// Standard fire sizes (BTU/s) for design
export const STANDARD_FIRE_SIZES = [
  { id: 'small-retail', name: 'Small Retail (2 MW)', btu_s: 1896 },
  { id: 'medium-retail', name: 'Medium Retail (5 MW)', btu_s: 4740 },
  { id: 'office', name: 'Office (2.5 MW)', btu_s: 2370 },
  { id: 'large-retail', name: 'Large Retail (10 MW)', btu_s: 9480 },
  { id: 'kiosk', name: 'Kiosk (1 MW)', btu_s: 948 },
];

// Minimum pressures per code
export const MIN_PRESSURES_IN_WC = {
  stairwell_min: 0.05,
  stairwell_max: 0.25, // With doors closed
  elevator: 0.05,
  vestibule: 0.05,
  refuge_area: 0.05,
};

// Maximum door opening forces
export const MAX_DOOR_FORCE_LBF = 30; // Per IBC

// Calculate door opening force from pressure
export function calculateDoorOpeningForce(
  doorWidth_ft: number,
  doorHeight_ft: number,
  pressureDiff_inWC: number,
  doorCloserForce_lbf: number = 5
): number {
  // F = Fdc + K × (W × A × ΔP) / (2 × (W - d))
  // Where:
  // Fdc = door closer force
  // K = coefficient (0.5 typical)
  // W = door width
  // A = door area
  // ΔP = pressure difference (in lb/ft²)
  // d = distance from knob to latch edge
  
  const K = 0.5;
  const d = 0.25; // ft (3 inches typical)
  const A = doorWidth_ft * doorHeight_ft;
  const deltaP_psf = pressureDiff_inWC * 5.2; // Convert in W.C. to lb/ft²
  
  const force = doorCloserForce_lbf + K * ((doorWidth_ft * A * deltaP_psf) / (2 * (doorWidth_ft - d)));
  
  return force;
}
