import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

export type TimeRange = '24h' | '7d' | '30d';

export interface AcousticReading {
  id: string;
  device_id: string;
  value: number;
  recorded_at: string;
}

export interface AggregatedAcousticReading {
  time: string;
  timestamp: Date;
  value: number;
  min: number;
  max: number;
  avg: number;
  exceedsTarget: boolean;
}

function getTimeRangeHours(timeRange: TimeRange): number {
  switch (timeRange) {
    case '7d': return 168;
    case '30d': return 720;
    default: return 24;
  }
}

export function useAcousticReadings(deviceId: string | undefined, timeRange: TimeRange) {
  const hours = getTimeRangeHours(timeRange);
  
  return useQuery({
    queryKey: ['acoustic-readings', deviceId, timeRange],
    queryFn: async () => {
      if (!deviceId) return [];
      
      const fromTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('sensor_readings')
        .select('id, device_id, value, recorded_at')
        .eq('device_id', deviceId)
        .gte('recorded_at', fromTime)
        .order('recorded_at', { ascending: true });

      if (error) throw error;
      return data as AcousticReading[];
    },
    enabled: !!deviceId,
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useAggregatedAcousticReadings(
  deviceId: string | undefined,
  timeRange: TimeRange,
  targetNC?: number
) {
  const { data: readings = [], isLoading, error } = useAcousticReadings(deviceId, timeRange);
  
  const aggregatedData = useMemo(() => {
    if (readings.length === 0) return [];
    
    const hours = getTimeRangeHours(timeRange);
    const now = Date.now();
    
    // Determine aggregation interval
    let intervalMs: number;
    let formatTime: (date: Date) => string;
    
    if (hours <= 24) {
      // 24h: aggregate by hour
      intervalMs = 60 * 60 * 1000;
      formatTime = (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (hours <= 168) {
      // 7d: aggregate by 4 hours
      intervalMs = 4 * 60 * 60 * 1000;
      formatTime = (d) => d.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' });
    } else {
      // 30d: aggregate by day
      intervalMs = 24 * 60 * 60 * 1000;
      formatTime = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    // Group readings by interval
    const buckets = new Map<number, number[]>();
    
    for (const reading of readings) {
      const ts = new Date(reading.recorded_at).getTime();
      const bucketKey = Math.floor(ts / intervalMs) * intervalMs;
      
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, []);
      }
      buckets.get(bucketKey)!.push(reading.value);
    }
    
    // Convert buckets to aggregated data
    const result: AggregatedAcousticReading[] = [];
    const sortedKeys = Array.from(buckets.keys()).sort((a, b) => a - b);
    
    for (const key of sortedKeys) {
      const values = buckets.get(key)!;
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const timestamp = new Date(key);
      
      result.push({
        time: formatTime(timestamp),
        timestamp,
        value: Math.round(avg * 10) / 10,
        min: Math.round(min * 10) / 10,
        max: Math.round(max * 10) / 10,
        avg: Math.round(avg * 10) / 10,
        exceedsTarget: targetNC !== undefined && avg > targetNC,
      });
    }
    
    return result;
  }, [readings, timeRange, targetNC]);
  
  // Calculate summary stats
  const stats = useMemo(() => {
    if (readings.length === 0) {
      return { min: 0, max: 0, avg: 0, current: 0, exceedancePercent: 0 };
    }
    
    const values = readings.map(r => r.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const current = readings[readings.length - 1]?.value || 0;
    
    let exceedancePercent = 0;
    if (targetNC !== undefined) {
      const exceeding = values.filter(v => v > targetNC).length;
      exceedancePercent = Math.round((exceeding / values.length) * 100);
    }
    
    return {
      min: Math.round(min * 10) / 10,
      max: Math.round(max * 10) / 10,
      avg: Math.round(avg * 10) / 10,
      current: Math.round(current * 10) / 10,
      exceedancePercent,
    };
  }, [readings, targetNC]);
  
  return { data: aggregatedData, stats, isLoading, error };
}

// Generate demo data for display when no real readings exist
export function useDemoAcousticReadings(timeRange: TimeRange, targetNC: number = 35) {
  return useMemo(() => {
    const hours = getTimeRangeHours(timeRange);
    const now = Date.now();
    const data: AggregatedAcousticReading[] = [];
    
    let step: number;
    let formatTime: (date: Date) => string;
    
    if (hours <= 24) {
      step = 1;
      formatTime = (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (hours <= 168) {
      step = 4;
      formatTime = (d) => d.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' });
    } else {
      step = 24;
      formatTime = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    for (let i = hours; i >= 0; i -= step) {
      const timestamp = new Date(now - i * 60 * 60 * 1000);
      // Generate realistic NC values with some variation and occasional exceedances
      const baseNC = targetNC + (Math.random() - 0.5) * 8;
      const value = Math.round(baseNC * 10) / 10;
      
      data.push({
        time: formatTime(timestamp),
        timestamp,
        value,
        min: value - Math.random() * 2,
        max: value + Math.random() * 2,
        avg: value,
        exceedsTarget: value > targetNC,
      });
    }
    
    return data;
  }, [timeRange, targetNC]);
}
