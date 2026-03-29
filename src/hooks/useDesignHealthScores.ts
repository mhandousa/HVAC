import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "./useOrganization";
import { getSeverity, calculateCombinedHealthScore, calculateZoneCompletenessFromPercents, calculateSpecializedToolsScore, SPECIALIZED_TOOLS_COUNT } from "@/lib/design-completeness-utils";

export interface ProjectDesignHealth {
  projectId: string;
  projectName: string;
  projectStatus: string;
  
  // Zone-based completeness
  zoneCompleteness: number;
  totalZones: number;
  fullyCompleteZones: number;
  
  // Specialized tools (19 tools @ ~5.26% each)
  specializedToolsScore: number;
  hasChilledWaterPlant: boolean;
  hasHotWaterPlant: boolean;
  hasSmokeControl: boolean;
  hasThermalComfort: boolean;
  hasSBCCompliance: boolean;
  hasASHRAE90_1Compliance: boolean;
  hasAHUConfiguration: boolean;
  // 7 additional tools
  hasFanSelections: boolean;
  hasPumpSelections: boolean;
  hasInsulationCalculations: boolean;
  hasSequenceOfOperations: boolean;
  hasCoilSelections: boolean;
  hasFilterSelections: boolean;
  hasCoolingTowerSelections: boolean;
  // Phase 18: 5 new specialized tools
  hasEconomizerSelections: boolean;
  hasControlValveSelections: boolean;
  hasExpansionTankSelections: boolean;
  hasSilencerSelections: boolean;
  hasVibrationIsolationSelections: boolean;
  completedToolsCount: number;
  
  // Combined
  combinedHealthScore: number;
  healthStatus: 'critical' | 'warning' | 'good' | 'complete';
}

export interface DesignHealthSummary {
  averageCombinedScore: number;
  averageZoneCompleteness: number;
  averageSpecializedScore: number;
  totalProjects: number;
  criticalProjects: number;
  warningProjects: number;
  goodProjects: number;
  completeProjects: number;
}

export const useDesignHealthScores = () => {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['design-health-scores', organization?.id],
    queryFn: async (): Promise<{ projects: ProjectDesignHealth[]; summary: DesignHealthSummary }> => {
      if (!organization?.id) {
        return { projects: [], summary: getEmptySummary() };
      }

      // Fetch all projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, status')
        .eq('organization_id', organization.id)
        .order('name');

      if (projectsError) throw projectsError;
      if (!projects || projects.length === 0) {
        return { projects: [], summary: getEmptySummary() };
      }

      const projectIds = projects.map(p => p.id);

      // Fetch zone-related data in parallel (batch 1 - core zone metrics)
      const [
        zonesResult,
        loadCalcsResult,
        equipmentResult,
        ductSystemsResult,
        pipeSystemsResult,
        vrfSystemsResult,
        ventilationResult,
        ervResult,
        acousticCalcsResult,
        chwPlantsResult,
        hwPlantsResult,
        smokeControlResult,
        thermalComfortResult,
        sbcComplianceResult,
        ashrae90_1Result,
        ahuConfigsResult
      ] = await Promise.all([
        // Zones with their building/floor hierarchy
        supabase
          .from('zones')
          .select('id, name, floor_id, floors!inner(id, building_id, buildings!inner(id, project_id))')
          .in('floors.buildings.project_id', projectIds),
        // Load calculations
        supabase
          .from('load_calculations')
          .select('id, zone_id, zones!inner(floor_id, floors!inner(building_id, buildings!inner(project_id)))')
          .in('zones.floors.buildings.project_id', projectIds),
        // Equipment selections
        supabase
          .from('equipment_selections')
          .select('id, zone_id, zones!inner(floor_id, floors!inner(building_id, buildings!inner(project_id)))')
          .in('zones.floors.buildings.project_id', projectIds),
        // Duct system zones
        supabase
          .from('duct_system_zones')
          .select('id, zone_id, zones!inner(floor_id, floors!inner(building_id, buildings!inner(project_id)))')
          .in('zones.floors.buildings.project_id', projectIds),
        // Pipe system zones
        supabase
          .from('pipe_system_zones')
          .select('id, zone_id, zones!inner(floor_id, floors!inner(building_id, buildings!inner(project_id)))')
          .in('zones.floors.buildings.project_id', projectIds),
        // VRF indoor units
        supabase
          .from('vrf_indoor_units')
          .select('id, zone_id, zones!inner(floor_id, floors!inner(building_id, buildings!inner(project_id)))')
          .in('zones.floors.buildings.project_id', projectIds),
        // Ventilation zone results (ASHRAE 62.1)
        supabase
          .from('ventilation_zone_results')
          .select('id, zone_id, zones!inner(floor_id, floors!inner(building_id, buildings!inner(project_id)))')
          .in('zones.floors.buildings.project_id', projectIds),
        // ERV sizing calculations
        supabase
          .from('erv_sizing_calculations')
          .select('id, zone_id, zones!inner(floor_id, floors!inner(building_id, buildings!inner(project_id)))')
          .in('zones.floors.buildings.project_id', projectIds),
        // Acoustic calculations
        supabase
          .from('acoustic_calculations')
          .select('id, zone_id, meets_target, zones!inner(floor_id, floors!inner(building_id, buildings!inner(project_id)))')
          .in('zones.floors.buildings.project_id', projectIds),
        // Specialized tools - Chilled Water Plants
        supabase
          .from('chilled_water_plants')
          .select('id, project_id')
          .in('project_id', projectIds),
        // Hot Water Plants
        supabase
          .from('hot_water_plants')
          .select('id, project_id')
          .in('project_id', projectIds),
        // Smoke Control
        supabase
          .from('smoke_control_calculations')
          .select('id, project_id')
          .in('project_id', projectIds),
        // Thermal Comfort
        supabase
          .from('thermal_comfort_analyses')
          .select('id, project_id')
          .in('project_id', projectIds),
        // SBC Compliance
        supabase
          .from('sbc_compliance_checks')
          .select('id, project_id')
          .in('project_id', projectIds),
        // ASHRAE 90.1 Compliance
        supabase
          .from('ashrae_90_1_compliance_checks')
          .select('id, project_id')
          .in('project_id', projectIds),
        // AHU Configurations
        supabase
          .from('ahu_configurations')
          .select('id, project_id')
          .in('project_id', projectIds)
      ]);

      // Fetch additional specialized tools (batch 2 - simpler queries to avoid TS deep instantiation)
      // Note: fan_selections and pump_selections don't have project_id - we need to join through duct_systems/pipe_systems
      // For simplicity, we'll fetch by organization_id and filter by project context later
      const additionalToolsResults = await Promise.all([
        // Insulation Calculations (has project_id)
        supabase
          .from('insulation_calculations')
          .select('id, project_id')
          .in('project_id', projectIds),
        // Sequence of Operations (has project_id)
        supabase
          .from('sequence_of_operations')
          .select('id, project_id')
          .in('project_id', projectIds),
        // Coil Selections (has project_id)
        supabase
          .from('coil_selections')
          .select('id, project_id')
          .in('project_id', projectIds),
        // Filter Selections (has project_id)
        supabase
          .from('filter_selections')
          .select('id, project_id')
          .in('project_id', projectIds),
        // Cooling Tower Selections (has project_id)
        supabase
          .from('cooling_tower_selections')
          .select('id, project_id')
          .in('project_id', projectIds),
        // Fan Selections - join through AHU configurations (which have project_id)
        supabase
          .from('fan_selections')
          .select('id, ahu_configuration_id, ahu_configurations!inner(project_id)')
          .in('ahu_configurations.project_id', projectIds),
        // Pump Selections - join through pipe_systems (which have project_id)
        supabase
          .from('pump_selections')
          .select('id, pipe_system_id, pipe_systems!inner(project_id)')
          .in('pipe_systems.project_id', projectIds),
        // === Phase 18 Specialized Tools ===
        // Economizer Selections (has project_id)
        supabase
          .from('economizer_selections')
          .select('id, project_id')
          .in('project_id', projectIds),
        // Control Valve Selections (has project_id)
        supabase
          .from('control_valve_selections')
          .select('id, project_id')
          .in('project_id', projectIds),
        // Expansion Tank Selections (has project_id)
        supabase
          .from('expansion_tank_selections')
          .select('id, project_id')
          .in('project_id', projectIds),
        // Silencer Selections (has project_id)
        supabase
          .from('silencer_selections')
          .select('id, project_id')
          .in('project_id', projectIds),
        // Vibration Isolation Selections (has project_id)
        supabase
          .from('vibration_isolation_selections')
          .select('id, project_id')
          .in('project_id', projectIds),
      ]);

      const [
        insulationCalcsResult,
        sooResult,
        coilSelectionsResult,
        filterSelectionsResult,
        coolingTowerSelectionsResult,
        fanSelectionsResult,
        pumpSelectionsResult,
        // Phase 18 results
        economizerSelectionsResult,
        controlValveSelectionsResult,
        expansionTankSelectionsResult,
        silencerSelectionsResult,
        vibrationIsolationSelectionsResult,
      ] = additionalToolsResults as any[];

      // Process data for each project
      const projectHealthData: ProjectDesignHealth[] = projects.map(project => {
        // Get zones for this project
        const projectZones = (zonesResult.data || []).filter((z: any) => 
          z.floors?.buildings?.project_id === project.id
        );
        const zoneIds = new Set(projectZones.map((z: any) => z.id));
        const totalZones = zoneIds.size;

        if (totalZones === 0) {
          return createEmptyProjectHealth(project);
        }

        // Count zones with each design stage
        const zonesWithLoadCalc = new Set(
          (loadCalcsResult.data || [])
            .filter((lc: any) => zoneIds.has(lc.zone_id))
            .map((lc: any) => lc.zone_id)
        );
        const zonesWithEquipment = new Set(
          (equipmentResult.data || [])
            .filter((eq: any) => zoneIds.has(eq.zone_id))
            .map((eq: any) => eq.zone_id)
        );
        
        // Distribution: any of duct, pipe, or VRF
        const zonesWithDuct = new Set(
          (ductSystemsResult.data || [])
            .filter((ds: any) => zoneIds.has(ds.zone_id))
            .map((ds: any) => ds.zone_id)
        );
        const zonesWithPipe = new Set(
          (pipeSystemsResult.data || [])
            .filter((ps: any) => zoneIds.has(ps.zone_id))
            .map((ps: any) => ps.zone_id)
        );
        const zonesWithVRF = new Set(
          (vrfSystemsResult.data || [])
            .filter((vrf: any) => zoneIds.has(vrf.zone_id))
            .map((vrf: any) => vrf.zone_id)
        );
        const zonesWithDistribution = new Set([...zonesWithDuct, ...zonesWithPipe, ...zonesWithVRF]);

        // Ventilation (ASHRAE 62.1)
        const zonesWithVentilation = new Set(
          (ventilationResult.data || [])
            .filter((v: any) => zoneIds.has(v.zone_id))
            .map((v: any) => v.zone_id)
        );

        // ERV sizing
        const zonesWithERV = new Set(
          (ervResult.data || [])
            .filter((e: any) => zoneIds.has(e.zone_id))
            .map((e: any) => e.zone_id)
        );

        // Acoustic calculations
        const zonesWithAcoustic = new Set(
          (acousticCalcsResult.data || [])
            .filter((ac: any) => zoneIds.has(ac.zone_id))
            .map((ac: any) => ac.zone_id)
        );

        // Calculate zone completeness using centralized weights (6 metrics including acoustic)
        const loadCalcPercent = (zonesWithLoadCalc.size / totalZones) * 100;
        const equipmentPercent = (zonesWithEquipment.size / totalZones) * 100;
        const distributionPercent = (zonesWithDistribution.size / totalZones) * 100;
        const ventilationPercent = (zonesWithVentilation.size / totalZones) * 100;
        const ervPercent = (zonesWithERV.size / totalZones) * 100;
        const acousticPercent = (zonesWithAcoustic.size / totalZones) * 100;

        const zoneCompleteness = calculateZoneCompletenessFromPercents(
          loadCalcPercent,
          equipmentPercent,
          distributionPercent,
          ventilationPercent,
          ervPercent,
          acousticPercent
        );

        // Count fully complete zones (all 6 metrics)
        let fullyCompleteZones = 0;
        zoneIds.forEach(zoneId => {
          if (
            zonesWithLoadCalc.has(zoneId) &&
            zonesWithEquipment.has(zoneId) &&
            zonesWithDistribution.has(zoneId) &&
            zonesWithVentilation.has(zoneId) &&
            zonesWithERV.has(zoneId) &&
            zonesWithAcoustic.has(zoneId)
          ) {
            fullyCompleteZones++;
          }
        });

        // Specialized tools for this project (14 tools @ ~7.14% each)
        const hasChilledWaterPlant = (chwPlantsResult.data || []).some((chw: any) => chw.project_id === project.id);
        const hasHotWaterPlant = (hwPlantsResult.data || []).some((hw: any) => hw.project_id === project.id);
        const hasSmokeControl = (smokeControlResult.data || []).some((sc: any) => sc.project_id === project.id);
        const hasThermalComfort = (thermalComfortResult.data || []).some((tc: any) => tc.project_id === project.id);
        const hasSBCCompliance = (sbcComplianceResult.data || []).some((sbc: any) => sbc.project_id === project.id);
        const hasASHRAE90_1Compliance = (ashrae90_1Result.data || []).some((a: any) => a.project_id === project.id);
        const hasAHUConfiguration = (ahuConfigsResult.data || []).some((ahu: any) => ahu.project_id === project.id);
        const hasFanSelections = (fanSelectionsResult?.data || []).some((f: any) => f.ahu_configurations?.project_id === project.id);
        const hasPumpSelections = (pumpSelectionsResult?.data || []).some((p: any) => p.pipe_systems?.project_id === project.id);
        const hasInsulationCalculations = (insulationCalcsResult.data || []).some((i: any) => i.project_id === project.id);
        const hasSequenceOfOperations = (sooResult.data || []).some((s: any) => s.project_id === project.id);
        const hasCoilSelections = (coilSelectionsResult.data || []).some((c: any) => c.project_id === project.id);
        const hasFilterSelections = (filterSelectionsResult.data || []).some((f: any) => f.project_id === project.id);
        const hasCoolingTowerSelections = (coolingTowerSelectionsResult.data || []).some((ct: any) => ct.project_id === project.id);
        
        // Phase 18 specialized tools
        const hasEconomizerSelections = (economizerSelectionsResult?.data || []).some((e: any) => e.project_id === project.id);
        const hasControlValveSelections = (controlValveSelectionsResult?.data || []).some((cv: any) => cv.project_id === project.id);
        const hasExpansionTankSelections = (expansionTankSelectionsResult?.data || []).some((et: any) => et.project_id === project.id);
        const hasSilencerSelections = (silencerSelectionsResult?.data || []).some((s: any) => s.project_id === project.id);
        const hasVibrationIsolationSelections = (vibrationIsolationSelectionsResult?.data || []).some((vi: any) => vi.project_id === project.id);
        
        const completedToolsCount = [
          hasChilledWaterPlant, hasHotWaterPlant, hasSmokeControl, hasThermalComfort, 
          hasSBCCompliance, hasASHRAE90_1Compliance, hasAHUConfiguration,
          hasFanSelections, hasPumpSelections, hasInsulationCalculations, hasSequenceOfOperations,
          hasCoilSelections, hasFilterSelections, hasCoolingTowerSelections,
          // Phase 18 tools
          hasEconomizerSelections, hasControlValveSelections, hasExpansionTankSelections,
          hasSilencerSelections, hasVibrationIsolationSelections
        ].filter(Boolean).length;
        
        const specializedToolsScore = calculateSpecializedToolsScore({
          hasChilledWaterPlant,
          hasHotWaterPlant,
          hasSmokeControl,
          hasThermalComfort,
          hasSBCCompliance,
          hasASHRAE90_1Compliance,
          hasAHUConfiguration,
          hasFanSelections,
          hasPumpSelections,
          hasInsulationCalculations,
          hasSequenceOfOperations,
          hasCoilSelections,
          hasFilterSelections,
          hasCoolingTowerSelections,
          // Phase 18 specialized tools - now tracked!
          hasEconomizerSelections,
          hasControlValveSelections,
          hasExpansionTankSelections,
          hasSilencerSelections,
          hasVibrationIsolationSelections,
        });

        // Calculate combined health score
        const combinedHealthScore = calculateCombinedHealthScore(zoneCompleteness, specializedToolsScore);
        const severity = getSeverity(combinedHealthScore);

        return {
          projectId: project.id,
          projectName: project.name,
          projectStatus: project.status || 'active',
          zoneCompleteness,
          totalZones,
          fullyCompleteZones,
          specializedToolsScore,
          hasChilledWaterPlant,
          hasHotWaterPlant,
          hasSmokeControl,
          hasThermalComfort,
          hasSBCCompliance,
          hasASHRAE90_1Compliance,
          hasAHUConfiguration,
          hasFanSelections,
          hasPumpSelections,
          hasInsulationCalculations,
          hasSequenceOfOperations,
          hasCoilSelections,
          hasFilterSelections,
          hasCoolingTowerSelections,
          // Phase 18: 5 new specialized tools
          hasEconomizerSelections,
          hasControlValveSelections,
          hasExpansionTankSelections,
          hasSilencerSelections,
          hasVibrationIsolationSelections,
          completedToolsCount,
          combinedHealthScore,
          healthStatus: severity.id
        };
      });

      // Calculate summary
      const summary = calculateSummary(projectHealthData);

      return { projects: projectHealthData, summary };
    },
    enabled: !!organization?.id
  });
};

function createEmptyProjectHealth(project: { id: string; name: string; status: string | null }): ProjectDesignHealth {
  return {
    projectId: project.id,
    projectName: project.name,
    projectStatus: project.status || 'active',
    zoneCompleteness: 0,
    totalZones: 0,
    fullyCompleteZones: 0,
    specializedToolsScore: 0,
    hasChilledWaterPlant: false,
    hasHotWaterPlant: false,
    hasSmokeControl: false,
    hasThermalComfort: false,
    hasSBCCompliance: false,
    hasASHRAE90_1Compliance: false,
    hasAHUConfiguration: false,
    hasFanSelections: false,
    hasPumpSelections: false,
    hasInsulationCalculations: false,
    hasSequenceOfOperations: false,
    hasCoilSelections: false,
    hasFilterSelections: false,
    hasCoolingTowerSelections: false,
    // Phase 18: 5 new specialized tools
    hasEconomizerSelections: false,
    hasControlValveSelections: false,
    hasExpansionTankSelections: false,
    hasSilencerSelections: false,
    hasVibrationIsolationSelections: false,
    completedToolsCount: 0,
    combinedHealthScore: 0,
    healthStatus: 'critical'
  };
}

function getEmptySummary(): DesignHealthSummary {
  return {
    averageCombinedScore: 0,
    averageZoneCompleteness: 0,
    averageSpecializedScore: 0,
    totalProjects: 0,
    criticalProjects: 0,
    warningProjects: 0,
    goodProjects: 0,
    completeProjects: 0
  };
}

function calculateSummary(projects: ProjectDesignHealth[]): DesignHealthSummary {
  if (projects.length === 0) return getEmptySummary();

  const totalProjects = projects.length;
  const totalCombined = projects.reduce((sum, p) => sum + p.combinedHealthScore, 0);
  const totalZone = projects.reduce((sum, p) => sum + p.zoneCompleteness, 0);
  const totalSpecialized = projects.reduce((sum, p) => sum + p.specializedToolsScore, 0);

  return {
    averageCombinedScore: Math.round(totalCombined / totalProjects),
    averageZoneCompleteness: Math.round(totalZone / totalProjects),
    averageSpecializedScore: Math.round(totalSpecialized / totalProjects),
    totalProjects,
    criticalProjects: projects.filter(p => p.healthStatus === 'critical').length,
    warningProjects: projects.filter(p => p.healthStatus === 'warning').length,
    goodProjects: projects.filter(p => p.healthStatus === 'good').length,
    completeProjects: projects.filter(p => p.healthStatus === 'complete').length
  };
}
