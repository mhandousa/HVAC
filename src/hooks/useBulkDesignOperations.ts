import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

export type BulkOperationType = 
  | 'apply_load_defaults'
  | 'set_ventilation_rates'
  | 'assign_ahu_system'
  | 'set_terminal_type'
  | 'apply_acoustic_target';

interface BulkOperationResult {
  success: number;
  failed: number;
  errors: { zoneId: string; error: string }[];
}

export function useBulkApplyLoadDefaults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      zoneIds, 
      config,
    }: { 
      zoneIds: string[]; 
      projectId: string;
      config: {
        wall_r_value?: number;
        roof_r_value?: number;
        lighting_wpf?: number;
        equipment_wpf?: number;
      };
    }) => {
      const results: BulkOperationResult = { success: 0, failed: 0, errors: [] };

      for (const zoneId of zoneIds) {
        try {
          // Use type escape to avoid deep instantiation issues
          const loadCalcTable = supabase.from('load_calculations') as any;
          const existingCalcResult = await loadCalcTable.select('id').eq('zone_id', zoneId).maybeSingle();
          const existingCalc = existingCalcResult?.data as { id: string } | null;

          if (existingCalc) {
            const { error } = await loadCalcTable
              .update({
                wall_r_value: config.wall_r_value,
                roof_r_value: config.roof_r_value,
                lighting_power_density: config.lighting_wpf,
                equipment_power_density: config.equipment_wpf,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingCalc.id);

            if (error) throw error;
          }
          // For zones without existing calc, skip (they need full calc first)

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({ 
            zoneId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      return results;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['load-calculations'] });
      if (result.failed === 0) {
        toast.success(`Successfully applied defaults to ${result.success} zones`);
      } else {
        toast.warning(`Applied to ${result.success} zones, ${result.failed} failed`);
      }
    },
    onError: (error) => {
      toast.error(`Bulk operation failed: ${error.message}`);
    },
  });
}

export function useBulkSetVentilationRates() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async ({ 
      zoneIds, 
      projectId,
      config,
    }: { 
      zoneIds: string[]; 
      projectId: string;
      config: {
        space_type: string;
        occupant_density: number;
      };
    }) => {
      if (!organization?.id) throw new Error('Organization not found');

      // ASHRAE 62.1 ventilation rates by space type
      const ventilationRates: Record<string, { cfmPerPerson: number; cfmPerSqft: number }> = {
        office: { cfmPerPerson: 5, cfmPerSqft: 0.06 },
        conference: { cfmPerPerson: 5, cfmPerSqft: 0.06 },
        lobby: { cfmPerPerson: 5, cfmPerSqft: 0.06 },
        retail: { cfmPerPerson: 7.5, cfmPerSqft: 0.12 },
        classroom: { cfmPerPerson: 10, cfmPerSqft: 0.12 },
      };

      const rates = ventilationRates[config.space_type] || ventilationRates.office;
      const results: BulkOperationResult = { success: 0, failed: 0, errors: [] };

      for (const zoneId of zoneIds) {
        try {
          // Get zone area - use type escape
          const zonesTable = supabase.from('zones') as any;
          const zoneResult = await zonesTable.select('area_sqm').eq('id', zoneId).single();
          const zone = zoneResult?.data;

          if (!zone) throw new Error('Zone not found');

          const areaSqft = (zone.area_sqm || 0) * 10.764;
          const occupants = Math.ceil(areaSqft / config.occupant_density);
          const ventilationCfm = Math.round(
            (occupants * rates.cfmPerPerson) + (areaSqft * rates.cfmPerSqft)
          );

          // Check if ventilation calculation exists - use type escape
          const ventCalcTable = supabase.from('ventilation_calculations') as any;
          const existingCalcResult = await ventCalcTable.select('id').eq('zone_id', zoneId).maybeSingle();
          const existingCalc = existingCalcResult?.data as { id: string } | null;

          const ventilationData = {
            rp_cfm_per_person: rates.cfmPerPerson,
            ra_cfm_per_sqft: rates.cfmPerSqft,
            occupancy_count: occupants,
            zone_floor_area_sqft: areaSqft,
            voz_cfm: ventilationCfm,
            space_type: config.space_type,
          };

          if (existingCalc) {
            const { error } = await ventCalcTable
              .update({
                ...ventilationData,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingCalc.id);

            if (error) throw error;
          } else {
            const { error } = await ventCalcTable.insert({
              organization_id: organization.id,
              project_id: projectId,
              zone_id: zoneId,
              calculation_name: `Zone Ventilation Calc`,
              ...ventilationData,
              status: 'completed',
            });

            if (error) throw error;
          }

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({ 
            zoneId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      return results;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['ventilation-calculations'] });
      if (result.failed === 0) {
        toast.success(`Successfully set ventilation rates for ${result.success} zones`);
      } else {
        toast.warning(`Applied to ${result.success} zones, ${result.failed} failed`);
      }
    },
    onError: (error) => {
      toast.error(`Bulk operation failed: ${error.message}`);
    },
  });
}

export function useBulkApplyAcousticTarget() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async ({ 
      zoneIds, 
      config,
    }: { 
      zoneIds: string[]; 
      config: {
        target_nc: number;
      };
    }) => {
      if (!organization?.id) throw new Error('Organization not found');

      const results: BulkOperationResult = { success: 0, failed: 0, errors: [] };

      for (const zoneId of zoneIds) {
        try {
          // Use type escape to avoid deep instantiation issues
          const acousticTable = supabase.from('acoustic_calculations') as any;
          const existingCalcResult = await acousticTable.select('id').eq('zone_id', zoneId).maybeSingle();
          const existingCalc = existingCalcResult?.data as { id: string } | null;

          if (existingCalc) {
            const { error } = await acousticTable
              .update({
                target_nc: config.target_nc,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingCalc.id);

            if (error) throw error;
          }
          // Skip zones without acoustic calculations - they need full setup first

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({ 
            zoneId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      return results;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['acoustic-calculations'] });
      if (result.failed === 0) {
        toast.success(`Successfully set acoustic targets for ${result.success} zones`);
      } else {
        toast.warning(`Applied to ${result.success} zones, ${result.failed} failed`);
      }
    },
    onError: (error) => {
      toast.error(`Bulk operation failed: ${error.message}`);
    },
  });
}

export function useBulkCreateTerminalUnits() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async ({ 
      zoneIds, 
      projectId,
      config,
    }: { 
      zoneIds: string[]; 
      projectId: string;
      config: {
        unit_type: string;
        sizing_factor: number;
      };
    }) => {
      if (!organization?.id) throw new Error('Organization not found');

      const results: BulkOperationResult = { success: 0, failed: 0, errors: [] };

      for (let i = 0; i < zoneIds.length; i++) {
        const zoneId = zoneIds[i];
        
        try {
          // Use type escapes to avoid deep instantiation issues
          const zonesTable = supabase.from('zones') as any;
          const loadCalcTable = supabase.from('load_calculations') as any;
          const terminalTable = supabase.from('terminal_unit_selections') as any;
          
          const zoneResult = await zonesTable.select('name').eq('id', zoneId).single();
          const zone = zoneResult?.data;

          const loadCalcResult = await loadCalcTable
            .select('cfm_required, cooling_load_btuh, heating_load_btuh')
            .eq('zone_id', zoneId)
            .maybeSingle();
          const loadCalc = loadCalcResult?.data;

          const zonePrefix = zone?.name?.substring(0, 3).toUpperCase() || 'ZN';
          const unitTag = `${config.unit_type.startsWith('vav') ? 'VAV' : 'FCU'}-${zonePrefix}-${String(i + 1).padStart(2, '0')}`;
          
          const cfm = Math.round((loadCalc?.cfm_required || 0) * config.sizing_factor);

          const { error } = await terminalTable.insert({
            organization_id: organization.id,
            project_id: projectId,
            zone_id: zoneId,
            unit_tag: unitTag,
            unit_type: config.unit_type,
            supply_cfm: cfm,
            min_cfm: Math.round(cfm * 0.3),
            max_cfm: cfm,
            cooling_load_btuh: loadCalc?.cooling_load_btuh,
            heating_load_btuh: loadCalc?.heating_load_btuh,
            quantity: 1,
            status: 'draft',
          });

          if (error) throw error;
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({ 
            zoneId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      return results;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['terminal-unit-selections'] });
      if (result.failed === 0) {
        toast.success(`Successfully created ${result.success} terminal units`);
      } else {
        toast.warning(`Created ${result.success} units, ${result.failed} failed`);
      }
    },
    onError: (error) => {
      toast.error(`Bulk operation failed: ${error.message}`);
    },
  });
}
