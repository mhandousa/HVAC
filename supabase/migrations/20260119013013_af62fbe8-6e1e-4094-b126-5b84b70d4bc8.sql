-- Create ERV maintenance schedules table
CREATE TABLE public.erv_maintenance_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE SET NULL,
  erv_name TEXT NOT NULL,
  maintenance_type TEXT NOT NULL, -- 'filter_replacement', 'coil_cleaning', 'wheel_inspection', 'belt_check', 'general_pm'
  frequency_days INTEGER NOT NULL DEFAULT 90,
  last_performed_at TIMESTAMP WITH TIME ZONE,
  next_due_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reminder_days_before INTEGER DEFAULT 14,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ERV maintenance logs table
CREATE TABLE public.erv_maintenance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES public.erv_maintenance_schedules(id) ON DELETE CASCADE,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  performed_by UUID REFERENCES public.profiles(id),
  technician_name TEXT,
  maintenance_type TEXT NOT NULL,
  filter_type TEXT, -- For filter replacements
  filter_part_number TEXT,
  labor_hours NUMERIC(4,2),
  parts_cost_sar NUMERIC(10,2),
  labor_cost_sar NUMERIC(10,2),
  pre_maintenance_efficiency NUMERIC(5,2), -- Efficiency before maintenance
  post_maintenance_efficiency NUMERIC(5,2), -- Efficiency after maintenance
  pressure_drop_before_pa NUMERIC(6,2),
  pressure_drop_after_pa NUMERIC(6,2),
  notes TEXT,
  photos_urls TEXT[], -- Array of photo URLs
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ERV performance tracking table
CREATE TABLE public.erv_performance_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE SET NULL,
  schedule_id UUID REFERENCES public.erv_maintenance_schedules(id) ON DELETE SET NULL,
  reading_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  supply_air_temp_f NUMERIC(5,2),
  return_air_temp_f NUMERIC(5,2),
  outdoor_air_temp_f NUMERIC(5,2),
  exhaust_air_temp_f NUMERIC(5,2),
  sensible_efficiency NUMERIC(5,2),
  latent_efficiency NUMERIC(5,2),
  total_efficiency NUMERIC(5,2),
  supply_airflow_cfm NUMERIC(10,2),
  exhaust_airflow_cfm NUMERIC(10,2),
  filter_pressure_drop_pa NUMERIC(6,2),
  wheel_speed_rpm NUMERIC(6,2),
  power_consumption_kw NUMERIC(6,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ERV alerts table
CREATE TABLE public.erv_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.erv_maintenance_schedules(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL, -- 'filter_due', 'maintenance_overdue', 'efficiency_drop', 'pressure_high', 'performance_degradation'
  severity TEXT NOT NULL DEFAULT 'warning', -- 'info', 'warning', 'critical'
  title TEXT NOT NULL,
  message TEXT,
  threshold_value NUMERIC(10,2),
  actual_value NUMERIC(10,2),
  is_active BOOLEAN DEFAULT true,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.erv_maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erv_maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erv_performance_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erv_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for erv_maintenance_schedules
CREATE POLICY "Users can view their organization's ERV schedules"
ON public.erv_maintenance_schedules FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can create ERV schedules for their organization"
ON public.erv_maintenance_schedules FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can update their organization's ERV schedules"
ON public.erv_maintenance_schedules FOR UPDATE
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can delete their organization's ERV schedules"
ON public.erv_maintenance_schedules FOR DELETE
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

-- RLS policies for erv_maintenance_logs
CREATE POLICY "Users can view maintenance logs for their organization's schedules"
ON public.erv_maintenance_logs FOR SELECT
USING (schedule_id IN (
  SELECT id FROM public.erv_maintenance_schedules 
  WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
));

CREATE POLICY "Users can create maintenance logs"
ON public.erv_maintenance_logs FOR INSERT
WITH CHECK (schedule_id IN (
  SELECT id FROM public.erv_maintenance_schedules 
  WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
));

-- RLS policies for erv_performance_readings
CREATE POLICY "Users can view their organization's ERV readings"
ON public.erv_performance_readings FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can create ERV readings for their organization"
ON public.erv_performance_readings FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

-- RLS policies for erv_alerts
CREATE POLICY "Users can view their organization's ERV alerts"
ON public.erv_alerts FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can update their organization's ERV alerts"
ON public.erv_alerts FOR UPDATE
USING (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can create ERV alerts for their organization"
ON public.erv_alerts FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_erv_schedules_org ON public.erv_maintenance_schedules(organization_id);
CREATE INDEX idx_erv_schedules_next_due ON public.erv_maintenance_schedules(next_due_at);
CREATE INDEX idx_erv_schedules_equipment ON public.erv_maintenance_schedules(equipment_id);
CREATE INDEX idx_erv_logs_schedule ON public.erv_maintenance_logs(schedule_id);
CREATE INDEX idx_erv_readings_org ON public.erv_performance_readings(organization_id);
CREATE INDEX idx_erv_readings_schedule ON public.erv_performance_readings(schedule_id);
CREATE INDEX idx_erv_alerts_org_active ON public.erv_alerts(organization_id, is_active);

-- Create trigger for updated_at on schedules
CREATE TRIGGER update_erv_maintenance_schedules_updated_at
BEFORE UPDATE ON public.erv_maintenance_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();