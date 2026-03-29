import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useEquipment } from '@/hooks/useEquipment';
import { useZones } from '@/hooks/useZones';
import { useCreateIoTDevice, useUpdateIoTDevice, type IoTDevice, getDeviceTypeInfo } from '@/hooks/useIoTDevices';

const deviceTypes = [
  'temperature',
  'humidity', 
  'pressure',
  'flow',
  'power',
  'energy',
  'co2',
  'voc',
  'occupancy',
  'status',
  // Acoustic monitoring device types
  'sound_level_meter',
  'nc_meter',
  'vibration',
] as const;

const protocols = [
  { value: 'rest_api', label: 'REST API' },
  { value: 'mqtt', label: 'MQTT' },
  { value: 'modbus', label: 'Modbus' },
  { value: 'bacnet', label: 'BACnet' },
  { value: 'manual', label: 'Manual Entry' },
] as const;

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  device_id: z.string().min(1, 'Device ID is required'),
  device_type: z.enum(deviceTypes),
  protocol: z.enum(['mqtt', 'modbus', 'bacnet', 'rest_api', 'manual']),
  unit: z.string().min(1, 'Unit is required'),
  setpoint: z.coerce.number().optional().nullable(),
  min_threshold: z.coerce.number().optional().nullable(),
  max_threshold: z.coerce.number().optional().nullable(),
  equipment_id: z.string().optional().nullable(),
  zone_id: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  // MQTT configuration
  mqtt_topic: z.string().optional(),
  mqtt_value_path: z.string().optional(),
  mqtt_quality_path: z.string().optional(),
  mqtt_timestamp_path: z.string().optional(),
  mqtt_qos: z.coerce.number().min(0).max(2).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface IoTDeviceFormProps {
  device?: IoTDevice;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function IoTDeviceForm({ device, onSuccess, onCancel }: IoTDeviceFormProps) {
  const { data: equipment = [] } = useEquipment();
  const { data: zones = [] } = useZones();
  const createDevice = useCreateIoTDevice();
  const updateDevice = useUpdateIoTDevice();

  const connectionConfig = device?.connection_config as Record<string, unknown> | null;
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: device?.name || '',
      device_id: device?.device_id || '',
      device_type: device?.device_type || 'temperature',
      protocol: device?.protocol || 'rest_api',
      unit: device?.unit || '°C',
      setpoint: device?.setpoint ?? null,
      min_threshold: device?.min_threshold ?? null,
      max_threshold: device?.max_threshold ?? null,
      equipment_id: device?.equipment_id || null,
      zone_id: device?.zone_id || null,
      is_active: device?.is_active ?? true,
      mqtt_topic: (connectionConfig?.mqtt_topic as string) || '',
      mqtt_value_path: (connectionConfig?.value_path as string) || '$.value',
      mqtt_quality_path: (connectionConfig?.quality_path as string) || '',
      mqtt_timestamp_path: (connectionConfig?.timestamp_path as string) || '',
      mqtt_qos: (connectionConfig?.qos as number) || 0,
    },
  });

  const selectedType = form.watch('device_type');
  const selectedProtocol = form.watch('protocol');

  // Auto-update unit when device type changes
  const handleTypeChange = (value: typeof deviceTypes[number]) => {
    form.setValue('device_type', value);
    const typeInfo = getDeviceTypeInfo(value);
    form.setValue('unit', typeInfo.defaultUnit);
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Build connection_config based on protocol
      let connection_config: Record<string, unknown> = {};
      
      if (data.protocol === 'mqtt') {
        connection_config = {
          mqtt_topic: data.mqtt_topic,
          value_path: data.mqtt_value_path || '$.value',
          quality_path: data.mqtt_quality_path || undefined,
          timestamp_path: data.mqtt_timestamp_path || undefined,
          qos: data.mqtt_qos || 0,
        };
      }
      
      const deviceData = {
        name: data.name,
        device_id: data.device_id,
        device_type: data.device_type,
        protocol: data.protocol,
        unit: data.unit,
        setpoint: data.setpoint,
        min_threshold: data.min_threshold,
        max_threshold: data.max_threshold,
        equipment_id: data.equipment_id,
        zone_id: data.zone_id,
        is_active: data.is_active,
        connection_config: Object.keys(connection_config).length > 0 ? connection_config : null,
      };
      
      if (device) {
        await updateDevice.mutateAsync({ id: device.id, ...deviceData });
      } else {
        await createDevice.mutateAsync(deviceData);
      }
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = createDevice.isPending || updateDevice.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Device Name</FormLabel>
                <FormControl>
                  <Input placeholder="Supply Air Temp Sensor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="device_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>External Device ID</FormLabel>
                <FormControl>
                  <Input placeholder="sensor-001" {...field} />
                </FormControl>
                <FormDescription>Unique identifier from IoT gateway</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="device_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Device Type</FormLabel>
                <Select value={field.value} onValueChange={handleTypeChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {deviceTypes.map((type) => {
                      const info = getDeviceTypeInfo(type);
                      return (
                        <SelectItem key={type} value={type}>
                          {info.label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="protocol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Protocol</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {protocols.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <FormControl>
                  <Input placeholder="°C" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="setpoint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Setpoint</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="any"
                    placeholder="22" 
                    {...field} 
                    value={field.value ?? ''} 
                  />
                </FormControl>
                <FormDescription>Target value</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="min_threshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Threshold</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="any"
                    placeholder="18" 
                    {...field} 
                    value={field.value ?? ''} 
                  />
                </FormControl>
                <FormDescription>Low alarm trigger</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_threshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Threshold</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="any"
                    placeholder="26" 
                    {...field} 
                    value={field.value ?? ''} 
                  />
                </FormControl>
                <FormDescription>High alarm trigger</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="equipment_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Linked Equipment</FormLabel>
                <Select 
                  value={field.value || 'none'} 
                  onValueChange={(v) => field.onChange(v === 'none' ? null : v)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {equipment.map((eq) => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.tag} - {eq.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="zone_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zone</FormLabel>
                <Select 
                  value={field.value || 'none'} 
                  onValueChange={(v) => field.onChange(v === 'none' ? null : v)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select zone (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {zones.map((z) => (
                      <SelectItem key={z.id} value={z.id}>
                        {z.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* MQTT Configuration - only show when protocol is mqtt */}
        {selectedProtocol === 'mqtt' && (
          <div className="space-y-4 rounded-lg border p-4">
            <h4 className="font-medium text-sm">MQTT Configuration</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mqtt_topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MQTT Topic</FormLabel>
                    <FormControl>
                      <Input placeholder="hvac/sensors/temp-001" {...field} />
                    </FormControl>
                    <FormDescription>Topic to subscribe to</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mqtt_qos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>QoS Level</FormLabel>
                    <Select 
                      value={String(field.value || 0)} 
                      onValueChange={(v) => field.onChange(parseInt(v))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">0 - At most once</SelectItem>
                        <SelectItem value="1">1 - At least once</SelectItem>
                        <SelectItem value="2">2 - Exactly once</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="mqtt_value_path"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value JSON Path</FormLabel>
                    <FormControl>
                      <Input placeholder="$.value" {...field} />
                    </FormControl>
                    <FormDescription>Path to value in payload</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mqtt_quality_path"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quality Path (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="$.quality" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mqtt_timestamp_path"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timestamp Path (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="$.timestamp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>
                  Receive data from this device
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : device ? 'Update Device' : 'Add Device'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
