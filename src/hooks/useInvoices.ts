import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization, useProfile } from './useOrganization';
import { toast } from 'sonner';

export interface InvoiceLineItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  vat_rate?: number;
  line_total: number;
  equipment_id?: string;
  pm_schedule_id?: string;
  sort_order?: number;
}

export interface Invoice {
  id: string;
  organization_id: string;
  customer_id: string | null;
  work_order_id: string | null;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  discount_amount: number;
  discount_percent: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  zatca_submission_status: string;
  notes: string | null;
  terms: string | null;
  payment_method: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    company_name: string | null;
    contact_name: string;
    contact_email: string | null;
    contact_phone: string;
  };
  work_order?: {
    id: string;
    title: string;
  };
  line_items?: InvoiceLineItem[];
}

export interface CreateInvoiceInput {
  customer_id?: string;
  work_order_id?: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status?: string;
  subtotal: number;
  discount_amount?: number;
  discount_percent?: number;
  vat_rate?: number;
  vat_amount: number;
  total_amount: number;
  notes?: string;
  terms?: string;
  payment_method?: string;
  line_items: InvoiceLineItem[];
}

export interface UpdateInvoiceInput extends Partial<CreateInvoiceInput> {
  id: string;
  amount_paid?: number;
}

export function useInvoices() {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['invoices', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(id, company_name, contact_name, contact_email, contact_phone),
          work_order:work_orders(id, title)
        `)
        .eq('organization_id', organization.id)
        .order('invoice_date', { ascending: false });

      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!organization?.id,
  });
}

export function useInvoice(id: string | undefined) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      if (!id) return null;

      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(id, company_name, contact_name, contact_email, contact_phone),
          work_order:work_orders(id, title)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!invoice) return null;

      // Fetch line items
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', id)
        .order('sort_order');

      if (lineItemsError) throw lineItemsError;

      return { ...invoice, line_items: lineItems } as Invoice;
    },
    enabled: !!id && !!organization?.id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (input: CreateInvoiceInput) => {
      if (!organization?.id) throw new Error('No organization');

      const { line_items, ...invoiceData } = input;

      // Create invoice
      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert({
          ...invoiceData,
          organization_id: organization.id,
          created_by: profile?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Create line items
      if (line_items.length > 0) {
        const { error: lineItemsError } = await supabase
          .from('invoice_line_items')
          .insert(
            line_items.map((item, index) => ({
              invoice_id: invoice.id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              discount_percent: item.discount_percent || 0,
              vat_rate: item.vat_rate || 15,
              line_total: item.line_total,
              equipment_id: item.equipment_id,
              pm_schedule_id: item.pm_schedule_id,
              sort_order: index,
            }))
          );

        if (lineItemsError) throw lineItemsError;
      }

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create invoice: ' + error.message);
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, line_items, ...invoiceData }: UpdateInvoiceInput) => {
      const { data, error } = await supabase
        .from('invoices')
        .update(invoiceData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update line items if provided
      if (line_items) {
        // Delete existing line items
        await supabase.from('invoice_line_items').delete().eq('invoice_id', id);

        // Insert new line items
        if (line_items.length > 0) {
          const { error: lineItemsError } = await supabase
            .from('invoice_line_items')
            .insert(
              line_items.map((item, index) => ({
                invoice_id: id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                discount_percent: item.discount_percent || 0,
                vat_rate: item.vat_rate || 15,
                line_total: item.line_total,
                equipment_id: item.equipment_id,
                pm_schedule_id: item.pm_schedule_id,
                sort_order: index,
              }))
            );

          if (lineItemsError) throw lineItemsError;
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update invoice: ' + error.message);
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete invoice: ' + error.message);
    },
  });
}

export function useNextInvoiceNumber() {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['next-invoice-number', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return 'INV-0001';

      const { data, error } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        return 'INV-0001';
      }

      const lastNumber = data[0].invoice_number;
      const match = lastNumber.match(/INV-(\d+)/);
      if (match) {
        const nextNum = parseInt(match[1], 10) + 1;
        return `INV-${nextNum.toString().padStart(4, '0')}`;
      }

      return 'INV-0001';
    },
    enabled: !!organization?.id,
  });
}
