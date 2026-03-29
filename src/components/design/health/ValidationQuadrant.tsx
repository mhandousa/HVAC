import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ShieldCheck, 
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ValidationCheck } from '@/lib/design-validation-rules';

interface ValidationQuadrantProps {
  passRate: number;
  passCount: number;
  warningCount: number;
  failCount: number;
  topFailingRules: { name: string; count: number }[];
  projectId: string;
}

export function ValidationQuadrant({
  passRate,
  passCount,
  warningCount,
  failCount,
  topFailingRules,
  projectId
}: ValidationQuadrantProps) {
  const total = passCount + warningCount + failCount;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
            Validation Status
          </CardTitle>
          <span className="text-2xl font-bold">{passRate.toFixed(0)}%</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Donut chart representation */}
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              {/* Background circle */}
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="4"
              />
              {/* Pass segment */}
              {passCount > 0 && (
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="hsl(142 76% 36%)"
                  strokeWidth="4"
                  strokeDasharray={`${(passCount / total) * 88} 88`}
                  strokeDashoffset="0"
                />
              )}
              {/* Warning segment */}
              {warningCount > 0 && (
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="hsl(45 93% 47%)"
                  strokeWidth="4"
                  strokeDasharray={`${(warningCount / total) * 88} 88`}
                  strokeDashoffset={`${-((passCount / total) * 88)}`}
                />
              )}
              {/* Fail segment */}
              {failCount > 0 && (
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="hsl(0 84% 60%)"
                  strokeWidth="4"
                  strokeDasharray={`${(failCount / total) * 88} 88`}
                  strokeDashoffset={`${-(((passCount + warningCount) / total) * 88)}`}
                />
              )}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span className="text-muted-foreground">Pass:</span>
              <span className="font-medium">{passCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 text-yellow-500" />
              <span className="text-muted-foreground">Warning:</span>
              <span className="font-medium">{warningCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-3 w-3 text-red-500" />
              <span className="text-muted-foreground">Fail:</span>
              <span className="font-medium">{failCount}</span>
            </div>
          </div>
        </div>

        {/* Top failing rules */}
        {topFailingRules.length > 0 && (
          <div className="pt-2 border-t space-y-1">
            <p className="text-xs text-muted-foreground mb-1">Top Issues:</p>
            {topFailingRules.slice(0, 2).map((rule, i) => (
              <div key={i} className="text-xs flex justify-between">
                <span className="truncate text-muted-foreground">{rule.name}</span>
                <Badge variant="destructive" className="text-[10px] px-1 py-0">
                  {rule.count}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Run validation link */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full mt-2 group" asChild>
              <Link to={`/design/validation?project=${projectId}`}>
                Run Validation <ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Execute validation rules and view detailed pass/fail results</p>
          </TooltipContent>
        </Tooltip>
      </CardContent>
    </Card>
  );
}
