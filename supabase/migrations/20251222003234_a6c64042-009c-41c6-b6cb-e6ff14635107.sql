-- Drop old buildings RLS policies that use profiles.role
DROP POLICY IF EXISTS "Engineers+ can manage buildings" ON buildings;
DROP POLICY IF EXISTS "Users can view buildings" ON buildings;

-- View: All org members can view buildings in their org's projects
CREATE POLICY "Users can view org buildings"
ON buildings FOR SELECT TO authenticated
USING (
  project_id IN (
    SELECT id FROM projects WHERE organization_id = public.user_org_id()
  )
);

-- Insert: All org members can add buildings to their org's projects
CREATE POLICY "Users can add buildings"
ON buildings FOR INSERT TO authenticated
WITH CHECK (
  project_id IN (
    SELECT id FROM projects WHERE organization_id = public.user_org_id()
  )
);

-- Update: All org members can update buildings in their org's projects
CREATE POLICY "Users can update buildings"
ON buildings FOR UPDATE TO authenticated
USING (
  project_id IN (
    SELECT id FROM projects WHERE organization_id = public.user_org_id()
  )
)
WITH CHECK (
  project_id IN (
    SELECT id FROM projects WHERE organization_id = public.user_org_id()
  )
);

-- Delete: Only admins can delete buildings
CREATE POLICY "Admins can delete buildings"
ON buildings FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = buildings.project_id
      AND public.has_org_role(p.organization_id, 'admin')
  )
);