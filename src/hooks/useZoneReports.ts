import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';

export interface ZoneReportData {
  zone_id: string;
  zone_name: string;
  zone_type: string;
  area_sqm: number;
  occupancy_capacity: number;
  floor_id: string;
  floor_name: string;
  building_id: string;
  building_name: string;
  project_id: string;
  project_name: string;
  equipment_count: number;
  work_order_count: number;
  open_work_orders: number;
  completed_work_orders: number;
  load_calculation_count: number;
  total_cooling_load_tons: number;
}

export interface ZoneReportSummary {
  total_zones: number;
  total_area_sqm: number;
  total_equipment: number;
  total_work_orders: number;
  open_work_orders: number;
  completion_rate: number;
  avg_equipment_per_zone: number;
  zones_by_type: Record<string, number>;
}

export function useZoneReports() {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['zone-reports', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return { zones: [], summary: null };

      // Fetch zones with hierarchy
      const { data: zones, error: zonesError } = await supabase
        .from('zones')
        .select(`
          id,
          name,
          zone_type,
          area_sqm,
          occupancy_capacity,
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
        `);

      if (zonesError) throw zonesError;

      // Filter zones by organization
      const orgZones = (zones || []).filter(
        (z: any) => z.floor?.building?.project?.organization_id === organization.id
      );

      const zoneIds = orgZones.map((z: any) => z.id);

      if (zoneIds.length === 0) {
        return {
          zones: [],
          summary: {
            total_zones: 0,
            total_area_sqm: 0,
            total_equipment: 0,
            total_work_orders: 0,
            open_work_orders: 0,
            completion_rate: 0,
            avg_equipment_per_zone: 0,
            zones_by_type: {},
          } as ZoneReportSummary,
        };
      }

      // Fetch equipment counts per zone
      const { data: equipment } = await supabase
        .from('equipment')
        .select('id, zone_id')
        .in('zone_id', zoneIds);

      const equipmentByZone = new Map<string, number>();
      (equipment || []).forEach((eq) => {
        if (eq.zone_id) {
          equipmentByZone.set(eq.zone_id, (equipmentByZone.get(eq.zone_id) || 0) + 1);
        }
      });

      // Fetch work orders per zone
      const { data: workOrders } = await supabase
        .from('work_orders')
        .select('id, zone_id, status')
        .in('zone_id', zoneIds);

      const workOrdersByZone = new Map<string, { total: number; open: number; completed: number }>();
      (workOrders || []).forEach((wo) => {
        if (wo.zone_id) {
          const existing = workOrdersByZone.get(wo.zone_id) || { total: 0, open: 0, completed: 0 };
          existing.total++;
          if (wo.status === 'open' || wo.status === 'in_progress') {
            existing.open++;
          } else if (wo.status === 'completed') {
            existing.completed++;
          }
          workOrdersByZone.set(wo.zone_id, existing);
        }
      });

      // Fetch load calculations per zone
      const { data: loadCalcs } = await supabase
        .from('load_calculations')
        .select('id, zone_id, cooling_load_tons')
        .in('zone_id', zoneIds);

      const loadCalcsByZone = new Map<string, { count: number; totalTons: number }>();
      (loadCalcs || []).forEach((lc) => {
        if (lc.zone_id) {
          const existing = loadCalcsByZone.get(lc.zone_id) || { count: 0, totalTons: 0 };
          existing.count++;
          existing.totalTons += lc.cooling_load_tons || 0;
          loadCalcsByZone.set(lc.zone_id, existing);
        }
      });

      // Build zone report data
      const zoneReports: ZoneReportData[] = orgZones.map((z: any) => {
        const woData = workOrdersByZone.get(z.id) || { total: 0, open: 0, completed: 0 };
        const lcData = loadCalcsByZone.get(z.id) || { count: 0, totalTons: 0 };
        
        return {
          zone_id: z.id,
          zone_name: z.name,
          zone_type: z.zone_type || 'general',
          area_sqm: z.area_sqm || 0,
          occupancy_capacity: z.occupancy_capacity || 0,
          floor_id: z.floor?.id || '',
          floor_name: z.floor?.name || '',
          building_id: z.floor?.building?.id || '',
          building_name: z.floor?.building?.name || '',
          project_id: z.floor?.building?.project?.id || '',
          project_name: z.floor?.building?.project?.name || '',
          equipment_count: equipmentByZone.get(z.id) || 0,
          work_order_count: woData.total,
          open_work_orders: woData.open,
          completed_work_orders: woData.completed,
          load_calculation_count: lcData.count,
          total_cooling_load_tons: lcData.totalTons,
        };
      });

      // Calculate summary
      const totalEquipment = Array.from(equipmentByZone.values()).reduce((a, b) => a + b, 0);
      const totalWorkOrders = (workOrders || []).length;
      const openWorkOrders = (workOrders || []).filter(
        (wo) => wo.status === 'open' || wo.status === 'in_progress'
      ).length;
      const completedWorkOrders = (workOrders || []).filter(
        (wo) => wo.status === 'completed'
      ).length;

      const zonesByType: Record<string, number> = {};
      zoneReports.forEach((z) => {
        zonesByType[z.zone_type] = (zonesByType[z.zone_type] || 0) + 1;
      });

      const summary: ZoneReportSummary = {
        total_zones: zoneReports.length,
        total_area_sqm: zoneReports.reduce((sum, z) => sum + z.area_sqm, 0),
        total_equipment: totalEquipment,
        total_work_orders: totalWorkOrders,
        open_work_orders: openWorkOrders,
        completion_rate: totalWorkOrders > 0 ? (completedWorkOrders / totalWorkOrders) * 100 : 0,
        avg_equipment_per_zone: zoneReports.length > 0 ? totalEquipment / zoneReports.length : 0,
        zones_by_type: zonesByType,
      };

      return { zones: zoneReports, summary };
    },
    enabled: !!organization?.id,
  });
}
