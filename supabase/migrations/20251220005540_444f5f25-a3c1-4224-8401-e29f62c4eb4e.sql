-- Create payments table for tracking invoice payments
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  
  -- Payment details
  payment_number VARCHAR NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL,
  currency VARCHAR DEFAULT 'SAR',
  
  -- Saudi payment methods: mada, sadad, bank_transfer, cash, credit_card, stc_pay, apple_pay
  payment_method VARCHAR NOT NULL DEFAULT 'bank_transfer',
  
  -- Bank/Card details
  bank_name VARCHAR,
  bank_account_number VARCHAR,
  card_last_four VARCHAR(4),
  sadad_bill_number VARCHAR,
  sadad_payment_number VARCHAR,
  
  -- Transaction references
  transaction_reference VARCHAR,
  authorization_code VARCHAR,
  
  -- Status: pending, completed, failed, refunded, partially_refunded
  status VARCHAR NOT NULL DEFAULT 'completed',
  
  -- Refund tracking
  refund_amount NUMERIC DEFAULT 0,
  refund_date DATE,
  refund_reason TEXT,
  
  -- Metadata
  notes TEXT,
  receipt_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_payments_organization_id ON public.payments(organization_id);
CREATE INDEX idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX idx_payments_customer_id ON public.payments(customer_id);
CREATE INDEX idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX idx_payments_payment_method ON public.payments(payment_method);
CREATE INDEX idx_payments_status ON public.payments(status);

-- RLS Policies
CREATE POLICY "Users can view payments in their org"
  ON public.payments FOR SELECT
  USING (organization_id IN (
    SELECT profiles.organization_id FROM profiles WHERE profiles.user_id = auth.uid()
  ));

CREATE POLICY "Technicians+ can create payments"
  ON public.payments FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT profiles.organization_id FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'engineer', 'technician')
  ));

CREATE POLICY "Technicians+ can update payments"
  ON public.payments FOR UPDATE
  USING (organization_id IN (
    SELECT profiles.organization_id FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'engineer', 'technician')
  ));

CREATE POLICY "Admins can delete payments"
  ON public.payments FOR DELETE
  USING (organization_id IN (
    SELECT profiles.organization_id FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  ));

-- Trigger for updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();