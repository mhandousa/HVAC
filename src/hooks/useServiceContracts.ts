import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization, useProfile } from './useOrganization';
import { toast } from 'sonner';

export interface ServiceContract {
  id: string;
  organization_id: string;
  customer_id: string;
  project_id: string | null;
  contract_number: string;
  contract_name: string;
  contract_type: string;
  status: string;
  start_date: string;
  end_date: string;
  renewal_date: string | null;
  auto_renew: boolean;
  coverage_type: string;
  coverage_description: string | null;
  response_time_hours: number;
  resolution_time_hours: number;
  sla_priority: string;
  after_hours_support: boolean;
  weekend_support: boolean;
  contract_value_sar: number;
  billing_frequency: string;
  payment_terms: string;
  pm_visits_per_year: number;
  pm_visits_completed: number;
  next_pm_visit: string | null;
  notes: string | null;
  special_terms: string | null;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    company_name: string | null;
    contact_name: string;
    contact_phone: string;
  };
}

export interface CreateContractInput {
  customer_id: string;
  project_id?: string;
  contract_number: string;
  contract_name: string;
  contract_type?: string;
  start_date: string;
  end_date: string;
  renewal_date?: string;
  auto_renew?: boolean;
  coverage_type?: string;
  coverage_description?: string;
  response_time_hours?: number;
  resolution_time_hours?: number;
  sla_priority?: string;
  after_hours_support?: boolean;
  weekend_support?: boolean;
  contract_value_sar: number;
  billing_frequency?: string;
  payment_terms?: string;
  pm_visits_per_year?: number;
  notes?: string;
  special_terms?: string;
}

export function useServiceContracts(customerId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['service-contracts', organization?.id, customerId],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('service_contracts')
        .select(`
          *,
          customer:customers(id, company_name, contact_name, contact_phone)
        `)
        .eq('organization_id', organization.id)
        .order('end_date', { ascending: true });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ServiceContract[];
    },
    enabled: !!organization?.id,
  });
}

export function useServiceContract(id: string | undefined) {
  return useQuery({
    queryKey: ['service-contract', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('service_contracts')
        .select(`
          *,
          customer:customers(id, company_name, contact_name, contact_phone)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as ServiceContract | null;
    },
    enabled: !!id,
  });
}

export function useCreateServiceContract() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (input: CreateContractInput) => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase
        .from('service_contracts')
        .insert({
          ...input,
          organization_id: organization.id,
          created_by: profile?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-contracts'] });
      toast.success('Service contract created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create contract: ' + error.message);
    },
  });
}

export function useUpdateServiceContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateContractInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('service_contracts')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-contracts'] });
      toast.success('Service contract updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update contract: ' + error.message);
    },
  });
}

export function useDeleteServiceContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('service_contracts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-contracts'] });
      toast.success('Service contract deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete contract: ' + error.message);
    },
  });
}

export function useRenewContract() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async ({ 
      contractId, 
      newEndDate, 
      newValue 
    }: { 
      contractId: string; 
      newEndDate: string; 
      newValue?: number;
    }) => {
      // Get current contract
      const { data: contract, error: fetchError } = await supabase
        .from('service_contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (fetchError) throw fetchError;

      // Create renewal record
      const { error: renewalError } = await supabase
        .from('contract_renewals')
        .insert({
          contract_id: contractId,
          previous_end_date: contract.end_date,
          new_end_date: newEndDate,
          previous_value_sar: contract.contract_value_sar,
          new_value_sar: newValue || contract.contract_value_sar,
          renewed_by: profile?.id,
        });

      if (renewalError) throw renewalError;

      // Update contract
      const { data, error } = await supabase
        .from('service_contracts')
        .update({
          end_date: newEndDate,
          renewal_date: newEndDate,
          contract_value_sar: newValue || contract.contract_value_sar,
          pm_visits_completed: 0, // Reset PM visits for new period
        })
        .eq('id', contractId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-contracts'] });
      toast.success('Contract renewed successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to renew contract: ' + error.message);
    },
  });
}

export function useExpiringContracts(daysAhead: number = 30) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['expiring-contracts', organization?.id, daysAhead],
    queryFn: async () => {
      if (!organization?.id) return [];

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const { data, error } = await supabase
        .from('service_contracts')
        .select(`
          *,
          customer:customers(id, company_name, contact_name, contact_phone)
        `)
        .eq('organization_id', organization.id)
        .eq('status', 'active')
        .lte('end_date', futureDate.toISOString().split('T')[0])
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('end_date', { ascending: true });

      if (error) throw error;
      return data as ServiceContract[];
    },
    enabled: !!organization?.id,
  });
}

export function useNextContractNumber() {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['next-contract-number', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return 'SC-0001';

      const { data, error } = await supabase
        .from('service_contracts')
        .select('contract_number')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        return 'SC-0001';
      }

      const lastNumber = data[0].contract_number;
      const match = lastNumber.match(/SC-(\d+)/);
      if (match) {
        const nextNum = parseInt(match[1], 10) + 1;
        return `SC-${nextNum.toString().padStart(4, '0')}`;
      }

      return 'SC-0001';
    },
    enabled: !!organization?.id,
  });
}

export function useProjectServiceContracts(projectId: string | undefined) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['project-service-contracts', organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id || !projectId) return [];

      const { data, error } = await supabase
        .from('service_contracts')
        .select(`
          *,
          customer:customers(id, company_name, contact_name, contact_phone)
        `)
        .eq('organization_id', organization.id)
        .eq('project_id', projectId)
        .order('end_date', { ascending: true });

      if (error) throw error;
      return data as ServiceContract[];
    },
    enabled: !!organization?.id && !!projectId,
  });
}

export function useLinkContractToProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contractId, projectId }: { contractId: string; projectId: string | null }) => {
      const { data, error } = await supabase
        .from('service_contracts')
        .update({ project_id: projectId })
        .eq('id', contractId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-contracts'] });
      queryClient.invalidateQueries({ queryKey: ['project-service-contracts'] });
      toast.success('Contract updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update contract: ' + error.message);
    },
  });
}
