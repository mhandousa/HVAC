-- Add project_id to service_contracts table
ALTER TABLE public.service_contracts 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_service_contracts_project_id ON public.service_contracts(project_id);