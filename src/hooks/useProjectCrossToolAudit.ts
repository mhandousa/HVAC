import { useMemo } from 'react';
import { useLoadCalculations } from './useLoadCalculations';
import { useEquipmentSelections } from './useEquipmentSelections';
import { useSavedVentilationCalcs } from './useSavedVentilationCalcs';
import { useTerminalUnitSelections } from './useTerminalUnitSelections';
import { useDuctSystems } from './useDuctSystems';
import { usePipeSystems } from './usePipeSystems';
import { useAHUConfigurations } from './useAHUConfigurations';
import { useDiffuserGrilles } from './useDiffuserGrilles';
import { useSavedERVSizing } from './useSavedERVSizing';
import { useVRFSystems } from './useVRFSystems';
import { useFanSelections } from './useFanSelections';
import { usePumpSelections } from './usePumpSelections';
import { useAcousticCalculations } from './useAcousticCalculations';
import { useInsulationCalculations } from './useInsulationCalculations';
import { formatDistanceToNow } from 'date-fns';
import type { ToolType, CrossToolDependency } from './useCrossToolValidation';

// ============ Types ============

export interface ToolDataStatus {
  toolType: ToolType;
  toolName: string;
  tableName: string;
  hasData: boolean;
  itemCount: number;
  latestUpdate: string | null;
  earliestCreated: string | null;
  path: string;
}

export interface ProjectAuditSummary {
  totalDependencies: number;
  staleCount: number;
  syncedCount: number;
  criticalCount: number;
  warningCount: number;
  overallHealth: 'healthy' | 'warning' | 'critical';
  healthScore: number; // 0-100
}

export interface ProjectAuditResult {
  allDependencies: CrossToolDependency[];
  criticalAlerts: CrossToolDependency[];
  warningAlerts: CrossToolDependency[];
  infoAlerts: CrossToolDependency[];
  syncedDependencies: CrossToolDependency[];
  summary: ProjectAuditSummary;
  toolsWithData: ToolDataStatus[];
  isLoading: boolean;
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

// ============ Main Hook ============

export function useProjectCrossToolAudit(projectId: string | null): ProjectAuditResult {
  // Fetch all relevant data
  const { data: loadCalcs, isLoading: loadingLoads } = useLoadCalculations(projectId ?? undefined);
  const { data: equipmentSelections, isLoading: loadingEquipment } = useEquipmentSelections(projectId ?? undefined);
  const { calculations: ventilationCalcs, isLoading: loadingVentilation } = useSavedVentilationCalcs(projectId ?? undefined);
  const { data: terminalUnits, isLoading: loadingTerminals } = useTerminalUnitSelections(projectId ?? undefined);
  const { data: ductSystems, isLoading: loadingDucts } = useDuctSystems(projectId ?? undefined);
  const { data: pipeSystems, isLoading: loadingPipes } = usePipeSystems(projectId ?? undefined);
  const { data: ahuConfigs, isLoading: loadingAHU } = useAHUConfigurations(projectId ?? undefined);
  const { data: diffusers, isLoading: loadingDiffusers } = useDiffuserGrilles(projectId ?? undefined);
  const { calculations: ervCalcs, isLoading: loadingERV } = useSavedERVSizing(projectId ?? undefined);
  const { data: vrfSystems, isLoading: loadingVRF } = useVRFSystems(projectId ?? undefined);
  const { data: fanSelections, isLoading: loadingFans } = useFanSelections(projectId ?? undefined);
  const { data: pumpSelections, isLoading: loadingPumps } = usePumpSelections(projectId ?? undefined);
  const { data: acousticCalcs, isLoading: loadingAcoustic } = useAcousticCalculations(projectId ?? undefined);
  const { data: insulationCalcs, isLoading: loadingInsulation } = useInsulationCalculations(projectId ?? undefined);

  const isLoading = loadingLoads || loadingEquipment || loadingVentilation || 
                    loadingTerminals || loadingDucts || loadingPipes || loadingAHU || loadingDiffusers ||
                    loadingERV || loadingVRF || loadingFans || loadingPumps || loadingAcoustic || loadingInsulation;

  const result = useMemo((): Omit<ProjectAuditResult, 'isLoading'> => {
    const allDependencies: CrossToolDependency[] = [];
    
    if (!projectId) {
      return {
        allDependencies: [],
        criticalAlerts: [],
        warningAlerts: [],
        infoAlerts: [],
        syncedDependencies: [],
        summary: {
          totalDependencies: 0,
          staleCount: 0,
          syncedCount: 0,
          criticalCount: 0,
          warningCount: 0,
          overallHealth: 'healthy',
          healthScore: 100,
        },
        toolsWithData: [],
      };
    }

    // Get timestamps for all tools
    const loadLatest = getLatestTimestamp(loadCalcs || []);
    const loadEarliest = getEarliestTimestamp(loadCalcs || []);
    const equipLatest = getLatestTimestamp(equipmentSelections || []);
    const equipEarliest = getEarliestTimestamp(equipmentSelections || []);
    const ventLatest = getLatestTimestamp(ventilationCalcs || []);
    const ventEarliest = getEarliestTimestamp(ventilationCalcs || []);
    const terminalLatest = getLatestTimestamp(terminalUnits || []);
    const terminalEarliest = getEarliestTimestamp(terminalUnits || []);
    const ductLatest = getLatestTimestamp(ductSystems || []);
    const ductEarliest = getEarliestTimestamp(ductSystems || []);
    const pipeLatest = getLatestTimestamp(pipeSystems || []);
    const pipeEarliest = getEarliestTimestamp(pipeSystems || []);
    const ahuLatest = getLatestTimestamp(ahuConfigs || []);
    const ahuEarliest = getEarliestTimestamp(ahuConfigs || []);
    const diffuserLatest = getLatestTimestamp(diffusers || []);
    const diffuserEarliest = getEarliestTimestamp(diffusers || []);
    const ervLatest = getLatestTimestamp(ervCalcs || []);
    const ervEarliest = getEarliestTimestamp(ervCalcs || []);
    const vrfLatest = getLatestTimestamp(vrfSystems || []);
    const vrfEarliest = getEarliestTimestamp(vrfSystems || []);
    const fanLatest = getLatestTimestamp(fanSelections || []);
    const fanEarliest = getEarliestTimestamp(fanSelections || []);
    const pumpLatest = getLatestTimestamp(pumpSelections || []);
    const pumpEarliest = getEarliestTimestamp(pumpSelections || []);
    const acousticLatest = getLatestTimestamp(acousticCalcs || []);
    const acousticEarliest = getEarliestTimestamp(acousticCalcs || []);
    const insulationLatest = getLatestTimestamp(insulationCalcs || []);
    const insulationEarliest = getEarliestTimestamp(insulationCalcs || []);

    // Build tool status inventory
    const toolsWithData: ToolDataStatus[] = [
      {
        toolType: 'load-calculation',
        toolName: 'Load Calculations',
        tableName: 'load_calculations',
        hasData: (loadCalcs?.length || 0) > 0,
        itemCount: loadCalcs?.length || 0,
        latestUpdate: loadLatest,
        earliestCreated: loadEarliest,
        path: `/design/load-calculation?project=${projectId}`,
      },
      {
        toolType: 'ventilation',
        toolName: 'Ventilation Calculator',
        tableName: 'ventilation_calculations',
        hasData: (ventilationCalcs?.length || 0) > 0,
        itemCount: ventilationCalcs?.length || 0,
        latestUpdate: ventLatest,
        earliestCreated: ventEarliest,
        path: `/design/ventilation-calculator?project=${projectId}`,
      },
      {
        toolType: 'equipment-selection',
        toolName: 'Equipment Selection',
        tableName: 'equipment_selections',
        hasData: (equipmentSelections?.length || 0) > 0,
        itemCount: equipmentSelections?.length || 0,
        latestUpdate: equipLatest,
        earliestCreated: equipEarliest,
        path: `/design/equipment-selection?project=${projectId}`,
      },
      {
        toolType: 'terminal-unit',
        toolName: 'Terminal Unit Sizing',
        tableName: 'terminal_unit_selections',
        hasData: (terminalUnits?.length || 0) > 0,
        itemCount: terminalUnits?.length || 0,
        latestUpdate: terminalLatest,
        earliestCreated: terminalEarliest,
        path: `/design/terminal-unit-sizing?project=${projectId}`,
      },
      {
        toolType: 'diffuser',
        toolName: 'Diffuser Selection',
        tableName: 'diffuser_grilles',
        hasData: (diffusers?.length || 0) > 0,
        itemCount: diffusers?.length || 0,
        latestUpdate: diffuserLatest,
        earliestCreated: diffuserEarliest,
        path: `/design/diffuser-selection?project=${projectId}`,
      },
      {
        toolType: 'ahu-configuration',
        toolName: 'AHU Configuration',
        tableName: 'ahu_configurations',
        hasData: (ahuConfigs?.length || 0) > 0,
        itemCount: ahuConfigs?.length || 0,
        latestUpdate: ahuLatest,
        earliestCreated: ahuEarliest,
        path: `/design/ahu-configuration?project=${projectId}`,
      },
      {
        toolType: 'duct-system',
        toolName: 'Duct Designer',
        tableName: 'duct_systems',
        hasData: (ductSystems?.length || 0) > 0,
        itemCount: ductSystems?.length || 0,
        latestUpdate: ductLatest,
        earliestCreated: ductEarliest,
        path: `/design/duct-designer?project=${projectId}`,
      },
      {
        toolType: 'pipe-system' as ToolType,
        toolName: 'Pipe Designer',
        tableName: 'pipe_systems',
        hasData: (pipeSystems?.length || 0) > 0,
        itemCount: pipeSystems?.length || 0,
        latestUpdate: pipeLatest,
        earliestCreated: pipeEarliest,
        path: `/design/pipe-designer?project=${projectId}`,
      },
      {
        toolType: 'erv' as ToolType,
        toolName: 'ERV Sizing',
        tableName: 'erv_sizing_calculations',
        hasData: (ervCalcs?.length || 0) > 0,
        itemCount: ervCalcs?.length || 0,
        latestUpdate: ervLatest,
        earliestCreated: ervEarliest,
        path: `/design/erv-sizing?project=${projectId}`,
      },
      {
        toolType: 'vrf-system' as ToolType,
        toolName: 'VRF Designer',
        tableName: 'vrf_systems',
        hasData: (vrfSystems?.length || 0) > 0,
        itemCount: vrfSystems?.length || 0,
        latestUpdate: vrfLatest,
        earliestCreated: vrfEarliest,
        path: `/design/vrf-designer?project=${projectId}`,
      },
      {
        toolType: 'fan-selection' as ToolType,
        toolName: 'Fan Selection',
        tableName: 'fan_selections',
        hasData: (fanSelections?.length || 0) > 0,
        itemCount: fanSelections?.length || 0,
        latestUpdate: fanLatest,
        earliestCreated: fanEarliest,
        path: `/design/fan-selection?project=${projectId}`,
      },
      {
        toolType: 'pump-selection' as ToolType,
        toolName: 'Pump Selection',
        tableName: 'pump_selections',
        hasData: (pumpSelections?.length || 0) > 0,
        itemCount: pumpSelections?.length || 0,
        latestUpdate: pumpLatest,
        earliestCreated: pumpEarliest,
        path: `/design/pump-selection?project=${projectId}`,
      },
      {
        toolType: 'acoustic' as ToolType,
        toolName: 'Acoustic Analysis',
        tableName: 'acoustic_calculations',
        hasData: (acousticCalcs?.length || 0) > 0,
        itemCount: acousticCalcs?.length || 0,
        latestUpdate: acousticLatest,
        earliestCreated: acousticEarliest,
        path: `/design/acoustic-calculator?project=${projectId}`,
      },
      {
        toolType: 'insulation' as ToolType,
        toolName: 'Insulation Calculator',
        tableName: 'insulation_calculations',
        hasData: (insulationCalcs?.length || 0) > 0,
        itemCount: insulationCalcs?.length || 0,
        latestUpdate: insulationLatest,
        earliestCreated: insulationEarliest,
        path: `/design/insulation-calculator?project=${projectId}`,
      },
    ];

    // ============ Define ALL Dependencies (check regardless of current tool) ============

    // 1. Load Calculation → Equipment Selection
    if ((loadCalcs?.length || 0) > 0 && (equipmentSelections?.length || 0) > 0) {
      const staleness = calculateStaleness(loadLatest, equipEarliest);
      allDependencies.push({
        id: 'load-to-equipment',
        upstream: {
          toolName: 'Load Calculations',
          toolType: 'load-calculation',
          tableName: 'load_calculations',
          latestUpdatedAt: loadLatest,
          itemCount: loadCalcs?.length || 0,
          path: `/design/load-calculation?project=${projectId}`,
        },
        downstream: {
          toolName: 'Equipment Selection',
          toolType: 'equipment-selection',
          tableName: 'equipment_selections',
          createdAt: equipEarliest,
          itemCount: equipmentSelections?.length || 0,
        },
        status: staleness.isStale ? 'stale' : 'synced',
        staleDurationMinutes: staleness.minutesStale,
        staleDurationText: loadLatest ? formatDistanceToNow(new Date(loadLatest), { addSuffix: true }) : '',
        severity: staleness.isStale ? staleness.severity : 'info',
        description: staleness.isStale 
          ? 'Load calculations were updated after equipment was selected. Your equipment sizing may need to be re-evaluated.'
          : 'Equipment selection is in sync with load calculations.',
      });
    }

    // 2. Load Calculation → Ventilation
    if ((loadCalcs?.length || 0) > 0 && (ventilationCalcs?.length || 0) > 0) {
      const staleness = calculateStaleness(loadLatest, ventEarliest);
      allDependencies.push({
        id: 'load-to-ventilation',
        upstream: {
          toolName: 'Load Calculations',
          toolType: 'load-calculation',
          tableName: 'load_calculations',
          latestUpdatedAt: loadLatest,
          itemCount: loadCalcs?.length || 0,
          path: `/design/load-calculation?project=${projectId}`,
        },
        downstream: {
          toolName: 'Ventilation Calculator',
          toolType: 'ventilation',
          tableName: 'ventilation_calculations',
          createdAt: ventEarliest,
          itemCount: ventilationCalcs?.length || 0,
        },
        status: staleness.isStale ? 'stale' : 'synced',
        staleDurationMinutes: staleness.minutesStale,
        staleDurationText: loadLatest ? formatDistanceToNow(new Date(loadLatest), { addSuffix: true }) : '',
        severity: staleness.isStale ? staleness.severity : 'info',
        description: staleness.isStale 
          ? 'Load calculations were updated. Supply air CFM may have changed.'
          : 'Ventilation calculations are in sync with load calculations.',
      });
    }

    // 3. Load Calculation → AHU Configuration
    if ((loadCalcs?.length || 0) > 0 && (ahuConfigs?.length || 0) > 0) {
      const staleness = calculateStaleness(loadLatest, ahuEarliest);
      allDependencies.push({
        id: 'load-to-ahu',
        upstream: {
          toolName: 'Load Calculations',
          toolType: 'load-calculation',
          tableName: 'load_calculations',
          latestUpdatedAt: loadLatest,
          itemCount: loadCalcs?.length || 0,
          path: `/design/load-calculation?project=${projectId}`,
        },
        downstream: {
          toolName: 'AHU Configuration',
          toolType: 'ahu-configuration',
          tableName: 'ahu_configurations',
          createdAt: ahuEarliest,
          itemCount: ahuConfigs?.length || 0,
        },
        status: staleness.isStale ? 'stale' : 'synced',
        staleDurationMinutes: staleness.minutesStale,
        staleDurationText: loadLatest ? formatDistanceToNow(new Date(loadLatest), { addSuffix: true }) : '',
        severity: staleness.isStale ? staleness.severity : 'info',
        description: staleness.isStale 
          ? 'Load calculations were updated. AHU capacity and CFM may need adjustment.'
          : 'AHU configuration is in sync with load calculations.',
      });
    }

    // 4. Equipment Selection → Terminal Units
    if ((equipmentSelections?.length || 0) > 0 && (terminalUnits?.length || 0) > 0) {
      const staleness = calculateStaleness(equipLatest, terminalEarliest);
      allDependencies.push({
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
        status: staleness.isStale ? 'stale' : 'synced',
        staleDurationMinutes: staleness.minutesStale,
        staleDurationText: equipLatest ? formatDistanceToNow(new Date(equipLatest), { addSuffix: true }) : '',
        severity: staleness.isStale ? staleness.severity : 'info',
        description: staleness.isStale 
          ? 'Equipment was updated. Terminal unit sizing may need re-evaluation.'
          : 'Terminal units are in sync with equipment selection.',
      });
    }

    // 5. Terminal Units → Diffuser Selection
    if ((terminalUnits?.length || 0) > 0 && (diffusers?.length || 0) > 0) {
      const staleness = calculateStaleness(terminalLatest, diffuserEarliest);
      allDependencies.push({
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
          itemCount: diffusers?.length || 0,
        },
        status: staleness.isStale ? 'stale' : 'synced',
        staleDurationMinutes: staleness.minutesStale,
        staleDurationText: terminalLatest ? formatDistanceToNow(new Date(terminalLatest), { addSuffix: true }) : '',
        severity: staleness.isStale ? staleness.severity : 'info',
        description: staleness.isStale 
          ? 'Terminal units were updated. Diffuser selections may need review.'
          : 'Diffuser selections are in sync with terminal units.',
      });
    }

    // 6. AHU Configuration → Duct System
    if ((ahuConfigs?.length || 0) > 0 && (ductSystems?.length || 0) > 0) {
      const staleness = calculateStaleness(ahuLatest, ductEarliest);
      allDependencies.push({
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
        status: staleness.isStale ? 'stale' : 'synced',
        staleDurationMinutes: staleness.minutesStale,
        staleDurationText: ahuLatest ? formatDistanceToNow(new Date(ahuLatest), { addSuffix: true }) : '',
        severity: staleness.isStale ? staleness.severity : 'info',
        description: staleness.isStale 
          ? 'AHU configuration was updated. Duct sizing may need adjustment.'
          : 'Duct systems are in sync with AHU configuration.',
      });
    }

    // 7. Duct System → Fan Selection (check if fan selection data exists via duct systems with fan data)
    if ((ductSystems?.length || 0) > 0) {
      const systemsWithFans = ductSystems?.filter(d => d.fan_type) || [];
      if (systemsWithFans.length > 0) {
        allDependencies.push({
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
            tableName: 'duct_systems (fan data)',
            createdAt: ductEarliest,
            itemCount: systemsWithFans.length,
          },
          status: 'synced',
          staleDurationMinutes: 0,
          staleDurationText: '',
          severity: 'info',
          description: 'Fan selections are derived from duct system data.',
        });
      }
    }

    // 8. Pipe System → Pump Selection
    if ((pipeSystems?.length || 0) > 0) {
      const systemsWithPumps = pipeSystems?.filter(p => p.pump_power_hp) || [];
      if (systemsWithPumps.length > 0) {
        allDependencies.push({
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
            tableName: 'pipe_systems (pump data)',
            createdAt: pipeEarliest,
            itemCount: systemsWithPumps.length,
          },
          status: 'synced',
          staleDurationMinutes: 0,
          staleDurationText: '',
          severity: 'info',
          description: 'Pump selections are derived from pipe system data.',
        });
      }
    }

    // ============ Categorize Alerts ============
    
    const criticalAlerts = allDependencies.filter(d => d.status === 'stale' && d.severity === 'critical');
    const warningAlerts = allDependencies.filter(d => d.status === 'stale' && d.severity === 'warning');
    const infoAlerts = allDependencies.filter(d => d.status === 'stale' && d.severity === 'info');
    const syncedDependencies = allDependencies.filter(d => d.status === 'synced');
    
    const staleCount = allDependencies.filter(d => d.status === 'stale').length;
    const syncedCount = syncedDependencies.length;
    const totalDependencies = allDependencies.length;

    // Calculate health score (100 = all synced, 0 = all critical)
    let healthScore = 100;
    if (totalDependencies > 0) {
      const weightedStale = (criticalAlerts.length * 3) + (warningAlerts.length * 2) + (infoAlerts.length * 1);
      const maxWeight = totalDependencies * 3;
      healthScore = Math.max(0, Math.round(100 - (weightedStale / maxWeight) * 100));
    }

    let overallHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalAlerts.length > 0) {
      overallHealth = 'critical';
    } else if (warningAlerts.length > 0) {
      overallHealth = 'warning';
    }

    return {
      allDependencies,
      criticalAlerts,
      warningAlerts,
      infoAlerts,
      syncedDependencies,
      summary: {
        totalDependencies,
        staleCount,
        syncedCount,
        criticalCount: criticalAlerts.length,
        warningCount: warningAlerts.length,
        overallHealth,
        healthScore,
      },
      toolsWithData,
    };
  }, [
    projectId,
    loadCalcs,
    equipmentSelections,
    ventilationCalcs,
    terminalUnits,
    ductSystems,
    pipeSystems,
    ahuConfigs,
    diffusers,
    ervCalcs,
    vrfSystems,
    fanSelections,
    pumpSelections,
    acousticCalcs,
    insulationCalcs,
  ]);

  return {
    ...result,
    isLoading,
  };
}
