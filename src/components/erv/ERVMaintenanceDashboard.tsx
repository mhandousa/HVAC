import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Wrench,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Bell,
  Settings,
  FileText,
  BarChart3
} from 'lucide-react';
import { format, formatDistanceToNow, differenceInDays, addDays } from 'date-fns';
import { 
  useERVMaintenanceSchedules, 
  useERVAlerts,
  useERVPerformanceReadings,
  MAINTENANCE_TYPES,
  type ERVMaintenanceSchedule
} from '@/hooks/useERVMaintenance';
import { ERVMaintenanceScheduleDialog } from './ERVMaintenanceScheduleDialog';
import { ERVMaintenanceLogDialog } from './ERVMaintenanceLogDialog';
import { ERVPerformanceChart } from './ERVPerformanceChart';
import { ERVPredictiveAlertsPanel } from './ERVPredictiveAlertsPanel';
import { EmptyState } from '@/components/ui/empty-state';

export function ERVMaintenanceDashboard() {
  const [selectedSchedule, setSelectedSchedule] = useState<ERVMaintenanceSchedule | null>(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [logScheduleId, setLogScheduleId] = useState<string | null>(null);

  const { 
    schedules, 
    isLoading, 
    upcomingMaintenance, 
    overdueMaintenance 
  } = useERVMaintenanceSchedules();

  const { alerts, criticalAlerts, warningAlerts, acknowledgeAlert, resolveAlert } = useERVAlerts();
  const { readings, performanceTrend } = useERVPerformanceReadings();

  const getMaintenanceStatus = (schedule: ERVMaintenanceSchedule) => {
    const daysUntilDue = differenceInDays(new Date(schedule.next_due_at), new Date());
    
    if (daysUntilDue < 0) {
      return { status: 'overdue', color: 'destructive', label: `${Math.abs(daysUntilDue)} days overdue` };
    } else if (daysUntilDue <= schedule.reminder_days_before) {
      return { status: 'upcoming', color: 'warning', label: `Due in ${daysUntilDue} days` };
    } else {
      return { status: 'ok', color: 'secondary', label: `Due in ${daysUntilDue} days` };
    }
  };

  const getMaintenanceTypeIcon = (type: string) => {
    switch (type) {
      case 'filter_replacement':
        return <Filter className="h-4 w-4" />;
      case 'coil_cleaning':
      case 'wheel_inspection':
      case 'belt_check':
        return <Wrench className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const handleLogMaintenance = (scheduleId: string) => {
    setLogScheduleId(scheduleId);
    setIsLogDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total ERV Units</p>
                <p className="text-2xl font-bold">{schedules.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Settings className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={overdueMaintenance.length > 0 ? 'border-destructive' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-destructive">{overdueMaintenance.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={upcomingMaintenance.length > 0 ? 'border-yellow-500' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Due Soon</p>
                <p className="text-2xl font-bold text-yellow-600">{upcomingMaintenance.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold">{alerts.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Bell className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Critical Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                  <div className="flex gap-2">
                    {!alert.acknowledged_at && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => acknowledgeAlert.mutate(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => resolveAlert.mutate(alert.id)}
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="schedules" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="schedules">
              <Calendar className="h-4 w-4 mr-2" />
              Schedules
            </TabsTrigger>
            <TabsTrigger value="performance">
              <BarChart3 className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <Bell className="h-4 w-4 mr-2" />
              Alerts
              {alerts.length > 0 && (
                <Badge variant="secondary" className="ml-2">{alerts.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="predictive">
              <TrendingUp className="h-4 w-4 mr-2" />
              Predictive
            </TabsTrigger>
          </TabsList>
          <Button onClick={() => setIsScheduleDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add ERV Schedule
          </Button>
        </div>

        <TabsContent value="schedules" className="space-y-4">
          {schedules.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No ERV Maintenance Schedules"
              description="Create your first ERV maintenance schedule to track filter replacements and performance."
              action={{
                label: 'Add Schedule',
                onClick: () => setIsScheduleDialogOpen(true)
              }}
            />
          ) : (
            <div className="grid gap-4">
              {schedules.map((schedule) => {
                const status = getMaintenanceStatus(schedule);
                const maintenanceType = MAINTENANCE_TYPES.find(t => t.value === schedule.maintenance_type);
                
                return (
                  <Card key={schedule.id} className={status.status === 'overdue' ? 'border-destructive' : ''}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            status.status === 'overdue' ? 'bg-destructive/10 text-destructive' :
                            status.status === 'upcoming' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {getMaintenanceTypeIcon(schedule.maintenance_type)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{schedule.erv_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {maintenanceType?.label || schedule.maintenance_type}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Every {schedule.frequency_days} days
                              </span>
                              {schedule.last_performed_at && (
                                <span className="text-muted-foreground">
                                  Last: {format(new Date(schedule.last_performed_at), 'MMM d, yyyy')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={status.color as any}>
                            {status.label}
                          </Badge>
                          <Button 
                            size="sm"
                            onClick={() => handleLogMaintenance(schedule.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Log Maintenance
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedSchedule(schedule);
                              setIsScheduleDialogOpen(true);
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Progress bar showing time until due */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Last maintenance</span>
                          <span>Next due: {format(new Date(schedule.next_due_at), 'MMM d, yyyy')}</span>
                        </div>
                        <Progress 
                          value={Math.max(0, Math.min(100, 
                            ((schedule.frequency_days - differenceInDays(new Date(schedule.next_due_at), new Date())) / schedule.frequency_days) * 100
                          ))} 
                          className={status.status === 'overdue' ? '[&>div]:bg-destructive' : ''}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Sensible Efficiency</p>
                    <p className="text-2xl font-bold">
                      {performanceTrend?.avgEfficiency?.toFixed(1) || '--'}%
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {performanceTrend?.direction === 'improving' && (
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    )}
                    {performanceTrend?.direction === 'declining' && (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    )}
                    {performanceTrend?.direction === 'stable' && (
                      <Minus className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </div>
                {performanceTrend && (
                  <p className={`text-xs mt-1 ${
                    performanceTrend.direction === 'improving' ? 'text-green-600' :
                    performanceTrend.direction === 'declining' ? 'text-red-600' :
                    'text-muted-foreground'
                  }`}>
                    {performanceTrend.changePercent > 0 ? '+' : ''}{performanceTrend.changePercent.toFixed(1)}% vs previous period
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">Total Readings</p>
                  <p className="text-2xl font-bold">{readings.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">Performance Trend</p>
                  <Badge variant={
                    performanceTrend?.direction === 'improving' ? 'default' :
                    performanceTrend?.direction === 'declining' ? 'destructive' :
                    'secondary'
                  }>
                    {performanceTrend?.direction || 'No data'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <ERVPerformanceChart readings={readings} />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No Active Alerts"
              description="All ERV systems are operating normally with no maintenance alerts."
            />
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Card key={alert.id} className={
                  alert.severity === 'critical' ? 'border-destructive' :
                  alert.severity === 'warning' ? 'border-yellow-500' : ''
                }>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          alert.severity === 'critical' ? 'bg-destructive/10 text-destructive' :
                          alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {alert.severity === 'critical' ? (
                            <AlertTriangle className="h-4 w-4" />
                          ) : (
                            <Bell className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{alert.title}</h4>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created {formatDistanceToNow(new Date(alert.created_at))} ago
                            {alert.acknowledged_at && ' • Acknowledged'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!alert.acknowledged_at && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => acknowledgeAlert.mutate(alert.id)}
                          >
                            Acknowledge
                          </Button>
                        )}
                        <Button 
                          size="sm"
                          onClick={() => resolveAlert.mutate(alert.id)}
                        >
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="predictive" className="space-y-4">
          <ERVPredictiveAlertsPanel />
        </TabsContent>
      </Tabs>

      <ERVMaintenanceScheduleDialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
        schedule={selectedSchedule}
        onClose={() => {
          setSelectedSchedule(null);
          setIsScheduleDialogOpen(false);
        }}
      />

      <ERVMaintenanceLogDialog
        open={isLogDialogOpen}
        onOpenChange={setIsLogDialogOpen}
        scheduleId={logScheduleId}
        onClose={() => {
          setLogScheduleId(null);
          setIsLogDialogOpen(false);
        }}
      />
    </div>
  );
}
