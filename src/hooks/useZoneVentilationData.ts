import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ZoneVentilationData {
  vozCfm: number;
  vbzCfm: number;
  spaceType: string | null;
  occupancy: number | null;
  floorAreaSqft: number | null;
  calculationName: string;
  calculationId: string;
  calculatedAt: string;
}

/**
 * Fetches ASHRAE 62.1 ventilation data for a specific zone
 * Returns the most recent calculation if multiple exist
 */
export function useZoneVentilationData(zoneId: string | undefined) {
  return useQuery({
    queryKey: ['zone-ventilation-data', zoneId],
    queryFn: async (): Promise<ZoneVentilationData | null> => {
      if (!zoneId) return null;

      const { data, error } = await supabase
        .from('ventilation_zone_results')
        .select(`
          voz_cfm,
          vbz_cfm,
          space_type_id,
          occupancy,
          floor_area_sqft,
          created_at,
          ventilation_calculations (
            id,
            calculation_name,
            created_at
          )
        `)
        .eq('zone_id', zoneId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data || !data.ventilation_calculations) return null;

      // Handle the nested relation - it could be an array or single object
      const calc = Array.isArray(data.ventilation_calculations) 
        ? data.ventilation_calculations[0] 
        : data.ventilation_calculations;

      return {
        vozCfm: data.voz_cfm || 0,
        vbzCfm: data.vbz_cfm || 0,
        spaceType: data.space_type_id,
        occupancy: data.occupancy,
        floorAreaSqft: data.floor_area_sqft,
        calculationName: calc.calculation_name,
        calculationId: calc.id,
        calculatedAt: calc.created_at,
      };
    },
    enabled: !!zoneId,
  });
}
