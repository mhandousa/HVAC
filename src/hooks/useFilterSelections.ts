import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type FilterSelection = Database['public']['Tables']['filter_selections']['Row'];
export type CreateFilterSelectionInput = Database['public']['Tables']['filter_selections']['Insert'];
export type UpdateFilterSelectionInput = Database['public']['Tables']['filter_selections']['Update'];

/**
 * Fetch all filter selections for a project
 */
export function useFilterSelections(projectId?: string) {
  return useQuery({
    queryKey: ['filter-selections', projectId],
    queryFn: async () => {
      let query = supabase
        .from('filter_selections')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FilterSelection[];
    },
    enabled: !!projectId,
  });
}

/**
 * Fetch filter selections for a specific AHU configuration
 */
export function useFilterSelectionsByAHU(ahuConfigurationId?: string) {
  return useQuery({
    queryKey: ['filter-selections', 'ahu', ahuConfigurationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('filter_selections')
        .select('*')
        .eq('ahu_configuration_id', ahuConfigurationId)
        .order('filter_position', { ascending: true });

      if (error) throw error;
      return data as FilterSelection[];
    },
    enabled: !!ahuConfigurationId,
  });
}

/**
 * Create a new filter selection
 */
export function useCreateFilterSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateFilterSelectionInput) => {
      const { data, error } = await supabase
        .from('filter_selections')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as FilterSelection;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['filter-selections'] });
      toast({
        title: 'Filter selection created',
        description: `${data.name} has been added.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating filter selection',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update an existing filter selection
 */
export function useUpdateFilterSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateFilterSelectionInput & { id: string }) => {
      const { data, error } = await supabase
        .from('filter_selections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as FilterSelection;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['filter-selections'] });
      toast({
        title: 'Filter selection updated',
        description: `${data.name} has been updated.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating filter selection',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete a filter selection
 */
export function useDeleteFilterSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('filter_selections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filter-selections'] });
      toast({
        title: 'Filter selection deleted',
        description: 'The filter selection has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting filter selection',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
