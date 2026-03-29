import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProjects } from '@/hooks/useProjects';
import { useCoilSelections, useCreateCoilSelection } from '@/hooks/useCoilSelections';
import { useProfile } from '@/hooks/useOrganization';
import { useSelectionToolsExport, CoilScheduleRow } from '@/hooks/useSelectionToolsExport';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { CrossToolValidationAlert } from '@/components/design/CrossToolValidationAlert';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { DataFlowImportHandler, ImportLoadData, ImportAHUData } from '@/components/design/DataFlowImportHandler';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { useConflictDetection } from '@/hooks/useConflictDetection';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { PreSaveValidationAlert } from '@/components/design/PreSaveValidationAlert';
import { useQueryClient } from '@tanstack/react-query';
import {
  COIL_CATALOG,
  selectCoil,
  calculateCoolingCoilCapacity,
  calculateHeatingCoilCapacity,
  type CoilType,
  type FluidType,
  type CoilRequirements,
} from '@/lib/coil-selection-calculations';
import { Snowflake, Flame, ArrowLeft, Search, AlertTriangle, Save, Table, BarChart3, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

export default function CoilSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: profile } = useProfile();
  
  const projectId = searchParams.get('project') || '';
  const { data: projects } = useProjects();
  const { data: existingCoils } = useCoilSelections(projectId);
  const createCoilMutation = useCreateCoilSelection();
  const { exportCoilScheduleToPDF, exportCoilScheduleToExcel } = useSelectionToolsExport();
  
  const [selectedProjectId, setSelectedProjectId] = useState(projectId);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyMatching, setShowOnlyMatching] = useState(false);
  const [selectedCoilId, setSelectedCoilId] = useState<string | null>(null);
  const [selectionName, setSelectionName] = useState('');

  // Phase 5.3: Concurrent Editing
  const queryClient = useQueryClient();
  const { hasConflict, latestRevision, clearConflict } = useConflictDetection({
    entityType: 'coil_selection',
    entityId: selectedProjectId || null,
    currentRevisionNumber: 0,
  });

  const handleReloadLatest = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['coil-selections'] });
    clearConflict();
    toast.info('Reloaded latest version');
  }, [queryClient, clearConflict]);

  const handleForceSave = useCallback(() => {
    clearConflict();
  }, [clearConflict]);

  // Stage lock and pre-save validation via unified hook
  const { canSave, blockers, warnings, isLocked } = useToolValidation(
    selectedProjectId || null,
    'coil-selection',
    { checkStageLock: true }
  );
  
  // Coil requirements
  const [coilType, setCoilType] = useState<CoilType>('cooling');
  const [fluidType, setFluidType] = useState<FluidType>('water');
  const [designCfm, setDesignCfm] = useState(5000);
  const [enteringDbF, setEnteringDbF] = useState(80);
  const [leavingDbF, setLeavingDbF] = useState(55);
  const [enteringWbF, setEnteringWbF] = useState(67);
  const [leavingWbF, setLeavingWbF] = useState(54);
  const [supplyTempF, setSupplyTempF] = useState(44);
  const [returnTempF, setReturnTempF] = useState(56);
  const [maxAirPdIn, setMaxAirPdIn] = useState(0.5);
  const [maxWaterPdFt, setMaxWaterPdFt] = useState(15);
  const [maxFaceVelocity, setMaxFaceVelocity] = useState(550);
  
  // Calculate required capacity
  const calculatedCapacity = useMemo(() => {
    if (coilType === 'cooling') {
      return calculateCoolingCoilCapacity(designCfm, enteringDbF, leavingDbF, enteringWbF, leavingWbF);
    } else {
      return calculateHeatingCoilCapacity(designCfm, enteringDbF, leavingDbF);
    }
  }, [coilType, designCfm, enteringDbF, leavingDbF, enteringWbF, leavingWbF]);
  
  // Get required capacity in tons
  const requiredCapacityTons = useMemo(() => {
    if (coilType === 'cooling') {
      return (calculatedCapacity as ReturnType<typeof calculateCoolingCoilCapacity>).totalTons;
    } else {
      // Convert MBH to approximate tons for heating
      return (calculatedCapacity as ReturnType<typeof calculateHeatingCoilCapacity>).capacityMbh / 12;
    }
  }, [coilType, calculatedCapacity]);
  
  // Build requirements object
  const requirements: CoilRequirements = useMemo(() => ({
    coilType,
    designCfm,
    enteringAirDbF: enteringDbF,
    leavingAirDbF: leavingDbF,
    enteringAirWbF: coilType === 'cooling' ? enteringWbF : undefined,
    leavingAirWbF: coilType === 'cooling' ? leavingWbF : undefined,
    fluidType,
    supplyTempF,
    returnTempF,
    maxAirPressureDropIn: maxAirPdIn,
    maxWaterPressureDropFt: maxWaterPdFt,
    maxFaceVelocityFpm: maxFaceVelocity,
  }), [coilType, designCfm, enteringDbF, leavingDbF, enteringWbF, leavingWbF, fluidType, supplyTempF, returnTempF, maxAirPdIn, maxWaterPdFt, maxFaceVelocity]);
  
  // Select best coil
  const selectionResult = useMemo(() => {
    return selectCoil(requirements);
  }, [requirements]);
  
  // Filter catalog for display
  const filteredCatalog = useMemo(() => {
    let coils = COIL_CATALOG.filter(c => c.type === coilType);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      coils = coils.filter(c =>
        c.manufacturer.toLowerCase().includes(query) ||
        c.model.toLowerCase().includes(query)
      );
    }
    
    // Sort by capacity match
    coils.sort((a, b) => {
      const diffA = Math.abs(a.capacityTons - requiredCapacityTons);
      const diffB = Math.abs(b.capacityTons - requiredCapacityTons);
      return diffA - diffB;
    });
    
    if (showOnlyMatching) {
      // Show only coils with capacity >= required and within 150%
      coils = coils.filter(c => 
        c.capacityTons >= requiredCapacityTons && 
        c.capacityTons <= requiredCapacityTons * 1.5
      );
    }
    
    return coils;
  }, [coilType, searchQuery, showOnlyMatching, requiredCapacityTons]);
  
  const selectedCatalogCoil = useMemo(() => {
    if (!selectedCoilId) return null;
    return COIL_CATALOG.find(c => c.model === selectedCoilId);
  }, [selectedCoilId]);
  
  // Save selection
  const handleSave = async () => {
    if (!profile?.organization_id || !selectionName.trim()) {
      toast.error('Please provide a name for this selection');
      return;
    }
    
    const coilToSave = selectedCatalogCoil || selectionResult?.selectedCoil;
    if (!coilToSave) {
      toast.error('Please select a coil');
      return;
    }
    
    const operatingPoint = selectionResult?.operatingPoint;
    
    await createCoilMutation.mutateAsync({
      organization_id: profile.organization_id,
      project_id: selectedProjectId || null,
      name: selectionName,
      coil_type: coilType,
      manufacturer: coilToSave.manufacturer,
      model_number: coilToSave.model,
      rows: coilToSave.rows,
      fins_per_inch: coilToSave.finsPerInch,
      face_area_sqft: coilToSave.faceAreaSqFt,
      capacity_tons: coilType === 'cooling' ? operatingPoint?.capacity || coilToSave.capacityTons : null,
      capacity_mbh: coilType !== 'cooling' ? (operatingPoint?.capacity || coilToSave.capacityTons) * 12 : null,
      air_pressure_drop_in: operatingPoint?.airPressureDrop || coilToSave.airPressureDropIn,
      water_pressure_drop_ft: operatingPoint?.waterPressureDrop || coilToSave.waterPressureDropFt,
      design_cfm: designCfm,
      entering_air_db_f: enteringDbF,
      leaving_air_db_f: leavingDbF,
      entering_air_wb_f: coilType === 'cooling' ? enteringWbF : null,
      leaving_air_wb_f: coilType === 'cooling' ? leavingWbF : null,
      supply_temp_f: supplyTempF,
      return_temp_f: returnTempF,
      water_flow_gpm: operatingPoint?.waterFlow,
      face_velocity_fpm: operatingPoint?.faceVelocity,
      fluid_type: fluidType,
      status: 'draft',
    });
    
    setSelectionName('');
    toast.success('Coil selection saved');
  };

  // Import handlers for DataFlowImportHandler
  const handleImportLoadData = (data: ImportLoadData) => {
    if (data.items.length > 0) {
      const largestZone = data.items.reduce((max, item) => 
        item.cfm > max.cfm ? item : max, data.items[0]);
      setDesignCfm(largestZone.cfm);
      toast.success(`Imported ${largestZone.cfm.toLocaleString()} CFM from ${largestZone.name}`);
    }
  };

  const handleImportAHUData = (data: ImportAHUData) => {
    if (data.totalDesignCfm > 0) {
      setDesignCfm(data.totalDesignCfm);
      toast.success(`Imported ${data.totalDesignCfm.toLocaleString()} CFM from AHU configuration`);
    }
  };

  // Export handlers
  const selectedProject = projects?.find(p => p.id === selectedProjectId);
  
  const handleExport = (format: 'pdf' | 'excel') => {
    if (!existingCoils?.length) {
      toast.error('No coil selections to export');
      return;
    }

    const rows: CoilScheduleRow[] = existingCoils.map((coil, idx) => ({
      tag: coil.name || `COIL-${String(idx + 1).padStart(2, '0')}`,
      type: coil.coil_type || 'cooling',
      manufacturer: coil.manufacturer || '-',
      model: coil.model_number || '-',
      capacityTons: coil.capacity_tons || undefined,
      capacityMbh: coil.capacity_mbh || undefined,
      cfm: coil.design_cfm || 0,
      rows: coil.rows || 0,
      fpi: coil.fins_per_inch || 0,
      faceVelocity: coil.face_velocity_fpm || 0,
      waterFlowGpm: coil.water_flow_gpm || 0,
      pressureDropFt: coil.water_pressure_drop_ft || 0,
      airPressureDropIn: coil.air_pressure_drop_in || 0,
    }));

    const options = {
      projectName: selectedProject?.name || 'Untitled Project',
      projectId: selectedProjectId,
    };

    if (format === 'pdf') {
      exportCoilScheduleToPDF(rows, options);
    } else {
      exportCoilScheduleToExcel(rows, options);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Workflow Progress Bar */}
        <DesignWorkflowProgressBar projectId={selectedProjectId} />
        
        {/* Cross-Tool Validation Alert */}
        <CrossToolValidationAlert
          projectId={selectedProjectId}
          currentTool="coil-selection"
          variant="alert"
          className="mb-4"
        />
        
        {/* Data Flow Suggestions */}
        <DataFlowSuggestions
          projectId={selectedProjectId}
          currentTool="coil-selection"
          variant="alert"
          className="mb-4"
        />
        
        {/* Data Flow Import Handler */}
        <DataFlowImportHandler
          projectId={selectedProjectId}
          currentTool="coil-selection"
          className="mb-4"
          onImportLoadData={handleImportLoadData}
          onImportAHUData={handleImportAHUData}
        />

        {/* Tool Page Header with Stage Locking */}
        <ToolPageHeader
          toolType="coil-selection"
          toolName="Coil Selection"
          projectId={selectedProjectId || null}
          showLockButton={!!selectedProjectId}
          showValidation={!!selectedProjectId}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/design')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <Breadcrumbs
                items={[
                  { label: 'Design Tools', href: '/design' },
                  { label: 'Coil Selection' },
                ]}
              />
              <h1 className="text-2xl font-bold text-foreground mt-1">Coil Selection Tool</h1>
              <p className="text-muted-foreground text-sm">
                Select and size cooling/heating coils with performance analysis
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ActiveEditorsIndicator 
              entityType="coil_selection"
              entityId={selectedProjectId || null}
              projectId={selectedProjectId}
            />
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!existingCoils?.length}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Schedule
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border">
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export to PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export to Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Phase 5.3: Edit Conflict Warning */}
        {hasConflict && latestRevision && selectedProjectId && (
          <EditConflictWarning
            entityType="coil_selection"
            entityId={selectedProjectId}
            currentRevisionNumber={0}
            onReload={handleReloadLatest}
            onForceSave={handleForceSave}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Requirements */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  {coilType === 'cooling' ? <Snowflake className="h-4 w-4" /> : <Flame className="h-4 w-4" />}
                  Coil Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Project (Optional)</Label>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Coil Type</Label>
                    <Select value={coilType} onValueChange={(v) => setCoilType(v as CoilType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cooling">Cooling Coil</SelectItem>
                        <SelectItem value="heating">Heating Coil</SelectItem>
                        <SelectItem value="preheat">Preheat Coil</SelectItem>
                        <SelectItem value="reheat">Reheat Coil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fluid Type</Label>
                    <Select value={fluidType} onValueChange={(v) => setFluidType(v as FluidType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="water">Chilled/Hot Water</SelectItem>
                        <SelectItem value="glycol-25">25% Glycol</SelectItem>
                        <SelectItem value="glycol-50">50% Glycol</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Design CFM</Label>
                  <Input
                    type="number"
                    value={designCfm}
                    onChange={e => setDesignCfm(Number(e.target.value))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Entering Air DB (°F)</Label>
                    <Input
                      type="number"
                      value={enteringDbF}
                      onChange={e => setEnteringDbF(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Leaving Air DB (°F)</Label>
                    <Input
                      type="number"
                      value={leavingDbF}
                      onChange={e => setLeavingDbF(Number(e.target.value))}
                    />
                  </div>
                </div>
                
                {coilType === 'cooling' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Entering WB (°F)</Label>
                      <Input
                        type="number"
                        value={enteringWbF}
                        onChange={e => setEnteringWbF(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Leaving WB (°F)</Label>
                      <Input
                        type="number"
                        value={leavingWbF}
                        onChange={e => setLeavingWbF(Number(e.target.value))}
                      />
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>{coilType === 'cooling' ? 'CHW Supply (°F)' : 'HW Supply (°F)'}</Label>
                    <Input
                      type="number"
                      value={supplyTempF}
                      onChange={e => setSupplyTempF(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{coilType === 'cooling' ? 'CHW Return (°F)' : 'HW Return (°F)'}</Label>
                    <Input
                      type="number"
                      value={returnTempF}
                      onChange={e => setReturnTempF(Number(e.target.value))}
                    />
                  </div>
                </div>
                
                {/* Calculated capacity */}
                <Alert>
                  <AlertDescription className="text-xs space-y-1">
                    <div className="font-medium">Calculated Capacity:</div>
                    {coilType === 'cooling' ? (
                      <>
                        <div>Total: {(calculatedCapacity as ReturnType<typeof calculateCoolingCoilCapacity>).totalTons.toFixed(1)} tons</div>
                        <div>Sensible: {((calculatedCapacity as ReturnType<typeof calculateCoolingCoilCapacity>).sensibleBtuh / 12000).toFixed(1)} tons</div>
                      </>
                    ) : (
                      <div>{(calculatedCapacity as ReturnType<typeof calculateHeatingCoilCapacity>).capacityMbh.toFixed(0)} MBH</div>
                    )}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Constraints
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Max Air PD (in)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={maxAirPdIn}
                      onChange={e => setMaxAirPdIn(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Max Water PD (ft)</Label>
                    <Input
                      type="number"
                      value={maxWaterPdFt}
                      onChange={e => setMaxWaterPdFt(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Max Velocity (fpm)</Label>
                    <Input
                      type="number"
                      value={maxFaceVelocity}
                      onChange={e => setMaxFaceVelocity(Number(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search manufacturer, model..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Show only matching coils</Label>
                  <Switch
                    checked={showOnlyMatching}
                    onCheckedChange={setShowOnlyMatching}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Center Panel - Coil List */}
          <div className="space-y-4">
            <Card className="h-[650px] flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    Coil Catalog
                  </span>
                  <Badge variant="secondary">{filteredCatalog.length} coils</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full px-4 pb-4">
                  <div className="space-y-2">
                    {filteredCatalog.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No coils match your criteria
                      </p>
                    ) : (
                      filteredCatalog.map((coil) => {
                        const isBestMatch = selectionResult?.selectedCoil.model === coil.model;
                        const isAlternate = selectionResult?.alternates.some(a => a.model === coil.model);
                        
                        return (
                          <div
                            key={coil.model}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedCoilId === coil.model
                                ? 'border-primary bg-primary/5'
                                : 'hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedCoilId(coil.model)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {isBestMatch && (
                                    <Badge className="text-[10px] bg-emerald-100 text-emerald-700">
                                      Best Match
                                    </Badge>
                                  )}
                                  {isAlternate && (
                                    <Badge variant="outline" className="text-[10px]">
                                      Alternate
                                    </Badge>
                                  )}
                                  <p className="font-medium text-sm truncate">
                                    {coil.manufacturer} {coil.model}
                                  </p>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {coil.rows} rows • {coil.finsPerInch} FPI • {coil.faceAreaSqFt} sq ft
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-medium text-sm">{coil.capacityTons.toFixed(1)} tons</p>
                                <p className="text-xs text-muted-foreground">{coil.airPressureDropIn}" PD</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Panel - Results */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Selection Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectionResult ? (
                  <>
                    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Best Match</span>
                        <Badge variant="secondary" className="text-emerald-600">
                          {selectionResult.fitScore.toFixed(0)}% fit
                        </Badge>
                      </div>
                      <p className="font-medium">
                        {selectionResult.selectedCoil.manufacturer} {selectionResult.selectedCoil.model}
                      </p>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Capacity:</span>
                        <span>{selectionResult.operatingPoint.capacity.toFixed(1)} tons</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Air PD:</span>
                        <span>{selectionResult.operatingPoint.airPressureDrop.toFixed(2)}" WG</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Water PD:</span>
                        <span>{selectionResult.operatingPoint.waterPressureDrop.toFixed(1)} ft</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Water Flow:</span>
                        <span>{selectionResult.operatingPoint.waterFlow.toFixed(1)} GPM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Face Velocity:</span>
                        <span>{selectionResult.operatingPoint.faceVelocity.toFixed(0)} FPM</span>
                      </div>
                    </div>
                    
                    {selectionResult.warnings.length > 0 && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {selectionResult.warnings.join('. ')}
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No suitable coil found
                  </p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pre-Save Validation Alert */}
                <PreSaveValidationAlert 
                  blockers={blockers} 
                  warnings={warnings} 
                />
                
                <div className="space-y-2">
                  <Label>Selection Name</Label>
                  <Input
                    placeholder="e.g., AHU-1 Cooling Coil"
                    value={selectionName}
                    onChange={e => setSelectionName(e.target.value)}
                  />
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleSave}
                  disabled={!canSave || !selectionName.trim() || createCoilMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {createCoilMutation.isPending ? 'Saving...' : 'Save Coil Selection'}
                </Button>
              </CardContent>
            </Card>
            
            {existingCoils && existingCoils.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Saved Selections</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[150px]">
                    <div className="space-y-2">
                      {existingCoils.map(coil => (
                        <div key={coil.id} className="p-2 border rounded text-sm">
                          <p className="font-medium">{coil.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {coil.manufacturer} {coil.model_number} • {coil.capacity_tons?.toFixed(1) || coil.capacity_mbh?.toFixed(0)} {coil.capacity_tons ? 'tons' : 'MBH'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {/* Workflow Navigation */}
        <DesignWorkflowNextStep currentPath="/design/coil-selection" projectId={selectedProjectId} />
      </div>
    </DashboardLayout>
  );
}
