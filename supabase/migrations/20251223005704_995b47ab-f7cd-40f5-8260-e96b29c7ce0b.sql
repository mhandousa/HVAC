-- Add RLS policies for zones table

-- Enable RLS on zones table
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view zones in their organization's projects
CREATE POLICY "Users can view org zones" ON public.zones
FOR SELECT TO authenticated
USING (floor_id IN (
  SELECT f.id FROM floors f
  JOIN buildings b ON f.building_id = b.id
  JOIN projects p ON b.project_id = p.id
  WHERE p.organization_id = public.user_org_id()
));

-- Policy: Users can insert zones in their organization's projects
CREATE POLICY "Users can add zones" ON public.zones
FOR INSERT TO authenticated
WITH CHECK (floor_id IN (
  SELECT f.id FROM floors f
  JOIN buildings b ON f.building_id = b.id
  JOIN projects p ON b.project_id = p.id
  WHERE p.organization_id = public.user_org_id()
));

-- Policy: Users can update zones in their organization's projects
CREATE POLICY "Users can update zones" ON public.zones
FOR UPDATE TO authenticated
USING (floor_id IN (
  SELECT f.id FROM floors f
  JOIN buildings b ON f.building_id = b.id
  JOIN projects p ON b.project_id = p.id
  WHERE p.organization_id = public.user_org_id()
));

-- Policy: Admins can delete zones in their organization's projects
CREATE POLICY "Admins can delete zones" ON public.zones
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM floors f
    JOIN buildings b ON f.building_id = b.id
    JOIN projects p ON b.project_id = p.id
    WHERE f.id = zones.floor_id
      AND public.has_org_role(p.organization_id, 'admin')
  )
);