import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface DiffuserGrille {
  id: string;
  duct_system_id: string;
  zone_id: string | null;
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

export interface CreateDiffuserGrilleInput {
  duct_system_id: string;
  zone_id?: string | null;
  terminal_type: string;
  style?: string | null;
  model?: string | null;
  airflow_cfm?: number | null;
  face_velocity_fpm?: number | null;
  neck_size?: string | null;
  pressure_drop_pa?: number | null;
  throw_distance_ft?: number | null;
  noise_nc?: number | null;
  location_description?: string | null;
  quantity?: number;
}

export function useDiffuserGrilles(ductSystemId?: string) {
  return useQuery({
    queryKey: ['diffuser-grilles', ductSystemId],
    queryFn: async () => {
      if (!ductSystemId) return [];

      const { data, error } = await supabase
        .from('diffuser_grilles')
        .select('*')
        .eq('duct_system_id', ductSystemId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as DiffuserGrille[];
    },
    enabled: !!ductSystemId,
  });
}

export function useDiffuserGrillesByZone(zoneId?: string) {
  return useQuery({
    queryKey: ['diffuser-grilles-by-zone', zoneId],
    queryFn: async () => {
      if (!zoneId) return [];

      const { data, error } = await supabase
        .from('diffuser_grilles')
        .select('*')
        .eq('zone_id', zoneId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as DiffuserGrille[];
    },
    enabled: !!zoneId,
  });
}

export function useDiffuserGrillesByProject(projectId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['diffuser-grilles-by-project', projectId, organization?.id],
    queryFn: async () => {
      if (!projectId || !organization?.id) return [];

      // First get all duct systems for the project
      const { data: ductSystems, error: ductError } = await supabase
        .from('duct_systems')
        .select('id')
        .eq('project_id', projectId)
        .eq('organization_id', organization.id);

      if (ductError) throw ductError;
      if (!ductSystems || ductSystems.length === 0) return [];

      const ductSystemIds = ductSystems.map(ds => ds.id);

      // Then get all diffuser/grilles for those systems
      const { data, error } = await supabase
        .from('diffuser_grilles')
        .select('*')
        .in('duct_system_id', ductSystemIds)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as DiffuserGrille[];
    },
    enabled: !!projectId && !!organization?.id,
  });
}

export function useCreateDiffuserGrille() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDiffuserGrilleInput) => {
      const { data, error } = await supabase
        .from('diffuser_grilles')
        .insert({
          ...input,
          quantity: input.quantity ?? 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data as DiffuserGrille;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['diffuser-grilles'] });
      queryClient.invalidateQueries({ queryKey: ['diffuser-grilles-by-zone'] });
      queryClient.invalidateQueries({ queryKey: ['diffuser-grilles-by-project'] });
      toast.success('Diffuser/grille added');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateDiffuserGrille() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DiffuserGrille> & { id: string }) => {
      const { data, error } = await supabase
        .from('diffuser_grilles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DiffuserGrille;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diffuser-grilles'] });
      queryClient.invalidateQueries({ queryKey: ['diffuser-grilles-by-zone'] });
      queryClient.invalidateQueries({ queryKey: ['diffuser-grilles-by-project'] });
      toast.success('Diffuser/grille updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteDiffuserGrille() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('diffuser_grilles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diffuser-grilles'] });
      queryClient.invalidateQueries({ queryKey: ['diffuser-grilles-by-zone'] });
      queryClient.invalidateQueries({ queryKey: ['diffuser-grilles-by-project'] });
      toast.success('Diffuser/grille deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useBulkCreateDiffuserGrilles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inputs: CreateDiffuserGrilleInput[]) => {
      const { data, error } = await supabase
        .from('diffuser_grilles')
        .insert(inputs.map(input => ({
          ...input,
          quantity: input.quantity ?? 1,
        })))
        .select();

      if (error) throw error;
      return data as DiffuserGrille[];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['diffuser-grilles'] });
      queryClient.invalidateQueries({ queryKey: ['diffuser-grilles-by-zone'] });
      queryClient.invalidateQueries({ queryKey: ['diffuser-grilles-by-project'] });
      toast.success(`${data.length} diffuser(s)/grille(s) added`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useBulkDeleteDiffuserGrilles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('diffuser_grilles')
        .delete()
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diffuser-grilles'] });
      queryClient.invalidateQueries({ queryKey: ['diffuser-grilles-by-zone'] });
      queryClient.invalidateQueries({ queryKey: ['diffuser-grilles-by-project'] });
      toast.success('Diffusers/grilles deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
