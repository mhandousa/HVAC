import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type CoilSelection = Database['public']['Tables']['coil_selections']['Row'];
export type CreateCoilSelectionInput = Database['public']['Tables']['coil_selections']['Insert'];
export type UpdateCoilSelectionInput = Database['public']['Tables']['coil_selections']['Update'];

/**
 * Fetch all coil selections for a project
 */
export function useCoilSelections(projectId?: string) {
  return useQuery({
    queryKey: ['coil-selections', projectId],
    queryFn: async () => {
      let query = supabase
        .from('coil_selections')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CoilSelection[];
    },
    enabled: !!projectId,
  });
}

/**
 * Fetch coil selections for a specific AHU configuration
 */
export function useCoilSelectionsByAHU(ahuConfigurationId?: string) {
  return useQuery({
    queryKey: ['coil-selections', 'ahu', ahuConfigurationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coil_selections')
        .select('*')
        .eq('ahu_configuration_id', ahuConfigurationId)
        .order('coil_type', { ascending: true });

      if (error) throw error;
      return data as CoilSelection[];
    },
    enabled: !!ahuConfigurationId,
  });
}

/**
 * Fetch coil selections for a specific zone
 */
export function useCoilSelectionsByZone(zoneId?: string) {
  return useQuery({
    queryKey: ['coil-selections', 'zone', zoneId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coil_selections')
        .select('*')
        .eq('zone_id', zoneId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as CoilSelection[];
    },
    enabled: !!zoneId,
  });
}

/**
 * Create a new coil selection
 */
export function useCreateCoilSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateCoilSelectionInput) => {
      const { data, error } = await supabase
        .from('coil_selections')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as CoilSelection;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['coil-selections'] });
      toast({
        title: 'Coil selection created',
        description: `${data.name} has been added.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating coil selection',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update an existing coil selection
 */
export function useUpdateCoilSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateCoilSelectionInput & { id: string }) => {
      const { data, error } = await supabase
        .from('coil_selections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CoilSelection;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['coil-selections'] });
      toast({
        title: 'Coil selection updated',
        description: `${data.name} has been updated.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating coil selection',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete a coil selection
 */
export function useDeleteCoilSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coil_selections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coil-selections'] });
      toast({
        title: 'Coil selection deleted',
        description: 'The coil selection has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting coil selection',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
