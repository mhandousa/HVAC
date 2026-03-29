import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EnergyMeter {
  id: string;
  organization_id: string;
  project_id: string | null;
  equipment_id: string | null;
  zone_id: string | null;
  name: string;
  meter_tag: string;
  serial_number: string | null;
  system_type: string;
  meter_type: string;
  unit: string;
  ct_ratio: number | null;
  pulse_factor: number | null;
  cost_per_unit: number | null;
  demand_cost_per_kw: number | null;
  status: string;
  is_main_meter: boolean | null;
  created_at: string;
  updated_at: string;
}

export type SystemType = 'chiller' | 'ahu' | 'pump' | 'cooling_tower' | 'boiler' | 'fan' | 'lighting' | 'plug_load' | 'other';
export type MeterType = 'electric' | 'gas' | 'water' | 'steam' | 'chilled_water' | 'hot_water';
export type MeterStatus = 'active' | 'inactive' | 'maintenance' | 'fault';

export function useEnergyMeters(projectId?: string) {
  return useQuery({
    queryKey: ['energy-meters', projectId],
    queryFn: async () => {
      let query = supabase
        .from('energy_meters')
        .select('*')
        .order('name');

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EnergyMeter[];
    },
  });
}

export function useEnergyMeter(meterId: string | undefined) {
  return useQuery({
    queryKey: ['energy-meter', meterId],
    queryFn: async () => {
      if (!meterId) return null;
      const { data, error } = await supabase
        .from('energy_meters')
        .select('*')
        .eq('id', meterId)
        .single();
      if (error) throw error;
      return data as EnergyMeter;
    },
    enabled: !!meterId,
  });
}

export function useCreateEnergyMeter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (meter: Omit<EnergyMeter, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('energy_meters')
        .insert(meter)
        .select()
        .single();
      if (error) throw error;
      return data as EnergyMeter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energy-meters'] });
      toast({ title: 'Energy meter created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create energy meter', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateEnergyMeter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EnergyMeter> & { id: string }) => {
      const { data, error } = await supabase
        .from('energy_meters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as EnergyMeter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energy-meters'] });
      queryClient.invalidateQueries({ queryKey: ['energy-meter'] });
      toast({ title: 'Energy meter updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update energy meter', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteEnergyMeter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (meterId: string) => {
      const { error } = await supabase
        .from('energy_meters')
        .delete()
        .eq('id', meterId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energy-meters'] });
      toast({ title: 'Energy meter deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete energy meter', description: error.message, variant: 'destructive' });
    },
  });
}
