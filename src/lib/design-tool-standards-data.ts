// Design Tool Standards Data
// Comprehensive mapping of HVAC design tools to their calculation standards

export interface StandardReference {
  id: string;
  name: string;
  fullName: string;
  organization: string;
  version: string;
  description: string;
  keyTopics: string[];
  externalLink?: string;
}

export interface ToolDocumentation {
  id: string;
  name: string;
  category: string;
  standards: string[];
  description: string;
  keyInputs: string[];
  keyOutputs: string[];
  prerequisites: string[];
  path: string;
  workflowStage: number;
}

export interface WorkflowStage {
  stage: number;
  name: string;
  purpose: string;
  standards: string[];
  inputs: string[];
  outputs: string[];
  nextStage: string;
  tools: string[];
}

export interface GlossaryTerm {
  term: string;
  abbreviation?: string;
  definition: string;
  relatedTerms?: string[];
  standard?: string;
}

// Standards Reference Data
export const standardsData: StandardReference[] = [
  {
    id: 'ashrae-62-1',
    name: 'ASHRAE 62.1',
    fullName: 'Ventilation for Acceptable Indoor Air Quality',
    organization: 'ASHRAE',
    version: '2022',
    description: 'Defines minimum ventilation rates and indoor air quality requirements for commercial and institutional buildings using the Ventilation Rate Procedure (VRP).',
    keyTopics: [
      'Ventilation Rate Procedure (VRP)',
      'Outdoor Air (Voz) calculation',
      'Breathing Zone Ventilation (Vbz)',
      'Zone Air Distribution Effectiveness (Ez)',
      'System Ventilation Efficiency (Ev)',
      'Multiple Zone Recirculating Systems',
    ],
    externalLink: 'https://www.ashrae.org/technical-resources/standards-and-guidelines',
  },
  {
    id: 'ashrae-90-1',
    name: 'ASHRAE 90.1',
    fullName: 'Energy Standard for Buildings Except Low-Rise Residential Buildings',
    organization: 'ASHRAE',
    version: '2022',
    description: 'Establishes minimum energy efficiency requirements for HVAC systems, including equipment performance, fan power limitations, economizer requirements, and energy recovery mandates.',
    keyTopics: [
      'Equipment Efficiency (COP, EER, IPLV)',
      'Fan Power Limitations (BHP/CFM)',
      'Pump Power Limitations',
      'Economizer Requirements',
      'Energy Recovery Requirements',
      'Pipe and Duct Insulation',
      'HVAC Controls',
    ],
    externalLink: 'https://www.ashrae.org/technical-resources/standards-and-guidelines',
  },
  {
    id: 'ashrae-55',
    name: 'ASHRAE 55',
    fullName: 'Thermal Environmental Conditions for Human Occupancy',
    organization: 'ASHRAE',
    version: '2020',
    description: 'Specifies thermal comfort conditions including temperature, humidity, air speed, and radiant temperature. Uses PMV (Predicted Mean Vote) and PPD (Predicted Percentage Dissatisfied) models.',
    keyTopics: [
      'PMV/PPD Model',
      'Operative Temperature',
      'Humidity Limits',
      'Air Speed Effects',
      'Metabolic Rate (met)',
      'Clothing Insulation (clo)',
      'Local Thermal Discomfort',
    ],
    externalLink: 'https://www.ashrae.org/technical-resources/standards-and-guidelines',
  },
  {
    id: 'ahri-550-590',
    name: 'AHRI 550/590',
    fullName: 'Performance Rating of Water-chilling and Heat Pump Water-heating Packages',
    organization: 'AHRI',
    version: '2023',
    description: 'Standard rating conditions for chillers including IPLV (Integrated Part-Load Value) calculation methodology for water-cooled and air-cooled chillers.',
    keyTopics: [
      'Full Load Rating Conditions',
      'IPLV Calculation (25/50/75/100%)',
      'NPLV for Non-Standard Conditions',
      'Condenser Water Temperatures',
      'Chilled Water Temperatures',
      'Fouling Factors',
    ],
    externalLink: 'https://www.ahrinet.org/search-standards',
  },
  {
    id: 'ahri-1500',
    name: 'AHRI 1500',
    fullName: 'Performance Rating of Commercial Space Heating Boilers',
    organization: 'AHRI',
    version: '2023',
    description: 'Rating methodology for commercial boilers including thermal efficiency and AFUE (Annual Fuel Utilization Efficiency) calculation.',
    keyTopics: [
      'Thermal Efficiency',
      'AFUE Calculation',
      'Combustion Efficiency',
      'Standby Losses',
      'Turndown Ratio',
      'Condensing vs Non-Condensing',
    ],
    externalLink: 'https://www.ahrinet.org/search-standards',
  },
  {
    id: 'sbc-601',
    name: 'SBC 601',
    fullName: 'Saudi Energy Conservation Code',
    organization: 'Saudi Building Code National Committee',
    version: '2018',
    description: 'Saudi-specific energy conservation requirements adapted from ASHRAE 90.1 with modifications for the hot-arid climate of Saudi Arabia.',
    keyTopics: [
      'Climate Zone Classification',
      'Building Envelope Requirements',
      'HVAC Efficiency Mandates',
      'Lighting Power Density',
      'Service Water Heating',
      'SASO Certification Requirements',
    ],
    externalLink: 'https://www.sbc.gov.sa/',
  },
  {
    id: 'sbc-602',
    name: 'SBC 602',
    fullName: 'Saudi Mechanical Code',
    organization: 'Saudi Building Code National Committee',
    version: '2018',
    description: 'Mechanical system requirements for Saudi Arabia including HVAC, ventilation, exhaust, and duct system standards.',
    keyTopics: [
      'Ventilation Requirements',
      'Duct Construction',
      'Equipment Installation',
      'Testing and Balancing',
      'Commissioning Requirements',
    ],
    externalLink: 'https://www.sbc.gov.sa/',
  },
  {
    id: 'nfpa-92',
    name: 'NFPA 92',
    fullName: 'Standard for Smoke Control Systems',
    organization: 'NFPA',
    version: '2021',
    description: 'Design criteria for smoke control systems including stairwell pressurization, atrium smoke exhaust, and zoned smoke control.',
    keyTopics: [
      'Stairwell Pressurization',
      'Atrium Smoke Exhaust',
      'Zoned Smoke Control',
      'Smoke Layer Interface',
      'Pressure Differentials',
      'Fire Size (HRR)',
    ],
    externalLink: 'https://www.nfpa.org/codes-and-standards',
  },
  {
    id: 'smacna',
    name: 'SMACNA',
    fullName: 'Sheet Metal and Air Conditioning Contractors National Association',
    organization: 'SMACNA',
    version: '2016',
    description: 'Industry standards for duct construction, fittings, sealing, and installation practices.',
    keyTopics: [
      'Duct Construction Standards',
      'Fitting Loss Coefficients',
      'Sealing Classes',
      'Leakage Classes',
      'Hanger and Support Spacing',
      'Flexible Duct Limitations',
    ],
    externalLink: 'https://www.smacna.org/technical-resources',
  },
  {
    id: 'saso',
    name: 'SASO',
    fullName: 'Saudi Standards, Metrology and Quality Organization',
    organization: 'SASO',
    version: 'Current',
    description: 'Saudi certification requirements for HVAC equipment including efficiency ratings, safety standards, and import requirements.',
    keyTopics: [
      'Equipment Certification',
      'Energy Efficiency Labels',
      'Minimum Efficiency Standards',
      'Testing Requirements',
      'Market Surveillance',
    ],
    externalLink: 'https://www.saso.gov.sa/',
  },
  {
    id: 'ashrae-52-2',
    name: 'ASHRAE 52.2',
    fullName: 'Method of Testing General Ventilation Air-Cleaning Devices',
    organization: 'ASHRAE',
    version: '2017',
    description: 'Test method for air filter efficiency ratings using MERV (Minimum Efficiency Reporting Value) scale.',
    keyTopics: [
      'MERV Rating System',
      'Particle Size Efficiency',
      'Pressure Drop Testing',
      'Dust Holding Capacity',
      'Filter Loading',
    ],
    externalLink: 'https://www.ashrae.org/technical-resources/standards-and-guidelines',
  },
  {
    id: 'asce-7',
    name: 'ASCE 7',
    fullName: 'Minimum Design Loads and Associated Criteria for Buildings',
    organization: 'ASCE',
    version: '2022',
    description: 'Structural loading requirements including seismic design criteria for mechanical equipment and piping systems.',
    keyTopics: [
      'Seismic Design Categories',
      'Equipment Anchorage',
      'Component Importance Factor',
      'Piping System Bracing',
      'Vibration Isolation Restraints',
    ],
    externalLink: 'https://www.asce.org/publications-and-news/asce-7',
  },
];

// Tool Documentation Data
export const toolsData: ToolDocumentation[] = [
  // Core Calculations
  {
    id: 'load-calculation',
    name: 'Load Calculation',
    category: 'Core Calculations',
    standards: ['ASHRAE Fundamentals'],
    description: 'Calculate peak cooling and heating loads for zones and buildings using ASHRAE methods.',
    keyInputs: ['Building envelope', 'Internal loads', 'Weather data', 'Occupancy schedules'],
    keyOutputs: ['Peak cooling (BTU/h)', 'Peak heating (BTU/h)', 'Load profiles', 'Component breakdowns'],
    prerequisites: [],
    path: '/design/load-calculation',
    workflowStage: 1,
  },
  {
    id: 'ventilation-calculator',
    name: 'Ventilation Calculator',
    category: 'Core Calculations',
    standards: ['ASHRAE 62.1-2022'],
    description: 'Calculate outdoor air requirements using the Ventilation Rate Procedure.',
    keyInputs: ['Space types', 'Occupancy', 'Floor area', 'System type'],
    keyOutputs: ['Voz (zone outdoor air)', 'Vbz (breathing zone)', 'Ez (effectiveness)', 'System Ev'],
    prerequisites: ['Space definitions'],
    path: '/design/ventilation',
    workflowStage: 2,
  },
  {
    id: 'psychrometric-chart',
    name: 'Psychrometric Chart',
    category: 'Core Calculations',
    standards: ['ASHRAE Fundamentals'],
    description: 'Analyze air conditions and HVAC processes on the psychrometric chart.',
    keyInputs: ['Room conditions', 'Supply air conditions', 'Process type'],
    keyOutputs: ['Coil loads', 'Dehumidification', 'Humidification', 'Mixed air conditions'],
    prerequisites: ['Load calculation'],
    path: '/design/psychrometric',
    workflowStage: 3,
  },
  {
    id: 'erv-sizing',
    name: 'ERV/HRV Sizing',
    category: 'Core Calculations',
    standards: ['ASHRAE 90.1-2022'],
    description: 'Size energy recovery ventilators and calculate annual energy savings.',
    keyInputs: ['Ventilation CFM', 'Climate data', 'Operating hours'],
    keyOutputs: ['ERV capacity', 'Effectiveness', 'Annual kWh savings', 'Payback period'],
    prerequisites: ['Ventilation calculation'],
    path: '/design/erv-sizing',
    workflowStage: 9,
  },
  // Equipment Selection
  {
    id: 'equipment-catalog',
    name: 'Equipment Catalog',
    category: 'Equipment Selection',
    standards: ['SASO', 'AHRI'],
    description: 'Browse and manage AHRI/SASO certified HVAC equipment database.',
    keyInputs: ['Equipment type', 'Capacity range', 'Efficiency requirements'],
    keyOutputs: ['Equipment list', 'Performance data', 'Certification status'],
    prerequisites: [],
    path: '/design/equipment-catalog',
    workflowStage: 6,
  },
  {
    id: 'chiller-selection',
    name: 'Chiller Selection',
    category: 'Plant Design',
    standards: ['AHRI 550/590', 'ASHRAE 90.1-2022'],
    description: 'Select chillers with IPLV analysis and part-load performance evaluation.',
    keyInputs: ['Cooling load (tons)', 'CHW temperatures', 'CW temperatures', 'Operating profile'],
    keyOutputs: ['Chiller schedule', 'IPLV/NPLV', 'Part-load curves', 'Efficiency analysis'],
    prerequisites: ['CHW plant sizing'],
    path: '/design/chiller-selection',
    workflowStage: 10,
  },
  {
    id: 'boiler-selection',
    name: 'Boiler Selection',
    category: 'Plant Design',
    standards: ['AHRI 1500', 'ASHRAE 90.1-2022'],
    description: 'Select boilers with AFUE analysis and efficiency optimization.',
    keyInputs: ['Heating load (MBH)', 'HW temperatures', 'Fuel type', 'Turndown requirements'],
    keyOutputs: ['Boiler schedule', 'AFUE rating', 'Efficiency analysis', 'Annual fuel cost'],
    prerequisites: ['HW plant sizing'],
    path: '/design/boiler-selection',
    workflowStage: 10,
  },
  {
    id: 'terminal-sizing',
    name: 'VAV/FCU Terminal Sizing',
    category: 'Equipment Selection',
    standards: ['ASHRAE 62.1', 'AHRI'],
    description: 'Size VAV boxes and FCUs based on zone loads and ventilation requirements.',
    keyInputs: ['Zone loads', 'Ventilation CFM', 'System type', 'Reheat requirements'],
    keyOutputs: ['Terminal schedule', 'Inlet sizes', 'Reheat capacity', 'NC ratings'],
    prerequisites: ['Load calculation', 'Ventilation calculation'],
    path: '/design/terminal-sizing',
    workflowStage: 5,
  },
  {
    id: 'coil-selection',
    name: 'Coil Selection',
    category: 'Equipment Selection',
    standards: ['AHRI', 'ASHRAE'],
    description: 'Select cooling and heating coils with detailed performance analysis.',
    keyInputs: ['Airflow CFM', 'Entering/leaving conditions', 'Water temperatures'],
    keyOutputs: ['Coil specifications', 'Rows/fins', 'Pressure drops', 'Face velocity'],
    prerequisites: ['Psychrometric analysis'],
    path: '/design/coil-selection',
    workflowStage: 6,
  },
  {
    id: 'filter-selection',
    name: 'Filter Selection',
    category: 'Equipment Selection',
    standards: ['ASHRAE 52.2', 'SASO'],
    description: 'Select air filters with life-cycle cost analysis and Saudi dust factors.',
    keyInputs: ['Airflow CFM', 'MERV requirement', 'Operating hours', 'Dust conditions'],
    keyOutputs: ['Filter specifications', 'Pressure drop', 'Replacement cost', 'Life-cycle cost'],
    prerequisites: ['AHU configuration'],
    path: '/design/filter-selection',
    workflowStage: 6,
  },
  // Air Distribution
  {
    id: 'duct-sizing',
    name: 'Duct Sizing',
    category: 'Air Distribution',
    standards: ['ASHRAE Fundamentals', 'SMACNA'],
    description: 'Size ducts using equal friction or static regain methods.',
    keyInputs: ['Airflow CFM', 'Velocity limits', 'Friction rate', 'Duct shape'],
    keyOutputs: ['Duct dimensions', 'Velocity', 'Pressure drop', 'Equivalent diameter'],
    prerequisites: ['AHU configuration'],
    path: '/design/duct-sizing',
    workflowStage: 7,
  },
  {
    id: 'duct-system-designer',
    name: 'Duct System Designer',
    category: 'Air Distribution',
    standards: ['SMACNA', 'ASHRAE'],
    description: 'Design complete duct systems with visual layout and pressure analysis.',
    keyInputs: ['Equipment locations', 'Zone CFM', 'Building layout'],
    keyOutputs: ['Duct layout', 'System pressure drop', 'Fitting losses', 'Critical path'],
    prerequisites: ['Duct sizing'],
    path: '/design/duct-designer',
    workflowStage: 7,
  },
  {
    id: 'diffuser-selection',
    name: 'Diffuser Selection',
    category: 'Air Distribution',
    standards: ['ASHRAE'],
    description: 'Select supply diffusers and return grilles with throw pattern analysis.',
    keyInputs: ['Zone CFM', 'Ceiling height', 'Space dimensions', 'NC target'],
    keyOutputs: ['Diffuser schedule', 'Throw distances', 'NC ratings', 'Pattern visualization'],
    prerequisites: ['Duct system design'],
    path: '/design/diffuser-selection',
    workflowStage: 8,
  },
  {
    id: 'fan-selection',
    name: 'Fan Selection',
    category: 'Air Distribution',
    standards: ['ASHRAE 90.1', 'AMCA'],
    description: 'Select fans with system curve matching and efficiency analysis.',
    keyInputs: ['Airflow CFM', 'Static pressure', 'Motor efficiency', 'Fan type'],
    keyOutputs: ['Fan schedule', 'BHP', 'Operating point', 'Fan curves'],
    prerequisites: ['Duct system design'],
    path: '/design/fan-selection',
    workflowStage: 6,
  },
  // Water Distribution
  {
    id: 'pipe-sizing',
    name: 'Pipe Sizing',
    category: 'Water Distribution',
    standards: ['ASHRAE'],
    description: 'Size pipes for chilled water, hot water, and condenser water systems.',
    keyInputs: ['Flow GPM', 'Velocity limits', 'Pipe material', 'System type'],
    keyOutputs: ['Pipe size', 'Velocity', 'Pressure drop', 'Head loss'],
    prerequisites: ['Plant sizing'],
    path: '/design/pipe-sizing',
    workflowStage: 7,
  },
  {
    id: 'pump-selection',
    name: 'Pump Selection',
    category: 'Water Distribution',
    standards: ['ASHRAE 90.1', 'HI'],
    description: 'Select pumps with system curve matching and NPSH verification.',
    keyInputs: ['Flow GPM', 'Head (ft)', 'Motor efficiency', 'Pump type'],
    keyOutputs: ['Pump schedule', 'BHP', 'NPSH available', 'Pump curves'],
    prerequisites: ['Pipe system design'],
    path: '/design/pump-selection',
    workflowStage: 6,
  },
  {
    id: 'cooling-tower-sizing',
    name: 'Cooling Tower Sizing',
    category: 'Plant Design',
    standards: ['CTI', 'ASHRAE'],
    description: 'Size cooling towers with range/approach analysis for Saudi conditions.',
    keyInputs: ['Heat rejection (tons)', 'CW temperatures', 'Wet bulb', 'Approach'],
    keyOutputs: ['Tower specifications', 'Cell count', 'Fan HP', 'Makeup water'],
    prerequisites: ['CHW plant sizing'],
    path: '/design/cooling-tower',
    workflowStage: 10,
  },
  // Analysis & Compliance
  {
    id: 'acoustic-calculator',
    name: 'Acoustic Calculator',
    category: 'Analysis & Compliance',
    standards: ['ASHRAE', 'SBC'],
    description: 'Calculate NC ratings and verify compliance with space type requirements.',
    keyInputs: ['Sound sources', 'Attenuation elements', 'Space type'],
    keyOutputs: ['NC rating', 'Octave band levels', 'Compliance status'],
    prerequisites: ['Equipment selection'],
    path: '/design/acoustic',
    workflowStage: 11,
  },
  {
    id: 'thermal-comfort',
    name: 'Thermal Comfort',
    category: 'Analysis & Compliance',
    standards: ['ASHRAE 55-2020'],
    description: 'Analyze PMV/PPD thermal comfort metrics and comfort zone compliance.',
    keyInputs: ['Air temperature', 'Humidity', 'Air speed', 'Metabolic rate', 'Clothing'],
    keyOutputs: ['PMV value', 'PPD percentage', 'Comfort zone chart', 'Recommendations'],
    prerequisites: ['Load calculation'],
    path: '/design/thermal-comfort',
    workflowStage: 11,
  },
  {
    id: 'smoke-control',
    name: 'Smoke Control',
    category: 'Analysis & Compliance',
    standards: ['NFPA 92'],
    description: 'Design stairwell pressurization and atrium smoke exhaust systems.',
    keyInputs: ['Building geometry', 'Door sizes', 'Fire size (HRR)', 'Stack effect'],
    keyOutputs: ['Pressurization CFM', 'Exhaust CFM', 'Pressure differentials', 'Fan sizing'],
    prerequisites: [],
    path: '/design/smoke-control',
    workflowStage: 11,
  },
  {
    id: 'ashrae-90-1-compliance',
    name: 'ASHRAE 90.1 Compliance',
    category: 'Analysis & Compliance',
    standards: ['ASHRAE 90.1-2022'],
    description: 'Verify HVAC system compliance with ASHRAE 90.1 energy requirements.',
    keyInputs: ['Equipment efficiency', 'Fan power', 'Economizer data', 'ERV data'],
    keyOutputs: ['Compliance report', 'Pass/fail status', 'Baseline comparisons'],
    prerequisites: ['Equipment selection', 'System design'],
    path: '/design/ashrae-90-1',
    workflowStage: 11,
  },
  {
    id: 'sbc-compliance',
    name: 'SBC Compliance',
    category: 'Analysis & Compliance',
    standards: ['SBC 601', 'SBC 602'],
    description: 'Verify compliance with Saudi Building Code requirements.',
    keyInputs: ['System data', 'Efficiency ratings', 'SASO certifications'],
    keyOutputs: ['SBC compliance report', 'Deficiency list', 'Recommendations'],
    prerequisites: ['Equipment selection'],
    path: '/design/sbc-compliance',
    workflowStage: 11,
  },
];

// Workflow Stages
export const workflowStages: WorkflowStage[] = [
  {
    stage: 1,
    name: 'Load Calculation',
    purpose: 'Establish peak cooling and heating requirements for all zones',
    standards: ['ASHRAE Fundamentals'],
    inputs: ['Building envelope data', 'Internal loads', 'Weather data', 'Schedules'],
    outputs: ['Peak loads (BTU/h)', 'Load profiles', 'Component breakdowns'],
    nextStage: 'Ventilation',
    tools: ['Load Calculation'],
  },
  {
    stage: 2,
    name: 'Ventilation',
    purpose: 'Calculate outdoor air requirements for acceptable IAQ',
    standards: ['ASHRAE 62.1-2022'],
    inputs: ['Space types', 'Occupancy', 'Floor areas', 'System type'],
    outputs: ['Voz', 'Vbz', 'Zone effectiveness (Ez)', 'System efficiency (Ev)'],
    nextStage: 'Psychrometric',
    tools: ['Ventilation Calculator'],
  },
  {
    stage: 3,
    name: 'Psychrometric Analysis',
    purpose: 'Define air conditions and size coils',
    standards: ['ASHRAE Fundamentals'],
    inputs: ['Load data', 'Supply/return conditions', 'Ventilation requirements'],
    outputs: ['Coil loads', 'Dehumidification requirements', 'Mixed air conditions'],
    nextStage: 'AHU Configuration',
    tools: ['Psychrometric Chart'],
  },
  {
    stage: 4,
    name: 'AHU Configuration',
    purpose: 'Configure air handling units',
    standards: ['SMACNA', 'ASHRAE'],
    inputs: ['Total CFM', 'Static pressure', 'Coil data', 'Filter requirements'],
    outputs: ['AHU specifications', 'Component layouts', 'Control sequences'],
    nextStage: 'Terminal Units',
    tools: ['AHU Configuration'],
  },
  {
    stage: 5,
    name: 'Terminal Units',
    purpose: 'Size zone terminal devices',
    standards: ['ASHRAE', 'AHRI'],
    inputs: ['Zone loads', 'Ventilation CFM', 'System type'],
    outputs: ['VAV/FCU schedules', 'Inlet sizes', 'Reheat sizing', 'NC ratings'],
    nextStage: 'Equipment Selection',
    tools: ['VAV/FCU Terminal Sizing'],
  },
  {
    stage: 6,
    name: 'Equipment Selection',
    purpose: 'Select major HVAC equipment',
    standards: ['AHRI', 'ASHRAE 90.1', 'SASO'],
    inputs: ['Calculated capacities', 'Efficiency targets'],
    outputs: ['Equipment schedules', 'Performance data', 'Certification verification'],
    nextStage: 'Distribution',
    tools: ['Equipment Catalog', 'Coil Selection', 'Filter Selection', 'Fan Selection', 'Pump Selection'],
  },
  {
    stage: 7,
    name: 'Distribution',
    purpose: 'Design duct and pipe systems',
    standards: ['SMACNA', 'ASHRAE'],
    inputs: ['Equipment locations', 'CFM/GPM requirements', 'Building layout'],
    outputs: ['Duct/pipe layouts', 'Pressure drops', 'Critical paths'],
    nextStage: 'Diffusers',
    tools: ['Duct Sizing', 'Duct System Designer', 'Pipe Sizing', 'Pipe System Designer'],
  },
  {
    stage: 8,
    name: 'Diffusers',
    purpose: 'Select terminal air devices',
    standards: ['ASHRAE'],
    inputs: ['Zone CFM', 'Ceiling heights', 'Space dimensions'],
    outputs: ['Diffuser schedule', 'Throw patterns', 'NC verification'],
    nextStage: 'ERV',
    tools: ['Diffuser Selection'],
  },
  {
    stage: 9,
    name: 'ERV',
    purpose: 'Size energy recovery ventilators',
    standards: ['ASHRAE 90.1-2022'],
    inputs: ['Ventilation CFM', 'Climate data', 'Operating schedules'],
    outputs: ['ERV specifications', 'Effectiveness', 'Annual savings'],
    nextStage: 'Plant Design',
    tools: ['ERV/HRV Sizing'],
  },
  {
    stage: 10,
    name: 'Plant Design',
    purpose: 'Size central heating and cooling plants',
    standards: ['AHRI 550/590', 'AHRI 1500', 'CTI'],
    inputs: ['Building loads', 'Diversity factors', 'Redundancy requirements'],
    outputs: ['Chiller/boiler schedules', 'Cooling towers', 'Pump configurations'],
    nextStage: 'Compliance',
    tools: ['CHW Plant Sizing', 'Chiller Selection', 'HW Plant Sizing', 'Boiler Selection', 'Cooling Tower Sizing'],
  },
  {
    stage: 11,
    name: 'Compliance',
    purpose: 'Verify code and standard compliance',
    standards: ['ASHRAE 90.1', 'ASHRAE 55', 'ASHRAE 62.1', 'SBC 601/602', 'NFPA 92'],
    inputs: ['All design data'],
    outputs: ['Compliance reports', 'Deficiency lists', 'Certification documentation'],
    nextStage: 'Complete',
    tools: ['Acoustic Calculator', 'Thermal Comfort', 'Smoke Control', 'ASHRAE 90.1 Compliance', 'SBC Compliance'],
  },
];

// Glossary Data
export const glossaryData: GlossaryTerm[] = [
  // Organizations
  { term: 'ASHRAE', definition: 'American Society of Heating, Refrigerating and Air-Conditioning Engineers. Professional organization that develops standards for HVAC&R systems.', relatedTerms: ['AHRI', 'SMACNA'] },
  { term: 'AHRI', definition: 'Air-Conditioning, Heating, and Refrigeration Institute. Trade association that certifies HVAC equipment performance ratings.', relatedTerms: ['ASHRAE', 'SASO'] },
  { term: 'SASO', definition: 'Saudi Standards, Metrology and Quality Organization. Saudi certification body for equipment standards and efficiency requirements.', relatedTerms: ['SBC', 'AHRI'] },
  { term: 'SBC', definition: 'Saudi Building Code. National building regulations for Saudi Arabia including mechanical and energy codes.', relatedTerms: ['SASO', 'ASHRAE 90.1'] },
  { term: 'SMACNA', definition: 'Sheet Metal and Air Conditioning Contractors National Association. Industry standards for duct construction and installation.', relatedTerms: ['ASHRAE'] },
  { term: 'NFPA', definition: 'National Fire Protection Association. Develops fire safety codes including NFPA 92 for smoke control systems.', relatedTerms: ['Smoke Control'] },
  { term: 'CTI', definition: 'Cooling Technology Institute. Standards organization for cooling tower testing and certification.', relatedTerms: ['Cooling Tower'] },
  
  // Efficiency Metrics
  { term: 'COP', abbreviation: 'COP', definition: 'Coefficient of Performance. Ratio of cooling/heating output to electrical input (dimensionless). Higher COP = better efficiency.', standard: 'ASHRAE 90.1', relatedTerms: ['EER', 'IPLV'] },
  { term: 'EER', abbreviation: 'EER', definition: 'Energy Efficiency Ratio. Cooling capacity (BTU/h) divided by power input (W) at full load conditions. Units: BTU/W·h.', standard: 'AHRI', relatedTerms: ['COP', 'SEER'] },
  { term: 'IPLV', abbreviation: 'IPLV', definition: 'Integrated Part-Load Value. Weighted average efficiency at 25%, 50%, 75%, and 100% load for chillers. Accounts for typical operating conditions.', standard: 'AHRI 550/590', relatedTerms: ['NPLV', 'COP'] },
  { term: 'NPLV', abbreviation: 'NPLV', definition: 'Non-Standard Part-Load Value. IPLV calculated at non-standard operating conditions (different water temperatures).', standard: 'AHRI 550/590', relatedTerms: ['IPLV'] },
  { term: 'AFUE', abbreviation: 'AFUE', definition: 'Annual Fuel Utilization Efficiency. Percentage of fuel converted to useful heat over a heating season. Higher = more efficient.', standard: 'AHRI 1500', relatedTerms: ['Thermal Efficiency'] },
  { term: 'SEER', abbreviation: 'SEER', definition: 'Seasonal Energy Efficiency Ratio. Total cooling output divided by total electrical input over a cooling season.', standard: 'AHRI', relatedTerms: ['EER', 'IEER'] },
  
  // Ventilation
  { term: 'Voz', definition: 'Zone Outdoor Airflow. Minimum outdoor air required at the zone level per ASHRAE 62.1.', standard: 'ASHRAE 62.1', relatedTerms: ['Vbz', 'Ez'] },
  { term: 'Vbz', definition: 'Breathing Zone Outdoor Airflow. Outdoor air required in the breathing zone (Rp × Pz + Ra × Az).', standard: 'ASHRAE 62.1', relatedTerms: ['Voz', 'Rp', 'Ra'] },
  { term: 'Ez', definition: 'Zone Air Distribution Effectiveness. Factor accounting for air distribution in the zone (typically 0.8-1.0 for ceiling supply).', standard: 'ASHRAE 62.1', relatedTerms: ['Ev', 'Voz'] },
  { term: 'Ev', definition: 'System Ventilation Efficiency. Factor for multiple-zone systems accounting for zone diversity and critical zone.', standard: 'ASHRAE 62.1', relatedTerms: ['Ez'] },
  { term: 'Rp', definition: 'People Outdoor Air Rate. CFM per person required based on occupancy (typically 5-10 CFM/person).', standard: 'ASHRAE 62.1', relatedTerms: ['Ra', 'Vbz'] },
  { term: 'Ra', definition: 'Area Outdoor Air Rate. CFM per square foot required based on floor area (typically 0.06-0.18 CFM/sf).', standard: 'ASHRAE 62.1', relatedTerms: ['Rp', 'Vbz'] },
  
  // Thermal Comfort
  { term: 'PMV', abbreviation: 'PMV', definition: 'Predicted Mean Vote. Thermal comfort index from -3 (cold) to +3 (hot). Target: -0.5 to +0.5 for comfort.', standard: 'ASHRAE 55', relatedTerms: ['PPD'] },
  { term: 'PPD', abbreviation: 'PPD', definition: 'Predicted Percentage Dissatisfied. Percentage of occupants expected to be uncomfortable. Target: <10% for ASHRAE 55 compliance.', standard: 'ASHRAE 55', relatedTerms: ['PMV'] },
  { term: 'met', definition: 'Metabolic Rate Unit. 1 met = 58.2 W/m² = seated, quiet activity. Used in thermal comfort calculations.', standard: 'ASHRAE 55', relatedTerms: ['clo', 'PMV'] },
  { term: 'clo', definition: 'Clothing Insulation Unit. 1 clo = 0.155 m²·K/W = typical business suit. Used in thermal comfort calculations.', standard: 'ASHRAE 55', relatedTerms: ['met', 'PMV'] },
  
  // Acoustics
  { term: 'NC', abbreviation: 'NC', definition: 'Noise Criteria. Single-number rating for HVAC noise levels. Lower NC = quieter. Typical targets: 25-40 depending on space type.', relatedTerms: ['RC', 'dBA'] },
  { term: 'RC', abbreviation: 'RC', definition: 'Room Criteria. Noise rating that includes spectral quality descriptors (rumble, hiss, roar).', relatedTerms: ['NC'] },
  { term: 'dB', abbreviation: 'dB', definition: 'Decibel. Logarithmic unit for sound power or pressure level. 10 dB increase = perceived doubling of loudness.', relatedTerms: ['dBA', 'NC'] },
  { term: 'dBA', abbreviation: 'dBA', definition: 'A-weighted Decibel. Sound level weighted to approximate human hearing sensitivity.', relatedTerms: ['dB', 'NC'] },
  
  // Flow & Pressure
  { term: 'CFM', abbreviation: 'CFM', definition: 'Cubic Feet per Minute. Standard unit for airflow rate in HVAC systems.', relatedTerms: ['GPM', 'FPM'] },
  { term: 'GPM', abbreviation: 'GPM', definition: 'Gallons per Minute. Standard unit for water flow rate in hydronic systems.', relatedTerms: ['CFM'] },
  { term: 'FPM', abbreviation: 'FPM', definition: 'Feet per Minute. Air or water velocity in ducts/pipes.', relatedTerms: ['CFM'] },
  { term: 'Static Pressure', definition: 'Pressure exerted by air at rest. Measured in inches of water gauge (in. w.g.) or Pascals.', relatedTerms: ['Total Pressure', 'Velocity Pressure'] },
  { term: 'Head', definition: 'Pressure in a liquid system, typically expressed in feet of water. Used for pump sizing.', relatedTerms: ['GPM', 'NPSH'] },
  { term: 'NPSH', abbreviation: 'NPSH', definition: 'Net Positive Suction Head. Pressure available at pump suction to prevent cavitation.', relatedTerms: ['Head'] },
  
  // Capacity
  { term: 'BTU', abbreviation: 'BTU', definition: 'British Thermal Unit. Energy required to raise 1 lb of water by 1°F. Common unit for heating/cooling loads.', relatedTerms: ['Ton', 'MBH'] },
  { term: 'MBH', abbreviation: 'MBH', definition: 'Thousands of BTU per hour (M = Roman numeral 1000). Common for heating capacity.', relatedTerms: ['BTU', 'Ton'] },
  { term: 'Ton', definition: 'Refrigeration Ton. Cooling capacity = 12,000 BTU/h. Based on heat to melt 1 ton of ice in 24 hours.', relatedTerms: ['BTU', 'kW'] },
  
  // Filters
  { term: 'MERV', abbreviation: 'MERV', definition: 'Minimum Efficiency Reporting Value. Filter efficiency rating from 1-20. Higher MERV = finer filtration but more pressure drop.', standard: 'ASHRAE 52.2', relatedTerms: ['HEPA'] },
  { term: 'HEPA', abbreviation: 'HEPA', definition: 'High Efficiency Particulate Air. Filter with 99.97% efficiency at 0.3 microns. Used in clean rooms and hospitals.', relatedTerms: ['MERV'] },
];

// Category definitions
export const toolCategories = [
  { id: 'core', name: 'Core Calculations', description: 'Fundamental HVAC calculations including loads, ventilation, and psychrometrics', icon: 'Calculator' },
  { id: 'equipment', name: 'Equipment Selection', description: 'Select and size HVAC equipment using certified catalog data', icon: 'Settings' },
  { id: 'air-distribution', name: 'Air Distribution', description: 'Design duct systems, fans, and air terminals', icon: 'Wind' },
  { id: 'water-distribution', name: 'Water Distribution', description: 'Design pipe systems and select pumps', icon: 'Droplets' },
  { id: 'vrf', name: 'VRF Systems', description: 'Design Variable Refrigerant Flow systems', icon: 'Snowflake' },
  { id: 'plant', name: 'Plant Design', description: 'Design central heating and cooling plants', icon: 'Factory' },
  { id: 'analysis', name: 'Analysis & Compliance', description: 'Verify compliance with codes and standards', icon: 'ClipboardCheck' },
  { id: 'documentation', name: 'Documentation & Tracking', description: 'Generate reports and track design progress', icon: 'FileText' },
];
