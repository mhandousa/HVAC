import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface ExpansionTankSelection {
  id: string;
  project_id: string | null;
  organization_id: string;
  system_type: string | null;
  system_volume_gallons: number | null;
  tank_size_gallons: number | null;
  acceptance_volume_gallons: number | null;
  pre_charge_psi: number | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useExpansionTankSelections(projectId?: string) {
  const { data: organization } = useOrganization();
  
  return useQuery({
    queryKey: ['expansion-tank-selections', projectId, organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      let query = supabase
        .from('expansion_tank_selections')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching expansion tank selections:', error);
        throw error;
      }
      
      return data as ExpansionTankSelection[];
    },
    enabled: !!organization?.id,
  });
}

export function useCreateExpansionTankSelection() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();
  
  return useMutation({
    mutationFn: async (input: Omit<ExpansionTankSelection, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
      if (!organization?.id) throw new Error('No organization');
      
      const { data, error } = await supabase
        .from('expansion_tank_selections')
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
      queryClient.invalidateQueries({ queryKey: ['expansion-tank-selections'] });
      toast.success('Expansion tank selection saved');
    },
    onError: (error) => {
      console.error('Error creating expansion tank selection:', error);
      toast.error('Failed to save expansion tank selection');
    },
  });
}

export function useUpdateExpansionTankSelection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ExpansionTankSelection> }) => {
      const { data, error } = await supabase
        .from('expansion_tank_selections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expansion-tank-selections'] });
      toast.success('Expansion tank selection updated');
    },
    onError: (error) => {
      console.error('Error updating expansion tank selection:', error);
      toast.error('Failed to update expansion tank selection');
    },
  });
}

export function useDeleteExpansionTankSelection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expansion_tank_selections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expansion-tank-selections'] });
      toast.success('Expansion tank selection deleted');
    },
    onError: (error) => {
      console.error('Error deleting expansion tank selection:', error);
      toast.error('Failed to delete expansion tank selection');
    },
  });
}
