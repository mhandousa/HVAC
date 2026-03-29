-- Create design_alternatives table for persistent design option snapshots
CREATE TABLE public.design_alternatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  name text NOT NULL,
  description text,
  data jsonb NOT NULL DEFAULT '{}',
  is_primary boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  created_by uuid REFERENCES public.profiles(user_id),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_design_alternatives_project ON public.design_alternatives(project_id);
CREATE INDEX idx_design_alternatives_entity ON public.design_alternatives(entity_type, entity_id);
CREATE INDEX idx_design_alternatives_org ON public.design_alternatives(organization_id);

-- Enable RLS
ALTER TABLE public.design_alternatives ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view alternatives in their organization"
  ON public.design_alternatives FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create alternatives in their organization"
  ON public.design_alternatives FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update alternatives in their organization"
  ON public.design_alternatives FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete alternatives in their organization"
  ON public.design_alternatives FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER update_design_alternatives_updated_at
  BEFORE UPDATE ON public.design_alternatives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();