import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SensorDataPayload {
  device_id: string; // External device ID
  readings: Array<{
    value: number;
    timestamp?: string;
    quality?: 'good' | 'uncertain' | 'bad';
  }>;
}

interface BatchPayload {
  devices: SensorDataPayload[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Validate API key from header
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = Deno.env.get('IOT_INGEST_API_KEY');
    
    // If API key is configured, validate it
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    
    // Support both single device and batch payloads
    const devices: SensorDataPayload[] = body.devices || [body];
    
    const results = {
      processed: 0,
      readings_inserted: 0,
      alerts_created: 0,
      errors: [] as string[],
    };

    for (const deviceData of devices) {
      if (!deviceData.device_id || !deviceData.readings || !Array.isArray(deviceData.readings)) {
        results.errors.push(`Invalid payload for device: ${deviceData.device_id || 'unknown'}`);
        continue;
      }

      // Look up internal device by external device_id
      const { data: device, error: deviceError } = await supabase
        .from('iot_devices')
        .select('id, organization_id, name, device_type, unit, setpoint, min_threshold, max_threshold, equipment_id')
        .eq('device_id', deviceData.device_id)
        .eq('is_active', true)
        .single();

      if (deviceError || !device) {
        results.errors.push(`Device not found or inactive: ${deviceData.device_id}`);
        continue;
      }

      results.processed++;
      const now = new Date().toISOString();

      // Prepare readings for insertion
      const readingsToInsert = deviceData.readings.map(r => ({
        device_id: device.id,
        value: r.value,
        quality: r.quality || 'good',
        recorded_at: r.timestamp || now,
        received_at: now,
      }));

      // Insert readings
      const { error: insertError } = await supabase
        .from('sensor_readings')
        .insert(readingsToInsert);

      if (insertError) {
        results.errors.push(`Failed to insert readings for ${deviceData.device_id}: ${insertError.message}`);
        continue;
      }

      results.readings_inserted += readingsToInsert.length;

      // Get the latest reading for threshold checking
      const latestReading = deviceData.readings[deviceData.readings.length - 1];
      const latestValue = latestReading.value;

      // Update device with last reading
      await supabase
        .from('iot_devices')
        .update({
          last_reading_value: latestValue,
          last_reading_at: latestReading.timestamp || now,
          status: 'online',
        })
        .eq('id', device.id);

      // Check thresholds and create alerts if needed
      if (device.max_threshold !== null && latestValue > device.max_threshold) {
        // Check if there's already an active alert for this
        const { data: existingAlert } = await supabase
          .from('monitoring_alerts')
          .select('id')
          .eq('device_id', device.id)
          .eq('alert_type', 'threshold_high')
          .eq('is_active', true)
          .single();

        if (!existingAlert) {
          const { error: alertError } = await supabase
            .from('monitoring_alerts')
            .insert({
              organization_id: device.organization_id,
              device_id: device.id,
              equipment_id: device.equipment_id,
              alert_type: 'threshold_high',
              severity: 'warning',
              title: `High ${device.device_type} alert: ${device.name}`,
              message: `Value ${latestValue} ${device.unit} exceeds threshold of ${device.max_threshold} ${device.unit}`,
              value: latestValue,
              threshold: device.max_threshold,
            });

          if (!alertError) {
            results.alerts_created++;
          }
        }
      }

      if (device.min_threshold !== null && latestValue < device.min_threshold) {
        const { data: existingAlert } = await supabase
          .from('monitoring_alerts')
          .select('id')
          .eq('device_id', device.id)
          .eq('alert_type', 'threshold_low')
          .eq('is_active', true)
          .single();

        if (!existingAlert) {
          const { error: alertError } = await supabase
            .from('monitoring_alerts')
            .insert({
              organization_id: device.organization_id,
              device_id: device.id,
              equipment_id: device.equipment_id,
              alert_type: 'threshold_low',
              severity: 'warning',
              title: `Low ${device.device_type} alert: ${device.name}`,
              message: `Value ${latestValue} ${device.unit} is below threshold of ${device.min_threshold} ${device.unit}`,
              value: latestValue,
              threshold: device.min_threshold,
            });

          if (!alertError) {
            results.alerts_created++;
          }
        }
      }

      // Auto-resolve alerts if value is back in range
      if (device.min_threshold !== null && device.max_threshold !== null) {
        if (latestValue >= device.min_threshold && latestValue <= device.max_threshold) {
          await supabase
            .from('monitoring_alerts')
            .update({
              resolved_at: now,
              is_active: false,
            })
            .eq('device_id', device.id)
            .eq('is_active', true)
            .in('alert_type', ['threshold_high', 'threshold_low']);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing sensor data:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
