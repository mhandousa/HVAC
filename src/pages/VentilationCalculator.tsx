import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { useZones } from "@/hooks/useZones";
import { useLoadCalculations } from "@/hooks/useLoadCalculations";
import { useVentilationCalculator, ZoneVentilationInput } from "@/hooks/useVentilationCalculator";
import { useVentilationExport } from "@/hooks/useVentilationExport";
import { useSavedVentilationCalcs, VentilationCalculationWithZones } from "@/hooks/useSavedVentilationCalcs";
import { getSpaceTypesByCategory, ZONE_TYPE_TO_ASHRAE_MAP, DIVERSITY_FACTORS } from "@/lib/ashrae-62-1-data";
import { useZoneContext } from "@/hooks/useZoneContext";
import { useKeyboardShortcuts, type ShortcutConfig } from '@/hooks/useKeyboardShortcuts';
import { useSmartDefaults, type BuildingType } from '@/hooks/useSmartDefaults';
import { useSandbox } from '@/contexts/SandboxContext';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { SaveVentilationDialog } from "@/components/design/SaveVentilationDialog";
import { SmartDefaultsBanner } from '@/components/design/SmartDefaultsBanner';
import { SandboxModeToggle, SandboxModeBanner } from '@/components/design/SandboxModeToggle';
import { ScenarioManager } from '@/components/design/ScenarioManager';
import { ScenarioComparisonView, type ComparisonMetric } from '@/components/design/ScenarioComparisonView';
import { PromoteScenarioDialog } from '@/components/design/PromoteScenarioDialog';
import type { Scenario } from '@/contexts/SandboxContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  Wind, 
  Plus, 
  Trash2, 
  Download, 
  FileText, 
  FileSpreadsheet,
  Import,
  Calculator,
  Info,
  Users,
  Square,
  ArrowRight,
  RefreshCw,
  Activity,
  Save,
  FolderOpen,
  ChevronLeft,
  History,
  FileText as TemplateIcon,
} from "lucide-react";
import { DCVDashboard } from "@/components/ventilation/DCVDashboard";
import { DesignWorkflowNextStep } from "@/components/design/DesignWorkflowNextStep";
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { RevisionHistoryPanel } from '@/components/design/RevisionHistoryPanel';
import { DesignTemplateSelector } from '@/components/design/DesignTemplateSelector';
import { SaveAsTemplateDialog } from '@/components/design/SaveAsTemplateDialog';
import { CrossToolValidationAlert } from '@/components/design/CrossToolValidationAlert';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { useConflictDetection } from '@/hooks/useConflictDetection';
import { SaveAsAlternativeDialog } from '@/components/design/SaveAsAlternativeDialog';
import { DesignAlternativesManager } from '@/components/design/DesignAlternativesManager';
import { AlternativeComparisonView } from '@/components/design/AlternativeComparisonView';
import { DesignAlternative } from '@/hooks/useDesignAlternatives';
import { GitBranch } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

// Comparison metrics for ventilation scenarios
const VENTILATION_METRICS: ComparisonMetric[] = [
  { key: 'total_oa_cfm', label: 'Total OA CFM', format: 'number' },
  { key: 'diversity_factor', label: 'Diversity Factor', format: 'percentage' },
  { key: 'system_vot', label: 'System Vot (CFM)', format: 'number' },
  { key: 'zone_count', label: 'Zone Count', format: 'number' },
];

export default function VentilationCalculator() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { data: projects } = useProjects();
  
  // Zone context persistence
  const { 
    projectId: storedProjectId, 
    zoneId: storedZoneId, 
    setContext 
  } = useZoneContext();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    searchParams.get("project") || storedProjectId
  );
  const { data: projectZones } = useZones(selectedProjectId || undefined);
  const { data: loadCalculations } = useLoadCalculations(selectedProjectId || undefined);

  const {
    zones,
    addZone,
    updateZone,
    removeZone,
    clearZones,
    setZones,
    diversityFactor,
    setDiversityFactor,
    supplyAirCfm,
    setSupplyAirCfm,
    zoneResults,
    systemResult,
    spaceTypes,
  } = useVentilationCalculator();

  const { exportToPdf, exportToCsv } = useVentilationExport();
  
  // Save/Load state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const { calculations: savedCalculations, isLoading: savedLoading } = useSavedVentilationCalcs(selectedProjectId || undefined);

  const [activeTab, setActiveTab] = useState("single");
  const spaceTypesByCategory = getSpaceTypesByCategory();
  
  // Template and Revision state
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [currentCalculationId, setCurrentCalculationId] = useState<string | null>(null);
  
  // Design Alternatives state
  const [showSaveAlternative, setShowSaveAlternative] = useState(false);
  const [showAlternativesManager, setShowAlternativesManager] = useState(false);
  const [showAlternativeComparison, setShowAlternativeComparison] = useState(false);
  const [alternativesToCompare, setAlternativesToCompare] = useState<DesignAlternative[]>([]);
  
  // Scenario-to-Alternative Promotion state
  const [showPromoteScenario, setShowPromoteScenario] = useState(false);
  const [scenarioToPromote, setScenarioToPromote] = useState<Scenario | null>(null);
  
  // Phase 5.3: Concurrent Editing
  const queryClient = useQueryClient();
  const { hasConflict, latestRevision, clearConflict } = useConflictDetection({
    entityType: 'ventilation',
    entityId: currentCalculationId || null,
    currentRevisionNumber: 0,
  });

  // Stage lock and pre-save validation via unified hook
  const { canSave, blockers, warnings, isLocked } = useToolValidation(
    selectedProjectId,
    'ventilation',
    { checkStageLock: true }
  );

  const handleReloadLatest = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['ventilation-calculations'] });
    clearConflict();
    toast.info('Reloaded latest version');
  }, [queryClient, clearConflict]);

  const handleViewDiff = useCallback(() => {
    setShowRevisionHistory(true);
  }, []);

  const handleForceSave = useCallback(() => {
    clearConflict();
  }, [clearConflict]);
  
  // Get preselected zone from URL params and track linked zone for saving
  const preselectedZoneId = searchParams.get("zone") || storedZoneId;
  const [linkedZoneId, setLinkedZoneId] = useState<string | null>(preselectedZoneId);

  // Phase 4 UX: Smart Defaults
  const selectedProject = projects?.find(p => p.id === selectedProjectId);
  const { defaults, summary, hasContext } = useSmartDefaults({
    buildingType: undefined, // Will be inferred from project name
    spaceType: zones[0]?.spaceTypeId,
  });

  // Phase 4 UX: Sandbox Mode
  const { state: sandboxState, updateScenario, setScenarioResults, getMergedData } = useSandbox();

  // Phase 4 UX: Smart Defaults Handler
  const handleApplySmartDefaults = useCallback((values: Record<string, number | string>) => {
    // Update zone occupancy based on occupant_density
    if (values.occupant_density && zones.length > 0) {
      const density = values.occupant_density as number;
      zones.forEach((zone) => {
        const calculatedOccupancy = Math.max(1, Math.round(zone.floorArea / density));
        updateZone(zone.id, { occupancy: calculatedOccupancy, useDefaultOccupancy: false });
      });
    }
    toast.success('Smart defaults applied');
  }, [zones, updateZone]);

  // Phase 4 UX: Sandbox Save Handler
  const handleSandboxSave = useCallback((data: Record<string, unknown>) => {
    if (data.diversityFactor) setDiversityFactor(data.diversityFactor as number);
    if (data.supplyAirCfm) setSupplyAirCfm(data.supplyAirCfm as number);
    toast.success('Sandbox changes applied');
  }, [setDiversityFactor, setSupplyAirCfm]);

  // Design Alternatives handlers
  const handleLoadAlternative = useCallback((data: Record<string, unknown>) => {
    if (data.zones) setZones(data.zones as ZoneVentilationInput[]);
    if (data.diversityFactor) setDiversityFactor(data.diversityFactor as number);
    if (data.supplyAirCfm) setSupplyAirCfm(data.supplyAirCfm as number);
    setShowAlternativesManager(false);
    toast.success('Alternative loaded');
  }, [setZones, setDiversityFactor, setSupplyAirCfm]);

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
      description: 'Save ventilation calculation',
      action: () => zoneResults.length > 0 && setSaveDialogOpen(true),
      category: 'actions',
      enabled: zoneResults.length > 0,
    },
    {
      key: 'n',
      description: 'Next workflow step',
      action: () => navigate('/design/psychrometric'),
      category: 'navigation',
    },
    {
      key: 'p',
      description: 'Previous workflow step',
      action: () => navigate('/design/load-calculation'),
      category: 'navigation',
    },
    {
      key: 'a',
      description: 'Add new zone',
      action: () => addZone(),
      category: 'actions',
    },
  ], [zoneResults.length, navigate, addZone]);

  useKeyboardShortcuts(shortcuts);

  // Sync zone context when selections change
  useEffect(() => {
    if (selectedProjectId || linkedZoneId) {
      setContext(selectedProjectId, linkedZoneId, { replace: true });
    }
  }, [selectedProjectId, linkedZoneId, setContext]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Update URL when project changes
  useEffect(() => {
    if (selectedProjectId) {
      setSearchParams({ project: selectedProjectId });
    } else {
      setSearchParams({});
    }
  }, [selectedProjectId, setSearchParams]);

  // Initialize with one zone
  useEffect(() => {
    if (zones.length === 0) {
      addZone();
    }
  }, []);
  
  // Handle preselected zone from URL
  useEffect(() => {
    if (preselectedZoneId && projectZones && projectZones.length > 0) {
      const zone = projectZones.find(z => z.id === preselectedZoneId);
      if (zone) {
        clearZones();
        setLinkedZoneId(preselectedZoneId); // Track the linked zone for saving
        const ashraeSpaceTypeId = ZONE_TYPE_TO_ASHRAE_MAP[zone.zone_type || 'other'] || 'office_space';
        addZone({
          name: zone.name,
          spaceTypeId: ashraeSpaceTypeId,
          floorArea: (zone.area_sqm || 93) * 10.764,
          occupancy: zone.occupancy_capacity || 10,
          useDefaultOccupancy: !zone.occupancy_capacity,
          supplyLocation: 'ceiling',
          returnLocation: 'ceiling',
          operatingMode: 'cooling',
        });
        setActiveTab('single');
        toast.info(`Pre-loaded zone: ${zone.name}`);
      }
    }
  }, [preselectedZoneId, projectZones]);
  
  // Load a saved calculation
  const handleLoadCalculation = (calc: VentilationCalculationWithZones) => {
    clearZones();
    setDiversityFactor(calc.diversity_factor || 0.85);
    setSupplyAirCfm(calc.supply_air_cfm || undefined);
    setCurrentCalculationId(calc.id); // Track for revision history
    
    // Add zones from saved zone results
    if (calc.ventilation_zone_results && calc.ventilation_zone_results.length > 0) {
      calc.ventilation_zone_results.forEach((zr) => {
        addZone({
          name: zr.zone_name,
          spaceTypeId: zr.space_type_id || 'office_space',
          floorArea: zr.floor_area_sqft || 1000,
          occupancy: zr.occupancy || 5,
          useDefaultOccupancy: false,
          supplyLocation: (zr.supply_location as 'ceiling' | 'floor') || 'ceiling',
          returnLocation: (zr.return_location as 'ceiling' | 'floor') || 'ceiling',
          operatingMode: (zr.operating_mode as 'heating' | 'cooling') || 'cooling',
        });
      });
      setActiveTab(calc.ventilation_zone_results.length > 1 ? 'multiple' : 'single');
    } else {
      addZone(); // Add at least one zone
    }
    
    toast.success(`Loaded: ${calc.calculation_name}`);
  };

  // Handle template apply
  const handleApplyTemplate = (templateData: Record<string, unknown>) => {
    if (templateData.diversityFactor) setDiversityFactor(templateData.diversityFactor as number);
    if (templateData.supplyAirCfm) setSupplyAirCfm(templateData.supplyAirCfm as number);
    toast.success('Template applied');
  };

  const handleImportFromProject = () => {
    if (!projectZones || projectZones.length === 0) {
      toast.error("No zones found in selected project");
      return;
    }

    clearZones();
    
    projectZones.forEach((zone) => {
      const ashraeSpaceTypeId = ZONE_TYPE_TO_ASHRAE_MAP[zone.zone_type || 'other'] || 'office_space';
      addZone({
        name: zone.name,
        spaceTypeId: ashraeSpaceTypeId,
        floorArea: (zone.area_sqm || 93) * 10.764, // Convert m² to ft²
        occupancy: zone.occupancy_capacity || 10,
        useDefaultOccupancy: !zone.occupancy_capacity,
        supplyLocation: 'ceiling',
        returnLocation: 'ceiling',
        operatingMode: 'cooling',
      });
    });

    toast.success(`Imported ${projectZones.length} zones from project`);
    setActiveTab("multiple");
  };

  const handleExportPdf = () => {
    const project = projects?.find(p => p.id === selectedProjectId);
    exportToPdf(systemResult, project?.name);
    toast.success("PDF report downloaded");
  };

  const handleExportCsv = () => {
    const project = projects?.find(p => p.id === selectedProjectId);
    exportToCsv(systemResult, project?.name);
    toast.success("CSV data downloaded");
  };

  // selectedProject already defined in Phase 4 hooks section

  const breadcrumbItems = useMemo(() => {
    const items = [];
    if (selectedProject) {
      items.push({ label: selectedProject.name, href: `/projects/${selectedProject.id}` });
    }
    items.push(
      { label: 'Design Tools', href: '/design' },
      { label: 'Core Calculations' },
      { label: 'Ventilation Calculator' }
    );
    return items;
  }, [selectedProject]);

  const handleBack = () => {
    if (selectedProjectId) {
      navigate(`/projects/${selectedProjectId}`);
    } else {
      navigate('/design');
    }
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <Breadcrumbs items={breadcrumbItems} className="mb-2" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Wind className="h-6 w-6 text-primary" />
                ASHRAE 62.1 Ventilation Calculator
              </h1>
              <p className="text-muted-foreground mt-1">
                Ventilation Rate Procedure (VRP) with occupancy and area-based outdoor air calculations
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Phase 4 UX: Sandbox Mode */}
            <SandboxModeToggle
              currentData={{ diversityFactor, supplyAirCfm, zones }}
              onExitWithSave={handleSandboxSave}
            />
            <ScenarioManager compact onPromoteToAlternative={handlePromoteScenarioToAlternative} />
            
            <Button variant="outline" onClick={() => setShowTemplateSelector(true)}>
              <TemplateIcon className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <Button variant="outline" onClick={() => setShowRevisionHistory(true)} disabled={!currentCalculationId}>
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button variant="outline" onClick={() => setSaveDialogOpen(true)} disabled={zoneResults.length === 0}>
              <Save className="h-4 w-4 mr-2" />
              Save
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!savedCalculations?.length}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Load ({savedCalculations?.length || 0})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {savedCalculations?.map((calc) => (
                  <DropdownMenuItem key={calc.id} onClick={() => handleLoadCalculation(calc)}>
                    <div className="flex flex-col">
                      <span className="font-medium">{calc.calculation_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(calc.created_at), 'MMM d, yyyy')} · {calc.ventilation_zone_results?.length || 0} zones
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={handleExportCsv} disabled={zoneResults.length === 0}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" onClick={handleExportPdf} disabled={zoneResults.length === 0}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={() => { clearZones(); addZone(); setCurrentCalculationId(null); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <ActiveEditorsIndicator 
              entityType="ventilation"
              entityId={currentCalculationId || null}
              projectId={selectedProjectId || undefined}
            />
          </div>
        </div>

        {/* Phase 5.3: Edit Conflict Warning */}
        {hasConflict && latestRevision && currentCalculationId && (
          <EditConflictWarning
            entityType="ventilation"
            entityId={currentCalculationId}
            currentRevisionNumber={0}
            onReload={handleReloadLatest}
            onViewDiff={handleViewDiff}
            onForceSave={handleForceSave}
          />
        )}

        {/* Workflow Progress */}
        {selectedProjectId && (
          <DesignWorkflowProgressBar
            projectId={selectedProjectId}
            variant="compact"
            showLabels={false}
            showPercentages={true}
            className="mb-2"
          />
        )}

        {/* Phase 4 UX: Sandbox Mode Banner */}
        <SandboxModeBanner />

        {/* Phase 4 UX: Smart Defaults Banner */}
        {hasContext && defaults.length > 0 && (
          <SmartDefaultsBanner
            defaults={defaults}
            summary={summary}
            onApply={handleApplySmartDefaults}
            filterCategories={['ventilation', 'loads']}
          />
        )}

        {/* Phase 4 UX: Scenario Comparison */}
        {sandboxState.isActive && sandboxState.scenarios.length > 1 && (
          <ScenarioComparisonView metrics={VENTILATION_METRICS} />
        )}

        {/* Data Flow Suggestions */}
        {selectedProjectId && (
          <DataFlowSuggestions
            projectId={selectedProjectId}
            currentTool="ventilation-calculator"
            variant="alert"
            className="mb-4"
          />
        )}

        {/* Tool Page Header with Stage Locking and Validation */}
        {selectedProjectId && (
          <>
            <ToolPageHeader
              toolType="ventilation"
              toolName="Ventilation Calculator"
              projectId={selectedProjectId}
              showLockButton={true}
              showValidation={true}
            />
            <CrossToolValidationAlert
              projectId={selectedProjectId}
              currentTool="ventilation"
              variant="alert"
              className="mb-4"
            />
          </>
        )}

        {/* Project Selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Project Integration</CardTitle>
            <CardDescription>
              Optionally link to a project to import zones or apply results to load calculations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Select value={selectedProjectId || ""} onValueChange={(v) => setSelectedProjectId(v || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                variant="secondary" 
                onClick={handleImportFromProject}
                disabled={!selectedProjectId || !projectZones?.length}
              >
                <Import className="h-4 w-4 mr-2" />
                Import Zones
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Calculator */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="single">Single Zone</TabsTrigger>
            <TabsTrigger value="multiple">Multiple Zones ({zones.length})</TabsTrigger>
            <TabsTrigger value="dcv" className="gap-1">
              <Activity className="h-3 w-3" />
              DCV Mode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4">
            {zones.length > 0 && (
              <SingleZoneCalculator
                zone={zones[0]}
                result={zoneResults[0]}
                spaceTypesByCategory={spaceTypesByCategory}
                onUpdate={(updates) => updateZone(zones[0].id, updates)}
              />
            )}
          </TabsContent>

          <TabsContent value="multiple" className="space-y-4">
            <MultiZoneCalculator
              zones={zones}
              zoneResults={zoneResults}
              systemResult={systemResult}
              spaceTypesByCategory={spaceTypesByCategory}
              diversityFactor={diversityFactor}
              supplyAirCfm={supplyAirCfm}
              onAddZone={() => addZone()}
              onUpdateZone={updateZone}
              onRemoveZone={removeZone}
              onDiversityChange={setDiversityFactor}
              onSupplyAirChange={setSupplyAirCfm}
              projectId={selectedProjectId}
              onNavigate={navigate}
            />
          </TabsContent>

          <TabsContent value="dcv" className="space-y-4">
            <DCVDashboard
              zones={zoneResults.map((r, i) => ({
                id: zones[i]?.id || `zone-${i}`,
                name: r.zoneName || zones[i]?.name || `Zone ${i + 1}`,
                Voz: r.Voz,
                Rp: r.Rp,
                Ra: r.Ra,
                floorArea: r.floorArea,
                occupancy: r.occupancy,
                spaceTypeId: zones[i]?.spaceTypeId || 'office_space',
              }))}
              projectId={selectedProjectId || undefined}
            />
          </TabsContent>
        </Tabs>

        {/* Load Calculation Integration */}
        {selectedProjectId && loadCalculations && loadCalculations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Load Calculation Integration
              </CardTitle>
              <CardDescription>
                Compare ASHRAE 62.1 results with existing simplified ventilation calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Method</p>
                    <p className="font-medium">Simplified (15 CFM/person)</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ASHRAE 62.1 Result</p>
                    <p className="font-medium text-primary">
                      {Math.round(systemResult.systemOutdoorAir).toLocaleString()} CFM
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Effective Rate</p>
                    <p className="font-medium">
                      {systemResult.totalOccupancy > 0 
                        ? (systemResult.systemOutdoorAir / systemResult.totalOccupancy).toFixed(1)
                        : 'N/A'
                      } CFM/person
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Save Dialog */}
        <SaveVentilationDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          projectId={selectedProjectId}
          systemResult={{
            systemOutdoorAir: systemResult.systemOutdoorAir,
            effectiveVentilationPercent: systemResult.systemOutdoorAirPercent,
            diversityFactor: diversityFactor,
            Ev: systemResult.systemEfficiency,
            supplyAirCfm: supplyAirCfm || 0,
            totalOccupancy: systemResult.totalOccupancy,
            totalFloorArea: systemResult.totalFloorArea,
          }}
          zoneResults={zoneResults.map((r, i) => ({
            zoneId: i === 0 && linkedZoneId ? linkedZoneId : undefined, // Link first zone if preselected
            zoneName: r.zoneName || zones[i]?.name || '',
            spaceTypeId: zones[i]?.spaceTypeId || 'office_space',
            floorArea: r.floorArea,
            occupancy: r.occupancy,
            Rp: r.Rp,
            Ra: r.Ra,
            Voz: r.Voz,
            supplyAirCfm: r.Voz, // Using Voz as supply for zone
            Ez: r.Ez,
            Vpz: r.Vbz,
            ventilationEfficiencyPercent: r.Ez * 100,
          }))}
        />
        
        {/* Template and Revision Dialogs */}
        <RevisionHistoryPanel
          entityType="ventilation_calculation"
          entityId={currentCalculationId || undefined}
          projectId={selectedProjectId || ''}
          onRollback={(data) => {
            toast.success('Rolled back to previous version');
          }}
        />
        <DesignTemplateSelector
          templateType="ventilation_calculation"
          onApply={handleApplyTemplate}
          trigger={
            <span style={{ display: 'none' }} />
          }
        />
        <SaveAsTemplateDialog
          templateType="ventilation_calculation"
          templateData={{
            diversityFactor,
            supplyAirCfm,
            zones: zones.map(z => ({ 
              spaceTypeId: z.spaceTypeId, 
              supplyLocation: z.supplyLocation, 
              returnLocation: z.returnLocation 
            })),
          }}
        />

        {/* Design Alternatives */}
        {selectedProjectId && (
          <>
            <SaveAsAlternativeDialog
              open={showSaveAlternative}
              onOpenChange={setShowSaveAlternative}
              projectId={selectedProjectId}
              entityType="ventilation"
              entityId={currentCalculationId || undefined}
              data={{ zones, diversityFactor, supplyAirCfm }}
              suggestedName={`Ventilation - ${zones.length} zones`}
            />

            <DesignAlternativesManager
              open={showAlternativesManager}
              onOpenChange={setShowAlternativesManager}
              entityType="ventilation"
              entityId={currentCalculationId || undefined}
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
              projectId={selectedProjectId}
              entityType="ventilation"
              entityId={currentCalculationId || undefined}
              additionalData={{ zones, diversityFactor, supplyAirCfm }}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

// Single Zone Calculator Component
function SingleZoneCalculator({
  zone,
  result,
  spaceTypesByCategory,
  onUpdate,
}: {
  zone: ZoneVentilationInput;
  result?: any;
  spaceTypesByCategory: Record<string, any[]>;
  onUpdate: (updates: Partial<ZoneVentilationInput>) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Zone Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Zone Name</Label>
            <Input
              value={zone.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="Enter zone name"
            />
          </div>

          <div className="space-y-2">
            <Label>Space Type (ASHRAE 62.1 Table 6.2.2.1)</Label>
            <Select value={zone.spaceTypeId} onValueChange={(v) => onUpdate({ spaceTypeId: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {Object.entries(spaceTypesByCategory).map(([category, types]) => (
                  <SelectGroup key={category}>
                    <SelectLabel>{category}</SelectLabel>
                    {types.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.spaceType}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Floor Area (ft²)</Label>
            <Input
              type="number"
              value={zone.floorArea}
              onChange={(e) => onUpdate({ floorArea: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Occupancy</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={zone.useDefaultOccupancy}
                  onCheckedChange={(checked) => onUpdate({ useDefaultOccupancy: checked })}
                />
                <span className="text-sm text-muted-foreground">Use default density</span>
              </div>
            </div>
            <Input
              type="number"
              value={zone.occupancy}
              onChange={(e) => onUpdate({ occupancy: parseInt(e.target.value) || 0 })}
              disabled={zone.useDefaultOccupancy}
            />
            {zone.useDefaultOccupancy && result && (
              <p className="text-xs text-muted-foreground">
                Calculated: {result.defaultOccupancy} people ({result.spaceType?.occupancyDensity} per 1000 ft²)
              </p>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Supply Location</Label>
              <Select value={zone.supplyLocation} onValueChange={(v: any) => onUpdate({ supplyLocation: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ceiling">Ceiling</SelectItem>
                  <SelectItem value="floor">Floor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Return Location</Label>
              <Select value={zone.returnLocation} onValueChange={(v: any) => onUpdate({ returnLocation: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ceiling">Ceiling</SelectItem>
                  <SelectItem value="floor">Floor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Operating Mode</Label>
            <Select value={zone.operatingMode} onValueChange={(v: any) => onUpdate({ operatingMode: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cooling">Cooling</SelectItem>
                <SelectItem value="heating">Heating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ventilation Results</CardTitle>
          <CardDescription>ASHRAE 62.1 Ventilation Rate Procedure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {result && (
            <>
              {/* ASHRAE Rates */}
              <div className="rounded-lg border p-4 bg-muted/30">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  ASHRAE 62.1 Rates (Table 6.2.2.1)
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Rp:</span>
                      <span className="font-medium ml-1">{result.Rp} CFM/person</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Square className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Ra:</span>
                      <span className="font-medium ml-1">{result.Ra} CFM/ft²</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculation Breakdown */}
              <div className="space-y-3">
                <h4 className="font-medium">Calculation</h4>
                <div className="rounded-lg border bg-card p-4 font-mono text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>People OA = {result.Rp} × {result.occupancy}</span>
                    <span className="font-bold">{Math.round(result.peopleOutdoorAir)} CFM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Area OA = {result.Ra} × {result.floorArea.toLocaleString()}</span>
                    <span className="font-bold">{Math.round(result.areaOutdoorAir)} CFM</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-primary">
                    <span>Breathing Zone OA (Vbz)</span>
                    <span className="font-bold">{Math.round(result.Vbz)} CFM</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Zone Effectiveness (Ez) - {result.supplyConfig}, {result.operatingMode}</span>
                    <span>{result.Ez}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Zone Outdoor Air (Voz)</span>
                    <span className="text-primary">{Math.round(result.Voz)} CFM</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{result.cfmPerPerson.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">CFM/person (effective)</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{(result.cfmPerSqft * 100).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">CFM per 100 ft²</p>
                </div>
              </div>

              {result.spaceType?.notes && (
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
                  <p className="text-sm flex items-start gap-2">
                    <Info className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                    <span>{result.spaceType.notes}</span>
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Multi Zone Calculator Component
function MultiZoneCalculator({
  zones,
  zoneResults,
  systemResult,
  spaceTypesByCategory,
  diversityFactor,
  supplyAirCfm,
  onAddZone,
  onUpdateZone,
  onRemoveZone,
  onDiversityChange,
  onSupplyAirChange,
  projectId,
  onNavigate,
}: {
  zones: ZoneVentilationInput[];
  zoneResults: any[];
  systemResult: any;
  spaceTypesByCategory: Record<string, any[]>;
  diversityFactor: number;
  supplyAirCfm?: number;
  onAddZone: () => void;
  onUpdateZone: (id: string, updates: Partial<ZoneVentilationInput>) => void;
  onRemoveZone: (id: string) => void;
  onDiversityChange: (value: number) => void;
  onSupplyAirChange: (value?: number) => void;
  projectId: string | null;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Zone List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Zone Configuration</CardTitle>
            <CardDescription>Configure multiple zones for system-level calculation</CardDescription>
          </div>
          <Button onClick={onAddZone} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Zone
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Zone Name</TableHead>
                  <TableHead className="w-[180px]">Space Type</TableHead>
                  <TableHead className="w-[100px]">Area (ft²)</TableHead>
                  <TableHead className="w-[80px]">Occ.</TableHead>
                  <TableHead className="w-[80px]">Rp</TableHead>
                  <TableHead className="w-[80px]">Ra</TableHead>
                  <TableHead className="w-[100px]">Vbz (CFM)</TableHead>
                  <TableHead className="w-[60px]">Ez</TableHead>
                  <TableHead className="w-[100px]">Voz (CFM)</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((zone, index) => {
                  const result = zoneResults.find(r => r.zoneId === zone.id);
                  return (
                    <TableRow key={zone.id}>
                      <TableCell>
                        <Input
                          value={zone.name}
                          onChange={(e) => onUpdateZone(zone.id, { name: e.target.value })}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={zone.spaceTypeId} 
                          onValueChange={(v) => onUpdateZone(zone.id, { spaceTypeId: v })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {Object.entries(spaceTypesByCategory).map(([category, types]) => (
                              <SelectGroup key={category}>
                                <SelectLabel className="text-xs">{category}</SelectLabel>
                                {types.map((type) => (
                                  <SelectItem key={type.id} value={type.id} className="text-xs">
                                    {type.spaceType}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={zone.floorArea}
                          onChange={(e) => onUpdateZone(zone.id, { floorArea: parseFloat(e.target.value) || 0 })}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={zone.occupancy}
                          onChange={(e) => onUpdateZone(zone.id, { 
                            occupancy: parseInt(e.target.value) || 0,
                            useDefaultOccupancy: false 
                          })}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell className="text-center">{result?.Rp || '-'}</TableCell>
                      <TableCell className="text-center">{result?.Ra || '-'}</TableCell>
                      <TableCell className="text-center font-medium">
                        {result ? Math.round(result.Vbz).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell className="text-center">{result?.Ez || '-'}</TableCell>
                      <TableCell className="text-center font-medium text-primary">
                        {result ? Math.round(result.Voz).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onRemoveZone(zone.id)}
                          disabled={zones.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* System Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">System Summary</CardTitle>
          <CardDescription>Multi-zone system outdoor air calculation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Diversity Factor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Diversity Factor</Label>
                <Badge variant="outline">{(diversityFactor * 100).toFixed(0)}%</Badge>
              </div>
              <Slider
                value={[diversityFactor * 100]}
                onValueChange={(v) => onDiversityChange(v[0] / 100)}
                min={50}
                max={100}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                Accounts for simultaneous occupancy across zones
              </p>
            </div>

            {/* Optional Supply Air */}
            <div className="space-y-2">
              <Label>Supply Air (CFM) - Optional</Label>
              <Input
                type="number"
                value={supplyAirCfm || ''}
                onChange={(e) => onSupplyAirChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Enter total supply CFM to calculate OA %"
              />
            </div>
          </div>

          <Separator />

          {/* Calculation Flow */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Vbz</p>
              <p className="text-xl font-bold">{Math.round(systemResult.totalVbz).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">CFM</p>
            </div>
            <div className="rounded-lg border p-4 text-center flex flex-col items-center justify-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground mt-1">÷ Ez</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Voz</p>
              <p className="text-xl font-bold">{Math.round(systemResult.totalVoz).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">CFM</p>
            </div>
            <div className="rounded-lg border p-4 text-center flex flex-col items-center justify-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground mt-1">× D ÷ Ev</p>
            </div>
          </div>

          {/* Final Result */}
          <div className="rounded-lg border-2 border-primary bg-primary/5 p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Uncorrected Vou</p>
                <p className="text-lg font-bold">{Math.round(systemResult.uncorrectedVou).toLocaleString()} CFM</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">System Efficiency (Ev)</p>
                <p className="text-lg font-bold">{(systemResult.systemEfficiency * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">System Outdoor Air (Vot)</p>
                <p className="text-2xl font-bold text-primary">
                  {Math.round(systemResult.systemOutdoorAir).toLocaleString()} CFM
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mass Flow</p>
                <p className="text-lg font-bold">{Math.round(systemResult.outdoorAirMassFlow).toLocaleString()} lb/hr</p>
              </div>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Total Floor Area</p>
              <p className="text-lg font-semibold">{systemResult.totalFloorArea.toLocaleString()} ft²</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Total Occupancy</p>
              <p className="text-lg font-semibold">{systemResult.totalOccupancy} people</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Effective CFM/person</p>
              <p className="text-lg font-semibold">
                {systemResult.totalOccupancy > 0 
                  ? (systemResult.systemOutdoorAir / systemResult.totalOccupancy).toFixed(1) 
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Design Workflow Next Step */}
          <DesignWorkflowNextStep
            currentPath="/design/ventilation-calculator"
            projectId={projectId}
            stageComplete={systemResult.systemOutdoorAir > 0}
          />
        </CardContent>
      </Card>
    </div>
  );
}
