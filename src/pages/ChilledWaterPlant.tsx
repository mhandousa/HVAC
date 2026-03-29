import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Save, FolderOpen, ArrowLeft, Factory } from 'lucide-react';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { CrossToolValidationAlert } from '@/components/design/CrossToolValidationAlert';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';

import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { PlantLoadInput } from '@/components/chw-plant/PlantLoadInput';
import { ChillerConfigPanel } from '@/components/chw-plant/ChillerConfigPanel';
import { PumpConfigPanel } from '@/components/chw-plant/PumpConfigPanel';
import { CoolingTowerPanel } from '@/components/chw-plant/CoolingTowerPanel';
import { PlantSchematic } from '@/components/chw-plant/PlantSchematic';
import { PlantSummaryReport } from '@/components/chw-plant/PlantSummaryReport';
import { SavePlantDialog } from '@/components/chw-plant/SavePlantDialog';

import {
  useChilledWaterPlants,
  useChilledWaterPlant,
  useCreateChilledWaterPlant,
  useUpdateChilledWaterPlant,
  type ChillerConfig,
  type PumpConfig,
  type CoolingTowerConfig,
  type HeaderPipeConfig,
  type ChilledWaterPlant as ChilledWaterPlantType,
} from '@/hooks/useChilledWaterPlants';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ChilledWaterPlant() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const plantId = searchParams.get('id');
  
  // Load existing plant if editing
  const { data: existingPlant, isLoading: isLoadingPlant } = useChilledWaterPlant(plantId || undefined);
  const { data: savedPlants } = useChilledWaterPlants();
  const createPlant = useCreateChilledWaterPlant();
  const updatePlant = useUpdateChilledWaterPlant();
  
  // State
  const [activeTab, setActiveTab] = useState('load');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  
  // Plant configuration state
  const [projectId, setProjectId] = useState<string | null>(existingPlant?.project_id || null);
  const [plantName, setPlantName] = useState(existingPlant?.plant_name || '');
  const [plantTag, setPlantTag] = useState(existingPlant?.plant_tag || '');
  const [notes, setNotes] = useState(existingPlant?.notes || '');
  const [status, setStatus] = useState(existingPlant?.status || 'draft');
  const [revision, setRevision] = useState(existingPlant?.revision || 'A');
  
  // Phase 17: Stage locking and validation
  const { canSave, isLocked } = useToolValidation(projectId, 'chw-plant', { checkStageLock: true });
  
  // Design parameters
  const [designLoadTons, setDesignLoadTons] = useState(existingPlant?.design_cooling_load_tons || 500);
  const [diversityFactor, setDiversityFactor] = useState(existingPlant?.diversity_factor || 0.9);
  const [futureExpansionPercent, setFutureExpansionPercent] = useState(existingPlant?.future_expansion_percent || 10);
  const [chwSupplyTempF, setChwSupplyTempF] = useState(existingPlant?.chw_supply_temp_f || 44);
  const [chwReturnTempF, setChwReturnTempF] = useState(existingPlant?.chw_return_temp_f || 54);
  const [cwSupplyTempF, setCwSupplyTempF] = useState(existingPlant?.cw_supply_temp_f || 85);
  const [cwReturnTempF, setCwReturnTempF] = useState(existingPlant?.cw_return_temp_f || 95);
  
  // Configuration
  const [chillerType, setChillerType] = useState<'water-cooled' | 'air-cooled'>(
    (existingPlant?.chiller_type as 'water-cooled' | 'air-cooled') || 'water-cooled'
  );
  const [pumpingConfig, setPumpingConfig] = useState<'primary-only' | 'primary-secondary' | 'variable-primary'>(
    (existingPlant?.pumping_config as 'primary-only' | 'primary-secondary' | 'variable-primary') || 'primary-secondary'
  );
  const [redundancyMode, setRedundancyMode] = useState<'n' | 'n+1' | '2n'>(
    (existingPlant?.redundancy_mode as 'n' | 'n+1' | '2n') || 'n+1'
  );
  const [manualChillerCount, setManualChillerCount] = useState<number | null>(null);
  
  // Cooling tower settings
  const [approachF, setApproachF] = useState(7);
  const [wetBulbF, setWetBulbF] = useState(78);
  const [numberOfTowerCells, setNumberOfTowerCells] = useState<number | null>(null);
  
  // Computed configs (set by child components)
  const [chillerConfig, setChillerConfig] = useState<ChillerConfig | null>(existingPlant?.chiller_config || null);
  const [primaryPumpConfig, setPrimaryPumpConfig] = useState<PumpConfig | null>(existingPlant?.primary_pump_config || null);
  const [secondaryPumpConfig, setSecondaryPumpConfig] = useState<PumpConfig | null>(existingPlant?.secondary_pump_config || null);
  const [condenserPumpConfig, setCondenserPumpConfig] = useState<PumpConfig | null>(existingPlant?.condenser_pump_config || null);
  const [coolingTowerConfig, setCoolingTowerConfig] = useState<CoolingTowerConfig | null>(existingPlant?.cooling_tower_config || null);
  const [headerPipeConfig, setHeaderPipeConfig] = useState<HeaderPipeConfig | null>(existingPlant?.header_pipe_config || null);
  
  // Derived values
  const chwDeltaT = chwReturnTempF - chwSupplyTempF;
  const cwDeltaT = cwReturnTempF - cwSupplyTempF;
  
  // Build plant object for summary
  const currentPlant: ChilledWaterPlantType = useMemo(() => ({
    id: plantId || '',
    organization_id: '',
    project_id: projectId,
    plant_name: plantName || 'New Plant',
    plant_tag: plantTag,
    design_cooling_load_tons: designLoadTons,
    diversity_factor: diversityFactor,
    future_expansion_percent: futureExpansionPercent,
    chw_supply_temp_f: chwSupplyTempF,
    chw_return_temp_f: chwReturnTempF,
    chw_delta_t_f: chwDeltaT,
    cw_supply_temp_f: cwSupplyTempF,
    cw_return_temp_f: cwReturnTempF,
    cw_delta_t_f: cwDeltaT,
    chiller_type: chillerType,
    pumping_config: pumpingConfig,
    redundancy_mode: redundancyMode,
    chiller_config: chillerConfig,
    primary_pump_config: primaryPumpConfig,
    secondary_pump_config: secondaryPumpConfig,
    condenser_pump_config: condenserPumpConfig,
    cooling_tower_config: coolingTowerConfig,
    header_pipe_config: headerPipeConfig,
    total_installed_capacity_tons: chillerConfig?.totalInstalledCapacityTons || null,
    total_primary_flow_gpm: primaryPumpConfig ? primaryPumpConfig.flowPerPumpGpm * (primaryPumpConfig.numberOfPumps - 1) : null,
    total_secondary_flow_gpm: secondaryPumpConfig ? secondaryPumpConfig.flowPerPumpGpm * (secondaryPumpConfig.numberOfPumps - 1) : null,
    total_condenser_flow_gpm: condenserPumpConfig ? condenserPumpConfig.flowPerPumpGpm * (condenserPumpConfig.numberOfPumps - 1) : null,
    notes: notes,
    status: status,
    revision: revision,
    created_by: null,
    created_at: existingPlant?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }), [
    plantId, projectId, plantName, plantTag, designLoadTons, diversityFactor, futureExpansionPercent,
    chwSupplyTempF, chwReturnTempF, chwDeltaT, cwSupplyTempF, cwReturnTempF, cwDeltaT,
    chillerType, pumpingConfig, redundancyMode, chillerConfig, primaryPumpConfig,
    secondaryPumpConfig, condenserPumpConfig, coolingTowerConfig, headerPipeConfig,
    notes, status, revision, existingPlant
  ]);
  
  // Handle save
  const handleSave = async () => {
    const plantData = {
      project_id: projectId,
      plant_name: plantName,
      plant_tag: plantTag,
      design_cooling_load_tons: designLoadTons,
      diversity_factor: diversityFactor,
      future_expansion_percent: futureExpansionPercent,
      chw_supply_temp_f: chwSupplyTempF,
      chw_return_temp_f: chwReturnTempF,
      cw_supply_temp_f: cwSupplyTempF,
      cw_return_temp_f: cwReturnTempF,
      chiller_type: chillerType,
      pumping_config: pumpingConfig,
      redundancy_mode: redundancyMode,
      chiller_config: chillerConfig || undefined,
      primary_pump_config: primaryPumpConfig || undefined,
      secondary_pump_config: secondaryPumpConfig || undefined,
      condenser_pump_config: condenserPumpConfig || undefined,
      cooling_tower_config: coolingTowerConfig || undefined,
      header_pipe_config: headerPipeConfig || undefined,
      total_installed_capacity_tons: chillerConfig?.totalInstalledCapacityTons,
      total_primary_flow_gpm: primaryPumpConfig ? primaryPumpConfig.flowPerPumpGpm * (primaryPumpConfig.numberOfPumps - 1) : undefined,
      total_secondary_flow_gpm: secondaryPumpConfig ? secondaryPumpConfig.flowPerPumpGpm * (secondaryPumpConfig.numberOfPumps - 1) : undefined,
      total_condenser_flow_gpm: condenserPumpConfig ? condenserPumpConfig.flowPerPumpGpm * (condenserPumpConfig.numberOfPumps - 1) : undefined,
      notes: notes,
      status: status,
      revision: revision,
    };
    
    if (plantId) {
      await updatePlant.mutateAsync({ id: plantId, updates: plantData });
    } else {
      const result = await createPlant.mutateAsync(plantData);
      // Update URL with new ID
      setSearchParams({ id: result.id });
    }
    
    setShowSaveDialog(false);
  };
  
  // Handle load saved plant
  const handleLoadPlant = (plant: ChilledWaterPlantType) => {
    setSearchParams({ id: plant.id });
    setProjectId(plant.project_id);
    setPlantName(plant.plant_name);
    setPlantTag(plant.plant_tag || '');
    setNotes(plant.notes || '');
    setStatus(plant.status || 'draft');
    setRevision(plant.revision || 'A');
    setDesignLoadTons(plant.design_cooling_load_tons);
    setDiversityFactor(plant.diversity_factor || 0.9);
    setFutureExpansionPercent(plant.future_expansion_percent || 10);
    setChwSupplyTempF(plant.chw_supply_temp_f || 44);
    setChwReturnTempF(plant.chw_return_temp_f || 54);
    setCwSupplyTempF(plant.cw_supply_temp_f || 85);
    setCwReturnTempF(plant.cw_return_temp_f || 95);
    setChillerType((plant.chiller_type as 'water-cooled' | 'air-cooled') || 'water-cooled');
    setPumpingConfig((plant.pumping_config as 'primary-only' | 'primary-secondary' | 'variable-primary') || 'primary-secondary');
    setRedundancyMode((plant.redundancy_mode as 'n' | 'n+1' | '2n') || 'n+1');
    setChillerConfig(plant.chiller_config);
    setPrimaryPumpConfig(plant.primary_pump_config);
    setSecondaryPumpConfig(plant.secondary_pump_config);
    setCondenserPumpConfig(plant.condenser_pump_config);
    setCoolingTowerConfig(plant.cooling_tower_config);
    setHeaderPipeConfig(plant.header_pipe_config);
    setShowLoadDialog(false);
  };
  
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }
  
  if (!user) {
    navigate('/auth');
    return null;
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Workflow Progress Bar */}
        {projectId && (
          <DesignWorkflowProgressBar
            projectId={projectId}
            variant="compact"
            showLabels={false}
            showPercentages={true}
            className="mb-2"
          />
        )}

        {/* Cross-Tool Validation Alert */}
        {projectId && (
          <CrossToolValidationAlert
            projectId={projectId}
            currentTool="equipment-selection"
            variant="alert"
          className="mb-2"
        />
        )}

        {/* Phase 17: Unified Tool Header with Stage Locking */}
        <ToolPageHeader
          toolType="chw-plant"
          toolName="Chilled Water Plant Sizing"
          projectId={projectId}
          showLockButton={true}
          showValidation={true}
        />

        {/* Phase 18: Edit Conflict Warning */}
        <EditConflictWarning
          entityType="chw_plant"
          entityId={plantId}
          currentRevisionNumber={0}
          onReload={() => window.location.reload()}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Breadcrumbs
              items={[
                { label: 'Design', href: '/design' },
                { label: 'Chilled Water Plant Sizing' },
              ]}
            />
            <div className="flex items-center gap-3">
              <Factory className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Chilled Water Plant Sizing</h1>
                <p className="text-muted-foreground">Size chillers, pumps, and cooling towers for central plants</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {savedPlants && savedPlants.length > 0 && (
              <Select
                value=""
                onValueChange={(value) => {
                  const plant = savedPlants.find(p => p.id === value);
                  if (plant) handleLoadPlant(plant);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Load Saved..." />
                </SelectTrigger>
                <SelectContent>
                  {savedPlants.map((plant) => (
                    <SelectItem key={plant.id} value={plant.id}>
                      {plant.plant_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <ActiveEditorsIndicator
              entityType="chw_plant"
              entityId={plantId || null}
              projectId={projectId || undefined}
            />
            
            <Button 
              onClick={() => setShowSaveDialog(true)}
              disabled={!canSave || isLocked || createPlant.isPending || updatePlant.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="load">Load Input</TabsTrigger>
            <TabsTrigger value="chillers">Chillers</TabsTrigger>
            <TabsTrigger value="pumps">Pumps</TabsTrigger>
            <TabsTrigger value="towers">Cooling Towers</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="load" className="mt-6">
            <PlantLoadInput
              designLoadTons={designLoadTons}
              diversityFactor={diversityFactor}
              futureExpansionPercent={futureExpansionPercent}
              chwSupplyTempF={chwSupplyTempF}
              chwReturnTempF={chwReturnTempF}
              cwSupplyTempF={cwSupplyTempF}
              cwReturnTempF={cwReturnTempF}
              projectId={projectId}
              onDesignLoadChange={setDesignLoadTons}
              onDiversityFactorChange={setDiversityFactor}
              onFutureExpansionChange={setFutureExpansionPercent}
              onChwSupplyTempChange={setChwSupplyTempF}
              onChwReturnTempChange={setChwReturnTempF}
              onCwSupplyTempChange={setCwSupplyTempF}
              onCwReturnTempChange={setCwReturnTempF}
              onProjectIdChange={setProjectId}
            />
          </TabsContent>
          
          <TabsContent value="chillers" className="mt-6">
            <ChillerConfigPanel
              designLoadTons={designLoadTons}
              diversityFactor={diversityFactor}
              futureExpansionPercent={futureExpansionPercent}
              chillerType={chillerType}
              redundancyMode={redundancyMode}
              manualChillerCount={manualChillerCount}
              onChillerTypeChange={setChillerType}
              onRedundancyModeChange={setRedundancyMode}
              onManualChillerCountChange={setManualChillerCount}
              onChillerConfigChange={setChillerConfig}
            />
          </TabsContent>
          
          <TabsContent value="pumps" className="mt-6">
            <PumpConfigPanel
              designLoadTons={designLoadTons}
              diversityFactor={diversityFactor}
              chwDeltaT={chwDeltaT}
              chillerType={chillerType}
              pumpingConfig={pumpingConfig}
              numberOfChillers={chillerConfig?.numberOfChillers || 2}
              onPumpingConfigChange={setPumpingConfig}
              onPrimaryPumpConfigChange={setPrimaryPumpConfig}
              onSecondaryPumpConfigChange={setSecondaryPumpConfig}
              onCondenserPumpConfigChange={setCondenserPumpConfig}
              onHeaderPipeConfigChange={setHeaderPipeConfig}
            />
          </TabsContent>
          
          <TabsContent value="towers" className="mt-6">
            <CoolingTowerPanel
              designLoadTons={designLoadTons}
              diversityFactor={diversityFactor}
              cwDeltaT={cwDeltaT}
              chillerType={chillerType}
              approachF={approachF}
              wetBulbF={wetBulbF}
              numberOfCells={numberOfTowerCells}
              onApproachChange={setApproachF}
              onWetBulbChange={setWetBulbF}
              onNumberOfCellsChange={setNumberOfTowerCells}
              onCoolingTowerConfigChange={setCoolingTowerConfig}
            />
          </TabsContent>
          
          <TabsContent value="summary" className="mt-6 space-y-6">
            <PlantSchematic
              chillerConfig={chillerConfig}
              primaryPumpConfig={primaryPumpConfig}
              secondaryPumpConfig={secondaryPumpConfig}
              condenserPumpConfig={condenserPumpConfig}
              coolingTowerConfig={coolingTowerConfig}
              pumpingConfig={pumpingConfig}
            />
            
            <PlantSummaryReport
              plant={currentPlant}
            />
          </TabsContent>
        </Tabs>
        
        {/* Save Dialog */}
        <SavePlantDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          plantName={plantName}
          plantTag={plantTag}
          notes={notes}
          status={status}
          revision={revision}
          onPlantNameChange={setPlantName}
          onPlantTagChange={setPlantTag}
          onNotesChange={setNotes}
          onStatusChange={setStatus}
          onRevisionChange={setRevision}
          onSave={handleSave}
          isSaving={createPlant.isPending || updatePlant.isPending}
          isEdit={!!plantId}
        />
        
        {/* Workflow Navigation */}
        <DesignWorkflowNextStep 
          currentPath="/design/chw-plant"
          projectId={projectId}
          variant="inline"
        />
      </div>
    </DashboardLayout>
  );
}
