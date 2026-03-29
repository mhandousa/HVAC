-- Create customers table for CRM
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_number varchar(50) NOT NULL,
  
  -- Company info
  company_name varchar(255),
  company_name_ar varchar(255),
  trade_license varchar(100),
  vat_number varchar(50),
  
  -- Contact person
  contact_name varchar(255) NOT NULL,
  contact_name_ar varchar(255),
  contact_phone varchar(50) NOT NULL,
  contact_email varchar(255),
  alternate_phone varchar(50),
  
  -- Address
  address text NOT NULL,
  city varchar(100),
  postal_code varchar(20),
  
  -- Customer type
  customer_type varchar(50) DEFAULT 'commercial' CHECK (customer_type IN ('residential', 'commercial', 'industrial', 'government')),
  
  -- Service contract
  has_service_contract boolean DEFAULT false,
  contract_type varchar(100),
  contract_start_date date,
  contract_end_date date,
  contract_value_sar numeric,
  
  -- Payment terms
  payment_terms varchar(100) DEFAULT 'net_30',
  credit_limit_sar numeric,
  
  -- History
  total_work_orders integer DEFAULT 0,
  total_revenue_sar numeric DEFAULT 0,
  last_service_date date,
  
  -- Preferences
  preferred_contact_method varchar(50) CHECK (preferred_contact_method IN ('phone', 'email', 'whatsapp')),
  preferred_technician_id uuid,
  special_instructions text,
  
  -- Status
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create equipment_catalog table
CREATE TABLE public.equipment_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer varchar(255) NOT NULL,
  model_number varchar(255) NOT NULL,
  equipment_category varchar(100) NOT NULL CHECK (equipment_category IN ('chiller', 'ahu', 'fan_coil', 'vrf', 'package_unit', 'boiler', 'cooling_tower', 'pump', 'split_system', 'mini_split', 'heat_pump', 'erv')),
  equipment_subcategory varchar(100),
  
  -- Capacity
  cooling_capacity_kw numeric,
  cooling_capacity_tons numeric,
  heating_capacity_kw numeric,
  
  -- Efficiency
  cop numeric,
  eer numeric,
  seer numeric,
  iplv numeric,
  
  -- Electrical
  power_input_kw numeric,
  voltage varchar(50),
  phases integer,
  full_load_amps numeric,
  
  -- Physical
  dimensions jsonb,
  weight_kg numeric,
  
  -- Airflow
  airflow_min_l_s numeric,
  airflow_max_l_s numeric,
  airflow_rated_l_s numeric,
  external_static_pressure_pa numeric,
  
  -- Waterflow
  waterflow_l_s numeric,
  pressure_drop_kpa numeric,
  
  -- Refrigerant
  refrigerant_type varchar(50),
  refrigerant_charge_kg numeric,
  
  -- Noise
  sound_power_level_db numeric,
  sound_pressure_level_db numeric,
  
  -- Saudi Certifications
  saso_certified boolean DEFAULT false,
  saso_certificate_number varchar(100),
  energy_rating_stars integer CHECK (energy_rating_stars BETWEEN 1 AND 5),
  sec_approved boolean DEFAULT false,
  ashrae_compliant boolean DEFAULT false,
  
  -- Pricing
  list_price_sar numeric,
  lead_time_weeks numeric,
  
  -- Documentation
  datasheet_url text,
  submittal_url text,
  iom_manual_url text,
  
  -- Operating conditions
  operating_range_cooling jsonb,
  operating_range_heating jsonb,
  
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create load_calculations table
CREATE TABLE public.load_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  building_id uuid REFERENCES public.buildings(id) ON DELETE SET NULL,
  
  calculation_name varchar(255) NOT NULL,
  calculation_type varchar(50) DEFAULT 'manual' CHECK (calculation_type IN ('manual', 'ashrae', 'carrier_hap', 'trane_trace')),
  
  -- Building inputs
  area_sqft numeric NOT NULL,
  ceiling_height_ft numeric NOT NULL,
  building_type varchar(100),
  
  -- Envelope parameters
  wall_r_value numeric,
  roof_r_value numeric,
  window_u_factor numeric,
  window_shgc numeric,
  window_to_wall_ratio numeric,
  
  -- Internal loads
  occupant_count integer,
  lighting_power_density numeric,
  equipment_power_density numeric,
  
  -- Design conditions
  outdoor_temp_summer_f numeric,
  outdoor_temp_winter_f numeric,
  indoor_temp_summer_f numeric,
  indoor_temp_winter_f numeric,
  outdoor_humidity_summer numeric,
  indoor_humidity_target numeric,
  
  -- Results
  cooling_load_btuh numeric,
  heating_load_btuh numeric,
  cooling_load_tons numeric,
  cfm_required numeric,
  
  -- Load breakdown
  load_breakdown jsonb,
  
  -- Metadata
  status varchar(50) DEFAULT 'draft' CHECK (status IN ('draft', 'calculating', 'completed', 'approved')),
  notes text,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid
);

-- Add customer_id to work_orders
ALTER TABLE public.work_orders ADD COLUMN customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX idx_customers_org ON public.customers(organization_id);
CREATE INDEX idx_customers_number ON public.customers(customer_number);
CREATE UNIQUE INDEX idx_customers_org_number ON public.customers(organization_id, customer_number);
CREATE INDEX idx_equipment_catalog_manufacturer ON public.equipment_catalog(manufacturer);
CREATE INDEX idx_equipment_catalog_category ON public.equipment_catalog(equipment_category);
CREATE INDEX idx_load_calculations_org ON public.load_calculations(organization_id);
CREATE INDEX idx_load_calculations_project ON public.load_calculations(project_id);

-- Add updated_at triggers
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipment_catalog_updated_at
  BEFORE UPDATE ON public.equipment_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_load_calculations_updated_at
  BEFORE UPDATE ON public.load_calculations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_calculations ENABLE ROW LEVEL SECURITY;

-- Customers RLS policies
CREATE POLICY "Users can view customers in their org"
  ON public.customers FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Technicians+ can create customers"
  ON public.customers FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'engineer', 'technician')
  ));

CREATE POLICY "Technicians+ can update customers"
  ON public.customers FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'engineer', 'technician')
  ));

CREATE POLICY "Admins can delete customers"
  ON public.customers FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Equipment Catalog RLS policies (reference data - read for all authenticated, write for admins)
CREATE POLICY "Authenticated users can view equipment catalog"
  ON public.equipment_catalog FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage equipment catalog"
  ON public.equipment_catalog FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Load Calculations RLS policies
CREATE POLICY "Users can view load calculations in their org"
  ON public.load_calculations FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Engineers+ can create load calculations"
  ON public.load_calculations FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')
  ));

CREATE POLICY "Engineers+ can update load calculations"
  ON public.load_calculations FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')
  ));

CREATE POLICY "Admins can delete load calculations"
  ON public.load_calculations FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));