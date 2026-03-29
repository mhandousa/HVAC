import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { useToast } from '@/hooks/use-toast';

export interface RuntimeTracking {
  id: string;
  equipment_id: string | null;
  schedule_id: string | null;
  organization_id: string;
  runtime_hours_total: number;
  runtime_since_filter: number;
  last_reset_at: string | null;
  baseline_pressure_drop_pa: number | null;
  current_pressure_drop_pa: number | null;
  pressure_trend_slope: number | null;
  predicted_filter_life_days: number | null;
  created_at: string;
  updated_at: string;
}

export interface PredictiveAlert {
  id: string;
  equipmentId: string;
  equipmentName: string;
  alertType: 'filter_clogging' | 'efficiency_decline' | 'runtime_threshold' | 'pressure_critical';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  predictedDate: string | null;
  confidence: number;
  recommendation: string;
  currentValue: number;
  thresholdValue: number;
  unit: string;
}

interface PressureReading {
  reading_at: string;
  filter_pressure_drop_pa: number | null;
}

// Thresholds for predictive alerts
const THRESHOLDS = {
  FILTER_PRESSURE_WARNING_PA: 200, // Warning when approaching this
  FILTER_PRESSURE_CRITICAL_PA: 250, // Critical - replace immediately
  RUNTIME_WARNING_HOURS: 2000, // Warning for filter replacement
  RUNTIME_CRITICAL_HOURS: 2500, // Critical runtime hours
  EFFICIENCY_DECLINE_PERCENT: 10, // Efficiency decline threshold
  PRESSURE_TREND_SLOPE_WARNING: 0.5, // Pa per day trend
};

export function useERVRuntimeTracking(equipmentId?: string) {
  const orgQuery = useOrganization();
  const organization = orgQuery.data;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: runtimeData, isLoading } = useQuery({
    queryKey: ['erv-runtime-tracking', organization?.id, equipmentId],
    queryFn: async () => {
      if (!organization?.id) return null;

      let query = supabase
        .from('erv_runtime_tracking')
        .select('*')
        .eq('organization_id', organization.id);

      if (equipmentId) {
        query = query.eq('equipment_id', equipmentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as RuntimeTracking[];
    },
    enabled: !!organization?.id,
  });

  const createRuntimeTracking = useMutation({
    mutationFn: async (tracking: Partial<RuntimeTracking>) => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase
        .from('erv_runtime_tracking')
        .insert({
          ...tracking,
          organization_id: organization.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erv-runtime-tracking'] });
      toast({ title: 'Runtime tracking created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating runtime tracking', description: error.message, variant: 'destructive' });
    },
  });

  const updateRuntimeTracking = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RuntimeTracking> & { id: string }) => {
      const { data, error } = await supabase
        .from('erv_runtime_tracking')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erv-runtime-tracking'] });
    },
  });

  const resetFilterRuntime = useMutation({
    mutationFn: async (trackingId: string) => {
      const { data, error } = await supabase
        .from('erv_runtime_tracking')
        .update({
          runtime_since_filter: 0,
          last_reset_at: new Date().toISOString(),
          baseline_pressure_drop_pa: null, // Will be set from next reading
        })
        .eq('id', trackingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erv-runtime-tracking'] });
      toast({ title: 'Filter runtime reset' });
    },
  });

  return {
    runtimeData,
    isLoading,
    createRuntimeTracking,
    updateRuntimeTracking,
    resetFilterRuntime,
  };
}

export function useERVPredictiveAlerts() {
  const orgQuery = useOrganization();
  const organization = orgQuery.data;

  return useQuery({
    queryKey: ['erv-predictive-alerts', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      // Fetch runtime tracking data
      const { data: runtimeData, error: runtimeError } = await supabase
        .from('erv_runtime_tracking')
        .select(`
          *,
          equipment:equipment_id (id, name, tag)
        `)
        .eq('organization_id', organization.id);

      if (runtimeError) throw runtimeError;

      // Fetch recent performance readings
      const { data: performanceData, error: performanceError } = await supabase
        .from('erv_performance_readings')
        .select('*')
        .eq('organization_id', organization.id)
        .order('reading_at', { ascending: false })
        .limit(100);

      if (performanceError) throw performanceError;

      const alerts: PredictiveAlert[] = [];

      // Analyze each tracked equipment
      for (const tracking of runtimeData || []) {
        const equipment = tracking.equipment as { id: string; name: string; tag: string } | null;
        const equipmentName = equipment?.name || equipment?.tag || 'Unknown ERV';

        // Runtime-based alerts
        if (tracking.runtime_since_filter >= THRESHOLDS.RUNTIME_CRITICAL_HOURS) {
          alerts.push({
            id: `runtime-critical-${tracking.id}`,
            equipmentId: tracking.equipment_id || '',
            equipmentName,
            alertType: 'runtime_threshold',
            severity: 'critical',
            title: 'Filter Replacement Overdue',
            message: `Filter has been running for ${Math.round(tracking.runtime_since_filter)} hours since last change.`,
            predictedDate: null,
            confidence: 95,
            recommendation: 'Replace filters immediately to maintain air quality and efficiency.',
            currentValue: tracking.runtime_since_filter,
            thresholdValue: THRESHOLDS.RUNTIME_CRITICAL_HOURS,
            unit: 'hours',
          });
        } else if (tracking.runtime_since_filter >= THRESHOLDS.RUNTIME_WARNING_HOURS) {
          const daysRemaining = Math.round((THRESHOLDS.RUNTIME_CRITICAL_HOURS - tracking.runtime_since_filter) / 8); // Assuming 8 hrs/day operation
          alerts.push({
            id: `runtime-warning-${tracking.id}`,
            equipmentId: tracking.equipment_id || '',
            equipmentName,
            alertType: 'runtime_threshold',
            severity: 'warning',
            title: 'Filter Replacement Due Soon',
            message: `Filter has been running for ${Math.round(tracking.runtime_since_filter)} hours.`,
            predictedDate: new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toISOString(),
            confidence: 85,
            recommendation: `Schedule filter replacement within ${daysRemaining} days.`,
            currentValue: tracking.runtime_since_filter,
            thresholdValue: THRESHOLDS.RUNTIME_WARNING_HOURS,
            unit: 'hours',
          });
        }

        // Pressure-based alerts
        if (tracking.current_pressure_drop_pa) {
          if (tracking.current_pressure_drop_pa >= THRESHOLDS.FILTER_PRESSURE_CRITICAL_PA) {
            alerts.push({
              id: `pressure-critical-${tracking.id}`,
              equipmentId: tracking.equipment_id || '',
              equipmentName,
              alertType: 'pressure_critical',
              severity: 'critical',
              title: 'Critical Filter Pressure Drop',
              message: `Filter pressure drop of ${tracking.current_pressure_drop_pa} Pa exceeds critical threshold.`,
              predictedDate: null,
              confidence: 98,
              recommendation: 'Replace filters immediately. High pressure drop reduces airflow and increases energy consumption.',
              currentValue: tracking.current_pressure_drop_pa,
              thresholdValue: THRESHOLDS.FILTER_PRESSURE_CRITICAL_PA,
              unit: 'Pa',
            });
          } else if (tracking.current_pressure_drop_pa >= THRESHOLDS.FILTER_PRESSURE_WARNING_PA) {
            alerts.push({
              id: `pressure-warning-${tracking.id}`,
              equipmentId: tracking.equipment_id || '',
              equipmentName,
              alertType: 'filter_clogging',
              severity: 'warning',
              title: 'Elevated Filter Pressure Drop',
              message: `Filter pressure drop of ${tracking.current_pressure_drop_pa} Pa is approaching critical levels.`,
              predictedDate: tracking.predicted_filter_life_days 
                ? new Date(Date.now() + tracking.predicted_filter_life_days * 24 * 60 * 60 * 1000).toISOString()
                : null,
              confidence: 80,
              recommendation: 'Plan filter replacement soon. Monitor for further increases.',
              currentValue: tracking.current_pressure_drop_pa,
              thresholdValue: THRESHOLDS.FILTER_PRESSURE_WARNING_PA,
              unit: 'Pa',
            });
          }
        }

        // Trend-based alerts
        if (tracking.pressure_trend_slope && tracking.pressure_trend_slope > THRESHOLDS.PRESSURE_TREND_SLOPE_WARNING) {
          const daysToThreshold = tracking.current_pressure_drop_pa 
            ? Math.round((THRESHOLDS.FILTER_PRESSURE_CRITICAL_PA - tracking.current_pressure_drop_pa) / tracking.pressure_trend_slope)
            : null;
          
          if (daysToThreshold && daysToThreshold > 0 && daysToThreshold < 30) {
            alerts.push({
              id: `trend-warning-${tracking.id}`,
              equipmentId: tracking.equipment_id || '',
              equipmentName,
              alertType: 'filter_clogging',
              severity: 'info',
              title: 'Increasing Filter Pressure Trend',
              message: `Pressure drop is increasing at ${tracking.pressure_trend_slope.toFixed(2)} Pa/day.`,
              predictedDate: new Date(Date.now() + daysToThreshold * 24 * 60 * 60 * 1000).toISOString(),
              confidence: 70,
              recommendation: `At current rate, filter will need replacement in approximately ${daysToThreshold} days.`,
              currentValue: tracking.pressure_trend_slope,
              thresholdValue: THRESHOLDS.PRESSURE_TREND_SLOPE_WARNING,
              unit: 'Pa/day',
            });
          }
        }
      }

      // Analyze efficiency decline from performance readings
      const equipmentReadings = new Map<string, PressureReading[]>();
      for (const reading of performanceData || []) {
        if (reading.equipment_id) {
          const existing = equipmentReadings.get(reading.equipment_id) || [];
          existing.push({
            reading_at: reading.reading_at,
            filter_pressure_drop_pa: reading.filter_pressure_drop_pa,
          });
          equipmentReadings.set(reading.equipment_id, existing);
        }
      }

      // Sort by severity for consistent ordering
      return alerts.sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
    },
    enabled: !!organization?.id,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}

// Calculate pressure trend from historical readings
export function calculatePressureTrend(readings: { timestamp: Date; value: number }[]): {
  slope: number;
  rSquared: number;
  predictedDaysToThreshold: number | null;
} {
  if (readings.length < 3) {
    return { slope: 0, rSquared: 0, predictedDaysToThreshold: null };
  }

  // Sort by timestamp
  const sorted = [...readings].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  // Convert timestamps to days from first reading
  const firstTime = sorted[0].timestamp.getTime();
  const dataPoints = sorted.map(r => ({
    x: (r.timestamp.getTime() - firstTime) / (24 * 60 * 60 * 1000), // Days
    y: r.value,
  }));

  // Linear regression
  const n = dataPoints.length;
  const sumX = dataPoints.reduce((sum, p) => sum + p.x, 0);
  const sumY = dataPoints.reduce((sum, p) => sum + p.y, 0);
  const sumXY = dataPoints.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = dataPoints.reduce((sum, p) => sum + p.x * p.x, 0);
  const sumY2 = dataPoints.reduce((sum, p) => sum + p.y * p.y, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R-squared calculation
  const meanY = sumY / n;
  const ssTotal = dataPoints.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
  const ssRes = dataPoints.reduce((sum, p) => sum + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
  const rSquared = ssTotal > 0 ? 1 - ssRes / ssTotal : 0;

  // Predict days to threshold
  const lastValue = sorted[sorted.length - 1].value;
  const lastDays = dataPoints[dataPoints.length - 1].x;
  let predictedDaysToThreshold: number | null = null;

  if (slope > 0) {
    const daysToThreshold = (THRESHOLDS.FILTER_PRESSURE_CRITICAL_PA - lastValue) / slope;
    if (daysToThreshold > 0) {
      predictedDaysToThreshold = Math.round(daysToThreshold);
    }
  }

  return {
    slope: Math.round(slope * 100) / 100,
    rSquared: Math.round(rSquared * 100) / 100,
    predictedDaysToThreshold,
  };
}

// Hook to get pressure reading history for a specific equipment
export function useERVPressureHistory(equipmentId: string, days: number = 30) {
  const orgQuery = useOrganization();
  const organization = orgQuery.data;

  return useQuery({
    queryKey: ['erv-pressure-history', organization?.id, equipmentId, days],
    queryFn: async () => {
      if (!organization?.id) return [];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('erv_performance_readings')
        .select('reading_at, filter_pressure_drop_pa')
        .eq('organization_id', organization.id)
        .eq('equipment_id', equipmentId)
        .gte('reading_at', startDate.toISOString())
        .order('reading_at', { ascending: true });

      if (error) throw error;

      return (data || [])
        .filter(r => r.filter_pressure_drop_pa !== null)
        .map(r => ({
          timestamp: new Date(r.reading_at),
          value: r.filter_pressure_drop_pa as number,
        }));
    },
    enabled: !!organization?.id && !!equipmentId,
  });
}
