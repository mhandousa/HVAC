import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, AlertTriangle, ChevronRight, Volume2 } from 'lucide-react';
import { FloorRemediationDashboard } from '@/hooks/useFloorRemediationDashboard';

interface PendingVerificationListProps {
  zones: FloorRemediationDashboard['pendingZones'];
  onRecordMeasurement?: (zoneId: string) => void;
  onViewDetails?: (zoneId: string) => void;
}

export function PendingVerificationList({
  zones,
  onRecordMeasurement,
  onViewDetails,
}: PendingVerificationListProps) {
  if (zones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm font-medium">No Pending Verifications</p>
        <p className="text-xs mt-1">All remediations have been verified</p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-64">
      <div className="space-y-2">
        {zones.map((zone) => {
          const isOverdue = zone.daysSinceInstall > 7;
          const isUrgent = zone.daysSinceInstall > 14;

          return (
            <div
              key={zone.zoneId}
              className={`p-3 rounded-lg border transition-colors ${
                isUrgent
                  ? 'bg-destructive/5 border-destructive/30'
                  : isOverdue
                  ? 'bg-amber-500/5 border-amber-500/30'
                  : 'bg-muted/30 border-border'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-sm truncate">
                      {zone.zoneName}
                    </span>
                    {isUrgent && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        Overdue
                      </Badge>
                    )}
                    {isOverdue && !isUrgent && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                        {zone.daysSinceInstall}d
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {zone.treatmentSummary}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Installed {formatDistanceToNow(new Date(zone.installDate), { addSuffix: true })}
                    <span className="mx-1">•</span>
                    {format(new Date(zone.installDate), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="default"
                  className="flex-1 h-7 text-xs"
                  onClick={() => onRecordMeasurement?.(zone.zoneId)}
                >
                  Record Measurement
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs px-2"
                  onClick={() => onViewDetails?.(zone.zoneId)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
