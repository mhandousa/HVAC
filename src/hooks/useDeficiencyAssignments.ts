import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';

export type AssignmentPriority = 'low' | 'medium' | 'high' | 'urgent';
export type AssignmentStatus = 'assigned' | 'in_progress' | 'resolved' | 'overdue';

export interface DeficiencyAssignment {
  id: string;
  photoMetadataId: string;
  assignedTo: string;
  assignedBy: string;
  organizationId: string;
  dueDate: string | null;
  priority: AssignmentPriority;
  status: AssignmentStatus;
  notes: string | null;
  notificationSentAt: string | null;
  reminderSentAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined data
  assignee?: {
    id: string;
    fullName: string | null;
    email: string;
    avatarUrl: string | null;
  };
  assigner?: {
    id: string;
    fullName: string | null;
  };
}

export interface CreateAssignmentParams {
  photoMetadataId: string;
  assignedTo: string;
  dueDate?: string | null;
  priority?: AssignmentPriority;
  notes?: string;
  sendNotification?: boolean;
}

export interface UpdateAssignmentParams {
  id: string;
  assignedTo?: string;
  dueDate?: string | null;
  priority?: AssignmentPriority;
  status?: AssignmentStatus;
  notes?: string;
}

export function useDeficiencyAssignments() {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();

  const { data: assignments, isLoading, refetch } = useQuery({
    queryKey: ['deficiency-assignments', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('deficiency_assignments')
        .select(`
          *,
          assignee:assigned_to (
            id,
            full_name,
            email,
            avatar_url
          ),
          assigner:assigned_by (
            id,
            full_name
          )
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        photoMetadataId: item.photo_metadata_id,
        assignedTo: item.assigned_to,
        assignedBy: item.assigned_by,
        organizationId: item.organization_id,
        dueDate: item.due_date,
        priority: item.priority as AssignmentPriority,
        status: item.status as AssignmentStatus,
        notes: item.notes,
        notificationSentAt: item.notification_sent_at,
        reminderSentAt: item.reminder_sent_at,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        assignee: item.assignee ? {
          id: item.assignee.id,
          fullName: item.assignee.full_name,
          email: item.assignee.email,
          avatarUrl: item.assignee.avatar_url,
        } : undefined,
        assigner: item.assigner ? {
          id: item.assigner.id,
          fullName: item.assigner.full_name,
        } : undefined,
      })) as DeficiencyAssignment[];
    },
    enabled: !!organization?.id,
  });

  // Get assignment for a specific deficiency
  const getAssignmentForDeficiency = (photoMetadataId: string) => {
    return assignments?.find(a => a.photoMetadataId === photoMetadataId);
  };

  // Get assignments by technician
  const getAssignmentsByTechnician = (technicianId: string) => {
    return assignments?.filter(a => a.assignedTo === technicianId) || [];
  };

  // Get assignment stats by technician
  const getAssignmentStats = () => {
    if (!assignments) return [];

    const technicianMap = new Map<string, {
      id: string;
      name: string;
      email: string;
      avatarUrl: string | null;
      assigned: number;
      overdue: number;
      inProgress: number;
      resolved: number;
    }>();

    assignments.forEach(a => {
      if (a.assignee) {
        const existing = technicianMap.get(a.assignedTo);
        if (existing) {
          existing.assigned++;
          if (a.status === 'overdue') existing.overdue++;
          if (a.status === 'in_progress') existing.inProgress++;
          if (a.status === 'resolved') existing.resolved++;
        } else {
          technicianMap.set(a.assignedTo, {
            id: a.assignedTo,
            name: a.assignee.fullName || 'Unknown',
            email: a.assignee.email,
            avatarUrl: a.assignee.avatarUrl,
            assigned: 1,
            overdue: a.status === 'overdue' ? 1 : 0,
            inProgress: a.status === 'in_progress' ? 1 : 0,
            resolved: a.status === 'resolved' ? 1 : 0,
          });
        }
      }
    });

    return Array.from(technicianMap.values()).sort((a, b) => b.assigned - a.assigned);
  };

  return {
    assignments: assignments || [],
    isLoading,
    refetch,
    getAssignmentForDeficiency,
    getAssignmentsByTechnician,
    getAssignmentStats,
  };
}

export function useCreateAssignment() {
  const { data: organization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateAssignmentParams) => {
      if (!organization?.id || !user?.id) {
        throw new Error('Organization or user not found');
      }

      // Create assignment
      const { data, error } = await supabase
        .from('deficiency_assignments')
        .insert({
          photo_metadata_id: params.photoMetadataId,
          assigned_to: params.assignedTo,
          assigned_by: user.id,
          organization_id: organization.id,
          due_date: params.dueDate || null,
          priority: params.priority || 'medium',
          notes: params.notes || null,
          status: 'assigned',
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification if enabled
      if (params.sendNotification) {
        try {
          await supabase.functions.invoke('deficiency-notifications', {
            body: {
              type: 'assignment',
              assignmentId: data.id,
            },
          });
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
          // Don't throw - assignment was still created
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deficiency-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['deficiency-dashboard'] });
    },
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateAssignmentParams) => {
      const updateData: any = {};
      
      if (params.assignedTo !== undefined) updateData.assigned_to = params.assignedTo;
      if (params.dueDate !== undefined) updateData.due_date = params.dueDate;
      if (params.priority !== undefined) updateData.priority = params.priority;
      if (params.status !== undefined) updateData.status = params.status;
      if (params.notes !== undefined) updateData.notes = params.notes;

      const { data, error } = await supabase
        .from('deficiency_assignments')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deficiency-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['deficiency-dashboard'] });
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('deficiency_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deficiency-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['deficiency-dashboard'] });
    },
  });
}

export interface BatchReassignmentParams {
  id: string;
  assignedTo: string;
}

export function useBatchReassignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reassignments: BatchReassignmentParams[]) => {
      const results = await Promise.all(
        reassignments.map(async ({ id, assignedTo }) => {
          const { data, error } = await supabase
            .from('deficiency_assignments')
            .update({ assigned_to: assignedTo })
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;
          return data;
        })
      );

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deficiency-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['deficiency-dashboard'] });
    },
  });
}
