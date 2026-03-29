import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useOrganization';
import { useEnergyMeters } from '@/hooks/useEnergyMeters';
import { 
  useDailyConsumption, 
  useSystemBreakdown, 
  useHourlyProfile, 
  useEfficiencyMetrics,
  TimeRange 
} from '@/hooks/useEnergyReadings';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Zap,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Droplets,
  Gauge,
  Download,
  Calendar,
  BarChart3,
  Info,
  Plus,
} from 'lucide-react';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useProjects } from '@/hooks/useProjects';

export default function EnergyAnalytics() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  const { data: profile } = useProfile();
  const { data: projects } = useProjects();
  const { data: meters, isLoading: metersLoading } = useEnergyMeters(selectedProjectId || undefined);
  
  // Set default project when projects load
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Fetch real data from hooks
  const { data: dailyData, isLoading: dailyLoading } = useDailyConsumption(selectedProjectId || undefined, timeRange);
  const { data: systemData, isLoading: systemLoading } = useSystemBreakdown(selectedProjectId || undefined, timeRange);
  const { data: hourlyData, isLoading: hourlyLoading } = useHourlyProfile(selectedProjectId || undefined, timeRange);
  const { data: efficiencyData, isLoading: efficiencyLoading } = useEfficiencyMetrics(selectedProjectId || undefined, timeRange);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Check if we have real data or should show demo
  const hasRealData = meters && meters.length > 0;
  const isDataLoading = metersLoading || dailyLoading || systemLoading || hourlyLoading || efficiencyLoading;

  // Generate demo data for when no meters are configured
  const demoData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const baseLoad = isWeekend ? 800 : 1200;
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        consumption: baseLoad + Math.random() * 400,
        cost: (baseLoad + Math.random() * 400) * 0.12,
      });
    }
    return data;
  }, [timeRange]);

  const demoHourlyProfile = useMemo(() => {
    const data = [];
    for (let h = 0; h < 24; h++) {
      const hour = h.toString().padStart(2, '0') + ':00';
      let load = 40;
      
      if (h >= 6 && h < 8) load = 40 + (h - 6) * 30;
      else if (h >= 8 && h < 18) load = 100 + Math.random() * 20;
      else if (h >= 18 && h < 22) load = 100 - (h - 18) * 15;
      else load = 40 + Math.random() * 10;
      
      data.push({ hour, demand: Math.round(load) });
    }
    return data;
  }, []);

  const demoSystemBreakdown = [
    { name: 'Chillers', value: 42, color: 'hsl(var(--chart-1))' },
    { name: 'AHUs', value: 28, color: 'hsl(var(--chart-2))' },
    { name: 'Pumps', value: 15, color: 'hsl(var(--chart-3))' },
    { name: 'Cooling Towers', value: 10, color: 'hsl(var(--chart-4))' },
    { name: 'Other', value: 5, color: 'hsl(var(--muted-foreground))' },
  ];

  // Use real data if available, otherwise demo
  const displayDailyData = hasRealData && dailyData && dailyData.length > 0 
    ? dailyData.map(d => ({
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        consumption: d.consumption,
        cost: d.cost,
      }))
    : demoData;

  const displaySystemData = hasRealData && systemData && systemData.length > 0 
    ? systemData 
    : demoSystemBreakdown;

  const displayHourlyData = hasRealData && hourlyData && hourlyData.length > 0
    ? hourlyData
    : demoHourlyProfile;

  // Calculate totals from displayed data
  const totalKwh = displayDailyData.reduce((sum, d) => sum + d.consumption, 0);
  const avgDaily = displayDailyData.length > 0 ? totalKwh / displayDailyData.length : 0;
  const costPerKwh = efficiencyData?.avgCostPerKwh || 0.12;
  const totalCost = hasRealData && efficiencyData ? efficiencyData.totalCost : totalKwh * costPerKwh;
  const peakDemand = efficiencyData?.peakDemand || 0;

  // Comparison with previous period (mock for now)
  const percentChange = -5.2; // TODO: Calculate from real data when we have history

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Energy Analytics</h1>
            <p className="text-muted-foreground">
              {hasRealData 
                ? `Tracking ${meters?.length} energy meter${meters?.length !== 1 ? 's' : ''}`
                : 'Consumption trends, costs, and efficiency metrics'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {projects && projects.length > 1 && (
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* No Meters Empty State */}
        {!hasRealData && !metersLoading && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Energy Meters Configured</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Add energy meters to start tracking real consumption data. The charts below show demo data for preview purposes.
              </p>
              <Button onClick={() => navigate('/monitoring/meters')} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Energy Meter
              </Button>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Consumption</p>
                  <p className="text-2xl font-bold">{(totalKwh / 1000).toFixed(1)} MWh</p>
                  <div className="flex items-center gap-1 mt-1">
                    {percentChange < 0 ? (
                      <TrendingDown className="w-3 h-3 text-success" />
                    ) : (
                      <TrendingUp className="w-3 h-3 text-destructive" />
                    )}
                    <span className={`text-xs ${percentChange < 0 ? 'text-success' : 'text-destructive'}`}>
                      {Math.abs(percentChange).toFixed(1)}% vs prev period
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Energy Cost</p>
                  <p className="text-2xl font-bold">${(totalCost / 1000).toFixed(1)}k</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    @ ${costPerKwh.toFixed(2)}/kWh
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Daily Usage</p>
                  <p className="text-2xl font-bold">{avgDaily.toFixed(0)} kWh</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ${(avgDaily * costPerKwh).toFixed(0)}/day
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-info/10 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Peak Demand</p>
                  <p className="text-2xl font-bold">{peakDemand > 0 ? peakDemand : '—'} kW</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {hasRealData ? 'This period' : 'No data'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Gauge className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Charts */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Consumption Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Energy Consumption Trend
                {!hasRealData && <Badge variant="secondary" className="ml-2">Demo Data</Badge>}
              </CardTitle>
              <CardDescription>Daily consumption over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {isDataLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={displayDailyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`${value.toFixed(0)} kWh`, 'Consumption']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="consumption" 
                        name="Consumption"
                        fill="hsl(var(--primary))" 
                        stroke="hsl(var(--primary))"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>System Breakdown</CardTitle>
              <CardDescription>Consumption by equipment type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={displaySystemData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {displaySystemData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {displaySystemData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-medium">
                      {typeof item.value === 'number' && item.value > 100 
                        ? `${(item.value / 1000).toFixed(1)}k kWh` 
                        : `${item.value}%`}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Load Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Daily Load Profile
              </CardTitle>
              <CardDescription>Average hourly demand pattern</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayHourlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value} kW`, 'Demand']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="demand" 
                      name="Demand"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Meter Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="w-5 h-5" />
                Meter Status
              </CardTitle>
              <CardDescription>Configured energy meters</CardDescription>
            </CardHeader>
            <CardContent>
              {metersLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : meters && meters.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-auto">
                  {meters.map((meter) => (
                    <div key={meter.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                      <div>
                        <p className="font-medium">{meter.name}</p>
                        <p className="text-xs text-muted-foreground">{meter.meter_tag} • {meter.system_type}</p>
                      </div>
                      <Badge 
                        variant={meter.status === 'active' ? 'default' : 'secondary'}
                        className={meter.status === 'active' ? 'bg-success' : ''}
                      >
                        {meter.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <Gauge className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">No meters configured</p>
                  <Button variant="outline" size="sm" onClick={() => navigate('/monitoring/meters')}>
                    Add Meter
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Efficiency Benchmarks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="w-5 h-5" />
              Efficiency Benchmarks
            </CardTitle>
            <CardDescription>Performance comparison against industry standards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Chiller kW/ton</p>
                  <Badge variant="outline" className="text-success border-success/30 bg-success/10">Good</Badge>
                </div>
                <p className="text-2xl font-bold">0.68</p>
                <p className="text-xs text-muted-foreground mt-1">Target: &lt; 0.70</p>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-success rounded-full" 
                    style={{ width: '97%' }}
                  />
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">AHU CFM/kW</p>
                  <Badge variant="outline" className="text-warning border-warning/30 bg-warning/10">Fair</Badge>
                </div>
                <p className="text-2xl font-bold">285</p>
                <p className="text-xs text-muted-foreground mt-1">Target: &gt; 300</p>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-warning rounded-full" 
                    style={{ width: '75%' }}
                  />
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Pump Efficiency</p>
                  <Badge variant="outline" className="text-success border-success/30 bg-success/10">Good</Badge>
                </div>
                <p className="text-2xl font-bold">82%</p>
                <p className="text-xs text-muted-foreground mt-1">Target: &gt; 80%</p>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-success rounded-full" 
                    style={{ width: '82%' }}
                  />
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">CT Approach</p>
                  <Badge variant="outline" className="text-success border-success/30 bg-success/10">Good</Badge>
                </div>
                <p className="text-2xl font-bold">7.2°F</p>
                <p className="text-xs text-muted-foreground mt-1">Target: &lt; 8°F</p>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-success rounded-full" 
                    style={{ width: '90%' }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-info/5 border-info/20">
          <CardContent className="flex gap-3 pt-4">
            <Info className="w-5 h-5 text-info shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">About Energy Analytics</p>
              <p>
                {hasRealData 
                  ? `This dashboard displays real energy consumption data from ${meters?.length} configured meter${meters?.length !== 1 ? 's' : ''}. Data refreshes automatically every 5 minutes.`
                  : 'This dashboard is showing demo data. Add energy meters to track real consumption from your building systems. Connect meters to chillers, AHUs, pumps, and other equipment to monitor efficiency.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
