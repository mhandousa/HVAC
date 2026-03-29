import { WorkflowStageId } from '@/components/design/DesignWorkflowNextStep';

export interface StageTimingConfig {
  stageId: WorkflowStageId;
  name: string;
  defaultDurationDays: number;
  order: number;
}

// Default durations for each design stage
export const STAGE_TIMING_CONFIGS: StageTimingConfig[] = [
  { stageId: 'load', name: 'Load Calculation', defaultDurationDays: 5, order: 1 },
  { stageId: 'ventilation', name: 'Ventilation', defaultDurationDays: 3, order: 2 },
  { stageId: 'psychrometric', name: 'Psychrometric', defaultDurationDays: 2, order: 3 },
  { stageId: 'ahu', name: 'AHU Configuration', defaultDurationDays: 4, order: 4 },
  { stageId: 'terminal', name: 'Terminal Units', defaultDurationDays: 5, order: 5 },
  { stageId: 'equipment', name: 'Equipment Selection', defaultDurationDays: 7, order: 6 },
  { stageId: 'distribution', name: 'Distribution', defaultDurationDays: 10, order: 7 },
  { stageId: 'diffuser', name: 'Diffusers', defaultDurationDays: 3, order: 8 },
  { stageId: 'erv', name: 'ERV', defaultDurationDays: 2, order: 9 },
  { stageId: 'plant', name: 'Plant Design', defaultDurationDays: 7, order: 10 },
  { stageId: 'compliance', name: 'Compliance', defaultDurationDays: 5, order: 11 },
];

export const TOTAL_DEFAULT_DURATION = STAGE_TIMING_CONFIGS.reduce(
  (sum, stage) => sum + stage.defaultDurationDays,
  0
);

export function getStageConfig(stageId: WorkflowStageId): StageTimingConfig | undefined {
  return STAGE_TIMING_CONFIGS.find(s => s.stageId === stageId);
}

export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  return result;
}

export function getBusinessDaysBetween(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  while (current < end) {
    current.setDate(current.getDate() + 1);
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
  }
  return count;
}

export function generateMilestones(
  projectStartDate: Date,
  projectEndDate: Date | null
): { stageId: WorkflowStageId; plannedStart: Date; plannedEnd: Date; durationDays: number }[] {
  const milestones: { stageId: WorkflowStageId; plannedStart: Date; plannedEnd: Date; durationDays: number }[] = [];
  
  let currentDate = new Date(projectStartDate);
  
  // If we have an end date, scale durations proportionally
  let scaleFactor = 1;
  if (projectEndDate) {
    const totalProjectDays = getBusinessDaysBetween(projectStartDate, projectEndDate);
    scaleFactor = totalProjectDays / TOTAL_DEFAULT_DURATION;
  }
  
  for (const stage of STAGE_TIMING_CONFIGS) {
    const adjustedDuration = Math.max(1, Math.round(stage.defaultDurationDays * scaleFactor));
    const plannedStart = new Date(currentDate);
    const plannedEnd = addBusinessDays(currentDate, adjustedDuration);
    
    milestones.push({
      stageId: stage.stageId,
      plannedStart,
      plannedEnd,
      durationDays: adjustedDuration,
    });
    
    currentDate = plannedEnd;
  }
  
  return milestones;
}

export type ScheduleHealth = 'on-track' | 'at-risk' | 'delayed';

export function calculateScheduleHealth(varianceDays: number): ScheduleHealth {
  if (varianceDays >= 0) return 'on-track';
  if (varianceDays >= -5) return 'at-risk';
  return 'delayed';
}

export function getHealthColor(health: ScheduleHealth): string {
  switch (health) {
    case 'on-track': return 'text-green-600';
    case 'at-risk': return 'text-yellow-600';
    case 'delayed': return 'text-red-600';
  }
}

export function getHealthBgColor(health: ScheduleHealth): string {
  switch (health) {
    case 'on-track': return 'bg-green-100 dark:bg-green-900/30';
    case 'at-risk': return 'bg-yellow-100 dark:bg-yellow-900/30';
    case 'delayed': return 'bg-red-100 dark:bg-red-900/30';
  }
}

export function formatDateShort(date: Date | string | null): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateFull(date: Date | string | null): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
