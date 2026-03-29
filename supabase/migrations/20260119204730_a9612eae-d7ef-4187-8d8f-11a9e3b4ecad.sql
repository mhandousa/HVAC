-- Create deficiency_assignments table
CREATE TABLE public.deficiency_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_metadata_id UUID NOT NULL REFERENCES public.commissioning_photo_metadata(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES public.profiles(id),
  assigned_by UUID NOT NULL REFERENCES public.profiles(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  due_date DATE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('assigned', 'in_progress', 'resolved', 'overdue')) DEFAULT 'assigned',
  notes TEXT,
  notification_sent_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deficiency_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view assignments in their organization"
  ON public.deficiency_assignments
  FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create assignments in their organization"
  ON public.deficiency_assignments
  FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update assignments in their organization"
  ON public.deficiency_assignments
  FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete assignments in their organization"
  ON public.deficiency_assignments
  FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Create indexes
CREATE INDEX idx_deficiency_assignments_photo_metadata ON public.deficiency_assignments(photo_metadata_id);
CREATE INDEX idx_deficiency_assignments_assigned_to ON public.deficiency_assignments(assigned_to);
CREATE INDEX idx_deficiency_assignments_organization ON public.deficiency_assignments(organization_id);
CREATE INDEX idx_deficiency_assignments_status ON public.deficiency_assignments(status);
CREATE INDEX idx_deficiency_assignments_due_date ON public.deficiency_assignments(due_date);

-- Create trigger for updated_at
CREATE TRIGGER update_deficiency_assignments_updated_at
  BEFORE UPDATE ON public.deficiency_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();