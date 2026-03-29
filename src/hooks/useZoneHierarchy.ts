import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ZoneHierarchy {
  zone_id: string;
  zone_name: string;
  floor_id: string;
  floor_name: string;
  building_id: string;
  building_name: string;
  project_id: string;
  project_name: string;
  organization_id: string;
}

export function useZoneHierarchy(zoneId?: string) {
  return useQuery({
    queryKey: ['zone-hierarchy', zoneId],
    queryFn: async () => {
      if (!zoneId) return null;

      const { data, error } = await supabase
        .rpc('get_zone_hierarchy', { p_zone_id: zoneId });

      if (error) throw error;
      return (data?.[0] as ZoneHierarchy) || null;
    },
    enabled: !!zoneId,
  });
}

export function useZoneHierarchyBatch(zoneIds: string[]) {
  return useQuery({
    queryKey: ['zone-hierarchy-batch', zoneIds],
    queryFn: async () => {
      if (zoneIds.length === 0) return [];

      // Fetch hierarchy for all zones by joining tables
      const { data, error } = await supabase
        .from('zones')
        .select(`
          id,
          name,
          floor:floors!zones_floor_id_fkey(
            id,
            name,
            building:buildings!floors_building_id_fkey(
              id,
              name,
              project:projects!buildings_project_id_fkey(
                id,
                name,
                organization_id
              )
            )
          )
        `)
        .in('id', zoneIds);

      if (error) throw error;

      return (data || []).map((z: any) => ({
        zone_id: z.id,
        zone_name: z.name,
        floor_id: z.floor?.id,
        floor_name: z.floor?.name,
        building_id: z.floor?.building?.id,
        building_name: z.floor?.building?.name,
        project_id: z.floor?.building?.project?.id,
        project_name: z.floor?.building?.project?.name,
        organization_id: z.floor?.building?.project?.organization_id,
      })) as ZoneHierarchy[];
    },
    enabled: zoneIds.length > 0,
  });
}
