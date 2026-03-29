import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  TrendingDown,
  DollarSign,
  FileText,
  Printer,
  Mail,
} from 'lucide-react';
import { ZoneAcousticData } from '@/hooks/useZoneAcousticAnalysis';
import { useFloorRemediationDashboard } from '@/hooks/useFloorRemediationDashboard';
import { RemediationProgressChart } from './RemediationProgressChart';
import { TreatmentBreakdownPieChart } from './TreatmentBreakdownPieChart';
import { PendingVerificationList } from './PendingVerificationList';
import { RemediationHistoryPanel } from './RemediationHistoryPanel';
import { VerificationNotificationSettings } from './VerificationNotificationSettings';

interface FloorRemediationDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zones: ZoneAcousticData[];
  floorName: string;
  projectId?: string;
}

export function FloorRemediationDashboard({
  open,
  onOpenChange,
  zones,
  floorName,
  projectId,
}: FloorRemediationDashboardProps) {
  const { dashboard, isLoading } = useFloorRemediationDashboard(zones, projectId);
  const [selectedZone, setSelectedZone] = useState<ZoneAcousticData | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  const handleZoneClick = (zoneId: string) => {
    const zone = zones.find((z) => z.zoneId === zoneId);
    if (zone) {
      setSelectedZone(zone);
      setShowHistory(true);
    }
  };

  const handleExportReport = () => {
    // Generate and download report
    console.log('Export report', dashboard);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {floorName} Remediation Dashboard
              </DialogTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowNotificationSettings(true)}>
                  <Mail className="h-4 w-4 mr-1" />
                  Reminders
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportReport}>
                  <FileText className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>
              </div>
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{dashboard.totalZones}</div>
                      <div className="text-sm text-muted-foreground">Total Zones</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{dashboard.totalRemediations}</div>
                      <div className="text-sm text-muted-foreground">Remediations</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {dashboard.averageImprovement > 0 ? `-${dashboard.averageImprovement}` : 0} dB
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Improvement</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Verification Progress */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Verification Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Progress value={dashboard.verificationPercent} className="h-2" />
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <CheckCircle2 className="h-5 w-5 mx-auto text-green-500 mb-1" />
                        <div className="text-xl font-bold text-green-600">
                          {dashboard.verificationStatus.success}
                        </div>
                        <div className="text-xs text-muted-foreground">Success</div>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <AlertCircle className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                        <div className="text-xl font-bold text-amber-600">
                          {dashboard.verificationStatus.partial}
                        </div>
                        <div className="text-xs text-muted-foreground">Partial</div>
                      </div>
                      <div className="p-2 rounded-lg bg-destructive/10">
                        <XCircle className="h-5 w-5 mx-auto text-destructive mb-1" />
                        <div className="text-xl font-bold text-destructive">
                          {dashboard.verificationStatus.failed}
                        </div>
                        <div className="text-xs text-muted-foreground">Failed</div>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Clock className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                        <div className="text-xl font-bold text-blue-600">
                          {dashboard.verificationStatus.pending}
                        </div>
                        <div className="text-xs text-muted-foreground">Pending</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Main Content Tabs */}
              <Tabs defaultValue="chart" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="chart">Progress Chart</TabsTrigger>
                  <TabsTrigger value="treatments">Treatment Breakdown</TabsTrigger>
                  <TabsTrigger value="pending">
                    Pending ({dashboard.pendingZones.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chart" className="mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Zone Improvement Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RemediationProgressChart
                        data={dashboard.zoneComparisonData}
                        onZoneClick={handleZoneClick}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="treatments" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Treatment Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <TreatmentBreakdownPieChart data={dashboard.treatmentBreakdown} />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Cost Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          {dashboard.treatmentBreakdown.map((treatment) => (
                            <div
                              key={treatment.type}
                              className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                            >
                              <span className="text-sm">{treatment.label}</span>
                              <span className="font-medium">
                                SAR {treatment.totalCost.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-primary" />
                            <span className="font-medium">Total Investment</span>
                          </div>
                          <span className="text-xl font-bold">
                            SAR {dashboard.totalActualCost.toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="pending" className="mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Zones Pending Verification
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PendingVerificationList
                        zones={dashboard.pendingZones}
                        onRecordMeasurement={handleZoneClick}
                        onViewDetails={handleZoneClick}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Zone History Panel */}
      {selectedZone && (
        <RemediationHistoryPanel
          zone={selectedZone}
          open={showHistory}
          onOpenChange={setShowHistory}
        />
      )}
    </>
  );
}
