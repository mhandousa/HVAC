import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PumpCurvePoint {
  flow: number;
  head: number;
  efficiency: number;
  power: number;
}

interface PumpCurveData {
  manufacturer: string;
  model: string;
  pump_type: string;
  impeller_diameter_in: number;
  rpm: number;
  curve_data: PumpCurvePoint[];
  max_flow_gpm: number;
  max_head_ft: number;
  motor_hp: number;
  notes: string;
}

const samplePumpCurves: PumpCurveData[] = [
  // Grundfos MAGNA3 Series - Inline Circulators
  {
    manufacturer: 'Grundfos',
    model: 'MAGNA3 25-40',
    pump_type: 'inline_circulator',
    impeller_diameter_in: 2.5,
    rpm: 1750,
    curve_data: [
      { flow: 0, head: 13.1, efficiency: 0, power: 0.08 },
      { flow: 5, head: 12.8, efficiency: 35, power: 0.09 },
      { flow: 10, head: 12.0, efficiency: 48, power: 0.11 },
      { flow: 15, head: 10.8, efficiency: 55, power: 0.13 },
      { flow: 20, head: 9.2, efficiency: 58, power: 0.15 },
      { flow: 25, head: 7.2, efficiency: 54, power: 0.16 },
      { flow: 30, head: 4.8, efficiency: 45, power: 0.17 },
      { flow: 35, head: 2.0, efficiency: 30, power: 0.18 },
    ],
    max_flow_gpm: 35,
    max_head_ft: 13.1,
    motor_hp: 0.25,
    notes: 'Energy-efficient variable speed circulator for residential and light commercial',
  },
  {
    manufacturer: 'Grundfos',
    model: 'MAGNA3 32-60',
    pump_type: 'inline_circulator',
    impeller_diameter_in: 3.2,
    rpm: 1750,
    curve_data: [
      { flow: 0, head: 19.7, efficiency: 0, power: 0.15 },
      { flow: 10, head: 19.0, efficiency: 40, power: 0.18 },
      { flow: 20, head: 17.5, efficiency: 52, power: 0.22 },
      { flow: 30, head: 15.2, efficiency: 58, power: 0.28 },
      { flow: 40, head: 12.3, efficiency: 60, power: 0.33 },
      { flow: 50, head: 8.8, efficiency: 55, power: 0.38 },
      { flow: 60, head: 4.8, efficiency: 42, power: 0.42 },
    ],
    max_flow_gpm: 60,
    max_head_ft: 19.7,
    motor_hp: 0.5,
    notes: 'Medium capacity variable speed circulator',
  },
  {
    manufacturer: 'Grundfos',
    model: 'MAGNA3 40-120',
    pump_type: 'inline_circulator',
    impeller_diameter_in: 4.0,
    rpm: 1750,
    curve_data: [
      { flow: 0, head: 39.4, efficiency: 0, power: 0.4 },
      { flow: 20, head: 38.0, efficiency: 45, power: 0.5 },
      { flow: 40, head: 35.0, efficiency: 55, power: 0.65 },
      { flow: 60, head: 30.5, efficiency: 62, power: 0.82 },
      { flow: 80, head: 24.5, efficiency: 65, power: 1.0 },
      { flow: 100, head: 17.0, efficiency: 60, power: 1.15 },
      { flow: 120, head: 8.0, efficiency: 48, power: 1.25 },
    ],
    max_flow_gpm: 120,
    max_head_ft: 39.4,
    motor_hp: 1.5,
    notes: 'High capacity variable speed circulator for commercial applications',
  },
  // Bell & Gossett Series 60 - Base Mounted
  {
    manufacturer: 'Bell & Gossett',
    model: 'Series 60 1510-2.5AA',
    pump_type: 'base_mounted_end_suction',
    impeller_diameter_in: 5.0,
    rpm: 1750,
    curve_data: [
      { flow: 0, head: 45, efficiency: 0, power: 0.8 },
      { flow: 30, head: 43, efficiency: 50, power: 1.0 },
      { flow: 60, head: 40, efficiency: 62, power: 1.3 },
      { flow: 90, head: 35, efficiency: 68, power: 1.6 },
      { flow: 120, head: 28, efficiency: 70, power: 1.9 },
      { flow: 150, head: 20, efficiency: 65, power: 2.1 },
      { flow: 180, head: 10, efficiency: 52, power: 2.3 },
    ],
    max_flow_gpm: 180,
    max_head_ft: 45,
    motor_hp: 3,
    notes: 'Reliable base-mounted pump for HVAC applications',
  },
  {
    manufacturer: 'Bell & Gossett',
    model: 'Series 60 1510-3BB',
    pump_type: 'base_mounted_end_suction',
    impeller_diameter_in: 6.0,
    rpm: 1750,
    curve_data: [
      { flow: 0, head: 65, efficiency: 0, power: 1.5 },
      { flow: 50, head: 62, efficiency: 52, power: 2.0 },
      { flow: 100, head: 57, efficiency: 65, power: 2.8 },
      { flow: 150, head: 50, efficiency: 72, power: 3.5 },
      { flow: 200, head: 40, efficiency: 75, power: 4.2 },
      { flow: 250, head: 28, efficiency: 70, power: 4.8 },
      { flow: 300, head: 14, efficiency: 58, power: 5.2 },
    ],
    max_flow_gpm: 300,
    max_head_ft: 65,
    motor_hp: 7.5,
    notes: 'Medium capacity base-mounted pump',
  },
  {
    manufacturer: 'Bell & Gossett',
    model: 'Series 60 1510-4BC',
    pump_type: 'base_mounted_end_suction',
    impeller_diameter_in: 7.5,
    rpm: 1750,
    curve_data: [
      { flow: 0, head: 85, efficiency: 0, power: 3 },
      { flow: 100, head: 82, efficiency: 55, power: 4.5 },
      { flow: 200, head: 75, efficiency: 68, power: 6.5 },
      { flow: 300, head: 65, efficiency: 75, power: 8.5 },
      { flow: 400, head: 52, efficiency: 78, power: 10.5 },
      { flow: 500, head: 35, efficiency: 72, power: 12 },
      { flow: 600, head: 15, efficiency: 60, power: 13 },
    ],
    max_flow_gpm: 600,
    max_head_ft: 85,
    motor_hp: 15,
    notes: 'High capacity base-mounted pump for large commercial systems',
  },
  // Taco Comfort Solutions
  {
    manufacturer: 'Taco',
    model: 'VT2218',
    pump_type: 'inline_circulator',
    impeller_diameter_in: 2.2,
    rpm: 1725,
    curve_data: [
      { flow: 0, head: 18, efficiency: 0, power: 0.1 },
      { flow: 5, head: 17.5, efficiency: 38, power: 0.12 },
      { flow: 10, head: 16.2, efficiency: 50, power: 0.15 },
      { flow: 15, head: 14.2, efficiency: 56, power: 0.18 },
      { flow: 20, head: 11.5, efficiency: 55, power: 0.2 },
      { flow: 25, head: 8.2, efficiency: 48, power: 0.22 },
      { flow: 30, head: 4.2, efficiency: 35, power: 0.24 },
    ],
    max_flow_gpm: 30,
    max_head_ft: 18,
    motor_hp: 0.33,
    notes: 'Variable speed circulator with integrated ECM motor',
  },
  {
    manufacturer: 'Taco',
    model: 'FI1206',
    pump_type: 'inline_close_coupled',
    impeller_diameter_in: 6.0,
    rpm: 1750,
    curve_data: [
      { flow: 0, head: 55, efficiency: 0, power: 1.2 },
      { flow: 40, head: 52, efficiency: 52, power: 1.6 },
      { flow: 80, head: 47, efficiency: 64, power: 2.2 },
      { flow: 120, head: 40, efficiency: 70, power: 2.8 },
      { flow: 160, head: 30, efficiency: 68, power: 3.3 },
      { flow: 200, head: 18, efficiency: 58, power: 3.7 },
    ],
    max_flow_gpm: 200,
    max_head_ft: 55,
    motor_hp: 5,
    notes: 'Inline close-coupled pump for commercial hydronic systems',
  },
  // Armstrong
  {
    manufacturer: 'Armstrong',
    model: 'Compass 4030',
    pump_type: 'inline_circulator',
    impeller_diameter_in: 3.0,
    rpm: 1750,
    curve_data: [
      { flow: 0, head: 30, efficiency: 0, power: 0.2 },
      { flow: 10, head: 29, efficiency: 42, power: 0.25 },
      { flow: 20, head: 27, efficiency: 54, power: 0.32 },
      { flow: 30, head: 24, efficiency: 60, power: 0.4 },
      { flow: 40, head: 19, efficiency: 58, power: 0.48 },
      { flow: 50, head: 13, efficiency: 50, power: 0.55 },
      { flow: 60, head: 6, efficiency: 38, power: 0.6 },
    ],
    max_flow_gpm: 60,
    max_head_ft: 30,
    motor_hp: 0.75,
    notes: 'Smart pump with built-in variable speed drive',
  },
  {
    manufacturer: 'Armstrong',
    model: 'Compass 4060',
    pump_type: 'inline_circulator',
    impeller_diameter_in: 4.5,
    rpm: 1750,
    curve_data: [
      { flow: 0, head: 60, efficiency: 0, power: 0.6 },
      { flow: 25, head: 58, efficiency: 48, power: 0.8 },
      { flow: 50, head: 54, efficiency: 60, power: 1.1 },
      { flow: 75, head: 47, efficiency: 68, power: 1.5 },
      { flow: 100, head: 38, efficiency: 70, power: 1.8 },
      { flow: 125, head: 27, efficiency: 64, power: 2.1 },
      { flow: 150, head: 14, efficiency: 52, power: 2.4 },
    ],
    max_flow_gpm: 150,
    max_head_ft: 60,
    motor_hp: 3,
    notes: 'High-efficiency smart pump for commercial buildings',
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for force parameter
    const url = new URL(req.url);
    const force = url.searchParams.get('force') === 'true';
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if pump_curves table already has enough data
    const { data: existingCurves, error: checkError } = await supabase
      .from('pump_curves')
      .select('id');

    if (checkError) {
      throw new Error(`Error checking existing data: ${checkError.message}`);
    }

    // If we have fewer than 5 curves or force is true, add more
    if (!force && existingCurves && existingCurves.length >= 5) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Pump curves already seeded',
          count: existingCurves.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get organization ID from existing data or first organization
    const { data: orgData } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single();
    
    const organizationId = orgData?.id;
    if (!organizationId) {
      throw new Error('No organization found. Please create an organization first.');
    }

    // Insert sample pump curves
    const insertData = samplePumpCurves.map(pump => ({
      organization_id: organizationId,
      manufacturer: pump.manufacturer,
      model: pump.model,
      pump_type: pump.pump_type,
      impeller_diameter_in: pump.impeller_diameter_in,
      rpm: pump.rpm,
      curve_data: pump.curve_data,
      max_flow_gpm: pump.max_flow_gpm,
      max_head_ft: pump.max_head_ft,
      motor_hp: pump.motor_hp,
      notes: pump.notes,
      is_active: true,
    }));

    const { data: insertedCurves, error: insertError } = await supabase
      .from('pump_curves')
      .insert(insertData)
      .select();

    if (insertError) {
      throw new Error(`Error inserting pump curves: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Pump curves seeded successfully',
        count: insertedCurves?.length || 0,
        pumps: insertedCurves?.map(p => `${p.manufacturer} ${p.model}`)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error seeding pump curves:', errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
