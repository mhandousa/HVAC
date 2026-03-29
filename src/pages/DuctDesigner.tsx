import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useZoneContext } from '@/hooks/useZoneContext';
import { usePreSaveValidation } from '@/hooks/usePreSaveValidation';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { PreSaveValidationAlert } from '@/components/design/PreSaveValidationAlert';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Wind, 
  Save, 
  Download, 
  Calculator, 
  AlertTriangle, 
  Zap, 
  ArrowRight,
  Plus,
  FolderOpen,
  Loader2,
  FileText,
  Trash2,
  ChevronDown,
  ChevronLeft,
  Maximize,
  Minimize,
  FolderKanban,
  Fan,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { CrossToolValidationAlert } from '@/components/design/CrossToolValidationAlert';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { DuctLayoutCanvas } from '@/components/duct-design/DuctLayoutCanvas';
import { DuctTreeView, DuctTreeNode } from '@/components/duct-design/DuctTreeView';
import { SegmentPropertiesPanel, SegmentData } from '@/components/duct-design/SegmentPropertiesPanel';
import { FittingsLibraryPanel } from '@/components/duct-design/FittingsLibraryPanel';
import { DuctBranchBalancingPanel } from '@/components/duct-design/DuctBranchBalancingPanel';
import { useDuctSizingMethods, SizingMethod, SizingMethodConfig } from '@/hooks/useDuctSizingMethods';
import { useDuctSystemAnalysis } from '@/hooks/useDuctSystemAnalysis';
import { useDuctSystemExport } from '@/hooks/useDuctSystemExport';
import { useDuctSystems, useDuctSystem, useDuctSegments, useSaveDuctDesign, useUpdateDuctSystem, useDeleteDuctSystem, useCreateDuctSegments } from '@/hooks/useDuctSystems';
import { useOrganization } from '@/hooks/useOrganization';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { FanSelectionDialog } from '@/components/duct-design/FanSelectionDialog';
import { CreateFromLoadCalcDialog } from '@/components/duct-design/CreateFromLoadCalcDialog';
import { SyncFromLoadCalcDialog, SyncSegment, SyncUpdate } from '@/components/design/SyncFromLoadCalcDialog';
import { useQueryClient } from '@tanstack/react-query';
import type { FanCurve } from '@/hooks/useFanCurves';

export default function DuctDesigner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Zone context persistence
  const { 
    projectId: storedProjectId, 
    setContext 
  } = useZoneContext();
  
  const projectIdFromUrl = searchParams.get('project') || storedProjectId;
  const systemIdFromUrl = searchParams.get('system');
  
  const { user, loading: authLoading } = useAuth();
  const { data: organization } = useOrganization();
  const { data: projects } = useProjects();
  const linkedProject = projects?.find((p) => p.id === projectIdFromUrl);

  // Sync zone context when project changes
  useEffect(() => {
    if (projectIdFromUrl) {
      setContext(projectIdFromUrl, null, { replace: true });
    }
  }, [projectIdFromUrl, setContext]);
  
  // Database hooks
  const { data: savedSystems, isLoading: isLoadingSystems } = useDuctSystems(projectIdFromUrl || undefined);
  const { data: loadedSystem } = useDuctSystem(systemIdFromUrl || undefined);
  const { data: loadedSegments } = useDuctSegments(systemIdFromUrl || undefined);
  const saveDuctDesign = useSaveDuctDesign();
  const updateDuctSystem = useUpdateDuctSystem();
  const deleteDuctSystem = useDeleteDuctSystem();
  const createSegments = useCreateDuctSegments();
  
  // Sizing hook
  const { sizeSystem, getMethodDescription, getRecommendedSettings } = useDuctSizingMethods();
  
  // Local sizing state (the hook doesn't manage state)
  const [sizingMethod, setSizingMethod] = useState<SizingMethod>('equal_friction');
  const [sizingConfig, setSizingConfig] = useState<SizingMethodConfig>({
    method: 'equal_friction',
    targetFrictionPaPerM: 1.0,
    targetVelocityMs: 7.5,
    maxVelocityMs: 12,
    ductShape: 'rectangular',
    aspectRatio: 2,
  });
  
  const updateSizingConfig = useCallback((updates: Partial<SizingMethodConfig>) => {
    setSizingConfig(prev => ({ ...prev, ...updates }));
  }, []);
  
  // Export hook
  const { exportToPDF, exportToExcel } = useDuctSystemExport();

  // Pre-Save Validation & Stage Locking
  const { canSave, blockers, warnings, isLocked } = useToolValidation(
    projectIdFromUrl || null,
    'duct-system',
    { checkStageLock: true }
  );

  // Conflict detection
  const queryClient = useQueryClient();
  const handleConflictReload = () => {
    queryClient.invalidateQueries({ queryKey: ['duct-system', systemIdFromUrl] });
    queryClient.invalidateQueries({ queryKey: ['duct-segments', systemIdFromUrl] });
  };
  
  // State
  const [currentSystemId, setCurrentSystemId] = useState<string | null>(null);
  const [systemName, setSystemName] = useState('New Duct System');
  const [systemType, setSystemType] = useState<'supply' | 'return' | 'exhaust'>('supply');
  const [segments, setSegments] = useState<SegmentData[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [rightTab, setRightTab] = useState('properties');
  const [leftTab, setLeftTab] = useState('tree');
  const [fanDialogOpen, setFanDialogOpen] = useState(false);
  const [selectedFan, setSelectedFan] = useState<FanCurve | null>(null);
  const [showCreateFromLoadCalcDialog, setShowCreateFromLoadCalcDialog] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);

  // Load system from URL parameter
  useEffect(() => {
    if (loadedSystem && loadedSegments) {
      setSystemName(loadedSystem.system_name);
      setSystemType((loadedSystem.system_type as 'supply' | 'return' | 'exhaust') || 'supply');
      setCurrentSystemId(loadedSystem.id);
      
      if (loadedSystem.design_method) {
        setSizingMethod(loadedSystem.design_method as SizingMethod);
        setSizingConfig(prev => ({ ...prev, method: loadedSystem.design_method as SizingMethod }));
      }
      
      // Convert DB segments to local format
      const converted: SegmentData[] = loadedSegments.map((seg) => ({
        id: seg.id,
        name: seg.segment_name,
        cfm: seg.cfm,
        lengthFt: seg.length_ft || 0,
        shape: (seg.duct_shape as 'round' | 'rectangular') || 'round',
        diameterIn: seg.diameter_in || undefined,
        widthIn: seg.width_in || undefined,
        heightIn: seg.height_in || undefined,
        material: 'galvanized_steel',
        hasDamper: false,
        fittings: [],
        velocityFpm: seg.velocity_fpm || undefined,
        frictionLossPer100ft: seg.friction_loss_per_100ft || undefined,
        totalPressureDropPa: seg.total_pressure_drop || undefined,
        parentId: null, // DB doesn't store hierarchy yet
        zoneId: seg.zone_id || undefined,
      }));
      
      setSegments(converted);
      
      // Expand all by default
      setExpandedIds(new Set(converted.map(s => s.id)));
    }
  }, [loadedSystem, loadedSegments]);

  // Initialize with a demo segment if no system loaded
  useEffect(() => {
    if (!systemIdFromUrl && segments.length === 0 && !authLoading) {
      const initialSegment: SegmentData = {
        id: crypto.randomUUID(),
        name: 'Main Supply',
        cfm: 2000,
        lengthFt: 50,
        shape: 'rectangular',
        widthIn: 24,
        heightIn: 12,
        material: 'galvanized_steel',
        hasDamper: false,
        fittings: [],
        parentId: null,
      };
      setSegments([initialSegment]);
      setExpandedIds(new Set([initialSegment.id]));
    }
  }, [systemIdFromUrl, segments.length, authLoading]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // System analysis
  const { analysis, criticalPathIds } = useDuctSystemAnalysis(segments);

  // System summary
  const systemSummary = useMemo(() => ({
    totalCfm: analysis.totalCFM,
    totalPressure: segments.reduce((sum, s) => sum + (s.totalPressureDropPa || 0), 0),
    criticalPressure: analysis.criticalPathPressureDrop,
    warnings: segments.filter(s => (s.velocityFpm || 0) > 1800).length,
    isBalanced: analysis.isBalanced,
  }), [segments, analysis]);

  // Build tree nodes from flat segments
  const treeNodes = useMemo(() => {
    const buildNode = (segment: SegmentData): DuctTreeNode => ({
      id: segment.id,
      name: segment.name,
      type: segment.parentId ? 'branch' : 'main',
      cfm: segment.cfm,
      sized: !!segment.velocityFpm,
      hasWarning: (segment.velocityFpm || 0) > 1800,
      isCriticalPath: criticalPathIds.has(segment.id),
      velocity: segment.velocityFpm,
      pressureDrop: segment.totalPressureDropPa,
      children: segments
        .filter(s => s.parentId === segment.id)
        .map(buildNode),
    });
    
    return segments
      .filter(s => !s.parentId)
      .map(buildNode);
  }, [segments, criticalPathIds]);

  // Handlers
  const handleAddSegment = useCallback((parentId: string | null = null) => {
    const newSegment: SegmentData = {
      id: crypto.randomUUID(),
      name: `Segment ${segments.length + 1}`,
      cfm: parentId ? Math.round((segments.find(s => s.id === parentId)?.cfm || 1000) / 2) : 1000,
      lengthFt: 20,
      shape: 'round',
      diameterIn: 10,
      material: 'galvanized_steel',
      hasDamper: false,
      fittings: [],
      parentId,
    };
    setSegments(prev => [...prev, newSegment]);
    setSelectedId(newSegment.id);
    setExpandedIds(prev => new Set([...prev, newSegment.id, ...(parentId ? [parentId] : [])]));
    toast.success('Segment added');
  }, [segments]);

  const handleDeleteSegment = useCallback((segmentId: string) => {
    const getDescendants = (id: string): string[] => {
      const children = segments.filter(s => s.parentId === id);
      return [id, ...children.flatMap(c => getDescendants(c.id))];
    };
    const toDelete = new Set(getDescendants(segmentId));
    setSegments(prev => prev.filter(s => !toDelete.has(s.id)));
    if (selectedId && toDelete.has(selectedId)) {
      setSelectedId(undefined);
    }
    toast.success('Segment deleted');
  }, [segments, selectedId]);

  const handleReorderSegment = useCallback((segmentId: string, newParentId: string | null) => {
    // Prevent circular references
    const getDescendants = (id: string): string[] => {
      const children = segments.filter(s => s.parentId === id);
      return [id, ...children.flatMap(c => getDescendants(c.id))];
    };
    
    if (newParentId && getDescendants(segmentId).includes(newParentId)) {
      toast.error('Cannot move segment to its own descendant');
      return;
    }
    
    setSegments(prev =>
      prev.map(seg =>
        seg.id === segmentId ? { ...seg, parentId: newParentId } : seg
      )
    );
    toast.success('Segment moved');
  }, [segments]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    setExpandedIds(new Set(segments.map(s => s.id)));
  }, [segments]);

  const handleCollapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const handleSegmentUpdate = useCallback((updated: SegmentData) => {
    setSegments(prev => 
      prev.map(seg => seg.id === updated.id ? updated : seg)
    );
  }, []);

  const handleRecalculate = useCallback(() => {
    if (segments.length === 0) {
      toast.error('No segments to calculate');
      return;
    }

    // Convert segments to sizing input format
    const inputs = segments.map((seg) => ({
      id: seg.id,
      airflowCfm: seg.cfm,
      lengthFt: seg.lengthFt,
      fittingCoefficients: seg.fittings.map(f => f.lossCoefficient || 0),
      parentSegmentId: seg.parentId || undefined,
      segmentName: seg.name,
      segmentType: (seg.parentId ? 'branch' : 'main') as 'main' | 'branch' | 'terminal',
    }));
    
    // Size system using the hook with current config
    const configWithMethod = { ...sizingConfig, method: sizingMethod };
    const results = sizeSystem(inputs, configWithMethod);
    
    // Update segments with calculated values
    setSegments(prev => prev.map(seg => {
      const result = results.find(r => r.id === seg.id);
      if (!result) return seg;
      
      const updated: SegmentData = {
        ...seg,
        velocityFpm: Math.round(result.velocityFpm),
        frictionLossPer100ft: result.frictionLossPa / (seg.lengthFt * 0.3048) * 30.48 / 249.089, // Convert Pa to in.wg/100ft
        totalPressureDropPa: result.totalPressureLossPa,
      };
      
      // Update dimensions based on shape
      if (seg.shape === 'round') {
        updated.diameterIn = result.diameterIn ? Math.round(result.diameterIn) : seg.diameterIn;
      } else {
        updated.widthIn = result.widthIn ? Math.round(result.widthIn) : seg.widthIn;
        updated.heightIn = result.heightIn ? Math.round(result.heightIn) : seg.heightIn;
      }
      
      return updated;
    }));
    
    toast.success(`System recalculated using ${sizingMethod.replace('_', ' ')} method`);
  }, [segments, sizingConfig, sizeSystem, sizingMethod]);

  const handleSave = async () => {
    if (!organization) {
      toast.error('No organization found');
      return;
    }
    
    setIsSaving(true);
    try {
      const systemData = {
        system_name: systemName,
        system_type: systemType,
        design_method: sizingMethod,
        total_airflow_cfm: systemSummary.totalCfm,
        system_static_pressure_pa: systemSummary.criticalPressure,
        project_id: projectIdFromUrl || undefined,
      };
      
      const segmentData = segments.map((seg, i) => ({
        segment_name: seg.name,
        cfm: seg.cfm,
        length_ft: seg.lengthFt,
        duct_shape: seg.shape,
        diameter_in: seg.diameterIn,
        width_in: seg.widthIn,
        height_in: seg.heightIn,
        velocity_fpm: seg.velocityFpm,
        friction_loss_per_100ft: seg.frictionLossPer100ft,
        total_pressure_drop: seg.totalPressureDropPa,
        material_type: seg.material,
        has_damper: seg.hasDamper,
        parent_segment_id: seg.parentId,
        sort_order: i,
        zone_id: seg.zoneId || null,
      }));
      
      if (currentSystemId) {
        // Update system metadata
        await updateDuctSystem.mutateAsync({ 
          id: currentSystemId, 
          ...systemData 
        });
        // Also update segments
        await createSegments.mutateAsync({ 
          systemId: currentSystemId, 
          segments: segmentData 
        });
        toast.success('System updated');
      } else {
        const saved = await saveDuctDesign.mutateAsync({
          systemData,
          segments: segmentData,
        });
        setCurrentSystemId(saved.id);
        // Update URL without navigation
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('system', saved.id);
        window.history.replaceState({}, '', newUrl.toString());
        toast.success('System saved');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save system');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSystem = (systemId: string) => {
    setShowLoadDialog(false);
    const params = new URLSearchParams();
    params.set('system', systemId);
    if (projectIdFromUrl) {
      params.set('project', projectIdFromUrl);
    }
    navigate(`/design/duct-designer?${params.toString()}`);
  };

  const handleNewSystem = () => {
    setCurrentSystemId(null);
    setSystemName('New Duct System');
    setSystemType('supply');
    setSegments([]);
    setSelectedId(undefined);
    setExpandedIds(new Set());
    
    const params = new URLSearchParams();
    if (projectIdFromUrl) {
      params.set('project', projectIdFromUrl);
    }
    navigate(`/design/duct-designer${params.toString() ? '?' + params.toString() : ''}`);
    toast.success('New system created');
  };

  const handleCreateFromLoadCalcs = (config: {
    systemName: string;
    segments: SegmentData[];
    loadCalculationId: string | null;
  }) => {
    setCurrentSystemId(null);
    setSystemName(config.systemName);
    setSystemType('supply');
    setSegments(config.segments);
    setSelectedId(undefined);
    setExpandedIds(new Set(config.segments.map(s => s.id)));
    
    // Clear URL system param since this is a new unsaved system
    const params = new URLSearchParams();
    if (projectIdFromUrl) {
      params.set('project', projectIdFromUrl);
    }
    navigate(`/design/duct-designer${params.toString() ? '?' + params.toString() : ''}`, { replace: true });
    
    toast.success(`Created system with ${config.segments.length} segments from load calculations`);
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    // Enrich segments with critical path info for export
    const segmentsWithCriticalPath = segments.map(seg => ({
      ...seg,
      isCriticalPath: criticalPathIds.has(seg.id)
    }));

    const exportData = {
      systemName,
      systemType,
      segments: segmentsWithCriticalPath,
      analysis,
      summary: {
        totalCFM: systemSummary.totalCfm,
        totalPressureDrop: systemSummary.totalPressure,
        maxVelocity: analysis.maxVelocity,
        segmentCount: segments.length,
        fanStaticPressure: analysis.criticalPathPressureDrop / 249,
      },
      settings: {
        ductMaterial: 'galvanized_steel',
        sizingMethod,
        targetVelocity: sizingConfig.targetVelocityMs ? sizingConfig.targetVelocityMs * 196.85 : undefined,
        targetFriction: sizingConfig.targetFrictionPaPerM,
      },
    };
    
    if (format === 'pdf') {
      exportToPDF(exportData);
    } else {
      exportToExcel(exportData);
    }
  };

  const handleAddFitting = useCallback((segmentId: string, fitting: any) => {
    setSegments(prev => 
      prev.map(seg => 
        seg.id === segmentId 
          ? { ...seg, fittings: [...seg.fittings, { ...fitting, id: crypto.randomUUID() }] }
          : seg
      )
    );
    toast.success(`Added ${fitting.name || fitting.fittingName} to segment`);
  }, []);

  // Prepare syncable segments (those with zone IDs)
  const syncableSegments: SyncSegment[] = useMemo(() => 
    segments
      .filter(s => s.zoneId)
      .map(s => ({
        id: s.id,
        name: s.name,
        zoneId: s.zoneId!,
        currentFlow: s.cfm,
      })),
    [segments]
  );

  // Handle sync from load calculations
  const handleSyncFromLoadCalcs = useCallback((updates: SyncUpdate[]) => {
    setSegments(prev => prev.map(seg => {
      const update = updates.find(u => u.segmentId === seg.id);
      if (update) {
        return { ...seg, cfm: Math.round(update.newFlow) };
      }
      return seg;
    }));
    toast.success(`Updated CFM for ${updates.length} segment${updates.length !== 1 ? 's' : ''}`);
    // Trigger recalculation after a short delay
    setTimeout(() => handleRecalculate(), 100);
  }, [handleRecalculate]);

  const selectedSegment = segments.find(s => s.id === selectedId);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Stage Locking & Pre-Save Validation Header */}
        <ToolPageHeader
          toolType="duct-system"
          toolName="Duct Designer"
          projectId={projectIdFromUrl || null}
          showLockButton={!!projectIdFromUrl}
          showValidation={!!projectIdFromUrl}
          className="mx-4 mt-2"
        />

        {/* Cross-Tool Validation Alert */}
        <CrossToolValidationAlert
          projectId={projectIdFromUrl}
          currentTool="duct-system"
          variant="banner"
          className="mx-4 mt-2"
        />

        {/* Header */}
        <div className="border-b bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {linkedProject ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/projects/${linkedProject.id}`)}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => navigate('/design')}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              )}
              <div className="flex items-center gap-2">
                <Wind className="w-5 h-5 text-primary" />
                <Input
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  className="font-semibold text-lg border-none bg-transparent focus-visible:ring-1 w-64"
                />
              </div>
              <Select value={systemType} onValueChange={(v: 'supply' | 'return' | 'exhaust') => setSystemType(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supply">Supply</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                  <SelectItem value="exhaust">Exhaust</SelectItem>
                </SelectContent>
              </Select>
              {linkedProject && (
                <Badge variant="outline" className="gap-1">
                  <FolderKanban className="w-3 h-3" />
                  {linkedProject.name}
                </Badge>
              )}
              {currentSystemId && (
                <Badge variant="outline" className="text-xs">
                  Saved
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <ActiveEditorsIndicator
                entityType="duct_designer"
                entityId={currentSystemId || null}
                projectId={projectIdFromUrl || undefined}
              />
              <EditConflictWarning
                entityType="duct_system"
                entityId={systemIdFromUrl || null}
                currentRevisionNumber={0}
                onReload={handleConflictReload}
              />
              <Button variant="outline" size="sm" onClick={handleNewSystem}>
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowCreateFromLoadCalcDialog(true)}
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                From Load Calc
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowSyncDialog(true)}
                disabled={syncableSegments.length === 0}
                title={syncableSegments.length === 0 ? 'No segments linked to zones' : `Sync CFM for ${syncableSegments.length} segments`}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Sync CFM
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowLoadDialog(true)}>
                <FolderOpen className="w-4 h-4 mr-1" />
                Load
              </Button>
              <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving || !canSave}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                Save
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Export
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export to PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('excel')}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export to Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-primary/50">
                    <ArrowRight className="w-4 h-4 mr-1" />
                    Next Steps
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(projectIdFromUrl 
                    ? `/design/ashrae-compliance?project=${projectIdFromUrl}` 
                    : '/design/ashrae-compliance'
                  )}>
                    Check Fan Power Compliance
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(projectIdFromUrl 
                    ? `/design/bas-points?project=${projectIdFromUrl}` 
                    : '/design/bas-points'
                  )}>
                    Generate BAS Points
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(projectIdFromUrl 
                    ? `/design/material-takeoff?project=${projectIdFromUrl}` 
                    : '/design/material-takeoff'
                  )}>
                    Material Takeoff
                  </DropdownMenuItem>
                  {projectIdFromUrl && (
                    <DropdownMenuItem onClick={() => navigate(`/design/completeness?project=${projectIdFromUrl}`)}>
                      View Design Completeness
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  if (currentSystemId && projectIdFromUrl) {
                    navigate(`/design/fan-selection?project=${projectIdFromUrl}&system=${currentSystemId}`);
                  } else {
                    setFanDialogOpen(true);
                  }
                }}
                title={currentSystemId ? "Select fan for this system" : "Open fan selection"}
              >
                <Fan className="w-4 h-4 mr-1" />
                {currentSystemId ? 'Select Fan' : 'Fan'}
              </Button>
              <Button size="sm" onClick={handleRecalculate}>
                <Calculator className="w-4 h-4 mr-1" />
                Calculate
              </Button>
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="flex items-center gap-6 mt-3 text-sm">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Total CFM:</span>
              <span className="font-medium">{systemSummary.totalCfm.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Critical Path:</span>
              <span className="font-medium">{systemSummary.criticalPressure.toFixed(1)} Pa</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Segments:</span>
              <span className="font-medium">{segments.length}</span>
            </div>
            {systemSummary.warnings > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {systemSummary.warnings} High Velocity
              </Badge>
            )}
            {systemSummary.isBalanced && (
              <Badge variant="default" className="bg-green-500">
                Balanced
              </Badge>
            )}
            {selectedFan && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Fan className="w-3 h-3" />
                {selectedFan.manufacturer} {selectedFan.model}
              </Badge>
            )}
          </div>
        </div>

        {/* Pre-Save Validation Alert */}
        {projectIdFromUrl && (blockers.length > 0 || warnings.length > 0) && (
          <div className="px-4 py-2 border-b">
            <PreSaveValidationAlert blockers={blockers} warnings={warnings} />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Tree View */}
          <div className="w-80 border-r flex flex-col bg-card">
            <Tabs value={leftTab} onValueChange={setLeftTab} className="flex-1 flex flex-col">
              <div className="flex items-center justify-between px-3 pt-3">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="tree">Tree</TabsTrigger>
                  <TabsTrigger value="fittings">Fittings</TabsTrigger>
                </TabsList>
                {leftTab === 'tree' && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExpandAll} title="Expand All">
                      <Maximize className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCollapseAll} title="Collapse All">
                      <Minimize className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleAddSegment(null)} title="Add Root Segment">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              <TabsContent value="tree" className="flex-1 overflow-auto m-0 p-3">
                <DuctTreeView
                  nodes={treeNodes}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  expandedIds={expandedIds}
                  onToggleExpand={handleToggleExpand}
                  onReorderSegment={handleReorderSegment}
                />
              </TabsContent>
              
              <TabsContent value="fittings" className="flex-1 overflow-auto m-0">
                <FittingsLibraryPanel 
                  selectedShape={selectedSegment?.shape || 'rectangular'}
                  onSelectFitting={(fitting) => {
                    if (selectedId) {
                      handleAddFitting(selectedId, fitting);
                    } else {
                      toast.error('Select a segment first');
                    }
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Center - Canvas */}
          <div className="flex-1 bg-muted/30 p-4">
            <DuctLayoutCanvas
              segments={segments}
              selectedId={selectedId}
              onSelect={setSelectedId}
              criticalPathIds={criticalPathIds}
            />
          </div>

          {/* Right Panel - Properties */}
          <div className="w-80 border-l flex flex-col bg-card">
            <Tabs value={rightTab} onValueChange={setRightTab} className="flex-1 flex flex-col">
              <TabsList className="mx-3 mt-3 grid grid-cols-3">
                <TabsTrigger value="properties">Properties</TabsTrigger>
                <TabsTrigger value="balancing">Balancing</TabsTrigger>
                <TabsTrigger value="settings">Sizing</TabsTrigger>
              </TabsList>
              
              <TabsContent value="properties" className="flex-1 overflow-auto m-0">
                <SegmentPropertiesPanel
                  segment={selectedSegment || null}
                  onUpdate={handleSegmentUpdate}
                  onDelete={selectedSegment ? () => handleDeleteSegment(selectedSegment.id) : undefined}
                />
              </TabsContent>
              
              <TabsContent value="balancing" className="flex-1 overflow-auto m-0">
                <DuctBranchBalancingPanel
                  analysis={analysis}
                  onSelectBranch={setSelectedId}
                  selectedBranchId={selectedId}
                />
              </TabsContent>
              
              <TabsContent value="settings" className="flex-1 overflow-auto m-0 p-3">
                <div className="space-y-4">
                  <div>
                    <Label>Sizing Method</Label>
                    <Select value={sizingMethod} onValueChange={(v: SizingMethod) => {
                      setSizingMethod(v);
                      setSizingConfig(prev => ({ ...prev, method: v }));
                    }}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equal_friction">Equal Friction</SelectItem>
                        <SelectItem value="velocity">Velocity Reduction</SelectItem>
                        <SelectItem value="static_regain">Static Regain</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getMethodDescription(sizingMethod)}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  {sizingMethod === 'equal_friction' && (
                    <div>
                      <Label>Target Friction Rate (Pa/m)</Label>
                      <Input
                        type="number"
                        value={sizingConfig.targetFrictionPaPerM || 1.0}
                        onChange={(e) => updateSizingConfig({ targetFrictionPaPerM: parseFloat(e.target.value) })}
                        step="0.1"
                        min="0.1"
                        max="3.0"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Typical: 0.8-1.2 Pa/m for low velocity, 1.5-2.5 Pa/m for high velocity
                      </p>
                    </div>
                  )}
                  
                  {(sizingMethod === 'velocity') && (
                    <div>
                      <Label>Target Velocity (m/s)</Label>
                      <Input
                        type="number"
                        value={sizingConfig.targetVelocityMs || 7.5}
                        onChange={(e) => updateSizingConfig({ targetVelocityMs: parseFloat(e.target.value) })}
                        step="0.5"
                        min="2"
                        max="15"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Typical: 5-7 m/s for branches, 7-10 m/s for mains
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <Label>Maximum Velocity (m/s)</Label>
                    <Input
                      type="number"
                      value={sizingConfig.maxVelocityMs || 12}
                      onChange={(e) => updateSizingConfig({ maxVelocityMs: parseFloat(e.target.value) })}
                      step="0.5"
                      min="5"
                      max="20"
                      className="mt-1"
                    />
                  </div>
                  
                  <Button onClick={handleRecalculate} className="w-full">
                    <Calculator className="w-4 h-4 mr-2" />
                    Apply & Recalculate
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Load System Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Duct System</DialogTitle>
            <DialogDescription>
              Select a previously saved duct system to load
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-96">
            {isLoadingSystems ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : savedSystems && savedSystems.length > 0 ? (
              <div className="space-y-2">
                {savedSystems.map((system) => (
                  <Card 
                    key={system.id}
                    className={`cursor-pointer hover:bg-accent transition-colors ${
                      currentSystemId === system.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleLoadSystem(system.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{system.system_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {system.system_type} • {system.total_airflow_cfm?.toLocaleString() || 0} CFM
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created {format(new Date(system.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{system.design_method || 'equal_friction'}</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this system?')) {
                                deleteDuctSystem.mutate(system.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No saved duct systems found
              </div>
            )}
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fan Selection Dialog */}
      <FanSelectionDialog
        open={fanDialogOpen}
        onOpenChange={setFanDialogOpen}
        requiredCfm={systemSummary.totalCfm}
        requiredStaticPressure={systemSummary.criticalPressure / 249.089} // Convert Pa to in.wg
        staticPressure={systemSummary.criticalPressure / 249.089}
        onSelectFan={(fan) => {
          setSelectedFan(fan);
          toast.success(`Selected fan: ${fan.manufacturer} ${fan.model}`);
        }}
      />

      {/* Create from Load Calculation Dialog */}
      <CreateFromLoadCalcDialog
        open={showCreateFromLoadCalcDialog}
        onOpenChange={setShowCreateFromLoadCalcDialog}
        onCreateSystem={handleCreateFromLoadCalcs}
        defaultProjectId={projectIdFromUrl}
      />

      {/* Sync CFM from Load Calculations Dialog */}
      <SyncFromLoadCalcDialog
        open={showSyncDialog}
        onOpenChange={setShowSyncDialog}
        mode="duct"
        segments={syncableSegments}
        projectId={projectIdFromUrl}
        onSync={handleSyncFromLoadCalcs}
      />

      {/* Design Workflow Next Step */}
      <DesignWorkflowNextStep
        currentPath="/design/duct-designer"
        projectId={projectIdFromUrl}
        stageComplete={segments.length > 0}
      />
    </DashboardLayout>
  );
}
