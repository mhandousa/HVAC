// Bill of Quantities (BOQ) Type Definitions

// Material item types (duplicated from useMaterialTakeoff to avoid circular imports)
export interface DuctMaterialItem {
  segmentId: string;
  segmentName: string;
  shape: 'round' | 'rectangular';
  dimensions: string;
  lengthFt: number;
  surfaceAreaSqFt: number;
  weightLbs: number;
  gauge: number;
  material: string;
}

export interface PipeMaterialItem {
  segmentId: string;
  segmentName: string;
  nominalSize: string;
  lengthFt: number;
  material: string;
  schedule: string;
  weightLbsPerFt: number;
  totalWeightLbs: number;
}

export interface InsulationItem {
  application: 'duct' | 'pipe';
  segmentId: string;
  segmentName: string;
  insulationType: string;
  thicknessMm: number;
  surfaceAreaSqM: number;
  linearM?: number;
  costPerM2: number;
}

export interface FittingItem {
  fittingType: string;
  fittingCode: string;
  size: string;
  quantity: number;
  unitWeight?: number;
}

export interface DiffuserGrilleItem {
  type: string;
  model: string;
  neckSize: string;
  cfm: number;
  quantity: number;
}


export interface TerminalUnitBOQItem {
  unitTag: string;
  unitType: string; // VAV, FCU, FPTU, etc.
  manufacturer: string;
  model: string;
  size: string;
  airflowCfm: number;
  quantity: number;
  hasReheat: boolean;
  reheatType: string | null;
  hasDamper: boolean;
  hasFlowStation: boolean;
  zoneName: string;
}

export interface EquipmentBOQItem {
  category: string; // Chiller, Pump, Cooling Tower, AHU
  name: string;
  tag: string;
  manufacturer: string;
  model: string;
  capacity: string;
  quantity: number;
  status: string;
  notes: string | null;
}

export interface AHUComponentBOQItem {
  ahuTag: string;
  ahuName: string;
  cfm: number;
  coolingTons: number | null;
  heatingMBH: number | null;
  hasCoolingCoil: boolean;
  hasHeatingCoil: boolean;
  hasPreheatCoil: boolean;
  supplyFanHP: number | null;
  returnFanHP: number | null;
  filterType: string | null;
  hasHumidifier: boolean;
  hasERV: boolean;
  economizer: string | null;
}

export interface AccessoryBOQItem {
  category: 'damper' | 'actuator' | 'sensor' | 'coil' | 'control' | 'other';
  description: string;
  size: string;
  quantity: number;
  sourceUnit: string; // Which unit it belongs to
  sourceType: 'terminal' | 'ahu' | 'duct' | 'pipe';
}

export interface SupportBOQItem {
  supportType: 'trapeze' | 'clevis' | 'strap' | 'riser_clamp' | 'pipe_guide' | 'anchor' | 'beam_clamp' | 'seismic_brace';
  description: string;
  size: string;
  estimatedQuantity: number;
  application: 'duct' | 'pipe';
  basis: string; // e.g., "Per SMACNA Table 4-1 - 8ft spacing"
  rodDiameter?: string | null;
  loadCapacityLbs?: number | null;
  spacingFt?: number;
  isRiser?: boolean;
}

// Support estimation settings
export interface SupportEstimationSettings {
  includeSeismicBracing: boolean;
  seismicZone: 'low' | 'moderate' | 'high' | 'very_high';
  installationType: 'overhead' | 'wall' | 'floor';
  pressureClass: string;
  hasInsulation: boolean;
}

export interface ActualDuctFitting {
  id: string;
  ductSegmentId: string;
  segmentName: string;
  fittingType: string;
  fittingDescription: string | null;
  lossCoefficient: number | null;
  equivalentLengthFt: number | null;
  quantity: number;
}

export interface ActualPipeFitting {
  id: string;
  pipeSegmentId: string;
  segmentName: string;
  fittingType: string;
  fittingDescription: string | null;
  kFactor: number | null;
  size: string | null;
  quantity: number;
}

export interface DiffuserGrilleBOQItem {
  id: string;
  terminalType: string;
  style: string | null;
  model: string | null;
  neckSize: string | null;
  airflowCfm: number | null;
  quantity: number;
  zoneName: string | null;
  locationDescription: string | null;
}

export interface EnhancedBOQSummary {
  // Material quantities
  totalDuctAreaSqFt: number;
  totalDuctWeightLbs: number;
  totalDuctLengthFt: number;
  totalPipeLengthFt: number;
  totalPipeWeightLbs: number;
  totalInsulationAreaSqM: number;
  totalInsulationCostSAR: number;

  // Component counts
  totalDiffusers: number;
  totalTerminalUnits: number;
  totalEquipmentPieces: number;
  totalAHUs: number;
  totalDuctFittings: number;
  totalPipeFittings: number;
  totalAccessories: number;
  totalSupports: number;

  // By category breakdowns
  fittingsByType: { type: string; count: number }[];
  accessoriesByCategory: { category: string; count: number }[];
  terminalsByType: { type: string; count: number }[];
  equipmentByCategory: { category: string; count: number }[];
}

export interface BOQDuctSystem {
  systemId: string;
  systemName: string;
  systemType: string | null;
  totalCfm: number | null;
  segments: DuctMaterialItem[];
  fittings: ActualDuctFitting[];
  insulation: InsulationItem[];
}

export interface BOQPipeSystem {
  systemId: string;
  systemName: string;
  systemType: string | null;
  segments: PipeMaterialItem[];
  fittings: ActualPipeFitting[];
  insulation: InsulationItem[];
}

export interface ProjectBOQ {
  projectId: string;
  projectName: string;
  generatedDate: string;

  // Duct Systems (multiple systems aggregated)
  ductSystems: BOQDuctSystem[];

  // Pipe Systems (multiple systems aggregated)
  pipeSystems: BOQPipeSystem[];
  // Air Terminals
  diffusersGrilles: DiffuserGrilleBOQItem[];
  terminalUnits: TerminalUnitBOQItem[];

  // Major Equipment
  equipmentSelections: EquipmentBOQItem[];
  ahuComponents: AHUComponentBOQItem[];

  // Accessories (derived)
  accessories: AccessoryBOQItem[];

  // Supports & Hangers (estimated)
  supports: SupportBOQItem[];

  // Summary
  summary: EnhancedBOQSummary;

  // Data source indicators
  dataSources: {
    ductSystemsCount: number;
    pipeSystemsCount: number;
    hasTerminalUnits: boolean;
    hasDiffusers: boolean;
    hasEquipment: boolean;
    hasAHUs: boolean;
  };
}

// Types are now defined above, no re-export needed
