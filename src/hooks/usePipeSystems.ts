import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization, useProfile } from './useOrganization';
import { toast } from 'sonner';

export interface PipeSystem {
  id: string;
  organization_id: string;
  project_id: string | null;
  load_calculation_id: string | null;
  system_name: string;
  system_type: string;
  design_method: string;
  max_velocity_fps: number;
  max_friction_ft_per_100ft: number;
  fluid_type: string;
  fluid_temp_f: number | null;
  total_flow_gpm: number | null;
  system_head_ft: number | null;
  pump_power_hp: number | null;
  pipe_material: string;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PipeSegment {
  id: string;
  pipe_system_id: string;
  segment_name: string;
  flow_gpm: number;
  nominal_size_in: number | null;
  inside_diameter_in: number | null;
  length_ft: number | null;
  fittings_equivalent_length_ft: number | null;
  velocity_fps: number | null;
  friction_loss_per_100ft: number | null;
  total_pressure_drop_ft: number | null;
  segment_type: string | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
  // Hierarchical and analysis fields
  parent_segment_id: string | null;
  is_critical_path: boolean | null;
  material_type: string | null;
  schedule_class: string | null;
  fluid_type: string | null;
  fluid_temp_f: number | null;
  elevation_change_ft: number | null;
  from_node: string | null;
  to_node: string | null;
  wall_thickness_in: number | null;
  reynolds_number: number | null;
  dynamic_loss_ft: number | null;
  zone_id: string | null;
}

export interface CreatePipeSystemInput {
  project_id?: string;
  load_calculation_id?: string;
  system_name: string;
  system_type?: string;
  design_method?: string;
  max_velocity_fps?: number;
  max_friction_ft_per_100ft?: number;
  fluid_type?: string;
  fluid_temp_f?: number;
  total_flow_gpm?: number;
  system_head_ft?: number;
  pump_power_hp?: number;
  pipe_material?: string;
  status?: string;
  notes?: string;
}

export interface CreatePipeSegmentInput {
  pipe_system_id: string;
  segment_name: string;
  flow_gpm: number;
  nominal_size_in?: number;
  inside_diameter_in?: number;
  length_ft?: number;
  fittings_equivalent_length_ft?: number;
  velocity_fps?: number;
  friction_loss_per_100ft?: number;
  total_pressure_drop_ft?: number;
  segment_type?: string;
  sort_order?: number;
  // Hierarchical and analysis fields
  parent_segment_id?: string | null;
  is_critical_path?: boolean;
  material_type?: string;
  schedule_class?: string;
  fluid_type?: string;
  fluid_temp_f?: number;
  elevation_change_ft?: number;
  from_node?: string;
  to_node?: string;
}

export function usePipeSystems(projectId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['pipe-systems', organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('pipe_systems')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PipeSystem[];
    },
    enabled: !!organization?.id,
  });
}

export function usePipeSystem(systemId?: string) {
  return useQuery({
    queryKey: ['pipe-system', systemId],
    queryFn: async () => {
      if (!systemId) return null;

      const { data, error } = await supabase
        .from('pipe_systems')
        .select('*')
        .eq('id', systemId)
        .single();

      if (error) throw error;
      return data as PipeSystem;
    },
    enabled: !!systemId,
  });
}

export function usePipeSegments(systemId?: string) {
  return useQuery({
    queryKey: ['pipe-segments', systemId],
    queryFn: async () => {
      if (!systemId) return [];

      const { data, error } = await supabase
        .from('pipe_segments')
        .select('*')
        .eq('pipe_system_id', systemId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as PipeSegment[];
    },
    enabled: !!systemId,
  });
}

export function useCreatePipeSystem() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (input: CreatePipeSystemInput) => {
      if (!organization?.id) throw new Error('No organization found');

      const { data, error } = await supabase
        .from('pipe_systems')
        .insert({
          organization_id: organization.id,
          created_by: profile?.id,
          project_id: input.project_id,
          load_calculation_id: input.load_calculation_id,
          system_name: input.system_name,
          system_type: input.system_type ?? 'chilled-water',
          design_method: input.design_method ?? 'velocity',
          max_velocity_fps: input.max_velocity_fps ?? 8,
          max_friction_ft_per_100ft: input.max_friction_ft_per_100ft ?? 4,
          fluid_type: input.fluid_type ?? 'water',
          fluid_temp_f: input.fluid_temp_f,
          total_flow_gpm: input.total_flow_gpm,
          system_head_ft: input.system_head_ft,
          pump_power_hp: input.pump_power_hp,
          pipe_material: input.pipe_material ?? 'steel',
          status: input.status ?? 'draft',
          notes: input.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PipeSystem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipe-systems'] });
    },
  });
}

export function useUpdatePipeSystem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PipeSystem> & { id: string }) => {
      const { data, error } = await supabase
        .from('pipe_systems')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipe-systems'] });
      queryClient.invalidateQueries({ queryKey: ['pipe-system'] });
    },
  });
}

export function useDeletePipeSystem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pipe_systems')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipe-systems'] });
      toast.success('Pipe system deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });
}

export function useCreatePipeSegments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (segments: CreatePipeSegmentInput[]) => {
      if (segments.length === 0) return [];

      const { data, error } = await supabase
        .from('pipe_segments')
        .insert(segments.map((s, i) => ({
          pipe_system_id: s.pipe_system_id,
          segment_name: s.segment_name,
          flow_gpm: s.flow_gpm,
          nominal_size_in: s.nominal_size_in,
          inside_diameter_in: s.inside_diameter_in,
          length_ft: s.length_ft,
          fittings_equivalent_length_ft: s.fittings_equivalent_length_ft ?? 0,
          velocity_fps: s.velocity_fps,
          friction_loss_per_100ft: s.friction_loss_per_100ft,
          total_pressure_drop_ft: s.total_pressure_drop_ft,
          segment_type: s.segment_type ?? 'main',
          sort_order: s.sort_order ?? i,
          // Hierarchical and analysis fields
          parent_segment_id: s.parent_segment_id ?? null,
          is_critical_path: s.is_critical_path ?? false,
          material_type: s.material_type,
          schedule_class: s.schedule_class,
          fluid_type: s.fluid_type,
          fluid_temp_f: s.fluid_temp_f,
          elevation_change_ft: s.elevation_change_ft,
          from_node: s.from_node,
          to_node: s.to_node,
        })))
        .select();

      if (error) throw error;
      return data as PipeSegment[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipe-segments'] });
    },
  });
}

export function useDeletePipeSegments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (systemId: string) => {
      const { error } = await supabase
        .from('pipe_segments')
        .delete()
        .eq('pipe_system_id', systemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipe-segments'] });
    },
  });
}

export function useSavePipeDesign() {
  const createSystem = useCreatePipeSystem();
  const createSegments = useCreatePipeSegments();

  return useMutation({
    mutationFn: async ({
      system,
      segments,
    }: {
      system: CreatePipeSystemInput;
      segments: Omit<CreatePipeSegmentInput, 'pipe_system_id'>[];
    }) => {
      // Create the system first
      const createdSystem = await createSystem.mutateAsync(system);

      // Then create segments with the system ID
      const createdSegments = await createSegments.mutateAsync(
        segments.map(s => ({
          ...s,
          pipe_system_id: createdSystem.id,
        }))
      );

      return { system: createdSystem, segments: createdSegments };
    },
    onSuccess: () => {
      toast.success('Pipe design saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save pipe design: ${error.message}`);
    },
  });
}
