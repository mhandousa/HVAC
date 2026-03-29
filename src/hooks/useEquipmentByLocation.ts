import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Equipment } from './useEquipment';

export interface EquipmentCount {
  zone_id: string | null;
  count: number;
}

export function useEquipmentByZoneIds(zoneIds: string[]) {
  return useQuery({
    queryKey: ['equipment-by-zones', zoneIds],
    queryFn: async () => {
      if (zoneIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('equipment')
        .select('id, zone_id')
        .in('zone_id', zoneIds);

      if (error) throw error;
      return data || [];
    },
    enabled: zoneIds.length > 0,
  });
}

export function useEquipmentCountsByZone(zoneIds: string[]) {
  const { data: equipment = [] } = useEquipmentByZoneIds(zoneIds);
  
  const countsByZone = new Map<string, number>();
  equipment.forEach(eq => {
    if (eq.zone_id) {
      countsByZone.set(eq.zone_id, (countsByZone.get(eq.zone_id) || 0) + 1);
    }
  });
  
  return {
    getZoneCount: (zoneId: string) => countsByZone.get(zoneId) || 0,
    totalCount: equipment.length,
    countsByZone,
  };
}

// Fetch full equipment details for all zones
export function useEquipmentDetailsByZoneIds(zoneIds: string[]) {
  return useQuery({
    queryKey: ['equipment-details-by-zones', zoneIds],
    queryFn: async () => {
      if (zoneIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .in('zone_id', zoneIds)
        .order('name');

      if (error) throw error;
      return (data || []) as Equipment[];
    },
    enabled: zoneIds.length > 0,
  });
}
