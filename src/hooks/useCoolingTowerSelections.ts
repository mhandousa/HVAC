import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type CoolingTowerSelection = Database['public']['Tables']['cooling_tower_selections']['Row'];
export type CreateCoolingTowerSelectionInput = Database['public']['Tables']['cooling_tower_selections']['Insert'];
export type UpdateCoolingTowerSelectionInput = Database['public']['Tables']['cooling_tower_selections']['Update'];

/**
 * Fetch all cooling tower selections for a project
 */
export function useCoolingTowerSelections(projectId?: string) {
  return useQuery({
    queryKey: ['cooling-tower-selections', projectId],
    queryFn: async () => {
      let query = supabase
        .from('cooling_tower_selections')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CoolingTowerSelection[];
    },
    enabled: !!projectId,
  });
}

/**
 * Fetch cooling tower selections for a specific CHW plant
 */
export function useCoolingTowerSelectionsByPlant(chwPlantId?: string) {
  return useQuery({
    queryKey: ['cooling-tower-selections', 'plant', chwPlantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cooling_tower_selections')
        .select('*')
        .eq('chw_plant_id', chwPlantId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as CoolingTowerSelection[];
    },
    enabled: !!chwPlantId,
  });
}

/**
 * Create a new cooling tower selection
 */
export function useCreateCoolingTowerSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateCoolingTowerSelectionInput) => {
      const { data, error } = await supabase
        .from('cooling_tower_selections')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as CoolingTowerSelection;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cooling-tower-selections'] });
      toast({
        title: 'Cooling tower selection created',
        description: `${data.name} has been added.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating cooling tower selection',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update an existing cooling tower selection
 */
export function useUpdateCoolingTowerSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateCoolingTowerSelectionInput & { id: string }) => {
      const { data, error } = await supabase
        .from('cooling_tower_selections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CoolingTowerSelection;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cooling-tower-selections'] });
      toast({
        title: 'Cooling tower selection updated',
        description: `${data.name} has been updated.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating cooling tower selection',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete a cooling tower selection
 */
export function useDeleteCoolingTowerSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cooling_tower_selections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cooling-tower-selections'] });
      toast({
        title: 'Cooling tower selection deleted',
        description: 'The cooling tower selection has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting cooling tower selection',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
