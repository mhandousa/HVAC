import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface SilencerSelection {
  id: string;
  zone_id: string | null;
  project_id: string | null;
  organization_id: string;
  silencer_model: string | null;
  manufacturer: string | null;
  attenuation_required_db: number | null;
  duct_size: string | null;
  pressure_drop_in_wg: number | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useSilencerSelections(projectId?: string) {
  const { data: organization } = useOrganization();
  
  return useQuery({
    queryKey: ['silencer-selections', projectId, organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      let query = supabase
        .from('silencer_selections')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching silencer selections:', error);
        throw error;
      }
      
      return data as SilencerSelection[];
    },
    enabled: !!organization?.id,
  });
}

export function useCreateSilencerSelection() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();
  
  return useMutation({
    mutationFn: async (input: Omit<SilencerSelection, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
      if (!organization?.id) throw new Error('No organization');
      
      const { data, error } = await supabase
        .from('silencer_selections')
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
      queryClient.invalidateQueries({ queryKey: ['silencer-selections'] });
      toast.success('Silencer selection saved');
    },
    onError: (error) => {
      console.error('Error creating silencer selection:', error);
      toast.error('Failed to save silencer selection');
    },
  });
}

export function useUpdateSilencerSelection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SilencerSelection> }) => {
      const { data, error } = await supabase
        .from('silencer_selections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['silencer-selections'] });
      toast.success('Silencer selection updated');
    },
    onError: (error) => {
      console.error('Error updating silencer selection:', error);
      toast.error('Failed to update silencer selection');
    },
  });
}

export function useDeleteSilencerSelection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('silencer_selections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['silencer-selections'] });
      toast.success('Silencer selection deleted');
    },
    onError: (error) => {
      console.error('Error deleting silencer selection:', error);
      toast.error('Failed to delete silencer selection');
    },
  });
}
