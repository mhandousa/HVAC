import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface MqttMessage {
  topic: string;
  payload: unknown;
  qos?: number;
  retain?: boolean;
  timestamp?: string;
}

interface BatchRequest {
  messages: MqttMessage[];
}

function extractValueFromPayload(payload: unknown, path: string): number | null {
  if (typeof payload === 'number') return payload;
  if (typeof payload === 'string') {
    const num = parseFloat(payload);
    return isNaN(num) ? null : num;
  }
  
  if (typeof payload !== 'object' || payload === null) return null;
  
  // Simple JSON path extraction (supports $.field or $.field.subfield)
  const parts = path.replace(/^\$\.?/, '').split('.');
  let current: unknown = payload;
  
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return null;
    current = (current as Record<string, unknown>)[part];
  }
  
  if (typeof current === 'number') return current;
  if (typeof current === 'string') {
    const num = parseFloat(current);
    return isNaN(num) ? null : num;
  }
  
  return null;
}

function extractStringFromPayload(payload: unknown, path: string): string | null {
  if (typeof payload === 'string') return payload;
  
  if (typeof payload !== 'object' || payload === null) return null;
  
  const parts = path.replace(/^\$\.?/, '').split('.');
  let current: unknown = payload;
  
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return null;
    current = (current as Record<string, unknown>)[part];
  }
  
  return typeof current === 'string' ? current : null;
}

Deno.serve(async (req) => {
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
    // Validate API key
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = Deno.env.get('IOT_INGEST_API_KEY');
    
    if (expectedKey && apiKey !== expectedKey) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    
    // Support both single message and batch
    const messages: MqttMessage[] = Array.isArray(body.messages) 
      ? body.messages 
      : [body];

    const results = {
      processed: 0,
      inserted: 0,
      errors: [] as string[],
    };

    // Get all devices with MQTT protocol for topic matching
    const { data: mqttDevices, error: devicesError } = await supabase
      .from('iot_devices')
      .select('id, device_id, name, unit, connection_config, min_threshold, max_threshold, organization_id')
      .eq('protocol', 'mqtt')
      .eq('is_active', true);

    if (devicesError) {
      throw new Error(`Failed to fetch MQTT devices: ${devicesError.message}`);
    }

    // Create topic-to-device mapping
    const topicDeviceMap = new Map<string, typeof mqttDevices[0]>();
    for (const device of mqttDevices || []) {
      const config = device.connection_config as Record<string, unknown> | null;
      if (config?.mqtt_topic) {
        topicDeviceMap.set(config.mqtt_topic as string, device);
      }
    }

    // Process each message
    const readingsToInsert: Array<{
      device_id: string;
      value: number;
      unit: string;
      quality: string;
      timestamp: string;
    }> = [];

    const deviceUpdates: Array<{
      deviceId: string;
      value: number;
      timestamp: string;
      organizationId: string;
      minThreshold: number | null;
      maxThreshold: number | null;
    }> = [];

    for (const message of messages) {
      results.processed++;

      const device = topicDeviceMap.get(message.topic);
      if (!device) {
        results.errors.push(`No device found for topic: ${message.topic}`);
        continue;
      }

      const config = device.connection_config as Record<string, unknown> | null;
      const valuePath = (config?.value_path as string) || '$.value';
      const qualityPath = (config?.quality_path as string) || '$.quality';
      const timestampPath = (config?.timestamp_path as string) || '$.timestamp';

      const value = extractValueFromPayload(message.payload, valuePath);
      if (value === null) {
        results.errors.push(`Could not extract value from topic ${message.topic}`);
        continue;
      }

      const quality = extractStringFromPayload(message.payload, qualityPath) || 'good';
      const timestamp = extractStringFromPayload(message.payload, timestampPath) 
        || message.timestamp 
        || new Date().toISOString();

      readingsToInsert.push({
        device_id: device.id,
        value,
        unit: device.unit,
        quality,
        timestamp,
      });

      deviceUpdates.push({
        deviceId: device.id,
        value,
        timestamp,
        organizationId: device.organization_id,
        minThreshold: device.min_threshold,
        maxThreshold: device.max_threshold,
      });
    }

    // Batch insert readings
    if (readingsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('sensor_readings')
        .insert(readingsToInsert);

      if (insertError) {
        results.errors.push(`Failed to insert readings: ${insertError.message}`);
      } else {
        results.inserted = readingsToInsert.length;
      }
    }

    // Update device last readings and check thresholds
    for (const update of deviceUpdates) {
      // Update device
      await supabase
        .from('iot_devices')
        .update({
          last_reading_value: update.value,
          last_reading_at: update.timestamp,
          status: 'online',
        })
        .eq('id', update.deviceId);

      // Check thresholds
      if (update.maxThreshold !== null && update.value > update.maxThreshold) {
        // Check if alert already exists
        const { data: existingAlert } = await supabase
          .from('monitoring_alerts')
          .select('id')
          .eq('device_id', update.deviceId)
          .eq('alert_type', 'threshold_high')
          .eq('is_active', true)
          .single();

        if (!existingAlert) {
          await supabase.from('monitoring_alerts').insert({
            organization_id: update.organizationId,
            device_id: update.deviceId,
            title: 'High Threshold Exceeded',
            message: `Value ${update.value} exceeded maximum threshold of ${update.maxThreshold}`,
            severity: 'warning',
            alert_type: 'threshold_high',
            value: update.value,
            threshold: update.maxThreshold,
            is_active: true,
          });
        }
      }

      if (update.minThreshold !== null && update.value < update.minThreshold) {
        const { data: existingAlert } = await supabase
          .from('monitoring_alerts')
          .select('id')
          .eq('device_id', update.deviceId)
          .eq('alert_type', 'threshold_low')
          .eq('is_active', true)
          .single();

        if (!existingAlert) {
          await supabase.from('monitoring_alerts').insert({
            organization_id: update.organizationId,
            device_id: update.deviceId,
            title: 'Low Threshold Breached',
            message: `Value ${update.value} dropped below minimum threshold of ${update.minThreshold}`,
            severity: 'warning',
            alert_type: 'threshold_low',
            value: update.value,
            threshold: update.minThreshold,
            is_active: true,
          });
        }
      }

      // Auto-resolve alerts if back in range
      if (
        (update.minThreshold === null || update.value >= update.minThreshold) &&
        (update.maxThreshold === null || update.value <= update.maxThreshold)
      ) {
        await supabase
          .from('monitoring_alerts')
          .update({ is_active: false, resolved_at: new Date().toISOString() })
          .eq('device_id', update.deviceId)
          .eq('is_active', true);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('MQTT bridge error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
