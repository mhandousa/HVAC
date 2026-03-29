// Saudi Building Code (SBC) HVAC Requirements Data
// Based on SBC 601 (Energy Conservation) and SBC 602 (Mechanical)

export interface SBCRequirement {
  id: string;
  code: string;
  title: string;
  description: string;
  category: 'efficiency' | 'ventilation' | 'insulation' | 'controls' | 'testing' | 'documentation';
  severity: 'mandatory' | 'prescriptive' | 'performance';
  applicableTo: string[];
  reference: string;
  checkFunction?: string; // Name of validation function
}

export interface SBCClimateZone {
  id: string;
  name: string;
  description: string;
  cities: string[];
  coolingDegreeDays: number;
  heatingDegreeDays: number;
  designDB_C: number;
  designWB_C: number;
}

// SBC Climate Zones for Saudi Arabia
export const SBC_CLIMATE_ZONES: SBCClimateZone[] = [
  {
    id: 'zone-1',
    name: 'Zone 1 - Very Hot Humid',
    description: 'Coastal areas with high humidity',
    cities: ['Jeddah', 'Yanbu', 'Jizan', 'Dammam', 'Al Khobar'],
    coolingDegreeDays: 4500,
    heatingDegreeDays: 50,
    designDB_C: 46,
    designWB_C: 32,
  },
  {
    id: 'zone-2',
    name: 'Zone 2 - Very Hot Dry',
    description: 'Interior desert regions',
    cities: ['Riyadh', 'Mecca', 'Medina', 'Qassim', 'Hail'],
    coolingDegreeDays: 4000,
    heatingDegreeDays: 200,
    designDB_C: 48,
    designWB_C: 24,
  },
  {
    id: 'zone-3',
    name: 'Zone 3 - Hot Dry Highland',
    description: 'Elevated regions with moderate climate',
    cities: ['Taif', 'Abha', 'Khamis Mushait', 'Al Baha'],
    coolingDegreeDays: 2000,
    heatingDegreeDays: 800,
    designDB_C: 38,
    designWB_C: 22,
  },
];

// Minimum Equipment Efficiency Requirements (SBC 601)
export const SBC_EQUIPMENT_EFFICIENCY = {
  // Split systems - EER at 35°C ambient
  splitAC: {
    minEER: 10.5, // BTU/Wh
    minSEER: 13.0,
    sasoStarsMin: 2,
    reference: 'SBC 601 Table C403.2.3(1)',
  },
  // Package units
  packageAC: {
    capacityRanges: [
      { maxTons: 5, minEER: 11.2, minIEER: 11.4 },
      { maxTons: 11.25, minEER: 11.0, minIEER: 11.2 },
      { maxTons: 20, minEER: 10.8, minIEER: 11.0 },
      { maxTons: 63.3, minEER: 9.8, minIEER: 10.1 },
    ],
    reference: 'SBC 601 Table C403.2.3(2)',
  },
  // Chillers
  chillers: {
    airCooled: {
      minCOP: 2.8, // Full load
      minIPLV: 3.5,
    },
    waterCooled: {
      centrifugal: { minCOP: 5.5, minIPLV: 6.1 },
      screw: { minCOP: 4.7, minIPLV: 5.5 },
      scroll: { minCOP: 4.2, minIPLV: 4.8 },
    },
    reference: 'SBC 601 Table C403.2.3(7)',
  },
  // Fans
  fans: {
    maxBhpPerCfm: 0.0015, // BHP per CFM (simplified)
    reference: 'SBC 601 Section C403.2.12',
  },
  // Pumps
  pumps: {
    maxWperGpm: 22, // W per GPM at design head
    reference: 'SBC 601 Section C403.2.13',
  },
};

// Ventilation Requirements (aligned with ASHRAE 62.1)
export const SBC_VENTILATION_RATES = {
  office: { cfmPerPerson: 5, cfmPerSqft: 0.06 },
  retail: { cfmPerPerson: 7.5, cfmPerSqft: 0.12 },
  restaurant: { cfmPerPerson: 7.5, cfmPerSqft: 0.18 },
  classroom: { cfmPerPerson: 10, cfmPerSqft: 0.12 },
  healthcare: { cfmPerPerson: 15, cfmPerSqft: 0.06 },
  hotel_guest: { cfmPerPerson: 5, cfmPerSqft: 0.06 },
  mosque: { cfmPerPerson: 5, cfmPerSqft: 0.06 },
  reference: 'SBC 602 Table 403.3.1.1',
};

// Duct Insulation Requirements (SBC 601)
export const SBC_DUCT_INSULATION = {
  // R-value requirements (h·ft²·°F/BTU)
  supplyInConditioned: { minRValue: 6 },
  supplyInUnconditioned: { minRValue: 8 },
  returnInUnconditioned: { minRValue: 6 },
  outdoorAir: { minRValue: 8 },
  reference: 'SBC 601 Table C403.2.10',
};

// Pipe Insulation Requirements
export const SBC_PIPE_INSULATION = {
  // Minimum thickness in inches by pipe size and fluid temp
  coldPipes: [
    { maxSizeIn: 1, thickness_in: 1.0 },
    { maxSizeIn: 1.5, thickness_in: 1.0 },
    { maxSizeIn: 4, thickness_in: 1.5 },
    { maxSizeIn: 8, thickness_in: 1.5 },
    { maxSizeIn: Infinity, thickness_in: 2.0 },
  ],
  hotPipes: [
    { maxSizeIn: 1, thickness_in: 1.0 },
    { maxSizeIn: 2, thickness_in: 1.5 },
    { maxSizeIn: 4, thickness_in: 2.0 },
    { maxSizeIn: Infinity, thickness_in: 2.5 },
  ],
  reference: 'SBC 601 Table C403.2.11',
};

// Controls Requirements
export const SBC_CONTROLS_REQUIREMENTS: SBCRequirement[] = [
  {
    id: 'ctrl-setback',
    code: 'C403.2.4.3',
    title: 'Setback Controls',
    description: 'Thermostatic controls shall have capability for programmable setback/setup',
    category: 'controls',
    severity: 'mandatory',
    applicableTo: ['all'],
    reference: 'SBC 601 Section C403.2.4.3',
  },
  {
    id: 'ctrl-economizer',
    code: 'C403.5',
    title: 'Economizer',
    description: 'Cooling systems ≥54,000 BTU/h shall include air or water economizer',
    category: 'controls',
    severity: 'prescriptive',
    applicableTo: ['cooling > 54000 BTU/h'],
    reference: 'SBC 601 Section C403.5',
  },
  {
    id: 'ctrl-vav',
    code: 'C403.6.1',
    title: 'VAV Airflow Turndown',
    description: 'VAV systems shall have minimum 30% of design airflow at part load',
    category: 'controls',
    severity: 'prescriptive',
    applicableTo: ['VAV systems'],
    reference: 'SBC 601 Section C403.6.1',
  },
  {
    id: 'ctrl-dcv',
    code: 'C403.7',
    title: 'Demand Control Ventilation',
    description: 'Spaces with >40 persons or density >25 persons/1000 ft² require DCV',
    category: 'controls',
    severity: 'prescriptive',
    applicableTo: ['high occupancy spaces'],
    reference: 'SBC 601 Section C403.7',
  },
  {
    id: 'ctrl-pump-vfd',
    code: 'C403.6.2',
    title: 'Pump VFD',
    description: 'Chilled water pumps >10 HP shall have variable speed control',
    category: 'controls',
    severity: 'prescriptive',
    applicableTo: ['pumps > 10 HP'],
    reference: 'SBC 601 Section C403.6.2',
  },
  {
    id: 'ctrl-energy-recovery',
    code: 'C403.8',
    title: 'Energy Recovery',
    description: 'Exhaust air energy recovery required for systems ≥5000 CFM outdoor air',
    category: 'controls',
    severity: 'prescriptive',
    applicableTo: ['systems ≥ 5000 CFM OA'],
    reference: 'SBC 601 Section C403.8',
  },
];

// Testing and Commissioning Requirements
export const SBC_COMMISSIONING_REQUIREMENTS: SBCRequirement[] = [
  {
    id: 'cx-plan',
    code: 'C408.1',
    title: 'Commissioning Plan',
    description: 'Buildings >50,000 ft² shall have documented commissioning plan',
    category: 'testing',
    severity: 'mandatory',
    applicableTo: ['buildings > 50000 sqft'],
    reference: 'SBC 601 Section C408.1',
  },
  {
    id: 'cx-functional',
    code: 'C408.2',
    title: 'Functional Testing',
    description: 'All HVAC systems shall undergo functional performance testing',
    category: 'testing',
    severity: 'mandatory',
    applicableTo: ['all'],
    reference: 'SBC 601 Section C408.2',
  },
  {
    id: 'cx-air-balance',
    code: 'C408.2.1',
    title: 'Air System Balancing',
    description: 'Supply, return, and outdoor airflows shall be measured and adjusted',
    category: 'testing',
    severity: 'mandatory',
    applicableTo: ['air systems'],
    reference: 'SBC 601 Section C408.2.1',
  },
  {
    id: 'cx-hydro-balance',
    code: 'C408.2.2',
    title: 'Hydronic Balancing',
    description: 'Water flow rates shall be measured and balanced',
    category: 'testing',
    severity: 'mandatory',
    applicableTo: ['hydronic systems'],
    reference: 'SBC 601 Section C408.2.2',
  },
];

// Documentation Requirements
export const SBC_DOCUMENTATION_REQUIREMENTS: SBCRequirement[] = [
  {
    id: 'doc-manuals',
    code: 'C303.1',
    title: 'O&M Manuals',
    description: 'Operation and maintenance manuals for all HVAC equipment',
    category: 'documentation',
    severity: 'mandatory',
    applicableTo: ['all'],
    reference: 'SBC 601 Section C303.1',
  },
  {
    id: 'doc-systems',
    code: 'C303.2',
    title: 'System Documentation',
    description: 'As-built drawings and specifications for HVAC systems',
    category: 'documentation',
    severity: 'mandatory',
    applicableTo: ['all'],
    reference: 'SBC 601 Section C303.2',
  },
  {
    id: 'doc-saso',
    code: 'SASO',
    title: 'SASO Certification',
    description: 'Equipment must have valid SASO energy efficiency certification',
    category: 'efficiency',
    severity: 'mandatory',
    applicableTo: ['AC equipment'],
    reference: 'SASO MEPS Standards',
  },
];

// All SBC Requirements combined
export const ALL_SBC_REQUIREMENTS: SBCRequirement[] = [
  ...SBC_CONTROLS_REQUIREMENTS,
  ...SBC_COMMISSIONING_REQUIREMENTS,
  ...SBC_DOCUMENTATION_REQUIREMENTS,
  {
    id: 'eff-equipment',
    code: 'C403.2.3',
    title: 'Equipment Efficiency',
    description: 'All HVAC equipment shall meet minimum efficiency requirements',
    category: 'efficiency',
    severity: 'mandatory',
    applicableTo: ['all HVAC equipment'],
    reference: 'SBC 601 Section C403.2.3',
  },
  {
    id: 'eff-duct-insulation',
    code: 'C403.2.10',
    title: 'Duct Insulation',
    description: 'Ducts shall be insulated per Table C403.2.10',
    category: 'insulation',
    severity: 'mandatory',
    applicableTo: ['ductwork'],
    reference: 'SBC 601 Section C403.2.10',
  },
  {
    id: 'eff-pipe-insulation',
    code: 'C403.2.11',
    title: 'Pipe Insulation',
    description: 'Piping shall be insulated per Table C403.2.11',
    category: 'insulation',
    severity: 'mandatory',
    applicableTo: ['piping'],
    reference: 'SBC 601 Section C403.2.11',
  },
  {
    id: 'vent-outdoor-air',
    code: 'C403.3',
    title: 'Minimum Outdoor Air',
    description: 'Outdoor air rates per ASHRAE 62.1/SBC 602',
    category: 'ventilation',
    severity: 'mandatory',
    applicableTo: ['all spaces'],
    reference: 'SBC 602 Section 403',
  },
];

// Validation result interface
export interface SBCValidationResult {
  requirement: SBCRequirement;
  status: 'pass' | 'fail' | 'warning' | 'not_applicable';
  actualValue?: string | number;
  requiredValue?: string | number;
  message: string;
}

// Get applicable requirements based on building/system characteristics
export function getApplicableRequirements(characteristics: {
  buildingArea_sqft: number;
  occupancy: string;
  hvacSystemType: string;
  coolingCapacity_btuh: number;
  hasOutdoorAir: boolean;
  pumpHorsepower?: number;
}): SBCRequirement[] {
  return ALL_SBC_REQUIREMENTS.filter(req => {
    // Add filtering logic based on characteristics
    if (req.applicableTo.includes('all')) return true;
    if (req.applicableTo.includes('buildings > 50000 sqft') && characteristics.buildingArea_sqft <= 50000) return false;
    if (req.applicableTo.includes('cooling > 54000 BTU/h') && characteristics.coolingCapacity_btuh <= 54000) return false;
    if (req.applicableTo.includes('pumps > 10 HP') && (characteristics.pumpHorsepower || 0) <= 10) return false;
    if (req.applicableTo.includes('systems ≥ 5000 CFM OA') && !characteristics.hasOutdoorAir) return false;
    return true;
  });
}
