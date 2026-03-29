-- Create equipment_schedules table for storing saved schedule configurations
CREATE TABLE public.equipment_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  schedule_type TEXT DEFAULT 'mechanical',
  equipment_ids UUID[] DEFAULT '{}',
  grouping_mode TEXT DEFAULT 'by_building',
  columns_config JSONB DEFAULT '[]',
  custom_header JSONB DEFAULT '{}',
  notes TEXT,
  status TEXT DEFAULT 'draft',
  revision TEXT DEFAULT 'A',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.equipment_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view schedules in their organization"
ON public.equipment_schedules
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can create schedules in their organization"
ON public.equipment_schedules
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update schedules in their organization"
ON public.equipment_schedules
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete schedules in their organization"
ON public.equipment_schedules
FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_equipment_schedules_updated_at
BEFORE UPDATE ON public.equipment_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();