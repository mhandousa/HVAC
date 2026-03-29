import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export type PresetCategory = 'cooling' | 'heating' | 'mixing' | 'humidification' | 'dehumidification' | 'custom';

export interface PresetAirState {
  name: string;
  dryBulb: number;
  humidity: number;
  humidityType: 'relative' | 'wetBulb' | 'dewPoint';
}

export interface PsychrometricPreset {
  id: string;
  organization_id: string;
  created_by: string | null;
  name: string;
  description: string | null;
  category: PresetCategory;
  icon_name: string;
  air_states: PresetAirState[];
  altitude_ft: number | null;
  climate_zone: string | null;
  is_public: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePresetInput {
  name: string;
  description?: string;
  category: PresetCategory;
  icon_name: string;
  air_states: PresetAirState[];
  altitude_ft?: number;
  climate_zone?: string;
  is_public?: boolean;
}

export interface UpdatePresetInput {
  id: string;
  name?: string;
  description?: string;
  category?: PresetCategory;
  icon_name?: string;
  air_states?: PresetAirState[];
  altitude_ft?: number;
  climate_zone?: string;
  is_public?: boolean;
}

export function usePsychrometricPresets(category?: PresetCategory) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['psychrometric-presets', organization?.id, category],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('psychrometric_presets')
        .select('*')
        .eq('organization_id', organization.id)
        .order('usage_count', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []).map(preset => ({
        ...preset,
        air_states: (preset.air_states as unknown as PresetAirState[]) || [],
        category: preset.category as PresetCategory,
      })) as PsychrometricPreset[];
    },
    enabled: !!organization?.id,
  });
}

export function usePsychrometricPreset(id?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['psychrometric-preset', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('psychrometric_presets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        ...data,
        air_states: (data.air_states as unknown as PresetAirState[]) || [],
        category: data.category as PresetCategory,
      } as PsychrometricPreset;
    },
    enabled: !!id && !!organization?.id,
  });
}

export function useCreatePsychrometricPreset() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreatePresetInput) => {
      if (!organization?.id) throw new Error('No organization');

      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('psychrometric_presets')
        .insert([{
          organization_id: organization.id,
          created_by: userData.user?.id,
          name: input.name,
          description: input.description || null,
          category: input.category,
          icon_name: input.icon_name,
          air_states: JSON.parse(JSON.stringify(input.air_states)),
          altitude_ft: input.altitude_ft || 0,
          climate_zone: input.climate_zone || null,
          is_public: input.is_public ?? true,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psychrometric-presets'] });
      toast.success('Preset saved successfully');
    },
    onError: (error) => {
      toast.error(`Failed to save preset: ${error.message}`);
    },
  });
}

export function useUpdatePsychrometricPreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePresetInput) => {
      const { id, ...updates } = input;
      
      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.icon_name !== undefined) updateData.icon_name = updates.icon_name;
      if (updates.air_states !== undefined) updateData.air_states = updates.air_states;
      if (updates.altitude_ft !== undefined) updateData.altitude_ft = updates.altitude_ft;
      if (updates.climate_zone !== undefined) updateData.climate_zone = updates.climate_zone;
      if (updates.is_public !== undefined) updateData.is_public = updates.is_public;

      const { data, error } = await supabase
        .from('psychrometric_presets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psychrometric-presets'] });
      toast.success('Preset updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update preset: ${error.message}`);
    },
  });
}

export function useDeletePsychrometricPreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('psychrometric_presets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psychrometric-presets'] });
      toast.success('Preset deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete preset: ${error.message}`);
    },
  });
}

export function useIncrementPresetUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First get current usage count
      const { data: preset, error: fetchError } = await supabase
        .from('psychrometric_presets')
        .select('usage_count')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('psychrometric_presets')
        .update({ usage_count: (preset.usage_count || 0) + 1 })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psychrometric-presets'] });
    },
  });
}

// System presets that are always available (not stored in DB)
export const SYSTEM_PRESETS: Omit<PsychrometricPreset, 'id' | 'organization_id' | 'created_by' | 'created_at' | 'updated_at' | 'usage_count' | 'is_public'>[] = [
  {
    name: 'Cooling Coil',
    description: 'Standard cooling and dehumidification process',
    category: 'cooling',
    icon_name: 'Snowflake',
    air_states: [
      { name: 'Entering Air', dryBulb: 27, humidity: 50, humidityType: 'relative' },
      { name: 'Leaving Air', dryBulb: 13, humidity: 95, humidityType: 'relative' },
    ],
    altitude_ft: 0,
    climate_zone: null,
  },
  {
    name: 'Heating Coil',
    description: 'Sensible heating with no moisture change',
    category: 'heating',
    icon_name: 'Flame',
    air_states: [
      { name: 'Entering Air', dryBulb: 13, humidity: 95, humidityType: 'relative' },
      { name: 'Leaving Air', dryBulb: 35, humidity: 25, humidityType: 'relative' },
    ],
    altitude_ft: 0,
    climate_zone: null,
  },
  {
    name: 'Mixing Box',
    description: 'Outdoor and return air mixing',
    category: 'mixing',
    icon_name: 'Wind',
    air_states: [
      { name: 'Outdoor Air', dryBulb: 35, humidity: 40, humidityType: 'relative' },
      { name: 'Return Air', dryBulb: 24, humidity: 50, humidityType: 'relative' },
      { name: 'Mixed Air', dryBulb: 28, humidity: 46, humidityType: 'relative' },
    ],
    altitude_ft: 0,
    climate_zone: null,
  },
  {
    name: 'Steam Humidifier',
    description: 'Isothermal humidification process',
    category: 'humidification',
    icon_name: 'Waves',
    air_states: [
      { name: 'Entering Air', dryBulb: 22, humidity: 20, humidityType: 'relative' },
      { name: 'Leaving Air', dryBulb: 22, humidity: 50, humidityType: 'relative' },
    ],
    altitude_ft: 0,
    climate_zone: null,
  },
  {
    name: 'Evaporative Cooler',
    description: 'Adiabatic cooling and humidification',
    category: 'cooling',
    icon_name: 'Droplets',
    air_states: [
      { name: 'Hot Dry Air', dryBulb: 40, humidity: 15, humidityType: 'relative' },
      { name: 'Cooled Air', dryBulb: 25, humidity: 65, humidityType: 'relative' },
    ],
    altitude_ft: 0,
    climate_zone: null,
  },
  {
    name: 'Reheat',
    description: 'Post-cooling reheat for humidity control',
    category: 'heating',
    icon_name: 'Zap',
    air_states: [
      { name: 'Cooled Air', dryBulb: 13, humidity: 95, humidityType: 'relative' },
      { name: 'Supply Air', dryBulb: 18, humidity: 65, humidityType: 'relative' },
    ],
    altitude_ft: 0,
    climate_zone: null,
  },
];
