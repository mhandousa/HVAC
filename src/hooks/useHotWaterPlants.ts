import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface HotWaterPlant {
  id: string;
  organization_id: string;
  project_id: string | null;
  plant_name: string;
  plant_tag: string | null;
  heating_load_btuh: number;
  supply_temp_f: number | null;
  return_temp_f: number | null;
  boiler_type: string;
  boiler_count: number | null;
  redundancy_mode: string | null;
  boiler_config: Json | null;
  pumping_config: string | null;
  primary_pump_config: Json | null;
  secondary_pump_config: Json | null;
  system_volume_gal: number | null;
  expansion_tank_config: Json | null;
  piping_config: Json | null;
  diversity_factor: number | null;
  future_expansion_percent: number | null;
  status: string | null;
  notes: string | null;
  revision: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateHotWaterPlantInput {
  project_id?: string | null;
  plant_name: string;
  plant_tag?: string | null;
  heating_load_btuh: number;
  supply_temp_f?: number;
  return_temp_f?: number;
  boiler_type: string;
  boiler_count?: number;
  redundancy_mode?: string;
  boiler_config?: Json;
  pumping_config?: string;
  primary_pump_config?: Json;
  secondary_pump_config?: Json;
  system_volume_gal?: number;
  expansion_tank_config?: Json;
  piping_config?: Json;
  diversity_factor?: number;
  future_expansion_percent?: number;
  notes?: string;
}

export function useHotWaterPlants(projectId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['hot-water-plants', organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('hot_water_plants')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HotWaterPlant[];
    },
    enabled: !!organization?.id,
  });
}

export function useHotWaterPlant(id: string) {
  return useQuery({
    queryKey: ['hot-water-plant', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hot_water_plants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as HotWaterPlant;
    },
    enabled: !!id,
  });
}

export function useCreateHotWaterPlant() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreateHotWaterPlantInput) => {
      if (!organization?.id) throw new Error('No organization');

      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('hot_water_plants')
        .insert({
          ...input,
          organization_id: organization.id,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as HotWaterPlant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hot-water-plants'] });
      toast.success('Hot water plant configuration saved');
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });
}

export function useUpdateHotWaterPlant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HotWaterPlant> & { id: string }) => {
      const { data, error } = await supabase
        .from('hot_water_plants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as HotWaterPlant;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['hot-water-plants'] });
      queryClient.invalidateQueries({ queryKey: ['hot-water-plant', data.id] });
      toast.success('Hot water plant updated');
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
}

export function useDeleteHotWaterPlant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('hot_water_plants')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hot-water-plants'] });
      toast.success('Hot water plant deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });
}
