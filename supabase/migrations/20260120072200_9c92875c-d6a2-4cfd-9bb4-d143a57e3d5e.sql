-- Create ASHRAE 90.1 Compliance Checks table for persistence
CREATE TABLE public.ashrae_90_1_compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  climate_zone TEXT NOT NULL,
  city_id TEXT,
  
  -- Summary scores
  overall_compliance_percent SMALLINT DEFAULT 0,
  equipment_checks_passed INTEGER DEFAULT 0,
  equipment_checks_total INTEGER DEFAULT 0,
  economizer_checks_passed INTEGER DEFAULT 0,
  economizer_checks_total INTEGER DEFAULT 0,
  fan_power_checks_passed INTEGER DEFAULT 0,
  fan_power_checks_total INTEGER DEFAULT 0,
  pump_power_checks_passed INTEGER DEFAULT 0,
  pump_power_checks_total INTEGER DEFAULT 0,
  mandatory_checks_passed INTEGER DEFAULT 0,
  mandatory_checks_total INTEGER DEFAULT 0,
  
  -- JSON blob for detailed results
  detailed_results JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ashrae_90_1_compliance_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their organization's ASHRAE compliance checks"
ON public.ashrae_90_1_compliance_checks FOR SELECT
USING (organization_id = public.user_org_id());

CREATE POLICY "Users can insert ASHRAE compliance checks for their organization"
ON public.ashrae_90_1_compliance_checks FOR INSERT
WITH CHECK (organization_id = public.user_org_id());

CREATE POLICY "Users can update their organization's ASHRAE compliance checks"
ON public.ashrae_90_1_compliance_checks FOR UPDATE
USING (organization_id = public.user_org_id());

CREATE POLICY "Users can delete their organization's ASHRAE compliance checks"
ON public.ashrae_90_1_compliance_checks FOR DELETE
USING (organization_id = public.user_org_id());

-- Index for fast lookups
CREATE INDEX idx_ashrae_compliance_project ON public.ashrae_90_1_compliance_checks(project_id);
CREATE INDEX idx_ashrae_compliance_org ON public.ashrae_90_1_compliance_checks(organization_id);

-- Add column to snapshots table
ALTER TABLE public.design_completeness_snapshots 
ADD COLUMN has_ashrae_90_1_compliance BOOLEAN DEFAULT false;

-- Trigger for updated_at
CREATE TRIGGER update_ashrae_90_1_compliance_checks_updated_at
BEFORE UPDATE ON public.ashrae_90_1_compliance_checks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();