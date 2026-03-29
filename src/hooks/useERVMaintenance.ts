import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface ERVMaintenanceSchedule {
  id: string;
  organization_id: string;
  equipment_id: string | null;
  erv_name: string;
  maintenance_type: string;
  frequency_days: number;
  last_performed_at: string | null;
  next_due_at: string;
  reminder_days_before: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ERVMaintenanceLog {
  id: string;
  schedule_id: string;
  performed_at: string;
  performed_by: string | null;
  technician_name: string | null;
  maintenance_type: string;
  filter_type: string | null;
  filter_part_number: string | null;
  labor_hours: number | null;
  parts_cost_sar: number | null;
  labor_cost_sar: number | null;
  pre_maintenance_efficiency: number | null;
  post_maintenance_efficiency: number | null;
  pressure_drop_before_pa: number | null;
  pressure_drop_after_pa: number | null;
  notes: string | null;
  photos_urls: string[] | null;
  created_at: string;
}

export interface ERVPerformanceReading {
  id: string;
  organization_id: string;
  equipment_id: string | null;
  schedule_id: string | null;
  reading_at: string;
  supply_air_temp_f: number | null;
  return_air_temp_f: number | null;
  outdoor_air_temp_f: number | null;
  exhaust_air_temp_f: number | null;
  sensible_efficiency: number | null;
  latent_efficiency: number | null;
  total_efficiency: number | null;
  supply_airflow_cfm: number | null;
  exhaust_airflow_cfm: number | null;
  filter_pressure_drop_pa: number | null;
  wheel_speed_rpm: number | null;
  power_consumption_kw: number | null;
  notes: string | null;
  created_at: string;
}

export interface ERVAlert {
  id: string;
  organization_id: string;
  schedule_id: string | null;
  equipment_id: string | null;
  alert_type: string;
  severity: string;
  title: string;
  message: string | null;
  threshold_value: number | null;
  actual_value: number | null;
  is_active: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export type MaintenanceType = 
  | 'filter_replacement'
  | 'coil_cleaning'
  | 'wheel_inspection'
  | 'belt_check'
  | 'general_pm';

export const MAINTENANCE_TYPES: { value: MaintenanceType; label: string; defaultFrequency: number }[] = [
  { value: 'filter_replacement', label: 'Filter Replacement', defaultFrequency: 90 },
  { value: 'coil_cleaning', label: 'Coil Cleaning', defaultFrequency: 180 },
  { value: 'wheel_inspection', label: 'Wheel Inspection', defaultFrequency: 365 },
  { value: 'belt_check', label: 'Belt Check', defaultFrequency: 90 },
  { value: 'general_pm', label: 'General PM', defaultFrequency: 90 },
];

export function useERVMaintenanceSchedules() {
  const orgQuery = useOrganization();
  const organization = orgQuery.data;
  const queryClient = useQueryClient();

  const schedulesQuery = useQuery({
    queryKey: ['erv-maintenance-schedules', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('erv_maintenance_schedules')
        .select('*')
        .eq('organization_id', organization.id)
        .order('next_due_at', { ascending: true });

      if (error) throw error;
      return data as ERVMaintenanceSchedule[];
    },
    enabled: !!organization?.id,
  });

  const createSchedule = useMutation({
    mutationFn: async (schedule: Partial<ERVMaintenanceSchedule>) => {
      if (!organization?.id) throw new Error('No organization');
      
      const { data, error } = await supabase
        .from('erv_maintenance_schedules')
        .insert([{
          erv_name: schedule.erv_name!,
          maintenance_type: schedule.maintenance_type!,
          next_due_at: schedule.next_due_at!,
          frequency_days: schedule.frequency_days,
          reminder_days_before: schedule.reminder_days_before,
          notes: schedule.notes,
          is_active: schedule.is_active,
          organization_id: organization.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erv-maintenance-schedules'] });
      toast.success('Maintenance schedule created');
    },
    onError: (error) => {
      toast.error('Failed to create schedule: ' + error.message);
    },
  });

  const updateSchedule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ERVMaintenanceSchedule> & { id: string }) => {
      const { data, error } = await supabase
        .from('erv_maintenance_schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erv-maintenance-schedules'] });
      toast.success('Schedule updated');
    },
    onError: (error) => {
      toast.error('Failed to update schedule: ' + error.message);
    },
  });

  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('erv_maintenance_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erv-maintenance-schedules'] });
      toast.success('Schedule deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete schedule: ' + error.message);
    },
  });

  // Get upcoming maintenance (due within reminder period)
  const upcomingMaintenance = schedulesQuery.data?.filter(s => {
    if (!s.is_active) return false;
    const dueDate = new Date(s.next_due_at);
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + s.reminder_days_before);
    return dueDate <= reminderDate;
  }) || [];

  // Get overdue maintenance
  const overdueMaintenance = schedulesQuery.data?.filter(s => {
    if (!s.is_active) return false;
    return new Date(s.next_due_at) < new Date();
  }) || [];

  return {
    schedules: schedulesQuery.data || [],
    isLoading: schedulesQuery.isLoading,
    error: schedulesQuery.error,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    upcomingMaintenance,
    overdueMaintenance,
    refetch: schedulesQuery.refetch,
  };
}

export function useERVMaintenanceLogs(scheduleId?: string) {
  const queryClient = useQueryClient();

  const logsQuery = useQuery({
    queryKey: ['erv-maintenance-logs', scheduleId],
    queryFn: async () => {
      let query = supabase
        .from('erv_maintenance_logs')
        .select('*')
        .order('performed_at', { ascending: false });

      if (scheduleId) {
        query = query.eq('schedule_id', scheduleId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ERVMaintenanceLog[];
    },
  });

  const logMaintenance = useMutation({
    mutationFn: async (log: Partial<ERVMaintenanceLog> & { schedule_id: string; maintenance_type: string }) => {
      const { data, error } = await supabase
        .from('erv_maintenance_logs')
        .insert([{
          schedule_id: log.schedule_id,
          maintenance_type: log.maintenance_type,
          performed_at: log.performed_at,
          technician_name: log.technician_name,
          filter_type: log.filter_type,
          filter_part_number: log.filter_part_number,
          labor_hours: log.labor_hours,
          parts_cost_sar: log.parts_cost_sar,
          labor_cost_sar: log.labor_cost_sar,
          pre_maintenance_efficiency: log.pre_maintenance_efficiency,
          post_maintenance_efficiency: log.post_maintenance_efficiency,
          pressure_drop_before_pa: log.pressure_drop_before_pa,
          pressure_drop_after_pa: log.pressure_drop_after_pa,
          notes: log.notes,
        }])
        .select()
        .single();

      if (error) throw error;

      // Update the schedule's last_performed_at and next_due_at
      const { data: schedule } = await supabase
        .from('erv_maintenance_schedules')
        .select('frequency_days')
        .eq('id', log.schedule_id)
        .single();

      if (schedule) {
        const nextDue = new Date(log.performed_at || new Date());
        nextDue.setDate(nextDue.getDate() + schedule.frequency_days);

        await supabase
          .from('erv_maintenance_schedules')
          .update({
            last_performed_at: log.performed_at || new Date().toISOString(),
            next_due_at: nextDue.toISOString(),
          })
          .eq('id', log.schedule_id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erv-maintenance-logs'] });
      queryClient.invalidateQueries({ queryKey: ['erv-maintenance-schedules'] });
      toast.success('Maintenance logged successfully');
    },
    onError: (error) => {
      toast.error('Failed to log maintenance: ' + error.message);
    },
  });

  return {
    logs: logsQuery.data || [],
    isLoading: logsQuery.isLoading,
    error: logsQuery.error,
    logMaintenance,
    refetch: logsQuery.refetch,
  };
}

export function useERVPerformanceReadings(scheduleId?: string, equipmentId?: string) {
  const orgQuery = useOrganization();
  const organization = orgQuery.data;
  const queryClient = useQueryClient();

  const readingsQuery = useQuery({
    queryKey: ['erv-performance-readings', organization?.id, scheduleId, equipmentId],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('erv_performance_readings')
        .select('*')
        .eq('organization_id', organization.id)
        .order('reading_at', { ascending: false })
        .limit(100);

      if (scheduleId) {
        query = query.eq('schedule_id', scheduleId);
      }
      if (equipmentId) {
        query = query.eq('equipment_id', equipmentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ERVPerformanceReading[];
    },
    enabled: !!organization?.id,
  });

  const addReading = useMutation({
    mutationFn: async (reading: Partial<ERVPerformanceReading>) => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase
        .from('erv_performance_readings')
        .insert({
          ...reading,
          organization_id: organization.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erv-performance-readings'] });
      toast.success('Performance reading recorded');
    },
    onError: (error) => {
      toast.error('Failed to record reading: ' + error.message);
    },
  });

  // Calculate performance trend
  const performanceTrend = readingsQuery.data?.length ? (() => {
    const readings = readingsQuery.data;
    if (readings.length < 2) return null;

    const recent = readings.slice(0, 5);
    const older = readings.slice(-5);

    const avgRecentEff = recent.reduce((sum, r) => sum + (r.sensible_efficiency || 0), 0) / recent.length;
    const avgOlderEff = older.reduce((sum, r) => sum + (r.sensible_efficiency || 0), 0) / older.length;

    const change = avgRecentEff - avgOlderEff;
    return {
      direction: change > 1 ? 'improving' : change < -1 ? 'declining' : 'stable',
      changePercent: change,
      avgEfficiency: avgRecentEff,
    };
  })() : null;

  return {
    readings: readingsQuery.data || [],
    isLoading: readingsQuery.isLoading,
    error: readingsQuery.error,
    addReading,
    performanceTrend,
    refetch: readingsQuery.refetch,
  };
}

export function useERVAlerts() {
  const orgQuery = useOrganization();
  const organization = orgQuery.data;
  const queryClient = useQueryClient();

  const alertsQuery = useQuery({
    queryKey: ['erv-alerts', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('erv_alerts')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ERVAlert[];
    },
    enabled: !!organization?.id,
  });

  const acknowledgeAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('erv_alerts')
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
      queryClient.invalidateQueries({ queryKey: ['erv-alerts'] });
      toast.success('Alert acknowledged');
    },
  });

  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase
        .from('erv_alerts')
        .update({
          is_active: false,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erv-alerts'] });
      toast.success('Alert resolved');
    },
  });

  const createAlert = useMutation({
    mutationFn: async (alert: Partial<ERVAlert>) => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase
        .from('erv_alerts')
        .insert([{
          alert_type: alert.alert_type!,
          title: alert.title!,
          severity: alert.severity || 'warning',
          message: alert.message,
          schedule_id: alert.schedule_id,
          equipment_id: alert.equipment_id,
          threshold_value: alert.threshold_value,
          actual_value: alert.actual_value,
          organization_id: organization.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erv-alerts'] });
    },
  });

  // Group alerts by severity
  const criticalAlerts = alertsQuery.data?.filter(a => a.severity === 'critical') || [];
  const warningAlerts = alertsQuery.data?.filter(a => a.severity === 'warning') || [];
  const infoAlerts = alertsQuery.data?.filter(a => a.severity === 'info') || [];

  return {
    alerts: alertsQuery.data || [],
    isLoading: alertsQuery.isLoading,
    error: alertsQuery.error,
    acknowledgeAlert,
    resolveAlert,
    createAlert,
    criticalAlerts,
    warningAlerts,
    infoAlerts,
    refetch: alertsQuery.refetch,
  };
}

// Utility function to check and generate alerts based on schedules and performance
export function useERVAlertChecker() {
  const { schedules, overdueMaintenance } = useERVMaintenanceSchedules();
  const { createAlert } = useERVAlerts();

  const checkAndCreateAlerts = async () => {
    // Create alerts for overdue maintenance
    for (const schedule of overdueMaintenance) {
      const daysOverdue = Math.floor(
        (new Date().getTime() - new Date(schedule.next_due_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      await createAlert.mutateAsync({
        schedule_id: schedule.id,
        equipment_id: schedule.equipment_id,
        alert_type: 'maintenance_overdue',
        severity: daysOverdue > 14 ? 'critical' : 'warning',
        title: `${schedule.erv_name}: ${MAINTENANCE_TYPES.find(t => t.value === schedule.maintenance_type)?.label || schedule.maintenance_type} Overdue`,
        message: `Maintenance is ${daysOverdue} days overdue. Last performed: ${schedule.last_performed_at ? new Date(schedule.last_performed_at).toLocaleDateString() : 'Never'}`,
      });
    }
  };

  return { checkAndCreateAlerts };
}
