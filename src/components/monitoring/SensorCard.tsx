import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Thermometer, 
  Droplets, 
  Gauge, 
  Wind, 
  Zap, 
  Battery, 
  Cloud, 
  AlertTriangle as AlertTriangleIcon,
  Users, 
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IoTDevice } from '@/hooks/useIoTDevices';
import type { SensorReading } from '@/hooks/useSensorReadings';

const deviceTypeIcons: Record<string, React.ReactNode> = {
  temperature: <Thermometer className="h-5 w-5" />,
  humidity: <Droplets className="h-5 w-5" />,
  pressure: <Gauge className="h-5 w-5" />,
  flow: <Wind className="h-5 w-5" />,
  power: <Zap className="h-5 w-5" />,
  energy: <Battery className="h-5 w-5" />,
  co2: <Cloud className="h-5 w-5" />,
  voc: <AlertTriangleIcon className="h-5 w-5" />,
  occupancy: <Users className="h-5 w-5" />,
  status: <Activity className="h-5 w-5" />,
  sound_level_meter: <Activity className="h-5 w-5" />,
  nc_meter: <Activity className="h-5 w-5" />,
  vibration: <Activity className="h-5 w-5" />,
};

export interface SensorCardProps {
  device: IoTDevice;
  latestReading?: SensorReading | null;
  previousReadings?: SensorReading[];
  equipment?: { id: string; name: string; tag: string } | null;
  onClick?: () => void;
}

export function SensorCard({ device, latestReading, previousReadings = [], equipment, onClick }: SensorCardProps) {
  const currentValue = latestReading?.value ?? device.last_reading_value;
  const lastUpdate = latestReading?.recorded_at ?? device.last_reading_at;
  
  // Calculate trend from recent readings
  const trend = useMemo(() => {
    if (previousReadings.length < 2) return 'stable';
    const recent = previousReadings.slice(-5);
    const firstValue = recent[0]?.value ?? 0;
    const lastValue = recent[recent.length - 1]?.value ?? 0;
    const change = lastValue - firstValue;
    const threshold = Math.abs(firstValue) * 0.02; // 2% change threshold
    if (change > threshold) return 'up';
    if (change < -threshold) return 'down';
    return 'stable';
  }, [previousReadings]);

  // Determine if value is within thresholds
  const isInRange = useMemo(() => {
    if (currentValue === null || currentValue === undefined) return true;
    if (device.min_threshold !== null && currentValue < device.min_threshold) return false;
    if (device.max_threshold !== null && currentValue > device.max_threshold) return false;
    return true;
  }, [currentValue, device.min_threshold, device.max_threshold]);

  const isOnline = device.status === 'online';

  return (
    <Card 
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        !isOnline && 'opacity-60',
        !isInRange && 'border-destructive/50 bg-destructive/5'
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              'p-2 rounded-lg',
              isOnline ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            )}>
              {deviceTypeIcons[device.device_type]}
            </div>
            <CardTitle className="text-sm font-medium">{device.name}</CardTitle>
          </div>
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className={cn(
              'text-3xl font-bold tabular-nums',
              !isInRange && 'text-destructive'
            )}>
              {currentValue !== null && currentValue !== undefined 
                ? currentValue.toFixed(1) 
                : '—'}
            </div>
            <div className="text-sm text-muted-foreground">{device.unit}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {/* Trend indicator */}
            {currentValue !== null && (
              <div className={cn(
                'flex items-center gap-1 text-xs',
                trend === 'up' && 'text-green-600',
                trend === 'down' && 'text-blue-600',
                trend === 'stable' && 'text-muted-foreground'
              )}>
                {trend === 'up' && <TrendingUp className="h-3 w-3" />}
                {trend === 'down' && <TrendingDown className="h-3 w-3" />}
                {trend === 'stable' && <Minus className="h-3 w-3" />}
                {trend === 'up' ? 'Rising' : trend === 'down' ? 'Falling' : 'Stable'}
              </div>
            )}
            
            {/* Setpoint comparison */}
            {device.setpoint !== null && currentValue !== null && (
              <Badge variant="outline" className="text-xs">
                SP: {device.setpoint} {device.unit}
              </Badge>
            )}
          </div>
        </div>

        {/* Threshold visualization */}
        {(device.min_threshold !== null || device.max_threshold !== null) && currentValue !== null && (
          <div className="mt-3">
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              {/* Range background */}
              <div className="absolute inset-0 bg-green-500/20" />
              
              {/* Current value indicator */}
              {device.min_threshold !== null && device.max_threshold !== null && (
                <div 
                  className={cn(
                    'absolute top-0 bottom-0 w-1 rounded-full',
                    isInRange ? 'bg-green-500' : 'bg-destructive'
                  )}
                  style={{
                    left: `${Math.min(100, Math.max(0, 
                      ((currentValue - device.min_threshold) / (device.max_threshold - device.min_threshold)) * 100
                    ))}%`
                  }}
                />
              )}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{device.min_threshold ?? '—'}</span>
              <span>{device.max_threshold ?? '—'}</span>
            </div>
          </div>
        )}

        {/* Last update time */}
        {lastUpdate && (
          <div className="mt-3 text-xs text-muted-foreground">
            Updated {formatDistanceToNow(new Date(lastUpdate), { addSuffix: true })}
          </div>
        )}

        {/* Equipment link */}
        {(equipment || device.equipment) && (
          <div className="mt-2 text-xs text-muted-foreground">
            {equipment?.tag ?? device.equipment?.tag}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
