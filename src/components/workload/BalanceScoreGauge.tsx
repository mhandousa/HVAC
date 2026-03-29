import { cn } from '@/lib/utils';
import { Scale, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface BalanceScoreGaugeProps {
  score: number;
  overloadedCount: number;
  underutilizedCount: number;
  compact?: boolean;
}

export function BalanceScoreGauge({ 
  score, 
  overloadedCount, 
  underutilizedCount,
  compact = false 
}: BalanceScoreGaugeProps) {
  const getScoreInfo = () => {
    if (score >= 90) return { 
      label: 'Excellent', 
      color: 'text-green-500', 
      bgColor: 'bg-green-500',
      icon: CheckCircle2 
    };
    if (score >= 70) return { 
      label: 'Good', 
      color: 'text-yellow-500', 
      bgColor: 'bg-yellow-500',
      icon: Scale 
    };
    if (score >= 50) return { 
      label: 'Needs Attention', 
      color: 'text-orange-500', 
      bgColor: 'bg-orange-500',
      icon: AlertTriangle 
    };
    return { 
      label: 'Critical', 
      color: 'text-destructive', 
      bgColor: 'bg-destructive',
      icon: XCircle 
    };
  };

  const info = getScoreInfo();
  const Icon = info.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-muted"
            />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${score * 0.94} 100`}
              className={info.color}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold">{score}%</span>
          </div>
        </div>
        <div className="text-sm">
          <p className={cn("font-medium", info.color)}>{info.label}</p>
          {overloadedCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {overloadedCount} overloaded
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon className={cn("w-5 h-5", info.color)} />
        <h3 className="font-semibold">Team Balance Score</h3>
      </div>

      <div className="flex flex-col items-center py-4">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-muted"
            />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray={`${score * 0.94} 100`}
              className={info.color}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">{score}%</span>
            <span className={cn("text-sm font-medium", info.color)}>{info.label}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {overloadedCount > 0 && (
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4" />
            <span>{overloadedCount} technician{overloadedCount > 1 ? 's' : ''} overloaded</span>
          </div>
        )}
        {underutilizedCount > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Scale className="w-4 h-4" />
            <span>{underutilizedCount} underutilized</span>
          </div>
        )}
        {overloadedCount === 0 && underutilizedCount === 0 && (
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle2 className="w-4 h-4" />
            <span>Workload is well balanced</span>
          </div>
        )}
      </div>
    </div>
  );
}
