import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertCircle, Circle } from 'lucide-react';
import { ProjectStageMilestone } from '@/hooks/useProjectMilestones';
import { formatDateShort, getStageConfig } from '@/lib/timeline-utils';
import { cn } from '@/lib/utils';

interface StageProgressBarProps {
  milestone: ProjectStageMilestone;
  onClick?: () => void;
}

export function StageProgressBar({ milestone, onClick }: StageProgressBarProps) {
  const stageConfig = getStageConfig(milestone.stage_id as any);
  
  const statusConfig = {
    completed: {
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      label: 'Completed',
    },
    in_progress: {
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      label: 'In Progress',
    },
    delayed: {
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      label: 'Delayed',
    },
    pending: {
      icon: Circle,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
      label: 'Pending',
    },
  };
  
  const config = statusConfig[milestone.status];
  const StatusIcon = config.icon;
  
  // Calculate if delayed (actual end after planned end)
  const isDelayed = milestone.status === 'completed' && 
    milestone.planned_end_date && 
    milestone.actual_end_date &&
    new Date(milestone.actual_end_date) > new Date(milestone.planned_end_date);
  
  return (
    <div 
      className={cn(
        'p-3 rounded-lg border transition-colors cursor-pointer hover:bg-accent/50',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn('h-4 w-4', config.color)} />
          <span className="font-medium text-sm">
            {stageConfig?.name || milestone.stage_id}
          </span>
        </div>
        <Badge variant="outline" className={cn('text-xs', config.bgColor, config.color)}>
          {config.label}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>
          <span className="block">Planned</span>
          <span className="text-foreground">
            {formatDateShort(milestone.planned_start_date)} - {formatDateShort(milestone.planned_end_date)}
          </span>
        </div>
        <div>
          <span className="block">Actual</span>
          <span className={cn(
            'text-foreground',
            isDelayed && 'text-red-600'
          )}>
            {milestone.actual_start_date || milestone.actual_end_date ? (
              <>
                {formatDateShort(milestone.actual_start_date)} - {formatDateShort(milestone.actual_end_date)}
              </>
            ) : (
              '-'
            )}
          </span>
        </div>
      </div>
      
      {milestone.notes && (
        <p className="mt-2 text-xs text-muted-foreground italic">
          {milestone.notes}
        </p>
      )}
    </div>
  );
}
