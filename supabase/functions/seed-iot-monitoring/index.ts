import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IoTDeviceSeed {
  name: string;
  device_id: string;
  device_type: string;
  protocol: string;
  unit: string;
  setpoint: number | null;
  min_threshold: number | null;
  max_threshold: number | null;
  connection_config: Record<string, unknown>;
}

const sampleDevices: IoTDeviceSeed[] = [
  {
    name: "Supply Air Temp - AHU-1",
    device_id: "ahu1-sat",
    device_type: "temperature",
    protocol: "mqtt",
    unit: "°C",
    setpoint: 16,
    min_threshold: 12,
    max_threshold: 20,
    connection_config: { mqtt_topic: "hvac/ahu-1/supply-temp", value_path: "$.value" }
  },
  {
    name: "Return Air Temp - AHU-1",
    device_id: "ahu1-rat",
    device_type: "temperature",
    protocol: "mqtt",
    unit: "°C",
    setpoint: 24,
    min_threshold: 20,
    max_threshold: 28,
    connection_config: { mqtt_topic: "hvac/ahu-1/return-temp", value_path: "$.value" }
  },
  {
    name: "Chiller-1 Leaving Water Temp",
    device_id: "ch1-lwt",
    device_type: "temperature",
    protocol: "bacnet",
    unit: "°C",
    setpoint: 7,
    min_threshold: 5,
    max_threshold: 10,
    connection_config: { bacnet_device_id: 1001, object_type: "analog-input", object_instance: 1 }
  },
  {
    name: "Chiller-1 Entering Water Temp",
    device_id: "ch1-ewt",
    device_type: "temperature",
    protocol: "bacnet",
    unit: "°C",
    setpoint: 12,
    min_threshold: 10,
    max_threshold: 15,
    connection_config: { bacnet_device_id: 1001, object_type: "analog-input", object_instance: 2 }
  },
  {
    name: "Zone-1 Room Temperature",
    device_id: "zone1-temp",
    device_type: "temperature",
    protocol: "mqtt",
    unit: "°C",
    setpoint: 23,
    min_threshold: 20,
    max_threshold: 26,
    connection_config: { mqtt_topic: "hvac/zones/zone1/temp", value_path: "$.temperature" }
  },
  {
    name: "Zone-1 Humidity",
    device_id: "zone1-rh",
    device_type: "humidity",
    protocol: "mqtt",
    unit: "%",
    setpoint: 50,
    min_threshold: 40,
    max_threshold: 60,
    connection_config: { mqtt_topic: "hvac/zones/zone1/humidity", value_path: "$.humidity" }
  },
  {
    name: "Zone-2 Room Temperature",
    device_id: "zone2-temp",
    device_type: "temperature",
    protocol: "mqtt",
    unit: "°C",
    setpoint: 23,
    min_threshold: 20,
    max_threshold: 26,
    connection_config: { mqtt_topic: "hvac/zones/zone2/temp", value_path: "$.temperature" }
  },
  {
    name: "AHU-1 Supply Fan Power",
    device_id: "ahu1-sfp",
    device_type: "power",
    protocol: "modbus",
    unit: "kW",
    setpoint: null,
    min_threshold: 0,
    max_threshold: 15,
    connection_config: { modbus_address: 100, register_type: "holding", start_register: 0 }
  },
  {
    name: "AHU-1 Supply Airflow",
    device_id: "ahu1-saf",
    device_type: "flow",
    protocol: "modbus",
    unit: "L/s",
    setpoint: 2500,
    min_threshold: 2000,
    max_threshold: 3000,
    connection_config: { modbus_address: 100, register_type: "holding", start_register: 2 }
  },
  {
    name: "Building CO2 Level",
    device_id: "bldg-co2",
    device_type: "co2",
    protocol: "mqtt",
    unit: "ppm",
    setpoint: null,
    min_threshold: 0,
    max_threshold: 1000,
    connection_config: { mqtt_topic: "hvac/building/co2", value_path: "$.co2" }
  },
  {
    name: "CHW Pump-1 Status",
    device_id: "chwp1-status",
    device_type: "status",
    protocol: "bacnet",
    unit: "",
    setpoint: null,
    min_threshold: null,
    max_threshold: null,
    connection_config: { bacnet_device_id: 2001, object_type: "binary-input", object_instance: 1 }
  },
  {
    name: "Outdoor Air Temperature",
    device_id: "oat",
    device_type: "temperature",
    protocol: "rest_api",
    unit: "°C",
    setpoint: null,
    min_threshold: null,
    max_threshold: null,
    connection_config: { api_url: "https://api.weather.example/v1/current", api_key_env: "WEATHER_API_KEY" }
  },
  {
    name: "Outdoor Humidity",
    device_id: "oah",
    device_type: "humidity",
    protocol: "rest_api",
    unit: "%",
    setpoint: null,
    min_threshold: null,
    max_threshold: null,
    connection_config: { api_url: "https://api.weather.example/v1/current", api_key_env: "WEATHER_API_KEY" }
  },
  {
    name: "Total Building Power",
    device_id: "bldg-power",
    device_type: "energy",
    protocol: "modbus",
    unit: "kWh",
    setpoint: null,
    min_threshold: null,
    max_threshold: null,
    connection_config: { modbus_address: 200, register_type: "input", start_register: 0 }
  },
  {
    name: "Server Room Temperature",
    device_id: "server-temp",
    device_type: "temperature",
    protocol: "mqtt",
    unit: "°C",
    setpoint: 20,
    min_threshold: 18,
    max_threshold: 24,
    connection_config: { mqtt_topic: "hvac/server-room/temp", value_path: "$.value" }
  }
];

function generateSensorValue(device: IoTDeviceSeed, hourOfDay: number, dayOffset: number): number {
  const baseValue = device.setpoint || 
    (device.min_threshold !== null && device.max_threshold !== null 
      ? (device.min_threshold + device.max_threshold) / 2 
      : 50);
  
  // Add time-based patterns
  let variation = 0;
  
  switch (device.device_type) {
    case 'temperature':
      // Temperature varies with time of day - peaks in afternoon
      variation = Math.sin((hourOfDay - 6) * Math.PI / 12) * 2;
      break;
    case 'humidity':
      // Humidity inversely related to temperature
      variation = -Math.sin((hourOfDay - 6) * Math.PI / 12) * 5;
      break;
    case 'power':
      // Power peaks during working hours (8am - 6pm)
      if (hourOfDay >= 8 && hourOfDay <= 18) {
        variation = baseValue * 0.3;
      } else {
        variation = -baseValue * 0.5;
      }
      break;
    case 'co2':
      // CO2 rises during occupied hours
      if (hourOfDay >= 8 && hourOfDay <= 18) {
        variation = 300 + Math.sin((hourOfDay - 8) * Math.PI / 10) * 200;
      } else {
        variation = -200;
      }
      break;
    case 'flow':
      // Airflow varies with load
      if (hourOfDay >= 8 && hourOfDay <= 18) {
        variation = baseValue * 0.1;
      } else {
        variation = -baseValue * 0.3;
      }
      break;
    default:
      variation = 0;
  }
  
  // Add random noise
  const noise = (Math.random() - 0.5) * 2;
  
  return Math.round((baseValue + variation + noise) * 10) / 10;
}

function getReadingQuality(): string {
  const rand = Math.random();
  if (rand > 0.98) return 'bad';
  if (rand > 0.95) return 'uncertain';
  return 'good';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get organization ID from request or use first available
    const { organization_id } = await req.json().catch(() => ({}));
    
    let orgId = organization_id;
    if (!orgId) {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single();
      
      if (!orgs) {
        return new Response(
          JSON.stringify({ error: 'No organization found. Please create an organization first.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      orgId = orgs.id;
    }

    // Check if devices already exist
    const { data: existingDevices } = await supabase
      .from('iot_devices')
      .select('id')
      .eq('organization_id', orgId)
      .limit(1);

    if (existingDevices && existingDevices.length > 0) {
      return new Response(
        JSON.stringify({ 
          message: 'IoT devices already exist for this organization. Skipping seed.',
          existing_count: existingDevices.length 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get some equipment and zones for linking
    const { data: equipment } = await supabase
      .from('equipment')
      .select('id, name')
      .eq('organization_id', orgId)
      .limit(5);

    const { data: zones } = await supabase
      .from('zones')
      .select('id, name')
      .limit(5);

    // Insert IoT devices
    const devicesToInsert = sampleDevices.map((device, index) => ({
      ...device,
      organization_id: orgId,
      is_active: true,
      status: 'online',
      equipment_id: equipment && equipment[index % equipment.length] ? equipment[index % equipment.length].id : null,
      zone_id: zones && zones[index % zones.length] ? zones[index % zones.length].id : null,
    }));

    const { data: insertedDevices, error: deviceError } = await supabase
      .from('iot_devices')
      .insert(devicesToInsert)
      .select();

    if (deviceError) {
      throw new Error(`Failed to insert devices: ${deviceError.message}`);
    }

    console.log(`Inserted ${insertedDevices?.length} IoT devices`);

    // Generate sensor readings for last 48 hours (every 5 minutes = 576 readings per device)
    const now = new Date();
    const readings: Array<{
      device_id: string;
      value: number;
      unit: string;
      quality: string;
      timestamp: string;
    }> = [];

    const hoursBack = 48;
    const intervalMinutes = 5;
    const totalReadings = (hoursBack * 60) / intervalMinutes;

    for (const device of insertedDevices || []) {
      const seedDevice = sampleDevices.find(d => d.device_id === device.device_id);
      if (!seedDevice || seedDevice.device_type === 'status') continue;

      for (let i = 0; i < totalReadings; i++) {
        const timestamp = new Date(now.getTime() - i * intervalMinutes * 60 * 1000);
        const hourOfDay = timestamp.getHours();
        const dayOffset = Math.floor(i / (24 * 60 / intervalMinutes));

        readings.push({
          device_id: device.id,
          value: generateSensorValue(seedDevice, hourOfDay, dayOffset),
          unit: seedDevice.unit,
          quality: getReadingQuality(),
          timestamp: timestamp.toISOString(),
        });
      }
    }

    // Insert readings in batches of 500
    const batchSize = 500;
    let insertedReadings = 0;

    for (let i = 0; i < readings.length; i += batchSize) {
      const batch = readings.slice(i, i + batchSize);
      const { error: readingError } = await supabase
        .from('sensor_readings')
        .insert(batch);

      if (readingError) {
        console.error(`Batch ${i / batchSize} error:`, readingError.message);
      } else {
        insertedReadings += batch.length;
      }
    }

    console.log(`Inserted ${insertedReadings} sensor readings`);

    // Update last reading info on devices
    for (const device of insertedDevices || []) {
      const latestReading = readings
        .filter(r => r.device_id === device.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      if (latestReading) {
        await supabase
          .from('iot_devices')
          .update({
            last_reading_value: latestReading.value,
            last_reading_at: latestReading.timestamp,
          })
          .eq('id', device.id);
      }
    }

    // Create sample alerts
    const alertDevices = insertedDevices?.slice(0, 5) || [];
    const alerts = [
      {
        organization_id: orgId,
        device_id: alertDevices[0]?.id,
        title: 'High Temperature Alert',
        message: 'Supply air temperature exceeded maximum threshold of 20°C',
        severity: 'warning',
        alert_type: 'threshold_high',
        value: 21.5,
        threshold: 20,
        is_active: true,
        triggered_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      },
      {
        organization_id: orgId,
        device_id: alertDevices[1]?.id,
        title: 'Low Humidity Warning',
        message: 'Zone humidity dropped below minimum threshold of 40%',
        severity: 'info',
        alert_type: 'threshold_low',
        value: 38.2,
        threshold: 40,
        is_active: true,
        triggered_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        organization_id: orgId,
        device_id: alertDevices[2]?.id,
        title: 'High CO2 Level',
        message: 'Building CO2 level exceeded 1000 ppm threshold',
        severity: 'critical',
        alert_type: 'threshold_high',
        value: 1150,
        threshold: 1000,
        is_active: true,
        triggered_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      },
      {
        organization_id: orgId,
        device_id: alertDevices[3]?.id,
        title: 'Temperature Normalized',
        message: 'Server room temperature returned to normal range',
        severity: 'info',
        alert_type: 'threshold_high',
        value: 22.5,
        threshold: 24,
        is_active: false,
        triggered_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
        resolved_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        organization_id: orgId,
        device_id: alertDevices[4]?.id,
        title: 'Airflow Restored',
        message: 'AHU-1 supply airflow returned to normal operating range',
        severity: 'warning',
        alert_type: 'threshold_low',
        value: 2100,
        threshold: 2000,
        is_active: false,
        triggered_at: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
        resolved_at: new Date(now.getTime() - 7 * 60 * 60 * 1000).toISOString(),
      },
    ].filter(a => a.device_id);

    const { data: insertedAlerts, error: alertError } = await supabase
      .from('monitoring_alerts')
      .insert(alerts)
      .select();

    if (alertError) {
      console.error('Alert insertion error:', alertError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          devices_created: insertedDevices?.length || 0,
          readings_created: insertedReadings,
          alerts_created: insertedAlerts?.length || 0,
          organization_id: orgId,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Seed error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
