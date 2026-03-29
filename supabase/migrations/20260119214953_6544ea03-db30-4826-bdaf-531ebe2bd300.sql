-- VRF Systems main table
CREATE TABLE public.vrf_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  system_name TEXT NOT NULL,
  system_tag TEXT,
  refrigerant_type TEXT NOT NULL DEFAULT 'R410A',
  system_type TEXT NOT NULL DEFAULT 'heat_pump' CHECK (system_type IN ('heat_pump', 'heat_recovery')),
  
  -- Outdoor unit configuration
  outdoor_unit_capacity_kw NUMERIC,
  outdoor_unit_capacity_tons NUMERIC,
  outdoor_unit_model TEXT,
  outdoor_unit_manufacturer TEXT,
  number_of_outdoor_units INTEGER DEFAULT 1,
  
  -- Piping design parameters
  max_piping_length_ft NUMERIC DEFAULT 540,
  max_piping_length_actual_ft NUMERIC,
  max_elevation_diff_ft NUMERIC DEFAULT 160,
  actual_elevation_diff_ft NUMERIC,
  first_branch_max_length_ft NUMERIC DEFAULT 130,
  
  -- Totals (calculated)
  total_indoor_capacity_kw NUMERIC,
  total_indoor_capacity_tons NUMERIC,
  capacity_ratio NUMERIC,
  total_liquid_line_length_ft NUMERIC,
  total_suction_line_length_ft NUMERIC,
  
  -- Oil return
  oil_return_verified BOOLEAN DEFAULT false,
  oil_return_notes TEXT,
  
  -- Metadata
  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'issued')),
  revision TEXT DEFAULT 'A',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VRF Branch Selectors (for heat recovery systems)
CREATE TABLE public.vrf_branch_selectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vrf_system_id UUID NOT NULL REFERENCES public.vrf_systems(id) ON DELETE CASCADE,
  selector_tag TEXT NOT NULL,
  selector_model TEXT,
  capacity_kw NUMERIC,
  
  -- Position in piping
  distance_from_outdoor_ft NUMERIC,
  elevation_from_outdoor_ft NUMERIC DEFAULT 0,
  
  -- Pipe sizes (to branch selector)
  liquid_line_size_in NUMERIC,
  suction_line_size_in NUMERIC,
  discharge_line_size_in NUMERIC,
  
  -- Connected units
  connected_unit_count INTEGER DEFAULT 0,
  total_connected_capacity_kw NUMERIC,
  
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VRF Indoor Units
CREATE TABLE public.vrf_indoor_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vrf_system_id UUID NOT NULL REFERENCES public.vrf_systems(id) ON DELETE CASCADE,
  unit_tag TEXT NOT NULL,
  unit_type TEXT NOT NULL CHECK (unit_type IN (
    'wall_mounted', 'ceiling_cassette', 'ducted', 
    'floor_standing', 'ceiling_suspended', 'console'
  )),
  zone_name TEXT,
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  
  -- Capacity
  cooling_capacity_kw NUMERIC NOT NULL,
  cooling_capacity_btu NUMERIC,
  heating_capacity_kw NUMERIC,
  model_number TEXT,
  
  -- Piping distances
  liquid_line_length_ft NUMERIC NOT NULL DEFAULT 0,
  suction_line_length_ft NUMERIC,
  elevation_from_outdoor_ft NUMERIC DEFAULT 0,
  is_above_outdoor BOOLEAN DEFAULT true,
  
  -- Sized pipe sizes (calculated)
  liquid_line_size_in NUMERIC,
  suction_line_size_in NUMERIC,
  
  -- Connection info
  branch_selector_id UUID REFERENCES public.vrf_branch_selectors(id) ON DELETE SET NULL,
  parent_unit_id UUID REFERENCES public.vrf_indoor_units(id) ON DELETE SET NULL,
  connection_type TEXT DEFAULT 'direct' CHECK (connection_type IN ('direct', 'branch', 'sub-branch')),
  
  -- Fittings equivalent length
  liquid_line_equiv_length_ft NUMERIC DEFAULT 0,
  suction_line_equiv_length_ft NUMERIC DEFAULT 0,
  
  -- Calculated results
  liquid_line_pressure_drop_psi NUMERIC,
  suction_line_pressure_drop_psi NUMERIC,
  liquid_velocity_fps NUMERIC,
  suction_velocity_fps NUMERIC,
  oil_return_ok BOOLEAN,
  
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VRF Piping Segments
CREATE TABLE public.vrf_piping_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vrf_system_id UUID NOT NULL REFERENCES public.vrf_systems(id) ON DELETE CASCADE,
  segment_name TEXT NOT NULL,
  segment_type TEXT NOT NULL CHECK (segment_type IN ('main', 'branch', 'sub-branch', 'header')),
  line_type TEXT NOT NULL CHECK (line_type IN ('liquid', 'suction', 'discharge')),
  
  -- Piping data
  length_ft NUMERIC NOT NULL,
  equivalent_length_ft NUMERIC,
  elevation_change_ft NUMERIC DEFAULT 0,
  is_riser BOOLEAN DEFAULT false,
  
  -- Sizing results
  nominal_size_in NUMERIC,
  capacity_served_kw NUMERIC,
  refrigerant_flow_lb_hr NUMERIC,
  velocity_fps NUMERIC,
  pressure_drop_psi NUMERIC,
  
  -- Oil return (for risers)
  min_oil_return_velocity_fps NUMERIC,
  oil_return_verified BOOLEAN,
  
  -- Hierarchy
  parent_segment_id UUID REFERENCES public.vrf_piping_segments(id) ON DELETE SET NULL,
  from_component_type TEXT,
  from_component_id UUID,
  to_component_type TEXT,
  to_component_id UUID,
  
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.vrf_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vrf_branch_selectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vrf_indoor_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vrf_piping_segments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vrf_systems
CREATE POLICY "Users can view VRF systems in their org" ON public.vrf_systems
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert VRF systems in their org" ON public.vrf_systems
  FOR INSERT WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update VRF systems in their org" ON public.vrf_systems
  FOR UPDATE USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete VRF systems in their org" ON public.vrf_systems
  FOR DELETE USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- RLS Policies for vrf_branch_selectors
CREATE POLICY "Users can view branch selectors in their org" ON public.vrf_branch_selectors
  FOR SELECT USING (vrf_system_id IN (
    SELECT id FROM public.vrf_systems WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage branch selectors in their org" ON public.vrf_branch_selectors
  FOR ALL USING (vrf_system_id IN (
    SELECT id FROM public.vrf_systems WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

-- RLS Policies for vrf_indoor_units
CREATE POLICY "Users can view indoor units in their org" ON public.vrf_indoor_units
  FOR SELECT USING (vrf_system_id IN (
    SELECT id FROM public.vrf_systems WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage indoor units in their org" ON public.vrf_indoor_units
  FOR ALL USING (vrf_system_id IN (
    SELECT id FROM public.vrf_systems WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

-- RLS Policies for vrf_piping_segments
CREATE POLICY "Users can view piping segments in their org" ON public.vrf_piping_segments
  FOR SELECT USING (vrf_system_id IN (
    SELECT id FROM public.vrf_systems WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage piping segments in their org" ON public.vrf_piping_segments
  FOR ALL USING (vrf_system_id IN (
    SELECT id FROM public.vrf_systems WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

-- Indexes for performance
CREATE INDEX idx_vrf_systems_org ON public.vrf_systems(organization_id);
CREATE INDEX idx_vrf_systems_project ON public.vrf_systems(project_id);
CREATE INDEX idx_vrf_indoor_units_system ON public.vrf_indoor_units(vrf_system_id);
CREATE INDEX idx_vrf_indoor_units_branch ON public.vrf_indoor_units(branch_selector_id);
CREATE INDEX idx_vrf_branch_selectors_system ON public.vrf_branch_selectors(vrf_system_id);
CREATE INDEX idx_vrf_piping_segments_system ON public.vrf_piping_segments(vrf_system_id);

-- Update trigger for vrf_systems
CREATE TRIGGER update_vrf_systems_updated_at
  BEFORE UPDATE ON public.vrf_systems
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for vrf_indoor_units
CREATE TRIGGER update_vrf_indoor_units_updated_at
  BEFORE UPDATE ON public.vrf_indoor_units
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();