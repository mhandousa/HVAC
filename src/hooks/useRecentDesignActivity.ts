import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DesignActivity {
  id: string;
  type: 'revision' | 'approval' | 'alternative';
  entityType: string;
  entityId: string;
  projectId?: string;
  userName: string;
  userAvatar?: string;
  summary: string;
  timestamp: string;
}

interface UseRecentDesignActivityOptions {
  projectId?: string;
  limit?: number;
}

export function useRecentDesignActivity({
  projectId,
  limit = 50,
}: UseRecentDesignActivityOptions = {}) {
  const [activities, setActivities] = useState<DesignActivity[]>([]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['recent-design-activity', projectId, limit],
    queryFn: async () => {
      const results: DesignActivity[] = [];

      // Fetch recent revisions
      let revisionsQuery = supabase
        .from('design_revisions')
        .select(`
          id,
          entity_type,
          entity_id,
          project_id,
          change_summary,
          created_at,
          created_by
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (projectId) {
        revisionsQuery = revisionsQuery.eq('project_id', projectId);
      }

      const { data: revisions } = await revisionsQuery;

      if (revisions) {
        // Fetch user profiles for revisions
        const userIds = [...new Set(revisions.map((r) => r.created_by).filter(Boolean))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, email')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

        revisions.forEach((rev) => {
          const profile = profileMap.get(rev.created_by);
          results.push({
            id: rev.id,
            type: 'revision',
            entityType: rev.entity_type,
            entityId: rev.entity_id,
            projectId: rev.project_id,
            userName: profile?.full_name || profile?.email || 'Unknown User',
            userAvatar: profile?.avatar_url || undefined,
            summary: rev.change_summary || `Updated ${rev.entity_type}`,
            timestamp: rev.created_at,
          });
        });
      }

      // Fetch recent approvals
      let approvalsQuery = supabase
        .from('design_approvals')
        .select(`
          id,
          entity_type,
          entity_id,
          project_id,
          status,
          submitted_at,
          reviewed_at,
          submitted_by,
          reviewed_by
        `)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (projectId) {
        approvalsQuery = approvalsQuery.eq('project_id', projectId);
      }

      const { data: approvals } = await approvalsQuery;

      if (approvals) {
        const userIds = [
          ...new Set([
            ...approvals.map((a) => a.submitted_by).filter(Boolean),
            ...approvals.map((a) => a.reviewed_by).filter(Boolean),
          ]),
        ];

        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, email')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

        approvals.forEach((approval) => {
          const isReviewed = approval.reviewed_at && approval.reviewed_by;
          const relevantUserId = isReviewed ? approval.reviewed_by : approval.submitted_by;
          const profile = profileMap.get(relevantUserId);
          const action = isReviewed
            ? approval.status === 'approved'
              ? 'approved'
              : 'reviewed'
            : 'submitted for review';

          results.push({
            id: approval.id,
            type: 'approval',
            entityType: approval.entity_type,
            entityId: approval.entity_id,
            projectId: approval.project_id,
            userName: profile?.full_name || profile?.email || 'Unknown User',
            userAvatar: profile?.avatar_url || undefined,
            summary: `${approval.entity_type} ${action}`,
            timestamp: isReviewed ? approval.reviewed_at! : approval.submitted_at || new Date().toISOString(),
          });
        });
      }

      // Fetch recent alternatives
      let alternativesQuery = supabase
        .from('design_alternatives')
        .select(`
          id,
          entity_type,
          entity_id,
          project_id,
          name,
          created_at,
          created_by
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (projectId) {
        alternativesQuery = alternativesQuery.eq('project_id', projectId);
      }

      const { data: alternatives } = await alternativesQuery;

      if (alternatives) {
        const userIds = [...new Set(alternatives.map((a) => a.created_by).filter(Boolean))];

        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, email')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

        alternatives.forEach((alt) => {
          const profile = profileMap.get(alt.created_by);
          results.push({
            id: alt.id,
            type: 'alternative',
            entityType: alt.entity_type,
            entityId: alt.entity_id || '',
            projectId: alt.project_id,
            userName: profile?.full_name || profile?.email || 'Unknown User',
            userAvatar: profile?.avatar_url || undefined,
            summary: `Created alternative "${alt.name}"`,
            timestamp: alt.created_at,
          });
        });
      }

      // Sort by timestamp
      results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return results.slice(0, limit);
    },
    staleTime: 30000,
  });

  useEffect(() => {
    if (data) {
      setActivities(data);
    }
  }, [data]);

  // Real-time subscription for new revisions
  useEffect(() => {
    const channel = supabase
      .channel('design-activity-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'design_revisions',
        },
        () => {
          refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'design_approvals',
        },
        () => {
          refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'design_alternatives',
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return {
    activities,
    isLoading,
    refetch,
  };
}
