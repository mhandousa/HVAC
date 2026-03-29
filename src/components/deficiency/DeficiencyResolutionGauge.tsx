import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeficiencyStats } from '@/hooks/useDeficiencyDashboard';
import { cn } from '@/lib/utils';

interface DeficiencyResolutionGaugeProps {
  stats: DeficiencyStats;
}

export function DeficiencyResolutionGauge({ stats }: DeficiencyResolutionGaugeProps) {
  const rate = stats.resolutionRate;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (rate / 100) * circumference;

  const getColor = () => {
    if (rate >= 80) return 'text-success stroke-success';
    if (rate >= 50) return 'text-warning stroke-warning';
    return 'text-destructive stroke-destructive';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resolution Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-[200px]">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="10"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                className={cn('transition-all duration-1000', getColor())}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('text-3xl font-bold', getColor().split(' ')[0])}>
                {rate}%
              </span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              {stats.resolved} of {stats.total} resolved
            </p>
            {rate < 80 && stats.total > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Target: 80%
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
