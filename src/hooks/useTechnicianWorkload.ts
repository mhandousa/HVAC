import { useMemo } from 'react';
import { useDeficiencyAssignments, DeficiencyAssignment, AssignmentStatus, AssignmentPriority } from './useDeficiencyAssignments';
import { useTechnicians, Technician } from './useTechnicians';
import { differenceInDays, subDays, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';

export interface EnrichedAssignment extends DeficiencyAssignment {
  daysUntilDue: number | null;
  isOverdue: boolean;
  resolutionDays: number | null;
}

export interface TechnicianMetrics {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  
  // Counts
  totalAssigned: number;
  activeAssignments: number;
  resolvedAssignments: number;
  overdueAssignments: number;
  inProgressAssignments: number;
  
  // Performance metrics
  resolutionRate: number;
  onTimeCompletionRate: number;
  avgResolutionDays: number;
  
  // Priority breakdown
  urgentCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  
  // Trend data
  resolvedThisWeek: number;
  resolvedLastWeek: number;
  trend: 'up' | 'down' | 'stable';
  
  // Assignments list
  assignments: EnrichedAssignment[];
}

export interface WorkloadStats {
  totalAssignments: number;
  totalResolved: number;
  totalOverdue: number;
  totalActive: number;
  avgResolutionDays: number;
  avgOnTimeRate: number;
  unassignedCount: number;
  technicianCount: number;
}

export function useTechnicianWorkload() {
  const { assignments, isLoading: assignmentsLoading } = useDeficiencyAssignments();
  const { data: technicians, isLoading: techniciansLoading } = useTechnicians();

  const isLoading = assignmentsLoading || techniciansLoading;

  const enrichedAssignments = useMemo(() => {
    const now = new Date();
    return assignments.map((a): EnrichedAssignment => {
      const dueDate = a.dueDate ? parseISO(a.dueDate) : null;
      const daysUntilDue = dueDate ? differenceInDays(dueDate, now) : null;
      const isOverdue = a.status !== 'resolved' && dueDate !== null && dueDate < now;
      
      // Calculate resolution days if resolved
      let resolutionDays: number | null = null;
      if (a.status === 'resolved') {
        const createdAt = parseISO(a.createdAt);
        const updatedAt = parseISO(a.updatedAt);
        resolutionDays = differenceInDays(updatedAt, createdAt);
      }

      return {
        ...a,
        daysUntilDue,
        isOverdue,
        resolutionDays,
      };
    });
  }, [assignments]);

  const technicianMetrics = useMemo((): TechnicianMetrics[] => {
    if (!technicians) return [];

    const now = new Date();
    const thisWeekStart = startOfWeek(now);
    const thisWeekEnd = endOfWeek(now);
    const lastWeekStart = startOfWeek(subDays(now, 7));
    const lastWeekEnd = endOfWeek(subDays(now, 7));

    return technicians.map((tech): TechnicianMetrics => {
      const techAssignments = enrichedAssignments.filter(a => a.assignedTo === tech.id);
      
      const totalAssigned = techAssignments.length;
      const activeAssignments = techAssignments.filter(a => a.status === 'assigned').length;
      const inProgressAssignments = techAssignments.filter(a => a.status === 'in_progress').length;
      const resolvedAssignments = techAssignments.filter(a => a.status === 'resolved').length;
      const overdueAssignments = techAssignments.filter(a => a.isOverdue).length;

      // Performance metrics
      const resolutionRate = totalAssigned > 0 ? (resolvedAssignments / totalAssigned) * 100 : 0;
      
      // On-time completion: resolved before due date
      const resolvedWithDue = techAssignments.filter(a => a.status === 'resolved' && a.dueDate);
      const onTimeCount = resolvedWithDue.filter(a => {
        const dueDate = parseISO(a.dueDate!);
        const resolvedAt = parseISO(a.updatedAt);
        return resolvedAt <= dueDate;
      }).length;
      const onTimeCompletionRate = resolvedWithDue.length > 0 ? (onTimeCount / resolvedWithDue.length) * 100 : 100;

      // Average resolution days
      const resolvedWithDays = techAssignments.filter(a => a.resolutionDays !== null);
      const totalDays = resolvedWithDays.reduce((sum, a) => sum + (a.resolutionDays || 0), 0);
      const avgResolutionDays = resolvedWithDays.length > 0 ? totalDays / resolvedWithDays.length : 0;

      // Priority breakdown
      const urgentCount = techAssignments.filter(a => a.priority === 'urgent' && a.status !== 'resolved').length;
      const highCount = techAssignments.filter(a => a.priority === 'high' && a.status !== 'resolved').length;
      const mediumCount = techAssignments.filter(a => a.priority === 'medium' && a.status !== 'resolved').length;
      const lowCount = techAssignments.filter(a => a.priority === 'low' && a.status !== 'resolved').length;

      // Trend calculations
      const resolvedThisWeek = techAssignments.filter(a => {
        if (a.status !== 'resolved') return false;
        const updatedAt = parseISO(a.updatedAt);
        return isWithinInterval(updatedAt, { start: thisWeekStart, end: thisWeekEnd });
      }).length;

      const resolvedLastWeek = techAssignments.filter(a => {
        if (a.status !== 'resolved') return false;
        const updatedAt = parseISO(a.updatedAt);
        return isWithinInterval(updatedAt, { start: lastWeekStart, end: lastWeekEnd });
      }).length;

      const trend: 'up' | 'down' | 'stable' = 
        resolvedThisWeek > resolvedLastWeek ? 'up' :
        resolvedThisWeek < resolvedLastWeek ? 'down' : 'stable';

      return {
        id: tech.id,
        name: tech.full_name || 'Unknown',
        email: tech.email,
        avatarUrl: tech.avatar_url,
        totalAssigned,
        activeAssignments,
        resolvedAssignments,
        overdueAssignments,
        inProgressAssignments,
        resolutionRate,
        onTimeCompletionRate,
        avgResolutionDays,
        urgentCount,
        highCount,
        mediumCount,
        lowCount,
        resolvedThisWeek,
        resolvedLastWeek,
        trend,
        assignments: techAssignments,
      };
    }).filter(t => t.totalAssigned > 0 || true); // Include all technicians
  }, [technicians, enrichedAssignments]);

  const workloadStats = useMemo((): WorkloadStats => {
    const totalAssignments = enrichedAssignments.length;
    const totalResolved = enrichedAssignments.filter(a => a.status === 'resolved').length;
    const totalOverdue = enrichedAssignments.filter(a => a.isOverdue).length;
    const totalActive = enrichedAssignments.filter(a => a.status !== 'resolved').length;

    // Calculate average resolution days across all
    const resolvedWithDays = enrichedAssignments.filter(a => a.resolutionDays !== null);
    const totalDays = resolvedWithDays.reduce((sum, a) => sum + (a.resolutionDays || 0), 0);
    const avgResolutionDays = resolvedWithDays.length > 0 ? totalDays / resolvedWithDays.length : 0;

    // Calculate average on-time rate
    const activeTechnicians = technicianMetrics.filter(t => t.totalAssigned > 0);
    const avgOnTimeRate = activeTechnicians.length > 0
      ? activeTechnicians.reduce((sum, t) => sum + t.onTimeCompletionRate, 0) / activeTechnicians.length
      : 100;

    return {
      totalAssignments,
      totalResolved,
      totalOverdue,
      totalActive,
      avgResolutionDays,
      avgOnTimeRate,
      unassignedCount: 0, // This would need deficiency data
      technicianCount: activeTechnicians.length,
    };
  }, [enrichedAssignments, technicianMetrics]);

  const getWorkloadDistribution = () => {
    return technicianMetrics
      .filter(t => t.totalAssigned > 0)
      .map(t => ({
        name: t.name,
        assigned: t.activeAssignments,
        inProgress: t.inProgressAssignments,
        overdue: t.overdueAssignments,
        resolved: t.resolvedAssignments,
        total: t.totalAssigned,
      }))
      .sort((a, b) => b.total - a.total);
  };

  const getPerformanceLeaderboard = () => {
    return [...technicianMetrics]
      .filter(t => t.totalAssigned > 0)
      .sort((a, b) => b.resolutionRate - a.resolutionRate)
      .slice(0, 10);
  };

  const getTechnicianById = (id: string) => {
    return technicianMetrics.find(t => t.id === id);
  };

  return {
    technicianMetrics,
    workloadStats,
    enrichedAssignments,
    isLoading,
    getWorkloadDistribution,
    getPerformanceLeaderboard,
    getTechnicianById,
  };
}
