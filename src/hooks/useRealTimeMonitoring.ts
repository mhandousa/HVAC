import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import type { SensorReading } from './useSensorReadings';
import type { MonitoringAlert } from './useMonitoringAlerts';
import type { IoTDevice } from './useIoTDevices';

interface RealTimeState {
  latestReadings: Record<string, SensorReading>;
  newAlerts: MonitoringAlert[];
  deviceStatusChanges: Record<string, IoTDevice['status']>;
}

export function useRealTimeMonitoring() {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [realTimeData, setRealTimeData] = useState<RealTimeState>({
    latestReadings: {},
    newAlerts: [],
    deviceStatusChanges: {},
  });

  const clearNewAlerts = useCallback(() => {
    setRealTimeData(prev => ({ ...prev, newAlerts: [] }));
  }, []);

  useEffect(() => {
    if (!organization?.id) return;

    // Subscribe to sensor_readings inserts
    const readingsChannel = supabase
      .channel('sensor-readings-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
        },
        (payload) => {
          const reading = payload.new as SensorReading;
          setRealTimeData(prev => ({
            ...prev,
            latestReadings: {
              ...prev.latestReadings,
              [reading.device_id]: reading,
            },
          }));
          // Invalidate related queries
          queryClient.invalidateQueries({ queryKey: ['sensor-readings', 'latest'] });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Subscribe to monitoring_alerts changes
    const alertsChannel = supabase
      .channel('monitoring-alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'monitoring_alerts',
        },
        (payload) => {
          const alert = payload.new as MonitoringAlert;
          if (alert.organization_id === organization.id) {
            setRealTimeData(prev => ({
              ...prev,
              newAlerts: [alert, ...prev.newAlerts].slice(0, 10), // Keep last 10
            }));
            // Invalidate alerts queries
            queryClient.invalidateQueries({ queryKey: ['monitoring-alerts'] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'monitoring_alerts',
        },
        (payload) => {
          const alert = payload.new as MonitoringAlert;
          if (alert.organization_id === organization.id) {
            queryClient.invalidateQueries({ queryKey: ['monitoring-alerts'] });
          }
        }
      )
      .subscribe();

    // Subscribe to iot_devices status changes
    const devicesChannel = supabase
      .channel('iot-devices-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'iot_devices',
        },
        (payload) => {
          const device = payload.new as IoTDevice;
          const oldDevice = payload.old as IoTDevice;
          if (device.organization_id === organization.id && device.status !== oldDevice.status) {
            setRealTimeData(prev => ({
              ...prev,
              deviceStatusChanges: {
                ...prev.deviceStatusChanges,
                [device.id]: device.status,
              },
            }));
            // Invalidate devices query
            queryClient.invalidateQueries({ queryKey: ['iot-devices'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(readingsChannel);
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(devicesChannel);
    };
  }, [organization?.id, queryClient]);

  return {
    isConnected,
    latestReadings: realTimeData.latestReadings,
    newAlerts: realTimeData.newAlerts,
    deviceStatusChanges: realTimeData.deviceStatusChanges,
    clearNewAlerts,
  };
}

// Hook for subscribing to a specific device's readings
export function useDeviceRealTimeReadings(deviceId: string | undefined) {
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null);

  useEffect(() => {
    if (!deviceId) return;

    const channel = supabase
      .channel(`device-readings-${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          setLatestReading(payload.new as SensorReading);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId]);

  return latestReading;
}
