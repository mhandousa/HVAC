import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useZoneContext } from '@/hooks/useZoneContext';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { useProjectBOQ, InsulationSettings } from '@/hooks/useProjectBOQ';
import { useBOQExport } from '@/hooks/useBOQExport';
import { INSULATION_MATERIALS, SAUDI_CLIMATE_DATA, SERVICE_TYPES } from '@/lib/thermal-calculations';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileSpreadsheet, 
  FileText, 
  Loader2, 
  Scale,
  Thermometer,
  Settings2,
  ClipboardList,
  ChevronLeft,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { usePreSaveValidation } from '@/hooks/usePreSaveValidation';
import { PreSaveValidationAlert } from '@/components/design/PreSaveValidationAlert';
import { 
  BOQDataSourceIndicator, 
  BOQSummaryCards, 
  BOQTerminalUnitsTable, 
  BOQEquipmentTable, 
  BOQAccessoriesTable, 
  BOQSupportsTable,
  BOQFittingsTable 
} from '@/components/boq';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function MaterialTakeoff() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: projects } = useProjects();
  
  const { projectId: storedProjectId, setContext } = useZoneContext();
  const projectIdFromUrl = searchParams.get('project') || storedProjectId;
  
  // Pre-save validation (using compliance as material-takeoff is read-only export)
  const { blockers, warnings } = usePreSaveValidation(projectIdFromUrl || null, 'sequence-of-operations');
  
  const queryClient = useQueryClient();
  
  const handleConflictReload = () => {
    queryClient.invalidateQueries({ queryKey: ['project-boq', projectIdFromUrl] });
  };
  
  useEffect(() => {
    if (projectIdFromUrl) {
      setContext(projectIdFromUrl, null, { replace: true });
    }
  }, [projectIdFromUrl, setContext]);
  
  const linkedProject = projects?.find(p => p.id === projectIdFromUrl);
  
  const handleBack = () => {
    if (projectIdFromUrl) {
      navigate(`/projects/${projectIdFromUrl}`);
    } else {
      navigate('/design');
    }
  };

  const breadcrumbItems = [
    ...(linkedProject ? [{ label: linkedProject.name, href: `/projects/${linkedProject.id}` }] : []),
    { label: 'Design Tools', href: '/design' },
    { label: 'Material Takeoff / BOQ' },
  ];
  
  const [insulationSettings, setInsulationSettings] = useState<InsulationSettings>({
    includeInsulation: true,
    serviceTypeId: 'chilled_water_supply',
    climateId: 'jeddah',
    insulationMaterialId: 'elastomeric_foam',
  });
  
  const { data: boq, isLoading } = useProjectBOQ({ 
    projectId: projectIdFromUrl, 
    insulationSettings 
  });
  
  const { exportToPDF, exportToExcel } = useBOQExport();
  
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);
  
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const hasData = boq && (
    boq.ductSystems.length > 0 || 
    boq.pipeSystems.length > 0 || 
    boq.terminalUnits.length > 0 ||
    boq.equipmentSelections.length > 0
  );
  
  const weightBreakdownData = boq ? [
    { name: 'Duct Metal', value: boq.summary.totalDuctWeightLbs, unit: 'lbs' },
    { name: 'Pipe Metal', value: boq.summary.totalPipeWeightLbs, unit: 'lbs' },
  ].filter(d => d.value > 0) : [];
  
  const fittingsData = boq ? [
    { name: 'Duct Fittings', count: boq.summary.totalDuctFittings },
    { name: 'Pipe Fittings', count: boq.summary.totalPipeFittings },
    { name: 'Diffusers', count: boq.summary.totalDiffusers },
    { name: 'Terminal Units', count: boq.summary.totalTerminalUnits },
  ].filter(d => d.count > 0) : [];
  
  const allDuctFittings = boq?.ductSystems.flatMap(s => s.fittings) || [];
  const allPipeFittings = boq?.pipeSystems.flatMap(s => s.fittings) || [];
  const allInsulation = boq ? [...boq.ductSystems.flatMap(s => s.insulation), ...boq.pipeSystems.flatMap(s => s.insulation)] : [];
  
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <Breadcrumbs items={breadcrumbItems} />
        
        {/* Pre-save validation alert */}
        <PreSaveValidationAlert blockers={blockers} warnings={warnings} className="mb-2" />
        
        <EditConflictWarning
          entityType="material_takeoff"
          entityId={projectIdFromUrl}
          currentRevisionNumber={0}
          onReload={handleConflictReload}
        />
        
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <ClipboardList className="h-6 w-6 text-primary" />
                Bill of Quantities (BOQ)
              </h1>
              <p className="text-muted-foreground">
                Project-wide material takeoff aggregated from all design systems
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => boq && exportToPDF(boq)}
              disabled={!hasData}
            >
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button
              onClick={() => boq && exportToExcel(boq)}
              disabled={!hasData}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <BOQDataSourceIndicator 
                dataSources={{
                  ductSystems: { name: 'Duct Systems', count: boq?.dataSources.ductSystemsCount || 0 },
                  pipeSystems: { name: 'Pipe Systems', count: boq?.dataSources.pipeSystemsCount || 0 },
                  terminalUnits: { name: 'Terminal Units', count: boq?.summary.totalTerminalUnits || 0 },
                  diffusers: { name: 'Diffusers', count: boq?.summary.totalDiffusers || 0 },
                  equipment: { name: 'Equipment', count: boq?.summary.totalEquipmentPieces || 0 },
                  ahus: { name: 'AHUs', count: boq?.summary.totalAHUs || 0 },
                }}
                isLoading={isLoading}
              />
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Insulation Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-insulation" className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4" />
                      Include Insulation
                    </Label>
                    <Switch
                      id="include-insulation"
                      checked={insulationSettings.includeInsulation}
                      onCheckedChange={(checked) => 
                        setInsulationSettings(prev => ({ ...prev, includeInsulation: checked }))
                      }
                    />
                  </div>
                  
                  {insulationSettings.includeInsulation && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Service Type</Label>
                        <Select 
                          value={insulationSettings.serviceTypeId} 
                          onValueChange={(v) => setInsulationSettings(prev => ({ ...prev, serviceTypeId: v }))}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SERVICE_TYPES.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs">Climate</Label>
                        <Select 
                          value={insulationSettings.climateId} 
                          onValueChange={(v) => setInsulationSettings(prev => ({ ...prev, climateId: v }))}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SAUDI_CLIMATE_DATA.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs">Material</Label>
                        <Select 
                          value={insulationSettings.insulationMaterialId} 
                          onValueChange={(v) => setInsulationSettings(prev => ({ ...prev, insulationMaterialId: v }))}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INSULATION_MATERIALS.map(m => (
                              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="lg:col-span-3 space-y-6">
            {hasData && boq ? (
              <>
                <BOQSummaryCards summary={boq.summary} />
                
                <div className="grid gap-6 md:grid-cols-2">
                  {weightBreakdownData.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Material Weight</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={weightBreakdownData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                {weightBreakdownData.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => `${value.toFixed(0)} lbs`} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {fittingsData.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Components Count</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={fittingsData} layout="vertical">
                              <XAxis type="number" />
                              <YAxis type="category" dataKey="name" width={100} />
                              <Tooltip />
                              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
                
                <Tabs defaultValue="duct" className="space-y-4">
                  <TabsList className="flex-wrap">
                    <TabsTrigger value="duct" disabled={boq.ductSystems.length === 0}>Duct</TabsTrigger>
                    <TabsTrigger value="pipe" disabled={boq.pipeSystems.length === 0}>Pipe</TabsTrigger>
                    <TabsTrigger value="fittings" disabled={allDuctFittings.length === 0 && allPipeFittings.length === 0}>Fittings</TabsTrigger>
                    <TabsTrigger value="terminals" disabled={boq.terminalUnits.length === 0}>Terminals</TabsTrigger>
                    <TabsTrigger value="equipment" disabled={boq.equipmentSelections.length === 0 && boq.ahuComponents.length === 0}>Equipment</TabsTrigger>
                    <TabsTrigger value="accessories" disabled={boq.accessories.length === 0}>Accessories</TabsTrigger>
                    <TabsTrigger value="supports" disabled={boq.supports.length === 0}>Supports</TabsTrigger>
                    <TabsTrigger value="insulation" disabled={allInsulation.length === 0}>Insulation</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="duct">
                    <Card>
                      <CardHeader>
                        <CardTitle>Duct Materials Schedule</CardTitle>
                        <CardDescription>Sheet metal quantities by system and segment</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {boq.ductSystems.map(system => (
                          <div key={system.systemId} className="mb-6">
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <Badge variant="outline">{system.systemName}</Badge>
                              <span className="text-muted-foreground text-sm">{system.systemType}</span>
                            </h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Segment</TableHead>
                                  <TableHead>Shape</TableHead>
                                  <TableHead>Dimensions</TableHead>
                                  <TableHead className="text-right">Length (ft)</TableHead>
                                  <TableHead className="text-right">Area (ft²)</TableHead>
                                  <TableHead className="text-right">Weight (lb)</TableHead>
                                  <TableHead>Gauge</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {system.segments.map((seg) => (
                                  <TableRow key={seg.segmentId}>
                                    <TableCell className="font-medium">{seg.segmentName}</TableCell>
                                    <TableCell><Badge variant="outline">{seg.shape}</Badge></TableCell>
                                    <TableCell>{seg.dimensions}</TableCell>
                                    <TableCell className="text-right">{seg.lengthFt.toFixed(1)}</TableCell>
                                    <TableCell className="text-right">{seg.surfaceAreaSqFt.toFixed(1)}</TableCell>
                                    <TableCell className="text-right">{seg.weightLbs.toFixed(0)}</TableCell>
                                    <TableCell>{seg.gauge} ga</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="pipe">
                    <Card>
                      <CardHeader>
                        <CardTitle>Pipe Materials Schedule</CardTitle>
                        <CardDescription>Pipe quantities by system and segment</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {boq.pipeSystems.map(system => (
                          <div key={system.systemId} className="mb-6">
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <Badge variant="outline">{system.systemName}</Badge>
                              <span className="text-muted-foreground text-sm">{system.systemType}</span>
                            </h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Segment</TableHead>
                                  <TableHead>Size</TableHead>
                                  <TableHead className="text-right">Length (ft)</TableHead>
                                  <TableHead>Material</TableHead>
                                  <TableHead>Schedule</TableHead>
                                  <TableHead className="text-right">Weight (lb)</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {system.segments.map((seg) => (
                                  <TableRow key={seg.segmentId}>
                                    <TableCell className="font-medium">{seg.segmentName}</TableCell>
                                    <TableCell>{seg.nominalSize}</TableCell>
                                    <TableCell className="text-right">{seg.lengthFt.toFixed(1)}</TableCell>
                                    <TableCell>{seg.material}</TableCell>
                                    <TableCell>{seg.schedule}</TableCell>
                                    <TableCell className="text-right">{seg.totalWeightLbs.toFixed(0)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="fittings">
                    <Card>
                      <CardHeader>
                        <CardTitle>Fittings Schedule</CardTitle>
                        <CardDescription>Duct and pipe fittings from design data</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <BOQFittingsTable ductFittings={allDuctFittings} pipeFittings={allPipeFittings} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="terminals">
                    <Card>
                      <CardHeader>
                        <CardTitle>Terminal Units Schedule</CardTitle>
                        <CardDescription>VAV boxes, FCUs, and other terminal units</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <BOQTerminalUnitsTable terminalUnits={boq.terminalUnits} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="equipment">
                    <Card>
                      <CardHeader>
                        <CardTitle>Equipment Schedule</CardTitle>
                        <CardDescription>Major equipment and AHU components</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <BOQEquipmentTable equipment={boq.equipmentSelections} ahuComponents={boq.ahuComponents} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="accessories">
                    <Card>
                      <CardHeader>
                        <CardTitle>Accessories Schedule</CardTitle>
                        <CardDescription>Dampers, actuators, sensors, and controls derived from equipment</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <BOQAccessoriesTable accessories={boq.accessories} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="supports">
                    <Card>
                      <CardHeader>
                        <CardTitle>Supports & Hangers Schedule</CardTitle>
                        <CardDescription>Estimated quantities based on SMACNA and MSS SP-58 guidelines</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <BOQSupportsTable supports={boq.supports} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="insulation">
                    <Card>
                      <CardHeader>
                        <CardTitle>Insulation Schedule</CardTitle>
                        <CardDescription>Thermal insulation requirements</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Segment</TableHead>
                              <TableHead>Application</TableHead>
                              <TableHead>Material</TableHead>
                              <TableHead className="text-right">Thickness (mm)</TableHead>
                              <TableHead className="text-right">Area (m²)</TableHead>
                              <TableHead className="text-right">Est. Cost (SAR)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allInsulation.map((item, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{item.segmentName}</TableCell>
                                <TableCell>
                                  <Badge variant={item.application === 'duct' ? 'default' : 'secondary'}>
                                    {item.application}
                                  </Badge>
                                </TableCell>
                                <TableCell>{item.insulationType}</TableCell>
                                <TableCell className="text-right">{item.thicknessMm}</TableCell>
                                <TableCell className="text-right">{item.surfaceAreaSqM.toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                  {(item.surfaceAreaSqM * item.costPerM2).toFixed(0)}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="font-bold bg-muted/50">
                              <TableCell colSpan={4}>TOTALS</TableCell>
                              <TableCell className="text-right">{boq.summary.totalInsulationAreaSqM.toFixed(2)}</TableCell>
                              <TableCell className="text-right">SAR {boq.summary.totalInsulationCostSAR.toFixed(0)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Scale className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Design Data Available</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    {projectIdFromUrl 
                      ? 'No duct systems, pipe systems, or equipment found for this project. Complete your design using the design tools to generate BOQ.'
                      : 'Select a project to view its Bill of Quantities.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <DesignWorkflowNextStep
          currentPath="/design/material-takeoff"
          projectId={projectIdFromUrl || undefined}
        />
      </div>
    </DashboardLayout>
  );
}
