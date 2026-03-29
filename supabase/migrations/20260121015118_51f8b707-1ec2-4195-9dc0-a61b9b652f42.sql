-- Add acoustic-specific columns to monitoring_alerts for NC level tracking
ALTER TABLE monitoring_alerts 
ADD COLUMN IF NOT EXISTS acoustic_zone_id uuid REFERENCES zones(id),
ADD COLUMN IF NOT EXISTS measured_nc integer,
ADD COLUMN IF NOT EXISTS target_nc integer;

-- Create index for efficient acoustic alert queries
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_acoustic 
ON monitoring_alerts(organization_id, alert_type) 
WHERE alert_type = 'acoustic_exceedance';

-- Create index for zone-based acoustic queries
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_acoustic_zone 
ON monitoring_alerts(acoustic_zone_id) 
WHERE acoustic_zone_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN monitoring_alerts.acoustic_zone_id IS 'Reference to the zone where acoustic exceedance was detected';
COMMENT ON COLUMN monitoring_alerts.measured_nc IS 'The measured NC level that triggered the alert';
COMMENT ON COLUMN monitoring_alerts.target_nc IS 'The target NC level for the zone';