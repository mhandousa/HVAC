import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface ControlValveSelection {
  id: string;
  project_id: string | null;
  organization_id: string;
  pipe_system_id: string | null;
  valve_type: string | null;
  size_inches: number | null;
  cv_required: number | null;
  cv_selected: number | null;
  valve_authority: number | null;
  pressure_drop_psi: number | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useControlValveSelections(projectId?: string) {
  const { data: organization } = useOrganization();
  
  return useQuery({
    queryKey: ['control-valve-selections', projectId, organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      let query = supabase
        .from('control_valve_selections')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching control valve selections:', error);
        throw error;
      }
      
      return data as ControlValveSelection[];
    },
    enabled: !!organization?.id,
  });
}

export function useCreateControlValveSelection() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();
  
  return useMutation({
    mutationFn: async (input: Omit<ControlValveSelection, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
      if (!organization?.id) throw new Error('No organization');
      
      const { data, error } = await supabase
        .from('control_valve_selections')
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
      queryClient.invalidateQueries({ queryKey: ['control-valve-selections'] });
      toast.success('Control valve selection saved');
    },
    onError: (error) => {
      console.error('Error creating control valve selection:', error);
      toast.error('Failed to save control valve selection');
    },
  });
}

export function useUpdateControlValveSelection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ControlValveSelection> }) => {
      const { data, error } = await supabase
        .from('control_valve_selections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['control-valve-selections'] });
      toast.success('Control valve selection updated');
    },
    onError: (error) => {
      console.error('Error updating control valve selection:', error);
      toast.error('Failed to update control valve selection');
    },
  });
}

export function useDeleteControlValveSelection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('control_valve_selections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['control-valve-selections'] });
      toast.success('Control valve selection deleted');
    },
    onError: (error) => {
      console.error('Error deleting control valve selection:', error);
      toast.error('Failed to delete control valve selection');
    },
  });
}
