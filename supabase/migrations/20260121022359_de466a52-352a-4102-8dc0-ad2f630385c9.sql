-- Add acoustic settings columns to zones table
ALTER TABLE zones
ADD COLUMN IF NOT EXISTS target_nc integer DEFAULT 35,
ADD COLUMN IF NOT EXISTS nc_tolerance integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS acoustic_alerts_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS acoustic_alert_severity text DEFAULT 'warning' 
  CHECK (acoustic_alert_severity IN ('info', 'warning', 'critical')),
ADD COLUMN IF NOT EXISTS acoustic_measurement_device_id uuid REFERENCES iot_devices(id);

-- Add index for acoustic queries
CREATE INDEX IF NOT EXISTS idx_zones_acoustic ON zones(target_nc) WHERE acoustic_alerts_enabled = true;

-- Update iot_devices constraint to include acoustic device types
-- First drop existing constraint if any
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'iot_devices_device_type_check' 
    AND table_name = 'iot_devices'
  ) THEN
    ALTER TABLE iot_devices DROP CONSTRAINT iot_devices_device_type_check;
  END IF;
END $$;