-- Create service_contracts table
CREATE TABLE public.service_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  
  -- Contract details
  contract_number VARCHAR NOT NULL,
  contract_name VARCHAR NOT NULL,
  contract_type VARCHAR NOT NULL DEFAULT 'standard',
  status VARCHAR NOT NULL DEFAULT 'active',
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  renewal_date DATE,
  auto_renew BOOLEAN DEFAULT false,
  
  -- Coverage
  coverage_type VARCHAR NOT NULL DEFAULT 'full',
  coverage_description TEXT,
  included_equipment TEXT[],
  excluded_equipment TEXT[],
  
  -- SLA Fields
  response_time_hours INTEGER DEFAULT 24,
  resolution_time_hours INTEGER DEFAULT 72,
  sla_priority VARCHAR DEFAULT 'standard',
  after_hours_support BOOLEAN DEFAULT false,
  weekend_support BOOLEAN DEFAULT false,
  
  -- Financials
  contract_value_sar NUMERIC(12,2) NOT NULL DEFAULT 0,
  billing_frequency VARCHAR DEFAULT 'annual',
  payment_terms VARCHAR DEFAULT 'net_30',
  
  -- PM Schedule integration
  pm_visits_per_year INTEGER DEFAULT 4,
  pm_visits_completed INTEGER DEFAULT 0,
  next_pm_visit DATE,
  
  -- Notes
  notes TEXT,
  special_terms TEXT,
  
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contract_equipment junction table (for many-to-many)
CREATE TABLE public.contract_equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.service_contracts(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  coverage_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contract_id, equipment_id)
);

-- Create contract_pm_schedules junction table
CREATE TABLE public.contract_pm_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.service_contracts(id) ON DELETE CASCADE,
  pm_schedule_id UUID NOT NULL REFERENCES public.pm_schedules(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contract_id, pm_schedule_id)
);

-- Create contract_renewals history table
CREATE TABLE public.contract_renewals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.service_contracts(id) ON DELETE CASCADE,
  previous_end_date DATE NOT NULL,
  new_end_date DATE NOT NULL,
  previous_value_sar NUMERIC(12,2),
  new_value_sar NUMERIC(12,2),
  renewed_by UUID REFERENCES public.profiles(id),
  renewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.service_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_pm_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_renewals ENABLE ROW LEVEL SECURITY;

-- Service contracts RLS policies
CREATE POLICY "Users can view service contracts in their org" ON public.service_contracts
FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Engineers+ can create service contracts" ON public.service_contracts
FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')
  )
);

CREATE POLICY "Engineers+ can update service contracts" ON public.service_contracts
FOR UPDATE USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')
  )
);

CREATE POLICY "Admins can delete service contracts" ON public.service_contracts
FOR DELETE USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Contract equipment RLS policies
CREATE POLICY "Users can view contract equipment" ON public.contract_equipment
FOR SELECT USING (
  contract_id IN (
    SELECT id FROM service_contracts WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Engineers+ can manage contract equipment" ON public.contract_equipment
FOR ALL USING (
  contract_id IN (
    SELECT id FROM service_contracts WHERE organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')
    )
  )
);

-- Contract PM schedules RLS policies
CREATE POLICY "Users can view contract PM schedules" ON public.contract_pm_schedules
FOR SELECT USING (
  contract_id IN (
    SELECT id FROM service_contracts WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Engineers+ can manage contract PM schedules" ON public.contract_pm_schedules
FOR ALL USING (
  contract_id IN (
    SELECT id FROM service_contracts WHERE organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')
    )
  )
);

-- Contract renewals RLS policies
CREATE POLICY "Users can view contract renewals" ON public.contract_renewals
FOR SELECT USING (
  contract_id IN (
    SELECT id FROM service_contracts WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Engineers+ can create contract renewals" ON public.contract_renewals
FOR INSERT WITH CHECK (
  contract_id IN (
    SELECT id FROM service_contracts WHERE organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')
    )
  )
);

-- Create indexes for performance
CREATE INDEX idx_service_contracts_org ON public.service_contracts(organization_id);
CREATE INDEX idx_service_contracts_customer ON public.service_contracts(customer_id);
CREATE INDEX idx_service_contracts_status ON public.service_contracts(status);
CREATE INDEX idx_service_contracts_end_date ON public.service_contracts(end_date);
CREATE INDEX idx_service_contracts_renewal ON public.service_contracts(renewal_date);
CREATE INDEX idx_contract_equipment_contract ON public.contract_equipment(contract_id);
CREATE INDEX idx_contract_pm_schedules_contract ON public.contract_pm_schedules(contract_id);

-- Add trigger for updated_at
CREATE TRIGGER update_service_contracts_updated_at
BEFORE UPDATE ON public.service_contracts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update recurring_invoices to reference service_contracts
ALTER TABLE public.recurring_invoices
ADD CONSTRAINT recurring_invoices_service_contract_id_fkey
FOREIGN KEY (service_contract_id) REFERENCES public.service_contracts(id) ON DELETE SET NULL;