-- Create design_completeness_snapshots table for project-level daily snapshots
CREATE TABLE public.design_completeness_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  total_zones INTEGER NOT NULL DEFAULT 0,
  zones_with_load_calc INTEGER NOT NULL DEFAULT 0,
  zones_with_equipment INTEGER NOT NULL DEFAULT 0,
  zones_with_distribution INTEGER NOT NULL DEFAULT 0,
  fully_complete_zones INTEGER NOT NULL DEFAULT 0,
  overall_completeness_percent SMALLINT NOT NULL DEFAULT 0,
  load_calc_percent SMALLINT NOT NULL DEFAULT 0,
  equipment_percent SMALLINT NOT NULL DEFAULT 0,
  distribution_percent SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_project_snapshot_date UNIQUE (project_id, snapshot_date),
  CONSTRAINT check_percentages CHECK (
    overall_completeness_percent >= 0 AND overall_completeness_percent <= 100 AND
    load_calc_percent >= 0 AND load_calc_percent <= 100 AND
    equipment_percent >= 0 AND equipment_percent <= 100 AND
    distribution_percent >= 0 AND distribution_percent <= 100
  )
);

-- Create design_completeness_building_snapshots for building-level granularity
CREATE TABLE public.design_completeness_building_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_id UUID NOT NULL REFERENCES public.design_completeness_snapshots(id) ON DELETE CASCADE,
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  building_name TEXT NOT NULL,
  total_zones INTEGER NOT NULL DEFAULT 0,
  zones_with_load_calc INTEGER NOT NULL DEFAULT 0,
  zones_with_equipment INTEGER NOT NULL DEFAULT 0,
  zones_with_distribution INTEGER NOT NULL DEFAULT 0,
  fully_complete_zones INTEGER NOT NULL DEFAULT 0,
  overall_completeness_percent SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_completeness_snapshots_project_date ON public.design_completeness_snapshots(project_id, snapshot_date);
CREATE INDEX idx_completeness_snapshots_org ON public.design_completeness_snapshots(organization_id);
CREATE INDEX idx_completeness_building_snapshots_snapshot ON public.design_completeness_building_snapshots(snapshot_id);
CREATE INDEX idx_completeness_building_snapshots_building ON public.design_completeness_building_snapshots(building_id);

-- Enable Row Level Security
ALTER TABLE public.design_completeness_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_completeness_building_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project snapshots
CREATE POLICY "Users can view their org snapshots"
  ON public.design_completeness_snapshots
  FOR SELECT
  USING (organization_id = user_org_id());

CREATE POLICY "Service role can insert snapshots"
  ON public.design_completeness_snapshots
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update snapshots"
  ON public.design_completeness_snapshots
  FOR UPDATE
  USING (true);

-- RLS Policies for building snapshots
CREATE POLICY "Users can view their org building snapshots"
  ON public.design_completeness_building_snapshots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.design_completeness_snapshots s
      WHERE s.id = snapshot_id
      AND s.organization_id = user_org_id()
    )
  );

CREATE POLICY "Service role can insert building snapshots"
  ON public.design_completeness_building_snapshots
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update building snapshots"
  ON public.design_completeness_building_snapshots
  FOR UPDATE
  USING (true);