import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface SBCComplianceCheck {
  id: string;
  organization_id: string;
  project_id: string | null;
  check_name: string;
  climate_zone_id: string | null;
  total_requirements: number | null;
  passed_count: number | null;
  failed_count: number | null;
  pending_count: number | null;
  compliance_score_percent: number | null;
  requirement_results: Json | null;
  equipment_data: Json | null;
  status: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSBCComplianceInput {
  project_id?: string | null;
  check_name: string;
  climate_zone_id?: string;
  total_requirements?: number;
  passed_count?: number;
  failed_count?: number;
  pending_count?: number;
  compliance_score_percent?: number;
  requirement_results?: Json;
  equipment_data?: Json;
  notes?: string;
}

export function useSBCComplianceChecks(projectId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['sbc-compliance-checks', organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('sbc_compliance_checks')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SBCComplianceCheck[];
    },
    enabled: !!organization?.id,
  });
}

export function useSBCComplianceCheck(id: string) {
  return useQuery({
    queryKey: ['sbc-compliance-check', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sbc_compliance_checks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as SBCComplianceCheck;
    },
    enabled: !!id,
  });
}

export function useCreateSBCComplianceCheck() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreateSBCComplianceInput) => {
      if (!organization?.id) throw new Error('No organization');

      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('sbc_compliance_checks')
        .insert({
          ...input,
          organization_id: organization.id,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SBCComplianceCheck;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sbc-compliance-checks'] });
      toast.success('SBC compliance check saved');
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });
}

export function useUpdateSBCComplianceCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SBCComplianceCheck> & { id: string }) => {
      const { data, error } = await supabase
        .from('sbc_compliance_checks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as SBCComplianceCheck;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sbc-compliance-checks'] });
      queryClient.invalidateQueries({ queryKey: ['sbc-compliance-check', data.id] });
      toast.success('SBC compliance check updated');
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
}

export function useDeleteSBCComplianceCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sbc_compliance_checks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sbc-compliance-checks'] });
      toast.success('SBC compliance check deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });
}
