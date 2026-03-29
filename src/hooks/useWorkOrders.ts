import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization, useProfile } from './useOrganization';

export interface WorkOrder {
  id: string;
  organization_id: string;
  equipment_id: string | null;
  pm_schedule_id: string | null;
  zone_id: string | null;
  title: string;
  description: string | null;
  equipment_tag: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  assigned_profile?: {
    full_name: string | null;
  } | null;
  pm_schedule?: {
    name: string;
  } | null;
  zone?: {
    name: string;
    floor?: {
      name: string;
      building?: {
        name: string;
      };
    };
  } | null;
}

export interface CreateWorkOrderInput {
  title: string;
  description?: string;
  equipment_id?: string;
  equipment_tag?: string;
  zone_id?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  assigned_to?: string;
}

export interface UpdateWorkOrderInput {
  id: string;
  title?: string;
  description?: string;
  equipment_id?: string;
  equipment_tag?: string;
  zone_id?: string | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'open' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
}

export function useWorkOrders() {
  const { data: profile } = useProfile();
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['work-orders', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          assigned_profile:profiles!work_orders_assigned_to_fkey(full_name),
          pm_schedule:pm_schedules!work_orders_pm_schedule_id_fkey(name),
          zone:zones(
            name,
            floor:floors(
              name,
              building:buildings(name)
            )
          )
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WorkOrder[];
    },
    enabled: !!organization?.id,
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreateWorkOrderInput) => {
      if (!organization?.id) throw new Error('No organization found');

      const { data, error } = await supabase
        .from('work_orders')
        .insert({
          organization_id: organization.id,
          created_by: profile?.id,
          title: input.title,
          description: input.description,
          equipment_id: input.equipment_id,
          equipment_tag: input.equipment_tag,
          zone_id: input.zone_id,
          priority: input.priority || 'medium',
          due_date: input.due_date,
          assigned_to: input.assigned_to,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
}

export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateWorkOrderInput) => {
      const { id, ...updates } = input;

      // If marking as completed, set completed_at
      if (updates.status === 'completed' && !updates.completed_at) {
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('work_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
}

export function useDeleteWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('work_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
}
