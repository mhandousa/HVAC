-- Create Hot Water Plants table
CREATE TABLE public.hot_water_plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  plant_name VARCHAR(255) NOT NULL,
  plant_tag VARCHAR(50),
  
  -- Design Parameters
  heating_load_btuh NUMERIC NOT NULL,
  supply_temp_f NUMERIC DEFAULT 180,
  return_temp_f NUMERIC DEFAULT 160,
  
  -- Boiler Configuration
  boiler_type VARCHAR(50) NOT NULL,
  boiler_count INTEGER DEFAULT 1,
  redundancy_mode VARCHAR(10) DEFAULT 'N+1',
  boiler_config JSONB,
  
  -- Pump Configuration  
  pumping_config VARCHAR(50) DEFAULT 'primary_only',
  primary_pump_config JSONB,
  secondary_pump_config JSONB,
  
  -- Expansion Tank
  system_volume_gal NUMERIC,
  expansion_tank_config JSONB,
  
  -- Piping
  piping_config JSONB,
  
  -- Metadata
  diversity_factor NUMERIC DEFAULT 1.0,
  future_expansion_percent NUMERIC DEFAULT 10,
  status VARCHAR(50) DEFAULT 'draft',
  notes TEXT,
  revision VARCHAR(10) DEFAULT 'A',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Smoke Control Calculations table
CREATE TABLE public.smoke_control_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
  calculation_name VARCHAR(255) NOT NULL,
  calculation_type VARCHAR(50) NOT NULL,
  
  -- Common Parameters
  reference_standard VARCHAR(50) DEFAULT 'NFPA 92',
  
  -- Stairwell/Elevator Pressurization
  space_height_ft NUMERIC,
  space_area_sqft NUMERIC,
  number_of_doors INTEGER,
  door_width_ft NUMERIC,
  door_height_ft NUMERIC,
  simultaneous_doors_open INTEGER,
  target_pressure_in_wc NUMERIC,
  
  -- Atrium Exhaust
  fire_size_btu_s NUMERIC,
  smoke_layer_height_ft NUMERIC,
  perimeter_ft NUMERIC,
  ambient_temp_f NUMERIC,
  makeup_air_temp_f NUMERIC,
  
  -- Results
  pressurization_result JSONB,
  exhaust_result JSONB,
  
  -- Metadata
  status VARCHAR(50) DEFAULT 'draft',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Thermal Comfort Analyses table
CREATE TABLE public.thermal_comfort_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  analysis_name VARCHAR(255) NOT NULL,
  analysis_type VARCHAR(50) NOT NULL,
  
  -- Environmental Parameters
  air_temp_c NUMERIC,
  mean_radiant_temp_c NUMERIC,
  relative_humidity_percent NUMERIC,
  air_velocity_m_s NUMERIC,
  
  -- Personal Parameters
  metabolic_rate_met NUMERIC,
  clothing_insulation_clo NUMERIC,
  
  -- Adaptive Comfort
  mean_outdoor_temp_c NUMERIC,
  indoor_operative_temp_c NUMERIC,
  acceptability_class VARCHAR(10),
  
  -- Results
  pmv_result JSONB,
  adaptive_result JSONB,
  
  -- Metadata
  status VARCHAR(50) DEFAULT 'draft',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create SBC Compliance Checks table
CREATE TABLE public.sbc_compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  check_name VARCHAR(255) NOT NULL,
  
  -- Climate Zone
  climate_zone_id VARCHAR(50),
  
  -- Results Summary
  total_requirements INTEGER DEFAULT 0,
  passed_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  pending_count INTEGER DEFAULT 0,
  compliance_score_percent NUMERIC,
  
  -- Detailed Results
  requirement_results JSONB,
  
  -- Equipment Data
  equipment_data JSONB,
  
  -- Metadata
  status VARCHAR(50) DEFAULT 'draft',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.hot_water_plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smoke_control_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thermal_comfort_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sbc_compliance_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hot_water_plants
CREATE POLICY "Users can view hot water plants in their organization"
ON public.hot_water_plants FOR SELECT
USING (organization_id = user_org_id());

CREATE POLICY "Users can create hot water plants in their organization"
ON public.hot_water_plants FOR INSERT
WITH CHECK (organization_id = user_org_id());

CREATE POLICY "Users can update hot water plants in their organization"
ON public.hot_water_plants FOR UPDATE
USING (organization_id = user_org_id());

CREATE POLICY "Users can delete hot water plants in their organization"
ON public.hot_water_plants FOR DELETE
USING (organization_id = user_org_id());

-- RLS Policies for smoke_control_calculations
CREATE POLICY "Users can view smoke control calcs in their organization"
ON public.smoke_control_calculations FOR SELECT
USING (organization_id = user_org_id());

CREATE POLICY "Users can create smoke control calcs in their organization"
ON public.smoke_control_calculations FOR INSERT
WITH CHECK (organization_id = user_org_id());

CREATE POLICY "Users can update smoke control calcs in their organization"
ON public.smoke_control_calculations FOR UPDATE
USING (organization_id = user_org_id());

CREATE POLICY "Users can delete smoke control calcs in their organization"
ON public.smoke_control_calculations FOR DELETE
USING (organization_id = user_org_id());

-- RLS Policies for thermal_comfort_analyses
CREATE POLICY "Users can view thermal comfort analyses in their organization"
ON public.thermal_comfort_analyses FOR SELECT
USING (organization_id = user_org_id());

CREATE POLICY "Users can create thermal comfort analyses in their organization"
ON public.thermal_comfort_analyses FOR INSERT
WITH CHECK (organization_id = user_org_id());

CREATE POLICY "Users can update thermal comfort analyses in their organization"
ON public.thermal_comfort_analyses FOR UPDATE
USING (organization_id = user_org_id());

CREATE POLICY "Users can delete thermal comfort analyses in their organization"
ON public.thermal_comfort_analyses FOR DELETE
USING (organization_id = user_org_id());

-- RLS Policies for sbc_compliance_checks
CREATE POLICY "Users can view SBC compliance checks in their organization"
ON public.sbc_compliance_checks FOR SELECT
USING (organization_id = user_org_id());

CREATE POLICY "Users can create SBC compliance checks in their organization"
ON public.sbc_compliance_checks FOR INSERT
WITH CHECK (organization_id = user_org_id());

CREATE POLICY "Users can update SBC compliance checks in their organization"
ON public.sbc_compliance_checks FOR UPDATE
USING (organization_id = user_org_id());

CREATE POLICY "Users can delete SBC compliance checks in their organization"
ON public.sbc_compliance_checks FOR DELETE
USING (organization_id = user_org_id());

-- Create indexes
CREATE INDEX idx_hot_water_plants_org ON public.hot_water_plants(organization_id);
CREATE INDEX idx_hot_water_plants_project ON public.hot_water_plants(project_id);
CREATE INDEX idx_smoke_control_org ON public.smoke_control_calculations(organization_id);
CREATE INDEX idx_smoke_control_project ON public.smoke_control_calculations(project_id);
CREATE INDEX idx_thermal_comfort_org ON public.thermal_comfort_analyses(organization_id);
CREATE INDEX idx_thermal_comfort_project ON public.thermal_comfort_analyses(project_id);
CREATE INDEX idx_sbc_compliance_org ON public.sbc_compliance_checks(organization_id);
CREATE INDEX idx_sbc_compliance_project ON public.sbc_compliance_checks(project_id);

-- Create updated_at triggers
CREATE TRIGGER update_hot_water_plants_updated_at
BEFORE UPDATE ON public.hot_water_plants
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_smoke_control_calculations_updated_at
BEFORE UPDATE ON public.smoke_control_calculations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_thermal_comfort_analyses_updated_at
BEFORE UPDATE ON public.thermal_comfort_analyses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sbc_compliance_checks_updated_at
BEFORE UPDATE ON public.sbc_compliance_checks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add specialized tools tracking to design completeness snapshots
ALTER TABLE public.design_completeness_snapshots
ADD COLUMN IF NOT EXISTS has_hw_plant BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_smoke_control BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_thermal_comfort BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_sbc_compliance BOOLEAN DEFAULT FALSE;