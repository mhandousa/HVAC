import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SensorReading {
  id: string;
  device_id: string;
  reading_type: string;
  value: number;
  timestamp: string;
}

interface IoTDevice {
  id: string;
  organization_id: string;
  zone_id: string | null;
  device_name: string;
  device_type: string;
}

interface Zone {
  id: string;
  name: string;
  target_nc: number | null;
  zone_type: string | null;
}

// Default NC targets by zone type when not explicitly set
const DEFAULT_NC_TARGETS: Record<string, number> = {
  'office': 40,
  'open_office': 45,
  'conference': 30,
  'private_office': 35,
  'lobby': 45,
  'corridor': 50,
  'restaurant': 45,
  'hotel_room': 35,
  'hospital_room': 30,
  'classroom': 35,
  'library': 30,
  'auditorium': 25,
  'concert_hall': 20,
  'recording_studio': 15,
  'default': 40,
};

// Cooldown period in milliseconds (1 hour)
const ALERT_COOLDOWN_MS = 60 * 60 * 1000;

// Threshold buffer before triggering alert (dB)
const EXCEEDANCE_THRESHOLD = 3;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for optional parameters
    let deviceId: string | undefined;
    let organizationId: string | undefined;
    let checkAll = false;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        deviceId = body.device_id;
        organizationId = body.organization_id;
        checkAll = body.check_all === true;
      } catch {
        // Empty body is fine, will check all
        checkAll = true;
      }
    } else {
      checkAll = true;
    }

    let alertsCreated = 0;
    let devicesChecked = 0;

    // Get devices to check
    let devicesQuery = supabase
      .from('iot_devices')
      .select('id, organization_id, zone_id, device_name, device_type')
      .in('device_type', ['sound_level_meter', 'nc_meter', 'acoustic_sensor'])
      .eq('is_active', true);

    if (deviceId) {
      devicesQuery = devicesQuery.eq('id', deviceId);
    } else if (organizationId) {
      devicesQuery = devicesQuery.eq('organization_id', organizationId);
    }

    const { data: devices, error: devicesError } = await devicesQuery;

    if (devicesError) {
      throw new Error(`Failed to fetch devices: ${devicesError.message}`);
    }

    if (!devices || devices.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No acoustic monitoring devices found',
          alerts_created: 0,
          devices_checked: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process each device
    for (const device of devices as IoTDevice[]) {
      devicesChecked++;

      if (!device.zone_id) {
        console.log(`Device ${device.device_name} has no zone assigned, skipping`);
        continue;
      }

      // Get zone details
      const { data: zone, error: zoneError } = await supabase
        .from('zones')
        .select('id, name, target_nc, zone_type')
        .eq('id', device.zone_id)
        .single();

      if (zoneError || !zone) {
        console.log(`Could not find zone for device ${device.device_name}`);
        continue;
      }

      // Determine target NC
      const targetNC = (zone as Zone).target_nc || 
        DEFAULT_NC_TARGETS[(zone as Zone).zone_type || 'default'] || 
        DEFAULT_NC_TARGETS.default;

      // Get latest reading for this device
      const { data: readings, error: readingsError } = await supabase
        .from('sensor_readings')
        .select('id, device_id, reading_type, value, timestamp')
        .eq('device_id', device.id)
        .in('reading_type', ['nc_level', 'sound_level', 'noise_level'])
        .order('timestamp', { ascending: false })
        .limit(1);

      if (readingsError || !readings || readings.length === 0) {
        console.log(`No recent readings for device ${device.device_name}`);
        continue;
      }

      const latestReading = readings[0] as SensorReading;
      const measuredNC = Math.round(latestReading.value);
      const delta = measuredNC - targetNC;

      // Check if reading exceeds threshold
      if (delta >= EXCEEDANCE_THRESHOLD) {
        // Check for recent active alert (cooldown)
        const cooldownTime = new Date(Date.now() - ALERT_COOLDOWN_MS).toISOString();
        
        const { data: recentAlerts, error: alertsCheckError } = await supabase
          .from('monitoring_alerts')
          .select('id')
          .eq('device_id', device.id)
          .eq('alert_type', 'acoustic_exceedance')
          .eq('is_active', true)
          .gte('triggered_at', cooldownTime)
          .limit(1);

        if (alertsCheckError) {
          console.error(`Error checking recent alerts: ${alertsCheckError.message}`);
          continue;
        }

        // Skip if there's a recent active alert
        if (recentAlerts && recentAlerts.length > 0) {
          console.log(`Skipping alert for ${device.device_name} - recent alert exists`);
          continue;
        }

        // Determine severity based on exceedance
        let severity: 'info' | 'warning' | 'critical';
        if (delta >= 10) {
          severity = 'critical';
        } else if (delta >= 5) {
          severity = 'warning';
        } else {
          severity = 'info';
        }

        // Create alert
        const { error: insertError } = await supabase
          .from('monitoring_alerts')
          .insert({
            organization_id: device.organization_id,
            device_id: device.id,
            acoustic_zone_id: device.zone_id,
            alert_type: 'acoustic_exceedance',
            severity,
            title: `NC Level Exceeds Target in ${(zone as Zone).name}`,
            message: `Measured NC-${measuredNC} exceeds target NC-${targetNC} by ${delta} dB. Immediate attention may be required for occupant comfort.`,
            value: measuredNC,
            threshold: targetNC,
            measured_nc: measuredNC,
            target_nc: targetNC,
            is_active: true,
            triggered_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error(`Failed to create alert: ${insertError.message}`);
          continue;
        }

        alertsCreated++;
        console.log(`Created ${severity} alert for ${(zone as Zone).name}: NC-${measuredNC} vs target NC-${targetNC}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Acoustic alert check completed`,
        devices_checked: devicesChecked,
        alerts_created: alertsCreated,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Acoustic alert check error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
