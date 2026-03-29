import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { useToast } from '@/hooks/use-toast';

export type IoTDeviceType = 
  | 'temperature' 
  | 'humidity' 
  | 'pressure' 
  | 'flow' 
  | 'power' 
  | 'energy' 
  | 'co2' 
  | 'voc' 
  | 'occupancy' 
  | 'status'
  | 'sound_level_meter'
  | 'nc_meter'
  | 'vibration';

export interface IoTDevice {
  id: string;
  organization_id: string;
  equipment_id: string | null;
  zone_id: string | null;
  name: string;
  device_type: IoTDeviceType;
  device_id: string;
  protocol: 'mqtt' | 'modbus' | 'bacnet' | 'rest_api' | 'manual';
  connection_config: Record<string, unknown>;
  unit: string;
  setpoint: number | null;
  min_threshold: number | null;
  max_threshold: number | null;
  status: 'online' | 'offline' | 'fault' | 'maintenance';
  last_reading_value: number | null;
  last_reading_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  equipment?: { id: string; name: string; tag: string } | null;
  zone?: { id: string; name: string } | null;
}

export interface CreateIoTDeviceInput {
  name: string;
  device_type: IoTDevice['device_type'];
  device_id: string;
  protocol?: IoTDevice['protocol'];
  connection_config?: Record<string, unknown>;
  unit: string;
  setpoint?: number | null;
  min_threshold?: number | null;
  max_threshold?: number | null;
  equipment_id?: string | null;
  zone_id?: string | null;
  is_active?: boolean;
}

export interface UpdateIoTDeviceInput extends Partial<CreateIoTDeviceInput> {
  id: string;
  status?: IoTDevice['status'];
}

export function useIoTDevices() {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['iot-devices', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('iot_devices')
        .select(`
          *,
          equipment:equipment_id(id, name, tag),
          zone:zone_id(id, name)
        `)
        .eq('organization_id', organization.id)
        .order('name');

      if (error) throw error;
      return data as IoTDevice[];
    },
    enabled: !!organization?.id,
  });
}

export function useIoTDevicesByEquipment(equipmentId: string | undefined) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['iot-devices', 'equipment', equipmentId],
    queryFn: async () => {
      if (!organization?.id || !equipmentId) return [];

      const { data, error } = await supabase
        .from('iot_devices')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('equipment_id', equipmentId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as IoTDevice[];
    },
    enabled: !!organization?.id && !!equipmentId,
  });
}

export function useActiveIoTDevices() {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['iot-devices', 'active', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('iot_devices')
        .select(`
          *,
          equipment:equipment_id(id, name, tag),
          zone:zone_id(id, name)
        `)
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .order('device_type')
        .order('name');

      if (error) throw error;
      return data as IoTDevice[];
    },
    enabled: !!organization?.id,
  });
}

export function useCreateIoTDevice() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateIoTDeviceInput) => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase
        .from('iot_devices')
        .insert({
          name: input.name,
          device_id: input.device_id,
          device_type: input.device_type,
          protocol: input.protocol || 'rest_api',
          unit: input.unit,
          setpoint: input.setpoint,
          min_threshold: input.min_threshold,
          max_threshold: input.max_threshold,
          equipment_id: input.equipment_id,
          zone_id: input.zone_id,
          is_active: input.is_active ?? true,
          organization_id: organization.id,
          status: 'offline',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iot-devices'] });
      toast({ title: 'IoT device created successfully' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to create IoT device', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
}

export function useUpdateIoTDevice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateIoTDeviceInput) => {
      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.device_id !== undefined) updateData.device_id = input.device_id;
      if (input.device_type !== undefined) updateData.device_type = input.device_type;
      if (input.protocol !== undefined) updateData.protocol = input.protocol;
      if (input.unit !== undefined) updateData.unit = input.unit;
      if (input.setpoint !== undefined) updateData.setpoint = input.setpoint;
      if (input.min_threshold !== undefined) updateData.min_threshold = input.min_threshold;
      if (input.max_threshold !== undefined) updateData.max_threshold = input.max_threshold;
      if (input.equipment_id !== undefined) updateData.equipment_id = input.equipment_id;
      if (input.zone_id !== undefined) updateData.zone_id = input.zone_id;
      if (input.is_active !== undefined) updateData.is_active = input.is_active;
      if (input.status !== undefined) updateData.status = input.status;

      const { data, error } = await supabase
        .from('iot_devices')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iot-devices'] });
      toast({ title: 'IoT device updated successfully' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to update IoT device', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
}

export function useDeleteIoTDevice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('iot_devices')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iot-devices'] });
      toast({ title: 'IoT device deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to delete IoT device', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
}

// Helper to get device type info
export function getDeviceTypeInfo(type: IoTDeviceType) {
  const types: Record<IoTDeviceType, { label: string; icon: string; defaultUnit: string }> = {
    temperature: { label: 'Temperature', icon: 'Thermometer', defaultUnit: '°C' },
    humidity: { label: 'Humidity', icon: 'Droplets', defaultUnit: '%' },
    pressure: { label: 'Pressure', icon: 'Gauge', defaultUnit: 'Pa' },
    flow: { label: 'Flow Rate', icon: 'Wind', defaultUnit: 'L/s' },
    power: { label: 'Power', icon: 'Zap', defaultUnit: 'kW' },
    energy: { label: 'Energy', icon: 'Battery', defaultUnit: 'kWh' },
    co2: { label: 'CO₂ Level', icon: 'Cloud', defaultUnit: 'ppm' },
    voc: { label: 'VOC Level', icon: 'AlertTriangle', defaultUnit: 'ppb' },
    occupancy: { label: 'Occupancy', icon: 'Users', defaultUnit: 'people' },
    status: { label: 'Status', icon: 'Activity', defaultUnit: '' },
    sound_level_meter: { label: 'Sound Level Meter', icon: 'Volume2', defaultUnit: 'dBA' },
    nc_meter: { label: 'NC Meter', icon: 'AudioWaveform', defaultUnit: 'NC' },
    vibration: { label: 'Vibration Sensor', icon: 'Activity', defaultUnit: 'mm/s' },
  };
  return types[type] || types.temperature;
}
