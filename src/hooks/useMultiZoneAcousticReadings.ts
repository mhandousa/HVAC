import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TimeRange } from './useAcousticReadings';

export interface ZoneConfig {
  id: string;
  name: string;
  deviceId?: string;
  targetNC: number;
  color?: string;
}

export interface MultiZoneReading {
  time: string;
  timestamp: Date;
  [zoneId: string]: number | string | Date | undefined;
}

export interface ZoneSummaryStats {
  zoneId: string;
  zoneName: string;
  current: number | null;
  min: number;
  max: number;
  avg: number;
  targetNC: number;
  delta: number;
  exceedancePercent: number;
}

function getTimeRangeHours(timeRange: TimeRange): number {
  switch (timeRange) {
    case '7d': return 168;
    case '30d': return 720;
    default: return 24;
  }
}

function getBucketMinutes(timeRange: TimeRange): number {
  switch (timeRange) {
    case '7d': return 240; // 4 hours
    case '30d': return 1440; // 1 day
    default: return 60; // 1 hour
  }
}

async function fetchZoneReadings(deviceId: string, timeRange: TimeRange) {
  const hours = getTimeRangeHours(timeRange);
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('sensor_readings')
    .select('value, recorded_at')
    .eq('device_id', deviceId)
    .gte('recorded_at', since)
    .order('recorded_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

function aggregateReadings(
  readings: Array<{ value: number; recorded_at: string }>,
  timeRange: TimeRange
): Array<{ time: string; timestamp: Date; value: number }> {
  if (readings.length === 0) return [];

  const bucketMinutes = getBucketMinutes(timeRange);
  const buckets = new Map<string, { values: number[]; timestamp: Date }>();

  readings.forEach(reading => {
    const date = new Date(reading.recorded_at);
    const bucketTime = new Date(
      Math.floor(date.getTime() / (bucketMinutes * 60 * 1000)) * bucketMinutes * 60 * 1000
    );
    const key = bucketTime.toISOString();

    if (!buckets.has(key)) {
      buckets.set(key, { values: [], timestamp: bucketTime });
    }
    buckets.get(key)!.values.push(reading.value);
  });

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([_, bucket]) => ({
      time: formatTime(bucket.timestamp, timeRange),
      timestamp: bucket.timestamp,
      value: bucket.values.reduce((a, b) => a + b, 0) / bucket.values.length,
    }));
}

function formatTime(date: Date, timeRange: TimeRange): string {
  if (timeRange === '30d') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else if (timeRange === '7d') {
    return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' });
  }
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// Generate demo data when no real devices exist
function generateDemoData(zones: ZoneConfig[], timeRange: TimeRange): MultiZoneReading[] {
  const hours = getTimeRangeHours(timeRange);
  const bucketMinutes = getBucketMinutes(timeRange);
  const numBuckets = Math.floor((hours * 60) / bucketMinutes);
  const data: MultiZoneReading[] = [];
  const now = new Date();

  for (let i = numBuckets; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * bucketMinutes * 60 * 1000);
    const reading: MultiZoneReading = {
      time: formatTime(timestamp, timeRange),
      timestamp,
    };

    zones.forEach((zone, idx) => {
      // Generate NC values with some variation per zone
      const baseNC = zone.targetNC + (idx - zones.length / 2) * 2;
      const variation = Math.sin(i * 0.3 + idx) * 4 + (Math.random() - 0.5) * 3;
      reading[zone.id] = Math.round((baseNC + variation) * 10) / 10;
    });

    data.push(reading);
  }

  return data;
}

export function useMultiZoneAcousticReadings(
  zones: ZoneConfig[],
  timeRange: TimeRange
) {
  // Only query zones that have device IDs
  const zonesWithDevices = zones.filter(z => z.deviceId);

  const queries = useQueries({
    queries: zonesWithDevices.map(zone => ({
      queryKey: ['acoustic-readings', zone.deviceId, timeRange],
      queryFn: () => fetchZoneReadings(zone.deviceId!, timeRange),
      enabled: !!zone.deviceId,
      staleTime: 60000,
    })),
  });

  const isLoading = queries.some(q => q.isLoading);
  const error = queries.find(q => q.error)?.error;

  // Merge all zone data into unified time series
  const mergedData = useMemo(() => {
    // If no zones have devices, generate demo data
    if (zonesWithDevices.length === 0 && zones.length > 0) {
      return generateDemoData(zones, timeRange);
    }

    // Aggregate each zone's readings
    const aggregatedByZone = new Map<string, Array<{ time: string; timestamp: Date; value: number }>>();
    
    zonesWithDevices.forEach((zone, idx) => {
      const readings = queries[idx]?.data || [];
      aggregatedByZone.set(zone.id, aggregateReadings(readings, timeRange));
    });

    // Collect all unique timestamps
    const allTimestamps = new Set<string>();
    aggregatedByZone.forEach(readings => {
      readings.forEach(r => allTimestamps.add(r.timestamp.toISOString()));
    });

    // Build merged dataset
    const sorted = Array.from(allTimestamps).sort();
    return sorted.map(ts => {
      const timestamp = new Date(ts);
      const reading: MultiZoneReading = {
        time: formatTime(timestamp, timeRange),
        timestamp,
      };

      zones.forEach(zone => {
        const zoneData = aggregatedByZone.get(zone.id);
        const match = zoneData?.find(r => r.timestamp.toISOString() === ts);
        reading[zone.id] = match?.value;
      });

      return reading;
    });
  }, [queries, zones, zonesWithDevices, timeRange]);

  // Calculate summary stats per zone
  const summaryStats = useMemo((): ZoneSummaryStats[] => {
    return zones.map(zone => {
      const values = mergedData
        .map(r => r[zone.id])
        .filter((v): v is number => typeof v === 'number');

      if (values.length === 0) {
        return {
          zoneId: zone.id,
          zoneName: zone.name,
          current: null,
          min: 0,
          max: 0,
          avg: 0,
          targetNC: zone.targetNC,
          delta: 0,
          exceedancePercent: 0,
        };
      }

      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const current = values[values.length - 1];
      const exceeding = values.filter(v => v > zone.targetNC).length;

      return {
        zoneId: zone.id,
        zoneName: zone.name,
        current,
        min: Math.round(min * 10) / 10,
        max: Math.round(max * 10) / 10,
        avg: Math.round(avg * 10) / 10,
        targetNC: zone.targetNC,
        delta: Math.round((current - zone.targetNC) * 10) / 10,
        exceedancePercent: Math.round((exceeding / values.length) * 100),
      };
    });
  }, [zones, mergedData]);

  return {
    data: mergedData,
    summaryStats,
    isLoading,
    error,
    isDemo: zonesWithDevices.length === 0 && zones.length > 0,
  };
}
