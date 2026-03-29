-- Create preventive maintenance schedules table
CREATE TABLE public.pm_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  frequency_type TEXT NOT NULL DEFAULT 'monthly', -- daily, weekly, monthly, quarterly, yearly
  frequency_value INTEGER NOT NULL DEFAULT 1,
  last_completed_at TIMESTAMP WITH TIME ZONE,
  next_due_at DATE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  estimated_hours NUMERIC(4,1),
  priority TEXT NOT NULL DEFAULT 'medium',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pm_schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view PM schedules in their org"
ON public.pm_schedules
FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Engineers+ can create PM schedules"
ON public.pm_schedules
FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'engineer')
));

CREATE POLICY "Engineers+ can update PM schedules"
ON public.pm_schedules
FOR UPDATE
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'engineer')
));

CREATE POLICY "Admins can delete PM schedules"
ON public.pm_schedules
FOR DELETE
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'admin'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pm_schedules_updated_at
BEFORE UPDATE ON public.pm_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes
CREATE INDEX idx_pm_schedules_org ON public.pm_schedules(organization_id);
CREATE INDEX idx_pm_schedules_equipment ON public.pm_schedules(equipment_id);
CREATE INDEX idx_pm_schedules_next_due ON public.pm_schedules(next_due_at) WHERE is_active = true;