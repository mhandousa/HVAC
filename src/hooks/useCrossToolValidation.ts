import { useMemo } from 'react';
import { useLoadCalculations } from './useLoadCalculations';
import { useEquipmentSelections } from './useEquipmentSelections';
import { useSavedVentilationCalcs } from './useSavedVentilationCalcs';
import { useTerminalUnitSelections } from './useTerminalUnitSelections';
import { useDuctSystems } from './useDuctSystems';
import { usePipeSystems } from './usePipeSystems';
import { useAHUConfigurations } from './useAHUConfigurations';
import { useFanSelections } from './useFanSelections';
import { usePumpSelections } from './usePumpSelections';
import { useSavedERVSizing } from './useSavedERVSizing';
import { useVRFSystems } from './useVRFSystems';
import { useDiffuserGrillesByProject } from './useDiffuserGrilles';
import { useInsulationCalculations } from './useInsulationCalculations';
import { useAcousticCalculations } from './useAcousticCalculations';
import { useCoilSelections } from './useCoilSelections';
import { useFilterSelections } from './useFilterSelections';
import { useCoolingTowerSelections } from './useCoolingTowerSelections';
import { useChillerSelections } from './useChillerSelections';
import { useChilledWaterPlants } from './useChilledWaterPlants';
import { useHotWaterPlants } from './useHotWaterPlants';
import { useBoilerSelections } from './useBoilerSelections';
import { usePsychrometricAnalyses } from './usePsychrometricAnalyses';
import { useExpansionTankSelections } from './useExpansionTankSelections';
import { useControlValveSelections } from './useControlValveSelections';
import { formatDistanceToNow } from 'date-fns';

// ============ Types ============

export type ToolType = 
  | 'load-calculation'
  | 'ventilation'
  | 'equipment-selection'
  | 'terminal-unit'
  | 'diffuser'
  | 'duct-system'
  | 'pipe-system'
  | 'fan-selection'
  | 'pump-selection'
  | 'ahu-configuration'
  | 'erv'
  | 'psychrometric'
  | 'vrf-system'
  | 'acoustic'
  | 'insulation'
  | 'sequence-of-operations'
  | 'coil-selection'
  | 'filter-selection'
  | 'vav-box-selection'
  | 'fcu-selection'
  | 'cooling-tower-sizing'
  | 'chiller-selection'
  | 'chw-plant'
  | 'boiler-selection'
  | 'hw-plant'
  // Extended specialty tools
  | 'economizer-sizing'
  | 'expansion-tank-sizing'
  | 'silencer-sizing'
  | 'control-valve-sizing'
  | 'vibration-isolation'
  | 'thermal-comfort'
  | 'smoke-control'
  // Acoustic specialty tools
  | 'duct-lining'
  | 'room-acoustics'
  | 'noise-path'
  | 'silencer-selection'
  // Documentation tools
  | 'bas-points'
  | 'equipment-schedule'
  // Distribution sizing tools
  | 'duct-sizing'
  | 'pipe-sizing'
  | 'pressure-drop'
  // Acoustic cost/analysis tools
  | 'acoustic-cost'
  | 'acoustic-roi'
  | 'lifecycle-cost'
  | 'treatment-wizard'
  | 'acoustic-measurement'
  // Terminal unit tools
  | 'terminal-unit-schedule'
  // Report tools
  | 'material-takeoff'
  | 'air-balance-report'
  | 'water-balance-report'
  | 'unified-design-report';

export interface CrossToolDependency {
  id: string;
  upstream: {
    toolName: string;
    toolType: ToolType;
    tableName: string;
    latestUpdatedAt: string | null;
    itemCount: number;
    path: string;
  };
  downstream: {
    toolName: string;
    toolType: ToolType;
    tableName: string;
    createdAt: string | null;
    itemCount: number;
  };
  status: 'synced' | 'stale' | 'needs_refresh';
  staleDurationMinutes: number;
  staleDurationText: string;
  severity: 'info' | 'warning' | 'critical';
  description: string;
}

export interface CrossToolValidationResult {
  dependencies: CrossToolDependency[];
  hasStaleData: boolean;
  criticalAlerts: CrossToolDependency[];
  warningAlerts: CrossToolDependency[];
  infoAlerts: CrossToolDependency[];
  upstreamChanges: {
    toolName: string;
    changedAt: string;
    description: string;
  }[];
}

// ============ Helpers ============

function getLatestTimestamp(items: { updated_at?: string; created_at?: string; updatedAt?: string; createdAt?: string }[]): string | null {
  if (!items || items.length === 0) return null;
  
  const timestamps = items
    .map(item => item.updated_at || item.updatedAt || item.created_at || item.createdAt)
    .filter((ts): ts is string => !!ts)
    .map(ts => new Date(ts).getTime());
  
  if (timestamps.length === 0) return null;
  
  const latest = Math.max(...timestamps);
  return new Date(latest).toISOString();
}

function getEarliestTimestamp(items: { updated_at?: string; created_at?: string; updatedAt?: string; createdAt?: string }[]): string | null {
  if (!items || items.length === 0) return null;
  
  const timestamps = items
    .map(item => item.created_at || item.createdAt)
    .filter((ts): ts is string => !!ts)
    .map(ts => new Date(ts).getTime());
  
  if (timestamps.length === 0) return null;
  
  const earliest = Math.min(...timestamps);
  return new Date(earliest).toISOString();
}

function calculateStaleness(upstreamTime: string | null, downstreamTime: string | null): {
  isStale: boolean;
  minutesStale: number;
  severity: 'info' | 'warning' | 'critical';
} {
  if (!upstreamTime || !downstreamTime) {
    return { isStale: false, minutesStale: 0, severity: 'info' };
  }

  const upstream = new Date(upstreamTime).getTime();
  const downstream = new Date(downstreamTime).getTime();
  
  // If upstream was updated after downstream was created, it's stale
  if (upstream > downstream) {
    const minutesStale = Math.round((upstream - downstream) / 60000);
    let severity: 'info' | 'warning' | 'critical' = 'info';
    
    if (minutesStale > 60) {
      severity = 'critical';
    } else if (minutesStale > 15) {
      severity = 'warning';
    }
    
    return { isStale: true, minutesStale, severity };
  }

  return { isStale: false, minutesStale: 0, severity: 'info' };
}

// ============ Hook ============

export function useCrossToolValidation(
  projectId: string | null,
  currentTool: ToolType
): CrossToolValidationResult & { isLoading: boolean } {
  // Fetch all relevant data
  const { data: loadCalcs, isLoading: loadingLoads } = useLoadCalculations(projectId ?? undefined);
  const { data: equipmentSelections, isLoading: loadingEquipment } = useEquipmentSelections(projectId ?? undefined);
  const { calculations: ventilationCalcs, isLoading: loadingVentilation } = useSavedVentilationCalcs(projectId ?? undefined);
  const { data: terminalUnits, isLoading: loadingTerminals } = useTerminalUnitSelections(projectId ?? undefined);
  const { data: ductSystems, isLoading: loadingDucts } = useDuctSystems(projectId ?? undefined);
  const { data: pipeSystems, isLoading: loadingPipes } = usePipeSystems(projectId ?? undefined);
  const { data: ahuConfigs, isLoading: loadingAHU } = useAHUConfigurations(projectId ?? undefined);
  const { data: fanSelections, isLoading: loadingFans } = useFanSelections(projectId ?? undefined);
  const { data: pumpSelections, isLoading: loadingPumps } = usePumpSelections(projectId ?? undefined);
  const { calculations: ervCalculations, isLoading: loadingERV } = useSavedERVSizing(projectId ?? undefined);
  const { data: vrfSystems, isLoading: loadingVRF } = useVRFSystems(projectId ?? undefined);
  const { data: diffuserGrilles, isLoading: loadingDiffusers } = useDiffuserGrillesByProject(projectId ?? undefined);
  const { data: insulationCalcs, isLoading: loadingInsulation } = useInsulationCalculations(projectId ?? undefined);
  const { data: acousticCalcs, isLoading: loadingAcoustic } = useAcousticCalculations(projectId ?? undefined);
  const { data: coilSelections, isLoading: loadingCoils } = useCoilSelections(projectId ?? undefined);
  const { data: filterSelections, isLoading: loadingFilters } = useFilterSelections(projectId ?? undefined);
  const { data: coolingTowerSelections, isLoading: loadingCoolingTowers } = useCoolingTowerSelections(projectId ?? undefined);
  const { data: chillerSelections, isLoading: loadingChillers } = useChillerSelections(projectId ?? undefined);
  const { data: chwPlants, isLoading: loadingCHWPlants } = useChilledWaterPlants(projectId ?? undefined);
  const { data: hwPlants, isLoading: loadingHWPlants } = useHotWaterPlants(projectId ?? undefined);
  const { data: boilerSelections, isLoading: loadingBoilers } = useBoilerSelections(projectId ?? undefined);
  const { data: psychrometricAnalyses, isLoading: loadingPsychrometric } = usePsychrometricAnalyses(projectId ?? undefined);
  const { data: expansionTankSelections, isLoading: loadingExpansionTanks } = useExpansionTankSelections(projectId ?? undefined);
  const { data: controlValveSelections, isLoading: loadingControlValves } = useControlValveSelections(projectId ?? undefined);

  const isLoading = loadingLoads || loadingEquipment || loadingVentilation || 
                    loadingTerminals || loadingDucts || loadingPipes || loadingAHU ||
                    loadingFans || loadingPumps || loadingERV || loadingVRF || loadingDiffusers ||
                    loadingInsulation || loadingAcoustic || loadingCoils || loadingFilters || 
                    loadingCoolingTowers || loadingChillers || loadingCHWPlants || loadingHWPlants || 
                    loadingBoilers || loadingPsychrometric || loadingExpansionTanks || loadingControlValves;

  const result = useMemo((): CrossToolValidationResult => {
    const dependencies: CrossToolDependency[] = [];
    
    if (!projectId) {
      return {
        dependencies: [],
        hasStaleData: false,
        criticalAlerts: [],
        warningAlerts: [],
        infoAlerts: [],
        upstreamChanges: [],
      };
    }

    // Get timestamps - only declare variables that are actually used in dependency rules
    const loadLatest = getLatestTimestamp(loadCalcs || []);
    const equipLatest = getLatestTimestamp(equipmentSelections || []);
    const equipEarliest = getEarliestTimestamp(equipmentSelections || []);
    const ventLatest = getLatestTimestamp(ventilationCalcs || []);
    const ventEarliest = getEarliestTimestamp(ventilationCalcs || []);
    const terminalLatest = getLatestTimestamp(terminalUnits || []);
    const terminalEarliest = getEarliestTimestamp(terminalUnits || []);
    const ductLatest = getLatestTimestamp(ductSystems || []);
    const ductEarliest = getEarliestTimestamp(ductSystems || []);
    const pipeLatest = getLatestTimestamp(pipeSystems || []);
    const ahuLatest = getLatestTimestamp(ahuConfigs || []);
    const ahuEarliest = getEarliestTimestamp(ahuConfigs || []);
    const fanEarliest = getEarliestTimestamp(fanSelections || []);
    const pumpEarliest = getEarliestTimestamp(pumpSelections || []);
    const ervEarliest = getEarliestTimestamp(ervCalculations || []);
    const vrfEarliest = getEarliestTimestamp(vrfSystems || []);
    const diffuserLatest = getLatestTimestamp(diffuserGrilles || []);
    const diffuserEarliest = getEarliestTimestamp(diffuserGrilles || []);
    const insulationEarliest = getEarliestTimestamp(insulationCalcs || []);
    const acousticEarliest = getEarliestTimestamp(acousticCalcs || []);
    const coilLatest = getLatestTimestamp(coilSelections || []);
    const coilEarliest = getEarliestTimestamp(coilSelections || []);
    const filterLatest = getLatestTimestamp(filterSelections || []);
    const filterEarliest = getEarliestTimestamp(filterSelections || []);
    const coolingTowerLatest = getLatestTimestamp(coolingTowerSelections || []);
    const coolingTowerEarliest = getEarliestTimestamp(coolingTowerSelections || []);
    const chillerLatest = getLatestTimestamp(chillerSelections || []);
    const chillerEarliest = getEarliestTimestamp(chillerSelections || []);
    const chwPlantLatest = getLatestTimestamp(chwPlants || []);
    const chwPlantEarliest = getEarliestTimestamp(chwPlants || []);
    const hwPlantLatest = getLatestTimestamp(hwPlants || []);
    const hwPlantEarliest = getEarliestTimestamp(hwPlants || []);
    const boilerLatest = getLatestTimestamp(boilerSelections || []);
    const boilerEarliest = getEarliestTimestamp(boilerSelections || []);
    const psychrometricLatest = getLatestTimestamp(psychrometricAnalyses || []);
    const expansionTankEarliest = getEarliestTimestamp(expansionTankSelections || []);
    const controlValveEarliest = getEarliestTimestamp(controlValveSelections || []);

    // ============ Define Dependencies ============

    // ============ WF-01: Psychrometric → Coil Selection (new) ============
    if (currentTool === 'coil-selection' && psychrometricLatest && coilEarliest) {
      const staleness = calculateStaleness(psychrometricLatest, coilEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'psychrometric-to-coil',
          upstream: {
            toolName: 'Psychrometric Analysis',
            toolType: 'psychrometric',
            tableName: 'psychrometric_analyses',
            latestUpdatedAt: psychrometricLatest,
            itemCount: psychrometricAnalyses?.length || 0,
            path: `/design/psychrometric?project=${projectId}`,
          },
          downstream: {
            toolName: 'Coil Selection',
            toolType: 'coil-selection',
            tableName: 'coil_selections',
            createdAt: coilEarliest,
            itemCount: coilSelections?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(psychrometricLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Psychrometric analysis was updated. Coil entering/leaving conditions may have changed.',
        });
      }
    }

    // ============ WF-02: Chiller → CHW Pump sizing dependency (new) ============
    if (currentTool === 'pump-selection' && chillerLatest && pumpEarliest) {
      const staleness = calculateStaleness(chillerLatest, pumpEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'chiller-to-pump',
          upstream: {
            toolName: 'Chiller Selection',
            toolType: 'chiller-selection',
            tableName: 'chiller_selections',
            latestUpdatedAt: chillerLatest,
            itemCount: chillerSelections?.length || 0,
            path: `/design/chiller-selection?project=${projectId}`,
          },
          downstream: {
            toolName: 'Pump Selection',
            toolType: 'pump-selection',
            tableName: 'pump_selections',
            createdAt: pumpEarliest,
            itemCount: pumpSelections?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(chillerLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Chiller selections were updated. CHW pump sizing may need adjustment for new evaporator flow requirements.',
        });
      }
    }

    // Load Calculation → Equipment Selection
    if (currentTool === 'equipment-selection' && loadLatest && equipEarliest) {
      const staleness = calculateStaleness(loadLatest, equipEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'load-to-equipment',
          upstream: {
            toolName: 'Load Calculations',
            toolType: 'load-calculation',
            tableName: 'load_calculations',
            latestUpdatedAt: loadLatest,
            itemCount: loadCalcs?.length || 0,
            path: `/design/load-calculator?project=${projectId}`,
          },
          downstream: {
            toolName: 'Equipment Selection',
            toolType: 'equipment-selection',
            tableName: 'equipment_selections',
            createdAt: equipEarliest,
            itemCount: equipmentSelections?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(loadLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Load calculations were updated after equipment was selected. Your equipment sizing may need to be re-evaluated.',
        });
      }
    }

    // Load Calculation → Ventilation
    if (currentTool === 'ventilation' && loadLatest && ventEarliest) {
      const staleness = calculateStaleness(loadLatest, ventEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'load-to-ventilation',
          upstream: {
            toolName: 'Load Calculations',
            toolType: 'load-calculation',
            tableName: 'load_calculations',
            latestUpdatedAt: loadLatest,
            itemCount: loadCalcs?.length || 0,
            path: `/design/load-calculator?project=${projectId}`,
          },
          downstream: {
            toolName: 'Ventilation Calculator',
            toolType: 'ventilation',
            tableName: 'ventilation_calculations',
            createdAt: ventEarliest,
            itemCount: ventilationCalcs?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(loadLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Load calculations were updated. Supply air CFM may have changed.',
        });
      }
    }

    // Load Calculation → AHU Configuration
    if (currentTool === 'ahu-configuration' && loadLatest && ahuEarliest) {
      const staleness = calculateStaleness(loadLatest, ahuEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'load-to-ahu',
          upstream: {
            toolName: 'Load Calculations',
            toolType: 'load-calculation',
            tableName: 'load_calculations',
            latestUpdatedAt: loadLatest,
            itemCount: loadCalcs?.length || 0,
            path: `/design/load-calculator?project=${projectId}`,
          },
          downstream: {
            toolName: 'AHU Configuration',
            toolType: 'ahu-configuration',
            tableName: 'ahu_configurations',
            createdAt: ahuEarliest,
            itemCount: ahuConfigs?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(loadLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Load calculations were updated. AHU capacity and CFM may need adjustment.',
        });
      }
    }

    // Equipment Selection → Terminal Units
    if (currentTool === 'terminal-unit' && equipLatest && terminalEarliest) {
      const staleness = calculateStaleness(equipLatest, terminalEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'equipment-to-terminal',
          upstream: {
            toolName: 'Equipment Selection',
            toolType: 'equipment-selection',
            tableName: 'equipment_selections',
            latestUpdatedAt: equipLatest,
            itemCount: equipmentSelections?.length || 0,
            path: `/design/equipment-selection?project=${projectId}`,
          },
          downstream: {
            toolName: 'Terminal Unit Sizing',
            toolType: 'terminal-unit',
            tableName: 'terminal_unit_selections',
            createdAt: terminalEarliest,
            itemCount: terminalUnits?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(equipLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Equipment was updated. Terminal unit sizing may need re-evaluation.',
        });
      }
    }

    // Terminal Units → Diffuser Selection
    if (currentTool === 'diffuser' && terminalLatest && diffuserEarliest) {
      const staleness = calculateStaleness(terminalLatest, diffuserEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'terminal-to-diffuser',
          upstream: {
            toolName: 'Terminal Unit Sizing',
            toolType: 'terminal-unit',
            tableName: 'terminal_unit_selections',
            latestUpdatedAt: terminalLatest,
            itemCount: terminalUnits?.length || 0,
            path: `/design/terminal-unit-sizing?project=${projectId}`,
          },
          downstream: {
            toolName: 'Diffuser Selection',
            toolType: 'diffuser',
            tableName: 'diffuser_grilles',
            createdAt: diffuserEarliest,
            itemCount: diffuserGrilles?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(terminalLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Terminal unit CFM was updated. Diffuser selections may need resizing.',
        });
      }
    }

    // Ventilation → ERV Sizing
    if (currentTool === 'erv' && ventLatest && ervEarliest) {
      const staleness = calculateStaleness(ventLatest, ervEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'ventilation-to-erv',
          upstream: {
            toolName: 'Ventilation Calculator',
            toolType: 'ventilation',
            tableName: 'ventilation_calculations',
            latestUpdatedAt: ventLatest,
            itemCount: ventilationCalcs?.length || 0,
            path: `/design/ventilation-calculator?project=${projectId}`,
          },
          downstream: {
            toolName: 'ERV Sizing',
            toolType: 'erv',
            tableName: 'erv_sizing_calculations',
            createdAt: ervEarliest,
            itemCount: ervCalculations?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(ventLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Outdoor air CFM was updated in ventilation. ERV sizing may need recalculation.',
        });
      }
    }

    // Load Calculation → VRF Systems
    if (currentTool === 'vrf-system' && loadLatest && vrfEarliest) {
      const staleness = calculateStaleness(loadLatest, vrfEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'load-to-vrf',
          upstream: {
            toolName: 'Load Calculations',
            toolType: 'load-calculation',
            tableName: 'load_calculations',
            latestUpdatedAt: loadLatest,
            itemCount: loadCalcs?.length || 0,
            path: `/design/load-calculator?project=${projectId}`,
          },
          downstream: {
            toolName: 'VRF Designer',
            toolType: 'vrf-system',
            tableName: 'vrf_systems',
            createdAt: vrfEarliest,
            itemCount: vrfSystems?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(loadLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Zone loads were updated. VRF system capacity and indoor unit sizing may need adjustment.',
        });
      }
    }

    // AHU Configuration → Duct System
    if (currentTool === 'duct-system' && ahuLatest && ductEarliest) {
      const staleness = calculateStaleness(ahuLatest, ductEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'ahu-to-duct',
          upstream: {
            toolName: 'AHU Configuration',
            toolType: 'ahu-configuration',
            tableName: 'ahu_configurations',
            latestUpdatedAt: ahuLatest,
            itemCount: ahuConfigs?.length || 0,
            path: `/design/ahu-configuration?project=${projectId}`,
          },
          downstream: {
            toolName: 'Duct Designer',
            toolType: 'duct-system',
            tableName: 'duct_systems',
            createdAt: ductEarliest,
            itemCount: ductSystems?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(ahuLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'AHU configuration was updated. Duct sizing may need adjustment.',
        });
      }
    }

    // Duct System → Fan Selection
    if (currentTool === 'fan-selection' && ductLatest && fanEarliest) {
      const staleness = calculateStaleness(ductLatest, fanEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'duct-to-fan',
          upstream: {
            toolName: 'Duct Designer',
            toolType: 'duct-system',
            tableName: 'duct_systems',
            latestUpdatedAt: ductLatest,
            itemCount: ductSystems?.length || 0,
            path: `/design/duct-designer?project=${projectId}`,
          },
          downstream: {
            toolName: 'Fan Selection',
            toolType: 'fan-selection',
            tableName: 'fan_selections',
            createdAt: fanEarliest,
            itemCount: fanSelections?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(ductLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Duct systems were updated. Fan selections may need re-evaluation for new static pressure requirements.',
        });
      }
    }

    // Pipe System → Pump Selection
    if (currentTool === 'pump-selection' && pipeLatest && pumpEarliest) {
      const staleness = calculateStaleness(pipeLatest, pumpEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'pipe-to-pump',
          upstream: {
            toolName: 'Pipe Designer',
            toolType: 'pipe-system',
            tableName: 'pipe_systems',
            latestUpdatedAt: pipeLatest,
            itemCount: pipeSystems?.length || 0,
            path: `/design/pipe-designer?project=${projectId}`,
          },
          downstream: {
            toolName: 'Pump Selection',
            toolType: 'pump-selection',
            tableName: 'pump_selections',
            createdAt: pumpEarliest,
            itemCount: pumpSelections?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(pipeLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Pipe systems were updated. Pump selections may need re-evaluation for new head requirements.',
        });
      }
    }

    // Load Calculation → Terminal Units
    if (currentTool === 'terminal-unit' && loadLatest && terminalEarliest) {
      const staleness = calculateStaleness(loadLatest, terminalEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'load-to-terminal',
          upstream: {
            toolName: 'Load Calculations',
            toolType: 'load-calculation',
            tableName: 'load_calculations',
            latestUpdatedAt: loadLatest,
            itemCount: loadCalcs?.length || 0,
            path: `/design/load-calculator?project=${projectId}`,
          },
          downstream: {
            toolName: 'Terminal Unit Sizing',
            toolType: 'terminal-unit',
            tableName: 'terminal_unit_selections',
            createdAt: terminalEarliest,
            itemCount: terminalUnits?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(loadLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Load calculations were updated. Terminal unit CFM and capacity may need re-evaluation.',
        });
      }
    }

    // Duct Systems → Insulation Calculator
    if (currentTool === 'insulation' && ductLatest && insulationEarliest) {
      const staleness = calculateStaleness(ductLatest, insulationEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'duct-to-insulation',
          upstream: {
            toolName: 'Duct Designer',
            toolType: 'duct-system',
            tableName: 'duct_systems',
            latestUpdatedAt: ductLatest,
            itemCount: ductSystems?.length || 0,
            path: `/design/duct-designer?project=${projectId}`,
          },
          downstream: {
            toolName: 'Insulation Calculator',
            toolType: 'insulation',
            tableName: 'insulation_calculations',
            createdAt: insulationEarliest,
            itemCount: insulationCalcs?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(ductLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Duct systems were updated. Insulation calculations may need to reflect new duct sizes.',
        });
      }
    }

    // Pipe Systems → Insulation Calculator
    if (currentTool === 'insulation' && pipeLatest && insulationEarliest) {
      const staleness = calculateStaleness(pipeLatest, insulationEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'pipe-to-insulation',
          upstream: {
            toolName: 'Pipe Designer',
            toolType: 'pipe-system',
            tableName: 'pipe_systems',
            latestUpdatedAt: pipeLatest,
            itemCount: pipeSystems?.length || 0,
            path: `/design/pipe-designer?project=${projectId}`,
          },
          downstream: {
            toolName: 'Insulation Calculator',
            toolType: 'insulation',
            tableName: 'insulation_calculations',
            createdAt: insulationEarliest,
            itemCount: insulationCalcs?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(pipeLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Pipe systems were updated. Insulation calculations may need to reflect new pipe sizes.',
        });
      }
    }

    // Equipment Selections → Acoustic Calculator
    if (currentTool === 'acoustic' && equipLatest && acousticEarliest) {
      const staleness = calculateStaleness(equipLatest, acousticEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'equipment-to-acoustic',
          upstream: {
            toolName: 'Equipment Selection',
            toolType: 'equipment-selection',
            tableName: 'equipment_selections',
            latestUpdatedAt: equipLatest,
            itemCount: equipmentSelections?.length || 0,
            path: `/design/equipment-selection?project=${projectId}`,
          },
          downstream: {
            toolName: 'Acoustic Calculator',
            toolType: 'acoustic',
            tableName: 'acoustic_calculations',
            createdAt: acousticEarliest,
            itemCount: acousticCalcs?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(equipLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Equipment was updated. Acoustic analysis may need to include new equipment noise sources.',
        });
      }
    }

    // Diffuser Selections → Acoustic Calculator
    if (currentTool === 'acoustic' && diffuserLatest && acousticEarliest) {
      const staleness = calculateStaleness(diffuserLatest, acousticEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'diffuser-to-acoustic',
          upstream: {
            toolName: 'Diffuser Selection',
            toolType: 'diffuser',
            tableName: 'diffuser_grilles',
            latestUpdatedAt: diffuserLatest,
            itemCount: diffuserGrilles?.length || 0,
            path: `/design/diffuser-selection?project=${projectId}`,
          },
          downstream: {
            toolName: 'Acoustic Calculator',
            toolType: 'acoustic',
            tableName: 'acoustic_calculations',
            createdAt: acousticEarliest,
            itemCount: acousticCalcs?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(diffuserLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Diffuser selections were updated. Acoustic analysis may need to include new diffuser NC ratings.',
        });
      }
    }

    // ============ New Phase 2 Tool Dependencies ============

    // AHU Configuration → Coil Selection
    if (currentTool === 'coil-selection' && ahuLatest && coilEarliest) {
      const staleness = calculateStaleness(ahuLatest, coilEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'ahu-to-coil',
          upstream: {
            toolName: 'AHU Configuration',
            toolType: 'ahu-configuration',
            tableName: 'ahu_configurations',
            latestUpdatedAt: ahuLatest,
            itemCount: ahuConfigs?.length || 0,
            path: `/design/ahu-configuration?project=${projectId}`,
          },
          downstream: {
            toolName: 'Coil Selection',
            toolType: 'coil-selection',
            tableName: 'coil_selections',
            createdAt: coilEarliest,
            itemCount: coilSelections?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(ahuLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'AHU configuration was updated. Coil sizing may need re-evaluation for new airflow or temperature requirements.',
        });
      }
    }

    // Load Calculation → Coil Selection (additional dependency)
    if (currentTool === 'coil-selection' && loadLatest && coilEarliest) {
      const staleness = calculateStaleness(loadLatest, coilEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'load-to-coil',
          upstream: {
            toolName: 'Load Calculations',
            toolType: 'load-calculation',
            tableName: 'load_calculations',
            latestUpdatedAt: loadLatest,
            itemCount: loadCalcs?.length || 0,
            path: `/design/load-calculator?project=${projectId}`,
          },
          downstream: {
            toolName: 'Coil Selection',
            toolType: 'coil-selection',
            tableName: 'coil_selections',
            createdAt: coilEarliest,
            itemCount: coilSelections?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(loadLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Zone loads were updated. Coil capacity requirements may have changed.',
        });
      }
    }

    // Ventilation → Filter Selection
    if (currentTool === 'filter-selection' && ventLatest && filterEarliest) {
      const staleness = calculateStaleness(ventLatest, filterEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'ventilation-to-filter',
          upstream: {
            toolName: 'Ventilation Calculator',
            toolType: 'ventilation',
            tableName: 'ventilation_calculations',
            latestUpdatedAt: ventLatest,
            itemCount: ventilationCalcs?.length || 0,
            path: `/design/ventilation-calculator?project=${projectId}`,
          },
          downstream: {
            toolName: 'Filter Selection',
            toolType: 'filter-selection',
            tableName: 'filter_selections',
            createdAt: filterEarliest,
            itemCount: filterSelections?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(ventLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Ventilation airflow was updated. Filter sizing may need adjustment for new CFM requirements.',
        });
      }
    }

    // AHU Configuration → Filter Selection (additional dependency)
    if (currentTool === 'filter-selection' && ahuLatest && filterEarliest) {
      const staleness = calculateStaleness(ahuLatest, filterEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'ahu-to-filter',
          upstream: {
            toolName: 'AHU Configuration',
            toolType: 'ahu-configuration',
            tableName: 'ahu_configurations',
            latestUpdatedAt: ahuLatest,
            itemCount: ahuConfigs?.length || 0,
            path: `/design/ahu-configuration?project=${projectId}`,
          },
          downstream: {
            toolName: 'Filter Selection',
            toolType: 'filter-selection',
            tableName: 'filter_selections',
            createdAt: filterEarliest,
            itemCount: filterSelections?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(ahuLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'AHU configuration was updated. Filter sizing may need adjustment for new airflow requirements.',
        });
      }
    }

    // Load Calculation → VAV Box Selection
    if (currentTool === 'vav-box-selection' && loadLatest && terminalEarliest) {
      const staleness = calculateStaleness(loadLatest, terminalEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'load-to-vav',
          upstream: {
            toolName: 'Load Calculations',
            toolType: 'load-calculation',
            tableName: 'load_calculations',
            latestUpdatedAt: loadLatest,
            itemCount: loadCalcs?.length || 0,
            path: `/design/load-calculator?project=${projectId}`,
          },
          downstream: {
            toolName: 'VAV Box Selection',
            toolType: 'vav-box-selection',
            tableName: 'terminal_unit_selections',
            createdAt: terminalEarliest,
            itemCount: terminalUnits?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(loadLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Load calculations were updated. VAV box CFM and reheat capacity may need adjustment.',
        });
      }
    }

    // Ventilation → VAV Box Selection (additional dependency)
    if (currentTool === 'vav-box-selection' && ventLatest && terminalEarliest) {
      const staleness = calculateStaleness(ventLatest, terminalEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'ventilation-to-vav',
          upstream: {
            toolName: 'Ventilation Calculator',
            toolType: 'ventilation',
            tableName: 'ventilation_calculations',
            latestUpdatedAt: ventLatest,
            itemCount: ventilationCalcs?.length || 0,
            path: `/design/ventilation-calculator?project=${projectId}`,
          },
          downstream: {
            toolName: 'VAV Box Selection',
            toolType: 'vav-box-selection',
            tableName: 'terminal_unit_selections',
            createdAt: terminalEarliest,
            itemCount: terminalUnits?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(ventLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Outdoor air requirements were updated. VAV minimum CFM settings may need adjustment.',
        });
      }
    }

    // Load Calculation → FCU Selection
    if (currentTool === 'fcu-selection' && loadLatest && terminalEarliest) {
      const staleness = calculateStaleness(loadLatest, terminalEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'load-to-fcu',
          upstream: {
            toolName: 'Load Calculations',
            toolType: 'load-calculation',
            tableName: 'load_calculations',
            latestUpdatedAt: loadLatest,
            itemCount: loadCalcs?.length || 0,
            path: `/design/load-calculator?project=${projectId}`,
          },
          downstream: {
            toolName: 'FCU Selection',
            toolType: 'fcu-selection',
            tableName: 'terminal_unit_selections',
            createdAt: terminalEarliest,
            itemCount: terminalUnits?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(loadLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Load calculations were updated. FCU cooling/heating capacity may need recalculation.',
        });
      }
    }

    // Ventilation → FCU Selection (additional dependency)
    if (currentTool === 'fcu-selection' && ventLatest && terminalEarliest) {
      const staleness = calculateStaleness(ventLatest, terminalEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'ventilation-to-fcu',
          upstream: {
            toolName: 'Ventilation Calculator',
            toolType: 'ventilation',
            tableName: 'ventilation_calculations',
            latestUpdatedAt: ventLatest,
            itemCount: ventilationCalcs?.length || 0,
            path: `/design/ventilation-calculator?project=${projectId}`,
          },
          downstream: {
            toolName: 'FCU Selection',
            toolType: 'fcu-selection',
            tableName: 'terminal_unit_selections',
            createdAt: terminalEarliest,
            itemCount: terminalUnits?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(ventLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Ventilation requirements were updated. FCU fresh air provisions may need review.',
        });
      }
    }

    // Equipment Selection → Cooling Tower Sizing
    if (currentTool === 'cooling-tower-sizing' && equipLatest && coolingTowerEarliest) {
      const staleness = calculateStaleness(equipLatest, coolingTowerEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'equipment-to-cooling-tower',
          upstream: {
            toolName: 'Equipment Selection',
            toolType: 'equipment-selection',
            tableName: 'equipment_selections',
            latestUpdatedAt: equipLatest,
            itemCount: equipmentSelections?.length || 0,
            path: `/design/equipment-selection?project=${projectId}`,
          },
          downstream: {
            toolName: 'Cooling Tower Sizing',
            toolType: 'cooling-tower-sizing',
            tableName: 'cooling_tower_selections',
            createdAt: coolingTowerEarliest,
            itemCount: coolingTowerSelections?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(equipLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Equipment/chiller selections were updated. Cooling tower heat rejection capacity may need recalculation.',
        });
      }
    }

    // CHW Plant → Chiller Selection
    if (currentTool === 'chiller-selection' && chwPlantLatest && chillerEarliest) {
      const staleness = calculateStaleness(chwPlantLatest, chillerEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'chwplant-to-chiller',
          upstream: {
            toolName: 'CHW Plant Sizing',
            toolType: 'chw-plant',
            tableName: 'chilled_water_plants',
            latestUpdatedAt: chwPlantLatest,
            itemCount: chwPlants?.length || 0,
            path: `/design/chilled-water-plant?project=${projectId}`,
          },
          downstream: {
            toolName: 'Chiller Selection',
            toolType: 'chiller-selection',
            tableName: 'chiller_selections',
            createdAt: chillerEarliest,
            itemCount: chillerSelections?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(chwPlantLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'CHW Plant sizing was updated. Chiller capacity requirements may have changed.',
        });
      }
    }

    // Load Calculation → Chiller Selection (indirect via capacity)
    if (currentTool === 'chiller-selection' && loadLatest && chillerEarliest) {
      const staleness = calculateStaleness(loadLatest, chillerEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'load-to-chiller',
          upstream: {
            toolName: 'Load Calculations',
            toolType: 'load-calculation',
            tableName: 'load_calculations',
            latestUpdatedAt: loadLatest,
            itemCount: loadCalcs?.length || 0,
            path: `/design/load-calculator?project=${projectId}`,
          },
          downstream: {
            toolName: 'Chiller Selection',
            toolType: 'chiller-selection',
            tableName: 'chiller_selections',
            createdAt: chillerEarliest,
            itemCount: chillerSelections?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(loadLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Load calculations were updated. Chiller sizing may need re-evaluation.',
        });
      }
    }

    // ============ HW System Dependencies ============

    // HW Plant → Boiler Selection
    if (currentTool === 'boiler-selection' && hwPlantLatest && boilerEarliest) {
      const staleness = calculateStaleness(hwPlantLatest, boilerEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'hwplant-to-boiler',
          upstream: {
            toolName: 'HW Plant Sizing',
            toolType: 'hw-plant',
            tableName: 'hot_water_plants',
            latestUpdatedAt: hwPlantLatest,
            itemCount: hwPlants?.length || 0,
            path: `/design/hot-water-plant?project=${projectId}`,
          },
          downstream: {
            toolName: 'Boiler Selection',
            toolType: 'boiler-selection',
            tableName: 'boiler_selections',
            createdAt: boilerEarliest,
            itemCount: boilerSelections?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(hwPlantLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'HW Plant sizing was updated. Boiler capacity requirements may have changed.',
        });
      }
    }

    // Load Calculation → Boiler Selection (via heating loads)
    if (currentTool === 'boiler-selection' && loadLatest && boilerEarliest) {
      const staleness = calculateStaleness(loadLatest, boilerEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'load-to-boiler',
          upstream: {
            toolName: 'Load Calculations',
            toolType: 'load-calculation',
            tableName: 'load_calculations',
            latestUpdatedAt: loadLatest,
            itemCount: loadCalcs?.length || 0,
            path: `/design/load-calculator?project=${projectId}`,
          },
          downstream: {
            toolName: 'Boiler Selection',
            toolType: 'boiler-selection',
            tableName: 'boiler_selections',
            createdAt: boilerEarliest,
            itemCount: boilerSelections?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(loadLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Heating load calculations were updated. Boiler sizing may need re-evaluation.',
        });
      }
    }

    // Boiler Selection → Pump Selection (HW Pumps)
    if (currentTool === 'pump-selection' && boilerLatest && pumpEarliest) {
      const staleness = calculateStaleness(boilerLatest, pumpEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'boiler-to-pump',
          upstream: {
            toolName: 'Boiler Selection',
            toolType: 'boiler-selection',
            tableName: 'boiler_selections',
            latestUpdatedAt: boilerLatest,
            itemCount: boilerSelections?.length || 0,
            path: `/design/boiler-selection?project=${projectId}`,
          },
          downstream: {
            toolName: 'Pump Selection',
            toolType: 'pump-selection',
            tableName: 'pump_selections',
            createdAt: pumpEarliest,
            itemCount: pumpSelections?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(boilerLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Boiler selections were updated. HW pump sizing may need adjustment for new flow requirements.',
        });
      }
    }

    // Load Calculation → HW Plant Sizing
    if (currentTool === 'hw-plant' && loadLatest && hwPlantEarliest) {
      const staleness = calculateStaleness(loadLatest, hwPlantEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'load-to-hwplant',
          upstream: {
            toolName: 'Load Calculations',
            toolType: 'load-calculation',
            tableName: 'load_calculations',
            latestUpdatedAt: loadLatest,
            itemCount: loadCalcs?.length || 0,
            path: `/design/load-calculator?project=${projectId}`,
          },
          downstream: {
            toolName: 'HW Plant Sizing',
            toolType: 'hw-plant',
            tableName: 'hot_water_plants',
            createdAt: hwPlantEarliest,
            itemCount: hwPlants?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(loadLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Heating load calculations were updated. HW plant capacity may need re-evaluation.',
        });
      }
    }

    // Chiller Selection → Cooling Tower (Heat Rejection Balance)
    if (currentTool === 'cooling-tower-sizing' && chillerLatest && coolingTowerEarliest) {
      const staleness = calculateStaleness(chillerLatest, coolingTowerEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'chiller-to-tower',
          upstream: {
            toolName: 'Chiller Selection',
            toolType: 'chiller-selection',
            tableName: 'chiller_selections',
            latestUpdatedAt: chillerLatest,
            itemCount: chillerSelections?.length || 0,
            path: `/design/chiller-selection?project=${projectId}`,
          },
          downstream: {
            toolName: 'Cooling Tower Sizing',
            toolType: 'cooling-tower-sizing',
            tableName: 'cooling_tower_selections',
            createdAt: coolingTowerEarliest,
            itemCount: coolingTowerSelections?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(chillerLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Chiller selections were updated. Cooling tower heat rejection capacity may need recalculation.',
        });
      }
    }

    // ============ Phase 5: Specialty Tool Dependencies ============

    // AHU Configuration → Economizer Sizing
    if (currentTool === 'economizer-sizing' && ahuLatest) {
      dependencies.push({
        id: 'ahu-to-economizer',
        upstream: {
          toolName: 'AHU Configuration',
          toolType: 'ahu-configuration',
          tableName: 'ahu_configurations',
          latestUpdatedAt: ahuLatest,
          itemCount: ahuConfigs?.length || 0,
          path: `/design/ahu-configuration?project=${projectId}`,
        },
        downstream: {
          toolName: 'Economizer Sizing',
          toolType: 'economizer-sizing',
          tableName: 'project_design_data',
          createdAt: null,
          itemCount: 0,
        },
        status: 'synced',
        staleDurationMinutes: 0,
        staleDurationText: '',
        severity: 'info',
        description: 'Import design CFM and outdoor air requirements from AHU configuration.',
      });
    }

    // Pipe System → Control Valve Sizing
    if (currentTool === 'control-valve-sizing' && pipeLatest) {
      dependencies.push({
        id: 'pipe-to-controlvalve',
        upstream: {
          toolName: 'Pipe Designer',
          toolType: 'pipe-system',
          tableName: 'pipe_systems',
          latestUpdatedAt: pipeLatest,
          itemCount: pipeSystems?.length || 0,
          path: `/design/pipe-designer?project=${projectId}`,
        },
        downstream: {
          toolName: 'Control Valve Sizing',
          toolType: 'control-valve-sizing',
          tableName: 'project_design_data',
          createdAt: null,
          itemCount: 0,
        },
        status: 'synced',
        staleDurationMinutes: 0,
        staleDurationText: '',
        severity: 'info',
        description: 'Import flow rates and pressure drops from pipe system design.',
      });
    }

    // ============ CV-03: Pipe System → Expansion Tank (System Volume Check) ============
    if (currentTool === 'expansion-tank-sizing' && pipeLatest && expansionTankEarliest) {
      const staleness = calculateStaleness(pipeLatest, expansionTankEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'pipe-to-expansion-tank',
          upstream: {
            toolName: 'Pipe Systems',
            toolType: 'pipe-system',
            tableName: 'pipe_systems',
            latestUpdatedAt: pipeLatest,
            itemCount: pipeSystems?.length || 0,
            path: `/design/pipe-designer?project=${projectId}`,
          },
          downstream: {
            toolName: 'Expansion Tank Sizing',
            toolType: 'expansion-tank-sizing',
            tableName: 'expansion_tank_selections',
            createdAt: expansionTankEarliest,
            itemCount: expansionTankSelections?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(pipeLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Pipe system was updated. Expansion tank sizing should be recalculated for new system volume.',
        });
      }
    }

    // Pipe System → Expansion Tank Sizing (info dependency when no selections)
    if (currentTool === 'expansion-tank-sizing' && pipeLatest && !expansionTankEarliest) {
      dependencies.push({
        id: 'pipe-to-expansiontank',
        upstream: {
          toolName: 'Pipe Designer',
          toolType: 'pipe-system',
          tableName: 'pipe_systems',
          latestUpdatedAt: pipeLatest,
          itemCount: pipeSystems?.length || 0,
          path: `/design/pipe-designer?project=${projectId}`,
        },
        downstream: {
          toolName: 'Expansion Tank Sizing',
          toolType: 'expansion-tank-sizing',
          tableName: 'expansion_tank_selections',
          createdAt: null,
          itemCount: 0,
        },
        status: 'synced',
        staleDurationMinutes: 0,
        staleDurationText: '',
        severity: 'info',
        description: 'Import system volume and static head from pipe system design.',
      });
    }

    // ============ CV-04: Pipe System → Control Valve (Staleness Check) ============
    if (currentTool === 'control-valve-sizing' && pipeLatest && controlValveEarliest) {
      const staleness = calculateStaleness(pipeLatest, controlValveEarliest);
      if (staleness.isStale) {
        dependencies.push({
          id: 'pipe-to-control-valve',
          upstream: {
            toolName: 'Pipe Systems',
            toolType: 'pipe-system',
            tableName: 'pipe_systems',
            latestUpdatedAt: pipeLatest,
            itemCount: pipeSystems?.length || 0,
            path: `/design/pipe-designer?project=${projectId}`,
          },
          downstream: {
            toolName: 'Control Valve Sizing',
            toolType: 'control-valve-sizing',
            tableName: 'control_valve_selections',
            createdAt: controlValveEarliest,
            itemCount: controlValveSelections?.length || 0,
          },
          status: 'stale',
          staleDurationMinutes: staleness.minutesStale,
          staleDurationText: formatDistanceToNow(new Date(pipeLatest), { addSuffix: true }),
          severity: staleness.severity,
          description: 'Pipe system pressure drop changed. Control valve Cv and authority should be recalculated.',
        });
      }
    }

    // ============ CV-04: Control Valve Authority Alert ============
    if (currentTool === 'control-valve-sizing') {
      // Check control valve selections for low authority
      controlValveSelections?.forEach(cv => {
        const authority = cv.valve_authority || 0;
        if (authority > 0 && authority < 0.25) {
          dependencies.push({
            id: `cv-authority-critical-${cv.id}`,
            upstream: {
              toolName: 'Pump Selection',
              toolType: 'pump-selection',
              tableName: 'pump_selections',
              latestUpdatedAt: pipeLatest,
              itemCount: pumpSelections?.length || 0,
              path: `/design/pump-selection?project=${projectId}`,
            },
            downstream: {
              toolName: 'Control Valve Sizing',
              toolType: 'control-valve-sizing',
              tableName: 'control_valve_selections',
              createdAt: cv.created_at || null,
              itemCount: 1,
            },
            status: 'stale',
            staleDurationMinutes: 0,
            staleDurationText: 'now',
            severity: 'critical',
            description: `Control valve authority is ${(authority * 100).toFixed(0)}% which is below minimum 25%. Valve may hunt or provide poor control.`,
          });
        } else if (authority > 0 && authority < 0.5) {
          dependencies.push({
            id: `cv-authority-warning-${cv.id}`,
            upstream: {
              toolName: 'Pump Selection',
              toolType: 'pump-selection',
              tableName: 'pump_selections',
              latestUpdatedAt: pipeLatest,
              itemCount: pumpSelections?.length || 0,
              path: `/design/pump-selection?project=${projectId}`,
            },
            downstream: {
              toolName: 'Control Valve Sizing',
              toolType: 'control-valve-sizing',
              tableName: 'control_valve_selections',
              createdAt: cv.created_at || null,
              itemCount: 1,
            },
            status: 'stale',
            staleDurationMinutes: 0,
            staleDurationText: 'now',
            severity: 'warning',
            description: `Control valve authority is ${(authority * 100).toFixed(0)}% which is below recommended 50%. Consider sizing valve for higher pressure drop.`,
          });
        }
      });
    }

    // Duct System → Silencer Sizing
    if (currentTool === 'silencer-sizing' && ductLatest) {
      dependencies.push({
        id: 'duct-to-silencer',
        upstream: {
          toolName: 'Duct Designer',
          toolType: 'duct-system',
          tableName: 'duct_systems',
          latestUpdatedAt: ductLatest,
          itemCount: ductSystems?.length || 0,
          path: `/design/duct-designer?project=${projectId}`,
        },
        downstream: {
          toolName: 'Silencer Sizing',
          toolType: 'silencer-sizing',
          tableName: 'project_design_data',
          createdAt: null,
          itemCount: 0,
        },
        status: 'synced',
        staleDurationMinutes: 0,
        staleDurationText: '',
        severity: 'info',
        description: 'Import duct CFM and velocity for silencer sizing.',
      });
    }

    // Equipment Selection → Vibration Isolation
    if (currentTool === 'vibration-isolation' && equipLatest) {
      dependencies.push({
        id: 'equipment-to-vibration',
        upstream: {
          toolName: 'Equipment Selection',
          toolType: 'equipment-selection',
          tableName: 'equipment_selections',
          latestUpdatedAt: equipLatest,
          itemCount: equipmentSelections?.length || 0,
          path: `/design/equipment-selection?project=${projectId}`,
        },
        downstream: {
          toolName: 'Vibration Isolation',
          toolType: 'vibration-isolation',
          tableName: 'project_design_data',
          createdAt: null,
          itemCount: 0,
        },
        status: 'synced',
        staleDurationMinutes: 0,
        staleDurationText: '',
        severity: 'info',
        description: 'Import equipment weight and RPM for vibration isolator selection.',
      });
    }

    // ============ NEW DEPENDENCY RULES - Phase 18 ============

    // NEW RULE 1: Insulation Calculator → Load Calculation (reverse check)
    // R-value changes may affect heat gain/loss calculations
    if (currentTool === 'load-calculation' && insulationCalcs && insulationCalcs.length > 0) {
      const insulationLatest = getLatestTimestamp(insulationCalcs || []);
      const loadEarliest = getEarliestTimestamp(loadCalcs || []);
      if (insulationLatest && loadEarliest) {
        const staleness = calculateStaleness(insulationLatest, loadEarliest);
        if (staleness.isStale) {
          dependencies.push({
            id: 'insulation-to-load',
            upstream: {
              toolName: 'Insulation Calculator',
              toolType: 'insulation',
              tableName: 'insulation_calculations',
              latestUpdatedAt: insulationLatest,
              itemCount: insulationCalcs?.length || 0,
              path: `/design/insulation-calculator?project=${projectId}`,
            },
            downstream: {
              toolName: 'Load Calculation',
              toolType: 'load-calculation',
              tableName: 'load_calculations',
              createdAt: loadEarliest,
              itemCount: loadCalcs?.length || 0,
            },
            status: 'stale',
            staleDurationMinutes: staleness.minutesStale,
            staleDurationText: formatDistanceToNow(new Date(insulationLatest), { addSuffix: true }),
            severity: staleness.severity,
            description: 'Insulation R-values were updated. Changes may affect heat gain/loss calculations.',
          });
        }
      }
    }

    // NEW RULE 2: Acoustic Calculator → Diffuser Selection (reverse check)
    // NC target changes may affect diffuser noise requirements
    if (currentTool === 'diffuser' && acousticCalcs && acousticCalcs.length > 0) {
      const acousticLatest = getLatestTimestamp(acousticCalcs || []);
      if (acousticLatest && diffuserEarliest) {
        const staleness = calculateStaleness(acousticLatest, diffuserEarliest);
        if (staleness.isStale) {
          dependencies.push({
            id: 'acoustic-to-diffuser',
            upstream: {
              toolName: 'Acoustic Calculator',
              toolType: 'acoustic',
              tableName: 'acoustic_calculations',
              latestUpdatedAt: acousticLatest,
              itemCount: acousticCalcs?.length || 0,
              path: `/design/acoustic-calculator?project=${projectId}`,
            },
            downstream: {
              toolName: 'Diffuser Selection',
              toolType: 'diffuser',
              tableName: 'diffuser_grilles',
              createdAt: diffuserEarliest,
              itemCount: diffuserGrilles?.length || 0,
            },
            status: 'stale',
            staleDurationMinutes: staleness.minutesStale,
            staleDurationText: formatDistanceToNow(new Date(acousticLatest), { addSuffix: true }),
            severity: staleness.severity,
            description: 'Acoustic NC target was updated. Diffuser noise ratings may need verification.',
          });
        }
      }
    }

    // NEW RULE 3: VRF System → Terminal Units
    // VRF capacity changes may affect indoor unit sizing
    if (currentTool === 'terminal-unit' && vrfSystems && vrfSystems.length > 0) {
      const vrfLatest = getLatestTimestamp(vrfSystems || []);
      if (vrfLatest && terminalEarliest) {
        const staleness = calculateStaleness(vrfLatest, terminalEarliest);
        if (staleness.isStale) {
          dependencies.push({
            id: 'vrf-to-terminal',
            upstream: {
              toolName: 'VRF System Designer',
              toolType: 'vrf-system',
              tableName: 'vrf_systems',
              latestUpdatedAt: vrfLatest,
              itemCount: vrfSystems?.length || 0,
              path: `/design/vrf-designer?project=${projectId}`,
            },
            downstream: {
              toolName: 'Terminal Unit Sizing',
              toolType: 'terminal-unit',
              tableName: 'terminal_unit_selections',
              createdAt: terminalEarliest,
              itemCount: terminalUnits?.length || 0,
            },
            status: 'stale',
            staleDurationMinutes: staleness.minutesStale,
            staleDurationText: formatDistanceToNow(new Date(vrfLatest), { addSuffix: true }),
            severity: staleness.severity,
            description: 'VRF system capacity was updated. Indoor unit sizing may need verification.',
          });
        }
      }
    }

    // NEW RULE 4: Chiller Selection → Cooling Tower Sizing
    // Chiller heat rejection changes require tower resizing
    if (currentTool === 'cooling-tower-sizing' && chillerSelections && chillerSelections.length > 0) {
      if (chillerLatest && coolingTowerEarliest) {
        const staleness = calculateStaleness(chillerLatest, coolingTowerEarliest);
        if (staleness.isStale) {
          dependencies.push({
            id: 'chiller-to-coolingtower-rev',
            upstream: {
              toolName: 'Chiller Selection',
              toolType: 'chiller-selection',
              tableName: 'chiller_selections',
              latestUpdatedAt: chillerLatest,
              itemCount: chillerSelections?.length || 0,
              path: `/design/chiller-selection?project=${projectId}`,
            },
            downstream: {
              toolName: 'Cooling Tower Sizing',
              toolType: 'cooling-tower-sizing',
              tableName: 'cooling_tower_selections',
              createdAt: coolingTowerEarliest,
              itemCount: coolingTowerSelections?.length || 0,
            },
            status: 'stale',
            staleDurationMinutes: staleness.minutesStale,
            staleDurationText: formatDistanceToNow(new Date(chillerLatest), { addSuffix: true }),
            severity: staleness.severity,
            description: 'Chiller selection was updated. Heat rejection capacity may require cooling tower resizing.',
          });
        }
      }
    }

    // NEW RULE 5: CHW Plant → Chiller Selection (reverse check)
    // Plant capacity changes require chiller review
    if (currentTool === 'chiller-selection' && chwPlants && chwPlants.length > 0) {
      if (chwPlantLatest && chillerEarliest) {
        const staleness = calculateStaleness(chwPlantLatest, chillerEarliest);
        if (staleness.isStale) {
          dependencies.push({
            id: 'chwplant-to-chiller-rev',
            upstream: {
              toolName: 'CHW Plant Design',
              toolType: 'chw-plant',
              tableName: 'chilled_water_plants',
              latestUpdatedAt: chwPlantLatest,
              itemCount: chwPlants?.length || 0,
              path: `/design/chilled-water-plant?project=${projectId}`,
            },
            downstream: {
              toolName: 'Chiller Selection',
              toolType: 'chiller-selection',
              tableName: 'chiller_selections',
              createdAt: chillerEarliest,
              itemCount: chillerSelections?.length || 0,
            },
            status: 'stale',
            staleDurationMinutes: staleness.minutesStale,
            staleDurationText: formatDistanceToNow(new Date(chwPlantLatest), { addSuffix: true }),
            severity: staleness.severity,
            description: 'CHW Plant design was updated. Chiller sizing may need adjustment.',
          });
        }
      }
    }

    // NEW RULE 6: HW Plant → Boiler Selection (reverse check)
    // Plant capacity changes require boiler review
    if (currentTool === 'boiler-selection' && hwPlants && hwPlants.length > 0) {
      if (hwPlantLatest && boilerEarliest) {
        const staleness = calculateStaleness(hwPlantLatest, boilerEarliest);
        if (staleness.isStale) {
          dependencies.push({
            id: 'hwplant-to-boiler-rev',
            upstream: {
              toolName: 'HW Plant Design',
              toolType: 'hw-plant',
              tableName: 'hot_water_plants',
              latestUpdatedAt: hwPlantLatest,
              itemCount: hwPlants?.length || 0,
              path: `/design/hot-water-plant?project=${projectId}`,
            },
            downstream: {
              toolName: 'Boiler Selection',
              toolType: 'boiler-selection',
              tableName: 'boiler_selections',
              createdAt: boilerEarliest,
              itemCount: boilerSelections?.length || 0,
            },
            status: 'stale',
            staleDurationMinutes: staleness.minutesStale,
            staleDurationText: formatDistanceToNow(new Date(hwPlantLatest), { addSuffix: true }),
            severity: staleness.severity,
            description: 'HW Plant design was updated. Boiler sizing may need adjustment.',
          });
        }
      }
    }

    // NEW RULE 7: AHU Configuration → Coil Selection
    // AHU changes may require coil resizing
    if (currentTool === 'coil-selection' && ahuConfigs && ahuConfigs.length > 0) {
      if (ahuLatest && coilEarliest) {
        const staleness = calculateStaleness(ahuLatest, coilEarliest);
        if (staleness.isStale) {
          dependencies.push({
            id: 'ahu-to-coil-rev',
            upstream: {
              toolName: 'AHU Configuration',
              toolType: 'ahu-configuration',
              tableName: 'ahu_configurations',
              latestUpdatedAt: ahuLatest,
              itemCount: ahuConfigs?.length || 0,
              path: `/design/ahu-configuration?project=${projectId}`,
            },
            downstream: {
              toolName: 'Coil Selection',
              toolType: 'coil-selection',
              tableName: 'coil_selections',
              createdAt: coilEarliest,
              itemCount: coilSelections?.length || 0,
            },
            status: 'stale',
            staleDurationMinutes: staleness.minutesStale,
            staleDurationText: formatDistanceToNow(new Date(ahuLatest), { addSuffix: true }),
            severity: staleness.severity,
            description: 'AHU configuration was updated. Coil sizing may need adjustment.',
          });
        }
      }
    }

    // ============ WF-03: ERV → AHU Integration (Heat Recovery in Coil Sizing) ============
    // ERV heat recovery updates should trigger AHU coil resizing
    if (currentTool === 'ahu-configuration' && ervCalculations && ervCalculations.length > 0) {
      const ervLatest = getLatestTimestamp(ervCalculations || []);
      if (ervLatest && ahuEarliest) {
        const staleness = calculateStaleness(ervLatest, ahuEarliest);
        if (staleness.isStale) {
          dependencies.push({
            id: 'erv-to-ahu',
            upstream: {
              toolName: 'ERV Sizing',
              toolType: 'erv',
              tableName: 'erv_sizing_calculations',
              latestUpdatedAt: ervLatest,
              itemCount: ervCalculations?.length || 0,
              path: `/design/erv-sizing?project=${projectId}`,
            },
            downstream: {
              toolName: 'AHU Configuration',
              toolType: 'ahu-configuration',
              tableName: 'ahu_configurations',
              createdAt: ahuEarliest,
              itemCount: ahuConfigs?.length || 0,
            },
            status: 'stale',
            staleDurationMinutes: staleness.minutesStale,
            staleDurationText: formatDistanceToNow(new Date(ervLatest), { addSuffix: true }),
            severity: staleness.severity,
            description: 'ERV heat recovery data was updated. AHU coil sizing should account for pre-conditioned outdoor air from energy recovery.',
          });
        }
      }
    }

    // ============ PLANT CAPACITY AGGREGATION VALIDATION ============

    // CHW Plant vs Chiller Selection - Capacity aggregation check
    if (currentTool === 'chiller-selection' && chwPlants && chwPlants.length > 0 && chillerSelections && chillerSelections.length > 0) {
      // Sum total chiller capacity
      const totalChillerCapacity = chillerSelections.reduce(
        (sum, chiller) => sum + (chiller.rated_capacity_tons || 0), 
        0
      );
      
      // Sum total plant requirement
      const totalPlantRequirement = chwPlants.reduce(
        (sum, plant) => sum + (plant.design_cooling_load_tons || 0), 
        0
      );
      
      // Check if chillers are undersized (allowing 5% tolerance)
      if (totalPlantRequirement > 0 && totalChillerCapacity < totalPlantRequirement * 0.95) {
        const shortfall = totalPlantRequirement - totalChillerCapacity;
        const shortfallPercent = ((shortfall / totalPlantRequirement) * 100).toFixed(1);
        
        dependencies.push({
          id: 'chw-capacity-aggregation',
          upstream: {
            toolName: 'CHW Plant Sizing',
            toolType: 'chw-plant',
            tableName: 'chilled_water_plants',
            latestUpdatedAt: chwPlantLatest,
            itemCount: chwPlants.length,
            path: `/design/chilled-water-plant?project=${projectId}`,
          },
          downstream: {
            toolName: 'Chiller Selection',
            toolType: 'chiller-selection',
            tableName: 'chiller_selections',
            createdAt: chillerEarliest,
            itemCount: chillerSelections.length,
          },
          status: 'needs_refresh',
          staleDurationMinutes: 0,
          staleDurationText: 'Capacity shortfall',
          severity: totalChillerCapacity < totalPlantRequirement * 0.8 ? 'critical' : 'warning',
          description: `Total chiller capacity (${totalChillerCapacity.toFixed(0)} tons) is ${shortfallPercent}% below plant requirement (${totalPlantRequirement.toFixed(0)} tons). Add ${shortfall.toFixed(0)} tons capacity.`,
        });
      }
    }

    // Also show capacity status when on CHW Plant tool
    if (currentTool === 'chw-plant' && chwPlants && chwPlants.length > 0 && chillerSelections && chillerSelections.length > 0) {
      const totalChillerCapacity = chillerSelections.reduce(
        (sum, chiller) => sum + (chiller.rated_capacity_tons || 0), 
        0
      );
      const totalPlantRequirement = chwPlants.reduce(
        (sum, plant) => sum + (plant.design_cooling_load_tons || 0), 
        0
      );
      
      if (totalPlantRequirement > 0 && totalChillerCapacity < totalPlantRequirement * 0.95) {
        const shortfallPercent = (((totalPlantRequirement - totalChillerCapacity) / totalPlantRequirement) * 100).toFixed(1);
        
        dependencies.push({
          id: 'chw-capacity-aggregation-plant-view',
          upstream: {
            toolName: 'CHW Plant Sizing',
            toolType: 'chw-plant',
            tableName: 'chilled_water_plants',
            latestUpdatedAt: chwPlantLatest,
            itemCount: chwPlants.length,
            path: `/design/chilled-water-plant?project=${projectId}`,
          },
          downstream: {
            toolName: 'Chiller Selection',
            toolType: 'chiller-selection',
            tableName: 'chiller_selections',
            createdAt: chillerEarliest,
            itemCount: chillerSelections.length,
          },
          status: 'needs_refresh',
          staleDurationMinutes: 0,
          staleDurationText: 'Capacity shortfall',
          severity: totalChillerCapacity < totalPlantRequirement * 0.8 ? 'critical' : 'warning',
          description: `Selected chillers (${totalChillerCapacity.toFixed(0)} tons) are ${shortfallPercent}% undersized. Plant requires ${totalPlantRequirement.toFixed(0)} tons. Select additional chillers or increase capacity.`,
        });
      }
    }

    // HW Plant vs Boiler Selection - Capacity aggregation check
    if (currentTool === 'boiler-selection' && hwPlants && hwPlants.length > 0 && boilerSelections && boilerSelections.length > 0) {
      // Sum total boiler capacity
      const totalBoilerCapacity = boilerSelections.reduce(
        (sum, boiler) => sum + (boiler.selected_capacity_btuh || 0), 
        0
      );
      
      // Sum total plant requirement
      const totalPlantRequirement = hwPlants.reduce(
        (sum, plant) => sum + (plant.heating_load_btuh || 0), 
        0
      );
      
      // Check if boilers are undersized (allowing 5% tolerance)
      if (totalPlantRequirement > 0 && totalBoilerCapacity < totalPlantRequirement * 0.95) {
        const shortfall = totalPlantRequirement - totalBoilerCapacity;
        const shortfallPercent = ((shortfall / totalPlantRequirement) * 100).toFixed(1);
        
        // Format capacity in readable units (MBH = thousands BTU/hr)
        const totalBoilerMBH = (totalBoilerCapacity / 1000).toFixed(0);
        const totalPlantMBH = (totalPlantRequirement / 1000).toFixed(0);
        const shortfallMBH = (shortfall / 1000).toFixed(0);
        
        dependencies.push({
          id: 'hw-capacity-aggregation',
          upstream: {
            toolName: 'HW Plant Sizing',
            toolType: 'hw-plant',
            tableName: 'hot_water_plants',
            latestUpdatedAt: hwPlantLatest,
            itemCount: hwPlants.length,
            path: `/design/hot-water-plant?project=${projectId}`,
          },
          downstream: {
            toolName: 'Boiler Selection',
            toolType: 'boiler-selection',
            tableName: 'boiler_selections',
            createdAt: boilerEarliest,
            itemCount: boilerSelections.length,
          },
          status: 'needs_refresh',
          staleDurationMinutes: 0,
          staleDurationText: 'Capacity shortfall',
          severity: totalBoilerCapacity < totalPlantRequirement * 0.8 ? 'critical' : 'warning',
          description: `Total boiler capacity (${totalBoilerMBH} MBH) is ${shortfallPercent}% below plant requirement (${totalPlantMBH} MBH). Add ${shortfallMBH} MBH capacity.`,
        });
      }
    }

    // Also show capacity status when on HW Plant tool
    if (currentTool === 'hw-plant' && hwPlants && hwPlants.length > 0 && boilerSelections && boilerSelections.length > 0) {
      const totalBoilerCapacity = boilerSelections.reduce(
        (sum, boiler) => sum + (boiler.selected_capacity_btuh || 0), 
        0
      );
      const totalPlantRequirement = hwPlants.reduce(
        (sum, plant) => sum + (plant.heating_load_btuh || 0), 
        0
      );
      
      if (totalPlantRequirement > 0 && totalBoilerCapacity < totalPlantRequirement * 0.95) {
        const shortfallPercent = (((totalPlantRequirement - totalBoilerCapacity) / totalPlantRequirement) * 100).toFixed(1);
        const totalBoilerMBH = (totalBoilerCapacity / 1000).toFixed(0);
        const totalPlantMBH = (totalPlantRequirement / 1000).toFixed(0);
        
        dependencies.push({
          id: 'hw-capacity-aggregation-plant-view',
          upstream: {
            toolName: 'HW Plant Sizing',
            toolType: 'hw-plant',
            tableName: 'hot_water_plants',
            latestUpdatedAt: hwPlantLatest,
            itemCount: hwPlants.length,
            path: `/design/hot-water-plant?project=${projectId}`,
          },
          downstream: {
            toolName: 'Boiler Selection',
            toolType: 'boiler-selection',
            tableName: 'boiler_selections',
            createdAt: boilerEarliest,
            itemCount: boilerSelections.length,
          },
          status: 'needs_refresh',
          staleDurationMinutes: 0,
          staleDurationText: 'Capacity shortfall',
          severity: totalBoilerCapacity < totalPlantRequirement * 0.8 ? 'critical' : 'warning',
          description: `Selected boilers (${totalBoilerMBH} MBH) are ${shortfallPercent}% undersized. Plant requires ${totalPlantMBH} MBH. Select additional boilers or increase capacity.`,
        });
      }
    }

    // Chiller Selection → Cooling Tower Sizing - Heat rejection capacity check
    if (currentTool === 'cooling-tower-sizing' && chillerSelections && chillerSelections.length > 0 && coolingTowerSelections && coolingTowerSelections.length > 0) {
      const totalChillerCapacity = chillerSelections.reduce(
        (sum, chiller) => sum + (chiller.rated_capacity_tons || 0), 
        0
      );
      
      // Cooling tower capacity should be ~115% of chiller capacity (chiller + compressor heat)
      const requiredTowerCapacity = totalChillerCapacity * 1.15;
      
      // Sum tower capacity
      const totalTowerCapacity = coolingTowerSelections.reduce(
        (sum, tower) => sum + (tower.total_capacity_tons || 0), 
        0
      );
      
      if (requiredTowerCapacity > 0 && totalTowerCapacity < requiredTowerCapacity * 0.95) {
        const shortfall = requiredTowerCapacity - totalTowerCapacity;
        const shortfallPercent = ((shortfall / requiredTowerCapacity) * 100).toFixed(1);
        
        dependencies.push({
          id: 'chiller-to-tower-capacity',
          upstream: {
            toolName: 'Chiller Selection',
            toolType: 'chiller-selection',
            tableName: 'chiller_selections',
            latestUpdatedAt: chillerLatest,
            itemCount: chillerSelections.length,
            path: `/design/chiller-selection?project=${projectId}`,
          },
          downstream: {
            toolName: 'Cooling Tower Sizing',
            toolType: 'cooling-tower-sizing',
            tableName: 'cooling_tower_selections',
            createdAt: coolingTowerEarliest,
            itemCount: coolingTowerSelections.length,
          },
          status: 'needs_refresh',
          staleDurationMinutes: 0,
          staleDurationText: 'Heat rejection shortfall',
          severity: totalTowerCapacity < requiredTowerCapacity * 0.8 ? 'critical' : 'warning',
          description: `Cooling tower capacity (${totalTowerCapacity.toFixed(0)} tons) is ${shortfallPercent}% below required heat rejection (${requiredTowerCapacity.toFixed(0)} tons for ${totalChillerCapacity.toFixed(0)} tons of chillers).`,
        });
      }
    }

    // ============ CV-01: CHW Plant capacity shortfall (reverse direction) ============
    // Show alert on CHW Plant tool when total chiller capacity is insufficient
    if (currentTool === 'chw-plant' && chwPlants && chwPlants.length > 0 && chillerSelections && chillerSelections.length > 0) {
      const totalChillerCapacity = chillerSelections.reduce(
        (sum, chiller) => sum + (chiller.rated_capacity_tons || 0), 
        0
      );
      const totalPlantRequirement = chwPlants.reduce(
        (sum, plant) => sum + (plant.design_cooling_load_tons || 0), 
        0
      );
      
      if (totalPlantRequirement > 0 && totalChillerCapacity < totalPlantRequirement * 0.95) {
        const shortfallPercent = (((totalPlantRequirement - totalChillerCapacity) / totalPlantRequirement) * 100).toFixed(1);
        
        dependencies.push({
          id: 'chw-capacity-aggregation-plant-view',
          upstream: {
            toolName: 'CHW Plant Sizing',
            toolType: 'chw-plant',
            tableName: 'chilled_water_plants',
            latestUpdatedAt: chwPlantLatest,
            itemCount: chwPlants.length,
            path: `/design/chilled-water-plant?project=${projectId}`,
          },
          downstream: {
            toolName: 'Chiller Selection',
            toolType: 'chiller-selection',
            tableName: 'chiller_selections',
            createdAt: chillerEarliest,
            itemCount: chillerSelections.length,
          },
          status: 'needs_refresh',
          staleDurationMinutes: 0,
          staleDurationText: 'Capacity shortfall',
          severity: totalChillerCapacity < totalPlantRequirement * 0.8 ? 'critical' : 'warning',
          description: `Selected chillers (${totalChillerCapacity.toFixed(0)} tons) are ${shortfallPercent}% undersized. Plant requires ${totalPlantRequirement.toFixed(0)} tons. Select additional chillers or increase capacity.`,
        });
      }
    }

    // ============ CV-02: Boiler efficiency vs HW Plant return temp ============
    // Validate condensing boilers are selected when return temps < 130F
    if (currentTool === 'boiler-selection' && hwPlants && hwPlants.length > 0 && boilerSelections && boilerSelections.length > 0) {
      const lowReturnTempPlant = hwPlants.find(plant => {
        const returnTemp = plant.return_temp_f;
        return returnTemp && returnTemp < 130;
      });
      
      if (lowReturnTempPlant) {
        // Check if any non-condensing boilers are selected (AFUE < 90% typically indicates non-condensing)
        const nonCondensingBoiler = boilerSelections.find(boiler => {
          return boiler.afue && boiler.afue < 90;
        });
        
        if (nonCondensingBoiler) {
          dependencies.push({
            id: 'boiler-efficiency-return-temp',
            upstream: {
              toolName: 'HW Plant Sizing',
              toolType: 'hw-plant',
              tableName: 'hot_water_plants',
              latestUpdatedAt: hwPlantLatest,
              itemCount: hwPlants.length,
              path: `/design/hot-water-plant?project=${projectId}`,
            },
            downstream: {
              toolName: 'Boiler Selection',
              toolType: 'boiler-selection',
              tableName: 'boiler_selections',
              createdAt: boilerEarliest,
              itemCount: boilerSelections.length,
            },
            status: 'needs_refresh',
            staleDurationMinutes: 0,
            staleDurationText: 'Efficiency mismatch',
            severity: 'warning',
            description: `HW return temp (${lowReturnTempPlant.return_temp_f}°F) is below 130°F. Consider selecting a condensing boiler (>90% AFUE) for ${nonCondensingBoiler.boiler_tag || 'selected unit'} to maximize efficiency.`,
          });
        }
      }
    }

    // ============ Categorize Alerts ============
    
    const criticalAlerts = dependencies.filter(d => d.severity === 'critical');
    const warningAlerts = dependencies.filter(d => d.severity === 'warning');
    const infoAlerts = dependencies.filter(d => d.severity === 'info');
    const hasStaleData = dependencies.some(d => d.status === 'stale');

    // Build upstream changes list
    const upstreamChanges = dependencies.map(d => ({
      toolName: d.upstream.toolName,
      changedAt: d.upstream.latestUpdatedAt || '',
      description: d.description,
    }));

    return {
      dependencies,
      hasStaleData,
      criticalAlerts,
      warningAlerts,
      infoAlerts,
      upstreamChanges,
    };
  }, [
    projectId,
    currentTool,
    loadCalcs,
    equipmentSelections,
    ventilationCalcs,
    terminalUnits,
    ductSystems,
    pipeSystems,
    ahuConfigs,
    fanSelections,
    pumpSelections,
    ervCalculations,
    vrfSystems,
    diffuserGrilles,
    insulationCalcs,
    acousticCalcs,
    coilSelections,
    filterSelections,
    coolingTowerSelections,
    chillerSelections,
    chwPlants,
    hwPlants,
    boilerSelections,
    psychrometricAnalyses,
  ]);

  return {
    ...result,
    isLoading,
  };
}

// ============ Utility Hook for Tool Detection ============

export function getToolTypeFromPath(pathname: string): ToolType | null {
  if (pathname.includes('load-calculator')) return 'load-calculation';
  if (pathname.includes('ventilation')) return 'ventilation';
  if (pathname.includes('equipment-selection')) return 'equipment-selection';
  if (pathname.includes('terminal-unit')) return 'terminal-unit';
  if (pathname.includes('diffuser')) return 'diffuser';
  if (pathname.includes('duct-designer')) return 'duct-system';
  if (pathname.includes('pipe-designer')) return 'pipe-system';
  if (pathname.includes('fan-selection')) return 'fan-selection';
  if (pathname.includes('pump-selection')) return 'pump-selection';
  if (pathname.includes('ahu-configuration')) return 'ahu-configuration';
  if (pathname.includes('erv')) return 'erv';
  if (pathname.includes('psychrometric')) return 'psychrometric';
  if (pathname.includes('vrf')) return 'vrf-system';
  if (pathname.includes('acoustic')) return 'acoustic';
  if (pathname.includes('insulation')) return 'insulation';
  if (pathname.includes('sequence-of-operations')) return 'sequence-of-operations';
  if (pathname.includes('coil-selection')) return 'coil-selection';
  if (pathname.includes('filter-selection')) return 'filter-selection';
  if (pathname.includes('vav-box-selection')) return 'vav-box-selection';
  if (pathname.includes('fcu-selection')) return 'fcu-selection';
  if (pathname.includes('cooling-tower-sizing')) return 'cooling-tower-sizing';
  if (pathname.includes('chiller-selection')) return 'chiller-selection';
  if (pathname.includes('chilled-water-plant')) return 'chw-plant';
  if (pathname.includes('boiler-selection')) return 'boiler-selection';
  if (pathname.includes('hot-water-plant')) return 'hw-plant';
  // Specialty tools - Phase 5
  if (pathname.includes('economizer-sizing')) return 'economizer-sizing';
  if (pathname.includes('expansion-tank-sizing')) return 'expansion-tank-sizing';
  if (pathname.includes('silencer-sizing')) return 'silencer-sizing';
  if (pathname.includes('control-valve-sizing')) return 'control-valve-sizing';
  if (pathname.includes('vibration-isolation')) return 'vibration-isolation';
  if (pathname.includes('thermal-comfort')) return 'thermal-comfort';
  if (pathname.includes('smoke-control')) return 'smoke-control';
  // Acoustic specialty tools - Phase 6
  if (pathname.includes('duct-lining')) return 'duct-lining';
  if (pathname.includes('room-acoustics')) return 'room-acoustics';
  if (pathname.includes('noise-path')) return 'noise-path';
  if (pathname.includes('silencer-selection')) return 'silencer-selection';
  // Documentation tools - Phase 6
  if (pathname.includes('bas-points')) return 'bas-points';
  if (pathname.includes('equipment-schedule')) return 'equipment-schedule';
  // Distribution sizing tools - Phase 6
  if (pathname.includes('duct-sizing')) return 'duct-sizing';
  if (pathname.includes('pipe-sizing')) return 'pipe-sizing';
  if (pathname.includes('pressure-drop')) return 'pressure-drop';
  // Acoustic cost/analysis tools - Phase 6
  if (pathname.includes('acoustic-cost')) return 'acoustic-cost';
  if (pathname.includes('acoustic-roi')) return 'acoustic-roi';
  if (pathname.includes('lifecycle-cost')) return 'lifecycle-cost';
  if (pathname.includes('treatment-wizard')) return 'treatment-wizard';
  if (pathname.includes('acoustic-measurement')) return 'acoustic-measurement';
  return null;
}
