-- Add zone_id to load_calculations table
ALTER TABLE load_calculations
ADD COLUMN zone_id UUID REFERENCES zones(id) ON DELETE SET NULL;

-- Add zone_id to equipment_selections table
ALTER TABLE equipment_selections
ADD COLUMN zone_id UUID REFERENCES zones(id) ON DELETE SET NULL;

-- Add zone_id to diffuser_grilles table
ALTER TABLE diffuser_grilles
ADD COLUMN zone_id UUID REFERENCES zones(id) ON DELETE SET NULL;

-- Create duct_system_zones linking table
CREATE TABLE duct_system_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duct_system_id UUID NOT NULL REFERENCES duct_systems(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  airflow_cfm NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(duct_system_id, zone_id)
);

-- Enable RLS on duct_system_zones
ALTER TABLE duct_system_zones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for duct_system_zones
CREATE POLICY "Users can view duct system zones in their organization"
  ON duct_system_zones FOR SELECT
  USING (duct_system_id IN (
    SELECT id FROM duct_systems WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can insert duct system zones in their organization"
  ON duct_system_zones FOR INSERT
  WITH CHECK (duct_system_id IN (
    SELECT id FROM duct_systems WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can update duct system zones in their organization"
  ON duct_system_zones FOR UPDATE
  USING (duct_system_id IN (
    SELECT id FROM duct_systems WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can delete duct system zones in their organization"
  ON duct_system_zones FOR DELETE
  USING (duct_system_id IN (
    SELECT id FROM duct_systems WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  ));

-- Create index for better query performance
CREATE INDEX idx_duct_system_zones_system ON duct_system_zones(duct_system_id);
CREATE INDEX idx_duct_system_zones_zone ON duct_system_zones(zone_id);
CREATE INDEX idx_load_calculations_zone ON load_calculations(zone_id);
CREATE INDEX idx_equipment_selections_zone ON equipment_selections(zone_id);
CREATE INDEX idx_diffuser_grilles_zone ON diffuser_grilles(zone_id);