import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization, useProfile } from './useOrganization';
import { toast } from 'sonner';

export type PaymentMethod = 'mada' | 'sadad' | 'bank_transfer' | 'cash' | 'credit_card' | 'stc_pay' | 'apple_pay';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';

export interface Payment {
  id: string;
  organization_id: string;
  invoice_id: string;
  customer_id: string | null;
  payment_number: string;
  payment_date: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  bank_name: string | null;
  bank_account_number: string | null;
  card_last_four: string | null;
  sadad_bill_number: string | null;
  sadad_payment_number: string | null;
  transaction_reference: string | null;
  authorization_code: string | null;
  status: PaymentStatus;
  refund_amount: number;
  refund_date: string | null;
  refund_reason: string | null;
  notes: string | null;
  receipt_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  invoice?: {
    id: string;
    invoice_number: string;
    total_amount: number;
  };
  customer?: {
    id: string;
    company_name: string | null;
    contact_name: string;
  };
}

export interface CreatePaymentInput {
  invoice_id: string;
  customer_id?: string;
  payment_number: string;
  payment_date?: string;
  amount: number;
  currency?: string;
  payment_method: PaymentMethod;
  bank_name?: string;
  bank_account_number?: string;
  card_last_four?: string;
  sadad_bill_number?: string;
  sadad_payment_number?: string;
  transaction_reference?: string;
  authorization_code?: string;
  status?: PaymentStatus;
  notes?: string;
  receipt_url?: string;
}

export function usePayments(invoiceId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['payments', organization?.id, invoiceId],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('payments')
        .select(`
          *,
          invoice:invoices(id, invoice_number, total_amount),
          customer:customers(id, company_name, contact_name)
        `)
        .eq('organization_id', organization.id)
        .order('payment_date', { ascending: false });

      if (invoiceId) {
        query = query.eq('invoice_id', invoiceId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!organization?.id,
  });
}

export function usePayment(id: string | undefined) {
  return useQuery({
    queryKey: ['payment', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          invoice:invoices(id, invoice_number, total_amount),
          customer:customers(id, company_name, contact_name)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Payment | null;
    },
    enabled: !!id,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (input: CreatePaymentInput) => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase
        .from('payments')
        .insert({
          ...input,
          organization_id: organization.id,
          created_by: profile?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update invoice amount_paid and balance_due
      const { data: invoicePayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('invoice_id', input.invoice_id)
        .eq('status', 'completed');

      if (invoicePayments) {
        const totalPaid = invoicePayments.reduce((sum, p) => sum + Number(p.amount), 0);
        
        const { data: invoice } = await supabase
          .from('invoices')
          .select('total_amount')
          .eq('id', input.invoice_id)
          .single();

        if (invoice) {
          const balanceDue = Number(invoice.total_amount) - totalPaid;
          await supabase
            .from('invoices')
            .update({
              amount_paid: totalPaid,
              balance_due: balanceDue,
              status: balanceDue <= 0 ? 'paid' : 'sent',
            })
            .eq('id', input.invoice_id);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Payment recorded successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to record payment: ' + error.message);
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreatePaymentInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('payments')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Payment updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update payment: ' + error.message);
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('payments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Payment deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete payment: ' + error.message);
    },
  });
}

export function useNextPaymentNumber() {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['next-payment-number', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return 'PAY-0001';

      const { data, error } = await supabase
        .from('payments')
        .select('payment_number')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        return 'PAY-0001';
      }

      const lastNumber = data[0].payment_number;
      const match = lastNumber.match(/PAY-(\d+)/);
      if (match) {
        const nextNum = parseInt(match[1], 10) + 1;
        return `PAY-${nextNum.toString().padStart(4, '0')}`;
      }

      return 'PAY-0001';
    },
    enabled: !!organization?.id,
  });
}

// Helper to get payment method labels in Arabic/English
export function getPaymentMethodLabel(method: PaymentMethod, isArabic: boolean = false): string {
  const labels: Record<PaymentMethod, { en: string; ar: string }> = {
    mada: { en: 'mada Card', ar: 'بطاقة مدى' },
    sadad: { en: 'SADAD', ar: 'سداد' },
    bank_transfer: { en: 'Bank Transfer', ar: 'تحويل بنكي' },
    cash: { en: 'Cash', ar: 'نقدي' },
    credit_card: { en: 'Credit Card', ar: 'بطاقة ائتمان' },
    stc_pay: { en: 'STC Pay', ar: 'STC Pay' },
    apple_pay: { en: 'Apple Pay', ar: 'Apple Pay' },
  };
  return isArabic ? labels[method].ar : labels[method].en;
}
