import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Volume2,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Clock,
  MapPin,
  ExternalLink,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  useAcousticAlerts,
  useAcknowledgeAcousticAlert,
  useResolveAcousticAlert,
  useTriggerAcousticAlertCheck,
} from '@/hooks/useAcousticAlerts';

interface AcousticAlertsPanelProps {
  projectId?: string;
  onViewZone?: (zoneId: string) => void;
}

export function AcousticAlertsPanel({
  projectId,
  onViewZone,
}: AcousticAlertsPanelProps) {
  const { data: alerts = [], isLoading } = useAcousticAlerts(projectId);
  const acknowledgeAlert = useAcknowledgeAcousticAlert();
  const resolveAlert = useResolveAcousticAlert();
  const triggerCheck = useTriggerAcousticAlertCheck();

  const activeAlerts = alerts.filter(a => a.is_active);
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
  const warningAlerts = activeAlerts.filter(a => a.severity === 'warning');

  const handleAcknowledge = (alertId: string) => {
    acknowledgeAlert.mutate(alertId);
  };

  const handleResolve = (alertId: string) => {
    resolveAlert.mutate(alertId);
  };

  const handleRunCheck = () => {
    triggerCheck.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
            <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Acoustic Alerts</CardTitle>
            {activeAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {activeAlerts.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {criticalAlerts.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {criticalAlerts.length} Critical
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunCheck}
              disabled={triggerCheck.isPending}
            >
              {triggerCheck.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-1.5 hidden sm:inline">Run Check</span>
            </Button>
          </div>
        </div>
        <CardDescription>
          Real-time noise level monitoring alerts
        </CardDescription>
      </CardHeader>

      <CardContent>
        {activeAlerts.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No active acoustic alerts
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              All monitored zones are within NC targets
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {activeAlerts.map(alert => {
                const ncDelta = alert.measured_nc && alert.target_nc 
                  ? alert.measured_nc - alert.target_nc 
                  : null;

                return (
                  <div
                    key={alert.id}
                    className={cn(
                      'p-3 rounded-lg border transition-colors',
                      alert.severity === 'critical' && 'border-destructive/50 bg-destructive/5',
                      alert.severity === 'warning' && 'border-amber-500/50 bg-amber-500/5',
                      alert.severity === 'info' && 'border-primary/30 bg-primary/5'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle
                          className={cn(
                            'h-4 w-4 mt-0.5',
                            alert.severity === 'critical' && 'text-destructive',
                            alert.severity === 'warning' && 'text-amber-500',
                            alert.severity === 'info' && 'text-primary'
                          )}
                        />
                        <div>
                          <p className="font-medium text-sm">{alert.message}</p>
                          
                          {/* NC Details */}
                          {alert.measured_nc !== undefined && alert.measured_nc !== null && (
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                Measured: NC-{alert.measured_nc}
                              </Badge>
                              {alert.target_nc !== undefined && alert.target_nc !== null && (
                                <Badge variant="outline" className="text-xs">
                                  Target: NC-{alert.target_nc}
                                </Badge>
                              )}
                              {ncDelta !== null && ncDelta > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  +{ncDelta} dB
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Zone Name */}
                          {alert.zone?.name && (
                            <div className="mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {alert.zone.name}
                              </Badge>
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(alert.triggered_at), { addSuffix: true })}
                            </span>
                            {alert.device?.device_name && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {alert.device.device_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant={
                          alert.severity === 'critical' ? 'destructive' :
                          alert.severity === 'warning' ? 'secondary' : 'outline'
                        }
                        className="text-xs shrink-0"
                      >
                        {alert.severity}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t">
                      {!alert.acknowledged_at && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleAcknowledge(alert.id)}
                          disabled={acknowledgeAlert.isPending}
                        >
                          <Bell className="h-3 w-3 mr-1" />
                          Acknowledge
                        </Button>
                      )}
                      {alert.acknowledged_at && !alert.resolved_at && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleResolve(alert.id)}
                          disabled={resolveAlert.isPending}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Resolve
                        </Button>
                      )}
                      {alert.acoustic_zone_id && onViewZone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs ml-auto"
                          onClick={() => onViewZone(alert.acoustic_zone_id!)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Zone
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Summary Footer */}
        {activeAlerts.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t text-sm">
            <span className="text-muted-foreground">
              {criticalAlerts.length} critical, {warningAlerts.length} warning
            </span>
            <Button variant="ghost" size="sm" className="text-xs">
              View All Alerts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}