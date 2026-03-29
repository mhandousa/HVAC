import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Calendar,
  Wrench,
} from 'lucide-react';
import { RemediationRecord } from '@/hooks/useZoneRemediationHistory';
import { format } from 'date-fns';

interface RemediationBeforeAfterCardProps {
  record: RemediationRecord;
  onViewDetails?: () => void;
  onRecordAfterMeasurement?: () => void;
  compact?: boolean;
}

export function RemediationBeforeAfterCard({
  record,
  onViewDetails,
  onRecordAfterMeasurement,
  compact = false,
}: RemediationBeforeAfterCardProps) {
  const statusConfig = {
    'pending-verification': {
      label: 'Pending Verification',
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      badgeVariant: 'secondary' as const,
    },
    'verified-success': {
      label: 'Target Achieved',
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      badgeVariant: 'default' as const,
    },
    'verified-partial': {
      label: 'Partially Improved',
      icon: ArrowDown,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      badgeVariant: 'secondary' as const,
    },
    'verified-failed': {
      label: 'No Improvement',
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive/30',
      badgeVariant: 'destructive' as const,
    },
  };

  const config = statusConfig[record.status];
  const StatusIcon = config.icon;

  const treatmentSummary =
    record.treatmentsApplied.length === 1
      ? record.treatmentsApplied[0].description
      : `${record.treatmentsApplied.length} treatments applied`;

  if (compact) {
    return (
      <div
        className={`flex items-center justify-between p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}
      >
        <div className="flex items-center gap-3">
          <StatusIcon className={`h-4 w-4 ${config.color}`} />
          <div>
            <div className="font-medium text-sm">{record.zoneName}</div>
            <div className="text-xs text-muted-foreground">{treatmentSummary}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm">
              <span className="text-destructive font-medium">
                NC-{record.beforeMeasurement.overallNC}
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span
                className={`font-medium ${
                  record.afterMeasurement
                    ? record.afterMeasurement.overallNC <= record.targetNC
                      ? 'text-green-600'
                      : 'text-amber-500'
                    : 'text-muted-foreground'
                }`}
              >
                {record.afterMeasurement
                  ? `NC-${record.afterMeasurement.overallNC}`
                  : '—'}
              </span>
            </div>
            {record.improvement !== undefined && (
              <div className="text-xs text-green-600">-{record.improvement} dB</div>
            )}
          </div>
          {onViewDetails && (
            <Button variant="ghost" size="icon" onClick={onViewDetails}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-semibold">{record.zoneName}</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(record.remediationDate), 'MMM d, yyyy')}
            </div>
          </div>
          <Badge variant={config.badgeVariant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {config.label}
          </Badge>
        </div>

        {/* NC Values Display */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 rounded-lg bg-background/50">
            <div className="text-xs text-muted-foreground mb-1">Before</div>
            <div className="text-xl font-bold text-destructive">
              NC-{record.beforeMeasurement.overallNC}
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              {record.improvement !== undefined && (
                <div
                  className={`text-sm font-bold mt-1 ${
                    record.improvement > 0 ? 'text-green-600' : 'text-destructive'
                  }`}
                >
                  {record.improvement > 0 ? '-' : '+'}
                  {Math.abs(record.improvement)} dB
                </div>
              )}
            </div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-background/50">
            <div className="text-xs text-muted-foreground mb-1">After</div>
            {record.afterMeasurement ? (
              <div
                className={`text-xl font-bold ${
                  record.afterMeasurement.overallNC <= record.targetNC
                    ? 'text-green-600'
                    : 'text-amber-500'
                }`}
              >
                NC-{record.afterMeasurement.overallNC}
              </div>
            ) : (
              <div className="text-xl font-bold text-muted-foreground">—</div>
            )}
          </div>
        </div>

        {/* Target */}
        <div className="flex items-center justify-center gap-2 text-sm mb-4">
          <span className="text-muted-foreground">Target:</span>
          <span className="font-medium">NC-{record.targetNC}</span>
        </div>

        {/* Treatments */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Wrench className="h-3 w-3" />
            Treatments Applied
          </div>
          <div className="space-y-1">
            {record.treatmentsApplied.map((treatment, idx) => (
              <div
                key={idx}
                className="text-sm p-2 rounded bg-background/50 flex items-center justify-between"
              >
                <span>{treatment.description}</span>
                {treatment.productModel && (
                  <Badge variant="outline" className="text-xs">
                    {treatment.productModel}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {record.status === 'pending-verification' && onRecordAfterMeasurement && (
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={onRecordAfterMeasurement}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Record After Measurement
            </Button>
          )}
          {onViewDetails && (
            <Button
              variant={record.status === 'pending-verification' ? 'outline' : 'default'}
              size="sm"
              className={record.status !== 'pending-verification' ? 'flex-1' : ''}
              onClick={onViewDetails}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
