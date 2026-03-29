import React, { useMemo } from 'react';
import { ProjectStageMilestone } from '@/hooks/useProjectMilestones';
import { getStageConfig, formatDateShort, STAGE_TIMING_CONFIGS } from '@/lib/timeline-utils';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProjectTimelineGanttProps {
  milestones: ProjectStageMilestone[];
  onMilestoneClick?: (milestone: ProjectStageMilestone) => void;
}

export function ProjectTimelineGantt({ milestones, onMilestoneClick }: ProjectTimelineGanttProps) {
  // Calculate timeline bounds
  const { minDate, maxDate, totalDays, weeks } = useMemo(() => {
    let min = new Date();
    let max = new Date();
    
    for (const milestone of milestones) {
      if (milestone.planned_start_date) {
        const start = new Date(milestone.planned_start_date);
        if (start < min) min = start;
      }
      if (milestone.planned_end_date) {
        const end = new Date(milestone.planned_end_date);
        if (end > max) max = end;
      }
      if (milestone.actual_end_date) {
        const end = new Date(milestone.actual_end_date);
        if (end > max) max = end;
      }
    }
    
    // Add padding
    min.setDate(min.getDate() - 7);
    max.setDate(max.getDate() + 7);
    
    const totalDays = Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24));
    
    // Generate week markers
    const weeks: { date: Date; label: string }[] = [];
    const current = new Date(min);
    while (current <= max) {
      weeks.push({
        date: new Date(current),
        label: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
      current.setDate(current.getDate() + 7);
    }
    
    return { minDate: min, maxDate: max, totalDays, weeks };
  }, [milestones]);
  
  // Calculate position percentage for a date
  const getPosition = (date: Date | string): number => {
    const d = new Date(date);
    const offset = (d.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
    return (offset / totalDays) * 100;
  };
  
  // Calculate width percentage for a duration
  const getWidth = (start: Date | string, end: Date | string): number => {
    const s = new Date(start);
    const e = new Date(end);
    const duration = (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(2, (duration / totalDays) * 100);
  };
  
  // Today marker position
  const today = new Date();
  const todayPosition = getPosition(today);
  const showTodayMarker = todayPosition >= 0 && todayPosition <= 100;
  
  // Sort milestones by stage order
  const sortedMilestones = useMemo(() => {
    return [...milestones].sort((a, b) => {
      const aConfig = STAGE_TIMING_CONFIGS.find(s => s.stageId === a.stage_id);
      const bConfig = STAGE_TIMING_CONFIGS.find(s => s.stageId === b.stage_id);
      return (aConfig?.order || 0) - (bConfig?.order || 0);
    });
  }, [milestones]);
  
  const getBarColor = (milestone: ProjectStageMilestone): string => {
    switch (milestone.status) {
      case 'completed':
        // Check if completed on time
        if (milestone.planned_end_date && milestone.actual_end_date) {
          const planned = new Date(milestone.planned_end_date);
          const actual = new Date(milestone.actual_end_date);
          return actual <= planned ? 'bg-green-500' : 'bg-amber-500';
        }
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'delayed':
        return 'bg-red-500';
      case 'pending':
      default:
        return 'bg-muted-foreground/30';
    }
  };
  
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Week headers */}
        <div className="relative h-8 border-b mb-2">
          {weeks.map((week, i) => (
            <div
              key={i}
              className="absolute text-xs text-muted-foreground"
              style={{ left: `${getPosition(week.date)}%` }}
            >
              {week.label}
            </div>
          ))}
        </div>
        
        {/* Gantt rows */}
        <div className="space-y-2">
          {sortedMilestones.map((milestone) => {
            const stageConfig = getStageConfig(milestone.stage_id as any);
            const hasPlanned = milestone.planned_start_date && milestone.planned_end_date;
            const hasActual = milestone.actual_start_date || milestone.actual_end_date;
            
            return (
              <div
                key={milestone.id}
                className="relative h-10 group"
                onClick={() => onMilestoneClick?.(milestone)}
              >
                {/* Stage label */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-28 text-xs font-medium truncate pr-2">
                  {stageConfig?.name || milestone.stage_id}
                </div>
                
                {/* Bar container */}
                <div className="absolute left-28 right-0 h-full">
                  {/* Background track */}
                  <div className="absolute inset-y-0 left-0 right-0 bg-muted/50 rounded" />
                  
                  {/* Planned bar (lighter) */}
                  {hasPlanned && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute h-3 top-1 bg-primary/20 rounded cursor-pointer hover:bg-primary/30 transition-colors"
                          style={{
                            left: `${getPosition(milestone.planned_start_date!)}%`,
                            width: `${getWidth(milestone.planned_start_date!, milestone.planned_end_date!)}%`,
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          Planned: {formatDateShort(milestone.planned_start_date)} - {formatDateShort(milestone.planned_end_date)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  {/* Actual bar */}
                  {hasActual && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'absolute h-5 top-3 rounded cursor-pointer transition-all hover:h-6 hover:top-2.5',
                            getBarColor(milestone)
                          )}
                          style={{
                            left: `${getPosition(milestone.actual_start_date || milestone.planned_start_date!)}%`,
                            width: milestone.actual_end_date
                              ? `${getWidth(milestone.actual_start_date || milestone.planned_start_date!, milestone.actual_end_date)}%`
                              : `${getPosition(today) - getPosition(milestone.actual_start_date || milestone.planned_start_date!)}%`,
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs font-medium">{stageConfig?.name}</p>
                        <p className="text-xs">
                          Actual: {formatDateShort(milestone.actual_start_date)} - {formatDateShort(milestone.actual_end_date) || 'ongoing'}
                        </p>
                        <p className="text-xs capitalize">Status: {milestone.status.replace('_', ' ')}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  {/* Milestone diamond at end */}
                  {milestone.planned_end_date && (
                    <div
                      className="absolute w-2.5 h-2.5 bg-yellow-500 rotate-45 top-4"
                      style={{
                        left: `calc(${getPosition(milestone.planned_end_date)}% - 5px)`,
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Today marker */}
        {showTodayMarker && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-orange-500 z-10"
            style={{ left: `calc(7rem + ${todayPosition}% * (100% - 7rem) / 100)` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-1 py-0.5 bg-orange-500 text-white text-[10px] rounded whitespace-nowrap">
              Today
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
