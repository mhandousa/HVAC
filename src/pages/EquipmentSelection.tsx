import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLoadCalculations } from '@/hooks/useLoadCalculations';
import { useEquipmentCatalog, type EquipmentCategory } from '@/hooks/useEquipmentCatalog';
import { useProjects } from '@/hooks/useProjects';
import { useZones } from '@/hooks/useZones';
import { useZoneContext } from '@/hooks/useZoneContext';
import { useKeyboardShortcuts, type ShortcutConfig } from '@/hooks/useKeyboardShortcuts';
import { useSmartDefaults, type BuildingType } from '@/hooks/useSmartDefaults';
import { useSandbox } from '@/contexts/SandboxContext';
import { usePreSaveValidation } from '@/hooks/usePreSaveValidation';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Calculator,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  Star,
  Zap,
  DollarSign,
  Thermometer,
  Package,
  FolderKanban,
  ChevronLeft,
  MapPin,
  History,
  FileText as TemplateIcon,
} from 'lucide-react';
import { SaveEquipmentSelectionDialog } from '@/components/design/SaveEquipmentSelectionDialog';
import { SavedEquipmentSelections } from '@/components/design/SavedEquipmentSelections';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { DataFlowImportHandler } from '@/components/design/DataFlowImportHandler';
import { DesignWarningsBanner } from '@/components/design/DesignWarningsBanner';
import { SyncStatusBadge, determineSyncStatus } from '@/components/design/SyncStatusBadge';
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
import { SaveAsAlternativeDialog } from '@/components/design/SaveAsAlternativeDialog';
import { DesignAlternativesManager } from '@/components/design/DesignAlternativesManager';
import { AlternativeComparisonView } from '@/components/design/AlternativeComparisonView';
import { PreSaveValidationAlert } from '@/components/design/PreSaveValidationAlert';
import { DesignAlternative } from '@/hooks/useDesignAlternatives';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GitBranch } from 'lucide-react';
import { toast } from 'sonner';

// Comparison metrics for equipment selection scenarios
const EQUIPMENT_METRICS: ComparisonMetric[] = [
  { key: 'totalCapacity', label: 'Total Capacity (Tons)', format: 'number' },
  { key: 'equipmentCost', label: 'Equipment Cost (SAR)', format: 'currency' },
  { key: 'lifecycleCost', label: 'Lifecycle Cost (SAR)', format: 'currency' },
  { key: 'efficiency', label: 'Efficiency (SEER/EER)', format: 'number' },
];

const categoryLabels: Record<string, string> = {
  chiller: 'Chillers',
  vrf: 'VRF Systems',
  package_unit: 'Package Units',
  split_system: 'Split Systems',
  mini_split: 'Mini Splits',
  ahu: 'Air Handling Units',
};

export default function EquipmentSelection() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Zone context persistence
  const { 
    projectId: storedProjectId, 
    zoneId: storedZoneId, 
    setContext 
  } = useZoneContext();
  
  const projectIdFromUrl = searchParams.get('project') || storedProjectId;
  
  const [step, setStep] = useState(1);
  const [selectedCalculation, setSelectedCalculation] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory | ''>('');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>(storedZoneId || 'all');
  const [selectionTimestamp, setSelectionTimestamp] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Template and Revision state
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [currentSelectionId, setCurrentSelectionId] = useState<string | null>(null);
  
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
    entityType: 'equipment_selection',
    entityId: currentSelectionId || null,
    currentRevisionNumber: 0,
  });

  // Pre-Save Validation & Stage Locking
  const { canSave, blockers, warnings, isLocked } = useToolValidation(
    projectIdFromUrl || null,
    'equipment-selection',
    { checkStageLock: true }
  );

  const handleReloadLatest = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['equipment_selections'] });
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
    // Apply safety factor for equipment sizing
    if (values.safety_factor && currentCalc) {
      toast.info(`Applied ${(values.safety_factor as number * 100).toFixed(0)}% sizing safety factor`);
    }
    toast.success('Smart defaults applied');
  }, []);

  // Phase 4 UX: Sandbox Save Handler
  const handleSandboxSave = useCallback((data: Record<string, unknown>) => {
    if (data.selectedEquipment) setSelectedEquipment(data.selectedEquipment as string[]);
    if (data.selectedCategory) setSelectedCategory(data.selectedCategory as EquipmentCategory | '');
    toast.success('Sandbox changes applied');
  }, []);

  // Design Alternatives handlers
  const handleLoadAlternative = useCallback((data: Record<string, unknown>) => {
    if (data.selectedEquipment) setSelectedEquipment(data.selectedEquipment as string[]);
    if (data.selectedCategory) setSelectedCategory(data.selectedCategory as EquipmentCategory | '');
    if (data.selectedCalculation) setSelectedCalculation(data.selectedCalculation as string);
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
      key: 'c',
      description: 'Toggle compare mode',
      action: () => setCompareMode(prev => !prev),
      category: 'actions',
      enabled: selectedEquipment.length >= 2,
    },
    {
      key: 'n',
      description: 'Next workflow step',
      action: () => navigate('/design/ahu-configuration'),
      category: 'navigation',
    },
    {
      key: 'p',
      description: 'Previous workflow step',
      action: () => navigate('/design/load-calculation'),
      category: 'navigation',
    },
    {
      key: '1',
      description: 'Step 1: Select Load',
      action: () => setStep(1),
      category: 'navigation',
    },
    {
      key: '2',
      description: 'Step 2: Choose Type',
      action: () => selectedCalculation && setStep(2),
      category: 'navigation',
      enabled: !!selectedCalculation,
    },
    {
      key: '3',
      description: 'Step 3: Compare Options',
      action: () => selectedCategory && setStep(3),
      category: 'navigation',
      enabled: !!selectedCategory,
    },
    {
      key: '4',
      description: 'Step 4: Review',
      action: () => selectedEquipment.length > 0 && setStep(4),
      category: 'navigation',
      enabled: selectedEquipment.length > 0,
    },
  ], [selectedEquipment.length, selectedCalculation, selectedCategory, navigate]);

  useKeyboardShortcuts(shortcuts);

  // currentCalc is defined below after calculations hook

  const { data: calculations, isLoading: calcsLoading } = useLoadCalculations(projectIdFromUrl || undefined);
  const { data: allEquipment, isLoading: equipLoading } = useEquipmentCatalog();
  const { data: projects } = useProjects();
  const { data: zones } = useZones(projectIdFromUrl || undefined);

  const linkedProject = projects?.find(p => p.id === projectIdFromUrl);

  // Sync zone context when selections change
  useEffect(() => {
    if (projectIdFromUrl || (selectedZoneFilter && selectedZoneFilter !== 'all')) {
      setContext(projectIdFromUrl || null, selectedZoneFilter !== 'all' ? selectedZoneFilter : null, { replace: true });
    }
  }, [projectIdFromUrl, selectedZoneFilter, setContext]);

  // Filter calculations by zone
  const filteredCalculations = useMemo(() => {
    if (!calculations) return [];
    if (selectedZoneFilter === 'all') return calculations;
    return calculations.filter(c => c.zone_id === selectedZoneFilter);
  }, [calculations, selectedZoneFilter]);

  const currentCalc = calculations?.find(c => c.id === selectedCalculation);
  const requiredTons = currentCalc?.cooling_load_tons || 0;

  // Track when a calculation is selected for sync status
  useEffect(() => {
    if (selectedCalculation && currentCalc) {
      setSelectionTimestamp(new Date().toISOString());
    }
  }, [selectedCalculation]);

  // Handle resync from load calculation
  const handleResyncFromLoad = async () => {
    setIsSyncing(true);
    // Refetch is handled by React Query - just update timestamp
    await new Promise(resolve => setTimeout(resolve, 500));
    setSelectionTimestamp(new Date().toISOString());
    setIsSyncing(false);
    toast.success('Synced with latest load calculation data');
  };

  // Filter equipment based on requirements
  const matchingEquipment = useMemo(() => {
    if (!allEquipment || !requiredTons || !selectedCategory) return [];
    
    return allEquipment
      .filter(e => {
        if (e.equipment_category !== selectedCategory) return false;
        if (!e.cooling_capacity_tons) return false;
        // Match equipment within 80-120% of required capacity
        const ratio = e.cooling_capacity_tons / requiredTons;
        return ratio >= 0.8 && ratio <= 1.5;
      })
      .sort((a, b) => {
        // Sort by efficiency (SEER or EER)
        const effA = a.seer || a.eer || 0;
        const effB = b.seer || b.eer || 0;
        return effB - effA;
      });
  }, [allEquipment, requiredTons, selectedCategory]);

  // Calculate lifecycle costs
  const calculateLifecycleCost = (equipment: typeof matchingEquipment[0]) => {
    const purchaseCost = equipment.list_price_sar || 0;
    const annualHours = 3000; // Operating hours per year
    const electricityRate = 0.18; // SAR per kWh
    const years = 15;
    
    const annualEnergy = (equipment.power_input_kw || 0) * annualHours;
    const annualCost = annualEnergy * electricityRate;
    const totalEnergyCost = annualCost * years;
    
    return {
      purchase: purchaseCost,
      energy: Math.round(totalEnergyCost),
      total: Math.round(purchaseCost + totalEnergyCost),
      annualEnergy: Math.round(annualEnergy),
    };
  };

  const selectedItems = matchingEquipment.filter(e => selectedEquipment.includes(e.id));

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const breadcrumbItems = useMemo(() => {
    const items = [];
    if (linkedProject) {
      items.push({ label: linkedProject.name, href: `/projects/${linkedProject.id}` });
    }
    items.push(
      { label: 'Design Tools', href: '/design' },
      { label: 'Equipment' },
      { label: 'Equipment Selection' }
    );
    return items;
  }, [linkedProject]);

  const handleBack = () => {
    if (projectIdFromUrl) {
      navigate(`/projects/${projectIdFromUrl}`);
    } else {
      navigate('/design');
    }
  };

  // Auth redirect - MUST come after all hooks
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

  // Loading state - MUST come after all hooks
  if (authLoading || calcsLoading || equipLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Design Warnings Banner */}
        <DesignWarningsBanner
          projectId={projectIdFromUrl}
          zoneId={currentCalc?.zone_id}
          currentTool="equipment-selection"
        />

        {/* Stage Locking & Pre-Save Validation Header */}
        <ToolPageHeader
          toolType="equipment-selection"
          toolName="Equipment Selection"
          projectId={projectIdFromUrl || null}
          showLockButton={!!projectIdFromUrl}
          showValidation={!!projectIdFromUrl}
        />

        {/* Cross-Tool Validation Alert */}
        <CrossToolValidationAlert
          projectId={projectIdFromUrl}
          currentTool="equipment-selection"
          variant="alert"
          className="mb-4"
        />

        {/* Data Flow Import Handler */}
        <DataFlowImportHandler
          projectId={projectIdFromUrl}
          currentTool="equipment-selection"
          layout="grid"
          onImportLoadData={(data) => {
            if (!selectedCalculation && data.items.length > 0) {
              setSelectedCalculation(data.items[0].id);
            }
            toast.success(`Found ${data.zoneCount} zones with ${data.totalCoolingTons.toFixed(1)} tons total`);
          }}
        />

        <Breadcrumbs items={breadcrumbItems} className="mb-2" />

        {/* Project Context Banner */}
        {linkedProject && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <FolderKanban className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">Linked to Project</p>
              <Link 
                to={`/projects/${linkedProject.id}`}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {linkedProject.name}
              </Link>
            </div>
            <Badge variant="outline">{linkedProject.status}</Badge>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Equipment Selection Wizard</h1>
            <p className="text-muted-foreground">
              Match your load calculations to the best equipment options
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SandboxModeToggle
              currentData={{ selectedCategory, selectedEquipment, selectedCalculation }}
              onExitWithSave={handleSandboxSave}
            />
            <ScenarioManager compact onPromoteToAlternative={handlePromoteScenarioToAlternative} />
            <Button variant="outline" size="sm" onClick={() => setShowTemplateSelector(true)}>
              <TemplateIcon className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowRevisionHistory(true)} disabled={!currentSelectionId}>
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
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
              entityType="equipment_selection"
              entityId={currentSelectionId}
              projectId={projectIdFromUrl || undefined}
            />
            <Button onClick={handleBack} variant="outline" size="sm">
              <ChevronLeft className="w-4 h-4 mr-1" />
              {projectIdFromUrl ? 'Back to Project' : 'Back'}
            </Button>
          </div>
        </div>

        {/* Conflict Warning */}
        {hasConflict && (
          <EditConflictWarning
            entityType="equipment_selection"
            entityId={currentSelectionId}
            currentRevisionNumber={0}
            onReload={handleReloadLatest}
            onViewDiff={handleViewDiff}
            onForceSave={handleForceSave}
          />
        )}

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className={step >= 1 ? 'text-primary font-medium' : 'text-muted-foreground'}>
              1. Select Load
            </span>
            <span className={step >= 2 ? 'text-primary font-medium' : 'text-muted-foreground'}>
              2. Choose Type
            </span>
            <span className={step >= 3 ? 'text-primary font-medium' : 'text-muted-foreground'}>
              3. Compare Options
            </span>
            <span className={step >= 4 ? 'text-primary font-medium' : 'text-muted-foreground'}>
              4. Review
            </span>
          </div>
          <Progress value={(step / 4) * 100} className="h-2" />
        </div>

        {/* Saved Selections */}
        {step === 1 && <SavedEquipmentSelections />}

        {/* Step 1: Select Load Calculation */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Select Load Calculation
              </CardTitle>
              <CardDescription>
                Choose a saved load calculation to base equipment selection on
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Zone Filter */}
              {zones && zones.length > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Filter by Zone</p>
                    <p className="text-xs text-muted-foreground">Show calculations for a specific zone</p>
                  </div>
                  <Select value={selectedZoneFilter} onValueChange={setSelectedZoneFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="All zones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All zones</SelectItem>
                      {zones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {filteredCalculations && filteredCalculations.length > 0 ? (
                <div className="grid gap-3">
                  {filteredCalculations.map((calc) => {
                    const calcZone = zones?.find(z => z.id === calc.zone_id);
                    return (
                      <button
                        key={calc.id}
                        onClick={() => setSelectedCalculation(calc.id)}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                          selectedCalculation === calc.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{calc.calculation_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {calc.building_type} • {calc.area_sqft?.toLocaleString()} sq ft
                              {calcZone && (
                                <span className="ml-2 inline-flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {calcZone.name}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{calc.cooling_load_tons} TR</p>
                            <p className="text-xs text-muted-foreground">Cooling Load</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Calculator className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {selectedZoneFilter !== 'all' 
                      ? 'No load calculations found for this zone' 
                      : 'No saved load calculations found'}
                  </p>
                  <Button onClick={() => navigate('/design/load-calculation')}>
                    Create Load Calculation
                  </Button>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!selectedCalculation}
                  className="gap-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Choose Equipment Type */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Choose Equipment Type
                    {currentCalc && selectionTimestamp && (
                      <SyncStatusBadge
                        status={determineSyncStatus(currentCalc.updated_at, selectionTimestamp)}
                        sourceLabel="load calculation"
                        sourceUpdatedAt={currentCalc.updated_at}
                        lastSyncedAt={selectionTimestamp}
                        onSync={handleResyncFromLoad}
                        isSyncing={isSyncing}
                      />
                    )}
                  </CardTitle>
                  <CardDescription>
                    Required capacity: <span className="font-bold text-primary">{requiredTons} tons</span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(categoryLabels).map(([key, label]) => {
                  const count = allEquipment?.filter(e => 
                    e.equipment_category === key && 
                    e.cooling_capacity_tons &&
                    e.cooling_capacity_tons >= requiredTons * 0.8 &&
                    e.cooling_capacity_tons <= requiredTons * 1.5
                  ).length || 0;

                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key as EquipmentCategory)}
                      disabled={count === 0}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        selectedCategory === key
                          ? 'border-primary bg-primary/5'
                          : count > 0
                          ? 'border-border hover:border-primary/50'
                          : 'border-border opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <p className="font-medium">{label}</p>
                      <p className="text-sm text-muted-foreground">
                        {count} options available
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!selectedCategory}
                  className="gap-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Compare Options */}
        {step === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Compare Equipment Options</CardTitle>
                    <CardDescription>
                      {matchingEquipment.length} options for {requiredTons} tons capacity
                    </CardDescription>
                  </div>
                  <Tabs value={compareMode ? 'compare' : 'list'} onValueChange={(v) => setCompareMode(v === 'compare')}>
                    <TabsList>
                      <TabsTrigger value="list">List</TabsTrigger>
                      <TabsTrigger value="compare" disabled={selectedEquipment.length < 2}>
                        Compare ({selectedEquipment.length})
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                {!compareMode ? (
                  <div className="space-y-3">
                    {matchingEquipment.map((equip) => {
                      const lifecycle = calculateLifecycleCost(equip);
                      const isSelected = selectedEquipment.includes(equip.id);
                      
                      return (
                        <div
                          key={equip.id}
                          className={`p-4 rounded-lg border transition-all ${
                            isSelected ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{equip.manufacturer} {equip.model_number}</p>
                                {equip.saso_certified && (
                                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                                    SASO
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {equip.equipment_subcategory}
                              </p>
                              
                              <div className="grid grid-cols-4 gap-4 mt-3">
                                <div>
                                  <p className="text-xs text-muted-foreground">Capacity</p>
                                  <p className="font-mono font-medium">{equip.cooling_capacity_tons} TR</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Efficiency</p>
                                  <p className="font-mono font-medium">
                                    {equip.seer ? `SEER ${equip.seer}` : equip.eer ? `EER ${equip.eer}` : '-'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Power</p>
                                  <p className="font-mono font-medium">{equip.power_input_kw} kW</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Rating</p>
                                  <div className="flex items-center gap-0.5">
                                    {equip.energy_rating_stars ? (
                                      Array.from({ length: equip.energy_rating_stars }).map((_, i) => (
                                        <Star key={i} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                      ))
                                    ) : '-'}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right space-y-2">
                              <p className="text-xl font-bold">{formatPrice(lifecycle.purchase)}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatPrice(lifecycle.total)} lifecycle (15yr)
                              </p>
                              <Button
                                size="sm"
                                variant={isSelected ? 'default' : 'outline'}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedEquipment(prev => prev.filter(id => id !== equip.id));
                                  } else {
                                    setSelectedEquipment(prev => [...prev, equip.id]);
                                  }
                                }}
                              >
                                {isSelected ? <Check className="w-4 h-4 mr-1" /> : null}
                                {isSelected ? 'Selected' : 'Select'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2">Specification</th>
                          {selectedItems.map((item) => (
                            <th key={item.id} className="text-center py-3 px-4 min-w-[180px]">
                              <p className="font-medium">{item.manufacturer}</p>
                              <p className="text-sm text-muted-foreground font-normal">{item.model_number}</p>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-3 px-2 text-muted-foreground">Capacity (TR)</td>
                          {selectedItems.map((item) => (
                            <td key={item.id} className="text-center py-3 px-4 font-mono">
                              {item.cooling_capacity_tons}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-2 text-muted-foreground">SEER</td>
                          {selectedItems.map((item) => (
                            <td key={item.id} className="text-center py-3 px-4 font-mono">
                              {item.seer || '-'}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-2 text-muted-foreground">EER</td>
                          {selectedItems.map((item) => (
                            <td key={item.id} className="text-center py-3 px-4 font-mono">
                              {item.eer || '-'}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-2 text-muted-foreground">Power Input (kW)</td>
                          {selectedItems.map((item) => (
                            <td key={item.id} className="text-center py-3 px-4 font-mono">
                              {item.power_input_kw}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-2 text-muted-foreground">Refrigerant</td>
                          {selectedItems.map((item) => (
                            <td key={item.id} className="text-center py-3 px-4">
                              {item.refrigerant_type || '-'}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-2 text-muted-foreground">Purchase Price</td>
                          {selectedItems.map((item) => (
                            <td key={item.id} className="text-center py-3 px-4 font-mono font-bold">
                              {formatPrice(item.list_price_sar || 0)}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-2 text-muted-foreground">Annual Energy (kWh)</td>
                          {selectedItems.map((item) => {
                            const lifecycle = calculateLifecycleCost(item);
                            return (
                              <td key={item.id} className="text-center py-3 px-4 font-mono">
                                {lifecycle.annualEnergy.toLocaleString()}
                              </td>
                            );
                          })}
                        </tr>
                        <tr className="border-b bg-muted/50">
                          <td className="py-3 px-2 font-medium">15-Year Lifecycle Cost</td>
                          {selectedItems.map((item) => {
                            const lifecycle = calculateLifecycleCost(item);
                            return (
                              <td key={item.id} className="text-center py-3 px-4 font-mono font-bold text-primary">
                                {formatPrice(lifecycle.total)}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                disabled={selectedEquipment.length === 0}
                className="gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  Selection Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-sm text-muted-foreground mb-1">Load Calculation</p>
                  <p className="font-medium">{currentCalc?.calculation_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentCalc?.cooling_load_tons} tons cooling • {currentCalc?.area_sqft?.toLocaleString()} sq ft
                  </p>
                </div>

                <div>
                  <p className="font-medium mb-3">Selected Equipment ({selectedItems.length})</p>
                  <div className="space-y-3">
                    {selectedItems.map((item) => {
                      const lifecycle = calculateLifecycleCost(item);
                      return (
                        <div key={item.id} className="p-4 rounded-lg border bg-primary/5 border-primary/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{item.manufacturer} {item.model_number}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.cooling_capacity_tons} TR • {item.seer ? `SEER ${item.seer}` : `EER ${item.eer}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{formatPrice(item.list_price_sar || 0)}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatPrice(lifecycle.total)} lifecycle
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-8 h-8 text-green-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Total Purchase</p>
                          <p className="text-xl font-bold">
                            {formatPrice(selectedItems.reduce((sum, i) => sum + (i.list_price_sar || 0), 0))}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Zap className="w-8 h-8 text-yellow-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Total Power</p>
                          <p className="text-xl font-bold">
                            {selectedItems.reduce((sum, i) => sum + (i.power_input_kw || 0), 0).toFixed(1)} kW
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Thermometer className="w-8 h-8 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Total Capacity</p>
                          <p className="text-xl font-bold">
                            {selectedItems.reduce((sum, i) => sum + (i.cooling_capacity_tons || 0), 0)} TR
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/design/equipment-catalog')}>
                  View Full Catalog
                </Button>
                <SaveEquipmentSelectionDialog
                  selectedItems={selectedItems}
                  requiredCapacity={requiredTons}
                  equipmentCategory={selectedCategory}
                  loadCalculationId={selectedCalculation}
                  zoneId={currentCalc?.zone_id || undefined}
                  lifecycleCosts={selectedItems.map(item => calculateLifecycleCost(item))}
                  onSave={() => toast.success('Selection saved! You can view it in your saved selections.')}
                />
                <Button onClick={() => navigate('/equipment')} className="gap-2">
                  Add to Project
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Next Steps Card */}
            <Card className="mt-6 border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  Continue Your Design
                </CardTitle>
                <CardDescription>
                  Equipment selected! Here are suggested next steps in the design workflow.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(projectIdFromUrl 
                      ? `/design/duct-designer?project=${projectIdFromUrl}` 
                      : '/design/duct-designer'
                    )}
                    className="gap-2"
                  >
                    Design Duct System
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(projectIdFromUrl 
                      ? `/design/pipe-designer?project=${projectIdFromUrl}` 
                      : '/design/pipe-designer'
                    )}
                    className="gap-2"
                  >
                    Design Pipe System
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(projectIdFromUrl 
                      ? `/design/ashrae-compliance?project=${projectIdFromUrl}` 
                      : '/design/ashrae-compliance'
                    )}
                    className="gap-2"
                  >
                    Run Compliance Check
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                  {projectIdFromUrl && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/design/completeness?project=${projectIdFromUrl}`)}
                      className="gap-2"
                    >
                      View Design Completeness
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Design Workflow Next Step */}
        <DesignWorkflowNextStep
          currentPath="/design/equipment-selection"
          projectId={projectIdFromUrl}
          zoneId={currentCalc?.zone_id}
          stageComplete={selectedEquipment.length > 0}
        />
        
        {/* Template and Revision Dialogs */}
        <RevisionHistoryPanel
          entityType="equipment_selection"
          entityId={currentSelectionId || undefined}
          projectId={projectIdFromUrl || ''}
          onRollback={(data) => {
            toast.success('Rolled back to previous version');
          }}
        />
        <DesignTemplateSelector
          templateType="equipment_selection"
          onApply={(templateData) => {
            if (templateData.preferredCategory) {
              setSelectedCategory(templateData.preferredCategory as EquipmentCategory);
            }
            toast.success('Template preferences applied');
          }}
          trigger={<span style={{ display: 'none' }} />}
        />
        <SaveAsTemplateDialog
          templateType="equipment_selection"
          templateData={{
            selectedCategory,
            selectedEquipment,
          }}
        />

        {/* Design Alternatives Dialogs */}
        {projectIdFromUrl && (
          <>
            <SaveAsAlternativeDialog
              open={showSaveAlternative}
              onOpenChange={setShowSaveAlternative}
              projectId={projectIdFromUrl}
              entityType="equipment_selection"
              entityId={currentSelectionId || undefined}
              data={{ selectedCategory, selectedEquipment, selectedCalculation }}
              suggestedName={`Equipment - ${selectedItems.length} items`}
            />

            <DesignAlternativesManager
              open={showAlternativesManager}
              onOpenChange={setShowAlternativesManager}
              entityType="equipment_selection"
              entityId={currentSelectionId || undefined}
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
              projectId={projectIdFromUrl}
              entityType="equipment_selection"
              entityId={currentSelectionId || undefined}
              additionalData={{ selectedCategory, selectedEquipment, selectedCalculation }}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
