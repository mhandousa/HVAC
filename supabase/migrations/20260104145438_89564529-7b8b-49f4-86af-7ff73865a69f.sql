-- Create project_design_data table for storing additional design data (psychrometric, pipe sizing, etc.)
CREATE TABLE public.project_design_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  data_type VARCHAR(50) NOT NULL, -- 'psychrometric', 'pipe_sizing', 'pressure_drop'
  name VARCHAR(255) NOT NULL,
  input_data JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_project_design_data_project ON project_design_data(project_id);
CREATE INDEX idx_project_design_data_org ON project_design_data(organization_id);
CREATE INDEX idx_project_design_data_type ON project_design_data(data_type);

-- Enable RLS
ALTER TABLE project_design_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view project design data in their org"
ON project_design_data FOR SELECT
USING (organization_id = user_org_id());

CREATE POLICY "Engineers+ can create project design data"
ON project_design_data FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM profiles
  WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')
));

CREATE POLICY "Engineers+ can update project design data"
ON project_design_data FOR UPDATE
USING (organization_id IN (
  SELECT organization_id FROM profiles
  WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')
));

CREATE POLICY "Admins can delete project design data"
ON project_design_data FOR DELETE
USING (organization_id IN (
  SELECT organization_id FROM profiles
  WHERE user_id = auth.uid() AND role = 'admin'
));