import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { calculateZoneCompletenessScore } from '@/lib/design-completeness-utils';
export interface ZoneCompleteness {
  zoneId: string;
  zoneName: string;
  zoneType: string;
  floorId: string;
  floorName: string;
  buildingId: string;
  buildingName: string;
  areaSqm: number;
  
  // Design status - Core metrics
  hasLoadCalculation: boolean;
  loadCalculationId?: string;
  loadCalculationStatus?: string;
  coolingLoadTons?: number;
  
  hasEquipmentSelection: boolean;
  equipmentSelectionId?: string;
  equipmentSelectionStatus?: string;
  
  hasDistributionSystem: boolean;
  distributionSystemType?: 'duct' | 'pipe' | 'vrf';
  distributionSystemId?: string;
  
  // Terminal Devices (sub-metric under distribution)
  hasDiffuserSelection: boolean;
  diffuserCount: number;
  diffuserTotalQuantity: number;
  
  // Terminal Units (sub-metric under equipment - VAV/FCU)
  hasTerminalUnitSelection: boolean;
  terminalUnitCount: number;
  terminalUnitTotalQuantity: number;
  terminalUnitTypes: string[];
  
  // Design status - Optional metrics (ventilation & ERV)
  hasVentilationCalc: boolean;
  ventilationCalcId?: string;
  ventilationCfm?: number;
  
  hasERVSizing: boolean;
  ervSizingId?: string;
  ervType?: string;
  
  // Psychrometric Analysis (optional)
  hasPsychrometricAnalysis: boolean;
  psychrometricAnalysisId?: string;
  
  // Acoustic Analysis
  hasAcousticAnalysis: boolean;
  acousticMeetsTarget: boolean | null;
  acousticCalculationCount: number;
  acousticCalculationTypes: string[];
  
  // Computed
  completenessScore: number;
  missingSteps: ('load_calc' | 'equipment' | 'distribution' | 'ventilation' | 'erv' | 'acoustic')[];
}

export interface ProjectCompleteness {
  projectId: string;
  projectName: string;
  totalZones: number;
  zonesWithLoadCalc: number;
  zonesWithEquipment: number;
  zonesWithDistribution: number;
  zonesWithVentilation: number;
  zonesWithERV: number;
  zonesWithDiffusers: number;
  totalDiffuserCount: number;
  zonesWithTerminalUnits: number;
  totalTerminalUnitCount: number;
  fullyCompleteZones: number;
  overallCompleteness: number;
  zones: ZoneCompleteness[];
  // Specialized Tools (project-level) - 7 tools @ ~14.29% each
  hasChilledWaterPlant: boolean;
  chilledWaterPlantCount: number;
  hasHotWaterPlant: boolean;
  hotWaterPlantCount: number;
  hasSmokeControl: boolean;
  smokeControlCount: number;
  hasThermalComfort: boolean;
  thermalComfortCount: number;
  hasSBCCompliance: boolean;
  sbcComplianceCount: number;
  hasASHRAE90_1Compliance: boolean;
  ashrae90_1ComplianceCount: number;
  // AHU Configuration (project-level)
  hasAHUConfiguration: boolean;
  ahuConfigurationCount: number;
  // Fan & Pump Selections (project-level)
  hasFanSelections: boolean;
  fanSelectionCount: number;
  hasPumpSelections: boolean;
  pumpSelectionCount: number;
  specializedToolsScore: number;
  // Acoustic tracking (project-level aggregation)
  zonesWithAcousticAnalysis: number;
  totalAcousticCalculations: number;
  zonesPassingAcousticTarget: number;
  // Insulation tracking (zone-level aggregation)
  hasInsulationCalculations: boolean;
  insulationCalculationCount: number;
  zonesWithInsulation: number;
  // Sequence of Operations (project-level)
  hasSequenceOfOperations: boolean;
  sooCount: number;
  // Coil, Filter, Cooling Tower, Chiller, Boiler Selections (project-level)
  hasCoilSelections: boolean;
  coilSelectionCount: number;
  hasFilterSelections: boolean;
  filterSelectionCount: number;
  hasCoolingTowerSelections: boolean;
  coolingTowerSelectionCount: number;
  hasChillerSelections: boolean;
  chillerSelectionCount: number;
  hasBoilerSelections: boolean;
  boilerSelectionCount: number;
  // Phase 18: 5 new specialized tools
  hasEconomizerSelections: boolean;
  economizerSelectionCount: number;
  hasControlValveSelections: boolean;
  controlValveSelectionCount: number;
  hasExpansionTankSelections: boolean;
  expansionTankSelectionCount: number;
  hasSilencerSelections: boolean;
  silencerSelectionCount: number;
  zonesWithSilencers: number;
  hasVibrationIsolationSelections: boolean;
  vibrationIsolationSelectionCount: number;
  zonesWithVibrationIsolation: number;
  // Aggregate metrics for Equipment Selection Summary
  coilMetrics: {
    count: number;
    totalCoolingTons: number;
    totalHeatingMbh: number;
    totalAirflowCfm: number;
  };
  filterMetrics: {
    count: number;
    averageMervRating: number;
    preFilterCount: number;
    finalFilterCount: number;
  };
  terminalMetrics: {
    count: number;
    vavCount: number;
    fcuCount: number;
    totalAirflowCfm: number;
    totalCoolingBtuh: number;
  };
  coolingTowerMetrics: {
    count: number;
    totalCapacityTons: number;
    totalFlowGpm: number;
    totalMakeupGpm: number;
  };
  boilerMetrics: {
    count: number;
    totalCapacityMbh: number;
    condensingCount: number;
    nonCondensingCount: number;
  };
  chillerMetrics: {
    count: number;
    totalCapacityTons: number;
  };
}

interface ZoneWithHierarchy {
  id: string;
  name: string;
  zone_type: string | null;
  area_sqm: number | null;
  floor_id: string;
  floors: {
    id: string;
    name: string;
    building_id: string;
    buildings: {
      id: string;
      name: string;
      project_id: string;
    };
  };
}

export function useDesignCompleteness(projectId: string | null) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['design-completeness', projectId, organization?.id],
    queryFn: async (): Promise<ProjectCompleteness | null> => {
      if (!projectId || !organization?.id) return null;

      // Fetch project info
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('id', projectId)
        .single();

      if (projectError || !project) return null;

      // Fetch all zones for this project through the hierarchy
      const { data: zones, error: zonesError } = await supabase
        .from('zones')
        .select(`
          id,
          name,
          zone_type,
          area_sqm,
          floor_id,
          floors!inner (
            id,
            name,
            building_id,
            buildings!inner (
              id,
              name,
              project_id
            )
          )
        `)
        .eq('floors.buildings.project_id', projectId);

      if (zonesError) {
        console.error('Error fetching zones:', zonesError);
        return null;
      }

      const typedZones = zones as unknown as ZoneWithHierarchy[];

      if (!typedZones || typedZones.length === 0) {
        return {
          projectId: project.id,
          projectName: project.name,
          totalZones: 0,
          zonesWithLoadCalc: 0,
          zonesWithEquipment: 0,
          zonesWithDistribution: 0,
          zonesWithVentilation: 0,
          zonesWithERV: 0,
          zonesWithDiffusers: 0,
          totalDiffuserCount: 0,
          zonesWithTerminalUnits: 0,
          totalTerminalUnitCount: 0,
          fullyCompleteZones: 0,
          overallCompleteness: 0,
          zones: [],
          hasChilledWaterPlant: false,
          chilledWaterPlantCount: 0,
          hasHotWaterPlant: false,
          hotWaterPlantCount: 0,
          hasSmokeControl: false,
          smokeControlCount: 0,
          hasThermalComfort: false,
          thermalComfortCount: 0,
          hasSBCCompliance: false,
          sbcComplianceCount: 0,
          hasASHRAE90_1Compliance: false,
          ashrae90_1ComplianceCount: 0,
          hasAHUConfiguration: false,
          ahuConfigurationCount: 0,
          hasFanSelections: false,
          fanSelectionCount: 0,
          hasPumpSelections: false,
          pumpSelectionCount: 0,
          specializedToolsScore: 0,
          zonesWithAcousticAnalysis: 0,
          totalAcousticCalculations: 0,
          zonesPassingAcousticTarget: 0,
          hasInsulationCalculations: false,
          insulationCalculationCount: 0,
          zonesWithInsulation: 0,
          hasSequenceOfOperations: false,
          sooCount: 0,
          hasCoilSelections: false,
          coilSelectionCount: 0,
          hasFilterSelections: false,
          filterSelectionCount: 0,
          hasCoolingTowerSelections: false,
          coolingTowerSelectionCount: 0,
          hasChillerSelections: false,
          chillerSelectionCount: 0,
          hasBoilerSelections: false,
          boilerSelectionCount: 0,
          // Phase 18: 5 new specialized tools
          hasEconomizerSelections: false,
          economizerSelectionCount: 0,
          hasControlValveSelections: false,
          controlValveSelectionCount: 0,
          hasExpansionTankSelections: false,
          expansionTankSelectionCount: 0,
          hasSilencerSelections: false,
          silencerSelectionCount: 0,
          zonesWithSilencers: 0,
          hasVibrationIsolationSelections: false,
          vibrationIsolationSelectionCount: 0,
          zonesWithVibrationIsolation: 0,
          coilMetrics: { count: 0, totalCoolingTons: 0, totalHeatingMbh: 0, totalAirflowCfm: 0 },
          filterMetrics: { count: 0, averageMervRating: 0, preFilterCount: 0, finalFilterCount: 0 },
          terminalMetrics: { count: 0, vavCount: 0, fcuCount: 0, totalAirflowCfm: 0, totalCoolingBtuh: 0 },
          coolingTowerMetrics: { count: 0, totalCapacityTons: 0, totalFlowGpm: 0, totalMakeupGpm: 0 },
          boilerMetrics: { count: 0, totalCapacityMbh: 0, condensingCount: 0, nonCondensingCount: 0 },
          chillerMetrics: { count: 0, totalCapacityTons: 0 },
        };
      }

      const zoneIds = typedZones.map(z => z.id);

      // Fetch all design data in parallel
      const [
        loadCalcsResult,
        equipmentSelectionsResult,
        ductSystemZonesResult,
        pipeSystemZonesResult,
        vrfIndoorUnitsResult,
        ventilationZoneResultsResult,
        ervCalculationsResult,
        psychrometricAnalysesResult,
        diffuserGrillesResult,
        terminalUnitSelectionsResult,
        // Specialized tools queries (7 tools including AHU)
        chilledWaterPlantsResult,
        hotWaterPlantsResult,
        smokeControlResult,
        thermalComfortResult,
        sbcComplianceResult,
        ashrae90_1ComplianceResult,
        acousticCalculationsResult,
        ahuConfigurationsResult,
        fanSelectionsResult,
        pumpSelectionsResult,
        // Additional tracking
        insulationCalculationsResult,
        sequenceOfOperationsResult,
        // New design tool queries
        coilSelectionsResult,
        filterSelectionsResult,
        coolingTowerSelectionsResult,
        chillerSelectionsResult,
        boilerSelectionsResult,
        // Phase 18: 5 new specialized tool queries
        economizerSelectionsResult,
        controlValveSelectionsResult,
        expansionTankSelectionsResult,
        silencerSelectionsResult,
        vibrationIsolationSelectionsResult,
      ] = await Promise.all([
        // Load calculations
        supabase
          .from('load_calculations')
          .select('id, zone_id, status, cooling_load_btuh')
          .in('zone_id', zoneIds),
        
        // Equipment selections
        supabase
          .from('equipment_selections')
          .select('id, zone_id, status')
          .in('zone_id', zoneIds),
        
        // Duct system zones
        supabase
          .from('duct_system_zones')
          .select('id, zone_id, duct_system_id')
          .in('zone_id', zoneIds),
        
        // Pipe system zones
        supabase
          .from('pipe_system_zones')
          .select('id, zone_id, pipe_system_id')
          .in('zone_id', zoneIds),
        
        // VRF indoor units
        supabase
          .from('vrf_indoor_units')
          .select('id, zone_id, vrf_system_id')
          .in('zone_id', zoneIds),
        
        // Ventilation zone results
        supabase
          .from('ventilation_zone_results')
          .select('id, zone_id, ventilation_calculation_id, voz_cfm')
          .in('zone_id', zoneIds),
        
        // ERV sizing calculations
        supabase
          .from('erv_sizing_calculations')
          .select('id, zone_id, erv_type, outdoor_air_cfm')
          .in('zone_id', zoneIds),

        // Psychrometric Analyses (per zone)
        supabase
          .from('psychrometric_analyses')
          .select('id, zone_id')
          .in('zone_id', zoneIds),

        // Diffuser/Grille selections (zone-level)
        supabase
          .from('diffuser_grilles')
          .select('id, zone_id, quantity')
          .in('zone_id', zoneIds),

        // Terminal Unit selections (VAV/FCU - zone-level)
        supabase
          .from('terminal_unit_selections')
          .select('id, zone_id, unit_type, quantity')
          .in('zone_id', zoneIds),

        // Chilled Water Plants (project-level)
        supabase
          .from('chilled_water_plants')
          .select('id')
          .eq('project_id', projectId),

        // Hot Water Plants (project-level)
        supabase
          .from('hot_water_plants')
          .select('id')
          .eq('project_id', projectId),

        // Smoke Control Calculations (project-level)
        supabase
          .from('smoke_control_calculations')
          .select('id')
          .eq('project_id', projectId),

        // Thermal Comfort Analyses (project-level)
        supabase
          .from('thermal_comfort_analyses')
          .select('id')
          .eq('project_id', projectId),

        // SBC Compliance Checks (project-level)
        supabase
          .from('sbc_compliance_checks')
          .select('id')
          .eq('project_id', projectId),

        // ASHRAE 90.1 Compliance Checks (project-level)
        supabase
          .from('ashrae_90_1_compliance_checks')
          .select('id')
          .eq('project_id', projectId),

        // Acoustic Calculations (zone-level)
        supabase
          .from('acoustic_calculations')
          .select('id, zone_id, calculation_type, meets_target')
          .in('zone_id', zoneIds),

        // AHU Configurations (project-level)
        supabase
          .from('ahu_configurations')
          .select('id')
          .eq('project_id', projectId),

        // Fan Selections (organization-level, filter by project via duct_systems)
        supabase
          .from('fan_selections')
          .select('id, duct_system_id')
          .eq('organization_id', organization.id),

        // Pump Selections (organization-level, filter by project via pipe_systems)
        supabase
          .from('pump_selections')
          .select('id, pipe_system_id')
          .eq('organization_id', organization.id),

        // Insulation Calculations (zone-level)
        supabase
          .from('insulation_calculations')
          .select('id, zone_id')
          .in('zone_id', zoneIds),

        // Sequence of Operations (project-level)
        supabase
          .from('sequence_of_operations')
          .select('id')
          .eq('project_id', projectId),

        // Coil Selections (project-level) - with metrics
        supabase
          .from('coil_selections')
          .select('id, coil_type, capacity_tons, capacity_mbh, design_cfm')
          .eq('project_id', projectId),

        // Filter Selections (project-level) - with metrics
        supabase
          .from('filter_selections')
          .select('id, merv_rating, filter_position')
          .eq('project_id', projectId),

        // Cooling Tower Selections (project-level) - with metrics
        supabase
          .from('cooling_tower_selections')
          .select('id, total_capacity_tons, cw_flow_gpm, makeup_water_gpm')
          .eq('project_id', projectId),

        // Chiller Selections (project-level) - with metrics
        supabase
          .from('chiller_selections')
          .select('id, rated_capacity_tons, rated_iplv, chiller_type')
          .eq('project_id', projectId),

        // Boiler Selections (project-level) - with metrics
        supabase
          .from('boiler_selections')
          .select('id, selected_capacity_btuh, afue, boiler_type')
          .eq('project_id', projectId),

        // Phase 18: 5 new specialized tools
        // Economizer Selections (project-level)
        supabase
          .from('economizer_selections')
          .select('id')
          .eq('project_id', projectId),

        // Control Valve Selections (project-level)
        supabase
          .from('control_valve_selections')
          .select('id')
          .eq('project_id', projectId),

        // Expansion Tank Selections (project-level)
        supabase
          .from('expansion_tank_selections')
          .select('id')
          .eq('project_id', projectId),

        // Silencer Selections (zone-level)
        supabase
          .from('silencer_selections')
          .select('id, zone_id')
          .eq('project_id', projectId),

        // Vibration Isolation Selections (zone-level)
        supabase
          .from('vibration_isolation_selections')
          .select('id, zone_id')
          .eq('project_id', projectId),
      ]);

      const loadCalcs = loadCalcsResult.data;
      const equipmentSelections = equipmentSelectionsResult.data;
      const ductSystemZones = ductSystemZonesResult.data;
      const pipeSystemZones = pipeSystemZonesResult.data;
      const vrfIndoorUnits = vrfIndoorUnitsResult.data;
      const ventilationZoneResults = ventilationZoneResultsResult.data;
      const ervCalculations = ervCalculationsResult.data;
      const psychrometricAnalyses = psychrometricAnalysesResult.data;
      const diffuserGrilles = diffuserGrillesResult.data;
      const terminalUnitSelections = terminalUnitSelectionsResult.data;
      const acousticCalculations = acousticCalculationsResult.data;

      // Extract specialized tools counts (7 tools including AHU)
      const chilledWaterPlantCount = chilledWaterPlantsResult.data?.length || 0;
      const hotWaterPlantCount = hotWaterPlantsResult.data?.length || 0;
      const smokeControlCount = smokeControlResult.data?.length || 0;
      const thermalComfortCount = thermalComfortResult.data?.length || 0;
      const sbcComplianceCount = sbcComplianceResult.data?.length || 0;
      const ashrae90_1ComplianceCount = ashrae90_1ComplianceResult.data?.length || 0;
      const ahuConfigurationCount = ahuConfigurationsResult.data?.length || 0;
      const fanSelectionCount = fanSelectionsResult.data?.length || 0;
      const pumpSelectionCount = pumpSelectionsResult.data?.length || 0;
      const insulationCalculations = insulationCalculationsResult.data || [];
      const insulationCalculationCount = insulationCalculations.length;
      const sooCount = sequenceOfOperationsResult.data?.length || 0;
      
      // Equipment selection data with metrics
      const coilSelectionsData = coilSelectionsResult.data || [];
      const filterSelectionsData = filterSelectionsResult.data || [];
      const coolingTowersData = coolingTowerSelectionsResult.data || [];
      const chillerSelectionsData = chillerSelectionsResult.data || [];
      const boilerSelectionsData = boilerSelectionsResult.data || [];
      
      const coilSelectionCount = coilSelectionsData.length;
      const filterSelectionCount = filterSelectionsData.length;
      const coolingTowerSelectionCount = coolingTowersData.length;
      const chillerSelectionCount = chillerSelectionsData.length;
      const boilerSelectionCount = boilerSelectionsData.length;

      // Phase 18: Extract new specialized tool counts
      const economizerSelectionsData = economizerSelectionsResult.data || [];
      const controlValveSelectionsData = controlValveSelectionsResult.data || [];
      const expansionTankSelectionsData = expansionTankSelectionsResult.data || [];
      const silencerSelectionsData = silencerSelectionsResult.data || [];
      const vibrationIsolationSelectionsData = vibrationIsolationSelectionsResult.data || [];

      const economizerSelectionCount = economizerSelectionsData.length;
      const controlValveSelectionCount = controlValveSelectionsData.length;
      const expansionTankSelectionCount = expansionTankSelectionsData.length;
      const silencerSelectionCount = silencerSelectionsData.length;
      const vibrationIsolationSelectionCount = vibrationIsolationSelectionsData.length;

      // Zone-level counts for silencer and vibration isolation
      const zonesWithSilencers = new Set(silencerSelectionsData.map((s: any) => s.zone_id).filter(Boolean)).size;
      const zonesWithVibrationIsolation = new Set(vibrationIsolationSelectionsData.map((v: any) => v.zone_id).filter(Boolean)).size;

      // Calculate aggregate equipment metrics
      const coilMetrics = {
        count: coilSelectionCount,
        totalCoolingTons: coilSelectionsData
          .filter((c: any) => c.coil_type === 'cooling')
          .reduce((sum: number, c: any) => sum + (c.capacity_tons || 0), 0),
        totalHeatingMbh: coilSelectionsData
          .filter((c: any) => c.coil_type === 'heating')
          .reduce((sum: number, c: any) => sum + (c.capacity_mbh || 0), 0),
        totalAirflowCfm: coilSelectionsData
          .reduce((sum: number, c: any) => sum + (c.design_cfm || 0), 0),
      };

      const filterMetrics = {
        count: filterSelectionCount,
        averageMervRating: filterSelectionCount > 0
          ? filterSelectionsData.reduce((sum: number, f: any) => sum + (f.merv_rating || 0), 0) / filterSelectionCount
          : 0,
        preFilterCount: filterSelectionsData.filter((f: any) => f.filter_position === 'pre').length,
        finalFilterCount: filterSelectionsData.filter((f: any) => f.filter_position === 'final').length,
      };

      // Terminal unit metrics from zone-level data
      const allTerminalUnits = terminalUnitSelections || [];
      const terminalMetrics = {
        count: allTerminalUnits.length,
        vavCount: allTerminalUnits.filter((t: any) => t.unit_type?.toLowerCase().includes('vav')).length,
        fcuCount: allTerminalUnits.filter((t: any) => t.unit_type?.toLowerCase().includes('fcu')).length,
        totalAirflowCfm: 0, // Would need max_cfm field
        totalCoolingBtuh: 0, // Would need chw_coil_capacity_btuh field
      };

      const coolingTowerMetrics = {
        count: coolingTowerSelectionCount,
        totalCapacityTons: coolingTowersData.reduce((sum: number, t: any) => sum + (t.total_capacity_tons || 0), 0),
        totalFlowGpm: coolingTowersData.reduce((sum: number, t: any) => sum + (t.cw_flow_gpm || 0), 0),
        totalMakeupGpm: coolingTowersData.reduce((sum: number, t: any) => sum + (t.makeup_water_gpm || 0), 0),
      };

      // Chiller metrics
      const chillerMetrics = {
        count: chillerSelectionCount,
        totalCapacityTons: chillerSelectionsData.reduce((sum: number, c: any) => sum + (c.rated_capacity_tons || 0), 0),
      };

      // Boiler metrics
      const boilerMetrics = {
        count: boilerSelectionCount,
        totalCapacityMbh: boilerSelectionsData.reduce((sum: number, b: any) => sum + ((b.selected_capacity_btuh || 0) / 1000), 0),
        condensingCount: boilerSelectionsData.filter((b: any) => b.boiler_type?.toLowerCase().includes('condensing')).length,
        nonCondensingCount: boilerSelectionsData.filter((b: any) => !b.boiler_type?.toLowerCase().includes('condensing')).length,
      };

      // Determine if each tool has been used
      const hasChilledWaterPlant = chilledWaterPlantCount > 0;
      const hasHotWaterPlant = hotWaterPlantCount > 0;
      const hasSmokeControl = smokeControlCount > 0;
      const hasThermalComfort = thermalComfortCount > 0;
      const hasSBCCompliance = sbcComplianceCount > 0;
      const hasASHRAE90_1Compliance = ashrae90_1ComplianceCount > 0;
      const hasAHUConfiguration = ahuConfigurationCount > 0;
      const hasFanSelections = fanSelectionCount > 0;
      const hasInsulationCalculations = insulationCalculationCount > 0;
      const hasSequenceOfOperations = sooCount > 0;
      const hasPumpSelections = pumpSelectionCount > 0;
      const hasCoilSelections = coilSelectionCount > 0;
      const hasFilterSelections = filterSelectionCount > 0;
      const hasCoolingTowerSelections = coolingTowerSelectionCount > 0;
      const hasChillerSelections = chillerSelectionCount > 0;
      const hasBoilerSelections = boilerSelectionCount > 0;
      // Phase 18: 5 new specialized tools
      const hasEconomizerSelections = economizerSelectionCount > 0;
      const hasControlValveSelections = controlValveSelectionCount > 0;
      const hasExpansionTankSelections = expansionTankSelectionCount > 0;
      const hasSilencerSelections = silencerSelectionCount > 0;
      const hasVibrationIsolationSelections = vibrationIsolationSelectionCount > 0;

      // Calculate specialized tools score (~5.26% per tool - 19 tools total)
      const toolWeight = 100 / 19; // 19 specialized tools @ ~5.26% each
      const specializedToolsScore = Math.round(
        (hasChilledWaterPlant ? toolWeight : 0) +
        (hasHotWaterPlant ? toolWeight : 0) +
        (hasSmokeControl ? toolWeight : 0) +
        (hasThermalComfort ? toolWeight : 0) +
        (hasSBCCompliance ? toolWeight : 0) +
        (hasASHRAE90_1Compliance ? toolWeight : 0) +
        (hasAHUConfiguration ? toolWeight : 0) +
        (hasFanSelections ? toolWeight : 0) +
        (hasPumpSelections ? toolWeight : 0) +
        (hasInsulationCalculations ? toolWeight : 0) +
        (hasSequenceOfOperations ? toolWeight : 0) +
        (hasCoilSelections ? toolWeight : 0) +
        (hasFilterSelections ? toolWeight : 0) +
        (hasCoolingTowerSelections ? toolWeight : 0) +
        // Phase 18: 5 new specialized tools
        (hasEconomizerSelections ? toolWeight : 0) +
        (hasControlValveSelections ? toolWeight : 0) +
        (hasExpansionTankSelections ? toolWeight : 0) +
        (hasSilencerSelections ? toolWeight : 0) +
        (hasVibrationIsolationSelections ? toolWeight : 0)
      );

      // Build completeness map for each zone
      const zoneCompleteness: ZoneCompleteness[] = typedZones.map(zone => {
        const loadCalc = loadCalcs?.find(lc => lc.zone_id === zone.id);
        const equipment = equipmentSelections?.find(eq => eq.zone_id === zone.id);
        const ductZone = ductSystemZones?.find(dz => dz.zone_id === zone.id);
        const pipeZone = pipeSystemZones?.find(pz => pz.zone_id === zone.id);
        const vrfUnit = vrfIndoorUnits?.find(vu => vu.zone_id === zone.id);
        const ventilationResult = ventilationZoneResults?.find(vr => vr.zone_id === zone.id);
        const ervCalc = ervCalculations?.find(ec => ec.zone_id === zone.id);
        const psychroAnalysis = psychrometricAnalyses?.find(pa => pa.zone_id === zone.id);
        
        // Diffuser/Grille selections for this zone
        const zoneDiffusers = diffuserGrilles?.filter(dg => dg.zone_id === zone.id);
        const hasDiffuserSelection = zoneDiffusers && zoneDiffusers.length > 0;
        const diffuserCount = zoneDiffusers?.length || 0;
        const diffuserTotalQuantity = zoneDiffusers?.reduce((sum, d) => sum + (d.quantity || 1), 0) || 0;

        // Terminal Unit selections for this zone (VAV/FCU)
        const zoneTerminals = terminalUnitSelections?.filter(tu => tu.zone_id === zone.id);
        const hasTerminalUnitSelection = zoneTerminals && zoneTerminals.length > 0;
        const terminalUnitCount = zoneTerminals?.length || 0;
        const terminalUnitTotalQuantity = zoneTerminals?.reduce((sum, t) => sum + (t.quantity || 1), 0) || 0;
        const terminalUnitTypes = [...new Set(zoneTerminals?.map(t => t.unit_type) || [])];

        // Acoustic calculations for this zone
        const zoneAcoustics = acousticCalculations?.filter(ac => ac.zone_id === zone.id);
        const hasAcousticAnalysis = zoneAcoustics && zoneAcoustics.length > 0;
        const acousticMeetsTarget = hasAcousticAnalysis 
          ? zoneAcoustics.every(ac => ac.meets_target === true)
          : null;
        const acousticCalculationCount = zoneAcoustics?.length || 0;
        const acousticCalculationTypes = [...new Set(zoneAcoustics?.map(ac => ac.calculation_type) || [])];

        const hasLoadCalculation = !!loadCalc;
        const hasEquipmentSelection = !!equipment;
        const hasDistributionSystem = !!ductZone || !!pipeZone || !!vrfUnit;
        const hasVentilationCalc = !!ventilationResult;
        const hasERVSizing = !!ervCalc;
        const hasPsychrometricAnalysis = !!psychroAnalysis;

        let distributionSystemType: 'duct' | 'pipe' | 'vrf' | undefined;
        let distributionSystemId: string | undefined;

        if (ductZone) {
          distributionSystemType = 'duct';
          distributionSystemId = ductZone.duct_system_id;
        } else if (pipeZone) {
          distributionSystemType = 'pipe';
          distributionSystemId = pipeZone.pipe_system_id;
        } else if (vrfUnit) {
          distributionSystemType = 'vrf';
          distributionSystemId = vrfUnit.vrf_system_id;
        }

        const missingSteps: ('load_calc' | 'equipment' | 'distribution' | 'ventilation' | 'erv' | 'acoustic')[] = [];
        if (!hasLoadCalculation) missingSteps.push('load_calc');
        if (!hasEquipmentSelection) missingSteps.push('equipment');
        if (!hasDistributionSystem) missingSteps.push('distribution');
        if (!hasVentilationCalc) missingSteps.push('ventilation');
        if (!hasERVSizing) missingSteps.push('erv');
        if (!hasAcousticAnalysis) missingSteps.push('acoustic');

        // Calculate score using centralized weights
        const completenessScore = calculateZoneCompletenessScore({
          hasLoadCalc: hasLoadCalculation,
          hasEquipment: hasEquipmentSelection,
          hasDistribution: hasDistributionSystem,
          hasVentilation: hasVentilationCalc,
          hasERV: hasERVSizing,
          hasAcoustic: hasAcousticAnalysis,
        });

        return {
          zoneId: zone.id,
          zoneName: zone.name,
          zoneType: zone.zone_type || 'other',
          floorId: zone.floors.id,
          floorName: zone.floors.name,
          buildingId: zone.floors.buildings.id,
          buildingName: zone.floors.buildings.name,
          areaSqm: zone.area_sqm || 0,
          hasLoadCalculation,
          loadCalculationId: loadCalc?.id,
          loadCalculationStatus: loadCalc?.status,
          coolingLoadTons: loadCalc?.cooling_load_btuh ? loadCalc.cooling_load_btuh / 12000 : undefined,
          hasEquipmentSelection,
          equipmentSelectionId: equipment?.id,
          equipmentSelectionStatus: equipment?.status,
          hasDistributionSystem,
          distributionSystemType,
          distributionSystemId,
          hasVentilationCalc,
          ventilationCalcId: ventilationResult?.ventilation_calculation_id,
          ventilationCfm: ventilationResult?.voz_cfm ?? undefined,
          hasERVSizing,
          ervSizingId: ervCalc?.id,
          ervType: ervCalc?.erv_type ?? undefined,
          hasPsychrometricAnalysis,
          psychrometricAnalysisId: psychroAnalysis?.id,
          hasDiffuserSelection,
          diffuserCount,
          diffuserTotalQuantity,
          hasTerminalUnitSelection,
          terminalUnitCount,
          terminalUnitTotalQuantity,
          terminalUnitTypes,
          hasAcousticAnalysis,
          acousticMeetsTarget,
          acousticCalculationCount,
          acousticCalculationTypes,
          completenessScore,
          missingSteps,
        };
      });

      const zonesWithLoadCalc = zoneCompleteness.filter(z => z.hasLoadCalculation).length;
      const zonesWithEquipment = zoneCompleteness.filter(z => z.hasEquipmentSelection).length;
      const zonesWithDistribution = zoneCompleteness.filter(z => z.hasDistributionSystem).length;
      const zonesWithVentilation = zoneCompleteness.filter(z => z.hasVentilationCalc).length;
      const zonesWithERV = zoneCompleteness.filter(z => z.hasERVSizing).length;
      const zonesWithDiffusers = zoneCompleteness.filter(z => z.hasDiffuserSelection).length;
      const totalDiffuserCount = zoneCompleteness.reduce((sum, z) => sum + z.diffuserTotalQuantity, 0);
      const zonesWithTerminalUnits = zoneCompleteness.filter(z => z.hasTerminalUnitSelection).length;
      const totalTerminalUnitCount = zoneCompleteness.reduce((sum, z) => sum + z.terminalUnitTotalQuantity, 0);
      const zonesWithAcousticAnalysis = zoneCompleteness.filter(z => z.hasAcousticAnalysis).length;
      const totalAcousticCalculations = zoneCompleteness.reduce((sum, z) => sum + z.acousticCalculationCount, 0);
      const zonesPassingAcousticTarget = zoneCompleteness.filter(z => z.acousticMeetsTarget === true).length;
      const fullyCompleteZones = zoneCompleteness.filter(z => z.completenessScore === 100).length;
      const overallCompleteness = zoneCompleteness.length > 0
        ? Math.round(zoneCompleteness.reduce((sum, z) => sum + z.completenessScore, 0) / zoneCompleteness.length)
        : 0;

      return {
        projectId: project.id,
        projectName: project.name,
        totalZones: zoneCompleteness.length,
        zonesWithLoadCalc,
        zonesWithEquipment,
        zonesWithDistribution,
        zonesWithVentilation,
        zonesWithERV,
        zonesWithDiffusers,
        totalDiffuserCount,
        zonesWithTerminalUnits,
        totalTerminalUnitCount,
        fullyCompleteZones,
        overallCompleteness,
        zones: zoneCompleteness,
        hasChilledWaterPlant,
        chilledWaterPlantCount,
        hasHotWaterPlant,
        hotWaterPlantCount,
        hasSmokeControl,
        smokeControlCount,
        hasThermalComfort,
        thermalComfortCount,
        hasSBCCompliance,
        sbcComplianceCount,
        hasASHRAE90_1Compliance,
        ashrae90_1ComplianceCount,
        hasAHUConfiguration,
        ahuConfigurationCount,
        hasFanSelections,
        fanSelectionCount,
        hasPumpSelections,
        pumpSelectionCount,
        specializedToolsScore,
        zonesWithAcousticAnalysis,
        totalAcousticCalculations,
        zonesPassingAcousticTarget,
        hasInsulationCalculations,
        insulationCalculationCount,
        zonesWithInsulation: new Set(insulationCalculations.map(ic => ic.zone_id)).size,
        hasSequenceOfOperations,
        sooCount,
        hasCoilSelections,
        coilSelectionCount,
        hasFilterSelections,
        filterSelectionCount,
        hasCoolingTowerSelections,
        coolingTowerSelectionCount,
        hasChillerSelections,
        chillerSelectionCount,
        hasBoilerSelections,
        boilerSelectionCount,
        // Phase 18: 5 new specialized tools
        hasEconomizerSelections,
        economizerSelectionCount,
        hasControlValveSelections,
        controlValveSelectionCount,
        hasExpansionTankSelections,
        expansionTankSelectionCount,
        hasSilencerSelections,
        silencerSelectionCount,
        zonesWithSilencers,
        hasVibrationIsolationSelections,
        vibrationIsolationSelectionCount,
        zonesWithVibrationIsolation,
        coilMetrics,
        filterMetrics,
        terminalMetrics,
        coolingTowerMetrics,
        boilerMetrics,
        chillerMetrics,
      };
    },
    enabled: !!projectId && !!organization?.id,
  });
}
