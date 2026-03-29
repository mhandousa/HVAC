-- Phase 18: New equipment selection tables for design completeness tracking

-- Silencer selections table (zone-level)
CREATE TABLE public.silencer_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES public.zones(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  silencer_model TEXT,
  manufacturer TEXT,
  attenuation_required_db NUMERIC,
  duct_size TEXT,
  pressure_drop_in_wg NUMERIC,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vibration isolation selections table (zone-level)
CREATE TABLE public.vibration_isolation_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES public.zones(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  equipment_type TEXT,
  equipment_weight_lbs NUMERIC,
  operating_rpm NUMERIC,
  isolator_type TEXT,
  deflection_inches NUMERIC,
  efficiency_percent NUMERIC,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Economizer selections table (project-level)
CREATE TABLE public.economizer_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ahu_id UUID REFERENCES public.ahu_configurations(id) ON DELETE SET NULL,
  economizer_type TEXT,
  design_cfm NUMERIC,
  min_oa_cfm NUMERIC,
  changeover_temp_f NUMERIC,
  energy_savings_kwh NUMERIC,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Control valve selections table (project-level)
CREATE TABLE public.control_valve_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pipe_system_id UUID REFERENCES public.pipe_systems(id) ON DELETE SET NULL,
  valve_type TEXT,
  size_inches NUMERIC,
  cv_required NUMERIC,
  cv_selected NUMERIC,
  valve_authority NUMERIC,
  pressure_drop_psi NUMERIC,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Expansion tank selections table (project-level)
CREATE TABLE public.expansion_tank_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  system_type TEXT,
  system_volume_gallons NUMERIC,
  tank_size_gallons NUMERIC,
  acceptance_volume_gallons NUMERIC,
  pre_charge_psi NUMERIC,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.silencer_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibration_isolation_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economizer_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_valve_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expansion_tank_selections ENABLE ROW LEVEL SECURITY;

-- RLS policies for silencer_selections
CREATE POLICY "Users can view silencer selections in their org"
ON public.silencer_selections FOR SELECT
USING (organization_id = public.user_org_id());

CREATE POLICY "Users can insert silencer selections in their org"
ON public.silencer_selections FOR INSERT
WITH CHECK (organization_id = public.user_org_id());

CREATE POLICY "Users can update silencer selections in their org"
ON public.silencer_selections FOR UPDATE
USING (organization_id = public.user_org_id());

CREATE POLICY "Users can delete silencer selections in their org"
ON public.silencer_selections FOR DELETE
USING (organization_id = public.user_org_id());

-- RLS policies for vibration_isolation_selections
CREATE POLICY "Users can view vibration isolation selections in their org"
ON public.vibration_isolation_selections FOR SELECT
USING (organization_id = public.user_org_id());

CREATE POLICY "Users can insert vibration isolation selections in their org"
ON public.vibration_isolation_selections FOR INSERT
WITH CHECK (organization_id = public.user_org_id());

CREATE POLICY "Users can update vibration isolation selections in their org"
ON public.vibration_isolation_selections FOR UPDATE
USING (organization_id = public.user_org_id());

CREATE POLICY "Users can delete vibration isolation selections in their org"
ON public.vibration_isolation_selections FOR DELETE
USING (organization_id = public.user_org_id());

-- RLS policies for economizer_selections
CREATE POLICY "Users can view economizer selections in their org"
ON public.economizer_selections FOR SELECT
USING (organization_id = public.user_org_id());

CREATE POLICY "Users can insert economizer selections in their org"
ON public.economizer_selections FOR INSERT
WITH CHECK (organization_id = public.user_org_id());

CREATE POLICY "Users can update economizer selections in their org"
ON public.economizer_selections FOR UPDATE
USING (organization_id = public.user_org_id());

CREATE POLICY "Users can delete economizer selections in their org"
ON public.economizer_selections FOR DELETE
USING (organization_id = public.user_org_id());

-- RLS policies for control_valve_selections
CREATE POLICY "Users can view control valve selections in their org"
ON public.control_valve_selections FOR SELECT
USING (organization_id = public.user_org_id());

CREATE POLICY "Users can insert control valve selections in their org"
ON public.control_valve_selections FOR INSERT
WITH CHECK (organization_id = public.user_org_id());

CREATE POLICY "Users can update control valve selections in their org"
ON public.control_valve_selections FOR UPDATE
USING (organization_id = public.user_org_id());

CREATE POLICY "Users can delete control valve selections in their org"
ON public.control_valve_selections FOR DELETE
USING (organization_id = public.user_org_id());

-- RLS policies for expansion_tank_selections
CREATE POLICY "Users can view expansion tank selections in their org"
ON public.expansion_tank_selections FOR SELECT
USING (organization_id = public.user_org_id());

CREATE POLICY "Users can insert expansion tank selections in their org"
ON public.expansion_tank_selections FOR INSERT
WITH CHECK (organization_id = public.user_org_id());

CREATE POLICY "Users can update expansion tank selections in their org"
ON public.expansion_tank_selections FOR UPDATE
USING (organization_id = public.user_org_id());

CREATE POLICY "Users can delete expansion tank selections in their org"
ON public.expansion_tank_selections FOR DELETE
USING (organization_id = public.user_org_id());

-- Add update triggers for updated_at
CREATE TRIGGER update_silencer_selections_updated_at
BEFORE UPDATE ON public.silencer_selections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vibration_isolation_selections_updated_at
BEFORE UPDATE ON public.vibration_isolation_selections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_economizer_selections_updated_at
BEFORE UPDATE ON public.economizer_selections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_control_valve_selections_updated_at
BEFORE UPDATE ON public.control_valve_selections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expansion_tank_selections_updated_at
BEFORE UPDATE ON public.expansion_tank_selections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();