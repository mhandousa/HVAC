import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type LoadCalculation = Tables<'load_calculations'>;
export type LoadCalculationInsert = TablesInsert<'load_calculations'>;
export type LoadCalculationUpdate = TablesUpdate<'load_calculations'>;

export function useLoadCalculations(projectId?: string, zoneId?: string) {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['load_calculations', profile?.organization_id, projectId, zoneId],
    queryFn: async () => {
      if (!profile?.organization_id) return [];

      let query = supabase
        .from('load_calculations')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      if (zoneId) {
        query = query.eq('zone_id', zoneId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LoadCalculation[];
    },
    enabled: !!profile?.organization_id,
  });
}

export function useLoadCalculationsByZone(zoneId?: string) {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['load_calculations', 'zone', zoneId],
    queryFn: async () => {
      if (!zoneId || !profile?.organization_id) return [];

      const { data, error } = await supabase
        .from('load_calculations')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('zone_id', zoneId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LoadCalculation[];
    },
    enabled: !!zoneId && !!profile?.organization_id,
  });
}

export function useLoadCalculation(id: string | undefined) {
  return useQuery({
    queryKey: ['load_calculation', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('load_calculations')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as LoadCalculation | null;
    },
    enabled: !!id,
  });
}

export function useCreateLoadCalculation() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (calculation: Omit<LoadCalculationInsert, 'organization_id' | 'created_by'>) => {
      if (!profile?.organization_id) throw new Error('No organization');

      const { data, error } = await supabase
        .from('load_calculations')
        .insert({
          ...calculation,
          organization_id: profile.organization_id,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as LoadCalculation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['load_calculations'] });
      toast.success('Calculation saved');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save calculation');
    },
  });
}

export function useUpdateLoadCalculation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: LoadCalculationUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('load_calculations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as LoadCalculation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['load_calculations'] });
      queryClient.invalidateQueries({ queryKey: ['load_calculation', data.id] });
      toast.success('Calculation updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update calculation');
    },
  });
}

export function useDeleteLoadCalculation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('load_calculations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['load_calculations'] });
      toast.success('Calculation deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete calculation');
    },
  });
}
