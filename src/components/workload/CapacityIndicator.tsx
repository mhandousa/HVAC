import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CapacityStatus } from '@/hooks/useTechnicianAvailability';
import { cn } from '@/lib/utils';

interface CapacityIndicatorProps {
  weeklyScheduledHours: number;
  weeklyWorkingHours: number;
  currentAssignments: number;
  recommendedMax: number;
  availableCapacity: number;
  capacityStatus: CapacityStatus;
  utilizationRate: number;
  compact?: boolean;
}

const statusConfig: Record<CapacityStatus, { label: string; className: string; progressClassName: string }> = {
  available: {
    label: 'Available',
    className: 'bg-green-100 text-green-700 border-green-200',
    progressClassName: '[&>div]:bg-green-500',
  },
  moderate: {
    label: 'Moderate',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
    progressClassName: '[&>div]:bg-blue-500',
  },
  full: {
    label: 'At Capacity',
    className: 'bg-warning/20 text-warning border-warning/30',
    progressClassName: '[&>div]:bg-warning',
  },
  overloaded: {
    label: 'Overloaded',
    className: 'bg-destructive/20 text-destructive border-destructive/30',
    progressClassName: '[&>div]:bg-destructive',
  },
};

export function CapacityIndicator({
  weeklyScheduledHours,
  weeklyWorkingHours,
  currentAssignments,
  recommendedMax,
  availableCapacity,
  capacityStatus,
  utilizationRate,
  compact = false,
}: CapacityIndicatorProps) {
  const config = statusConfig[capacityStatus];
  const progressValue = Math.min(100, utilizationRate * 100);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn('text-xs', config.className)}>
          {config.label}
        </Badge>
        {availableCapacity > 0 && (
          <span className="text-xs text-muted-foreground">
            +{availableCapacity} available
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 rounded-lg border bg-card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Weekly Capacity</span>
        <Badge variant="outline" className={config.className}>
          {config.label}
        </Badge>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Available Hours</span>
          <span className="font-medium">{weeklyScheduledHours}h / {weeklyWorkingHours}h</span>
        </div>
        <Progress 
          value={(weeklyScheduledHours / weeklyWorkingHours) * 100} 
          className="h-2"
        />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Current Assignments</span>
          <span className="font-medium">{currentAssignments} / {recommendedMax}</span>
        </div>
        <Progress 
          value={progressValue} 
          className={cn('h-2', config.progressClassName)}
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <div className="flex gap-0.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-3 rounded-sm',
                i < Math.ceil(utilizationRate * 10)
                  ? capacityStatus === 'overloaded'
                    ? 'bg-destructive'
                    : capacityStatus === 'full'
                    ? 'bg-warning'
                    : capacityStatus === 'moderate'
                    ? 'bg-blue-500'
                    : 'bg-green-500'
                  : 'bg-muted'
              )}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {availableCapacity > 0
            ? `Can take ${availableCapacity} more`
            : capacityStatus === 'overloaded'
            ? 'Over capacity'
            : 'At maximum'}
        </span>
      </div>
    </div>
  );
}
