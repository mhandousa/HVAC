-- =====================================================
-- 1. ZONE HIERARCHY HELPER FUNCTION AND VIEW
-- =====================================================

-- Create a function that returns full zone hierarchy
CREATE OR REPLACE FUNCTION get_zone_hierarchy(p_zone_id UUID)
RETURNS TABLE (
  zone_id UUID,
  zone_name TEXT,
  floor_id UUID,
  floor_name TEXT,
  building_id UUID,
  building_name TEXT,
  project_id UUID,
  project_name TEXT,
  organization_id UUID
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    z.id AS zone_id,
    z.name AS zone_name,
    f.id AS floor_id,
    f.name AS floor_name,
    b.id AS building_id,
    b.name AS building_name,
    p.id AS project_id,
    p.name AS project_name,
    p.organization_id
  FROM zones z
  JOIN floors f ON z.floor_id = f.id
  JOIN buildings b ON f.building_id = b.id
  JOIN projects p ON b.project_id = p.id
  WHERE z.id = p_zone_id;
$$;

-- =====================================================
-- 2. PSYCHROMETRIC ANALYSES TABLE
-- =====================================================

CREATE TABLE psychrometric_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  
  name VARCHAR NOT NULL,
  description TEXT,
  
  altitude_ft NUMERIC DEFAULT 0,
  atmospheric_pressure_psia NUMERIC DEFAULT 14.696,
  
  air_states JSONB NOT NULL DEFAULT '[]',
  processes JSONB DEFAULT '[]',
  
  hvac_preset VARCHAR,
  airflow_cfm NUMERIC,
  
  status VARCHAR DEFAULT 'draft',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_psychrometric_org ON psychrometric_analyses(organization_id);
CREATE INDEX idx_psychrometric_project ON psychrometric_analyses(project_id);
CREATE INDEX idx_psychrometric_zone ON psychrometric_analyses(zone_id);

ALTER TABLE psychrometric_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view psychrometric analyses in their org"
  ON psychrometric_analyses FOR SELECT
  USING (organization_id = user_org_id());

CREATE POLICY "Engineers+ can create psychrometric analyses"
  ON psychrometric_analyses FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')
  ));

CREATE POLICY "Engineers+ can update psychrometric analyses"
  ON psychrometric_analyses FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')
  ));

CREATE POLICY "Admins can delete psychrometric analyses"
  ON psychrometric_analyses FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE TRIGGER psychrometric_analyses_updated_at
  BEFORE UPDATE ON psychrometric_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. ZONE SUPPORT FOR WORK ORDERS
-- =====================================================

ALTER TABLE work_orders
ADD COLUMN zone_id UUID REFERENCES zones(id) ON DELETE SET NULL;

CREATE INDEX idx_work_orders_zone ON work_orders(zone_id);

-- =====================================================
-- 4. PIPE SYSTEMS AND PIPE SEGMENTS TABLES
-- =====================================================

CREATE TABLE pipe_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  load_calculation_id UUID REFERENCES load_calculations(id) ON DELETE SET NULL,
  
  system_name VARCHAR NOT NULL,
  system_type VARCHAR DEFAULT 'chilled-water',
  
  design_method VARCHAR DEFAULT 'velocity',
  max_velocity_fps NUMERIC DEFAULT 8,
  max_friction_ft_per_100ft NUMERIC DEFAULT 4,
  
  fluid_type VARCHAR DEFAULT 'water',
  fluid_temp_f NUMERIC,
  
  total_flow_gpm NUMERIC,
  system_head_ft NUMERIC,
  pump_power_hp NUMERIC,
  
  pipe_material VARCHAR DEFAULT 'steel',
  
  status VARCHAR DEFAULT 'draft',
  notes TEXT,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pipe_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipe_system_id UUID NOT NULL REFERENCES pipe_systems(id) ON DELETE CASCADE,
  
  segment_name VARCHAR NOT NULL,
  flow_gpm NUMERIC NOT NULL,
  
  nominal_size_in NUMERIC,
  inside_diameter_in NUMERIC,
  
  length_ft NUMERIC,
  fittings_equivalent_length_ft NUMERIC DEFAULT 0,
  
  velocity_fps NUMERIC,
  friction_loss_per_100ft NUMERIC,
  total_pressure_drop_ft NUMERIC,
  
  segment_type VARCHAR DEFAULT 'main',
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pipe_system_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipe_system_id UUID NOT NULL REFERENCES pipe_systems(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  flow_gpm NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pipe_system_id, zone_id)
);

CREATE INDEX idx_pipe_systems_org ON pipe_systems(organization_id);
CREATE INDEX idx_pipe_systems_project ON pipe_systems(project_id);
CREATE INDEX idx_pipe_segments_system ON pipe_segments(pipe_system_id);
CREATE INDEX idx_pipe_system_zones_system ON pipe_system_zones(pipe_system_id);
CREATE INDEX idx_pipe_system_zones_zone ON pipe_system_zones(zone_id);

ALTER TABLE pipe_systems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pipe systems in their org"
  ON pipe_systems FOR SELECT
  USING (organization_id = user_org_id());

CREATE POLICY "Engineers+ can manage pipe systems"
  ON pipe_systems FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')
  ));

ALTER TABLE pipe_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pipe segments"
  ON pipe_segments FOR SELECT
  USING (pipe_system_id IN (
    SELECT id FROM pipe_systems WHERE organization_id = user_org_id()
  ));

CREATE POLICY "Engineers+ can manage pipe segments"
  ON pipe_segments FOR ALL
  USING (pipe_system_id IN (
    SELECT id FROM pipe_systems WHERE organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')
    )
  ));

ALTER TABLE pipe_system_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pipe system zones"
  ON pipe_system_zones FOR SELECT
  USING (pipe_system_id IN (
    SELECT id FROM pipe_systems WHERE organization_id = user_org_id()
  ));

CREATE POLICY "Engineers+ can manage pipe system zones"
  ON pipe_system_zones FOR ALL
  USING (pipe_system_id IN (
    SELECT id FROM pipe_systems WHERE organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')
    )
  ));

CREATE TRIGGER pipe_systems_updated_at
  BEFORE UPDATE ON pipe_systems
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER pipe_segments_updated_at
  BEFORE UPDATE ON pipe_segments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();