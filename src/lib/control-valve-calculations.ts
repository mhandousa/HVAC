/**
 * Control Valve Sizing Calculations
 * Based on ISA/IEC standards and ASHRAE Handbook - HVAC Systems and Equipment
 */

export interface ControlValveConfig {
  valveType: '2-way' | '3-way-mixing' | '3-way-diverting';
  flowGpm: number;
  fluidType: 'water' | 'glycol_25' | 'glycol_50';
  fluidTempF: number;
  coilPressureDropPsi: number;
  systemPressureDropPsi: number;
  targetAuthority?: number;
  allowedPressureDropPsi?: number;
}

export interface ValveSelection {
  nominalSize: number;
  cvRated: number;
  manufacturer?: string;
  model?: string;
  bodyStyle: string;
  portType: 'equal_percentage' | 'linear' | 'quick_opening';
}

export interface ActuatorRequirements {
  closeOffPressure_psi: number;
  requiredForce_lbf: number;
  recommendedActuatorType: string;
  springRange?: string;
  strokeLength_in: number;
}

export interface ControlValveResults {
  calculatedCv: number;
  selectedValve: ValveSelection;
  authority: number;
  authorityStatus: 'excellent' | 'good' | 'marginal' | 'poor';
  actualPressureDropPsi: number;
  rangeability: number;
  actuator: ActuatorRequirements;
  flowCharacteristic: string;
  recommendations: string[];
  warnings: string[];
}

// Fluid properties
interface FluidProperties {
  specificGravity: number;
  viscosityCp: number;
}

const FLUID_PROPERTIES: Record<string, (tempF: number) => FluidProperties> = {
  'water': (tempF: number) => ({
    specificGravity: 1.0 - (tempF - 60) * 0.0002,
    viscosityCp: Math.max(0.3, 1.0 - (tempF - 60) * 0.01),
  }),
  'glycol_25': (tempF: number) => ({
    specificGravity: 1.03 - (tempF - 60) * 0.0003,
    viscosityCp: Math.max(0.5, 2.0 - (tempF - 60) * 0.015),
  }),
  'glycol_50': (tempF: number) => ({
    specificGravity: 1.06 - (tempF - 60) * 0.0004,
    viscosityCp: Math.max(1.0, 5.0 - (tempF - 60) * 0.03),
  }),
};

// Standard valve sizes and Cv values
interface StandardValve {
  size: number; // inches
  cvValues: number[]; // available Cv ratings for this size
  closeOffPsi: number;
  strokeIn: number;
}

const STANDARD_VALVES: StandardValve[] = [
  { size: 0.5, cvValues: [0.5, 0.8, 1.0, 1.2, 1.6, 2.0], closeOffPsi: 50, strokeIn: 0.375 },
  { size: 0.75, cvValues: [1.6, 2.0, 2.5, 3.2, 4.0, 5.0], closeOffPsi: 50, strokeIn: 0.5 },
  { size: 1.0, cvValues: [4.0, 5.0, 6.3, 8.0, 10.0, 12.5], closeOffPsi: 50, strokeIn: 0.625 },
  { size: 1.25, cvValues: [10.0, 12.5, 16.0, 20.0, 25.0], closeOffPsi: 45, strokeIn: 0.75 },
  { size: 1.5, cvValues: [16.0, 20.0, 25.0, 32.0, 40.0], closeOffPsi: 45, strokeIn: 0.875 },
  { size: 2.0, cvValues: [32.0, 40.0, 50.0, 63.0, 80.0], closeOffPsi: 35, strokeIn: 1.0 },
  { size: 2.5, cvValues: [63.0, 80.0, 100.0, 125.0], closeOffPsi: 35, strokeIn: 1.25 },
  { size: 3.0, cvValues: [100.0, 125.0, 160.0, 200.0], closeOffPsi: 25, strokeIn: 1.5 },
  { size: 4.0, cvValues: [160.0, 200.0, 250.0, 320.0, 400.0], closeOffPsi: 25, strokeIn: 2.0 },
  { size: 5.0, cvValues: [320.0, 400.0, 500.0, 630.0], closeOffPsi: 20, strokeIn: 2.5 },
  { size: 6.0, cvValues: [500.0, 630.0, 800.0, 1000.0], closeOffPsi: 20, strokeIn: 3.0 },
];

/**
 * Calculate Cv from flow and pressure drop
 * Cv = Q * sqrt(SG / ΔP)
 */
export function calculateCv(
  flowGpm: number,
  pressureDropPsi: number,
  specificGravity: number = 1.0
): number {
  if (pressureDropPsi <= 0) return Infinity;
  return flowGpm * Math.sqrt(specificGravity / pressureDropPsi);
}

/**
 * Calculate pressure drop from flow and Cv
 * ΔP = SG * (Q / Cv)²
 */
export function calculatePressureDrop(
  flowGpm: number,
  cv: number,
  specificGravity: number = 1.0
): number {
  if (cv <= 0) return Infinity;
  return specificGravity * Math.pow(flowGpm / cv, 2);
}

/**
 * Calculate valve authority
 * Authority = ΔP_valve / (ΔP_valve + ΔP_coil)
 */
export function calculateAuthority(
  valvePressureDropPsi: number,
  coilPressureDropPsi: number
): number {
  const total = valvePressureDropPsi + coilPressureDropPsi;
  if (total <= 0) return 0;
  return valvePressureDropPsi / total;
}

/**
 * Get authority status
 */
export function getAuthorityStatus(authority: number): ControlValveResults['authorityStatus'] {
  if (authority >= 0.5) return 'excellent';
  if (authority >= 0.3) return 'good';
  if (authority >= 0.2) return 'marginal';
  return 'poor';
}

/**
 * Select appropriate valve from standard sizes
 */
export function selectValve(
  requiredCv: number,
  targetAuthority: number = 0.5
): ValveSelection {
  // Find valve with Cv that gives good authority
  // We want Cv slightly higher than calculated to allow for modulation
  const targetCv = requiredCv * 1.1; // 10% margin

  for (const valve of STANDARD_VALVES) {
    for (const cv of valve.cvValues) {
      if (cv >= targetCv && cv <= targetCv * 2) {
        return {
          nominalSize: valve.size,
          cvRated: cv,
          bodyStyle: valve.size <= 2 ? 'Globe' : 'Butterfly',
          portType: 'equal_percentage',
        };
      }
    }
  }

  // If no match, find closest larger valve
  for (const valve of STANDARD_VALVES) {
    const maxCv = Math.max(...valve.cvValues);
    if (maxCv >= requiredCv) {
      const selectedCv = valve.cvValues.find(cv => cv >= requiredCv) || maxCv;
      return {
        nominalSize: valve.size,
        cvRated: selectedCv,
        bodyStyle: valve.size <= 2 ? 'Globe' : 'Butterfly',
        portType: 'equal_percentage',
      };
    }
  }

  // Default to largest available
  const largest = STANDARD_VALVES[STANDARD_VALVES.length - 1];
  return {
    nominalSize: largest.size,
    cvRated: Math.max(...largest.cvValues),
    bodyStyle: 'Butterfly',
    portType: 'equal_percentage',
  };
}

/**
 * Calculate actuator requirements
 */
export function calculateActuatorRequirements(
  valveSize: number,
  systemPressurePsi: number,
  valveType: ControlValveConfig['valveType']
): ActuatorRequirements {
  const valve = STANDARD_VALVES.find(v => v.size === valveSize) || STANDARD_VALVES[0];
  
  // Close-off pressure should exceed system pressure by safety margin
  const closeOffPressure = Math.max(valve.closeOffPsi, systemPressurePsi * 1.25);
  
  // Force calculation: F = ΔP × A × friction_factor
  // Simplified: larger valves need proportionally more force
  const seatAreaSqIn = Math.PI * Math.pow(valveSize / 2, 2);
  const frictionFactor = valveType === '2-way' ? 1.2 : 1.4;
  const requiredForce = closeOffPressure * seatAreaSqIn * frictionFactor;

  // Actuator type recommendation
  let actuatorType = 'Electric modulating';
  let springRange: string | undefined;
  
  if (valveSize <= 2) {
    if (requiredForce < 100) {
      actuatorType = 'Electric, spring return';
      springRange = '3-8 psi';
    } else {
      actuatorType = 'Electric modulating';
    }
  } else {
    actuatorType = requiredForce > 500 ? 'Pneumatic with positioner' : 'Electric modulating';
    springRange = actuatorType.includes('Pneumatic') ? '3-15 psi' : undefined;
  }

  return {
    closeOffPressure_psi: Math.round(closeOffPressure),
    requiredForce_lbf: Math.round(requiredForce),
    recommendedActuatorType: actuatorType,
    springRange,
    strokeLength_in: valve.strokeIn,
  };
}

/**
 * Determine flow characteristic based on application
 */
export function getFlowCharacteristic(
  valveType: ControlValveConfig['valveType'],
  authority: number
): string {
  // Equal percentage for most HVAC applications with variable flow
  if (valveType === '2-way') {
    return authority >= 0.3 
      ? 'Equal Percentage (recommended for good authority)'
      : 'Linear (may help compensate for low authority)';
  }
  
  // 3-way mixing typically uses equal percentage or linear
  if (valveType === '3-way-mixing') {
    return 'Equal Percentage (maintains constant flow through coil)';
  }
  
  // 3-way diverting
  return 'Linear (typical for diverting applications)';
}

/**
 * Main control valve sizing function
 */
export function sizeControlValve(config: ControlValveConfig): ControlValveResults {
  const {
    valveType,
    flowGpm,
    fluidType,
    fluidTempF,
    coilPressureDropPsi,
    systemPressureDropPsi,
    targetAuthority = 0.5,
    allowedPressureDropPsi,
  } = config;

  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Get fluid properties
  const fluidProps = FLUID_PROPERTIES[fluidType](fluidTempF);

  // Calculate required valve pressure drop for target authority
  // Authority = ΔP_valve / (ΔP_valve + ΔP_coil)
  // ΔP_valve = Authority × ΔP_coil / (1 - Authority)
  let targetValveDp = (targetAuthority * coilPressureDropPsi) / (1 - targetAuthority);
  
  // Apply allowed pressure drop limit if specified
  if (allowedPressureDropPsi && targetValveDp > allowedPressureDropPsi) {
    targetValveDp = allowedPressureDropPsi;
    warnings.push(`Valve pressure drop limited to ${allowedPressureDropPsi} psi - authority will be reduced`);
  }

  // Calculate required Cv
  const calculatedCv = calculateCv(flowGpm, targetValveDp, fluidProps.specificGravity);

  // Select valve
  const selectedValve = selectValve(calculatedCv, targetAuthority);

  // Calculate actual pressure drop with selected valve
  const actualPressureDropPsi = calculatePressureDrop(
    flowGpm, 
    selectedValve.cvRated, 
    fluidProps.specificGravity
  );

  // Calculate actual authority
  const authority = calculateAuthority(actualPressureDropPsi, coilPressureDropPsi);
  const authorityStatus = getAuthorityStatus(authority);

  // Calculate rangeability (typical for globe valves)
  const rangeability = selectedValve.bodyStyle === 'Globe' ? 50 : 30;

  // Get actuator requirements
  const actuator = calculateActuatorRequirements(
    selectedValve.nominalSize,
    systemPressureDropPsi,
    valveType
  );

  // Flow characteristic
  const flowCharacteristic = getFlowCharacteristic(valveType, authority);

  // Validation and recommendations
  if (authority < 0.2) {
    warnings.push('Valve authority is poor (<0.2) - control may be unstable');
    recommendations.push('Consider increasing valve pressure drop or using a smaller valve');
  } else if (authority < 0.3) {
    warnings.push('Valve authority is marginal (0.2-0.3) - consider improvements');
  }

  if (selectedValve.cvRated > calculatedCv * 2) {
    warnings.push('Selected valve is oversized - may cause hunting');
    recommendations.push('Verify flow calculations or consider smaller valve');
  }

  if (flowGpm / selectedValve.cvRated > 10) {
    warnings.push('High flow-to-Cv ratio - verify valve is not undersized');
  }

  // Valve type specific recommendations
  if (valveType === '2-way') {
    recommendations.push('Ensure VFD on pump for variable flow system');
    recommendations.push('Install pressure-independent valve if authority cannot be improved');
  } else if (valveType === '3-way-mixing') {
    recommendations.push('Maintain constant system flow - bypass ensures this');
    recommendations.push('Verify mixing valve is installed in correct orientation');
  } else {
    recommendations.push('Verify diverting valve port assignments (A, B, AB)');
  }

  // Close-off pressure check
  if (actuator.closeOffPressure_psi < systemPressureDropPsi) {
    warnings.push('Actuator close-off pressure may be insufficient for system pressure');
  }

  return {
    calculatedCv: Math.round(calculatedCv * 100) / 100,
    selectedValve,
    authority: Math.round(authority * 100) / 100,
    authorityStatus,
    actualPressureDropPsi: Math.round(actualPressureDropPsi * 100) / 100,
    rangeability,
    actuator,
    flowCharacteristic,
    recommendations,
    warnings,
  };
}

/**
 * Get standard valve sizes
 */
export function getStandardValveSizes(): number[] {
  return STANDARD_VALVES.map(v => v.size);
}

/**
 * Get Cv options for a valve size
 */
export function getCvOptionsForSize(size: number): number[] {
  const valve = STANDARD_VALVES.find(v => v.size === size);
  return valve ? valve.cvValues : [];
}

/**
 * Convert pipe size to recommended valve size
 */
export function recommendedValveSize(pipeSizeIn: number, flowGpm: number): number {
  // Generally valve should be same or one size smaller than pipe
  const sizes = getStandardValveSizes();
  
  // Check if line-size is appropriate
  for (const size of sizes) {
    if (size >= pipeSizeIn - 0.5 && size <= pipeSizeIn) {
      return size;
    }
  }
  
  // Default to pipe size if available
  return sizes.find(s => s === pipeSizeIn) || sizes[Math.floor(sizes.length / 2)];
}
