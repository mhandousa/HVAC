import { useMemo } from 'react';
import { useTerminalUnitSelectionsByZone, TerminalUnitSelection } from './useTerminalUnitSelections';
import { useDuctSystems, DuctSystem } from './useDuctSystems';
import { usePipeSystems, PipeSystem } from './usePipeSystems';
import { useLoadCalculations, LoadCalculation } from './useLoadCalculations';
import { useSavedVentilationCalcs, VentilationCalculationWithZones } from './useSavedVentilationCalcs';
import { useEquipmentSelections, EquipmentSelection } from './useEquipmentSelections';
import { useAHUConfigurations, AHUConfiguration } from './useAHUConfigurations';
import { useChilledWaterPlants, ChilledWaterPlant } from './useChilledWaterPlants';
import { useHotWaterPlants, HotWaterPlant } from './useHotWaterPlants';
import { useBoilerSelections, BoilerSelection } from './useBoilerSelections';
import { useChillerSelections, ChillerSelection } from './useChillerSelections';

export interface UpstreamTerminalData {
  available: boolean;
  totalCfm: number;
  count: number;
  items: TerminalUnitSelection[];
}

export interface UpstreamDuctData {
  available: boolean;
  systems: DuctSystem[];
  systemsWithoutFan: DuctSystem[];
}

export interface UpstreamPipeData {
  available: boolean;
  systems: PipeSystem[];
  systemsWithoutPump: PipeSystem[];
}

export interface UpstreamLoadData {
  available: boolean;
  totalCoolingTons: number;
  totalHeatingMbh: number;
  totalCfm: number;
  zoneCount: number;
  latestUpdatedAt: string | null;
  items: LoadCalculation[];
}

export interface UpstreamVentilationData {
  available: boolean;
  totalOutdoorAirCfm: number;
  totalSupplyAirCfm: number;
  calculationCount: number;
  items: VentilationCalculationWithZones[];
}

export interface UpstreamEquipmentData {
  available: boolean;
  selectedCount: number;
  totalCapacityTons: number;
  zonesWithEquipment: string[];
  items: EquipmentSelection[];
}

export interface UpstreamAHUData {
  available: boolean;
  ahuCount: number;
  totalDesignCfm: number;
  items: AHUConfiguration[];
}

export interface UpstreamCHWPlantData {
  available: boolean;
  plantCount: number;
  totalCapacityTons: number;
  latestUpdatedAt: string | null;
  items: ChilledWaterPlant[];
}

export interface UpstreamHWPlantData {
  available: boolean;
  plantCount: number;
  totalCapacityMbh: number;
  latestUpdatedAt: string | null;
  items: HotWaterPlant[];
}

export interface UpstreamBoilerData {
  available: boolean;
  selectionCount: number;
  totalCapacityMbh: number;
  items: BoilerSelection[];
}

export interface UpstreamChillerData {
  available: boolean;
  selectionCount: number;
  totalCapacityTons: number;
  totalEvaporatorFlowGpm: number;
  items: ChillerSelection[];
}

export interface UpstreamData {
  terminalUnits: UpstreamTerminalData;
  ductSystems: UpstreamDuctData;
  pipeSystems: UpstreamPipeData;
  loadCalculations: UpstreamLoadData;
  ventilationCalcs: UpstreamVentilationData;
  equipmentSelections: UpstreamEquipmentData;
  ahuConfigurations: UpstreamAHUData;
  chwPlants: UpstreamCHWPlantData;
  hwPlants: UpstreamHWPlantData;
  boilerSelections: UpstreamBoilerData;
  chillerSelections: UpstreamChillerData;
}

export type RecommendationType = 
  | 'terminal-to-diffuser' 
  | 'duct-to-fan' 
  | 'pipe-to-pump'
  | 'load-to-ventilation'
  | 'load-to-equipment'
  | 'load-to-ahu'
  | 'equipment-to-terminal'
  | 'equipment-to-acoustic'
  | 'ahu-to-duct'
  | 'ventilation-to-erv'
  | 'load-to-vrf'
  | 'duct-to-insulation'
  | 'pipe-to-insulation'
  | 'ahu-to-coil'
  | 'ventilation-to-filter'
  | 'load-to-vav'
  | 'load-to-fcu'
  | 'equipment-to-cooling-tower'
  | 'chwplant-to-chiller'
  | 'hwplant-to-boiler'
  | 'boiler-to-hwpump'
  // New data flow types
  | 'vrf-to-acoustic'
  | 'erv-to-ahu'
  | 'diffuser-to-room-acoustics'
  | 'cooling-tower-to-condenser-pump'
  | 'ahu-to-psychrometric'
  | 'chiller-to-cooling-tower';

export interface DataFlowRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  actionLabel: string;
  actionPath: string;
  sourceData: {
    name: string;
    value: string | number;
  };
}

interface UseDesignDataFlowResult {
  data: UpstreamData | null;
  isLoading: boolean;
  getRecommendations: (currentTool: string) => DataFlowRecommendation[];
}

export function useDesignDataFlow(
  projectId?: string | null,
  zoneId?: string | null
): UseDesignDataFlowResult {
  // Fetch terminal units for the zone
  const { 
    data: terminalUnits, 
    isLoading: loadingTerminalUnits 
  } = useTerminalUnitSelectionsByZone(zoneId || undefined);
  
  // Fetch duct systems for the project
  const { 
    data: ductSystems, 
    isLoading: loadingDuctSystems 
  } = useDuctSystems(projectId || undefined);
  
  // Fetch pipe systems for the project
  const { 
    data: pipeSystems, 
    isLoading: loadingPipeSystems 
  } = usePipeSystems(projectId || undefined);

  // NEW: Fetch load calculations
  const {
    data: loadCalcs,
    isLoading: loadingLoads,
  } = useLoadCalculations(projectId || undefined);

  // NEW: Fetch ventilation calculations
  const {
    calculations: ventilationCalcs,
    isLoading: loadingVentilation,
  } = useSavedVentilationCalcs(projectId || undefined);

  // NEW: Fetch equipment selections
  const {
    data: equipmentSelections,
    isLoading: loadingEquipment,
  } = useEquipmentSelections(projectId || undefined);

  // NEW: Fetch AHU configurations
  const {
    data: ahuConfigs,
    isLoading: loadingAHU,
  } = useAHUConfigurations(projectId || undefined);

  // NEW: Fetch CHW Plants
  const {
    data: chwPlants,
    isLoading: loadingCHWPlants,
  } = useChilledWaterPlants(projectId || undefined);

  // NEW: Fetch HW Plants
  const {
    data: hwPlants,
    isLoading: loadingHWPlants,
  } = useHotWaterPlants(projectId || undefined);

  // NEW: Fetch Boiler Selections
  const {
    data: boilerSelections,
    isLoading: loadingBoilers,
  } = useBoilerSelections(projectId || undefined);

  // NEW: Fetch Chiller Selections for evaporator flow (DF-01)
  const {
    data: chillerSelections,
    isLoading: loadingChillers,
  } = useChillerSelections(projectId || undefined);

  const isLoading = loadingTerminalUnits || loadingDuctSystems || loadingPipeSystems ||
                    loadingLoads || loadingVentilation || loadingEquipment || loadingAHU || 
                    loadingCHWPlants || loadingHWPlants || loadingBoilers || loadingChillers;

  const data = useMemo((): UpstreamData | null => {
    if (isLoading) return null;

    // Calculate terminal unit totals
    const terminalUnitsCfm = terminalUnits?.reduce(
      (sum, tu) => sum + (tu.supply_cfm || 0) * tu.quantity,
      0
    ) || 0;

    // Find duct systems that could use fan selection
    const systemsWithoutFan = ductSystems?.filter(
      ds => ds.total_airflow_cfm && ds.system_static_pressure_pa && !ds.fan_type
    ) || [];

    // Find pipe systems that could use pump selection
    const systemsWithoutPump = pipeSystems?.filter(
      ps => ps.total_flow_gpm && ps.system_head_ft
    ) || [];

    // Calculate load totals
    const totalCoolingBtuh = loadCalcs?.reduce((sum, lc) => sum + (lc.cooling_load_btuh || 0), 0) || 0;
    const totalHeatingBtuh = loadCalcs?.reduce((sum, lc) => sum + (lc.heating_load_btuh || 0), 0) || 0;
    const totalLoadCfm = loadCalcs?.reduce((sum, lc) => sum + (lc.cfm_required || 0), 0) || 0;
    const loadLatestUpdated = loadCalcs?.length 
      ? loadCalcs.reduce((latest, lc) => {
          const lcDate = lc.updated_at ? new Date(lc.updated_at).getTime() : 0;
          return lcDate > latest ? lcDate : latest;
        }, 0)
      : null;

    // Calculate ventilation totals
    const totalOutdoorAirCfm = ventilationCalcs?.reduce(
      (sum, vc) => sum + (vc.system_outdoor_air_cfm || 0), 0
    ) || 0;
    const totalSupplyAirCfm = ventilationCalcs?.reduce(
      (sum, vc) => sum + (vc.supply_air_cfm || 0), 0
    ) || 0;

    // Calculate equipment totals
    const equipmentCapacity = equipmentSelections?.reduce((sum, es) => {
      const selected = es.selected_equipment;
      if (selected && typeof selected === 'object' && 'cooling_capacity_tons' in selected) {
        return sum + (Number((selected as Record<string, unknown>).cooling_capacity_tons) || 0);
      }
      return sum;
    }, 0) || 0;
    const zonesWithEquipment = equipmentSelections?.map(es => es.zone_id).filter(Boolean) as string[] || [];

    // Calculate AHU totals
    const totalAhuCfm = ahuConfigs?.reduce((sum, ahu) => sum + (ahu.designCfm || 0), 0) || 0;

    // Calculate CHW Plant totals
    const totalPlantCapacityTons = chwPlants?.reduce((sum, p) => sum + (p.design_cooling_load_tons || 0), 0) || 0;
    const plantLatestUpdated = chwPlants?.length 
      ? chwPlants.reduce((latest, p) => {
          const pDate = p.updated_at ? new Date(p.updated_at).getTime() : 0;
          return pDate > latest ? pDate : latest;
        }, 0)
      : null;

    // Calculate HW Plant totals (heating_load_btuh in BTUH, convert to MBH)
    const totalHWPlantCapacityMbh = hwPlants?.reduce((sum, p) => sum + ((p.heating_load_btuh || 0) / 1000), 0) || 0;
    const hwPlantLatestUpdated = hwPlants?.length 
      ? hwPlants.reduce((latest, p) => {
          const pDate = p.updated_at ? new Date(p.updated_at).getTime() : 0;
          return pDate > latest ? pDate : latest;
        }, 0)
      : null;

    // Calculate Boiler Selection totals (selected_capacity_btuh in BTUH, convert to MBH)
    const totalBoilerCapacityMbh = boilerSelections?.reduce((sum, b) => sum + ((b.selected_capacity_btuh || 0) / 1000), 0) || 0;

    // DF-01: Calculate Chiller Selection totals for pump flow
    const totalChillerCapacityTons = chillerSelections?.reduce(
      (sum, c) => sum + (c.rated_capacity_tons || 0), 0
    ) || 0;
    // Standard evaporator flow = 2.4 GPM/ton for CHW
    const totalEvaporatorFlowGpm = totalChillerCapacityTons * 2.4;

    return {
      terminalUnits: {
        available: (terminalUnits?.length || 0) > 0,
        totalCfm: terminalUnitsCfm,
        count: terminalUnits?.length || 0,
        items: terminalUnits || [],
      },
      ductSystems: {
        available: (ductSystems?.length || 0) > 0,
        systems: ductSystems || [],
        systemsWithoutFan,
      },
      pipeSystems: {
        available: (pipeSystems?.length || 0) > 0,
        systems: pipeSystems || [],
        systemsWithoutPump,
      },
      loadCalculations: {
        available: (loadCalcs?.length || 0) > 0,
        totalCoolingTons: totalCoolingBtuh / 12000,
        totalHeatingMbh: totalHeatingBtuh / 1000,
        totalCfm: totalLoadCfm,
        zoneCount: loadCalcs?.length || 0,
        latestUpdatedAt: loadLatestUpdated ? new Date(loadLatestUpdated).toISOString() : null,
        items: loadCalcs || [],
      },
      ventilationCalcs: {
        available: (ventilationCalcs?.length || 0) > 0,
        totalOutdoorAirCfm,
        totalSupplyAirCfm,
        calculationCount: ventilationCalcs?.length || 0,
        items: ventilationCalcs || [],
      },
      equipmentSelections: {
        available: (equipmentSelections?.length || 0) > 0,
        selectedCount: equipmentSelections?.length || 0,
        totalCapacityTons: equipmentCapacity,
        zonesWithEquipment,
        items: equipmentSelections || [],
      },
      ahuConfigurations: {
        available: (ahuConfigs?.length || 0) > 0,
        ahuCount: ahuConfigs?.length || 0,
        totalDesignCfm: totalAhuCfm,
        items: ahuConfigs || [],
      },
      chwPlants: {
        available: (chwPlants?.length || 0) > 0,
        plantCount: chwPlants?.length || 0,
        totalCapacityTons: totalPlantCapacityTons,
        latestUpdatedAt: plantLatestUpdated ? new Date(plantLatestUpdated).toISOString() : null,
        items: chwPlants || [],
      },
      hwPlants: {
        available: (hwPlants?.length || 0) > 0,
        plantCount: hwPlants?.length || 0,
        totalCapacityMbh: totalHWPlantCapacityMbh,
        latestUpdatedAt: hwPlantLatestUpdated ? new Date(hwPlantLatestUpdated).toISOString() : null,
        items: hwPlants || [],
      },
      boilerSelections: {
        available: (boilerSelections?.length || 0) > 0,
        selectionCount: boilerSelections?.length || 0,
        totalCapacityMbh: totalBoilerCapacityMbh,
        items: boilerSelections || [],
      },
      chillerSelections: {
        available: (chillerSelections?.length || 0) > 0,
        selectionCount: chillerSelections?.length || 0,
        totalCapacityTons: totalChillerCapacityTons,
        totalEvaporatorFlowGpm: totalEvaporatorFlowGpm,
        items: chillerSelections || [],
      },
    };
  }, [terminalUnits, ductSystems, pipeSystems, loadCalcs, ventilationCalcs, equipmentSelections, ahuConfigs, chwPlants, hwPlants, boilerSelections, chillerSelections, isLoading]);

  const getRecommendations = (currentTool: string): DataFlowRecommendation[] => {
    if (!data || !projectId) return [];
    
    const recommendations: DataFlowRecommendation[] = [];

    // ============ NEW: Load → Ventilation ============
    if (
      currentTool.includes('ventilation') && 
      data.loadCalculations.available &&
      data.loadCalculations.totalCfm > 0
    ) {
      recommendations.push({
        id: 'load-to-ventilation',
        type: 'load-to-ventilation',
        title: 'Load Calculation Data Available',
        description: `Import supply air from load calcs: ${data.loadCalculations.totalCfm.toLocaleString()} CFM across ${data.loadCalculations.zoneCount} zones`,
        actionLabel: 'Import Supply CFM',
        actionPath: `/design/ventilation-calculator?project=${projectId}`,
        sourceData: {
          name: 'Total Supply CFM',
          value: data.loadCalculations.totalCfm,
        },
      });
    }

    // ============ NEW: Load → Equipment ============
    if (
      currentTool.includes('equipment') && 
      data.loadCalculations.available &&
      data.loadCalculations.totalCoolingTons > 0
    ) {
      recommendations.push({
        id: 'load-to-equipment',
        type: 'load-to-equipment',
        title: 'Load Data Ready for Equipment Selection',
        description: `Select equipment for ${data.loadCalculations.totalCoolingTons.toFixed(1)} tons cooling / ${data.loadCalculations.totalHeatingMbh.toFixed(0)} MBH heating`,
        actionLabel: 'Start Selection',
        actionPath: `/design/equipment-selection?project=${projectId}`,
        sourceData: {
          name: 'Required Capacity',
          value: `${data.loadCalculations.totalCoolingTons.toFixed(1)} tons`,
        },
      });
    }

    // ============ NEW: Load → AHU Configuration ============
    if (
      currentTool.includes('ahu') && 
      data.loadCalculations.available &&
      data.loadCalculations.totalCfm > 0
    ) {
      recommendations.push({
        id: 'load-to-ahu',
        type: 'load-to-ahu',
        title: 'Load Data Available for AHU Sizing',
        description: `Configure AHU for ${data.loadCalculations.totalCfm.toLocaleString()} CFM total system airflow`,
        actionLabel: 'Import Airflow',
        actionPath: `/design/ahu-configuration?project=${projectId}`,
        sourceData: {
          name: 'Total System CFM',
          value: data.loadCalculations.totalCfm,
        },
      });
    }

    // ============ NEW: Equipment → Terminal Units ============
    if (
      currentTool.includes('terminal') && 
      data.equipmentSelections.available &&
      data.equipmentSelections.totalCapacityTons > 0
    ) {
      recommendations.push({
        id: 'equipment-to-terminal',
        type: 'equipment-to-terminal',
        title: 'Equipment Capacity Available',
        description: `Size terminals for ${data.equipmentSelections.totalCapacityTons.toFixed(1)} tons across ${data.equipmentSelections.selectedCount} selections`,
        actionLabel: 'Import Capacity',
        actionPath: `/design/terminal-unit-sizing?project=${projectId}`,
        sourceData: {
          name: 'Total Capacity',
          value: `${data.equipmentSelections.totalCapacityTons.toFixed(1)} tons`,
        },
      });
    }

    // ============ NEW: Equipment → Acoustic Analysis ============
    if (
      currentTool.includes('acoustic') && 
      data.equipmentSelections.available &&
      data.equipmentSelections.selectedCount > 0
    ) {
      recommendations.push({
        id: 'equipment-to-acoustic',
        type: 'equipment-to-acoustic',
        title: 'Equipment Data Available',
        description: `Analyze NC levels for ${data.equipmentSelections.selectedCount} equipment selection(s)`,
        actionLabel: 'Import Equipment Data',
        actionPath: `/design/acoustic-calculator?project=${projectId}`,
        sourceData: {
          name: 'Equipment Selections',
          value: data.equipmentSelections.selectedCount,
        },
      });
    }

    // ============ NEW: AHU → Duct Sizing ============
    if (
      currentTool.includes('duct') && 
      data.ahuConfigurations.available &&
      data.ahuConfigurations.totalDesignCfm > 0
    ) {
      const ahu = data.ahuConfigurations.items[0];
      recommendations.push({
        id: `ahu-to-duct-${ahu?.id || 'main'}`,
        type: 'ahu-to-duct',
        title: 'AHU Design Data Available',
        description: `Start duct design from ${ahu?.ahuTag || 'AHU'}: ${ahu?.designCfm?.toLocaleString() || data.ahuConfigurations.totalDesignCfm.toLocaleString()} CFM`,
        actionLabel: 'Create Duct System',
        actionPath: `/design/duct-designer?project=${projectId}${ahu ? `&ahu=${ahu.id}` : ''}`,
        sourceData: {
          name: ahu?.ahuTag || 'Total AHU CFM',
          value: `${ahu?.designCfm || data.ahuConfigurations.totalDesignCfm} CFM`,
        },
      });
    }

    // ============ NEW: Ventilation → ERV ============
    if (
      currentTool.includes('erv') && 
      data.ventilationCalcs.available &&
      data.ventilationCalcs.totalOutdoorAirCfm > 500
    ) {
      recommendations.push({
        id: 'ventilation-to-erv',
        type: 'ventilation-to-erv',
        title: 'Outdoor Air Data Available',
        description: `Size ERV for ${data.ventilationCalcs.totalOutdoorAirCfm.toLocaleString()} CFM outdoor air`,
        actionLabel: 'Import OA CFM',
        actionPath: `/design/erv-sizing?project=${projectId}`,
        sourceData: {
          name: 'Outdoor Air CFM',
          value: data.ventilationCalcs.totalOutdoorAirCfm,
        },
      });
    }

    // Terminal Units → Diffuser Selection
    if (
      currentTool.includes('diffuser') && 
      data.terminalUnits.available && 
      data.terminalUnits.totalCfm > 0
    ) {
      recommendations.push({
        id: 'terminal-to-diffuser',
        type: 'terminal-to-diffuser',
        title: 'Terminal Unit Data Available',
        description: `Import ${data.terminalUnits.totalCfm.toLocaleString()} CFM from ${data.terminalUnits.count} terminal unit(s)`,
        actionLabel: 'Import CFM',
        actionPath: `/design/diffuser-selection?project=${projectId}${zoneId ? `&zone=${zoneId}` : ''}`,
        sourceData: {
          name: 'Total Supply CFM',
          value: data.terminalUnits.totalCfm,
        },
      });
    }

    // Duct System → Fan Selection
    if (
      currentTool.includes('fan') && 
      data.ductSystems.systemsWithoutFan.length > 0
    ) {
      const system = data.ductSystems.systemsWithoutFan[0];
      recommendations.push({
        id: `duct-to-fan-${system.id}`,
        type: 'duct-to-fan',
        title: 'Duct System Ready for Fan Selection',
        description: `${system.system_name}: ${system.total_airflow_cfm?.toLocaleString()} CFM @ ${((system.system_static_pressure_pa || 0) / 249.09).toFixed(2)}" w.g.`,
        actionLabel: 'Select Fan',
        actionPath: `/design/fan-selection?project=${projectId}&system=${system.id}`,
        sourceData: {
          name: system.system_name,
          value: `${system.total_airflow_cfm} CFM`,
        },
      });
    }

    // Pipe System → Pump Selection
    if (
      currentTool.includes('pump') && 
      data.pipeSystems.systemsWithoutPump.length > 0
    ) {
      const system = data.pipeSystems.systemsWithoutPump[0];
      recommendations.push({
        id: `pipe-to-pump-${system.id}`,
        type: 'pipe-to-pump',
        title: 'Pipe System Ready for Pump Selection',
        description: `${system.system_name}: ${system.total_flow_gpm?.toLocaleString()} GPM @ ${system.system_head_ft?.toFixed(1)} ft head`,
        actionLabel: 'Select Pump',
        actionPath: `/design/pump-selection?project=${projectId}&system=${system.id}`,
        sourceData: {
          name: system.system_name,
          value: `${system.total_flow_gpm} GPM`,
        },
      });
    }

    // Show recommendations on source tools too (Duct Designer → Fan Selection)
    if (
      currentTool.includes('duct-designer') && 
      data.ductSystems.systemsWithoutFan.length > 0
    ) {
      data.ductSystems.systemsWithoutFan.forEach(system => {
        recommendations.push({
          id: `duct-to-fan-${system.id}`,
          type: 'duct-to-fan',
          title: 'Ready for Fan Selection',
          description: `Continue to select a fan for ${system.system_name}`,
          actionLabel: 'Select Fan',
          actionPath: `/design/fan-selection?project=${projectId}&system=${system.id}`,
          sourceData: {
            name: system.system_name,
            value: `${system.total_airflow_cfm} CFM @ ${((system.system_static_pressure_pa || 0) / 249.09).toFixed(2)}" w.g.`,
          },
        });
      });
    }

    // Show recommendations on source tools too (Pipe Designer → Pump Selection)
    if (
      currentTool.includes('pipe-designer') && 
      data.pipeSystems.systemsWithoutPump.length > 0
    ) {
      data.pipeSystems.systemsWithoutPump.forEach(system => {
        recommendations.push({
          id: `pipe-to-pump-${system.id}`,
          type: 'pipe-to-pump',
          title: 'Ready for Pump Selection',
          description: `Continue to select a pump for ${system.system_name}`,
          actionLabel: 'Select Pump',
          actionPath: `/design/pump-selection?project=${projectId}&system=${system.id}`,
          sourceData: {
            name: system.system_name,
            value: `${system.total_flow_gpm} GPM @ ${system.system_head_ft?.toFixed(1)} ft`,
          },
        });
      });
    }

    // Show load data recommendations on load calculator completion
    if (
      currentTool.includes('load-calculator') && 
      data.loadCalculations.available &&
      data.loadCalculations.totalCoolingTons > 0
    ) {
      recommendations.push({
        id: 'load-complete-to-ventilation',
        type: 'load-to-ventilation',
        title: 'Continue to Ventilation',
        description: `Configure ventilation for ${data.loadCalculations.zoneCount} zones`,
        actionLabel: 'Open Ventilation Calculator',
        actionPath: `/design/ventilation-calculator?project=${projectId}`,
        sourceData: {
          name: 'Zones Ready',
          value: data.loadCalculations.zoneCount,
        },
      });
      
      recommendations.push({
        id: 'load-complete-to-equipment',
        type: 'load-to-equipment',
        title: 'Continue to Equipment Selection',
        description: `Select equipment for ${data.loadCalculations.totalCoolingTons.toFixed(1)} tons cooling load`,
        actionLabel: 'Open Equipment Selection',
        actionPath: `/design/equipment-selection?project=${projectId}`,
        sourceData: {
          name: 'Cooling Load',
          value: `${data.loadCalculations.totalCoolingTons.toFixed(1)} tons`,
        },
      });
    }

    // ============ NEW: Load → VRF ============
    if (
      currentTool.includes('vrf') && 
      data.loadCalculations.available &&
      data.loadCalculations.totalCoolingTons > 0
    ) {
      recommendations.push({
        id: 'load-to-vrf',
        type: 'load-to-vrf',
        title: 'Load Data Available for VRF',
        description: `Size VRF system for ${data.loadCalculations.totalCoolingTons.toFixed(1)} tons across ${data.loadCalculations.zoneCount} zones`,
        actionLabel: 'Import Zone Loads',
        actionPath: `/design/vrf-designer?project=${projectId}`,
        sourceData: {
          name: 'Total Cooling',
          value: `${data.loadCalculations.totalCoolingTons.toFixed(1)} tons`,
        },
      });
    }

    // ============ NEW: Duct → Insulation ============
    if (
      currentTool.includes('insulation') && 
      data.ductSystems.available &&
      data.ductSystems.systems.length > 0
    ) {
      recommendations.push({
        id: 'duct-to-insulation',
        type: 'duct-to-insulation',
        title: 'Duct System Data Available',
        description: `Calculate insulation for ${data.ductSystems.systems.length} duct system(s)`,
        actionLabel: 'Import Duct Data',
        actionPath: `/design/insulation-calculator?project=${projectId}`,
        sourceData: {
          name: 'Duct Systems',
          value: data.ductSystems.systems.length,
        },
      });
    }

    // ============ NEW: Pipe → Insulation ============
    if (
      currentTool.includes('insulation') && 
      data.pipeSystems.available &&
      data.pipeSystems.systems.length > 0
    ) {
      recommendations.push({
        id: 'pipe-to-insulation',
        type: 'pipe-to-insulation',
        title: 'Pipe System Data Available',
        description: `Calculate insulation for ${data.pipeSystems.systems.length} pipe system(s)`,
        actionLabel: 'Import Pipe Data',
        actionPath: `/design/insulation-calculator?project=${projectId}`,
        sourceData: {
          name: 'Pipe Systems',
          value: data.pipeSystems.systems.length,
        },
      });
    }

    // ============ NEW: AHU → Coil Selection ============
    if (
      currentTool.includes('coil-selection') && 
      data.ahuConfigurations.available &&
      data.ahuConfigurations.totalDesignCfm > 0
    ) {
      recommendations.push({
        id: 'ahu-to-coil',
        type: 'ahu-to-coil',
        title: 'AHU Configuration Data Available',
        description: `Size coils for ${data.ahuConfigurations.totalDesignCfm.toLocaleString()} CFM across ${data.ahuConfigurations.ahuCount} AHU(s)`,
        actionLabel: 'Import AHU Data',
        actionPath: `/design/coil-selection?project=${projectId}`,
        sourceData: {
          name: 'Total AHU CFM',
          value: data.ahuConfigurations.totalDesignCfm,
        },
      });
    }

    // ============ NEW: Ventilation → Filter Selection ============
    if (
      currentTool.includes('filter-selection') && 
      data.ventilationCalcs.available &&
      data.ventilationCalcs.totalSupplyAirCfm > 0
    ) {
      recommendations.push({
        id: 'ventilation-to-filter',
        type: 'ventilation-to-filter',
        title: 'Ventilation Data Available',
        description: `Size filters for ${data.ventilationCalcs.totalSupplyAirCfm.toLocaleString()} CFM supply air`,
        actionLabel: 'Import Airflow',
        actionPath: `/design/filter-selection?project=${projectId}`,
        sourceData: {
          name: 'Supply Air CFM',
          value: data.ventilationCalcs.totalSupplyAirCfm,
        },
      });
    }

    // ============ NEW: Load → VAV Box Selection ============
    if (
      currentTool.includes('vav-box-selection') && 
      data.loadCalculations.available &&
      data.loadCalculations.totalCfm > 0
    ) {
      recommendations.push({
        id: 'load-to-vav',
        type: 'load-to-vav',
        title: 'Load Calculation Data Ready',
        description: `Size VAV boxes for ${data.loadCalculations.totalCfm.toLocaleString()} CFM across ${data.loadCalculations.zoneCount} zones`,
        actionLabel: 'Import Zone CFM',
        actionPath: `/design/vav-box-selection?project=${projectId}`,
        sourceData: {
          name: 'Total Zone CFM',
          value: data.loadCalculations.totalCfm,
        },
      });
    }

    // ============ NEW: Load → FCU Selection ============
    if (
      currentTool.includes('fcu-selection') && 
      data.loadCalculations.available &&
      data.loadCalculations.totalCoolingTons > 0
    ) {
      recommendations.push({
        id: 'load-to-fcu',
        type: 'load-to-fcu',
        title: 'Load Calculation Data Ready',
        description: `Size FCUs for ${data.loadCalculations.totalCoolingTons.toFixed(1)} tons cooling across ${data.loadCalculations.zoneCount} zones`,
        actionLabel: 'Import Zone Loads',
        actionPath: `/design/fcu-selection?project=${projectId}`,
        sourceData: {
          name: 'Total Cooling Load',
          value: `${data.loadCalculations.totalCoolingTons.toFixed(1)} tons`,
        },
      });
    }

    // ============ NEW: Equipment → Cooling Tower ============
    if (
      currentTool.includes('cooling-tower') && 
      data.equipmentSelections.available &&
      data.equipmentSelections.totalCapacityTons > 0
    ) {
      // Heat rejection = cooling capacity * 1.25 (typical compressor heat factor)
      const heatRejectionTons = data.equipmentSelections.totalCapacityTons * 1.25;
      recommendations.push({
        id: 'equipment-to-cooling-tower',
        type: 'equipment-to-cooling-tower',
        title: 'Equipment Capacity Data Available',
        description: `Size cooling tower for ${heatRejectionTons.toFixed(0)} tons heat rejection`,
        actionLabel: 'Import Capacity',
        actionPath: `/design/cooling-tower-sizing?project=${projectId}`,
        sourceData: {
          name: 'Heat Rejection',
          value: `${heatRejectionTons.toFixed(0)} tons`,
        },
      });
    }

    // ============ NEW: CHW Plant → Chiller Selection ============
    if (
      currentTool.includes('chiller-selection') && 
      data.chwPlants.available &&
      data.chwPlants.totalCapacityTons > 0
    ) {
      recommendations.push({
        id: 'chwplant-to-chiller',
        type: 'chwplant-to-chiller',
        title: 'CHW Plant Sizing Data Available',
        description: `Import requirements from ${data.chwPlants.plantCount} plant(s): ${data.chwPlants.totalCapacityTons.toFixed(0)} tons total capacity`,
        actionLabel: 'Import Plant Data',
        actionPath: `/design/chiller-selection?project=${projectId}`,
        sourceData: {
          name: 'Total Capacity',
          value: `${data.chwPlants.totalCapacityTons.toFixed(0)} tons`,
        },
      });
    }

    // ============ NEW: HW Plant → Boiler Selection ============
    if (
      currentTool.includes('boiler-selection') && 
      data.hwPlants.available &&
      data.hwPlants.totalCapacityMbh > 0
    ) {
      recommendations.push({
        id: 'hwplant-to-boiler',
        type: 'hwplant-to-boiler',
        title: 'HW Plant Sizing Data Available',
        description: `Import requirements from ${data.hwPlants.plantCount} plant(s): ${data.hwPlants.totalCapacityMbh.toFixed(0)} MBH total heating load`,
        actionLabel: 'Import Plant Data',
        actionPath: `/design/boiler-selection?project=${projectId}`,
        sourceData: {
          name: 'Total Heating Load',
          value: `${data.hwPlants.totalCapacityMbh.toFixed(0)} MBH`,
        },
      });
    }

    // ============ DF-02: Boiler → HW Pump Selection (Enhanced) ============
    if (
      currentTool.includes('pump') && 
      data.boilerSelections.available &&
      data.boilerSelections.totalCapacityMbh > 0
    ) {
      // Calculate flow: GPM = MBH * 1000 / (500 * ΔT), typical ΔT = 20°F
      const hwDeltaT = 20;
      const hwFlowGpm = (data.boilerSelections.totalCapacityMbh * 1000) / (500 * hwDeltaT);
      recommendations.push({
        id: 'boiler-to-hwpump',
        type: 'boiler-to-hwpump',
        title: 'Boiler Selection Data Available',
        description: `Size HW pumps for ${hwFlowGpm.toFixed(0)} GPM from ${data.boilerSelections.selectionCount} boiler(s) @ ${hwDeltaT}°F ΔT`,
        actionLabel: 'Import Boiler Flow',
        actionPath: `/design/pump-selection?project=${projectId}&type=hw`,
        sourceData: {
          name: 'HW Flow',
          value: `${hwFlowGpm.toFixed(0)} GPM`,
        },
      });
    }

    // ============ DF-01: Chiller Evaporator Flow → CHW Pump Selection ============
    if (
      currentTool.includes('pump') && 
      data.chillerSelections?.available &&
      data.chillerSelections.totalEvaporatorFlowGpm > 0
    ) {
      recommendations.push({
        id: 'chiller-to-chwpump',
        type: 'pipe-to-pump',
        title: 'Chiller Evaporator Flow Data Available',
        description: `Size CHW pump for ${data.chillerSelections.totalEvaporatorFlowGpm.toFixed(0)} GPM from ${data.chillerSelections.selectionCount} chiller(s) @ 2.4 GPM/ton`,
        actionLabel: 'Import Evaporator Flow',
        actionPath: `/design/pump-selection?project=${projectId}&type=chw`,
        sourceData: {
          name: 'Evaporator Flow',
          value: `${data.chillerSelections.totalEvaporatorFlowGpm.toFixed(0)} GPM`,
        },
      });
    }

    // ============ DF-06: Terminal Unit Reheat → HW Plant Sizing ============
    if (
      currentTool.includes('hw-plant') || currentTool.includes('hot-water-plant')
    ) {
      // Calculate total reheat load from terminal units (hot water coil capacity)
      const terminalReheatBtuh = data.terminalUnits?.items?.reduce(
        (sum, tu) => sum + ((tu.hw_coil_capacity_btuh || 0) * (tu.quantity || 1)), 0
      ) || 0;
      
      if (terminalReheatBtuh > 0) {
        const reheatMbh = terminalReheatBtuh / 1000;
        recommendations.push({
          id: 'terminal-to-hwplant',
          type: 'load-to-equipment',
          title: 'Terminal Unit Reheat Data Available',
          description: `Include ${reheatMbh.toFixed(0)} MBH terminal reheat in HW plant sizing from ${data.terminalUnits.count} terminal unit(s)`,
          actionLabel: 'Import Reheat Load',
          actionPath: `/design/hot-water-plant?project=${projectId}`,
          sourceData: {
            name: 'Terminal Reheat',
            value: `${reheatMbh.toFixed(0)} MBH`,
          },
        });
      }
    }

    // ============ NEW: VRF → Acoustic Analysis ============
    if (
      currentTool.includes('acoustic') && 
      (currentTool.includes('vrf') || currentTool.includes('room'))
    ) {
      // Check if we have VRF systems defined (would need to add VRF hook)
      // For now, show recommendation when on acoustic tools
      recommendations.push({
        id: 'vrf-to-acoustic',
        type: 'vrf-to-acoustic',
        title: 'VRF Outdoor Unit Acoustic Analysis',
        description: 'Analyze VRF outdoor unit noise contribution to property line and adjacent spaces',
        actionLabel: 'Add VRF Source',
        actionPath: `/design/acoustic-calculator?project=${projectId}&source=vrf`,
        sourceData: {
          name: 'VRF Analysis',
          value: 'Required',
        },
      });
    }

    // ============ NEW: ERV → AHU (Pressure Drop Import) ============
    if (
      currentTool.includes('ahu') && 
      data.ventilationCalcs.available &&
      data.ventilationCalcs.totalOutdoorAirCfm > 500
    ) {
      recommendations.push({
        id: 'erv-to-ahu',
        type: 'erv-to-ahu',
        title: 'ERV Pressure Drop Data',
        description: `Include ERV pressure drop in AHU static pressure design for ${data.ventilationCalcs.totalOutdoorAirCfm.toLocaleString()} CFM OA`,
        actionLabel: 'Import ERV Data',
        actionPath: `/design/ahu-configuration?project=${projectId}&include_erv=true`,
        sourceData: {
          name: 'Outdoor Air CFM',
          value: data.ventilationCalcs.totalOutdoorAirCfm,
        },
      });
    }

    // ============ NEW: Diffuser → Room Acoustics ============
    if (
      currentTool.includes('acoustic') && 
      data.terminalUnits.available &&
      data.terminalUnits.count > 0
    ) {
      recommendations.push({
        id: 'diffuser-to-room-acoustics',
        type: 'diffuser-to-room-acoustics',
        title: 'Diffuser NC Data Available',
        description: `Import diffuser NC ratings from ${data.terminalUnits.count} terminal zones for room acoustic analysis`,
        actionLabel: 'Import Diffuser NC',
        actionPath: `/design/acoustic-calculator?project=${projectId}&source=diffuser`,
        sourceData: {
          name: 'Terminal Zones',
          value: data.terminalUnits.count,
        },
      });
    }

    // ============ NEW: AHU → Psychrometric ============
    if (
      currentTool.includes('psychrometric') && 
      data.ahuConfigurations.available &&
      data.ahuConfigurations.ahuCount > 0
    ) {
      const ahu = data.ahuConfigurations.items[0];
      recommendations.push({
        id: 'ahu-to-psychrometric',
        type: 'ahu-to-psychrometric',
        title: 'AHU Conditions Available',
        description: `Import entering/leaving conditions from ${ahu?.ahuTag || 'AHU'} for psychrometric analysis`,
        actionLabel: 'Import Conditions',
        actionPath: `/design/psychrometric?project=${projectId}${ahu ? `&ahu=${ahu.id}` : ''}`,
        sourceData: {
          name: 'AHU',
          value: ahu?.ahuTag || `${data.ahuConfigurations.ahuCount} unit(s)`,
        },
      });
    }

    // ============ NEW: Chiller → Cooling Tower (Heat Rejection) ============
    if (
      currentTool.includes('cooling-tower') && 
      data.chwPlants.available &&
      data.chwPlants.totalCapacityTons > 0
    ) {
      // Heat rejection = chiller capacity / COP * (COP + 1) ≈ 1.25 × capacity
      const heatRejectionTons = data.chwPlants.totalCapacityTons * 1.25;
      recommendations.push({
        id: 'chiller-to-cooling-tower',
        type: 'chiller-to-cooling-tower',
        title: 'Chiller Heat Rejection Data',
        description: `Size cooling tower for ${heatRejectionTons.toFixed(0)} tons heat rejection from ${data.chwPlants.totalCapacityTons.toFixed(0)} ton chiller plant`,
        actionLabel: 'Import Heat Rejection',
        actionPath: `/design/cooling-tower?project=${projectId}`,
        sourceData: {
          name: 'Heat Rejection',
          value: `${heatRejectionTons.toFixed(0)} tons`,
        },
      });
    }

    // ============ NEW: Cooling Tower → Condenser Water Pump ============
    if (
      currentTool.includes('pump') && 
      data.chwPlants.available &&
      data.chwPlants.totalCapacityTons > 0
    ) {
      // Condenser water flow = 3 GPM/ton typical
      const condenserFlowGpm = data.chwPlants.totalCapacityTons * 3;
      recommendations.push({
        id: 'cooling-tower-to-condenser-pump',
        type: 'cooling-tower-to-condenser-pump',
        title: 'Condenser Water Pump Sizing',
        description: `Size CW pump for ${condenserFlowGpm.toFixed(0)} GPM based on ${data.chwPlants.totalCapacityTons.toFixed(0)} ton plant capacity`,
        actionLabel: 'Import CW Flow',
        actionPath: `/design/pump-selection?project=${projectId}&type=cw`,
        sourceData: {
          name: 'Condenser Flow',
          value: `${condenserFlowGpm.toFixed(0)} GPM`,
        },
      });
    }

    return recommendations;
  };

  return {
    data,
    isLoading,
    getRecommendations,
  };
}
