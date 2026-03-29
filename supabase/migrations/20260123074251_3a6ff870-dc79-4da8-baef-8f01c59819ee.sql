-- Design Revision History System
-- Tracks all changes to design calculations with user attribution and rollback capability

-- Create design_revisions table
CREATE TABLE public.design_revisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'load_calculation', 'equipment_selection', 'duct_system', etc.
  entity_id UUID NOT NULL, -- ID of the entity being tracked
  revision_number INTEGER NOT NULL DEFAULT 1,
  previous_data JSONB, -- Snapshot of data before change
  current_data JSONB NOT NULL, -- Snapshot of data after change
  changes JSONB, -- Diff of what specifically changed
  change_type TEXT NOT NULL DEFAULT 'update', -- 'create', 'update', 'delete'
  change_summary TEXT, -- Human-readable summary
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  comment TEXT, -- User-provided comment about the change
  
  CONSTRAINT unique_entity_revision UNIQUE (entity_id, revision_number)
);

-- Create design_templates table
CREATE TABLE public.design_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL, -- 'project', 'zone', 'equipment', 'ahu', 'duct_system', etc.
  template_data JSONB NOT NULL, -- Serialized design settings
  is_public BOOLEAN NOT NULL DEFAULT false, -- Available to all organizations
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.design_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for design_revisions
CREATE POLICY "Users can view revisions for their organization projects"
  ON public.design_revisions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create revisions for their organization projects"
  ON public.design_revisions
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for design_templates
CREATE POLICY "Users can view templates for their organization or public templates"
  ON public.design_templates
  FOR SELECT
  USING (
    is_public = true OR
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create templates for their organization"
  ON public.design_templates
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update templates for their organization"
  ON public.design_templates
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete templates they created"
  ON public.design_templates
  FOR DELETE
  USING (
    created_by = auth.uid()
  );

-- Create indexes for performance
CREATE INDEX idx_design_revisions_project ON public.design_revisions(project_id);
CREATE INDEX idx_design_revisions_entity ON public.design_revisions(entity_type, entity_id);
CREATE INDEX idx_design_revisions_created_at ON public.design_revisions(created_at DESC);
CREATE INDEX idx_design_templates_org ON public.design_templates(organization_id);
CREATE INDEX idx_design_templates_type ON public.design_templates(template_type);

-- Trigger to update template updated_at
CREATE TRIGGER update_design_templates_updated_at
  BEFORE UPDATE ON public.design_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();