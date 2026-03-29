import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EnergyReading {
  id: string;
  meter_id: string;
  value: number;
  consumption: number | null;
  demand_kw: number | null;
  power_factor: number | null;
  outside_air_temp_f: number | null;
  quality: string;
  source: string | null;
  recorded_at: string;
  received_at: string;
}

export interface EnergyDailyAggregate {
  id: string;
  meter_id: string;
  date: string;
  total_consumption: number;
  peak_demand_kw: number | null;
  avg_demand_kw: number | null;
  min_demand_kw: number | null;
  avg_outside_temp_f: number | null;
  cooling_degree_days: number | null;
  heating_degree_days: number | null;
  energy_cost: number | null;
  demand_cost: number | null;
  total_cost: number | null;
  reading_count: number | null;
}

export type TimeRange = '7d' | '30d' | '90d' | '1y';

function getStartDate(range: TimeRange): Date {
  const now = new Date();
  switch (range) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '1y':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

// Get raw readings for a specific meter
export function useEnergyReadings(meterId: string | undefined, timeRange: TimeRange = '30d') {
  const startDate = getStartDate(timeRange);

  return useQuery({
    queryKey: ['energy-readings', meterId, timeRange],
    queryFn: async () => {
      if (!meterId) return [];
      const { data, error } = await supabase
        .from('energy_readings')
        .select('*')
        .eq('meter_id', meterId)
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: true });
      if (error) throw error;
      return data as EnergyReading[];
    },
    enabled: !!meterId,
    refetchInterval: 60000, // Refresh every minute
  });
}

// Get daily aggregates for a project (all meters)
export function useDailyConsumption(projectId: string | undefined, timeRange: TimeRange = '30d') {
  const startDate = getStartDate(timeRange);

  return useQuery({
    queryKey: ['energy-daily-consumption', projectId, timeRange],
    queryFn: async () => {
      if (!projectId) return [];

      // First get meters for this project
      const { data: meters, error: metersError } = await supabase
        .from('energy_meters')
        .select('id')
        .eq('project_id', projectId);

      if (metersError) throw metersError;
      if (!meters || meters.length === 0) return [];

      const meterIds = meters.map(m => m.id);

      // Get daily aggregates for these meters
      const { data, error } = await supabase
        .from('energy_daily_aggregates')
        .select('*')
        .in('meter_id', meterIds)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      // Aggregate by date across all meters
      const byDate = new Map<string, { consumption: number; cost: number; demand: number }>();
      
      (data as EnergyDailyAggregate[]).forEach(d => {
        const existing = byDate.get(d.date) || { consumption: 0, cost: 0, demand: 0 };
        byDate.set(d.date, {
          consumption: existing.consumption + (d.total_consumption || 0),
          cost: existing.cost + (d.total_cost || 0),
          demand: Math.max(existing.demand, d.peak_demand_kw || 0),
        });
      });

      return Array.from(byDate.entries()).map(([date, values]) => ({
        date,
        consumption: values.consumption,
        cost: values.cost,
        peakDemand: values.demand,
      }));
    },
    enabled: !!projectId,
    refetchInterval: 300000, // Refresh every 5 minutes
  });
}

// Get system breakdown for pie chart
export function useSystemBreakdown(projectId: string | undefined, timeRange: TimeRange = '30d') {
  const startDate = getStartDate(timeRange);

  return useQuery({
    queryKey: ['energy-system-breakdown', projectId, timeRange],
    queryFn: async () => {
      if (!projectId) return [];

      // Get meters with their system types
      const { data: meters, error: metersError } = await supabase
        .from('energy_meters')
        .select('id, system_type, name')
        .eq('project_id', projectId);

      if (metersError) throw metersError;
      if (!meters || meters.length === 0) return [];

      const meterIds = meters.map(m => m.id);

      // Get daily aggregates
      const { data, error } = await supabase
        .from('energy_daily_aggregates')
        .select('meter_id, total_consumption')
        .in('meter_id', meterIds)
        .gte('date', startDate.toISOString().split('T')[0]);

      if (error) throw error;

      // Map meter_id to system_type
      const meterTypeMap = new Map(meters.map(m => [m.id, m.system_type]));

      // Aggregate by system type
      const bySystem = new Map<string, number>();
      
      (data as { meter_id: string; total_consumption: number }[]).forEach(d => {
        const systemType = meterTypeMap.get(d.meter_id) || 'other';
        const existing = bySystem.get(systemType) || 0;
        bySystem.set(systemType, existing + (d.total_consumption || 0));
      });

      const systemLabels: Record<string, string> = {
        chiller: 'Chillers',
        ahu: 'Air Handling Units',
        pump: 'Pumps',
        cooling_tower: 'Cooling Towers',
        boiler: 'Boilers',
        fan: 'Fans',
        lighting: 'Lighting',
        plug_load: 'Plug Loads',
        other: 'Other',
      };

      const systemColors: Record<string, string> = {
        chiller: 'hsl(var(--chart-1))',
        ahu: 'hsl(var(--chart-2))',
        pump: 'hsl(var(--chart-3))',
        cooling_tower: 'hsl(var(--chart-4))',
        boiler: 'hsl(var(--chart-5))',
        fan: 'hsl(210, 70%, 50%)',
        lighting: 'hsl(45, 90%, 50%)',
        plug_load: 'hsl(280, 60%, 50%)',
        other: 'hsl(var(--muted-foreground))',
      };

      return Array.from(bySystem.entries())
        .filter(([_, value]) => value > 0)
        .map(([system, value]) => ({
          name: systemLabels[system] || system,
          value: Math.round(value),
          color: systemColors[system] || systemColors.other,
        }));
    },
    enabled: !!projectId,
    refetchInterval: 300000,
  });
}

// Get hourly profile (average by hour of day)
export function useHourlyProfile(projectId: string | undefined, timeRange: TimeRange = '30d') {
  const startDate = getStartDate(timeRange);

  return useQuery({
    queryKey: ['energy-hourly-profile', projectId, timeRange],
    queryFn: async () => {
      if (!projectId) return [];

      // Get meters for this project
      const { data: meters, error: metersError } = await supabase
        .from('energy_meters')
        .select('id')
        .eq('project_id', projectId);

      if (metersError) throw metersError;
      if (!meters || meters.length === 0) return [];

      const meterIds = meters.map(m => m.id);

      // Get raw readings to calculate hourly averages
      const { data, error } = await supabase
        .from('energy_readings')
        .select('demand_kw, recorded_at')
        .in('meter_id', meterIds)
        .gte('recorded_at', startDate.toISOString())
        .not('demand_kw', 'is', null);

      if (error) throw error;

      // Aggregate by hour
      const byHour = new Map<number, { total: number; count: number }>();
      
      (data as { demand_kw: number; recorded_at: string }[]).forEach(d => {
        const hour = new Date(d.recorded_at).getHours();
        const existing = byHour.get(hour) || { total: 0, count: 0 };
        byHour.set(hour, {
          total: existing.total + d.demand_kw,
          count: existing.count + 1,
        });
      });

      return Array.from({ length: 24 }, (_, hour) => {
        const data = byHour.get(hour);
        return {
          hour: `${hour.toString().padStart(2, '0')}:00`,
          demand: data ? Math.round(data.total / data.count) : 0,
        };
      });
    },
    enabled: !!projectId,
    refetchInterval: 300000,
  });
}

// Get efficiency metrics
export function useEfficiencyMetrics(projectId: string | undefined, timeRange: TimeRange = '30d') {
  const startDate = getStartDate(timeRange);

  return useQuery({
    queryKey: ['energy-efficiency', projectId, timeRange],
    queryFn: async () => {
      if (!projectId) return null;

      // Get meters for this project
      const { data: meters, error: metersError } = await supabase
        .from('energy_meters')
        .select('id, cost_per_unit')
        .eq('project_id', projectId);

      if (metersError) throw metersError;
      if (!meters || meters.length === 0) return null;

      const meterIds = meters.map(m => m.id);
      const avgCostPerUnit = meters.reduce((sum, m) => sum + (m.cost_per_unit || 0.12), 0) / meters.length;

      // Get daily aggregates
      const { data, error } = await supabase
        .from('energy_daily_aggregates')
        .select('total_consumption, peak_demand_kw, total_cost, date')
        .in('meter_id', meterIds)
        .gte('date', startDate.toISOString().split('T')[0]);

      if (error) throw error;

      const aggregates = data as EnergyDailyAggregate[];
      
      if (aggregates.length === 0) return null;

      const totalConsumption = aggregates.reduce((sum, a) => sum + (a.total_consumption || 0), 0);
      const totalCost = aggregates.reduce((sum, a) => sum + (a.total_cost || 0), 0);
      const peakDemand = Math.max(...aggregates.map(a => a.peak_demand_kw || 0));
      const daysCount = new Set(aggregates.map(a => a.date)).size;

      return {
        totalKwh: Math.round(totalConsumption),
        avgDailyKwh: daysCount > 0 ? Math.round(totalConsumption / daysCount) : 0,
        totalCost: totalCost || Math.round(totalConsumption * avgCostPerUnit * 100) / 100,
        peakDemand: Math.round(peakDemand),
        avgCostPerKwh: avgCostPerUnit,
      };
    },
    enabled: !!projectId,
    refetchInterval: 300000,
  });
}

// Get summary stats for the energy dashboard
export function useEnergySummary(projectId: string | undefined) {
  return useQuery({
    queryKey: ['energy-summary', projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const { data: meters, error } = await supabase
        .from('energy_meters')
        .select('id, status, system_type')
        .eq('project_id', projectId);

      if (error) throw error;

      return {
        totalMeters: meters?.length || 0,
        activeMeters: meters?.filter(m => m.status === 'active').length || 0,
        metersBySystem: meters?.reduce((acc, m) => {
          acc[m.system_type] = (acc[m.system_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {},
      };
    },
    enabled: !!projectId,
  });
}
