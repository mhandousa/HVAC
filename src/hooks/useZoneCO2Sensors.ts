import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';

export interface ZoneCO2Sensor {
  deviceId: string;
  deviceName: string;
  zoneId: string;
  zoneName: string;
  floorName?: string;
  buildingName?: string;
  projectId?: string;
  currentReading?: number;
  lastReadingAt?: string;
  status: string;
  minThreshold?: number;
  maxThreshold?: number;
  setpoint?: number;
}

export function useZoneCO2Sensors(projectId?: string) {
  const { data: organization } = useOrganization();
  
  return useQuery({
    queryKey: ['zone-co2-sensors', organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      // Query IoT devices that are CO2 sensors linked to zones
      let query = supabase
        .from('iot_devices')
        .select(`
          id,
          name,
          device_id,
          device_type,
          status,
          last_reading_value,
          last_reading_at,
          min_threshold,
          max_threshold,
          setpoint,
          zone_id,
          zones!inner (
            id,
            name,
            floor_id,
            floors!inner (
              id,
              name,
              building_id,
              buildings!inner (
                id,
                name,
                project_id
              )
            )
          )
        `)
        .eq('organization_id', organization.id)
        .eq('device_type', 'co2')
        .eq('is_active', true);
      
      if (projectId) {
        query = query.eq('zones.floors.buildings.project_id', projectId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching CO2 sensors:', error);
        return [];
      }
      
      return (data || []).map((device: any): ZoneCO2Sensor => ({
        deviceId: device.id,
        deviceName: device.name,
        zoneId: device.zones?.id || '',
        zoneName: device.zones?.name || 'Unknown Zone',
        floorName: device.zones?.floors?.name,
        buildingName: device.zones?.floors?.buildings?.name,
        projectId: device.zones?.floors?.buildings?.project_id,
        currentReading: device.last_reading_value,
        lastReadingAt: device.last_reading_at,
        status: device.status,
        minThreshold: device.min_threshold,
        maxThreshold: device.max_threshold,
        setpoint: device.setpoint,
      }));
    },
    enabled: !!organization?.id,
    refetchInterval: 30000, // Refresh every 30 seconds for real-time monitoring
  });
}

export function useZoneCO2Readings(deviceIds: string[]) {
  return useQuery({
    queryKey: ['zone-co2-readings', deviceIds],
    queryFn: async () => {
      if (deviceIds.length === 0) return {};
      
      // Get latest readings from iot_devices directly (last_reading_value)
      const { data, error } = await supabase
        .from('iot_devices')
        .select('id, last_reading_value, last_reading_at')
        .in('id', deviceIds);
      
      if (error) {
        console.error('Error fetching CO2 readings:', error);
        return {};
      }
      
      // Map to readings
      const latestReadings: Record<string, { value: number; timestamp: string }> = {};
      
      for (const device of data || []) {
        if (device.last_reading_value !== null) {
          latestReadings[device.id] = {
            value: device.last_reading_value,
            timestamp: device.last_reading_at || new Date().toISOString(),
          };
        }
      }
      
      return latestReadings;
    },
    enabled: deviceIds.length > 0,
    refetchInterval: 10000, // Refresh every 10 seconds for real-time data
  });
}

export function useZoneOccupancySensors(projectId?: string) {
  const { data: organization } = useOrganization();
  
  return useQuery({
    queryKey: ['zone-occupancy-sensors', organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      let query = supabase
        .from('iot_devices')
        .select(`
          id,
          name,
          device_id,
          status,
          last_reading_value,
          last_reading_at,
          zone_id,
          zones!inner (
            id,
            name,
            floors!inner (
              buildings!inner (
                project_id
              )
            )
          )
        `)
        .eq('organization_id', organization.id)
        .eq('device_type', 'occupancy')
        .eq('is_active', true);
      
      if (projectId) {
        query = query.eq('zones.floors.buildings.project_id', projectId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching occupancy sensors:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!organization?.id,
    refetchInterval: 30000,
  });
}
