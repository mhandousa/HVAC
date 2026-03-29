import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar,
  Wrench,
  TrendingUp,
  Filter,
  Clock,
  Gauge,
  ChevronRight,
} from 'lucide-react';
import { useERVPredictiveAlerts, PredictiveAlert } from '@/hooks/useERVPredictiveMaintenance';
import { useTranslation } from 'react-i18next';
import { format, formatDistanceToNow } from 'date-fns';

interface ERVPredictiveAlertsPanelProps {
  equipmentId?: string;
  onScheduleMaintenance?: (alert: PredictiveAlert) => void;
}

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical':
      return <AlertCircle className="h-5 w-5 text-destructive" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
};

const getSeverityVariant = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'destructive' as const;
    case 'warning':
      return 'default' as const;
    default:
      return 'secondary' as const;
  }
};

const getAlertTypeIcon = (alertType: string) => {
  switch (alertType) {
    case 'filter_clogging':
      return <Filter className="h-4 w-4" />;
    case 'runtime_threshold':
      return <Clock className="h-4 w-4" />;
    case 'pressure_critical':
      return <Gauge className="h-4 w-4" />;
    case 'efficiency_decline':
      return <TrendingUp className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
};

export function ERVPredictiveAlertsPanel({ 
  equipmentId, 
  onScheduleMaintenance 
}: ERVPredictiveAlertsPanelProps) {
  const { t } = useTranslation();
  const { data: alerts, isLoading } = useERVPredictiveAlerts();

  // Filter by equipment if provided
  const filteredAlerts = equipmentId 
    ? alerts?.filter(a => a.equipmentId === equipmentId)
    : alerts;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('Predictive Maintenance Alerts')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const criticalCount = filteredAlerts?.filter(a => a.severity === 'critical').length || 0;
  const warningCount = filteredAlerts?.filter(a => a.severity === 'warning').length || 0;
  const infoCount = filteredAlerts?.filter(a => a.severity === 'info').length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('Predictive Maintenance Alerts')}
          </CardTitle>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive">{criticalCount} Critical</Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="default" className="bg-amber-500">{warningCount} Warning</Badge>
            )}
            {infoCount > 0 && (
              <Badge variant="secondary">{infoCount} Info</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!filteredAlerts || filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>{t('No predictive alerts at this time')}</p>
            <p className="text-sm mt-1">{t('Equipment is operating within normal parameters')}</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {filteredAlerts.map(alert => (
                <Alert
                  key={alert.id}
                  variant={alert.severity === 'critical' ? 'destructive' : 'default'}
                  className={
                    alert.severity === 'warning' 
                      ? 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/20' 
                      : ''
                  }
                >
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1 min-w-0">
                      <AlertTitle className="flex items-center gap-2 flex-wrap">
                        {alert.title}
                        <Badge variant="outline" className="text-xs">
                          {getAlertTypeIcon(alert.alertType)}
                          <span className="ml-1">{alert.equipmentName}</span>
                        </Badge>
                      </AlertTitle>
                      <AlertDescription className="mt-2 space-y-2">
                        <p>{alert.message}</p>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Gauge className="h-3 w-3" />
                            {alert.currentValue.toFixed(1)} / {alert.thresholdValue} {alert.unit}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {alert.confidence}% confidence
                          </Badge>
                        </div>

                        {alert.predictedDate && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Predicted: {format(new Date(alert.predictedDate), 'MMM d, yyyy')}
                              {' '}({formatDistanceToNow(new Date(alert.predictedDate), { addSuffix: true })})
                            </span>
                          </div>
                        )}

                        <div className="p-2 bg-muted/50 rounded text-sm mt-2">
                          <strong>{t('Recommendation')}:</strong> {alert.recommendation}
                        </div>

                        {onScheduleMaintenance && (
                          <div className="flex justify-end mt-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => onScheduleMaintenance(alert)}
                            >
                              <Wrench className="h-3 w-3 mr-2" />
                              {t('Schedule Maintenance')}
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
