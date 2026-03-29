import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ASHRAE 90.1-2019 Table 6.8.1-6 Minimum Efficiency Requirements
// Based on boiler type and capacity
const ASHRAE_90_1_MINIMUMS = {
  // Gas-fired (all sizes)
  condensing_gas: {
    afue: 95, // Condensing boilers should achieve >= 95% AFUE
    thermal_efficiency: 90,
  },
  non_condensing_gas: {
    afue: 82, // Standard non-condensing >= 82% AFUE
    thermal_efficiency: 80,
  },
  // Oil-fired
  oil: {
    afue: 85, // Oil-fired boilers >= 85% AFUE
    thermal_efficiency: 82,
  },
  // Electric (resistance)
  electric: {
    afue: 99, // Electric resistance essentially 100% efficient
    thermal_efficiency: 99,
  },
  // Propane (treat like gas)
  propane: {
    afue: 82,
    thermal_efficiency: 80,
  },
};

interface BoilerSelection {
  id: string;
  selection_name: string;
  boiler_type: string | null;
  fuel_type: string | null;
  afue: number | null;
  thermal_efficiency: number | null;
  selected_capacity_btuh: number | null;
  project_id: string | null;
  hot_water_plant_id: string | null;
  updated_at: string | null;
  organization_id: string;
}

interface HotWaterPlant {
  id: string;
  plant_name: string;
  updated_at: string | null;
}

interface ComplianceAlert {
  boiler_selection_id: string;
  selection_name: string;
  project_id: string | null;
  organization_id: string;
  alert_type: 'efficiency_below_minimum' | 'stale_design';
  severity: 'warning' | 'error';
  message: string;
  details: Record<string, unknown>;
}

function getMinimumRequirements(boilerType: string | null, fuelType: string | null): { afue: number; thermal_efficiency: number } | null {
  const type = boilerType?.toLowerCase() || '';
  const fuel = fuelType?.toLowerCase() || '';

  // Determine the category
  if (fuel === 'electric' || fuel === 'electricity') {
    return ASHRAE_90_1_MINIMUMS.electric;
  }
  
  if (fuel === 'oil' || type.includes('oil')) {
    return ASHRAE_90_1_MINIMUMS.oil;
  }

  if (fuel === 'propane') {
    return ASHRAE_90_1_MINIMUMS.propane;
  }

  // Gas-fired (natural gas is default)
  if (type.includes('condensing')) {
    return ASHRAE_90_1_MINIMUMS.condensing_gas;
  }

  // Default to non-condensing gas
  return ASHRAE_90_1_MINIMUMS.non_condensing_gas;
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

    // Parse request body for optional filtering
    let targetProjectId: string | null = null;
    let targetOrganizationId: string | null = null;
    try {
      const body = await req.json();
      targetProjectId = body.project_id || null;
      targetOrganizationId = body.organization_id || null;
    } catch {
      // No body or invalid JSON - process all
    }

    console.log("Starting boiler efficiency compliance check");
    console.log(targetProjectId ? `Target project: ${targetProjectId}` : "Processing all projects");

    // Build query for boiler selections
    let selectionsQuery = supabase
      .from("boiler_selections")
      .select("id, selection_name, boiler_type, fuel_type, afue, thermal_efficiency, selected_capacity_btuh, project_id, hot_water_plant_id, updated_at, organization_id");

    if (targetProjectId) {
      selectionsQuery = selectionsQuery.eq("project_id", targetProjectId);
    }
    if (targetOrganizationId) {
      selectionsQuery = selectionsQuery.eq("organization_id", targetOrganizationId);
    }

    const { data: boilerSelections, error: selectionsError } = await selectionsQuery;

    if (selectionsError) {
      throw new Error(`Failed to fetch boiler selections: ${selectionsError.message}`);
    }

    if (!boilerSelections || boilerSelections.length === 0) {
      console.log("No boiler selections found");
      return new Response(
        JSON.stringify({ success: true, message: "No boiler selections to check", alerts: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${boilerSelections.length} boiler selection(s) to check`);

    const alerts: ComplianceAlert[] = [];

    // Get hot water plants for stale design detection
    const plantIds = [...new Set(boilerSelections.map(b => b.hot_water_plant_id).filter(Boolean))];
    let plantsMap = new Map<string, HotWaterPlant>();

    if (plantIds.length > 0) {
      const { data: plants } = await supabase
        .from("hot_water_plants")
        .select("id, plant_name, updated_at")
        .in("id", plantIds);

      if (plants) {
        plants.forEach((p: HotWaterPlant) => plantsMap.set(p.id, p));
      }
    }

    // Check each boiler selection
    for (const boiler of boilerSelections as BoilerSelection[]) {
      const requirements = getMinimumRequirements(boiler.boiler_type, boiler.fuel_type);
      
      if (!requirements) {
        console.log(`Could not determine requirements for boiler: ${boiler.selection_name}`);
        continue;
      }

      // Check AFUE compliance
      if (boiler.afue !== null && boiler.afue < requirements.afue) {
        const deficit = requirements.afue - boiler.afue;
        alerts.push({
          boiler_selection_id: boiler.id,
          selection_name: boiler.selection_name,
          project_id: boiler.project_id,
          organization_id: boiler.organization_id,
          alert_type: 'efficiency_below_minimum',
          severity: deficit > 5 ? 'error' : 'warning',
          message: `AFUE ${boiler.afue}% is below ASHRAE 90.1 minimum of ${requirements.afue}%`,
          details: {
            boiler_type: boiler.boiler_type,
            fuel_type: boiler.fuel_type,
            actual_afue: boiler.afue,
            required_afue: requirements.afue,
            deficit_percent: deficit,
            capacity_btuh: boiler.selected_capacity_btuh,
          },
        });
      }

      // Check for stale design (plant updated after boiler selection)
      if (boiler.hot_water_plant_id && boiler.updated_at) {
        const plant = plantsMap.get(boiler.hot_water_plant_id);
        if (plant && plant.updated_at) {
          const boilerUpdated = new Date(boiler.updated_at);
          const plantUpdated = new Date(plant.updated_at);
          
          // Plant was updated after boiler selection - design may be stale
          if (plantUpdated > boilerUpdated) {
            const daysDiff = Math.floor((plantUpdated.getTime() - boilerUpdated.getTime()) / (1000 * 60 * 60 * 24));
            alerts.push({
              boiler_selection_id: boiler.id,
              selection_name: boiler.selection_name,
              project_id: boiler.project_id,
              organization_id: boiler.organization_id,
              alert_type: 'stale_design',
              severity: daysDiff > 7 ? 'warning' : 'warning',
              message: `HW Plant "${plant.plant_name}" was updated ${daysDiff} day(s) after boiler selection`,
              details: {
                plant_name: plant.plant_name,
                plant_updated_at: plant.updated_at,
                boiler_updated_at: boiler.updated_at,
                days_stale: daysDiff,
              },
            });
          }
        }
      }
    }

    // Group alerts by severity
    const errorCount = alerts.filter(a => a.severity === 'error').length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;

    console.log(`Generated ${alerts.length} alert(s): ${errorCount} error(s), ${warningCount} warning(s)`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          boilers_checked: boilerSelections.length,
          total_alerts: alerts.length,
          errors: errorCount,
          warnings: warningCount,
        },
        alerts,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error in boiler-efficiency-alerts: ${errorMessage}`);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
