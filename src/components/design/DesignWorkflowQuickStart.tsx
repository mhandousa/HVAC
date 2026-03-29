import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowRight, 
  CheckCircle2, 
  Circle, 
  Loader2,
  Play,
  Ruler,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDesignWorkflowProgress, WorkflowStageProgress } from '@/hooks/useDesignWorkflowProgress';
import { DESIGN_WORKFLOW_STAGES } from './DesignWorkflowNextStep';
import { useProjects } from '@/hooks/useProjects';
import { useZoneContext } from '@/hooks/useZoneContext';

interface DesignWorkflowQuickStartProps {
  className?: string;
}

interface StageIconProps {
  stage: WorkflowStageProgress;
  size?: 'sm' | 'md';
}

function StageIcon({ stage, size = 'md' }: StageIconProps) {
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const containerSize = size === 'sm' ? 'w-7 h-7' : 'w-10 h-10';

  if (stage.isComplete) {
    return (
      <div className={cn(containerSize, "rounded-full bg-green-500 flex items-center justify-center")}>
        <CheckCircle2 className={cn(iconSize, "text-white")} />
      </div>
    );
  }
  
  if (stage.hasData) {
    return (
      <div className={cn(containerSize, "rounded-full bg-primary flex items-center justify-center")}>
        <span className="text-xs font-bold text-primary-foreground">{stage.progress}%</span>
      </div>
    );
  }

  return (
    <div className={cn(containerSize, "rounded-full bg-muted border-2 border-muted-foreground/30 flex items-center justify-center")}>
      <Circle className={cn(iconSize, "text-muted-foreground/50")} />
    </div>
  );
}

export function DesignWorkflowQuickStart({ className }: DesignWorkflowQuickStartProps) {
  const navigate = useNavigate();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  const { buildUrl: buildContextUrl, setContext, projectId: storedProjectId } = useZoneContext();
  
  const { data: progress, isLoading: progressLoading } = useDesignWorkflowProgress(selectedProjectId);

  // Auto-select from stored context or first project
  React.useEffect(() => {
    if (!selectedProjectId && projects && projects.length > 0) {
      // Prefer stored project from zone context
      if (storedProjectId && projects.some(p => p.id === storedProjectId)) {
        setSelectedProjectId(storedProjectId);
      } else {
        setSelectedProjectId(projects[0].id);
      }
    }
  }, [projects, selectedProjectId, storedProjectId]);

  // Update zone context when project changes
  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    setContext(projectId, null); // Update context, clear zone when project changes
  };

  const buildUrl = (path: string) => {
    return buildContextUrl(path, { projectId: selectedProjectId });
  };

  const handleContinueDesign = () => {
    if (progress?.nextRecommendedStage) {
      const stage = DESIGN_WORKFLOW_STAGES.find(s => s.id === progress.nextRecommendedStage);
      if (stage) {
        navigate(buildUrl(`/design${stage.path}`));
      }
    }
  };

  const handleStageClick = (stage: WorkflowStageProgress) => {
    navigate(buildUrl(`/design${stage.primaryPath}`));
  };

  if (projectsLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="w-5 h-5" />
            Design Workflow
          </CardTitle>
          <CardDescription>
            Create a project to start tracking your design workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/projects/new')} className="gap-2">
            <Play className="w-4 h-4" />
            Create New Project
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="w-5 h-5" />
              Design Workflow Progress
            </CardTitle>
            <CardDescription>
              Track your 7-stage HVAC design workflow
            </CardDescription>
          </div>
          <Select
            value={selectedProjectId || ''}
            onValueChange={handleProjectChange}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {progressLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : progress ? (
          <>
            {/* Overall Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{progress.overallProgress}%</span>
              </div>
              <Progress value={progress.overallProgress} className="h-2" />
            </div>

            {/* Stage Progress Icons */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
              {progress.stages.map((stage, index) => {
                const stageConfig = DESIGN_WORKFLOW_STAGES.find(s => s.id === stage.stageId);
                const StageConfigIcon = stageConfig?.icon;
                
                return (
                  <div key={stage.stageId} className="flex items-center">
                    <button
                      onClick={() => handleStageClick(stage)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors",
                        "hover:bg-muted/50",
                        stage.stageId === progress.currentStage && "bg-primary/5 ring-1 ring-primary/20"
                      )}
                    >
                      <StageIcon stage={stage} />
                      <span className="text-xs font-medium text-center max-w-[60px] truncate">
                        {stage.stageName}
                      </span>
                      {stage.hasData && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {stage.itemCount} zones
                        </Badge>
                      )}
                    </button>
                    {index < progress.stages.length - 1 && (
                      <div 
                        className={cn(
                          "w-4 h-0.5 mx-1",
                          stage.isComplete ? "bg-green-500" : "bg-muted"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Current Stage Info */}
            {progress.currentStage && (
              <div className="p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Current Stage: <span className="font-medium text-foreground">
                        {progress.stages.find(s => s.stageId === progress.currentStage)?.stageName}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {progress.stages.find(s => s.stageId === progress.currentStage)?.description}
                    </p>
                  </div>
                  <Button onClick={handleContinueDesign} className="gap-2 shrink-0">
                    Continue Design
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                <strong className="text-foreground">{progress.completedStages}</strong> of {progress.totalStages} stages complete
              </span>
              <span className="text-muted-foreground/50">•</span>
              <span>
                Project: <strong className="text-foreground">{progress.projectName}</strong>
              </span>
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            Select a project to view workflow progress
          </div>
        )}
      </CardContent>
    </Card>
  );
}
