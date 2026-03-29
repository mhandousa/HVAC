-- Create coil_selections table for storing coil selection data
CREATE TABLE public.coil_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  ahu_configuration_id UUID REFERENCES public.ahu_configurations(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  coil_type TEXT NOT NULL CHECK (coil_type IN ('cooling', 'heating', 'preheat', 'reheat')),
  manufacturer TEXT,
  model_number TEXT,
  rows INTEGER,
  fins_per_inch NUMERIC,
  face_area_sqft NUMERIC,
  capacity_tons NUMERIC,
  capacity_mbh NUMERIC,
  air_pressure_drop_in NUMERIC,
  water_pressure_drop_ft NUMERIC,
  entering_air_db_f NUMERIC,
  leaving_air_db_f NUMERIC,
  entering_air_wb_f NUMERIC,
  leaving_air_wb_f NUMERIC,
  fluid_type TEXT DEFAULT 'water',
  supply_temp_f NUMERIC,
  return_temp_f NUMERIC,
  water_flow_gpm NUMERIC,
  face_velocity_fpm NUMERIC,
  design_cfm NUMERIC,
  fluid_velocity_fps NUMERIC,
  tube_material TEXT DEFAULT 'copper',
  fin_material TEXT DEFAULT 'aluminum',
  connection_size TEXT,
  notes TEXT,
  status TEXT DEFAULT 'draft',
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create filter_selections table
CREATE TABLE public.filter_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  ahu_configuration_id UUID REFERENCES public.ahu_configurations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  filter_position TEXT NOT NULL CHECK (filter_position IN ('prefilter', 'final', 'hepa', 'carbon')),
  manufacturer TEXT,
  model_number TEXT,
  merv_rating INTEGER CHECK (merv_rating BETWEEN 1 AND 20),
  filter_type TEXT CHECK (filter_type IN ('pleated', 'bag', 'rigid', 'hepa', 'carbon', 'electrostatic')),
  nominal_size TEXT,
  face_area_sqft NUMERIC,
  face_velocity_fpm INTEGER,
  design_cfm NUMERIC,
  clean_pressure_drop_in NUMERIC,
  dirty_pressure_drop_in NUMERIC,
  final_pressure_drop_in NUMERIC,
  replacement_interval_months INTEGER,
  quantity INTEGER DEFAULT 1,
  dust_holding_capacity_g NUMERIC,
  efficiency_percent NUMERIC,
  annual_energy_cost_sar NUMERIC,
  replacement_cost_sar NUMERIC,
  notes TEXT,
  status TEXT DEFAULT 'draft',
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create cooling_tower_selections table
CREATE TABLE public.cooling_tower_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  chw_plant_id UUID REFERENCES public.chilled_water_plants(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  manufacturer TEXT,
  model_number TEXT,
  tower_type TEXT CHECK (tower_type IN ('induced_draft_counterflow', 'induced_draft_crossflow', 'forced_draft', 'hybrid')),
  number_of_cells INTEGER DEFAULT 1,
  capacity_per_cell_tons NUMERIC,
  total_capacity_tons NUMERIC,
  design_wet_bulb_f NUMERIC,
  approach_f NUMERIC,
  range_f NUMERIC,
  cw_flow_gpm NUMERIC,
  cw_supply_temp_f NUMERIC,
  cw_return_temp_f NUMERIC,
  fan_hp_per_cell NUMERIC,
  total_fan_kw NUMERIC,
  fan_type TEXT DEFAULT 'axial',
  motor_efficiency_percent NUMERIC,
  drift_rate_percent NUMERIC DEFAULT 0.005,
  cycles_of_concentration NUMERIC DEFAULT 5,
  makeup_water_gpm NUMERIC,
  blowdown_gpm NUMERIC,
  basin_heater_kw NUMERIC,
  sound_level_db NUMERIC,
  fill_type TEXT DEFAULT 'film',
  material TEXT DEFAULT 'frp',
  dimensions_json JSONB,
  weight_operating_lbs NUMERIC,
  notes TEXT,
  status TEXT DEFAULT 'draft',
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.coil_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filter_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooling_tower_selections ENABLE ROW LEVEL SECURITY;

-- RLS policies for coil_selections
CREATE POLICY "Users can view coil_selections in their organization"
  ON public.coil_selections FOR SELECT
  USING (organization_id = user_org_id());

CREATE POLICY "Users can insert coil_selections in their organization"
  ON public.coil_selections FOR INSERT
  WITH CHECK (organization_id = user_org_id());

CREATE POLICY "Users can update coil_selections in their organization"
  ON public.coil_selections FOR UPDATE
  USING (organization_id = user_org_id());

CREATE POLICY "Users can delete coil_selections in their organization"
  ON public.coil_selections FOR DELETE
  USING (organization_id = user_org_id());

-- RLS policies for filter_selections
CREATE POLICY "Users can view filter_selections in their organization"
  ON public.filter_selections FOR SELECT
  USING (organization_id = user_org_id());

CREATE POLICY "Users can insert filter_selections in their organization"
  ON public.filter_selections FOR INSERT
  WITH CHECK (organization_id = user_org_id());

CREATE POLICY "Users can update filter_selections in their organization"
  ON public.filter_selections FOR UPDATE
  USING (organization_id = user_org_id());

CREATE POLICY "Users can delete filter_selections in their organization"
  ON public.filter_selections FOR DELETE
  USING (organization_id = user_org_id());

-- RLS policies for cooling_tower_selections
CREATE POLICY "Users can view cooling_tower_selections in their organization"
  ON public.cooling_tower_selections FOR SELECT
  USING (organization_id = user_org_id());

CREATE POLICY "Users can insert cooling_tower_selections in their organization"
  ON public.cooling_tower_selections FOR INSERT
  WITH CHECK (organization_id = user_org_id());

CREATE POLICY "Users can update cooling_tower_selections in their organization"
  ON public.cooling_tower_selections FOR UPDATE
  USING (organization_id = user_org_id());

CREATE POLICY "Users can delete cooling_tower_selections in their organization"
  ON public.cooling_tower_selections FOR DELETE
  USING (organization_id = user_org_id());

-- Add updated_at triggers
CREATE TRIGGER update_coil_selections_updated_at
  BEFORE UPDATE ON public.coil_selections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_filter_selections_updated_at
  BEFORE UPDATE ON public.filter_selections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cooling_tower_selections_updated_at
  BEFORE UPDATE ON public.cooling_tower_selections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for common queries
CREATE INDEX idx_coil_selections_project ON public.coil_selections(project_id);
CREATE INDEX idx_coil_selections_org ON public.coil_selections(organization_id);
CREATE INDEX idx_filter_selections_project ON public.filter_selections(project_id);
CREATE INDEX idx_filter_selections_org ON public.filter_selections(organization_id);
CREATE INDEX idx_cooling_tower_selections_project ON public.cooling_tower_selections(project_id);
CREATE INDEX idx_cooling_tower_selections_org ON public.cooling_tower_selections(organization_id);