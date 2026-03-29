import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, isWithinInterval } from 'date-fns';
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  FileBarChart,
  Wrench,
  CalendarCheck,
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  Box,
  Download,
  Layers,
} from 'lucide-react';
import { useWorkOrders } from '@/hooks/useWorkOrders';
import { usePMSchedules } from '@/hooks/usePMSchedules';
import { useEquipment, getWarrantyStatus } from '@/hooks/useEquipment';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Reports() {
  const [timeRange, setTimeRange] = useState('6');
  const { data: workOrders = [] } = useWorkOrders();
  const { data: pmSchedules = [] } = usePMSchedules();
  const { data: equipment = [] } = useEquipment();

  const months = parseInt(timeRange);
  const endDate = new Date();
  const startDate = subMonths(startOfMonth(endDate), months - 1);

  // Work Order Analytics
  const workOrderStats = useMemo(() => {
    const total = workOrders.length;
    const completed = workOrders.filter(wo => wo.status === 'completed').length;
    const open = workOrders.filter(wo => wo.status === 'open').length;
    const inProgress = workOrders.filter(wo => wo.status === 'in_progress').length;
    
    const byPriority = {
      high: workOrders.filter(wo => wo.priority === 'high' || wo.priority === 'urgent').length,
      medium: workOrders.filter(wo => wo.priority === 'medium').length,
      low: workOrders.filter(wo => wo.priority === 'low').length,
    };

    const pmGenerated = workOrders.filter(wo => wo.pm_schedule_id).length;
    const reactive = total - pmGenerated;

    // Completion rate
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Average time to complete (for completed orders)
    const completedOrders = workOrders.filter(wo => wo.status === 'completed' && wo.completed_at);
    let avgCompletionDays = 0;
    if (completedOrders.length > 0) {
      const totalDays = completedOrders.reduce((sum, wo) => {
        const created = new Date(wo.created_at);
        const completed = new Date(wo.completed_at!);
        return sum + Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      }, 0);
      avgCompletionDays = Math.round(totalDays / completedOrders.length);
    }

    return {
      total,
      completed,
      open,
      inProgress,
      byPriority,
      pmGenerated,
      reactive,
      completionRate,
      avgCompletionDays,
    };
  }, [workOrders]);

  // Monthly work order trends
  const monthlyTrends = useMemo(() => {
    const monthIntervals = eachMonthOfInterval({ start: startDate, end: endDate });
    
    return monthIntervals.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthOrders = workOrders.filter(wo => {
        const created = new Date(wo.created_at);
        return isWithinInterval(created, { start: monthStart, end: monthEnd });
      });

      const completed = monthOrders.filter(wo => wo.status === 'completed').length;
      const created = monthOrders.length;

      return {
        month: format(month, 'MMM'),
        created,
        completed,
      };
    });
  }, [workOrders, startDate, endDate]);

  // PM Schedule Analytics
  const pmStats = useMemo(() => {
    const total = pmSchedules.length;
    const active = pmSchedules.filter(pm => pm.is_active).length;
    const overdue = pmSchedules.filter(pm => {
      if (!pm.next_due_at) return false;
      return new Date(pm.next_due_at) < new Date();
    }).length;

    const byFrequency = {
      daily: pmSchedules.filter(pm => pm.frequency_type === 'daily').length,
      weekly: pmSchedules.filter(pm => pm.frequency_type === 'weekly').length,
      monthly: pmSchedules.filter(pm => pm.frequency_type === 'monthly').length,
      quarterly: pmSchedules.filter(pm => pm.frequency_type === 'quarterly').length,
      yearly: pmSchedules.filter(pm => pm.frequency_type === 'yearly').length,
    };

    // Completion tracking (based on last_completed_at)
    const completedRecently = pmSchedules.filter(pm => {
      if (!pm.last_completed_at) return false;
      const lastCompleted = new Date(pm.last_completed_at);
      return isWithinInterval(lastCompleted, { start: startDate, end: endDate });
    }).length;

    return {
      total,
      active,
      overdue,
      byFrequency,
      completedRecently,
      complianceRate: total > 0 ? Math.round(((total - overdue) / total) * 100) : 100,
    };
  }, [pmSchedules, startDate, endDate]);

  // Equipment Health Analytics
  const equipmentStats = useMemo(() => {
    const total = equipment.length;
    const operational = equipment.filter(eq => eq.status === 'operational').length;
    const maintenance = equipment.filter(eq => eq.status === 'maintenance').length;
    const offline = equipment.filter(eq => eq.status === 'offline').length;

    // Warranty status
    const warrantyExpired = equipment.filter(eq => {
      const status = getWarrantyStatus(eq.warranty_expiry);
      return status.status === 'expired';
    }).length;

    const warrantyExpiringSoon = equipment.filter(eq => {
      const status = getWarrantyStatus(eq.warranty_expiry);
      return status.status === 'expiring-soon';
    }).length;

    const underWarranty = equipment.filter(eq => {
      const status = getWarrantyStatus(eq.warranty_expiry);
      return status.status === 'valid';
    }).length;

    // Equipment with most work orders
    const workOrderCounts = equipment.map(eq => ({
      id: eq.id,
      name: eq.name,
      tag: eq.tag,
      count: workOrders.filter(wo => wo.equipment_id === eq.id).length,
    })).sort((a, b) => b.count - a.count).slice(0, 5);

    // Health score (simple calculation)
    const healthScore = total > 0 ? Math.round((operational / total) * 100) : 100;

    return {
      total,
      operational,
      maintenance,
      offline,
      warrantyExpired,
      warrantyExpiringSoon,
      underWarranty,
      workOrderCounts,
      healthScore,
    };
  }, [equipment, workOrders]);

  // Chart data
  const workOrderTypeData = [
    { name: 'PM Generated', value: workOrderStats.pmGenerated, color: 'hsl(var(--primary))' },
    { name: 'Reactive', value: workOrderStats.reactive, color: 'hsl(var(--chart-2))' },
  ];

  const workOrderStatusData = [
    { name: 'Completed', value: workOrderStats.completed, color: 'hsl(142, 76%, 36%)' },
    { name: 'In Progress', value: workOrderStats.inProgress, color: 'hsl(var(--primary))' },
    { name: 'Open', value: workOrderStats.open, color: 'hsl(var(--chart-4))' },
  ];

  const equipmentStatusData = [
    { name: 'Operational', value: equipmentStats.operational, color: 'hsl(142, 76%, 36%)' },
    { name: 'Maintenance', value: equipmentStats.maintenance, color: 'hsl(var(--chart-4))' },
    { name: 'Offline', value: equipmentStats.offline, color: 'hsl(var(--destructive))' },
  ];

  const pmFrequencyData = Object.entries(pmStats.byFrequency)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileBarChart className="w-6 h-6" />
              Maintenance Reports
            </h1>
            <p className="text-muted-foreground">
              Analytics and insights for maintenance operations
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="gap-2">
              <Link to="/reports/zones">
                <Layers className="w-4 h-4" />
                Zone Reports
              </Link>
            </Button>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Last 3 months</SelectItem>
                <SelectItem value="6">Last 6 months</SelectItem>
                <SelectItem value="12">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Work Order Completion
              </CardTitle>
              <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workOrderStats.completionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {workOrderStats.completed} of {workOrderStats.total} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                PM Compliance
              </CardTitle>
              <CalendarCheck className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pmStats.complianceRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {pmStats.overdue > 0 ? (
                  <span className="text-warning">{pmStats.overdue} overdue</span>
                ) : (
                  'All PMs on schedule'
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Equipment Health
              </CardTitle>
              <Box className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{equipmentStats.healthScore}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {equipmentStats.operational} of {equipmentStats.total} operational
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Resolution Time
              </CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workOrderStats.avgCompletionDays} days</div>
              <p className="text-xs text-muted-foreground mt-1">
                Average time to complete work orders
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different report sections */}
        <Tabs defaultValue="work-orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="work-orders" className="gap-2">
              <Wrench className="w-4 h-4" />
              Work Orders
            </TabsTrigger>
            <TabsTrigger value="pm-schedules" className="gap-2">
              <CalendarCheck className="w-4 h-4" />
              PM Schedules
            </TabsTrigger>
            <TabsTrigger value="equipment" className="gap-2">
              <Box className="w-4 h-4" />
              Equipment Health
            </TabsTrigger>
          </TabsList>

          {/* Work Orders Tab */}
          <TabsContent value="work-orders" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Monthly Trends */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Work Order Trends</CardTitle>
                  <CardDescription>Created vs completed work orders over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <Bar dataKey="created" name="Created" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="completed" name="Completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Work Order Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Work Order Source</CardTitle>
                  <CardDescription>PM-generated vs reactive work orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={workOrderTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {workOrderTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    {workOrderTypeData.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Status Distribution</CardTitle>
                  <CardDescription>Current work order status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={workOrderStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {workOrderStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-4 flex-wrap">
                    {workOrderStatusData.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Priority Breakdown */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Priority Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-2xl font-bold text-destructive">{workOrderStats.byPriority.high}</p>
                      <p className="text-sm text-muted-foreground">High/Urgent Priority</p>
                    </div>
                    <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                      <p className="text-2xl font-bold text-warning">{workOrderStats.byPriority.medium}</p>
                      <p className="text-sm text-muted-foreground">Medium Priority</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted border border-border">
                      <p className="text-2xl font-bold">{workOrderStats.byPriority.low}</p>
                      <p className="text-sm text-muted-foreground">Low Priority</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* PM Schedules Tab */}
          <TabsContent value="pm-schedules" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* PM Summary Cards */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">PM Schedule Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm">Total Schedules</span>
                    <span className="font-bold">{pmStats.total}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                    <span className="text-sm">Active Schedules</span>
                    <span className="font-bold text-green-600">{pmStats.active}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <span className="text-sm">Overdue</span>
                    </div>
                    <span className="font-bold text-destructive">{pmStats.overdue}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                    <span className="text-sm">Completed This Period</span>
                    <span className="font-bold text-primary">{pmStats.completedRecently}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Frequency Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Schedule Frequency</CardTitle>
                  <CardDescription>Distribution by maintenance interval</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pmFrequencyData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pmFrequencyData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-4 flex-wrap">
                    {pmFrequencyData.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span>{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Equipment Health Tab */}
          <TabsContent value="equipment" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Equipment Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Equipment Status</CardTitle>
                  <CardDescription>Current operational status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={equipmentStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {equipmentStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-4 flex-wrap">
                    {equipmentStatusData.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Warranty Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Warranty Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                    <span className="text-sm">Under Warranty</span>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                      {equipmentStats.underWarranty}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-warning" />
                      <span className="text-sm">Expiring Soon (90 days)</span>
                    </div>
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                      {equipmentStats.warrantyExpiringSoon}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <span className="text-sm">Expired</span>
                    </div>
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                      {equipmentStats.warrantyExpired}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Most Serviced Equipment */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Most Serviced Equipment</CardTitle>
                  <CardDescription>Equipment with the highest work order counts</CardDescription>
                </CardHeader>
                <CardContent>
                  {equipmentStats.workOrderCounts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Box className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No work order data available</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {equipmentStats.workOrderCounts.map((eq, i) => (
                        <div key={eq.id} className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{eq.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{eq.tag}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{eq.count}</p>
                            <p className="text-xs text-muted-foreground">work orders</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
