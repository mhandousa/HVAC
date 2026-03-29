import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  Bell,
  BellOff,
} from 'lucide-react';
import { 
  useMonitoringAlerts, 
  useAcknowledgeAlert, 
  useResolveAlert,
  getAlertSeverityStyles,
  type MonitoringAlert 
} from '@/hooks/useMonitoringAlerts';
import { Skeleton } from '@/components/ui/skeleton';

function getSeverityIcon(severity: MonitoringAlert['severity']) {
  switch (severity) {
    case 'critical':
      return <AlertCircle className="h-4 w-4" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4" />;
    case 'info':
      return <Info className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

interface AlertsPanelProps {
  showResolved?: boolean;
  maxHeight?: string;
}

export function AlertsPanel({ showResolved = false, maxHeight = '400px' }: AlertsPanelProps) {
  const { data: alerts, isLoading, error } = useMonitoringAlerts(!showResolved);
  const acknowledgeAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Failed to load alerts
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Active Alerts</h3>
        <p className="text-muted-foreground">
          All systems operating normally
        </p>
      </div>
    );
  }

  return (
    <ScrollArea style={{ maxHeight }}>
      <div className="space-y-3 pr-4">
        {alerts.map((alert) => {
          const styles = getAlertSeverityStyles(alert.severity);
          return (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${styles.bg} ${styles.border} transition-all`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${styles.text}`}>
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={styles.badge}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(alert.triggered_at), { addSuffix: true })}
                      </span>
                    </div>
                    <h4 className="font-medium text-sm">{alert.title}</h4>
                    {alert.message && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {alert.message}
                      </p>
                    )}
                    {alert.device && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Device: {alert.device.name}
                      </p>
                    )}
                    {alert.equipment && (
                      <p className="text-xs text-muted-foreground">
                        Equipment: {alert.equipment.tag} - {alert.equipment.name}
                      </p>
                    )}
                    {alert.acknowledged_at && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Acknowledged {formatDistanceToNow(new Date(alert.acknowledged_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {!alert.acknowledged_at && alert.is_active && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => acknowledgeAlert.mutate(alert.id)}
                      disabled={acknowledgeAlert.isPending}
                    >
                      Acknowledge
                    </Button>
                  )}
                  {alert.is_active && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => resolveAlert.mutate(alert.id)}
                      disabled={resolveAlert.isPending}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
