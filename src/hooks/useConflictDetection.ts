import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DesignRevision {
  id: string;
  revision_number: number;
  change_summary: string | null;
  created_by: string | null;
  created_at: string;
  creatorName?: string;
}

interface ConflictState {
  hasConflict: boolean;
  latestRevision: DesignRevision | null;
  conflictDetectedAt: Date | null;
}

interface UseConflictDetectionOptions {
  entityType: string;
  entityId: string | null;
  currentRevisionNumber: number;
  enabled?: boolean;
}

interface UseConflictDetectionReturn extends ConflictState {
  clearConflict: () => void;
  refreshLatestRevision: () => Promise<void>;
}

export function useConflictDetection({
  entityType,
  entityId,
  currentRevisionNumber,
  enabled = true,
}: UseConflictDetectionOptions): UseConflictDetectionReturn {
  const { user } = useAuth();
  const [conflictState, setConflictState] = useState<ConflictState>({
    hasConflict: false,
    latestRevision: null,
    conflictDetectedAt: null,
  });
  const currentRevisionRef = useRef(currentRevisionNumber);

  // Update ref when prop changes
  useEffect(() => {
    currentRevisionRef.current = currentRevisionNumber;
  }, [currentRevisionNumber]);

  const clearConflict = useCallback(() => {
    setConflictState({
      hasConflict: false,
      latestRevision: null,
      conflictDetectedAt: null,
    });
  }, []);

  const refreshLatestRevision = useCallback(async () => {
    if (!entityId) return;

    const { data } = await supabase
      .from('design_revisions')
      .select(`
        id,
        revision_number,
        change_summary,
        created_by,
        created_at
      `)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('revision_number', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      // Fetch creator name
      let creatorName = 'Unknown';
      if (data.created_by) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('user_id', data.created_by)
          .single();
        
        if (profile) {
          creatorName = profile.full_name || profile.email || 'Unknown';
        }
      }

      const revision: DesignRevision = {
        ...data,
        creatorName,
      };

      // Check if there's a newer revision than what we have
      if (revision.revision_number > currentRevisionRef.current && 
          revision.created_by !== user?.id) {
        setConflictState({
          hasConflict: true,
          latestRevision: revision,
          conflictDetectedAt: new Date(),
        });
      }
    }
  }, [entityType, entityId, user?.id]);

  // Subscribe to realtime changes on design_revisions
  useEffect(() => {
    if (!entityId || !enabled) return;

    const channel = supabase
      .channel(`revisions:${entityType}:${entityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'design_revisions',
          filter: `entity_id=eq.${entityId}`,
        },
        async (payload) => {
          const newRevision = payload.new as {
            id: string;
            revision_number: number;
            change_summary: string | null;
            created_by: string | null;
            created_at: string;
            entity_type: string;
          };

          // Only trigger conflict if it's for the same entity type and not by current user
          if (newRevision.entity_type !== entityType) return;
          if (newRevision.created_by === user?.id) return;
          if (newRevision.revision_number <= currentRevisionRef.current) return;

          // Fetch creator name
          let creatorName = 'Unknown';
          if (newRevision.created_by) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('user_id', newRevision.created_by)
              .single();
            
            if (profile) {
              creatorName = profile.full_name || profile.email || 'Unknown';
            }
          }

          setConflictState({
            hasConflict: true,
            latestRevision: {
              ...newRevision,
              creatorName,
            },
            conflictDetectedAt: new Date(),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entityType, entityId, enabled, user?.id]);

  // Initial check for conflicts
  useEffect(() => {
    if (entityId && enabled) {
      refreshLatestRevision();
    }
  }, [entityId, enabled, refreshLatestRevision]);

  return {
    ...conflictState,
    clearConflict,
    refreshLatestRevision,
  };
}
