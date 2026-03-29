import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useDesignWorkflowProgress, WorkflowStageProgress } from '@/hooks/useDesignWorkflowProgress';
import { DESIGN_WORKFLOW_STAGES, WorkflowStageId } from '@/components/design/DesignWorkflowNextStep';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Lock } from 'lucide-react';

interface DesignWorkflowProgressBarProps {
  projectId: string | null;
  variant?: 'full' | 'compact' | 'mini';
  showLabels?: boolean;
  showPercentages?: boolean;
  onStageClick?: (stageId: WorkflowStageId) => void;
  className?: string;
}

const STAGE_ORDER: WorkflowStageId[] = [
  'load',
  'ventilation',
  'psychrometric',
  'ahu',
  'terminal',
  'equipment',
  'distribution',
  'diffuser',
  'erv',
  'plant',
  'compliance',
];

export function DesignWorkflowProgressBar({
  projectId,
  variant = 'full',
  showLabels = true,
  showPercentages = true,
  onStageClick,
  className,
}: DesignWorkflowProgressBarProps) {
  const navigate = useNavigate();
  const { data: progress, isLoading, error } = useDesignWorkflowProgress(projectId);

  const stagesInOrder = useMemo(() => {
    if (!progress) return [];
    return STAGE_ORDER.map(stageId => 
      progress.stages.find(s => s.stageId === stageId)
    ).filter(Boolean) as WorkflowStageProgress[];
  }, [progress]);

  const handleStageClick = (stage: WorkflowStageProgress) => {
    if (onStageClick) {
      onStageClick(stage.stageId);
      return;
    }
    
    // Navigate to the primary tool for this stage
    const stageConfig = DESIGN_WORKFLOW_STAGES.find(s => s.id === stage.stageId);
    if (stageConfig && projectId) {
      navigate(`/design${stageConfig.path}?project=${projectId}`);
    }
  };

  const isStageAccessible = (stage: WorkflowStageProgress, index: number): boolean => {
    // First stage is always accessible
    if (index === 0) return true;
    // Stage is accessible if it has data or previous stage is complete
    if (stage.hasData) return true;
    // Check if previous stage is complete (>= 80%)
    const prevStage = stagesInOrder[index - 1];
    return prevStage?.isComplete || false;
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-4', className)}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !progress) {
    return null;
  }

  if (variant === 'mini') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {stagesInOrder.map((stage, index) => (
          <Tooltip key={stage.stageId}>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleStageClick(stage)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  stage.isComplete ? 'bg-chart-2' :
                  stage.hasData ? 'bg-primary' :
                  'bg-muted'
                )}
              />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p className="font-medium">{stage.stageName}</p>
              <p className="text-muted-foreground">{stage.progress}% complete</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Progress bar container */}
      <div className="relative">
        {/* Connector line */}
        <div className="absolute top-5 left-8 right-8 h-0.5 bg-muted" />
        <div 
          className="absolute top-5 left-8 h-0.5 bg-primary transition-all duration-500"
          style={{ 
            width: `calc(${(progress.overallProgress / 100) * 100}% - 4rem)`,
            maxWidth: 'calc(100% - 4rem)'
          }}
        />
        
        {/* Stage circles */}
        <div className="relative flex justify-between">
          {stagesInOrder.map((stage, index) => {
            const isAccessible = isStageAccessible(stage, index);
            const stageConfig = DESIGN_WORKFLOW_STAGES.find(s => s.id === stage.stageId);
            const Icon = stageConfig?.icon;
            
            return (
              <Tooltip key={stage.stageId}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => isAccessible && handleStageClick(stage)}
                    disabled={!isAccessible}
                    className={cn(
                      'flex flex-col items-center gap-1.5 group transition-all',
                      !isAccessible && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    {/* Circle */}
                    <div
                      className={cn(
                        'relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                        stage.isComplete ? 'bg-chart-2 border-chart-2 text-primary-foreground' :
                        stage.hasData ? 'bg-primary/10 border-primary text-primary' :
                        'bg-background border-muted text-muted-foreground',
                        isAccessible && !stage.isComplete && 'group-hover:border-primary/70 group-hover:bg-primary/5'
                      )}
                    >
                      {stage.isComplete ? (
                        <Check className="h-5 w-5" />
                      ) : !isAccessible ? (
                        <Lock className="h-4 w-4" />
                      ) : Icon ? (
                        <Icon className="h-4 w-4" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                      
                      {/* Progress ring for in-progress stages */}
                      {stage.hasData && !stage.isComplete && (
                        <svg
                          className="absolute inset-0 w-full h-full -rotate-90"
                          viewBox="0 0 40 40"
                        >
                          <circle
                            cx="20"
                            cy="20"
                            r="18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray={`${(stage.progress / 100) * 113} 113`}
                            className="text-primary opacity-30"
                          />
                        </svg>
                      )}
                    </div>
                    
                    {/* Label */}
                    {(variant === 'full' || showLabels) && (
                      <span className={cn(
                        'text-xs font-medium whitespace-nowrap',
                        stage.isComplete ? 'text-chart-2' :
                        stage.hasData ? 'text-foreground' :
                        'text-muted-foreground'
                      )}>
                        {stage.stageName}
                      </span>
                    )}
                    
                    {/* Percentage */}
                    {(variant === 'full' || showPercentages) && stage.hasData && (
                      <span className={cn(
                        'text-[10px]',
                        stage.isComplete ? 'text-chart-2' : 'text-muted-foreground'
                      )}>
                        {stage.progress}%
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <div className="space-y-1">
                    <p className="font-medium">{stage.stageName}</p>
                    <p className="text-xs text-muted-foreground">{stage.description}</p>
                    {stage.itemCount > 0 && (
                      <p className="text-xs">
                        {stage.itemCount} item{stage.itemCount !== 1 ? 's' : ''} configured
                      </p>
                    )}
                    {!isAccessible && (
                      <p className="text-xs text-chart-4">
                        Complete previous stages first
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
      
      {/* Overall progress text */}
      {variant === 'full' && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-muted-foreground">
            Overall Progress
          </span>
          <span className="font-medium">
            {progress.completedStages}/{progress.totalStages} stages complete ({progress.overallProgress}%)
          </span>
        </div>
      )}
    </div>
  );
}
