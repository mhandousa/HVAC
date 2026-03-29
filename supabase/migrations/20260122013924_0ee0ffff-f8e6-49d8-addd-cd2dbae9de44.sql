-- Add chiller-specific AHRI columns to equipment_catalog
ALTER TABLE equipment_catalog
ADD COLUMN IF NOT EXISTS compressor_type text,
ADD COLUMN IF NOT EXISTS lra numeric,
ADD COLUMN IF NOT EXISTS part_load_curve jsonb,
ADD COLUMN IF NOT EXISTS evap_pressure_drop_ft numeric,
ADD COLUMN IF NOT EXISTS cond_pressure_drop_ft numeric,
ADD COLUMN IF NOT EXISTS chw_delta_t_f numeric,
ADD COLUMN IF NOT EXISTS cw_delta_t_f numeric,
ADD COLUMN IF NOT EXISTS ahri_certified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ahri_cert_number text,
ADD COLUMN IF NOT EXISTS full_load_amps numeric,
ADD COLUMN IF NOT EXISTS sound_power_level_db numeric;

-- Add index for efficient chiller queries
CREATE INDEX IF NOT EXISTS idx_equipment_catalog_chiller_filters 
ON equipment_catalog(equipment_category, manufacturer, compressor_type, ahri_certified)
WHERE equipment_category = 'chiller';

-- Add comment for documentation
COMMENT ON COLUMN equipment_catalog.part_load_curve IS 'AHRI part-load performance curve: { "pct100": kW/ton, "pct75": kW/ton, "pct50": kW/ton, "pct25": kW/ton }';