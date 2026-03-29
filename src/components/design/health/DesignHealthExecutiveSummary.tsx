import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity
} from 'lucide-react';
import { getSeverity } from '@/lib/design-completeness-utils';

interface DesignHealthExecutiveSummaryProps {
  zoneCompleteness: number;
  syncScore: number;
  specializedToolsScore: number;
  validationPassRate: number;
  criticalIssues: number;
  warningIssues: number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
}

export function DesignHealthExecutiveSummary({
  zoneCompleteness,
  syncScore,
  specializedToolsScore,
  validationPassRate,
  criticalIssues,
  warningIssues,
  trend = 'stable',
  trendValue = 0
}: DesignHealthExecutiveSummaryProps) {
  // Calculate master health score with weights
  const masterScore = Math.round(
    zoneCompleteness * 0.40 +
    syncScore * 0.20 +
    specializedToolsScore * 0.15 +
    validationPassRate * 0.25
  );

  const severity = getSeverity(masterScore);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground';

  return (
    <Card className="border-2" style={{ borderColor: severity.color }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Design Health Score
          </CardTitle>
          <Badge 
            variant="outline" 
            className="text-sm px-3 py-1"
            style={{ 
              backgroundColor: severity.bgColor, 
              color: severity.textColor,
              borderColor: severity.color
            }}
          >
            {severity.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Master Score Circle */}
        <div className="flex items-center gap-8 mb-6">
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="12"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke={severity.color}
                strokeWidth="12"
                strokeDasharray={`${masterScore * 3.52} 352`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{masterScore}%</span>
              <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
                <TrendIcon className="h-3 w-3" />
                <span>{trendValue > 0 ? '+' : ''}{trendValue}%</span>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Zone Completeness (40%)</span>
                <span className="font-medium">{zoneCompleteness.toFixed(0)}%</span>
              </div>
              <Progress value={zoneCompleteness} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Cross-Tool Sync (20%)</span>
                <span className="font-medium">{syncScore.toFixed(0)}%</span>
              </div>
              <Progress value={syncScore} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Specialized Tools (15%)</span>
                <span className="font-medium">{specializedToolsScore.toFixed(0)}%</span>
              </div>
              <Progress value={specializedToolsScore} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Validation Pass (25%)</span>
                <span className="font-medium">{validationPassRate.toFixed(0)}%</span>
              </div>
              <Progress value={validationPassRate} className="h-2" />
            </div>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              {zoneCompleteness.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Zone Complete</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold">
              {criticalIssues > 0 ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
              {criticalIssues}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Critical Issues</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              {warningIssues}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Warnings</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold">
              <Activity className="h-5 w-5 text-blue-500" />
              {validationPassRate.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Validation Pass</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
