import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useOrganization';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Customer = Tables<'customers'>;
export type CustomerInsert = TablesInsert<'customers'>;
export type CustomerUpdate = TablesUpdate<'customers'>;

export function useCustomers(options?: { isActive?: boolean; customerType?: string }) {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['customers', profile?.organization_id, options],
    queryFn: async () => {
      if (!profile?.organization_id) return [];

      let query = supabase
        .from('customers')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('company_name', { ascending: true });

      if (options?.isActive !== undefined) {
        query = query.eq('is_active', options.isActive);
      }

      if (options?.customerType) {
        query = query.eq('customer_type', options.customerType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!profile?.organization_id,
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Customer | null;
    },
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (customer: Omit<CustomerInsert, 'organization_id'>) => {
      if (!profile?.organization_id) throw new Error('No organization');

      const { data, error } = await supabase
        .from('customers')
        .insert({
          ...customer,
          organization_id: profile.organization_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create customer');
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CustomerUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Customer;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', data.id] });
      toast.success('Customer updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update customer');
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete customer');
    },
  });
}
