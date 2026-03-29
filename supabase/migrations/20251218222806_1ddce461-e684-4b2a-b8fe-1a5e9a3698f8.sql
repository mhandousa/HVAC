-- Create work_orders table
CREATE TABLE public.work_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  equipment_tag TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view work orders in their org"
ON public.work_orders
FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Technicians+ can create work orders"
ON public.work_orders
FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'engineer', 'technician')
));

CREATE POLICY "Technicians+ can update work orders"
ON public.work_orders
FOR UPDATE
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'engineer', 'technician')
));

CREATE POLICY "Admins can delete work orders"
ON public.work_orders
FOR DELETE
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'admin'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_work_orders_updated_at
BEFORE UPDATE ON public.work_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for common queries
CREATE INDEX idx_work_orders_org_status ON public.work_orders(organization_id, status);
CREATE INDEX idx_work_orders_assigned ON public.work_orders(assigned_to) WHERE assigned_to IS NOT NULL;