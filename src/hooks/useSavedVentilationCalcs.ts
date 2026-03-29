import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface VentilationCalculation {
  id: string;
  organization_id: string;
  project_id: string | null;
  calculation_name: string;
  diversity_factor: number | null;
  supply_air_cfm: number | null;
  total_floor_area_sqft: number | null;
  total_occupancy: number | null;
  total_vbz_cfm: number | null;
  total_voz_cfm: number | null;
  system_outdoor_air_cfm: number | null;
  system_outdoor_air_percent: number | null;
  system_efficiency: number | null;
  outdoor_air_mass_flow_lb_hr: number | null;
  status: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface VentilationZoneResult {
  id: string;
  ventilation_calculation_id: string;
  zone_id: string | null;
  zone_name: string;
  space_type_id: string | null;
  floor_area_sqft: number | null;
  occupancy: number | null;
  default_occupancy: number | null;
  rp_cfm_person: number | null;
  ra_cfm_sqft: number | null;
  vbz_cfm: number | null;
  ez: number | null;
  voz_cfm: number | null;
  supply_location: string | null;
  return_location: string | null;
  operating_mode: string | null;
  created_at: string;
}

export interface VentilationCalculationWithZones extends VentilationCalculation {
  ventilation_zone_results: VentilationZoneResult[];
}

export interface VentilationCalculationInput {
  project_id?: string | null;
  calculation_name: string;
  diversity_factor?: number;
  supply_air_cfm?: number;
  total_floor_area_sqft?: number;
  total_occupancy?: number;
  total_vbz_cfm?: number;
  total_voz_cfm?: number;
  system_outdoor_air_cfm?: number;
  system_outdoor_air_percent?: number;
  system_efficiency?: number;
  outdoor_air_mass_flow_lb_hr?: number;
  status?: string;
  notes?: string;
}

export interface VentilationZoneResultInput {
  zone_id?: string | null;
  zone_name: string;
  space_type_id?: string;
  floor_area_sqft?: number;
  occupancy?: number;
  default_occupancy?: number;
  rp_cfm_person?: number;
  ra_cfm_sqft?: number;
  vbz_cfm?: number;
  ez?: number;
  voz_cfm?: number;
  supply_location?: string;
  return_location?: string;
  operating_mode?: string;
}

export function useSavedVentilationCalcs(projectId?: string) {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['ventilation-calculations', projectId, organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      let q = supabase
        .from('ventilation_calculations')
        .select(`
          *,
          ventilation_zone_results (*)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (projectId) {
        q = q.eq('project_id', projectId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as VentilationCalculationWithZones[];
    },
    enabled: !!organization?.id,
  });

  const saveCalculation = useMutation({
    mutationFn: async (data: {
      calculation: VentilationCalculationInput;
      zoneResults: VentilationZoneResultInput[];
    }) => {
      if (!organization?.id) throw new Error('No organization');

      const { data: user } = await supabase.auth.getUser();

      // Insert calculation
      const { data: calc, error: calcError } = await supabase
        .from('ventilation_calculations')
        .insert({
          ...data.calculation,
          organization_id: organization.id,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (calcError) throw calcError;

      // Insert zone results
      if (data.zoneResults.length > 0) {
        const zoneResultsWithCalcId = data.zoneResults.map(zr => ({
          ...zr,
          ventilation_calculation_id: calc.id,
        }));

        const { error: zonesError } = await supabase
          .from('ventilation_zone_results')
          .insert(zoneResultsWithCalcId);

        if (zonesError) throw zonesError;
      }

      return calc as VentilationCalculation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventilation-calculations'] });
      toast.success('Ventilation calculation saved');
    },
    onError: (error) => {
      console.error('Error saving ventilation calculation:', error);
      toast.error('Failed to save calculation');
    },
  });

  const updateCalculation = useMutation({
    mutationFn: async (data: {
      id: string;
      calculation: Partial<VentilationCalculationInput>;
      zoneResults?: VentilationZoneResultInput[];
    }) => {
      // Update calculation
      const { error: calcError } = await supabase
        .from('ventilation_calculations')
        .update(data.calculation)
        .eq('id', data.id);

      if (calcError) throw calcError;

      // If zone results provided, replace them
      if (data.zoneResults) {
        // Delete existing zone results
        const { error: deleteError } = await supabase
          .from('ventilation_zone_results')
          .delete()
          .eq('ventilation_calculation_id', data.id);

        if (deleteError) throw deleteError;

        // Insert new zone results
        if (data.zoneResults.length > 0) {
          const zoneResultsWithCalcId = data.zoneResults.map(zr => ({
            ...zr,
            ventilation_calculation_id: data.id,
          }));

          const { error: insertError } = await supabase
            .from('ventilation_zone_results')
            .insert(zoneResultsWithCalcId);

          if (insertError) throw insertError;
        }
      }

      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventilation-calculations'] });
      toast.success('Calculation updated');
    },
    onError: (error) => {
      console.error('Error updating ventilation calculation:', error);
      toast.error('Failed to update calculation');
    },
  });

  const deleteCalculation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ventilation_calculations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventilation-calculations'] });
      toast.success('Calculation deleted');
    },
    onError: (error) => {
      console.error('Error deleting ventilation calculation:', error);
      toast.error('Failed to delete calculation');
    },
  });

  return {
    calculations: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    saveCalculation,
    updateCalculation,
    deleteCalculation,
    refetch: query.refetch,
  };
}

// Hook to get ventilation calculations linked to specific zones
export function useZoneVentilationCalcs(zoneIds: string[]) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['zone-ventilation-calcs', zoneIds, organization?.id],
    queryFn: async () => {
      if (!organization?.id || zoneIds.length === 0) return [];

      const { data, error } = await supabase
        .from('ventilation_zone_results')
        .select(`
          zone_id,
          ventilation_calculation_id,
          voz_cfm,
          vbz_cfm,
          ventilation_calculations (
            id,
            calculation_name,
            project_id,
            status
          )
        `)
        .in('zone_id', zoneIds);

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id && zoneIds.length > 0,
  });
}
