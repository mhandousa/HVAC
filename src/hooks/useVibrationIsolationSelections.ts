import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface VibrationIsolationSelection {
  id: string;
  zone_id: string | null;
  project_id: string | null;
  organization_id: string;
  equipment_type: string | null;
  equipment_weight_lbs: number | null;
  operating_rpm: number | null;
  isolator_type: string | null;
  deflection_inches: number | null;
  efficiency_percent: number | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useVibrationIsolationSelections(projectId?: string) {
  const { data: organization } = useOrganization();
  
  return useQuery({
    queryKey: ['vibration-isolation-selections', projectId, organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      let query = supabase
        .from('vibration_isolation_selections')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching vibration isolation selections:', error);
        throw error;
      }
      
      return data as VibrationIsolationSelection[];
    },
    enabled: !!organization?.id,
  });
}

export function useCreateVibrationIsolationSelection() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();
  
  return useMutation({
    mutationFn: async (input: Omit<VibrationIsolationSelection, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
      if (!organization?.id) throw new Error('No organization');
      
      const { data, error } = await supabase
        .from('vibration_isolation_selections')
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
      queryClient.invalidateQueries({ queryKey: ['vibration-isolation-selections'] });
      toast.success('Vibration isolation selection saved');
    },
    onError: (error) => {
      console.error('Error creating vibration isolation selection:', error);
      toast.error('Failed to save vibration isolation selection');
    },
  });
}

export function useUpdateVibrationIsolationSelection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<VibrationIsolationSelection> }) => {
      const { data, error } = await supabase
        .from('vibration_isolation_selections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vibration-isolation-selections'] });
      toast.success('Vibration isolation selection updated');
    },
    onError: (error) => {
      console.error('Error updating vibration isolation selection:', error);
      toast.error('Failed to update vibration isolation selection');
    },
  });
}

export function useDeleteVibrationIsolationSelection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vibration_isolation_selections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vibration-isolation-selections'] });
      toast.success('Vibration isolation selection deleted');
    },
    onError: (error) => {
      console.error('Error deleting vibration isolation selection:', error);
      toast.error('Failed to delete vibration isolation selection');
    },
  });
}
