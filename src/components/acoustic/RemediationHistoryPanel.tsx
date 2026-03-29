import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  History,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  TrendingDown,
  DollarSign,
  X,
} from 'lucide-react';
import { useZoneRemediationHistory, RemediationStats } from '@/hooks/useZoneRemediationHistory';
import { RemediationTimelineItem } from './RemediationTimelineItem';
import { ZoneAcousticData } from '@/hooks/useZoneAcousticAnalysis';

interface RemediationHistoryPanelProps {
  zone: ZoneAcousticData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecordAfterMeasurement?: (recordId: string) => void;
}

function StatsCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
      <Icon className={`h-4 w-4 ${color}`} />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}

export function RemediationHistoryPanel({
  zone,
  open,
  onOpenChange,
  onRecordAfterMeasurement,
}: RemediationHistoryPanelProps) {
  const { remediationRecords, stats, isLoading } = useZoneRemediationHistory(zone.zoneId);

  // Calculate cumulative improvement
  const firstRecord = remediationRecords[remediationRecords.length - 1];
  const latestRecord = remediationRecords[0];
  const cumulativeImprovement =
    firstRecord && latestRecord?.afterMeasurement
      ? firstRecord.beforeMeasurement.overallNC - latestRecord.afterMeasurement.overallNC
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Remediation History - {zone.zoneName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Summary stats */}
          <div className="px-6 py-4 border-b bg-muted/20">
            <div className="grid grid-cols-4 gap-3">
              <StatsCard
                icon={CheckCircle2}
                label="Success"
                value={stats.verifiedSuccess}
                color="text-green-500"
              />
              <StatsCard
                icon={AlertCircle}
                label="Partial"
                value={stats.verifiedPartial}
                color="text-amber-500"
              />
              <StatsCard
                icon={Clock}
                label="Pending"
                value={stats.pendingVerification}
                color="text-blue-500"
              />
              <StatsCard
                icon={XCircle}
                label="Failed"
                value={stats.verifiedFailed}
                color="text-destructive"
              />
            </div>

            {remediationRecords.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Cumulative Improvement</span>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    {cumulativeImprovement > 0 ? `-${cumulativeImprovement}` : cumulativeImprovement} dB
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">Total Cost</span>
                  </div>
                  <span className="font-semibold">
                    SAR {stats.totalCostSar.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <ScrollArea className="flex-1 px-6 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : remediationRecords.length === 0 ? (
              <div className="text-center py-12">
                <History className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <h4 className="font-medium text-muted-foreground">No Remediation History</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Remediation activities for this zone will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {remediationRecords.map((record) => (
                  <RemediationTimelineItem
                    key={record.id}
                    record={record}
                    onRecordAfterMeasurement={onRecordAfterMeasurement}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer summary */}
          {remediationRecords.length > 0 && (
            <div className="px-6 py-3 border-t bg-muted/20">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {firstRecord && (
                    <>
                      Started at NC-{firstRecord.beforeMeasurement.overallNC}
                      {latestRecord?.afterMeasurement && (
                        <> → Currently NC-{latestRecord.afterMeasurement.overallNC}</>
                      )}
                    </>
                  )}
                </span>
                <span className="text-muted-foreground">
                  Target: NC-{zone.targetNC}
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
