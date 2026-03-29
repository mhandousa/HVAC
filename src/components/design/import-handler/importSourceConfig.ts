import { Calculator, Fan, Droplet, Wind, Box, Gauge, Thermometer, Factory, type LucideIcon } from 'lucide-react';
import type { UpstreamData } from '@/hooks/useDesignDataFlow';

export interface ImportMetric {
  label: string;
  value: string | number;
  unit?: string;
}

export interface ImportSource {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  targetTools: string[];
  getMetrics: (data: UpstreamData) => ImportMetric[];
  isAvailable: (data: UpstreamData) => boolean;
  getStatus: (data: UpstreamData) => 'ready' | 'partial' | 'empty';
  dataKey: keyof UpstreamData;
}

export const IMPORT_SOURCES: ImportSource[] = [
  {
    id: 'load-calculations',
    name: 'Load Calculations',
    icon: Calculator,
    description: 'Zone cooling/heating loads and CFM requirements',
    targetTools: ['ventilation', 'equipment-selection', 'ahu-configuration', 'vrf-system', 'terminal-unit'],
    dataKey: 'loadCalculations',
    getMetrics: (data) => [
      { label: 'Cooling', value: data.loadCalculations.totalCoolingTons.toFixed(1), unit: 'tons' },
      { label: 'Zones', value: data.loadCalculations.zoneCount },
      { label: 'Total CFM', value: data.loadCalculations.totalCfm.toLocaleString() },
    ],
    isAvailable: (data) => data.loadCalculations.available,
    getStatus: (data) => {
      if (!data.loadCalculations.available) return 'empty';
      return data.loadCalculations.zoneCount > 0 ? 'ready' : 'partial';
    },
  },
  {
    id: 'ventilation-calculations',
    name: 'Ventilation Calculations',
    icon: Wind,
    description: 'ASHRAE 62.1 outdoor air and supply air requirements',
    targetTools: ['erv-sizing', 'ahu-configuration'],
    dataKey: 'ventilationCalcs',
    getMetrics: (data) => [
      { label: 'Outdoor Air', value: data.ventilationCalcs.totalOutdoorAirCfm.toLocaleString(), unit: 'CFM' },
      { label: 'Supply Air', value: data.ventilationCalcs.totalSupplyAirCfm.toLocaleString(), unit: 'CFM' },
      { label: 'Calculations', value: data.ventilationCalcs.calculationCount },
    ],
    isAvailable: (data) => data.ventilationCalcs.available,
    getStatus: (data) => {
      if (!data.ventilationCalcs.available) return 'empty';
      return data.ventilationCalcs.calculationCount > 0 ? 'ready' : 'partial';
    },
  },
  {
    id: 'equipment-selections',
    name: 'Equipment Selections',
    icon: Box,
    description: 'Selected HVAC equipment with capacities',
    targetTools: ['terminal-unit', 'diffuser-selection'],
    dataKey: 'equipmentSelections',
    getMetrics: (data) => [
      { label: 'Equipment', value: data.equipmentSelections.selectedCount },
      { label: 'Capacity', value: data.equipmentSelections.totalCapacityTons.toFixed(1), unit: 'tons' },
    ],
    isAvailable: (data) => data.equipmentSelections.available,
    getStatus: (data) => {
      if (!data.equipmentSelections.available) return 'empty';
      return data.equipmentSelections.selectedCount > 0 ? 'ready' : 'partial';
    },
  },
  {
    id: 'ahu-configurations',
    name: 'AHU Configurations',
    icon: Fan,
    description: 'Air handling unit design data and airflows',
    targetTools: ['duct-designer', 'fan-selection'],
    dataKey: 'ahuConfigurations',
    getMetrics: (data) => [
      { label: 'AHUs', value: data.ahuConfigurations.ahuCount },
      { label: 'Design CFM', value: data.ahuConfigurations.totalDesignCfm.toLocaleString() },
    ],
    isAvailable: (data) => data.ahuConfigurations.available,
    getStatus: (data) => {
      if (!data.ahuConfigurations.available) return 'empty';
      return data.ahuConfigurations.ahuCount > 0 ? 'ready' : 'partial';
    },
  },
  {
    id: 'terminal-units',
    name: 'Terminal Units',
    icon: Gauge,
    description: 'VAV/FCU selections with airflow requirements',
    targetTools: ['diffuser-selection'],
    dataKey: 'terminalUnits',
    getMetrics: (data) => [
      { label: 'Units', value: data.terminalUnits.count },
      { label: 'Total CFM', value: data.terminalUnits.totalCfm.toLocaleString() },
    ],
    isAvailable: (data) => data.terminalUnits.available,
    getStatus: (data) => {
      if (!data.terminalUnits.available) return 'empty';
      return data.terminalUnits.count > 0 ? 'ready' : 'partial';
    },
  },
  {
    id: 'duct-systems',
    name: 'Duct Systems',
    icon: Wind,
    description: 'Duct network design for fan and insulation sizing',
    targetTools: ['fan-selection', 'insulation-calculator'],
    dataKey: 'ductSystems',
    getMetrics: (data) => [
      { label: 'Systems', value: data.ductSystems.systems.length },
      { label: 'Need Fans', value: data.ductSystems.systemsWithoutFan.length },
    ],
    isAvailable: (data) => data.ductSystems.available,
    getStatus: (data) => {
      if (!data.ductSystems.available) return 'empty';
      if (data.ductSystems.systems.length === 0) return 'partial';
      return data.ductSystems.systemsWithoutFan.length > 0 ? 'ready' : 'partial';
    },
  },
  {
    id: 'pipe-systems',
    name: 'Pipe Systems',
    icon: Droplet,
    description: 'Piping network design for pump and insulation sizing',
    targetTools: ['pump-selection', 'insulation-calculator'],
    dataKey: 'pipeSystems',
    getMetrics: (data) => [
      { label: 'Systems', value: data.pipeSystems.systems.length },
      { label: 'Need Pumps', value: data.pipeSystems.systemsWithoutPump.length },
    ],
    isAvailable: (data) => data.pipeSystems.available,
    getStatus: (data) => {
      if (!data.pipeSystems.available) return 'empty';
      if (data.pipeSystems.systems.length === 0) return 'partial';
      return data.pipeSystems.systemsWithoutPump.length > 0 ? 'ready' : 'partial';
    },
  },
  {
    id: 'chw-plants',
    name: 'CHW Plants',
    icon: Factory,
    description: 'Chilled water plant sizing data for chiller selection',
    targetTools: ['chiller-selection'],
    dataKey: 'chwPlants',
    getMetrics: (data) => [
      { label: 'Plants', value: data.chwPlants.plantCount },
      { label: 'Capacity', value: data.chwPlants.totalCapacityTons.toFixed(0), unit: 'tons' },
    ],
    isAvailable: (data) => data.chwPlants.available,
    getStatus: (data) => {
      if (!data.chwPlants.available) return 'empty';
      return data.chwPlants.plantCount > 0 ? 'ready' : 'partial';
    },
  },
];

// Map current tool to relevant import sources
export function getRelevantSources(currentTool: string): string[] {
  const toolSourceMap: Record<string, string[]> = {
    // Core workflow tools
    'ventilation': ['load-calculations'],
    'ventilation-calculator': ['load-calculations'],
    'equipment-selection': ['load-calculations'],
    'terminal-unit': ['load-calculations', 'equipment-selections'],
    'terminal-unit-sizing': ['load-calculations', 'equipment-selections'],
    'diffuser-selection': ['terminal-units'],
    'ahu-configuration': ['load-calculations', 'ventilation-calculations'],
    'duct-designer': ['ahu-configurations'],
    'fan-selection': ['duct-systems', 'ahu-configurations'],
    'pump-selection': ['pipe-systems'],
    'erv-sizing': ['ventilation-calculations'],
    'insulation-calculator': ['duct-systems', 'pipe-systems'],
    // Specialized equipment selection tools
    'coil-selection': ['ahu-configurations', 'load-calculations'],
    'filter-selection': ['ventilation-calculations', 'ahu-configurations'],
    'vav-box-selection': ['load-calculations', 'ventilation-calculations'],
    'fcu-selection': ['load-calculations'],
    'cooling-tower-sizing': ['equipment-selections'],
    'cooling-tower': ['equipment-selections'],
    'chw-plant': ['equipment-selections', 'load-calculations'],
    'chiller-selection': ['chw-plants', 'load-calculations', 'equipment-selections'],
    // Acoustic cost/analysis tools - Phase 6
    'acoustic-cost': ['equipment-selections', 'ahu-configurations'],
    'acoustic-roi': ['equipment-selections'],
    'lifecycle-cost': ['equipment-selections', 'ahu-configurations'],
    // All sources
    'all': IMPORT_SOURCES.map(s => s.id),
  };

  return toolSourceMap[currentTool] || [];
}
