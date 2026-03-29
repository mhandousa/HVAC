-- Create junction table for project-customer many-to-many relationship
CREATE TABLE public.project_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  UNIQUE(project_id, customer_id)
);

-- Enable RLS
ALTER TABLE public.project_customers ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view project_customers in their organization"
  ON public.project_customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = project_id 
      AND p.organization_id = public.user_org_id()
    )
  );

CREATE POLICY "Users can insert project_customers in their organization"
  ON public.project_customers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = project_id 
      AND p.organization_id = public.user_org_id()
    )
  );

CREATE POLICY "Users can delete project_customers in their organization"
  ON public.project_customers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = project_id 
      AND p.organization_id = public.user_org_id()
    )
  );