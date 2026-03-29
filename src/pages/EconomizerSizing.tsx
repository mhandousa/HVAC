import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, Wind, AlertTriangle, CheckCircle, Info, Lightbulb, FileText, Save } from 'lucide-react';
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
  sizeEconomizer,
  getClimateZones,
  getSaudiCities,
  type EconomizerConfig,
  type EconomizerResults,
} from '@/lib/economizer-calculations';

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

// Economizer specific comparison metrics
const ECONOMIZER_METRICS: ComparisonMetric[] = [
  { key: 'annualFreeHours', label: 'Annual Free Cooling Hours', format: 'number' },
  { key: 'energySavingsKwh', label: 'Energy Savings (kWh)', format: 'number' },
  { key: 'oaDamperSqFt', label: 'OA Damper Area (ft²)', format: 'number' },
  { key: 'highLimitDb', label: 'High Limit (°F)', format: 'number' },
];

export default function EconomizerSizing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { projectId, zoneId } = useZoneContext();

  // Current sizing ID for revisions (would come from saved record)
  const [currentSizingId, setCurrentSizingId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('requirements');

  // Phase 5.3: Concurrent Editing
  const queryClient = useQueryClient();
  const { hasConflict, latestRevision, clearConflict } = useConflictDetection({
    entityType: 'economizer',
    entityId: currentSizingId || null,
    currentRevisionNumber: 0,
  });

  const handleReloadLatest = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['economizer-sizings'] });
    clearConflict();
    toast.info('Reloaded latest version');
  }, [queryClient, clearConflict]);

  const handleForceSave = useCallback(() => {
    clearConflict();
  }, [clearConflict]);

  // Input state
  const [designCfm, setDesignCfm] = useState<number>(10000);
  const [outdoorAirCfm, setOutdoorAirCfm] = useState<number>(2500);
  const [climateZone, setClimateZone] = useState<string>('0B');
  const [coolingCapacityTons, setCoolingCapacityTons] = useState<number>(60);
  const [economizerType, setEconomizerType] = useState<EconomizerConfig['economizerType']>('dry_bulb');
  const [maxDamperVelocity, setMaxDamperVelocity] = useState<number>(2000);
  const [outdoorDesignDb, setOutdoorDesignDb] = useState<number>(115);
  const [indoorDesignDb, setIndoorDesignDb] = useState<number>(75);

  // Results
  const [results, setResults] = useState<EconomizerResults | null>(null);
  
  // Phase 6: Pre-Save Validation
  const { canSave, blockers, warnings } = usePreSaveValidation(projectId, 'economizer-sizing');
  // Design Alternatives state
  const [showSaveAlternative, setShowSaveAlternative] = useState(false);
  const [showAlternativesManager, setShowAlternativesManager] = useState(false);
  const [showAlternativeComparison, setShowAlternativeComparison] = useState(false);
  const [alternativesToCompare, setAlternativesToCompare] = useState<DesignAlternative[]>([]);
  
  // Scenario-to-Alternative Promotion state
  const [showPromoteScenario, setShowPromoteScenario] = useState(false);
  const [scenarioToPromote, setScenarioToPromote] = useState<Scenario | null>(null);

  // Phase 4: Smart Defaults
  const { defaults, summary, hasContext } = useSmartDefaults({
    climateZone: climateZone as any,
  });

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
    toast.success('Economizer configuration saved');
  }, []);

  const shortcuts: ShortcutConfig[] = useMemo(() => [
    {
      key: 's',
      modifiers: ['ctrl'],
      action: handleSave,
      description: 'Save economizer configuration',
      category: 'actions',
    },
    {
      key: 'Enter',
      modifiers: ['ctrl'],
      action: () => {
        if (designCfm > 0 && outdoorAirCfm > 0 && coolingCapacityTons > 0) {
          calculateEconomizer();
        }
      },
      description: 'Recalculate',
      category: 'actions',
    },
    {
      key: 'n',
      action: () => navigate('/design/erv-sizing'),
      description: 'Navigate to ERV Sizing',
      category: 'navigation',
    },
    {
      key: 'p',
      action: () => navigate('/design/ahu-configuration'),
      description: 'Navigate to AHU Configuration',
      category: 'navigation',
    },
    {
      key: '1',
      action: () => setActiveTab('requirements'),
      description: 'Requirements tab',
      category: 'navigation',
    },
    {
      key: '2',
      action: () => setActiveTab('dampers'),
      description: 'Dampers tab',
      category: 'navigation',
    },
    {
      key: '3',
      action: () => setActiveTab('controls'),
      description: 'Controls tab',
      category: 'navigation',
    },
    {
      key: '4',
      action: () => setActiveTab('energy'),
      description: 'Energy tab',
      category: 'navigation',
    },
  ], [handleSave, navigate, designCfm, outdoorAirCfm, coolingCapacityTons]);

  useKeyboardShortcuts(shortcuts);

  // Phase 4: Smart Defaults Handler
  const handleApplySmartDefaults = useCallback((values: Record<string, unknown>) => {
    if (values.economizer_high_limit_db) {
      // Apply climate-zone specific high limit
    }
    if (values.max_damper_velocity_fpm) {
      setMaxDamperVelocity(values.max_damper_velocity_fpm as number);
    }
    toast.success('Smart defaults applied');
  }, []);

  // Design Alternatives handlers
  const handleLoadAlternative = useCallback((data: Record<string, unknown>) => {
    if (data.designCfm) setDesignCfm(data.designCfm as number);
    if (data.outdoorAirCfm) setOutdoorAirCfm(data.outdoorAirCfm as number);
    if (data.climateZone) setClimateZone(data.climateZone as string);
    if (data.coolingCapacityTons) setCoolingCapacityTons(data.coolingCapacityTons as number);
    if (data.economizerType) setEconomizerType(data.economizerType as EconomizerConfig['economizerType']);
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
    if (data.designCfm) setDesignCfm(data.designCfm as number);
    if (data.outdoorAirCfm) setOutdoorAirCfm(data.outdoorAirCfm as number);
    if (data.climateZone) setClimateZone(data.climateZone as string);
    if (data.coolingCapacityTons) setCoolingCapacityTons(data.coolingCapacityTons as number);
    if (data.economizerType) setEconomizerType(data.economizerType as EconomizerConfig['economizerType']);
    toast.success('Scenario changes applied');
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Auto-calculate on input change
  useEffect(() => {
    if (designCfm > 0 && outdoorAirCfm > 0 && coolingCapacityTons > 0) {
      calculateEconomizer();
    }
  }, [designCfm, outdoorAirCfm, climateZone, coolingCapacityTons, economizerType, maxDamperVelocity, outdoorDesignDb, indoorDesignDb]);

  const calculateEconomizer = () => {
    try {
      const config: EconomizerConfig = {
        designCfm,
        outdoorAirCfm,
        climateZone,
        coolingCapacityTons,
        economizerType,
        maxDamperVelocityFpm: maxDamperVelocity,
        outdoorDesignDb,
        indoorDesignDb,
      };
      const result = sizeEconomizer(config);
      setResults(result);

      // Update sandbox scenario results if active
      if (sandboxState.isActive) {
        setScenarioResults({
          annualFreeHours: result.energyAnalysis.annualFreeHours,
          energySavingsKwh: result.energyAnalysis.estimatedSavingsKwh,
          oaDamperSqFt: result.damperSizing.oaDamperSqFt,
          highLimitDb: result.highLimitShutoff.value,
        });
      }
    } catch (error) {
      toast.error('Calculation error');
      console.error(error);
    }
  };

  const handleApplyTemplate = (templateData: Record<string, unknown>) => {
    if (templateData.designCfm) setDesignCfm(templateData.designCfm as number);
    if (templateData.outdoorAirCfm) setOutdoorAirCfm(templateData.outdoorAirCfm as number);
    if (templateData.climateZone) setClimateZone(templateData.climateZone as string);
    if (templateData.coolingCapacityTons) setCoolingCapacityTons(templateData.coolingCapacityTons as number);
    if (templateData.economizerType) setEconomizerType(templateData.economizerType as EconomizerConfig['economizerType']);
    toast.success('Template applied');
  };

  // Current tool data for sandbox
  const currentToolData = useMemo(() => ({
    designCfm,
    outdoorAirCfm,
    climateZone,
    coolingCapacityTons,
    economizerType,
    maxDamperVelocity,
  }), [designCfm, outdoorAirCfm, climateZone, coolingCapacityTons, economizerType, maxDamperVelocity]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const climateZones = getClimateZones();
  const saudiCities = getSaudiCities();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Economizer Sizing Calculator</h1>
            <p className="text-muted-foreground">
              Size air-side economizers per ASHRAE 90.1-2019 Section 6.5.1
            </p>
          </div>
          <div className="flex gap-2">
            <SandboxModeToggle 
              currentData={currentToolData} 
              onExitWithSave={handleSandboxSave}
            />
            <ScenarioManager compact onPromoteToAlternative={handlePromoteScenarioToAlternative} />
            <DesignTemplateSelector
              templateType="economizer_sizing"
              onApply={handleApplyTemplate}
              trigger={
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Templates
                </Button>
              }
            />
            <SaveAsTemplateDialog
              templateType="economizer_sizing"
              templateData={{
                designCfm,
                outdoorAirCfm,
                climateZone,
                coolingCapacityTons,
                economizerType,
                maxDamperVelocity,
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
              entityType="economizer"
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
            entityType="economizer"
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
          <ScenarioComparisonView metrics={ECONOMIZER_METRICS} />
        )}

        {/* Phase 6: Pre-Save Validation Alert */}
        <PreSaveValidationAlert blockers={blockers} warnings={warnings} />

        {/* Phase 7: DataFlow Import Handler */}
        <DataFlowImportHandler
          projectId={projectId}
          zoneId={zoneId}
          currentTool="economizer-sizing"
        />

        {/* Data Flow Suggestions */}
        <DataFlowSuggestions
          projectId={projectId}
          zoneId={zoneId}
          currentTool="economizer-sizing"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>System Parameters</CardTitle>
              <CardDescription>Enter AHU and climate data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Design CFM</Label>
                <Input
                  type="number"
                  value={designCfm}
                  onChange={(e) => setDesignCfm(Number(e.target.value))}
                  placeholder="10000"
                />
              </div>

              <div className="space-y-2">
                <Label>Outdoor Air CFM</Label>
                <Input
                  type="number"
                  value={outdoorAirCfm}
                  onChange={(e) => setOutdoorAirCfm(Number(e.target.value))}
                  placeholder="2500"
                />
              </div>

              <div className="space-y-2">
                <Label>Cooling Capacity (tons)</Label>
                <Input
                  type="number"
                  value={coolingCapacityTons}
                  onChange={(e) => setCoolingCapacityTons(Number(e.target.value))}
                  placeholder="60"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Climate Zone</Label>
                <Select value={climateZone} onValueChange={setClimateZone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {climateZones.map((zone) => (
                      <SelectItem key={zone} value={zone}>
                        Zone {zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Saudi cities: {saudiCities.filter(c => c.zone === climateZone).map(c => c.city).join(', ') || 'N/A'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Economizer Type</Label>
                <Select value={economizerType} onValueChange={(v) => setEconomizerType(v as EconomizerConfig['economizerType'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dry_bulb">Fixed Dry-Bulb</SelectItem>
                    <SelectItem value="enthalpy">Fixed Enthalpy</SelectItem>
                    <SelectItem value="differential_enthalpy">Differential Enthalpy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Max Damper Velocity (FPM)</Label>
                <Input
                  type="number"
                  value={maxDamperVelocity}
                  onChange={(e) => setMaxDamperVelocity(Number(e.target.value))}
                  placeholder="2000"
                />
              </div>

              <div className="space-y-2">
                <Label>Outdoor Design DB (°F)</Label>
                <Input
                  type="number"
                  value={outdoorDesignDb}
                  onChange={(e) => setOutdoorDesignDb(Number(e.target.value))}
                  placeholder="115"
                />
              </div>

              <div className="space-y-2">
                <Label>Indoor Design DB (°F)</Label>
                <Input
                  type="number"
                  value={indoorDesignDb}
                  onChange={(e) => setIndoorDesignDb(Number(e.target.value))}
                  placeholder="75"
                />
              </div>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>Economizer sizing and compliance analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {results ? (
                <Tabs defaultValue="requirements">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="requirements">Requirements</TabsTrigger>
                    <TabsTrigger value="dampers">Damper Sizing</TabsTrigger>
                    <TabsTrigger value="controls">Controls</TabsTrigger>
                    <TabsTrigger value="energy">Energy</TabsTrigger>
                  </TabsList>

                  <TabsContent value="requirements" className="space-y-4 pt-4">
                    <Alert variant={results.required ? 'default' : 'destructive'}>
                      {results.required ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Info className="h-4 w-4" />
                      )}
                      <AlertTitle>
                        {results.required ? 'Economizer Required' : 'Economizer Not Required'}
                      </AlertTitle>
                      <AlertDescription>{results.requirementReason}</AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Capacity Threshold</p>
                        <p className="text-2xl font-bold">{results.capacityThreshold} tons</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Your Capacity</p>
                        <p className="text-2xl font-bold">{coolingCapacityTons} tons</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Mixed Air Temp</p>
                        <p className="text-2xl font-bold">{results.mixedAirTempF}°F</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">OA Percentage</p>
                        <p className="text-2xl font-bold">{((outdoorAirCfm / designCfm) * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="dampers" className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">OA Damper</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{results.damperSizing.oaDamperSqFt} ft²</p>
                          <p className="text-sm text-muted-foreground">
                            {(results.damperSizing.oaDamperWidth * 12).toFixed(0)}" × {(results.damperSizing.oaDamperHeight * 12).toFixed(0)}"
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">RA Damper</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{results.damperSizing.raDamperSqFt} ft²</p>
                          <p className="text-sm text-muted-foreground">
                            {(results.damperSizing.raDamperWidth * 12).toFixed(0)}" × {(results.damperSizing.raDamperHeight * 12).toFixed(0)}"
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">MA Damper</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{results.damperSizing.maDamperSqFt} ft²</p>
                          <p className="text-sm text-muted-foreground">
                            {(results.damperSizing.maDamperWidth * 12).toFixed(0)}" × {(results.damperSizing.maDamperHeight * 12).toFixed(0)}"
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Design Face Velocity</p>
                      <p className="text-lg font-semibold">{results.damperSizing.faceVelocityFpm} FPM</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="controls" className="space-y-4 pt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">High-Limit Shutoff</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{results.highLimitShutoff.type.replace(/_/g, ' ')}</Badge>
                          <span className="font-semibold">
                            {results.highLimitShutoff.value} {results.highLimitShutoff.unit}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{results.highLimitShutoff.description}</p>
                      </CardContent>
                    </Card>

                    {results.recommendations.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            Recommendations
                          </CardTitle>
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

                  <TabsContent value="energy" className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Annual Free Cooling Hours</p>
                        <p className="text-2xl font-bold">{results.energyAnalysis.annualFreeHours}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">% of Cooling Hours</p>
                        <p className="text-2xl font-bold">{results.energyAnalysis.percentFreeHours}%</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Ton-Hours Saved</p>
                        <p className="text-2xl font-bold">{results.energyAnalysis.coolingTonHoursSaved.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-primary/10 rounded-lg">
                        <p className="text-sm text-muted-foreground">Estimated kWh Savings</p>
                        <p className="text-2xl font-bold text-primary">{results.energyAnalysis.estimatedSavingsKwh.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-primary/10 rounded-lg col-span-2">
                        <p className="text-sm text-muted-foreground">Estimated Annual Savings</p>
                        <p className="text-2xl font-bold text-primary">${results.energyAnalysis.estimatedSavingsCost.toLocaleString()}</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Wind className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter system parameters to calculate economizer sizing</p>
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
            entityType="economizer_sizing"
            entityId={currentSizingId}
            projectId={projectId || ''}
          />
        )}

        {/* Workflow Navigation */}
        <DesignWorkflowNextStep
          currentPath="/design/economizer-sizing"
          projectId={projectId}
        />

        {/* Design Alternatives and Scenario Promotion */}
        {projectId && (
          <>
            <SaveAsAlternativeDialog
              open={showSaveAlternative}
              onOpenChange={setShowSaveAlternative}
              projectId={projectId}
              entityType="economizer"
              entityId={currentSizingId}
              data={currentToolData}
              suggestedName={`Economizer - ${designCfm.toLocaleString()} CFM`}
            />

            <DesignAlternativesManager
              open={showAlternativesManager}
              onOpenChange={setShowAlternativesManager}
              entityType="economizer"
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
              entityType="economizer"
              entityId={currentSizingId}
              additionalData={currentToolData}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
