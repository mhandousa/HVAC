import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface EquipmentSelection {
  id: string;
  organization_id: string;
  project_id: string | null;
  load_calculation_id: string | null;
  zone_id: string | null;
  selection_name: string;
  equipment_category: string | null;
  required_capacity_tons: number | null;
  required_capacity_kw: number | null;
  selected_equipment: Array<{
    catalog_id: string;
    quantity: number;
    notes?: string;
  }>;
  lifecycle_cost_analysis: {
    purchase: number;
    energy: number;
    total: number;
    annualEnergy: number;
  } | null;
  comparison_notes: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useEquipmentSelections(projectId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['equipment-selections', organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('equipment_selections')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        selected_equipment: (Array.isArray(item.selected_equipment) 
          ? item.selected_equipment 
          : []) as EquipmentSelection['selected_equipment'],
        lifecycle_cost_analysis: item.lifecycle_cost_analysis as EquipmentSelection['lifecycle_cost_analysis'],
      })) as unknown as EquipmentSelection[];
    },
    enabled: !!organization?.id,
  });
}

export function useEquipmentSelection(selectionId?: string) {
  return useQuery({
    queryKey: ['equipment-selection', selectionId],
    queryFn: async () => {
      if (!selectionId) return null;

      const { data, error } = await supabase
        .from('equipment_selections')
        .select('*')
        .eq('id', selectionId)
        .single();

      if (error) throw error;
      
      return {
        ...data,
        selected_equipment: (Array.isArray(data.selected_equipment) 
          ? data.selected_equipment 
          : []) as EquipmentSelection['selected_equipment'],
        lifecycle_cost_analysis: data.lifecycle_cost_analysis as EquipmentSelection['lifecycle_cost_analysis'],
      } as unknown as EquipmentSelection;
    },
    enabled: !!selectionId,
  });
}

export function useCreateEquipmentSelection() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async (selection: {
      selection_name: string;
      equipment_category?: string;
      required_capacity_tons?: number;
      required_capacity_kw?: number;
      selected_equipment?: Array<{ catalog_id: string; quantity: number; notes?: string }>;
      lifecycle_cost_analysis?: object;
      comparison_notes?: string;
      project_id?: string;
      load_calculation_id?: string;
      zone_id?: string;
      status?: string;
    }) => {
      if (!organization?.id) throw new Error('No organization');

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id || '')
        .maybeSingle();

      const insertData = {
        selection_name: selection.selection_name,
        organization_id: organization.id,
        equipment_category: selection.equipment_category || null,
        required_capacity_tons: selection.required_capacity_tons || null,
        required_capacity_kw: selection.required_capacity_kw || null,
        selected_equipment: (selection.selected_equipment || []) as Json,
        lifecycle_cost_analysis: (selection.lifecycle_cost_analysis || null) as Json,
        comparison_notes: selection.comparison_notes || null,
        project_id: selection.project_id || null,
        load_calculation_id: selection.load_calculation_id || null,
        zone_id: selection.zone_id || null,
        status: selection.status || 'draft',
        created_by: profile?.id || null,
      };

      const { data, error } = await supabase
        .from('equipment_selections')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return data as unknown as EquipmentSelection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-selections'] });
      toast.success('Equipment selection saved');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateEquipmentSelection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EquipmentSelection> & { id: string }) => {
      const { data, error } = await supabase
        .from('equipment_selections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-selections'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-selection'] });
      toast.success('Selection updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteEquipmentSelection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('equipment_selections')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-selections'] });
      toast.success('Selection deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useApproveEquipmentSelection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id || '')
        .maybeSingle();

      const { data, error } = await supabase
        .from('equipment_selections')
        .update({
          status: 'approved',
          approved_by: profile?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-selections'] });
      toast.success('Selection approved');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
