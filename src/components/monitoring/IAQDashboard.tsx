import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Activity,
  Wind,
  Thermometer,
  Droplets,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Gauge,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { cn } from '@/lib/utils';
import { 
  useIAQSensors, 
  IAQ_PARAMETERS, 
  IAQParameterType,
  calculateParameterScore,
} from '@/hooks/useIAQSensors';
import { LEEDWELLDashboard } from './LEEDWELLDashboard';

interface IAQDashboardProps {
  projectId?: string;
}

export function IAQDashboard({ projectId }: IAQDashboardProps) {
  const { dashboardData, zoneStatuses, isLoading, IAQ_PARAMETERS } = useIAQSensors(projectId);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());
  const [timeRange, setTimeRange] = useState('24h');
  
  const toggleZoneExpanded = (zoneId: string) => {
    setExpandedZones(prev => {
      const next = new Set(prev);
      if (next.has(zoneId)) {
        next.delete(zoneId);
      } else {
        next.add(zoneId);
      }
      return next;
    });
  };
  
  // Generate demo historical data
  const historicalData = useMemo(() => {
    const hours = timeRange === '7d' ? 168 : timeRange === '30d' ? 720 : 24;
    const step = hours > 24 ? 4 : 1;
    const data = [];
    const now = new Date();
    
    for (let i = hours; i >= 0; i -= step) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        time: hours > 24 
          ? time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        co2: 600 + Math.random() * 300 + (i % 12 < 4 ? 200 : 0), // Higher during work hours
        pm25: 8 + Math.random() * 10,
        voc: 150 + Math.random() * 100,
        temperature: 23 + Math.random() * 2,
        humidity: 45 + Math.random() * 10,
      });
    }
    return data;
  }, [timeRange]);
  
  // Radar chart data
  const radarData = useMemo(() => {
    return IAQ_PARAMETERS.map(param => {
      const avg = dashboardData.parameterAverages[param.id] || 0;
      const { score } = calculateParameterScore(param.id, avg);
      return {
        parameter: param.name.split(' ')[0], // Short name
        score,
        fullMark: 100,
      };
    });
  }, [dashboardData.parameterAverages]);
  
  const getStatusColor = (status: 'good' | 'moderate' | 'unhealthy' | 'hazardous' | 'compliant' | 'warning' | 'non-compliant') => {
    switch (status) {
      case 'good':
      case 'compliant':
        return 'text-success';
      case 'moderate':
      case 'warning':
        return 'text-warning';
      case 'unhealthy':
      case 'non-compliant':
        return 'text-destructive';
      case 'hazardous':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };
  
  const getStatusBg = (status: string) => {
    switch (status) {
      case 'good':
      case 'compliant':
        return 'bg-success/10';
      case 'moderate':
      case 'warning':
        return 'bg-warning/10';
      case 'unhealthy':
      case 'non-compliant':
        return 'bg-destructive/10';
      case 'hazardous':
        return 'bg-destructive/20';
      default:
        return 'bg-muted';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
      case 'compliant':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'moderate':
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'unhealthy':
      case 'non-compliant':
      case 'hazardous':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Info className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  const getParameterIcon = (id: IAQParameterType) => {
    switch (id) {
      case 'co2': return <Wind className="h-4 w-4" />;
      case 'pm25': return <Activity className="h-4 w-4" />;
      case 'voc': return <Gauge className="h-4 w-4" />;
      case 'temperature': return <Thermometer className="h-4 w-4" />;
      case 'humidity': return <Droplets className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };
  
  const getTrendIcon = (change: number) => {
    if (change > 5) return <TrendingUp className="h-4 w-4 text-destructive" />;
    if (change < -5) return <TrendingDown className="h-4 w-4 text-success" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <Tabs defaultValue="iaq" className="space-y-6">
      <TabsList>
        <TabsTrigger value="iaq" className="gap-2">
          <Activity className="h-4 w-4" />
          Air Quality
        </TabsTrigger>
        <TabsTrigger value="certifications" className="gap-2">
          <Award className="h-4 w-4" />
          Certifications
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="iaq">
      <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Score */}
        <Card className={cn('border-2', dashboardData.systemScore >= 80 ? 'border-success/30' : dashboardData.systemScore >= 60 ? 'border-warning/30' : 'border-destructive/30')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall IAQ Score</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold">{dashboardData.systemScore}</p>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
                <Badge className={cn('mt-2', getStatusBg(dashboardData.systemCompliance))}>
                  {dashboardData.systemCompliance === 'compliant' ? 'ASHRAE 62.1 Compliant' : 
                   dashboardData.systemCompliance === 'warning' ? 'Review Recommended' : 'Action Required'}
                </Badge>
              </div>
              <div className={cn('w-16 h-16 rounded-full flex items-center justify-center', getStatusBg(dashboardData.systemCompliance))}>
                {getStatusIcon(dashboardData.systemCompliance)}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Zones Monitored */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Zones Monitored</p>
                <p className="text-2xl font-bold">{zoneStatuses.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {zoneStatuses.filter(z => z.complianceStatus === 'compliant').length} compliant
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Active Sensors */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">IAQ Sensors</p>
                <p className="text-2xl font-bold">{dashboardData.sensorCount}</p>
                <p className="text-xs text-muted-foreground mt-1">All types</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <Gauge className="w-5 h-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Alerts */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold">{dashboardData.alertCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardData.alertCount === 0 ? 'All clear' : 'Requires attention'}
                </p>
              </div>
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', 
                dashboardData.alertCount > 0 ? 'bg-destructive/10' : 'bg-success/10')}>
                {dashboardData.alertCount > 0 
                  ? <AlertTriangle className="w-5 h-5 text-destructive" />
                  : <CheckCircle className="w-5 h-5 text-success" />
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parameter Overview & Radar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Air Quality Parameters</CardTitle>
                <CardDescription>Current readings across all zones (averages)</CardDescription>
              </div>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              {IAQ_PARAMETERS.map(param => {
                const value = dashboardData.parameterAverages[param.id] || 0;
                const { score, status } = calculateParameterScore(param.id, value);
                
                return (
                  <div 
                    key={param.id}
                    className={cn(
                      'p-3 rounded-lg border transition-colors',
                      getStatusBg(status)
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getParameterIcon(param.id)}
                      <span className="text-xs font-medium">{param.name}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-bold">{Math.round(value)}</span>
                      <span className="text-xs text-muted-foreground">{param.unit}</span>
                    </div>
                    <div className="mt-2">
                      <Progress value={score} className="h-1.5" />
                      <div className="flex justify-between mt-1">
                        <span className={cn('text-xs capitalize', getStatusColor(status))}>{status}</span>
                        <span className="text-xs text-muted-foreground">
                          Limit: {param.standards.ashrae}{param.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Historical Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    yAxisId="co2"
                    domain={[400, 1200]} 
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    yAxisId="pm"
                    orientation="right"
                    domain={[0, 50]} 
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
                  <Line 
                    yAxisId="co2"
                    type="monotone" 
                    dataKey="co2" 
                    name="CO₂ (ppm)" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    yAxisId="pm"
                    type="monotone" 
                    dataKey="pm25" 
                    name="PM2.5 (µg/m³)" 
                    stroke="hsl(var(--warning))" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    yAxisId="co2"
                    type="monotone" 
                    dataKey="voc" 
                    name="VOC (ppb)" 
                    stroke="hsl(var(--info))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>IAQ Balance</CardTitle>
            <CardDescription>Parameter scores visualization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="parameter" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
                  <Radar 
                    name="Score" 
                    dataKey="score" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            {/* ASHRAE Compliance Summary */}
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <h4 className="text-sm font-medium mb-2">ASHRAE 62.1 Compliance</h4>
              <div className="space-y-2">
                {IAQ_PARAMETERS.slice(0, 3).map(param => {
                  const value = dashboardData.parameterAverages[param.id] || 0;
                  const isCompliant = value <= param.standards.ashrae;
                  return (
                    <div key={param.id} className="flex items-center justify-between text-sm">
                      <span>{param.name}</span>
                      <Badge variant={isCompliant ? 'default' : 'destructive'} className="text-xs">
                        {isCompliant ? '✓ Pass' : '✗ Fail'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Zone Details */}
      <Card>
        <CardHeader>
          <CardTitle>Zone Details</CardTitle>
          <CardDescription>Individual zone air quality status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {zoneStatuses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No IAQ sensors configured</p>
              <p className="text-sm">Add CO₂, PM2.5, VOC, temperature, or humidity sensors to see zone data</p>
            </div>
          ) : (
            zoneStatuses.map(zone => (
              <Collapsible 
                key={zone.zoneId}
                open={expandedZones.has(zone.zoneId)}
                onOpenChange={() => toggleZoneExpanded(zone.zoneId)}
              >
                <CollapsibleTrigger asChild>
                  <div className={cn(
                    'flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors hover:bg-muted/50',
                    getStatusBg(zone.complianceStatus)
                  )}>
                    <div className="flex items-center gap-4">
                      {getStatusIcon(zone.complianceStatus)}
                      <div>
                        <p className="font-medium">{zone.zoneName}</p>
                        <p className="text-sm text-muted-foreground">
                          {zone.readings.length} sensors • Score: {zone.overallScore}/100
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden md:flex gap-4 text-sm">
                        {zone.readings.slice(0, 3).map(r => (
                          <span key={r.parameterId} className="flex items-center gap-1">
                            {getParameterIcon(r.parameterId)}
                            {Math.round(r.value)}
                          </span>
                        ))}
                      </div>
                      {expandedZones.has(zone.zoneId) ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-2 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {zone.readings.map(reading => {
                        const param = IAQ_PARAMETERS.find(p => p.id === reading.parameterId);
                        return (
                          <div 
                            key={reading.parameterId}
                            className={cn('p-3 rounded-lg border', getStatusBg(reading.status))}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {getParameterIcon(reading.parameterId)}
                              <span className="text-xs">{param?.name || reading.parameterId}</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-bold">{Math.round(reading.value)}</span>
                              <span className="text-xs text-muted-foreground">{param?.unit}</span>
                            </div>
                            <Badge variant="outline" className={cn('mt-1 text-xs', getStatusColor(reading.status))}>
                              {reading.status}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                    
                    {zone.recommendations.length > 0 && (
                      <div className="p-3 bg-warning/10 rounded-lg border border-warning/30">
                        <h5 className="text-sm font-medium flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-warning" />
                          Recommendations
                        </h5>
                        <ul className="text-sm space-y-1">
                          {zone.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-muted-foreground">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </CardContent>
      </Card>
    </div>
      </TabsContent>
      
      <TabsContent value="certifications">
        <LEEDWELLDashboard projectId={projectId} />
      </TabsContent>
    </Tabs>
  );
}
