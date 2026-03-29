import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Building } from './useBuildings';
import { Floor } from './useFloors';
import { Zone } from './useZones';
import { Equipment } from './useEquipment';

export interface EquipmentHierarchy {
  buildings: {
    building: Building;
    floors: {
      floor: Floor;
      zones: {
        zone: Zone;
        equipment: Equipment[];
      }[];
    }[];
  }[];
  unassignedEquipment: Equipment[];
}

export function useProjectEquipmentHierarchy(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-equipment-hierarchy', projectId],
    queryFn: async (): Promise<EquipmentHierarchy> => {
      if (!projectId) {
        return { buildings: [], unassignedEquipment: [] };
      }

      // Fetch all buildings for this project
      const { data: buildings, error: buildingsError } = await supabase
        .from('buildings')
        .select('*')
        .eq('project_id', projectId)
        .order('name');
      
      if (buildingsError) throw buildingsError;

      const buildingIds = buildings?.map(b => b.id) || [];

      // Fetch all floors for these buildings
      const { data: floors, error: floorsError } = buildingIds.length > 0
        ? await supabase
            .from('floors')
            .select('*')
            .in('building_id', buildingIds)
            .order('floor_number')
        : { data: [], error: null };
      
      if (floorsError) throw floorsError;

      const floorIds = floors?.map(f => f.id) || [];

      // Fetch all zones for these floors
      const { data: zones, error: zonesError } = floorIds.length > 0
        ? await supabase
            .from('zones')
            .select('*')
            .in('floor_id', floorIds)
            .order('name')
        : { data: [], error: null };
      
      if (zonesError) throw zonesError;

      const zoneIds = zones?.map(z => z.id) || [];

      // Fetch all equipment for this project (both by project_id and by zone_id)
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('*')
        .or(`project_id.eq.${projectId}${zoneIds.length > 0 ? `,zone_id.in.(${zoneIds.join(',')})` : ''}`)
        .order('name');
      
      if (equipmentError) throw equipmentError;

      // Build hierarchy
      const hierarchy: EquipmentHierarchy = {
        buildings: [],
        unassignedEquipment: [],
      };

      // Create lookup maps
      const floorsByBuilding = new Map<string, Floor[]>();
      floors?.forEach(floor => {
        const existing = floorsByBuilding.get(floor.building_id) || [];
        existing.push(floor as Floor);
        floorsByBuilding.set(floor.building_id, existing);
      });

      const zonesByFloor = new Map<string, Zone[]>();
      zones?.forEach(zone => {
        const existing = zonesByFloor.get(zone.floor_id) || [];
        existing.push(zone as Zone);
        zonesByFloor.set(zone.floor_id, existing);
      });

      const equipmentByZone = new Map<string, Equipment[]>();
      const assignedEquipmentIds = new Set<string>();
      
      equipment?.forEach(eq => {
        if (eq.zone_id && zoneIds.includes(eq.zone_id)) {
          const existing = equipmentByZone.get(eq.zone_id) || [];
          existing.push(eq as Equipment);
          equipmentByZone.set(eq.zone_id, existing);
          assignedEquipmentIds.add(eq.id);
        }
      });

      // Build the hierarchy structure
      buildings?.forEach(building => {
        const buildingFloors = floorsByBuilding.get(building.id) || [];
        
        const floorData = buildingFloors.map(floor => {
          const floorZones = zonesByFloor.get(floor.id) || [];
          
          return {
            floor,
            zones: floorZones.map(zone => ({
              zone,
              equipment: equipmentByZone.get(zone.id) || [],
            })),
          };
        });

        hierarchy.buildings.push({
          building: building as Building,
          floors: floorData,
        });
      });

      // Equipment directly assigned to project but not to a zone
      hierarchy.unassignedEquipment = (equipment || [])
        .filter(eq => !assignedEquipmentIds.has(eq.id))
        .map(eq => eq as Equipment);

      return hierarchy;
    },
    enabled: !!projectId,
  });
}
