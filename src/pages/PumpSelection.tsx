import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useZoneContext } from '@/hooks/useZoneContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProjects } from '@/hooks/useProjects';
import { usePipeSystems } from '@/hooks/usePipeSystems';
import { usePumpCurves, findBestPump, PumpCurve } from '@/hooks/usePumpCurves';
import { PumpCurveChart } from '@/components/pipe-design/PumpCurveChart';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { DataFlowImportHandler } from '@/components/design/DataFlowImportHandler';
import { CrossToolValidationAlert } from '@/components/design/CrossToolValidationAlert';
import { useConflictDetection } from '@/hooks/useConflictDetection';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { useQueryClient } from '@tanstack/react-query';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import {
  Gauge, 
  Search, 
  ArrowLeft, 
  Activity, 
  Filter,
  CheckCircle2,
  AlertTriangle,
  Zap,
  BarChart3,
  Table,
  Droplets,
  GitBranch,
} from 'lucide-react';
import { toast } from 'sonner';
import { SaveAsAlternativeDialog } from '@/components/design/SaveAsAlternativeDialog';
import { DesignAlternativesManager } from '@/components/design/DesignAlternativesManager';
import { AlternativeComparisonView } from '@/components/design/AlternativeComparisonView';
import { DesignAlternative } from '@/hooks/useDesignAlternatives';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PUMP_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'centrifugal', label: 'Centrifugal' },
  { value: 'inline', label: 'Inline' },
  { value: 'split-case', label: 'Split Case' },
  { value: 'vertical-turbine', label: 'Vertical Turbine' },
];

export default function PumpSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Zone context persistence
  const { projectId: storedProjectId, setContext } = useZoneContext();
  const projectId = searchParams.get('project') || storedProjectId;
  const systemIdFromUrl = searchParams.get('system');
  
  const { data: projects } = useProjects();
  const { data: pipeSystems } = usePipeSystems();
  const { data: pumpCurves, isLoading: loadingPumps } = usePumpCurves();
  const queryClient = useQueryClient();
  
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [selectedPipeSystemId, setSelectedPipeSystemId] = useState(systemIdFromUrl || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [pumpTypeFilter, setPumpTypeFilter] = useState('all');
  const [showOnlyMatching, setShowOnlyMatching] = useState(false);
  const [selectedPumpId, setSelectedPumpId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePumpIds, setComparePumpIds] = useState<string[]>([]);
  
  // Manual input mode
  const [requiredGpm, setRequiredGpm] = useState(500);
  const [requiredHead, setRequiredHead] = useState(60);
  const [staticHead, setStaticHead] = useState(0);

  // Concurrent editing awareness
  const { hasConflict, latestRevision, clearConflict } = useConflictDetection({
    entityType: 'pump_selection',
    entityId: selectedPipeSystemId || projectId || null,
    currentRevisionNumber: 0,
  });

  const handleReloadLatest = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['pump_selections'] });
    clearConflict();
    toast.info('Reloaded latest version');
  }, [queryClient, clearConflict]);

  const handleForceSave = useCallback(() => {
    clearConflict();
  }, [clearConflict]);

  // Pre-save validation with stage locking
  const { canSave, blockers, warnings, isLocked } = useToolValidation(
    projectId || null,
    'pump-selection',
    { checkStageLock: true }
  );

  // Design Alternatives
  const [showSaveAlternative, setShowSaveAlternative] = useState(false);
  const [showAlternativesManager, setShowAlternativesManager] = useState(false);
  const [showAlternativeComparison, setShowAlternativeComparison] = useState(false);
  const [alternativesToCompare, setAlternativesToCompare] = useState<DesignAlternative[]>([]);

  const handleLoadAlternative = useCallback((data: Record<string, unknown>) => {
    if (data.requiredGpm) setRequiredGpm(data.requiredGpm as number);
    if (data.requiredHead) setRequiredHead(data.requiredHead as number);
    if (data.staticHead !== undefined) setStaticHead(data.staticHead as number);
    if (data.selectedPumpId) setSelectedPumpId(data.selectedPumpId as string);
    if (data.pumpTypeFilter) setPumpTypeFilter(data.pumpTypeFilter as string);
    if (data.showOnlyMatching !== undefined) setShowOnlyMatching(data.showOnlyMatching as boolean);
    setShowAlternativesManager(false);
    toast.success('Alternative loaded');
  }, []);

  const handleCompareAlternatives = useCallback((alternatives: DesignAlternative[]) => {
    setAlternativesToCompare(alternatives);
    setShowAlternativeComparison(true);
    setShowAlternativesManager(false);
  }, []);
  // Auto-select system from URL parameter
  useEffect(() => {
    if (systemIdFromUrl && pipeSystems) {
      const system = pipeSystems.find(s => s.id === systemIdFromUrl);
      if (system) {
        setSelectedPipeSystemId(systemIdFromUrl);
        if (system.project_id) {
          setSelectedProjectId(system.project_id);
        }
        toast.success(`Loaded requirements from ${system.system_name}`);
      }
    }
  }, [systemIdFromUrl, pipeSystems]);
  
  // Get project's pipe systems
  const projectPipeSystems = useMemo(() => {
    if (!pipeSystems || !selectedProjectId) return [];
    return pipeSystems.filter(s => s.project_id === selectedProjectId);
  }, [pipeSystems, selectedProjectId]);
  
  // Auto-populate requirements from pipe system
  const selectedPipeSystem = useMemo(() => {
    if (!pipeSystems || !selectedPipeSystemId) return null;
    return pipeSystems.find(s => s.id === selectedPipeSystemId);
  }, [pipeSystems, selectedPipeSystemId]);
  
  // When pipe system changes, update requirements
  useEffect(() => {
    if (selectedPipeSystem) {
      if (selectedPipeSystem.total_flow_gpm) {
        setRequiredGpm(selectedPipeSystem.total_flow_gpm);
      }
      if (selectedPipeSystem.system_head_ft) {
        setRequiredHead(selectedPipeSystem.system_head_ft);
      }
    }
  }, [selectedPipeSystem]);
  
  // Rank pumps
  const rankedPumps = useMemo(() => {
    if (!pumpCurves || pumpCurves.length === 0) return [];
    return findBestPump(pumpCurves, requiredGpm, requiredHead);
  }, [pumpCurves, requiredGpm, requiredHead]);
  
  // Filter pumps
  const filteredPumps = useMemo(() => {
    let pumps = showOnlyMatching 
      ? rankedPumps.filter(r => r.operatingPoint.isValid)
      : rankedPumps;
    
    if (pumpTypeFilter !== 'all') {
      pumps = pumps.filter(r => r.pump.pump_type === pumpTypeFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      pumps = pumps.filter(r => 
        r.pump.manufacturer.toLowerCase().includes(query) ||
        r.pump.model.toLowerCase().includes(query)
      );
    }
    
    return pumps;
  }, [rankedPumps, showOnlyMatching, pumpTypeFilter, searchQuery]);
  
  const selectedPump = useMemo(() => {
    if (!selectedPumpId || !rankedPumps.length) return null;
    return rankedPumps.find(r => r.pump.id === selectedPumpId);
  }, [selectedPumpId, rankedPumps]);
  
  const comparePumps = useMemo(() => {
    if (!comparePumpIds.length || !rankedPumps.length) return [];
    return comparePumpIds.map(id => rankedPumps.find(r => r.pump.id === id)).filter(Boolean);
  }, [comparePumpIds, rankedPumps]);
  
  const toggleCompare = (pumpId: string) => {
    if (comparePumpIds.includes(pumpId)) {
      setComparePumpIds(prev => prev.filter(id => id !== pumpId));
    } else if (comparePumpIds.length < 3) {
      setComparePumpIds(prev => [...prev, pumpId]);
    } else {
      toast.warning('Maximum 3 pumps can be compared');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Edit Conflict Warning */}
        {hasConflict && latestRevision && (
          <EditConflictWarning
            entityType="pump_selection"
            entityId={selectedPipeSystemId || projectId || ''}
            currentRevisionNumber={0}
            onReload={handleReloadLatest}
            onForceSave={handleForceSave}
          />
        )}

        {/* Tool Page Header with stage locking */}
        <ToolPageHeader
          toolType="pump-selection"
          toolName="Pump Selection Wizard"
          projectId={projectId || undefined}
          showLockButton={true}
          showValidation={true}
        />

        {/* Cross-Tool Validation Alert */}
        <CrossToolValidationAlert
          projectId={projectId}
          currentTool="pump-selection"
          variant="alert"
          className="mb-4"
        />

        {/* Data Flow Import Handler */}
        <DataFlowImportHandler
          projectId={projectId}
          currentTool="pump-selection"
          layout="grid"
          onImportPipeData={(data) => {
            if (selectedPipeSystem) {
              setRequiredGpm(selectedPipeSystem.total_flow_gpm || 500);
              setRequiredHead(selectedPipeSystem.system_head_ft || 60);
            }
            toast.success(`Found ${data.systemCount} pipe systems`);
          }}
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
                  { label: 'Pump Selection Wizard' },
                ]}
              />
              <h1 className="text-2xl font-bold text-foreground mt-1">Pump Selection Wizard</h1>
              <p className="text-muted-foreground text-sm">
              Select and compare pumps with curve analysis and operating point verification
            </p>
          </div>
        </div>
        <ActiveEditorsIndicator 
          entityType="pump_selection"
          entityId={selectedPipeSystemId || projectId || null}
          projectId={projectId || undefined}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <GitBranch className="h-4 w-4 mr-2" />
              Alternatives
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background border">
            <DropdownMenuItem onClick={() => setShowSaveAlternative(true)}>
              Save as Alternative...
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowAlternativesManager(true)}>
              View Alternatives
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Requirements */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  System Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Project (Optional)</Label>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
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
                
                {selectedProjectId && projectPipeSystems.length > 0 && (
                  <div className="space-y-2">
                    <Label>Import from Pipe System</Label>
                    <Select value={selectedPipeSystemId} onValueChange={setSelectedPipeSystemId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pipe system..." />
                      </SelectTrigger>
                      <SelectContent>
                        {projectPipeSystems.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.system_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Required Flow (GPM)</Label>
                    <Input
                      type="number"
                      value={requiredGpm}
                      onChange={e => setRequiredGpm(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Head (ft)</Label>
                    <Input
                      type="number"
                      step="1"
                      value={requiredHead}
                      onChange={e => setRequiredHead(Number(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Static Head (ft)</Label>
                  <Input
                    type="number"
                    value={staticHead}
                    onChange={e => setStaticHead(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Elevation difference between suction and discharge
                  </p>
                </div>
                
                {selectedPipeSystem && (
                  <Alert>
                    <AlertDescription className="text-xs">
                      Imported from: {selectedPipeSystem.system_name}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Search & Filter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search manufacturer, model..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Pump Type</Label>
                  <Select value={pumpTypeFilter} onValueChange={setPumpTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PUMP_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Show only matching pumps</Label>
                  <Switch
                    checked={showOnlyMatching}
                    onCheckedChange={setShowOnlyMatching}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Compare mode</Label>
                  <Switch
                    checked={compareMode}
                    onCheckedChange={(v) => {
                      setCompareMode(v);
                      if (!v) setComparePumpIds([]);
                    }}
                  />
                </div>
                
                {compareMode && (
                  <Badge variant="outline">
                    {comparePumpIds.length}/3 pumps selected
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Center Panel - Pump List */}
          <div className="space-y-4">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    Available Pumps
                  </span>
                  <Badge variant="secondary">{filteredPumps.length} pumps</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full px-4 pb-4">
                  <div className="space-y-2">
                    {loadingPumps ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Loading pumps...
                      </p>
                    ) : filteredPumps.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No pumps match your criteria
                      </p>
                    ) : (
                      filteredPumps.map((result, idx) => (
                        <div
                          key={result.pump.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedPumpId === result.pump.id 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:border-primary/50'
                          } ${
                            compareMode && comparePumpIds.includes(result.pump.id)
                              ? 'ring-2 ring-primary'
                              : ''
                          }`}
                          onClick={() => {
                            if (compareMode) {
                              toggleCompare(result.pump.id);
                            } else {
                              setSelectedPumpId(result.pump.id);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {idx === 0 && result.operatingPoint.isValid && (
                                  <Badge className="text-[10px] bg-emerald-100 text-emerald-700">
                                    Best Match
                                  </Badge>
                                )}
                                <p className="font-medium text-sm truncate">
                                  {result.pump.manufacturer} {result.pump.model}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {result.pump.pump_type} • {result.pump.rpm} RPM • {result.pump.motor_hp} HP
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              {result.operatingPoint.isValid ? (
                                <Badge variant="secondary" className="text-emerald-600 text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  {result.operatingPoint.efficiency.toFixed(0)}%
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-amber-600 text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  N/A
                                </Badge>
                              )}
                            </div>
                          </div>
                          {result.operatingPoint.flow > 0 && (
                            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">GPM:</span>
                                <span className="ml-1 font-medium">{result.operatingPoint.flow.toFixed(0)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Head:</span>
                                <span className="ml-1 font-medium">{result.operatingPoint.head.toFixed(1)} ft</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">kW:</span>
                                <span className="ml-1 font-medium">{result.operatingPoint.power.toFixed(2)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Panel - Curve Analysis */}
          <div className="space-y-4">
            <Tabs defaultValue="curve" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="curve" className="flex-1">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Curve Analysis
                </TabsTrigger>
                <TabsTrigger value="compare" className="flex-1" disabled={comparePumps.length < 2}>
                  <Zap className="h-4 w-4 mr-2" />
                  Compare
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="curve" className="mt-4">
                {selectedPump ? (
                  <div className="space-y-4">
                    <PumpCurveChart
                      pumpCurve={selectedPump.pump}
                      systemFlow={requiredGpm}
                      systemHead={requiredHead}
                      staticHead={staticHead}
                    />
                  </div>
                ) : (
                  <Card className="h-[400px] flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Droplets className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Select a pump to view curve analysis</p>
                    </div>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="compare" className="mt-4">
                {comparePumps.length >= 2 ? (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">Side-by-Side Comparison</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2">Parameter</th>
                                {comparePumps.map((r, i) => (
                                  <th key={i} className="text-center py-2">{r?.pump.model}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b">
                                <td className="py-2 text-muted-foreground">Manufacturer</td>
                                {comparePumps.map((r, i) => (
                                  <td key={i} className="text-center py-2">{r?.pump.manufacturer}</td>
                                ))}
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 text-muted-foreground">Type</td>
                                {comparePumps.map((r, i) => (
                                  <td key={i} className="text-center py-2">{r?.pump.pump_type}</td>
                                ))}
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 text-muted-foreground">Motor HP</td>
                                {comparePumps.map((r, i) => (
                                  <td key={i} className="text-center py-2">{r?.pump.motor_hp} HP</td>
                                ))}
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 text-muted-foreground">RPM</td>
                                {comparePumps.map((r, i) => (
                                  <td key={i} className="text-center py-2">{r?.pump.rpm}</td>
                                ))}
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 text-muted-foreground">Operating Flow</td>
                                {comparePumps.map((r, i) => (
                                  <td key={i} className="text-center py-2 font-medium">
                                    {r?.operatingPoint.flow.toFixed(0)} GPM
                                  </td>
                                ))}
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 text-muted-foreground">Efficiency</td>
                                {comparePumps.map((r, i) => (
                                  <td key={i} className="text-center py-2">
                                    <Badge 
                                      variant="secondary"
                                      className={r?.operatingPoint.isValid ? 'text-emerald-600' : 'text-amber-600'}
                                    >
                                      {r?.operatingPoint.efficiency.toFixed(0)}%
                                    </Badge>
                                  </td>
                                ))}
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 text-muted-foreground">Power</td>
                                {comparePumps.map((r, i) => (
                                  <td key={i} className="text-center py-2">
                                    {r?.operatingPoint.power.toFixed(2)} kW
                                  </td>
                                ))}
                              </tr>
                              <tr>
                                <td className="py-2 text-muted-foreground">Valid Selection</td>
                                {comparePumps.map((r, i) => (
                                  <td key={i} className="text-center py-2">
                                    {r?.operatingPoint.isValid ? (
                                      <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-600" />
                                    ) : (
                                      <AlertTriangle className="h-5 w-5 mx-auto text-amber-500" />
                                    )}
                                  </td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card className="h-[400px] flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Enable compare mode and select 2-3 pumps</p>
                    </div>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Next Step */}
        <DesignWorkflowNextStep currentPath="/design/pump-selection" projectId={selectedProjectId || undefined} />

        {/* Design Alternatives */}
        {projectId && (
          <>
            <SaveAsAlternativeDialog
              open={showSaveAlternative}
              onOpenChange={setShowSaveAlternative}
              projectId={projectId}
              entityType="pump_selection"
              entityId={selectedPipeSystemId || undefined}
              data={{ requiredGpm, requiredHead, staticHead, selectedPumpId, pumpTypeFilter, showOnlyMatching }}
              suggestedName={`Pump Selection - ${requiredGpm} GPM`}
            />

            <DesignAlternativesManager
              open={showAlternativesManager}
              onOpenChange={setShowAlternativesManager}
              entityType="pump_selection"
              entityId={selectedPipeSystemId || undefined}
              onLoadAlternative={handleLoadAlternative}
              onCompare={handleCompareAlternatives}
              onCreateNew={() => {
                setShowAlternativesManager(false);
                setShowSaveAlternative(true);
              }}
            />

            <AlternativeComparisonView
              open={showAlternativeComparison}
              onOpenChange={setShowAlternativeComparison}
              alternatives={alternativesToCompare}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
