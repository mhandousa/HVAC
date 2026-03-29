-- Create psychrometric_presets table for storing reusable HVAC process configurations
CREATE TABLE public.psychrometric_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'custom' CHECK (category IN ('cooling', 'heating', 'mixing', 'humidification', 'dehumidification', 'custom')),
  icon_name TEXT NOT NULL DEFAULT 'Settings2',
  air_states JSONB NOT NULL DEFAULT '[]'::jsonb,
  altitude_ft INTEGER DEFAULT 0,
  climate_zone TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.psychrometric_presets ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX idx_psychrometric_presets_org ON public.psychrometric_presets(organization_id);
CREATE INDEX idx_psychrometric_presets_category ON public.psychrometric_presets(category);
CREATE INDEX idx_psychrometric_presets_created_by ON public.psychrometric_presets(created_by);

-- RLS Policies

-- Users can view public presets in their organization or their own private presets
CREATE POLICY "Users can view organization presets"
ON public.psychrometric_presets
FOR SELECT
USING (
  organization_id = user_org_id() 
  AND (is_public = true OR created_by = auth.uid())
);

-- Users can create presets in their organization
CREATE POLICY "Users can create presets"
ON public.psychrometric_presets
FOR INSERT
WITH CHECK (organization_id = user_org_id());

-- Users can update their own presets
CREATE POLICY "Users can update own presets"
ON public.psychrometric_presets
FOR UPDATE
USING (created_by = auth.uid() OR has_org_role(organization_id, 'admin'));

-- Users can delete their own presets, admins can delete any
CREATE POLICY "Users can delete own presets"
ON public.psychrometric_presets
FOR DELETE
USING (created_by = auth.uid() OR has_org_role(organization_id, 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_psychrometric_presets_updated_at
BEFORE UPDATE ON public.psychrometric_presets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();