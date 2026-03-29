import React from 'react';
import { Check, Lock, Loader2, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkflowStageProgress } from '@/hooks/useDesignWorkflowProgress';
import { DESIGN_WORKFLOW_STAGES, WorkflowStageId } from '../DesignWorkflowNextStep';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StageLockIndicator } from './StageLockIndicator';
import { useStageLocks, useUnlockStage, useRequestUnlock, type StageLock } from '@/hooks/useStageLocking';
import { useAuth } from '@/hooks/useAuth';
interface WizardNavigationProps {
  stages: WorkflowStageProgress[];
  currentStage: WorkflowStageId;
  completedStages: WorkflowStageId[];
  skippedStages: WorkflowStageId[];
  overallProgress: number;
  onStageSelect: (stageId: WorkflowStageId) => void;
  projectId: string;
  className?: string;
}

const OPTIONAL_STAGES: WorkflowStageId[] = ['psychrometric', 'erv'];

export function WizardNavigation({
  stages,
  currentStage,
  completedStages,
  skippedStages,
  overallProgress,
  onStageSelect,
  projectId,
  className,
}: WizardNavigationProps) {
  const { user } = useAuth();
  const { data: locks = [] } = useStageLocks(projectId);
  const unlockStage = useUnlockStage();
  const requestUnlock = useRequestUnlock();

  const getStageLock = (stageId: WorkflowStageId): StageLock | null => {
    return locks.find(l => l.stage_id === stageId) || null;
  };

  const getStageStatus = (stageId: WorkflowStageId) => {
    if (completedStages.includes(stageId)) return 'completed';
    if (skippedStages.includes(stageId)) return 'skipped';
    if (stageId === currentStage) return 'current';
    return 'pending';
  };

  const getStageProgress = (stageId: WorkflowStageId) => {
    const stage = stages.find(s => s.stageId === stageId);
    return stage?.progress || 0;
  };

  const canNavigateToStage = (stageId: WorkflowStageId, index: number) => {
    const currentIndex = DESIGN_WORKFLOW_STAGES.findIndex(s => s.id === currentStage);
    // Can navigate to completed, skipped, current, or next stage
    return index <= currentIndex + 1;
  };

  const canUnlockStage = (lock: StageLock | null) => {
    if (!lock || !user) return false;
    return lock.locked_by === user.id;
  };

  return (
    <div className={cn("flex flex-col h-full bg-muted/30 border-r", className)}>
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Design Stages
        </h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
        {DESIGN_WORKFLOW_STAGES.map((stage, index) => {
            const stageId = stage.id as WorkflowStageId;
            const status = getStageStatus(stageId);
            const progress = getStageProgress(stageId);
            const isOptional = OPTIONAL_STAGES.includes(stageId);
            const lock = getStageLock(stageId);
            const isLocked = !!lock;
            const canNavigate = canNavigateToStage(stageId, index) && !isLocked;
            const Icon = stage.icon;
            return (
              <div
                key={stage.id}
                className="relative"
              >
                {/* Lock indicator */}
                {isLocked && (
                  <div className="absolute -left-1 top-3 z-10">
                    <StageLockIndicator
                      lock={lock}
                      stageName={stage.name}
                      size="sm"
                      showDetails={true}
                      canUnlock={canUnlockStage(lock)}
                      onUnlock={() => unlockStage.mutate({ projectId, stageId })}
                      onRequestUnlock={() => requestUnlock.mutate({ projectId, stageId })}
                    />
                  </div>
                )}
              <button
                onClick={() => canNavigate && onStageSelect(stageId)}
                disabled={!canNavigate}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                  isLocked && "pl-6",
                  status === 'current' && !isLocked && "bg-primary/10 border border-primary/30",
                  status === 'current' && isLocked && "bg-destructive/5 border border-destructive/30",
                  status === 'completed' && "bg-green-500/10",
                  status === 'skipped' && "bg-muted",
                  (status === 'pending' && !canNavigate) || isLocked && "opacity-50 cursor-not-allowed",
                  status === 'pending' && canNavigate && "hover:bg-muted/50",
                  canNavigate && "cursor-pointer"
                )}
              >
                {/* Status indicator */}
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                  isLocked && "bg-destructive/20 text-destructive",
                  !isLocked && status === 'completed' && "bg-green-500 text-white",
                  !isLocked && status === 'skipped' && "bg-muted-foreground/30 text-muted-foreground",
                  !isLocked && status === 'current' && "bg-primary text-primary-foreground",
                  !isLocked && status === 'pending' && "bg-muted border-2 border-muted-foreground/30"
                )}>
                  {isLocked ? (
                    <Lock className="h-4 w-4" />
                  ) : status === 'completed' ? (
                    <Check className="h-4 w-4" />
                  ) : status === 'skipped' ? (
                    <SkipForward className="h-4 w-4" />
                  ) : status === 'current' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">{index + 1}</span>
                  )}
                </div>

                {/* Stage info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className={cn(
                      "font-medium text-sm truncate",
                      status === 'current' && "text-primary",
                      status === 'completed' && "text-green-600 dark:text-green-400",
                      status === 'skipped' && "text-muted-foreground line-through"
                    )}>
                      {stage.name}
                    </span>
                    {isOptional && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        Optional
                      </Badge>
                    )}
                  </div>
                  
                  {/* Progress bar for current or in-progress stages */}
                  {(status === 'current' || (status === 'pending' && progress > 0)) && (
                    <div className="mt-2">
                      <Progress value={progress} className="h-1" />
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        {progress}% complete
                      </span>
                    </div>
                  )}

                  {status === 'completed' && progress >= 80 && (
                    <span className="text-[10px] text-green-600 dark:text-green-400">
                      ✓ {progress}% complete
                    </span>
                  )}
                </div>
              </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Overall progress footer */}
      <div className="p-4 border-t bg-background/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            Overall Progress
          </span>
          <span className="text-sm font-bold text-primary">
            {Math.round(overallProgress)}%
          </span>
        </div>
        <Progress value={overallProgress} className="h-2" />
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>{completedStages.length} completed</span>
          {skippedStages.length > 0 && (
            <span>{skippedStages.length} skipped</span>
          )}
        </div>
      </div>
    </div>
  );
}
