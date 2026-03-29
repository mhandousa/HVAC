-- Sequence of Operations Documents
CREATE TABLE public.sequence_of_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  system_type TEXT NOT NULL CHECK (system_type IN ('ahu', 'chiller_plant', 'vrf', 'fcu', 'split_package', 'cooling_tower', 'boiler')),
  equipment_ids UUID[] DEFAULT '{}',
  zone_ids UUID[] DEFAULT '{}',
  operating_mode TEXT DEFAULT 'cooling_only' CHECK (operating_mode IN ('cooling_only', 'heating_only', 'cooling_heating', 'economizer', 'heat_recovery')),
  control_strategy JSONB DEFAULT '{}',
  generated_sequence JSONB DEFAULT '{}',
  custom_sections JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'superseded')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SOO Templates (system and custom)
CREATE TABLE public.soo_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  system_type TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_content JSONB NOT NULL DEFAULT '{}',
  is_system_template BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sequence_of_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soo_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sequence_of_operations
CREATE POLICY "Users can view their organization's SOO documents"
ON public.sequence_of_operations
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can create SOO documents for their organization"
ON public.sequence_of_operations
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update their organization's SOO documents"
ON public.sequence_of_operations
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete their organization's SOO documents"
ON public.sequence_of_operations
FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- RLS Policies for soo_templates
CREATE POLICY "Users can view system templates and their organization's templates"
ON public.soo_templates
FOR SELECT
USING (
  is_system_template = true OR
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can create templates for their organization"
ON public.soo_templates
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update their organization's templates"
ON public.soo_templates
FOR UPDATE
USING (
  is_system_template = false AND
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete their organization's templates"
ON public.soo_templates
FOR DELETE
USING (
  is_system_template = false AND
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Indexes for performance
CREATE INDEX idx_soo_organization ON public.sequence_of_operations(organization_id);
CREATE INDEX idx_soo_project ON public.sequence_of_operations(project_id);
CREATE INDEX idx_soo_system_type ON public.sequence_of_operations(system_type);
CREATE INDEX idx_soo_status ON public.sequence_of_operations(status);
CREATE INDEX idx_soo_templates_system_type ON public.soo_templates(system_type);

-- Trigger for updated_at
CREATE TRIGGER update_sequence_of_operations_updated_at
BEFORE UPDATE ON public.sequence_of_operations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_soo_templates_updated_at
BEFORE UPDATE ON public.soo_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();