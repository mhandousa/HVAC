import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface VRFSystem {
  id: string;
  organization_id: string;
  project_id: string | null;
  system_name: string;
  system_tag: string | null;
  refrigerant_type: string;
  system_type: 'heat_pump' | 'heat_recovery';
  outdoor_unit_capacity_kw: number | null;
  outdoor_unit_capacity_tons: number | null;
  outdoor_unit_model: string | null;
  outdoor_unit_manufacturer: string | null;
  number_of_outdoor_units: number;
  max_piping_length_ft: number | null;
  max_piping_length_actual_ft: number | null;
  max_elevation_diff_ft: number | null;
  actual_elevation_diff_ft: number | null;
  first_branch_max_length_ft: number | null;
  total_indoor_capacity_kw: number | null;
  total_indoor_capacity_tons: number | null;
  capacity_ratio: number | null;
  total_liquid_line_length_ft: number | null;
  total_suction_line_length_ft: number | null;
  oil_return_verified: boolean;
  oil_return_notes: string | null;
  notes: string | null;
  status: 'draft' | 'in_review' | 'approved' | 'issued';
  revision: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface VRFIndoorUnit {
  id: string;
  vrf_system_id: string;
  unit_tag: string;
  unit_type: 'wall_mounted' | 'ceiling_cassette' | 'ducted' | 'floor_standing' | 'ceiling_suspended' | 'console';
  zone_name: string | null;
  zone_id: string | null;
  cooling_capacity_kw: number;
  cooling_capacity_btu: number | null;
  heating_capacity_kw: number | null;
  model_number: string | null;
  liquid_line_length_ft: number;
  suction_line_length_ft: number | null;
  elevation_from_outdoor_ft: number;
  is_above_outdoor: boolean;
  liquid_line_size_in: number | null;
  suction_line_size_in: number | null;
  branch_selector_id: string | null;
  parent_unit_id: string | null;
  connection_type: 'direct' | 'branch' | 'sub-branch';
  liquid_line_equiv_length_ft: number;
  suction_line_equiv_length_ft: number;
  liquid_line_pressure_drop_psi: number | null;
  suction_line_pressure_drop_psi: number | null;
  liquid_velocity_fps: number | null;
  suction_velocity_fps: number | null;
  oil_return_ok: boolean | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface VRFBranchSelector {
  id: string;
  vrf_system_id: string;
  selector_tag: string;
  selector_model: string | null;
  capacity_kw: number | null;
  distance_from_outdoor_ft: number | null;
  elevation_from_outdoor_ft: number;
  liquid_line_size_in: number | null;
  suction_line_size_in: number | null;
  discharge_line_size_in: number | null;
  connected_unit_count: number;
  total_connected_capacity_kw: number | null;
  sort_order: number;
  created_at: string;
}

export interface VRFPipingSegment {
  id: string;
  vrf_system_id: string;
  segment_name: string;
  segment_type: 'main' | 'branch' | 'sub-branch' | 'header';
  line_type: 'liquid' | 'suction' | 'discharge';
  length_ft: number;
  equivalent_length_ft: number | null;
  elevation_change_ft: number;
  is_riser: boolean;
  nominal_size_in: number | null;
  capacity_served_kw: number | null;
  refrigerant_flow_lb_hr: number | null;
  velocity_fps: number | null;
  pressure_drop_psi: number | null;
  min_oil_return_velocity_fps: number | null;
  oil_return_verified: boolean | null;
  parent_segment_id: string | null;
  from_component_type: string | null;
  from_component_id: string | null;
  to_component_type: string | null;
  to_component_id: string | null;
  sort_order: number;
  created_at: string;
}

export function useVRFSystems(projectId?: string) {
  const { data: organization } = useOrganization();
  
  return useQuery({
    queryKey: ['vrf-systems', organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      let query = supabase
        .from('vrf_systems')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as VRFSystem[];
    },
    enabled: !!organization?.id,
  });
}

export function useVRFSystem(systemId?: string) {
  return useQuery({
    queryKey: ['vrf-system', systemId],
    queryFn: async () => {
      if (!systemId) return null;
      
      const { data, error } = await supabase
        .from('vrf_systems')
        .select('*')
        .eq('id', systemId)
        .single();
      
      if (error) throw error;
      return data as VRFSystem;
    },
    enabled: !!systemId,
  });
}

export function useVRFIndoorUnits(systemId: string) {
  return useQuery({
    queryKey: ['vrf-indoor-units', systemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vrf_indoor_units')
        .select('*')
        .eq('vrf_system_id', systemId)
        .order('sort_order');
      
      if (error) throw error;
      return data as VRFIndoorUnit[];
    },
    enabled: !!systemId,
  });
}

export function useVRFBranchSelectors(systemId: string) {
  return useQuery({
    queryKey: ['vrf-branch-selectors', systemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vrf_branch_selectors')
        .select('*')
        .eq('vrf_system_id', systemId)
        .order('sort_order');
      
      if (error) throw error;
      return data as VRFBranchSelector[];
    },
    enabled: !!systemId,
  });
}

export function useVRFPipingSegments(systemId: string) {
  return useQuery({
    queryKey: ['vrf-piping-segments', systemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vrf_piping_segments')
        .select('*')
        .eq('vrf_system_id', systemId)
        .order('sort_order');
      
      if (error) throw error;
      return data as VRFPipingSegment[];
    },
    enabled: !!systemId,
  });
}

export function useCreateVRFSystem() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();
  
  return useMutation({
    mutationFn: async (data: Partial<VRFSystem>) => {
      if (!organization?.id) throw new Error('No organization');
      
      const { data: result, error } = await supabase
        .from('vrf_systems')
        .insert({
          system_name: data.system_name || 'Untitled VRF System',
          refrigerant_type: data.refrigerant_type || 'R410A',
          system_type: data.system_type || 'heat_pump',
          organization_id: organization.id,
          project_id: data.project_id,
          system_tag: data.system_tag,
          outdoor_unit_capacity_kw: data.outdoor_unit_capacity_kw,
          outdoor_unit_capacity_tons: data.outdoor_unit_capacity_tons,
          outdoor_unit_model: data.outdoor_unit_model,
          outdoor_unit_manufacturer: data.outdoor_unit_manufacturer,
          number_of_outdoor_units: data.number_of_outdoor_units ?? 1,
          max_piping_length_ft: data.max_piping_length_ft,
          max_elevation_diff_ft: data.max_elevation_diff_ft,
          first_branch_max_length_ft: data.first_branch_max_length_ft,
          notes: data.notes,
          status: data.status || 'draft',
          revision: data.revision || 'A',
        })
        .select()
        .single();
      
      if (error) throw error;
      return result as VRFSystem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vrf-systems'] });
      toast.success('VRF system created');
    },
    onError: (error) => {
      toast.error('Failed to create VRF system: ' + error.message);
    },
  });
}

export function useUpdateVRFSystem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<VRFSystem> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('vrf_systems')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result as VRFSystem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vrf-systems'] });
      queryClient.invalidateQueries({ queryKey: ['vrf-system', data.id] });
      toast.success('VRF system updated');
    },
    onError: (error) => {
      toast.error('Failed to update VRF system: ' + error.message);
    },
  });
}

export function useDeleteVRFSystem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vrf_systems')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vrf-systems'] });
      toast.success('VRF system deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete VRF system: ' + error.message);
    },
  });
}

export function useAddIndoorUnit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<VRFIndoorUnit>) => {
      const { data: result, error } = await supabase
        .from('vrf_indoor_units')
        .insert({
          vrf_system_id: data.vrf_system_id!,
          unit_tag: data.unit_tag || 'IDU-01',
          unit_type: data.unit_type || 'ceiling_cassette',
          cooling_capacity_kw: data.cooling_capacity_kw ?? 0,
          liquid_line_length_ft: data.liquid_line_length_ft ?? 0,
          elevation_from_outdoor_ft: data.elevation_from_outdoor_ft ?? 0,
          liquid_line_equiv_length_ft: data.liquid_line_equiv_length_ft ?? 0,
          suction_line_equiv_length_ft: data.suction_line_equiv_length_ft ?? 0,
          zone_name: data.zone_name,
          zone_id: data.zone_id,
          cooling_capacity_btu: data.cooling_capacity_btu,
          heating_capacity_kw: data.heating_capacity_kw,
          model_number: data.model_number,
          suction_line_length_ft: data.suction_line_length_ft,
          is_above_outdoor: data.is_above_outdoor ?? true,
          branch_selector_id: data.branch_selector_id,
          connection_type: data.connection_type || 'direct',
          sort_order: data.sort_order ?? 0,
        })
        .select()
        .single();
      
      if (error) throw error;
      return result as VRFIndoorUnit;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vrf-indoor-units', data.vrf_system_id] });
      toast.success('Indoor unit added');
    },
    onError: (error) => {
      toast.error('Failed to add indoor unit: ' + error.message);
    },
  });
}

export function useUpdateIndoorUnit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<VRFIndoorUnit> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('vrf_indoor_units')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result as VRFIndoorUnit;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vrf-indoor-units', data.vrf_system_id] });
      toast.success('Indoor unit updated');
    },
    onError: (error) => {
      toast.error('Failed to update indoor unit: ' + error.message);
    },
  });
}

export function useRemoveIndoorUnit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, systemId }: { id: string; systemId: string }) => {
      const { error } = await supabase
        .from('vrf_indoor_units')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return systemId;
    },
    onSuccess: (systemId) => {
      queryClient.invalidateQueries({ queryKey: ['vrf-indoor-units', systemId] });
      toast.success('Indoor unit removed');
    },
    onError: (error) => {
      toast.error('Failed to remove indoor unit: ' + error.message);
    },
  });
}

export function useAddBranchSelector() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<VRFBranchSelector>) => {
      const { data: result, error } = await supabase
        .from('vrf_branch_selectors')
        .insert({
          vrf_system_id: data.vrf_system_id!,
          selector_tag: data.selector_tag || 'BS-01',
          elevation_from_outdoor_ft: data.elevation_from_outdoor_ft ?? 0,
          connected_unit_count: data.connected_unit_count ?? 0,
          sort_order: data.sort_order ?? 0,
          selector_model: data.selector_model,
          capacity_kw: data.capacity_kw,
          distance_from_outdoor_ft: data.distance_from_outdoor_ft,
          liquid_line_size_in: data.liquid_line_size_in,
          suction_line_size_in: data.suction_line_size_in,
          discharge_line_size_in: data.discharge_line_size_in,
          total_connected_capacity_kw: data.total_connected_capacity_kw,
        })
        .select()
        .single();
      
      if (error) throw error;
      return result as VRFBranchSelector;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vrf-branch-selectors', data.vrf_system_id] });
      toast.success('Branch selector added');
    },
    onError: (error) => {
      toast.error('Failed to add branch selector: ' + error.message);
    },
  });
}

export function useUpdateBranchSelector() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<VRFBranchSelector> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('vrf_branch_selectors')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result as VRFBranchSelector;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vrf-branch-selectors', data.vrf_system_id] });
      toast.success('Branch selector updated');
    },
    onError: (error) => {
      toast.error('Failed to update branch selector: ' + error.message);
    },
  });
}

export function useRemoveBranchSelector() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, systemId }: { id: string; systemId: string }) => {
      const { error } = await supabase
        .from('vrf_branch_selectors')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return systemId;
    },
    onSuccess: (systemId) => {
      queryClient.invalidateQueries({ queryKey: ['vrf-branch-selectors', systemId] });
      toast.success('Branch selector removed');
    },
    onError: (error) => {
      toast.error('Failed to remove branch selector: ' + error.message);
    },
  });
}

export function useSavePipingSegments() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ systemId, segments }: { systemId: string; segments: Partial<VRFPipingSegment>[] }) => {
      // Delete existing segments
      await supabase
        .from('vrf_piping_segments')
        .delete()
        .eq('vrf_system_id', systemId);
      
      // Insert new segments
      if (segments.length > 0) {
        const { error } = await supabase
          .from('vrf_piping_segments')
          .insert(segments.map(s => ({
            vrf_system_id: systemId,
            segment_name: s.segment_name || 'Segment',
            segment_type: s.segment_type || 'main',
            line_type: s.line_type || 'liquid',
            length_ft: s.length_ft ?? 0,
            elevation_change_ft: s.elevation_change_ft ?? 0,
            is_riser: s.is_riser ?? false,
            sort_order: s.sort_order ?? 0,
            equivalent_length_ft: s.equivalent_length_ft,
            nominal_size_in: s.nominal_size_in,
            capacity_served_kw: s.capacity_served_kw,
            refrigerant_flow_lb_hr: s.refrigerant_flow_lb_hr,
            velocity_fps: s.velocity_fps,
            pressure_drop_psi: s.pressure_drop_psi,
            min_oil_return_velocity_fps: s.min_oil_return_velocity_fps,
            oil_return_verified: s.oil_return_verified,
            parent_segment_id: s.parent_segment_id,
            from_component_type: s.from_component_type,
            from_component_id: s.from_component_id,
            to_component_type: s.to_component_type,
            to_component_id: s.to_component_id,
          })));
        
        if (error) throw error;
      }
      
      return systemId;
    },
    onSuccess: (systemId) => {
      queryClient.invalidateQueries({ queryKey: ['vrf-piping-segments', systemId] });
      toast.success('Piping segments saved');
    },
    onError: (error) => {
      toast.error('Failed to save piping segments: ' + error.message);
    },
  });
}
