import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useZoneContext } from '@/hooks/useZoneContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Save, FolderOpen, Cloud, Building, ArrowUp, Wind, FileText, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { CrossToolValidationAlert } from '@/components/design/CrossToolValidationAlert';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { PreSaveValidationAlert } from '@/components/design/PreSaveValidationAlert';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { useQueryClient } from '@tanstack/react-query';
import { DataFlowImportHandler } from '@/components/design/DataFlowImportHandler';
import { usePreSaveValidation } from '@/hooks/usePreSaveValidation';
import { useProjects } from '@/hooks/useProjects';
import { useSmokeControlCalculations, useCreateSmokeControlCalculation, useDeleteSmokeControlCalculation } from '@/hooks/useSmokeControlCalculations';
import { SaveDesignDialog } from '@/components/design/SaveDesignDialog';
import { SavedConfigurationsList, type SavedConfiguration } from '@/components/design/SavedConfigurationsList';
import { 
  calculateStairwellPressurization, 
  calculateAtriumExhaust,
  STANDARD_FIRE_SIZES,
  MIN_PRESSURES_IN_WC,
  type StairwellPressurization,
  type AtriumExhaust,
  type PressurizeResult,
  type SmokeExhaustResult,
} from '@/lib/smoke-control-calculations';
import { toast } from 'sonner';

export default function SmokeControl() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: projects } = useProjects();
  
  // Zone context persistence
  const { projectId: storedProjectId, setContext } = useZoneContext();
  
  const [activeTab, setActiveTab] = useState('stairwell');
  const [projectId, setProjectId] = useState<string | null>(searchParams.get('project') || storedProjectId);
  
  // Sync context when project changes
  useEffect(() => {
    if (projectId) {
      setContext(projectId, null, { replace: true });
    }
  }, [projectId, setContext]);
  
  // Save/Load UI state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSavedList, setShowSavedList] = useState(false);
  
  // Data hooks
  const { data: savedCalculations, isLoading: loadingSaved } = useSmokeControlCalculations(projectId || undefined);
  const createCalculation = useCreateSmokeControlCalculation();
  const deleteCalculation = useDeleteSmokeControlCalculation();
  
  // Pre-save validation
  const { canSave, blockers, warnings } = usePreSaveValidation(projectId, 'smoke-control');
  
  // Stairwell parameters
  const [stairwellFloors, setStairwellFloors] = useState(10);
  const [stairwellWidth, setStairwellWidth] = useState(8);
  const [stairwellDepth, setStairwellDepth] = useState(20);
  const [floorHeight, setFloorHeight] = useState(12);
  const [doorWidthFt, setDoorWidthFt] = useState(3);
  const [doorHeightFt, setDoorHeightFt] = useState(7);
  const [doorsOpenSimultaneously, setDoorsOpenSimultaneously] = useState(3);
  const [pressureDiffInWc, setPressureDiffInWc] = useState(0.1);
  
  // Atrium parameters
  const [atriumFloorArea, setAtriumFloorArea] = useState(5000);
  const [atriumPerimeter, setAtriumPerimeter] = useState(300);
  const [fireHRR, setFireHRR] = useState(5000000); // BTU/s - default for sprinklered atrium
  const [atriumHeight, setAtriumHeight] = useState(60);
  const [smokeLayerHeight, setSmokeLayerHeight] = useState(40);
  const [ambientTempF, setAmbientTempF] = useState(70);
  const [makeupAirTempF, setMakeupAirTempF] = useState(70);
  
  // Stairwell calculation
  const stairwellResult: PressurizeResult | null = useMemo(() => {
    const stairwellHeight = stairwellFloors * floorHeight;
    const stairwellArea = stairwellWidth * stairwellDepth;
    
    return calculateStairwellPressurization({
      stairwellHeight_ft: stairwellHeight,
      stairwellArea_sqft: stairwellArea,
      numberOfDoors: stairwellFloors,
      doorWidth_ft: doorWidthFt,
      doorHeight_ft: doorHeightFt,
      simultaneousDoorsOpen: doorsOpenSimultaneously,
      targetPressure_inWC: pressureDiffInWc,
      stackEffectConsideration: true,
      winterOutdoorTemp_F: 40,
      indoorTemp_F: 72,
    });
  }, [stairwellFloors, stairwellWidth, stairwellDepth, floorHeight, doorWidthFt, doorHeightFt, doorsOpenSimultaneously, pressureDiffInWc]);
  
  // Atrium calculation
  const atriumResult: SmokeExhaustResult | null = useMemo(() => {
    return calculateAtriumExhaust({
      atriumHeight_ft: atriumHeight,
      atriumFloorArea_sqft: atriumFloorArea,
      fireSize_btu_s: fireHRR,
      smokeLayerHeight_ft: smokeLayerHeight,
      perimeter_ft: atriumPerimeter,
      makeupAirTemp_F: makeupAirTempF,
      ambientTemp_F: ambientTempF,
    });
  }, [fireHRR, atriumHeight, atriumFloorArea, smokeLayerHeight, atriumPerimeter, makeupAirTempF, ambientTempF]);
  
  // Makeup air from result
  const makeupAirCfm = atriumResult?.makeupAirRate_cfm ?? 0;
  
  // Transform saved calculations to SavedConfiguration format
  const savedConfigurations: SavedConfiguration[] = useMemo(() => {
    if (!savedCalculations) return [];
    return savedCalculations.map(calc => ({
      id: calc.id,
      name: calc.calculation_name,
      projectId: calc.project_id,
      projectName: projects?.find(p => p.id === calc.project_id)?.name,
      status: calc.status || undefined,
      createdAt: calc.created_at,
      updatedAt: calc.updated_at,
    }));
  }, [savedCalculations, projects]);
  
  const handleSave = async (data: { name: string; projectId: string | null; notes: string }) => {
    await createCalculation.mutateAsync({
      calculation_name: data.name,
      project_id: data.projectId,
      calculation_type: activeTab === 'stairwell' ? 'stairwell' : 'atrium',
      reference_standard: 'NFPA 92',
      space_height_ft: activeTab === 'stairwell' ? stairwellFloors * floorHeight : atriumHeight,
      space_area_sqft: activeTab === 'stairwell' ? stairwellWidth * stairwellDepth : atriumFloorArea,
      number_of_doors: stairwellFloors,
      door_width_ft: doorWidthFt,
      door_height_ft: doorHeightFt,
      simultaneous_doors_open: doorsOpenSimultaneously,
      target_pressure_in_wc: pressureDiffInWc,
      fire_size_btu_s: fireHRR,
      smoke_layer_height_ft: smokeLayerHeight,
      perimeter_ft: atriumPerimeter,
      ambient_temp_f: ambientTempF,
      makeup_air_temp_f: makeupAirTempF,
      pressurization_result: stairwellResult as any,
      exhaust_result: atriumResult as any,
      notes: data.notes,
    });
  };
  
  const handleLoadConfiguration = (id: string) => {
    const config = savedCalculations?.find(c => c.id === id);
    if (!config) return;
    
    if (config.calculation_type === 'stairwell') {
      setActiveTab('stairwell');
      if (config.space_height_ft && config.space_area_sqft) {
        setStairwellFloors(Math.round(config.space_height_ft / 12));
        const area = config.space_area_sqft;
        setStairwellWidth(Math.round(Math.sqrt(area / 2.5)));
        setStairwellDepth(Math.round(area / stairwellWidth));
      }
      if (config.number_of_doors) setStairwellFloors(config.number_of_doors);
      if (config.door_width_ft) setDoorWidthFt(config.door_width_ft);
      if (config.door_height_ft) setDoorHeightFt(config.door_height_ft);
      if (config.simultaneous_doors_open) setDoorsOpenSimultaneously(config.simultaneous_doors_open);
      if (config.target_pressure_in_wc) setPressureDiffInWc(config.target_pressure_in_wc);
    } else {
      setActiveTab('atrium');
      if (config.space_height_ft) setAtriumHeight(config.space_height_ft);
      if (config.space_area_sqft) setAtriumFloorArea(config.space_area_sqft);
      if (config.fire_size_btu_s) setFireHRR(config.fire_size_btu_s);
      if (config.smoke_layer_height_ft) setSmokeLayerHeight(config.smoke_layer_height_ft);
      if (config.perimeter_ft) setAtriumPerimeter(config.perimeter_ft);
      if (config.ambient_temp_f) setAmbientTempF(config.ambient_temp_f);
      if (config.makeup_air_temp_f) setMakeupAirTempF(config.makeup_air_temp_f);
    }
    
    if (config.project_id) setProjectId(config.project_id);
    setShowSavedList(false);
    toast.success('Configuration loaded');
  };
  
  const handleDeleteConfiguration = (id: string) => {
    deleteCalculation.mutate(id);
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
            currentTool="load-calculation"
            variant="alert"
            className="mb-2"
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Breadcrumbs
              items={[
                { label: 'Design', href: '/design' },
                { label: 'Smoke Control Calculator' },
              ]}
            />
            <div className="flex items-center gap-3">
              <Cloud className="h-8 w-8 text-slate-500" />
              <div>
                <h1 className="text-2xl font-bold">Smoke Control Calculator</h1>
                <p className="text-muted-foreground">NFPA 92 stairwell pressurization and atrium smoke exhaust</p>
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
                  <SheetTitle>Saved Calculations</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <SavedConfigurationsList
                    title="Smoke Control Calculations"
                    configurations={savedConfigurations}
                    isLoading={loadingSaved}
                    onLoad={handleLoadConfiguration}
                    onDelete={handleDeleteConfiguration}
                    isDeleting={deleteCalculation.isPending}
                    emptyMessage="No saved smoke control calculations"
                  />
                </div>
              </SheetContent>
            </Sheet>
            
            <ActiveEditorsIndicator
              entityType="smoke_control"
              entityId={projectId || null}
              projectId={projectId || undefined}
            />
            
            <Button onClick={() => setShowSaveDialog(true)} disabled={!canSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
        
        {/* Pre-Save Validation Alert */}
        <PreSaveValidationAlert blockers={blockers} warnings={warnings} className="mb-4" />
        
        {/* Phase 18: Edit Conflict Warning */}
        <EditConflictWarning
          entityType="smoke_control"
          entityId={projectId}
          currentRevisionNumber={0}
          onReload={() => window.location.reload()}
        />
        
        {/* DataFlow Import Handler */}
        {projectId && (
          <DataFlowImportHandler
            projectId={projectId}
            currentTool="smoke-control"
            onImportLoadData={(data) => {
              if (data.totalCoolingTons && data.totalCoolingTons > 0) {
                toast.success(`Load data available: ${data.totalCoolingTons.toLocaleString()} tons`);
              }
            }}
          />
        )}
        
        {/* Save Dialog */}
        <SaveDesignDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          title="Save Smoke Control Calculation"
          description="Save this calculation for future reference"
          defaultName={`Smoke Control - ${activeTab === 'stairwell' ? 'Stairwell' : 'Atrium'}`}
          defaultProjectId={projectId}
          onSave={handleSave}
          isSaving={createCalculation.isPending}
        />
        
        {/* Code Reference */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Code Reference</AlertTitle>
          <AlertDescription>
            Calculations based on NFPA 92 Standard for Smoke Control Systems and IBC Chapter 9. 
            Always verify with local code requirements and AHJ.
          </AlertDescription>
        </Alert>
        
        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="stairwell" className="gap-2">
              <ArrowUp className="h-4 w-4" />
              Stairwell Pressurization
            </TabsTrigger>
            <TabsTrigger value="atrium" className="gap-2">
              <Building className="h-4 w-4" />
              Atrium Exhaust
            </TabsTrigger>
            <TabsTrigger value="summary" className="gap-2">
              <FileText className="h-4 w-4" />
              Summary
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="stairwell" className="mt-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Stairwell Geometry</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Number of Floors</Label>
                      <Input 
                        type="number" 
                        value={stairwellFloors} 
                        onChange={(e) => setStairwellFloors(Number(e.target.value))} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Floor Height (ft)</Label>
                      <Input 
                        type="number" 
                        value={floorHeight} 
                        onChange={(e) => setFloorHeight(Number(e.target.value))} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Width (ft)</Label>
                      <Input 
                        type="number" 
                        value={stairwellWidth} 
                        onChange={(e) => setStairwellWidth(Number(e.target.value))} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Depth (ft)</Label>
                      <Input 
                        type="number" 
                        value={stairwellDepth} 
                        onChange={(e) => setStairwellDepth(Number(e.target.value))} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Door & Pressure Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Door Width (ft)</Label>
                      <Input 
                        type="number" 
                        step="0.5"
                        value={doorWidthFt} 
                        onChange={(e) => setDoorWidthFt(Number(e.target.value))} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Door Height (ft)</Label>
                      <Input 
                        type="number" 
                        step="0.5"
                        value={doorHeightFt} 
                        onChange={(e) => setDoorHeightFt(Number(e.target.value))} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Doors Open (simultaneous)</Label>
                      <Input 
                        type="number" 
                        value={doorsOpenSimultaneously} 
                        onChange={(e) => setDoorsOpenSimultaneously(Number(e.target.value))} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Pressure Diff. (in. WC)</Label>
                      <Input 
                        type="number" 
                        step="0.01"
                        value={pressureDiffInWc} 
                        onChange={(e) => setPressureDiffInWc(Number(e.target.value))} 
                      />
                      <p className="text-xs text-muted-foreground">
                        Min {MIN_PRESSURES_IN_WC.stairwell_min} in. WC per NFPA 92
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {stairwellResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wind className="h-5 w-5" />
                    Pressurization Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Total Supply Air</p>
                      <p className="text-2xl font-bold text-primary">
                        {stairwellResult.supplyAir_cfm.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">CFM</p>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Total Door Leakage</p>
                      <p className="text-2xl font-bold">
                        {stairwellResult.doorLeakage_cfm.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">CFM (all doors)</p>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Fan Static</p>
                      <p className="text-2xl font-bold">{stairwellResult.fanPressure_inWC.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">in. WC</p>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Number of Fans</p>
                      <p className="text-2xl font-bold">
                        {stairwellResult.numberOfFans}
                      </p>
                      <p className="text-xs text-muted-foreground">units</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Design Notes:</strong> Provide supply air injection at multiple levels 
                      (typically every 3 floors) to ensure uniform pressurization. Consider vestibule 
                      pressurization for high-rise buildings.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="atrium" className="mt-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Fire Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Fire Size Preset</Label>
                    <Select 
                      value={fireHRR.toString()} 
                      onValueChange={(v) => setFireHRR(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STANDARD_FIRE_SIZES.map(fire => (
                          <SelectItem key={fire.name} value={fire.btu_s.toString()}>
                            {fire.name} ({(fire.btu_s / 1000).toFixed(0)}k BTU/s)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Design fire per NFPA 92 / IBC
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Custom Fire HRR (BTU/s)</Label>
                    <Input 
                      type="number" 
                      value={fireHRR} 
                      onChange={(e) => setFireHRR(Number(e.target.value))} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Ambient Temperature (°F)</Label>
                    <Input 
                      type="number" 
                      value={ambientTempF} 
                      onChange={(e) => setAmbientTempF(Number(e.target.value))} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Makeup Air Temperature (°F)</Label>
                    <Input 
                      type="number" 
                      value={makeupAirTempF} 
                      onChange={(e) => setMakeupAirTempF(Number(e.target.value))} 
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Atrium Geometry</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Atrium Height (ft)</Label>
                    <Input 
                      type="number" 
                      value={atriumHeight} 
                      onChange={(e) => setAtriumHeight(Number(e.target.value))} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Floor Area (sq ft)</Label>
                    <Input 
                      type="number" 
                      value={atriumFloorArea} 
                      onChange={(e) => setAtriumFloorArea(Number(e.target.value))} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Perimeter (ft)</Label>
                    <Input 
                      type="number" 
                      value={atriumPerimeter} 
                      onChange={(e) => setAtriumPerimeter(Number(e.target.value))} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Clear Height / Smoke Layer (ft)</Label>
                    <Input 
                      type="number" 
                      value={smokeLayerHeight} 
                      onChange={(e) => setSmokeLayerHeight(Number(e.target.value))} 
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum clear height above highest occupied level
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {atriumResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wind className="h-5 w-5" />
                    Exhaust System Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Exhaust Rate</p>
                      <p className="text-2xl font-bold text-primary">
                        {atriumResult.exhaustRate_cfm.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">CFM</p>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Makeup Air</p>
                      <p className="text-2xl font-bold">
                        {atriumResult.makeupAirRate_cfm.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">CFM</p>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Smoke Layer Temp</p>
                      <p className="text-2xl font-bold">{atriumResult.smokeLayerTemp_F.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">°F</p>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">Fan Power</p>
                      <p className="text-2xl font-bold">
                        {(atriumResult.exhaustRate_cfm / 1000 * 0.5).toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">HP (est)</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Design Notes:</strong> Exhaust fans must be rated for {atriumResult.smokeLayerTemp_F.toFixed(0)}°F. 
                      Provide makeup air at low level (below smoke layer). Tenability analysis may be required.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="summary" className="mt-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {stairwellResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowUp className="h-5 w-5" />
                      Stairwell Pressurization Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Stairwell Height</span>
                        <span>{stairwellFloors * floorHeight} ft ({stairwellFloors} floors)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Target Pressure</span>
                        <span>{pressureDiffInWc} in. WC</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Supply Air Required</span>
                        <span className="font-medium">{stairwellResult.supplyAir_cfm.toLocaleString()} CFM</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fan Static Pressure</span>
                        <span>{stairwellResult.fanPressure_inWC.toFixed(2)} in. WC</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Number of Fans</span>
                        <span>{stairwellResult.numberOfFans}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {atriumResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Atrium Exhaust Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Atrium Height</span>
                        <span>{atriumHeight} ft</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Design Fire</span>
                        <span>{(fireHRR / 1000).toFixed(0)}k BTU/s</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Exhaust Rate</span>
                        <span className="font-medium">{atriumResult.exhaustRate_cfm.toLocaleString()} CFM</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Makeup Air</span>
                        <span>{atriumResult.makeupAirRate_cfm.toLocaleString()} CFM</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Smoke Layer Temp</span>
                        <span>{atriumResult.smokeLayerTemp_F.toFixed(0)}°F</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Workflow Navigation */}
        <DesignWorkflowNextStep 
          currentPath="/design/smoke-control"
          projectId={projectId}
          variant="inline"
        />
      </div>
    </DashboardLayout>
  );
}
