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
import { useDuctSystems, useDuctSegments } from '@/hooks/useDuctSystems';
import { useDiffuserGrillesByProject } from '@/hooks/useDiffuserGrilles';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { useZoneContext } from '@/hooks/useZoneContext';
import { 
  Wind, 
  ArrowLeft, 
  FileSpreadsheet, 
  Download,
  Printer,
  Building2,
  CheckSquare,
  Table as TableIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface BalanceRow {
  id: string;
  location: string;
  designCfm: number;
  measuredCfm: number | null;
  variance: number | null;
  status: 'pending' | 'pass' | 'fail';
}

export default function AirBalanceReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { projectId: storedProjectId, setContext } = useZoneContext();
  
  const projectIdFromUrl = searchParams.get('project') || storedProjectId;
  const [selectedProjectId, setSelectedProjectId] = useState(projectIdFromUrl || '');
  
  useEffect(() => {
    if (selectedProjectId) {
      setContext(selectedProjectId, null, { replace: true });
    }
  }, [selectedProjectId, setContext]);
  const [selectedSystemIds, setSelectedSystemIds] = useState<string[]>([]);
  const [tolerancePercent, setTolerancePercent] = useState(10);
  const [includeTerminals, setIncludeTerminals] = useState(true);
  const [includeDiffusers, setIncludeDiffusers] = useState(true);
  
  const { data: projects } = useProjects();
  const { data: ductSystems } = useDuctSystems();
  const { data: diffuserSelections } = useDiffuserGrillesByProject(selectedProjectId || undefined);
  
  const queryClient = useQueryClient();
  
  const handleConflictReload = () => {
    queryClient.invalidateQueries({ queryKey: ['duct-systems'] });
    queryClient.invalidateQueries({ queryKey: ['diffuser-grilles-by-project', selectedProjectId] });
  };
  
  // Get project's duct systems
  const projectDuctSystems = useMemo(() => {
    if (!ductSystems || !selectedProjectId) return [];
    return ductSystems.filter(s => s.project_id === selectedProjectId);
  }, [ductSystems, selectedProjectId]);
  
  // Get selected systems data
  const selectedSystems = useMemo(() => {
    if (!ductSystems) return [];
    return ductSystems.filter(s => selectedSystemIds.includes(s.id));
  }, [ductSystems, selectedSystemIds]);
  
  // Build balance report data
  const reportData = useMemo(() => {
    const rows: BalanceRow[] = [];
    
    selectedSystems.forEach(system => {
      // Add system summary row
      rows.push({
        id: `system-${system.id}`,
        location: `System: ${system.system_name}`,
        designCfm: system.total_airflow_cfm || 0,
        measuredCfm: null,
        variance: null,
        status: 'pending',
      });
    });
    
    return rows;
  }, [selectedSystems]);
  
  // Calculate totals
  const totals = useMemo(() => {
    const totalDesign = selectedSystems.reduce((sum, s) => sum + (s.total_airflow_cfm || 0), 0);
    return { totalDesign, systemCount: selectedSystems.length };
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
          entityType="air_balance"
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
                  { label: 'Air Balance Report' },
                ]}
              />
              <h1 className="text-2xl font-bold text-foreground mt-1">Air Balance Report</h1>
              <p className="text-muted-foreground text-sm">
                Generate TAB contractor air balance reports from duct system designs
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
                    <Label>Duct Systems to Include</Label>
                    <ScrollArea className="h-[200px] border rounded-md p-2">
                      {projectDuctSystems.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No duct systems found
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {projectDuctSystems.map(system => (
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
                                  {system.total_airflow_cfm?.toLocaleString()} CFM
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
                    checked={includeTerminals} 
                    onCheckedChange={(c) => setIncludeTerminals(c === true)}
                  />
                  <Label className="text-sm">Include Terminal Units</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={includeDiffusers} 
                    onCheckedChange={(c) => setIncludeDiffusers(c === true)}
                  />
                  <Label className="text-sm">Include Diffusers/Grilles</Label>
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
                      {totals.totalDesign.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Total CFM</p>
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
                <TabsTrigger value="branches">Branch Schedule</TabsTrigger>
                <TabsTrigger value="terminals">Terminal Devices</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TableIcon className="h-4 w-4" />
                      Air Balance Report - System Summary
                    </CardTitle>
                    <CardDescription>
                      Design values for Testing, Adjusting, and Balancing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedSystems.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Wind className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Select duct systems to generate report</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>System</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Design CFM</TableHead>
                            <TableHead className="text-right">Measured CFM</TableHead>
                            <TableHead className="text-right">Variance %</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedSystems.map(system => (
                            <TableRow key={system.id}>
                              <TableCell className="font-medium">{system.system_name}</TableCell>
                              <TableCell>{system.system_type || 'Supply'}</TableCell>
                              <TableCell className="text-right">
                                {system.total_airflow_cfm?.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <Input 
                                  type="number" 
                                  className="w-24 h-8 text-right"
                                  placeholder="—"
                                />
                              </TableCell>
                              <TableCell className="text-right">—</TableCell>
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
              
              <TabsContent value="branches" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Branch Schedule</CardTitle>
                    <CardDescription>
                      Individual duct branches with design and measurement columns
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedSystems.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Wind className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Select duct systems to view branch schedule</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Branch data will be populated from duct segments
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="terminals" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Terminal Device Schedule</CardTitle>
                    <CardDescription>
                      Diffusers, grilles, and VAV boxes with design values
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedSystems.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Wind className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Select duct systems to view terminal devices</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Terminal device data will be populated from selections
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Next Step */}
        <DesignWorkflowNextStep currentPath="/design/air-balance-report" projectId={selectedProjectId || undefined} />
      </div>
    </DashboardLayout>
  );
}
