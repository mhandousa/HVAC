import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

export interface MonitoringAlert {
  id: string;
  organization_id: string;
  device_id: string | null;
  equipment_id: string | null;
  alert_type: 'threshold_high' | 'threshold_low' | 'offline' | 'fault' | 'maintenance' | 'custom';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string | null;
  value: number | null;
  threshold: number | null;
  triggered_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  is_active: boolean;
  created_at: string;
  device?: { id: string; name: string; device_type: string } | null;
  equipment?: { id: string; name: string; tag: string } | null;
}

export function useMonitoringAlerts(activeOnly = true) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['monitoring-alerts', organization?.id, activeOnly],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('monitoring_alerts')
        .select(`
          *,
          device:device_id(id, name, device_type),
          equipment:equipment_id(id, name, tag)
        `)
        .eq('organization_id', organization.id)
        .order('triggered_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data as MonitoringAlert[];
    },
    enabled: !!organization?.id,
    refetchInterval: 15000,
  });
}

export function useAlertsByDevice(deviceId: string | undefined) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['monitoring-alerts', 'device', deviceId],
    queryFn: async () => {
      if (!organization?.id || !deviceId) return [];

      const { data, error } = await supabase
        .from('monitoring_alerts')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('device_id', deviceId)
        .order('triggered_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as MonitoringAlert[];
    },
    enabled: !!organization?.id && !!deviceId,
  });
}

export function useAlertCounts() {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['monitoring-alerts', 'counts', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return { critical: 0, warning: 0, info: 0, total: 0 };

      const { data, error } = await supabase
        .from('monitoring_alerts')
        .select('severity')
        .eq('organization_id', organization.id)
        .eq('is_active', true);

      if (error) throw error;

      const counts = { critical: 0, warning: 0, info: 0, total: 0 };
      for (const alert of data || []) {
        counts[alert.severity as keyof typeof counts]++;
        counts.total++;
      }

      return counts;
    },
    enabled: !!organization?.id,
    refetchInterval: 15000,
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase
        .from('monitoring_alerts')
        .update({
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user?.id,
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-alerts'] });
      toast({ title: 'Alert acknowledged' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to acknowledge alert', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase
        .from('monitoring_alerts')
        .update({
          resolved_at: new Date().toISOString(),
          is_active: false,
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-alerts'] });
      toast({ title: 'Alert resolved' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to resolve alert', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
}

export function useCreateAlert() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async (input: {
      device_id?: string;
      equipment_id?: string;
      alert_type: MonitoringAlert['alert_type'];
      severity: MonitoringAlert['severity'];
      title: string;
      message?: string;
      value?: number;
      threshold?: number;
    }) => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase
        .from('monitoring_alerts')
        .insert({
          device_id: input.device_id,
          equipment_id: input.equipment_id,
          alert_type: input.alert_type,
          severity: input.severity,
          title: input.title,
          message: input.message,
          value: input.value,
          threshold: input.threshold,
          organization_id: organization.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-alerts'] });
    },
  });
}

// Helper to get severity color classes
export function getAlertSeverityStyles(severity: MonitoringAlert['severity']) {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-destructive/10',
        border: 'border-destructive',
        text: 'text-destructive',
        badge: 'bg-destructive text-destructive-foreground',
      };
    case 'warning':
      return {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500',
        text: 'text-yellow-600 dark:text-yellow-400',
        badge: 'bg-yellow-500 text-white',
      };
    case 'info':
      return {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500',
        text: 'text-blue-600 dark:text-blue-400',
        badge: 'bg-blue-500 text-white',
      };
    default:
      return {
        bg: 'bg-muted',
        border: 'border-muted',
        text: 'text-muted-foreground',
        badge: 'bg-muted text-muted-foreground',
      };
  }
}
