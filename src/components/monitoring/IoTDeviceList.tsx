import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Plus,
  Wifi,
  WifiOff,
  AlertTriangle,
  Wrench,
  Thermometer,
  Droplets,
  Gauge,
  Wind,
  Zap,
  Battery,
  Cloud,
  Users,
  Activity,
} from 'lucide-react';
import { useIoTDevices, useDeleteIoTDevice, type IoTDevice, getDeviceTypeInfo } from '@/hooks/useIoTDevices';
import { IoTDeviceForm } from './IoTDeviceForm';
import { Skeleton } from '@/components/ui/skeleton';

const deviceTypeIcons: Record<string, React.ReactNode> = {
  temperature: <Thermometer className="h-4 w-4" />,
  humidity: <Droplets className="h-4 w-4" />,
  pressure: <Gauge className="h-4 w-4" />,
  flow: <Wind className="h-4 w-4" />,
  power: <Zap className="h-4 w-4" />,
  energy: <Battery className="h-4 w-4" />,
  co2: <Cloud className="h-4 w-4" />,
  voc: <AlertTriangle className="h-4 w-4" />,
  occupancy: <Users className="h-4 w-4" />,
  status: <Activity className="h-4 w-4" />,
  sound_level_meter: <Activity className="h-4 w-4" />,
  nc_meter: <Activity className="h-4 w-4" />,
  vibration: <Activity className="h-4 w-4" />,
};

function getStatusBadge(status: IoTDevice['status']) {
  switch (status) {
    case 'online':
      return (
        <Badge variant="default" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
          <Wifi className="h-3 w-3 mr-1" />
          Online
        </Badge>
      );
    case 'offline':
      return (
        <Badge variant="secondary">
          <WifiOff className="h-3 w-3 mr-1" />
          Offline
        </Badge>
      );
    case 'fault':
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Fault
        </Badge>
      );
    case 'maintenance':
      return (
        <Badge variant="outline" className="border-yellow-500/50 text-yellow-600">
          <Wrench className="h-3 w-3 mr-1" />
          Maintenance
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

interface IoTDeviceListProps {
  onEdit?: (device: IoTDevice) => void;
}

export function IoTDeviceList({ onEdit }: IoTDeviceListProps) {
  const { data: devices, isLoading, error } = useIoTDevices();
  const deleteDevice = useDeleteIoTDevice();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<IoTDevice | null>(null);
  const [deletingDevice, setDeletingDevice] = useState<IoTDevice | null>(null);

  const handleEdit = (device: IoTDevice) => {
    if (onEdit) {
      onEdit(device);
    } else {
      setEditingDevice(device);
    }
  };

  const handleDelete = async () => {
    if (deletingDevice) {
      await deleteDevice.mutateAsync(deletingDevice.id);
      setDeletingDevice(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Failed to load IoT devices
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">IoT Devices</h3>
          <p className="text-sm text-muted-foreground">
            Configure sensors and devices for real-time monitoring
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Device
        </Button>
      </div>

      {devices && devices.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Reading</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>Thresholds</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => {
                const typeInfo = getDeviceTypeInfo(device.device_type);
                return (
                  <TableRow key={device.id} className={!device.is_active ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          {deviceTypeIcons[device.device_type]}
                        </div>
                        <div>
                          <div className="font-medium">{device.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {device.device_id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{typeInfo.label}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(device.status)}</TableCell>
                    <TableCell>
                      {device.last_reading_value !== null ? (
                        <div>
                          <div className="font-medium">
                            {device.last_reading_value.toFixed(1)} {device.unit}
                          </div>
                          {device.last_reading_at && (
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(device.last_reading_at), { addSuffix: true })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No data</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {device.equipment ? (
                        <div className="text-sm">
                          <div className="font-medium">{device.equipment.tag}</div>
                          <div className="text-xs text-muted-foreground">
                            {device.equipment.name}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        {device.setpoint !== null && (
                          <div>Setpoint: {device.setpoint} {device.unit}</div>
                        )}
                        {device.min_threshold !== null && device.max_threshold !== null && (
                          <div className="text-muted-foreground">
                            {device.min_threshold} - {device.max_threshold} {device.unit}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(device)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeletingDevice(device)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No IoT Devices Configured</h3>
          <p className="text-muted-foreground mb-4">
            Add sensors and devices to start monitoring your equipment
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Device
          </Button>
        </div>
      )}

      {/* Add Device Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add IoT Device</DialogTitle>
            <DialogDescription>
              Configure a new sensor or device for real-time monitoring
            </DialogDescription>
          </DialogHeader>
          <IoTDeviceForm 
            onSuccess={() => setIsAddDialogOpen(false)}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Device Dialog */}
      <Dialog open={!!editingDevice} onOpenChange={() => setEditingDevice(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit IoT Device</DialogTitle>
            <DialogDescription>
              Update device configuration
            </DialogDescription>
          </DialogHeader>
          {editingDevice && (
            <IoTDeviceForm 
              device={editingDevice}
              onSuccess={() => setEditingDevice(null)}
              onCancel={() => setEditingDevice(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingDevice} onOpenChange={() => setDeletingDevice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Device?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingDevice?.name}" and all its historical data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
