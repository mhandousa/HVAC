import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MetricData {
  label: string;
  value: number;
  color: string;
}

interface CompletenessQuadrantProps {
  overallPercent: number;
  metrics: MetricData[];
  zonesNeedingAttention: number;
  projectId: string;
}

export function CompletenessQuadrant({
  overallPercent,
  metrics,
  zonesNeedingAttention,
  projectId
}: CompletenessQuadrantProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Zone Completeness
          </CardTitle>
          <span className="text-2xl font-bold">{overallPercent.toFixed(0)}%</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Mini progress bars for each metric */}
        <div className="space-y-2">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{metric.label}</span>
                <span>{metric.value.toFixed(0)}%</span>
              </div>
              <Progress 
                value={metric.value} 
                className="h-1.5"
                style={{ '--progress-foreground': metric.color } as React.CSSProperties}
              />
            </div>
          ))}
        </div>

        {/* Zones needing attention */}
        {zonesNeedingAttention > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-amber-600">
              {zonesNeedingAttention} zone{zonesNeedingAttention !== 1 ? 's' : ''} need attention
            </p>
          </div>
        )}

        {/* View details link */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full mt-2 group" asChild>
              <Link to={`/design/completeness?project=${projectId}`}>
                View Details <ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View zone-by-zone completion breakdown with heat map visualization</p>
          </TooltipContent>
        </Tooltip>
      </CardContent>
    </Card>
  );
}
