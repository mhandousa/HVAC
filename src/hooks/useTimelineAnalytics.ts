import { useMemo } from 'react';
import { useProjectMilestones, ProjectStageMilestone } from './useProjectMilestones';
import { useDesignWorkflowProgress } from './useDesignWorkflowProgress';
import { calculateScheduleHealth, getBusinessDaysBetween, ScheduleHealth, STAGE_TIMING_CONFIGS } from '@/lib/timeline-utils';

export interface TimelineAnalytics {
  totalPlannedDays: number;
  totalActualDays: number;
  elapsedDays: number;
  variance: number; // positive = ahead, negative = behind
  onTrackStages: number;
  delayedStages: number;
  completedStages: number;
  inProgressStages: number;
  pendingStages: number;
  estimatedCompletionDate: Date | null;
  scheduleHealth: ScheduleHealth;
  projectStartDate: Date | null;
  projectEndDate: Date | null;
  progressPercent: number;
}

export function useTimelineAnalytics(projectId: string | null) {
  const { data: milestones, isLoading: milestonesLoading } = useProjectMilestones(projectId);
  const { data: workflowProgress, isLoading: progressLoading } = useDesignWorkflowProgress(projectId);
  
  const analytics = useMemo<TimelineAnalytics | null>(() => {
    if (!milestones || milestones.length === 0) {
      return null;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate totals
    let totalPlannedDays = 0;
    let totalActualDays = 0;
    let completedStages = 0;
    let delayedStages = 0;
    let onTrackStages = 0;
    let inProgressStages = 0;
    let pendingStages = 0;
    
    let projectStartDate: Date | null = null;
    let projectEndDate: Date | null = null;
    
    for (const milestone of milestones) {
      // Track planned duration
      if (milestone.planned_start_date && milestone.planned_end_date) {
        const plannedStart = new Date(milestone.planned_start_date);
        const plannedEnd = new Date(milestone.planned_end_date);
        totalPlannedDays += getBusinessDaysBetween(plannedStart, plannedEnd);
        
        if (!projectStartDate || plannedStart < projectStartDate) {
          projectStartDate = plannedStart;
        }
        if (!projectEndDate || plannedEnd > projectEndDate) {
          projectEndDate = plannedEnd;
        }
      }
      
      // Track actual duration
      if (milestone.actual_start_date && milestone.actual_end_date) {
        const actualStart = new Date(milestone.actual_start_date);
        const actualEnd = new Date(milestone.actual_end_date);
        totalActualDays += getBusinessDaysBetween(actualStart, actualEnd);
      }
      
      // Count by status
      switch (milestone.status) {
        case 'completed':
          completedStages++;
          // Check if it was on time
          if (milestone.planned_end_date && milestone.actual_end_date) {
            const plannedEnd = new Date(milestone.planned_end_date);
            const actualEnd = new Date(milestone.actual_end_date);
            if (actualEnd <= plannedEnd) {
              onTrackStages++;
            } else {
              delayedStages++;
            }
          } else {
            onTrackStages++;
          }
          break;
        case 'in_progress':
          inProgressStages++;
          // Check if currently delayed
          if (milestone.planned_end_date) {
            const plannedEnd = new Date(milestone.planned_end_date);
            if (today > plannedEnd) {
              delayedStages++;
            } else {
              onTrackStages++;
            }
          }
          break;
        case 'delayed':
          delayedStages++;
          break;
        case 'pending':
          pendingStages++;
          break;
      }
    }
    
    // Calculate elapsed days
    const elapsedDays = projectStartDate 
      ? getBusinessDaysBetween(projectStartDate, today)
      : 0;
    
    // Calculate variance
    // Positive = ahead of schedule, Negative = behind schedule
    const expectedCompletedStages = milestones.filter(m => {
      if (!m.planned_end_date) return false;
      return new Date(m.planned_end_date) <= today;
    }).length;
    
    const variance = completedStages - expectedCompletedStages;
    
    // Estimate completion date
    let estimatedCompletionDate: Date | null = projectEndDate;
    if (variance < 0 && projectEndDate) {
      // Behind schedule - adjust end date
      const daysPerStage = totalPlannedDays / milestones.length;
      const additionalDays = Math.abs(variance) * daysPerStage;
      estimatedCompletionDate = new Date(projectEndDate);
      estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + Math.ceil(additionalDays));
    }
    
    // Calculate schedule health based on variance
    const scheduleHealth = calculateScheduleHealth(variance);
    
    // Calculate overall progress percentage
    const progressPercent = milestones.length > 0 
      ? Math.round((completedStages / milestones.length) * 100)
      : 0;
    
    return {
      totalPlannedDays,
      totalActualDays,
      elapsedDays,
      variance,
      onTrackStages,
      delayedStages,
      completedStages,
      inProgressStages,
      pendingStages,
      estimatedCompletionDate,
      scheduleHealth,
      projectStartDate,
      projectEndDate,
      progressPercent,
    };
  }, [milestones]);
  
  return {
    data: analytics,
    milestones: milestones || [],
    isLoading: milestonesLoading || progressLoading,
  };
}
