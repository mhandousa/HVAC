import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface DispatchNote {
  id: string;
  work_order_id: string;
  organization_id: string;
  note_type: string;
  content: string;
  is_internal: boolean;
  created_by: string | null;
  created_at: string;
}

export function useDispatchNotes(workOrderId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['dispatch-notes', organization?.id, workOrderId],
    queryFn: async () => {
      if (!organization?.id || !workOrderId) return [];

      const { data, error } = await supabase
        .from('dispatch_notes')
        .select('*')
        .eq('work_order_id', workOrderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DispatchNote[];
    },
    enabled: !!organization?.id && !!workOrderId,
  });
}

export function useCreateDispatchNote() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async (note: { 
      work_order_id: string;
      note_type?: string;
      content: string;
      is_internal?: boolean;
    }) => {
      if (!organization?.id) throw new Error('No organization');

      // Get current user's profile id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const { data, error } = await supabase
        .from('dispatch_notes')
        .insert({
          ...note,
          organization_id: organization.id,
          created_by: profile?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dispatch-notes', variables.work_order_id] });
      toast.success('Note added');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
