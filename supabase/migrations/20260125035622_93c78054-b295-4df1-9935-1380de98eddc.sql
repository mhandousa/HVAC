-- Create workflow_templates table for building-type-specific workflow configurations
CREATE TABLE public.workflow_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id),
  name text NOT NULL,
  description text,
  building_type text NOT NULL,
  stage_config jsonb NOT NULL DEFAULT '{}',
  required_stages text[] NOT NULL DEFAULT '{}',
  optional_stages text[] NOT NULL DEFAULT '{}',
  typical_durations jsonb,
  is_system_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their org templates and system defaults
CREATE POLICY "Users can view org templates and system defaults"
  ON public.workflow_templates FOR SELECT
  USING (organization_id = user_org_id() OR is_system_default = true);

-- Policy: Users can create org templates
CREATE POLICY "Users can create org templates"
  ON public.workflow_templates FOR INSERT
  WITH CHECK (organization_id = user_org_id());

-- Policy: Users can update org templates (not system defaults)
CREATE POLICY "Users can update org templates"
  ON public.workflow_templates FOR UPDATE
  USING (organization_id = user_org_id() AND is_system_default = false);

-- Policy: Admins can delete org templates (not system defaults)
CREATE POLICY "Admins can delete org templates"
  ON public.workflow_templates FOR DELETE
  USING (has_org_role(organization_id, 'admin') AND is_system_default = false);

-- Create updated_at trigger
CREATE TRIGGER update_workflow_templates_updated_at
  BEFORE UPDATE ON public.workflow_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert 5 system default templates
INSERT INTO public.workflow_templates (name, description, building_type, required_stages, optional_stages, is_system_default, stage_config)
VALUES 
  (
    'Commercial Office',
    'Standard workflow for commercial office buildings with typical HVAC requirements',
    'office',
    ARRAY['load', 'ventilation', 'equipment', 'distribution', 'compliance'],
    ARRAY['psychrometric', 'erv', 'plant'],
    true,
    '{"load": {"priority": 1}, "ventilation": {"priority": 2}, "equipment": {"priority": 3}, "distribution": {"priority": 4}, "compliance": {"priority": 5}}'::jsonb
  ),
  (
    'Healthcare Facility',
    'Comprehensive workflow for hospitals and medical facilities with strict IAQ and redundancy requirements',
    'hospital',
    ARRAY['load', 'ventilation', 'psychrometric', 'equipment', 'distribution', 'erv', 'compliance'],
    ARRAY['acoustic', 'plant'],
    true,
    '{"load": {"priority": 1}, "ventilation": {"priority": 2, "notes": "Critical for infection control"}, "psychrometric": {"priority": 3}, "equipment": {"priority": 4}, "distribution": {"priority": 5}, "erv": {"priority": 6}, "compliance": {"priority": 7}}'::jsonb
  ),
  (
    'Retail Store',
    'Simplified workflow for retail environments with focus on cooling capacity and efficiency',
    'retail',
    ARRAY['load', 'equipment', 'distribution', 'compliance'],
    ARRAY['ventilation', 'erv'],
    true,
    '{"load": {"priority": 1}, "equipment": {"priority": 2}, "distribution": {"priority": 3}, "compliance": {"priority": 4}}'::jsonb
  ),
  (
    'Industrial Warehouse',
    'Basic workflow for warehouse and industrial spaces with minimal HVAC requirements',
    'warehouse',
    ARRAY['load', 'equipment', 'distribution'],
    ARRAY['ventilation', 'compliance'],
    true,
    '{"load": {"priority": 1}, "equipment": {"priority": 2}, "distribution": {"priority": 3}}'::jsonb
  ),
  (
    'Residential Tower',
    'Full workflow for high-rise residential buildings with individual unit conditioning',
    'residential',
    ARRAY['load', 'ventilation', 'equipment', 'distribution', 'compliance'],
    ARRAY['erv', 'acoustic'],
    true,
    '{"load": {"priority": 1}, "ventilation": {"priority": 2}, "equipment": {"priority": 3}, "distribution": {"priority": 4}, "compliance": {"priority": 5}}'::jsonb
  );