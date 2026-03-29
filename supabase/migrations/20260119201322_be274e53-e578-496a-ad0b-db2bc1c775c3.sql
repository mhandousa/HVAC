-- Photo metadata with deficiency tags for commissioning photos
CREATE TABLE public.commissioning_photo_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.commissioning_tests(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  deficiency_tags TEXT[] DEFAULT '{}',
  deficiency_severity TEXT CHECK (deficiency_severity IN ('minor', 'major', 'critical')),
  description TEXT,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  is_before_photo BOOLEAN DEFAULT FALSE,
  related_after_photo_url TEXT,
  remediation_notes TEXT,
  remediation_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient tag filtering
CREATE INDEX idx_photo_metadata_tags ON public.commissioning_photo_metadata USING GIN (deficiency_tags);
CREATE INDEX idx_photo_metadata_test_id ON public.commissioning_photo_metadata(test_id);
CREATE INDEX idx_photo_metadata_severity ON public.commissioning_photo_metadata(deficiency_severity);

-- Enable RLS
ALTER TABLE public.commissioning_photo_metadata ENABLE ROW LEVEL SECURITY;

-- RLS policies - allow access based on test's checklist's project's organization
CREATE POLICY "Users can view photo metadata for their organization"
ON public.commissioning_photo_metadata
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.commissioning_tests ct
    JOIN public.commissioning_checklists cc ON ct.checklist_id = cc.id
    JOIN public.commissioning_projects cp ON cc.commissioning_project_id = cp.id
    JOIN public.profiles p ON p.organization_id = cp.organization_id
    WHERE ct.id = commissioning_photo_metadata.test_id
    AND p.id = auth.uid()
  )
);

CREATE POLICY "Users can insert photo metadata for their organization"
ON public.commissioning_photo_metadata
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.commissioning_tests ct
    JOIN public.commissioning_checklists cc ON ct.checklist_id = cc.id
    JOIN public.commissioning_projects cp ON cc.commissioning_project_id = cp.id
    JOIN public.profiles p ON p.organization_id = cp.organization_id
    WHERE ct.id = commissioning_photo_metadata.test_id
    AND p.id = auth.uid()
  )
);

CREATE POLICY "Users can update photo metadata for their organization"
ON public.commissioning_photo_metadata
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.commissioning_tests ct
    JOIN public.commissioning_checklists cc ON ct.checklist_id = cc.id
    JOIN public.commissioning_projects cp ON cc.commissioning_project_id = cp.id
    JOIN public.profiles p ON p.organization_id = cp.organization_id
    WHERE ct.id = commissioning_photo_metadata.test_id
    AND p.id = auth.uid()
  )
);

CREATE POLICY "Users can delete photo metadata for their organization"
ON public.commissioning_photo_metadata
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.commissioning_tests ct
    JOIN public.commissioning_checklists cc ON ct.checklist_id = cc.id
    JOIN public.commissioning_projects cp ON cc.commissioning_project_id = cp.id
    JOIN public.profiles p ON p.organization_id = cp.organization_id
    WHERE ct.id = commissioning_photo_metadata.test_id
    AND p.id = auth.uid()
  )
);

-- Update timestamp trigger
CREATE TRIGGER update_commissioning_photo_metadata_updated_at
BEFORE UPDATE ON public.commissioning_photo_metadata
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();