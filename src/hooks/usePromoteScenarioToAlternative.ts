import { useCallback } from 'react';
import { toast } from 'sonner';
import { useCreateAlternative } from './useDesignAlternatives';
import { useSandbox, type Scenario } from '@/contexts/SandboxContext';
import { useProfile } from './useOrganization';

interface UsePromoteScenarioToAlternativeOptions {
  projectId: string;
  entityType: string;
  entityId?: string;
  /** Additional data to merge with scenario data */
  additionalData?: Record<string, unknown>;
}

/**
 * Hook to promote a sandbox scenario to a permanent design alternative.
 * This allows users to save what-if scenarios from the sandbox as persistent alternatives.
 */
export function usePromoteScenarioToAlternative({
  projectId,
  entityType,
  entityId,
  additionalData = {},
}: UsePromoteScenarioToAlternativeOptions) {
  const { state } = useSandbox();
  const { data: profile } = useProfile();
  const createAlternative = useCreateAlternative();

  const promoteScenario = useCallback(async (
    scenario: Scenario,
    options?: {
      name?: string;
      description?: string;
      tags?: string[];
      isPrimary?: boolean;
    }
  ) => {
    if (!projectId) {
      toast.error('No project selected');
      return null;
    }

    if (!profile?.organization_id) {
      toast.error('Organization not found');
      return null;
    }

    try {
      // Merge baseline data with scenario modifications
      const mergedData = {
        ...state.baselineData,
        ...scenario.modifications,
        ...additionalData,
        // Include scenario metadata for traceability
        _promotedFrom: {
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          promotedAt: new Date().toISOString(),
        },
      };

      // Also include results if available
      if (scenario.results) {
        (mergedData as Record<string, unknown>)._scenarioResults = scenario.results;
      }

      const result = await createAlternative.mutateAsync({
        projectId,
        entityType,
        entityId,
        name: options?.name || `${scenario.name} (from Sandbox)`,
        description: options?.description || scenario.description || `Promoted from sandbox scenario "${scenario.name}"`,
        data: mergedData,
        isPrimary: options?.isPrimary || false,
        tags: options?.tags || ['sandbox-promoted'],
      });

      toast.success('Scenario promoted to alternative', {
        description: `"${scenario.name}" is now saved as a permanent design alternative`,
      });

      return result;
    } catch (error) {
      console.error('Failed to promote scenario:', error);
      toast.error('Failed to promote scenario', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }, [projectId, entityType, entityId, profile?.organization_id, state.baselineData, additionalData, createAlternative]);

  return {
    promoteScenario,
    isPending: createAlternative.isPending,
  };
}
