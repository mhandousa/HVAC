-- Create AHU Configurations table for detailed air handling unit setup
CREATE TABLE public.ahu_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  project_id UUID REFERENCES public.projects(id),
  zone_id UUID REFERENCES public.zones(id),
  
  -- Basic Info
  ahu_tag VARCHAR(50) NOT NULL,
  ahu_name VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  
  -- Design Parameters
  design_cfm NUMERIC NOT NULL,
  design_static_pressure_in NUMERIC DEFAULT 2.5,
  outdoor_air_cfm NUMERIC,
  return_air_cfm NUMERIC,
  min_oa_percent NUMERIC DEFAULT 15,
  
  -- Coil Configuration (JSONB)
  cooling_coil_config JSONB,
  heating_coil_config JSONB,
  preheat_coil_config JSONB,
  
  -- Fan Configuration (JSONB)
  supply_fan_config JSONB,
  return_fan_config JSONB,
  relief_fan_config JSONB,
  
  -- Filter Configuration (JSONB)
  filter_config JSONB,
  
  -- Damper Configuration (JSONB)
  damper_config JSONB,
  
  -- Accessories
  humidifier_config JSONB,
  erv_config JSONB,
  sound_attenuator_config JSONB,
  
  -- Control Sequence
  control_strategy VARCHAR(50) DEFAULT 'vav',
  economizer_type VARCHAR(50),
  economizer_lockout_temp_f NUMERIC DEFAULT 75,
  supply_air_temp_setpoint_f NUMERIC DEFAULT 55,
  duct_static_setpoint_in NUMERIC DEFAULT 1.5,
  control_sequence_json JSONB,
  
  -- Calculated Totals
  total_pressure_drop_in NUMERIC,
  total_cooling_capacity_tons NUMERIC,
  total_heating_capacity_mbh NUMERIC,
  supply_fan_bhp NUMERIC,
  return_fan_bhp NUMERIC,
  
  -- Compliance
  ashrae_90_1_compliant BOOLEAN,
  ashrae_62_1_compliant BOOLEAN,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft',
  revision VARCHAR(10) DEFAULT 'A',
  notes TEXT,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ahu_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view AHU configs in their organization"
ON public.ahu_configurations FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create AHU configs in their organization"
ON public.ahu_configurations FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update AHU configs in their organization"
ON public.ahu_configurations FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete AHU configs in their organization"
ON public.ahu_configurations FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Indexes
CREATE INDEX idx_ahu_configurations_org ON public.ahu_configurations(organization_id);
CREATE INDEX idx_ahu_configurations_project ON public.ahu_configurations(project_id);
CREATE INDEX idx_ahu_configurations_status ON public.ahu_configurations(status);

-- Trigger for updated_at
CREATE TRIGGER update_ahu_configurations_updated_at
  BEFORE UPDATE ON public.ahu_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();