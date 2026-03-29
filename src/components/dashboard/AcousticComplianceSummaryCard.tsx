import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Volume2, CheckCircle, AlertTriangle, XCircle, ArrowRight, TrendingDown } from 'lucide-react';
import { useOrganizationAcousticSummary } from '@/hooks/useOrganizationAcousticSummary';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function AcousticComplianceSummaryCard() {
  const navigate = useNavigate();
  const { data: summary, isLoading } = useOrganizationAcousticSummary();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Acoustic Compliance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.totalZonesAnalyzed === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Acoustic Compliance</CardTitle>
          </div>
          <CardDescription>NC target compliance across projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Volume2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No acoustic analysis yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add acoustic calculations to zones to track NC compliance
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => navigate('/acoustic')}
            >
              Go to Acoustic Tools
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getComplianceColor = (percent: number) => {
    if (percent >= 90) return 'text-emerald-600';
    if (percent >= 70) return 'text-amber-600';
    return 'text-destructive';
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'bg-emerald-500';
    if (percent >= 70) return 'bg-amber-500';
    return 'bg-destructive';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Acoustic Compliance</CardTitle>
          </div>
          {summary.zonesExceeding > 0 && (
            <Badge variant="destructive" className="text-xs">
              {summary.zonesExceeding} exceeding
            </Badge>
          )}
        </div>
        <CardDescription>NC target compliance across {summary.projectsWithAcoustic} projects</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Compliance gauge */}
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-muted stroke-current"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={cn('stroke-current', getComplianceColor(summary.compliancePercent))}
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${summary.compliancePercent}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn('text-lg font-bold', getComplianceColor(summary.compliancePercent))}>
                {summary.compliancePercent}%
              </span>
            </div>
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-success" />
                <span>Passing</span>
              </div>
              <span className="font-medium">{summary.zonesPassingNC}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                <span>Marginal</span>
              </div>
              <span className="font-medium">{summary.zonesMarginal}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5 text-destructive" />
                <span>Exceeding</span>
              </div>
              <span className="font-medium">{summary.zonesExceeding}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{summary.totalZonesAnalyzed} zones analyzed</span>
            <span>{summary.zonesPassingNC} meeting NC targets</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn('h-full transition-all', getProgressColor(summary.compliancePercent))}
              style={{ width: `${summary.compliancePercent}%` }}
            />
          </div>
        </div>

        {/* Worst case indicator */}
        {summary.worstNCDelta > 0 && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-2">
              <TrendingDown className="h-4 w-4 text-destructive mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-destructive">
                  Worst: +{summary.worstNCDelta} NC above target
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {summary.worstZoneName} in {summary.worstProjectName}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Projects with issues */}
        {summary.projectsWithIssues.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Projects needing attention</p>
            <div className="space-y-1.5 max-h-24 overflow-y-auto">
              {summary.projectsWithIssues.slice(0, 3).map((project) => (
                <button
                  key={project.projectId}
                  onClick={() => navigate(`/acoustic?project=${project.projectId}`)}
                  className="w-full flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors text-left"
                >
                  <span className="text-sm truncate">{project.projectName}</span>
                  <div className="flex items-center gap-2">
                    {project.zonesExceeding > 0 && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        {project.zonesExceeding}
                      </Badge>
                    )}
                    {project.zonesMarginal > 0 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-warning/50 text-warning">
                        {project.zonesMarginal}
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full gap-2"
          onClick={() => navigate('/acoustic')}
        >
          View Acoustic Dashboard
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
