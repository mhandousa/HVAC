import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface PumpSelection {
  id: string;
  organization_id: string;
  pipe_system_id: string | null;
  pump_tag: string | null;
  pump_type: string;
  application: string | null;
  pump_arrangement: string | null;
  pump_curve_id: string | null;
  manufacturer: string | null;
  model_number: string | null;
  design_flow_gpm: number;
  design_head_ft: number;
  static_head_ft: number | null;
  operating_flow_gpm: number | null;
  operating_head_ft: number | null;
  operating_bhp: number | null;
  operating_efficiency_percent: number | null;
  operating_point_valid: boolean | null;
  motor_hp: number | null;
  motor_rpm: number | null;
  motor_voltage: string | null;
  motor_phase: string | null;
  motor_fla: number | null;
  vfd_required: boolean | null;
  npsh_available_ft: number | null;
  npsh_required_ft: number | null;
  npsh_margin_adequate: boolean | null;
  impeller_diameter_in: number | null;
  suction_size_in: number | null;
  discharge_size_in: number | null;
  weight_lb: number | null;
  selection_notes: string | null;
  selected_equipment: Json | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CreatePumpSelectionInput {
  pipe_system_id?: string;
  pump_tag?: string;
  pump_type: string;
  application?: string;
  pump_arrangement?: string;
  pump_curve_id?: string;
  manufacturer?: string;
  model_number?: string;
  design_flow_gpm: number;
  design_head_ft: number;
  static_head_ft?: number;
  operating_flow_gpm?: number;
  operating_head_ft?: number;
  operating_bhp?: number;
  operating_efficiency_percent?: number;
  operating_point_valid?: boolean;
  motor_hp?: number;
  motor_rpm?: number;
  motor_voltage?: string;
  motor_phase?: string;
  motor_fla?: number;
  vfd_required?: boolean;
  npsh_available_ft?: number;
  npsh_required_ft?: number;
  npsh_margin_adequate?: boolean;
  impeller_diameter_in?: number;
  suction_size_in?: number;
  discharge_size_in?: number;
  weight_lb?: number;
  selection_notes?: string;
  selected_equipment?: object;
  status?: string;
}

export function usePumpSelections(projectId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['pump-selections', organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('pump_selections')
        .select(`
          *,
          pipe_systems:pipe_system_id (
            id,
            system_name,
            project_id
          )
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Filter by project if specified (through pipe_systems relationship)
      if (projectId && data) {
        return data.filter(
          (item: any) => item.pipe_systems?.project_id === projectId
        ) as unknown as PumpSelection[];
      }

      return (data || []) as unknown as PumpSelection[];
    },
    enabled: !!organization?.id,
  });
}

export function usePumpSelectionsByPipeSystem(pipeSystemId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['pump-selections', 'pipe-system', pipeSystemId],
    queryFn: async () => {
      if (!organization?.id || !pipeSystemId) return [];

      const { data, error } = await supabase
        .from('pump_selections')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('pipe_system_id', pipeSystemId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as PumpSelection[];
    },
    enabled: !!organization?.id && !!pipeSystemId,
  });
}

export function usePumpSelection(selectionId?: string) {
  return useQuery({
    queryKey: ['pump-selection', selectionId],
    queryFn: async () => {
      if (!selectionId) return null;

      const { data, error } = await supabase
        .from('pump_selections')
        .select('*')
        .eq('id', selectionId)
        .single();

      if (error) throw error;
      return data as unknown as PumpSelection;
    },
    enabled: !!selectionId,
  });
}

export function useCreatePumpSelection() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async (selection: CreatePumpSelectionInput) => {
      if (!organization?.id) throw new Error('No organization');

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id || '')
        .maybeSingle();

      const insertData = {
        organization_id: organization.id,
        pipe_system_id: selection.pipe_system_id || null,
        pump_tag: selection.pump_tag || null,
        pump_type: selection.pump_type,
        application: selection.application || null,
        pump_arrangement: selection.pump_arrangement || null,
        pump_curve_id: selection.pump_curve_id || null,
        manufacturer: selection.manufacturer || null,
        model_number: selection.model_number || null,
        design_flow_gpm: selection.design_flow_gpm,
        design_head_ft: selection.design_head_ft,
        static_head_ft: selection.static_head_ft || null,
        operating_flow_gpm: selection.operating_flow_gpm || null,
        operating_head_ft: selection.operating_head_ft || null,
        operating_bhp: selection.operating_bhp || null,
        operating_efficiency_percent: selection.operating_efficiency_percent || null,
        operating_point_valid: selection.operating_point_valid || false,
        motor_hp: selection.motor_hp || null,
        motor_rpm: selection.motor_rpm || null,
        motor_voltage: selection.motor_voltage || null,
        motor_phase: selection.motor_phase || null,
        motor_fla: selection.motor_fla || null,
        vfd_required: selection.vfd_required || false,
        npsh_available_ft: selection.npsh_available_ft || null,
        npsh_required_ft: selection.npsh_required_ft || null,
        npsh_margin_adequate: selection.npsh_margin_adequate || null,
        impeller_diameter_in: selection.impeller_diameter_in || null,
        suction_size_in: selection.suction_size_in || null,
        discharge_size_in: selection.discharge_size_in || null,
        weight_lb: selection.weight_lb || null,
        selection_notes: selection.selection_notes || null,
        selected_equipment: (selection.selected_equipment || null) as Json,
        status: selection.status || 'selected',
        created_by: profile?.id || null,
      };

      const { data, error } = await supabase
        .from('pump_selections')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return data as unknown as PumpSelection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pump-selections'] });
      queryClient.invalidateQueries({ queryKey: ['design-completeness'] });
      toast.success('Pump selection saved');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdatePumpSelection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PumpSelection> & { id: string }) => {
      const { data, error } = await supabase
        .from('pump_selections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as PumpSelection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pump-selections'] });
      queryClient.invalidateQueries({ queryKey: ['pump-selection'] });
      queryClient.invalidateQueries({ queryKey: ['design-completeness'] });
      toast.success('Pump selection updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeletePumpSelection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pump_selections')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pump-selections'] });
      queryClient.invalidateQueries({ queryKey: ['design-completeness'] });
      toast.success('Pump selection deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
