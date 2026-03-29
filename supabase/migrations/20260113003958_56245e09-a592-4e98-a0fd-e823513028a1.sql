-- IoT Devices table for sensor/device configuration
CREATE TABLE public.iot_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'temperature',
  device_id TEXT NOT NULL,
  protocol TEXT NOT NULL DEFAULT 'rest_api',
  connection_config JSONB DEFAULT '{}'::jsonb,
  unit TEXT NOT NULL DEFAULT '°C',
  setpoint NUMERIC,
  min_threshold NUMERIC,
  max_threshold NUMERIC,
  status TEXT NOT NULL DEFAULT 'offline',
  last_reading_value NUMERIC,
  last_reading_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT iot_devices_device_type_check CHECK (device_type IN ('temperature', 'humidity', 'pressure', 'flow', 'power', 'energy', 'co2', 'voc', 'occupancy', 'status')),
  CONSTRAINT iot_devices_protocol_check CHECK (protocol IN ('mqtt', 'modbus', 'bacnet', 'rest_api', 'manual')),
  CONSTRAINT iot_devices_status_check CHECK (status IN ('online', 'offline', 'fault', 'maintenance'))
);

-- Unique constraint on external device_id per organization
CREATE UNIQUE INDEX idx_iot_devices_org_device_id ON public.iot_devices(organization_id, device_id);

-- Index for equipment lookups
CREATE INDEX idx_iot_devices_equipment ON public.iot_devices(equipment_id) WHERE equipment_id IS NOT NULL;

-- Index for zone lookups
CREATE INDEX idx_iot_devices_zone ON public.iot_devices(zone_id) WHERE zone_id IS NOT NULL;

-- Sensor readings table for time-series data
CREATE TABLE public.sensor_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES public.iot_devices(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  quality TEXT NOT NULL DEFAULT 'good',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sensor_readings_quality_check CHECK (quality IN ('good', 'uncertain', 'bad'))
);

-- Critical index for time-series queries
CREATE INDEX idx_sensor_readings_device_time ON public.sensor_readings(device_id, recorded_at DESC);

-- Index for recent readings queries
CREATE INDEX idx_sensor_readings_recorded_at ON public.sensor_readings(recorded_at DESC);

-- Monitoring alerts table
CREATE TABLE public.monitoring_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.iot_devices(id) ON DELETE SET NULL,
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL DEFAULT 'threshold_high',
  severity TEXT NOT NULL DEFAULT 'warning',
  title TEXT NOT NULL,
  message TEXT,
  value NUMERIC,
  threshold NUMERIC,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT monitoring_alerts_type_check CHECK (alert_type IN ('threshold_high', 'threshold_low', 'offline', 'fault', 'maintenance', 'custom')),
  CONSTRAINT monitoring_alerts_severity_check CHECK (severity IN ('critical', 'warning', 'info'))
);

-- Index for active alerts
CREATE INDEX idx_monitoring_alerts_active ON public.monitoring_alerts(organization_id, is_active) WHERE is_active = true;

-- Index for device alerts
CREATE INDEX idx_monitoring_alerts_device ON public.monitoring_alerts(device_id) WHERE device_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for iot_devices
CREATE POLICY "Users can view IoT devices in their org"
  ON public.iot_devices FOR SELECT
  USING (organization_id = user_org_id());

CREATE POLICY "Engineers+ can manage IoT devices"
  ON public.iot_devices FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'engineer')
  ));

-- RLS Policies for sensor_readings
CREATE POLICY "Users can view sensor readings for their org devices"
  ON public.sensor_readings FOR SELECT
  USING (device_id IN (
    SELECT id FROM iot_devices WHERE organization_id = user_org_id()
  ));

CREATE POLICY "System can insert sensor readings"
  ON public.sensor_readings FOR INSERT
  WITH CHECK (device_id IN (
    SELECT id FROM iot_devices
  ));

-- RLS Policies for monitoring_alerts
CREATE POLICY "Users can view alerts in their org"
  ON public.monitoring_alerts FOR SELECT
  USING (organization_id = user_org_id());

CREATE POLICY "Users can acknowledge alerts in their org"
  ON public.monitoring_alerts FOR UPDATE
  USING (organization_id = user_org_id());

CREATE POLICY "System can create alerts"
  ON public.monitoring_alerts FOR INSERT
  WITH CHECK (organization_id IN (SELECT id FROM organizations));

-- Trigger to update iot_devices.updated_at
CREATE TRIGGER update_iot_devices_updated_at
  BEFORE UPDATE ON public.iot_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.monitoring_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.iot_devices;