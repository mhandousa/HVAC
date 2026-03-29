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
import { useFilterSelections, useCreateFilterSelection } from '@/hooks/useFilterSelections';
import { useProfile } from '@/hooks/useOrganization';
import { useSelectionToolsExport, FilterScheduleRow } from '@/hooks/useSelectionToolsExport';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { CrossToolValidationAlert } from '@/components/design/CrossToolValidationAlert';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { DataFlowImportHandler, ImportVentilationData, ImportAHUData } from '@/components/design/DataFlowImportHandler';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { useConflictDetection } from '@/hooks/useConflictDetection';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { PreSaveValidationAlert } from '@/components/design/PreSaveValidationAlert';
import { useQueryClient } from '@tanstack/react-query';
import {
  FILTER_CATALOG,
  MERV_RECOMMENDATIONS,
  selectFilter,
  getFilterTypeLabel,
  getMervRatingDescription,
  type FilterPosition,
  type FilterRequirements,
} from '@/lib/filter-selection-calculations';
import { Wind, ArrowLeft, Search, AlertTriangle, Save, Table, BarChart3, DollarSign, Leaf, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

const SPACE_TYPES = [
  { value: 'office', label: 'Office' },
  { value: 'retail', label: 'Retail' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'cleanroom', label: 'Cleanroom' },
  { value: 'laboratory', label: 'Laboratory' },
  { value: 'residential', label: 'Residential' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'school', label: 'School' },
  { value: 'restaurant', label: 'Restaurant' },
];

export default function FilterSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: profile } = useProfile();
  
  const projectId = searchParams.get('project') || '';
  const { data: projects } = useProjects();
  const { data: existingFilters } = useFilterSelections(projectId);
  const createFilterMutation = useCreateFilterSelection();
  const { exportFilterScheduleToPDF, exportFilterScheduleToExcel } = useSelectionToolsExport();
  
  const [selectedProjectId, setSelectedProjectId] = useState(projectId);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyMatching, setShowOnlyMatching] = useState(false);
  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(null);
  const [selectionName, setSelectionName] = useState('');

  // Phase 5.3: Concurrent Editing
  const queryClient = useQueryClient();
  const { hasConflict, latestRevision, clearConflict } = useConflictDetection({
    entityType: 'filter_selection',
    entityId: selectedProjectId || null,
    currentRevisionNumber: 0,
  });

  const handleReloadLatest = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['filter-selections'] });
    clearConflict();
    toast.info('Reloaded latest version');
  }, [queryClient, clearConflict]);

  const handleForceSave = useCallback(() => {
    clearConflict();
  }, [clearConflict]);

  // Stage lock and pre-save validation via unified hook
  const { canSave, blockers, warnings, isLocked } = useToolValidation(
    selectedProjectId || null,
    'filter-selection',
    { checkStageLock: true }
  );
  
  // Filter requirements
  const [filterPosition, setFilterPosition] = useState<FilterPosition>('final');
  const [designCfm, setDesignCfm] = useState(5000);
  const [spaceType, setSpaceType] = useState('office');
  const [targetMerv, setTargetMerv] = useState<number | undefined>(undefined);
  const [dustLoadFactor, setDustLoadFactor] = useState(1.5); // Saudi desert default
  const [maxCleanPdIn, setMaxCleanPdIn] = useState(0.5);
  const [maxFaceVelocity, setMaxFaceVelocity] = useState(500);
  
  // Get recommended MERV based on space type
  const recommendedMerv = useMemo(() => {
    const rec = MERV_RECOMMENDATIONS[spaceType];
    if (!rec) return { prefilter: 8, final: 13 };
    return rec;
  }, [spaceType]);
  
  // Auto-set target MERV based on position and space type
  const effectiveTargetMerv = useMemo(() => {
    if (targetMerv !== undefined) return targetMerv;
    return filterPosition === 'prefilter' ? recommendedMerv.prefilter : recommendedMerv.final;
  }, [targetMerv, filterPosition, recommendedMerv]);
  
  // Build requirements object
  const requirements: FilterRequirements = useMemo(() => ({
    designCfm,
    filterPosition,
    targetMERVRating: effectiveTargetMerv,
    maxCleanPressureDropIn: maxCleanPdIn,
    maxFaceVelocityFpm: maxFaceVelocity,
    spaceType,
    dustLoadFactor,
  }), [designCfm, filterPosition, effectiveTargetMerv, maxCleanPdIn, maxFaceVelocity, spaceType, dustLoadFactor]);
  
  // Select best filter
  const selectionResult = useMemo(() => {
    return selectFilter(requirements);
  }, [requirements]);
  
  // Filter catalog for display
  const filteredCatalog = useMemo(() => {
    let filters = FILTER_CATALOG.filter(f => 
      filterPosition === 'hepa' ? f.filterType === 'hepa' : f.filterType === 'pleated' || f.filterType === 'bag' || f.filterType === 'rigid'
    );
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filters = filters.filter(f =>
        f.manufacturer.toLowerCase().includes(query) ||
        f.model.toLowerCase().includes(query) ||
        f.filterType.toLowerCase().includes(query)
      );
    }
    
    if (showOnlyMatching && effectiveTargetMerv) {
      filters = filters.filter(f => f.mervRating >= effectiveTargetMerv);
    }
    
    // Sort by MERV rating closeness to target
    filters.sort((a, b) => {
      const diffA = Math.abs(a.mervRating - effectiveTargetMerv);
      const diffB = Math.abs(b.mervRating - effectiveTargetMerv);
      return diffA - diffB;
    });
    
    return filters;
  }, [filterPosition, searchQuery, showOnlyMatching, effectiveTargetMerv]);
  
  const selectedCatalogFilter = useMemo(() => {
    if (!selectedFilterId) return null;
    return FILTER_CATALOG.find(f => f.model === selectedFilterId);
  }, [selectedFilterId]);
  
  // Save selection
  const handleSave = async () => {
    if (!profile?.organization_id || !selectionName.trim()) {
      toast.error('Please provide a name for this selection');
      return;
    }
    
    const filterToSave = selectedCatalogFilter || selectionResult?.selectedFilter;
    if (!filterToSave) {
      toast.error('Please select a filter');
      return;
    }
    
    const operatingPoint = selectionResult?.operatingPoint;
    
    await createFilterMutation.mutateAsync({
      organization_id: profile.organization_id,
      project_id: selectedProjectId || null,
      name: selectionName,
      filter_position: filterPosition,
      manufacturer: filterToSave.manufacturer,
      model_number: filterToSave.model,
      merv_rating: filterToSave.mervRating,
      filter_type: filterToSave.filterType,
      face_velocity_fpm: operatingPoint?.faceVelocity,
      clean_pressure_drop_in: operatingPoint?.cleanPressureDrop,
      dirty_pressure_drop_in: filterToSave.dirtyPressureDropIn,
      replacement_interval_months: Math.round(filterToSave.replacementIntervalMonths / dustLoadFactor),
      quantity: selectionResult?.quantity || 1,
      design_cfm: designCfm,
      annual_energy_cost_sar: operatingPoint?.annualEnergyCostSar,
      replacement_cost_sar: operatingPoint?.annualReplacementCostSar,
      status: 'draft',
      notes: `Dust load factor: ${dustLoadFactor}`,
    });
    
    setSelectionName('');
    toast.success('Filter selection saved');
  };

  // Import handlers for DataFlowImportHandler
  const handleImportVentilationData = (data: ImportVentilationData) => {
    if (data.totalSupplyAirCfm > 0) {
      setDesignCfm(data.totalSupplyAirCfm);
      toast.success(`Imported ${data.totalSupplyAirCfm.toLocaleString()} CFM from ventilation calculations`);
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
    if (!existingFilters?.length) {
      toast.error('No filter selections to export');
      return;
    }

    const rows: FilterScheduleRow[] = existingFilters.map((filter, idx) => ({
      tag: filter.name || `FILTER-${String(idx + 1).padStart(2, '0')}`,
      position: filter.filter_position || 'final',
      mervRating: filter.merv_rating || 13,
      filterType: filter.filter_type || 'pleated',
      manufacturer: filter.manufacturer || '-',
      model: filter.model_number || '-',
      cfm: filter.design_cfm || 0,
      cleanPdIn: filter.clean_pressure_drop_in || 0,
      dirtyPdIn: filter.dirty_pressure_drop_in || 0,
      faceVelocity: filter.face_velocity_fpm || 0,
      replacementMonths: filter.replacement_interval_months || 12,
      annualEnergyCostSar: filter.annual_energy_cost_sar || 0,
      annualReplacementCostSar: filter.replacement_cost_sar || 0,
    }));

    const options = {
      projectName: selectedProject?.name || 'Untitled Project',
      projectId: selectedProjectId,
    };

    if (format === 'pdf') {
      exportFilterScheduleToPDF(rows, options);
    } else {
      exportFilterScheduleToExcel(rows, options);
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
          currentTool="filter-selection"
          variant="alert"
          className="mb-4"
        />
        
        {/* Data Flow Suggestions */}
        <DataFlowSuggestions
          projectId={selectedProjectId}
          currentTool="filter-selection"
          variant="alert"
          className="mb-4"
        />
        
        {/* Data Flow Import Handler */}
        <DataFlowImportHandler
          projectId={selectedProjectId}
          currentTool="filter-selection"
          className="mb-4"
          onImportVentilationData={handleImportVentilationData}
          onImportAHUData={handleImportAHUData}
        />

        {/* Tool Page Header with Stage Locking */}
        <ToolPageHeader
          toolType="filter-selection"
          toolName="Filter Selection"
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
                  { label: 'Filter Selection' },
                ]}
              />
              <h1 className="text-2xl font-bold text-foreground mt-1">Filter Selection Tool</h1>
              <p className="text-muted-foreground text-sm">
                Select air filters with life cycle cost analysis for desert environments
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ActiveEditorsIndicator 
              entityType="filter_selection"
              entityId={selectedProjectId || null}
              projectId={selectedProjectId}
            />
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!existingFilters?.length}>
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
            entityType="filter_selection"
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
                  <Wind className="h-4 w-4" />
                  Filter Requirements
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
                    <Label>Filter Position</Label>
                    <Select value={filterPosition} onValueChange={(v) => setFilterPosition(v as FilterPosition)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prefilter">Pre-Filter</SelectItem>
                        <SelectItem value="final">Final Filter</SelectItem>
                        <SelectItem value="hepa">HEPA</SelectItem>
                        <SelectItem value="carbon">Carbon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Space Type</Label>
                    <Select value={spaceType} onValueChange={setSpaceType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SPACE_TYPES.map(st => (
                          <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                        ))}
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
                
                <Alert>
                  <AlertDescription className="text-xs space-y-1">
                    <div className="font-medium">Recommended MERV ({spaceType}):</div>
                    <div>Pre-filter: MERV {recommendedMerv.prefilter} | Final: MERV {recommendedMerv.final}</div>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label>Target MERV Rating (Optional Override)</Label>
                  <Input
                    type="number"
                    placeholder={`Auto: ${effectiveTargetMerv}`}
                    value={targetMerv || ''}
                    onChange={e => setTargetMerv(e.target.value ? Number(e.target.value) : undefined)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {getMervRatingDescription(effectiveTargetMerv)}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Leaf className="h-4 w-4" />
                  Environmental Factors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Dust Load Factor (Desert)</Label>
                    <Badge variant="outline">{dustLoadFactor.toFixed(1)}x</Badge>
                  </div>
                  <Slider
                    value={[dustLoadFactor]}
                    onValueChange={([v]) => setDustLoadFactor(v)}
                    min={1.0}
                    max={2.5}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher values = more frequent replacement due to desert dust
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Max Clean PD (in)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={maxCleanPdIn}
                      onChange={e => setMaxCleanPdIn(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Max Face Vel (fpm)</Label>
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
                  <Label className="text-sm">Show only matching filters</Label>
                  <Switch
                    checked={showOnlyMatching}
                    onCheckedChange={setShowOnlyMatching}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Center Panel - Filter List */}
          <div className="space-y-4">
            <Card className="h-[650px] flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    Filter Catalog
                  </span>
                  <Badge variant="secondary">{filteredCatalog.length} filters</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full px-4 pb-4">
                  <div className="space-y-2">
                    {filteredCatalog.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No filters match your criteria
                      </p>
                    ) : (
                      filteredCatalog.map((filter) => {
                        const isBestMatch = selectionResult?.selectedFilter.model === filter.model;
                        const isAlternate = selectionResult?.alternates.some(a => a.model === filter.model);
                        
                        return (
                          <div
                            key={filter.model}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedFilterId === filter.model
                                ? 'border-primary bg-primary/5'
                                : 'hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedFilterId(filter.model)}
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
                                    {filter.manufacturer} {filter.model}
                                  </p>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {getFilterTypeLabel(filter.filterType)} • MERV {filter.mervRating}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <Badge variant="secondary" className="text-xs">
                                  MERV {filter.mervRating}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {filter.cleanPressureDropIn}" PD
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              Replace: {Math.round(filter.replacementIntervalMonths / dustLoadFactor)} mo
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
                        {selectionResult.selectedFilter.manufacturer} {selectionResult.selectedFilter.model}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {selectionResult.quantity} filters
                      </p>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">MERV Rating:</span>
                        <span>{selectionResult.selectedFilter.mervRating}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Face Velocity:</span>
                        <span>{selectionResult.operatingPoint.faceVelocity.toFixed(0)} FPM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Clean PD:</span>
                        <span>{selectionResult.operatingPoint.cleanPressureDrop.toFixed(2)}" WG</span>
                      </div>
                    </div>
                    
                    <div className="border-t pt-3 space-y-2 text-sm">
                      <div className="font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Annual Costs (SAR)
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Energy:</span>
                        <span>{selectionResult.operatingPoint.annualEnergyCostSar.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Replacement:</span>
                        <span>{selectionResult.operatingPoint.annualReplacementCostSar.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total:</span>
                        <span>{selectionResult.operatingPoint.totalAnnualCostSar.toLocaleString()}</span>
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
                    No suitable filter found
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
                    placeholder="e.g., AHU-1 Pre-Filter"
                    value={selectionName}
                    onChange={e => setSelectionName(e.target.value)}
                  />
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleSave}
                  disabled={!canSave || !selectionName.trim() || createFilterMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {createFilterMutation.isPending ? 'Saving...' : 'Save Filter Selection'}
                </Button>
              </CardContent>
            </Card>
            
            {existingFilters && existingFilters.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Saved Selections</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[150px]">
                    <div className="space-y-2">
                      {existingFilters.map(filter => (
                        <div key={filter.id} className="p-2 border rounded text-sm">
                          <p className="font-medium">{filter.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {filter.manufacturer} {filter.model_number} • MERV {filter.merv_rating}
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
        <DesignWorkflowNextStep currentPath="/design/filter-selection" projectId={selectedProjectId} />
      </div>
    </DashboardLayout>
  );
}
