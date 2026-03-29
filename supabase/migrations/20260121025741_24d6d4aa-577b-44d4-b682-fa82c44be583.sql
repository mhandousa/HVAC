-- Create acoustic_calculations table for storing acoustic analysis results
CREATE TABLE acoustic_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  calculation_type TEXT NOT NULL CHECK (calculation_type IN (
    'noise_path', 'room_acoustics', 'silencer_sizing', 'vibration'
  )),
  name TEXT NOT NULL,
  
  -- Results
  calculated_nc INTEGER,
  target_nc INTEGER,
  meets_target BOOLEAN,
  
  -- Input/output storage as JSONB
  input_data JSONB DEFAULT '{}'::jsonb,
  results JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(user_id)
);

-- Enable RLS
ALTER TABLE acoustic_calculations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view acoustic calculations in their org"
  ON acoustic_calculations FOR SELECT
  USING (organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert acoustic calculations in their org"
  ON acoustic_calculations FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update acoustic calculations in their org"
  ON acoustic_calculations FOR UPDATE
  USING (organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete acoustic calculations in their org"
  ON acoustic_calculations FOR DELETE
  USING (organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid()));

-- Updated at trigger
CREATE TRIGGER update_acoustic_calculations_updated_at
  BEFORE UPDATE ON acoustic_calculations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_acoustic_calculations_project ON acoustic_calculations(project_id);
CREATE INDEX idx_acoustic_calculations_zone ON acoustic_calculations(zone_id);
CREATE INDEX idx_acoustic_calculations_org ON acoustic_calculations(organization_id);
CREATE INDEX idx_acoustic_calculations_type ON acoustic_calculations(calculation_type);