import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SensorReading {
  id: string;
  device_id: string;
  value: number;
  quality: 'good' | 'uncertain' | 'bad';
  recorded_at: string;
  received_at: string;
}

export interface AggregatedReading {
  time: string;
  avg: number;
  min: number;
  max: number;
  count: number;
}

export type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';

function getTimeRangeInterval(range: TimeRange): { hours: number; intervalMinutes: number } {
  switch (range) {
    case '1h': return { hours: 1, intervalMinutes: 5 };
    case '6h': return { hours: 6, intervalMinutes: 15 };
    case '24h': return { hours: 24, intervalMinutes: 60 };
    case '7d': return { hours: 168, intervalMinutes: 360 };
    case '30d': return { hours: 720, intervalMinutes: 1440 };
    default: return { hours: 24, intervalMinutes: 60 };
  }
}

export function useSensorReadings(deviceId: string | undefined, timeRange: TimeRange = '24h') {
  const { hours, intervalMinutes } = getTimeRangeInterval(timeRange);

  return useQuery({
    queryKey: ['sensor-readings', deviceId, timeRange],
    queryFn: async () => {
      if (!deviceId) return [];

      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);

      const { data, error } = await supabase
        .from('sensor_readings')
        .select('*')
        .eq('device_id', deviceId)
        .gte('recorded_at', startTime.toISOString())
        .order('recorded_at', { ascending: true });

      if (error) throw error;
      return data as SensorReading[];
    },
    enabled: !!deviceId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useLatestReadings(deviceIds: string[]) {
  return useQuery({
    queryKey: ['sensor-readings', 'latest', deviceIds],
    queryFn: async () => {
      if (deviceIds.length === 0) return {};

      // Get latest reading for each device
      const readings: Record<string, SensorReading> = {};
      
      // Batch query - get recent readings for all devices
      const { data, error } = await supabase
        .from('sensor_readings')
        .select('*')
        .in('device_id', deviceIds)
        .gte('recorded_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
        .order('recorded_at', { ascending: false });

      if (error) throw error;

      // Group by device and take the latest
      for (const reading of data || []) {
        if (!readings[reading.device_id]) {
          readings[reading.device_id] = reading as SensorReading;
        }
      }

      return readings;
    },
    enabled: deviceIds.length > 0,
    refetchInterval: 10000, // Refetch every 10 seconds for live data
  });
}

export function useAggregatedReadings(deviceId: string | undefined, timeRange: TimeRange = '24h') {
  const { hours, intervalMinutes } = getTimeRangeInterval(timeRange);

  return useQuery({
    queryKey: ['sensor-readings', 'aggregated', deviceId, timeRange],
    queryFn: async () => {
      if (!deviceId) return [];

      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);

      const { data, error } = await supabase
        .from('sensor_readings')
        .select('*')
        .eq('device_id', deviceId)
        .gte('recorded_at', startTime.toISOString())
        .order('recorded_at', { ascending: true });

      if (error) throw error;

      // Aggregate readings into intervals
      const aggregated: AggregatedReading[] = [];
      const intervalMs = intervalMinutes * 60 * 1000;
      
      if (!data || data.length === 0) return [];

      let currentBucket = Math.floor(new Date(data[0].recorded_at).getTime() / intervalMs) * intervalMs;
      let bucketReadings: number[] = [];

      for (const reading of data) {
        const readingTime = new Date(reading.recorded_at).getTime();
        const readingBucket = Math.floor(readingTime / intervalMs) * intervalMs;

        if (readingBucket !== currentBucket) {
          if (bucketReadings.length > 0) {
            aggregated.push({
              time: new Date(currentBucket).toISOString(),
              avg: bucketReadings.reduce((a, b) => a + b, 0) / bucketReadings.length,
              min: Math.min(...bucketReadings),
              max: Math.max(...bucketReadings),
              count: bucketReadings.length,
            });
          }
          currentBucket = readingBucket;
          bucketReadings = [];
        }
        bucketReadings.push(Number(reading.value));
      }

      // Don't forget the last bucket
      if (bucketReadings.length > 0) {
        aggregated.push({
          time: new Date(currentBucket).toISOString(),
          avg: bucketReadings.reduce((a, b) => a + b, 0) / bucketReadings.length,
          min: Math.min(...bucketReadings),
          max: Math.max(...bucketReadings),
          count: bucketReadings.length,
        });
      }

      return aggregated;
    },
    enabled: !!deviceId,
    refetchInterval: 60000, // Refetch every minute for charts
  });
}

export function useMultiDeviceReadings(deviceIds: string[], timeRange: TimeRange = '24h') {
  const { hours } = getTimeRangeInterval(timeRange);

  return useQuery({
    queryKey: ['sensor-readings', 'multi', deviceIds, timeRange],
    queryFn: async () => {
      if (deviceIds.length === 0) return {};

      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);

      const { data, error } = await supabase
        .from('sensor_readings')
        .select('*')
        .in('device_id', deviceIds)
        .gte('recorded_at', startTime.toISOString())
        .order('recorded_at', { ascending: true });

      if (error) throw error;

      // Group by device
      const grouped: Record<string, SensorReading[]> = {};
      for (const reading of data || []) {
        if (!grouped[reading.device_id]) {
          grouped[reading.device_id] = [];
        }
        grouped[reading.device_id].push(reading as SensorReading);
      }

      return grouped;
    },
    enabled: deviceIds.length > 0,
    refetchInterval: 30000,
  });
}
