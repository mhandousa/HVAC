import { useState, useEffect, useCallback } from 'react';
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
import { Loader2, ArrowLeft, FileSpreadsheet, FileText, Download, GitBranch } from 'lucide-react';
import { toast } from 'sonner';
import { useProjects } from '@/hooks/useProjects';
import { useChilledWaterPlants } from '@/hooks/useChilledWaterPlants';
import { useCreateChillerSelection, useChillerSelections } from '@/hooks/useChillerSelections';
import { ChillerRequirementsPanel } from '@/components/chiller/ChillerRequirementsPanel';
import { ChillerCatalogTable } from '@/components/chiller/ChillerCatalogTable';
import { ChillerSelectionSummary } from '@/components/chiller/ChillerSelectionSummary';
import { PartLoadAnalysisChart } from '@/components/chiller/PartLoadAnalysisChart';
import { IplvComparisonCard } from '@/components/chiller/IplvComparisonCard';
import { DataFlowImportHandler, type ImportLoadData, type ImportCHWPlantData } from '@/components/design/DataFlowImportHandler';
import { useSelectionToolsExport } from '@/hooks/useSelectionToolsExport';
import { useConflictDetection } from '@/hooks/useConflictDetection';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { useQueryClient } from '@tanstack/react-query';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { SaveAsAlternativeDialog } from '@/components/design/SaveAsAlternativeDialog';
import { DesignAlternativesManager } from '@/components/design/DesignAlternativesManager';
import { AlternativeComparisonView } from '@/components/design/AlternativeComparisonView';
import { DesignAlternative } from '@/hooks/useDesignAlternatives';
import type { ChillerCatalogItem, ChillerRequirements, ChillerType } from '@/lib/chiller-selection-calculations';
import { calculateAnnualEnergy, ASHRAE_90_1_MINIMUMS } from '@/lib/chiller-selection-calculations';

export default function ChillerSelection() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  const plantId = searchParams.get('plant');

  const { data: projects } = useProjects();
  const { data: plants } = useChilledWaterPlants(projectId ?? undefined);
  const { data: savedSelections } = useChillerSelections(projectId ?? undefined);
  const createChiller = useCreateChillerSelection();
  const { exportChillerScheduleToPDF, exportChillerScheduleToExcel } = useSelectionToolsExport();
  const queryClient = useQueryClient();

  // Concurrent editing awareness
  const { hasConflict, latestRevision, clearConflict } = useConflictDetection({
    entityType: 'chiller_selection',
    entityId: projectId || null,
    currentRevisionNumber: 0,
  });

  const handleReloadLatest = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['chiller_selections'] });
    clearConflict();
    toast.info('Reloaded latest version');
  }, [queryClient, clearConflict]);

  const handleForceSave = useCallback(() => {
    clearConflict();
  }, [clearConflict]);

  // Pre-save validation with stage locking
  const { canSave, isLocked, blockers, warnings } = useToolValidation(
    projectId || null,
    'chiller-selection',
    { checkStageLock: true }
  );

  const [requirements, setRequirements] = useState<ChillerRequirements>({
    requiredCapacityTons: 0,
    chillerType: undefined,
    chwSupplyF: 44,
    chwReturnF: 54,
    cwSupplyF: 85,
    sasoRequired: true,
  });

  const [selectedChiller, setSelectedChiller] = useState<ChillerCatalogItem | null>(null);
  const [filterType, setFilterType] = useState<ChillerType | undefined>();

  // Design Alternatives state
  const [showSaveAlternative, setShowSaveAlternative] = useState(false);
  const [showAlternativesManager, setShowAlternativesManager] = useState(false);
  const [showAlternativeComparison, setShowAlternativeComparison] = useState(false);
  const [alternativesToCompare, setAlternativesToCompare] = useState<DesignAlternative[]>([]);

  // Design Alternatives handlers
  const handleLoadAlternative = useCallback((data: Record<string, unknown>) => {
    if (data.requirements) setRequirements(data.requirements as ChillerRequirements);
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
        requiredCapacityTons: linkedPlant.design_cooling_load_tons || 0,
        chwSupplyF: linkedPlant.chw_supply_temp_f || 44,
        chwReturnF: linkedPlant.chw_return_temp_f || 54,
        cwSupplyF: linkedPlant.cw_supply_temp_f || 85,
      }));
    }
  }, [linkedPlant]);

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
        requiredCapacityTons: linkedPlant.design_cooling_load_tons || 0,
        chwSupplyF: linkedPlant.chw_supply_temp_f || 44,
        chwReturnF: linkedPlant.chw_return_temp_f || 54,
        cwSupplyF: linkedPlant.cw_supply_temp_f || 85,
      }));
      toast.success('Requirements imported from CHW Plant');
    }
  };

  const handleImportLoadData = (data: ImportLoadData) => {
    setRequirements(prev => ({
      ...prev,
      requiredCapacityTons: data.totalCoolingTons,
    }));
    toast.success(`Imported ${data.totalCoolingTons.toFixed(1)} tons from load calculations`);
  };

  const handleImportCHWPlantData = (data: ImportCHWPlantData) => {
    if (data.plants.length > 0) {
      const plant = data.plants[0]; // Use first plant
      setRequirements(prev => ({
        ...prev,
        requiredCapacityTons: plant.capacityTons,
        chillerType: plant.chillerType === 'water-cooled' ? 'water-cooled-centrifugal' : undefined,
        chwSupplyF: plant.chwSupplyF || 44,
        chwReturnF: plant.chwReturnF || 54,
        cwSupplyF: plant.cwSupplyF || 85,
      }));
      toast.success(`Imported requirements from ${plant.name}`);
    }
  };

  const handleSaveSelection = async () => {
    if (!selectedChiller || !projectId) {
      toast.error('Please select a project and chiller');
      return;
    }

    const project = projects?.find(p => p.id === projectId);
    if (!project?.organization_id) {
      toast.error('Project organization not found');
      return;
    }

    await createChiller.mutateAsync({
      organization_id: project.organization_id,
      project_id: projectId,
      chw_plant_id: plantId || null,
      name: `${selectedChiller.manufacturer} ${selectedChiller.model}`,
      chiller_tag: `CH-${Date.now().toString().slice(-4)}`,
      manufacturer: selectedChiller.manufacturer,
      model_number: selectedChiller.model,
      chiller_type: selectedChiller.chillerType,
      compressor_type: selectedChiller.compressorType,
      refrigerant_type: selectedChiller.refrigerant,
      rated_capacity_tons: selectedChiller.capacityTons,
      rated_capacity_kw: selectedChiller.capacityKw,
      rated_eer: selectedChiller.eer,
      rated_cop: selectedChiller.cop,
      rated_iplv: selectedChiller.iplv,
      part_load_100_kw_per_ton: selectedChiller.partLoad.pct100,
      part_load_75_kw_per_ton: selectedChiller.partLoad.pct75,
      part_load_50_kw_per_ton: selectedChiller.partLoad.pct50,
      part_load_25_kw_per_ton: selectedChiller.partLoad.pct25,
      chw_supply_temp_f: requirements.chwSupplyF || 44,
      chw_return_temp_f: requirements.chwReturnF || 54,
      cw_supply_temp_f: requirements.cwSupplyF || 85,
      voltage: selectedChiller.voltage,
      full_load_amps: selectedChiller.fla,
      power_input_kw: selectedChiller.powerInputKw,
      saso_certified: selectedChiller.sasoCompliant,
      ahri_certified: selectedChiller.ahriCertified,
      ahri_certificate_number: selectedChiller.ahriCertNumber || null,
      sound_power_level_db: selectedChiller.soundDb,
      list_price_sar: selectedChiller.listPriceSar,
      status: 'selected',
    });
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    if (!savedSelections || savedSelections.length === 0) {
      toast.error('No saved selections to export');
      return;
    }

    const project = projects?.find(p => p.id === projectId);
    const chillerRows = savedSelections.map(s => ({
      tag: s.chiller_tag || '',
      manufacturer: s.manufacturer || '',
      model: s.model_number || '',
      chillerType: s.chiller_type,
      capacityTons: s.rated_capacity_tons,
      eer: s.rated_eer || 0,
      iplv: s.rated_iplv || 0,
      cop: s.rated_cop || 0,
      refrigerant: s.refrigerant_type || '',
      voltage: s.voltage || '',
      fla: s.full_load_amps || 0,
      powerKw: s.power_input_kw || 0,
      chwFlow: s.chw_flow_gpm || 0,
      cwFlow: s.cw_flow_gpm || 0,
      dutyType: s.duty_type || 'duty',
    }));

    const options = {
      projectName: project?.name || 'Untitled Project',
      preparedBy: user?.email || 'Unknown',
      date: new Date().toLocaleDateString(),
    };

    if (format === 'pdf') {
      exportChillerScheduleToPDF(chillerRows, options);
      toast.success('PDF exported successfully');
    } else {
      exportChillerScheduleToExcel(chillerRows, options);
      toast.success('Excel exported successfully');
    }
  };

  const annualEnergy = selectedChiller 
    ? calculateAnnualEnergy(selectedChiller.capacityTons, selectedChiller.partLoad)
    : null;

  const baseline = selectedChiller 
    ? ASHRAE_90_1_MINIMUMS[selectedChiller.chillerType]
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
              <h1 className="text-2xl font-bold">Chiller Selection</h1>
              <p className="text-muted-foreground">
                Select chillers with AHRI performance data and IPLV analysis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ActiveEditorsIndicator 
              entityType="chiller_selection"
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
            entityType="chiller_selection"
            entityId={projectId!}
            currentRevisionNumber={0}
            onReload={handleReloadLatest}
            onForceSave={handleForceSave}
          />
        )}

        {/* Data Flow Import Handler */}
        {projectId && (
          <DataFlowImportHandler
            projectId={projectId}
            currentTool="chiller-selection"
            layout="grid"
            showEmptySources={false}
            onImportLoadData={handleImportLoadData}
            onImportCHWPlantData={handleImportCHWPlantData}
          />
        )}

        {/* Tool Page Header with Stage Locking and Validation */}
        <ToolPageHeader
          toolType="chiller-selection"
          toolName="Chiller Selection"
          projectId={projectId}
          showLockButton={true}
          showValidation={true}
        />

        {/* Main Content - 3 Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Requirements */}
          <div className="lg:col-span-3 space-y-4">
            <ChillerRequirementsPanel
              requirements={requirements}
              onRequirementsChange={setRequirements}
              onImportFromPlant={handleImportFromPlant}
              hasPlantData={!!linkedPlant}
              plantName={linkedPlant?.plant_name}
              selectedChiller={selectedChiller}
            />
          </div>

          {/* Center Panel - Catalog */}
          <div className="lg:col-span-6">
            <Card>
              <CardHeader>
                <CardTitle>Chiller Catalog</CardTitle>
              </CardHeader>
              <CardContent>
                <ChillerCatalogTable
                  requiredCapacityTons={requirements.requiredCapacityTons}
                  onSelectChiller={setSelectedChiller}
                  selectedChillerId={selectedChiller?.id}
                  filterType={filterType}
                  onFilterTypeChange={setFilterType}
                  chwSupplyF={requirements.chwSupplyF}
                  cwSupplyF={requirements.cwSupplyF}
                  ambientDesignF={requirements.ambientDesignF}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Selection & Analysis */}
          <div className="lg:col-span-3 space-y-4">
            <ChillerSelectionSummary
              selectedChiller={selectedChiller}
              requirements={requirements}
              onSave={handleSaveSelection}
              isSaving={createChiller.isPending}
            />

            {selectedChiller && (
              <>
                <IplvComparisonCard
                  chillerType={selectedChiller.chillerType}
                  selectedIplv={selectedChiller.iplv}
                  selectedEer={selectedChiller.eer}
                  selectedCop={selectedChiller.cop}
                  targetIplv={requirements.minIplv}
                  annualEnergySavingsKwh={annualEnergy?.annualKwh}
                  annualCostSavingsSar={annualEnergy?.annualCostSar}
                />

                <PartLoadAnalysisChart
                  partLoad={selectedChiller.partLoad}
                  chillerType={selectedChiller.chillerType}
                  capacityTons={selectedChiller.capacityTons}
                  manufacturerName={selectedChiller.manufacturer}
                  modelNumber={selectedChiller.model}
                />
              </>
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
              entityType="chiller_selection"
              entityId={undefined}
              data={{ requirements, selectedChiller }}
              suggestedName={selectedChiller ? `${selectedChiller.manufacturer} ${selectedChiller.model}` : 'Chiller Selection'}
            />

            <DesignAlternativesManager
              open={showAlternativesManager}
              onOpenChange={setShowAlternativesManager}
              entityType="chiller_selection"
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
