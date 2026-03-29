-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
  
  -- Invoice details
  invoice_number VARCHAR NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'draft',
  
  -- Amounts (SAR)
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  vat_rate NUMERIC(5,2) DEFAULT 15,
  vat_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) DEFAULT 0,
  balance_due NUMERIC(12,2) GENERATED ALWAYS AS (total_amount - COALESCE(amount_paid, 0)) STORED,
  
  -- ZATCA E-Invoicing fields
  zatca_uuid UUID,
  zatca_invoice_hash VARCHAR,
  zatca_qr_code TEXT,
  zatca_submission_status VARCHAR DEFAULT 'pending',
  zatca_clearance_status VARCHAR,
  zatca_reported_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional info
  notes TEXT,
  terms TEXT,
  payment_method VARCHAR,
  currency VARCHAR DEFAULT 'SAR',
  
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice line items table
CREATE TABLE public.invoice_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  vat_rate NUMERIC(5,2) DEFAULT 15,
  line_total NUMERIC(12,2) NOT NULL,
  
  -- Optional linking
  equipment_id UUID REFERENCES public.equipment(id),
  pm_schedule_id UUID REFERENCES public.pm_schedules(id),
  
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment plans table
CREATE TABLE public.payment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  
  installment_number INTEGER NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_reference VARCHAR,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create recurring invoices table
CREATE TABLE public.recurring_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  service_contract_id UUID,
  
  -- Template info
  template_name VARCHAR NOT NULL,
  description TEXT,
  
  -- Recurring schedule
  frequency_type VARCHAR NOT NULL DEFAULT 'monthly',
  frequency_value INTEGER NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE,
  next_invoice_date DATE,
  
  -- Invoice template amounts
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5,2) DEFAULT 15,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_generated_at TIMESTAMP WITH TIME ZONE,
  invoices_generated INTEGER DEFAULT 0,
  
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create recurring invoice line items table
CREATE TABLE public.recurring_invoice_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recurring_invoice_id UUID NOT NULL REFERENCES public.recurring_invoices(id) ON DELETE CASCADE,
  
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  vat_rate NUMERIC(5,2) DEFAULT 15,
  line_total NUMERIC(12,2) NOT NULL,
  
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_invoice_line_items ENABLE ROW LEVEL SECURITY;

-- Invoices RLS policies
CREATE POLICY "Users can view invoices in their org" ON public.invoices
FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Technicians+ can create invoices" ON public.invoices
FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'engineer', 'technician')
  )
);

CREATE POLICY "Technicians+ can update invoices" ON public.invoices
FOR UPDATE USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'engineer', 'technician')
  )
);

CREATE POLICY "Admins can delete invoices" ON public.invoices
FOR DELETE USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Invoice line items RLS policies
CREATE POLICY "Users can view line items" ON public.invoice_line_items
FOR SELECT USING (
  invoice_id IN (
    SELECT id FROM invoices WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Technicians+ can manage line items" ON public.invoice_line_items
FOR ALL USING (
  invoice_id IN (
    SELECT id FROM invoices WHERE organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'engineer', 'technician')
    )
  )
);

-- Payment plans RLS policies
CREATE POLICY "Users can view payment plans" ON public.payment_plans
FOR SELECT USING (
  invoice_id IN (
    SELECT id FROM invoices WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Technicians+ can manage payment plans" ON public.payment_plans
FOR ALL USING (
  invoice_id IN (
    SELECT id FROM invoices WHERE organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'engineer', 'technician')
    )
  )
);

-- Recurring invoices RLS policies
CREATE POLICY "Users can view recurring invoices in their org" ON public.recurring_invoices
FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Engineers+ can create recurring invoices" ON public.recurring_invoices
FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')
  )
);

CREATE POLICY "Engineers+ can update recurring invoices" ON public.recurring_invoices
FOR UPDATE USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')
  )
);

CREATE POLICY "Admins can delete recurring invoices" ON public.recurring_invoices
FOR DELETE USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Recurring invoice line items RLS policies
CREATE POLICY "Users can view recurring line items" ON public.recurring_invoice_line_items
FOR SELECT USING (
  recurring_invoice_id IN (
    SELECT id FROM recurring_invoices WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Engineers+ can manage recurring line items" ON public.recurring_invoice_line_items
FOR ALL USING (
  recurring_invoice_id IN (
    SELECT id FROM recurring_invoices WHERE organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')
    )
  )
);

-- Create indexes for performance
CREATE INDEX idx_invoices_org ON public.invoices(organization_id);
CREATE INDEX idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_date ON public.invoices(invoice_date);
CREATE INDEX idx_invoice_line_items_invoice ON public.invoice_line_items(invoice_id);
CREATE INDEX idx_payment_plans_invoice ON public.payment_plans(invoice_id);
CREATE INDEX idx_recurring_invoices_org ON public.recurring_invoices(organization_id);
CREATE INDEX idx_recurring_invoices_next_date ON public.recurring_invoices(next_invoice_date);

-- Add triggers for updated_at
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_plans_updated_at
BEFORE UPDATE ON public.payment_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recurring_invoices_updated_at
BEFORE UPDATE ON public.recurring_invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();