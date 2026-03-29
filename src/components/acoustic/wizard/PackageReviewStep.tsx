import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileDown,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  Layers,
  Activity,
  DollarSign,
  TrendingDown,
  Calendar,
  ClipboardList,
} from 'lucide-react';
import { TreatmentPackage } from '@/lib/treatment-package-optimizer';
import { formatCurrencySAR } from '@/lib/acoustic-cost-calculations';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { InstallationTimelineView } from './InstallationTimelineView';

interface PackageReviewStepProps {
  selectedPackage: TreatmentPackage;
  projectName?: string;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
}

const CATEGORY_COLORS = {
  silencers: '#3b82f6',
  lining: '#f59e0b',
  vibrationIsolation: '#8b5cf6',
  panels: '#22c55e',
};

export function PackageReviewStep({
  selectedPackage,
  projectName,
  onExportPDF,
  onExportExcel,
}: PackageReviewStepProps) {
  const pieData = [
    { name: 'Silencers', value: selectedPackage.costBreakdown.silencers, color: CATEGORY_COLORS.silencers },
    { name: 'Duct Lining', value: selectedPackage.costBreakdown.lining, color: CATEGORY_COLORS.lining },
    { name: 'Vibration', value: selectedPackage.costBreakdown.vibrationIsolation, color: CATEGORY_COLORS.vibrationIsolation },
    { name: 'Panels', value: selectedPackage.costBreakdown.panels, color: CATEGORY_COLORS.panels },
  ].filter(d => d.value > 0);

  const totalTreatments = selectedPackage.zones.reduce((sum, z) => sum + z.treatments.length, 0);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Package Review</h3>
        <p className="text-sm text-muted-foreground">
          Review your selected treatment package and installation schedule.
        </p>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Zone Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4 mt-4">
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{selectedPackage.name}</CardTitle>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {formatCurrencySAR(selectedPackage.totalCost)}
                </Badge>
              </div>
              <CardDescription>{selectedPackage.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 rounded-lg bg-background">
                  <p className="text-2xl font-bold">{selectedPackage.zonesAddressed}</p>
                  <p className="text-xs text-muted-foreground">Zones Treated</p>
                </div>
                <div className="p-3 rounded-lg bg-background">
                  <p className="text-2xl font-bold">{selectedPackage.expectedCompliancePercent}%</p>
                  <p className="text-xs text-muted-foreground">Expected Compliance</p>
                </div>
                <div className="p-3 rounded-lg bg-background">
                  <p className="text-2xl font-bold">-{selectedPackage.avgNCReduction} dB</p>
                  <p className="text-xs text-muted-foreground">Avg NC Reduction</p>
                </div>
                <div className="p-3 rounded-lg bg-background">
                  <p className="text-2xl font-bold">{totalTreatments}</p>
                  <p className="text-xs text-muted-foreground">Total Treatments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Cost Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrencySAR(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    No cost data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-primary" />
                  Treatment Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-5 w-5 text-blue-600" />
                      <span>Silencers</span>
                    </div>
                    <p className="font-semibold">{formatCurrencySAR(selectedPackage.costBreakdown.silencers)}</p>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10">
                    <div className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-amber-600" />
                      <span>Duct Lining</span>
                    </div>
                    <p className="font-semibold">{formatCurrencySAR(selectedPackage.costBreakdown.lining)}</p>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-purple-600" />
                      <span>Vibration Isolation</span>
                    </div>
                    <p className="font-semibold">{formatCurrencySAR(selectedPackage.costBreakdown.vibrationIsolation)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <InstallationTimelineView selectedPackage={selectedPackage} projectName={projectName} />
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Zone Treatment Details</CardTitle>
              <CardDescription>Detailed breakdown of treatments for each zone</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {selectedPackage.zones.map(zone => (
                    <div key={zone.zoneId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{zone.zoneName}</h4>
                          <p className="text-xs text-muted-foreground">
                            {zone.spaceType} • Target: NC-{zone.targetNC}
                          </p>
                        </div>
                        <div className="text-right">
                          {zone.willBeCompliant ? (
                            <Badge className="bg-green-500/20 text-green-700 border-green-500/30">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Compliant
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 border-amber-500/30">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Partial
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mb-3 text-sm">
                        <span className="text-muted-foreground">
                          NC-{zone.currentNC} → NC-{zone.estimatedFinalNC}
                        </span>
                        <Badge variant="outline">-{zone.expectedNCReduction} dB</Badge>
                        <span className="text-muted-foreground ml-auto">{formatCurrencySAR(zone.totalCost)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="space-y-2">
                        {zone.treatments.map((treatment, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {treatment.category === 'silencer' && <Volume2 className="h-4 w-4 text-blue-500" />}
                              {treatment.category === 'lining' && <Layers className="h-4 w-4 text-amber-500" />}
                              {treatment.category === 'isolator' && <Activity className="h-4 w-4 text-purple-500" />}
                              <span>{treatment.name}</span>
                              <span className="text-muted-foreground">×{treatment.quantity}</span>
                            </div>
                            <span>{formatCurrencySAR(treatment.totalCost)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3">
        <Button onClick={onExportPDF} className="flex-1">
          <FileDown className="h-4 w-4 mr-2" />
          Export PDF Report
        </Button>
        <Button variant="outline" onClick={onExportExcel} className="flex-1">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
      </div>
    </div>
  );
}
