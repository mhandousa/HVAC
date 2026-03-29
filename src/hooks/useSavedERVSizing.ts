import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface ERVSizingCalculation {
  id: string;
  organization_id: string;
  project_id: string | null;
  zone_id: string | null;
  calculation_name: string;
  city: string | null;
  erv_type: string | null;
  outdoor_air_cfm: number | null;
  sensible_efficiency_percent: number | null;
  latent_efficiency_percent: number | null;
  outdoor_temp_f: number | null;
  outdoor_rh_percent: number | null;
  indoor_temp_f: number | null;
  indoor_rh_percent: number | null;
  sensible_recovery_btuh: number | null;
  latent_recovery_btuh: number | null;
  total_recovery_btuh: number | null;
  load_reduction_percent: number | null;
  annual_energy_savings_kwh: number | null;
  annual_cost_savings_sar: number | null;
  operating_hours_per_year: number | null;
  electricity_rate_sar: number | null;
  cooling_cop: number | null;
  heating_cop: number | null;
  design_mode: string | null;
  is_recovery_beneficial: boolean | null;
  status: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ERVAnnualSimulation {
  id: string;
  erv_calculation_id: string;
  month: number;
  cooling_recovery_kwh: number | null;
  heating_recovery_kwh: number | null;
  cost_savings_sar: number | null;
  avg_outdoor_temp_c: number | null;
  operating_hours: number | null;
  created_at: string;
}

export interface ERVCalculationWithSimulations extends ERVSizingCalculation {
  erv_annual_simulations: ERVAnnualSimulation[];
}

export interface ERVCalculationInput {
  project_id?: string | null;
  zone_id?: string | null;
  calculation_name: string;
  city?: string;
  erv_type?: string;
  outdoor_air_cfm?: number;
  sensible_efficiency_percent?: number;
  latent_efficiency_percent?: number;
  outdoor_temp_f?: number;
  outdoor_rh_percent?: number;
  indoor_temp_f?: number;
  indoor_rh_percent?: number;
  sensible_recovery_btuh?: number;
  latent_recovery_btuh?: number;
  total_recovery_btuh?: number;
  load_reduction_percent?: number;
  annual_energy_savings_kwh?: number;
  annual_cost_savings_sar?: number;
  operating_hours_per_year?: number;
  electricity_rate_sar?: number;
  cooling_cop?: number;
  heating_cop?: number;
  design_mode?: string;
  is_recovery_beneficial?: boolean;
  status?: string;
  notes?: string;
}

export interface ERVAnnualSimulationInput {
  month: number;
  cooling_recovery_kwh?: number;
  heating_recovery_kwh?: number;
  cost_savings_sar?: number;
  avg_outdoor_temp_c?: number;
  operating_hours?: number;
}

export function useSavedERVSizing(projectId?: string, zoneId?: string) {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['erv-calculations', projectId, zoneId, organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      let q = supabase
        .from('erv_sizing_calculations')
        .select(`
          *,
          erv_annual_simulations (*)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (projectId) {
        q = q.eq('project_id', projectId);
      }

      if (zoneId) {
        q = q.eq('zone_id', zoneId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as ERVCalculationWithSimulations[];
    },
    enabled: !!organization?.id,
  });

  const saveCalculation = useMutation({
    mutationFn: async (data: ERVCalculationInput) => {
      if (!organization?.id) throw new Error('No organization');

      const { data: user } = await supabase.auth.getUser();

      const { data: calc, error } = await supabase
        .from('erv_sizing_calculations')
        .insert({
          ...data,
          organization_id: organization.id,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return calc as ERVSizingCalculation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erv-calculations'] });
      toast.success('ERV calculation saved');
    },
    onError: (error) => {
      console.error('Error saving ERV calculation:', error);
      toast.error('Failed to save calculation');
    },
  });

  const saveWithSimulation = useMutation({
    mutationFn: async (data: {
      calculation: ERVCalculationInput;
      monthlyData: ERVAnnualSimulationInput[];
    }) => {
      if (!organization?.id) throw new Error('No organization');

      const { data: user } = await supabase.auth.getUser();

      // Insert calculation
      const { data: calc, error: calcError } = await supabase
        .from('erv_sizing_calculations')
        .insert({
          ...data.calculation,
          organization_id: organization.id,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (calcError) throw calcError;

      // Insert monthly data
      if (data.monthlyData.length > 0) {
        const monthlyWithCalcId = data.monthlyData.map(m => ({
          ...m,
          erv_calculation_id: calc.id,
        }));

        const { error: monthlyError } = await supabase
          .from('erv_annual_simulations')
          .insert(monthlyWithCalcId);

        if (monthlyError) throw monthlyError;
      }

      return calc as ERVSizingCalculation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erv-calculations'] });
      toast.success('ERV calculation with simulation saved');
    },
    onError: (error) => {
      console.error('Error saving ERV calculation:', error);
      toast.error('Failed to save calculation');
    },
  });

  const updateCalculation = useMutation({
    mutationFn: async (data: {
      id: string;
      calculation: Partial<ERVCalculationInput>;
      monthlyData?: ERVAnnualSimulationInput[];
    }) => {
      // Update calculation
      const { error: calcError } = await supabase
        .from('erv_sizing_calculations')
        .update(data.calculation)
        .eq('id', data.id);

      if (calcError) throw calcError;

      // If monthly data provided, replace it
      if (data.monthlyData) {
        // Delete existing monthly data
        const { error: deleteError } = await supabase
          .from('erv_annual_simulations')
          .delete()
          .eq('erv_calculation_id', data.id);

        if (deleteError) throw deleteError;

        // Insert new monthly data
        if (data.monthlyData.length > 0) {
          const monthlyWithCalcId = data.monthlyData.map(m => ({
            ...m,
            erv_calculation_id: data.id,
          }));

          const { error: insertError } = await supabase
            .from('erv_annual_simulations')
            .insert(monthlyWithCalcId);

          if (insertError) throw insertError;
        }
      }

      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erv-calculations'] });
      toast.success('Calculation updated');
    },
    onError: (error) => {
      console.error('Error updating ERV calculation:', error);
      toast.error('Failed to update calculation');
    },
  });

  const deleteCalculation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('erv_sizing_calculations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erv-calculations'] });
      toast.success('Calculation deleted');
    },
    onError: (error) => {
      console.error('Error deleting ERV calculation:', error);
      toast.error('Failed to delete calculation');
    },
  });

  return {
    calculations: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    saveCalculation,
    saveWithSimulation,
    updateCalculation,
    deleteCalculation,
    refetch: query.refetch,
  };
}

// Hook to get ERV calculations linked to specific zones
export function useZoneERVCalcs(zoneIds: string[]) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['zone-erv-calcs', zoneIds, organization?.id],
    queryFn: async () => {
      if (!organization?.id || zoneIds.length === 0) return [];

      const { data, error } = await supabase
        .from('erv_sizing_calculations')
        .select(`
          id,
          zone_id,
          calculation_name,
          erv_type,
          outdoor_air_cfm,
          total_recovery_btuh,
          annual_energy_savings_kwh,
          status
        `)
        .in('zone_id', zoneIds);

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id && zoneIds.length > 0,
  });
}
