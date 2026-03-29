-- 1) Roles (separate table) -------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'app_role' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, organization_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 2) Security definer helpers ------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_org_role(_org_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND organization_id = _org_id
      AND role = _role
  );
$$;

-- 3) Replace organizations RLS to avoid using profiles.role -----------------
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
DROP POLICY IF EXISTS "Admins can update their organization" ON public.organizations;

CREATE POLICY "Users can view their organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT p.organization_id
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update their organization"
ON public.organizations
FOR UPDATE
TO authenticated
USING (public.has_org_role(id, 'admin'))
WITH CHECK (public.has_org_role(id, 'admin'));

-- 4) RPC to create org + attach user + assign admin role ---------------------
CREATE OR REPLACE FUNCTION public.create_organization(_name text, _slug text)
RETURNS public.organizations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org public.organizations;
BEGIN
  INSERT INTO public.organizations (name, slug)
  VALUES (_name, _slug)
  RETURNING * INTO org;

  -- Ensure profile exists, then attach organization
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid()) THEN
    UPDATE public.profiles
    SET organization_id = org.id
    WHERE user_id = auth.uid();
  ELSE
    INSERT INTO public.profiles (user_id, email, full_name, organization_id)
    VALUES (auth.uid(), '', NULL, org.id);
  END IF;

  -- Assign admin role scoped to this org
  INSERT INTO public.user_roles (user_id, organization_id, role)
  VALUES (auth.uid(), org.id, 'admin')
  ON CONFLICT DO NOTHING;

  RETURN org;
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_org_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_organization(text, text) TO authenticated;
