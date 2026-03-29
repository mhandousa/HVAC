-- Create design_approval_comments table for comment threads
CREATE TABLE public.design_approval_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id uuid NOT NULL REFERENCES public.design_approvals(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES public.design_approval_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.design_approval_comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments on approvals in their organization
CREATE POLICY "Users can view comments on org approvals"
  ON public.design_approval_comments FOR SELECT
  USING (approval_id IN (
    SELECT id FROM public.design_approvals WHERE organization_id = user_org_id()
  ));

-- Users can create comments on approvals in their organization
CREATE POLICY "Users can create comments on org approvals"
  ON public.design_approval_comments FOR INSERT
  WITH CHECK (approval_id IN (
    SELECT id FROM public.design_approvals WHERE organization_id = user_org_id()
  ));

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON public.design_approval_comments FOR UPDATE
  USING (created_by = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON public.design_approval_comments FOR DELETE
  USING (created_by = auth.uid());

-- Add timestamp trigger
CREATE TRIGGER update_design_approval_comments_updated_at
  BEFORE UPDATE ON public.design_approval_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add sign-off fields to project_stage_locks
ALTER TABLE public.project_stage_locks 
  ADD COLUMN IF NOT EXISTS signed_off_at timestamptz,
  ADD COLUMN IF NOT EXISTS signed_off_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS sign_off_notes text;