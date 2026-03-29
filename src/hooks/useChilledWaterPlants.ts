import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

// Helper to safely cast Json to typed config
function castConfig<T>(config: Json | null): T | null {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return null;
  return config as unknown as T;
}

export interface ChillerConfig {
  chillerType: 'water-cooled' | 'air-cooled';
  numberOfChillers: number;
  capacityPerChillerTons: number;
  totalInstalledCapacityTons: number;
  redundancyMode: 'n' | 'n+1' | '2n';
  partLoadAtDesign: number;
}

export interface PumpConfig {
  pumpType: 'primary' | 'secondary' | 'condenser';
  numberOfPumps: number;
  flowPerPumpGpm: number;
  headFt: number;
  motorHp: number;
  motorKw: number;
  hasVfd: boolean;
  redundancy: boolean;
}

export interface CoolingTowerConfig {
  numberOfCells: number;
  capacityPerCellTons: number;
  totalCapacityTons: number;
  approachF: number;
  rangeF: number;
  designWetBulbF: number;
  fanHpPerCell: number;
  totalFanKw: number;
}

export interface HeaderPipeConfig {
  chwSupplySize: number;
  chwReturnSize: number;
  cwSupplySize: number;
  cwReturnSize: number;
}

export interface ChilledWaterPlant {
  id: string;
  organization_id: string;
  project_id: string | null;
  plant_name: string;
  plant_tag: string | null;
  design_cooling_load_tons: number;
  diversity_factor: number | null;
  future_expansion_percent: number | null;
  chw_supply_temp_f: number | null;
  chw_return_temp_f: number | null;
  chw_delta_t_f: number | null;
  cw_supply_temp_f: number | null;
  cw_return_temp_f: number | null;
  cw_delta_t_f: number | null;
  chiller_type: string | null;
  pumping_config: string | null;
  redundancy_mode: string | null;
  chiller_config: ChillerConfig | null;
  primary_pump_config: PumpConfig | null;
  secondary_pump_config: PumpConfig | null;
  condenser_pump_config: PumpConfig | null;
  cooling_tower_config: CoolingTowerConfig | null;
  header_pipe_config: HeaderPipeConfig | null;
  total_installed_capacity_tons: number | null;
  total_primary_flow_gpm: number | null;
  total_secondary_flow_gpm: number | null;
  total_condenser_flow_gpm: number | null;
  notes: string | null;
  status: string | null;
  revision: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChilledWaterPlantInput {
  project_id?: string | null;
  plant_name: string;
  plant_tag?: string | null;
  design_cooling_load_tons: number;
  diversity_factor?: number;
  future_expansion_percent?: number;
  chw_supply_temp_f?: number;
  chw_return_temp_f?: number;
  cw_supply_temp_f?: number;
  cw_return_temp_f?: number;
  chiller_type?: 'water-cooled' | 'air-cooled';
  pumping_config?: 'primary-only' | 'primary-secondary' | 'variable-primary';
  redundancy_mode?: 'n' | 'n+1' | '2n';
  chiller_config?: ChillerConfig;
  primary_pump_config?: PumpConfig;
  secondary_pump_config?: PumpConfig;
  condenser_pump_config?: PumpConfig;
  cooling_tower_config?: CoolingTowerConfig;
  header_pipe_config?: HeaderPipeConfig;
  total_installed_capacity_tons?: number;
  total_primary_flow_gpm?: number;
  total_secondary_flow_gpm?: number;
  total_condenser_flow_gpm?: number;
  notes?: string;
  status?: string;
  revision?: string;
}

// Fetch all chilled water plants
export function useChilledWaterPlants(projectId?: string) {
  const orgQuery = useOrganization();
  const organization = orgQuery.data;
  
  return useQuery({
    queryKey: ['chilled-water-plants', organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      let query = supabase
        .from('chilled_water_plants')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(plant => ({
        ...plant,
        chiller_config: castConfig<ChillerConfig>(plant.chiller_config),
        primary_pump_config: castConfig<PumpConfig>(plant.primary_pump_config),
        secondary_pump_config: castConfig<PumpConfig>(plant.secondary_pump_config),
        condenser_pump_config: castConfig<PumpConfig>(plant.condenser_pump_config),
        cooling_tower_config: castConfig<CoolingTowerConfig>(plant.cooling_tower_config),
        header_pipe_config: castConfig<HeaderPipeConfig>(plant.header_pipe_config),
      })) as ChilledWaterPlant[];
    },
    enabled: !!organization?.id,
  });
}

// Fetch single chilled water plant
export function useChilledWaterPlant(id: string | undefined) {
  return useQuery({
    queryKey: ['chilled-water-plant', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('chilled_water_plants')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        chiller_config: castConfig<ChillerConfig>(data.chiller_config),
        primary_pump_config: castConfig<PumpConfig>(data.primary_pump_config),
        secondary_pump_config: castConfig<PumpConfig>(data.secondary_pump_config),
        condenser_pump_config: castConfig<PumpConfig>(data.condenser_pump_config),
        cooling_tower_config: castConfig<CoolingTowerConfig>(data.cooling_tower_config),
        header_pipe_config: castConfig<HeaderPipeConfig>(data.header_pipe_config),
      } as ChilledWaterPlant;
    },
    enabled: !!id,
  });
}

// Create chilled water plant
export function useCreateChilledWaterPlant() {
  const queryClient = useQueryClient();
  const orgQuery = useOrganization();
  const organization = orgQuery.data;
  
  return useMutation({
    mutationFn: async (input: ChilledWaterPlantInput) => {
      if (!organization?.id) throw new Error('No organization found');
      
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('chilled_water_plants')
        .insert({
          organization_id: organization.id,
          project_id: input.project_id,
          plant_name: input.plant_name,
          plant_tag: input.plant_tag,
          design_cooling_load_tons: input.design_cooling_load_tons,
          diversity_factor: input.diversity_factor ?? 1.0,
          future_expansion_percent: input.future_expansion_percent ?? 0,
          chw_supply_temp_f: input.chw_supply_temp_f ?? 44,
          chw_return_temp_f: input.chw_return_temp_f ?? 54,
          cw_supply_temp_f: input.cw_supply_temp_f ?? 85,
          cw_return_temp_f: input.cw_return_temp_f ?? 95,
          chiller_type: input.chiller_type ?? 'water-cooled',
          pumping_config: input.pumping_config ?? 'primary-secondary',
          redundancy_mode: input.redundancy_mode ?? 'n+1',
          chiller_config: (input.chiller_config || {}) as unknown as Json,
          primary_pump_config: (input.primary_pump_config || {}) as unknown as Json,
          secondary_pump_config: (input.secondary_pump_config || {}) as unknown as Json,
          condenser_pump_config: (input.condenser_pump_config || {}) as unknown as Json,
          cooling_tower_config: (input.cooling_tower_config || {}) as unknown as Json,
          header_pipe_config: (input.header_pipe_config || {}) as unknown as Json,
          total_installed_capacity_tons: input.total_installed_capacity_tons,
          total_primary_flow_gpm: input.total_primary_flow_gpm,
          total_secondary_flow_gpm: input.total_secondary_flow_gpm,
          total_condenser_flow_gpm: input.total_condenser_flow_gpm,
          notes: input.notes,
          status: input.status ?? 'draft',
          revision: input.revision ?? 'A',
          created_by: userData.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chilled-water-plants'] });
      toast.success('Plant configuration saved');
    },
    onError: (error) => {
      console.error('Error creating plant:', error);
      toast.error('Failed to save plant configuration');
    },
  });
}

// Update chilled water plant
export function useUpdateChilledWaterPlant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ChilledWaterPlantInput> }) => {
      const updateData: Record<string, unknown> = {};
      
      if (updates.project_id !== undefined) updateData.project_id = updates.project_id;
      if (updates.plant_name !== undefined) updateData.plant_name = updates.plant_name;
      if (updates.plant_tag !== undefined) updateData.plant_tag = updates.plant_tag;
      if (updates.design_cooling_load_tons !== undefined) updateData.design_cooling_load_tons = updates.design_cooling_load_tons;
      if (updates.diversity_factor !== undefined) updateData.diversity_factor = updates.diversity_factor;
      if (updates.future_expansion_percent !== undefined) updateData.future_expansion_percent = updates.future_expansion_percent;
      if (updates.chw_supply_temp_f !== undefined) updateData.chw_supply_temp_f = updates.chw_supply_temp_f;
      if (updates.chw_return_temp_f !== undefined) updateData.chw_return_temp_f = updates.chw_return_temp_f;
      if (updates.cw_supply_temp_f !== undefined) updateData.cw_supply_temp_f = updates.cw_supply_temp_f;
      if (updates.cw_return_temp_f !== undefined) updateData.cw_return_temp_f = updates.cw_return_temp_f;
      if (updates.chiller_type !== undefined) updateData.chiller_type = updates.chiller_type;
      if (updates.pumping_config !== undefined) updateData.pumping_config = updates.pumping_config;
      if (updates.redundancy_mode !== undefined) updateData.redundancy_mode = updates.redundancy_mode;
      if (updates.chiller_config !== undefined) updateData.chiller_config = updates.chiller_config as unknown as Json;
      if (updates.primary_pump_config !== undefined) updateData.primary_pump_config = updates.primary_pump_config as unknown as Json;
      if (updates.secondary_pump_config !== undefined) updateData.secondary_pump_config = updates.secondary_pump_config as unknown as Json;
      if (updates.condenser_pump_config !== undefined) updateData.condenser_pump_config = updates.condenser_pump_config as unknown as Json;
      if (updates.cooling_tower_config !== undefined) updateData.cooling_tower_config = updates.cooling_tower_config as unknown as Json;
      if (updates.header_pipe_config !== undefined) updateData.header_pipe_config = updates.header_pipe_config as unknown as Json;
      if (updates.total_installed_capacity_tons !== undefined) updateData.total_installed_capacity_tons = updates.total_installed_capacity_tons;
      if (updates.total_primary_flow_gpm !== undefined) updateData.total_primary_flow_gpm = updates.total_primary_flow_gpm;
      if (updates.total_secondary_flow_gpm !== undefined) updateData.total_secondary_flow_gpm = updates.total_secondary_flow_gpm;
      if (updates.total_condenser_flow_gpm !== undefined) updateData.total_condenser_flow_gpm = updates.total_condenser_flow_gpm;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.revision !== undefined) updateData.revision = updates.revision;
      
      const { data, error } = await supabase
        .from('chilled_water_plants')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chilled-water-plants'] });
      queryClient.invalidateQueries({ queryKey: ['chilled-water-plant', data.id] });
      toast.success('Plant configuration updated');
    },
    onError: (error) => {
      console.error('Error updating plant:', error);
      toast.error('Failed to update plant configuration');
    },
  });
}

// Delete chilled water plant
export function useDeleteChilledWaterPlant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('chilled_water_plants')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chilled-water-plants'] });
      toast.success('Plant configuration deleted');
    },
    onError: (error) => {
      console.error('Error deleting plant:', error);
      toast.error('Failed to delete plant configuration');
    },
  });
}
