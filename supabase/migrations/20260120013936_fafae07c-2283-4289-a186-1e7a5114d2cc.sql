-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Service role can insert snapshots" ON public.design_completeness_snapshots;
DROP POLICY IF EXISTS "Service role can update snapshots" ON public.design_completeness_snapshots;
DROP POLICY IF EXISTS "Service role can insert building snapshots" ON public.design_completeness_building_snapshots;
DROP POLICY IF EXISTS "Service role can update building snapshots" ON public.design_completeness_building_snapshots;

-- Recreate with proper organization-scoped policies
-- Insert: users can insert snapshots for their organization
CREATE POLICY "Users can insert snapshots for their org"
  ON public.design_completeness_snapshots
  FOR INSERT
  WITH CHECK (organization_id = user_org_id());

-- Update: users can update snapshots for their organization
CREATE POLICY "Users can update snapshots for their org"
  ON public.design_completeness_snapshots
  FOR UPDATE
  USING (organization_id = user_org_id());

-- Building snapshots: access through parent snapshot organization
CREATE POLICY "Users can insert building snapshots for their org"
  ON public.design_completeness_building_snapshots
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.design_completeness_snapshots s
      WHERE s.id = snapshot_id
      AND s.organization_id = user_org_id()
    )
  );

CREATE POLICY "Users can update building snapshots for their org"
  ON public.design_completeness_building_snapshots
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.design_completeness_snapshots s
      WHERE s.id = snapshot_id
      AND s.organization_id = user_org_id()
    )
  );