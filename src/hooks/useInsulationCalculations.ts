import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useOrganization';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface InsulationCalculation {
  id: string;
  organization_id: string;
  project_id: string | null;
  zone_id: string | null;
  name: string;
  description: string | null;
  calculation_type: 'pipe' | 'duct';
  status: 'draft' | 'final';
  location_id: string | null;
  ambient_temp_c: number;
  relative_humidity: number;
  dew_point_c: number | null;
  // Pipe-specific
  service_type: string | null;
  fluid_temp_c: number | null;
  pipe_size_inches: number | null;
  pipe_length_m: number | null;
  // Duct-specific
  air_temp_c: number | null;
  duct_width_mm: number | null;
  duct_height_mm: number | null;
  air_velocity_mps: number | null;
  // Insulation
  insulation_material: string | null;
  insulation_thickness_mm: number | null;
  results: Record<string, unknown>;
  meets_condensation_requirement: boolean | null;
  meets_sbc_code: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInsulationInput {
  project_id?: string;
  zone_id?: string;
  name: string;
  description?: string;
  calculation_type: 'pipe' | 'duct';
  status?: 'draft' | 'final';
  location_id?: string;
  ambient_temp_c: number;
  relative_humidity: number;
  dew_point_c?: number;
  // Pipe-specific
  service_type?: string;
  fluid_temp_c?: number;
  pipe_size_inches?: number;
  pipe_length_m?: number;
  // Duct-specific
  air_temp_c?: number;
  duct_width_mm?: number;
  duct_height_mm?: number;
  air_velocity_mps?: number;
  // Insulation
  insulation_material?: string;
  insulation_thickness_mm?: number;
  results?: Record<string, unknown>;
  meets_condensation_requirement?: boolean;
  meets_sbc_code?: boolean;
}

export function useInsulationCalculations(projectId?: string) {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['insulation_calculations', profile?.organization_id, projectId],
    queryFn: async () => {
      if (!profile?.organization_id) return [];

      let query = supabase
        .from('insulation_calculations')
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
        calculation_type: row.calculation_type as 'pipe' | 'duct',
        status: row.status as 'draft' | 'final',
        results: (row.results as Record<string, unknown>) || {},
      })) as InsulationCalculation[];
    },
    enabled: !!profile?.organization_id,
  });
}

export function useCreateInsulationCalculation() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (input: CreateInsulationInput) => {
      if (!profile?.organization_id) throw new Error('No organization');

      const { data, error } = await supabase
        .from('insulation_calculations')
        .insert({
          organization_id: profile.organization_id,
          project_id: input.project_id || null,
          zone_id: input.zone_id || null,
          name: input.name,
          description: input.description || null,
          calculation_type: input.calculation_type,
          status: input.status || 'draft',
          location_id: input.location_id || null,
          ambient_temp_c: input.ambient_temp_c,
          relative_humidity: input.relative_humidity,
          dew_point_c: input.dew_point_c || null,
          service_type: input.service_type || null,
          fluid_temp_c: input.fluid_temp_c || null,
          pipe_size_inches: input.pipe_size_inches || null,
          pipe_length_m: input.pipe_length_m || null,
          air_temp_c: input.air_temp_c || null,
          duct_width_mm: input.duct_width_mm || null,
          duct_height_mm: input.duct_height_mm || null,
          air_velocity_mps: input.air_velocity_mps || null,
          insulation_material: input.insulation_material || null,
          insulation_thickness_mm: input.insulation_thickness_mm || null,
          results: (input.results || {}) as unknown as Json,
          meets_condensation_requirement: input.meets_condensation_requirement ?? null,
          meets_sbc_code: input.meets_sbc_code ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insulation_calculations'] });
      toast.success('Calculation saved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });
}

export function useUpdateInsulationCalculation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateInsulationInput> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.project_id !== undefined) updateData.project_id = input.project_id;
      if (input.zone_id !== undefined) updateData.zone_id = input.zone_id;
      if (input.calculation_type !== undefined) updateData.calculation_type = input.calculation_type;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.location_id !== undefined) updateData.location_id = input.location_id;
      if (input.ambient_temp_c !== undefined) updateData.ambient_temp_c = input.ambient_temp_c;
      if (input.relative_humidity !== undefined) updateData.relative_humidity = input.relative_humidity;
      if (input.dew_point_c !== undefined) updateData.dew_point_c = input.dew_point_c;
      if (input.service_type !== undefined) updateData.service_type = input.service_type;
      if (input.fluid_temp_c !== undefined) updateData.fluid_temp_c = input.fluid_temp_c;
      if (input.pipe_size_inches !== undefined) updateData.pipe_size_inches = input.pipe_size_inches;
      if (input.pipe_length_m !== undefined) updateData.pipe_length_m = input.pipe_length_m;
      if (input.air_temp_c !== undefined) updateData.air_temp_c = input.air_temp_c;
      if (input.duct_width_mm !== undefined) updateData.duct_width_mm = input.duct_width_mm;
      if (input.duct_height_mm !== undefined) updateData.duct_height_mm = input.duct_height_mm;
      if (input.air_velocity_mps !== undefined) updateData.air_velocity_mps = input.air_velocity_mps;
      if (input.insulation_material !== undefined) updateData.insulation_material = input.insulation_material;
      if (input.insulation_thickness_mm !== undefined) updateData.insulation_thickness_mm = input.insulation_thickness_mm;
      if (input.results !== undefined) updateData.results = input.results as unknown as Json;
      if (input.meets_condensation_requirement !== undefined) updateData.meets_condensation_requirement = input.meets_condensation_requirement;
      if (input.meets_sbc_code !== undefined) updateData.meets_sbc_code = input.meets_sbc_code;

      const { data, error } = await supabase
        .from('insulation_calculations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insulation_calculations'] });
      toast.success('Calculation updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
}

export function useDeleteInsulationCalculation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('insulation_calculations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insulation_calculations'] });
      toast.success('Calculation deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });
}
