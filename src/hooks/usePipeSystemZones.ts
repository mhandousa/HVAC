import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PipeSystemZone {
  id: string;
  pipe_system_id: string;
  zone_id: string;
  flow_gpm: number | null;
  notes: string | null;
  created_at: string;
}

export interface PipeSystemZoneWithDetails extends PipeSystemZone {
  zone?: {
    id: string;
    name: string;
    floor?: {
      id: string;
      name: string;
      building?: {
        id: string;
        name: string;
      };
    };
  };
}

export function usePipeSystemZones(systemId?: string) {
  return useQuery({
    queryKey: ['pipe-system-zones', systemId],
    queryFn: async () => {
      if (!systemId) return [];

      const { data, error } = await supabase
        .from('pipe_system_zones')
        .select(`
          *,
          zone:zones(
            id,
            name,
            floor:floors(
              id,
              name,
              building:buildings(id, name)
            )
          )
        `)
        .eq('pipe_system_id', systemId);

      if (error) throw error;
      return data as PipeSystemZoneWithDetails[];
    },
    enabled: !!systemId,
  });
}

export function useLinkZonesToPipeSystem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      systemId,
      zoneLinks,
    }: {
      systemId: string;
      zoneLinks: { zone_id: string; flow_gpm?: number; notes?: string }[];
    }) => {
      if (zoneLinks.length === 0) return [];

      const { data, error } = await supabase
        .from('pipe_system_zones')
        .insert(
          zoneLinks.map(link => ({
            pipe_system_id: systemId,
            zone_id: link.zone_id,
            flow_gpm: link.flow_gpm,
            notes: link.notes,
          }))
        )
        .select();

      if (error) throw error;
      return data as PipeSystemZone[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipe-system-zones'] });
      toast.success('Zones linked to pipe system');
    },
    onError: (error: Error) => {
      toast.error(`Failed to link zones: ${error.message}`);
    },
  });
}

export function useUnlinkZoneFromPipeSystem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ systemId, zoneId }: { systemId: string; zoneId: string }) => {
      const { error } = await supabase
        .from('pipe_system_zones')
        .delete()
        .eq('pipe_system_id', systemId)
        .eq('zone_id', zoneId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipe-system-zones'] });
      toast.success('Zone unlinked');
    },
    onError: (error: Error) => {
      toast.error(`Failed to unlink zone: ${error.message}`);
    },
  });
}

export function useUpdatePipeSystemZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      systemId,
      zoneId,
      updates,
    }: {
      systemId: string;
      zoneId: string;
      updates: { flow_gpm?: number; notes?: string };
    }) => {
      const { data, error } = await supabase
        .from('pipe_system_zones')
        .update(updates)
        .eq('pipe_system_id', systemId)
        .eq('zone_id', zoneId)
        .select()
        .single();

      if (error) throw error;
      return data as PipeSystemZone;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipe-system-zones'] });
    },
  });
}
