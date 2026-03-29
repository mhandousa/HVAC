import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface SendRemindersOptions {
  projectId?: string;
  organizationId?: string;
  forceResend?: boolean;
}

interface SendRemindersResult {
  success: boolean;
  message: string;
  sent: number;
  skipped: number;
  errors: string[];
}

interface NotificationLog {
  id: string;
  organization_id: string;
  project_id: string | null;
  zone_id: string;
  zone_name: string | null;
  remediation_record_id: string;
  notification_type: 'initial' | 'overdue' | 'urgent';
  recipient_email: string;
  recipient_name: string | null;
  days_pending: number | null;
  sent_at: string;
  created_at: string;
}

export function useVerificationReminders(projectId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSending, setIsSending] = useState(false);

  // Fetch notification history
  const { 
    data: notificationHistory, 
    isLoading: isLoadingHistory,
    refetch: refetchHistory 
  } = useQuery({
    queryKey: ['verification-notification-logs', projectId],
    queryFn: async () => {
      let query = supabase
        .from('verification_notification_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(100);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching notification logs:', error);
        throw error;
      }

      return data as NotificationLog[];
    },
  });

  // Send reminders mutation
  const sendRemindersMutation = useMutation({
    mutationFn: async (options: SendRemindersOptions): Promise<SendRemindersResult> => {
      setIsSending(true);
      
      try {
        const response = await supabase.functions.invoke('verification-reminders', {
          body: options,
        });

        if (response.error) {
          throw new Error(response.error.message || 'Failed to send reminders');
        }

        return response.data as SendRemindersResult;
      } finally {
        setIsSending(false);
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Reminders Sent',
          description: result.message,
        });
        // Refresh the notification history
        queryClient.invalidateQueries({ queryKey: ['verification-notification-logs'] });
      } else {
        toast({
          title: 'Warning',
          description: result.message,
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send verification reminders',
        variant: 'destructive',
      });
    },
  });

  const sendReminders = async (options: SendRemindersOptions = {}) => {
    return sendRemindersMutation.mutateAsync({
      projectId,
      ...options,
    });
  };

  // Get stats from notification history
  const stats = {
    totalSent: notificationHistory?.length || 0,
    sentToday: notificationHistory?.filter(n => {
      const sentDate = new Date(n.sent_at);
      const today = new Date();
      return sentDate.toDateString() === today.toDateString();
    }).length || 0,
    byType: {
      initial: notificationHistory?.filter(n => n.notification_type === 'initial').length || 0,
      overdue: notificationHistory?.filter(n => n.notification_type === 'overdue').length || 0,
      urgent: notificationHistory?.filter(n => n.notification_type === 'urgent').length || 0,
    },
  };

  return {
    sendReminders,
    isSending,
    notificationHistory,
    isLoadingHistory,
    refetchHistory,
    stats,
  };
}
