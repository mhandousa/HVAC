import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useOrganization';

export interface LoadCalculationWithZone {
  id: string;
  calculation_name: string;
  project_id: string | null;
  zone_id: string | null;
  zone_name: string | null;
  floor_name: string | null;
  building_name: string | null;
  cfm_required: number | null;
  cooling_load_tons: number | null;
  cooling_load_btuh: number | null;
  heating_load_btuh: number | null;
  area_sqft: number;
  building_type: string | null;
  status: string | null;
  created_at: string;
}

export function useLoadCalculationsWithZones(projectId?: string) {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['load_calculations_with_zones', profile?.organization_id, projectId],
    queryFn: async () => {
      if (!profile?.organization_id) return [];

      // First get load calculations
      let query = supabase
        .from('load_calculations')
        .select(`
          id,
          calculation_name,
          project_id,
          zone_id,
          cfm_required,
          cooling_load_tons,
          cooling_load_btuh,
          heating_load_btuh,
          area_sqft,
          building_type,
          status,
          created_at
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data: calculations, error } = await query;
      if (error) throw error;

      // Now enrich with zone hierarchy data
      const enrichedCalcs: LoadCalculationWithZone[] = await Promise.all(
        (calculations || []).map(async (calc) => {
          let zoneName: string | null = null;
          let floorName: string | null = null;
          let buildingName: string | null = null;

          if (calc.zone_id) {
            // Use the get_zone_hierarchy function
            const { data: hierarchy } = await supabase
              .rpc('get_zone_hierarchy', { p_zone_id: calc.zone_id });
            
            if (hierarchy && hierarchy.length > 0) {
              const h = hierarchy[0];
              zoneName = h.zone_name;
              floorName = h.floor_name;
              buildingName = h.building_name;
            }
          }

          return {
            id: calc.id,
            calculation_name: calc.calculation_name,
            project_id: calc.project_id,
            zone_id: calc.zone_id,
            zone_name: zoneName,
            floor_name: floorName,
            building_name: buildingName,
            cfm_required: calc.cfm_required,
            cooling_load_tons: calc.cooling_load_tons,
            cooling_load_btuh: calc.cooling_load_btuh,
            heating_load_btuh: calc.heating_load_btuh,
            area_sqft: calc.area_sqft,
            building_type: calc.building_type,
            status: calc.status,
            created_at: calc.created_at,
          };
        })
      );

      return enrichedCalcs;
    },
    enabled: !!profile?.organization_id,
  });
}
