import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Wind, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Settings2,
  TrendingDown,
  Users,
  Gauge,
  RefreshCw,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useDCVCalculator, DCVZoneConfig, DCVZoneResult, DCVSystemResult, DEFAULT_DCV_CONFIG, CO2_THRESHOLDS } from '@/hooks/useDCVCalculator';
import { useZoneCO2Sensors } from '@/hooks/useZoneCO2Sensors';

interface ZoneVentilationResult {
  id: string;
  name: string;
  Voz: number;
  Rp: number;
  Ra: number;
  floorArea: number;
  occupancy: number;
  spaceTypeId: string;
}

interface DCVDashboardProps {
  zones: ZoneVentilationResult[];
  projectId?: string;
}

function CO2StatusBadge({ status }: { status: DCVZoneResult['co2Status'] }) {
  const config = {
    low: { label: 'Low', variant: 'outline' as const, className: 'border-blue-500 text-blue-600' },
    normal: { label: 'Normal', variant: 'outline' as const, className: 'border-green-500 text-green-600' },
    elevated: { label: 'Elevated', variant: 'outline' as const, className: 'border-yellow-500 text-yellow-600' },
    high: { label: 'High', variant: 'destructive' as const, className: '' },
  };
  
  const { label, variant, className } = config[status];
  
  return <Badge variant={variant} className={className}>{label}</Badge>;
}

function VentilationModeBadge({ mode }: { mode: DCVZoneResult['ventilationMode'] }) {
  const config = {
    minimum: { label: 'Minimum', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
    proportional: { label: 'Proportional', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
    maximum: { label: 'Maximum', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  };
  
  const { label, className } = config[mode];
  
  return <Badge className={className}>{label}</Badge>;
}

export function DCVDashboard({ zones, projectId }: DCVDashboardProps) {
  const { calculateDCVZone, calculateDCVSystem } = useDCVCalculator();
  const { data: co2Sensors, isLoading: sensorsLoading, refetch } = useZoneCO2Sensors(projectId);
  
  // DCV configuration state
  const [dcvConfig, setDcvConfig] = useState(DEFAULT_DCV_CONFIG);
  const [simulationMode, setSimulationMode] = useState(true);
  const [simulatedCO2, setSimulatedCO2] = useState<Record<string, number>>({});
  
  // Generate mock CO2 trend data for demo
  const [trendData] = useState(() => {
    const now = new Date();
    return Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      return {
        time: hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        zone1: 400 + Math.random() * 400 + (i > 8 && i < 18 ? 200 : 0),
        zone2: 400 + Math.random() * 350 + (i > 9 && i < 17 ? 250 : 0),
        zone3: 400 + Math.random() * 300 + (i > 10 && i < 16 ? 150 : 0),
      };
    });
  });
  
  // Calculate DCV results for each zone
  const dcvResults = useMemo(() => {
    return zones.map(zone => {
      // Find CO2 sensor for this zone
      const sensor = co2Sensors?.find(s => s.zoneId === zone.id);
      
      // Use simulated or real CO2 value
      const currentCO2 = simulationMode 
        ? (simulatedCO2[zone.id] ?? 600 + Math.random() * 400)
        : sensor?.currentReading;
      
      const config: DCVZoneConfig = {
        zoneId: zone.id,
        zoneName: zone.name,
        designOccupancy: zone.occupancy,
        floorArea: zone.floorArea,
        spaceTypeId: zone.spaceTypeId,
        co2SensorDeviceId: sensor?.deviceId,
        ...dcvConfig,
      };
      
      return calculateDCVZone(config, currentCO2);
    });
  }, [zones, co2Sensors, simulationMode, simulatedCO2, dcvConfig, calculateDCVZone]);
  
  // Calculate system totals
  const systemResult = useMemo(() => {
    const sensorHealthy = !sensorsLoading && (co2Sensors?.length ?? 0) > 0;
    return calculateDCVSystem(dcvResults, simulationMode || sensorHealthy);
  }, [dcvResults, sensorsLoading, co2Sensors, simulationMode, calculateDCVSystem]);
  
  const handleSimulateCO2 = (zoneId: string, value: number) => {
    setSimulatedCO2(prev => ({ ...prev, [zoneId]: value }));
  };
  
  return (
    <div className="space-y-6">
      {/* Header & Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${systemResult.sensorHealthy ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
          <span className="text-sm text-muted-foreground">
            {simulationMode ? 'Simulation Mode' : 'Live Monitoring'}
          </span>
          <span className="text-xs text-muted-foreground">
            Last updated: {systemResult.lastUpdated.toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={simulationMode}
              onCheckedChange={setSimulationMode}
              id="simulation-mode"
            />
            <Label htmlFor="simulation-mode" className="text-sm">Simulation</Label>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* System Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wind className="h-4 w-4 text-primary" />
              Current OA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemResult.totalCurrentOA.toLocaleString()} CFM</div>
            <p className="text-xs text-muted-foreground">
              of {systemResult.totalDesignOA.toLocaleString()} CFM design
            </p>
            <Progress 
              value={(systemResult.totalCurrentOA / systemResult.totalDesignOA) * 100} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-green-600" />
              Energy Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {systemResult.totalSavingsPercent.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {systemResult.totalSavingsCfm.toLocaleString()} CFM reduced
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              Avg CO₂
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemResult.averageCO2 > 0 ? `${Math.round(systemResult.averageCO2)} ppm` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Target: {dcvConfig.targetCO2} ppm
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Est. Occupancy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dcvResults.reduce((sum, z) => sum + z.estimatedOccupancy, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              of {zones.reduce((sum, z) => sum + z.occupancy, 0)} design
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Warning Alert if high CO2 */}
      {systemResult.worstZone && systemResult.worstZone.co2Status === 'high' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>High CO₂ Alert</AlertTitle>
          <AlertDescription>
            {systemResult.worstZone.zoneName} has CO₂ level of {systemResult.worstZone.currentCO2} ppm, 
            exceeding the maximum threshold of {dcvConfig.maxCO2} ppm.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="zones" className="w-full">
        <TabsList>
          <TabsTrigger value="zones">Zone Status</TabsTrigger>
          <TabsTrigger value="trends">CO₂ Trends</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Zone CO₂ Levels & Ventilation</CardTitle>
              <CardDescription>
                Real-time zone monitoring with demand-controlled ventilation status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone</TableHead>
                    <TableHead className="text-center">CO₂ (ppm)</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Mode</TableHead>
                    <TableHead className="text-center">Damper</TableHead>
                    <TableHead className="text-right">OA Rate (CFM)</TableHead>
                    <TableHead className="text-right">Savings</TableHead>
                    {simulationMode && <TableHead className="text-center">Simulate</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dcvResults.map((zone) => (
                    <TableRow key={zone.zoneId}>
                      <TableCell className="font-medium">{zone.zoneName}</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-mono ${
                          zone.co2Status === 'high' ? 'text-destructive font-bold' :
                          zone.co2Status === 'elevated' ? 'text-yellow-600' : ''
                        }`}>
                          {zone.currentCO2 !== undefined ? Math.round(zone.currentCO2) : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <CO2StatusBadge status={zone.co2Status} />
                      </TableCell>
                      <TableCell className="text-center">
                        <VentilationModeBadge mode={zone.ventilationMode} />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Gauge className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono">{zone.damperPosition}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {Math.round(zone.currentVoz).toLocaleString()}
                        <span className="text-xs text-muted-foreground ml-1">
                          / {Math.round(zone.designVoz).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-green-600 font-medium">
                          {zone.currentSavingsPercent.toFixed(0)}%
                        </span>
                      </TableCell>
                      {simulationMode && (
                        <TableCell>
                          <Input
                            type="number"
                            className="w-20 h-8"
                            placeholder="ppm"
                            value={simulatedCO2[zone.zoneId] ?? ''}
                            onChange={(e) => handleSimulateCO2(zone.zoneId, Number(e.target.value))}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>CO₂ Level Trends (24 Hours)</CardTitle>
              <CardDescription>
                Historical CO₂ concentration by zone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="time" className="text-xs" />
                    <YAxis domain={[300, 1400]} label={{ value: 'CO₂ (ppm)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <ReferenceLine y={dcvConfig.targetCO2} stroke="hsl(var(--primary))" strokeDasharray="5 5" label="Target" />
                    <ReferenceLine y={dcvConfig.maxCO2} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label="Max" />
                    <Line type="monotone" dataKey="zone1" name="Zone 1" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="zone2" name="Zone 2" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="zone3" name="Zone 3" stroke="hsl(262, 83%, 58%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                DCV Configuration
              </CardTitle>
              <CardDescription>
                Configure demand-controlled ventilation parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="outdoor-co2">Outdoor CO₂ (ppm)</Label>
                    <Input
                      id="outdoor-co2"
                      type="number"
                      value={dcvConfig.outdoorCO2}
                      onChange={(e) => setDcvConfig(prev => ({ ...prev, outdoorCO2: Number(e.target.value) }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Typical outdoor: 400-420 ppm
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="target-co2">Target CO₂ (ppm)</Label>
                    <Input
                      id="target-co2"
                      type="number"
                      value={dcvConfig.targetCO2}
                      onChange={(e) => setDcvConfig(prev => ({ ...prev, targetCO2: Number(e.target.value) }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      ASHRAE recommends ≤1000 ppm for occupied spaces
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="max-co2">Maximum CO₂ Alarm (ppm)</Label>
                    <Input
                      id="max-co2"
                      type="number"
                      value={dcvConfig.maxCO2}
                      onChange={(e) => setDcvConfig(prev => ({ ...prev, maxCO2: Number(e.target.value) }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Alert threshold for poor air quality
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="min-vent">Minimum Ventilation (%)</Label>
                    <Input
                      id="min-vent"
                      type="number"
                      min={10}
                      max={50}
                      value={dcvConfig.minVentilationFraction * 100}
                      onChange={(e) => setDcvConfig(prev => ({ 
                        ...prev, 
                        minVentilationFraction: Number(e.target.value) / 100 
                      }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum people OA when space appears unoccupied
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">CO₂ Level Guide</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>&lt;{CO2_THRESHOLDS.excellent} Excellent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-lime-500" />
                    <span>&lt;{CO2_THRESHOLDS.good} Good</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span>&lt;{CO2_THRESHOLDS.acceptable} Acceptable</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span>&lt;{CO2_THRESHOLDS.poor} Poor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>&gt;{CO2_THRESHOLDS.poor} Unhealthy</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
