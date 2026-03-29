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
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProjects } from '@/hooks/useProjects';
import { useCoolingTowerSelections, useCreateCoolingTowerSelection } from '@/hooks/useCoolingTowerSelections';
import { useProfile } from '@/hooks/useOrganization';
import { useSelectionToolsExport, CoolingTowerScheduleRow } from '@/hooks/useSelectionToolsExport';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { CrossToolValidationAlert } from '@/components/design/CrossToolValidationAlert';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { DataFlowImportHandler, ImportEquipmentData } from '@/components/design/DataFlowImportHandler';
import { useConflictDetection } from '@/hooks/useConflictDetection';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { useQueryClient } from '@tanstack/react-query';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import {
  COOLING_TOWER_CATALOG,
  SAUDI_DESIGN_WET_BULB,
  selectCoolingTower,
  calculateHeatRejection,
  calculateCondenserWaterFlow,
  calculateMakeupWater,
  getTowerTypeLabel,
  getFillTypeLabel,
  type TowerType,
  type CoolingTowerRequirements,
} from '@/lib/cooling-tower-calculations';
import { ArrowLeft, Search, AlertTriangle, Save, Table, BarChart3, Droplets, Thermometer, Building2, Download, FileText, FileSpreadsheet, GitBranch } from 'lucide-react';
import { toast } from 'sonner';
import { SaveAsAlternativeDialog } from '@/components/design/SaveAsAlternativeDialog';
import { DesignAlternativesManager } from '@/components/design/DesignAlternativesManager';
import { AlternativeComparisonView } from '@/components/design/AlternativeComparisonView';
import { DesignAlternative } from '@/hooks/useDesignAlternatives';

type RedundancyMode = 'N' | 'N+1' | '2N';

const SAUDI_CITIES = Object.keys(SAUDI_DESIGN_WET_BULB);

export default function CoolingTowerSizing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: profile } = useProfile();
  
  const projectId = searchParams.get('project') || '';
  const { data: projects } = useProjects();
  const { data: existingTowers } = useCoolingTowerSelections(projectId);
  const createTowerMutation = useCreateCoolingTowerSelection();
  const { exportCoolingTowerScheduleToPDF, exportCoolingTowerScheduleToExcel } = useSelectionToolsExport();
  const queryClient = useQueryClient();

  // Concurrent editing awareness
  const { hasConflict, latestRevision, clearConflict } = useConflictDetection({
    entityType: 'cooling_tower',
    entityId: projectId || null,
    currentRevisionNumber: 0,
  });

  const handleReloadLatest = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['cooling_tower_selections'] });
    clearConflict();
    toast.info('Reloaded latest version');
  }, [queryClient, clearConflict]);

  const handleForceSave = useCallback(() => {
    clearConflict();
  }, [clearConflict]);

  // Design Alternatives
  const [showSaveAlternative, setShowSaveAlternative] = useState(false);
  const [showAlternativesManager, setShowAlternativesManager] = useState(false);
  const [showAlternativeComparison, setShowAlternativeComparison] = useState(false);
  const [alternativesToCompare, setAlternativesToCompare] = useState<DesignAlternative[]>([]);

  const handleLoadAlternative = useCallback((data: Record<string, unknown>) => {
    if (data.chillerLoadTons) setChillerLoadTons(data.chillerLoadTons as number);
    if (data.chillerCop) setChillerCop(data.chillerCop as number);
    if (data.city) setCity(data.city as string);
    if (data.approachF) setApproachF(data.approachF as number);
    if (data.rangeF) setRangeF(data.rangeF as number);
    if (data.redundancy) setRedundancy(data.redundancy as RedundancyMode);
    if (data.maxCells) setMaxCells(data.maxCells as number);
    if (data.towerType) setTowerType(data.towerType as TowerType);
    if (data.selectionName) setSelectionName(data.selectionName as string);
    setShowAlternativesManager(false);
    toast.success('Alternative loaded');
  }, []);

  const handleCompareAlternatives = useCallback((alternatives: DesignAlternative[]) => {
    setAlternativesToCompare(alternatives);
    setShowAlternativeComparison(true);
    setShowAlternativesManager(false);
  }, []);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyMatching, setShowOnlyMatching] = useState(false);
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);
  const [selectionName, setSelectionName] = useState('');
  
  // Tower requirements
  const [chillerLoadTons, setChillerLoadTons] = useState(500);
  const [chillerCop, setChillerCop] = useState(5.5);
  const [city, setCity] = useState('Riyadh');
  const [approachF, setApproachF] = useState(7);
  const [rangeF, setRangeF] = useState(10);

  // Pre-save validation with stage locking
  const { canSave, isLocked, blockers, warnings } = useToolValidation(
    selectedProjectId || null,
    'cooling-tower-sizing',
    { checkStageLock: true }
  );
  const [redundancy, setRedundancy] = useState<RedundancyMode>('N+1');
  const [maxCells, setMaxCells] = useState(4);
  const [towerType, setTowerType] = useState<TowerType>('induced_draft_counterflow');
  
  // Get design wet bulb for selected city
  const designWetBulbF = useMemo(() => {
    return SAUDI_DESIGN_WET_BULB[city] || 78;
  }, [city]);
  
  // Calculate heat rejection
  const heatRejection = useMemo(() => {
    return calculateHeatRejection(chillerLoadTons, chillerCop);
  }, [chillerLoadTons, chillerCop]);
  
  // Calculate condenser water flow
  const cwFlowGpm = useMemo(() => {
    return calculateCondenserWaterFlow(heatRejection, rangeF);
  }, [heatRejection, rangeF]);
  
  // Calculate makeup water
  const makeupWater = useMemo(() => {
    return calculateMakeupWater(cwFlowGpm);
  }, [cwFlowGpm]);
  
  // Build requirements
  const requirements: CoolingTowerRequirements = useMemo(() => ({
    heatRejectionTons: heatRejection,
    condenserWaterFlowGpm: cwFlowGpm,
    designWetBulbF,
    approachF,
    rangeF,
    redundancy,
    maxCells,
    preferredTowerType: towerType,
  }), [heatRejection, cwFlowGpm, designWetBulbF, approachF, rangeF, redundancy, maxCells, towerType]);
  
  // Select best tower
  const selectionResult = useMemo(() => {
    return selectCoolingTower(requirements);
  }, [requirements]);
  
  // Filter catalog for display
  const filteredCatalog = useMemo(() => {
    let towers = COOLING_TOWER_CATALOG.filter(t => t.towerType === towerType);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      towers = towers.filter(t =>
        t.manufacturer.toLowerCase().includes(query) ||
        t.model.toLowerCase().includes(query)
      );
    }
    
    // Sort by capacity match
    const requiredPerCell = heatRejection / maxCells;
    towers.sort((a, b) => {
      const diffA = Math.abs(a.capacityTons - requiredPerCell);
      const diffB = Math.abs(b.capacityTons - requiredPerCell);
      return diffA - diffB;
    });
    
    if (showOnlyMatching) {
      towers = towers.filter(t => t.capacityTons >= requiredPerCell * 0.8);
    }
    
    return towers;
  }, [towerType, searchQuery, showOnlyMatching, heatRejection, maxCells]);
  
  // Save selection
  const handleSave = async () => {
    if (!profile?.organization_id || !selectionName.trim()) {
      toast.error('Please provide a name for this selection');
      return;
    }
    
    if (!selectionResult) {
      toast.error('No valid tower selection');
      return;
    }
    
    // Calculate per-cell capacity
    const capacityPerCell = selectionResult.totalCapacityTons / selectionResult.numberOfCells;
    
    await createTowerMutation.mutateAsync({
      organization_id: profile.organization_id,
      project_id: selectedProjectId || null,
      name: selectionName,
      manufacturer: selectionResult.selectedTower.manufacturer,
      model_number: selectionResult.selectedTower.model,
      tower_type: selectionResult.selectedTower.towerType,
      fill_type: selectionResult.selectedTower.fillType,
      material: selectionResult.selectedTower.material,
      number_of_cells: selectionResult.numberOfCells,
      capacity_per_cell_tons: capacityPerCell,
      total_capacity_tons: selectionResult.totalCapacityTons,
      design_wet_bulb_f: designWetBulbF,
      approach_f: approachF,
      range_f: rangeF,
      cw_flow_gpm: cwFlowGpm,
      cw_supply_temp_f: designWetBulbF + approachF,
      cw_return_temp_f: designWetBulbF + approachF + rangeF,
      fan_hp_per_cell: selectionResult.selectedTower.fanMotorKw / 0.746, // Convert kW to HP
      total_fan_kw: selectionResult.operatingPoint.totalFanKw,
      makeup_water_gpm: makeupWater.makeupGpm,
      blowdown_gpm: makeupWater.blowdownGpm,
      cycles_of_concentration: 5,
      drift_rate_percent: 0.005,
      status: 'draft',
    });
    
    setSelectionName('');
    toast.success('Cooling tower selection saved');
  };

  // Import handler for DataFlowImportHandler
  const handleImportEquipmentData = (data: ImportEquipmentData) => {
    if (data.totalCapacityTons > 0) {
      setChillerLoadTons(Math.round(data.totalCapacityTons));
      toast.success(`Imported ${data.totalCapacityTons.toFixed(0)} tons chiller load from equipment selections`);
    }
  };

  // Export handlers
  const selectedProject = projects?.find(p => p.id === selectedProjectId);
  
  const handleExport = (format: 'pdf' | 'excel') => {
    if (!existingTowers?.length) {
      toast.error('No cooling tower selections to export');
      return;
    }

    const rows: CoolingTowerScheduleRow[] = existingTowers.map((tower, idx) => ({
      tag: tower.name || `CT-${String(idx + 1).padStart(2, '0')}`,
      manufacturer: tower.manufacturer || '-',
      model: tower.model_number || '-',
      towerType: tower.tower_type || 'induced_draft_counterflow',
      fillType: tower.fill_type || 'film',
      numberOfCells: tower.number_of_cells || 1,
      capacityTons: tower.total_capacity_tons || 0,
      cwFlowGpm: tower.cw_flow_gpm || 0,
      approach: tower.approach_f || 7,
      range: tower.range_f || 10,
      designWetBulb: tower.design_wet_bulb_f || 78,
      fanKw: tower.total_fan_kw || 0,
      makeupGpm: tower.makeup_water_gpm || 0,
      city: city,
    }));

    const options = {
      projectName: selectedProject?.name || 'Untitled Project',
      projectId: selectedProjectId,
    };

    if (format === 'pdf') {
      exportCoolingTowerScheduleToPDF(rows, options);
    } else {
      exportCoolingTowerScheduleToExcel(rows, options);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Edit Conflict Warning */}
        {hasConflict && latestRevision && (
          <EditConflictWarning
            entityType="cooling_tower"
            entityId={selectedProjectId || ''}
            currentRevisionNumber={0}
            onReload={handleReloadLatest}
            onForceSave={handleForceSave}
          />
        )}

        {/* Workflow Progress Bar */}
        <DesignWorkflowProgressBar projectId={selectedProjectId} />
        
        {/* Cross-Tool Validation Alert */}
        <CrossToolValidationAlert
          projectId={selectedProjectId}
          currentTool="cooling-tower-sizing"
          variant="alert"
          className="mb-4"
        />
        
        {/* Data Flow Suggestions */}
        <DataFlowSuggestions
          projectId={selectedProjectId}
          currentTool="cooling-tower-sizing"
          variant="alert"
          className="mb-4"
        />
        
        {/* Data Flow Import Handler */}
        <DataFlowImportHandler
          projectId={selectedProjectId}
          currentTool="cooling-tower-sizing"
          className="mb-4"
          onImportEquipmentData={handleImportEquipmentData}
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
                  { label: 'Cooling Tower Sizing' },
                ]}
              />
              <h1 className="text-2xl font-bold text-foreground mt-1">Cooling Tower Sizing</h1>
              <p className="text-muted-foreground text-sm">
                Size and select cooling towers with Saudi climate data
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ActiveEditorsIndicator 
              entityType="cooling_tower"
              entityId={selectedProjectId || null}
              projectId={selectedProjectId || undefined}
            />
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <GitBranch className="h-4 w-4 mr-2" />
                  Alternatives
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border">
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
                <Button variant="outline" disabled={!existingTowers?.length}>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Requirements */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Thermometer className="h-4 w-4" />
                  Heat Rejection Requirements
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
                    <Label>Chiller Load (tons)</Label>
                    <Input
                      type="number"
                      value={chillerLoadTons}
                      onChange={e => setChillerLoadTons(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Chiller COP</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={chillerCop}
                      onChange={e => setChillerCop(Number(e.target.value))}
                    />
                  </div>
                </div>
                
                <Alert>
                  <AlertDescription className="text-xs space-y-1">
                    <div className="font-medium">Calculated Heat Rejection:</div>
                    <div>{heatRejection.toFixed(0)} tons</div>
                    <div className="text-muted-foreground">
                      CW Flow: {cwFlowGpm.toLocaleString()} GPM
                    </div>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label>Design City</Label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SAUDI_CITIES.map(c => (
                        <SelectItem key={c} value={c}>
                          {c} ({SAUDI_DESIGN_WET_BULB[c]}°F WB)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Approach (°F)</Label>
                    <Input
                      type="number"
                      value={approachF}
                      onChange={e => setApproachF(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Range (°F)</Label>
                    <Input
                      type="number"
                      value={rangeF}
                      onChange={e => setRangeF(Number(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Tower Type</Label>
                    <Select value={towerType} onValueChange={(v) => setTowerType(v as TowerType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="induced_draft_counterflow">Induced Draft Counterflow</SelectItem>
                        <SelectItem value="induced_draft_crossflow">Induced Draft Crossflow</SelectItem>
                        <SelectItem value="forced_draft">Forced Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Redundancy</Label>
                    <Select value={redundancy} onValueChange={(v) => setRedundancy(v as RedundancyMode)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="N">N (No Backup)</SelectItem>
                        <SelectItem value="N+1">N+1</SelectItem>
                        <SelectItem value="2N">2N (Full Backup)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Max Cells</Label>
                    <Badge variant="outline">{maxCells}</Badge>
                  </div>
                  <Slider
                    value={[maxCells]}
                    onValueChange={([v]) => setMaxCells(v)}
                    min={1}
                    max={8}
                    step={1}
                    className="w-full"
                  />
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
                  <Label className="text-sm">Show only matching towers</Label>
                  <Switch
                    checked={showOnlyMatching}
                    onCheckedChange={setShowOnlyMatching}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Center Panel - Tower List */}
          <div className="space-y-4">
            <Card className="h-[650px] flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    Cooling Tower Catalog
                  </span>
                  <Badge variant="secondary">{filteredCatalog.length} towers</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full px-4 pb-4">
                  <div className="space-y-2">
                    {filteredCatalog.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No towers match your criteria
                      </p>
                    ) : (
                      filteredCatalog.map((tower) => {
                        const isBestMatch = selectionResult?.selectedTower.model === tower.model;
                        
                        return (
                          <div
                            key={tower.model}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedTowerId === tower.model
                                ? 'border-primary bg-primary/5'
                                : 'hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedTowerId(tower.model)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {isBestMatch && (
                                    <Badge className="text-[10px] bg-emerald-100 text-emerald-700">
                                      Best Match
                                    </Badge>
                                  )}
                                  <p className="font-medium text-sm truncate">
                                    {tower.manufacturer} {tower.model}
                                  </p>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {getTowerTypeLabel(tower.towerType)} • {getFillTypeLabel(tower.fillType)}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-medium text-sm">{tower.capacityTons} tons</p>
                                <p className="text-xs text-muted-foreground">{tower.maxFlowGpm} GPM</p>
                              </div>
                            </div>
                            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Fan:</span>
                                <span className="ml-1">{tower.fanMotorKw} kW</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Sound:</span>
                                <span className="ml-1">{tower.soundLevelDb} dB</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Material:</span>
                                <span className="ml-1 capitalize">{tower.material}</span>
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
                        <span className="text-sm font-medium">Best Configuration</span>
                        <Badge variant="secondary" className="text-emerald-600">
                          {selectionResult.fitScore.toFixed(0)}% fit
                        </Badge>
                      </div>
                      <p className="font-medium">
                        {selectionResult.selectedTower.manufacturer} {selectionResult.selectedTower.model}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectionResult.numberOfCells} cells × {(selectionResult.totalCapacityTons / selectionResult.numberOfCells).toFixed(0)} tons each
                      </p>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Capacity:</span>
                        <span>{selectionResult.totalCapacityTons.toFixed(0)} tons</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Number of Cells:</span>
                        <span>{selectionResult.numberOfCells}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CW Supply:</span>
                        <span>{(designWetBulbF + approachF).toFixed(0)}°F</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CW Return:</span>
                        <span>{(designWetBulbF + approachF + rangeF).toFixed(0)}°F</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Fan Power:</span>
                        <span>{selectionResult.operatingPoint.totalFanKw.toFixed(1)} kW</span>
                      </div>
                    </div>
                    
                    <div className="border-t pt-3 space-y-2 text-sm">
                      <div className="font-medium flex items-center gap-2">
                        <Droplets className="h-4 w-4" />
                        Water Treatment
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Makeup Water:</span>
                        <span>{makeupWater.makeupGpm.toFixed(1)} GPM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Blowdown:</span>
                        <span>{makeupWater.blowdownGpm.toFixed(1)} GPM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Evaporation:</span>
                        <span>{makeupWater.evaporationGpm.toFixed(1)} GPM</span>
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
                    No suitable tower configuration found
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
                
                <div className="space-y-2">
                  <Label>Selection Name</Label>
                  <Input
                    placeholder="e.g., Main CHW Plant Towers"
                    value={selectionName}
                    onChange={e => setSelectionName(e.target.value)}
                  />
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleSave}
                  disabled={!canSave || !selectionName.trim() || createTowerMutation.isPending || !selectionResult}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {createTowerMutation.isPending ? 'Saving...' : 'Save Tower Selection'}
                </Button>
              </CardContent>
            </Card>
            
            {existingTowers && existingTowers.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Saved Selections</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[150px]">
                    <div className="space-y-2">
                      {existingTowers.map(tower => (
                        <div key={tower.id} className="p-2 border rounded text-sm">
                          <p className="font-medium">{tower.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {tower.manufacturer} {tower.model_number} • {tower.number_of_cells} cells • {tower.total_capacity_tons} tons
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
        <DesignWorkflowNextStep currentPath="/design/cooling-tower-sizing" projectId={selectedProjectId} />

        {/* Design Alternatives */}
        {selectedProjectId && (
          <>
            <SaveAsAlternativeDialog
              open={showSaveAlternative}
              onOpenChange={setShowSaveAlternative}
              projectId={selectedProjectId}
              entityType="cooling_tower"
              data={{ chillerLoadTons, chillerCop, city, approachF, rangeF, redundancy, maxCells, towerType, selectionName, heatRejection, cwFlowGpm }}
              suggestedName={`Cooling Tower - ${heatRejection.toFixed(0)} tons`}
            />

            <DesignAlternativesManager
              open={showAlternativesManager}
              onOpenChange={setShowAlternativesManager}
              entityType="cooling_tower"
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
