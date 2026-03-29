import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface DuctSystem {
  id: string;
  organization_id: string;
  project_id: string | null;
  load_calculation_id: string | null;
  system_name: string;
  system_type: string;
  design_method: string;
  total_airflow_cfm: number | null;
  system_static_pressure_pa: number | null;
  design_velocity_fpm: number | null;
  target_friction_rate: number | null;
  fan_type: string | null;
  fan_power_kw: number | null;
  duct_material: string;
  insulation_type: string | null;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DuctSegment {
  id: string;
  duct_system_id: string;
  segment_name: string;
  cfm: number;
  length_ft: number | null;
  fittings_equivalent_length_ft: number;
  duct_shape: string;
  diameter_in: number | null;
  width_in: number | null;
  height_in: number | null;
  velocity_fpm: number | null;
  friction_loss_per_100ft: number | null;
  total_pressure_drop: number | null;
  sort_order: number;
  zone_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DuctFitting {
  id: string;
  duct_segment_id: string;
  fitting_type: string;
  fitting_description: string | null;
  loss_coefficient: number | null;
  equivalent_length_ft: number | null;
  quantity: number;
  created_at: string;
}

export interface DiffuserGrille {
  id: string;
  duct_system_id: string;
  terminal_type: string;
  style: string | null;
  model: string | null;
  airflow_cfm: number | null;
  face_velocity_fpm: number | null;
  neck_size: string | null;
  pressure_drop_pa: number | null;
  throw_distance_ft: number | null;
  noise_nc: number | null;
  location_description: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export function useDuctSystems(projectId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['duct-systems', organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('duct_systems')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DuctSystem[];
    },
    enabled: !!organization?.id,
  });
}

export function useDuctSystem(systemId?: string) {
  return useQuery({
    queryKey: ['duct-system', systemId],
    queryFn: async () => {
      if (!systemId) return null;

      const { data, error } = await supabase
        .from('duct_systems')
        .select('*')
        .eq('id', systemId)
        .single();

      if (error) throw error;
      return data as DuctSystem;
    },
    enabled: !!systemId,
  });
}

export function useDuctSegments(systemId?: string) {
  return useQuery({
    queryKey: ['duct-segments', systemId],
    queryFn: async () => {
      if (!systemId) return [];

      const { data, error } = await supabase
        .from('duct_segments')
        .select('*')
        .eq('duct_system_id', systemId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as DuctSegment[];
    },
    enabled: !!systemId,
  });
}

export function useCreateDuctSystem() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async (system: {
      system_name: string;
      system_type?: string;
      design_method?: string;
      total_airflow_cfm?: number;
      system_static_pressure_pa?: number;
      design_velocity_fpm?: number;
      target_friction_rate?: number;
      duct_material?: string;
      project_id?: string;
      load_calculation_id?: string;
      notes?: string;
    }) => {
      if (!organization?.id) throw new Error('No organization');

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id || '')
        .maybeSingle();

      const { data, error } = await supabase
        .from('duct_systems')
        .insert({
          ...system,
          organization_id: organization.id,
          created_by: profile?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as DuctSystem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duct-systems'] });
      toast.success('Duct system saved');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateDuctSystem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DuctSystem> & { id: string }) => {
      const { data, error } = await supabase
        .from('duct_systems')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duct-systems'] });
      queryClient.invalidateQueries({ queryKey: ['duct-system'] });
      toast.success('Duct system updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteDuctSystem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('duct_systems')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duct-systems'] });
      toast.success('Duct system deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useCreateDuctSegments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ systemId, segments }: {
      systemId: string;
      segments: Array<{
        segment_name: string;
        cfm: number;
        length_ft?: number;
        fittings_equivalent_length_ft?: number;
        duct_shape?: string;
        diameter_in?: number;
        width_in?: number;
        height_in?: number;
        velocity_fpm?: number;
        friction_loss_per_100ft?: number;
        total_pressure_drop?: number;
        sort_order?: number;
      }>;
    }) => {
      // Delete existing segments first
      await supabase
        .from('duct_segments')
        .delete()
        .eq('duct_system_id', systemId);

      // Insert new segments
      const { data, error } = await supabase
        .from('duct_segments')
        .insert(
          segments.map((seg, i) => ({
            ...seg,
            duct_system_id: systemId,
            sort_order: seg.sort_order ?? i,
          }))
        )
        .select();

      if (error) throw error;
      return data as DuctSegment[];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['duct-segments', variables.systemId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useSaveDuctDesign() {
  const createSystem = useCreateDuctSystem();
  const createSegments = useCreateDuctSegments();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      systemData,
      segments,
    }: {
      systemData: Parameters<typeof createSystem.mutateAsync>[0];
      segments: Parameters<typeof createSegments.mutateAsync>[0]['segments'];
    }) => {
      const system = await createSystem.mutateAsync(systemData);
      if (segments.length > 0) {
        await createSegments.mutateAsync({ systemId: system.id, segments });
      }
      return system;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duct-systems'] });
    },
  });
}
