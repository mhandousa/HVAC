import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface ASHRAE90_1ComplianceCheck {
  id: string;
  project_id: string;
  organization_id: string;
  name: string;
  climate_zone: string;
  city_id: string | null;
  overall_compliance_percent: number;
  equipment_checks_passed: number;
  equipment_checks_total: number;
  economizer_checks_passed: number;
  economizer_checks_total: number;
  fan_power_checks_passed: number;
  fan_power_checks_total: number;
  pump_power_checks_passed: number;
  pump_power_checks_total: number;
  mandatory_checks_passed: number;
  mandatory_checks_total: number;
  detailed_results: Json | null;
  created_at: string;
  updated_at: string;
}

export interface CreateASHRAE90_1ComplianceCheckInput {
  project_id: string;
  name: string;
  climate_zone: string;
  city_id?: string;
  overall_compliance_percent?: number;
  equipment_checks_passed?: number;
  equipment_checks_total?: number;
  economizer_checks_passed?: number;
  economizer_checks_total?: number;
  fan_power_checks_passed?: number;
  fan_power_checks_total?: number;
  pump_power_checks_passed?: number;
  pump_power_checks_total?: number;
  mandatory_checks_passed?: number;
  mandatory_checks_total?: number;
  detailed_results?: Json;
}

export function useASHRAE90_1ComplianceChecks(projectId?: string) {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();

  const checksQuery = useQuery({
    queryKey: ['ashrae-90-1-compliance-checks', projectId, organization?.id],
    queryFn: async (): Promise<ASHRAE90_1ComplianceCheck[]> => {
      if (!organization?.id) return [];

      let query = supabase
        .from('ashrae_90_1_compliance_checks')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching ASHRAE 90.1 compliance checks:', error);
        throw error;
      }

      return (data || []) as ASHRAE90_1ComplianceCheck[];
    },
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateASHRAE90_1ComplianceCheckInput) => {
      if (!organization?.id) throw new Error('No organization found');

      const { data, error } = await supabase
        .from('ashrae_90_1_compliance_checks')
        .insert({
          project_id: input.project_id,
          organization_id: organization.id,
          name: input.name,
          climate_zone: input.climate_zone,
          city_id: input.city_id,
          overall_compliance_percent: input.overall_compliance_percent,
          equipment_checks_passed: input.equipment_checks_passed,
          equipment_checks_total: input.equipment_checks_total,
          economizer_checks_passed: input.economizer_checks_passed,
          economizer_checks_total: input.economizer_checks_total,
          fan_power_checks_passed: input.fan_power_checks_passed,
          fan_power_checks_total: input.fan_power_checks_total,
          pump_power_checks_passed: input.pump_power_checks_passed,
          pump_power_checks_total: input.pump_power_checks_total,
          mandatory_checks_passed: input.mandatory_checks_passed,
          mandatory_checks_total: input.mandatory_checks_total,
          detailed_results: input.detailed_results,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ASHRAE90_1ComplianceCheck;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ashrae-90-1-compliance-checks'] });
      queryClient.invalidateQueries({ queryKey: ['design-health-scores'] });
      queryClient.invalidateQueries({ queryKey: ['design-completeness'] });
      toast.success('ASHRAE 90.1 compliance check saved');
    },
    onError: (error) => {
      console.error('Error creating ASHRAE 90.1 compliance check:', error);
      toast.error('Failed to save compliance check');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ASHRAE90_1ComplianceCheck> & { id: string }) => {
      const { project_id: _, organization_id: __, ...safeUpdates } = updates as any;
      
      const { data, error } = await supabase
        .from('ashrae_90_1_compliance_checks')
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ASHRAE90_1ComplianceCheck;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ashrae-90-1-compliance-checks'] });
      queryClient.invalidateQueries({ queryKey: ['design-health-scores'] });
      queryClient.invalidateQueries({ queryKey: ['design-completeness'] });
      toast.success('Compliance check updated');
    },
    onError: (error) => {
      console.error('Error updating ASHRAE 90.1 compliance check:', error);
      toast.error('Failed to update compliance check');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ashrae_90_1_compliance_checks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ashrae-90-1-compliance-checks'] });
      queryClient.invalidateQueries({ queryKey: ['design-health-scores'] });
      queryClient.invalidateQueries({ queryKey: ['design-completeness'] });
      toast.success('Compliance check deleted');
    },
    onError: (error) => {
      console.error('Error deleting ASHRAE 90.1 compliance check:', error);
      toast.error('Failed to delete compliance check');
    },
  });

  return {
    checks: checksQuery.data || [],
    isLoading: checksQuery.isLoading,
    error: checksQuery.error,
    createCheck: createMutation.mutate,
    updateCheck: updateMutation.mutate,
    deleteCheck: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
