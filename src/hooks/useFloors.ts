import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Floor {
  id: string;
  building_id: string;
  floor_number: number;
  name: string;
  area_sqm: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFloorInput {
  building_id: string;
  floor_number: number;
  name: string;
  area_sqm?: number;
}

export function useFloors(buildingId?: string) {
  return useQuery({
    queryKey: ['floors', buildingId],
    queryFn: async () => {
      let query = supabase
        .from('floors')
        .select('*')
        .order('floor_number', { ascending: true });

      if (buildingId) {
        query = query.eq('building_id', buildingId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Floor[];
    },
    enabled: !!buildingId,
  });
}

export function useCreateFloor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFloorInput) => {
      const { data, error } = await supabase
        .from('floors')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as Floor;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['floors'] });
      queryClient.invalidateQueries({ queryKey: ['floors', data.building_id] });
      toast.success('Floor added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add floor');
    },
  });
}

export function useUpdateFloor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Floor> & { id: string }) => {
      const { data, error } = await supabase
        .from('floors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Floor;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['floors'] });
      queryClient.invalidateQueries({ queryKey: ['floors', data.building_id] });
      toast.success('Floor updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update floor');
    },
  });
}

export function useDeleteFloor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, buildingId }: { id: string; buildingId: string }) => {
      const { error } = await supabase
        .from('floors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { buildingId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['floors'] });
      queryClient.invalidateQueries({ queryKey: ['floors', data.buildingId] });
      toast.success('Floor deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete floor');
    },
  });
}
