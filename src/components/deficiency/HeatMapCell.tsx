import { cn } from '@/lib/utils';
import { HeatMapCell as HeatMapCellData } from '@/hooks/useDeficiencyHeatMap';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HeatMapCellProps {
  data: HeatMapCellData;
  isSelected?: boolean;
  onClick?: () => void;
}

const intensityStyles = {
  low: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
  medium: 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-300 dark:border-yellow-700',
  high: 'bg-orange-200 dark:bg-orange-900/50 border-orange-400 dark:border-orange-600',
  critical: 'bg-red-200 dark:bg-red-900/60 border-red-400 dark:border-red-500 animate-pulse',
};

const intensityTextColors = {
  low: 'text-blue-900 dark:text-blue-100',
  medium: 'text-yellow-900 dark:text-yellow-100',
  high: 'text-orange-900 dark:text-orange-100',
  critical: 'text-red-900 dark:text-red-100',
};

export function HeatMapCellComponent({ data, isSelected, onClick }: HeatMapCellProps) {
  const TrendIcon = data.trend > 0 ? TrendingUp : data.trend < 0 ? TrendingDown : Minus;
  const trendColor = data.trend > 0 ? 'text-red-600' : data.trend < 0 ? 'text-green-600' : 'text-muted-foreground';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              'relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200',
              'hover:scale-105 hover:shadow-md cursor-pointer',
              'min-h-[100px] min-w-[100px]',
              intensityStyles[data.intensity],
              isSelected && 'ring-2 ring-primary ring-offset-2'
            )}
          >
            <span className={cn('font-semibold text-sm mb-1', intensityTextColors[data.intensity])}>
              {data.label}
            </span>
            <span className={cn('text-2xl font-bold', intensityTextColors[data.intensity])}>
              {data.count}
            </span>
            {data.trend !== 0 && (
              <div className={cn('flex items-center gap-0.5 text-xs mt-1', trendColor)}>
                <TrendIcon className="w-3 h-3" />
                <span>{data.trend > 0 ? '+' : ''}{data.trend}</span>
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="p-3">
          <div className="space-y-2">
            <p className="font-semibold">{data.label}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">{data.count}</span>
              <span className="text-red-600">Critical:</span>
              <span className="font-medium">{data.critical}</span>
              <span className="text-yellow-600">Major:</span>
              <span className="font-medium">{data.major}</span>
              <span className="text-blue-600">Minor:</span>
              <span className="font-medium">{data.minor}</span>
              <span className="text-green-600">Resolved:</span>
              <span className="font-medium">{data.resolved}</span>
            </div>
            <div className="text-xs text-muted-foreground pt-1 border-t">
              Severity Score: {data.severityScore}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
