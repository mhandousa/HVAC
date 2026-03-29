import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { WorkflowStageId } from '@/components/design/DesignWorkflowNextStep';
import { generateMilestones, STAGE_TIMING_CONFIGS } from '@/lib/timeline-utils';

export interface ProjectStageMilestone {
  id: string;
  project_id: string;
  organization_id: string;
  stage_id: string;
  planned_start_date: string | null;
  planned_end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  estimated_duration_days: number | null;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useProjectMilestones(projectId: string | null) {
  return useQuery({
    queryKey: ['project-milestones', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('project_stage_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return (data || []) as ProjectStageMilestone[];
    },
    enabled: !!projectId,
  });
}

export function useGenerateProjectMilestones() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      projectId,
      organizationId,
      startDate,
      endDate,
    }: {
      projectId: string;
      organizationId: string;
      startDate: Date;
      endDate: Date | null;
    }) => {
      // Generate milestones based on project dates
      const milestones = generateMilestones(startDate, endDate);
      
      // Prepare insert data
      const insertData = milestones.map((m) => ({
        project_id: projectId,
        organization_id: organizationId,
        stage_id: m.stageId,
        planned_start_date: m.plannedStart.toISOString().split('T')[0],
        planned_end_date: m.plannedEnd.toISOString().split('T')[0],
        estimated_duration_days: m.durationDays,
        status: 'pending' as const,
      }));
      
      // Upsert milestones (update if exists, insert if not)
      const { data, error } = await supabase
        .from('project_stage_milestones')
        .upsert(insertData, { 
          onConflict: 'project_id,stage_id',
          ignoreDuplicates: false 
        })
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones', variables.projectId] });
      toast.success('Timeline milestones generated');
    },
    onError: (error) => {
      console.error('Error generating milestones:', error);
      toast.error('Failed to generate milestones');
    },
  });
}

export function useUpdateMilestone() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<ProjectStageMilestone> & { id: string }) => {
      const { data, error } = await supabase
        .from('project_stage_milestones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones', data.project_id] });
      toast.success('Milestone updated');
    },
    onError: (error) => {
      console.error('Error updating milestone:', error);
      toast.error('Failed to update milestone');
    },
  });
}

export function useBulkUpdateMilestones() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      projectId,
      updates,
    }: {
      projectId: string;
      updates: Array<Partial<ProjectStageMilestone> & { id: string }>;
    }) => {
      const results = await Promise.all(
        updates.map(({ id, ...data }) =>
          supabase
            .from('project_stage_milestones')
            .update(data)
            .eq('id', id)
            .select()
            .single()
        )
      );
      
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} milestones`);
      }
      
      return results.map(r => r.data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones', variables.projectId] });
      toast.success('Milestones updated');
    },
    onError: (error) => {
      console.error('Error updating milestones:', error);
      toast.error('Failed to update milestones');
    },
  });
}

export function useDeleteProjectMilestones() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('project_stage_milestones')
        .delete()
        .eq('project_id', projectId);
      
      if (error) throw error;
    },
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones', projectId] });
      toast.success('Milestones deleted');
    },
    onError: (error) => {
      console.error('Error deleting milestones:', error);
      toast.error('Failed to delete milestones');
    },
  });
}
