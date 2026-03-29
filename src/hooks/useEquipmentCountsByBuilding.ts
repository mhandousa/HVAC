import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BuildingEquipmentCounts {
  counts: Map<string, number>;
  getCount: (buildingId: string) => number;
  totalCount: number;
}

export function useEquipmentCountsByBuilding(projectId: string | undefined): BuildingEquipmentCounts & { isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['equipment-counts-by-building', projectId],
    queryFn: async () => {
      if (!projectId) return { counts: new Map<string, number>(), totalCount: 0 };

      // Get all buildings for this project
      const { data: buildings, error: buildingsError } = await supabase
        .from('buildings')
        .select('id')
        .eq('project_id', projectId);

      if (buildingsError) throw buildingsError;
      if (!buildings || buildings.length === 0) {
        return { counts: new Map<string, number>(), totalCount: 0 };
      }

      const buildingIds = buildings.map(b => b.id);

      // Get all floors for these buildings
      const { data: floors, error: floorsError } = await supabase
        .from('floors')
        .select('id, building_id')
        .in('building_id', buildingIds);

      if (floorsError) throw floorsError;

      const floorIds = floors?.map(f => f.id) || [];
      const floorToBuildingMap = new Map<string, string>();
      floors?.forEach(f => floorToBuildingMap.set(f.id, f.building_id));

      if (floorIds.length === 0) {
        return { counts: new Map<string, number>(), totalCount: 0 };
      }

      // Get all zones for these floors
      const { data: zones, error: zonesError } = await supabase
        .from('zones')
        .select('id, floor_id')
        .in('floor_id', floorIds);

      if (zonesError) throw zonesError;

      const zoneIds = zones?.map(z => z.id) || [];
      const zoneToFloorMap = new Map<string, string>();
      zones?.forEach(z => zoneToFloorMap.set(z.id, z.floor_id));

      if (zoneIds.length === 0) {
        return { counts: new Map<string, number>(), totalCount: 0 };
      }

      // Get equipment count per zone
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('id, zone_id')
        .in('zone_id', zoneIds);

      if (equipmentError) throw equipmentError;

      // Count equipment per building by traversing zone → floor → building
      const counts = new Map<string, number>();
      buildingIds.forEach(id => counts.set(id, 0));

      equipment?.forEach(eq => {
        if (eq.zone_id) {
          const floorId = zoneToFloorMap.get(eq.zone_id);
          if (floorId) {
            const buildingId = floorToBuildingMap.get(floorId);
            if (buildingId) {
              counts.set(buildingId, (counts.get(buildingId) || 0) + 1);
            }
          }
        }
      });

      return {
        counts,
        totalCount: equipment?.length || 0,
      };
    },
    enabled: !!projectId,
  });

  return {
    counts: data?.counts || new Map<string, number>(),
    getCount: (buildingId: string) => data?.counts.get(buildingId) || 0,
    totalCount: data?.totalCount || 0,
    isLoading,
  };
}
