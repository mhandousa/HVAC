import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export type AcousticCalculationType = 'noise_path' | 'room_acoustics' | 'silencer_sizing' | 'vibration';

export interface AcousticCalculation {
  id: string;
  project_id: string;
  zone_id: string | null;
  organization_id: string;
  calculation_type: AcousticCalculationType;
  name: string;
  calculated_nc: number | null;
  target_nc: number | null;
  meets_target: boolean | null;
  input_data: Json;
  results: Json;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface AcousticCalculationWithZone extends AcousticCalculation {
  zone_name: string | null;
}

export interface CreateAcousticCalculationInput {
  project_id: string;
  zone_id?: string | null;
  calculation_type: AcousticCalculationType;
  name: string;
  calculated_nc?: number | null;
  target_nc?: number | null;
  meets_target?: boolean | null;
  input_data?: Json;
  results?: Json;
}

export interface UpdateAcousticCalculationInput {
  id: string;
  name?: string;
  calculated_nc?: number | null;
  target_nc?: number | null;
  meets_target?: boolean | null;
  input_data?: Json;
  results?: Json;
}

export interface AcousticCalculationsSummary {
  total: number;
  meetingTarget: number;
  failingTarget: number;
  byType: Record<AcousticCalculationType, number>;
  averageNC: number | null;
}

// Fetch all acoustic calculations for a project
export function useAcousticCalculations(projectId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['acoustic-calculations', projectId, organization?.id],
    queryFn: async () => {
      if (!projectId || !organization?.id) return [];

      const { data, error } = await supabase
        .from('acoustic_calculations')
        .select(`
          *,
          zones:zone_id (name)
        `)
        .eq('project_id', projectId)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        zone_name: item.zones?.name || null,
      })) as AcousticCalculationWithZone[];
    },
    enabled: !!projectId && !!organization?.id,
  });
}

// Fetch a single acoustic calculation
export function useAcousticCalculation(id?: string) {
  return useQuery({
    queryKey: ['acoustic-calculation', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('acoustic_calculations')
        .select(`
          *,
          zones:zone_id (name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        ...data,
        zone_name: data.zones?.name || null,
      } as AcousticCalculationWithZone;
    },
    enabled: !!id,
  });
}

// Get summary statistics for acoustic calculations
export function useAcousticCalculationsSummary(projectId?: string) {
  const { data: calculations, isLoading } = useAcousticCalculations(projectId);

  const summary: AcousticCalculationsSummary = {
    total: 0,
    meetingTarget: 0,
    failingTarget: 0,
    byType: {
      noise_path: 0,
      room_acoustics: 0,
      silencer_sizing: 0,
      vibration: 0,
    },
    averageNC: null,
  };

  if (calculations && calculations.length > 0) {
    summary.total = calculations.length;
    summary.meetingTarget = calculations.filter(c => c.meets_target === true).length;
    summary.failingTarget = calculations.filter(c => c.meets_target === false).length;

    calculations.forEach(calc => {
      if (calc.calculation_type in summary.byType) {
        summary.byType[calc.calculation_type]++;
      }
    });

    const ncValues = calculations
      .filter(c => c.calculated_nc !== null)
      .map(c => c.calculated_nc as number);
    
    if (ncValues.length > 0) {
      summary.averageNC = Math.round(ncValues.reduce((a, b) => a + b, 0) / ncValues.length);
    }
  }

  return { summary, isLoading };
}

// Create acoustic calculation mutation
export function useCreateAcousticCalculation() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreateAcousticCalculationInput) => {
      if (!organization?.id) {
        throw new Error('Organization not found');
      }

      const { data, error } = await supabase
        .from('acoustic_calculations')
        .insert({
          project_id: input.project_id,
          zone_id: input.zone_id ?? null,
          organization_id: organization.id,
          calculation_type: input.calculation_type,
          name: input.name,
          calculated_nc: input.calculated_nc ?? null,
          target_nc: input.target_nc ?? null,
          meets_target: input.meets_target ?? null,
          input_data: input.input_data ?? {},
          results: input.results ?? {},
        })
        .select()
        .single();

      if (error) throw error;
      return data as AcousticCalculation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['acoustic-calculations', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['design-completeness', data.project_id] });
      toast.success('Acoustic calculation saved');
    },
    onError: (error) => {
      console.error('Failed to create acoustic calculation:', error);
      toast.error('Failed to save acoustic calculation');
    },
  });
}

// Update acoustic calculation mutation
export function useUpdateAcousticCalculation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateAcousticCalculationInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from('acoustic_calculations')
        .update({
          name: updates.name,
          calculated_nc: updates.calculated_nc,
          target_nc: updates.target_nc,
          meets_target: updates.meets_target,
          input_data: updates.input_data,
          results: updates.results,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AcousticCalculation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['acoustic-calculation', data.id] });
      queryClient.invalidateQueries({ queryKey: ['acoustic-calculations', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['design-completeness', data.project_id] });
      toast.success('Acoustic calculation updated');
    },
    onError: (error) => {
      console.error('Failed to update acoustic calculation:', error);
      toast.error('Failed to update acoustic calculation');
    },
  });
}

// Delete acoustic calculation mutation
export function useDeleteAcousticCalculation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('acoustic_calculations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['acoustic-calculations', projectId] });
      queryClient.invalidateQueries({ queryKey: ['design-completeness', projectId] });
      toast.success('Acoustic calculation deleted');
    },
    onError: (error) => {
      console.error('Failed to delete acoustic calculation:', error);
      toast.error('Failed to delete acoustic calculation');
    },
  });
}
