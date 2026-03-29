import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization, useProfile } from './useOrganization';
import { toast } from 'sonner';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

export interface RecurringInvoiceLineItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate?: number;
  line_total: number;
  sort_order?: number;
}

export interface RecurringInvoice {
  id: string;
  organization_id: string;
  customer_id: string | null;
  service_contract_id: string | null;
  template_name: string;
  description: string | null;
  frequency_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  frequency_value: number;
  start_date: string;
  end_date: string | null;
  next_invoice_date: string | null;
  subtotal: number;
  vat_rate: number;
  total_amount: number;
  is_active: boolean;
  last_generated_at: string | null;
  invoices_generated: number;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    company_name: string | null;
    contact_name: string;
  };
  service_contract?: {
    id: string;
    contract_name: string;
  };
  line_items?: RecurringInvoiceLineItem[];
}

export interface CreateRecurringInvoiceInput {
  customer_id?: string;
  service_contract_id?: string;
  template_name: string;
  description?: string;
  frequency_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  frequency_value: number;
  start_date: string;
  end_date?: string;
  subtotal: number;
  vat_rate?: number;
  total_amount: number;
  line_items: RecurringInvoiceLineItem[];
}

export interface UpdateRecurringInvoiceInput extends Partial<CreateRecurringInvoiceInput> {
  id: string;
  is_active?: boolean;
}

// Calculate next invoice date based on frequency
export function calculateNextInvoiceDate(
  startDate: string,
  frequencyType: string,
  frequencyValue: number
): Date {
  const start = new Date(startDate);
  
  switch (frequencyType) {
    case 'daily':
      return addDays(start, frequencyValue);
    case 'weekly':
      return addWeeks(start, frequencyValue);
    case 'monthly':
      return addMonths(start, frequencyValue);
    case 'quarterly':
      return addMonths(start, frequencyValue * 3);
    case 'yearly':
      return addYears(start, frequencyValue);
    default:
      return addMonths(start, 1);
  }
}

export function useRecurringInvoices() {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['recurring-invoices', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('recurring_invoices')
        .select(`
          *,
          customer:customers(id, company_name, contact_name),
          service_contract:service_contracts(id, contract_name)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RecurringInvoice[];
    },
    enabled: !!organization?.id,
  });
}

export function useRecurringInvoice(id: string | undefined) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['recurring-invoice', id],
    queryFn: async () => {
      if (!id) return null;

      const { data: recurringInvoice, error } = await supabase
        .from('recurring_invoices')
        .select(`
          *,
          customer:customers(id, company_name, contact_name),
          service_contract:service_contracts(id, contract_name)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!recurringInvoice) return null;

      // Fetch line items
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('recurring_invoice_line_items')
        .select('*')
        .eq('recurring_invoice_id', id)
        .order('sort_order');

      if (lineItemsError) throw lineItemsError;

      return { ...recurringInvoice, line_items: lineItems } as RecurringInvoice;
    },
    enabled: !!id && !!organization?.id,
  });
}

export function useCreateRecurringInvoice() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (input: CreateRecurringInvoiceInput) => {
      if (!organization?.id) throw new Error('No organization');

      const { line_items, ...invoiceData } = input;
      
      // Calculate next invoice date
      const nextInvoiceDate = calculateNextInvoiceDate(
        input.start_date,
        input.frequency_type,
        input.frequency_value
      );

      // Create recurring invoice
      const { data: recurringInvoice, error } = await supabase
        .from('recurring_invoices')
        .insert({
          template_name: invoiceData.template_name,
          description: invoiceData.description,
          frequency_type: invoiceData.frequency_type,
          frequency_value: invoiceData.frequency_value,
          start_date: invoiceData.start_date,
          end_date: invoiceData.end_date,
          subtotal: invoiceData.subtotal,
          vat_rate: invoiceData.vat_rate || 15,
          total_amount: invoiceData.total_amount,
          customer_id: invoiceData.customer_id || null,
          service_contract_id: invoiceData.service_contract_id || null,
          organization_id: organization.id,
          next_invoice_date: nextInvoiceDate.toISOString().split('T')[0],
          is_active: true,
          invoices_generated: 0,
          created_by: profile?.id,
        })
        .select()
        .single();

      if (error) throw error;

      if (error) throw error;

      // Create line items
      if (line_items.length > 0) {
        const { error: lineItemsError } = await supabase
          .from('recurring_invoice_line_items')
          .insert(
            line_items.map((item, index) => ({
              recurring_invoice_id: recurringInvoice.id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              vat_rate: item.vat_rate || 15,
              line_total: item.line_total,
              sort_order: index,
            }))
          );

        if (lineItemsError) throw lineItemsError;
      }

      return recurringInvoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
      toast.success('Recurring invoice created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create recurring invoice: ' + error.message);
    },
  });
}

export function useUpdateRecurringInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, line_items, ...invoiceData }: UpdateRecurringInvoiceInput) => {
      // If start_date or frequency changed, recalculate next_invoice_date
      let updateData: Record<string, unknown> = { ...invoiceData };
      
      if (invoiceData.start_date && invoiceData.frequency_type && invoiceData.frequency_value) {
        const nextInvoiceDate = calculateNextInvoiceDate(
          invoiceData.start_date,
          invoiceData.frequency_type,
          invoiceData.frequency_value
        );
        updateData.next_invoice_date = nextInvoiceDate.toISOString().split('T')[0];
      }

      const { data, error } = await supabase
        .from('recurring_invoices')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update line items if provided
      if (line_items) {
        // Delete existing line items
        await supabase.from('recurring_invoice_line_items').delete().eq('recurring_invoice_id', id);

        // Insert new line items
        if (line_items.length > 0) {
          const { error: lineItemsError } = await supabase
            .from('recurring_invoice_line_items')
            .insert(
              line_items.map((item, index) => ({
                recurring_invoice_id: id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                vat_rate: item.vat_rate || 15,
                line_total: item.line_total,
                sort_order: index,
              }))
            );

          if (lineItemsError) throw lineItemsError;
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-invoice'] });
      toast.success('Recurring invoice updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update recurring invoice: ' + error.message);
    },
  });
}

export function useDeleteRecurringInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recurring_invoices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
      toast.success('Recurring invoice deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete recurring invoice: ' + error.message);
    },
  });
}

export function useToggleRecurringInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('recurring_invoices')
        .update({ is_active: isActive })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
      toast.success(isActive ? 'Recurring invoice activated' : 'Recurring invoice paused');
    },
    onError: (error: Error) => {
      toast.error('Failed to update status: ' + error.message);
    },
  });
}

export function getFrequencyLabel(type: string, value: number): string {
  if (value === 1) {
    switch (type) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'yearly': return 'Yearly';
      default: return type;
    }
  }
  
  switch (type) {
    case 'daily': return `Every ${value} days`;
    case 'weekly': return `Every ${value} weeks`;
    case 'monthly': return `Every ${value} months`;
    case 'quarterly': return `Every ${value * 3} months`;
    case 'yearly': return `Every ${value} years`;
    default: return `${value} ${type}`;
  }
}
