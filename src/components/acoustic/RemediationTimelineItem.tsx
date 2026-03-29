import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Camera,
  VolumeX,
  Wrench,
  ArrowRight,
} from 'lucide-react';
import { RemediationRecord, TreatmentApplied } from '@/hooks/useZoneRemediationHistory';
import { RemediationPhotoGallery } from './RemediationPhotoGallery';

interface RemediationTimelineItemProps {
  record: RemediationRecord;
  onRecordAfterMeasurement?: (recordId: string) => void;
}

const statusConfig = {
  'pending-verification': {
    icon: Clock,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    label: 'Pending Verification',
    badgeVariant: 'secondary' as const,
  },
  'verified-success': {
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    label: 'Target Achieved',
    badgeVariant: 'default' as const,
  },
  'verified-partial': {
    icon: AlertCircle,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    label: 'Partial Improvement',
    badgeVariant: 'secondary' as const,
  },
  'verified-failed': {
    icon: XCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
    label: 'No Improvement',
    badgeVariant: 'destructive' as const,
  },
};

const treatmentIcons: Record<TreatmentApplied['type'], React.ElementType> = {
  silencer: VolumeX,
  'duct-mod': Wrench,
  'equipment-change': Wrench,
  'acoustic-lining': Wrench,
  'flex-duct': Wrench,
};

export function RemediationTimelineItem({
  record,
  onRecordAfterMeasurement,
}: RemediationTimelineItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);

  const config = statusConfig[record.status];
  const StatusIcon = config.icon;
  const hasPhotos =
    (record.photos?.before?.length || 0) > 0 ||
    (record.photos?.after?.length || 0) > 0;
  const photoCount =
    (record.photos?.before?.length || 0) + (record.photos?.after?.length || 0);

  const totalCost = record.treatmentsApplied.reduce(
    (sum, t) => sum + (t.cost || 0),
    0
  );

  return (
    <div className={`relative pl-6 pb-6 border-l-2 ${config.borderColor} last:pb-0`}>
      {/* Timeline dot */}
      <div
        className={`absolute left-0 top-0 w-4 h-4 -translate-x-[9px] rounded-full ${config.bgColor} border-2 ${config.borderColor} flex items-center justify-center`}
      >
        <StatusIcon className={`h-2 w-2 ${config.color}`} />
      </div>

      <div className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-4`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {format(new Date(record.remediationDate), 'MMM d, yyyy')}
              </span>
              <Badge variant={config.badgeVariant} className="text-xs">
                {config.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {record.treatmentsApplied.map((t) => t.description).join(', ')}
            </p>
          </div>
        </div>

        {/* NC Comparison */}
        <div className="flex items-center gap-4 text-sm mb-3">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Before:</span>
            <span className="font-semibold text-destructive">
              NC-{record.beforeMeasurement.overallNC}
            </span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">After:</span>
            {record.afterMeasurement ? (
              <span className={`font-semibold ${record.afterMeasurement.overallNC <= record.targetNC ? 'text-green-500' : 'text-amber-500'}`}>
                NC-{record.afterMeasurement.overallNC}
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
          {record.improvement !== undefined && (
            <Badge variant="outline" className="text-green-600 border-green-300">
              -{record.improvement} dB
            </Badge>
          )}
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2">
          {hasPhotos && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPhotos(!showPhotos)}
              className="text-xs"
            >
              <Camera className="h-3 w-3 mr-1" />
              {photoCount} Photos
            </Button>
          )}
          {record.status === 'pending-verification' && onRecordAfterMeasurement && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onRecordAfterMeasurement(record.id)}
              className="text-xs"
            >
              Record After Measurement
            </Button>
          )}
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs ml-auto">
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Less Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    More Details
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>

        {/* Photos gallery */}
        {showPhotos && hasPhotos && (
          <div className="mt-3 pt-3 border-t">
            <RemediationPhotoGallery
              beforePhotos={record.photos?.before || []}
              afterPhotos={record.photos?.after || []}
            />
          </div>
        )}

        {/* Expanded details */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent>
            <div className="mt-3 pt-3 border-t space-y-3">
              {/* Treatments */}
              <div>
                <h5 className="text-xs font-medium mb-2">Treatments Applied</h5>
                <div className="space-y-1">
                  {record.treatmentsApplied.map((treatment, idx) => {
                    const TreatmentIcon = treatmentIcons[treatment.type];
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs p-2 rounded bg-background/50"
                      >
                        <div className="flex items-center gap-2">
                          <TreatmentIcon className="h-3 w-3 text-muted-foreground" />
                          <span>{treatment.description}</span>
                          {treatment.productModel && (
                            <span className="text-muted-foreground">
                              ({treatment.productModel})
                            </span>
                          )}
                        </div>
                        {treatment.cost && (
                          <span className="text-muted-foreground">
                            SAR {treatment.cost.toLocaleString()}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cost and verification info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {totalCost > 0 && (
                  <div className="p-2 rounded bg-background/50">
                    <span className="text-muted-foreground">Total Cost: </span>
                    <span className="font-medium">SAR {totalCost.toLocaleString()}</span>
                  </div>
                )}
                {record.verifiedAt && (
                  <div className="p-2 rounded bg-background/50">
                    <span className="text-muted-foreground">Verified: </span>
                    <span className="font-medium">
                      {format(new Date(record.verifiedAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
