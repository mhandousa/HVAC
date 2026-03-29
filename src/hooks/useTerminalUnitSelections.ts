import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { TerminalUnitType } from '@/lib/terminal-unit-calculations';

export interface TerminalUnitSelection {
  id: string;
  organization_id: string;
  project_id: string | null;
  zone_id: string | null;
  duct_system_id: string | null;
  unit_tag: string;
  unit_type: TerminalUnitType;
  manufacturer: string | null;
  model_number: string | null;
  cooling_load_btuh: number | null;
  heating_load_btuh: number | null;
  supply_cfm: number | null;
  min_cfm: number | null;
  max_cfm: number | null;
  outdoor_air_cfm: number | null;
  selected_size: string | null;
  inlet_size_in: number | null;
  coil_rows: number | null;
  coil_fins_per_inch: number | null;
  fan_motor_hp: number | null;
  fan_speed_settings: number | null;
  entering_air_temp_f: number | null;
  leaving_air_temp_f: number | null;
  entering_water_temp_f: number | null;
  leaving_water_temp_f: number | null;
  water_flow_gpm: number | null;
  water_pressure_drop_ft: number | null;
  chw_coil_capacity_btuh: number | null;
  hw_coil_capacity_btuh: number | null;
  reheat_kw: number | null;
  reheat_stages: number | null;
  noise_nc: number | null;
  sound_power_db: number | null;
  has_reheat: boolean;
  reheat_type: 'hot_water' | 'electric' | 'none' | null;
  has_damper: boolean;
  damper_actuator: string | null;
  has_flow_station: boolean;
  has_discharge_sensor: boolean;
  location_description: string | null;
  ceiling_type: string | null;
  quantity: number;
  notes: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateTerminalUnitInput = Omit<
  TerminalUnitSelection,
  'id' | 'created_at' | 'updated_at'
>;

export type UpdateTerminalUnitInput = Partial<CreateTerminalUnitInput>;

/**
 * Fetch all terminal unit selections for a project
 */
export function useTerminalUnitSelections(projectId?: string) {
  return useQuery({
    queryKey: ['terminal-unit-selections', projectId],
    queryFn: async () => {
      let query = supabase
        .from('terminal_unit_selections')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TerminalUnitSelection[];
    },
    enabled: !!projectId,
  });
}

/**
 * Fetch terminal unit selections for a specific zone
 */
export function useTerminalUnitSelectionsByZone(zoneId?: string) {
  return useQuery({
    queryKey: ['terminal-unit-selections', 'zone', zoneId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('terminal_unit_selections')
        .select('*')
        .eq('zone_id', zoneId)
        .order('unit_tag', { ascending: true });

      if (error) throw error;
      return data as TerminalUnitSelection[];
    },
    enabled: !!zoneId,
  });
}

/**
 * Create a new terminal unit selection
 */
export function useCreateTerminalUnitSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateTerminalUnitInput) => {
      const { data, error } = await supabase
        .from('terminal_unit_selections')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as TerminalUnitSelection;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['terminal-unit-selections'] });
      toast({
        title: 'Terminal unit created',
        description: `${data.unit_tag} has been added.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating terminal unit',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update an existing terminal unit selection
 */
export function useUpdateTerminalUnitSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: UpdateTerminalUnitInput & { id: string }) => {
      const { data, error } = await supabase
        .from('terminal_unit_selections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as TerminalUnitSelection;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['terminal-unit-selections'] });
      toast({
        title: 'Terminal unit updated',
        description: `${data.unit_tag} has been updated.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating terminal unit',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete a terminal unit selection
 */
export function useDeleteTerminalUnitSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('terminal_unit_selections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminal-unit-selections'] });
      toast({
        title: 'Terminal unit deleted',
        description: 'The terminal unit has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting terminal unit',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Bulk create terminal unit selections
 */
export function useBulkCreateTerminalUnitSelections() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (inputs: CreateTerminalUnitInput[]) => {
      const { data, error } = await supabase
        .from('terminal_unit_selections')
        .insert(inputs)
        .select();

      if (error) throw error;
      return data as TerminalUnitSelection[];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['terminal-unit-selections'] });
      toast({
        title: 'Terminal units created',
        description: `${data.length} terminal unit(s) have been added.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating terminal units',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
