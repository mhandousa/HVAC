-- Create chiller_selections table for AHRI-compliant chiller equipment selection
CREATE TABLE public.chiller_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  chw_plant_id uuid REFERENCES public.chilled_water_plants(id) ON DELETE SET NULL,
  
  -- Identification
  name text NOT NULL,
  chiller_tag text,
  duty_type text DEFAULT 'duty', -- duty, standby, swing
  sequence_number integer DEFAULT 1,
  
  -- Equipment Selection
  manufacturer text,
  model_number text,
  chiller_type text NOT NULL, -- water-cooled-centrifugal, water-cooled-screw, air-cooled-scroll, air-cooled-screw, absorption
  compressor_type text, -- centrifugal, screw, scroll, reciprocating
  refrigerant_type text, -- R-134a, R-410A, R-513A, R-1234ze, etc.
  
  -- Capacity & Performance (AHRI Ratings)
  rated_capacity_tons numeric NOT NULL,
  rated_capacity_kw numeric,
  rated_eer numeric, -- Energy Efficiency Ratio (full load)
  rated_cop numeric, -- Coefficient of Performance (full load)
  rated_iplv numeric, -- Integrated Part Load Value (AHRI)
  nplv numeric, -- Non-standard Part Load Value
  
  -- Part Load Performance Curve (kW/ton at each load point)
  part_load_100_kw_per_ton numeric,
  part_load_75_kw_per_ton numeric,
  part_load_50_kw_per_ton numeric,
  part_load_25_kw_per_ton numeric,
  
  -- Operating Conditions - Chilled Water
  chw_supply_temp_f numeric DEFAULT 44,
  chw_return_temp_f numeric DEFAULT 54,
  chw_flow_gpm numeric,
  
  -- Operating Conditions - Condenser (water-cooled)
  cw_supply_temp_f numeric DEFAULT 85,
  cw_return_temp_f numeric DEFAULT 95,
  cw_flow_gpm numeric,
  evaporator_pressure_drop_ft numeric,
  condenser_pressure_drop_ft numeric,
  
  -- Operating Conditions - Condenser (air-cooled)
  ambient_design_temp_f numeric,
  condenser_fan_kw numeric,
  condenser_airflow_cfm numeric,
  
  -- Electrical
  voltage text DEFAULT '380V',
  phases integer DEFAULT 3,
  full_load_amps numeric,
  locked_rotor_amps numeric,
  power_input_kw numeric,
  
  -- Physical
  dimensions_json jsonb,
  weight_operating_lbs numeric,
  weight_shipping_lbs numeric,
  
  -- Compliance & Certifications
  saso_certified boolean DEFAULT false,
  ashrae_90_1_compliant boolean DEFAULT true,
  ahri_certified boolean DEFAULT true,
  ahri_certificate_number text,
  
  -- Sound
  sound_power_level_db numeric,
  sound_pressure_level_db numeric,
  
  -- Costing
  list_price_sar numeric,
  
  -- Metadata
  notes text,
  status text DEFAULT 'draft', -- draft, selected, approved, ordered
  datasheet_url text,
  created_by uuid REFERENCES public.profiles(user_id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_chiller_selections_org ON public.chiller_selections(organization_id);
CREATE INDEX idx_chiller_selections_project ON public.chiller_selections(project_id);
CREATE INDEX idx_chiller_selections_plant ON public.chiller_selections(chw_plant_id);
CREATE INDEX idx_chiller_selections_type ON public.chiller_selections(chiller_type);

-- Enable Row Level Security
ALTER TABLE public.chiller_selections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view org chiller selections"
  ON public.chiller_selections FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert org chiller selections"
  ON public.chiller_selections FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update org chiller selections"
  ON public.chiller_selections FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete org chiller selections"
  ON public.chiller_selections FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_chiller_selections_updated_at
  BEFORE UPDATE ON public.chiller_selections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();