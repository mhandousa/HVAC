-- Create project_stage_milestones table for tracking planned vs actual timeline
CREATE TABLE public.project_stage_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  stage_id TEXT NOT NULL, -- 'load', 'ventilation', 'psychrometric', etc.
  planned_start_date DATE,
  planned_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  estimated_duration_days INTEGER DEFAULT 5,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, stage_id)
);

-- Enable RLS
ALTER TABLE public.project_stage_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies using organization_id
CREATE POLICY "Users can view their org project milestones"
  ON public.project_stage_milestones FOR SELECT
  USING (organization_id = user_org_id());

CREATE POLICY "Users can insert project milestones for their org"
  ON public.project_stage_milestones FOR INSERT
  WITH CHECK (organization_id = user_org_id());

CREATE POLICY "Users can update their org project milestones"
  ON public.project_stage_milestones FOR UPDATE
  USING (organization_id = user_org_id());

CREATE POLICY "Users can delete their org project milestones"
  ON public.project_stage_milestones FOR DELETE
  USING (organization_id = user_org_id());

-- Add updated_at trigger
CREATE TRIGGER update_project_stage_milestones_updated_at
  BEFORE UPDATE ON public.project_stage_milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_project_stage_milestones_project ON public.project_stage_milestones(project_id);
CREATE INDEX idx_project_stage_milestones_org ON public.project_stage_milestones(organization_id);