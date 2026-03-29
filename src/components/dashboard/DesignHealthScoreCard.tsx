import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useDesignHealthScores, ProjectDesignHealth } from "@/hooks/useDesignHealthScores";
import { useNavigate } from "react-router-dom";
import { Activity, AlertTriangle, CheckCircle2, TrendingUp, Layers, Wrench } from "lucide-react";
import { getSeverity, SeverityInfo } from "@/lib/design-completeness-utils";

export const DesignHealthScoreCard = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useDesignHealthScores();

  if (isLoading) {
    return <DesignHealthCardSkeleton />;
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Design Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Unable to load design health data</p>
        </CardContent>
      </Card>
    );
  }

  const { projects, summary } = data;

  // Get projects needing attention (lowest scores first, exclude complete)
  const projectsNeedingAttention = [...projects]
    .filter(p => p.totalZones > 0 && p.healthStatus !== 'complete')
    .sort((a, b) => a.combinedHealthScore - b.combinedHealthScore)
    .slice(0, 3);

  const attentionCount = summary.criticalProjects + summary.warningProjects;
  const overallSeverity = getSeverity(summary.averageCombinedScore);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle>Design Health</CardTitle>
          </div>
          {attentionCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {attentionCount} need attention
            </Badge>
          )}
        </div>
        <CardDescription>
          Combined design progress across {summary.totalProjects} project{summary.totalProjects !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary.totalProjects === 0 ? (
          <EmptyState onNavigate={() => navigate('/projects')} />
        ) : (
          <>
            {/* Main Score Gauge */}
            <div className="flex items-center gap-4">
              <ScoreGauge score={summary.averageCombinedScore} severity={overallSeverity} />
              <div className="flex-1 space-y-3">
                {/* Zone Completeness */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Layers className="h-3.5 w-3.5" />
                      Zone Progress
                      <span className="text-xs opacity-60">(75%)</span>
                    </span>
                    <span className="font-medium">{summary.averageZoneCompleteness}%</span>
                  </div>
                  <Progress value={summary.averageZoneCompleteness} className="h-2" />
                </div>
                
                {/* Specialized Tools */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Wrench className="h-3.5 w-3.5" />
                      Specialized Tools
                      <span className="text-xs opacity-60">(25%)</span>
                    </span>
                    <span className="font-medium">{summary.averageSpecializedScore}%</span>
                  </div>
                  <Progress value={summary.averageSpecializedScore} className="h-2" />
                </div>
              </div>
            </div>

            {/* Projects Needing Attention */}
            {projectsNeedingAttention.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Projects Needing Attention
                </p>
                <div className="space-y-2">
                  {projectsNeedingAttention.map(project => (
                    <ProjectHealthRow 
                      key={project.projectId} 
                      project={project}
                      onClick={() => navigate(`/projects/${project.projectId}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* View All Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => navigate('/design/completeness')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              View Design Completeness
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

interface ScoreGaugeProps {
  score: number;
  severity: SeverityInfo;
}

const ScoreGauge = ({ score, severity }: ScoreGaugeProps) => {
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getStrokeColor = () => {
    switch (severity.id) {
      case 'complete': return 'text-emerald-500';
      case 'good': return 'text-green-500';
      case 'warning': return 'text-amber-500';
      case 'critical': return 'text-destructive';
      default: return 'text-muted';
    }
  };

  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg className="w-24 h-24 transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="48"
          cy="48"
          r="36"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx="48"
          cy="48"
          r="36"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
            transition: 'stroke-dashoffset 0.5s ease'
          }}
          className={getStrokeColor()}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{score}%</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Combined</span>
      </div>
    </div>
  );
};

interface ProjectHealthRowProps {
  project: ProjectDesignHealth;
  onClick: () => void;
}

const ProjectHealthRow = ({ project, onClick }: ProjectHealthRowProps) => {
  const severity = getSeverity(project.combinedHealthScore);
  
  const getBadgeClasses = () => {
    switch (severity.id) {
      case 'critical': return 'border-destructive/50 text-destructive';
      case 'warning': return 'border-amber-500/50 text-amber-600';
      case 'good': 
      case 'complete': return 'border-green-500/50 text-green-600';
      default: return '';
    }
  };
  
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors text-left"
    >
      <div className="flex items-center gap-2 min-w-0">
        {project.healthStatus === 'critical' ? (
          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
        ) : project.healthStatus === 'warning' ? (
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
        )}
        <span className="text-sm truncate">{project.projectName}</span>
      </div>
      <Badge 
        variant="outline" 
        className={`ml-2 flex-shrink-0 ${getBadgeClasses()}`}
      >
        {project.combinedHealthScore}%
      </Badge>
    </button>
  );
};

const EmptyState = ({ onNavigate }: { onNavigate: () => void }) => (
  <div className="text-center py-6">
    <Activity className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
    <p className="text-sm text-muted-foreground mb-3">
      Create your first project to track design health
    </p>
    <Button variant="outline" size="sm" onClick={onNavigate}>
      Go to Projects
    </Button>
  </div>
);

const DesignHealthCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-28" />
      </div>
      <Skeleton className="h-4 w-48 mt-1" />
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-24 h-24 rounded-full" />
        <div className="flex-1 space-y-3">
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2 w-full" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
      </div>
      <Skeleton className="h-8 w-full" />
    </CardContent>
  </Card>
);
