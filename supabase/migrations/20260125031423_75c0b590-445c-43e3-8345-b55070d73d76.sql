-- Create project_stage_locks table for workflow stage locking
CREATE TABLE public.project_stage_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_id text NOT NULL,
  locked_at timestamptz NOT NULL DEFAULT now(),
  locked_by uuid REFERENCES public.profiles(user_id),
  unlock_requested_at timestamptz,
  unlock_requested_by uuid REFERENCES public.profiles(user_id),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, stage_id)
);

-- Create index for faster lookups
CREATE INDEX idx_project_stage_locks_project_id ON public.project_stage_locks(project_id);

-- Enable RLS
ALTER TABLE public.project_stage_locks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view stage locks in their org projects"
ON public.project_stage_locks
FOR SELECT
USING (
  project_id IN (
    SELECT p.id FROM projects p
    WHERE p.organization_id = user_org_id()
  )
);

CREATE POLICY "Users can create stage locks in their org projects"
ON public.project_stage_locks
FOR INSERT
WITH CHECK (
  project_id IN (
    SELECT p.id FROM projects p
    WHERE p.organization_id = user_org_id()
  )
);

CREATE POLICY "Users can update stage locks in their org projects"
ON public.project_stage_locks
FOR UPDATE
USING (
  project_id IN (
    SELECT p.id FROM projects p
    WHERE p.organization_id = user_org_id()
  )
);

CREATE POLICY "Admins can delete stage locks"
ON public.project_stage_locks
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_stage_locks.project_id
    AND p.organization_id = user_org_id()
    AND has_org_role(p.organization_id, 'admin')
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_project_stage_locks_updated_at
BEFORE UPDATE ON public.project_stage_locks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();