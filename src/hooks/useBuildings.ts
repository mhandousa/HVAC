import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Building {
  id: string;
  project_id: string;
  name: string;
  address: string | null;
  total_floors: number | null;
  total_area_sqm: number | null;
  year_built: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBuildingInput {
  project_id: string;
  name: string;
  address?: string;
  total_floors?: number;
  total_area_sqm?: number;
  year_built?: number;
}

export function useBuildings(projectId?: string) {
  return useQuery({
    queryKey: ['buildings', projectId],
    queryFn: async () => {
      let query = supabase
        .from('buildings')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Building[];
    },
  });
}

export function useCreateBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBuildingInput) => {
      const { data, error } = await supabase
        .from('buildings')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as Building;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      queryClient.invalidateQueries({ queryKey: ['buildings', data.project_id] });
      toast.success('Building added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add building');
    },
  });
}

export function useUpdateBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Building> & { id: string }) => {
      const { data, error } = await supabase
        .from('buildings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Building;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      queryClient.invalidateQueries({ queryKey: ['buildings', data.project_id] });
      toast.success('Building updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update building');
    },
  });
}

export function useDeleteBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('buildings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast.success('Building deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete building');
    },
  });
}
