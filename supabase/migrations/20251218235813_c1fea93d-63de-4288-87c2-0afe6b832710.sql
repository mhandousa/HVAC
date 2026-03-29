-- =============================================
-- TECHNICIAN SCHEDULING TABLES
-- =============================================

-- Technician daily schedules and clock-in/out
CREATE TABLE public.technician_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  start_time TIME NOT NULL DEFAULT '08:00',
  end_time TIME NOT NULL DEFAULT '17:00',
  is_available BOOLEAN DEFAULT true,
  availability_type VARCHAR(50) DEFAULT 'working',
  notes TEXT,
  clock_in_time TIMESTAMPTZ,
  clock_out_time TIMESTAMPTZ,
  clock_in_location_lat NUMERIC,
  clock_in_location_lng NUMERIC,
  break_duration_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(technician_id, schedule_date)
);

-- Dispatch notes for work orders
CREATE TABLE public.dispatch_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  note_type VARCHAR(50) DEFAULT 'status_update',
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- DUCT DESIGN TABLES
-- =============================================

-- Duct systems (parent container for duct designs)
CREATE TABLE public.duct_systems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  load_calculation_id UUID REFERENCES public.load_calculations(id) ON DELETE SET NULL,
  system_name VARCHAR(255) NOT NULL,
  system_type VARCHAR(50) DEFAULT 'supply',
  design_method VARCHAR(50) DEFAULT 'equal_friction',
  total_airflow_cfm NUMERIC,
  system_static_pressure_pa NUMERIC,
  design_velocity_fpm NUMERIC,
  target_friction_rate NUMERIC,
  fan_type VARCHAR(100),
  fan_power_kw NUMERIC,
  duct_material VARCHAR(100) DEFAULT 'galvanized_steel',
  insulation_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'draft',
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Duct segments (individual sections of ductwork)
CREATE TABLE public.duct_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  duct_system_id UUID NOT NULL REFERENCES public.duct_systems(id) ON DELETE CASCADE,
  segment_name VARCHAR(255) NOT NULL,
  cfm NUMERIC NOT NULL,
  length_ft NUMERIC,
  fittings_equivalent_length_ft NUMERIC DEFAULT 0,
  duct_shape VARCHAR(20) DEFAULT 'rectangular',
  diameter_in NUMERIC,
  width_in NUMERIC,
  height_in NUMERIC,
  velocity_fpm NUMERIC,
  friction_loss_per_100ft NUMERIC,
  total_pressure_drop NUMERIC,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Duct fittings (elbows, tees, etc.)
CREATE TABLE public.duct_fittings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  duct_segment_id UUID NOT NULL REFERENCES public.duct_segments(id) ON DELETE CASCADE,
  fitting_type VARCHAR(100) NOT NULL,
  fitting_description VARCHAR(255),
  loss_coefficient NUMERIC,
  equivalent_length_ft NUMERIC,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Diffusers and grilles
CREATE TABLE public.diffuser_grilles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  duct_system_id UUID NOT NULL REFERENCES public.duct_systems(id) ON DELETE CASCADE,
  terminal_type VARCHAR(50) DEFAULT 'diffuser',
  style VARCHAR(100),
  model VARCHAR(255),
  airflow_cfm NUMERIC,
  face_velocity_fpm NUMERIC,
  neck_size VARCHAR(50),
  pressure_drop_pa NUMERIC,
  throw_distance_ft NUMERIC,
  noise_nc NUMERIC,
  location_description TEXT,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- EQUIPMENT SELECTION TABLE
-- =============================================

CREATE TABLE public.equipment_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  load_calculation_id UUID REFERENCES public.load_calculations(id) ON DELETE SET NULL,
  selection_name VARCHAR(255) NOT NULL,
  equipment_category VARCHAR(100),
  required_capacity_tons NUMERIC,
  required_capacity_kw NUMERIC,
  selected_equipment JSONB DEFAULT '[]'::jsonb,
  lifecycle_cost_analysis JSONB,
  comparison_notes TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE public.technician_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duct_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duct_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duct_fittings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diffuser_grilles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_selections ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - TECHNICIAN SCHEDULES
-- =============================================

-- Users can view schedules in their org
CREATE POLICY "Users can view schedules in their org"
ON public.technician_schedules FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE user_id = auth.uid()
));

-- Technicians can manage their own schedules
CREATE POLICY "Technicians can manage own schedules"
ON public.technician_schedules FOR ALL
USING (
  technician_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')
  )
);

-- =============================================
-- RLS POLICIES - DISPATCH NOTES
-- =============================================

-- Users can view notes in their org
CREATE POLICY "Users can view dispatch notes"
ON public.dispatch_notes FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE user_id = auth.uid()
));

-- Technicians+ can create dispatch notes
CREATE POLICY "Technicians+ can create dispatch notes"
ON public.dispatch_notes FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE user_id = auth.uid() AND role IN ('admin', 'engineer', 'technician')
));

-- =============================================
-- RLS POLICIES - DUCT SYSTEMS
-- =============================================

-- Users can view duct systems in their org
CREATE POLICY "Users can view duct systems"
ON public.duct_systems FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE user_id = auth.uid()
));

-- Engineers+ can manage duct systems
CREATE POLICY "Engineers+ can manage duct systems"
ON public.duct_systems FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')
));

-- =============================================
-- RLS POLICIES - DUCT SEGMENTS (via duct_systems)
-- =============================================

CREATE POLICY "Users can view duct segments"
ON public.duct_segments FOR SELECT
USING (duct_system_id IN (
  SELECT id FROM duct_systems WHERE organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Engineers+ can manage duct segments"
ON public.duct_segments FOR ALL
USING (duct_system_id IN (
  SELECT id FROM duct_systems WHERE organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')
  )
));

-- =============================================
-- RLS POLICIES - DUCT FITTINGS (via duct_segments)
-- =============================================

CREATE POLICY "Users can view duct fittings"
ON public.duct_fittings FOR SELECT
USING (duct_segment_id IN (
  SELECT id FROM duct_segments WHERE duct_system_id IN (
    SELECT id FROM duct_systems WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  )
));

CREATE POLICY "Engineers+ can manage duct fittings"
ON public.duct_fittings FOR ALL
USING (duct_segment_id IN (
  SELECT id FROM duct_segments WHERE duct_system_id IN (
    SELECT id FROM duct_systems WHERE organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')
    )
  )
));

-- =============================================
-- RLS POLICIES - DIFFUSER GRILLES (via duct_systems)
-- =============================================

CREATE POLICY "Users can view diffuser grilles"
ON public.diffuser_grilles FOR SELECT
USING (duct_system_id IN (
  SELECT id FROM duct_systems WHERE organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Engineers+ can manage diffuser grilles"
ON public.diffuser_grilles FOR ALL
USING (duct_system_id IN (
  SELECT id FROM duct_systems WHERE organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')
  )
));

-- =============================================
-- RLS POLICIES - EQUIPMENT SELECTIONS
-- =============================================

CREATE POLICY "Users can view equipment selections"
ON public.equipment_selections FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Engineers+ can manage equipment selections"
ON public.equipment_selections FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM profiles 
  WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')
));

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_technician_schedules_org ON public.technician_schedules(organization_id);
CREATE INDEX idx_technician_schedules_tech_date ON public.technician_schedules(technician_id, schedule_date);
CREATE INDEX idx_dispatch_notes_work_order ON public.dispatch_notes(work_order_id);
CREATE INDEX idx_dispatch_notes_org ON public.dispatch_notes(organization_id);
CREATE INDEX idx_duct_systems_org ON public.duct_systems(organization_id);
CREATE INDEX idx_duct_systems_project ON public.duct_systems(project_id);
CREATE INDEX idx_duct_segments_system ON public.duct_segments(duct_system_id);
CREATE INDEX idx_duct_fittings_segment ON public.duct_fittings(duct_segment_id);
CREATE INDEX idx_diffuser_grilles_system ON public.diffuser_grilles(duct_system_id);
CREATE INDEX idx_equipment_selections_org ON public.equipment_selections(organization_id);
CREATE INDEX idx_equipment_selections_project ON public.equipment_selections(project_id);

-- =============================================
-- TRIGGERS FOR updated_at
-- =============================================

CREATE TRIGGER update_technician_schedules_updated_at
  BEFORE UPDATE ON public.technician_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_duct_systems_updated_at
  BEFORE UPDATE ON public.duct_systems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_duct_segments_updated_at
  BEFORE UPDATE ON public.duct_segments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_diffuser_grilles_updated_at
  BEFORE UPDATE ON public.diffuser_grilles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipment_selections_updated_at
  BEFORE UPDATE ON public.equipment_selections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();