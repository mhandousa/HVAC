-- Add boiler-specific columns to equipment_catalog
ALTER TABLE equipment_catalog ADD COLUMN IF NOT EXISTS afue NUMERIC;
ALTER TABLE equipment_catalog ADD COLUMN IF NOT EXISTS thermal_efficiency NUMERIC;
ALTER TABLE equipment_catalog ADD COLUMN IF NOT EXISTS combustion_efficiency NUMERIC;
ALTER TABLE equipment_catalog ADD COLUMN IF NOT EXISTS turndown_ratio NUMERIC;
ALTER TABLE equipment_catalog ADD COLUMN IF NOT EXISTS min_modulation NUMERIC;
ALTER TABLE equipment_catalog ADD COLUMN IF NOT EXISTS supply_temp_range JSONB;
ALTER TABLE equipment_catalog ADD COLUMN IF NOT EXISTS nox_emissions_ppm NUMERIC;
ALTER TABLE equipment_catalog ADD COLUMN IF NOT EXISTS asme_compliant BOOLEAN DEFAULT false;
ALTER TABLE equipment_catalog ADD COLUMN IF NOT EXISTS fuel_type TEXT;

-- Create boiler_selections table
CREATE TABLE boiler_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  hot_water_plant_id UUID REFERENCES hot_water_plants(id) ON DELETE SET NULL,
  boiler_catalog_id UUID REFERENCES equipment_catalog(id) ON DELETE SET NULL,
  selection_name TEXT NOT NULL,
  boiler_tag TEXT,
  manufacturer TEXT,
  model_number TEXT,
  boiler_type TEXT,
  fuel_type TEXT,
  required_capacity_btuh NUMERIC,
  selected_capacity_btuh NUMERIC,
  afue NUMERIC,
  thermal_efficiency NUMERIC,
  turndown_ratio NUMERIC,
  hw_supply_temp_f NUMERIC DEFAULT 180,
  hw_return_temp_f NUMERIC DEFAULT 160,
  hw_flow_gpm NUMERIC,
  fit_score NUMERIC,
  efficiency_analysis JSONB,
  annual_fuel_consumption JSONB,
  voltage TEXT,
  full_load_amps NUMERIC,
  power_input_kw NUMERIC,
  asme_certified BOOLEAN DEFAULT false,
  ahri_certified BOOLEAN DEFAULT false,
  notes TEXT,
  status TEXT DEFAULT 'selected',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE boiler_selections ENABLE ROW LEVEL SECURITY;

-- RLS policies for boiler_selections (using profiles table pattern)
CREATE POLICY "Users can view boiler selections in their organization"
  ON boiler_selections FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create boiler selections in their organization"
  ON boiler_selections FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update boiler selections in their organization"
  ON boiler_selections FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete boiler selections in their organization"
  ON boiler_selections FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- Create trigger for updated_at
CREATE TRIGGER update_boiler_selections_updated_at
  BEFORE UPDATE ON boiler_selections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();