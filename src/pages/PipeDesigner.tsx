import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useZoneContext } from '@/hooks/useZoneContext';
import { usePreSaveValidation } from '@/hooks/usePreSaveValidation';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { PreSaveValidationAlert } from '@/components/design/PreSaveValidationAlert';
import {
  Droplets,
  Plus,
  Save,
  FolderOpen,
  Settings2,
  Gauge,
  Layers,
  RefreshCw,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  FileDown,
  FileSpreadsheet,
  Scale,
  Calculator,
  Power,
  Sparkles,
  ChevronDown,
  ChevronLeft,
} from 'lucide-react';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { CrossToolValidationAlert } from '@/components/design/CrossToolValidationAlert';
import { ZoneContextBanner } from '@/components/design/ZoneContextBanner';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { usePipeSizingMethods, PipeSizingMethod, PipeSizingParams } from '@/hooks/usePipeSizingMethods';
import { usePipeSystems, usePipeSystem, usePipeSegments, useSavePipeDesign, useUpdatePipeSystem, useDeletePipeSegments, useCreatePipeSegments } from '@/hooks/usePipeSystems';
import { PipeMaterial, calculatePumpPower } from '@/lib/pipe-calculations';
import { usePipeSystemAnalysis } from '@/hooks/usePipeSystemAnalysis';
import { usePipeSystemExport } from '@/hooks/usePipeSystemExport';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PipeTreeView, PipeSegmentNode } from '@/components/pipe-design/PipeTreeView';
import { PipeLayoutCanvas } from '@/components/pipe-design/PipeLayoutCanvas';
import { PipeSegmentPropertiesPanel, PipeSegmentData, SegmentFitting } from '@/components/pipe-design/PipeSegmentPropertiesPanel';
import { PipeFittingsLibraryPanel } from '@/components/pipe-design/PipeFittingsLibraryPanel';
import { AddPipeFittingDialog } from '@/components/pipe-design/AddPipeFittingDialog';
import { PipeCircuitBalancingPanel } from '@/components/pipe-design/PipeCircuitBalancingPanel';
import { GlycolCalculatorDialog } from '@/components/pipe-design/GlycolCalculatorDialog';
import { PumpSelectionDialog } from '@/components/pipe-design/PumpSelectionDialog';
import { CreateFromLoadCalcPipeDialog } from '@/components/pipe-design/CreateFromLoadCalcPipeDialog';
import { SyncFromLoadCalcDialog, SyncSegment, SyncUpdate } from '@/components/design/SyncFromLoadCalcDialog';
import { useQueryClient } from '@tanstack/react-query';
import type { PumpCurve } from '@/hooks/usePumpCurves';

export default function PipeDesigner() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Zone context persistence
  const { 
    projectId: storedProjectId, 
    setContext 
  } = useZoneContext();
  
  const projectId = searchParams.get('project') || storedProjectId;
  const systemId = searchParams.get('system');
  const { user, loading: authLoading } = useAuth();
  const { data: projects } = useProjects();
  const { sizeSegment, recalculateSegment, getMethodDescription, getAvailableMaterials } = usePipeSizingMethods();

  // Sync zone context when project changes
  useEffect(() => {
    if (projectId) {
      setContext(projectId, null, { replace: true });
    }
  }, [projectId, setContext]);

  // Database hooks
  const { data: savedSystems, isLoading: loadingSystems } = usePipeSystems(projectId || undefined);
  const { data: loadedSystem } = usePipeSystem(systemId || undefined);
  const { data: loadedSegments } = usePipeSegments(systemId || undefined);
  const savePipeDesign = useSavePipeDesign();
  const updatePipeSystem = useUpdatePipeSystem();
  const deleteSegments = useDeletePipeSegments();
  const createSegments = useCreatePipeSegments();

  // Pre-Save Validation & Stage Locking
  const { canSave, blockers, warnings, isLocked } = useToolValidation(
    projectId || null,
    'pipe-system',
    { checkStageLock: true }
  );

  // Conflict detection
  const queryClient = useQueryClient();
  const handleConflictReload = () => {
    queryClient.invalidateQueries({ queryKey: ['pipe-system', systemId] });
    queryClient.invalidateQueries({ queryKey: ['pipe-segments', systemId] });
  };

  // System settings
  const [currentSystemId, setCurrentSystemId] = useState<string | null>(null);
  const [systemName, setSystemName] = useState('New Pipe System');
  const [systemType, setSystemType] = useState<string>('chilled_water');
  const [sizingMethod, setSizingMethod] = useState<PipeSizingMethod>('velocity');
  const [targetVelocity, setTargetVelocity] = useState(6);
  const [maxFriction, setMaxFriction] = useState(4);
  const [fluidTempF, setFluidTempF] = useState(45);
  const [glycolPercent, setGlycolPercent] = useState(0);
  const [pipeMaterial, setPipeMaterial] = useState<PipeMaterial>('steel_schedule_40');

  // Segments state
  const [segments, setSegments] = useState<PipeSegmentData[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Dialog state
  const [showAddFitting, setShowAddFitting] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showGlycolCalculator, setShowGlycolCalculator] = useState(false);
  const [showPumpDialog, setShowPumpDialog] = useState(false);
  const [showCreateFromLoadCalcDialog, setShowCreateFromLoadCalcDialog] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [selectedPump, setSelectedPump] = useState<PumpCurve | null>(null);
  const [rightTab, setRightTab] = useState<string>('properties');
  const [isSaving, setIsSaving] = useState(false);

  // Load system from URL param
  useEffect(() => {
    if (loadedSystem && loadedSegments) {
      setCurrentSystemId(loadedSystem.id);
      setSystemName(loadedSystem.system_name);
      setSystemType(loadedSystem.system_type || 'chilled_water');
      setSizingMethod((loadedSystem.design_method as PipeSizingMethod) || 'velocity');
      setTargetVelocity(loadedSystem.max_velocity_fps || 6);
      setMaxFriction(loadedSystem.max_friction_ft_per_100ft || 4);
      setFluidTempF(loadedSystem.fluid_temp_f || 45);
      setPipeMaterial((loadedSystem.pipe_material as PipeMaterial) || 'steel_schedule_40');

      // Convert loaded segments to local format
      const convertedSegments: PipeSegmentData[] = loadedSegments.map((seg) => ({
        id: seg.id,
        name: seg.segment_name,
        flowGPM: seg.flow_gpm,
        lengthFt: seg.length_ft || 50,
        nominalSize: seg.nominal_size_in,
        material: pipeMaterial,
        scheduleClass: 'schedule_40',
        fluidType: systemType,
        fluidTempF: fluidTempF,
        elevationChangeFt: 0,
        fromNode: '',
        toNode: '',
        fittings: [],
        parentId: seg.parent_segment_id ?? null,
        nodeType: 'pipe',
        zoneId: seg.zone_id ?? null,
        velocity: seg.velocity_fps,
        frictionPer100ft: seg.friction_loss_per_100ft,
        totalHeadLoss: seg.total_pressure_drop_ft,
        reynoldsNumber: null,
        isCriticalPath: seg.is_critical_path ?? false,
      }));
      setSegments(convertedSegments);
    }
  }, [loadedSystem, loadedSegments]);

  // Get selected segment
  const selectedSegment = useMemo(
    () => segments.find((s) => s.id === selectedSegmentId) || null,
    [segments, selectedSegmentId]
  );

  // Critical path and circuit balancing analysis
  const { analysis, segmentsWithCriticalPath, criticalPathIds } = usePipeSystemAnalysis(segments);

  // Use segments with critical path markers for display
  const displaySegments = segmentsWithCriticalPath;

  // Convert segments to tree nodes (use displaySegments for critical path markers)
  const treeNodes: PipeSegmentNode[] = useMemo(() => {
    return displaySegments.map((seg) => ({
      id: seg.id,
      name: seg.name,
      flowGPM: seg.flowGPM,
      lengthFt: seg.lengthFt,
      nominalSize: seg.nominalSize,
      velocity: seg.velocity,
      headLoss: seg.totalHeadLoss,
      isCriticalPath: seg.isCriticalPath || criticalPathIds.has(seg.id),
      parentId: seg.parentId,
      children: [],
    }));
  }, [displaySegments, criticalPathIds]);

  // Add new segment
  const handleAddSegment = useCallback(() => {
    const newId = `seg-${Date.now()}`;
    const newSegment: PipeSegmentData = {
      id: newId,
      name: `Segment ${segments.length + 1}`,
      flowGPM: 100,
      lengthFt: 50,
      nominalSize: null,
      material: pipeMaterial,
      scheduleClass: 'schedule_40',
      fluidType: systemType,
      fluidTempF: fluidTempF,
      elevationChangeFt: 0,
      fromNode: '',
      toNode: '',
      fittings: [],
      parentId: null,
      nodeType: 'pipe',
      velocity: null,
      frictionPer100ft: null,
      totalHeadLoss: null,
      reynoldsNumber: null,
      isCriticalPath: false,
    };
    
    setSegments((prev) => [...prev, newSegment]);
    setSelectedSegmentId(newId);
    setExpandedIds((prev) => new Set([...prev, newId]));
  }, [segments.length, pipeMaterial, systemType, fluidTempF]);

  // Update segment
  const handleUpdateSegment = useCallback((updates: Partial<PipeSegmentData>) => {
    if (!selectedSegmentId) return;
    
    setSegments((prev) =>
      prev.map((seg) =>
        seg.id === selectedSegmentId ? { ...seg, ...updates } : seg
      )
    );
  }, [selectedSegmentId]);

  // Recalculate segment
  const handleRecalculateSegment = useCallback(() => {
    if (!selectedSegment) return;

    const totalK = selectedSegment.fittings.reduce(
      (sum, f) => sum + f.kFactor * f.quantity,
      0
    );

    const params: PipeSizingParams = {
      method: sizingMethod,
      targetVelocityFPS: targetVelocity,
      maxFrictionPer100ft: maxFriction,
      fluidTempF: selectedSegment.fluidTempF,
      glycolPercent: glycolPercent,
    };

    // Size or recalculate based on whether size is set
    if (selectedSegment.nominalSize) {
      const result = recalculateSegment(
        selectedSegment.flowGPM,
        selectedSegment.lengthFt,
        selectedSegment.nominalSize,
        selectedSegment.material,
        selectedSegment.fluidTempF,
        glycolPercent,
        totalK,
        selectedSegment.elevationChangeFt
      );

      if (result) {
        handleUpdateSegment({
          velocity: result.velocity,
          frictionPer100ft: result.frictionPer100ft,
          totalHeadLoss: result.totalHeadLoss,
          reynoldsNumber: result.reynoldsNumber,
        });
      }
    } else {
      const result = sizeSegment(
        selectedSegment.flowGPM,
        selectedSegment.lengthFt,
        selectedSegment.material,
        params,
        totalK,
        selectedSegment.elevationChangeFt
      );

      if (result) {
        handleUpdateSegment({
          nominalSize: result.nominalSize,
          velocity: result.velocity,
          frictionPer100ft: result.frictionPer100ft,
          totalHeadLoss: result.totalHeadLoss,
          reynoldsNumber: result.reynoldsNumber,
        });
      }
    }
  }, [selectedSegment, sizingMethod, targetVelocity, maxFriction, glycolPercent, sizeSegment, recalculateSegment, handleUpdateSegment]);

  // Recalculate all segments
  const handleRecalculateAll = useCallback(() => {
    const params: PipeSizingParams = {
      method: sizingMethod,
      targetVelocityFPS: targetVelocity,
      maxFrictionPer100ft: maxFriction,
      fluidTempF: fluidTempF,
      glycolPercent: glycolPercent,
    };

    setSegments((prev) =>
      prev.map((seg) => {
        const totalK = seg.fittings.reduce((sum, f) => sum + f.kFactor * f.quantity, 0);
        const result = sizeSegment(seg.flowGPM, seg.lengthFt, seg.material, params, totalK, seg.elevationChangeFt);

        if (result) {
          return {
            ...seg,
            nominalSize: result.nominalSize,
            velocity: result.velocity,
            frictionPer100ft: result.frictionPer100ft,
            totalHeadLoss: result.totalHeadLoss,
            reynoldsNumber: result.reynoldsNumber,
          };
        }
        return seg;
      })
    );

    toast.success('All segments recalculated');
  }, [sizingMethod, targetVelocity, maxFriction, fluidTempF, glycolPercent, sizeSegment]);

  // Delete segment
  const handleDeleteSegment = useCallback(() => {
    if (!selectedSegmentId) return;
    
    setSegments((prev) => prev.filter((s) => s.id !== selectedSegmentId));
    setSelectedSegmentId(null);
    toast.success('Segment deleted');
  }, [selectedSegmentId]);

  // Add fitting
  const handleAddFitting = useCallback(
    (fitting: { code: string; name: string; kFactor: number; quantity: number }) => {
      if (!selectedSegmentId) return;

      const newFitting: SegmentFitting = {
        id: `fit-${Date.now()}`,
        fittingCode: fitting.code,
        fittingName: fitting.name,
        kFactor: fitting.kFactor,
        quantity: fitting.quantity,
      };

      setSegments((prev) =>
        prev.map((seg) =>
          seg.id === selectedSegmentId
            ? { ...seg, fittings: [...seg.fittings, newFitting] }
            : seg
        )
      );

      // Recalculate after adding fitting
      setTimeout(handleRecalculateSegment, 100);
    },
    [selectedSegmentId, handleRecalculateSegment]
  );

  // Remove fitting
  const handleRemoveFitting = useCallback(
    (fittingId: string) => {
      if (!selectedSegmentId) return;

      setSegments((prev) =>
        prev.map((seg) =>
          seg.id === selectedSegmentId
            ? { ...seg, fittings: seg.fittings.filter((f) => f.id !== fittingId) }
            : seg
        )
      );

      setTimeout(handleRecalculateSegment, 100);
    },
    [selectedSegmentId, handleRecalculateSegment]
  );

  // Toggle expand
  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Reorder segment (change parent via drag-and-drop)
  const handleReorderSegment = useCallback((segmentId: string, newParentId: string | null) => {
    setSegments((prev) =>
      prev.map((seg) =>
        seg.id === segmentId ? { ...seg, parentId: newParentId } : seg
      )
    );
    
    const parentName = newParentId 
      ? segments.find(s => s.id === newParentId)?.name 
      : null;
    
    toast.success(
      parentName 
        ? `Moved segment under ${parentName}` 
        : 'Moved segment to root level'
    );
  }, [segments]);

  // System summary calculations - must be before handlers that use it
  const systemSummary = useMemo(() => {
    const totalFlow = Math.max(...displaySegments.map((s) => s.flowGPM), 0);
    const criticalPathHeadLoss = analysis?.criticalPathHeadLoss || 0;
    const totalHeadLoss = criticalPathHeadLoss > 0 ? criticalPathHeadLoss : displaySegments.reduce((sum, s) => sum + (s.totalHeadLoss || 0), 0);
    const maxVelocity = Math.max(...displaySegments.map((s) => s.velocity || 0), 0);
    const pumpCalc = calculatePumpPower(totalFlow, totalHeadLoss);

    return {
      totalFlow,
      totalHeadLoss,
      maxVelocity,
      segmentCount: displaySegments.length,
      criticalPathHeadLoss,
      isBalanced: analysis?.isBalanced ?? true,
      ...pumpCalc,
    };
  }, [displaySegments, analysis]);

  // Export functionality
  const { exportToPDF, exportToExcel } = usePipeSystemExport();

  // Save system to database
  const handleSaveSystem = useCallback(async () => {
    if (segments.length === 0) {
      toast.error('Add at least one segment before saving');
      return;
    }

    setIsSaving(true);
    try {
      const systemData = {
        system_name: systemName,
        system_type: systemType,
        design_method: sizingMethod,
        max_velocity_fps: targetVelocity,
        max_friction_ft_per_100ft: maxFriction,
        fluid_type: systemType,
        fluid_temp_f: fluidTempF,
        total_flow_gpm: systemSummary.totalFlow,
        system_head_ft: systemSummary.totalHeadLoss,
        pump_power_hp: systemSummary.motorHP,
        pipe_material: pipeMaterial,
        status: 'draft',
        project_id: projectId || undefined,
      };

      const segmentData = segments.map((seg, i) => ({
        segment_name: seg.name,
        flow_gpm: seg.flowGPM,
        nominal_size_in: seg.nominalSize,
        length_ft: seg.lengthFt,
        fittings_equivalent_length_ft: seg.fittings.reduce((sum, f) => sum + f.kFactor * f.quantity, 0) * 10,
        velocity_fps: seg.velocity,
        friction_loss_per_100ft: seg.frictionPer100ft,
        total_pressure_drop_ft: seg.totalHeadLoss,
        segment_type: 'main',
        sort_order: i,
        zone_id: seg.zoneId || null,
      }));

      if (currentSystemId) {
        // Update existing system
        await updatePipeSystem.mutateAsync({
          id: currentSystemId,
          ...systemData,
        });
        
        // Delete old segments and create new ones
        await deleteSegments.mutateAsync(currentSystemId);
        await createSegments.mutateAsync(
          segmentData.map(s => ({ ...s, pipe_system_id: currentSystemId }))
        );
        
        toast.success('Pipe system updated');
      } else {
        // Create new system
        const result = await savePipeDesign.mutateAsync({
          system: systemData,
          segments: segmentData,
        });
        
        setCurrentSystemId(result.system.id);
        setSearchParams({ system: result.system.id, ...(projectId ? { project: projectId } : {}) });
        toast.success('Pipe system saved');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save pipe system');
    } finally {
      setIsSaving(false);
    }
  }, [segments, systemName, systemType, sizingMethod, targetVelocity, maxFriction, fluidTempF, pipeMaterial, projectId, currentSystemId, systemSummary, savePipeDesign, updatePipeSystem, deleteSegments, createSegments, setSearchParams]);

  // Load a saved system
  const handleLoadSystem = useCallback((system: { id: string; system_name: string }) => {
    setSearchParams({ system: system.id, ...(projectId ? { project: projectId } : {}) });
    setShowLoadDialog(false);
  }, [projectId, setSearchParams]);

  // Create new system
  const handleNewSystem = useCallback(() => {
    setCurrentSystemId(null);
    setSystemName('New Pipe System');
    setSegments([]);
    setSelectedSegmentId(null);
    setSearchParams(projectId ? { project: projectId } : {});
  }, [projectId, setSearchParams]);

  // Create system from load calculations
  const handleCreateFromLoadCalcs = useCallback((config: {
    systemName: string;
    segments: Array<{
      id: string;
      name: string;
      flowGPM: number;
      lengthFt: number;
      parentId: string | null;
      nodeType: 'pipe' | 'pump' | 'coil' | 'chiller' | 'boiler' | 'valve_gate' | 'valve_globe' | 'valve_ball' | 'valve_butterfly' | 'valve_check' | 'strainer' | 'tank' | 'air_separator' | 'heat_exchanger';
      material: string;
      nominalSize: number | null;
      zoneId?: string | null;
    }>;
    loadCalculationId: string | null;
    systemType: string;
    fluidTempF: number;
  }) => {
    setCurrentSystemId(null);
    setSystemName(config.systemName);
    setSystemType(config.systemType);
    setFluidTempF(config.fluidTempF);

    // Convert to full PipeSegmentData format
    const newSegments: PipeSegmentData[] = config.segments.map(seg => ({
      id: seg.id,
      name: seg.name,
      flowGPM: seg.flowGPM,
      lengthFt: seg.lengthFt,
      nominalSize: seg.nominalSize,
      material: seg.material as PipeMaterial,
      scheduleClass: 'schedule_40',
      fluidType: config.systemType,
      fluidTempF: config.fluidTempF,
      elevationChangeFt: 0,
      fromNode: '',
      toNode: '',
      fittings: [],
      parentId: seg.parentId,
      nodeType: seg.nodeType,
      zoneId: seg.zoneId ?? null,
      velocity: null,
      frictionPer100ft: null,
      totalHeadLoss: null,
      reynoldsNumber: null,
      isCriticalPath: false,
    }));

    setSegments(newSegments);
    setSelectedSegmentId(newSegments[0]?.id || null);
    setExpandedIds(new Set(newSegments.map(s => s.id)));
    
    // Auto-size all segments
    setTimeout(() => {
      handleRecalculateAll();
    }, 100);
    
    toast.success(`Created pipe system with ${newSegments.length} segments from load calculations`);
  }, [handleRecalculateAll]);

  // Prepare syncable segments (those with zone IDs)
  const syncableSegments: SyncSegment[] = useMemo(() => 
    segments
      .filter(s => s.zoneId)
      .map(s => ({
        id: s.id,
        name: s.name,
        zoneId: s.zoneId!,
        currentFlow: s.flowGPM,
      })),
    [segments]
  );

  // Handle sync from load calculations
  const handleSyncFromLoadCalcs = useCallback((updates: SyncUpdate[]) => {
    setSegments(prev => prev.map(seg => {
      const update = updates.find(u => u.segmentId === seg.id);
      if (update) {
        return { ...seg, flowGPM: Math.round(update.newFlow * 10) / 10 };
      }
      return seg;
    }));
    toast.success(`Updated GPM for ${updates.length} segment${updates.length !== 1 ? 's' : ''}`);
    // Trigger recalculation after a short delay
    setTimeout(() => handleRecalculateAll(), 100);
  }, [handleRecalculateAll]);

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse">Loading...</div>
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
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Stage Locking & Pre-Save Validation Header */}
        <ToolPageHeader
          toolType="pipe-system"
          toolName="Pipe Designer"
          projectId={projectId || null}
          showLockButton={!!projectId}
          showValidation={!!projectId}
          className="mx-4 mt-2"
        />

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/design')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Droplets className="h-6 w-6 text-primary" />
              <div>
                <Input
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0"
                />
                <p className="text-xs text-muted-foreground">
                  {segments.length} segments • {systemSummary.totalFlow.toFixed(0)} GPM max
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Workflow Progress - inline compact */}
            {projectId && (
              <div className="hidden lg:block w-48">
                <DesignWorkflowProgressBar
                  projectId={projectId}
                  variant="compact"
                  showLabels={false}
                  showPercentages={false}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <ActiveEditorsIndicator
                entityType="pipe_designer"
                entityId={currentSystemId || null}
                projectId={projectId || undefined}
              />
              <EditConflictWarning
                entityType="pipe_system"
                entityId={systemId || null}
                currentRevisionNumber={0}
                onReload={handleConflictReload}
              />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileDown className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    if (segments.length === 0) {
                      toast.error('Add segments before exporting');
                      return;
                    }
                    exportToPDF({
                      systemName,
                      systemType,
                      segments: displaySegments,
                      analysis: analysis || { criticalPath: [], criticalPathHeadLoss: 0, circuits: [], loops: [], maxCircuitDelta: 0, isBalanced: true, totalFlow: 0, averageVelocity: 0 },
                      summary: systemSummary,
                      settings: {
                        pipeMaterial,
                        sizingMethod,
                        targetVelocity,
                        maxFriction,
                        fluidTempF,
                        glycolPercent,
                      },
                    });
                    toast.success('PDF exported');
                  }}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Export to PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (segments.length === 0) {
                      toast.error('Add segments before exporting');
                      return;
                    }
                    exportToExcel({
                      systemName,
                      systemType,
                      segments: displaySegments,
                      analysis: analysis || { criticalPath: [], criticalPathHeadLoss: 0, circuits: [], loops: [], maxCircuitDelta: 0, isBalanced: true, totalFlow: 0, averageVelocity: 0 },
                      summary: systemSummary,
                      settings: {
                        pipeMaterial,
                        sizingMethod,
                        targetVelocity,
                        maxFriction,
                        fluidTempF,
                        glycolPercent,
                      },
                    });
                    toast.success('Excel exported');
                  }}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export to Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-primary/50">
                  <ArrowRight className="h-4 w-4 mr-1" />
                  Next Steps
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(projectId 
                  ? `/design/ashrae-compliance?project=${projectId}` 
                  : '/design/ashrae-compliance'
                )}>
                  Check Pump Power Compliance
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(projectId 
                  ? `/design/bas-points?project=${projectId}` 
                  : '/design/bas-points'
                )}>
                  Generate BAS Points
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(projectId 
                  ? `/design/material-takeoff?project=${projectId}` 
                  : '/design/material-takeoff'
                )}>
                  Material Takeoff
                </DropdownMenuItem>
                {projectId && (
                  <DropdownMenuItem onClick={() => navigate(`/design/completeness?project=${projectId}`)}>
                    View Design Completeness
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={() => setShowLoadDialog(true)}>
              <FolderOpen className="h-4 w-4 mr-1" />
              Load
            </Button>
            <Button variant="outline" size="sm" onClick={handleNewSystem}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowCreateFromLoadCalcDialog(true)}>
              <Sparkles className="h-4 w-4 mr-1" />
              From Load Calc
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowSyncDialog(true)}
              disabled={syncableSegments.length === 0}
              title={syncableSegments.length === 0 ? 'No segments linked to zones' : `Sync GPM for ${syncableSegments.length} segments`}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Sync GPM
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (currentSystemId && projectId) {
                  navigate(`/design/pump-selection?project=${projectId}&system=${currentSystemId}`);
                } else {
                  setShowPumpDialog(true);
                }
              }}
              title={currentSystemId ? "Select pump for this system" : "Open pump selection"}
            >
              <Power className="h-4 w-4 mr-1" />
              {currentSystemId ? 'Select Pump' : 'Pump'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleRecalculateAll}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Recalculate
            </Button>
            <Button size="sm" onClick={handleSaveSystem} disabled={isSaving || !canSave}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              {currentSystemId ? 'Update' : 'Save'}
            </Button>
            </div>
          </div>
        </div>

        {/* Data Flow & Validation Alerts */}
        {projectId && (
          <div className="px-4 py-2 border-b space-y-2">
            <PreSaveValidationAlert blockers={blockers} warnings={warnings} />
            <DataFlowSuggestions
              projectId={projectId}
              currentTool="pipe-designer"
              variant="alert"
            />
            <CrossToolValidationAlert
              projectId={projectId}
              currentTool="pipe-system"
              variant="alert"
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            {/* Left Panel - Tree View */}
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
              <div className="h-full flex flex-col border-r">
                <div className="p-2 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    <span className="text-sm font-medium">Segments</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleAddSegment}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="flex-1 p-2">
                  <PipeTreeView
                    segments={treeNodes}
                    selectedId={selectedSegmentId}
                    onSelect={setSelectedSegmentId}
                    expandedIds={expandedIds}
                    onToggleExpand={handleToggleExpand}
                    onReorderSegment={handleReorderSegment}
                  />
                </ScrollArea>
              </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* Center Panel - Canvas */}
            <ResizablePanel defaultSize={50}>
              <div className="h-full flex flex-col">
                {/* System Summary Bar */}
                <div className="p-2 border-b flex items-center gap-4 text-sm bg-muted/30">
                  <div className="flex items-center gap-1">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <span>TDH: {systemSummary.totalHeadLoss.toFixed(1)} ft</span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div>
                    <span className="text-muted-foreground">Max Velocity: </span>
                    <span className={systemSummary.maxVelocity > 10 ? 'text-destructive' : ''}>
                      {systemSummary.maxVelocity.toFixed(1)} fps
                    </span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div>
                    <span className="text-muted-foreground">Pump: </span>
                    <span>{systemSummary.motorHP.toFixed(1)} HP</span>
                  </div>
                  {selectedPump && (
                    <>
                      <Separator orientation="vertical" className="h-4" />
                      <Badge variant="secondary" className="gap-1">
                        <Power className="h-3 w-3" />
                        {selectedPump.manufacturer} {selectedPump.model}
                      </Badge>
                    </>
                  )}
                </div>

                {/* Canvas */}
                <div className="flex-1">
                  <PipeLayoutCanvas
                    segments={treeNodes}
                    selectedId={selectedSegmentId}
                    onSelect={setSelectedSegmentId}
                  />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* Right Panel - Properties / Settings */}
            <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
              <div className="h-full flex flex-col border-l">
                <Tabs value={rightTab} onValueChange={setRightTab} className="flex-1 flex flex-col">
                  <TabsList className="w-full rounded-none border-b">
                    <TabsTrigger value="properties" className="flex-1">Properties</TabsTrigger>
                    <TabsTrigger value="balancing" className="flex-1">Balancing</TabsTrigger>
                    <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
                    <TabsTrigger value="fittings" className="flex-1">Fittings</TabsTrigger>
                  </TabsList>

                  <TabsContent value="properties" className="flex-1 overflow-hidden m-0">
                    <ScrollArea className="h-full">
                      <PipeSegmentPropertiesPanel
                        segment={selectedSegment}
                        allSegments={segments}
                        onUpdate={handleUpdateSegment}
                        onAddFitting={() => setShowAddFitting(true)}
                        onRemoveFitting={handleRemoveFitting}
                        onRecalculate={handleRecalculateSegment}
                      />
                      {selectedSegment && (
                        <div className="p-4 pt-0">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full"
                            onClick={handleDeleteSegment}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete Segment
                          </Button>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="balancing" className="flex-1 overflow-hidden m-0">
                    <ScrollArea className="h-full">
                      {analysis && segments.length > 0 ? (
                        <PipeCircuitBalancingPanel
                          analysis={analysis}
                          onSelectCircuit={(leafSegmentId) => {
                            setSelectedSegmentId(leafSegmentId);
                            setRightTab('properties');
                          }}
                          selectedCircuitId={selectedSegmentId || undefined}
                        />
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          <Scale className="h-10 w-10 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Add hierarchical segments to see circuit balancing analysis</p>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="settings" className="flex-1 overflow-hidden m-0">
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-4">
                        <div className="space-y-2">
                          <Label>System Type</Label>
                          <Select value={systemType} onValueChange={setSystemType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="chilled_water">Chilled Water</SelectItem>
                              <SelectItem value="hot_water">Hot Water</SelectItem>
                              <SelectItem value="condenser_water">Condenser Water</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Pipe Material</Label>
                          <Select value={pipeMaterial} onValueChange={(v) => setPipeMaterial(v as PipeMaterial)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableMaterials().map((m) => (
                                <SelectItem key={m.value} value={m.value}>
                                  {m.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Label>Sizing Method</Label>
                          <Select value={sizingMethod} onValueChange={(v) => setSizingMethod(v as PipeSizingMethod)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="velocity">Velocity Method</SelectItem>
                              <SelectItem value="friction_limit">Friction Limit</SelectItem>
                              <SelectItem value="equal_friction">Equal Friction</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            {getMethodDescription(sizingMethod)}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Target Velocity (fps)</Label>
                            <Input
                              type="number"
                              value={targetVelocity}
                              onChange={(e) => setTargetVelocity(parseFloat(e.target.value) || 6)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Max Friction (ft/100ft)</Label>
                            <Input
                              type="number"
                              value={maxFriction}
                              onChange={(e) => setMaxFriction(parseFloat(e.target.value) || 4)}
                            />
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Label>Fluid Temperature (°F)</Label>
                          <Input
                            type="number"
                            value={fluidTempF}
                            onChange={(e) => setFluidTempF(parseFloat(e.target.value) || 45)}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Glycol Percentage (%)</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => setShowGlycolCalculator(true)}
                            >
                              <Calculator className="h-3 w-3 mr-1" />
                              Calculator
                            </Button>
                          </div>
                          <Input
                            type="number"
                            value={glycolPercent}
                            onChange={(e) => setGlycolPercent(parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <Separator />

                        {/* System Summary Card */}
                        <Card>
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm">System Summary</CardTitle>
                          </CardHeader>
                          <CardContent className="py-2 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Flow:</span>
                              <span>{systemSummary.totalFlow.toFixed(1)} GPM</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Head:</span>
                              <span>{systemSummary.totalHeadLoss.toFixed(2)} ft</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Hydraulic HP:</span>
                              <span>{systemSummary.hydraulicHP.toFixed(2)} HP</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Brake HP:</span>
                              <span>{systemSummary.brakeHP.toFixed(2)} HP</span>
                            </div>
                            <div className="flex justify-between font-medium">
                              <span>Motor Size:</span>
                              <span>{systemSummary.motorHP} HP</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="fittings" className="flex-1 overflow-hidden m-0">
                    <PipeFittingsLibraryPanel
                      onSelectFitting={(fitting) => {
                        if (selectedSegmentId) {
                          handleAddFitting({
                            code: fitting.fitting_code,
                            name: fitting.fitting_name,
                            kFactor: fitting.k_factor,
                            quantity: 1,
                          });
                        } else {
                          toast.error('Select a segment first');
                        }
                      }}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      {/* Add Fitting Dialog */}
      <AddPipeFittingDialog
        open={showAddFitting}
        onOpenChange={setShowAddFitting}
        onAdd={handleAddFitting}
      />

      {/* Load System Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Load Pipe System</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {loadingSystems ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : savedSystems && savedSystems.length > 0 ? (
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-2">
                  {savedSystems.map((system) => (
                    <div
                      key={system.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => handleLoadSystem({ id: system.id, system_name: system.system_name })}
                    >
                      <div>
                        <p className="font-medium">{system.system_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{system.system_type}</span>
                          {system.total_flow_gpm && (
                            <span>• {system.total_flow_gpm} GPM</span>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {system.status}
                          </Badge>
                        </div>
                      </div>
                      <Droplets className="h-5 w-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Droplets className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No saved pipe systems found</p>
                <p className="text-xs">Create and save your first design</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Glycol Calculator Dialog */}
      <GlycolCalculatorDialog
        open={showGlycolCalculator}
        onOpenChange={setShowGlycolCalculator}
        currentGlycolPercent={glycolPercent}
        onApply={(percent) => {
          setGlycolPercent(percent);
          setShowGlycolCalculator(false);
        }}
      />

      {/* Pump Selection Dialog */}
      <PumpSelectionDialog
        open={showPumpDialog}
        onOpenChange={setShowPumpDialog}
        requiredFlow={systemSummary.totalFlow}
        requiredHead={systemSummary.totalHeadLoss}
        staticHead={0}
        onSelectPump={(pump) => {
          setSelectedPump(pump);
          toast.success(`Selected pump: ${pump.manufacturer} ${pump.model}`);
        }}
      />

      {/* Create from Load Calculations Dialog */}
      <CreateFromLoadCalcPipeDialog
        open={showCreateFromLoadCalcDialog}
        onOpenChange={setShowCreateFromLoadCalcDialog}
        onCreateSystem={handleCreateFromLoadCalcs}
        defaultProjectId={projectId}
      />

      {/* Sync GPM from Load Calculations Dialog */}
      <SyncFromLoadCalcDialog
        open={showSyncDialog}
        onOpenChange={setShowSyncDialog}
        mode="pipe"
        segments={syncableSegments}
        projectId={projectId}
        onSync={handleSyncFromLoadCalcs}
        deltaT={10}
      />

      {/* Design Workflow Next Step */}
      <DesignWorkflowNextStep
        currentPath="/design/pipe-designer"
        projectId={projectId}
        stageComplete={segments.length > 0}
      />
    </DashboardLayout>
  );
}
