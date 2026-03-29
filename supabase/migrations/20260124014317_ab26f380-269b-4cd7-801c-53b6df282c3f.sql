-- Create design_approvals table for formal review workflow
CREATE TABLE public.design_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  revision_id uuid REFERENCES public.design_revisions(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft',
  submitted_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  submitted_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_comments text,
  priority text DEFAULT 'normal',
  due_date date,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'revision_requested')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- Create index for common queries
CREATE INDEX idx_design_approvals_project ON public.design_approvals(project_id);
CREATE INDEX idx_design_approvals_status ON public.design_approvals(status);
CREATE INDEX idx_design_approvals_entity ON public.design_approvals(entity_type, entity_id);
CREATE INDEX idx_design_approvals_org ON public.design_approvals(organization_id);

-- Enable RLS
ALTER TABLE public.design_approvals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view approvals in their organization
CREATE POLICY "Users can view org approvals" ON public.design_approvals
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- Policy: Users can create approvals in their organization
CREATE POLICY "Users can create approvals" ON public.design_approvals
  FOR INSERT WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- Policy: Users can update approvals in their organization
CREATE POLICY "Users can update approvals" ON public.design_approvals
  FOR UPDATE USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- Policy: Users can delete approvals they submitted
CREATE POLICY "Users can delete own approvals" ON public.design_approvals
  FOR DELETE USING (submitted_by = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_design_approvals_updated_at
  BEFORE UPDATE ON public.design_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();