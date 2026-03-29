import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface EconomizerSelection {
  id: string;
  project_id: string | null;
  organization_id: string;
  ahu_id: string | null;
  economizer_type: string | null;
  design_cfm: number | null;
  min_oa_cfm: number | null;
  changeover_temp_f: number | null;
  energy_savings_kwh: number | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useEconomizerSelections(projectId?: string) {
  const { data: organization } = useOrganization();
  
  return useQuery({
    queryKey: ['economizer-selections', projectId, organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      let query = supabase
        .from('economizer_selections')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching economizer selections:', error);
        throw error;
      }
      
      return data as EconomizerSelection[];
    },
    enabled: !!organization?.id,
  });
}

export function useCreateEconomizerSelection() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();
  
  return useMutation({
    mutationFn: async (input: Omit<EconomizerSelection, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
      if (!organization?.id) throw new Error('No organization');
      
      const { data, error } = await supabase
        .from('economizer_selections')
        .insert({
          ...input,
          organization_id: organization.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['economizer-selections'] });
      toast.success('Economizer selection saved');
    },
    onError: (error) => {
      console.error('Error creating economizer selection:', error);
      toast.error('Failed to save economizer selection');
    },
  });
}

export function useUpdateEconomizerSelection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<EconomizerSelection> }) => {
      const { data, error } = await supabase
        .from('economizer_selections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['economizer-selections'] });
      toast.success('Economizer selection updated');
    },
    onError: (error) => {
      console.error('Error updating economizer selection:', error);
      toast.error('Failed to update economizer selection');
    },
  });
}

export function useDeleteEconomizerSelection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('economizer_selections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['economizer-selections'] });
      toast.success('Economizer selection deleted');
    },
    onError: (error) => {
      console.error('Error deleting economizer selection:', error);
      toast.error('Failed to delete economizer selection');
    },
  });
}
