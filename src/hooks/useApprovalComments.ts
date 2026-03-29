import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface ApprovalComment {
  id: string;
  approval_id: string;
  parent_comment_id: string | null;
  content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
  replies?: ApprovalComment[];
}

export function useApprovalComments(approvalId: string | undefined) {
  return useQuery({
    queryKey: ['approval-comments', approvalId],
    queryFn: async () => {
      if (!approvalId) return [];

      const { data, error } = await supabase
        .from('design_approval_comments')
        .select(`*`)
        .eq('approval_id', approvalId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching approval comments:', error);
        return [];
      }

      // Organize into threads (parent comments with replies)
      const comments = data as ApprovalComment[];
      const topLevel = comments.filter(c => !c.parent_comment_id);
      const replies = comments.filter(c => c.parent_comment_id);

      return topLevel.map(comment => ({
        ...comment,
        replies: replies.filter(r => r.parent_comment_id === comment.id),
      }));
    },
    enabled: !!approvalId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      approvalId,
      content,
      parentCommentId,
    }: {
      approvalId: string;
      content: string;
      parentCommentId?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('design_approval_comments')
        .insert({
          approval_id: approvalId,
          content,
          parent_comment_id: parentCommentId || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['approval-comments', variables.approvalId] });
      toast.success('Comment added');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add comment');
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      content,
      approvalId,
    }: {
      commentId: string;
      content: string;
      approvalId: string;
    }) => {
      const { data, error } = await supabase
        .from('design_approval_comments')
        .update({ content })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['approval-comments', variables.approvalId] });
      toast.success('Comment updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update comment');
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      approvalId,
    }: {
      commentId: string;
      approvalId: string;
    }) => {
      const { error } = await supabase
        .from('design_approval_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['approval-comments', variables.approvalId] });
      toast.success('Comment deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete comment');
    },
  });
}
