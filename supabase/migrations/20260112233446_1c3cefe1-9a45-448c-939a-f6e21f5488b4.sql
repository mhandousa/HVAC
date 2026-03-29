-- Create pump curves table for storing pump performance data
CREATE TABLE public.pump_curves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  pump_type TEXT DEFAULT 'centrifugal',
  impeller_diameter_in NUMERIC,
  rpm INTEGER DEFAULT 1750,
  curve_data JSONB NOT NULL DEFAULT '[]',
  motor_hp NUMERIC,
  npsh_required JSONB DEFAULT '[]',
  min_flow_gpm NUMERIC,
  max_flow_gpm NUMERIC,
  max_head_ft NUMERIC,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.pump_curves ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view pump curves in their organization"
ON public.pump_curves
FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create pump curves in their organization"
ON public.pump_curves
FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update pump curves in their organization"
ON public.pump_curves
FOR UPDATE
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete pump curves in their organization"
ON public.pump_curves
FOR DELETE
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

-- Create index for faster lookups
CREATE INDEX idx_pump_curves_organization ON public.pump_curves(organization_id);
CREATE INDEX idx_pump_curves_manufacturer ON public.pump_curves(manufacturer);

-- Create trigger for updated_at
CREATE TRIGGER update_pump_curves_updated_at
BEFORE UPDATE ON public.pump_curves
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample pump curves for common HVAC applications
INSERT INTO public.pump_curves (organization_id, manufacturer, model, pump_type, motor_hp, rpm, min_flow_gpm, max_flow_gpm, max_head_ft, curve_data) 
SELECT 
  id as organization_id,
  'Bell & Gossett' as manufacturer,
  'Series 1510-2.5AA' as model,
  'centrifugal' as pump_type,
  3 as motor_hp,
  1750 as rpm,
  0 as min_flow_gpm,
  120 as max_flow_gpm,
  45 as max_head_ft,
  '[{"flow":0,"head":45,"efficiency":0,"power":0.5},{"flow":20,"head":44,"efficiency":35,"power":0.8},{"flow":40,"head":42,"efficiency":55,"power":1.1},{"flow":60,"head":38,"efficiency":68,"power":1.4},{"flow":80,"head":32,"efficiency":72,"power":1.7},{"flow":100,"head":24,"efficiency":65,"power":1.9},{"flow":120,"head":14,"efficiency":45,"power":2.1}]'::jsonb
FROM public.organizations
LIMIT 1;