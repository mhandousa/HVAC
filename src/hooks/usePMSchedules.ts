import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization, useProfile } from './useOrganization';

export interface GenerateWorkOrdersResult {
  created: number;
  skipped: number;
  pmSchedules: string[];
}

export interface PMSchedule {
  id: string;
  organization_id: string;
  equipment_id: string | null;
  name: string;
  description: string | null;
  frequency_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  frequency_value: number;
  last_completed_at: string | null;
  next_due_at: string | null;
  assigned_to: string | null;
  estimated_hours: number | null;
  priority: 'low' | 'medium' | 'high';
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  equipment?: {
    name: string;
    tag: string;
  } | null;
  assigned_profile?: {
    full_name: string | null;
  } | null;
}

export interface CreatePMScheduleInput {
  name: string;
  description?: string;
  equipment_id?: string;
  frequency_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  frequency_value?: number;
  next_due_at?: string;
  assigned_to?: string;
  estimated_hours?: number;
  priority?: 'low' | 'medium' | 'high';
}

export interface UpdatePMScheduleInput {
  id: string;
  name?: string;
  description?: string;
  equipment_id?: string;
  frequency_type?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  frequency_value?: number;
  last_completed_at?: string;
  next_due_at?: string;
  assigned_to?: string | null;
  estimated_hours?: number | null;
  priority?: 'low' | 'medium' | 'high';
  is_active?: boolean;
}

export function usePMSchedules() {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['pm-schedules', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('pm_schedules')
        .select(`
          *,
          equipment(name, tag),
          assigned_profile:profiles!pm_schedules_assigned_to_fkey(full_name)
        `)
        .eq('organization_id', organization.id)
        .order('next_due_at', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as PMSchedule[];
    },
    enabled: !!organization?.id,
  });
}

export function useCreatePMSchedule() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreatePMScheduleInput) => {
      if (!organization?.id) throw new Error('No organization found');

      const { data, error } = await supabase
        .from('pm_schedules')
        .insert({
          organization_id: organization.id,
          created_by: profile?.id,
          name: input.name,
          description: input.description,
          equipment_id: input.equipment_id,
          frequency_type: input.frequency_type,
          frequency_value: input.frequency_value || 1,
          next_due_at: input.next_due_at,
          assigned_to: input.assigned_to,
          estimated_hours: input.estimated_hours,
          priority: input.priority || 'medium',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-schedules'] });
    },
  });
}

export function useUpdatePMSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePMScheduleInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from('pm_schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-schedules'] });
    },
  });
}

export function useCompletePM() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, frequency_type, frequency_value }: { id: string; frequency_type: string; frequency_value: number }) => {
      const now = new Date();
      let nextDue: Date;

      switch (frequency_type) {
        case 'daily':
          nextDue = new Date(now.getTime() + frequency_value * 24 * 60 * 60 * 1000);
          break;
        case 'weekly':
          nextDue = new Date(now.getTime() + frequency_value * 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          nextDue = new Date(now);
          nextDue.setMonth(nextDue.getMonth() + frequency_value);
          break;
        case 'quarterly':
          nextDue = new Date(now);
          nextDue.setMonth(nextDue.getMonth() + frequency_value * 3);
          break;
        case 'yearly':
          nextDue = new Date(now);
          nextDue.setFullYear(nextDue.getFullYear() + frequency_value);
          break;
        default:
          nextDue = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      const { data, error } = await supabase
        .from('pm_schedules')
        .update({
          last_completed_at: now.toISOString(),
          next_due_at: nextDue.toISOString().split('T')[0],
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-schedules'] });
    },
  });
}

export function useDeletePMSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pm_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-schedules'] });
    },
  });
}

export function useGenerateWorkOrders() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async (): Promise<GenerateWorkOrdersResult> => {
      if (!organization?.id) throw new Error('No organization found');

      const today = new Date().toISOString().split('T')[0];

      // Get all overdue PM schedules
      const { data: overdueSchedules, error: fetchError } = await supabase
        .from('pm_schedules')
        .select('*, equipment(name, tag)')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .lte('next_due_at', today);

      if (fetchError) throw fetchError;
      if (!overdueSchedules || overdueSchedules.length === 0) {
        return { created: 0, skipped: 0, pmSchedules: [] };
      }

      // Check existing work orders to avoid duplicates
      const pmIds = overdueSchedules.map(pm => pm.id);
      const { data: existingWOs, error: woError } = await supabase
        .from('work_orders')
        .select('pm_schedule_id')
        .in('pm_schedule_id', pmIds)
        .in('status', ['open', 'in_progress']);

      if (woError) throw woError;

      const existingPmIds = new Set((existingWOs || []).map(wo => wo.pm_schedule_id));
      const schedulesToProcess = overdueSchedules.filter(pm => !existingPmIds.has(pm.id));

      if (schedulesToProcess.length === 0) {
        return { created: 0, skipped: overdueSchedules.length, pmSchedules: [] };
      }

      // Create work orders for each overdue PM
      const workOrders = schedulesToProcess.map(pm => ({
        organization_id: organization.id,
        created_by: profile?.id,
        pm_schedule_id: pm.id,
        title: `PM: ${pm.name}`,
        description: pm.description || `Preventive maintenance task from schedule: ${pm.name}`,
        equipment_id: pm.equipment_id,
        equipment_tag: pm.equipment?.tag,
        priority: pm.priority === 'high' ? 'high' : pm.priority === 'low' ? 'low' : 'medium',
        due_date: pm.next_due_at,
        assigned_to: pm.assigned_to,
      }));

      const { error: insertError } = await supabase
        .from('work_orders')
        .insert(workOrders);

      if (insertError) throw insertError;

      return {
        created: schedulesToProcess.length,
        skipped: existingPmIds.size,
        pmSchedules: schedulesToProcess.map(pm => pm.name),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['pm-schedules'] });
    },
  });
}
