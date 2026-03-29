import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from './useOrganization';
import type { Json } from '@/integrations/supabase/types';

export interface BoilerSelection {
  id: string;
  organization_id: string;
  project_id: string | null;
  hot_water_plant_id: string | null;
  boiler_catalog_id: string | null;
  selection_name: string;
  boiler_tag: string | null;
  status: string | null;
  notes: string | null;
  boiler_type: string | null;
  fuel_type: string | null;
  manufacturer: string | null;
  model_number: string | null;
  required_capacity_btuh: number | null;
  selected_capacity_btuh: number | null;
  turndown_ratio: number | null;
  afue: number | null;
  thermal_efficiency: number | null;
  efficiency_analysis: Json | null;
  annual_fuel_consumption: Json | null;
  fit_score: number | null;
  hw_supply_temp_f: number | null;
  hw_return_temp_f: number | null;
  hw_flow_gpm: number | null;
  voltage: string | null;
  power_input_kw: number | null;
  full_load_amps: number | null;
  asme_certified: boolean | null;
  ahri_certified: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
}

export type CreateBoilerSelectionInput = Omit<
  BoilerSelection,
  'id' | 'organization_id' | 'created_at' | 'updated_at' | 'created_by'
>;

export type UpdateBoilerSelectionInput = Partial<CreateBoilerSelectionInput> & {
  id: string;
};

// Query keys for cache invalidation
const BOILER_SELECTIONS_KEY = 'boiler-selections';

/**
 * Fetch all boiler selections for the organization, optionally filtered by project
 */
export function useBoilerSelections(projectId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: [BOILER_SELECTIONS_KEY, organization?.id, projectId],
    queryFn: async (): Promise<BoilerSelection[]> => {
      if (!organization?.id) return [];

      let query = supabase
        .from('boiler_selections')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching boiler selections:', error);
        throw error;
      }

      return (data || []) as BoilerSelection[];
    },
    enabled: !!organization?.id,
  });
}

/**
 * Fetch boiler selections linked to a specific hot water plant
 */
export function useBoilerSelectionsByPlant(hwPlantId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: [BOILER_SELECTIONS_KEY, 'by-plant', hwPlantId],
    queryFn: async (): Promise<BoilerSelection[]> => {
      if (!hwPlantId || !organization?.id) return [];

      const { data, error } = await supabase
        .from('boiler_selections')
        .select('*')
        .eq('hot_water_plant_id', hwPlantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching boiler selections by plant:', error);
        throw error;
      }

      return (data || []) as BoilerSelection[];
    },
    enabled: !!hwPlantId && !!organization?.id,
  });
}

/**
 * Fetch a single boiler selection by ID
 */
export function useBoilerSelection(id?: string) {
  return useQuery({
    queryKey: [BOILER_SELECTIONS_KEY, 'single', id],
    queryFn: async (): Promise<BoilerSelection | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('boiler_selections')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching boiler selection:', error);
        throw error;
      }

      return data as BoilerSelection;
    },
    enabled: !!id,
  });
}

/**
 * Create a new boiler selection
 */
export function useCreateBoilerSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreateBoilerSelectionInput): Promise<BoilerSelection> => {
      if (!organization?.id) {
        throw new Error('Organization not found');
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('boiler_selections')
        .insert({
          ...input,
          organization_id: organization.id,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating boiler selection:', error);
        throw error;
      }

      return data as BoilerSelection;
    },
    onSuccess: (data) => {
      // Invalidate all boiler selection queries
      queryClient.invalidateQueries({ queryKey: [BOILER_SELECTIONS_KEY] });
      
      toast({
        title: 'Boiler Selection Saved',
        description: `${data.selection_name} has been created successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create boiler selection. Please try again.',
        variant: 'destructive',
      });
      console.error('Create boiler selection error:', error);
    },
  });
}

/**
 * Update an existing boiler selection
 */
export function useUpdateBoilerSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateBoilerSelectionInput): Promise<BoilerSelection> => {
      const { data, error } = await supabase
        .from('boiler_selections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating boiler selection:', error);
        throw error;
      }

      return data as BoilerSelection;
    },
    onSuccess: (data) => {
      // Invalidate all boiler selection queries
      queryClient.invalidateQueries({ queryKey: [BOILER_SELECTIONS_KEY] });
      
      toast({
        title: 'Boiler Selection Updated',
        description: `${data.selection_name} has been updated successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update boiler selection. Please try again.',
        variant: 'destructive',
      });
      console.error('Update boiler selection error:', error);
    },
  });
}

/**
 * Delete a boiler selection
 */
export function useDeleteBoilerSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('boiler_selections')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting boiler selection:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate all boiler selection queries
      queryClient.invalidateQueries({ queryKey: [BOILER_SELECTIONS_KEY] });
      
      toast({
        title: 'Boiler Selection Deleted',
        description: 'The boiler selection has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete boiler selection. Please try again.',
        variant: 'destructive',
      });
      console.error('Delete boiler selection error:', error);
    },
  });
}
