import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

export interface AcousticAlert {
  id: string;
  organization_id: string;
  device_id: string | null;
  acoustic_zone_id: string | null;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string | null;
  value: number | null;
  threshold: number | null;
  measured_nc: number | null;
  target_nc: number | null;
  is_active: boolean;
  triggered_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  device?: {
    device_name: string;
    device_type: string;
  } | null;
  zone?: {
    id: string;
    name: string;
    zone_type: string | null;
  } | null;
}

interface AcousticAlertSummary {
  total: number;
  critical: number;
  warning: number;
  info: number;
  exceedingZones: Array<{
    zoneId: string;
    zoneName: string;
    measuredNC: number;
    targetNC: number;
    delta: number;
  }>;
}

export function useAcousticAlerts(projectId?: string, activeOnly = true) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['acoustic-alerts', organization?.id, projectId, activeOnly],
    queryFn: async (): Promise<AcousticAlert[]> => {
      if (!organization?.id) return [];

      let query = supabase
        .from('monitoring_alerts')
        .select(`
          *,
          device:iot_devices(device_name, device_type),
          zone:zones!monitoring_alerts_acoustic_zone_id_fkey(id, name, zone_type)
        `)
        .eq('organization_id', organization.id)
        .eq('alert_type', 'acoustic_exceedance')
        .order('triggered_at', { ascending: false })
        .limit(100);

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching acoustic alerts:', error);
        throw error;
      }

      return (data || []).map(alert => ({
        ...alert,
        device: Array.isArray(alert.device) ? alert.device[0] : alert.device,
        zone: Array.isArray(alert.zone) ? alert.zone[0] : alert.zone,
      })) as AcousticAlert[];
    },
    enabled: !!organization?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useAcousticAlertSummary() {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['acoustic-alert-summary', organization?.id],
    queryFn: async (): Promise<AcousticAlertSummary> => {
      if (!organization?.id) {
        return { total: 0, critical: 0, warning: 0, info: 0, exceedingZones: [] };
      }

      const { data, error } = await supabase
        .from('monitoring_alerts')
        .select(`
          id,
          severity,
          measured_nc,
          target_nc,
          acoustic_zone_id,
          zone:zones!monitoring_alerts_acoustic_zone_id_fkey(id, name)
        `)
        .eq('organization_id', organization.id)
        .eq('alert_type', 'acoustic_exceedance')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching alert summary:', error);
        throw error;
      }

      const alerts = data || [];
      
      const summary: AcousticAlertSummary = {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length,
        exceedingZones: [],
      };

      // Build unique exceeding zones list
      const zoneMap = new Map<string, AcousticAlertSummary['exceedingZones'][0]>();
      
      for (const alert of alerts) {
        if (alert.acoustic_zone_id && alert.measured_nc && alert.target_nc) {
          const zone = Array.isArray(alert.zone) ? alert.zone[0] : alert.zone;
          if (zone && !zoneMap.has(alert.acoustic_zone_id)) {
            zoneMap.set(alert.acoustic_zone_id, {
              zoneId: alert.acoustic_zone_id,
              zoneName: zone.name,
              measuredNC: alert.measured_nc,
              targetNC: alert.target_nc,
              delta: alert.measured_nc - alert.target_nc,
            });
          }
        }
      }

      summary.exceedingZones = Array.from(zoneMap.values())
        .sort((a, b) => b.delta - a.delta);

      return summary;
    },
    enabled: !!organization?.id,
    refetchInterval: 30000,
  });
}

export function useAcknowledgeAcousticAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('monitoring_alerts')
        .update({
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user?.id,
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acoustic-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['acoustic-alert-summary'] });
      toast.success('Alert acknowledged');
    },
    onError: (error) => {
      console.error('Error acknowledging alert:', error);
      toast.error('Failed to acknowledge alert');
    },
  });
}

export function useResolveAcousticAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('monitoring_alerts')
        .update({
          resolved_at: new Date().toISOString(),
          is_active: false,
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acoustic-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['acoustic-alert-summary'] });
      toast.success('Alert resolved');
    },
    onError: (error) => {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
    },
  });
}

export function useTriggerAcousticAlertCheck() {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('acoustic-alert-check', {
        body: { organization_id: organization?.id },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['acoustic-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['acoustic-alert-summary'] });
      
      if (data.alerts_created > 0) {
        toast.warning(`${data.alerts_created} new acoustic alert(s) detected`);
      } else {
        toast.success('Acoustic check complete - no new alerts');
      }
    },
    onError: (error) => {
      console.error('Error triggering acoustic check:', error);
      toast.error('Failed to run acoustic alert check');
    },
  });
}
