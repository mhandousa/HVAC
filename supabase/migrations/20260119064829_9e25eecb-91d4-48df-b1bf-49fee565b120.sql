-- Weather API caching table
CREATE TABLE public.weather_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city_name TEXT NOT NULL,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  temperature_c NUMERIC(5,2),
  humidity_percent NUMERIC(5,2),
  pressure_hpa NUMERIC(7,2),
  wind_speed_ms NUMERIC(5,2),
  weather_condition TEXT,
  weather_icon TEXT,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '15 minutes'),
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weather_cache ENABLE ROW LEVEL SECURITY;

-- Policy for organization access
CREATE POLICY "Users can view weather cache for their organization"
  ON public.weather_cache FOR SELECT
  USING (organization_id = public.user_org_id() OR organization_id IS NULL);

CREATE POLICY "Users can insert weather cache for their organization"
  ON public.weather_cache FOR INSERT
  WITH CHECK (organization_id = public.user_org_id() OR organization_id IS NULL);

-- Index for faster lookups
CREATE INDEX idx_weather_cache_city ON public.weather_cache(city_name);
CREATE INDEX idx_weather_cache_expires ON public.weather_cache(expires_at);

-- ERV runtime tracking table
CREATE TABLE public.erv_runtime_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.erv_maintenance_schedules(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  runtime_hours_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  runtime_since_filter NUMERIC(10,2) NOT NULL DEFAULT 0,
  last_reset_at TIMESTAMP WITH TIME ZONE,
  baseline_pressure_drop_pa NUMERIC(7,2),
  current_pressure_drop_pa NUMERIC(7,2),
  pressure_trend_slope NUMERIC(7,4),
  predicted_filter_life_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.erv_runtime_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ERV runtime for their organization"
  ON public.erv_runtime_tracking FOR SELECT
  USING (organization_id = public.user_org_id());

CREATE POLICY "Users can manage ERV runtime for their organization"
  ON public.erv_runtime_tracking FOR ALL
  USING (organization_id = public.user_org_id());

-- Commissioning projects table
CREATE TABLE public.commissioning_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'on_hold')),
  building_id UUID REFERENCES public.buildings(id),
  contractor_name TEXT,
  contractor_contact TEXT,
  start_date DATE,
  target_completion_date DATE,
  actual_completion_date DATE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.commissioning_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view commissioning projects for their organization"
  ON public.commissioning_projects FOR SELECT
  USING (organization_id = public.user_org_id());

CREATE POLICY "Users can manage commissioning projects for their organization"
  ON public.commissioning_projects FOR ALL
  USING (organization_id = public.user_org_id());

-- Commissioning checklists table
CREATE TABLE public.commissioning_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commissioning_project_id UUID NOT NULL REFERENCES public.commissioning_projects(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES public.equipment(id),
  equipment_tag TEXT,
  checklist_type TEXT NOT NULL CHECK (checklist_type IN ('erv', 'ahu', 'chiller', 'vav', 'fcu', 'pump', 'cooling_tower', 'boiler', 'vrf')),
  design_data JSONB,
  installed_data JSONB,
  variance_summary JSONB,
  overall_status TEXT NOT NULL DEFAULT 'pending' CHECK (overall_status IN ('pending', 'in_progress', 'passed', 'failed', 'na')),
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.commissioning_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view commissioning checklists via project"
  ON public.commissioning_checklists FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.commissioning_projects cp 
    WHERE cp.id = commissioning_project_id 
    AND cp.organization_id = public.user_org_id()
  ));

CREATE POLICY "Users can manage commissioning checklists via project"
  ON public.commissioning_checklists FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.commissioning_projects cp 
    WHERE cp.id = commissioning_project_id 
    AND cp.organization_id = public.user_org_id()
  ));

-- Commissioning tests table
CREATE TABLE public.commissioning_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES public.commissioning_checklists(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  test_category TEXT,
  expected_value TEXT,
  actual_value TEXT,
  tolerance_percent NUMERIC(5,2),
  variance_percent NUMERIC(5,2),
  result TEXT NOT NULL DEFAULT 'pending' CHECK (result IN ('pending', 'pass', 'fail', 'marginal', 'na')),
  test_date TIMESTAMP WITH TIME ZONE,
  technician_id UUID REFERENCES public.profiles(id),
  technician_name TEXT,
  notes TEXT,
  photos_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.commissioning_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view commissioning tests via checklist"
  ON public.commissioning_tests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.commissioning_checklists cc
    JOIN public.commissioning_projects cp ON cp.id = cc.commissioning_project_id
    WHERE cc.id = checklist_id 
    AND cp.organization_id = public.user_org_id()
  ));

CREATE POLICY "Users can manage commissioning tests via checklist"
  ON public.commissioning_tests FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.commissioning_checklists cc
    JOIN public.commissioning_projects cp ON cp.id = cc.commissioning_project_id
    WHERE cc.id = checklist_id 
    AND cp.organization_id = public.user_org_id()
  ));

-- Certification projects table
CREATE TABLE public.certification_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  certification_type TEXT NOT NULL CHECK (certification_type IN ('leed_v4', 'leed_v4.1', 'well_v2', 'estidama', 'mostadam')),
  target_level TEXT CHECK (target_level IN ('certified', 'silver', 'gold', 'platinum', 'pearl_1', 'pearl_2', 'pearl_3', 'pearl_4', 'pearl_5')),
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'in_progress', 'submitted', 'achieved', 'expired')),
  registration_date DATE,
  target_certification_date DATE,
  achieved_date DATE,
  current_ieq_score NUMERIC(5,2),
  target_ieq_score NUMERIC(5,2),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.certification_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view certification projects for their organization"
  ON public.certification_projects FOR SELECT
  USING (organization_id = public.user_org_id());

CREATE POLICY "Users can manage certification projects for their organization"
  ON public.certification_projects FOR ALL
  USING (organization_id = public.user_org_id());

-- Certification credits table
CREATE TABLE public.certification_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certification_project_id UUID NOT NULL REFERENCES public.certification_projects(id) ON DELETE CASCADE,
  credit_id TEXT NOT NULL,
  credit_name TEXT NOT NULL,
  credit_category TEXT,
  max_points NUMERIC(5,2),
  target_points NUMERIC(5,2),
  achieved_points NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'not_pursuing' CHECK (status IN ('not_pursuing', 'pursuing', 'documented', 'achieved', 'denied')),
  compliance_percentage NUMERIC(5,2),
  compliance_data JSONB,
  documentation_urls TEXT[],
  notes TEXT,
  last_assessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.certification_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view certification credits via project"
  ON public.certification_credits FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.certification_projects cp 
    WHERE cp.id = certification_project_id 
    AND cp.organization_id = public.user_org_id()
  ));

CREATE POLICY "Users can manage certification credits via project"
  ON public.certification_credits FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.certification_projects cp 
    WHERE cp.id = certification_project_id 
    AND cp.organization_id = public.user_org_id()
  ));

-- Certification readings log for compliance tracking
CREATE TABLE public.certification_readings_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certification_project_id UUID NOT NULL REFERENCES public.certification_projects(id) ON DELETE CASCADE,
  credit_id TEXT NOT NULL,
  parameter TEXT NOT NULL,
  zone_id UUID REFERENCES public.zones(id),
  zone_name TEXT,
  reading_value NUMERIC(10,4),
  threshold_value NUMERIC(10,4),
  unit TEXT,
  is_compliant BOOLEAN,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.certification_readings_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view certification readings via project"
  ON public.certification_readings_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.certification_projects cp 
    WHERE cp.id = certification_project_id 
    AND cp.organization_id = public.user_org_id()
  ));

CREATE POLICY "Users can insert certification readings via project"
  ON public.certification_readings_log FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.certification_projects cp 
    WHERE cp.id = certification_project_id 
    AND cp.organization_id = public.user_org_id()
  ));

-- Index for faster readings queries
CREATE INDEX idx_certification_readings_project ON public.certification_readings_log(certification_project_id, credit_id);
CREATE INDEX idx_certification_readings_time ON public.certification_readings_log(recorded_at DESC);

-- Triggers for updated_at
CREATE TRIGGER update_erv_runtime_tracking_updated_at
  BEFORE UPDATE ON public.erv_runtime_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commissioning_projects_updated_at
  BEFORE UPDATE ON public.commissioning_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commissioning_checklists_updated_at
  BEFORE UPDATE ON public.commissioning_checklists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_certification_projects_updated_at
  BEFORE UPDATE ON public.certification_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_certification_credits_updated_at
  BEFORE UPDATE ON public.certification_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();