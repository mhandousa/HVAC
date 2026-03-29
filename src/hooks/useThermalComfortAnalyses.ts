import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface ThermalComfortAnalysis {
  id: string;
  organization_id: string;
  project_id: string | null;
  zone_id: string | null;
  analysis_name: string;
  analysis_type: string;
  air_temp_c: number | null;
  mean_radiant_temp_c: number | null;
  relative_humidity_percent: number | null;
  air_velocity_m_s: number | null;
  metabolic_rate_met: number | null;
  clothing_insulation_clo: number | null;
  mean_outdoor_temp_c: number | null;
  indoor_operative_temp_c: number | null;
  acceptability_class: string | null;
  pmv_result: Json | null;
  adaptive_result: Json | null;
  status: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateThermalComfortInput {
  project_id?: string | null;
  zone_id?: string | null;
  analysis_name: string;
  analysis_type: 'pmv_ppd' | 'adaptive' | 'both';
  air_temp_c?: number;
  mean_radiant_temp_c?: number;
  relative_humidity_percent?: number;
  air_velocity_m_s?: number;
  metabolic_rate_met?: number;
  clothing_insulation_clo?: number;
  mean_outdoor_temp_c?: number;
  indoor_operative_temp_c?: number;
  acceptability_class?: string;
  pmv_result?: Json;
  adaptive_result?: Json;
  notes?: string;
}

export function useThermalComfortAnalyses(projectId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['thermal-comfort-analyses', organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('thermal_comfort_analyses')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ThermalComfortAnalysis[];
    },
    enabled: !!organization?.id,
  });
}

export function useThermalComfortAnalysis(id: string) {
  return useQuery({
    queryKey: ['thermal-comfort-analysis', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('thermal_comfort_analyses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as ThermalComfortAnalysis;
    },
    enabled: !!id,
  });
}

export function useCreateThermalComfortAnalysis() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreateThermalComfortInput) => {
      if (!organization?.id) throw new Error('No organization');

      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('thermal_comfort_analyses')
        .insert({
          ...input,
          organization_id: organization.id,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ThermalComfortAnalysis;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thermal-comfort-analyses'] });
      toast.success('Thermal comfort analysis saved');
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });
}

export function useUpdateThermalComfortAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ThermalComfortAnalysis> & { id: string }) => {
      const { data, error } = await supabase
        .from('thermal_comfort_analyses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ThermalComfortAnalysis;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['thermal-comfort-analyses'] });
      queryClient.invalidateQueries({ queryKey: ['thermal-comfort-analysis', data.id] });
      toast.success('Thermal comfort analysis updated');
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
}

export function useDeleteThermalComfortAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('thermal_comfort_analyses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thermal-comfort-analyses'] });
      toast.success('Thermal comfort analysis deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });
}
