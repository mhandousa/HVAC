import { cn } from '@/lib/utils';
import type { ImportMetric } from './importSourceConfig';

interface ImportMetricBadgeProps {
  metric: ImportMetric;
  className?: string;
}

export function ImportMetricBadge({ metric, className }: ImportMetricBadgeProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center px-3 py-2 rounded-lg bg-muted/50 min-w-[70px]",
        className
      )}
    >
      <span className="text-lg font-semibold text-foreground">
        {metric.value}
        {metric.unit && <span className="text-xs font-normal text-muted-foreground ml-0.5">{metric.unit}</span>}
      </span>
      <span className="text-xs text-muted-foreground">{metric.label}</span>
    </div>
  );
}
