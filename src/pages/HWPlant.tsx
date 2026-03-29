import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Save, FolderOpen, Flame, Gauge, Droplets, FileText, FileSpreadsheet, Settings2, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { CrossToolValidationAlert } from '@/components/design/CrossToolValidationAlert';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { useZoneContext } from '@/hooks/useZoneContext';
import { useProjects } from '@/hooks/useProjects';
import { useHotWaterPlants, useCreateHotWaterPlant, useDeleteHotWaterPlant, type HotWaterPlant } from '@/hooks/useHotWaterPlants';
import { useHotWaterPlantExport } from '@/hooks/useHotWaterPlantExport';
import { SaveDesignDialog } from '@/components/design/SaveDesignDialog';
import { SavedConfigurationsList, type SavedConfiguration } from '@/components/design/SavedConfigurationsList';
import { 
  sizeHotWaterPlant,
  sizeBoilers,
  sizeHWPump,
  sizeExpansionTank,
  BOILER_TYPES,
  type HWPlantConfig,
  type HWPlantResults,
  type BoilerSizing,
  type HWPumpSizing,
  type ExpansionTankSizing,
} from '@/lib/hot-water-plant-calculations';
import { toast } from 'sonner';

export default function HWPlant() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: projects } = useProjects();
  const { projectId: storedProjectId, setContext } = useZoneContext();
  
  const [activeTab, setActiveTab] = useState('load');
  const [projectId, setProjectId] = useState<string | null>(searchParams.get('project') || storedProjectId);
  
  // Sync context when project changes
  useEffect(() => {
    if (projectId) {
      setContext(projectId, null, { replace: true });
    }
  }, [projectId, setContext]);
  
  // Phase 17: Stage locking and validation
  const { canSave, isLocked } = useToolValidation(projectId, 'hw-plant', { checkStageLock: true });
  
  // Save/Load UI state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSavedList, setShowSavedList] = useState(false);
  
  // Data hooks
  const { data: savedPlants, isLoading: loadingSavedPlants } = useHotWaterPlants(projectId || undefined);
  const createPlant = useCreateHotWaterPlant();
  const deletePlant = useDeleteHotWaterPlant();
  const { exportToPdf, exportToExcel } = useHotWaterPlantExport();
  
  // Design parameters
  const [plantName, setPlantName] = useState('New HW Plant');
  const [heatingLoadBtuh, setHeatingLoadBtuh] = useState(500000);
  const [supplyTempF, setSupplyTempF] = useState(180);
  const [returnTempF, setReturnTempF] = useState(160);
  const [boilerType, setBoilerType] = useState<'condensing-gas' | 'non-condensing-gas' | 'oil-fired' | 'electric'>('condensing-gas');
  const [redundancyMode, setRedundancyMode] = useState<'N' | 'N+1'>('N+1');
  const [systemVolume, setSystemVolume] = useState(500);
  const [fillTempF, setFillTempF] = useState(50);
  const [fillPressurePsi, setFillPressurePsi] = useState(12);
  const [reliefPressurePsi, setReliefPressurePsi] = useState(30);
  
  // Calculations
  const deltaT = supplyTempF - returnTempF;
  
  // Use the comprehensive sizeHotWaterPlant function
  const plantResults: HWPlantResults | null = useMemo(() => {
    if (heatingLoadBtuh <= 0 || deltaT <= 0) return null;
    
    const config: HWPlantConfig = {
      heatingLoadBtuh,
      supplyTempF,
      returnTempF,
      boilerType,
      boilerCount: redundancyMode === 'N+1' ? 2 : 1,
      redundancyMode,
      pumpingConfig: 'primary_only',
      diversityFactor: 1.0,
      futureExpansionPercent: 10,
    };
    
    return sizeHotWaterPlant(config);
  }, [heatingLoadBtuh, supplyTempF, returnTempF, boilerType, redundancyMode, deltaT]);
  
  // Separate expansion tank calculation with custom parameters
  const tankResult: ExpansionTankSizing | null = useMemo(() => {
    if (systemVolume <= 0) return null;
    const staticHead_ft = fillPressurePsi * 2.31; // Convert psi to ft head
    return sizeExpansionTank(
      systemVolume,
      fillTempF,
      supplyTempF,
      staticHead_ft
    );
  }, [systemVolume, fillTempF, supplyTempF, fillPressurePsi]);
  
  // Current plant for export (assembled from state)
  const currentPlantForExport: HotWaterPlant | null = useMemo(() => {
    if (!plantResults) return null;
    return {
      id: '',
      organization_id: '',
      plant_name: plantName,
      plant_tag: null,
      project_id: projectId,
      heating_load_btuh: heatingLoadBtuh,
      supply_temp_f: supplyTempF,
      return_temp_f: returnTempF,
      boiler_type: boilerType,
      boiler_count: redundancyMode === 'N+1' ? 2 : 1,
      redundancy_mode: redundancyMode,
      pumping_config: 'primary_only',
      diversity_factor: 1.0,
      future_expansion_percent: 10,
      boiler_config: plantResults.boiler ? JSON.parse(JSON.stringify(plantResults.boiler)) : null,
      primary_pump_config: plantResults.primaryPump ? JSON.parse(JSON.stringify(plantResults.primaryPump)) : null,
      secondary_pump_config: null,
      expansion_tank_config: tankResult ? JSON.parse(JSON.stringify(tankResult)) : null,
      piping_config: null,
      system_volume_gal: systemVolume,
      revision: null,
      status: 'draft',
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
    };
  }, [plantName, plantResults, tankResult, heatingLoadBtuh, supplyTempF, returnTempF, boilerType, redundancyMode, systemVolume, projectId]);
  
  // Transform saved plants to SavedConfiguration format
  const savedConfigurations: SavedConfiguration[] = useMemo(() => {
    if (!savedPlants) return [];
    return savedPlants.map(plant => ({
      id: plant.id,
      name: plant.plant_name,
      projectId: plant.project_id,
      projectName: projects?.find(p => p.id === plant.project_id)?.name,
      status: plant.status || undefined,
      createdAt: plant.created_at,
      updatedAt: plant.updated_at,
    }));
  }, [savedPlants, projects]);
  
  const handleSave = async (data: { name: string; projectId: string | null; notes: string }) => {
    await createPlant.mutateAsync({
      plant_name: data.name,
      project_id: data.projectId,
      heating_load_btuh: heatingLoadBtuh,
      supply_temp_f: supplyTempF,
      return_temp_f: returnTempF,
      boiler_type: boilerType,
      boiler_count: redundancyMode === 'N+1' ? 2 : 1,
      redundancy_mode: redundancyMode,
      boiler_config: plantResults?.boiler ? JSON.parse(JSON.stringify(plantResults.boiler)) : null,
      primary_pump_config: plantResults?.primaryPump ? JSON.parse(JSON.stringify(plantResults.primaryPump)) : null,
      expansion_tank_config: tankResult ? JSON.parse(JSON.stringify(tankResult)) : null,
      system_volume_gal: systemVolume,
      notes: data.notes,
    });
  };
  
  const handleLoadConfiguration = (id: string) => {
    const config = savedPlants?.find(p => p.id === id);
    if (!config) return;
    
    setPlantName(config.plant_name);
    setHeatingLoadBtuh(config.heating_load_btuh);
    setSupplyTempF(config.supply_temp_f || 180);
    setReturnTempF(config.return_temp_f || 160);
    setBoilerType((config.boiler_type as typeof boilerType) || 'condensing-gas');
    setRedundancyMode((config.redundancy_mode as 'N' | 'N+1') || 'N+1');
    setSystemVolume(config.system_volume_gal || 500);
    if (config.project_id) setProjectId(config.project_id);
    setShowSavedList(false);
    toast.success('Configuration loaded');
  };
  
  const handleDeleteConfiguration = (id: string) => {
    deletePlant.mutate(id);
  };
  
  const handleExport = () => {
    toast.info('Export feature coming soon');
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
          toolType="hw-plant"
          toolName="Hot Water Plant Sizing"
          projectId={projectId}
          showLockButton={true}
          showValidation={true}
        />

        {/* Phase 18: Edit Conflict Warning */}
        <EditConflictWarning
          entityType="hw_plant"
          entityId={projectId}
          currentRevisionNumber={0}
          onReload={() => window.location.reload()}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Breadcrumbs
              items={[
                { label: 'Design', href: '/design' },
                { label: 'Hot Water Plant Sizing' },
              ]}
            />
            <div className="flex items-center gap-3">
              <Flame className="h-8 w-8 text-orange-500" />
              <div>
                <h1 className="text-2xl font-bold">Hot Water Plant Sizing</h1>
                <p className="text-muted-foreground">Size boilers, HW pumps, and expansion tanks</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={projectId || ''} onValueChange={setProjectId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Link to project..." />
              </SelectTrigger>
              <SelectContent>
                {projects?.map(project => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Sheet open={showSavedList} onOpenChange={setShowSavedList}>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Load
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Saved Configurations</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <SavedConfigurationsList
                    title="Hot Water Plants"
                    configurations={savedConfigurations}
                    isLoading={loadingSavedPlants}
                    onLoad={handleLoadConfiguration}
                    onDelete={handleDeleteConfiguration}
                    isDeleting={deletePlant.isPending}
                    emptyMessage="No saved hot water plant configurations"
                  />
                </div>
              </SheetContent>
            </Sheet>
            
            <ActiveEditorsIndicator
              entityType="hw_plant"
              entityId={projectId || null}
              projectId={projectId || undefined}
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!currentPlantForExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => currentPlantForExport && exportToPdf(currentPlantForExport, projects?.find(p => p.id === projectId)?.name)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => currentPlantForExport && exportToExcel(currentPlantForExport, projects?.find(p => p.id === projectId)?.name)}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              onClick={() => setShowSaveDialog(true)}
              disabled={!canSave || isLocked || createPlant.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
        
        {/* Save Dialog */}
        <SaveDesignDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          title="Save Hot Water Plant"
          description="Save this plant configuration for future reference"
          defaultName={plantName}
          defaultProjectId={projectId}
          onSave={handleSave}
          isSaving={createPlant.isPending}
        />
        
        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="load">Load Input</TabsTrigger>
            <TabsTrigger value="boilers">Boilers</TabsTrigger>
            <TabsTrigger value="pumps">Pumps</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="load" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  Design Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Plant Name</Label>
                    <Input 
                      value={plantName} 
                      onChange={(e) => setPlantName(e.target.value)} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Heating Load (BTU/h)</Label>
                    <Input 
                      type="number" 
                      value={heatingLoadBtuh} 
                      onChange={(e) => setHeatingLoadBtuh(Number(e.target.value))} 
                    />
                    <p className="text-xs text-muted-foreground">
                      {(heatingLoadBtuh / 3412).toFixed(1)} kW
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Supply Temperature (°F)</Label>
                    <Input 
                      type="number" 
                      value={supplyTempF} 
                      onChange={(e) => setSupplyTempF(Number(e.target.value))} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Return Temperature (°F)</Label>
                    <Input 
                      type="number" 
                      value={returnTempF} 
                      onChange={(e) => setReturnTempF(Number(e.target.value))} 
                    />
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-4 flex flex-col items-center justify-center">
                    <span className="text-sm text-muted-foreground">ΔT</span>
                    <span className="text-2xl font-bold">{deltaT}°F</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="h-5 w-5" />
                  Expansion Tank Parameters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label>System Volume (gal)</Label>
                    <Input 
                      type="number" 
                      value={systemVolume} 
                      onChange={(e) => setSystemVolume(Number(e.target.value))} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Fill Temperature (°F)</Label>
                    <Input 
                      type="number" 
                      value={fillTempF} 
                      onChange={(e) => setFillTempF(Number(e.target.value))} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Fill Pressure (psi)</Label>
                    <Input 
                      type="number" 
                      value={fillPressurePsi} 
                      onChange={(e) => setFillPressurePsi(Number(e.target.value))} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Relief Pressure (psi)</Label>
                    <Input 
                      type="number" 
                      value={reliefPressurePsi} 
                      onChange={(e) => setReliefPressurePsi(Number(e.target.value))} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="boilers" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5" />
                  Boiler Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Boiler Type</Label>
                    <Select 
                      value={boilerType} 
                      onValueChange={(v: 'condensing-gas' | 'non-condensing-gas' | 'oil-fired' | 'electric') => setBoilerType(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BOILER_TYPES.map(bt => (
                          <SelectItem key={bt.id} value={bt.id}>
                            {bt.name} ({(bt.minEfficiency * 100).toFixed(0)}% eff)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {boilerType === 'condensing-gas' 
                        ? 'Higher efficiency, requires condensate drain' 
                        : boilerType === 'electric'
                        ? 'No combustion, 100% efficient at point of use'
                        : 'Standard efficiency, proven reliability'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Redundancy Mode</Label>
                    <Select 
                      value={redundancyMode} 
                      onValueChange={(v: 'N' | 'N+1') => setRedundancyMode(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="N">N (No Redundancy)</SelectItem>
                        <SelectItem value="N+1">N+1 (One Standby)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {plantResults?.boiler && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Required Capacity</p>
                      <p className="text-2xl font-bold">{(plantResults.boiler.requiredCapacity_btuh / 1000).toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">MBH</p>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Number of Boilers</p>
                      <p className="text-2xl font-bold text-primary">{redundancyMode === 'N+1' ? 2 : 1}</p>
                      <p className="text-xs text-muted-foreground">units ({redundancyMode})</p>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Each Boiler</p>
                      <p className="text-2xl font-bold">{(plantResults.boiler.capacityPerBoiler_btuh / 1000).toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">MBH</p>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Efficiency</p>
                      <p className="text-2xl font-bold text-primary">{(plantResults.boiler.efficiency * 100).toFixed(0)}%</p>
                      <p className="text-xs text-muted-foreground">thermal</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pumps" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  Hot Water Pump Sizing
                </CardTitle>
              </CardHeader>
              <CardContent>
                {plantResults?.primaryPump ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Flow Rate</p>
                      <p className="text-2xl font-bold">{plantResults.primaryPump.flowGpm.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">GPM</p>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Pump Head</p>
                      <p className="text-2xl font-bold">{plantResults.primaryPump.headFt.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">ft</p>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Motor Size</p>
                      <p className="text-2xl font-bold">{plantResults.primaryPump.motorHp.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">HP</p>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Power</p>
                      <p className="text-2xl font-bold">{(plantResults.primaryPump.motorHp * 0.746).toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">kW</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Enter heating load and temperature data to calculate pump sizing
                  </p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="h-5 w-5" />
                  Expansion Tank Sizing
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tankResult ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Expansion Volume</p>
                      <p className="text-2xl font-bold">{tankResult.expansionVolume_gal.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">gallons</p>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Selected Size</p>
                      <p className="text-2xl font-bold text-primary">{tankResult.tankVolume_gal}</p>
                      <p className="text-xs text-muted-foreground">gallons (std)</p>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Acceptance Factor</p>
                      <p className="text-2xl font-bold">{(tankResult.acceptanceFactor * 100).toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">AF</p>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Fill Pressure</p>
                      <p className="text-2xl font-bold">{tankResult.fillPressure_psi.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">psi</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Enter system volume and pressure data to calculate tank sizing
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="summary" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Plant Summary - {plantName}
                </CardTitle>
                <CardDescription>
                  Complete hot water plant sizing results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {plantResults ? (
                  <div className="space-y-6">
                    {/* Design Conditions */}
                    <div>
                      <h4 className="font-medium mb-3">Design Conditions</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="p-3 bg-muted/30 rounded">
                          <span className="text-muted-foreground">Heating Load:</span>
                          <p className="font-medium">{(heatingLoadBtuh / 1000).toFixed(0)} MBH</p>
                        </div>
                        <div className="p-3 bg-muted/30 rounded">
                          <span className="text-muted-foreground">Supply/Return:</span>
                          <p className="font-medium">{supplyTempF}°F / {returnTempF}°F</p>
                        </div>
                        <div className="p-3 bg-muted/30 rounded">
                          <span className="text-muted-foreground">Delta T:</span>
                          <p className="font-medium">{deltaT}°F</p>
                        </div>
                        <div className="p-3 bg-muted/30 rounded">
                          <span className="text-muted-foreground">Flow Rate:</span>
                          <p className="font-medium">{plantResults.primaryPump.flowGpm.toFixed(0)} GPM</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Boiler Summary */}
                    <div>
                      <h4 className="font-medium mb-3">Boilers</h4>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {redundancyMode === 'N+1' ? 2 : 1}× {BOILER_TYPES.find(b => b.id === boilerType)?.name || boilerType}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Each: {(plantResults.boiler.capacityPerBoiler_btuh / 1000).toFixed(0)} MBH | 
                              Total: {(plantResults.boiler.totalInstalledCapacity_btuh / 1000).toFixed(0)} MBH
                            </p>
                          </div>
                          <Badge>{(plantResults.boiler.efficiency * 100).toFixed(0)}% Eff</Badge>
                        </div>
                      </div>
                    </div>
                    
                    {/* Pump Summary */}
                    <div>
                      <h4 className="font-medium mb-3">Primary Pump</h4>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">HW Circulating Pump</p>
                            <p className="text-sm text-muted-foreground">
                              {plantResults.primaryPump.flowGpm.toFixed(0)} GPM @ {plantResults.primaryPump.headFt.toFixed(0)} ft
                            </p>
                          </div>
                          <Badge variant="outline">{plantResults.primaryPump.motorHp.toFixed(1)} HP</Badge>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expansion Tank */}
                    {tankResult && (
                      <div>
                        <h4 className="font-medium mb-3">Expansion Tank</h4>
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Bladder-Type Expansion Tank</p>
                              <p className="text-sm text-muted-foreground">
                                Fill Pressure: {tankResult.fillPressure_psi.toFixed(1)} psi
                              </p>
                            </div>
                            <Badge variant="outline">{tankResult.tankVolume_gal} gal</Badge>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Piping */}
                    <div>
                      <h4 className="font-medium mb-3">Header Piping</h4>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Supply & Return Headers</p>
                            <p className="text-sm text-muted-foreground">
                              Based on {plantResults.primaryPump.flowGpm.toFixed(0)} GPM flow
                            </p>
                          </div>
                          <Badge variant="outline">{plantResults.pipingSize.supply}" NPS</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Enter design parameters to generate plant summary
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Workflow Navigation */}
        <DesignWorkflowNextStep 
          currentPath="/hw-plant"
          projectId={projectId}
          variant="inline"
        />
      </div>
    </DashboardLayout>
  );
}
