import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjectCustomer {
  id: string;
  project_id: string;
  customer_id: string;
  created_at: string;
  created_by: string | null;
}

export function useProjectCustomers(projectId?: string) {
  return useQuery({
    queryKey: ['project-customers', projectId],
    queryFn: async () => {
      let query = supabase
        .from('project_customers')
        .select(`
          *,
          customer:customers(id, customer_number, contact_name, company_name, customer_type)
        `)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useCustomerProjects(customerId?: string) {
  return useQuery({
    queryKey: ['customer-projects', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_customers')
        .select(`
          *,
          project:projects(id, name, status, location, building_type)
        `)
        .eq('customer_id', customerId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
}

export function useAddProjectCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, customerId }: { projectId: string; customerId: string }) => {
      const { data, error } = await supabase
        .from('project_customers')
        .insert({ project_id: projectId, customer_id: customerId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-customers', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['customer-projects', variables.customerId] });
      toast.success('Customer linked to project');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('Customer is already linked to this project');
      } else {
        toast.error(error.message || 'Failed to link customer');
      }
    },
  });
}

export function useRemoveProjectCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, customerId }: { projectId: string; customerId: string }) => {
      const { error } = await supabase
        .from('project_customers')
        .delete()
        .eq('project_id', projectId)
        .eq('customer_id', customerId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-customers', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['customer-projects', variables.customerId] });
      toast.success('Customer unlinked from project');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unlink customer');
    },
  });
}
