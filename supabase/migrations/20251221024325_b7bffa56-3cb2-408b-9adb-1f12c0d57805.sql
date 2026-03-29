-- Drop old policies that use profiles.role
DROP POLICY IF EXISTS "Engineers+ can create projects" ON public.projects;
DROP POLICY IF EXISTS "Engineers+ can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view projects in their organization" ON public.projects;

-- Helper function to check if user belongs to organization
CREATE OR REPLACE FUNCTION public.user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.user_org_id() TO authenticated;

-- Create new policies using the user_org_id helper function
CREATE POLICY "Users can view projects in their organization"
ON public.projects
FOR SELECT
TO authenticated
USING (organization_id = public.user_org_id());

CREATE POLICY "Users can create projects in their organization"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (organization_id = public.user_org_id());

CREATE POLICY "Users can update projects in their organization"
ON public.projects
FOR UPDATE
TO authenticated
USING (organization_id = public.user_org_id());

CREATE POLICY "Admins can delete projects"
ON public.projects
FOR DELETE
TO authenticated
USING (public.has_org_role(organization_id, 'admin'));