import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, ArrowLeft, FileSpreadsheet, FileText, Download, Flame, GitBranch } from 'lucide-react';
import { toast } from 'sonner';
import { useProjects } from '@/hooks/useProjects';
import { useHotWaterPlants } from '@/hooks/useHotWaterPlants';
import { useCreateBoilerSelection, useBoilerSelectionsByPlant } from '@/hooks/useBoilerSelections';
import { useSelectionToolsExport, type BoilerScheduleRow } from '@/hooks/useSelectionToolsExport';
import { BoilerRequirementsPanel } from '@/components/boiler/BoilerRequirementsPanel';
import { BoilerCatalogTable } from '@/components/boiler/BoilerCatalogTable';
import { BoilerSelectionSummary } from '@/components/boiler/BoilerSelectionSummary';
import { EfficiencyComparisonCard } from '@/components/boiler/EfficiencyComparisonCard';
import { useConflictDetection } from '@/hooks/useConflictDetection';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { useQueryClient } from '@tanstack/react-query';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { SaveAsAlternativeDialog } from '@/components/design/SaveAsAlternativeDialog';
import { DesignAlternativesManager } from '@/components/design/DesignAlternativesManager';
import { AlternativeComparisonView } from '@/components/design/AlternativeComparisonView';
import { DesignAlternative } from '@/hooks/useDesignAlternatives';
import type { BoilerCatalogItem, BoilerRequirements, BoilerType, FuelType } from '@/lib/boiler-selection-calculations';
import { calculateHWFlowGpm, ASHRAE_90_1_BOILER_MINIMUMS } from '@/lib/boiler-selection-calculations';

export default function BoilerSelection() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  const plantId = searchParams.get('plant');

  const { data: projects } = useProjects();
  const { data: plants } = useHotWaterPlants(projectId ?? undefined);
  const { data: savedSelections } = useBoilerSelectionsByPlant(plantId ?? undefined);
  const createBoiler = useCreateBoilerSelection();
  const { exportBoilerScheduleToPDF, exportBoilerScheduleToExcel } = useSelectionToolsExport();
  const queryClient = useQueryClient();

  // Concurrent editing awareness
  const { hasConflict, latestRevision, clearConflict } = useConflictDetection({
    entityType: 'boiler_selection',
    entityId: projectId || null,
    currentRevisionNumber: 0,
  });

  const handleReloadLatest = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['boiler_selections'] });
    clearConflict();
    toast.info('Reloaded latest version');
  }, [queryClient, clearConflict]);

  const handleForceSave = useCallback(() => {
    clearConflict();
  }, [clearConflict]);

  // Pre-save validation with stage locking
  const { canSave, isLocked, blockers, warnings } = useToolValidation(
    projectId || null,
    'boiler-selection',
    { checkStageLock: true }
  );

  const [requirements, setRequirements] = useState<BoilerRequirements>({
    requiredCapacityBtuh: 0,
    boilerType: undefined,
    fuelType: 'natural-gas',
    hwSupplyTempF: 180,
    hwReturnTempF: 160,
  });

  const [selectedBoiler, setSelectedBoiler] = useState<BoilerCatalogItem | null>(null);
  const [filterType, setFilterType] = useState<BoilerType | undefined>();
  const [filterFuel, setFilterFuel] = useState<FuelType | undefined>();

  // Design Alternatives state
  const [showSaveAlternative, setShowSaveAlternative] = useState(false);
  const [showAlternativesManager, setShowAlternativesManager] = useState(false);
  const [showAlternativeComparison, setShowAlternativeComparison] = useState(false);
  const [alternativesToCompare, setAlternativesToCompare] = useState<DesignAlternative[]>([]);

  // Design Alternatives handlers
  const handleLoadAlternative = useCallback((data: Record<string, unknown>) => {
    if (data.requirements) setRequirements(data.requirements as BoilerRequirements);
    setShowAlternativesManager(false);
    toast.success('Alternative loaded');
  }, []);

  const handleCompareAlternatives = useCallback((alternatives: DesignAlternative[]) => {
    setAlternativesToCompare(alternatives);
    setShowAlternativeComparison(true);
    setShowAlternativesManager(false);
  }, []);

  // Import from plant if available
  const linkedPlant = plants?.find(p => p.id === plantId);
  
  useEffect(() => {
    if (linkedPlant) {
      setRequirements(prev => ({
        ...prev,
        requiredCapacityBtuh: linkedPlant.heating_load_btuh || 0,
        hwSupplyTempF: linkedPlant.supply_temp_f || 180,
        hwReturnTempF: linkedPlant.return_temp_f || 160,
      }));
    }
  }, [linkedPlant]);

  // Transform saved selections to export format
  const boilerScheduleRows: BoilerScheduleRow[] = useMemo(() => {
    if (!savedSelections) return [];
    return savedSelections.map((sel, idx) => {
      const minAfue = sel.boiler_type?.toLowerCase().includes('condensing') ? 0.95 
        : sel.fuel_type === 'oil' ? 0.85 
        : sel.fuel_type === 'electric' ? 0.99 
        : 0.82;
      const isCompliant = (sel.afue || 0) >= minAfue;
      
      return {
        tag: sel.boiler_tag || `B-${idx + 1}`,
        manufacturer: sel.manufacturer || 'Unknown',
        model: sel.model_number || '-',
        boilerType: sel.boiler_type || 'condensing-gas',
        fuelType: sel.fuel_type || 'natural-gas',
        capacityBtuh: sel.selected_capacity_btuh || 0,
        capacityMbh: (sel.selected_capacity_btuh || 0) / 1000,
        baseAfue: sel.afue || 0.95,
        thermalEfficiency: sel.thermal_efficiency || 0.92,
        turndownRatio: String(sel.turndown_ratio || '5:1'),
        hwSupplyTempF: sel.hw_supply_temp_f || 180,
        hwReturnTempF: sel.hw_return_temp_f || 160,
        hwFlowGpm: sel.hw_flow_gpm || 0,
        voltage: sel.voltage || '480V/3Ph',
        ashrae90Compliant: isCompliant,
        asmeCompliant: sel.asme_certified || false,
        dutyType: sel.status || 'selected',
        plantName: linkedPlant?.plant_name,
      };
    });
  }, [savedSelections, linkedPlant?.plant_name]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleImportFromPlant = () => {
    if (linkedPlant) {
      setRequirements(prev => ({
        ...prev,
        requiredCapacityBtuh: linkedPlant.heating_load_btuh || 0,
        hwSupplyTempF: linkedPlant.supply_temp_f || 180,
        hwReturnTempF: linkedPlant.return_temp_f || 160,
      }));
      toast.success('Requirements imported from HW Plant');
    }
  };

  const handleSaveSelection = async () => {
    if (!selectedBoiler || !projectId) {
      toast.error('Please select a project and boiler');
      return;
    }

    const project = projects?.find(p => p.id === projectId);
    if (!project?.organization_id) {
      toast.error('Project organization not found');
      return;
    }

    const deltaT = (requirements.hwSupplyTempF || 180) - (requirements.hwReturnTempF || 160);
    const hwFlowGpm = calculateHWFlowGpm(selectedBoiler.capacityBtuh, deltaT);

    await createBoiler.mutateAsync({
      project_id: projectId,
      hot_water_plant_id: plantId || null,
      selection_name: `${selectedBoiler.manufacturer} ${selectedBoiler.model}`,
      boiler_tag: null,
      boiler_catalog_id: null,
      boiler_type: selectedBoiler.boilerType,
      fuel_type: selectedBoiler.fuelType,
      manufacturer: selectedBoiler.manufacturer,
      model_number: selectedBoiler.model,
      required_capacity_btuh: requirements.requiredCapacityBtuh || null,
      selected_capacity_btuh: selectedBoiler.capacityBtuh,
      afue: selectedBoiler.afue,
      thermal_efficiency: selectedBoiler.thermalEfficiency,
      turndown_ratio: selectedBoiler.turndownRatio,
      hw_supply_temp_f: requirements.hwSupplyTempF || 180,
      hw_return_temp_f: requirements.hwReturnTempF || 160,
      hw_flow_gpm: hwFlowGpm,
      voltage: selectedBoiler.voltage,
      power_input_kw: null,
      full_load_amps: selectedBoiler.fla,
      asme_certified: selectedBoiler.asmeCompliant,
      ahri_certified: selectedBoiler.ahriCertified,
      efficiency_analysis: null,
      annual_fuel_consumption: null,
      fit_score: null,
      status: 'selected',
      notes: null,
    });
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    if (boilerScheduleRows.length === 0) {
      toast.error('No boiler selections to export');
      return;
    }
    
    const project = projects?.find(p => p.id === projectId);
    const options = {
      projectName: project?.name || 'Untitled Project',
      projectId: projectId || undefined,
    };
    
    if (format === 'pdf') {
      exportBoilerScheduleToPDF(boilerScheduleRows, options);
    } else {
      exportBoilerScheduleToExcel(boilerScheduleRows, options);
    }
  };

  const baseline = selectedBoiler 
    ? ASHRAE_90_1_BOILER_MINIMUMS[selectedBoiler.boilerType]
    : null;

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/design')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Flame className="h-6 w-6 text-orange-500" />
                Boiler Selection
              </h1>
              <p className="text-muted-foreground">
                Select boilers with ASHRAE 90.1 efficiency compliance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ActiveEditorsIndicator 
              entityType="boiler_selection"
              entityId={projectId || null}
              projectId={projectId || undefined}
            />
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!savedSelections || savedSelections.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Schedule
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Edit Conflict Warning */}
        {hasConflict && latestRevision && (
          <EditConflictWarning
            entityType="boiler_selection"
            entityId={projectId!}
            currentRevisionNumber={0}
            onReload={handleReloadLatest}
            onForceSave={handleForceSave}
          />
        )}

        {/* Tool Page Header with Stage Locking and Validation */}
        <ToolPageHeader
          toolType="boiler-selection"
          toolName="Boiler Selection"
          projectId={projectId}
          showLockButton={true}
          showValidation={true}
        />

        {/* Main Content - 3 Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Requirements */}
          <div className="lg:col-span-3 space-y-4">
            <BoilerRequirementsPanel
              requirements={requirements}
              onRequirementsChange={setRequirements}
              onImportFromPlant={handleImportFromPlant}
              hasPlantData={!!linkedPlant}
              plantName={linkedPlant?.plant_name}
            />
          </div>

          {/* Center Panel - Catalog */}
          <div className="lg:col-span-6">
            <Card>
              <CardHeader>
                <CardTitle>Boiler Catalog</CardTitle>
              </CardHeader>
              <CardContent>
                <BoilerCatalogTable
                  requiredCapacityBtuh={requirements.requiredCapacityBtuh}
                  onSelectBoiler={setSelectedBoiler}
                  selectedBoilerId={selectedBoiler?.id}
                  filterType={filterType}
                  onFilterTypeChange={setFilterType}
                  filterFuel={filterFuel}
                  onFilterFuelChange={setFilterFuel}
                  requirements={requirements}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Selection & Analysis */}
          <div className="lg:col-span-3 space-y-4">
            <BoilerSelectionSummary
              selectedBoiler={selectedBoiler}
              requirements={requirements}
              onSave={handleSaveSelection}
              isSaving={createBoiler.isPending}
            />

            {selectedBoiler && (
              <EfficiencyComparisonCard
                selectedBoiler={selectedBoiler}
                requirements={requirements}
              />
            )}
          </div>
        </div>

        {/* Design Alternatives */}
        {projectId && (
          <>
            <SaveAsAlternativeDialog
              open={showSaveAlternative}
              onOpenChange={setShowSaveAlternative}
              projectId={projectId}
              entityType="boiler_selection"
              entityId={undefined}
              data={{ requirements, selectedBoiler }}
              suggestedName={selectedBoiler ? `${selectedBoiler.manufacturer} ${selectedBoiler.model}` : 'Boiler Selection'}
            />

            <DesignAlternativesManager
              open={showAlternativesManager}
              onOpenChange={setShowAlternativesManager}
              entityType="boiler_selection"
              entityId={undefined}
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
