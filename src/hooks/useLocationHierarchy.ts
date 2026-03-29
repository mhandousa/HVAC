import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LocationPath {
  projectId?: string;
  projectName?: string;
  buildingId?: string;
  buildingName?: string;
  floorId?: string;
  floorName?: string;
  zoneId?: string;
  zoneName?: string;
}

// Fetch full location path for a zone
export function useLocationPathForZone(zoneId: string | null | undefined) {
  return useQuery({
    queryKey: ['location-path', 'zone', zoneId],
    queryFn: async () => {
      if (!zoneId) return null;

      // Get zone with floor, building, and project info
      const { data: zone, error: zoneError } = await supabase
        .from('zones')
        .select('id, name, floor_id')
        .eq('id', zoneId)
        .single();

      if (zoneError || !zone) return null;

      const { data: floor, error: floorError } = await supabase
        .from('floors')
        .select('id, name, building_id')
        .eq('id', zone.floor_id)
        .single();

      if (floorError || !floor) return null;

      const { data: building, error: buildingError } = await supabase
        .from('buildings')
        .select('id, name, project_id')
        .eq('id', floor.building_id)
        .single();

      if (buildingError || !building) return null;

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('id', building.project_id)
        .single();

      if (projectError || !project) return null;

      return {
        projectId: project.id,
        projectName: project.name,
        buildingId: building.id,
        buildingName: building.name,
        floorId: floor.id,
        floorName: floor.name,
        zoneId: zone.id,
        zoneName: zone.name,
      } as LocationPath;
    },
    enabled: !!zoneId,
  });
}

// Fetch location paths for multiple equipment items (batch for performance)
export function useEquipmentLocationPaths(equipmentList: { id: string; zone_id: string | null; project_id: string | null }[]) {
  const zoneIds = [...new Set(equipmentList.filter(eq => eq.zone_id).map(eq => eq.zone_id!))];
  const projectIds = [...new Set(equipmentList.filter(eq => eq.project_id && !eq.zone_id).map(eq => eq.project_id!))];

  return useQuery({
    queryKey: ['equipment-location-paths', zoneIds, projectIds],
    queryFn: async () => {
      const pathsByEquipmentId = new Map<string, LocationPath>();

      // Fetch zone hierarchy
      if (zoneIds.length > 0) {
        const { data: zones } = await supabase
          .from('zones')
          .select('id, name, floor_id')
          .in('id', zoneIds);

        const floorIds = [...new Set((zones || []).map(z => z.floor_id))];

        const { data: floors } = await supabase
          .from('floors')
          .select('id, name, building_id')
          .in('id', floorIds);

        const buildingIds = [...new Set((floors || []).map(f => f.building_id))];

        const { data: buildings } = await supabase
          .from('buildings')
          .select('id, name, project_id')
          .in('id', buildingIds);

        const projectIdsFromBuildings = [...new Set((buildings || []).map(b => b.project_id))];

        const { data: projects } = await supabase
          .from('projects')
          .select('id, name')
          .in('id', projectIdsFromBuildings);

        // Build lookup maps
        const projectsMap = new Map((projects || []).map(p => [p.id, p]));
        const buildingsMap = new Map((buildings || []).map(b => [b.id, b]));
        const floorsMap = new Map((floors || []).map(f => [f.id, f]));
        const zonesMap = new Map((zones || []).map(z => [z.id, z]));

        // Map equipment to location paths via zone
        equipmentList.forEach(eq => {
          if (eq.zone_id) {
            const zone = zonesMap.get(eq.zone_id);
            if (!zone) return;
            const floor = floorsMap.get(zone.floor_id);
            if (!floor) return;
            const building = buildingsMap.get(floor.building_id);
            if (!building) return;
            const project = projectsMap.get(building.project_id);
            if (!project) return;

            pathsByEquipmentId.set(eq.id, {
              projectId: project.id,
              projectName: project.name,
              buildingId: building.id,
              buildingName: building.name,
              floorId: floor.id,
              floorName: floor.name,
              zoneId: zone.id,
              zoneName: zone.name,
            });
          }
        });
      }

      // Fetch direct project links (equipment not in a zone)
      if (projectIds.length > 0) {
        const { data: projects } = await supabase
          .from('projects')
          .select('id, name')
          .in('id', projectIds);

        const projectsMap = new Map((projects || []).map(p => [p.id, p]));

        equipmentList.forEach(eq => {
          if (eq.project_id && !eq.zone_id && !pathsByEquipmentId.has(eq.id)) {
            const project = projectsMap.get(eq.project_id);
            if (project) {
              pathsByEquipmentId.set(eq.id, {
                projectId: project.id,
                projectName: project.name,
              });
            }
          }
        });
      }

      return pathsByEquipmentId;
    },
    enabled: equipmentList.length > 0,
  });
}

// Get formatted location string
export function formatLocationPath(path: LocationPath | null | undefined): string {
  if (!path) return 'Unassigned';

  const parts: string[] = [];
  if (path.projectName) parts.push(path.projectName);
  if (path.buildingName) parts.push(path.buildingName);
  if (path.floorName) parts.push(path.floorName);
  if (path.zoneName) parts.push(path.zoneName);

  return parts.length > 0 ? parts.join(' → ') : 'Unassigned';
}
