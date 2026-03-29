import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LocationHierarchyItem {
  building_id: string;
  building_name: string;
  floor_id: string;
  floor_name: string;
  zone_id: string;
  zone_name: string;
}

export function useLocationHierarchyFilter() {
  return useQuery({
    queryKey: ['location-hierarchy-filter'],
    queryFn: async () => {
      // Fetch all zones with their floor and building info
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
              name
            )
          )
        `)
        .order('name');

      if (error) throw error;

      // Transform into flat hierarchy
      const hierarchy = (data || []).map((z: any) => ({
        zone_id: z.id,
        zone_name: z.name,
        floor_id: z.floor?.id || '',
        floor_name: z.floor?.name || '',
        building_id: z.floor?.building?.id || '',
        building_name: z.floor?.building?.name || '',
      })) as LocationHierarchyItem[];

      // Extract unique buildings
      const buildingsMap = new Map<string, string>();
      hierarchy.forEach(h => {
        if (h.building_id && !buildingsMap.has(h.building_id)) {
          buildingsMap.set(h.building_id, h.building_name);
        }
      });
      const buildings = Array.from(buildingsMap.entries()).map(([id, name]) => ({ id, name }));

      // Extract unique floors
      const floorsMap = new Map<string, { name: string; building_id: string }>();
      hierarchy.forEach(h => {
        if (h.floor_id && !floorsMap.has(h.floor_id)) {
          floorsMap.set(h.floor_id, { name: h.floor_name, building_id: h.building_id });
        }
      });
      const floors = Array.from(floorsMap.entries()).map(([id, { name, building_id }]) => ({ id, name, building_id }));

      // Extract zones with floor_id
      const zones = hierarchy.map(h => ({
        id: h.zone_id,
        name: h.zone_name,
        floor_id: h.floor_id,
      }));

      return { buildings, floors, zones, hierarchy };
    },
  });
}
