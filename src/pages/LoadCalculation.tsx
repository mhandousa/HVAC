import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCreateLoadCalculation, useLoadCalculations } from '@/hooks/useLoadCalculations';
import { useProjects } from '@/hooks/useProjects';
import { useBuildings } from '@/hooks/useBuildings';
import { useFloors } from '@/hooks/useFloors';
import { useZones } from '@/hooks/useZones';
import { useZoneContext } from '@/hooks/useZoneContext';
import { useRevisionTracker } from '@/hooks/useDesignRevisions';
import { useKeyboardShortcuts, type ShortcutConfig } from '@/hooks/useKeyboardShortcuts';
import { useSmartDefaults } from '@/hooks/useSmartDefaults';
import { useSandbox } from '@/contexts/SandboxContext';
import { usePreSaveValidation } from '@/hooks/usePreSaveValidation';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calculator,
  Loader2,
  ArrowRight,
  Building2,
  Sun,
  Users,
  ThermometerSun,
  Save,
  History,
  FolderKanban,
  ChevronLeft,
  MapPin,
  Layers,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { RevisionHistoryPanel } from '@/components/design/RevisionHistoryPanel';
import { DesignTemplateSelector } from '@/components/design/DesignTemplateSelector';
import { SaveAsTemplateDialog } from '@/components/design/SaveAsTemplateDialog';
import { SmartDefaultsBanner } from '@/components/design/SmartDefaultsBanner';
import { SandboxModeToggle, SandboxModeBanner } from '@/components/design/SandboxModeToggle';
import { ScenarioManager } from '@/components/design/ScenarioManager';
import { ScenarioComparisonView, LOAD_CALCULATION_METRICS } from '@/components/design/ScenarioComparisonView';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { useConflictDetection } from '@/hooks/useConflictDetection';
import { SaveAsAlternativeDialog } from '@/components/design/SaveAsAlternativeDialog';
import { DesignAlternativesManager } from '@/components/design/DesignAlternativesManager';
import { AlternativeComparisonView } from '@/components/design/AlternativeComparisonView';
import { PromoteScenarioDialog } from '@/components/design/PromoteScenarioDialog';
import { PreSaveValidationAlert } from '@/components/design/PreSaveValidationAlert';
import { DesignAlternative } from '@/hooks/useDesignAlternatives';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GitBranch } from 'lucide-react';
import type { BuildingType } from '@/lib/smart-defaults';
import type { Scenario } from '@/contexts/SandboxContext';

interface LoadInputs {
  // Building info
  area_sqft: number;
  ceiling_height: number;
  building_type: string;
  // Envelope
  wall_r_value: number;
  roof_r_value: number;
  window_u_factor: number;
  window_shgc: number;
  window_percentage: number;
  // Internal loads
  occupants: number;
  lighting_wpf: number;
  equipment_wpf: number;
  // Outdoor conditions
  outdoor_temp_summer: number;
  outdoor_temp_winter: number;
  indoor_temp_summer: number;
  indoor_temp_winter: number;
}

interface LoadResults {
  cooling_load_btuh: number;
  heating_load_btuh: number;
  cooling_load_tons: number;
  cfm_required: number;
  breakdown: {
    envelope: number;
    solar: number;
    internal: number;
    ventilation: number;
  };
}

const defaultInputs: LoadInputs = {
  area_sqft: 10000,
  ceiling_height: 10,
  building_type: 'office',
  wall_r_value: 13,
  roof_r_value: 30,
  window_u_factor: 0.3,
  window_shgc: 0.25,
  window_percentage: 40,
  occupants: 67,
  lighting_wpf: 1.0,
  equipment_wpf: 1.5,
  outdoor_temp_summer: 95,
  outdoor_temp_winter: 20,
  indoor_temp_summer: 75,
  indoor_temp_winter: 70,
};

export default function LoadCalculation() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get('project');
  const zoneIdFromUrl = searchParams.get('zone');
  
  // Zone context persistence with full hierarchy
  const { 
    projectId: storedProjectId, 
    buildingId: storedBuildingId,
    floorId: storedFloorId,
    zoneId: storedZoneId, 
    setFullContext 
  } = useZoneContext();
  
  const [inputs, setInputs] = useState<LoadInputs>(defaultInputs);
  const [results, setResults] = useState<LoadResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationName, setCalculationName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectIdFromUrl || storedProjectId || '');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(storedBuildingId || '');
  const [selectedFloorId, setSelectedFloorId] = useState<string>(storedFloorId || '');
  const [selectedZoneId, setSelectedZoneId] = useState<string>(zoneIdFromUrl || storedZoneId || '');
  const [currentCalculationId, setCurrentCalculationId] = useState<string | undefined>();
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);
  const previousInputs = useRef<LoadInputs>(defaultInputs);
  
  // Design Alternatives state
  const [showSaveAlternative, setShowSaveAlternative] = useState(false);
  const [showAlternativesManager, setShowAlternativesManager] = useState(false);
  const [showAlternativeComparison, setShowAlternativeComparison] = useState(false);
  const [alternativesToCompare, setAlternativesToCompare] = useState<DesignAlternative[]>([]);
  const [showPromoteScenario, setShowPromoteScenario] = useState(false);
  const [scenarioToPromote, setScenarioToPromote] = useState<Scenario | null>(null);
  
  const { data: projects } = useProjects();
  const { data: buildings } = useBuildings(selectedProjectId || undefined);
  const { data: floors } = useFloors(selectedBuildingId || undefined);
  const { data: zones } = useZones(selectedFloorId || undefined);
  const { data: savedCalculations } = useLoadCalculations();
  const createCalculation = useCreateLoadCalculation();
  
  // Revision tracking
  const { trackChange } = useRevisionTracker(
    selectedProjectId || undefined,
    'load_calculation',
    currentCalculationId
  );

  // Smart Defaults
  const { defaults, summary, hasContext } = useSmartDefaults({
    buildingType: inputs.building_type as BuildingType,
    zoneArea_sqft: inputs.area_sqft,
  });

  // Sandbox Mode
  const { state: sandboxState, activateSandbox, updateScenario, setScenarioResults, getMergedData } = useSandbox();

  // Concurrent Editing Awareness
  const queryClient = useQueryClient();
  const { hasConflict, latestRevision, clearConflict } = useConflictDetection({
    entityType: 'load_calculation',
    entityId: currentCalculationId || null,
    currentRevisionNumber: 0,
  });

  // Pre-Save Validation & Stage Locking
  const { canSave, blockers, warnings, isLocked } = useToolValidation(
    selectedProjectId || null,
    'load-calculation',
    { checkStageLock: true }
  );

  const handleReloadLatest = useCallback(() => {
    if (currentCalculationId && savedCalculations) {
      const calc = savedCalculations.find(c => c.id === currentCalculationId);
      if (calc) loadSavedCalculation(calc);
    }
    clearConflict();
    toast.info('Reloaded latest version');
  }, [currentCalculationId, savedCalculations, clearConflict]);

  const handleViewDiff = useCallback(() => {
    setShowRevisionHistory(true);
  }, []);

  const handleForceSave = useCallback(() => {
    clearConflict();
  }, [clearConflict]);

  const handleApplySmartDefaults = useCallback((values: Record<string, number | string>) => {
    setInputs(prev => ({
      ...prev,
      wall_r_value: values.wall_r_value as number ?? prev.wall_r_value,
      roof_r_value: values.roof_r_value as number ?? prev.roof_r_value,
      window_u_factor: values.window_u_factor as number ?? prev.window_u_factor,
      window_shgc: values.window_shgc as number ?? prev.window_shgc,
      lighting_wpf: values.lighting_wpf as number ?? prev.lighting_wpf,
      equipment_wpf: values.equipment_wpf as number ?? prev.equipment_wpf,
      occupants: values.occupant_density ? Math.round(inputs.area_sqft / (values.occupant_density as number)) : prev.occupants,
    }));
    toast.success('Smart defaults applied from ASHRAE standards');
  }, [inputs.area_sqft]);

  const handleSandboxSave = useCallback((data: Record<string, unknown>) => {
    const mergedInputs = data as unknown as LoadInputs;
    setInputs(mergedInputs);
    toast.success('Sandbox changes applied to calculation');
  }, []);

  // Design Alternatives handlers
  const handleLoadAlternative = useCallback((data: Record<string, unknown>) => {
    const altData = data as Partial<LoadInputs>;
    setInputs(prev => ({ ...prev, ...altData }));
    setShowAlternativesManager(false);
    toast.success('Alternative loaded');
  }, []);

  const handleCompareAlternatives = useCallback((alternatives: DesignAlternative[]) => {
    setAlternativesToCompare(alternatives);
    setShowAlternativeComparison(true);
    setShowAlternativesManager(false);
  }, []);

  const handlePromoteScenarioToAlternative = useCallback((scenario: Scenario) => {
    setScenarioToPromote(scenario);
    setShowPromoteScenario(true);
  }, []);

  // Sync zone context with full hierarchy when selections change
  useEffect(() => {
    if (selectedProjectId || selectedZoneId) {
      setFullContext(
        selectedProjectId || null, 
        selectedBuildingId || null,
        selectedFloorId || null,
        selectedZoneId || null, 
        { replace: true }
      );
    }
  }, [selectedProjectId, selectedBuildingId, selectedFloorId, selectedZoneId, setFullContext]);

  // Set project from URL param or stored context
  useEffect(() => {
    if (projectIdFromUrl && !selectedProjectId) {
      setSelectedProjectId(projectIdFromUrl);
    } else if (storedProjectId && !selectedProjectId) {
      setSelectedProjectId(storedProjectId);
    }
  }, [projectIdFromUrl, storedProjectId]);

  // Reset dependent selections when parent changes
  useEffect(() => {
    setSelectedBuildingId('');
    setSelectedFloorId('');
    setSelectedZoneId('');
  }, [selectedProjectId]);

  useEffect(() => {
    setSelectedFloorId('');
    setSelectedZoneId('');
  }, [selectedBuildingId]);

  useEffect(() => {
    setSelectedZoneId('');
  }, [selectedFloorId]);

  // Auto-fill area when zone is selected
  const handleZoneChange = (zoneId: string) => {
    const newValue = zoneId === 'none' ? '' : zoneId;
    setSelectedZoneId(newValue);
    
    if (newValue) {
      const zone = zones?.find(z => z.id === newValue);
      if (zone?.area_sqm) {
        // Convert m² to sq ft
        const areaSqft = Math.round(zone.area_sqm * 10.764);
        setInputs(prev => ({ ...prev, area_sqft: areaSqft }));
        toast.info(`Area auto-filled from zone: ${areaSqft.toLocaleString()} sq ft`);
      }
    }
  };

  const linkedProject = projects?.find(p => p.id === selectedProjectId);
  const selectedZone = zones?.find(z => z.id === selectedZoneId);

  if (!loading && !user) {
    navigate('/auth');
  }

  const calculateLoads = () => {
    setIsCalculating(true);

    // Simplified ASHRAE-based calculation
    setTimeout(() => {
      const {
        area_sqft,
        ceiling_height,
        wall_r_value,
        roof_r_value,
        window_u_factor,
        window_shgc,
        window_percentage,
        occupants,
        lighting_wpf,
        equipment_wpf,
        outdoor_temp_summer,
        indoor_temp_summer,
        outdoor_temp_winter,
        indoor_temp_winter,
      } = inputs;

      const volume = area_sqft * ceiling_height;
      const delta_t_cooling = outdoor_temp_summer - indoor_temp_summer;
      const delta_t_heating = indoor_temp_winter - outdoor_temp_winter;

      // Estimate perimeter (assuming square building)
      const side = Math.sqrt(area_sqft);
      const perimeter = 4 * side;
      const wall_area = perimeter * ceiling_height;
      const window_area = wall_area * (window_percentage / 100);
      const opaque_wall_area = wall_area - window_area;

      // Envelope loads (cooling)
      const wall_load = (opaque_wall_area / wall_r_value) * delta_t_cooling;
      const roof_load = (area_sqft / roof_r_value) * delta_t_cooling;
      const window_conduction = window_area * window_u_factor * delta_t_cooling;
      const envelope_load = wall_load + roof_load + window_conduction;

      // Solar load through windows (simplified)
      const solar_heat_gain = window_area * window_shgc * 100; // Assume 100 BTU/hr/sqft solar
      const solar_load = solar_heat_gain;

      // Internal loads
      const people_load = occupants * 250; // 250 BTU/hr sensible per person
      const lighting_load = area_sqft * lighting_wpf * 3.412; // Convert W to BTU/hr
      const equipment_load = area_sqft * equipment_wpf * 3.412;
      const internal_load = people_load + lighting_load + equipment_load;

      // Ventilation load (15 CFM/person, simplified)
      const ventilation_cfm = occupants * 15;
      const ventilation_load = ventilation_cfm * 1.08 * delta_t_cooling;

      // Total cooling load
      const total_cooling = envelope_load + solar_load + internal_load + ventilation_load;
      const cooling_tons = total_cooling / 12000;

      // Heating load (simplified - no solar or internal gains as safety factor)
      const heating_envelope = (opaque_wall_area / wall_r_value + area_sqft / roof_r_value + window_area * window_u_factor) * delta_t_heating;
      const heating_ventilation = ventilation_cfm * 1.08 * delta_t_heating;
      const total_heating = heating_envelope + heating_ventilation;

      // CFM required (assuming 20°F temperature difference)
      const cfm_required = total_cooling / (1.08 * 20);

      const newResults = {
        cooling_load_btuh: Math.round(total_cooling),
        heating_load_btuh: Math.round(total_heating),
        cooling_load_tons: Math.round(cooling_tons * 10) / 10,
        cfm_required: Math.round(cfm_required),
        breakdown: {
          envelope: Math.round(envelope_load),
          solar: Math.round(solar_load),
          internal: Math.round(internal_load),
          ventilation: Math.round(ventilation_load),
        },
      };

      setResults(newResults);

      // Store results in sandbox when active
      if (sandboxState.isActive) {
        setScenarioResults(newResults as unknown as Record<string, unknown>);
      }

      setIsCalculating(false);
      toast.success('Load calculation complete');
    }, 1000);
  };

  const saveCalculation = async () => {
    if (!results) {
      toast.error('Please calculate loads first');
      return;
    }
    if (!calculationName.trim()) {
      toast.error('Please enter a calculation name');
      return;
    }

    // Track revision if updating existing calculation
    if (currentCalculationId) {
      await trackChange(
        previousInputs.current as unknown as Record<string, unknown>,
        inputs as unknown as Record<string, unknown>,
        'Updated calculation parameters'
      );
    }

    createCalculation.mutate({
      calculation_name: calculationName,
      calculation_type: 'manual',
      project_id: selectedProjectId || null,
      building_id: selectedBuildingId || null,
      zone_id: selectedZoneId || null,
      area_sqft: inputs.area_sqft,
      ceiling_height_ft: inputs.ceiling_height,
      building_type: inputs.building_type,
      wall_r_value: inputs.wall_r_value,
      roof_r_value: inputs.roof_r_value,
      window_u_factor: inputs.window_u_factor,
      window_shgc: inputs.window_shgc,
      window_to_wall_ratio: inputs.window_percentage,
      occupant_count: inputs.occupants,
      lighting_power_density: inputs.lighting_wpf,
      equipment_power_density: inputs.equipment_wpf,
      outdoor_temp_summer_f: inputs.outdoor_temp_summer,
      outdoor_temp_winter_f: inputs.outdoor_temp_winter,
      indoor_temp_summer_f: inputs.indoor_temp_summer,
      indoor_temp_winter_f: inputs.indoor_temp_winter,
      cooling_load_btuh: results.cooling_load_btuh,
      heating_load_btuh: results.heating_load_btuh,
      cooling_load_tons: results.cooling_load_tons,
      cfm_required: results.cfm_required,
      load_breakdown: results.breakdown,
      status: 'completed',
    });
    
    // Update previous inputs for next revision tracking
    previousInputs.current = { ...inputs };
  };

  const loadSavedCalculation = (calc: typeof savedCalculations extends (infer T)[] | undefined ? T : never) => {
    if (!calc) return;
    
    const loadedInputs: LoadInputs = {
      area_sqft: Number(calc.area_sqft) || defaultInputs.area_sqft,
      ceiling_height: Number(calc.ceiling_height_ft) || defaultInputs.ceiling_height,
      building_type: calc.building_type || defaultInputs.building_type,
      wall_r_value: Number(calc.wall_r_value) || defaultInputs.wall_r_value,
      roof_r_value: Number(calc.roof_r_value) || defaultInputs.roof_r_value,
      window_u_factor: Number(calc.window_u_factor) || defaultInputs.window_u_factor,
      window_shgc: Number(calc.window_shgc) || defaultInputs.window_shgc,
      window_percentage: Number(calc.window_to_wall_ratio) || defaultInputs.window_percentage,
      occupants: calc.occupant_count || defaultInputs.occupants,
      lighting_wpf: Number(calc.lighting_power_density) || defaultInputs.lighting_wpf,
      equipment_wpf: Number(calc.equipment_power_density) || defaultInputs.equipment_wpf,
      outdoor_temp_summer: Number(calc.outdoor_temp_summer_f) || defaultInputs.outdoor_temp_summer,
      outdoor_temp_winter: Number(calc.outdoor_temp_winter_f) || defaultInputs.outdoor_temp_winter,
      indoor_temp_summer: Number(calc.indoor_temp_summer_f) || defaultInputs.indoor_temp_summer,
      indoor_temp_winter: Number(calc.indoor_temp_winter_f) || defaultInputs.indoor_temp_winter,
    };
    
    setInputs(loadedInputs);
    previousInputs.current = loadedInputs;
    setCurrentCalculationId(calc.id);
    
    if (calc.cooling_load_btuh && calc.heating_load_btuh) {
      const breakdown = calc.load_breakdown as { envelope: number; solar: number; internal: number; ventilation: number } | null;
      setResults({
        cooling_load_btuh: Number(calc.cooling_load_btuh),
        heating_load_btuh: Number(calc.heating_load_btuh),
        cooling_load_tons: Number(calc.cooling_load_tons) || 0,
        cfm_required: Number(calc.cfm_required) || 0,
        breakdown: breakdown || { envelope: 0, solar: 0, internal: 0, ventilation: 0 },
      });
    }
    
    setCalculationName(calc.calculation_name);
    setSelectedProjectId(calc.project_id || '');
    setSelectedBuildingId(calc.building_id || '');
    setSelectedZoneId(calc.zone_id || '');
    toast.success(`Loaded: ${calc.calculation_name}`);
  };

  const breadcrumbItems = useMemo(() => {
    const items = [];
    if (linkedProject) {
      items.push({ label: linkedProject.name, href: `/projects/${linkedProject.id}` });
    }
    items.push(
      { label: 'Design Tools', href: '/design' },
      { label: 'Core Calculations' },
      { label: 'Load Calculation' }
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

  const handleApplyTemplate = (templateData: Record<string, unknown>) => {
    const data = templateData as Partial<LoadInputs>;
    setInputs(prev => ({
      ...prev,
      ...data,
    }));
    toast.success('Template applied');
  };

  // Keyboard shortcuts
  const shortcuts: ShortcutConfig[] = useMemo(() => [
    {
      key: 's',
      modifiers: ['ctrl'],
      description: 'Save calculation',
      action: () => {
        if (results && calculationName.trim()) {
          saveCalculation();
        } else {
          toast.error('Complete calculation and add a name first');
        }
      },
      category: 'actions',
      enabled: true,
    },
    {
      key: 'Enter',
      modifiers: ['ctrl'],
      description: 'Calculate loads',
      action: () => calculateLoads(),
      category: 'actions',
      enabled: true,
    },
    {
      key: 'n',
      description: 'Next workflow step',
      action: () => navigate(selectedProjectId ? `/design/ventilation-calculator?project=${selectedProjectId}` : '/design/ventilation-calculator'),
      category: 'navigation',
      enabled: true,
    },
    {
      key: 'p',
      description: 'Previous workflow step',
      action: () => navigate('/design'),
      category: 'navigation',
      enabled: true,
    },
  ], [results, calculationName, navigate, selectedProjectId]);

  useKeyboardShortcuts(shortcuts);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
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
            {selectedZone && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="w-3 h-3" />
                {selectedZone.name}
              </Badge>
            )}
            <Badge variant="outline">{linkedProject.status}</Badge>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Load Calculation</h1>
            <p className="text-muted-foreground">
              Calculate cooling and heating loads using simplified ASHRAE methodology
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SandboxModeToggle
              currentData={inputs as unknown as Record<string, unknown>}
              onExitWithSave={handleSandboxSave}
            />
            <ScenarioManager compact onPromoteToAlternative={handlePromoteScenarioToAlternative} />
            <DesignTemplateSelector
              templateType="load_calculation"
              onApply={handleApplyTemplate}
              trigger={
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-1" />
                  Templates
                </Button>
              }
            />
            {results && (
              <SaveAsTemplateDialog
                templateType="load_calculation"
                templateData={inputs as unknown as Record<string, unknown>}
                trigger={
                  <Button variant="outline" size="sm">
                    <Save className="w-4 h-4 mr-1" />
                    Save Template
                  </Button>
                }
              />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <GitBranch className="w-4 h-4 mr-1" />
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
              entityType="load_calculation"
              entityId={currentCalculationId || null}
              projectId={selectedProjectId}
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
            entityType="load_calculation"
            entityId={currentCalculationId || null}
            currentRevisionNumber={0}
            onReload={handleReloadLatest}
            onViewDiff={handleViewDiff}
            onForceSave={handleForceSave}
          />
        )}

        {/* Stage Locking & Pre-Save Validation Header */}
        <ToolPageHeader
          toolType="load-calculation"
          toolName="Load Calculation"
          projectId={selectedProjectId || null}
          zoneId={selectedZoneId || null}
          showLockButton={!!selectedProjectId}
          showValidation={!!selectedProjectId}
        />

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

        {/* Data Flow Suggestions */}
        {selectedProjectId && (
          <DataFlowSuggestions
            projectId={selectedProjectId}
            currentTool="load-calculation"
            variant="alert"
            className="mb-4"
          />
        )}

        {/* Sandbox Mode Banner */}
        <SandboxModeBanner />

        {/* Smart Defaults Banner */}
        {hasContext && defaults.length > 0 && (
          <SmartDefaultsBanner
            defaults={defaults}
            summary={summary}
            onApply={handleApplySmartDefaults}
            filterCategories={['envelope', 'loads']}
          />
        )}

        {/* Scenario Comparison View */}
        {sandboxState.isActive && sandboxState.scenarios.length > 1 && (
          <ScenarioComparisonView
            metrics={LOAD_CALCULATION_METRICS}
            className="mb-4"
          />
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Input Form */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="building" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="building">Building</TabsTrigger>
                <TabsTrigger value="envelope">Envelope</TabsTrigger>
                <TabsTrigger value="internal">Internal</TabsTrigger>
                <TabsTrigger value="conditions">Conditions</TabsTrigger>
              </TabsList>

              <TabsContent value="building" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Building Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Location Selector */}
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <Label className="text-sm font-medium mb-3 block">Location (optional)</Label>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs flex items-center gap-1">
                            <FolderKanban className="w-3 h-3" />
                            Project
                          </Label>
                          <Select
                            value={selectedProjectId || 'none'}
                            onValueChange={(v) => setSelectedProjectId(v === 'none' ? '' : v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select project..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No project</SelectItem>
                              {projects?.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            Building
                          </Label>
                          <Select
                            value={selectedBuildingId || 'none'}
                            onValueChange={(v) => setSelectedBuildingId(v === 'none' ? '' : v)}
                            disabled={!selectedProjectId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={selectedProjectId ? 'Select building...' : 'Select project first'} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No building</SelectItem>
                              {buildings?.map((building) => (
                                <SelectItem key={building.id} value={building.id}>
                                  {building.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            Floor
                          </Label>
                          <Select
                            value={selectedFloorId || 'none'}
                            onValueChange={(v) => setSelectedFloorId(v === 'none' ? '' : v)}
                            disabled={!selectedBuildingId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={selectedBuildingId ? 'Select floor...' : 'Select building first'} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No floor</SelectItem>
                              {floors?.map((floor) => (
                                <SelectItem key={floor.id} value={floor.id}>
                                  {floor.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Zone
                          </Label>
                          <Select
                            value={selectedZoneId || 'none'}
                            onValueChange={handleZoneChange}
                            disabled={!selectedFloorId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={selectedFloorId ? 'Select zone...' : 'Select floor first'} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No zone</SelectItem>
                              {zones?.map((zone) => (
                                <SelectItem key={zone.id} value={zone.id}>
                                  {zone.name} {zone.area_sqm ? `(${Math.round(zone.area_sqm * 10.764)} sq ft)` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {selectedZone && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Zone area will auto-fill the floor area field
                        </p>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Floor Area (sq ft)</Label>
                        <Input
                          type="number"
                          value={inputs.area_sqft}
                          onChange={(e) => setInputs({ ...inputs, area_sqft: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ceiling Height (ft)</Label>
                        <Input
                          type="number"
                          value={inputs.ceiling_height}
                          onChange={(e) => setInputs({ ...inputs, ceiling_height: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Building Type</Label>
                        <Select
                          value={inputs.building_type}
                          onValueChange={(value) => setInputs({ ...inputs, building_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="office">Office</SelectItem>
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="healthcare">Healthcare</SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="hospitality">Hospitality</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="envelope" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sun className="w-5 h-5" />
                      Building Envelope
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Wall R-Value</Label>
                      <Input
                        type="number"
                        value={inputs.wall_r_value}
                        onChange={(e) => setInputs({ ...inputs, wall_r_value: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Roof R-Value</Label>
                      <Input
                        type="number"
                        value={inputs.roof_r_value}
                        onChange={(e) => setInputs({ ...inputs, roof_r_value: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Window U-Factor</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={inputs.window_u_factor}
                        onChange={(e) => setInputs({ ...inputs, window_u_factor: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Window SHGC</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={inputs.window_shgc}
                        onChange={(e) => setInputs({ ...inputs, window_shgc: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Window-to-Wall Ratio (%)</Label>
                      <Input
                        type="number"
                        value={inputs.window_percentage}
                        onChange={(e) => setInputs({ ...inputs, window_percentage: Number(e.target.value) })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="internal" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Internal Loads
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Number of Occupants</Label>
                      <Input
                        type="number"
                        value={inputs.occupants}
                        onChange={(e) => setInputs({ ...inputs, occupants: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Lighting Power Density (W/sq ft)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={inputs.lighting_wpf}
                        onChange={(e) => setInputs({ ...inputs, lighting_wpf: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Equipment Power Density (W/sq ft)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={inputs.equipment_wpf}
                        onChange={(e) => setInputs({ ...inputs, equipment_wpf: Number(e.target.value) })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="conditions" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ThermometerSun className="w-5 h-5" />
                      Design Conditions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Summer Outdoor Temp (°F)</Label>
                      <Input
                        type="number"
                        value={inputs.outdoor_temp_summer}
                        onChange={(e) => setInputs({ ...inputs, outdoor_temp_summer: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Summer Indoor Temp (°F)</Label>
                      <Input
                        type="number"
                        value={inputs.indoor_temp_summer}
                        onChange={(e) => setInputs({ ...inputs, indoor_temp_summer: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Winter Outdoor Temp (°F)</Label>
                      <Input
                        type="number"
                        value={inputs.outdoor_temp_winter}
                        onChange={(e) => setInputs({ ...inputs, outdoor_temp_winter: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Winter Indoor Temp (°F)</Label>
                      <Input
                        type="number"
                        value={inputs.indoor_temp_winter}
                        onChange={(e) => setInputs({ ...inputs, indoor_temp_winter: Number(e.target.value) })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Button onClick={calculateLoads} className="w-full gap-2" size="lg" disabled={isCalculating}>
              {isCalculating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  Calculate Loads
                </>
              )}
            </Button>
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>Calculated load values</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {results ? (
                  <>
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-xs text-muted-foreground mb-1">Cooling Load</p>
                      <p className="text-2xl font-bold text-primary">
                        {results.cooling_load_tons} Tons
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {results.cooling_load_btuh.toLocaleString()} BTU/hr
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                      <p className="text-xs text-muted-foreground mb-1">Heating Load</p>
                      <p className="text-2xl font-bold text-warning">
                        {(results.heating_load_btuh / 1000).toFixed(1)} MBH
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {results.heating_load_btuh.toLocaleString()} BTU/hr
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Supply Air Required</p>
                      <p className="text-xl font-bold">
                        {results.cfm_required.toLocaleString()} CFM
                      </p>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-3">Cooling Load Breakdown</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Envelope</span>
                          <span className="font-mono">{results.breakdown.envelope.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Solar</span>
                          <span className="font-mono">{results.breakdown.solar.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Internal</span>
                          <span className="font-mono">{results.breakdown.internal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ventilation</span>
                          <span className="font-mono">{results.breakdown.ventilation.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Enter building parameters and click Calculate</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {results && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Save Calculation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label>Calculation Name</Label>
                      <Input
                        placeholder="e.g., Building A - Phase 1"
                        value={calculationName}
                        onChange={(e) => setCalculationName(e.target.value)}
                      />
                    </div>
                    {selectedZoneId && (
                      <div className="p-2 rounded bg-muted/50 text-xs text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        Will be saved with zone: {selectedZone?.name}
                      </div>
                    )}
                    
                    {/* Pre-Save Validation Alert */}
                    <PreSaveValidationAlert
                      blockers={blockers}
                      warnings={warnings}
                    />
                    
                    <Button 
                      className="w-full gap-2" 
                      onClick={saveCalculation}
                      disabled={createCalculation.isPending || !canSave}
                    >
                      {createCalculation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Calculation
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Next Steps</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-between" 
                      onClick={() => navigate(selectedProjectId ? `/design/equipment-selection?project=${selectedProjectId}` : '/design/equipment-selection')}
                    >
                      Select Equipment
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-between" 
                      onClick={() => navigate(selectedProjectId ? `/design/duct-sizing?project=${selectedProjectId}` : '/design/duct-sizing')}
                    >
                      Size Ductwork
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-between" 
                      onClick={() => navigate(selectedProjectId ? `/design/ventilation-calculator?project=${selectedProjectId}` : '/design/ventilation-calculator')}
                    >
                      Calculate Ventilation
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}

            {savedCalculations && savedCalculations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Saved Calculations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                  {savedCalculations.slice(0, 5).map((calc) => (
                    <button
                      key={calc.id}
                      onClick={() => loadSavedCalculation(calc)}
                      className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors border border-transparent hover:border-border"
                    >
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate flex-1">{calc.calculation_name}</p>
                        {calc.zone_id && <MapPin className="w-3 h-3 text-muted-foreground" />}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {calc.cooling_load_tons} tons • {new Date(calc.created_at).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Design Workflow Next Step */}
        <DesignWorkflowNextStep
          currentPath="/load-calculation"
          projectId={selectedProjectId}
          zoneId={selectedZoneId}
          stageComplete={results !== null}
        />

        {/* Revision History */}
        {selectedProjectId && currentCalculationId && (
          <RevisionHistoryPanel
            entityType="load_calculation"
            entityId={currentCalculationId}
            projectId={selectedProjectId}
            onRollback={(data) => {
              const rollbackData = data as Partial<LoadInputs>;
              if (rollbackData) {
                setInputs(prev => ({ ...prev, ...rollbackData }));
                toast.success('Rolled back to previous version');
              }
            }}
          />
        )}

        {/* Design Alternatives Dialogs */}
        {selectedProjectId && (
          <>
            <SaveAsAlternativeDialog
              open={showSaveAlternative}
              onOpenChange={setShowSaveAlternative}
              projectId={selectedProjectId}
              entityType="load_calculation"
              entityId={currentCalculationId}
              data={inputs as unknown as Record<string, unknown>}
              suggestedName={`Load Calc - ${selectedZone?.name || 'Zone'}`}
            />

            <DesignAlternativesManager
              open={showAlternativesManager}
              onOpenChange={setShowAlternativesManager}
              entityType="load_calculation"
              entityId={currentCalculationId}
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
              entityType="load_calculation"
              entityId={currentCalculationId}
              additionalData={inputs as unknown as Record<string, unknown>}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
