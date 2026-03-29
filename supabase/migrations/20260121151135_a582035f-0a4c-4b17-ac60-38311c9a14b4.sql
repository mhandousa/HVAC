-- =============================================
-- Fan Selections Table
-- Persists fan selection outputs from FanSelectionDialog
-- =============================================
CREATE TABLE public.fan_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  duct_system_id UUID REFERENCES public.duct_systems(id) ON DELETE CASCADE,
  ahu_configuration_id UUID REFERENCES public.ahu_configurations(id) ON DELETE SET NULL,
  
  -- Fan Identification
  fan_tag VARCHAR(50),
  fan_type VARCHAR(50) NOT NULL, -- 'supply', 'return', 'exhaust', 'relief', 'transfer'
  application VARCHAR(100),
  
  -- Selected Equipment Reference
  fan_curve_id UUID REFERENCES public.fan_curves(id) ON DELETE SET NULL,
  manufacturer VARCHAR(100),
  model_number VARCHAR(100),
  
  -- Design Requirements
  design_cfm NUMERIC NOT NULL,
  design_static_pressure_in NUMERIC NOT NULL,
  
  -- Operating Point
  operating_cfm NUMERIC,
  operating_static_pressure_in NUMERIC,
  operating_bhp NUMERIC,
  operating_efficiency_percent NUMERIC,
  operating_point_valid BOOLEAN DEFAULT false,
  
  -- Motor & Electrical
  motor_hp NUMERIC,
  motor_rpm NUMERIC,
  motor_voltage VARCHAR(20),
  motor_phase VARCHAR(10),
  motor_fla NUMERIC,
  vfd_required BOOLEAN DEFAULT false,
  
  -- Acoustics & Physical
  sound_power_db NUMERIC,
  nc_rating INTEGER,
  wheel_diameter_in NUMERIC,
  weight_lb NUMERIC,
  
  -- Selection Metadata
  selection_notes TEXT,
  selected_equipment JSONB,
  status VARCHAR(50) DEFAULT 'selected',
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- =============================================
-- Pump Selections Table
-- Persists pump selection outputs from PumpSelectionDialog
-- =============================================
CREATE TABLE public.pump_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pipe_system_id UUID REFERENCES public.pipe_systems(id) ON DELETE CASCADE,
  
  -- Pump Identification
  pump_tag VARCHAR(50),
  pump_type VARCHAR(50) NOT NULL, -- 'chw_primary', 'chw_secondary', 'hw', 'condenser', 'process'
  application VARCHAR(100),
  pump_arrangement VARCHAR(50),
  
  -- Selected Equipment Reference
  pump_curve_id UUID REFERENCES public.pump_curves(id) ON DELETE SET NULL,
  manufacturer VARCHAR(100),
  model_number VARCHAR(100),
  
  -- Design Requirements
  design_flow_gpm NUMERIC NOT NULL,
  design_head_ft NUMERIC NOT NULL,
  
  -- Operating Point
  operating_flow_gpm NUMERIC,
  operating_head_ft NUMERIC,
  operating_bhp NUMERIC,
  operating_efficiency_percent NUMERIC,
  operating_point_valid BOOLEAN DEFAULT false,
  
  -- Motor & Electrical
  motor_hp NUMERIC,
  motor_rpm NUMERIC,
  motor_voltage VARCHAR(20),
  motor_phase VARCHAR(10),
  motor_fla NUMERIC,
  vfd_required BOOLEAN DEFAULT false,
  
  -- NPSH & Physical
  npsh_available_ft NUMERIC,
  npsh_required_ft NUMERIC,
  npsh_margin_adequate BOOLEAN,
  impeller_diameter_in NUMERIC,
  suction_size_in NUMERIC,
  discharge_size_in NUMERIC,
  weight_lb NUMERIC,
  
  -- Selection Metadata
  selection_notes TEXT,
  selected_equipment JSONB,
  status VARCHAR(50) DEFAULT 'selected',
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- =============================================
-- Enable RLS
-- =============================================
ALTER TABLE public.fan_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pump_selections ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Fan Selections RLS Policies
-- =============================================
CREATE POLICY "Users can view fan selections in their organization"
  ON public.fan_selections FOR SELECT
  USING (organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert fan selections in their organization"
  ON public.fan_selections FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update fan selections in their organization"
  ON public.fan_selections FOR UPDATE
  USING (organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete fan selections in their organization"
  ON public.fan_selections FOR DELETE
  USING (organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

-- =============================================
-- Pump Selections RLS Policies
-- =============================================
CREATE POLICY "Users can view pump selections in their organization"
  ON public.pump_selections FOR SELECT
  USING (organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert pump selections in their organization"
  ON public.pump_selections FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update pump selections in their organization"
  ON public.pump_selections FOR UPDATE
  USING (organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete pump selections in their organization"
  ON public.pump_selections FOR DELETE
  USING (organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()));

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_fan_selections_org ON public.fan_selections(organization_id);
CREATE INDEX idx_fan_selections_duct_system ON public.fan_selections(duct_system_id);
CREATE INDEX idx_fan_selections_ahu ON public.fan_selections(ahu_configuration_id);
CREATE INDEX idx_fan_selections_status ON public.fan_selections(status);
CREATE INDEX idx_fan_selections_fan_type ON public.fan_selections(fan_type);

CREATE INDEX idx_pump_selections_org ON public.pump_selections(organization_id);
CREATE INDEX idx_pump_selections_pipe_system ON public.pump_selections(pipe_system_id);
CREATE INDEX idx_pump_selections_status ON public.pump_selections(status);
CREATE INDEX idx_pump_selections_pump_type ON public.pump_selections(pump_type);

-- =============================================
-- Updated_at Triggers
-- =============================================
CREATE TRIGGER update_fan_selections_updated_at
  BEFORE UPDATE ON public.fan_selections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pump_selections_updated_at
  BEFORE UPDATE ON public.pump_selections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();