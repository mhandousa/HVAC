import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useOrganization';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface PressureComponent {
  id: string;
  componentId: string;
  type: 'fitting' | 'equipment';
  name: string;
  kFactor?: number;
  lOverD?: number;
  fixedDrop?: number;
  quantity: number;
  pressureDrop: number;
}

export interface PressureDropCalculation {
  id: string;
  organization_id: string;
  project_id: string | null;
  zone_id: string | null;
  name: string;
  description: string | null;
  calculation_type: 'air' | 'water';
  status: 'draft' | 'final';
  flow_rate: number;
  size_inches: number;
  velocity: number | null;
  velocity_pressure: number | null;
  components: PressureComponent[];
  total_pressure_drop: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePressureDropInput {
  project_id?: string;
  zone_id?: string;
  name: string;
  description?: string;
  calculation_type: 'air' | 'water';
  status?: 'draft' | 'final';
  flow_rate: number;
  size_inches: number;
  velocity?: number;
  velocity_pressure?: number;
  components: PressureComponent[];
  total_pressure_drop: number;
  unit: string;
}

export function usePressureDropCalculations(projectId?: string) {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['pressure_drop_calculations', profile?.organization_id, projectId],
    queryFn: async () => {
      if (!profile?.organization_id) return [];

      let query = supabase
        .from('pressure_drop_calculations')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(row => ({
        ...row,
        calculation_type: row.calculation_type as 'air' | 'water',
        status: row.status as 'draft' | 'final',
        components: (row.components as unknown as PressureComponent[]) || [],
      })) as PressureDropCalculation[];
    },
    enabled: !!profile?.organization_id,
  });
}

export function useCreatePressureDropCalculation() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (input: CreatePressureDropInput) => {
      if (!profile?.organization_id) throw new Error('No organization');

      const { data, error } = await supabase
        .from('pressure_drop_calculations')
        .insert({
          organization_id: profile.organization_id,
          project_id: input.project_id || null,
          zone_id: input.zone_id || null,
          name: input.name,
          description: input.description || null,
          calculation_type: input.calculation_type,
          status: input.status || 'draft',
          flow_rate: input.flow_rate,
          size_inches: input.size_inches,
          velocity: input.velocity || null,
          velocity_pressure: input.velocity_pressure || null,
          components: input.components as unknown as Json,
          total_pressure_drop: input.total_pressure_drop,
          unit: input.unit,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pressure_drop_calculations'] });
      toast.success('Calculation saved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });
}

export function useUpdatePressureDropCalculation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreatePressureDropInput> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.project_id !== undefined) updateData.project_id = input.project_id;
      if (input.zone_id !== undefined) updateData.zone_id = input.zone_id;
      if (input.calculation_type !== undefined) updateData.calculation_type = input.calculation_type;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.flow_rate !== undefined) updateData.flow_rate = input.flow_rate;
      if (input.size_inches !== undefined) updateData.size_inches = input.size_inches;
      if (input.velocity !== undefined) updateData.velocity = input.velocity;
      if (input.velocity_pressure !== undefined) updateData.velocity_pressure = input.velocity_pressure;
      if (input.components !== undefined) updateData.components = input.components as unknown as Json;
      if (input.total_pressure_drop !== undefined) updateData.total_pressure_drop = input.total_pressure_drop;
      if (input.unit !== undefined) updateData.unit = input.unit;

      const { data, error } = await supabase
        .from('pressure_drop_calculations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pressure_drop_calculations'] });
      toast.success('Calculation updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
}

export function useDeletePressureDropCalculation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pressure_drop_calculations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pressure_drop_calculations'] });
      toast.success('Calculation deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });
}
