import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CreateEnergyReadingInput {
  meter_id: string;
  recorded_at: string;
  value: number;
  consumption?: number;
  demand_kw?: number;
  power_factor?: number;
  outside_air_temp_f?: number;
  source?: string;
  quality?: string;
}

export function useCreateEnergyReading() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateEnergyReadingInput) => {
      const { data, error } = await supabase
        .from("energy_readings")
        .insert({
          meter_id: input.meter_id,
          recorded_at: input.recorded_at,
          value: input.value,
          consumption: input.consumption,
          demand_kw: input.demand_kw,
          power_factor: input.power_factor,
          outside_air_temp_f: input.outside_air_temp_f,
          source: input.source || 'manual',
          quality: input.quality || 'verified',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["energy-readings"] });
      queryClient.invalidateQueries({ queryKey: ["energy-daily-aggregates"] });
      toast({
        title: "Reading recorded",
        description: "Energy reading has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error recording reading",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
