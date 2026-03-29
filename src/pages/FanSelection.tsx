import { useState, useMemo, useEffect } from 'react';
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
import { useDuctSystems } from '@/hooks/useDuctSystems';
import { useFanCurves, findBestFan, FanCurve } from '@/hooks/useFanCurves';
import { FanCurveChart } from '@/components/duct-design/FanCurveChart';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { DataFlowImportHandler } from '@/components/design/DataFlowImportHandler';
import { CrossToolValidationAlert } from '@/components/design/CrossToolValidationAlert';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { useQueryClient } from '@tanstack/react-query';
import {
  Wind, 
  Search, 
  ArrowLeft, 
  Activity, 
  Filter,
  CheckCircle2,
  AlertTriangle,
  Zap,
  BarChart3,
  Table
} from 'lucide-react';
import { toast } from 'sonner';

export default function FanSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Zone context persistence
  const { projectId: storedProjectId, setContext } = useZoneContext();
  const projectId = searchParams.get('project') || storedProjectId;
  const systemIdFromUrl = searchParams.get('system');
  
  const { data: projects } = useProjects();
  const { data: ductSystems } = useDuctSystems();
  const { data: fanCurves, isLoading: loadingFans } = useFanCurves();
  
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [selectedDuctSystemId, setSelectedDuctSystemId] = useState(systemIdFromUrl || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyMatching, setShowOnlyMatching] = useState(false);
  const [selectedFanId, setSelectedFanId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareFanIds, setCompareFanIds] = useState<string[]>([]);
  
  // Manual input mode
  const [requiredCfm, setRequiredCfm] = useState(5000);
  const [requiredStaticPressure, setRequiredStaticPressure] = useState(2.5);

  // Pre-save validation with stage locking
  const { canSave, blockers, warnings, isLocked } = useToolValidation(
    selectedProjectId || null,
    'fan-selection',
    { checkStageLock: true }
  );

  // Conflict detection
  const queryClient = useQueryClient();
  const handleConflictReload = () => {
    queryClient.invalidateQueries({ queryKey: ['fan-curves'] });
    queryClient.invalidateQueries({ queryKey: ['duct-systems'] });
  };
  
  // Auto-select system from URL parameter
  useEffect(() => {
    if (systemIdFromUrl && ductSystems) {
      const system = ductSystems.find(s => s.id === systemIdFromUrl);
      if (system) {
        setSelectedDuctSystemId(systemIdFromUrl);
        if (system.project_id) {
          setSelectedProjectId(system.project_id);
        }
        toast.success(`Loaded requirements from ${system.system_name}`);
      }
    }
  }, [systemIdFromUrl, ductSystems]);
  
  // Get project's duct systems
  const projectDuctSystems = useMemo(() => {
    if (!ductSystems || !selectedProjectId) return [];
    return ductSystems.filter(s => s.project_id === selectedProjectId);
  }, [ductSystems, selectedProjectId]);
  
  // Auto-populate requirements from duct system
  const selectedDuctSystem = useMemo(() => {
    if (!ductSystems || !selectedDuctSystemId) return null;
    return ductSystems.find(s => s.id === selectedDuctSystemId);
  }, [ductSystems, selectedDuctSystemId]);
  
  // When duct system changes, update requirements
  useEffect(() => {
    if (selectedDuctSystem) {
      if (selectedDuctSystem.total_airflow_cfm) {
        setRequiredCfm(selectedDuctSystem.total_airflow_cfm);
      }
      if (selectedDuctSystem.system_static_pressure_pa) {
        // Convert Pa to in. w.g. (1 in. w.g. = 249.09 Pa)
        setRequiredStaticPressure(selectedDuctSystem.system_static_pressure_pa / 249.09);
      }
    }
  }, [selectedDuctSystem]);
  
  // Rank fans
  const rankedFans = useMemo(() => {
    if (!fanCurves || fanCurves.length === 0) return [];
    return findBestFan(fanCurves, requiredCfm, requiredStaticPressure);
  }, [fanCurves, requiredCfm, requiredStaticPressure]);
  
  // Filter fans
  const filteredFans = useMemo(() => {
    let fans = showOnlyMatching 
      ? rankedFans.filter(r => r.operatingPoint.isValid)
      : rankedFans;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      fans = fans.filter(r => 
        r.fan.manufacturer.toLowerCase().includes(query) ||
        r.fan.model.toLowerCase().includes(query) ||
        r.fan.fan_type.toLowerCase().includes(query)
      );
    }
    
    return fans;
  }, [rankedFans, showOnlyMatching, searchQuery]);
  
  const selectedFan = useMemo(() => {
    if (!selectedFanId || !rankedFans.length) return null;
    return rankedFans.find(r => r.fan.id === selectedFanId);
  }, [selectedFanId, rankedFans]);
  
  const compareFans = useMemo(() => {
    if (!compareFanIds.length || !rankedFans.length) return [];
    return compareFanIds.map(id => rankedFans.find(r => r.fan.id === id)).filter(Boolean);
  }, [compareFanIds, rankedFans]);
  
  const toggleCompare = (fanId: string) => {
    if (compareFanIds.includes(fanId)) {
      setCompareFanIds(prev => prev.filter(id => id !== fanId));
    } else if (compareFanIds.length < 3) {
      setCompareFanIds(prev => [...prev, fanId]);
    } else {
      toast.warning('Maximum 3 fans can be compared');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Tool Page Header with stage locking */}
        <ToolPageHeader
          toolType="fan-selection"
          toolName="Fan Selection Wizard"
          projectId={selectedProjectId || undefined}
          showLockButton={true}
          showValidation={true}
        />

        {/* Cross-Tool Validation Alert */}
        <CrossToolValidationAlert
          projectId={projectId}
          currentTool="fan-selection"
          variant="alert"
          className="mb-4"
        />

        {/* Data Flow Import Handler */}
        <DataFlowImportHandler
          projectId={projectId}
          currentTool="fan-selection"
          layout="grid"
          onImportDuctData={(data) => {
            if (selectedDuctSystem) {
              setRequiredCfm(selectedDuctSystem.total_airflow_cfm || 5000);
              setRequiredStaticPressure((selectedDuctSystem.system_static_pressure_pa || 625) / 249.09);
            }
            toast.success(`Found ${data.systemCount} duct systems`);
          }}
          onImportAHUData={(data) => {
            toast.success(`Found ${data.ahuCount} AHUs with ${data.totalDesignCfm.toLocaleString()} CFM`);
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
                  { label: 'Fan Selection Wizard' },
                ]}
              />
              <h1 className="text-2xl font-bold text-foreground mt-1">Fan Selection Wizard</h1>
              <p className="text-muted-foreground text-sm">
                Select and compare fans with curve analysis and operating point verification
              </p>
            </div>
          </div>
          <ActiveEditorsIndicator
            entityType="fan_selection"
            entityId={selectedDuctSystemId || null}
            projectId={selectedProjectId || undefined}
          />
          <EditConflictWarning
            entityType="fan_selection"
            entityId={selectedDuctSystemId || null}
            currentRevisionNumber={0}
            onReload={handleConflictReload}
          />
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
                
                {selectedProjectId && projectDuctSystems.length > 0 && (
                  <div className="space-y-2">
                    <Label>Import from Duct System</Label>
                    <Select value={selectedDuctSystemId} onValueChange={setSelectedDuctSystemId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duct system..." />
                      </SelectTrigger>
                      <SelectContent>
                        {projectDuctSystems.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.system_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Required CFM</Label>
                    <Input
                      type="number"
                      value={requiredCfm}
                      onChange={e => setRequiredCfm(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Static Pressure (in. w.g.)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={requiredStaticPressure}
                      onChange={e => setRequiredStaticPressure(Number(e.target.value))}
                    />
                  </div>
                </div>
                
                {selectedDuctSystem && (
                  <Alert>
                    <AlertDescription className="text-xs">
                      Imported from: {selectedDuctSystem.system_name}
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
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Show only matching fans</Label>
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
                      if (!v) setCompareFanIds([]);
                    }}
                  />
                </div>
                
                {compareMode && (
                  <Badge variant="outline">
                    {compareFanIds.length}/3 fans selected
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Center Panel - Fan List */}
          <div className="space-y-4">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    Available Fans
                  </span>
                  <Badge variant="secondary">{filteredFans.length} fans</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full px-4 pb-4">
                  <div className="space-y-2">
                    {loadingFans ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Loading fans...
                      </p>
                    ) : filteredFans.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No fans match your criteria
                      </p>
                    ) : (
                      filteredFans.map((result, idx) => (
                        <div
                          key={result.fan.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedFanId === result.fan.id 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:border-primary/50'
                          } ${
                            compareMode && compareFanIds.includes(result.fan.id)
                              ? 'ring-2 ring-primary'
                              : ''
                          }`}
                          onClick={() => {
                            if (compareMode) {
                              toggleCompare(result.fan.id);
                            } else {
                              setSelectedFanId(result.fan.id);
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
                                  {result.fan.manufacturer} {result.fan.model}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {result.fan.fan_type} • {result.fan.rpm} RPM • {result.fan.motor_hp} HP
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
                          {result.operatingPoint.cfm > 0 && (
                            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">CFM:</span>
                                <span className="ml-1 font-medium">{result.operatingPoint.cfm.toFixed(0)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">SP:</span>
                                <span className="ml-1 font-medium">{result.operatingPoint.staticPressure.toFixed(2)}"</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">BHP:</span>
                                <span className="ml-1 font-medium">{result.operatingPoint.bhp.toFixed(2)}</span>
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
                <TabsTrigger value="compare" className="flex-1" disabled={compareFans.length < 2}>
                  <Zap className="h-4 w-4 mr-2" />
                  Compare
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="curve" className="mt-4">
                {selectedFan ? (
                  <div className="space-y-4">
                    <FanCurveChart
                      fanCurve={selectedFan.fan}
                      systemCfm={requiredCfm}
                      systemStaticPressure={requiredStaticPressure}
                    />
                    
                    <Alert className={selectedFan.operatingPoint.isValid ? 'border-emerald-200' : 'border-amber-200'}>
                      <AlertDescription>
                        {selectedFan.operatingPoint.message}
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <Card className="h-[400px] flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Wind className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Select a fan to view curve analysis</p>
                    </div>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="compare" className="mt-4">
                {compareFans.length >= 2 ? (
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
                                {compareFans.map((r, i) => (
                                  <th key={i} className="text-center py-2">{r?.fan.model}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b">
                                <td className="py-2 text-muted-foreground">Manufacturer</td>
                                {compareFans.map((r, i) => (
                                  <td key={i} className="text-center py-2">{r?.fan.manufacturer}</td>
                                ))}
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 text-muted-foreground">Type</td>
                                {compareFans.map((r, i) => (
                                  <td key={i} className="text-center py-2">{r?.fan.fan_type}</td>
                                ))}
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 text-muted-foreground">Motor HP</td>
                                {compareFans.map((r, i) => (
                                  <td key={i} className="text-center py-2">{r?.fan.motor_hp} HP</td>
                                ))}
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 text-muted-foreground">RPM</td>
                                {compareFans.map((r, i) => (
                                  <td key={i} className="text-center py-2">{r?.fan.rpm}</td>
                                ))}
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 text-muted-foreground">Operating CFM</td>
                                {compareFans.map((r, i) => (
                                  <td key={i} className="text-center py-2 font-medium">
                                    {r?.operatingPoint.cfm.toFixed(0)}
                                  </td>
                                ))}
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 text-muted-foreground">Efficiency</td>
                                {compareFans.map((r, i) => (
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
                                <td className="py-2 text-muted-foreground">BHP</td>
                                {compareFans.map((r, i) => (
                                  <td key={i} className="text-center py-2">
                                    {r?.operatingPoint.bhp.toFixed(2)}
                                  </td>
                                ))}
                              </tr>
                              <tr>
                                <td className="py-2 text-muted-foreground">Valid Selection</td>
                                {compareFans.map((r, i) => (
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
                      <p>Enable compare mode and select 2-3 fans</p>
                    </div>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Next Step */}
        <DesignWorkflowNextStep currentPath="/design/fan-selection" projectId={selectedProjectId || undefined} />
      </div>
    </DashboardLayout>
  );
}
