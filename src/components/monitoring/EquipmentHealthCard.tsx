import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Calendar,
  ChevronRight,
  Loader2,
  RefreshCw,
  Wrench,
  Zap,
  Shield,
  Gauge,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import {
  EquipmentWithHealth,
  getHealthScoreColor,
  getHealthScoreBgColor,
  getRiskLevelColor,
  getUrgencyBadgeVariant,
  useAnalyzeEquipmentHealth,
} from '@/hooks/useEquipmentHealth';

interface EquipmentHealthCardProps {
  equipment: EquipmentWithHealth;
  onViewDetails?: (equipmentId: string) => void;
  compact?: boolean;
}

export function EquipmentHealthCard({ 
  equipment, 
  onViewDetails,
  compact = false,
}: EquipmentHealthCardProps) {
  const { mutate: analyze, isPending } = useAnalyzeEquipmentHealth();
  const health = equipment.health_score;

  const handleAnalyze = (e: React.MouseEvent) => {
    e.stopPropagation();
    analyze(equipment.id);
  };

  const TrendIcon = health?.trend === 'improving' 
    ? ArrowUp 
    : health?.trend === 'declining' 
      ? ArrowDown 
      : ArrowRight;

  const trendColor = health?.trend === 'improving'
    ? 'text-success'
    : health?.trend === 'declining'
      ? 'text-destructive'
      : 'text-muted-foreground';

  if (compact) {
    return (
      <Card 
        className={cn(
          'cursor-pointer hover:border-primary/50 transition-colors',
          getHealthScoreBgColor(health?.overall_score ?? null)
        )}
        onClick={() => onViewDetails?.(equipment.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{equipment.tag}</p>
              <p className="text-sm text-muted-foreground truncate">{equipment.name}</p>
            </div>
            
            <div className="flex items-center gap-3">
              {health ? (
                <>
                  <div className="text-center">
                    <p className={cn('text-2xl font-bold', getHealthScoreColor(health.overall_score))}>
                      {health.overall_score}
                    </p>
                    <p className="text-xs text-muted-foreground">Health</p>
                  </div>
                  <TrendIcon className={cn('w-4 h-4', trendColor)} />
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAnalyze}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{equipment.tag}</CardTitle>
            <CardDescription className="truncate">{equipment.name}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {health?.risk_level && health.risk_level !== 'low' && (
              <Badge 
                variant={health.risk_level === 'critical' ? 'destructive' : 'secondary'}
                className="gap-1"
              >
                <AlertTriangle className="w-3 h-3" />
                {health.risk_level}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAnalyze}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {health ? (
          <>
            {/* Overall Health Score */}
            <div className="flex items-center gap-4">
              <div 
                className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center',
                  getHealthScoreBgColor(health.overall_score)
                )}
              >
                <div className="text-center">
                  <p className={cn('text-3xl font-bold', getHealthScoreColor(health.overall_score))}>
                    {health.overall_score}
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    <TrendIcon className={cn('w-3 h-3', trendColor)} />
                    <span className={cn('text-xs', trendColor)}>
                      {health.trend || 'stable'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <TooltipProvider>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Gauge className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>Performance</TooltipContent>
                    </Tooltip>
                    <Progress value={health.performance_score || 0} className="h-2 flex-1" />
                    <span className="text-xs w-8 text-right">{health.performance_score || 0}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Shield className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>Reliability</TooltipContent>
                    </Tooltip>
                    <Progress value={health.reliability_score || 0} className="h-2 flex-1" />
                    <span className="text-xs w-8 text-right">{health.reliability_score || 0}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Zap className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>Efficiency</TooltipContent>
                    </Tooltip>
                    <Progress value={health.efficiency_score || 0} className="h-2 flex-1" />
                    <span className="text-xs w-8 text-right">{health.efficiency_score || 0}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Activity className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>Condition</TooltipContent>
                    </Tooltip>
                    <Progress value={health.condition_score || 0} className="h-2 flex-1" />
                    <span className="text-xs w-8 text-right">{health.condition_score || 0}</span>
                  </div>
                </TooltipProvider>
              </div>
            </div>

            {/* Maintenance Prediction */}
            {health.predicted_maintenance_date && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Predicted Maintenance</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(health.predicted_maintenance_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <Badge variant={getUrgencyBadgeVariant(health.maintenance_urgency)}>
                  {health.maintenance_urgency}
                </Badge>
              </div>
            )}

            {/* Top Recommendations */}
            {health.recommendations && health.recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Recommendations</p>
                <ul className="space-y-1">
                  {health.recommendations.slice(0, 3).map((rec, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Analyzed {formatDistanceToNow(new Date(health.last_analyzed_at), { addSuffix: true })}
              </p>
              {onViewDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  onClick={() => onViewDetails(equipment.id)}
                >
                  Details
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              No health data available yet
            </p>
            <Button onClick={handleAnalyze} disabled={isPending} className="gap-2">
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Analyze Health
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
