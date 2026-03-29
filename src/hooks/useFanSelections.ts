import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface FanSelection {
  id: string;
  organization_id: string;
  duct_system_id: string | null;
  ahu_configuration_id: string | null;
  fan_tag: string | null;
  fan_type: string;
  application: string | null;
  fan_curve_id: string | null;
  manufacturer: string | null;
  model_number: string | null;
  design_cfm: number;
  design_static_pressure_in: number;
  static_pressure_component_in: number | null;
  operating_cfm: number | null;
  operating_static_pressure_in: number | null;
  operating_bhp: number | null;
  operating_efficiency_percent: number | null;
  operating_point_valid: boolean | null;
  motor_hp: number | null;
  motor_rpm: number | null;
  motor_voltage: string | null;
  motor_phase: string | null;
  motor_fla: number | null;
  vfd_required: boolean | null;
  sound_power_db: number | null;
  nc_rating: number | null;
  wheel_diameter_in: number | null;
  inlet_diameter_in: number | null;
  outlet_size: string | null;
  weight_lb: number | null;
  selection_notes: string | null;
  selected_equipment: Json | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CreateFanSelectionInput {
  duct_system_id?: string;
  ahu_configuration_id?: string;
  fan_tag?: string;
  fan_type: string;
  application?: string;
  fan_curve_id?: string;
  manufacturer?: string;
  model_number?: string;
  design_cfm: number;
  design_static_pressure_in: number;
  static_pressure_component_in?: number;
  operating_cfm?: number;
  operating_static_pressure_in?: number;
  operating_bhp?: number;
  operating_efficiency_percent?: number;
  operating_point_valid?: boolean;
  motor_hp?: number;
  motor_rpm?: number;
  motor_voltage?: string;
  motor_phase?: string;
  motor_fla?: number;
  vfd_required?: boolean;
  sound_power_db?: number;
  nc_rating?: number;
  wheel_diameter_in?: number;
  inlet_diameter_in?: number;
  outlet_size?: string;
  weight_lb?: number;
  selection_notes?: string;
  selected_equipment?: object;
  status?: string;
}

export function useFanSelections(projectId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['fan-selections', organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('fan_selections')
        .select(`
          *,
          duct_systems:duct_system_id (
            id,
            system_name,
            project_id
          )
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Filter by project if specified (through duct_systems relationship)
      if (projectId && data) {
        return data.filter(
          (item: any) => item.duct_systems?.project_id === projectId
        ) as unknown as FanSelection[];
      }

      return (data || []) as unknown as FanSelection[];
    },
    enabled: !!organization?.id,
  });
}

export function useFanSelectionsByDuctSystem(ductSystemId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['fan-selections', 'duct-system', ductSystemId],
    queryFn: async () => {
      if (!organization?.id || !ductSystemId) return [];

      const { data, error } = await supabase
        .from('fan_selections')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('duct_system_id', ductSystemId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as FanSelection[];
    },
    enabled: !!organization?.id && !!ductSystemId,
  });
}

export function useFanSelectionsByAHU(ahuConfigurationId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['fan-selections', 'ahu', ahuConfigurationId],
    queryFn: async () => {
      if (!organization?.id || !ahuConfigurationId) return [];

      const { data, error } = await supabase
        .from('fan_selections')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('ahu_configuration_id', ahuConfigurationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as FanSelection[];
    },
    enabled: !!organization?.id && !!ahuConfigurationId,
  });
}

export function useFanSelection(selectionId?: string) {
  return useQuery({
    queryKey: ['fan-selection', selectionId],
    queryFn: async () => {
      if (!selectionId) return null;

      const { data, error } = await supabase
        .from('fan_selections')
        .select('*')
        .eq('id', selectionId)
        .single();

      if (error) throw error;
      return data as unknown as FanSelection;
    },
    enabled: !!selectionId,
  });
}

export function useCreateFanSelection() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async (selection: CreateFanSelectionInput) => {
      if (!organization?.id) throw new Error('No organization');

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id || '')
        .maybeSingle();

      const insertData = {
        organization_id: organization.id,
        duct_system_id: selection.duct_system_id || null,
        ahu_configuration_id: selection.ahu_configuration_id || null,
        fan_tag: selection.fan_tag || null,
        fan_type: selection.fan_type,
        application: selection.application || null,
        fan_curve_id: selection.fan_curve_id || null,
        manufacturer: selection.manufacturer || null,
        model_number: selection.model_number || null,
        design_cfm: selection.design_cfm,
        design_static_pressure_in: selection.design_static_pressure_in,
        static_pressure_component_in: selection.static_pressure_component_in || null,
        operating_cfm: selection.operating_cfm || null,
        operating_static_pressure_in: selection.operating_static_pressure_in || null,
        operating_bhp: selection.operating_bhp || null,
        operating_efficiency_percent: selection.operating_efficiency_percent || null,
        operating_point_valid: selection.operating_point_valid || false,
        motor_hp: selection.motor_hp || null,
        motor_rpm: selection.motor_rpm || null,
        motor_voltage: selection.motor_voltage || null,
        motor_phase: selection.motor_phase || null,
        motor_fla: selection.motor_fla || null,
        vfd_required: selection.vfd_required || false,
        sound_power_db: selection.sound_power_db || null,
        nc_rating: selection.nc_rating || null,
        wheel_diameter_in: selection.wheel_diameter_in || null,
        inlet_diameter_in: selection.inlet_diameter_in || null,
        outlet_size: selection.outlet_size || null,
        weight_lb: selection.weight_lb || null,
        selection_notes: selection.selection_notes || null,
        selected_equipment: (selection.selected_equipment || null) as Json,
        status: selection.status || 'selected',
        created_by: profile?.id || null,
      };

      const { data, error } = await supabase
        .from('fan_selections')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return data as unknown as FanSelection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fan-selections'] });
      queryClient.invalidateQueries({ queryKey: ['design-completeness'] });
      toast.success('Fan selection saved');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateFanSelection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FanSelection> & { id: string }) => {
      const { data, error } = await supabase
        .from('fan_selections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as FanSelection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fan-selections'] });
      queryClient.invalidateQueries({ queryKey: ['fan-selection'] });
      queryClient.invalidateQueries({ queryKey: ['design-completeness'] });
      toast.success('Fan selection updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteFanSelection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fan_selections')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fan-selections'] });
      queryClient.invalidateQueries({ queryKey: ['design-completeness'] });
      toast.success('Fan selection deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
