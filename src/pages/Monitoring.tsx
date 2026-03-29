import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Activity,
  Wifi,
  ThermometerSun,
  Droplets,
  Wind,
  Gauge,
  AlertTriangle,
  Settings2,
  RefreshCw,
  Loader2,
  Bell,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useIoTDevices } from '@/hooks/useIoTDevices';
import { useSensorReadings } from '@/hooks/useSensorReadings';
import { useMonitoringAlerts } from '@/hooks/useMonitoringAlerts';
import { useRealTimeMonitoring } from '@/hooks/useRealTimeMonitoring';
import { useEquipment } from '@/hooks/useEquipment';
import { IoTDeviceList } from '@/components/monitoring/IoTDeviceList';
import { IoTDeviceForm } from '@/components/monitoring/IoTDeviceForm';
import { AlertsPanel } from '@/components/monitoring/AlertsPanel';
import { SensorCard } from '@/components/monitoring/SensorCard';
import { HealthScoreDashboard } from '@/components/monitoring/HealthScoreDashboard';
import { IAQDashboard } from '@/components/monitoring/IAQDashboard';
import { LiveWeatherCard } from '@/components/monitoring/LiveWeatherCard';
import { AcousticAlertsPanel } from '@/components/acoustic/AcousticAlertsPanel';
import { Volume2 } from 'lucide-react';
import type { IoTDevice } from '@/hooks/useIoTDevices';

export default function Monitoring() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<IoTDevice | null>(null);

  // Real data hooks
  const { data: devices = [], isLoading: devicesLoading, refetch: refetchDevices } = useIoTDevices();
  const { data: alerts = [], isLoading: alertsLoading, refetch: refetchAlerts } = useMonitoringAlerts();
  const { data: equipment = [] } = useEquipment();
  const { isConnected, latestReadings, newAlerts, clearNewAlerts } = useRealTimeMonitoring();

  // Get time range
  const timeRangeMap: Record<string, '24h' | '7d' | '30d'> = {
    '24h': '24h',
    '7d': '7d', 
    '30d': '30d',
  };
  const timeRange = timeRangeMap[selectedTimeRange] ?? '24h';

  const hoursRange = useMemo(() => {
    switch (selectedTimeRange) {
      case '7d': return 168;
      case '30d': return 720;
      default: return 24;
    }
  }, [selectedTimeRange]);

  // Fetch readings for the first few devices for charts
  const temperatureDevices = devices.filter(d => d.device_type === 'temperature').slice(0, 3);
  const { data: tempReadings = [] } = useSensorReadings(
    temperatureDevices[0]?.id,
    timeRange
  );

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Update last update time when real-time data comes in
  useEffect(() => {
    if (Object.keys(latestReadings).length > 0 || newAlerts.length > 0) {
      setLastUpdate(new Date());
    }
  }, [latestReadings, newAlerts]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchDevices(), refetchAlerts()]);
    setLastUpdate(new Date());
    setIsRefreshing(false);
  };

  const handleEditDevice = (device: IoTDevice) => {
    setEditingDevice(device);
    setIsFormOpen(true);
  };

  const handleAddDevice = () => {
    setEditingDevice(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingDevice(null);
  };

  // Generate chart data from readings or fallback to demo
  const temperatureData = useMemo(() => {
    if (tempReadings.length > 0) {
      return tempReadings.map(r => ({
        time: new Date(r.recorded_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        value: r.value,
      }));
    }
    // Demo data fallback
    const hours = hoursRange;
    const data = [];
    const now = new Date();
    const step = hours > 24 ? 4 : 1;
    for (let i = hours; i >= 0; i -= step) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        time: hours > 24 
          ? time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        supplyAir: 55 + (Math.random() - 0.5) * 4,
        returnAir: 72 + (Math.random() - 0.5) * 3,
        outsideAir: 85 + (Math.random() - 0.5) * 10,
      });
    }
    return data;
  }, [tempReadings, hoursRange, lastUpdate]);

  const chillerData = useMemo(() => {
    const hours = hoursRange;
    const data = [];
    const now = new Date();
    const step = hours > 24 ? 4 : 1;
    for (let i = hours; i >= 0; i -= step) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        time: hours > 24 
          ? time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        chwSupply: 44 + (Math.random() - 0.5) * 2,
        chwReturn: 54 + (Math.random() - 0.5) * 3,
        load: 60 + (Math.random() - 0.5) * 30,
      });
    }
    return data;
  }, [hoursRange, lastUpdate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeAlerts = alerts.filter(a => a.is_active);
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
  const onlineDevices = devices.filter(d => d.status === 'online' && d.is_active);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Monitoring</h1>
            <p className="text-muted-foreground">
              Real-time IoT sensor data and equipment status
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? 'default' : 'secondary'} className="gap-1">
              <span className={cn('w-2 h-2 rounded-full', isConnected ? 'bg-success animate-pulse' : 'bg-muted-foreground')} />
              {isConnected ? 'Live' : 'Connecting...'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
              Refresh
            </Button>
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings2 className="w-4 h-4" />
                  Configure
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>IoT Device Configuration</DialogTitle>
                  <DialogDescription>
                    Manage IoT sensors and devices connected to your HVAC equipment
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <div className="flex justify-end mb-4">
                    <Button onClick={handleAddDevice} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Device
                    </Button>
                  </div>
                  <IoTDeviceList onEdit={handleEditDevice} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Devices</p>
                  <p className="text-2xl font-bold">{devices.length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Alarms</p>
                  <p className="text-2xl font-bold">{criticalAlerts.length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Devices Online</p>
                  <p className="text-2xl font-bold">{onlineDevices.length}/{devices.filter(d => d.is_active).length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Equipment Linked</p>
                  <p className="text-2xl font-bold">{devices.filter(d => d.equipment_id).length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <Gauge className="w-5 h-5 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weather Card */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            {/* Placeholder for layout balance */}
          </div>
          <LiveWeatherCard city="Riyadh" compact />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="health">Equipment Health</TabsTrigger>
            <TabsTrigger value="iaq">IAQ</TabsTrigger>
            <TabsTrigger value="acoustic" className="gap-1">
              <Volume2 className="h-4 w-4" />
              Acoustic
            </TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="alerts">
              Alerts
              {activeAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {activeAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Temperature Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ThermometerSun className="w-5 h-5" />
                    Temperature Trends
                  </CardTitle>
                  <CardDescription>
                    {temperatureDevices.length > 0 
                      ? `${temperatureDevices.length} temperature sensor(s)`
                      : 'Demo data - Configure temperature sensors to see real data'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={temperatureData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 10 }}
                          className="text-muted-foreground"
                        />
                        <YAxis 
                          domain={[40, 100]} 
                          tick={{ fontSize: 10 }}
                          className="text-muted-foreground"
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        {tempReadings.length > 0 ? (
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            name="Temperature" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            dot={false}
                          />
                        ) : (
                          <>
                            <Line 
                              type="monotone" 
                              dataKey="supplyAir" 
                              name="Supply Air" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              dot={false}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="returnAir" 
                              name="Return Air" 
                              stroke="hsl(var(--info))" 
                              strokeWidth={2}
                              dot={false}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="outsideAir" 
                              name="Outside Air" 
                              stroke="hsl(var(--warning))" 
                              strokeWidth={2}
                              dot={false}
                            />
                          </>
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Chiller Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Droplets className="w-5 h-5" />
                    Chiller Performance
                  </CardTitle>
                  <CardDescription>Water temperatures and load (demo)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chillerData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 10 }}
                          className="text-muted-foreground"
                        />
                        <YAxis 
                          yAxisId="temp"
                          domain={[40, 60]} 
                          tick={{ fontSize: 10 }}
                          className="text-muted-foreground"
                        />
                        <YAxis 
                          yAxisId="load"
                          orientation="right"
                          domain={[0, 100]} 
                          tick={{ fontSize: 10 }}
                          className="text-muted-foreground"
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <Area 
                          yAxisId="load"
                          type="monotone" 
                          dataKey="load" 
                          name="Load %" 
                          fill="hsl(var(--primary) / 0.2)" 
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                        />
                        <Line 
                          yAxisId="temp"
                          type="monotone" 
                          dataKey="chwSupply" 
                          name="CHW Supply" 
                          stroke="hsl(var(--info))" 
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line 
                          yAxisId="temp"
                          type="monotone" 
                          dataKey="chwReturn" 
                          name="CHW Return" 
                          stroke="hsl(var(--warning))" 
                          strokeWidth={2}
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Live Sensor Cards */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Live Sensor Readings</h2>
                {devices.length === 0 && (
                  <Button variant="outline" size="sm" onClick={() => setIsConfigOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Sensor
                  </Button>
                )}
              </div>
              {devices.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {devices.filter(d => d.is_active).map((device) => (
                    <SensorCard
                      key={device.id}
                      device={device}
                      latestReading={latestReadings[device.id]}
                      equipment={equipment.find(e => e.id === device.equipment_id)}
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Activity className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-1">No IoT Devices Configured</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add sensors to monitor real-time equipment data
                    </p>
                    <Button onClick={() => setIsConfigOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Configure Devices
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="health">
            <HealthScoreDashboard />
          </TabsContent>

          <TabsContent value="iaq">
            <IAQDashboard />
          </TabsContent>

          <TabsContent value="acoustic" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Acoustic Monitoring</h2>
              <Button variant="outline" onClick={() => navigate('/design/acoustic-comparison')}>
                <Volume2 className="h-4 w-4 mr-2" />
                Compare Zones
              </Button>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <AcousticAlertsPanel />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5" />
                    Sound Level Devices
                  </CardTitle>
                  <CardDescription>
                    Configured NC meters and sound level sensors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Volume2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No acoustic monitoring devices configured</p>
                    <p className="text-xs mt-2">
                      Add sound level meters or NC meters in the Devices tab
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => setIsConfigOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Device
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="devices">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>IoT Devices</CardTitle>
                    <CardDescription>Manage connected sensors and monitoring devices</CardDescription>
                  </div>
                  <Button onClick={handleAddDevice} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Device
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <IoTDeviceList onEdit={handleEditDevice} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <AlertsPanel />
          </TabsContent>
        </Tabs>

        {/* Device Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingDevice ? 'Edit Device' : 'Add New Device'}</DialogTitle>
              <DialogDescription>
                Configure IoT sensor settings and thresholds
              </DialogDescription>
            </DialogHeader>
            <IoTDeviceForm
              device={editingDevice || undefined}
              onSuccess={handleFormClose}
              onCancel={handleFormClose}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
