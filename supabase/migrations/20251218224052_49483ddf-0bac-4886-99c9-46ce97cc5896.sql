-- Add pm_schedule_id to work_orders to track source
ALTER TABLE public.work_orders 
ADD COLUMN pm_schedule_id uuid REFERENCES public.pm_schedules(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_work_orders_pm_schedule_id ON public.work_orders(pm_schedule_id);