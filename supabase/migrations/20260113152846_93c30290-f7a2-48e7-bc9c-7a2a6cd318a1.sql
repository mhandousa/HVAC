-- Create equipment health scores table
CREATE TABLE public.equipment_health_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
  reliability_score INTEGER CHECK (reliability_score >= 0 AND reliability_score <= 100),
  efficiency_score INTEGER CHECK (efficiency_score >= 0 AND efficiency_score <= 100),
  condition_score INTEGER CHECK (condition_score >= 0 AND condition_score <= 100),
  trend TEXT CHECK (trend IN ('improving', 'stable', 'declining')),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  predicted_maintenance_date DATE,
  maintenance_urgency TEXT CHECK (maintenance_urgency IN ('none', 'routine', 'soon', 'urgent', 'immediate')),
  analysis_factors JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '[]',
  sensor_data_summary JSONB DEFAULT '{}',
  last_analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(equipment_id)
);

-- Enable RLS
ALTER TABLE public.equipment_health_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view health scores in their organization"
  ON public.equipment_health_scores
  FOR SELECT
  USING (organization_id = public.user_org_id());

CREATE POLICY "Users can insert health scores in their organization"
  ON public.equipment_health_scores
  FOR INSERT
  WITH CHECK (organization_id = public.user_org_id());

CREATE POLICY "Users can update health scores in their organization"
  ON public.equipment_health_scores
  FOR UPDATE
  USING (organization_id = public.user_org_id());

CREATE POLICY "Users can delete health scores in their organization"
  ON public.equipment_health_scores
  FOR DELETE
  USING (organization_id = public.user_org_id());

-- Trigger for updated_at
CREATE TRIGGER update_equipment_health_scores_updated_at
  BEFORE UPDATE ON public.equipment_health_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_equipment_health_scores_equipment_id ON public.equipment_health_scores(equipment_id);
CREATE INDEX idx_equipment_health_scores_organization_id ON public.equipment_health_scores(organization_id);
CREATE INDEX idx_equipment_health_scores_risk_level ON public.equipment_health_scores(risk_level);
CREATE INDEX idx_equipment_health_scores_overall_score ON public.equipment_health_scores(overall_score);