import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ZoneAcousticSettings {
  id: string;
  name: string;
  zone_type: string;
  floor_id: string;
  target_nc: number;
  nc_tolerance: number;
  acoustic_alerts_enabled: boolean;
  acoustic_alert_severity: 'info' | 'warning' | 'critical';
  acoustic_measurement_device_id: string | null;
  measurement_device?: {
    id: string;
    name: string;
    last_reading_value: number | null;
    last_reading_at: string | null;
  } | null;
}

export interface UpdateZoneAcousticSettingsInput {
  id: string;
  target_nc?: number;
  nc_tolerance?: number;
  acoustic_alerts_enabled?: boolean;
  acoustic_alert_severity?: 'info' | 'warning' | 'critical';
  acoustic_measurement_device_id?: string | null;
}

// NC level presets based on space type (ASHRAE/SBC guidelines)
export const NC_PRESETS: Record<string, { nc: number; description: string }> = {
  'Private Office': { nc: 30, description: 'NC-30: Private offices, executive spaces' },
  'Open Office': { nc: 40, description: 'NC-40: Open plan offices, cubicles' },
  'Conference Room': { nc: 25, description: 'NC-25: Conference rooms, meeting spaces' },
  'Classroom': { nc: 30, description: 'NC-30: Classrooms, training rooms' },
  'Hospital Room': { nc: 35, description: 'NC-35: Patient rooms, recovery areas' },
  'Operating Room': { nc: 25, description: 'NC-25: Operating rooms, surgical suites' },
  'Restaurant': { nc: 45, description: 'NC-45: Restaurants, dining areas' },
  'Lobby': { nc: 40, description: 'NC-40: Lobbies, reception areas' },
  'Mechanical Room': { nc: 55, description: 'NC-55: Mechanical rooms, service areas' },
  'Retail': { nc: 45, description: 'NC-45: Retail spaces, showrooms' },
  'Auditorium': { nc: 25, description: 'NC-25: Auditoriums, theaters' },
  'Library': { nc: 30, description: 'NC-30: Libraries, reading rooms' },
};

export function useZoneAcousticSettings(projectId?: string, floorId?: string) {
  return useQuery({
    queryKey: ['zone-acoustic-settings', projectId, floorId],
    queryFn: async () => {
      let query = supabase
        .from('zones')
        .select(`
          id,
          name,
          zone_type,
          floor_id,
          target_nc,
          nc_tolerance,
          acoustic_alerts_enabled,
          acoustic_alert_severity,
          acoustic_measurement_device_id
        `)
        .order('name');

      if (floorId) {
        query = query.eq('floor_id', floorId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Map to ZoneAcousticSettings with defaults
      return (data || []).map(zone => ({
        id: zone.id,
        name: zone.name,
        zone_type: zone.zone_type || 'office',
        floor_id: zone.floor_id,
        target_nc: zone.target_nc ?? 35,
        nc_tolerance: zone.nc_tolerance ?? 3,
        acoustic_alerts_enabled: zone.acoustic_alerts_enabled ?? true,
        acoustic_alert_severity: (zone.acoustic_alert_severity as 'info' | 'warning' | 'critical') || 'warning',
        acoustic_measurement_device_id: zone.acoustic_measurement_device_id,
      })) as ZoneAcousticSettings[];
    },
    enabled: !!floorId || !!projectId,
  });
}

export function useUpdateZoneAcousticSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateZoneAcousticSettingsInput) => {
      const { id, ...updates } = input;
      
      const { data, error } = await supabase
        .from('zones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zone-acoustic-settings'] });
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      toast.success('Zone acoustic settings updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update acoustic settings: ${error.message}`);
    },
  });
}

export function useBulkUpdateZoneAcousticSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { zoneIds: string[]; settings: Partial<Omit<UpdateZoneAcousticSettingsInput, 'id'>> }) => {
      const { zoneIds, settings } = updates;
      
      const { error } = await supabase
        .from('zones')
        .update(settings)
        .in('id', zoneIds);

      if (error) throw error;
      return { count: zoneIds.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['zone-acoustic-settings'] });
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      toast.success(`Updated acoustic settings for ${result.count} zones`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to bulk update: ${error.message}`);
    },
  });
}

// Hook to get acoustic devices for linking
export function useAcousticDevices() {
  return useQuery({
    queryKey: ['acoustic-devices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('iot_devices')
        .select('id, name, device_type, zone_id, last_reading_value, last_reading_at, status')
        .in('device_type', ['sound_level_meter', 'nc_meter'])
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
}
