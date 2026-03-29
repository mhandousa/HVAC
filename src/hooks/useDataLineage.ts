import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type LineageNodeType = 
  | 'load_calculation' 
  | 'equipment_selection' 
  | 'terminal_unit' 
  | 'duct_system' 
  | 'pipe_system' 
  | 'ahu_configuration'
  | 'acoustic_analysis'
  | 'cost_estimate'
  // Plant equipment nodes
  | 'chiller_selection'
  | 'boiler_selection'
  | 'cooling_tower_selection'
  | 'chw_plant'
  | 'hw_plant'
  | 'erv_sizing'
  | 'vrf_system'
  // Phase 18 specialty equipment nodes
  | 'economizer_selection'
  | 'silencer_selection'
  | 'expansion_tank_selection'
  | 'control_valve_selection'
  | 'vibration_isolation_selection'
  // Compliance nodes
  | 'smoke_control'
  | 'insulation_calculation'
  | 'ventilation_calculation'
  | 'sbc_compliance'
  | 'ashrae_compliance';

export interface LineageNode {
  id: string;
  type: LineageNodeType;
  name: string;
  updatedAt: string;
  zoneId?: string;
  zoneName?: string;
  values?: Record<string, number | string>;
}

export interface LineageEdge {
  from: string;
  to: string;
  label?: string;
  isStale: boolean;
}

export interface DataLineageGraph {
  nodes: LineageNode[];
  edges: LineageEdge[];
}

export function useDataLineage(projectId: string | null, zoneId?: string | null) {
  return useQuery({
    queryKey: ['data-lineage', projectId, zoneId],
    queryFn: async (): Promise<DataLineageGraph> => {
      if (!projectId) return { nodes: [], edges: [] };

      const nodes: LineageNode[] = [];
      const edges: LineageEdge[] = [];

      // Fetch load calculations
      let loadQuery = supabase
        .from('load_calculations')
        .select('id, calculation_name, updated_at, zone_id, cooling_load_tons, heating_load_btuh, cfm_required')
        .eq('project_id', projectId);
      
      if (zoneId) {
        loadQuery = loadQuery.eq('zone_id', zoneId);
      }

      const { data: loadCalcs } = await loadQuery;

      loadCalcs?.forEach((lc) => {
        nodes.push({
          id: lc.id,
          type: 'load_calculation',
          name: lc.calculation_name || 'Load Calculation',
          updatedAt: lc.updated_at,
          zoneId: lc.zone_id || undefined,
          values: {
            coolingTons: lc.cooling_load_tons || 0,
            heatingBtuh: lc.heating_load_btuh || 0,
            cfm: lc.cfm_required || 0,
          },
        });
      });

      // Fetch equipment selections
      let equipQuery = supabase
        .from('equipment_selections')
        .select('id, selection_name, updated_at, zone_id, load_calculation_id, required_capacity_tons')
        .eq('project_id', projectId);

      if (zoneId) {
        equipQuery = equipQuery.eq('zone_id', zoneId);
      }

      const { data: equipSelections } = await equipQuery;

      equipSelections?.forEach((es) => {
        nodes.push({
          id: es.id,
          type: 'equipment_selection',
          name: es.selection_name || 'Equipment Selection',
          updatedAt: es.updated_at,
          zoneId: es.zone_id || undefined,
          values: {
            capacityTons: es.required_capacity_tons || 0,
          },
        });

        // Edge from load calc to equipment
        if (es.load_calculation_id) {
          const loadNode = nodes.find((n) => n.id === es.load_calculation_id);
          const isStale = loadNode ? new Date(loadNode.updatedAt) > new Date(es.updated_at) : false;
          
          edges.push({
            from: es.load_calculation_id,
            to: es.id,
            label: 'capacity',
            isStale,
          });
        }
      });

      // Fetch terminal units
      let terminalQuery = supabase
        .from('terminal_unit_selections')
        .select('id, unit_tag, updated_at, zone_id, cooling_load_btuh, supply_cfm')
        .eq('project_id', projectId);

      if (zoneId) {
        terminalQuery = terminalQuery.eq('zone_id', zoneId);
      }

      const { data: terminalUnits } = await terminalQuery;

      terminalUnits?.forEach((tu) => {
        nodes.push({
          id: tu.id,
          type: 'terminal_unit',
          name: tu.unit_tag || 'Terminal Unit',
          updatedAt: tu.updated_at,
          zoneId: tu.zone_id || undefined,
          values: {
            coolingBtuh: tu.cooling_load_btuh || 0,
            cfm: tu.supply_cfm || 0,
          },
        });

        // Find matching load calc by zone
        if (tu.zone_id) {
          const loadNode = nodes.find(
            (n) => n.type === 'load_calculation' && n.zoneId === tu.zone_id
          );
          if (loadNode) {
            const isStale = new Date(loadNode.updatedAt) > new Date(tu.updated_at);
            edges.push({
              from: loadNode.id,
              to: tu.id,
              label: 'sizing',
              isStale,
            });
          }
        }
      });

      // Fetch duct systems
      const { data: ductSystems } = await supabase
        .from('duct_systems')
        .select('id, system_name, updated_at, total_airflow_cfm')
        .eq('project_id', projectId);

      ductSystems?.forEach((ds) => {
        nodes.push({
          id: ds.id,
          type: 'duct_system',
          name: ds.system_name || 'Duct System',
          updatedAt: ds.updated_at,
          values: {
            cfm: ds.total_airflow_cfm || 0,
          },
        });
      });

      // Fetch pipe systems
      const { data: pipeSystems } = await supabase
        .from('pipe_systems')
        .select('id, system_name, updated_at, total_flow_gpm')
        .eq('project_id', projectId);

      pipeSystems?.forEach((ps) => {
        nodes.push({
          id: ps.id,
          type: 'pipe_system',
          name: ps.system_name || 'Pipe System',
          updatedAt: ps.updated_at,
          values: {
            gpm: ps.total_flow_gpm || 0,
          },
        });
      });

      // Fetch AHU configurations
      const { data: ahuConfigs } = await supabase
        .from('ahu_configurations')
        .select('id, ahu_name, updated_at, design_cfm')
        .eq('project_id', projectId);

      ahuConfigs?.forEach((ahu) => {
        nodes.push({
          id: ahu.id,
          type: 'ahu_configuration',
          name: ahu.ahu_name || 'AHU Configuration',
          updatedAt: ahu.updated_at,
          values: {
            cfm: ahu.design_cfm || 0,
          },
        });
        
        // Edge from load calc to AHU (first available)
        const loadNode = nodes.find(n => n.type === 'load_calculation');
        if (loadNode) {
          edges.push({
            from: loadNode.id,
            to: ahu.id,
            label: 'sizing',
            isStale: new Date(loadNode.updatedAt) > new Date(ahu.updated_at),
          });
        }
      });

      // Fetch acoustic calculations
      let acousticQuery = supabase
        .from('acoustic_calculations')
        .select('id, name, updated_at, zone_id, calculated_nc')
        .eq('project_id', projectId);

      if (zoneId) {
        acousticQuery = acousticQuery.eq('zone_id', zoneId);
      }

      const { data: acousticCalcs } = await acousticQuery;

      acousticCalcs?.forEach((ac) => {
        nodes.push({
          id: ac.id,
          type: 'acoustic_analysis',
          name: ac.name || `Acoustic (NC ${ac.calculated_nc || 'N/A'})`,
          updatedAt: ac.updated_at,
          zoneId: ac.zone_id || undefined,
          values: {
            nc: ac.calculated_nc || 0,
          },
        });

        // Edge from equipment to acoustic
        const matchingEquip = equipSelections?.find(e => e.zone_id === ac.zone_id);
        if (matchingEquip) {
          edges.push({
            from: matchingEquip.id,
            to: ac.id,
            label: 'noise source',
            isStale: new Date(matchingEquip.updated_at) > new Date(ac.updated_at),
          });
        }
      });

      // === NEW: Fetch Chilled Water Plants ===
      const { data: chwPlants } = await supabase
        .from('chilled_water_plants')
        .select('id, plant_name, updated_at, design_cooling_load_tons, chw_supply_temp_f')
        .eq('project_id', projectId);

      chwPlants?.forEach((plant) => {
        nodes.push({
          id: plant.id,
          type: 'chw_plant',
          name: plant.plant_name || 'CHW Plant',
          updatedAt: plant.updated_at,
          values: {
            capacityTons: plant.design_cooling_load_tons || 0,
            chwSupplyF: plant.chw_supply_temp_f || 44,
          },
        });

        // Edge from load calcs to CHW plant
        const totalLoadCalcTons = loadCalcs?.reduce((sum, lc) => sum + (lc.cooling_load_tons || 0), 0) || 0;
        if (totalLoadCalcTons > 0 && loadCalcs && loadCalcs.length > 0) {
          const latestLoadCalc = loadCalcs.reduce((latest, lc) => 
            new Date(lc.updated_at) > new Date(latest.updated_at) ? lc : latest
          );
          edges.push({
            from: latestLoadCalc.id,
            to: plant.id,
            label: 'cooling load',
            isStale: new Date(latestLoadCalc.updated_at) > new Date(plant.updated_at),
          });
        }
      });

      // === NEW: Fetch Chiller Selections ===
      const { data: chillerSelections } = await supabase
        .from('chiller_selections')
        .select('id, name, updated_at, chw_plant_id, rated_capacity_tons, rated_iplv, chiller_type')
        .eq('project_id', projectId);

      chillerSelections?.forEach((chiller) => {
        nodes.push({
          id: chiller.id,
          type: 'chiller_selection',
          name: chiller.name || 'Chiller',
          updatedAt: chiller.updated_at,
          values: {
            capacityTons: chiller.rated_capacity_tons || 0,
            iplv: chiller.rated_iplv || 0,
            type: chiller.chiller_type || 'water-cooled',
          },
        });

        // Edge from CHW Plant to Chiller
        if (chiller.chw_plant_id) {
          const plantNode = nodes.find(n => n.id === chiller.chw_plant_id);
          if (plantNode) {
            edges.push({
              from: plantNode.id,
              to: chiller.id,
              label: 'plant config',
              isStale: new Date(plantNode.updatedAt) > new Date(chiller.updated_at),
            });
          }
        }
      });

      // === NEW: Fetch Cooling Tower Selections ===
      const { data: coolingTowers } = await supabase
        .from('cooling_tower_selections')
        .select('id, name, updated_at, chw_plant_id, total_capacity_tons, design_wet_bulb_f')
        .eq('project_id', projectId);

      coolingTowers?.forEach((tower) => {
        nodes.push({
          id: tower.id,
          type: 'cooling_tower_selection',
          name: tower.name || 'Cooling Tower',
          updatedAt: tower.updated_at,
          values: {
            capacityTons: tower.total_capacity_tons || 0,
            wetBulbF: tower.design_wet_bulb_f || 78,
          },
        });

        // Edge from Chiller to Cooling Tower (heat rejection)
        const linkedChillers = chillerSelections?.filter(c => c.chw_plant_id === tower.chw_plant_id);
        if (linkedChillers && linkedChillers.length > 0) {
          const latestChiller = linkedChillers[0];
          edges.push({
            from: latestChiller.id,
            to: tower.id,
            label: 'heat rejection',
            isStale: new Date(latestChiller.updated_at) > new Date(tower.updated_at),
          });
        }
      });

      // === NEW: Fetch Hot Water Plants ===
      const { data: hwPlants } = await supabase
        .from('hot_water_plants')
        .select('id, plant_name, updated_at, heating_load_btuh, supply_temp_f')
        .eq('project_id', projectId);

      hwPlants?.forEach((plant) => {
        nodes.push({
          id: plant.id,
          type: 'hw_plant',
          name: plant.plant_name || 'HW Plant',
          updatedAt: plant.updated_at,
          values: {
            capacityMbh: (plant.heating_load_btuh || 0) / 1000,
            supplyTempF: plant.supply_temp_f || 180,
          },
        });

        // Edge from load calcs to HW plant
        const totalLoadCalcBtuh = loadCalcs?.reduce((sum, lc) => sum + (lc.heating_load_btuh || 0), 0) || 0;
        if (totalLoadCalcBtuh > 0 && loadCalcs && loadCalcs.length > 0) {
          const latestLoadCalc = loadCalcs.reduce((latest, lc) => 
            new Date(lc.updated_at) > new Date(latest.updated_at) ? lc : latest
          );
          edges.push({
            from: latestLoadCalc.id,
            to: plant.id,
            label: 'heating load',
            isStale: new Date(latestLoadCalc.updated_at) > new Date(plant.updated_at),
          });
        }
      });

      // === NEW: Fetch Boiler Selections ===
      const { data: boilerSelections } = await supabase
        .from('boiler_selections')
        .select('id, selection_name, updated_at, hot_water_plant_id, selected_capacity_btuh, afue, boiler_type')
        .eq('project_id', projectId);

      boilerSelections?.forEach((boiler) => {
        nodes.push({
          id: boiler.id,
          type: 'boiler_selection',
          name: boiler.selection_name || 'Boiler',
          updatedAt: boiler.updated_at,
          values: {
            capacityMbh: (boiler.selected_capacity_btuh || 0) / 1000,
            afue: boiler.afue || 0.95,
            type: boiler.boiler_type || 'condensing-gas',
          },
        });

        // Edge from HW Plant to Boiler
        if (boiler.hot_water_plant_id) {
          const plantNode = nodes.find(n => n.id === boiler.hot_water_plant_id);
          if (plantNode) {
            edges.push({
              from: plantNode.id,
              to: boiler.id,
              label: 'plant config',
              isStale: new Date(plantNode.updatedAt) > new Date(boiler.updated_at),
            });
          }
        }
      });

      // === NEW: Fetch ERV Sizing ===
      const { data: ervSizings } = await supabase
        .from('erv_sizing_calculations')
        .select('id, calculation_name, updated_at, outdoor_air_cfm, sensible_efficiency_percent')
        .eq('project_id', projectId);

      ervSizings?.forEach((erv) => {
        nodes.push({
          id: erv.id,
          type: 'erv_sizing',
          name: erv.calculation_name || 'ERV Sizing',
          updatedAt: erv.updated_at,
          values: {
            cfm: erv.outdoor_air_cfm || 0,
            effectiveness: (erv.sensible_efficiency_percent || 75) / 100,
          },
        });

        // Edge from AHU to ERV
        const linkedAhu = ahuConfigs?.[0];
        if (linkedAhu) {
          edges.push({
            from: linkedAhu.id,
            to: erv.id,
            label: 'outdoor air',
            isStale: new Date(linkedAhu.updated_at) > new Date(erv.updated_at),
          });
        }
      });

      // === NEW: Fetch VRF Systems ===
      const { data: vrfSystems } = await supabase
        .from('vrf_systems')
        .select('id, system_name, updated_at, outdoor_unit_capacity_tons, outdoor_unit_model')
        .eq('project_id', projectId);

      vrfSystems?.forEach((vrf) => {
        nodes.push({
          id: vrf.id,
          type: 'vrf_system',
          name: vrf.system_name || 'VRF System',
          updatedAt: vrf.updated_at || new Date().toISOString(),
          values: {
            capacityTons: vrf.outdoor_unit_capacity_tons || 0,
            ouModel: vrf.outdoor_unit_model || '-',
          },
        });

        // Edge from load calc to VRF (alternative to CHW)
        const latestLoadCalc = loadCalcs?.[0];
        if (latestLoadCalc) {
          edges.push({
            from: latestLoadCalc.id,
            to: vrf.id,
            label: 'capacity',
            isStale: new Date(latestLoadCalc.updated_at) > new Date(vrf.updated_at || new Date().toISOString()),
          });
        }
      });

      return { nodes, edges };
    },
    enabled: !!projectId,
  });
}

// Helper to get stale connections count
export function getStaleConnectionsCount(graph: DataLineageGraph | undefined): number {
  if (!graph) return 0;
  return graph.edges.filter((e) => e.isStale).length;
}

// Helper to get node type display name
export function getNodeTypeLabel(type: LineageNode['type']): string {
  const labels: Record<LineageNodeType, string> = {
    load_calculation: 'Load Calculation',
    equipment_selection: 'Equipment Selection',
    terminal_unit: 'Terminal Unit',
    duct_system: 'Duct System',
    pipe_system: 'Pipe System',
    ahu_configuration: 'AHU Configuration',
    acoustic_analysis: 'Acoustic Analysis',
    cost_estimate: 'Cost Estimate',
    // Plant equipment labels
    chiller_selection: 'Chiller',
    boiler_selection: 'Boiler',
    cooling_tower_selection: 'Cooling Tower',
    chw_plant: 'CHW Plant',
    hw_plant: 'HW Plant',
    erv_sizing: 'ERV Sizing',
    vrf_system: 'VRF System',
    // Phase 18 specialty equipment labels
    economizer_selection: 'Economizer',
    silencer_selection: 'Silencer',
    expansion_tank_selection: 'Expansion Tank',
    control_valve_selection: 'Control Valve',
    vibration_isolation_selection: 'Vibration Isolation',
    // Compliance labels
    smoke_control: 'Smoke Control',
    insulation_calculation: 'Insulation',
    ventilation_calculation: 'Ventilation',
    sbc_compliance: 'SBC Compliance',
    ashrae_compliance: 'ASHRAE 90.1',
  };
  return labels[type] || type;
}

// Helper to get node type icon name (for use with lucide-react)
export function getNodeTypeIcon(type: LineageNode['type']): string {
  const icons: Record<LineageNodeType, string> = {
    load_calculation: 'Calculator',
    equipment_selection: 'Settings',
    terminal_unit: 'Box',
    duct_system: 'Wind',
    pipe_system: 'Droplets',
    ahu_configuration: 'Fan',
    acoustic_analysis: 'Volume2',
    cost_estimate: 'DollarSign',
    chiller_selection: 'Snowflake',
    boiler_selection: 'Flame',
    cooling_tower_selection: 'Droplets',
    chw_plant: 'Factory',
    hw_plant: 'Factory',
    erv_sizing: 'RefreshCw',
    vrf_system: 'Network',
    // Phase 18 specialty equipment icons
    economizer_selection: 'Thermometer',
    silencer_selection: 'VolumeX',
    expansion_tank_selection: 'Container',
    control_valve_selection: 'Gauge',
    vibration_isolation_selection: 'Waves',
    // Compliance icons
    smoke_control: 'AlertTriangle',
    insulation_calculation: 'Layers',
    ventilation_calculation: 'Wind',
    sbc_compliance: 'Shield',
    ashrae_compliance: 'BadgeCheck',
  };
  return icons[type] || 'Circle';
}

// Helper to get node type color class
export function getNodeTypeColor(type: LineageNode['type']): string {
  const colors: Record<LineageNodeType, string> = {
    load_calculation: 'bg-blue-500/20 border-blue-500',
    equipment_selection: 'bg-green-500/20 border-green-500',
    terminal_unit: 'bg-purple-500/20 border-purple-500',
    duct_system: 'bg-sky-500/20 border-sky-500',
    pipe_system: 'bg-teal-500/20 border-teal-500',
    ahu_configuration: 'bg-indigo-500/20 border-indigo-500',
    acoustic_analysis: 'bg-yellow-500/20 border-yellow-500',
    cost_estimate: 'bg-emerald-500/20 border-emerald-500',
    chiller_selection: 'bg-cyan-500/20 border-cyan-500',
    boiler_selection: 'bg-orange-500/20 border-orange-500',
    cooling_tower_selection: 'bg-blue-400/20 border-blue-400',
    chw_plant: 'bg-blue-300/20 border-blue-300',
    hw_plant: 'bg-orange-300/20 border-orange-300',
    erv_sizing: 'bg-lime-500/20 border-lime-500',
    vrf_system: 'bg-violet-500/20 border-violet-500',
    // Phase 18 specialty equipment colors
    economizer_selection: 'bg-teal-400/20 border-teal-400',
    silencer_selection: 'bg-slate-400/20 border-slate-400',
    expansion_tank_selection: 'bg-amber-400/20 border-amber-400',
    control_valve_selection: 'bg-rose-400/20 border-rose-400',
    vibration_isolation_selection: 'bg-fuchsia-400/20 border-fuchsia-400',
    // Compliance colors
    smoke_control: 'bg-red-400/20 border-red-400',
    insulation_calculation: 'bg-pink-400/20 border-pink-400',
    ventilation_calculation: 'bg-sky-400/20 border-sky-400',
    sbc_compliance: 'bg-emerald-400/20 border-emerald-400',
    ashrae_compliance: 'bg-green-400/20 border-green-400',
  };
  return colors[type] || 'bg-muted border-border';
}
