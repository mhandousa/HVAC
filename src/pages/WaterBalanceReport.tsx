import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useProjects } from '@/hooks/useProjects';
import { usePipeSystems, usePipeSegments } from '@/hooks/usePipeSystems';
import { useZoneContext } from '@/hooks/useZoneContext';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { 
  Droplets, 
  ArrowLeft, 
  FileSpreadsheet, 
  Download,
  Printer,
  Building2,
  CheckSquare,
  Table as TableIcon,
  Gauge
} from 'lucide-react';
import { toast } from 'sonner';

export default function WaterBalanceReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { projectId: storedProjectId, setContext } = useZoneContext();
  const projectId = searchParams.get('project') || storedProjectId;
  
  const { data: projects } = useProjects();
  const { data: pipeSystems } = usePipeSystems();
  
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');

  useEffect(() => {
    if (selectedProjectId) {
      setContext(selectedProjectId, null, { replace: true });
    }
  }, [selectedProjectId, setContext]);
  const [selectedSystemIds, setSelectedSystemIds] = useState<string[]>([]);
  const [tolerancePercent, setTolerancePercent] = useState(10);
  const [includeCoils, setIncludeCoils] = useState(true);
  const [includeBalanceValves, setIncludeBalanceValves] = useState(true);
  
  const queryClient = useQueryClient();
  
  const handleConflictReload = () => {
    queryClient.invalidateQueries({ queryKey: ['pipe-systems'] });
  };
  
  // Get project's pipe systems
  const projectPipeSystems = useMemo(() => {
    if (!pipeSystems || !selectedProjectId) return [];
    return pipeSystems.filter(s => s.project_id === selectedProjectId);
  }, [pipeSystems, selectedProjectId]);
  
  // Get selected systems data
  const selectedSystems = useMemo(() => {
    if (!pipeSystems) return [];
    return pipeSystems.filter(s => selectedSystemIds.includes(s.id));
  }, [pipeSystems, selectedSystemIds]);
  
  // Calculate totals
  const totals = useMemo(() => {
    const totalGpm = selectedSystems.reduce((sum, s) => sum + (s.total_flow_gpm || 0), 0);
    return { totalGpm, systemCount: selectedSystems.length };
  }, [selectedSystems]);
  
  const toggleSystem = (systemId: string) => {
    setSelectedSystemIds(prev => 
      prev.includes(systemId) 
        ? prev.filter(id => id !== systemId)
        : [...prev, systemId]
    );
  };
  
  const handleExportPdf = () => {
    toast.info('PDF export coming soon');
  };
  
  const handleExportExcel = () => {
    toast.info('Excel export coming soon');
  };
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <EditConflictWarning
          entityType="water_balance"
          entityId={selectedProjectId || null}
          currentRevisionNumber={0}
          onReload={handleConflictReload}
        />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/design')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <Breadcrumbs
                items={[
                  { label: 'Design Tools', href: '/design' },
                  { label: 'Water Balance Report' },
                ]}
              />
              <h1 className="text-2xl font-bold text-foreground mt-1">Water Balance Report</h1>
              <p className="text-muted-foreground text-sm">
                Generate TAB contractor hydronic balance reports from pipe system designs
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button onClick={handleExportPdf}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Configuration */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Project & Systems
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Project</Label>
                  <Select value={selectedProjectId} onValueChange={(v) => {
                    setSelectedProjectId(v);
                    setSelectedSystemIds([]);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedProjectId && (
                  <div className="space-y-2">
                    <Label>Pipe Systems to Include</Label>
                    <ScrollArea className="h-[200px] border rounded-md p-2">
                      {projectPipeSystems.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No pipe systems found
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {projectPipeSystems.map(system => (
                            <div 
                              key={system.id}
                              className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                              onClick={() => toggleSystem(system.id)}
                            >
                              <Checkbox 
                                checked={selectedSystemIds.includes(system.id)}
                                onCheckedChange={() => toggleSystem(system.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{system.system_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {system.total_flow_gpm?.toFixed(0)} GPM • {system.system_type}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Report Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tolerance (%)</Label>
                  <Input
                    type="number"
                    value={tolerancePercent}
                    onChange={e => setTolerancePercent(Number(e.target.value))}
                    min={1}
                    max={25}
                  />
                  <p className="text-xs text-muted-foreground">
                    Acceptable deviation from design values
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={includeCoils} 
                    onCheckedChange={(c) => setIncludeCoils(c === true)}
                  />
                  <Label className="text-sm">Include Coil Schedule</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={includeBalanceValves} 
                    onCheckedChange={(c) => setIncludeBalanceValves(c === true)}
                  />
                  <Label className="text-sm">Include Balance Valve Sizing</Label>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{totals.systemCount}</p>
                    <p className="text-xs text-muted-foreground">Systems</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {totals.totalGpm.toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total GPM</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Panel - Report Preview */}
          <div className="lg:col-span-3 space-y-4">
            <Tabs defaultValue="summary" className="w-full">
              <TabsList>
                <TabsTrigger value="summary">System Summary</TabsTrigger>
                <TabsTrigger value="circuits">Circuit Schedule</TabsTrigger>
                <TabsTrigger value="coils">Coil Schedule</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TableIcon className="h-4 w-4" />
                      Water Balance Report - System Summary
                    </CardTitle>
                    <CardDescription>
                      Design values for Testing, Adjusting, and Balancing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedSystems.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Droplets className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Select pipe systems to generate report</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>System</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Design GPM</TableHead>
                            <TableHead className="text-right">Measured GPM</TableHead>
                            <TableHead className="text-right">Head (ft)</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedSystems.map(system => (
                            <TableRow key={system.id}>
                              <TableCell className="font-medium">{system.system_name}</TableCell>
                              <TableCell>{system.system_type}</TableCell>
                              <TableCell className="text-right">
                                {system.total_flow_gpm?.toFixed(1)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Input 
                                  type="number" 
                                  className="w-24 h-8 text-right"
                                  placeholder="—"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                {system.system_head_ft?.toFixed(1) || '—'}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary">Pending</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="circuits" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Circuit Schedule</CardTitle>
                    <CardDescription>
                      Individual pipe circuits with design and measurement columns
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedSystems.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Droplets className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Select pipe systems to view circuit schedule</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Circuit data will be populated from pipe segments
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="coils" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Coil Schedule</CardTitle>
                    <CardDescription>
                      FCU and AHU coils with design water flow rates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedSystems.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Gauge className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Select pipe systems to view coil schedule</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Coil data will be populated from terminal unit selections
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Next Step */}
        <DesignWorkflowNextStep currentPath="/design/water-balance-report" projectId={selectedProjectId || undefined} />
      </div>
    </DashboardLayout>
  );
}
