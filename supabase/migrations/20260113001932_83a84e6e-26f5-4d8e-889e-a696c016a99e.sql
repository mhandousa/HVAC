-- Create fan_curves table for fan selection (parity with pump_curves)
CREATE TABLE public.fan_curves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  fan_type TEXT NOT NULL DEFAULT 'centrifugal',
  wheel_diameter_in NUMERIC,
  rpm INTEGER DEFAULT 1750,
  motor_hp NUMERIC,
  curve_data JSONB NOT NULL DEFAULT '[]',
  max_cfm NUMERIC,
  min_cfm NUMERIC,
  max_static_pressure NUMERIC,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comments
COMMENT ON TABLE public.fan_curves IS 'Stores fan performance curve data for fan selection';
COMMENT ON COLUMN public.fan_curves.curve_data IS 'Array of {cfm, staticPressure, bhp, efficiency} points';
COMMENT ON COLUMN public.fan_curves.fan_type IS 'Type: centrifugal, axial, mixed_flow, plug';

-- Enable RLS
ALTER TABLE public.fan_curves ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view fan curves in their organization" 
ON public.fan_curves 
FOR SELECT 
USING (
  organization_id IS NULL OR
  organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
);

CREATE POLICY "Users can insert fan curves in their organization" 
ON public.fan_curves 
FOR INSERT 
WITH CHECK (
  organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
);

CREATE POLICY "Users can update fan curves in their organization" 
ON public.fan_curves 
FOR UPDATE 
USING (
  organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
);

CREATE POLICY "Users can delete fan curves in their organization" 
ON public.fan_curves 
FOR DELETE 
USING (
  organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
);

-- Create trigger for updated_at
CREATE TRIGGER update_fan_curves_updated_at
BEFORE UPDATE ON public.fan_curves
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample fan curve data (generic fans without org_id for all users)
INSERT INTO public.fan_curves (manufacturer, model, fan_type, wheel_diameter_in, rpm, motor_hp, max_cfm, max_static_pressure, curve_data) VALUES
('Generic', 'FC-12-1750', 'centrifugal', 12, 1750, 1.5, 3000, 3.0, '[
  {"cfm": 0, "staticPressure": 3.0, "bhp": 0.5, "efficiency": 0},
  {"cfm": 500, "staticPressure": 2.9, "bhp": 0.6, "efficiency": 45},
  {"cfm": 1000, "staticPressure": 2.7, "bhp": 0.8, "efficiency": 62},
  {"cfm": 1500, "staticPressure": 2.4, "bhp": 1.0, "efficiency": 72},
  {"cfm": 2000, "staticPressure": 2.0, "bhp": 1.2, "efficiency": 78},
  {"cfm": 2500, "staticPressure": 1.4, "bhp": 1.4, "efficiency": 74},
  {"cfm": 3000, "staticPressure": 0.5, "bhp": 1.5, "efficiency": 55}
]'),
('Generic', 'FC-18-1750', 'centrifugal', 18, 1750, 5.0, 8000, 4.0, '[
  {"cfm": 0, "staticPressure": 4.0, "bhp": 1.5, "efficiency": 0},
  {"cfm": 1500, "staticPressure": 3.8, "bhp": 2.0, "efficiency": 52},
  {"cfm": 3000, "staticPressure": 3.5, "bhp": 2.8, "efficiency": 68},
  {"cfm": 4500, "staticPressure": 3.0, "bhp": 3.5, "efficiency": 76},
  {"cfm": 6000, "staticPressure": 2.2, "bhp": 4.2, "efficiency": 78},
  {"cfm": 7000, "staticPressure": 1.5, "bhp": 4.6, "efficiency": 72},
  {"cfm": 8000, "staticPressure": 0.6, "bhp": 5.0, "efficiency": 58}
]'),
('Generic', 'FC-24-1750', 'centrifugal', 24, 1750, 10.0, 15000, 5.0, '[
  {"cfm": 0, "staticPressure": 5.0, "bhp": 3.0, "efficiency": 0},
  {"cfm": 3000, "staticPressure": 4.8, "bhp": 4.0, "efficiency": 55},
  {"cfm": 6000, "staticPressure": 4.4, "bhp": 5.5, "efficiency": 70},
  {"cfm": 9000, "staticPressure": 3.8, "bhp": 7.0, "efficiency": 78},
  {"cfm": 12000, "staticPressure": 2.8, "bhp": 8.5, "efficiency": 80},
  {"cfm": 14000, "staticPressure": 1.8, "bhp": 9.5, "efficiency": 74},
  {"cfm": 15000, "staticPressure": 1.0, "bhp": 10.0, "efficiency": 62}
]'),
('Generic', 'AX-20-1750', 'axial', 20, 1750, 3.0, 10000, 1.5, '[
  {"cfm": 0, "staticPressure": 1.5, "bhp": 1.0, "efficiency": 0},
  {"cfm": 2000, "staticPressure": 1.4, "bhp": 1.3, "efficiency": 48},
  {"cfm": 4000, "staticPressure": 1.2, "bhp": 1.8, "efficiency": 62},
  {"cfm": 6000, "staticPressure": 0.95, "bhp": 2.2, "efficiency": 72},
  {"cfm": 8000, "staticPressure": 0.6, "bhp": 2.6, "efficiency": 75},
  {"cfm": 9000, "staticPressure": 0.35, "bhp": 2.8, "efficiency": 68},
  {"cfm": 10000, "staticPressure": 0.1, "bhp": 3.0, "efficiency": 45}
]'),
('Generic', 'PF-15-1750', 'plug', 15, 1750, 2.0, 5000, 2.5, '[
  {"cfm": 0, "staticPressure": 2.5, "bhp": 0.8, "efficiency": 0},
  {"cfm": 1000, "staticPressure": 2.4, "bhp": 1.0, "efficiency": 50},
  {"cfm": 2000, "staticPressure": 2.2, "bhp": 1.3, "efficiency": 68},
  {"cfm": 3000, "staticPressure": 1.8, "bhp": 1.6, "efficiency": 76},
  {"cfm": 4000, "staticPressure": 1.2, "bhp": 1.8, "efficiency": 74},
  {"cfm": 4500, "staticPressure": 0.8, "bhp": 1.9, "efficiency": 65},
  {"cfm": 5000, "staticPressure": 0.3, "bhp": 2.0, "efficiency": 48}
]');