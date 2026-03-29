// Design Validation Rules Library
// Centralized validation rules for cross-system consistency checking

export type ValidationCategory = 
  | 'airflow'
  | 'capacity'
  | 'hydronic'
  | 'sizing'
  | 'equipment'
  | 'linkage'
  | 'acoustic'
  | 'ventilation'
  | 'code_compliance';

export type ValidationSeverity = 'critical' | 'warning' | 'info';

export interface ValidationCheck {
  id: string;
  ruleId: string;
  category: ValidationCategory;
  name: string;
  description: string;
  severity: ValidationSeverity;
  status: 'pass' | 'fail' | 'warning' | 'skipped';
  measured?: number | string;
  expected?: number | string;
  tolerance?: string;
  codeReference?: string;
  recommendation?: string;
  affectedItems?: string[];
}

export interface ValidationRule {
  id: string;
  name: string;
  category: ValidationCategory;
  description: string;
  severity: ValidationSeverity;
  codeReference?: string;
  tolerance?: number;
  toleranceType?: 'percent' | 'absolute';
  checkFunction: string; // Reference to validation function
  enabled: boolean;
}

// Validation rule definitions
export const VALIDATION_RULES: ValidationRule[] = [
  // Airflow validation rules
  {
    id: 'airflow_supply_vs_load',
    name: 'Supply Airflow vs Load Calculation',
    category: 'airflow',
    description: 'Verify duct system supply CFM matches load calculation requirements',
    severity: 'critical',
    tolerance: 10,
    toleranceType: 'percent',
    checkFunction: 'checkSupplyAirflowVsLoad',
    enabled: true,
  },
  {
    id: 'airflow_return_balance',
    name: 'Supply/Return Airflow Balance',
    category: 'airflow',
    description: 'Verify return airflow is appropriately balanced with supply (typically 90-95%)',
    severity: 'warning',
    tolerance: 15,
    toleranceType: 'percent',
    checkFunction: 'checkReturnAirflowBalance',
    enabled: true,
  },
  {
    id: 'airflow_oa_minimum',
    name: 'Outdoor Air Minimum',
    category: 'ventilation',
    description: 'Verify outdoor air meets ASHRAE 62.1 minimum requirements',
    severity: 'critical',
    codeReference: 'ASHRAE 62.1-2019',
    tolerance: 0,
    toleranceType: 'absolute',
    checkFunction: 'checkOutdoorAirMinimum',
    enabled: true,
  },

  // Capacity validation rules
  {
    id: 'capacity_cooling_match',
    name: 'Cooling Capacity vs Load',
    category: 'capacity',
    description: 'Verify selected equipment cooling capacity meets calculated load',
    severity: 'critical',
    tolerance: 10,
    toleranceType: 'percent',
    checkFunction: 'checkCoolingCapacityMatch',
    enabled: true,
  },
  {
    id: 'capacity_heating_match',
    name: 'Heating Capacity vs Load',
    category: 'capacity',
    description: 'Verify selected equipment heating capacity meets calculated load',
    severity: 'critical',
    tolerance: 10,
    toleranceType: 'percent',
    checkFunction: 'checkHeatingCapacityMatch',
    enabled: true,
  },
  {
    id: 'capacity_oversizing',
    name: 'Equipment Oversizing Check',
    category: 'capacity',
    description: 'Warn if equipment is significantly oversized (>25% above load)',
    severity: 'warning',
    tolerance: 25,
    toleranceType: 'percent',
    checkFunction: 'checkEquipmentOversizing',
    enabled: true,
  },

  // Sizing validation rules
  {
    id: 'sizing_duct_velocity',
    name: 'Duct Velocity Limits',
    category: 'sizing',
    description: 'Verify duct velocities are within recommended limits',
    severity: 'warning',
    codeReference: 'ASHRAE Handbook - HVAC Applications Ch. 48',
    checkFunction: 'checkDuctVelocityLimits',
    enabled: true,
  },
  {
    id: 'sizing_pipe_velocity',
    name: 'Pipe Velocity Limits',
    category: 'sizing',
    description: 'Verify pipe velocities are within limits (8 fps closed, 4 fps open)',
    severity: 'warning',
    codeReference: 'ASHRAE Handbook - HVAC Systems Ch. 22',
    checkFunction: 'checkPipeVelocityLimits',
    enabled: true,
  },
  {
    id: 'sizing_diffuser_throw',
    name: 'Diffuser Throw Distance',
    category: 'sizing',
    description: 'Verify diffuser throw reaches occupied zone without drafts',
    severity: 'warning',
    checkFunction: 'checkDiffuserThrow',
    enabled: true,
  },

  // Acoustic validation rules
  {
    id: 'acoustic_equipment_nc',
    name: 'Equipment NC vs Zone Target',
    category: 'acoustic',
    description: 'Verify equipment noise does not exceed zone NC target',
    severity: 'critical',
    codeReference: 'SBC 2018 / ASHRAE Handbook - HVAC Applications Ch. 48',
    checkFunction: 'checkEquipmentNCCompliance',
    enabled: true,
  },
  {
    id: 'acoustic_terminal_nc',
    name: 'Terminal Unit NC Rating',
    category: 'acoustic',
    description: 'Verify VAV/FCU terminal unit noise meets zone requirements',
    severity: 'warning',
    tolerance: 3,
    toleranceType: 'absolute',
    checkFunction: 'checkTerminalNCCompliance',
    enabled: true,
  },
  {
    id: 'acoustic_diffuser_nc',
    name: 'Diffuser NC Rating',
    category: 'acoustic',
    description: 'Verify diffuser/grille noise from velocity is acceptable',
    severity: 'warning',
    tolerance: 5,
    toleranceType: 'absolute',
    checkFunction: 'checkDiffuserNCCompliance',
    enabled: true,
  },

  // Equipment validation rules
  {
    id: 'equipment_efficiency',
    name: 'Equipment Efficiency Compliance',
    category: 'code_compliance',
    description: 'Verify equipment SEER/EER/COP meets code minimum',
    severity: 'critical',
    codeReference: 'ASHRAE 90.1-2019',
    checkFunction: 'checkEquipmentEfficiency',
    enabled: true,
  },
  {
    id: 'equipment_refrigerant',
    name: 'Refrigerant Compliance',
    category: 'code_compliance',
    description: 'Verify refrigerant type is compliant and charge is within limits',
    severity: 'warning',
    checkFunction: 'checkRefrigerantCompliance',
    enabled: true,
  },

  // Linkage validation rules
  {
    id: 'linkage_zone_equipment',
    name: 'Zone-Equipment Linkage',
    category: 'linkage',
    description: 'Verify all zones have associated equipment selections',
    severity: 'warning',
    checkFunction: 'checkZoneEquipmentLinkage',
    enabled: true,
  },
  {
    id: 'linkage_zone_distribution',
    name: 'Zone-Distribution Linkage',
    category: 'linkage',
    description: 'Verify all zones are connected to duct/pipe systems',
    severity: 'warning',
    checkFunction: 'checkZoneDistributionLinkage',
    enabled: true,
  },
  {
    id: 'linkage_load_calculation',
    name: 'Load Calculation Presence',
    category: 'linkage',
    description: 'Verify all zones have load calculations',
    severity: 'critical',
    checkFunction: 'checkLoadCalculationPresence',
    enabled: true,
  },

  // Hydronic validation rules
  {
    id: 'hydronic_flow_match',
    name: 'Hydronic Flow vs Coil Requirements',
    category: 'hydronic',
    description: 'Verify pipe system flow matches coil requirements',
    severity: 'critical',
    tolerance: 10,
    toleranceType: 'percent',
    checkFunction: 'checkHydronicFlowMatch',
    enabled: true,
  },
  {
    id: 'hydronic_delta_t',
    name: 'Hydronic Delta-T Design',
    category: 'hydronic',
    description: 'Verify water temperature differential is within design range',
    severity: 'warning',
    checkFunction: 'checkHydronicDeltaT',
    enabled: true,
  },

  // Ventilation validation rules
  {
    id: 'ventilation_oa_rate',
    name: 'Outdoor Air Rate per Person',
    category: 'ventilation',
    description: 'Verify outdoor air meets ASHRAE 62.1 per-person requirements',
    severity: 'critical',
    codeReference: 'ASHRAE 62.1-2019 Table 6.2.2.1',
    checkFunction: 'checkVentilationOARate',
    enabled: true,
  },
  {
    id: 'ventilation_area_rate',
    name: 'Outdoor Air Rate per Area',
    category: 'ventilation',
    description: 'Verify outdoor air meets ASHRAE 62.1 per-area requirements',
    severity: 'warning',
    codeReference: 'ASHRAE 62.1-2019 Table 6.2.2.1',
    checkFunction: 'checkVentilationAreaRate',
    enabled: true,
  },

  // Code compliance rules
  {
    id: 'code_duct_insulation',
    name: 'Duct Insulation R-Value',
    category: 'code_compliance',
    description: 'Verify duct insulation meets energy code requirements',
    severity: 'warning',
    codeReference: 'ASHRAE 90.1-2019 Table 6.8.2-1',
    checkFunction: 'checkDuctInsulation',
    enabled: true,
  },
  {
    id: 'code_pipe_insulation',
    name: 'Pipe Insulation Thickness',
    category: 'code_compliance',
    description: 'Verify pipe insulation meets energy code requirements',
    severity: 'warning',
    codeReference: 'ASHRAE 90.1-2019 Table 6.8.3-1',
    checkFunction: 'checkPipeInsulation',
    enabled: true,
  },
  {
    id: 'code_economizer',
    name: 'Economizer Requirement',
    category: 'code_compliance',
    description: 'Verify economizer is provided where required by climate zone',
    severity: 'critical',
    codeReference: 'ASHRAE 90.1-2019 Section 6.5.1',
    checkFunction: 'checkEconomizerRequirement',
    enabled: true,
  },

  // ============ Boiler and HW System Rules ============
  {
    id: 'boiler_efficiency',
    name: 'Boiler Efficiency Compliance',
    category: 'code_compliance',
    description: 'Verify boiler AFUE meets ASHRAE 90.1-2019 minimum requirements',
    severity: 'critical',
    codeReference: 'ASHRAE 90.1-2019 Table 6.8.1-6',
    checkFunction: 'checkBoilerEfficiency',
    enabled: true,
  },
  {
    id: 'heat_rejection_balance',
    name: 'Cooling Tower Heat Rejection',
    category: 'capacity',
    description: 'Verify cooling tower capacity covers chiller heat rejection requirements',
    severity: 'critical',
    tolerance: 15,
    toleranceType: 'percent',
    codeReference: 'ASHRAE 90.1-2019',
    checkFunction: 'checkHeatRejectionBalance',
    enabled: true,
  },
  {
    id: 'hydronic_hw_flow_match',
    name: 'HW Flow vs Boiler Output',
    category: 'hydronic',
    description: 'Verify HW pump flow matches boiler output requirements based on ΔT',
    severity: 'critical',
    tolerance: 10,
    toleranceType: 'percent',
    checkFunction: 'checkHWFlowBalance',
    enabled: true,
  },
  {
    id: 'erv_effectiveness',
    name: 'ERV Heat Recovery Effectiveness',
    category: 'ventilation',
    description: 'Verify ERV sensible effectiveness meets ASHRAE 90.1 minimum (50%)',
    severity: 'warning',
    tolerance: 5,
    toleranceType: 'percent',
    codeReference: 'ASHRAE 90.1-2019 Section 6.5.6.1',
    checkFunction: 'checkERVEffectiveness',
    enabled: true,
  },

  // ============ VRF System Validation Rules ============
  {
    id: 'vrf_piping_length',
    name: 'VRF Piping Length Limits',
    category: 'equipment',
    description: 'Verify VRF refrigerant piping length is within manufacturer limits',
    severity: 'critical',
    tolerance: 0,
    toleranceType: 'absolute',
    codeReference: 'Manufacturer specifications',
    checkFunction: 'checkVRFPipingLength',
    enabled: true,
  },
  {
    id: 'vrf_capacity_ratio',
    name: 'VRF Capacity Ratio',
    category: 'capacity',
    description: 'Verify VRF outdoor to indoor unit capacity ratio is within 50-130%',
    severity: 'warning',
    tolerance: 0,
    toleranceType: 'absolute',
    codeReference: 'AHRI 1230',
    checkFunction: 'checkVRFCapacityRatio',
    enabled: true,
  },

  // ============ Additional Sizing Rules ============
  {
    id: 'duct_aspect_ratio',
    name: 'Duct Aspect Ratio',
    category: 'sizing',
    description: 'Verify rectangular duct aspect ratio does not exceed 4:1',
    severity: 'warning',
    tolerance: 0,
    toleranceType: 'absolute',
    codeReference: 'SMACNA HVAC Duct Construction Standards',
    checkFunction: 'checkDuctAspectRatio',
    enabled: true,
  },
  {
    id: 'pump_npsh_check',
    name: 'Pump NPSH Verification',
    category: 'hydronic',
    description: 'Verify pump NPSH available exceeds NPSH required',
    severity: 'critical',
    tolerance: 5,
    toleranceType: 'percent',
    codeReference: 'Hydraulic Institute Standards',
    checkFunction: 'checkPumpNPSH',
    enabled: true,
  },

  // ============ Code Compliance Rules ============
  {
    id: 'refrigerant_charge_limit',
    name: 'Refrigerant Charge Limit',
    category: 'code_compliance',
    description: 'Verify refrigerant charge per ASHRAE 15 safety limits for occupied spaces',
    severity: 'critical',
    codeReference: 'ASHRAE 15-2019',
    checkFunction: 'checkRefrigerantChargeLimit',
    enabled: true,
  },
  {
    id: 'smoke_damper_placement',
    name: 'Fire/Smoke Damper Placement',
    category: 'code_compliance',
    description: 'Verify fire and smoke dampers are specified at rated barrier penetrations',
    severity: 'critical',
    codeReference: 'NFPA 90A, IMC Section 607',
    checkFunction: 'checkSmokeDamperPlacement',
    enabled: true,
  },
  {
    id: 'seismic_restraint',
    name: 'Seismic Restraint Requirements',
    category: 'code_compliance',
    description: 'Verify seismic restraints are specified for equipment in seismic zones',
    severity: 'warning',
    codeReference: 'ASCE 7, IBC Chapter 13',
    checkFunction: 'checkSeismicRestraints',
    enabled: true,
  },
  {
    id: 'access_door_spacing',
    name: 'Duct Access Door Spacing',
    category: 'code_compliance',
    description: 'Verify duct access doors are specified per SMACNA spacing requirements',
    severity: 'warning',
    codeReference: 'SMACNA HVAC Duct Construction Standards',
    checkFunction: 'checkAccessDoorSpacing',
    enabled: true,
  },

  // ============ Additional Cross-System Validation ============
  {
    id: 'vrf_outdoor_acoustic',
    name: 'VRF Outdoor Unit Acoustic Impact',
    category: 'acoustic',
    description: 'Verify VRF outdoor unit noise levels meet property line requirements',
    severity: 'warning',
    tolerance: 5,
    toleranceType: 'absolute',
    codeReference: 'Local noise ordinances',
    checkFunction: 'checkVRFOutdoorAcoustic',
    enabled: true,
  },
  {
    id: 'erv_pressure_drop',
    name: 'ERV Pressure Drop in AHU',
    category: 'airflow',
    description: 'Verify ERV pressure drop is accounted for in AHU static pressure design',
    severity: 'warning',
    tolerance: 10,
    toleranceType: 'percent',
    checkFunction: 'checkERVPressureDrop',
    enabled: true,
  },
  {
    id: 'diffuser_nc_contribution',
    name: 'Diffuser NC Contribution',
    category: 'acoustic',
    description: 'Verify diffuser NC contribution is included in room acoustic analysis',
    severity: 'warning',
    tolerance: 3,
    toleranceType: 'absolute',
    checkFunction: 'checkDiffuserNCContribution',
    enabled: true,
  },
  {
    id: 'cooling_tower_pump_match',
    name: 'Cooling Tower to Condenser Pump Match',
    category: 'hydronic',
    description: 'Verify condenser water pump GPM matches cooling tower requirements',
    severity: 'critical',
    tolerance: 10,
    toleranceType: 'percent',
    checkFunction: 'checkCoolingTowerPumpMatch',
    enabled: true,
  },
];

/**
 * Get rules by category
 */
export function getRulesByCategory(category: ValidationCategory): ValidationRule[] {
  return VALIDATION_RULES.filter(rule => rule.category === category && rule.enabled);
}

/**
 * Get all enabled rules
 */
export function getEnabledRules(): ValidationRule[] {
  return VALIDATION_RULES.filter(rule => rule.enabled);
}

/**
 * Get rules by severity
 */
export function getRulesBySeverity(severity: ValidationSeverity): ValidationRule[] {
  return VALIDATION_RULES.filter(rule => rule.severity === severity && rule.enabled);
}

/**
 * Calculate validation score from checks
 */
export function calculateValidationScore(checks: ValidationCheck[]): {
  score: number;
  passCount: number;
  failCount: number;
  warningCount: number;
  criticalFailures: ValidationCheck[];
} {
  const passCount = checks.filter(c => c.status === 'pass').length;
  const failCount = checks.filter(c => c.status === 'fail').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const skippedCount = checks.filter(c => c.status === 'skipped').length;
  
  const applicableChecks = checks.length - skippedCount;
  const score = applicableChecks > 0 
    ? Math.round((passCount / applicableChecks) * 100)
    : 100;

  const criticalFailures = checks.filter(
    c => c.status === 'fail' && c.severity === 'critical'
  );

  return {
    score,
    passCount,
    failCount,
    warningCount,
    criticalFailures,
  };
}

/**
 * Group checks by category
 */
export function groupChecksByCategory(checks: ValidationCheck[]): Record<ValidationCategory, ValidationCheck[]> {
  const grouped: Record<ValidationCategory, ValidationCheck[]> = {
    airflow: [],
    capacity: [],
    hydronic: [],
    sizing: [],
    equipment: [],
    linkage: [],
    acoustic: [],
    ventilation: [],
    code_compliance: [],
  };

  for (const check of checks) {
    if (grouped[check.category]) {
      grouped[check.category].push(check);
    }
  }

  return grouped;
}

/**
 * Get category display info
 */
export function getCategoryInfo(category: ValidationCategory): {
  label: string;
  icon: string;
  description: string;
} {
  const info: Record<ValidationCategory, { label: string; icon: string; description: string }> = {
    airflow: {
      label: 'Airflow',
      icon: 'Wind',
      description: 'Supply, return, and exhaust airflow validation',
    },
    capacity: {
      label: 'Capacity',
      icon: 'Thermometer',
      description: 'Heating and cooling capacity matching',
    },
    hydronic: {
      label: 'Hydronic',
      icon: 'Droplets',
      description: 'Water flow and temperature validation',
    },
    sizing: {
      label: 'Sizing',
      icon: 'Ruler',
      description: 'Duct, pipe, and equipment sizing checks',
    },
    equipment: {
      label: 'Equipment',
      icon: 'Cpu',
      description: 'Equipment selection and performance',
    },
    linkage: {
      label: 'Linkage',
      icon: 'Link',
      description: 'Data connections between design elements',
    },
    acoustic: {
      label: 'Acoustic',
      icon: 'Volume2',
      description: 'Noise criteria and acoustic compliance',
    },
    ventilation: {
      label: 'Ventilation',
      icon: 'Fan',
      description: 'Outdoor air and ventilation rates',
    },
    code_compliance: {
      label: 'Code Compliance',
      icon: 'FileCheck',
      description: 'Energy code and standards compliance',
    },
  };

  return info[category];
}

/**
 * Get severity display info
 */
export function getSeverityInfo(severity: ValidationSeverity): {
  label: string;
  color: string;
  bgColor: string;
} {
  const info: Record<ValidationSeverity, { label: string; color: string; bgColor: string }> = {
    critical: {
      label: 'Critical',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    warning: {
      label: 'Warning',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-500/10',
    },
    info: {
      label: 'Info',
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
    },
  };

  return info[severity];
}
