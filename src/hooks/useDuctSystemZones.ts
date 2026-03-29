import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DuctSystemZone {
  id: string;
  duct_system_id: string;
  zone_id: string;
  airflow_cfm: number | null;
  notes: string | null;
  created_at: string;
}

export interface ZoneAssignment {
  zoneId: string;
  zoneName: string;
  floorName?: string;
  buildingName?: string;
  cfm: number;
  notes?: string;
}

export function useDuctSystemZones(systemId?: string) {
  return useQuery({
    queryKey: ['duct-system-zones', systemId],
    queryFn: async () => {
      if (!systemId) return [];

      const { data, error } = await supabase
        .from('duct_system_zones')
        .select(`
          *,
          zones:zone_id (
            id,
            name,
            floors:floor_id (
              id,
              name,
              buildings:building_id (
                id,
                name
              )
            )
          )
        `)
        .eq('duct_system_id', systemId);

      if (error) throw error;
      return data as (DuctSystemZone & { 
        zones: { 
          id: string; 
          name: string; 
          floors: { 
            id: string; 
            name: string; 
            buildings: { 
              id: string; 
              name: string 
            } 
          } 
        } 
      })[];
    },
    enabled: !!systemId,
  });
}

export function useLinkZonesToDuctSystem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      systemId,
      zones,
    }: {
      systemId: string;
      zones: Array<{ zone_id: string; airflow_cfm?: number; notes?: string }>;
    }) => {
      // First, delete existing zone assignments for this system
      const { error: deleteError } = await supabase
        .from('duct_system_zones')
        .delete()
        .eq('duct_system_id', systemId);

      if (deleteError) throw deleteError;

      // Then insert new zone assignments
      if (zones.length > 0) {
        const { data, error } = await supabase
          .from('duct_system_zones')
          .insert(
            zones.map((z) => ({
              duct_system_id: systemId,
              zone_id: z.zone_id,
              airflow_cfm: z.airflow_cfm || null,
              notes: z.notes || null,
            }))
          )
          .select();

        if (error) throw error;
        return data;
      }

      return [];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['duct-system-zones', variables.systemId] });
      queryClient.invalidateQueries({ queryKey: ['duct-systems'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save zone assignments');
    },
  });
}

export function useUnlinkZoneFromDuctSystem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ systemId, zoneId }: { systemId: string; zoneId: string }) => {
      const { error } = await supabase
        .from('duct_system_zones')
        .delete()
        .eq('duct_system_id', systemId)
        .eq('zone_id', zoneId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['duct-system-zones', variables.systemId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove zone');
    },
  });
}

export function useUpdateDuctSystemZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      systemId,
      zoneId,
      airflowCfm,
      notes,
    }: {
      systemId: string;
      zoneId: string;
      airflowCfm?: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('duct_system_zones')
        .update({
          airflow_cfm: airflowCfm,
          notes: notes,
        })
        .eq('duct_system_id', systemId)
        .eq('zone_id', zoneId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['duct-system-zones', variables.systemId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update zone');
    },
  });
}
