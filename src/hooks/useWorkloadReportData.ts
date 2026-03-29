import { useMemo } from 'react';
import { useTechnicianWorkload } from './useTechnicianWorkload';
import { useWorkloadBalancing } from './useWorkloadBalancing';
import { WorkloadReportData } from '@/lib/workload-report-pdf';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export type DateRangePreset = 'this-week' | 'this-month' | 'last-month' | 'last-3-months' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export function getDateRangeFromPreset(preset: DateRangePreset, customRange?: DateRange): DateRange {
  const now = new Date();
  
  switch (preset) {
    case 'this-week': {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    }
    case 'this-month':
      return { start: startOfMonth(now), end: now };
    case 'last-month': {
      const lastMonth = subMonths(now, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    }
    case 'last-3-months': {
      const threeMonthsAgo = subMonths(now, 3);
      return { start: startOfMonth(threeMonthsAgo), end: now };
    }
    case 'custom':
      return customRange || { start: startOfMonth(now), end: now };
    default:
      return { start: startOfMonth(now), end: now };
  }
}

export function useWorkloadReportData(
  dateRangePreset: DateRangePreset = 'this-month',
  customDateRange?: DateRange
): {
  data: WorkloadReportData | null;
  isLoading: boolean;
  dateRange: DateRange;
} {
  const {
    technicianMetrics,
    workloadStats,
    enrichedAssignments,
    isLoading,
  } = useTechnicianWorkload();

  const { balancingResult } = useWorkloadBalancing();

  const dateRange = useMemo(
    () => getDateRangeFromPreset(dateRangePreset, customDateRange),
    [dateRangePreset, customDateRange]
  );

  const data = useMemo<WorkloadReportData | null>(() => {
    if (isLoading) return null;

    // Filter assignments by date range
    const filteredAssignments = enrichedAssignments.filter(a => {
      const createdAt = new Date(a.createdAt);
      return createdAt >= dateRange.start && createdAt <= dateRange.end;
    });

    // Build balancing suggestions from the balancing result - group by from/to technicians
    const suggestionGroups = new Map<string, { from: string; to: string; count: number; reason: string }>();
    
    balancingResult.suggestions.forEach(s => {
      const key = `${s.fromTechnicianId}-${s.toTechnicianId}`;
      const existing = suggestionGroups.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        suggestionGroups.set(key, {
          from: s.fromTechnicianName,
          to: s.toTechnicianName,
          count: 1,
          reason: s.reason,
        });
      }
    });

    const balancingSuggestions = Array.from(suggestionGroups.values()).map(g => ({
      fromTechnicianName: g.from,
      toTechnicianName: g.to,
      assignmentCount: g.count,
      reason: g.reason,
    }));

    return {
      generatedAt: new Date(),
      dateRange,
      teamStats: workloadStats,
      balanceScore: balancingResult.currentImbalance.balanceScore,
      technicianMetrics,
      assignments: filteredAssignments,
      balancingSuggestions,
    };
  }, [
    isLoading,
    technicianMetrics,
    workloadStats,
    enrichedAssignments,
    balancingResult,
    dateRange,
  ]);

  return { data, isLoading, dateRange };
}
