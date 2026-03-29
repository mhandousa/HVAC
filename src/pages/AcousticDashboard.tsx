import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Volume2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ArrowRight,
  FileText,
  Layers,
  Activity,
  BarChart3,
  Building2,
  DollarSign,
  Calendar,
  TrendingUp,
  GitCompare,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjects } from '@/hooks/useProjects';
import { useFloors } from '@/hooks/useFloors';
import { useBuildings } from '@/hooks/useBuildings';
import { useZoneAcousticAnalysis, ZoneAcousticData } from '@/hooks/useZoneAcousticAnalysis';
import { AcousticReportDialog } from '@/components/acoustic/AcousticReportDialog';
import { AcousticRecommendationsEngineCard } from '@/components/acoustic/AcousticRecommendationsEngineCard';
import { BuildingAcousticComparisonChart } from '@/components/design/BuildingAcousticComparisonChart';
import { useZoneContext } from '@/hooks/useZoneContext';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';

const STATUS_CONFIG = {
  acceptable: { label: 'Acceptable', icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-500' },
  marginal: { label: 'Marginal', icon: AlertTriangle, color: 'text-amber-500', bgColor: 'bg-amber-500' },
  exceeds: { label: 'Exceeds', icon: XCircle, color: 'text-destructive', bgColor: 'bg-destructive' },
  'no-data': { label: 'No Data', icon: HelpCircle, color: 'text-muted-foreground', bgColor: 'bg-muted' },
};

export default function AcousticDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { projectId: storedProjectId, setContext } = useZoneContext();
  const projectIdParam = searchParams.get('project') || storedProjectId;
  
  const { data: projects = [] } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectIdParam || '');
  const [selectedFloorId, setSelectedFloorId] = useState<string>('all');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const queryClient = useQueryClient();
  
  const handleConflictReload = () => {
    queryClient.invalidateQueries({ queryKey: ['zone-acoustic-analysis', selectedProjectId] });
  };

  // Get buildings for selected project
  const { data: buildings = [] } = useBuildings(selectedProjectId || undefined);

  // Sync URL with stored context on mount
  useEffect(() => {
    if (storedProjectId && !searchParams.get('project')) {
      setSearchParams({ project: storedProjectId }, { replace: true });
    }
  }, [storedProjectId, searchParams, setSearchParams]);

  // Handle project selection change
  const handleProjectChange = (newProjectId: string) => {
    setSelectedProjectId(newProjectId);
    setSelectedFloorId('all');
    setContext(newProjectId, null, { replace: true });
  };

  // Get floors for selected project
  const { data: floors = [] } = useFloors(selectedProjectId || undefined);
  
  // Get acoustic analysis data
  const { zones, floorSummary, exceedingZones } = useZoneAcousticAnalysis(
    selectedProjectId || undefined,
    selectedFloorId !== 'all' ? selectedFloorId : undefined
  );

  // Calculate compliance percentage
  const compliancePercent = useMemo(() => {
    const analyzed = floorSummary.totalZones - floorSummary.zonesNoData;
    if (analyzed === 0) return 100;
    return Math.round((floorSummary.zonesAcceptable / analyzed) * 100);
  }, [floorSummary]);

  // Group zones by floor for heatmap
  const zonesByFloor = useMemo(() => {
    const grouped: Record<string, ZoneAcousticData[]> = {};
    zones.forEach(zone => {
      if (!grouped[zone.floorId]) {
        grouped[zone.floorId] = [];
      }
      grouped[zone.floorId].push(zone);
    });
    return grouped;
  }, [zones]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <Breadcrumbs
          items={[
            { label: 'Design Tools', href: '/design' },
            { label: 'Acoustic Dashboard' },
          ]}
        />

        <EditConflictWarning
          entityType="acoustic_dashboard"
          entityId={selectedProjectId || null}
          currentRevisionNumber={0}
          onReload={handleConflictReload}
        />

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Acoustic Dashboard</h1>
              <p className="text-muted-foreground">
                NC compliance overview and remediation tools
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedProjectId} onValueChange={handleProjectChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select project..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => navigate('/design/acoustic-comparison')}>
              <Layers className="h-4 w-4 mr-2" />
              Compare Zones
            </Button>
            <Button variant="outline" onClick={() => setShowReportDialog(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>

        {!selectedProjectId ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Select a project to view acoustic analysis</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-5">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Zones</p>
                      <p className="text-2xl font-bold">{floorSummary.totalZones}</p>
                    </div>
                    <Volume2 className="h-8 w-8 text-primary opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-500/30">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Acceptable</p>
                      <p className="text-2xl font-bold text-green-600">{floorSummary.zonesAcceptable}</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-600 opacity-40" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-500/30">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Marginal</p>
                      <p className="text-2xl font-bold text-amber-500">{floorSummary.zonesMarginal}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-amber-500 opacity-40" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-destructive/30">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Exceeding</p>
                      <p className="text-2xl font-bold text-destructive">{floorSummary.zonesExceeding}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-destructive opacity-40" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Compliance</p>
                      <p className="text-2xl font-bold">{compliancePercent}%</p>
                    </div>
                  </div>
                  <Progress value={compliancePercent} className="h-2 mt-2" />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Zone Heatmap */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">NC Compliance Heatmap</CardTitle>
                      <CardDescription>Zone status by floor</CardDescription>
                    </div>
                    <Select value={selectedFloorId} onValueChange={setSelectedFloorId}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="All floors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Floors</SelectItem>
                        {floors.map(f => (
                          <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {Object.keys(zonesByFloor).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Volume2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No zones with acoustic data found</p>
                      <p className="text-xs">Add terminal units to zones to begin analysis</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(zonesByFloor).map(([floorId, floorZones]) => {
                        const floor = floors.find(f => f.id === floorId);
                        return (
                          <div key={floorId}>
                            <p className="text-sm font-medium mb-2">{floor?.name || 'Unknown Floor'}</p>
                            <div className="flex flex-wrap gap-2">
                              {floorZones.map(zone => {
                                const config = STATUS_CONFIG[zone.status];
                                return (
                                  <div
                                    key={zone.zoneId}
                                    className={cn(
                                      'px-3 py-2 rounded-md border cursor-pointer transition-colors hover:border-primary',
                                      zone.status === 'exceeds' && 'border-destructive/50 bg-destructive/5',
                                      zone.status === 'marginal' && 'border-amber-500/50 bg-amber-500/5',
                                      zone.status === 'acceptable' && 'border-green-500/50 bg-green-500/5',
                                      zone.status === 'no-data' && 'border-muted bg-muted/50'
                                    )}
                                    title={`${zone.zoneName}: NC-${zone.estimatedNC || '?'} (Target: NC-${zone.targetNC})`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <config.icon className={cn('h-4 w-4', config.color)} />
                                      <span className="text-sm font-medium">{zone.zoneName}</span>
                                    </div>
                                    {zone.estimatedNC !== null && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        NC-{zone.estimatedNC} / NC-{zone.targetNC}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Legend */}
                  <div className="flex items-center gap-4 mt-6 pt-4 border-t">
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <div key={key} className="flex items-center gap-1.5">
                        <div className={cn('w-3 h-3 rounded-full', config.bgColor)} />
                        <span className="text-xs text-muted-foreground">{config.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Worst Offenders */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Zones Requiring Action
                  </CardTitle>
                  <CardDescription>Sorted by NC exceedance</CardDescription>
                </CardHeader>
                <CardContent>
                  {exceedingZones.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle2 className="h-8 w-8 mx-auto text-green-600 mb-2" />
                      <p className="text-sm text-muted-foreground">All zones meet NC targets</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {exceedingZones.slice(0, 8).map(zone => (
                        <div
                          key={zone.zoneId}
                          className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 cursor-pointer"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{zone.zoneName}</p>
                            <p className="text-xs text-muted-foreground">{zone.spaceType}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={zone.status === 'exceeds' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              +{zone.ncDelta} dB
                            </Badge>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recommendations Engine & Building Comparison */}
            <div className="grid gap-6 lg:grid-cols-2">
              <AcousticRecommendationsEngineCard
                zones={zones}
                onZoneSelect={(zoneId) => navigate(`/design/acoustic-comparison?zone=${zoneId}`)}
              />
              
              <BuildingAcousticComparisonChart
                zones={zones}
                buildings={buildings}
                floors={floors}
                selectedBuildingId={selectedBuildingId}
                onBuildingSelect={setSelectedBuildingId}
              />
            </div>
            {/* Remediation Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Remediation Tools</CardTitle>
                <CardDescription>Quick access to acoustic treatment calculators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-5">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => navigate('/design/silencer-selection')}
                  >
                    <Volume2 className="h-6 w-6" />
                    <span>Silencer Selection</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => navigate('/design/duct-lining')}
                  >
                    <Layers className="h-6 w-6" />
                    <span>Duct Lining Optimizer</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => navigate('/design/vibration-isolation')}
                  >
                    <Activity className="h-6 w-6" />
                    <span>Vibration Isolation</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => navigate(`/design/acoustic-cost-estimator?project=${selectedProjectId}`)}
                  >
                    <DollarSign className="h-6 w-6" />
                    <span>Cost Estimator</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => navigate('/design/room-acoustics')}
                  >
                    <Volume2 className="h-6 w-6" />
                    <span>Room Acoustics</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => navigate(`/design/lifecycle-cost-analyzer?project=${selectedProjectId}`)}
                  >
                    <Calendar className="h-6 w-6" />
                    <span>Lifecycle Costs</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => navigate(`/design/acoustic-roi?project=${selectedProjectId}`)}
                  >
                    <TrendingUp className="h-6 w-6" />
                    <span>ROI Calculator</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => navigate(`/design/treatment-comparison?project=${selectedProjectId}`)}
                  >
                    <GitCompare className="h-6 w-6" />
                    <span>Treatment Comparison</span>
                  </Button>
                  <Button
                    variant="default"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => navigate(`/design/treatment-wizard?project=${selectedProjectId}`)}
                  >
                    <Sparkles className="h-6 w-6" />
                    <span>Treatment Wizard</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Zone Table */}
            {zones.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Zone NC Analysis Detail</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Zone</TableHead>
                        <TableHead>Space Type</TableHead>
                        <TableHead className="text-center">Target NC</TableHead>
                        <TableHead className="text-center">Estimated NC</TableHead>
                        <TableHead className="text-center">Delta</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead>Top Recommendation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {zones.slice(0, 20).map(zone => {
                        const config = STATUS_CONFIG[zone.status];
                        const StatusIcon = config.icon;
                        return (
                          <TableRow key={zone.zoneId}>
                            <TableCell className="font-medium">{zone.zoneName}</TableCell>
                            <TableCell className="text-muted-foreground">{zone.spaceType}</TableCell>
                            <TableCell className="text-center">NC-{zone.targetNC}</TableCell>
                            <TableCell className="text-center">
                              {zone.estimatedNC !== null ? `NC-${zone.estimatedNC}` : '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              {zone.estimatedNC !== null ? (
                                <span className={cn(
                                  'font-medium',
                                  zone.ncDelta > 0 ? 'text-destructive' : 'text-green-600'
                                )}>
                                  {zone.ncDelta > 0 ? '+' : ''}{zone.ncDelta}
                                </span>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className={cn('gap-1', config.color)}>
                                <StatusIcon className="h-3 w-3" />
                                {config.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {zone.recommendations[0] || '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Report Dialog */}
        <AcousticReportDialog
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
          projectName={selectedProject?.name}
          ncCompliance={zones.length > 0 ? { zones, summary: floorSummary } : undefined}
        />
      </div>
    </DashboardLayout>
  );
}
