-- Terminal Unit Selections table for VAV/FCU sizing
CREATE TABLE public.terminal_unit_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  duct_system_id UUID REFERENCES public.duct_systems(id) ON DELETE SET NULL,
  
  -- Unit Identification
  unit_tag VARCHAR NOT NULL,
  unit_type VARCHAR NOT NULL CHECK (unit_type IN ('vav_cooling', 'vav_reheat', 'fcu_2pipe', 'fcu_4pipe', 'fcu_electric')),
  manufacturer VARCHAR,
  model_number VARCHAR,
  
  -- Design Requirements (from load calc)
  cooling_load_btuh NUMERIC,
  heating_load_btuh NUMERIC,
  supply_cfm NUMERIC,
  min_cfm NUMERIC,
  max_cfm NUMERIC,
  outdoor_air_cfm NUMERIC,
  
  -- Unit Selection Results
  selected_size VARCHAR,
  inlet_size_in NUMERIC,
  coil_rows INTEGER,
  coil_fins_per_inch NUMERIC,
  fan_motor_hp NUMERIC,
  fan_speed_settings INTEGER,
  
  -- Performance Data
  entering_air_temp_f NUMERIC,
  leaving_air_temp_f NUMERIC,
  entering_water_temp_f NUMERIC,
  leaving_water_temp_f NUMERIC,
  water_flow_gpm NUMERIC,
  water_pressure_drop_ft NUMERIC,
  
  -- Hydronic (for FCU)
  chw_coil_capacity_btuh NUMERIC,
  hw_coil_capacity_btuh NUMERIC,
  
  -- Electric Reheat (for VAV)
  reheat_kw NUMERIC,
  reheat_stages INTEGER,
  
  -- Noise
  noise_nc NUMERIC,
  sound_power_db NUMERIC,
  
  -- Accessories
  has_reheat BOOLEAN DEFAULT false,
  reheat_type VARCHAR CHECK (reheat_type IN ('hot_water', 'electric', 'none')),
  has_damper BOOLEAN DEFAULT true,
  damper_actuator VARCHAR,
  has_flow_station BOOLEAN DEFAULT false,
  has_discharge_sensor BOOLEAN DEFAULT false,
  
  -- Mounting
  location_description TEXT,
  ceiling_type VARCHAR,
  
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  status VARCHAR DEFAULT 'draft',
  
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.terminal_unit_selections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view terminal units in their organization"
  ON public.terminal_unit_selections FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert terminal units in their organization"
  ON public.terminal_unit_selections FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update terminal units in their organization"
  ON public.terminal_unit_selections FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete terminal units in their organization"
  ON public.terminal_unit_selections FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_terminal_unit_selections_org ON public.terminal_unit_selections(organization_id);
CREATE INDEX idx_terminal_unit_selections_project ON public.terminal_unit_selections(project_id);
CREATE INDEX idx_terminal_unit_selections_zone ON public.terminal_unit_selections(zone_id);

-- Updated at trigger
CREATE TRIGGER update_terminal_unit_selections_updated_at
  BEFORE UPDATE ON public.terminal_unit_selections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();