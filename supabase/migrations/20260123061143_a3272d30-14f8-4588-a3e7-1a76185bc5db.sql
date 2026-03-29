-- =============================================
-- Energy Metering Tables for Real Consumption Data
-- =============================================

-- 1. Energy Meters Table - Register meters that monitor equipment/systems
CREATE TABLE public.energy_meters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  
  -- Meter identification
  name TEXT NOT NULL,
  meter_tag TEXT NOT NULL,
  serial_number TEXT,
  
  -- System categorization for breakdown charts
  system_type TEXT NOT NULL DEFAULT 'other',
  
  -- Meter specifications
  meter_type TEXT NOT NULL DEFAULT 'electric',
  unit TEXT NOT NULL DEFAULT 'kWh',
  ct_ratio NUMERIC DEFAULT 1,
  pulse_factor NUMERIC DEFAULT 1,
  
  -- Utility rate for cost calculations
  cost_per_unit NUMERIC DEFAULT 0.12,
  demand_cost_per_kw NUMERIC,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active',
  is_main_meter BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Energy Readings Table - High-frequency readings from meters
CREATE TABLE public.energy_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id UUID NOT NULL REFERENCES public.energy_meters(id) ON DELETE CASCADE,
  
  -- Reading values
  value NUMERIC NOT NULL,
  consumption NUMERIC,
  demand_kw NUMERIC,
  power_factor NUMERIC,
  
  -- Environmental context
  outside_air_temp_f NUMERIC,
  
  -- Data quality
  quality TEXT NOT NULL DEFAULT 'good',
  source TEXT DEFAULT 'automatic',
  
  -- Timestamps
  recorded_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_meter_reading UNIQUE (meter_id, recorded_at)
);

-- 3. Energy Daily Aggregates Table - Pre-aggregated daily totals
CREATE TABLE public.energy_daily_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id UUID NOT NULL REFERENCES public.energy_meters(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Aggregated values
  total_consumption NUMERIC NOT NULL DEFAULT 0,
  peak_demand_kw NUMERIC,
  avg_demand_kw NUMERIC,
  min_demand_kw NUMERIC,
  
  -- Environmental averages
  avg_outside_temp_f NUMERIC,
  cooling_degree_days NUMERIC,
  heating_degree_days NUMERIC,
  
  -- Cost calculations
  energy_cost NUMERIC,
  demand_cost NUMERIC,
  total_cost NUMERIC,
  
  -- Reading stats
  reading_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_meter_date UNIQUE (meter_id, date)
);

-- =============================================
-- Indexes for Performance
-- =============================================

CREATE INDEX idx_energy_meters_org ON public.energy_meters(organization_id);
CREATE INDEX idx_energy_meters_project ON public.energy_meters(project_id);
CREATE INDEX idx_energy_meters_system_type ON public.energy_meters(system_type);
CREATE INDEX idx_energy_readings_meter_time ON public.energy_readings(meter_id, recorded_at DESC);
CREATE INDEX idx_energy_readings_recorded_at ON public.energy_readings(recorded_at DESC);
CREATE INDEX idx_energy_daily_meter_date ON public.energy_daily_aggregates(meter_id, date DESC);

-- =============================================
-- Row Level Security Policies
-- =============================================

ALTER TABLE public.energy_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_daily_aggregates ENABLE ROW LEVEL SECURITY;

-- energy_meters policies
CREATE POLICY "Users can view org energy meters"
  ON public.energy_meters FOR SELECT
  USING (organization_id = public.user_org_id());

CREATE POLICY "Users can insert org energy meters"
  ON public.energy_meters FOR INSERT
  WITH CHECK (organization_id = public.user_org_id());

CREATE POLICY "Users can update org energy meters"
  ON public.energy_meters FOR UPDATE
  USING (organization_id = public.user_org_id());

CREATE POLICY "Users can delete org energy meters"
  ON public.energy_meters FOR DELETE
  USING (organization_id = public.user_org_id());

-- energy_readings policies (via meter's org)
CREATE POLICY "Users can view readings for org meters"
  ON public.energy_readings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.energy_meters 
    WHERE energy_meters.id = energy_readings.meter_id 
    AND energy_meters.organization_id = public.user_org_id()
  ));

CREATE POLICY "Users can insert readings for org meters"
  ON public.energy_readings FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.energy_meters 
    WHERE energy_meters.id = energy_readings.meter_id 
    AND energy_meters.organization_id = public.user_org_id()
  ));

CREATE POLICY "Users can update readings for org meters"
  ON public.energy_readings FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.energy_meters 
    WHERE energy_meters.id = energy_readings.meter_id 
    AND energy_meters.organization_id = public.user_org_id()
  ));

CREATE POLICY "Users can delete readings for org meters"
  ON public.energy_readings FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.energy_meters 
    WHERE energy_meters.id = energy_readings.meter_id 
    AND energy_meters.organization_id = public.user_org_id()
  ));

-- energy_daily_aggregates policies (via meter's org)
CREATE POLICY "Users can view daily aggregates for org meters"
  ON public.energy_daily_aggregates FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.energy_meters 
    WHERE energy_meters.id = energy_daily_aggregates.meter_id 
    AND energy_meters.organization_id = public.user_org_id()
  ));

CREATE POLICY "Users can manage daily aggregates for org meters"
  ON public.energy_daily_aggregates FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.energy_meters 
    WHERE energy_meters.id = energy_daily_aggregates.meter_id 
    AND energy_meters.organization_id = public.user_org_id()
  ));

-- =============================================
-- Triggers for updated_at
-- =============================================

CREATE TRIGGER update_energy_meters_updated_at
  BEFORE UPDATE ON public.energy_meters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_energy_daily_aggregates_updated_at
  BEFORE UPDATE ON public.energy_daily_aggregates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();