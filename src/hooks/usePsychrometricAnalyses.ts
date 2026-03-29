import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization, useProfile } from './useOrganization';
import { toast } from 'sonner';

export interface AirState {
  id: string;
  name: string;
  dryBulb: number;
  wetBulb?: number;
  relativeHumidity?: number;
  dewPoint?: number;
  humidityRatio?: number;
  enthalpy?: number;
  specificVolume?: number;
  color?: string;
}

export interface Process {
  fromStateId: string;
  toStateId: string;
  processType: string;
  sensibleHeat?: number;
  latentHeat?: number;
  totalHeat?: number;
  shr?: number;
  adp?: number;
  bypassFactor?: number;
}

export interface PsychrometricAnalysis {
  id: string;
  organization_id: string;
  project_id: string | null;
  zone_id: string | null;
  name: string;
  description: string | null;
  altitude_ft: number;
  atmospheric_pressure_psia: number;
  air_states: AirState[];
  processes: Process[];
  hvac_preset: string | null;
  airflow_cfm: number | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePsychrometricAnalysisInput {
  project_id?: string;
  zone_id?: string;
  name: string;
  description?: string;
  altitude_ft?: number;
  atmospheric_pressure_psia?: number;
  air_states: AirState[];
  processes?: Process[];
  hvac_preset?: string;
  airflow_cfm?: number;
  status?: string;
}

export interface UpdatePsychrometricAnalysisInput extends Partial<CreatePsychrometricAnalysisInput> {
  id: string;
}

export function usePsychrometricAnalyses(projectId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['psychrometric-analyses', organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('psychrometric_analyses')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(d => ({
        ...d,
        air_states: (d.air_states as unknown as AirState[]) || [],
        processes: (d.processes as unknown as Process[]) || [],
      })) as PsychrometricAnalysis[];
    },
    enabled: !!organization?.id,
  });
}

export function usePsychrometricAnalysis(id?: string) {
  return useQuery({
    queryKey: ['psychrometric-analysis', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('psychrometric_analyses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      return {
        ...data,
        air_states: (data.air_states as unknown as AirState[]) || [],
        processes: (data.processes as unknown as Process[]) || [],
      } as PsychrometricAnalysis;
    },
    enabled: !!id,
  });
}

export function useCreatePsychrometricAnalysis() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (input: CreatePsychrometricAnalysisInput) => {
      if (!organization?.id) throw new Error('No organization found');

      const insertData = {
        organization_id: organization.id,
        created_by: profile?.id,
        project_id: input.project_id,
        zone_id: input.zone_id,
        name: input.name,
        description: input.description,
        altitude_ft: input.altitude_ft ?? 0,
        atmospheric_pressure_psia: input.atmospheric_pressure_psia ?? 14.696,
        air_states: input.air_states,
        processes: input.processes ?? [],
        hvac_preset: input.hvac_preset,
        airflow_cfm: input.airflow_cfm,
        status: input.status ?? 'draft',
      };

      const { data, error } = await supabase
        .from('psychrometric_analyses')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psychrometric-analyses'] });
      queryClient.invalidateQueries({ queryKey: ['design-completeness'] });
      toast.success('Psychrometric analysis saved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save analysis: ${error.message}`);
    },
  });
}

export function useUpdatePsychrometricAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdatePsychrometricAnalysisInput) => {
      const { data, error } = await supabase
        .from('psychrometric_analyses')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psychrometric-analyses'] });
      queryClient.invalidateQueries({ queryKey: ['psychrometric-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['design-completeness'] });
      toast.success('Analysis updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update analysis: ${error.message}`);
    },
  });
}

export function useDeletePsychrometricAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('psychrometric_analyses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psychrometric-analyses'] });
      queryClient.invalidateQueries({ queryKey: ['design-completeness'] });
      toast.success('Analysis deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete analysis: ${error.message}`);
    },
  });
}
