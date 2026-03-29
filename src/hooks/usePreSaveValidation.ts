import { useMemo, useCallback } from 'react';
import { useCrossToolValidation, type ToolType, type CrossToolDependency } from '@/hooks/useCrossToolValidation';
import { useIsStageLockedQuery } from '@/hooks/useStageLocking';
import type { WorkflowStageId } from '@/components/design/DesignWorkflowNextStep';

export interface ValidationBlocker {
  id: string;
  type: 'cross_tool' | 'stage_locked' | 'custom';
  severity: 'error' | 'warning';
  message: string;
  details?: string;
}

export interface PreSaveValidationResult {
  canSave: boolean;
  blockers: ValidationBlocker[];
  warnings: ValidationBlocker[];
  validate: () => Promise<{ isValid: boolean; errors: string[] }>;
}

// Map tool types to workflow stage IDs for pre-save validation
const TOOL_TO_STAGE_MAP: Partial<Record<ToolType, WorkflowStageId>> = {
  // Core tools
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
  // Secondary equipment selection tools
  'coil-selection': 'equipment',
  'filter-selection': 'equipment',
  'fan-selection': 'equipment',
  'pump-selection': 'equipment',
  'vav-box-selection': 'equipment',
  'fcu-selection': 'equipment',
  // Plant selection tools
  'cooling-tower-sizing': 'plant',
  'chiller-selection': 'plant',
  'boiler-selection': 'plant',
  // Specialty tools
  'vrf-system': 'equipment',
  'diffuser': 'diffuser',
  'acoustic': 'compliance',
  'insulation': 'distribution',
  // Extended specialty tools
  'economizer-sizing': 'ahu',
  'expansion-tank-sizing': 'plant',
  'silencer-sizing': 'distribution',
  'control-valve-sizing': 'distribution',
  'vibration-isolation': 'compliance',
  'thermal-comfort': 'compliance',
  'smoke-control': 'compliance',
  'sequence-of-operations': 'compliance',
  // Acoustic specialty tools
  'duct-lining': 'distribution',
  'room-acoustics': 'compliance',
  'noise-path': 'compliance',
  'silencer-selection': 'distribution',
  // Documentation tools
  'bas-points': 'compliance',
  'equipment-schedule': 'compliance',
  // Distribution sizing tools
  'duct-sizing': 'distribution',
  'pipe-sizing': 'distribution',
  'pressure-drop': 'distribution',
  // Acoustic cost/analysis tools
  'acoustic-cost': 'compliance',
  'acoustic-roi': 'compliance',
  'lifecycle-cost': 'compliance',
  'treatment-wizard': 'compliance',
  'acoustic-measurement': 'compliance',
  // Terminal unit tools
  'terminal-unit-schedule': 'diffuser',
  // Report tools
  'material-takeoff': 'compliance',
  'air-balance-report': 'compliance',
  'water-balance-report': 'compliance',
  'unified-design-report': 'compliance',
};

// Helper to convert CrossToolDependency to ValidationBlocker
function dependencyToBlocker(alert: CrossToolDependency, index: number, severity: 'error' | 'warning'): ValidationBlocker {
  return {
    id: `cross_tool_${index}`,
    type: 'cross_tool',
    severity,
    message: alert.description,
    details: `${alert.upstream.toolName} was updated ${alert.staleDurationText}. Consider refreshing ${alert.downstream.toolName}.`,
  };
}

export function usePreSaveValidation(
  projectId: string | null,
  toolType: ToolType,
  options?: {
    checkStageLock?: boolean;
    customValidators?: Array<() => Promise<{ isValid: boolean; error?: string }>>;
  }
): PreSaveValidationResult {
  const { checkStageLock = true, customValidators = [] } = options || {};

  // Get cross-tool validation alerts
  const { criticalAlerts, warningAlerts } = useCrossToolValidation(projectId, toolType);

  // Get stage lock status if enabled
  const stageId = TOOL_TO_STAGE_MAP[toolType] || null;
  const { data: stageLock } = useIsStageLockedQuery(
    checkStageLock ? projectId : null,
    stageId
  );

  // Build blockers list
  const blockers = useMemo(() => {
    const result: ValidationBlocker[] = [];

    // Add stage lock blocker
    if (stageLock) {
      result.push({
        id: 'stage_locked',
        type: 'stage_locked',
        severity: 'error',
        message: `Stage "${stageId}" is locked`,
        details: stageLock.reason || 'This stage has been locked and cannot be modified.',
      });
    }

    // Add critical cross-tool alerts as blockers
    criticalAlerts.forEach((alert, index) => {
      result.push(dependencyToBlocker(alert, index, 'error'));
    });

    return result;
  }, [stageLock, criticalAlerts, stageId]);

  // Build warnings list
  const warnings = useMemo(() => {
    return warningAlerts.map((alert, index) => dependencyToBlocker(alert, index, 'warning'));
  }, [warningAlerts]);

  // Custom validation function for additional checks
  const validate = useCallback(async (): Promise<{ isValid: boolean; errors: string[] }> => {
    const errors: string[] = [];

    // Run custom validators
    for (const validator of customValidators) {
      try {
        const result = await validator();
        if (!result.isValid && result.error) {
          errors.push(result.error);
        }
      } catch (error) {
        errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [customValidators]);

  return {
    canSave: blockers.length === 0,
    blockers,
    warnings,
    validate,
  };
}

// Helper hook for wrapping mutations with validation
export function useValidatedMutation<TInput, TOutput>(
  projectId: string | null,
  toolType: ToolType,
  mutationFn: (input: TInput) => Promise<TOutput>,
  options?: {
    onValidationFail?: (blockers: ValidationBlocker[]) => void;
    skipValidation?: boolean;
  }
) {
  const { canSave, blockers, validate } = usePreSaveValidation(projectId, toolType);
  const { onValidationFail, skipValidation = false } = options || {};

  const validatedMutate = useCallback(
    async (input: TInput): Promise<TOutput | null> => {
      if (skipValidation) {
        return mutationFn(input);
      }

      // Check pre-save validation
      if (!canSave) {
        onValidationFail?.(blockers);
        return null;
      }

      // Run custom validation
      const validationResult = await validate();
      if (!validationResult.isValid) {
        onValidationFail?.(
          validationResult.errors.map((error, i) => ({
            id: `custom_${i}`,
            type: 'custom' as const,
            severity: 'error' as const,
            message: error,
          }))
        );
        return null;
      }

      return mutationFn(input);
    },
    [canSave, blockers, validate, mutationFn, onValidationFail, skipValidation]
  );

  return {
    validatedMutate,
    canSave,
    blockers,
  };
}
