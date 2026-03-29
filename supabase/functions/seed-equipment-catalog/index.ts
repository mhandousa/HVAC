import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const equipmentData = [
  // Carrier Chillers
  { manufacturer: 'Carrier', model_number: '30XA-0302', equipment_category: 'chiller', equipment_subcategory: 'air-cooled scroll', cooling_capacity_kw: 302, cooling_capacity_tons: 86, cop: 2.9, eer: 9.9, iplv: 14.2, power_input_kw: 104, voltage: '380V', phases: 3, full_load_amps: 175, refrigerant_type: 'R-410A', saso_certified: true, ashrae_compliant: true, energy_rating_stars: 4, list_price_sar: 285000 },
  { manufacturer: 'Carrier', model_number: '30XA-0402', equipment_category: 'chiller', equipment_subcategory: 'air-cooled scroll', cooling_capacity_kw: 402, cooling_capacity_tons: 114, cop: 3.0, eer: 10.2, iplv: 15.1, power_input_kw: 134, voltage: '380V', phases: 3, full_load_amps: 225, refrigerant_type: 'R-410A', saso_certified: true, ashrae_compliant: true, energy_rating_stars: 4, list_price_sar: 345000 },
  { manufacturer: 'Carrier', model_number: '19XR-0500', equipment_category: 'chiller', equipment_subcategory: 'water-cooled centrifugal', cooling_capacity_kw: 1758, cooling_capacity_tons: 500, cop: 6.1, eer: 20.8, iplv: 23.5, power_input_kw: 288, voltage: '380V', phases: 3, full_load_amps: 485, refrigerant_type: 'R-134a', saso_certified: true, ashrae_compliant: true, energy_rating_stars: 5, list_price_sar: 890000 },

  // Trane Chillers
  { manufacturer: 'Trane', model_number: 'RTAC-200', equipment_category: 'chiller', equipment_subcategory: 'air-cooled scroll', cooling_capacity_kw: 703, cooling_capacity_tons: 200, cop: 2.85, eer: 9.7, iplv: 13.8, power_input_kw: 247, voltage: '380V', phases: 3, full_load_amps: 415, refrigerant_type: 'R-410A', saso_certified: true, ashrae_compliant: true, energy_rating_stars: 4, list_price_sar: 425000 },
  { manufacturer: 'Trane', model_number: 'CVHE-0400', equipment_category: 'chiller', equipment_subcategory: 'water-cooled centrifugal', cooling_capacity_kw: 1406, cooling_capacity_tons: 400, cop: 6.3, eer: 21.5, iplv: 24.1, power_input_kw: 223, voltage: '380V', phases: 3, full_load_amps: 375, refrigerant_type: 'R-134a', saso_certified: true, ashrae_compliant: true, energy_rating_stars: 5, list_price_sar: 720000 },

  // Daikin VRF
  { manufacturer: 'Daikin', model_number: 'VRV-IV-RXYQ8T', equipment_category: 'vrf', equipment_subcategory: 'heat recovery', cooling_capacity_kw: 22.4, cooling_capacity_tons: 6.4, heating_capacity_kw: 25.0, cop: 4.53, eer: 15.5, seer: 18.2, power_input_kw: 4.95, voltage: '380V', phases: 3, full_load_amps: 8.3, refrigerant_type: 'R-410A', saso_certified: true, ashrae_compliant: true, energy_rating_stars: 5, list_price_sar: 78000 },
  { manufacturer: 'Daikin', model_number: 'VRV-IV-RXYQ14T', equipment_category: 'vrf', equipment_subcategory: 'heat recovery', cooling_capacity_kw: 40.0, cooling_capacity_tons: 11.4, heating_capacity_kw: 45.0, cop: 4.35, eer: 14.8, seer: 17.5, power_input_kw: 9.2, voltage: '380V', phases: 3, full_load_amps: 15.5, refrigerant_type: 'R-410A', saso_certified: true, ashrae_compliant: true, energy_rating_stars: 5, list_price_sar: 125000 },
  { manufacturer: 'Daikin', model_number: 'VRV-IV-RXYQ20T', equipment_category: 'vrf', equipment_subcategory: 'heat recovery', cooling_capacity_kw: 56.0, cooling_capacity_tons: 16.0, heating_capacity_kw: 63.0, cop: 4.25, eer: 14.5, seer: 17.0, power_input_kw: 13.2, voltage: '380V', phases: 3, full_load_amps: 22.2, refrigerant_type: 'R-410A', saso_certified: true, ashrae_compliant: true, energy_rating_stars: 4, list_price_sar: 168000 },

  // York Package Units
  { manufacturer: 'York', model_number: 'YC-120', equipment_category: 'package_unit', equipment_subcategory: 'rooftop', cooling_capacity_kw: 35.2, cooling_capacity_tons: 10, heating_capacity_kw: 37.0, cop: 3.2, eer: 10.9, seer: 14.0, power_input_kw: 11.0, voltage: '380V', phases: 3, full_load_amps: 18.5, refrigerant_type: 'R-410A', saso_certified: true, ashrae_compliant: true, energy_rating_stars: 4, list_price_sar: 45000 },
  { manufacturer: 'York', model_number: 'YC-180', equipment_category: 'package_unit', equipment_subcategory: 'rooftop', cooling_capacity_kw: 52.8, cooling_capacity_tons: 15, heating_capacity_kw: 55.0, cop: 3.1, eer: 10.6, seer: 13.5, power_input_kw: 17.0, voltage: '380V', phases: 3, full_load_amps: 28.6, refrigerant_type: 'R-410A', saso_certified: true, ashrae_compliant: true, energy_rating_stars: 4, list_price_sar: 62000 },
  { manufacturer: 'York', model_number: 'YC-240', equipment_category: 'package_unit', equipment_subcategory: 'rooftop', cooling_capacity_kw: 70.3, cooling_capacity_tons: 20, heating_capacity_kw: 73.5, cop: 3.0, eer: 10.2, seer: 13.0, power_input_kw: 23.4, voltage: '380V', phases: 3, full_load_amps: 39.4, refrigerant_type: 'R-410A', saso_certified: true, ashrae_compliant: true, energy_rating_stars: 3, list_price_sar: 78000 },

  // Carrier AHUs
  { manufacturer: 'Carrier', model_number: '39M-050', equipment_category: 'ahu', equipment_subcategory: 'modular', power_input_kw: 5.5, voltage: '380V', phases: 3, full_load_amps: 9.3, saso_certified: true, ashrae_compliant: true, list_price_sar: 42000 },
  { manufacturer: 'Carrier', model_number: '39M-100', equipment_category: 'ahu', equipment_subcategory: 'modular', power_input_kw: 11.0, voltage: '380V', phases: 3, full_load_amps: 18.5, saso_certified: true, ashrae_compliant: true, list_price_sar: 68000 },
  { manufacturer: 'Carrier', model_number: '39M-200', equipment_category: 'ahu', equipment_subcategory: 'modular', power_input_kw: 22.0, voltage: '380V', phases: 3, full_load_amps: 37.0, saso_certified: true, ashrae_compliant: true, list_price_sar: 115000 },

  // Daikin Fan Coils
  { manufacturer: 'Daikin', model_number: 'FWF02CT', equipment_category: 'fan_coil', equipment_subcategory: 'ceiling concealed', cooling_capacity_kw: 2.2, cooling_capacity_tons: 0.63, heating_capacity_kw: 3.0, power_input_kw: 0.03, voltage: '220V', phases: 1, full_load_amps: 0.14, saso_certified: true, ashrae_compliant: true, list_price_sar: 1800 },
  { manufacturer: 'Daikin', model_number: 'FWF04CT', equipment_category: 'fan_coil', equipment_subcategory: 'ceiling concealed', cooling_capacity_kw: 4.5, cooling_capacity_tons: 1.28, heating_capacity_kw: 6.0, power_input_kw: 0.05, voltage: '220V', phases: 1, full_load_amps: 0.23, saso_certified: true, ashrae_compliant: true, list_price_sar: 2400 },
  { manufacturer: 'Daikin', model_number: 'FWF06CT', equipment_category: 'fan_coil', equipment_subcategory: 'ceiling concealed', cooling_capacity_kw: 7.0, cooling_capacity_tons: 2.0, heating_capacity_kw: 9.0, power_input_kw: 0.08, voltage: '220V', phases: 1, full_load_amps: 0.36, saso_certified: true, ashrae_compliant: true, list_price_sar: 3200 },

  // Carrier Split Systems
  { manufacturer: 'Carrier', model_number: '42QHC009', equipment_category: 'split_system', equipment_subcategory: 'wall mount', cooling_capacity_kw: 2.64, cooling_capacity_tons: 0.75, heating_capacity_kw: 2.93, cop: 3.8, eer: 13.0, seer: 16.0, power_input_kw: 0.69, voltage: '220V', phases: 1, full_load_amps: 3.15, refrigerant_type: 'R-410A', saso_certified: true, ashrae_compliant: true, energy_rating_stars: 4, list_price_sar: 2800 },
  { manufacturer: 'Carrier', model_number: '42QHC012', equipment_category: 'split_system', equipment_subcategory: 'wall mount', cooling_capacity_kw: 3.52, cooling_capacity_tons: 1.0, heating_capacity_kw: 3.81, cop: 3.7, eer: 12.6, seer: 15.5, power_input_kw: 0.95, voltage: '220V', phases: 1, full_load_amps: 4.32, refrigerant_type: 'R-410A', saso_certified: true, ashrae_compliant: true, energy_rating_stars: 4, list_price_sar: 3400 },
  { manufacturer: 'Carrier', model_number: '42QHC018', equipment_category: 'split_system', equipment_subcategory: 'wall mount', cooling_capacity_kw: 5.28, cooling_capacity_tons: 1.5, heating_capacity_kw: 5.57, cop: 3.5, eer: 11.9, seer: 14.5, power_input_kw: 1.51, voltage: '220V', phases: 1, full_load_amps: 6.87, refrigerant_type: 'R-410A', saso_certified: true, ashrae_compliant: true, energy_rating_stars: 3, list_price_sar: 4200 },
  { manufacturer: 'Carrier', model_number: '42QHC024', equipment_category: 'split_system', equipment_subcategory: 'wall mount', cooling_capacity_kw: 7.03, cooling_capacity_tons: 2.0, heating_capacity_kw: 7.33, cop: 3.4, eer: 11.6, seer: 14.0, power_input_kw: 2.07, voltage: '220V', phases: 1, full_load_amps: 9.41, refrigerant_type: 'R-410A', saso_certified: true, ashrae_compliant: true, energy_rating_stars: 3, list_price_sar: 5100 },

  // LG Mini Splits
  { manufacturer: 'LG', model_number: 'LS-H096', equipment_category: 'mini_split', equipment_subcategory: 'inverter', cooling_capacity_kw: 2.64, cooling_capacity_tons: 0.75, heating_capacity_kw: 2.93, cop: 4.2, eer: 14.3, seer: 19.0, power_input_kw: 0.63, voltage: '220V', phases: 1, full_load_amps: 2.87, refrigerant_type: 'R-32', saso_certified: true, ashrae_compliant: true, energy_rating_stars: 5, list_price_sar: 3200 },
  { manufacturer: 'LG', model_number: 'LS-H126', equipment_category: 'mini_split', equipment_subcategory: 'inverter', cooling_capacity_kw: 3.52, cooling_capacity_tons: 1.0, heating_capacity_kw: 3.81, cop: 4.1, eer: 14.0, seer: 18.5, power_input_kw: 0.86, voltage: '220V', phases: 1, full_load_amps: 3.91, refrigerant_type: 'R-32', saso_certified: true, ashrae_compliant: true, energy_rating_stars: 5, list_price_sar: 3800 },
  { manufacturer: 'LG', model_number: 'LS-H186', equipment_category: 'mini_split', equipment_subcategory: 'inverter', cooling_capacity_kw: 5.28, cooling_capacity_tons: 1.5, heating_capacity_kw: 5.57, cop: 3.9, eer: 13.3, seer: 17.0, power_input_kw: 1.35, voltage: '220V', phases: 1, full_load_amps: 6.14, refrigerant_type: 'R-32', saso_certified: true, ashrae_compliant: true, energy_rating_stars: 4, list_price_sar: 4600 },

  // Cooling Towers
  { manufacturer: 'BAC', model_number: 'VXT-090', equipment_category: 'cooling_tower', equipment_subcategory: 'crossflow', cooling_capacity_tons: 90, power_input_kw: 3.7, voltage: '380V', phases: 3, full_load_amps: 6.2, saso_certified: true, ashrae_compliant: true, list_price_sar: 85000 },
  { manufacturer: 'Evapco', model_number: 'AT-15-412', equipment_category: 'cooling_tower', equipment_subcategory: 'induced draft', cooling_capacity_tons: 150, power_input_kw: 5.5, voltage: '380V', phases: 3, full_load_amps: 9.3, saso_certified: true, ashrae_compliant: true, list_price_sar: 125000 },

  // Pumps
  { manufacturer: 'Grundfos', model_number: 'TPE-80-240', equipment_category: 'pump', equipment_subcategory: 'inline', power_input_kw: 4.0, voltage: '380V', phases: 3, full_load_amps: 6.7, saso_certified: true, ashrae_compliant: true, list_price_sar: 12500 },
  { manufacturer: 'Grundfos', model_number: 'TPE-100-330', equipment_category: 'pump', equipment_subcategory: 'inline', power_input_kw: 7.5, voltage: '380V', phases: 3, full_load_amps: 12.6, saso_certified: true, ashrae_compliant: true, list_price_sar: 18500 },
  { manufacturer: 'Wilo', model_number: 'CronoLine-IL-80', equipment_category: 'pump', equipment_subcategory: 'inline', power_input_kw: 5.5, voltage: '380V', phases: 3, full_load_amps: 9.3, saso_certified: true, ashrae_compliant: true, list_price_sar: 14200 },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if catalog already has data
    const { count } = await supabase
      .from("equipment_catalog")
      .select("*", { count: "exact", head: true });

    if (count && count > 0) {
      return new Response(
        JSON.stringify({ 
          message: `Catalog already contains ${count} items. Skipping seed.`,
          seeded: false 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert equipment data
    const { data, error } = await supabase
      .from("equipment_catalog")
      .insert(equipmentData.map(item => ({ ...item, is_active: true })))
      .select();

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        message: `Successfully seeded ${data.length} equipment items`,
        seeded: true,
        count: data.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error seeding equipment catalog:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});