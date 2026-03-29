import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface SmokeControlCalculation {
  id: string;
  organization_id: string;
  project_id: string | null;
  building_id: string | null;
  calculation_name: string;
  calculation_type: string;
  reference_standard: string | null;
  space_height_ft: number | null;
  space_area_sqft: number | null;
  number_of_doors: number | null;
  door_width_ft: number | null;
  door_height_ft: number | null;
  simultaneous_doors_open: number | null;
  target_pressure_in_wc: number | null;
  fire_size_btu_s: number | null;
  smoke_layer_height_ft: number | null;
  perimeter_ft: number | null;
  ambient_temp_f: number | null;
  makeup_air_temp_f: number | null;
  pressurization_result: Json | null;
  exhaust_result: Json | null;
  status: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSmokeControlInput {
  project_id?: string | null;
  building_id?: string | null;
  calculation_name: string;
  calculation_type: 'stairwell' | 'atrium' | 'elevator';
  reference_standard?: string;
  space_height_ft?: number;
  space_area_sqft?: number;
  number_of_doors?: number;
  door_width_ft?: number;
  door_height_ft?: number;
  simultaneous_doors_open?: number;
  target_pressure_in_wc?: number;
  fire_size_btu_s?: number;
  smoke_layer_height_ft?: number;
  perimeter_ft?: number;
  ambient_temp_f?: number;
  makeup_air_temp_f?: number;
  pressurization_result?: Json;
  exhaust_result?: Json;
  notes?: string;
}

export function useSmokeControlCalculations(projectId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['smoke-control-calculations', organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('smoke_control_calculations')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SmokeControlCalculation[];
    },
    enabled: !!organization?.id,
  });
}

export function useSmokeControlCalculation(id: string) {
  return useQuery({
    queryKey: ['smoke-control-calculation', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('smoke_control_calculations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as SmokeControlCalculation;
    },
    enabled: !!id,
  });
}

export function useCreateSmokeControlCalculation() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreateSmokeControlInput) => {
      if (!organization?.id) throw new Error('No organization');

      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('smoke_control_calculations')
        .insert({
          ...input,
          organization_id: organization.id,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SmokeControlCalculation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smoke-control-calculations'] });
      toast.success('Smoke control calculation saved');
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });
}

export function useUpdateSmokeControlCalculation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SmokeControlCalculation> & { id: string }) => {
      const { data, error } = await supabase
        .from('smoke_control_calculations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as SmokeControlCalculation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['smoke-control-calculations'] });
      queryClient.invalidateQueries({ queryKey: ['smoke-control-calculation', data.id] });
      toast.success('Smoke control calculation updated');
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
}

export function useDeleteSmokeControlCalculation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('smoke_control_calculations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smoke-control-calculations'] });
      toast.success('Smoke control calculation deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });
}
