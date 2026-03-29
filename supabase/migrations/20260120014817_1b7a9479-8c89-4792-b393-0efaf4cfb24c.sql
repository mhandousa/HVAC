-- Create ventilation_calculations table
CREATE TABLE public.ventilation_calculations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  calculation_name varchar(255) NOT NULL,
  diversity_factor numeric DEFAULT 1.0,
  supply_air_cfm numeric,
  total_floor_area_sqft numeric,
  total_occupancy integer,
  total_vbz_cfm numeric,
  total_voz_cfm numeric,
  system_outdoor_air_cfm numeric,
  system_outdoor_air_percent numeric,
  system_efficiency numeric,
  outdoor_air_mass_flow_lb_hr numeric,
  status varchar(50) DEFAULT 'draft',
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create ventilation_zone_results table
CREATE TABLE public.ventilation_zone_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ventilation_calculation_id uuid NOT NULL REFERENCES public.ventilation_calculations(id) ON DELETE CASCADE,
  zone_id uuid REFERENCES public.zones(id) ON DELETE SET NULL,
  zone_name varchar(255) NOT NULL,
  space_type_id varchar(100),
  floor_area_sqft numeric,
  occupancy integer,
  default_occupancy integer,
  rp_cfm_person numeric,
  ra_cfm_sqft numeric,
  vbz_cfm numeric,
  ez numeric DEFAULT 1.0,
  voz_cfm numeric,
  supply_location varchar(20) DEFAULT 'ceiling',
  return_location varchar(20) DEFAULT 'ceiling',
  operating_mode varchar(20) DEFAULT 'cooling',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create erv_sizing_calculations table
CREATE TABLE public.erv_sizing_calculations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  zone_id uuid REFERENCES public.zones(id) ON DELETE SET NULL,
  calculation_name varchar(255) NOT NULL,
  city varchar(100),
  erv_type varchar(50),
  outdoor_air_cfm numeric,
  sensible_efficiency_percent smallint,
  latent_efficiency_percent smallint,
  outdoor_temp_f numeric,
  outdoor_rh_percent numeric,
  indoor_temp_f numeric,
  indoor_rh_percent numeric,
  sensible_recovery_btuh numeric,
  latent_recovery_btuh numeric,
  total_recovery_btuh numeric,
  load_reduction_percent numeric,
  annual_energy_savings_kwh numeric,
  annual_cost_savings_sar numeric,
  operating_hours_per_year integer DEFAULT 2920,
  electricity_rate_sar numeric DEFAULT 0.18,
  cooling_cop numeric DEFAULT 3.0,
  heating_cop numeric DEFAULT 1.0,
  design_mode varchar(20) DEFAULT 'cooling',
  is_recovery_beneficial boolean DEFAULT true,
  status varchar(50) DEFAULT 'draft',
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create erv_annual_simulations table
CREATE TABLE public.erv_annual_simulations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  erv_calculation_id uuid NOT NULL REFERENCES public.erv_sizing_calculations(id) ON DELETE CASCADE,
  month smallint NOT NULL CHECK (month >= 1 AND month <= 12),
  cooling_recovery_kwh numeric,
  heating_recovery_kwh numeric,
  cost_savings_sar numeric,
  avg_outdoor_temp_c numeric,
  operating_hours numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_ventilation_calculations_org ON public.ventilation_calculations(organization_id);
CREATE INDEX idx_ventilation_calculations_project ON public.ventilation_calculations(project_id);
CREATE INDEX idx_ventilation_zone_results_calc ON public.ventilation_zone_results(ventilation_calculation_id);
CREATE INDEX idx_ventilation_zone_results_zone ON public.ventilation_zone_results(zone_id);
CREATE INDEX idx_erv_sizing_calculations_org ON public.erv_sizing_calculations(organization_id);
CREATE INDEX idx_erv_sizing_calculations_project ON public.erv_sizing_calculations(project_id);
CREATE INDEX idx_erv_sizing_calculations_zone ON public.erv_sizing_calculations(zone_id);
CREATE INDEX idx_erv_annual_simulations_calc ON public.erv_annual_simulations(erv_calculation_id);

-- Enable RLS
ALTER TABLE public.ventilation_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventilation_zone_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erv_sizing_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erv_annual_simulations ENABLE ROW LEVEL SECURITY;

-- RLS policies for ventilation_calculations
CREATE POLICY "Users can view their org ventilation calculations"
  ON public.ventilation_calculations FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert ventilation calculations for their org"
  ON public.ventilation_calculations FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their org ventilation calculations"
  ON public.ventilation_calculations FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete their org ventilation calculations"
  ON public.ventilation_calculations FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- RLS policies for ventilation_zone_results (access through parent calculation)
CREATE POLICY "Users can view zone results via calculation"
  ON public.ventilation_zone_results FOR SELECT
  USING (ventilation_calculation_id IN (
    SELECT id FROM public.ventilation_calculations WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can insert zone results via calculation"
  ON public.ventilation_zone_results FOR INSERT
  WITH CHECK (ventilation_calculation_id IN (
    SELECT id FROM public.ventilation_calculations WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can update zone results via calculation"
  ON public.ventilation_zone_results FOR UPDATE
  USING (ventilation_calculation_id IN (
    SELECT id FROM public.ventilation_calculations WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can delete zone results via calculation"
  ON public.ventilation_zone_results FOR DELETE
  USING (ventilation_calculation_id IN (
    SELECT id FROM public.ventilation_calculations WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

-- RLS policies for erv_sizing_calculations
CREATE POLICY "Users can view their org erv calculations"
  ON public.erv_sizing_calculations FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert erv calculations for their org"
  ON public.erv_sizing_calculations FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their org erv calculations"
  ON public.erv_sizing_calculations FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete their org erv calculations"
  ON public.erv_sizing_calculations FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- RLS policies for erv_annual_simulations (access through parent calculation)
CREATE POLICY "Users can view simulations via calculation"
  ON public.erv_annual_simulations FOR SELECT
  USING (erv_calculation_id IN (
    SELECT id FROM public.erv_sizing_calculations WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can insert simulations via calculation"
  ON public.erv_annual_simulations FOR INSERT
  WITH CHECK (erv_calculation_id IN (
    SELECT id FROM public.erv_sizing_calculations WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can update simulations via calculation"
  ON public.erv_annual_simulations FOR UPDATE
  USING (erv_calculation_id IN (
    SELECT id FROM public.erv_sizing_calculations WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can delete simulations via calculation"
  ON public.erv_annual_simulations FOR DELETE
  USING (erv_calculation_id IN (
    SELECT id FROM public.erv_sizing_calculations WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

-- Create updated_at triggers
CREATE TRIGGER update_ventilation_calculations_updated_at
  BEFORE UPDATE ON public.ventilation_calculations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_erv_sizing_calculations_updated_at
  BEFORE UPDATE ON public.erv_sizing_calculations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add ventilation/ERV columns to design completeness snapshots
ALTER TABLE public.design_completeness_snapshots
ADD COLUMN IF NOT EXISTS zones_with_ventilation integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS zones_with_erv integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ventilation_percent smallint DEFAULT 0,
ADD COLUMN IF NOT EXISTS erv_percent smallint DEFAULT 0;

ALTER TABLE public.design_completeness_building_snapshots
ADD COLUMN IF NOT EXISTS zones_with_ventilation integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS zones_with_erv integer DEFAULT 0;