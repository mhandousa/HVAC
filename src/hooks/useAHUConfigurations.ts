import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useOrganization';
import { toast } from 'sonner';
import type { 
  CoolingCoilConfig, 
  HeatingCoilConfig, 
  PreheatCoilConfig,
  FanConfig,
  FilterConfig,
  DamperConfig,
  ControlSequenceConfig 
} from '@/lib/ahu-calculations';

// ============ Types ============

export interface AHUConfiguration {
  id: string;
  organizationId: string;
  projectId: string | null;
  zoneId: string | null;
  
  // Basic Info
  ahuTag: string;
  ahuName: string;
  description: string | null;
  location: string | null;
  
  // Design Parameters
  designCfm: number;
  designStaticPressureIn: number;
  outdoorAirCfm: number | null;
  returnAirCfm: number | null;
  minOaPercent: number;
  
  // Coil Configurations
  coolingCoilConfig: CoolingCoilConfig | null;
  heatingCoilConfig: HeatingCoilConfig | null;
  preheatCoilConfig: PreheatCoilConfig | null;
  
  // Fan Configurations
  supplyFanConfig: FanConfig | null;
  returnFanConfig: FanConfig | null;
  reliefFanConfig: FanConfig | null;
  
  // Other Configurations
  filterConfig: FilterConfig | null;
  damperConfig: DamperConfig | null;
  humidifierConfig: Record<string, unknown> | null;
  ervConfig: Record<string, unknown> | null;
  soundAttenuatorConfig: Record<string, unknown> | null;
  
  // Control Sequence
  controlStrategy: string;
  economizerType: string | null;
  economizerLockoutTempF: number;
  supplyAirTempSetpointF: number;
  ductStaticSetpointIn: number;
  controlSequenceJson: ControlSequenceConfig | null;
  
  // Calculated Totals
  totalPressureDropIn: number | null;
  totalCoolingCapacityTons: number | null;
  totalHeatingCapacityMbh: number | null;
  supplyFanBhp: number | null;
  returnFanBhp: number | null;
  
  // Compliance
  ashrae901Compliant: boolean | null;
  ashrae621Compliant: boolean | null;
  
  // Status
  status: string;
  revision: string;
  notes: string | null;
  
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAHUInput {
  projectId?: string;
  zoneId?: string;
  ahuTag: string;
  ahuName: string;
  description?: string;
  location?: string;
  designCfm: number;
  designStaticPressureIn?: number;
  outdoorAirCfm?: number;
  returnAirCfm?: number;
  minOaPercent?: number;
  controlStrategy?: string;
}

export interface UpdateAHUInput {
  id: string;
  updates: Partial<Omit<AHUConfiguration, 'id' | 'organizationId' | 'createdBy' | 'createdAt'>>;
}

// ============ Helper Functions ============

function mapRowToAHU(row: Record<string, unknown>): AHUConfiguration {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    projectId: row.project_id as string | null,
    zoneId: row.zone_id as string | null,
    ahuTag: row.ahu_tag as string,
    ahuName: row.ahu_name as string,
    description: row.description as string | null,
    location: row.location as string | null,
    designCfm: Number(row.design_cfm),
    designStaticPressureIn: Number(row.design_static_pressure_in) || 2.5,
    outdoorAirCfm: row.outdoor_air_cfm ? Number(row.outdoor_air_cfm) : null,
    returnAirCfm: row.return_air_cfm ? Number(row.return_air_cfm) : null,
    minOaPercent: Number(row.min_oa_percent) || 15,
    coolingCoilConfig: row.cooling_coil_config as CoolingCoilConfig | null,
    heatingCoilConfig: row.heating_coil_config as HeatingCoilConfig | null,
    preheatCoilConfig: row.preheat_coil_config as PreheatCoilConfig | null,
    supplyFanConfig: row.supply_fan_config as FanConfig | null,
    returnFanConfig: row.return_fan_config as FanConfig | null,
    reliefFanConfig: row.relief_fan_config as FanConfig | null,
    filterConfig: row.filter_config as FilterConfig | null,
    damperConfig: row.damper_config as DamperConfig | null,
    humidifierConfig: row.humidifier_config as Record<string, unknown> | null,
    ervConfig: row.erv_config as Record<string, unknown> | null,
    soundAttenuatorConfig: row.sound_attenuator_config as Record<string, unknown> | null,
    controlStrategy: (row.control_strategy as string) || 'vav',
    economizerType: row.economizer_type as string | null,
    economizerLockoutTempF: Number(row.economizer_lockout_temp_f) || 75,
    supplyAirTempSetpointF: Number(row.supply_air_temp_setpoint_f) || 55,
    ductStaticSetpointIn: Number(row.duct_static_setpoint_in) || 1.5,
    controlSequenceJson: row.control_sequence_json as ControlSequenceConfig | null,
    totalPressureDropIn: row.total_pressure_drop_in ? Number(row.total_pressure_drop_in) : null,
    totalCoolingCapacityTons: row.total_cooling_capacity_tons ? Number(row.total_cooling_capacity_tons) : null,
    totalHeatingCapacityMbh: row.total_heating_capacity_mbh ? Number(row.total_heating_capacity_mbh) : null,
    supplyFanBhp: row.supply_fan_bhp ? Number(row.supply_fan_bhp) : null,
    returnFanBhp: row.return_fan_bhp ? Number(row.return_fan_bhp) : null,
    ashrae901Compliant: row.ashrae_90_1_compliant as boolean | null,
    ashrae621Compliant: row.ashrae_62_1_compliant as boolean | null,
    status: (row.status as string) || 'draft',
    revision: (row.revision as string) || 'A',
    notes: row.notes as string | null,
    createdBy: row.created_by as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapAHUToRow(ahu: Partial<AHUConfiguration>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  
  if (ahu.projectId !== undefined) row.project_id = ahu.projectId;
  if (ahu.zoneId !== undefined) row.zone_id = ahu.zoneId;
  if (ahu.ahuTag !== undefined) row.ahu_tag = ahu.ahuTag;
  if (ahu.ahuName !== undefined) row.ahu_name = ahu.ahuName;
  if (ahu.description !== undefined) row.description = ahu.description;
  if (ahu.location !== undefined) row.location = ahu.location;
  if (ahu.designCfm !== undefined) row.design_cfm = ahu.designCfm;
  if (ahu.designStaticPressureIn !== undefined) row.design_static_pressure_in = ahu.designStaticPressureIn;
  if (ahu.outdoorAirCfm !== undefined) row.outdoor_air_cfm = ahu.outdoorAirCfm;
  if (ahu.returnAirCfm !== undefined) row.return_air_cfm = ahu.returnAirCfm;
  if (ahu.minOaPercent !== undefined) row.min_oa_percent = ahu.minOaPercent;
  if (ahu.coolingCoilConfig !== undefined) row.cooling_coil_config = ahu.coolingCoilConfig;
  if (ahu.heatingCoilConfig !== undefined) row.heating_coil_config = ahu.heatingCoilConfig;
  if (ahu.preheatCoilConfig !== undefined) row.preheat_coil_config = ahu.preheatCoilConfig;
  if (ahu.supplyFanConfig !== undefined) row.supply_fan_config = ahu.supplyFanConfig;
  if (ahu.returnFanConfig !== undefined) row.return_fan_config = ahu.returnFanConfig;
  if (ahu.reliefFanConfig !== undefined) row.relief_fan_config = ahu.reliefFanConfig;
  if (ahu.filterConfig !== undefined) row.filter_config = ahu.filterConfig;
  if (ahu.damperConfig !== undefined) row.damper_config = ahu.damperConfig;
  if (ahu.humidifierConfig !== undefined) row.humidifier_config = ahu.humidifierConfig;
  if (ahu.ervConfig !== undefined) row.erv_config = ahu.ervConfig;
  if (ahu.soundAttenuatorConfig !== undefined) row.sound_attenuator_config = ahu.soundAttenuatorConfig;
  if (ahu.controlStrategy !== undefined) row.control_strategy = ahu.controlStrategy;
  if (ahu.economizerType !== undefined) row.economizer_type = ahu.economizerType;
  if (ahu.economizerLockoutTempF !== undefined) row.economizer_lockout_temp_f = ahu.economizerLockoutTempF;
  if (ahu.supplyAirTempSetpointF !== undefined) row.supply_air_temp_setpoint_f = ahu.supplyAirTempSetpointF;
  if (ahu.ductStaticSetpointIn !== undefined) row.duct_static_setpoint_in = ahu.ductStaticSetpointIn;
  if (ahu.controlSequenceJson !== undefined) row.control_sequence_json = ahu.controlSequenceJson;
  if (ahu.totalPressureDropIn !== undefined) row.total_pressure_drop_in = ahu.totalPressureDropIn;
  if (ahu.totalCoolingCapacityTons !== undefined) row.total_cooling_capacity_tons = ahu.totalCoolingCapacityTons;
  if (ahu.totalHeatingCapacityMbh !== undefined) row.total_heating_capacity_mbh = ahu.totalHeatingCapacityMbh;
  if (ahu.supplyFanBhp !== undefined) row.supply_fan_bhp = ahu.supplyFanBhp;
  if (ahu.returnFanBhp !== undefined) row.return_fan_bhp = ahu.returnFanBhp;
  if (ahu.ashrae901Compliant !== undefined) row.ashrae_90_1_compliant = ahu.ashrae901Compliant;
  if (ahu.ashrae621Compliant !== undefined) row.ashrae_62_1_compliant = ahu.ashrae621Compliant;
  if (ahu.status !== undefined) row.status = ahu.status;
  if (ahu.revision !== undefined) row.revision = ahu.revision;
  if (ahu.notes !== undefined) row.notes = ahu.notes;
  
  return row;
}

// ============ Hooks ============

export function useAHUConfigurations(projectId?: string) {
  const { data: profile } = useProfile();
  
  return useQuery({
    queryKey: ['ahu-configurations', profile?.organization_id, projectId],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      let query = supabase
        .from('ahu_configurations')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []).map(row => mapRowToAHU(row as Record<string, unknown>));
    },
    enabled: !!profile?.organization_id,
  });
}

export function useAHUConfiguration(id: string | undefined) {
  const { data: profile } = useProfile();
  
  return useQuery({
    queryKey: ['ahu-configuration', id],
    queryFn: async () => {
      if (!id || !profile?.organization_id) return null;
      
      const { data, error } = await supabase
        .from('ahu_configurations')
        .select('*')
        .eq('id', id)
        .eq('organization_id', profile.organization_id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      
      return mapRowToAHU(data as Record<string, unknown>);
    },
    enabled: !!id && !!profile?.organization_id,
  });
}

export function useCreateAHUConfiguration() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (input: CreateAHUInput) => {
      if (!profile?.organization_id || !user?.id) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('ahu_configurations')
        .insert({
          organization_id: profile.organization_id,
          project_id: input.projectId || null,
          zone_id: input.zoneId || null,
          ahu_tag: input.ahuTag,
          ahu_name: input.ahuName,
          description: input.description || null,
          location: input.location || null,
          design_cfm: input.designCfm,
          design_static_pressure_in: input.designStaticPressureIn || 2.5,
          outdoor_air_cfm: input.outdoorAirCfm || null,
          return_air_cfm: input.returnAirCfm || null,
          min_oa_percent: input.minOaPercent || 15,
          control_strategy: input.controlStrategy || 'vav',
          created_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return mapRowToAHU(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ahu-configurations'] });
      toast.success('AHU configuration created');
    },
    onError: (error) => {
      console.error('Failed to create AHU configuration:', error);
      toast.error('Failed to create AHU configuration');
    },
  });
}

export function useUpdateAHUConfiguration() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  
  return useMutation({
    mutationFn: async ({ id, updates }: UpdateAHUInput) => {
      if (!profile?.organization_id) {
        throw new Error('User not authenticated');
      }
      
      const row = mapAHUToRow(updates);
      row.updated_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('ahu_configurations')
        .update(row)
        .eq('id', id)
        .eq('organization_id', profile.organization_id)
        .select()
        .single();
      
      if (error) throw error;
      return mapRowToAHU(data as Record<string, unknown>);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ahu-configurations'] });
      queryClient.invalidateQueries({ queryKey: ['ahu-configuration', data.id] });
      toast.success('AHU configuration updated');
    },
    onError: (error) => {
      console.error('Failed to update AHU configuration:', error);
      toast.error('Failed to update AHU configuration');
    },
  });
}

export function useDeleteAHUConfiguration() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (!profile?.organization_id) {
        throw new Error('User not authenticated');
      }
      
      const { error } = await supabase
        .from('ahu_configurations')
        .delete()
        .eq('id', id)
        .eq('organization_id', profile.organization_id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ahu-configurations'] });
      toast.success('AHU configuration deleted');
    },
    onError: (error) => {
      console.error('Failed to delete AHU configuration:', error);
      toast.error('Failed to delete AHU configuration');
    },
  });
}
