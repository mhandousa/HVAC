-- Phase 1: Foundation & Core Infrastructure

-- Organizations/Companies table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User profiles with role management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  organization_id UUID REFERENCES public.organizations(id),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'engineer', 'technician', 'viewer')),
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  location TEXT,
  building_type TEXT CHECK (building_type IN ('commercial', 'residential', 'industrial', 'healthcare', 'education', 'hospitality', 'retail', 'other')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('planning', 'active', 'completed', 'on_hold', 'archived')),
  start_date DATE,
  end_date DATE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Buildings within projects
CREATE TABLE public.buildings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  total_floors INTEGER DEFAULT 1,
  total_area_sqm DECIMAL(12, 2),
  year_built INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Floors within buildings
CREATE TABLE public.floors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  floor_number INTEGER NOT NULL,
  area_sqm DECIMAL(12, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Zones within floors
CREATE TABLE public.zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  floor_id UUID NOT NULL REFERENCES public.floors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  zone_type TEXT CHECK (zone_type IN ('office', 'meeting_room', 'lobby', 'corridor', 'restroom', 'kitchen', 'server_room', 'storage', 'mechanical', 'other')),
  area_sqm DECIMAL(12, 2),
  occupancy_capacity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Equipment categories
CREATE TABLE public.equipment_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.equipment_categories(id),
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Equipment inventory
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.equipment_categories(id),
  tag TEXT NOT NULL,
  name TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  equipment_type TEXT CHECK (equipment_type IN ('ahu', 'chiller', 'boiler', 'pump', 'fan', 'vav', 'fcu', 'split_unit', 'vrf', 'cooling_tower', 'thermostat', 'sensor', 'controller', 'other')),
  capacity_value DECIMAL(12, 2),
  capacity_unit TEXT,
  install_date DATE,
  warranty_expiry DATE,
  status TEXT NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'fault', 'offline', 'decommissioned')),
  specifications JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Documents storage
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  document_type TEXT CHECK (document_type IN ('manual', 'drawing', 'submittal', 'warranty', 'maintenance_record', 'specification', 'report', 'other')),
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view their organization" ON public.organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update their organization" ON public.organizations
  FOR UPDATE USING (
    id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their organization" ON public.profiles
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for projects
CREATE POLICY "Users can view projects in their organization" ON public.projects
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Engineers+ can create projects" ON public.projects
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'engineer'))
  );

CREATE POLICY "Engineers+ can update projects" ON public.projects
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'engineer'))
  );

CREATE POLICY "Admins can delete projects" ON public.projects
  FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for buildings, floors, zones (same org-based access)
CREATE POLICY "Users can view buildings" ON public.buildings
  FOR SELECT USING (
    project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()))
  );

CREATE POLICY "Engineers+ can manage buildings" ON public.buildings
  FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')))
  );

CREATE POLICY "Users can view floors" ON public.floors
  FOR SELECT USING (
    building_id IN (SELECT id FROM public.buildings WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())))
  );

CREATE POLICY "Engineers+ can manage floors" ON public.floors
  FOR ALL USING (
    building_id IN (SELECT id FROM public.buildings WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'engineer'))))
  );

CREATE POLICY "Users can view zones" ON public.zones
  FOR SELECT USING (
    floor_id IN (SELECT id FROM public.floors WHERE building_id IN (SELECT id FROM public.buildings WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()))))
  );

CREATE POLICY "Engineers+ can manage zones" ON public.zones
  FOR ALL USING (
    floor_id IN (SELECT id FROM public.floors WHERE building_id IN (SELECT id FROM public.buildings WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')))))
  );

-- RLS for equipment categories (public read, admin write)
CREATE POLICY "Anyone can view equipment categories" ON public.equipment_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage equipment categories" ON public.equipment_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS for equipment
CREATE POLICY "Users can view equipment in their org" ON public.equipment
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Technicians+ can manage equipment" ON public.equipment
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'engineer', 'technician'))
  );

-- RLS for documents
CREATE POLICY "Users can view documents in their org" ON public.documents
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can upload documents" ON public.documents
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can delete documents" ON public.documents
  FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON public.buildings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_floors_updated_at BEFORE UPDATE ON public.floors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_zones_updated_at BEFORE UPDATE ON public.zones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default equipment categories
INSERT INTO public.equipment_categories (name, icon) VALUES
  ('Air Handling Units', 'wind'),
  ('Chillers', 'snowflake'),
  ('Boilers', 'flame'),
  ('Pumps', 'droplets'),
  ('Fans', 'fan'),
  ('Terminal Units', 'square'),
  ('Controls', 'cpu'),
  ('Sensors', 'thermometer');