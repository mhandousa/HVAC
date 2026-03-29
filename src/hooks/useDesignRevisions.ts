import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useOrganization';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';
import { 
  calculateDiff, 
  summarizeDiff, 
  generateChangeSummary,
  DiffSummary 
} from '@/lib/revision-diff-utils';

export interface DesignRevision {
  id: string;
  project_id: string;
  entity_type: string;
  entity_id: string;
  revision_number: number;
  previous_data: Json;
  current_data: Json;
  changes: Json;
  change_summary: string | null;
  change_type: string;
  comment: string | null;
  created_by: string | null;
  created_at: string;
  organization_id: string;
  profile?: {
    full_name: string | null;
    email: string | null;
  };
}

export interface CreateRevisionParams {
  projectId: string;
  entityType: string;
  entityId: string;
  previousData: Record<string, unknown> | null;
  currentData: Record<string, unknown>;
  changeType?: 'create' | 'update' | 'delete';
  comment?: string;
}

/**
 * Hook to fetch revision history for a specific design entity
 */
export function useDesignRevisions(entityType: string, entityId: string | undefined) {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['design_revisions', entityType, entityId],
    queryFn: async () => {
      if (!entityId || !profile?.organization_id) return [];

      const { data, error } = await supabase
        .from('design_revisions')
        .select(`
          *,
          profile:created_by(full_name, email)
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('organization_id', profile.organization_id)
        .order('revision_number', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as DesignRevision[];
    },
    enabled: !!entityId && !!profile?.organization_id,
  });
}

/**
 * Hook to fetch all revisions for a project
 */
export function useProjectRevisions(projectId: string | undefined) {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['design_revisions', 'project', projectId],
    queryFn: async () => {
      if (!projectId || !profile?.organization_id) return [];

      const { data, error } = await supabase
        .from('design_revisions')
        .select(`
          *,
          profile:created_by(full_name, email)
        `)
        .eq('project_id', projectId)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as unknown as DesignRevision[];
    },
    enabled: !!projectId && !!profile?.organization_id,
  });
}

/**
 * Hook to create a new revision
 */
export function useCreateRevision() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (params: CreateRevisionParams) => {
      if (!profile?.organization_id) {
        throw new Error('Organization not found');
      }

      // Get the latest revision number
      const { data: latestRevision } = await supabase
        .from('design_revisions')
        .select('revision_number')
        .eq('entity_type', params.entityType)
        .eq('entity_id', params.entityId)
        .eq('organization_id', profile.organization_id)
        .order('revision_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextRevisionNumber = (latestRevision?.revision_number || 0) + 1;

      // Calculate diff
      const diffs = calculateDiff(params.previousData, params.currentData);
      const diffSummary = summarizeDiff(diffs);
      const changeSummary = params.comment || generateChangeSummary(diffs);

      const { data, error } = await supabase
        .from('design_revisions')
        .insert({
          project_id: params.projectId,
          entity_type: params.entityType,
          entity_id: params.entityId,
          revision_number: nextRevisionNumber,
          previous_data: params.previousData as Json,
          current_data: params.currentData as Json,
          changes: diffSummary as unknown as Json,
          change_summary: changeSummary,
          change_type: params.changeType || 'update',
          comment: params.comment || null,
          created_by: profile.user_id,
          organization_id: profile.organization_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['design_revisions', variables.entityType, variables.entityId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['design_revisions', 'project', variables.projectId] 
      });
    },
    onError: (error) => {
      console.error('Failed to create revision:', error);
      toast.error('Failed to save revision history');
    },
  });
}

/**
 * Hook to get diff between two revisions
 */
export function useRevisionDiff(
  revisionId: string | undefined,
  compareToId?: string
): { diff: DiffSummary | null; isLoading: boolean } {
  const { data: revision, isLoading: loadingRevision } = useQuery({
    queryKey: ['design_revision', revisionId],
    queryFn: async () => {
      if (!revisionId) return null;

      const { data, error } = await supabase
        .from('design_revisions')
        .select('*')
        .eq('id', revisionId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!revisionId,
  });

  const { data: compareRevision, isLoading: loadingCompare } = useQuery({
    queryKey: ['design_revision', compareToId],
    queryFn: async () => {
      if (!compareToId) return null;

      const { data, error } = await supabase
        .from('design_revisions')
        .select('*')
        .eq('id', compareToId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!compareToId,
  });

  if (!revision) {
    return { diff: null, isLoading: loadingRevision };
  }

  // If comparing to another revision, calculate diff between them
  if (compareToId && compareRevision) {
    const diffs = calculateDiff(
      compareRevision.current_data as Record<string, unknown>,
      revision.current_data as Record<string, unknown>
    );
    return { diff: summarizeDiff(diffs), isLoading: loadingRevision || loadingCompare };
  }

  // Otherwise, return the stored diff
  if (revision.changes) {
    return { diff: revision.changes as unknown as DiffSummary, isLoading: loadingRevision };
  }

  // Calculate diff from previous_data to current_data
  const diffs = calculateDiff(
    revision.previous_data as Record<string, unknown> | null,
    revision.current_data as Record<string, unknown>
  );
  return { diff: summarizeDiff(diffs), isLoading: loadingRevision };
}

/**
 * Hook to rollback to a previous revision
 */
export function useRollbackRevision() {
  const queryClient = useQueryClient();
  const createRevision = useCreateRevision();

  return useMutation({
    mutationFn: async ({ 
      revision, 
      projectId 
    }: { 
      revision: DesignRevision; 
      projectId: string;
    }) => {
      // Get the current data for comparison
      const { data: latestRevision } = await supabase
        .from('design_revisions')
        .select('current_data')
        .eq('entity_type', revision.entity_type)
        .eq('entity_id', revision.entity_id)
        .order('revision_number', { ascending: false })
        .limit(1)
        .single();

      // Create a new revision with the rolled back data
      await createRevision.mutateAsync({
        projectId,
        entityType: revision.entity_type,
        entityId: revision.entity_id,
        previousData: latestRevision?.current_data as Record<string, unknown> | null,
        currentData: revision.current_data as Record<string, unknown>,
        changeType: 'update',
        comment: `Rolled back to revision v${revision.revision_number}`,
      });

      return revision.current_data;
    },
    onSuccess: () => {
      toast.success('Successfully rolled back to previous revision');
    },
    onError: (error) => {
      console.error('Rollback failed:', error);
      toast.error('Failed to rollback revision');
    },
  });
}

/**
 * Helper hook to track changes and auto-create revisions
 */
export function useRevisionTracker(
  projectId: string | undefined,
  entityType: string,
  entityId: string | undefined
) {
  const createRevision = useCreateRevision();

  const trackChange = async (
    previousData: Record<string, unknown> | null,
    currentData: Record<string, unknown>,
    comment?: string
  ) => {
    if (!projectId || !entityId) return;

    // Only create revision if there are actual changes
    const diffs = calculateDiff(previousData, currentData);
    if (diffs.length === 0) return;

    await createRevision.mutateAsync({
      projectId,
      entityType,
      entityId,
      previousData,
      currentData,
      changeType: previousData ? 'update' : 'create',
      comment,
    });
  };

  return { trackChange, isTracking: createRevision.isPending };
}
