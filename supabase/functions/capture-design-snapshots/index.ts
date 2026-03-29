import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============== Zone Metric Weights (Local Copy) ==============
// IMPORTANT: Keep these weights in sync with src/lib/design-completeness-utils.ts
// Edge functions cannot import from src/lib, so we maintain a local copy.
const ZONE_WEIGHTS = {
  loadCalc: 0.25,      // 25% - Load Calculation
  equipment: 0.20,     // 20% - Equipment Selection
  distribution: 0.20,  // 20% - Distribution System (Duct/Pipe/VRF)
  ventilation: 0.15,   // 15% - Ventilation (ASHRAE 62.1)
  erv: 0.10,           // 10% - ERV/HRV Sizing
  acoustic: 0.10,      // 10% - Acoustic Analysis (NC Compliance)
} as const;

/**
 * Calculate zone completeness from percentage values using centralized weights
 */
function calculateZoneCompletenessFromPercents(
  loadCalcPercent: number,
  equipmentPercent: number,
  distributionPercent: number,
  ventilationPercent: number,
  ervPercent: number,
  acousticPercent: number = 0
): number {
  return Math.round(
    (loadCalcPercent * ZONE_WEIGHTS.loadCalc) +
    (equipmentPercent * ZONE_WEIGHTS.equipment) +
    (distributionPercent * ZONE_WEIGHTS.distribution) +
    (ventilationPercent * ZONE_WEIGHTS.ventilation) +
    (ervPercent * ZONE_WEIGHTS.erv) +
    (acousticPercent * ZONE_WEIGHTS.acoustic)
  );
}

interface ZoneCompletionData {
  zoneId: string;
  buildingId: string;
  buildingName: string;
  hasLoadCalc: boolean;
  hasEquipment: boolean;
  hasDistribution: boolean;
  hasVentilation: boolean;
  hasERV: boolean;
  hasAcoustic: boolean;
  meetsNCTarget: boolean | null;
}

interface BuildingMetrics {
  buildingId: string;
  buildingName: string;
  totalZones: number;
  zonesWithLoadCalc: number;
  zonesWithEquipment: number;
  zonesWithDistribution: number;
  zonesWithVentilation: number;
  zonesWithERV: number;
  zonesWithAcoustic: number;
  zonesPassingNC: number;
  fullyCompleteZones: number;
  overallCompletenessPercent: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for optional project filtering
    let targetProjectId: string | null = null;
    try {
      const body = await req.json();
      targetProjectId = body.project_id || null;
    } catch {
      // No body or invalid JSON - process all projects
    }

    const today = new Date().toISOString().split("T")[0];
    
    console.log(`Starting design completeness snapshot capture for ${today}`);
    console.log(targetProjectId ? `Target project: ${targetProjectId}` : "Processing all active projects");

    // Fetch projects to process
    let projectsQuery = supabase
      .from("projects")
      .select("id, organization_id, name")
      .eq("status", "active");

    if (targetProjectId) {
      projectsQuery = projectsQuery.eq("id", targetProjectId);
    }

    const { data: projects, error: projectsError } = await projectsQuery;

    if (projectsError) {
      throw new Error(`Failed to fetch projects: ${projectsError.message}`);
    }

    if (!projects || projects.length === 0) {
      console.log("No active projects found");
      return new Response(
        JSON.stringify({ success: true, message: "No active projects to process", snapshots: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${projects.length} project(s) to process`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const project of projects) {
      try {
        console.log(`Processing project: ${project.name} (${project.id})`);

        // Get all zones for this project through the hierarchy
        const { data: zones, error: zonesError } = await supabase
          .from("zones")
          .select(`
            id,
            floors!inner (
              id,
              buildings!inner (
                id,
                name,
                project_id
              )
            )
          `)
          .eq("floors.buildings.project_id", project.id);

        if (zonesError) {
          throw new Error(`Failed to fetch zones: ${zonesError.message}`);
        }

        if (!zones || zones.length === 0) {
          console.log(`No zones found for project ${project.name}, skipping`);
          continue;
        }

        const zoneIds = zones.map((z) => z.id);
        console.log(`Found ${zoneIds.length} zones in project`);

        // Fetch completion data in parallel - including acoustic calculations and boiler selections
        const [
          loadCalcsResult,
          equipmentResult,
          ductResult,
          pipeResult,
          vrfResult,
          ventilationResult,
          ervResult,
          acousticCalcsResult,
          // Specialized tools (project-level) - 6 tools
          chilledWaterPlantsResult,
          hotWaterPlantsResult,
          smokeControlResult,
          thermalComfortResult,
          sbcComplianceResult,
          ashrae90_1ComplianceResult,
          // Boiler and chiller selections
          boilerSelectionsResult,
          chillerSelectionsResult,
          // Phase 18: 5 new specialized tools
          economizerSelectionsResult,
          controlValveSelectionsResult,
          expansionTankSelectionsResult,
          silencerSelectionsResult,
          vibrationIsolationSelectionsResult,
          // 8 remaining specialized tools (AHU, fans, pumps, insulation, SOO, coils, filters, cooling towers)
          ahuConfigurationsResult,
          fanSelectionsResult,
          pumpSelectionsResult,
          insulationCalculationsResult,
          sequenceOfOperationsResult,
          coilSelectionsResult,
          filterSelectionsResult,
          coolingTowerSelectionsResult,
        ] = await Promise.all([
          supabase.from("load_calculations").select("zone_id").in("zone_id", zoneIds),
          supabase.from("equipment_selections").select("zone_id").in("zone_id", zoneIds),
          supabase.from("duct_system_zones").select("zone_id").in("zone_id", zoneIds),
          supabase.from("pipe_system_zones").select("zone_id").in("zone_id", zoneIds),
          supabase.from("vrf_indoor_units").select("zone_id").in("zone_id", zoneIds),
          supabase.from("ventilation_zone_results").select("zone_id").in("zone_id", zoneIds),
          supabase.from("erv_sizing_calculations").select("zone_id").in("zone_id", zoneIds),
          supabase.from("acoustic_calculations").select("zone_id, meets_target").in("zone_id", zoneIds),
          // Specialized tools queries (6 tools)
          supabase.from("chilled_water_plants").select("id").eq("project_id", project.id).limit(1),
          supabase.from("hot_water_plants").select("id").eq("project_id", project.id).limit(1),
          supabase.from("smoke_control_calculations").select("id").eq("project_id", project.id).limit(1),
          supabase.from("thermal_comfort_analyses").select("id").eq("project_id", project.id).limit(1),
          supabase.from("sbc_compliance_checks").select("id").eq("project_id", project.id).limit(1),
          supabase.from("ashrae_90_1_compliance_checks").select("id").eq("project_id", project.id).limit(1),
          // Boiler and chiller selections for HW/CHW plants
          supabase.from("boiler_selections").select("id, selected_capacity_btuh, afue").eq("project_id", project.id),
          supabase.from("chiller_selections").select("id, rated_capacity_tons, rated_cop, rated_iplv").eq("project_id", project.id),
          // Phase 18: 5 new specialized tools queries
          supabase.from("economizer_selections").select("id").eq("project_id", project.id).limit(1),
          supabase.from("control_valve_selections").select("id").eq("project_id", project.id).limit(1),
          supabase.from("expansion_tank_selections").select("id").eq("project_id", project.id).limit(1),
          supabase.from("silencer_selections").select("id").eq("project_id", project.id).limit(1),
          supabase.from("vibration_isolation_selections").select("id").eq("project_id", project.id).limit(1),
          // 8 remaining specialized tools queries
          supabase.from("ahu_configurations").select("id").eq("project_id", project.id).limit(1),
          supabase.from("fan_selections").select("id, ahu_configurations!inner(project_id)").eq("ahu_configurations.project_id", project.id).limit(1),
          supabase.from("pump_selections").select("id, pipe_systems!inner(project_id)").eq("pipe_systems.project_id", project.id).limit(1),
          supabase.from("insulation_calculations").select("id").eq("project_id", project.id).limit(1),
          supabase.from("sequence_of_operations").select("id").eq("project_id", project.id).limit(1),
          supabase.from("coil_selections").select("id").eq("project_id", project.id).limit(1),
          supabase.from("filter_selections").select("id").eq("project_id", project.id).limit(1),
          supabase.from("cooling_tower_selections").select("id").eq("project_id", project.id).limit(1),
        ]);

        // Calculate boiler selection metrics
        const boilerSelections = boilerSelectionsResult.data || [];
        const boilerSelectionCount = boilerSelections.length;
        const boilerTotalCapacityMbh = boilerSelections.reduce(
          (sum: number, b: { selected_capacity_btuh?: number | null }) => sum + ((b.selected_capacity_btuh || 0) / 1000), 0
        );
        const boilerAvgAfue = boilerSelectionCount > 0
          ? boilerSelections.reduce((sum: number, b: { afue?: number | null }) => sum + (b.afue || 0), 0) / boilerSelectionCount
          : 0;

        // Calculate chiller selection metrics
        const chillerSelections = chillerSelectionsResult.data || [];
        const chillerSelectionCount = chillerSelections.length;
        const chillerTotalCapacityTons = chillerSelections.reduce(
          (sum: number, c: { rated_capacity_tons?: number | null }) => sum + (c.rated_capacity_tons || 0), 0
        );
        const chillerAvgIplv = chillerSelectionCount > 0
          ? chillerSelections.reduce((sum: number, c: { rated_iplv?: number | null }) => sum + (c.rated_iplv || 0), 0) / chillerSelectionCount
          : 0;

        // Determine specialized tools completion status (original 6 tools)
        const hasChwPlant = (chilledWaterPlantsResult.data?.length || 0) > 0;
        const hasHwPlant = (hotWaterPlantsResult.data?.length || 0) > 0;
        const hasSmokeControl = (smokeControlResult.data?.length || 0) > 0;
        const hasThermalComfort = (thermalComfortResult.data?.length || 0) > 0;
        const hasSbcCompliance = (sbcComplianceResult.data?.length || 0) > 0;
        const hasAshrae90_1Compliance = (ashrae90_1ComplianceResult.data?.length || 0) > 0;
        
        // Phase 18: 5 new specialized tools
        const hasEconomizerSelections = (economizerSelectionsResult.data?.length || 0) > 0;
        const hasControlValveSelections = (controlValveSelectionsResult.data?.length || 0) > 0;
        const hasExpansionTankSelections = (expansionTankSelectionsResult.data?.length || 0) > 0;
        const hasSilencerSelections = (silencerSelectionsResult.data?.length || 0) > 0;
        const hasVibrationIsolationSelections = (vibrationIsolationSelectionsResult.data?.length || 0) > 0;
        
        // 8 remaining specialized tools (from stubbed to actual)
        const hasAHUConfigurations = (ahuConfigurationsResult.data?.length || 0) > 0;
        const hasFanSelections = (fanSelectionsResult.data?.length || 0) > 0;
        const hasPumpSelections = (pumpSelectionsResult.data?.length || 0) > 0;
        const hasInsulationCalculations = (insulationCalculationsResult.data?.length || 0) > 0;
        const hasSequenceOfOperations = (sequenceOfOperationsResult.data?.length || 0) > 0;
        const hasCoilSelections = (coilSelectionsResult.data?.length || 0) > 0;
        const hasFilterSelections = (filterSelectionsResult.data?.length || 0) > 0;
        const hasCoolingTowerSelections = (coolingTowerSelectionsResult.data?.length || 0) > 0;

        // Create sets for quick lookup
        const zonesWithLoadCalc = new Set(loadCalcsResult.data?.map((r) => r.zone_id) || []);
        const zonesWithEquipment = new Set(equipmentResult.data?.map((r) => r.zone_id) || []);
        const zonesWithDistribution = new Set([
          ...(ductResult.data?.map((r) => r.zone_id) || []),
          ...(pipeResult.data?.map((r) => r.zone_id) || []),
          ...(vrfResult.data?.map((r) => r.zone_id) || []),
        ]);
        const zonesWithVentilation = new Set(ventilationResult.data?.map((r) => r.zone_id) || []);
        const zonesWithERV = new Set(ervResult.data?.map((r) => r.zone_id) || []);
        const zonesWithAcoustic = new Set(acousticCalcsResult.data?.map((r) => r.zone_id) || []);

        // Calculate NC compliance per zone (all calculations must meet target)
        const zoneNCStatus = new Map<string, boolean>();
        acousticCalcsResult.data?.forEach((calc: { zone_id: string; meets_target: boolean | null }) => {
          const current = zoneNCStatus.get(calc.zone_id) ?? true;
          zoneNCStatus.set(calc.zone_id, current && (calc.meets_target ?? true));
        });

        // Build zone completion data with building info
        const zoneCompletionData: ZoneCompletionData[] = zones.map((zone) => {
          const building = (zone.floors as any).buildings;
          return {
            zoneId: zone.id,
            buildingId: building.id,
            buildingName: building.name,
            hasLoadCalc: zonesWithLoadCalc.has(zone.id),
            hasEquipment: zonesWithEquipment.has(zone.id),
            hasDistribution: zonesWithDistribution.has(zone.id),
            hasVentilation: zonesWithVentilation.has(zone.id),
            hasERV: zonesWithERV.has(zone.id),
            hasAcoustic: zonesWithAcoustic.has(zone.id),
            meetsNCTarget: zoneNCStatus.get(zone.id) ?? null,
          };
        });

        // Calculate project-level metrics
        const totalZones = zoneCompletionData.length;
        const zonesWithLoadCalcCount = zoneCompletionData.filter((z) => z.hasLoadCalc).length;
        const zonesWithEquipmentCount = zoneCompletionData.filter((z) => z.hasEquipment).length;
        const zonesWithDistributionCount = zoneCompletionData.filter((z) => z.hasDistribution).length;
        const zonesWithVentilationCount = zoneCompletionData.filter((z) => z.hasVentilation).length;
        const zonesWithERVCount = zoneCompletionData.filter((z) => z.hasERV).length;
        const zonesWithAcousticCount = zoneCompletionData.filter((z) => z.hasAcoustic).length;
        const zonesPassingNCCount = zoneCompletionData.filter((z) => z.hasAcoustic && z.meetsNCTarget === true).length;
        
        // Fully complete now requires all 6 metrics
        const fullyCompleteZones = zoneCompletionData.filter(
          (z) => z.hasLoadCalc && z.hasEquipment && z.hasDistribution && z.hasVentilation && z.hasERV && z.hasAcoustic
        ).length;

        const loadCalcPercent = totalZones > 0 ? Math.round((zonesWithLoadCalcCount / totalZones) * 100) : 0;
        const equipmentPercent = totalZones > 0 ? Math.round((zonesWithEquipmentCount / totalZones) * 100) : 0;
        const distributionPercent = totalZones > 0 ? Math.round((zonesWithDistributionCount / totalZones) * 100) : 0;
        const ventilationPercent = totalZones > 0 ? Math.round((zonesWithVentilationCount / totalZones) * 100) : 0;
        const ervPercent = totalZones > 0 ? Math.round((zonesWithERVCount / totalZones) * 100) : 0;
        const acousticPercent = totalZones > 0 ? Math.round((zonesWithAcousticCount / totalZones) * 100) : 0;
        const ncCompliancePercent = zonesWithAcousticCount > 0 ? Math.round((zonesPassingNCCount / zonesWithAcousticCount) * 100) : 0;
        
        // Use centralized weight calculation (now with acoustic)
        const overallPercent = calculateZoneCompletenessFromPercents(
          loadCalcPercent,
          equipmentPercent,
          distributionPercent,
          ventilationPercent,
          ervPercent,
          acousticPercent
        );

        // Upsert project snapshot
        const { data: snapshot, error: snapshotError } = await supabase
          .from("design_completeness_snapshots")
          .upsert(
            {
              project_id: project.id,
              organization_id: project.organization_id,
              snapshot_date: today,
              total_zones: totalZones,
              zones_with_load_calc: zonesWithLoadCalcCount,
              zones_with_equipment: zonesWithEquipmentCount,
              zones_with_distribution: zonesWithDistributionCount,
              zones_with_ventilation: zonesWithVentilationCount,
              zones_with_erv: zonesWithERVCount,
              zones_with_acoustic: zonesWithAcousticCount,
              zones_passing_nc: zonesPassingNCCount,
              fully_complete_zones: fullyCompleteZones,
              overall_completeness_percent: overallPercent,
              load_calc_percent: loadCalcPercent,
              equipment_percent: equipmentPercent,
              distribution_percent: distributionPercent,
              ventilation_percent: ventilationPercent,
              erv_percent: ervPercent,
              acoustic_percent: acousticPercent,
              nc_compliance_percent: ncCompliancePercent,
              // Specialized tools flags (6 tools)
              has_chw_plant: hasChwPlant,
              has_hw_plant: hasHwPlant,
              has_smoke_control: hasSmokeControl,
              has_thermal_comfort: hasThermalComfort,
              has_sbc_compliance: hasSbcCompliance,
              has_ashrae_90_1_compliance: hasAshrae90_1Compliance,
              // Boiler and chiller selection metrics
              boiler_selection_count: boilerSelectionCount,
              boiler_total_capacity_mbh: boilerTotalCapacityMbh,
              boiler_avg_afue: boilerAvgAfue,
              chiller_selection_count: chillerSelectionCount,
              chiller_total_capacity_tons: chillerTotalCapacityTons,
              chiller_avg_iplv: chillerAvgIplv,
              // Phase 18: 5 new specialized tools flags
              has_economizer_selections: hasEconomizerSelections,
              has_control_valve_selections: hasControlValveSelections,
              has_expansion_tank_selections: hasExpansionTankSelections,
              has_silencer_selections: hasSilencerSelections,
              has_vibration_isolation_selections: hasVibrationIsolationSelections,
              // 8 remaining specialized tools flags
              has_ahu_configurations: hasAHUConfigurations,
              has_fan_selections: hasFanSelections,
              has_pump_selections: hasPumpSelections,
              has_insulation_calculations: hasInsulationCalculations,
              has_sequence_of_operations: hasSequenceOfOperations,
              has_coil_selections: hasCoilSelections,
              has_filter_selections: hasFilterSelections,
              has_cooling_tower_selections: hasCoolingTowerSelections,
            },
            {
              onConflict: "project_id,snapshot_date",
            }
          )
          .select()
          .single();

        if (snapshotError) {
          throw new Error(`Failed to upsert snapshot: ${snapshotError.message}`);
        }

        console.log(`Created/updated project snapshot: ${snapshot.id}`);

        // Calculate building-level metrics
        const buildingMap = new Map<string, BuildingMetrics>();
        
        for (const zone of zoneCompletionData) {
          if (!buildingMap.has(zone.buildingId)) {
            buildingMap.set(zone.buildingId, {
              buildingId: zone.buildingId,
              buildingName: zone.buildingName,
              totalZones: 0,
              zonesWithLoadCalc: 0,
              zonesWithEquipment: 0,
              zonesWithDistribution: 0,
              zonesWithVentilation: 0,
              zonesWithERV: 0,
              zonesWithAcoustic: 0,
              zonesPassingNC: 0,
              fullyCompleteZones: 0,
              overallCompletenessPercent: 0,
            });
          }
          
          const metrics = buildingMap.get(zone.buildingId)!;
          metrics.totalZones++;
          if (zone.hasLoadCalc) metrics.zonesWithLoadCalc++;
          if (zone.hasEquipment) metrics.zonesWithEquipment++;
          if (zone.hasDistribution) metrics.zonesWithDistribution++;
          if (zone.hasVentilation) metrics.zonesWithVentilation++;
          if (zone.hasERV) metrics.zonesWithERV++;
          if (zone.hasAcoustic) metrics.zonesWithAcoustic++;
          if (zone.hasAcoustic && zone.meetsNCTarget === true) metrics.zonesPassingNC++;
          if (zone.hasLoadCalc && zone.hasEquipment && zone.hasDistribution && zone.hasVentilation && zone.hasERV && zone.hasAcoustic) {
            metrics.fullyCompleteZones++;
          }
        }

        // Calculate percentages for each building
        for (const metrics of buildingMap.values()) {
          if (metrics.totalZones > 0) {
            const lc = (metrics.zonesWithLoadCalc / metrics.totalZones) * 100;
            const eq = (metrics.zonesWithEquipment / metrics.totalZones) * 100;
            const dist = (metrics.zonesWithDistribution / metrics.totalZones) * 100;
            const vent = (metrics.zonesWithVentilation / metrics.totalZones) * 100;
            const erv = (metrics.zonesWithERV / metrics.totalZones) * 100;
            const acoustic = (metrics.zonesWithAcoustic / metrics.totalZones) * 100;
            // Use centralized weight calculation
            metrics.overallCompletenessPercent = calculateZoneCompletenessFromPercents(lc, eq, dist, vent, erv, acoustic);
          }
        }

        // Delete existing building snapshots for this snapshot (in case of re-run)
        await supabase
          .from("design_completeness_building_snapshots")
          .delete()
          .eq("snapshot_id", snapshot.id);

        // Insert building snapshots
        const buildingSnapshots = Array.from(buildingMap.values()).map((m) => ({
          snapshot_id: snapshot.id,
          building_id: m.buildingId,
          building_name: m.buildingName,
          total_zones: m.totalZones,
          zones_with_load_calc: m.zonesWithLoadCalc,
          zones_with_equipment: m.zonesWithEquipment,
          zones_with_distribution: m.zonesWithDistribution,
          zones_with_ventilation: m.zonesWithVentilation,
          zones_with_erv: m.zonesWithERV,
          zones_with_acoustic: m.zonesWithAcoustic,
          zones_passing_nc: m.zonesPassingNC,
          fully_complete_zones: m.fullyCompleteZones,
          overall_completeness_percent: m.overallCompletenessPercent,
        }));

        if (buildingSnapshots.length > 0) {
          const { error: buildingError } = await supabase
            .from("design_completeness_building_snapshots")
            .insert(buildingSnapshots);

          if (buildingError) {
            console.warn(`Warning: Failed to insert building snapshots: ${buildingError.message}`);
          } else {
            console.log(`Inserted ${buildingSnapshots.length} building snapshot(s)`);
          }
        }

        successCount++;
        console.log(`Successfully processed project: ${project.name}`);
      } catch (projectError) {
        errorCount++;
        const errorMessage = projectError instanceof Error ? projectError.message : String(projectError);
        errors.push(`${project.name}: ${errorMessage}`);
        console.error(`Error processing project ${project.name}: ${errorMessage}`);
      }
    }

    const summary = {
      success: true,
      date: today,
      projectsProcessed: successCount,
      projectsFailed: errorCount,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log(`Snapshot capture complete: ${successCount} success, ${errorCount} failed`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Fatal error in capture-design-snapshots:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
