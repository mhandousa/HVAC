import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Zone {
  id: string;
  floor_id: string;
  name: string;
  zone_type: string;
  area_sqm: number;
  occupancy_capacity: number;
  created_at: string;
  updated_at: string;
}

export interface CreateZoneInput {
  floor_id: string;
  name: string;
  zone_type?: string;
  area_sqm?: number;
  occupancy_capacity?: number;
}

export function useZones(floorId?: string) {
  return useQuery({
    queryKey: ['zones', floorId],
    queryFn: async () => {
      let query = supabase
        .from('zones')
        .select('*')
        .order('name', { ascending: true });
      
      if (floorId) {
        query = query.eq('floor_id', floorId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Zone[];
    },
    enabled: !!floorId,
  });
}

export function useZonesByFloorIds(floorIds: string[]) {
  return useQuery({
    queryKey: ['zones', 'by-floor-ids', floorIds],
    queryFn: async () => {
      if (floorIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('zones')
        .select('*')
        .in('floor_id', floorIds)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as Zone[];
    },
    enabled: floorIds.length > 0,
  });
}

export function useCreateZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateZoneInput) => {
      const { data, error } = await supabase
        .from('zones')
        .insert({
          floor_id: input.floor_id,
          name: input.name,
          zone_type: input.zone_type || 'office',
          area_sqm: input.area_sqm || 0,
          occupancy_capacity: input.occupancy_capacity || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      toast.success('Zone created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create zone: ${error.message}`);
    },
  });
}

export function useUpdateZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Zone> & { id: string }) => {
      const { data, error } = await supabase
        .from('zones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      toast.success('Zone updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update zone: ${error.message}`);
    },
  });
}

export function useDeleteZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, floorId }: { id: string; floorId: string }) => {
      const { error } = await supabase
        .from('zones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, floorId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      toast.success('Zone deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete zone: ${error.message}`);
    },
  });
}
