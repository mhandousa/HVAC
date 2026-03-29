import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Loader2, Settings, AlertTriangle, CheckCircle, FileText, Save } from 'lucide-react';
import { toast } from 'sonner';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { DataFlowImportHandler } from '@/components/design/DataFlowImportHandler';
import { RevisionHistoryPanel } from '@/components/design/RevisionHistoryPanel';
import { DesignTemplateSelector } from '@/components/design/DesignTemplateSelector';
import { SaveAsTemplateDialog } from '@/components/design/SaveAsTemplateDialog';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { useConflictDetection } from '@/hooks/useConflictDetection';
import { useQueryClient } from '@tanstack/react-query';
import { useZoneContext } from '@/hooks/useZoneContext';
import { usePreSaveValidation } from '@/hooks/usePreSaveValidation';
import { PreSaveValidationAlert } from '@/components/design/PreSaveValidationAlert';
import {
  sizeControlValve,
  getStandardValveSizes,
  getCvOptionsForSize,
  type ControlValveConfig,
  type ControlValveResults,
} from '@/lib/control-valve-calculations';

// Phase 4 UX imports
import { useKeyboardShortcuts, type ShortcutConfig } from '@/hooks/useKeyboardShortcuts';
import { useSmartDefaults } from '@/hooks/useSmartDefaults';
import { useSandbox } from '@/contexts/SandboxContext';
import { SmartDefaultsBanner } from '@/components/design/SmartDefaultsBanner';
import { SandboxModeToggle, SandboxModeBanner } from '@/components/design/SandboxModeToggle';
import { ScenarioManager } from '@/components/design/ScenarioManager';
import { ScenarioComparisonView, type ComparisonMetric } from '@/components/design/ScenarioComparisonView';
import { PromoteScenarioDialog } from '@/components/design/PromoteScenarioDialog';
import type { Scenario } from '@/contexts/SandboxContext';
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
import { GitBranch } from 'lucide-react';

// Control valve specific comparison metrics
const CONTROL_VALVE_METRICS: ComparisonMetric[] = [
  { key: 'calculatedCv', label: 'Calculated Cv', format: 'number' },
  { key: 'selectedCv', label: 'Selected Cv', format: 'number' },
  { key: 'authority', label: 'Valve Authority (%)', format: 'percentage' },
  { key: 'pressureDropPsi', label: 'Pressure Drop (psi)', format: 'number' },
];

export default function ControlValveSizing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { projectId, zoneId } = useZoneContext();

  // Current sizing ID for revisions
  const [currentSizingId, setCurrentSizingId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('selection');

  // Phase 5.3: Concurrent Editing
  const queryClient = useQueryClient();
  const { hasConflict, latestRevision, clearConflict } = useConflictDetection({
    entityType: 'control_valve',
    entityId: currentSizingId || null,
    currentRevisionNumber: 0,
  });

  const handleReloadLatest = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['control-valve-sizings'] });
    clearConflict();
    toast.info('Reloaded latest version');
  }, [queryClient, clearConflict]);

  const handleForceSave = useCallback(() => {
    clearConflict();
  }, [clearConflict]);

  // Input state
  const [valveType, setValveType] = useState<ControlValveConfig['valveType']>('2-way');
  const [flowGpm, setFlowGpm] = useState<number>(25);
  const [fluidType, setFluidType] = useState<ControlValveConfig['fluidType']>('water');
  const [fluidTempF, setFluidTempF] = useState<number>(45);
  const [coilPressureDropPsi, setCoilPressureDropPsi] = useState<number>(5);
  const [systemPressureDropPsi, setSystemPressureDropPsi] = useState<number>(25);
  const [targetAuthority, setTargetAuthority] = useState<number>(0.5);

  // Results
  const [results, setResults] = useState<ControlValveResults | null>(null);
  
  // Phase 6: Pre-Save Validation
  const { canSave, blockers, warnings } = usePreSaveValidation(projectId, 'control-valve-sizing');
  // Design Alternatives state
  const [showSaveAlternative, setShowSaveAlternative] = useState(false);
  const [showAlternativesManager, setShowAlternativesManager] = useState(false);
  const [showAlternativeComparison, setShowAlternativeComparison] = useState(false);
  const [alternativesToCompare, setAlternativesToCompare] = useState<DesignAlternative[]>([]);
  
  // Scenario-to-Alternative Promotion state
  const [showPromoteScenario, setShowPromoteScenario] = useState(false);
  const [scenarioToPromote, setScenarioToPromote] = useState<Scenario | null>(null);

  // Phase 4: Smart Defaults
  const { defaults, summary, hasContext } = useSmartDefaults({});

  // Phase 4: Sandbox Mode
  const { 
    state: sandboxState, 
    activateSandbox, 
    updateScenario, 
    setScenarioResults, 
    getMergedData 
  } = useSandbox();

  // Phase 4: Keyboard Shortcuts
  const handleSave = useCallback(() => {
    toast.success('Valve selection saved');
  }, []);

  const shortcuts: ShortcutConfig[] = useMemo(() => [
    {
      key: 's',
      modifiers: ['ctrl'],
      action: handleSave,
      description: 'Save valve selection',
      category: 'actions',
    },
    {
      key: 'Enter',
      modifiers: ['ctrl'],
      action: () => {
        if (flowGpm > 0 && coilPressureDropPsi > 0) {
          calculateValve();
        }
      },
      description: 'Recalculate',
      category: 'actions',
    },
    {
      key: 'n',
      action: () => navigate('/design/pump-selection'),
      description: 'Navigate to Pump Selection',
      category: 'navigation',
    },
    {
      key: 'p',
      action: () => navigate('/design/coil-selection'),
      description: 'Navigate to Coil Selection',
      category: 'navigation',
    },
    {
      key: '1',
      action: () => setActiveTab('selection'),
      description: 'Selection tab',
      category: 'navigation',
    },
    {
      key: '2',
      action: () => setActiveTab('authority'),
      description: 'Authority tab',
      category: 'navigation',
    },
    {
      key: '3',
      action: () => setActiveTab('actuator'),
      description: 'Actuator tab',
      category: 'navigation',
    },
    {
      key: '4',
      action: () => setActiveTab('summary'),
      description: 'Summary tab',
      category: 'navigation',
    },
  ], [handleSave, navigate, flowGpm, coilPressureDropPsi]);

  useKeyboardShortcuts(shortcuts);

  // Phase 4: Smart Defaults Handler
  const handleApplySmartDefaults = useCallback((values: Record<string, unknown>) => {
    if (values.target_authority) {
      setTargetAuthority(values.target_authority as number);
    }
    toast.success('Smart defaults applied');
  }, []);

  // Design Alternatives handlers
  const handleLoadAlternative = useCallback((data: Record<string, unknown>) => {
    if (data.valveType) setValveType(data.valveType as ControlValveConfig['valveType']);
    if (data.flowGpm) setFlowGpm(data.flowGpm as number);
    if (data.fluidType) setFluidType(data.fluidType as ControlValveConfig['fluidType']);
    if (data.targetAuthority) setTargetAuthority(data.targetAuthority as number);
    setShowAlternativesManager(false);
    toast.success('Alternative loaded');
  }, []);

  const handleCompareAlternatives = useCallback((alternatives: DesignAlternative[]) => {
    setAlternativesToCompare(alternatives);
    setShowAlternativeComparison(true);
    setShowAlternativesManager(false);
  }, []);

  // Scenario-to-Alternative Promotion handler
  const handlePromoteScenarioToAlternative = useCallback((scenario: Scenario) => {
    setScenarioToPromote(scenario);
    setShowPromoteScenario(true);
  }, []);

  // Phase 4: Sandbox Save Handler  
  const handleSandboxSave = useCallback((data: Record<string, unknown>) => {
    if (data.valveType) setValveType(data.valveType as ControlValveConfig['valveType']);
    if (data.flowGpm) setFlowGpm(data.flowGpm as number);
    if (data.fluidType) setFluidType(data.fluidType as ControlValveConfig['fluidType']);
    if (data.targetAuthority) setTargetAuthority(data.targetAuthority as number);
    toast.success('Scenario changes applied');
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Auto-calculate on input change
  useEffect(() => {
    if (flowGpm > 0 && coilPressureDropPsi > 0) {
      calculateValve();
    }
  }, [valveType, flowGpm, fluidType, fluidTempF, coilPressureDropPsi, systemPressureDropPsi, targetAuthority]);

  const calculateValve = () => {
    try {
      const config: ControlValveConfig = {
        valveType,
        flowGpm,
        fluidType,
        fluidTempF,
        coilPressureDropPsi,
        systemPressureDropPsi,
        targetAuthority,
      };
      const result = sizeControlValve(config);
      setResults(result);

      // Update sandbox scenario results if active
      if (sandboxState.isActive) {
        setScenarioResults({
          calculatedCv: result.calculatedCv,
          selectedCv: result.selectedValve.cvRated,
          authority: result.authority * 100,
          pressureDropPsi: result.actualPressureDropPsi,
        });
      }
    } catch (error) {
      toast.error('Calculation error');
      console.error(error);
    }
  };

  const handleApplyTemplate = (templateData: Record<string, unknown>) => {
    if (templateData.valveType) setValveType(templateData.valveType as ControlValveConfig['valveType']);
    if (templateData.fluidType) setFluidType(templateData.fluidType as ControlValveConfig['fluidType']);
    if (templateData.targetAuthority) setTargetAuthority(templateData.targetAuthority as number);
    toast.success('Template applied');
  };

  // Current tool data for sandbox
  const currentToolData = useMemo(() => ({
    valveType,
    flowGpm,
    fluidType,
    fluidTempF,
    coilPressureDropPsi,
    systemPressureDropPsi,
    targetAuthority,
  }), [valveType, flowGpm, fluidType, fluidTempF, coilPressureDropPsi, systemPressureDropPsi, targetAuthority]);

  const getAuthorityColor = (status: ControlValveResults['authorityStatus']) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'marginal': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
    }
  };

  const getAuthorityBadge = (status: ControlValveResults['authorityStatus']) => {
    switch (status) {
      case 'excellent': return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
      case 'good': return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
      case 'marginal': return <Badge className="bg-yellow-100 text-yellow-800">Marginal</Badge>;
      case 'poor': return <Badge variant="destructive">Poor</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const valveSizes = getStandardValveSizes();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Control Valve Sizing Calculator</h1>
            <p className="text-muted-foreground">
              Size 2-way and 3-way control valves with Cv and authority analysis
            </p>
          </div>
          <div className="flex gap-2">
            <SandboxModeToggle 
              currentData={currentToolData} 
              onExitWithSave={handleSandboxSave}
            />
            <ScenarioManager compact onPromoteToAlternative={handlePromoteScenarioToAlternative} />
            <DesignTemplateSelector
              templateType="control_valve_sizing"
              onApply={handleApplyTemplate}
              trigger={
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Templates
                </Button>
              }
            />
            <SaveAsTemplateDialog
              templateType="control_valve_sizing"
              templateData={{
                valveType,
                fluidType,
                targetAuthority,
                flowGpm,
                coilPressureDropPsi,
              }}
              trigger={
                <Button variant="outline" size="sm">
                  Save as Template
                </Button>
              }
            />
            <Button onClick={handleSave} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <ActiveEditorsIndicator 
              entityType="control_valve"
              entityId={currentSizingId || null}
              projectId={projectId || undefined}
            />
          </div>
        </div>

        {/* Workflow Progress */}
        {projectId && (
          <Card className="p-4">
            <DesignWorkflowProgressBar projectId={projectId} variant="compact" />
          </Card>
        )}

        {/* Phase 5.3: Edit Conflict Warning */}
        {hasConflict && latestRevision && currentSizingId && (
          <EditConflictWarning
            entityType="control_valve"
            entityId={currentSizingId}
            currentRevisionNumber={0}
            onReload={handleReloadLatest}
            onForceSave={handleForceSave}
          />
        )}

        {/* Phase 4: Sandbox Mode Banner */}
        <SandboxModeBanner />

        {/* Phase 4: Smart Defaults Banner */}
        {hasContext && defaults.length > 0 && (
          <SmartDefaultsBanner
            defaults={defaults}
            summary={summary}
            onApply={handleApplySmartDefaults}
            filterCategories={['equipment']}
          />
        )}

        {/* Phase 4: Scenario Comparison */}
        {sandboxState.isActive && sandboxState.scenarios.length > 1 && (
          <ScenarioComparisonView metrics={CONTROL_VALVE_METRICS} />
        )}

        {/* Phase 6: Pre-Save Validation Alert */}
        <PreSaveValidationAlert blockers={blockers} warnings={warnings} />

        {/* Phase 7: DataFlow Import Handler */}
        <DataFlowImportHandler
          projectId={projectId}
          zoneId={zoneId}
          currentTool="control-valve-sizing"
        />

        {/* Data Flow Suggestions */}
        <DataFlowSuggestions
          projectId={projectId}
          zoneId={zoneId}
          currentTool="control-valve-sizing"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Valve Parameters</CardTitle>
              <CardDescription>Enter flow and pressure data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Valve Type</Label>
                <Select value={valveType} onValueChange={(v) => setValveType(v as ControlValveConfig['valveType'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2-way">2-Way Modulating</SelectItem>
                    <SelectItem value="3-way-mixing">3-Way Mixing</SelectItem>
                    <SelectItem value="3-way-diverting">3-Way Diverting</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Flow Rate (GPM)</Label>
                <Input
                  type="number"
                  value={flowGpm}
                  onChange={(e) => setFlowGpm(Number(e.target.value))}
                  placeholder="25"
                />
              </div>

              <div className="space-y-2">
                <Label>Fluid Type</Label>
                <Select value={fluidType} onValueChange={(v) => setFluidType(v as ControlValveConfig['fluidType'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="water">Water</SelectItem>
                    <SelectItem value="glycol_25">25% Glycol</SelectItem>
                    <SelectItem value="glycol_50">50% Glycol</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fluid Temperature (°F)</Label>
                <Input
                  type="number"
                  value={fluidTempF}
                  onChange={(e) => setFluidTempF(Number(e.target.value))}
                  placeholder="45"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Coil Pressure Drop (psi)</Label>
                <Input
                  type="number"
                  value={coilPressureDropPsi}
                  onChange={(e) => setCoilPressureDropPsi(Number(e.target.value))}
                  placeholder="5"
                  step="0.5"
                />
              </div>

              <div className="space-y-2">
                <Label>System Pressure (psi)</Label>
                <Input
                  type="number"
                  value={systemPressureDropPsi}
                  onChange={(e) => setSystemPressureDropPsi(Number(e.target.value))}
                  placeholder="25"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Target Authority</Label>
                <Select value={targetAuthority.toString()} onValueChange={(v) => setTargetAuthority(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.3">0.3 (Minimum)</SelectItem>
                    <SelectItem value="0.4">0.4 (Standard)</SelectItem>
                    <SelectItem value="0.5">0.5 (Recommended)</SelectItem>
                    <SelectItem value="0.6">0.6 (Excellent)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Higher authority = better control, but more pump energy
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>Valve selection and performance analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {results ? (
                <Tabs defaultValue="selection">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="selection">Selection</TabsTrigger>
                    <TabsTrigger value="authority">Authority</TabsTrigger>
                    <TabsTrigger value="actuator">Actuator</TabsTrigger>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                  </TabsList>

                  <TabsContent value="selection" className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-primary/10 rounded-lg">
                        <p className="text-sm text-muted-foreground">Selected Valve Size</p>
                        <p className="text-3xl font-bold text-primary">{results.selectedValve.nominalSize}"</p>
                        <Badge variant="outline" className="mt-1">{results.selectedValve.bodyStyle}</Badge>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Calculated Cv</p>
                        <p className="text-2xl font-bold">{results.calculatedCv}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Selected Cv</p>
                        <p className="text-2xl font-bold">{results.selectedValve.cvRated}</p>
                      </div>
                    </div>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Flow Characteristic</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <Badge>{results.selectedValve.portType.replace(/_/g, ' ')}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{results.flowCharacteristic}</p>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Valve ΔP</p>
                        <p className="text-xl font-bold">{results.actualPressureDropPsi} psi</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Rangeability</p>
                        <p className="text-xl font-bold">{results.rangeability}:1</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="authority" className="space-y-4 pt-4">
                    <div className="p-6 bg-muted rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-2">Valve Authority</p>
                      <p className={`text-5xl font-bold ${getAuthorityColor(results.authorityStatus)}`}>
                        {(results.authority * 100).toFixed(0)}%
                      </p>
                      <div className="mt-2">{getAuthorityBadge(results.authorityStatus)}</div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Poor</span>
                        <span>Marginal</span>
                        <span>Good</span>
                        <span>Excellent</span>
                      </div>
                      <Progress value={results.authority * 100} className="h-3" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0%</span>
                        <span>20%</span>
                        <span>30%</span>
                        <span>50%+</span>
                      </div>
                    </div>

                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Authority = Valve ΔP / (Valve ΔP + Coil ΔP) = {results.actualPressureDropPsi} / ({results.actualPressureDropPsi} + {coilPressureDropPsi}) = {(results.authority * 100).toFixed(1)}%
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Target Authority</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{(targetAuthority * 100).toFixed(0)}%</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Achieved Authority</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{(results.authority * 100).toFixed(0)}%</p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="actuator" className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Close-Off Pressure</p>
                        <p className="text-2xl font-bold">{results.actuator.closeOffPressure_psi} psi</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Required Force</p>
                        <p className="text-2xl font-bold">{results.actuator.requiredForce_lbf} lbf</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Stroke Length</p>
                        <p className="text-2xl font-bold">{results.actuator.strokeLength_in}"</p>
                      </div>
                      <div className="p-4 bg-primary/10 rounded-lg">
                        <p className="text-sm text-muted-foreground">Recommended Actuator</p>
                        <p className="text-lg font-bold text-primary">{results.actuator.recommendedActuatorType}</p>
                        {results.actuator.springRange && (
                          <p className="text-sm text-muted-foreground">Spring: {results.actuator.springRange}</p>
                        )}
                      </div>
                    </div>

                    {results.actuator.closeOffPressure_psi < systemPressureDropPsi && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Actuator close-off pressure may be insufficient for system pressure
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>

                  <TabsContent value="summary" className="space-y-4 pt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Valve Specification</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium">{valveType.replace(/-/g, ' ').toUpperCase()}</span>
                          
                          <span className="text-muted-foreground">Size:</span>
                          <span className="font-medium">{results.selectedValve.nominalSize}" {results.selectedValve.bodyStyle}</span>
                          
                          <span className="text-muted-foreground">Cv:</span>
                          <span className="font-medium">{results.selectedValve.cvRated}</span>
                          
                          <span className="text-muted-foreground">Port Type:</span>
                          <span className="font-medium">{results.selectedValve.portType.replace(/_/g, ' ')}</span>
                          
                          <span className="text-muted-foreground">Flow:</span>
                          <span className="font-medium">{flowGpm} GPM</span>
                          
                          <span className="text-muted-foreground">ΔP:</span>
                          <span className="font-medium">{results.actualPressureDropPsi} psi</span>
                          
                          <span className="text-muted-foreground">Authority:</span>
                          <span className="font-medium">{(results.authority * 100).toFixed(0)}% ({results.authorityStatus})</span>
                          
                          <span className="text-muted-foreground">Actuator:</span>
                          <span className="font-medium">{results.actuator.recommendedActuatorType}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recommendations */}
                    {results.recommendations.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {results.recommendations.map((rec, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter valve parameters to calculate sizing</p>
                </div>
              )}

              {/* Warnings */}
              {results?.warnings && results.warnings.length > 0 && (
                <div className="mt-6 space-y-2">
                  {results.warnings.map((warning, i) => (
                    <Alert key={i} variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{warning}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Revision History Panel */}
        {currentSizingId && (
          <RevisionHistoryPanel
            entityType="control_valve_sizing"
            entityId={currentSizingId}
            projectId={projectId || ''}
          />
        )}

        {/* Workflow Navigation */}
        <DesignWorkflowNextStep
          currentPath="/design/control-valve-sizing"
          projectId={projectId}
        />

        {/* Design Alternatives and Scenario Promotion */}
        {projectId && (
          <>
            <SaveAsAlternativeDialog
              open={showSaveAlternative}
              onOpenChange={setShowSaveAlternative}
              projectId={projectId}
              entityType="control_valve"
              entityId={currentSizingId}
              data={currentToolData}
              suggestedName={`Control Valve - ${flowGpm} GPM`}
            />

            <DesignAlternativesManager
              open={showAlternativesManager}
              onOpenChange={setShowAlternativesManager}
              entityType="control_valve"
              entityId={currentSizingId}
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

            <PromoteScenarioDialog
              open={showPromoteScenario}
              onOpenChange={setShowPromoteScenario}
              scenario={scenarioToPromote}
              projectId={projectId}
              entityType="control_valve"
              entityId={currentSizingId}
              additionalData={currentToolData}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
