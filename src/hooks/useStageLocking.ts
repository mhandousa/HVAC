import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { WorkflowStageId } from '@/components/design/DesignWorkflowNextStep';

export interface StageLock {
  id: string;
  project_id: string;
  stage_id: WorkflowStageId;
  locked_at: string;
  locked_by: string | null;
  unlock_requested_at: string | null;
  unlock_requested_by: string | null;
  reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  locked_by_profile?: {
    full_name: string | null;
    email: string | null;
  };
}

export interface LockStageInput {
  projectId: string;
  stageId: WorkflowStageId;
  reason?: string;
}

export interface UnlockStageInput {
  projectId: string;
  stageId: WorkflowStageId;
}

export function useStageLocks(projectId: string | null) {
  return useQuery({
    queryKey: ['stage-locks', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_stage_locks')
        .select(`
          *,
          locked_by_profile:profiles!project_stage_locks_locked_by_fkey(full_name, email)
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      return data as StageLock[];
    },
    enabled: !!projectId,
  });
}

export function useIsStageLockedQuery(projectId: string | null, stageId: WorkflowStageId | null) {
  return useQuery({
    queryKey: ['stage-lock', projectId, stageId],
    queryFn: async () => {
      if (!projectId || !stageId) return null;

      const { data, error } = await supabase
        .from('project_stage_locks')
        .select(`
          *,
          locked_by_profile:profiles!project_stage_locks_locked_by_fkey(full_name, email)
        `)
        .eq('project_id', projectId)
        .eq('stage_id', stageId)
        .maybeSingle();

      if (error) throw error;
      return data as StageLock | null;
    },
    enabled: !!projectId && !!stageId,
  });
}

export function useLockStage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ projectId, stageId, reason }: LockStageInput) => {
      const { data, error } = await supabase
        .from('project_stage_locks')
        .insert({
          project_id: projectId,
          stage_id: stageId,
          locked_by: user?.id,
          reason: reason || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('This stage is already locked');
        }
        throw error;
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stage-locks', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['stage-lock', variables.projectId, variables.stageId] });
      toast.success('Stage locked successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to lock stage');
    },
  });
}

export function useUnlockStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, stageId }: UnlockStageInput) => {
      const { error } = await supabase
        .from('project_stage_locks')
        .delete()
        .eq('project_id', projectId)
        .eq('stage_id', stageId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stage-locks', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['stage-lock', variables.projectId, variables.stageId] });
      toast.success('Stage unlocked successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unlock stage');
    },
  });
}

export function useRequestUnlock() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ projectId, stageId }: UnlockStageInput) => {
      const { data, error } = await supabase
        .from('project_stage_locks')
        .update({
          unlock_requested_at: new Date().toISOString(),
          unlock_requested_by: user?.id,
        })
        .eq('project_id', projectId)
        .eq('stage_id', stageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stage-locks', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['stage-lock', variables.projectId, variables.stageId] });
      toast.success('Unlock request submitted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to request unlock');
    },
  });
}

// Helper hook to check if current user can modify a locked stage
export function useCanModifyLockedStage(lock: StageLock | null) {
  const { user } = useAuth();
  
  if (!lock) return true; // Not locked, can modify
  if (!user) return false; // No user, cannot modify
  
  // User who locked it can modify
  if (lock.locked_by === user.id) return true;
  
  // TODO: Add admin check here if needed
  return false;
}

// Helper to get lock status for display
export function getStageLockStatus(lock: StageLock | null): {
  isLocked: boolean;
  hasUnlockRequest: boolean;
  lockedByName: string;
  lockedAt: string;
  reason: string | null;
} {
  if (!lock) {
    return {
      isLocked: false,
      hasUnlockRequest: false,
      lockedByName: '',
      lockedAt: '',
      reason: null,
    };
  }

  return {
    isLocked: true,
    hasUnlockRequest: !!lock.unlock_requested_at,
    lockedByName: lock.locked_by_profile?.full_name || lock.locked_by_profile?.email || 'Unknown',
    lockedAt: lock.locked_at,
    reason: lock.reason,
  };
}
