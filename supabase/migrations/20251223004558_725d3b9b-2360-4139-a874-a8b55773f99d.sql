-- Add RLS policies for floors table

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view org floors" ON floors;
DROP POLICY IF EXISTS "Users can add floors" ON floors;
DROP POLICY IF EXISTS "Users can update floors" ON floors;
DROP POLICY IF EXISTS "Admins can delete floors" ON floors;

-- Enable RLS if not already enabled
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view floors in buildings that belong to their organization's projects
CREATE POLICY "Users can view org floors"
ON floors FOR SELECT TO authenticated
USING (
  building_id IN (
    SELECT b.id FROM buildings b
    JOIN projects p ON b.project_id = p.id
    WHERE p.organization_id = public.user_org_id()
  )
);

-- INSERT: Users can add floors to buildings in their organization's projects
CREATE POLICY "Users can add floors"
ON floors FOR INSERT TO authenticated
WITH CHECK (
  building_id IN (
    SELECT b.id FROM buildings b
    JOIN projects p ON b.project_id = p.id
    WHERE p.organization_id = public.user_org_id()
  )
);

-- UPDATE: Users can update floors in their organization's buildings
CREATE POLICY "Users can update floors"
ON floors FOR UPDATE TO authenticated
USING (
  building_id IN (
    SELECT b.id FROM buildings b
    JOIN projects p ON b.project_id = p.id
    WHERE p.organization_id = public.user_org_id()
  )
)
WITH CHECK (
  building_id IN (
    SELECT b.id FROM buildings b
    JOIN projects p ON b.project_id = p.id
    WHERE p.organization_id = public.user_org_id()
  )
);

-- DELETE: Only admins can delete floors
CREATE POLICY "Admins can delete floors"
ON floors FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM buildings b
    JOIN projects p ON b.project_id = p.id
    WHERE b.id = floors.building_id
      AND public.has_org_role(p.organization_id, 'admin')
  )
);