-- Create technician_skills table for tracking technician expertise
CREATE TABLE public.technician_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  skill_type TEXT NOT NULL CHECK (skill_type IN ('deficiency_category', 'equipment_type')),
  skill_id TEXT NOT NULL,
  proficiency_level TEXT NOT NULL DEFAULT 'intermediate' 
    CHECK (proficiency_level IN ('basic', 'intermediate', 'advanced', 'expert')),
  certified_at TIMESTAMP WITH TIME ZONE,
  certification_expiry TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(technician_id, skill_type, skill_id)
);

-- Enable RLS
ALTER TABLE public.technician_skills ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view skills in their organization"
  ON public.technician_skills FOR SELECT
  USING (organization_id = user_org_id());

CREATE POLICY "Users can insert skills in their organization"
  ON public.technician_skills FOR INSERT
  WITH CHECK (organization_id = user_org_id());

CREATE POLICY "Users can update skills in their organization"
  ON public.technician_skills FOR UPDATE
  USING (organization_id = user_org_id());

CREATE POLICY "Users can delete skills in their organization"
  ON public.technician_skills FOR DELETE
  USING (organization_id = user_org_id());

-- Create updated_at trigger
CREATE TRIGGER update_technician_skills_updated_at
  BEFORE UPDATE ON public.technician_skills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();