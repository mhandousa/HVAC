import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useZoneContext } from '@/hooks/useZoneContext';
import { useLoadCalculations } from '@/hooks/useLoadCalculations';
import { useKeyboardShortcuts, type ShortcutConfig } from '@/hooks/useKeyboardShortcuts';
import { useSmartDefaults, type BuildingType } from '@/hooks/useSmartDefaults';
import { useSandbox } from '@/contexts/SandboxContext';
import { useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Save, FolderOpen, Loader2, Lightbulb, History, FileText as TemplateIcon } from 'lucide-react';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { CrossToolValidationAlert } from '@/components/design/CrossToolValidationAlert';
import { RevisionHistoryPanel } from '@/components/design/RevisionHistoryPanel';
import { DesignTemplateSelector } from '@/components/design/DesignTemplateSelector';
import { SaveAsTemplateDialog } from '@/components/design/SaveAsTemplateDialog';
import { SmartDefaultsBanner } from '@/components/design/SmartDefaultsBanner';
import { SandboxModeToggle, SandboxModeBanner } from '@/components/design/SandboxModeToggle';
import { ScenarioManager } from '@/components/design/ScenarioManager';
import { ScenarioComparisonView, type ComparisonMetric } from '@/components/design/ScenarioComparisonView';
import { PromoteScenarioDialog } from '@/components/design/PromoteScenarioDialog';
import type { Scenario } from '@/contexts/SandboxContext';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { useConflictDetection } from '@/hooks/useConflictDetection';
import { usePreSaveValidation } from '@/hooks/usePreSaveValidation';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { PreSaveValidationAlert } from '@/components/design/PreSaveValidationAlert';
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
import { AHUBasicInfoPanel } from '@/components/ahu-config/AHUBasicInfoPanel';
import { CoilSelectionPanel } from '@/components/ahu-config/CoilSelectionPanel';
import { FanArrayPanel } from '@/components/ahu-config/FanArrayPanel';
import { FilterDamperPanel } from '@/components/ahu-config/FilterDamperPanel';
import { ControlSequencePanel } from '@/components/ahu-config/ControlSequencePanel';
import { AHUSummaryPanel } from '@/components/ahu-config/AHUSummaryPanel';
import { AHUSchematic } from '@/components/ahu-config/AHUSchematic';
import { SaveAHUDialog } from '@/components/ahu-config/SaveAHUDialog';
import { LoadAHUDialog } from '@/components/ahu-config/LoadAHUDialog';
import { toast } from 'sonner';
import {
  useAHUConfigurations,
  useCreateAHUConfiguration,
  useUpdateAHUConfiguration,
  useDeleteAHUConfiguration,
  type AHUConfiguration as AHUConfigurationType,
} from '@/hooks/useAHUConfigurations';
import type {
  CoolingCoilConfig,
  HeatingCoilConfig,
  PreheatCoilConfig,
  FanConfig,
  FilterConfig,
  DamperConfig,
  ControlSequenceConfig,
} from '@/lib/ahu-calculations';

// Comparison metrics for AHU configuration scenarios
const AHU_METRICS: ComparisonMetric[] = [
  { key: 'designCfm', label: 'Design CFM', format: 'number' },
  { key: 'designStaticPressureIn', label: 'Static Pressure (in)', format: 'number' },
  { key: 'coolingTons', label: 'Cooling Capacity (Tons)', format: 'number' },
  { key: 'supplyFanBhp', label: 'Supply Fan BHP', format: 'number' },
];

// Basic info interface matching the panel props
interface BasicInfo {
  ahuTag: string;
  ahuName: string;
  description: string;
  location: string;
  designCfm: number;
  designStaticPressureIn: number;
  outdoorAirCfm: number;
  returnAirCfm: number;
  minOaPercent: number;
  controlStrategy: string;
}

// Control sequence config with defaults
const defaultControlSequence: ControlSequenceConfig = {
  controlStrategy: 'vav',
  economizerType: 'dry_bulb',
  economizerLockoutTempF: 75,
  supplyAirTempSetpointF: 55,
  ductStaticSetpointIn: 1.5,
  minOaDamperPosition: 15,
  mixedAirLowLimitF: 40,
  hasCo2Sensors: false,
  hasDcv: false,
};

export default function AHUConfiguration() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Zone context persistence
  const { projectId: storedProjectId, setContext } = useZoneContext();
  const projectIdFromUrl = searchParams.get('project') || storedProjectId || undefined;
  
  // Sync context when project changes
  useEffect(() => {
    if (projectIdFromUrl) {
      setContext(projectIdFromUrl, null, { replace: true });
    }
  }, [projectIdFromUrl, setContext]);
  const [activeTab, setActiveTab] = useState('basic');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [loadedId, setLoadedId] = useState<string | undefined>();
  
  // Template and Revision state
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  
  // Design Alternatives state
  const [showSaveAlternative, setShowSaveAlternative] = useState(false);
  const [showAlternativesManager, setShowAlternativesManager] = useState(false);
  const [showAlternativeComparison, setShowAlternativeComparison] = useState(false);
  const [alternativesToCompare, setAlternativesToCompare] = useState<DesignAlternative[]>([]);
  
  // Scenario-to-Alternative Promotion state
  const [showPromoteScenario, setShowPromoteScenario] = useState(false);
  const [scenarioToPromote, setScenarioToPromote] = useState<Scenario | null>(null);

  // Phase 4 UX: Smart Defaults
  const { defaults, summary, hasContext } = useSmartDefaults({
    buildingType: undefined, // Will be inferred from project name
  });

  // Phase 4 UX: Sandbox Mode
  const { state: sandboxState, updateScenario, setScenarioResults, getMergedData } = useSandbox();

  // Concurrent Editing Awareness
  const queryClient = useQueryClient();
  const { hasConflict, latestRevision, clearConflict } = useConflictDetection({
    entityType: 'ahu_configuration',
    entityId: loadedId || null,
    currentRevisionNumber: 0,
  });

  // Pre-Save Validation & Stage Locking
  const { canSave, blockers, warnings, isLocked } = useToolValidation(
    projectIdFromUrl || null,
    'ahu-configuration',
    { checkStageLock: true }
  );
  const handleReloadLatest = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['ahu-configurations'] });
    clearConflict();
    toast.info('Reloaded latest version');
  }, [queryClient, clearConflict]);

  const handleViewDiff = useCallback(() => {
    setShowRevisionHistory(true);
  }, []);

  const handleForceSave = useCallback(() => {
    clearConflict();
  }, [clearConflict]);

  // Phase 4 UX: Smart Defaults Handler
  const handleApplySmartDefaults = useCallback((values: Record<string, number | string>) => {
    // Update control sequence based on smart defaults
    if (values.sat_supply_temp) {
      setControlSequence(prev => ({
        ...prev,
        supplyAirTempSetpointF: values.sat_supply_temp as number,
      }));
    }
    if (values.economizer_lockout_temp) {
      setControlSequence(prev => ({
        ...prev,
        economizerLockoutTempF: values.economizer_lockout_temp as number,
      }));
    }
    if (values.min_oa_damper) {
      setBasicInfo(prev => ({
        ...prev,
        minOaPercent: values.min_oa_damper as number,
      }));
    }
    toast.success('Smart defaults applied');
  }, []);

  // Phase 4 UX: Sandbox Save Handler
  const handleSandboxSave = useCallback((data: Record<string, unknown>) => {
    if (data.designCfm) setBasicInfo(prev => ({ ...prev, designCfm: data.designCfm as number }));
    if (data.designStaticPressureIn) setBasicInfo(prev => ({ ...prev, designStaticPressureIn: data.designStaticPressureIn as number }));
    toast.success('Sandbox changes applied');
  }, []);

  // Design Alternatives handlers
  const handleLoadAlternative = useCallback((data: Record<string, unknown>) => {
    if (data.basicInfo) setBasicInfo(data.basicInfo as BasicInfo);
    if (data.coolingCoil) setCoolingCoil(data.coolingCoil as CoolingCoilConfig);
    if (data.heatingCoil) setHeatingCoil(data.heatingCoil as HeatingCoilConfig);
    if (data.preheatCoil) setPreheatCoil(data.preheatCoil as PreheatCoilConfig);
    if (data.supplyFan) setSupplyFan(data.supplyFan as FanConfig);
    if (data.controlSequence) setControlSequence(data.controlSequence as ControlSequenceConfig);
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

  // Phase 4 UX: Keyboard Shortcuts
  const shortcuts: ShortcutConfig[] = useMemo(() => [
    {
      key: 's',
      modifiers: ['ctrl'],
      description: 'Save AHU configuration',
      action: () => setShowSaveDialog(true),
      category: 'actions',
    },
    {
      key: 'n',
      description: 'Next workflow step',
      action: () => navigate('/design/terminal-unit-sizing'),
      category: 'navigation',
    },
    {
      key: 'p',
      description: 'Previous workflow step',
      action: () => navigate('/design/equipment-selection'),
      category: 'navigation',
    },
    {
      key: '1',
      description: 'Basic Info tab',
      action: () => setActiveTab('basic'),
      category: 'navigation',
    },
    {
      key: '2',
      description: 'Coils tab',
      action: () => setActiveTab('coils'),
      category: 'navigation',
    },
    {
      key: '3',
      description: 'Fans tab',
      action: () => setActiveTab('fans'),
      category: 'navigation',
    },
    {
      key: '4',
      description: 'Filters/Dampers tab',
      action: () => setActiveTab('filters'),
      category: 'navigation',
    },
    {
      key: '5',
      description: 'Controls tab',
      action: () => setActiveTab('controls'),
      category: 'navigation',
    },
    {
      key: '6',
      description: 'Schematic tab',
      action: () => setActiveTab('schematic'),
      category: 'navigation',
    },
    {
      key: '7',
      description: 'Summary tab',
      action: () => setActiveTab('summary'),
      category: 'navigation',
    },
  ], [navigate]);

  useKeyboardShortcuts(shortcuts);

  // Basic info state
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    ahuTag: '',
    ahuName: '',
    description: '',
    location: '',
    designCfm: 10000,
    designStaticPressureIn: 4.0,
    outdoorAirCfm: 2000,
    returnAirCfm: 8000,
    minOaPercent: 20,
    controlStrategy: 'vav',
  });

  // Coil configs
  const [coolingCoil, setCoolingCoil] = useState<CoolingCoilConfig | null>({
    coilType: 'chilled_water',
    rows: 6,
    finsPerInch: 12,
    faceVelocityFpm: 500,
    enteringAirDb: 80,
    enteringAirWb: 67,
    leavingAirDb: 55,
    leavingAirWb: 54,
    chwSupplyTemp: 44,
    chwReturnTemp: 56,
  });
  const [heatingCoil, setHeatingCoil] = useState<HeatingCoilConfig | null>({
    coilType: 'hot_water',
    rows: 1,
    enteringAirTemp: 55,
    leavingAirTemp: 95,
    hwSupplyTemp: 180,
    hwReturnTemp: 160,
  });
  const [preheatCoil, setPreheatCoil] = useState<PreheatCoilConfig | null>(null);

  // Fan configs
  const [supplyFan, setSupplyFan] = useState<FanConfig | null>({
    fanType: 'plenum',
    arrangement: 'single',
    redundancy: 'n',
    motorType: 'premium_efficiency',
    hasVfd: true,
    designCfm: 10000,
    designStaticIn: 4.0,
  });
  const [returnFan, setReturnFan] = useState<FanConfig | null>(null);
  const [reliefFan, setReliefFan] = useState<FanConfig | null>(null);

  // Filter config
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    preFilterMerv: 8,
    finalFilterMerv: 13,
    filterType: 'pleated',
    faceVelocityFpm: 400,
  });

  // Damper config
  const [damperConfig, setDamperConfig] = useState<DamperConfig>({
    outsideAir: {
      widthIn: 24,
      heightIn: 24,
      actuatorType: 'modulating',
      failPosition: 'closed',
    },
    returnAir: {
      widthIn: 36,
      heightIn: 36,
      actuatorType: 'modulating',
      failPosition: 'closed',
    },
    exhaust: {
      enabled: true,
      widthIn: 24,
      heightIn: 24,
      actuatorType: 'modulating',
      failPosition: 'open',
    },
    isolation: {
      enabled: false,
      motorized: false,
    },
  });

  // Control sequence
  const [controlSequence, setControlSequence] = useState<ControlSequenceConfig>(defaultControlSequence);

  // Hooks
  const { data: configurations = [], isLoading: isLoadingConfigs } = useAHUConfigurations();
  const { data: loadCalcData } = useLoadCalculations(projectIdFromUrl);
  const createMutation = useCreateAHUConfiguration();
  const updateMutation = useUpdateAHUConfiguration();
  const deleteMutation = useDeleteAHUConfiguration();

  // Calculate totals from load calculations for import
  const loadCalcSummary = useMemo(() => {
    if (!loadCalcData?.length) return null;
    
    // Use the cfm_required field directly from load_calculations table
    const totalCfm = loadCalcData.reduce((sum, lc) => {
      return sum + (lc.cfm_required || 0);
    }, 0);
    const totalCooling = loadCalcData.reduce((sum, lc) => {
      return sum + (lc.cooling_load_btuh || 0);
    }, 0);
    
    return { totalCfm: Math.round(totalCfm), totalCooling, zoneCount: loadCalcData.length };
  }, [loadCalcData]);

  // Import handler for load calculation data
  const handleImportFromLoadCalc = () => {
    if (loadCalcSummary && loadCalcSummary.totalCfm > 0) {
      setBasicInfo(prev => ({
        ...prev,
        designCfm: loadCalcSummary.totalCfm,
      }));
      toast.success(`Imported ${loadCalcSummary.totalCfm.toLocaleString()} CFM from load calculations`);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleLoadConfig = (config: AHUConfigurationType) => {
    setBasicInfo({
      ahuTag: config.ahuTag,
      ahuName: config.ahuName,
      description: config.description || '',
      location: config.location || '',
      designCfm: config.designCfm,
      designStaticPressureIn: config.designStaticPressureIn,
      outdoorAirCfm: config.outdoorAirCfm || 0,
      returnAirCfm: config.returnAirCfm || 0,
      minOaPercent: config.minOaPercent,
      controlStrategy: config.controlStrategy,
    });
    setCoolingCoil(config.coolingCoilConfig);
    setHeatingCoil(config.heatingCoilConfig);
    setPreheatCoil(config.preheatCoilConfig);
    setSupplyFan(config.supplyFanConfig);
    setReturnFan(config.returnFanConfig);
    setReliefFan(config.reliefFanConfig);
    if (config.controlSequenceJson) {
      setControlSequence(config.controlSequenceJson);
    }
    setLoadedId(config.id);
  };

  const handleSave = async (name: string, description: string) => {
    const configData = {
      ahuTag: basicInfo.ahuTag || 'AHU-01',
      ahuName: name,
      description,
      location: basicInfo.location,
      designCfm: basicInfo.designCfm,
      designStaticPressureIn: basicInfo.designStaticPressureIn,
      outdoorAirCfm: basicInfo.outdoorAirCfm,
      returnAirCfm: basicInfo.returnAirCfm,
      minOaPercent: basicInfo.minOaPercent,
      controlStrategy: basicInfo.controlStrategy,
    };

    if (loadedId) {
      await updateMutation.mutateAsync({
        id: loadedId,
        updates: {
          ...configData,
          coolingCoilConfig: coolingCoil,
          heatingCoilConfig: heatingCoil,
          preheatCoilConfig: preheatCoil,
          supplyFanConfig: supplyFan,
          returnFanConfig: returnFan,
          reliefFanConfig: reliefFan,
          controlSequenceJson: controlSequence,
        },
      });
    } else {
      const created = await createMutation.mutateAsync(configData);
      setLoadedId(created.id);
      // Update with full config
      await updateMutation.mutateAsync({
        id: created.id,
        updates: {
          coolingCoilConfig: coolingCoil,
          heatingCoilConfig: heatingCoil,
          preheatCoilConfig: preheatCoil,
          supplyFanConfig: supplyFan,
          returnFanConfig: returnFan,
          reliefFanConfig: reliefFan,
          controlSequenceJson: controlSequence,
        },
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
    if (id === loadedId) {
      setLoadedId(undefined);
    }
  };

  // Build summary config for AHUSummaryPanel
  const summaryConfig: Partial<AHUConfigurationType> = {
    ahuTag: basicInfo.ahuTag,
    ahuName: basicInfo.ahuName,
    description: basicInfo.description,
    location: basicInfo.location,
    designCfm: basicInfo.designCfm,
    designStaticPressureIn: basicInfo.designStaticPressureIn,
    outdoorAirCfm: basicInfo.outdoorAirCfm,
    returnAirCfm: basicInfo.returnAirCfm,
    minOaPercent: basicInfo.minOaPercent,
    controlStrategy: basicInfo.controlStrategy,
    coolingCoilConfig: coolingCoil,
    heatingCoilConfig: heatingCoil,
    preheatCoilConfig: preheatCoil,
    supplyFanConfig: supplyFan,
    returnFanConfig: returnFan,
    reliefFanConfig: reliefFan,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/design')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AHU Configuration</h1>
              <p className="text-muted-foreground">
                {basicInfo.ahuTag || 'New AHU'} • {basicInfo.ahuName || 'Untitled'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SandboxModeToggle
              currentData={{ basicInfo, coolingCoil, heatingCoil, supplyFan, controlSequence }}
              onExitWithSave={handleSandboxSave}
            />
            <ScenarioManager compact onPromoteToAlternative={handlePromoteScenarioToAlternative} />
            <Button variant="outline" onClick={() => setShowTemplateSelector(true)}>
              <TemplateIcon className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <Button variant="outline" onClick={() => setShowRevisionHistory(true)} disabled={!loadedId}>
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <GitBranch className="h-4 w-4 mr-2" />
                  Alternatives
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowSaveAlternative(true)}>
                  Save as Alternative...
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowAlternativesManager(true)}>
                  View Alternatives
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ActiveEditorsIndicator
              entityType="ahu_configuration"
              entityId={loadedId || null}
              projectId={projectIdFromUrl}
            />
            <Button variant="outline" onClick={() => setShowLoadDialog(true)}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Load
            </Button>
            <Button onClick={() => setShowSaveDialog(true)}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Conflict Warning */}
        {hasConflict && (
          <EditConflictWarning
            entityType="ahu_configuration"
            entityId={loadedId || null}
            currentRevisionNumber={0}
            onReload={handleReloadLatest}
            onViewDiff={handleViewDiff}
            onForceSave={handleForceSave}
          />
        )}

        {/* Stage Locking & Pre-Save Validation Header */}
        <ToolPageHeader
          toolType="ahu-configuration"
          toolName="AHU Configuration"
          projectId={projectIdFromUrl || null}
          showLockButton={!!projectIdFromUrl}
          showValidation={!!projectIdFromUrl}
        />

        {/* Workflow Progress */}
        {projectIdFromUrl && (
          <DesignWorkflowProgressBar
            projectId={projectIdFromUrl}
            variant="compact"
            showLabels={false}
            showPercentages={true}
            className="mb-2"
          />
        )}

        {/* Data Flow Suggestions */}
        {projectIdFromUrl && (
          <DataFlowSuggestions
            projectId={projectIdFromUrl}
            currentTool="ahu-configuration"
            variant="alert"
            className="mb-4"
          />
        )}

        {/* Cross-Tool Validation Alert */}
        {projectIdFromUrl && (
          <CrossToolValidationAlert
            projectId={projectIdFromUrl}
            currentTool="ahu-configuration"
            variant="alert"
            className="mb-4"
          />
        )}

        {/* Import from Load Calculations Banner */}
        {loadCalcSummary && loadCalcSummary.totalCfm > 0 && basicInfo.designCfm === 10000 && (
          <Alert className="mb-4 border-chart-4/30 bg-chart-4/5">
            <Lightbulb className="h-4 w-4 text-chart-4" />
            <AlertTitle>Load Calculation Data Available</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>
                Import {loadCalcSummary.totalCfm.toLocaleString()} CFM from {loadCalcSummary.zoneCount} zone(s)
              </span>
              <Button size="sm" onClick={handleImportFromLoadCalc}>
                Import Design CFM
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Configure Air Handling Unit</CardTitle>
            <CardDescription>
              Define coils, fans, dampers, and control sequences for your AHU
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="coils">Coils</TabsTrigger>
                <TabsTrigger value="fans">Fans</TabsTrigger>
                <TabsTrigger value="filters">Filters</TabsTrigger>
                <TabsTrigger value="controls">Controls</TabsTrigger>
                <TabsTrigger value="schematic">Schematic</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="mt-6">
                <AHUBasicInfoPanel
                  data={basicInfo}
                  onChange={(updates) => setBasicInfo(prev => ({ ...prev, ...updates }))}
                />
              </TabsContent>

              <TabsContent value="coils" className="mt-6">
                <CoilSelectionPanel
                  designCfm={basicInfo.designCfm}
                  coolingCoil={coolingCoil}
                  heatingCoil={heatingCoil}
                  preheatCoil={preheatCoil}
                  onCoolingCoilChange={setCoolingCoil}
                  onHeatingCoilChange={setHeatingCoil}
                  onPreheatCoilChange={setPreheatCoil}
                />
              </TabsContent>

              <TabsContent value="fans" className="mt-6">
                <FanArrayPanel
                  designCfm={basicInfo.designCfm}
                  designStaticPressureIn={basicInfo.designStaticPressureIn}
                  supplyFan={supplyFan}
                  returnFan={returnFan}
                  reliefFan={reliefFan}
                  onSupplyFanChange={setSupplyFan}
                  onReturnFanChange={setReturnFan}
                  onReliefFanChange={setReliefFan}
                />
              </TabsContent>

              <TabsContent value="filters" className="mt-6">
                <FilterDamperPanel
                  designCfm={basicInfo.designCfm}
                  outdoorAirCfm={basicInfo.outdoorAirCfm}
                  returnAirCfm={basicInfo.returnAirCfm}
                  filterConfig={filterConfig}
                  damperConfig={damperConfig}
                  onFilterChange={setFilterConfig}
                  onDamperChange={setDamperConfig}
                />
              </TabsContent>

              <TabsContent value="controls" className="mt-6">
                <ControlSequencePanel
                  config={controlSequence}
                  onChange={setControlSequence}
                />
              </TabsContent>

              <TabsContent value="schematic" className="mt-6">
                <AHUSchematic
                  ahuTag={basicInfo.ahuTag || 'AHU-1'}
                  designCfm={basicInfo.designCfm}
                  outdoorAirCfm={basicInfo.outdoorAirCfm}
                  returnAirCfm={basicInfo.returnAirCfm}
                  coolingCoil={coolingCoil}
                  heatingCoil={heatingCoil}
                  preheatCoil={preheatCoil}
                  supplyFan={supplyFan}
                  returnFan={returnFan}
                  reliefFan={reliefFan}
                  controlStrategy={basicInfo.controlStrategy}
                  hasEconomizer={controlSequence.economizerType !== 'none'}
                  filterConfig={filterConfig}
                />
              </TabsContent>

              <TabsContent value="summary" className="mt-6">
                <AHUSummaryPanel config={summaryConfig} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <SaveAHUDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          initialName={basicInfo.ahuName}
          initialDescription={basicInfo.description}
          isUpdating={!!loadedId}
          onSave={handleSave}
        />
        <LoadAHUDialog
          open={showLoadDialog}
          onOpenChange={setShowLoadDialog}
          configurations={configurations}
          isLoading={isLoadingConfigs}
          onLoad={handleLoadConfig}
          onDelete={handleDelete}
        />

        {/* Template and Revision Dialogs */}
        <RevisionHistoryPanel
          entityType="ahu_configuration"
          entityId={loadedId}
          projectId={projectIdFromUrl || ''}
          onRollback={(data) => {
            toast.success('Rolled back to previous version');
          }}
        />
        <DesignTemplateSelector
          templateType="ahu_configuration"
          onApply={(templateData) => {
            if (templateData.basicInfo) setBasicInfo(templateData.basicInfo as BasicInfo);
            if (templateData.coolingCoil) setCoolingCoil(templateData.coolingCoil as CoolingCoilConfig);
            if (templateData.controlSequence) setControlSequence(templateData.controlSequence as ControlSequenceConfig);
            toast.success('AHU template applied');
          }}
          trigger={<span style={{ display: 'none' }} />}
        />
        <SaveAsTemplateDialog
          templateType="ahu_configuration"
          templateData={{
            basicInfo,
            coolingCoil,
            heatingCoil,
            preheatCoil,
            supplyFan,
            returnFan,
            filterConfig,
            damperConfig,
            controlSequence,
          }}
        />

        {/* Design Alternatives Dialogs */}
        {projectIdFromUrl && (
          <>
            <SaveAsAlternativeDialog
              open={showSaveAlternative}
              onOpenChange={setShowSaveAlternative}
              projectId={projectIdFromUrl}
              entityType="ahu_configuration"
              entityId={loadedId}
              data={{
                basicInfo,
                coolingCoil,
                heatingCoil,
                preheatCoil,
                supplyFan,
                returnFan,
                filterConfig,
                damperConfig,
                controlSequence,
              }}
              suggestedName={`AHU - ${basicInfo.ahuTag || 'New'}`}
            />

            <DesignAlternativesManager
              open={showAlternativesManager}
              onOpenChange={setShowAlternativesManager}
              entityType="ahu_configuration"
              entityId={loadedId}
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
              projectId={projectIdFromUrl || ''}
              entityType="ahu_configuration"
              entityId={loadedId}
              additionalData={{ basicInfo, coolingCoil, heatingCoil, preheatCoil, supplyFan, controlSequence }}
            />
          </>
        )}

        {/* Design Workflow Next Step */}
        <DesignWorkflowNextStep
          currentPath="/design/ahu-configuration"
          projectId={projectIdFromUrl}
          stageComplete={!!loadedId}
        />
      </div>
    </DashboardLayout>
  );
}
