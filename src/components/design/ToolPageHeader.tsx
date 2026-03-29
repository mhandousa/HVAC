import { ReactNode } from 'react';
import { Lock, LockOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PreSaveValidationAlert } from '@/components/design/PreSaveValidationAlert';
import { usePreSaveValidation, type ValidationBlocker } from '@/hooks/usePreSaveValidation';
import { useIsStageLockedQuery, useLockStage, useUnlockStage, getStageLockStatus } from '@/hooks/useStageLocking';
import type { ToolType } from '@/hooks/useCrossToolValidation';
import type { WorkflowStageId } from '@/components/design/DesignWorkflowNextStep';

// Extended tool type definitions for full design workflow coverage
export type ExtendedToolType = 
  | ToolType
  | 'coil-selection'
  | 'filter-selection'
  | 'vav-selection'
  | 'fcu-selection'
  | 'fan-selection'
  | 'pump-selection'
  | 'vrf-system'
  | 'erv-sizing'
  | 'diffuser-selection'
  | 'acoustic-analysis'
  // Phase 16: Tertiary tools
  | 'economizer-sizing'
  | 'smoke-control'
  | 'control-valve'
  | 'insulation'
  | 'expansion-tank'
  | 'pressure-drop'
  | 'pipe-sizing'
  | 'equipment-schedule'
  | 'sequence-of-ops'
  | 'silencer-selection'
  | 'noise-path'
  | 'vibration-isolation'
  | 'acoustic-roi'
  | 'room-acoustics'
  // Phase 17: Additional tools
  | 'lifecycle-cost'
  | 'expansion-tank-sizing';

// Map tool types to their workflow stage IDs
const TOOL_TO_STAGE_MAP: Partial<Record<string, WorkflowStageId | null>> = {
  'load-calculation': 'load',
  'ventilation': 'ventilation',
  'psychrometric': 'psychrometric',
  'ahu-configuration': 'ahu',
  'equipment-selection': 'equipment',
  'terminal-unit': 'equipment',
  'duct-system': 'distribution',
  'pipe-system': 'distribution',
  'erv': 'erv',
  'chw-plant': 'plant',
  'hw-plant': 'plant',
  'chiller-selection': 'plant',
  'boiler-selection': 'plant',
  'cooling-tower-sizing': 'plant',
  // Extended tool types
  'coil-selection': 'equipment',
  'filter-selection': 'equipment',
  'vav-selection': 'distribution',
  'fcu-selection': 'distribution',
  'fan-selection': 'distribution',
  'pump-selection': 'distribution',
  'vrf-system': 'equipment',
  'erv-sizing': 'erv',
  'diffuser-selection': 'distribution',
  'acoustic-analysis': 'compliance',
  // Phase 16: Tertiary tools
  'economizer-sizing': 'equipment',
  'smoke-control': 'compliance',
  'control-valve': 'distribution',
  'insulation': 'distribution',
  'expansion-tank': 'plant',
  'pressure-drop': 'distribution',
  'pipe-sizing': 'distribution',
  'equipment-schedule': null,     // Documentation - no stage lock
  'sequence-of-ops': null,        // Documentation - no stage lock
  'silencer-selection': 'compliance',
  'noise-path': 'compliance',
  'vibration-isolation': 'compliance',
  'acoustic-roi': null,           // Analysis tool - no stage lock
  'room-acoustics': 'compliance',
  // Phase 17: Additional tools
  'lifecycle-cost': 'compliance',
  'expansion-tank-sizing': 'plant',
};

interface ToolPageHeaderProps {
  toolType: ToolType | ExtendedToolType | string;
  toolName: string;
  projectId: string | null;
  zoneId?: string | null;
  showLockButton?: boolean;
  showValidation?: boolean;
  onValidationChange?: (canSave: boolean, blockers: ValidationBlocker[]) => void;
  actions?: ReactNode;
  className?: string;
}

export function ToolPageHeader({
  toolType,
  toolName,
  projectId,
  zoneId,
  showLockButton = true,
  showValidation = true,
  onValidationChange,
  actions,
  className,
}: ToolPageHeaderProps) {
  const stageId = TOOL_TO_STAGE_MAP[toolType] || null;
  
  // Get lock status
  const { data: stageLock } = useIsStageLockedQuery(
    showLockButton ? projectId : null,
    stageId
  );
  const lockStage = useLockStage();
  const unlockStage = useUnlockStage();
  const lockStatus = getStageLockStatus(stageLock);
  
  // Get validation status - cast to ToolType since extended types map to parent ToolTypes
  const { canSave, blockers, warnings } = usePreSaveValidation(
    showValidation ? projectId : null,
    toolType as ToolType
  );
  
  // Notify parent of validation state changes
  if (onValidationChange && showValidation) {
    onValidationChange(canSave, blockers);
  }
  
  const handleToggleLock = () => {
    if (!projectId || !stageId) return;
    
    if (lockStatus.isLocked) {
      unlockStage.mutate({ projectId, stageId });
    } else {
      lockStage.mutate({ projectId, stageId, reason: `${toolName} stage locked` });
    }
  };
  
  const isLoading = lockStage.isPending || unlockStage.isPending;
  
  return (
    <div className={className}>
      {/* Lock Status & Controls */}
      {showLockButton && projectId && stageId && (
        <div className="flex items-center gap-2 mb-4">
          {lockStatus.isLocked ? (
            <Badge variant="outline" className="gap-1 text-warning border-warning bg-warning/10">
              <Lock className="h-3 w-3" />
              Stage Locked
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-primary border-primary bg-primary/10">
              <LockOpen className="h-3 w-3" />
              Stage Editable
            </Badge>
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleLock}
                disabled={isLoading}
                className="h-7"
              >
                {lockStatus.isLocked ? (
                  <>
                    <LockOpen className="h-3 w-3 mr-1" />
                    Unlock
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3 mr-1" />
                    Lock
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {lockStatus.isLocked 
                ? `Unlock this stage to allow edits. Locked by ${lockStatus.lockedByName}`
                : 'Lock this stage to prevent further modifications'
              }
            </TooltipContent>
          </Tooltip>
          
          {lockStatus.reason && (
            <span className="text-xs text-muted-foreground">
              {lockStatus.reason}
            </span>
          )}
          
          {actions}
        </div>
      )}
      
      {/* Pre-Save Validation Alerts */}
      {showValidation && projectId && (
        <PreSaveValidationAlert
          blockers={blockers}
          warnings={warnings}
          className="mb-4"
        />
      )}
    </div>
  );
}

// Hook for tools to use validation state
export function useToolValidation(
  projectId: string | null,
  toolType: ExtendedToolType | string,
  options?: { checkStageLock?: boolean }
) {
  const stageId = TOOL_TO_STAGE_MAP[toolType] || null;
  
  const { canSave, blockers, warnings, validate } = usePreSaveValidation(
    projectId,
    toolType as ToolType,
    options
  );
  
  const { data: stageLock } = useIsStageLockedQuery(projectId, stageId);
  const lockStatus = getStageLockStatus(stageLock);
  
  return {
    canSave: canSave && !lockStatus.isLocked,
    isLocked: lockStatus.isLocked,
    blockers,
    warnings,
    lockStatus,
    validate,
  };
}
