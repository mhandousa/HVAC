import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ReassignmentSuggestion } from '@/hooks/useWorkloadBalancing';
import { TechnicianMetrics } from '@/hooks/useTechnicianWorkload';
import { ArrowRight, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface WorkloadComparisonChartProps {
  technicians: TechnicianMetrics[];
  suggestions: ReassignmentSuggestion[];
  currentBalanceScore: number;
  projectedBalanceScore: number;
}

export function WorkloadComparisonChart({
  technicians,
  suggestions,
  currentBalanceScore,
  projectedBalanceScore,
}: WorkloadComparisonChartProps) {
  // Calculate projected utilizations
  const projectedData = useMemo(() => {
    const CAPACITY = 8;
    
    return technicians
      .filter(t => t.totalAssigned > 0)
      .map(t => {
        const currentActive = t.activeAssignments + t.inProgressAssignments;
        const currentUtil = (currentActive / CAPACITY) * 100;
        
        // Calculate change from suggestions
        const outgoing = suggestions.filter(s => s.fromTechnicianId === t.id).length;
        const incoming = suggestions.filter(s => s.toTechnicianId === t.id).length;
        
        const projectedActive = currentActive - outgoing + incoming;
        const projectedUtil = Math.max(0, (projectedActive / CAPACITY) * 100);
        
        return {
          id: t.id,
          name: t.name,
          currentUtil: Math.round(currentUtil),
          projectedUtil: Math.round(projectedUtil),
          change: Math.round(projectedUtil - currentUtil),
        };
      })
      .sort((a, b) => b.currentUtil - a.currentUtil);
  }, [technicians, suggestions]);

  const improvement = projectedBalanceScore - currentBalanceScore;
  const improvementPercent = currentBalanceScore > 0 
    ? Math.round((improvement / currentBalanceScore) * 100) 
    : 0;

  const getUtilizationColor = (util: number) => {
    if (util > 100) return 'bg-destructive';
    if (util > 85) return 'bg-orange-500';
    if (util >= 50) return 'bg-green-500';
    return 'bg-muted-foreground';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Before vs After Balancing</span>
          {suggestions.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              {suggestions.length} reassignment{suggestions.length > 1 ? 's' : ''}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {projectedData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No technicians with active assignments
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {projectedData.slice(0, 6).map((tech) => (
                <div key={tech.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1">{tech.name}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={cn(
                        tech.currentUtil > 100 && "text-destructive font-medium"
                      )}>
                        {tech.currentUtil}%
                      </span>
                      {tech.change !== 0 && (
                        <>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span className={cn(
                            "font-medium",
                            tech.projectedUtil <= 100 && tech.currentUtil > 100 && "text-green-600"
                          )}>
                            {tech.projectedUtil}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="flex-1">
                      <Progress 
                        value={Math.min(tech.currentUtil, 150)} 
                        max={150}
                        className={cn("h-2", `[&>div]:${getUtilizationColor(tech.currentUtil)}`)}
                      />
                    </div>
                    {tech.change !== 0 && (
                      <div className="flex-1">
                        <Progress 
                          value={Math.min(tech.projectedUtil, 150)} 
                          max={150}
                          className="h-2 [&>div]:bg-green-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {suggestions.length > 0 && (
              <div className="pt-3 border-t space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Balance Score</span>
                  <div className="flex items-center gap-2">
                    <span>{currentBalanceScore}%</span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="font-medium text-green-600">{projectedBalanceScore}%</span>
                  </div>
                </div>
                
                {improvementPercent > 0 && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <TrendingDown className="w-3 h-3" />
                    <span>{improvementPercent}% improvement in workload distribution</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
