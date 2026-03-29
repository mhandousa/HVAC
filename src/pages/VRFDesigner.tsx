import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { useZoneContext } from '@/hooks/useZoneContext';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from '@/components/ui/resizable';
import { 
  Save, 
  Plus, 
  FileDown, 
  Calculator,
  Settings,
  LayoutGrid,
  GitBranch,
  FileText,
  Droplets,
  ChevronLeft,
  FolderKanban,
  ArrowRight,
} from 'lucide-react';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { CrossToolValidationAlert } from '@/components/design/CrossToolValidationAlert';
import { ZoneContextBanner } from '@/components/design/ZoneContextBanner';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { useQueryClient } from '@tanstack/react-query';

import { VRFSystemConfigPanel } from '@/components/vrf-design/VRFSystemConfigPanel';
import { VRFIndoorUnitPanel } from '@/components/vrf-design/VRFIndoorUnitPanel';
import { VRFPipingTreeView } from '@/components/vrf-design/VRFPipingTreeView';
import { RefrigerantPipeSizeCalculator } from '@/components/vrf-design/RefrigerantPipeSizeCalculator';
import { VRFBranchSelectorPanel } from '@/components/vrf-design/VRFBranchSelectorPanel';
import { VRFOilReturnAnalysis } from '@/components/vrf-design/VRFOilReturnAnalysis';
import { VRFSummaryReport } from '@/components/vrf-design/VRFSummaryReport';
import { VRFFittingsLibrary } from '@/components/vrf-design/VRFFittingsLibrary';
import { ImportFromLoadCalcDialog } from '@/components/vrf-design/ImportFromLoadCalcDialog';
import { SyncFromLoadCalcDialog } from '@/components/vrf-design/SyncFromLoadCalcDialog';
import { useProjects } from '@/hooks/useProjects';
import {
  useVRFSystems,
  useVRFSystem,
  useVRFIndoorUnits,
  useVRFBranchSelectors,
  useCreateVRFSystem,
  useUpdateVRFSystem,
  useAddIndoorUnit,
  useUpdateIndoorUnit,
  useRemoveIndoorUnit,
  useAddBranchSelector,
  useUpdateBranchSelector,
  useRemoveBranchSelector,
  type VRFSystem,
} from '@/hooks/useVRFSystems';
import { useVRFPipingSizing } from '@/hooks/useVRFPipingSizing';
import { toast } from 'sonner';
import type { RefrigerantType, LineType } from '@/lib/vrf-refrigerant-calculations';

export default function VRFDesigner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const systemId = searchParams.get('id');
  
  // Zone context persistence
  const { projectId: storedProjectId, setContext } = useZoneContext();
  const projectIdFromUrl = searchParams.get('project') || storedProjectId;
  
  const [activeTab, setActiveTab] = useState('setup');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectIdFromUrl);
  const [localSystem, setLocalSystem] = useState<Partial<VRFSystem>>({
    system_name: '',
    refrigerant_type: 'R410A',
    system_type: 'heat_pump',
    number_of_outdoor_units: 1,
    max_piping_length_ft: 540,
    max_elevation_diff_ft: 160,
    first_branch_max_length_ft: 130,
    status: 'draft',
    revision: 'A',
    project_id: projectIdFromUrl || undefined,
  });
  
  // Queries
  const { data: projects = [] } = useProjects();
  const { data: allSystems = [] } = useVRFSystems();
  // Filter systems by selected project
  const systems = selectedProjectId 
    ? allSystems.filter(s => s.project_id === selectedProjectId)
    : allSystems;
  const { data: existingSystem } = useVRFSystem(systemId || undefined);
  const { data: units = [] } = useVRFIndoorUnits(systemId || '');
  const { data: branchSelectors = [] } = useVRFBranchSelectors(systemId || '');
  
  // Mutations
  const createSystem = useCreateVRFSystem();
  const updateSystem = useUpdateVRFSystem();
  const addIndoorUnit = useAddIndoorUnit();
  const updateIndoorUnit = useUpdateIndoorUnit();
  const removeIndoorUnit = useRemoveIndoorUnit();
  const addBranchSelector = useAddBranchSelector();
  const updateBranchSelector = useUpdateBranchSelector();
  const removeBranchSelector = useRemoveBranchSelector();
  
  // Piping sizing
  const { sizeAllUnits, calculateSystemSummary } = useVRFPipingSizing(
    (localSystem.refrigerant_type as RefrigerantType) || 'R410A'
  );

  // Pre-Save Validation with stage locking
  const { canSave, blockers, warnings, isLocked } = useToolValidation(
    selectedProjectId || null,
    'vrf-system',
    { checkStageLock: true }
  );
  
  // Load existing system
  useEffect(() => {
    if (existingSystem) {
      setLocalSystem(existingSystem);
      if (existingSystem.project_id) {
        setSelectedProjectId(existingSystem.project_id);
      }
    }
  }, [existingSystem]);

  // Sync project_id to localSystem when selectedProjectId changes
  useEffect(() => {
    if (selectedProjectId && !systemId) {
      setLocalSystem(prev => ({ ...prev, project_id: selectedProjectId }));
    }
  }, [selectedProjectId, systemId]);

  const linkedProject = projects.find(p => p.id === selectedProjectId);
  
  const handleSaveSystem = async () => {
    if (!localSystem.system_name) {
      toast.error('Please enter a system name');
      return;
    }
    
    try {
      if (systemId) {
        await updateSystem.mutateAsync({ id: systemId, ...localSystem });
      } else {
        const result = await createSystem.mutateAsync(localSystem);
        setSearchParams({ id: result.id });
      }
    } catch (error) {
      // Error handled by mutation
    }
  };
  
  const handleCalculatePiping = () => {
    if (!systemId || units.length === 0) {
      toast.error('Add indoor units first');
      return;
    }
    
    const results = sizeAllUnits(units, branchSelectors);
    
    // Update each unit with calculated sizes
    results.forEach((result, unitId) => {
      updateIndoorUnit.mutate({
        id: unitId,
        liquid_line_size_in: result.liquid.recommendedSize.od,
        suction_line_size_in: result.suction.recommendedSize.od,
        liquid_velocity_fps: result.liquid.velocity_fps,
        suction_velocity_fps: result.suction.velocity_fps,
        liquid_line_pressure_drop_psi: result.liquid.pressureDrop_psi,
        suction_line_pressure_drop_psi: result.suction.pressureDrop_psi,
        oil_return_ok: result.suction.oilReturnOk,
      });
    });
    
    // Update system totals
    const summary = calculateSystemSummary(localSystem as VRFSystem, units);
    updateSystem.mutate({
      id: systemId,
      total_indoor_capacity_kw: summary.totalIndoorCapacity,
      total_indoor_capacity_tons: summary.totalIndoorCapacity / 3.517,
      capacity_ratio: summary.capacityRatio,
      total_liquid_line_length_ft: summary.totalPipingLength,
      oil_return_verified: summary.allUnitsOilReturnOk,
      max_piping_length_actual_ft: summary.totalPipingLength,
      actual_elevation_diff_ft: summary.maxElevation,
    });
    
    toast.success('Piping calculated for all units');
  };
  
  const handleApplySize = (lineType: LineType, sizeOd: number) => {
    if (!selectedUnitId) {
      toast.error('Select an indoor unit first');
      return;
    }
    
    const update: Record<string, number> = {};
    if (lineType === 'liquid') {
      update.liquid_line_size_in = sizeOd;
    } else if (lineType === 'suction') {
      update.suction_line_size_in = sizeOd;
    }
    
    updateIndoorUnit.mutate({ id: selectedUnitId, ...update });
  };
  
  const handleSelectSystem = (id: string) => {
    setSearchParams({ id });
  };
  
  const handleNewSystem = () => {
    const newParams: Record<string, string> = {};
    if (selectedProjectId) {
      newParams.project = selectedProjectId;
    }
    setSearchParams(newParams);
    setLocalSystem({
      system_name: '',
      refrigerant_type: 'R410A',
      system_type: 'heat_pump',
      number_of_outdoor_units: 1,
      max_piping_length_ft: 540,
      max_elevation_diff_ft: 160,
      first_branch_max_length_ft: 130,
      status: 'draft',
      revision: 'A',
      project_id: selectedProjectId || undefined,
    });
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId === 'all' ? null : projectId);
    if (projectId !== 'all') {
      setSearchParams({ project: projectId });
    } else {
      setSearchParams({});
    }
  };
  
  const isHeatRecovery = localSystem.system_type === 'heat_recovery';

  const handleImportFromLoadCalc = (unitsToCreate: Partial<typeof units[0]>[]) => {
    unitsToCreate.forEach(unit => {
      addIndoorUnit.mutate(unit);
    });
    toast.success(`Imported ${unitsToCreate.length} indoor units from load calculations`);
  };

  const handleSyncFromLoadCalc = (updates: { id: string; cooling_capacity_kw: number; heating_capacity_kw: number }[]) => {
    updates.forEach(update => {
      updateIndoorUnit.mutate({
        id: update.id,
        cooling_capacity_kw: update.cooling_capacity_kw,
        heating_capacity_kw: update.heating_capacity_kw,
      });
    });
    toast.success(`Updated ${updates.length} indoor unit(s) from load calculations`);
  };
  
  const breadcrumbItems = useMemo(() => {
    const items = [];
    if (linkedProject) {
      items.push({ label: linkedProject.name, href: `/projects/${linkedProject.id}` });
    }
    items.push(
      { label: 'Design Tools', href: '/design' },
      { label: 'VRF Systems' },
      { label: 'VRF Designer' }
    );
    return items;
  }, [linkedProject]);

  const handleBack = () => {
    if (selectedProjectId) {
      navigate(`/projects/${selectedProjectId}`);
    } else {
      navigate('/design');
    }
  };
  
  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              {linkedProject ? linkedProject.name : 'Design Tools'}
            </Button>
            <h1 className="text-2xl font-bold">VRF System Designer</h1>
            
            {/* Project Filter */}
            <Select value={selectedProjectId || 'all'} onValueChange={handleProjectChange}>
              <SelectTrigger className="w-48">
                <FolderKanban className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* System Selector */}
            <Select value={systemId || ''} onValueChange={handleSelectSystem}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select or create system" />
              </SelectTrigger>
              <SelectContent>
                {systems.length === 0 ? (
                  <SelectItem value="" disabled>
                    No systems {selectedProjectId ? 'in this project' : ''}
                  </SelectItem>
                ) : (
                  systems.map(sys => (
                    <SelectItem key={sys.id} value={sys.id}>
                      {sys.system_tag || sys.system_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleNewSystem}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            {systemId && (
              <Badge variant={localSystem.status === 'approved' ? 'default' : 'secondary'}>
                {localSystem.status} - Rev {localSystem.revision}
              </Badge>
            )}
            <ActiveEditorsIndicator
              entityType="vrf_system"
              entityId={systemId || null}
              projectId={selectedProjectId || undefined}
            />
            <Button variant="outline" onClick={handleCalculatePiping} disabled={!systemId}>
              <Calculator className="h-4 w-4 mr-2" />
              Calculate Piping
            </Button>
            <Button onClick={handleSaveSystem} disabled={!canSave || isLocked}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Workflow Progress Bar */}
        {selectedProjectId && (
          <div className="px-6 py-2 border-b">
            <DesignWorkflowProgressBar
              projectId={selectedProjectId}
              variant="compact"
              showLabels={false}
              showPercentages={true}
            />
          </div>
        )}

        {selectedProjectId && (
          <div className="px-6 py-2 space-y-2 border-b">
            <ToolPageHeader
              toolType="vrf-system"
              toolName="VRF System Designer"
              projectId={selectedProjectId}
              showLockButton={true}
              showValidation={true}
            />

            {/* Phase 18: Edit Conflict Warning */}
            <EditConflictWarning
              entityType="vrf_system"
              entityId={systemId}
              currentRevisionNumber={0}
              onReload={() => window.location.reload()}
            />

            <DataFlowSuggestions
              projectId={selectedProjectId}
              currentTool="vrf-designer"
              variant="alert"
            />
            <CrossToolValidationAlert
              projectId={selectedProjectId}
              currentTool="vrf-system"
              variant="alert"
            />
          </div>
        )}
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="border-b px-6">
            <TabsList className="h-12">
              <TabsTrigger value="setup" className="gap-2">
                <Settings className="h-4 w-4" />
                System Setup
              </TabsTrigger>
              <TabsTrigger value="units" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Indoor Units
              </TabsTrigger>
              <TabsTrigger value="piping" className="gap-2">
                <GitBranch className="h-4 w-4" />
                Piping Layout
              </TabsTrigger>
              {isHeatRecovery && (
                <TabsTrigger value="branch" className="gap-2">
                  <GitBranch className="h-4 w-4" />
                  Branch Selectors
                </TabsTrigger>
              )}
              <TabsTrigger value="oil-return" className="gap-2">
                <Droplets className="h-4 w-4" />
                Oil Return
              </TabsTrigger>
              <TabsTrigger value="summary" className="gap-2">
                <FileText className="h-4 w-4" />
                Summary
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="setup" className="h-full overflow-auto p-6 mt-0">
              <VRFSystemConfigPanel
                system={localSystem}
                onChange={(updates) => setLocalSystem(prev => ({ ...prev, ...updates }))}
              />
            </TabsContent>
            
            <TabsContent value="units" className="h-full overflow-auto p-6 mt-0">
              {systemId ? (
                <VRFIndoorUnitPanel
                  units={units}
                  branchSelectors={branchSelectors}
                  systemId={systemId}
                  systemType={localSystem.system_type as 'heat_pump' | 'heat_recovery'}
                  onAdd={(unit) => addIndoorUnit.mutate(unit)}
                  onUpdate={(unit) => updateIndoorUnit.mutate(unit)}
                  onRemove={(id) => removeIndoorUnit.mutate({ id, systemId })}
                  onImportClick={() => setShowImportDialog(true)}
                  onSyncClick={() => setShowSyncDialog(true)}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Save the system configuration first to add indoor units
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="piping" className="h-full mt-0">
              <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={40} minSize={30}>
                  <div className="h-full overflow-auto p-6">
                    <VRFPipingTreeView
                      system={systemId ? (localSystem as VRFSystem) : null}
                      units={units}
                      branchSelectors={branchSelectors}
                      selectedUnitId={selectedUnitId}
                      onSelectUnit={setSelectedUnitId}
                    />
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={60} minSize={40}>
                  <div className="h-full overflow-auto p-6 space-y-6">
                    <RefrigerantPipeSizeCalculator
                      refrigerant={(localSystem.refrigerant_type as RefrigerantType) || 'R410A'}
                      onApplySize={handleApplySize}
                    />
                    <VRFFittingsLibrary />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </TabsContent>
            
            {isHeatRecovery && (
              <TabsContent value="branch" className="h-full overflow-auto p-6 mt-0">
                {systemId ? (
                  <VRFBranchSelectorPanel
                    branchSelectors={branchSelectors}
                    units={units}
                    systemId={systemId}
                    onAdd={(bs) => addBranchSelector.mutate(bs)}
                    onUpdate={(bs) => updateBranchSelector.mutate(bs)}
                    onRemove={(id) => removeBranchSelector.mutate({ id, systemId })}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    Save the system configuration first
                  </div>
                )}
              </TabsContent>
            )}
            
            <TabsContent value="oil-return" className="h-full overflow-auto p-6 mt-0">
              <VRFOilReturnAnalysis
                units={units}
                refrigerant={(localSystem.refrigerant_type as RefrigerantType) || 'R410A'}
              />
            </TabsContent>
            
            <TabsContent value="summary" className="h-full overflow-auto p-6 mt-0">
              <VRFSummaryReport
                system={systemId ? (localSystem as VRFSystem) : null}
                units={units}
                branchSelectors={branchSelectors}
                onExport={() => toast.info('Export feature coming soon')}
              />
            </TabsContent>
          </div>
        </Tabs>
        
        {/* Footer Stats */}
        <div className="border-t px-6 py-3 bg-muted/30">
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Indoor Units: </span>
              <span className="font-medium">{units.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Capacity: </span>
              <span className="font-medium">
                {units.reduce((sum, u) => sum + u.cooling_capacity_kw, 0).toFixed(1)} kW
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Capacity Ratio: </span>
              <span className="font-medium">
                {localSystem.outdoor_unit_capacity_kw 
                  ? ((units.reduce((sum, u) => sum + u.cooling_capacity_kw, 0) / localSystem.outdoor_unit_capacity_kw) * 100).toFixed(0)
                  : '-'
                }%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Piping: </span>
              <span className="font-medium">
                {units.reduce((sum, u) => sum + u.liquid_line_length_ft, 0).toFixed(0)} ft
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Import Dialog */}
      <ImportFromLoadCalcDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        systemId={systemId || ''}
        existingUnitCount={units.length}
        projectId={localSystem.project_id}
        onImport={handleImportFromLoadCalc}
      />

      {/* Sync Dialog */}
      <SyncFromLoadCalcDialog
        open={showSyncDialog}
        onOpenChange={setShowSyncDialog}
        systemId={systemId || ''}
        units={units}
        projectId={localSystem.project_id}
        onSync={handleSyncFromLoadCalc}
      />

      {/* Design Workflow Next Step */}
      <DesignWorkflowNextStep
        currentPath="/design/vrf-designer"
        projectId={localSystem.project_id}
        stageComplete={units.length > 0}
      />
    </DashboardLayout>
  );
}
