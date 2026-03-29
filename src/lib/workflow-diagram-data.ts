import { 
  Calculator, Wind, Thermometer, AirVent, LayoutGrid, 
  Settings, GitBranch, Square, Recycle, Factory, ClipboardCheck,
  Gauge, Filter, Box, Fan, Droplets, Flame
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NodeStatus = 'complete' | 'in-progress' | 'pending' | 'locked';
export type EdgeType = 'sequential' | 'dependency' | 'optional';
export type EdgeStatus = 'active' | 'inactive' | 'warning' | 'error';

export interface WorkflowNode {
  id: string;
  type: 'stage' | 'tool';
  name: string;
  shortName: string;
  icon: LucideIcon;
  path: string;
  stageId?: string;
  position: { row: number; col: number };
  standards?: string[];
  description?: string;
  tools?: string[];
}

export interface WorkflowEdge {
  id: string;
  from: string;
  to: string;
  type: EdgeType;
  label?: string;
}

// Stage nodes for high-level view
export const stageNodes: WorkflowNode[] = [
  {
    id: 'load',
    type: 'stage',
    name: 'Load Calculation',
    shortName: 'Load',
    icon: Calculator,
    path: '/design/load-calculation',
    position: { row: 0, col: 2 },
    standards: ['ASHRAE Fundamentals'],
    description: 'Calculate cooling and heating loads for each zone',
    tools: ['Load Calculator', 'Envelope Analysis']
  },
  {
    id: 'ventilation',
    type: 'stage',
    name: 'Ventilation',
    shortName: 'Vent',
    icon: Wind,
    path: '/design/ventilation',
    position: { row: 1, col: 2 },
    standards: ['ASHRAE 62.1'],
    description: 'Determine outdoor air requirements using VRP',
    tools: ['Ventilation Calculator', 'IAQ Analysis']
  },
  {
    id: 'psychrometric',
    type: 'stage',
    name: 'Psychrometric Analysis',
    shortName: 'Psych',
    icon: Thermometer,
    path: '/design/psychrometric',
    position: { row: 2, col: 2 },
    standards: ['ASHRAE Fundamentals'],
    description: 'Analyze air conditions and coil processes',
    tools: ['Psychrometric Chart', 'Process Calculator']
  },
  {
    id: 'ahu',
    type: 'stage',
    name: 'AHU Configuration',
    shortName: 'AHU',
    icon: AirVent,
    path: '/design/ahu-configuration',
    position: { row: 3, col: 2 },
    standards: ['ASHRAE', 'SMACNA'],
    description: 'Configure air handling unit components',
    tools: ['AHU Builder', 'Component Selection']
  },
  {
    id: 'terminal',
    type: 'stage',
    name: 'Terminal Units',
    shortName: 'Terminal',
    icon: LayoutGrid,
    path: '/design/terminal-units',
    position: { row: 4, col: 2 },
    standards: ['ASHRAE', 'AHRI'],
    description: 'Size VAV boxes and fan coil units',
    tools: ['VAV Selection', 'FCU Selection']
  },
  {
    id: 'equipment',
    type: 'stage',
    name: 'Equipment Selection',
    shortName: 'Equip',
    icon: Settings,
    path: '/design/equipment-selection',
    position: { row: 5, col: 2 },
    standards: ['AHRI', 'ASHRAE 90.1'],
    description: 'Select major HVAC equipment',
    tools: ['Coil Selection', 'Filter Selection', 'Equipment Catalog']
  },
  {
    id: 'distribution',
    type: 'stage',
    name: 'Distribution',
    shortName: 'Dist',
    icon: GitBranch,
    path: '/design/duct-sizing',
    position: { row: 6, col: 2 },
    standards: ['SMACNA', 'ASHRAE'],
    description: 'Design duct and pipe distribution systems',
    tools: ['Duct Sizing', 'Pipe Sizing', 'System Designer']
  },
  {
    id: 'diffuser',
    type: 'stage',
    name: 'Diffusers & Grilles',
    shortName: 'Diff',
    icon: Square,
    path: '/design/diffuser-selection',
    position: { row: 7, col: 2 },
    standards: ['ASHRAE'],
    description: 'Select supply diffusers and return grilles',
    tools: ['Diffuser Selection', 'Throw Calculator']
  },
  {
    id: 'erv',
    type: 'stage',
    name: 'Energy Recovery',
    shortName: 'ERV',
    icon: Recycle,
    path: '/design/erv-sizing',
    position: { row: 8, col: 2 },
    standards: ['ASHRAE 90.1'],
    description: 'Size energy recovery ventilators',
    tools: ['ERV Sizing', 'Savings Calculator']
  },
  {
    id: 'plant',
    type: 'stage',
    name: 'Plant Design',
    shortName: 'Plant',
    icon: Factory,
    path: '/design/chw-plant',
    position: { row: 9, col: 2 },
    standards: ['AHRI', 'ASHRAE'],
    description: 'Design central heating and cooling plants',
    tools: ['CHW Plant', 'HW Plant', 'Chiller Selection', 'Boiler Selection']
  },
  {
    id: 'compliance',
    type: 'stage',
    name: 'Compliance',
    shortName: 'Comply',
    icon: ClipboardCheck,
    path: '/design/compliance',
    position: { row: 10, col: 2 },
    standards: ['ASHRAE 90.1', 'SBC 601/602'],
    description: 'Verify code compliance and generate reports',
    tools: ['ASHRAE 90.1 Check', 'SBC Compliance', 'Design Validation']
  }
];

// Detailed tool nodes for expanded view (55+ design tools)
export const toolNodes: WorkflowNode[] = [
  // ============ Load Calculation Stage ============
  {
    id: 'load-calc',
    type: 'tool',
    name: 'Load Calculator',
    shortName: 'Load Calc',
    icon: Calculator,
    path: '/design/load-calculation',
    stageId: 'load',
    position: { row: 0, col: 2 },
    standards: ['ASHRAE Fundamentals']
  },
  {
    id: 'envelope-analysis',
    type: 'tool',
    name: 'Envelope Analysis',
    shortName: 'Envelope',
    icon: Box,
    path: '/design/envelope-analysis',
    stageId: 'load',
    position: { row: 0, col: 3 },
    standards: ['ASHRAE 90.1']
  },

  // ============ Ventilation Stage ============
  {
    id: 'vent-calc',
    type: 'tool',
    name: 'Ventilation Calculator',
    shortName: 'Vent Calc',
    icon: Wind,
    path: '/design/ventilation',
    stageId: 'ventilation',
    position: { row: 1, col: 2 },
    standards: ['ASHRAE 62.1']
  },
  {
    id: 'iaq-analysis',
    type: 'tool',
    name: 'IAQ Analysis',
    shortName: 'IAQ',
    icon: Wind,
    path: '/design/iaq-analysis',
    stageId: 'ventilation',
    position: { row: 1, col: 3 },
    standards: ['ASHRAE 62.1']
  },

  // ============ Psychrometric Stage ============
  {
    id: 'psychrometric-chart',
    type: 'tool',
    name: 'Psychrometric Chart',
    shortName: 'Psych Chart',
    icon: Thermometer,
    path: '/design/psychrometric',
    stageId: 'psychrometric',
    position: { row: 2, col: 2 },
    standards: ['ASHRAE Fundamentals']
  },
  {
    id: 'process-calculator',
    type: 'tool',
    name: 'Process Calculator',
    shortName: 'Process',
    icon: Calculator,
    path: '/design/psychrometric-process',
    stageId: 'psychrometric',
    position: { row: 2, col: 3 },
    standards: ['ASHRAE Fundamentals']
  },

  // ============ AHU Configuration Stage ============
  {
    id: 'ahu-builder',
    type: 'tool',
    name: 'AHU Configuration',
    shortName: 'AHU Builder',
    icon: AirVent,
    path: '/design/ahu-configuration',
    stageId: 'ahu',
    position: { row: 3, col: 2 },
    standards: ['ASHRAE', 'SMACNA']
  },
  {
    id: 'economizer-sizing',
    type: 'tool',
    name: 'Economizer Sizing',
    shortName: 'Economizer',
    icon: Recycle,
    path: '/design/economizer-sizing',
    stageId: 'ahu',
    position: { row: 3, col: 3 },
    standards: ['ASHRAE 90.1']
  },

  // ============ Terminal Units Stage ============
  {
    id: 'vav-select',
    type: 'tool',
    name: 'VAV Box Selection',
    shortName: 'VAV',
    icon: Box,
    path: '/design/vav-selection',
    stageId: 'terminal',
    position: { row: 4, col: 1 },
    standards: ['ASHRAE']
  },
  {
    id: 'fcu-select',
    type: 'tool',
    name: 'FCU Selection',
    shortName: 'FCU',
    icon: Fan,
    path: '/design/fcu-selection',
    stageId: 'terminal',
    position: { row: 4, col: 3 },
    standards: ['AHRI']
  },
  {
    id: 'terminal-sizing',
    type: 'tool',
    name: 'Terminal Unit Sizing',
    shortName: 'Terminal Size',
    icon: LayoutGrid,
    path: '/design/terminal-unit-sizing',
    stageId: 'terminal',
    position: { row: 4, col: 2 },
    standards: ['ASHRAE']
  },

  // ============ Equipment Selection Stage ============
  {
    id: 'coil-select',
    type: 'tool',
    name: 'Coil Selection',
    shortName: 'Coil',
    icon: Gauge,
    path: '/design/coil-selection',
    stageId: 'equipment',
    position: { row: 5, col: 1 },
    standards: ['AHRI', 'ASHRAE']
  },
  {
    id: 'filter-select',
    type: 'tool',
    name: 'Filter Selection',
    shortName: 'Filter',
    icon: Filter,
    path: '/design/filter-selection',
    stageId: 'equipment',
    position: { row: 5, col: 3 },
    standards: ['ASHRAE 52.2']
  },
  {
    id: 'equipment-schedule',
    type: 'tool',
    name: 'Equipment Schedule',
    shortName: 'Schedule',
    icon: Settings,
    path: '/design/equipment-schedule',
    stageId: 'equipment',
    position: { row: 5, col: 2 },
    standards: ['Project Specs']
  },

  // ============ Distribution Stage ============
  {
    id: 'duct-sizing',
    type: 'tool',
    name: 'Duct Sizing',
    shortName: 'Duct Size',
    icon: GitBranch,
    path: '/design/duct-sizing',
    stageId: 'distribution',
    position: { row: 6, col: 1 },
    standards: ['SMACNA', 'ASHRAE']
  },
  {
    id: 'duct-designer',
    type: 'tool',
    name: 'Duct Designer',
    shortName: 'Duct Design',
    icon: GitBranch,
    path: '/design/duct-designer',
    stageId: 'distribution',
    position: { row: 6, col: 2 },
    standards: ['SMACNA']
  },
  {
    id: 'pipe-sizing',
    type: 'tool',
    name: 'Pipe Sizing',
    shortName: 'Pipe Size',
    icon: Droplets,
    path: '/design/pipe-sizing',
    stageId: 'distribution',
    position: { row: 6, col: 3 },
    standards: ['ASHRAE']
  },
  {
    id: 'pipe-designer',
    type: 'tool',
    name: 'Pipe Designer',
    shortName: 'Pipe Design',
    icon: Droplets,
    path: '/design/pipe-designer',
    stageId: 'distribution',
    position: { row: 6, col: 4 },
    standards: ['ASHRAE']
  },
  {
    id: 'fan-selection',
    type: 'tool',
    name: 'Fan Selection',
    shortName: 'Fan',
    icon: Fan,
    path: '/design/fan-selection',
    stageId: 'distribution',
    position: { row: 7, col: 1 },
    standards: ['AMCA']
  },
  {
    id: 'pump-selection',
    type: 'tool',
    name: 'Pump Selection',
    shortName: 'Pump',
    icon: Droplets,
    path: '/design/pump-selection',
    stageId: 'distribution',
    position: { row: 7, col: 3 },
    standards: ['HI']
  },

  // ============ Diffusers & Grilles Stage ============
  {
    id: 'diffuser-select',
    type: 'tool',
    name: 'Diffuser Selection',
    shortName: 'Diffuser',
    icon: Square,
    path: '/design/diffuser-selection',
    stageId: 'diffuser',
    position: { row: 8, col: 2 },
    standards: ['ASHRAE']
  },
  {
    id: 'throw-calculator',
    type: 'tool',
    name: 'Throw Calculator',
    shortName: 'Throw',
    icon: Square,
    path: '/design/throw-calculator',
    stageId: 'diffuser',
    position: { row: 8, col: 3 },
    standards: ['ASHRAE']
  },

  // ============ ERV Stage ============
  {
    id: 'erv-sizing',
    type: 'tool',
    name: 'ERV Sizing',
    shortName: 'ERV Size',
    icon: Recycle,
    path: '/design/erv-sizing',
    stageId: 'erv',
    position: { row: 9, col: 2 },
    standards: ['ASHRAE 90.1']
  },
  {
    id: 'erv-savings',
    type: 'tool',
    name: 'ERV Savings Calculator',
    shortName: 'ERV Savings',
    icon: Calculator,
    path: '/design/erv-savings',
    stageId: 'erv',
    position: { row: 9, col: 3 },
    standards: ['ASHRAE 90.1']
  },

  // ============ Plant Design Stage ============
  {
    id: 'chw-plant',
    type: 'tool',
    name: 'CHW Plant Design',
    shortName: 'CHW Plant',
    icon: Factory,
    path: '/design/chw-plant',
    stageId: 'plant',
    position: { row: 10, col: 1 },
    standards: ['ASHRAE']
  },
  {
    id: 'hw-plant',
    type: 'tool',
    name: 'HW Plant Design',
    shortName: 'HW Plant',
    icon: Flame,
    path: '/design/hw-plant',
    stageId: 'plant',
    position: { row: 10, col: 2 },
    standards: ['ASHRAE']
  },
  {
    id: 'chiller-select',
    type: 'tool',
    name: 'Chiller Selection',
    shortName: 'Chiller',
    icon: Droplets,
    path: '/design/chiller-selection',
    stageId: 'plant',
    position: { row: 10, col: 3 },
    standards: ['AHRI 550/590', 'ASHRAE 90.1']
  },
  {
    id: 'boiler-select',
    type: 'tool',
    name: 'Boiler Selection',
    shortName: 'Boiler',
    icon: Flame,
    path: '/design/boiler-selection',
    stageId: 'plant',
    position: { row: 11, col: 1 },
    standards: ['AHRI 1500', 'ASHRAE 90.1']
  },
  {
    id: 'cooling-tower',
    type: 'tool',
    name: 'Cooling Tower Sizing',
    shortName: 'Tower',
    icon: Factory,
    path: '/design/cooling-tower',
    stageId: 'plant',
    position: { row: 11, col: 2 },
    standards: ['CTI', 'ASHRAE']
  },
  {
    id: 'vrf-designer',
    type: 'tool',
    name: 'VRF System Designer',
    shortName: 'VRF',
    icon: Settings,
    path: '/design/vrf-designer',
    stageId: 'plant',
    position: { row: 11, col: 3 },
    standards: ['AHRI', 'ASHRAE']
  },

  // ============ Compliance Stage ============
  {
    id: 'ashrae-90-1',
    type: 'tool',
    name: 'ASHRAE 90.1 Compliance',
    shortName: 'ASHRAE 90.1',
    icon: ClipboardCheck,
    path: '/design/ashrae-90-1',
    stageId: 'compliance',
    position: { row: 12, col: 1 },
    standards: ['ASHRAE 90.1-2019']
  },
  {
    id: 'sbc-compliance',
    type: 'tool',
    name: 'SBC Compliance',
    shortName: 'SBC',
    icon: ClipboardCheck,
    path: '/design/sbc-compliance',
    stageId: 'compliance',
    position: { row: 12, col: 2 },
    standards: ['SBC 601/602']
  },
  {
    id: 'design-validation',
    type: 'tool',
    name: 'Design Validation',
    shortName: 'Validation',
    icon: ClipboardCheck,
    path: '/design/validation',
    stageId: 'compliance',
    position: { row: 12, col: 3 },
    standards: ['Multiple']
  },

  // ============ Acoustic Tools ============
  {
    id: 'room-acoustics',
    type: 'tool',
    name: 'Room Acoustics',
    shortName: 'Room NC',
    icon: Gauge,
    path: '/design/acoustic-calculator',
    stageId: 'compliance',
    position: { row: 13, col: 1 },
    standards: ['ASHRAE', 'SBC']
  },
  {
    id: 'duct-breakout',
    type: 'tool',
    name: 'Duct Breakout Noise',
    shortName: 'Breakout',
    icon: Gauge,
    path: '/design/duct-breakout-calculator',
    stageId: 'compliance',
    position: { row: 13, col: 2 },
    standards: ['ASHRAE']
  },
  {
    id: 'silencer-sizing',
    type: 'tool',
    name: 'Silencer Sizing',
    shortName: 'Silencer',
    icon: Gauge,
    path: '/design/silencer-sizing',
    stageId: 'compliance',
    position: { row: 13, col: 3 },
    standards: ['ASHRAE', 'SMACNA']
  },
  {
    id: 'equipment-acoustic',
    type: 'tool',
    name: 'Equipment Acoustic Analysis',
    shortName: 'Equip NC',
    icon: Gauge,
    path: '/design/equipment-acoustics',
    stageId: 'compliance',
    position: { row: 14, col: 1 },
    standards: ['ASHRAE']
  },
  {
    id: 'nc-comparison',
    type: 'tool',
    name: 'NC Comparison Dashboard',
    shortName: 'NC Compare',
    icon: Gauge,
    path: '/design/nc-comparison',
    stageId: 'compliance',
    position: { row: 14, col: 2 },
    standards: ['ASHRAE']
  },

  // ============ Documentation Tools ============
  {
    id: 'bas-points',
    type: 'tool',
    name: 'BAS Points List',
    shortName: 'BAS',
    icon: Settings,
    path: '/design/bas-points',
    stageId: 'compliance',
    position: { row: 15, col: 1 },
    standards: ['Project Specs']
  },
  {
    id: 'soo-generator',
    type: 'tool',
    name: 'Sequence of Operations',
    shortName: 'SOO',
    icon: ClipboardCheck,
    path: '/design/soo-generator',
    stageId: 'compliance',
    position: { row: 15, col: 2 },
    standards: ['ASHRAE Guideline 36']
  },
  {
    id: 'material-takeoff',
    type: 'tool',
    name: 'Material Takeoff',
    shortName: 'Takeoff',
    icon: Calculator,
    path: '/design/material-takeoff',
    stageId: 'compliance',
    position: { row: 15, col: 3 },
    standards: ['Project Specs']
  },

  // ============ Analysis Tools ============
  {
    id: 'thermal-comfort',
    type: 'tool',
    name: 'Thermal Comfort',
    shortName: 'Comfort',
    icon: Thermometer,
    path: '/design/thermal-comfort',
    stageId: 'compliance',
    position: { row: 16, col: 1 },
    standards: ['ASHRAE 55']
  },
  {
    id: 'smoke-control',
    type: 'tool',
    name: 'Smoke Control',
    shortName: 'Smoke',
    icon: Wind,
    path: '/design/smoke-control',
    stageId: 'compliance',
    position: { row: 16, col: 2 },
    standards: ['NFPA 92']
  },
  {
    id: 'insulation-calc',
    type: 'tool',
    name: 'Insulation Calculator',
    shortName: 'Insulation',
    icon: Box,
    path: '/design/insulation-calculator',
    stageId: 'compliance',
    position: { row: 16, col: 3 },
    standards: ['ASHRAE 90.1']
  },
];

// Sequential edges (main workflow flow)
export const sequentialEdges: WorkflowEdge[] = [
  { id: 'e1', from: 'load', to: 'ventilation', type: 'sequential' },
  { id: 'e2', from: 'ventilation', to: 'psychrometric', type: 'sequential' },
  { id: 'e3', from: 'psychrometric', to: 'ahu', type: 'sequential' },
  { id: 'e4', from: 'ahu', to: 'terminal', type: 'sequential' },
  { id: 'e5', from: 'terminal', to: 'equipment', type: 'sequential' },
  { id: 'e6', from: 'equipment', to: 'distribution', type: 'sequential' },
  { id: 'e7', from: 'distribution', to: 'diffuser', type: 'sequential' },
  { id: 'e8', from: 'diffuser', to: 'erv', type: 'sequential' },
  { id: 'e9', from: 'erv', to: 'plant', type: 'sequential' },
  { id: 'e10', from: 'plant', to: 'compliance', type: 'sequential' }
];

// Dependency edges (cross-tool data flow)
export const dependencyEdges: WorkflowEdge[] = [
  { id: 'd1', from: 'load', to: 'equipment', type: 'dependency', label: 'Capacity' },
  { id: 'd2', from: 'load', to: 'terminal', type: 'dependency', label: 'Zone loads' },
  { id: 'd3', from: 'ventilation', to: 'equipment', type: 'dependency', label: 'OA requirements' },
  { id: 'd4', from: 'ahu', to: 'equipment', type: 'dependency', label: 'AHU specs' },
  { id: 'd5', from: 'ahu', to: 'distribution', type: 'dependency', label: 'CFM/static' },
  { id: 'd6', from: 'terminal', to: 'diffuser', type: 'dependency', label: 'Zone CFM' },
  { id: 'd7', from: 'equipment', to: 'plant', type: 'dependency', label: 'Total capacity' }
];

// Optional edges (alternative paths)
export const optionalEdges: WorkflowEdge[] = [
  { id: 'o1', from: 'load', to: 'plant', type: 'optional', label: 'Direct sizing' },
  { id: 'o2', from: 'ventilation', to: 'erv', type: 'optional', label: 'ERV check' }
];

// All edges combined
export const allEdges: WorkflowEdge[] = [
  ...sequentialEdges,
  ...dependencyEdges,
  ...optionalEdges
];

// Layout constants
export const DIAGRAM_CONFIG = {
  nodeWidth: 140,
  nodeHeight: 60,
  stageNodeRadius: 50,
  toolNodeWidth: 100,
  toolNodeHeight: 40,
  rowGap: 80,
  colGap: 140,
  padding: 60,
  canvasWidth: 900,
  canvasHeight: 1600, // Expanded for 55+ tools
  maxCols: 5
};

// Helper to get node position in pixels
export function getNodePosition(node: WorkflowNode): { x: number; y: number } {
  const { rowGap, colGap, padding, stageNodeRadius } = DIAGRAM_CONFIG;
  return {
    x: padding + node.position.col * colGap,
    y: padding + node.position.row * rowGap + stageNodeRadius
  };
}

// Get all nodes for a given stage
export function getToolsForStage(stageId: string): WorkflowNode[] {
  return toolNodes.filter(tool => tool.stageId === stageId);
}

// Get edges connected to a node
export function getConnectedEdges(nodeId: string): WorkflowEdge[] {
  return allEdges.filter(edge => edge.from === nodeId || edge.to === nodeId);
}

// Get upstream dependencies
export function getUpstreamNodes(nodeId: string): string[] {
  return allEdges
    .filter(edge => edge.to === nodeId)
    .map(edge => edge.from);
}

// Get downstream dependents
export function getDownstreamNodes(nodeId: string): string[] {
  return allEdges
    .filter(edge => edge.from === nodeId)
    .map(edge => edge.to);
}
