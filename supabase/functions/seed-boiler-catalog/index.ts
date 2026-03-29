import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Boiler catalog data with AHRI performance data
const boilerData = [
  // Lochinvar Condensing Gas Boilers
  {
    manufacturer: "Lochinvar",
    model_number: "KNIGHT-XL-1000",
    equipment_category: "boiler",
    equipment_subcategory: "condensing-gas",
    cooling_capacity_kw: 293, // 1,000 MBH
    eer: null,
    cop: null,
    iplv: null,
    afue: 0.96,
    thermal_efficiency: 0.96,
    combustion_efficiency: 0.98,
    turndown_ratio: 10,
    min_modulation: 10,
    fuel_type: "natural-gas",
    voltage: "120V",
    power_input_kw: 0.8,
    full_load_amps: 6.7,
    sound_power_level_db: 65,
    weight_kg: 272,
    nox_emissions_ppm: 12,
    asme_compliant: true,
    saso_certified: true,
    list_price_sar: 95000,
  },
  {
    manufacturer: "Lochinvar",
    model_number: "KNIGHT-XL-1500",
    equipment_category: "boiler",
    equipment_subcategory: "condensing-gas",
    cooling_capacity_kw: 440, // 1,500 MBH
    afue: 0.96,
    thermal_efficiency: 0.96,
    combustion_efficiency: 0.98,
    turndown_ratio: 10,
    min_modulation: 10,
    fuel_type: "natural-gas",
    voltage: "120V",
    power_input_kw: 1.0,
    full_load_amps: 8.3,
    sound_power_level_db: 68,
    weight_kg: 340,
    nox_emissions_ppm: 12,
    asme_compliant: true,
    saso_certified: true,
    list_price_sar: 125000,
  },
  {
    manufacturer: "Lochinvar",
    model_number: "CREST-1000",
    equipment_category: "boiler",
    equipment_subcategory: "condensing-gas",
    cooling_capacity_kw: 293,
    afue: 0.95,
    thermal_efficiency: 0.95,
    combustion_efficiency: 0.97,
    turndown_ratio: 8,
    min_modulation: 12.5,
    fuel_type: "natural-gas",
    voltage: "120V",
    power_input_kw: 0.7,
    full_load_amps: 5.8,
    sound_power_level_db: 63,
    weight_kg: 250,
    nox_emissions_ppm: 15,
    asme_compliant: true,
    saso_certified: true,
    list_price_sar: 82000,
  },
  {
    manufacturer: "Lochinvar",
    model_number: "SYNC-2000",
    equipment_category: "boiler",
    equipment_subcategory: "condensing-gas",
    cooling_capacity_kw: 586, // 2,000 MBH
    afue: 0.97,
    thermal_efficiency: 0.97,
    combustion_efficiency: 0.99,
    turndown_ratio: 15,
    min_modulation: 7,
    fuel_type: "natural-gas",
    voltage: "120V",
    power_input_kw: 1.5,
    full_load_amps: 12.5,
    sound_power_level_db: 70,
    weight_kg: 450,
    nox_emissions_ppm: 10,
    asme_compliant: true,
    saso_certified: true,
    list_price_sar: 165000,
  },
  
  // Weil-McLain Boilers
  {
    manufacturer: "Weil-McLain",
    model_number: "EVERGREEN-850",
    equipment_category: "boiler",
    equipment_subcategory: "condensing-gas",
    cooling_capacity_kw: 249, // 850 MBH
    afue: 0.95,
    thermal_efficiency: 0.95,
    combustion_efficiency: 0.97,
    turndown_ratio: 10,
    min_modulation: 10,
    fuel_type: "natural-gas",
    voltage: "120V",
    power_input_kw: 0.6,
    full_load_amps: 5.0,
    sound_power_level_db: 62,
    weight_kg: 230,
    nox_emissions_ppm: 14,
    asme_compliant: true,
    saso_certified: true,
    list_price_sar: 78000,
  },
  {
    manufacturer: "Weil-McLain",
    model_number: "SLIMFIT-1100",
    equipment_category: "boiler",
    equipment_subcategory: "condensing-gas",
    cooling_capacity_kw: 322, // 1,100 MBH
    afue: 0.94,
    thermal_efficiency: 0.94,
    combustion_efficiency: 0.96,
    turndown_ratio: 5,
    min_modulation: 20,
    fuel_type: "natural-gas",
    voltage: "120V",
    power_input_kw: 0.8,
    full_load_amps: 6.7,
    sound_power_level_db: 64,
    weight_kg: 200,
    nox_emissions_ppm: 16,
    asme_compliant: true,
    saso_certified: true,
    list_price_sar: 72000,
  },
  {
    manufacturer: "Weil-McLain",
    model_number: "ULTRA-1500",
    equipment_category: "boiler",
    equipment_subcategory: "non-condensing-gas",
    cooling_capacity_kw: 440,
    afue: 0.84,
    thermal_efficiency: 0.84,
    combustion_efficiency: 0.86,
    turndown_ratio: 4,
    min_modulation: 25,
    fuel_type: "natural-gas",
    voltage: "120V",
    power_input_kw: 0.5,
    full_load_amps: 4.2,
    sound_power_level_db: 60,
    weight_kg: 320,
    nox_emissions_ppm: 30,
    asme_compliant: true,
    saso_certified: true,
    list_price_sar: 55000,
  },
  
  // Cleaver-Brooks Commercial Boilers
  {
    manufacturer: "Cleaver-Brooks",
    model_number: "CLEARFIRE-2000",
    equipment_category: "boiler",
    equipment_subcategory: "condensing-gas",
    cooling_capacity_kw: 586, // 2,000 MBH
    afue: 0.98,
    thermal_efficiency: 0.98,
    combustion_efficiency: 0.995,
    turndown_ratio: 20,
    min_modulation: 5,
    fuel_type: "natural-gas",
    voltage: "208V",
    power_input_kw: 2.0,
    full_load_amps: 5.6,
    sound_power_level_db: 72,
    weight_kg: 520,
    nox_emissions_ppm: 9,
    asme_compliant: true,
    saso_certified: true,
    list_price_sar: 195000,
  },
  {
    manufacturer: "Cleaver-Brooks",
    model_number: "CLEARFIRE-3000",
    equipment_category: "boiler",
    equipment_subcategory: "condensing-gas",
    cooling_capacity_kw: 879, // 3,000 MBH
    afue: 0.98,
    thermal_efficiency: 0.98,
    combustion_efficiency: 0.995,
    turndown_ratio: 20,
    min_modulation: 5,
    fuel_type: "natural-gas",
    voltage: "208V",
    power_input_kw: 3.0,
    full_load_amps: 8.3,
    sound_power_level_db: 75,
    weight_kg: 680,
    nox_emissions_ppm: 9,
    asme_compliant: true,
    saso_certified: true,
    list_price_sar: 265000,
  },
  {
    manufacturer: "Cleaver-Brooks",
    model_number: "CBEX-4000",
    equipment_category: "boiler",
    equipment_subcategory: "non-condensing-gas",
    cooling_capacity_kw: 1172, // 4,000 MBH
    afue: 0.85,
    thermal_efficiency: 0.85,
    combustion_efficiency: 0.88,
    turndown_ratio: 10,
    min_modulation: 10,
    fuel_type: "natural-gas",
    voltage: "460V",
    power_input_kw: 5.0,
    full_load_amps: 6.3,
    sound_power_level_db: 78,
    weight_kg: 1100,
    nox_emissions_ppm: 25,
    asme_compliant: true,
    saso_certified: true,
    list_price_sar: 185000,
  },
  
  // Fulton Boilers
  {
    manufacturer: "Fulton",
    model_number: "VANTAGE-1500",
    equipment_category: "boiler",
    equipment_subcategory: "condensing-gas",
    cooling_capacity_kw: 440,
    afue: 0.95,
    thermal_efficiency: 0.95,
    combustion_efficiency: 0.97,
    turndown_ratio: 8,
    min_modulation: 12.5,
    fuel_type: "natural-gas",
    voltage: "120V",
    power_input_kw: 1.0,
    full_load_amps: 8.3,
    sound_power_level_db: 66,
    weight_kg: 350,
    nox_emissions_ppm: 14,
    asme_compliant: true,
    saso_certified: true,
    list_price_sar: 115000,
  },
  {
    manufacturer: "Fulton",
    model_number: "TRIBUTE-2000",
    equipment_category: "boiler",
    equipment_subcategory: "condensing-gas",
    cooling_capacity_kw: 586,
    afue: 0.96,
    thermal_efficiency: 0.96,
    combustion_efficiency: 0.98,
    turndown_ratio: 10,
    min_modulation: 10,
    fuel_type: "natural-gas",
    voltage: "208V",
    power_input_kw: 1.5,
    full_load_amps: 4.2,
    sound_power_level_db: 68,
    weight_kg: 420,
    nox_emissions_ppm: 12,
    asme_compliant: true,
    saso_certified: true,
    list_price_sar: 145000,
  },
  
  // Oil-Fired Boilers
  {
    manufacturer: "Weil-McLain",
    model_number: "WTGO-5",
    equipment_category: "boiler",
    equipment_subcategory: "oil-fired",
    cooling_capacity_kw: 175, // 600 MBH
    afue: 0.86,
    thermal_efficiency: 0.86,
    combustion_efficiency: 0.88,
    turndown_ratio: 1,
    min_modulation: 100,
    fuel_type: "oil",
    voltage: "120V",
    power_input_kw: 0.5,
    full_load_amps: 4.2,
    sound_power_level_db: 70,
    weight_kg: 280,
    nox_emissions_ppm: 40,
    asme_compliant: true,
    saso_certified: false,
    list_price_sar: 48000,
  },
  
  // Electric Boilers
  {
    manufacturer: "Cleaver-Brooks",
    model_number: "ELECTRIC-500",
    equipment_category: "boiler",
    equipment_subcategory: "electric",
    cooling_capacity_kw: 146, // 500 MBH equivalent
    afue: 0.99,
    thermal_efficiency: 0.99,
    combustion_efficiency: 1.0,
    turndown_ratio: 10,
    min_modulation: 10,
    fuel_type: "electric",
    voltage: "480V",
    power_input_kw: 147,
    full_load_amps: 177,
    sound_power_level_db: 50,
    weight_kg: 400,
    nox_emissions_ppm: 0,
    asme_compliant: true,
    saso_certified: true,
    list_price_sar: 85000,
  },
  {
    manufacturer: "Fulton",
    model_number: "ELECTRIC-1000",
    equipment_category: "boiler",
    equipment_subcategory: "electric",
    cooling_capacity_kw: 293, // 1,000 MBH equivalent
    afue: 0.99,
    thermal_efficiency: 0.99,
    combustion_efficiency: 1.0,
    turndown_ratio: 10,
    min_modulation: 10,
    fuel_type: "electric",
    voltage: "480V",
    power_input_kw: 296,
    full_load_amps: 356,
    sound_power_level_db: 52,
    weight_kg: 600,
    nox_emissions_ppm: 0,
    asme_compliant: true,
    saso_certified: true,
    list_price_sar: 125000,
  },
  
  // Additional Models for Variety
  {
    manufacturer: "Lochinvar",
    model_number: "KNIGHT-XL-500",
    equipment_category: "boiler",
    equipment_subcategory: "condensing-gas",
    cooling_capacity_kw: 146,
    afue: 0.95,
    thermal_efficiency: 0.95,
    combustion_efficiency: 0.97,
    turndown_ratio: 5,
    min_modulation: 20,
    fuel_type: "natural-gas",
    voltage: "120V",
    power_input_kw: 0.5,
    full_load_amps: 4.2,
    sound_power_level_db: 60,
    weight_kg: 180,
    nox_emissions_ppm: 14,
    asme_compliant: true,
    saso_certified: true,
    list_price_sar: 58000,
  },
  {
    manufacturer: "Cleaver-Brooks",
    model_number: "CLEARFIRE-1000",
    equipment_category: "boiler",
    equipment_subcategory: "condensing-gas",
    cooling_capacity_kw: 293,
    afue: 0.97,
    thermal_efficiency: 0.97,
    combustion_efficiency: 0.99,
    turndown_ratio: 15,
    min_modulation: 7,
    fuel_type: "natural-gas",
    voltage: "120V",
    power_input_kw: 1.2,
    full_load_amps: 10.0,
    sound_power_level_db: 67,
    weight_kg: 380,
    nox_emissions_ppm: 10,
    asme_compliant: true,
    saso_certified: true,
    list_price_sar: 135000,
  },
  {
    manufacturer: "Weil-McLain",
    model_number: "EVERGREEN-1200",
    equipment_category: "boiler",
    equipment_subcategory: "condensing-gas",
    cooling_capacity_kw: 352,
    afue: 0.95,
    thermal_efficiency: 0.95,
    combustion_efficiency: 0.97,
    turndown_ratio: 10,
    min_modulation: 10,
    fuel_type: "natural-gas",
    voltage: "120V",
    power_input_kw: 0.9,
    full_load_amps: 7.5,
    sound_power_level_db: 64,
    weight_kg: 290,
    nox_emissions_ppm: 13,
    asme_compliant: true,
    saso_certified: true,
    list_price_sar: 98000,
  },
  {
    manufacturer: "Fulton",
    model_number: "VANTAGE-800",
    equipment_category: "boiler",
    equipment_subcategory: "condensing-gas",
    cooling_capacity_kw: 234,
    afue: 0.94,
    thermal_efficiency: 0.94,
    combustion_efficiency: 0.96,
    turndown_ratio: 6,
    min_modulation: 17,
    fuel_type: "natural-gas",
    voltage: "120V",
    power_input_kw: 0.7,
    full_load_amps: 5.8,
    sound_power_level_db: 62,
    weight_kg: 260,
    nox_emissions_ppm: 15,
    asme_compliant: true,
    saso_certified: true,
    list_price_sar: 75000,
  },
  // Propane Models
  {
    manufacturer: "Lochinvar",
    model_number: "KNIGHT-XL-1000-LP",
    equipment_category: "boiler",
    equipment_subcategory: "condensing-gas",
    cooling_capacity_kw: 293,
    afue: 0.95,
    thermal_efficiency: 0.95,
    combustion_efficiency: 0.97,
    turndown_ratio: 10,
    min_modulation: 10,
    fuel_type: "propane",
    voltage: "120V",
    power_input_kw: 0.8,
    full_load_amps: 6.7,
    sound_power_level_db: 65,
    weight_kg: 275,
    nox_emissions_ppm: 13,
    asme_compliant: true,
    saso_certified: true,
    list_price_sar: 98000,
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Check if boilers already exist
    const { count } = await supabase
      .from("equipment_catalog")
      .select("*", { count: "exact", head: true })
      .eq("equipment_category", "boiler");

    if (count && count > 0) {
      // Check for force reseed parameter
      const url = new URL(req.url);
      const forceReseed = url.searchParams.get("force") === "true";
      
      if (!forceReseed) {
        return new Response(
          JSON.stringify({ 
            seeded: false, 
            message: `Boiler catalog already contains ${count} items. Use ?force=true to reseed.` 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Delete existing boilers for reseed
      await supabase
        .from("equipment_catalog")
        .delete()
        .eq("equipment_category", "boiler");
    }

    // Insert boiler data
    const { data, error } = await supabase
      .from("equipment_catalog")
      .insert(boilerData.map(item => ({ ...item, is_active: true })));

    if (error) {
      console.error("Insert error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        seeded: true, 
        count: boilerData.length,
        message: `Successfully seeded ${boilerData.length} boiler models`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
