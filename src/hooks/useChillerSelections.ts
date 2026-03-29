import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

// Use Supabase auto-generated types for proper optional field handling
export type ChillerSelection = Database['public']['Tables']['chiller_selections']['Row'];
export type CreateChillerSelectionInput = Database['public']['Tables']['chiller_selections']['Insert'];
export type UpdateChillerSelectionInput = Database['public']['Tables']['chiller_selections']['Update'];

/**
 * Fetch all chiller selections for a project
 */
export function useChillerSelections(projectId?: string) {
  return useQuery({
    queryKey: ['chiller-selections', projectId],
    queryFn: async () => {
      let query = supabase
        .from('chiller_selections')
        .select('*')
        .order('sequence_number', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ChillerSelection[];
    },
    enabled: !!projectId,
  });
}

/**
 * Fetch chiller selections for a specific CHW plant
 */
export function useChillerSelectionsByPlant(chwPlantId?: string) {
  return useQuery({
    queryKey: ['chiller-selections', 'plant', chwPlantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chiller_selections')
        .select('*')
        .eq('chw_plant_id', chwPlantId)
        .order('sequence_number', { ascending: true });

      if (error) throw error;
      return data as ChillerSelection[];
    },
    enabled: !!chwPlantId,
  });
}

/**
 * Fetch a single chiller selection by ID
 */
export function useChillerSelection(id?: string) {
  return useQuery({
    queryKey: ['chiller-selections', 'detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chiller_selections')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as ChillerSelection;
    },
    enabled: !!id,
  });
}

/**
 * Create a new chiller selection
 */
export function useCreateChillerSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateChillerSelectionInput) => {
      const { data, error } = await supabase
        .from('chiller_selections')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as ChillerSelection;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chiller-selections'] });
      toast({
        title: 'Chiller selection created',
        description: `${data.name} has been added.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating chiller selection',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update an existing chiller selection
 */
export function useUpdateChillerSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateChillerSelectionInput & { id: string }) => {
      const { data, error } = await supabase
        .from('chiller_selections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ChillerSelection;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chiller-selections'] });
      toast({
        title: 'Chiller selection updated',
        description: `${data.name} has been updated.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating chiller selection',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete a chiller selection
 */
export function useDeleteChillerSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('chiller_selections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chiller-selections'] });
      toast({
        title: 'Chiller selection deleted',
        description: 'The chiller selection has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting chiller selection',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
