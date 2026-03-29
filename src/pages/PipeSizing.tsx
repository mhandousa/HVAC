import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { usePipeSegments } from '@/hooks/usePipeSystems';
import { useZoneContext } from '@/hooks/useZoneContext';
import { useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Loader2,
  Droplets,
  Calculator,
  Plus,
  Trash2,
  Info,
  Download,
  FolderKanban,
  ChevronLeft,
  Save,
  FolderOpen,
  Thermometer,
  Activity,
  GitBranch,
} from 'lucide-react';
import { SaveAsAlternativeDialog } from '@/components/design/SaveAsAlternativeDialog';
import { DesignAlternativesManager } from '@/components/design/DesignAlternativesManager';
import { AlternativeComparisonView } from '@/components/design/AlternativeComparisonView';
import { DesignAlternative } from '@/hooks/useDesignAlternatives';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { SavePipeDesignDialog, LoadPipeDesignDialog } from '@/components/design/PipeDesignDialogs';
import { GlycolCalculatorDialog } from '@/components/pipe-design/GlycolCalculatorDialog';
import { PumpSelectionDialog } from '@/components/pipe-design/PumpSelectionDialog';
import { usePipeSizingExport } from '@/hooks/usePipeSizingExport';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { useConflictDetection } from '@/hooks/useConflictDetection';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import type { PipeSystem } from '@/hooks/usePipeSystems';
import type { PumpCurve } from '@/hooks/usePumpCurves';

interface PipeSection {
  id: string;
  name: string;
  flowGpm: number;
  length: number;
  fittings: number; // Equivalent length
  fluid: 'chilled-water' | 'hot-water' | 'condenser-water';
  material: 'steel' | 'copper' | 'pvc';
  nominalSize?: number;
  velocity?: number;
  frictionLoss?: number;
  totalPressureDrop?: number;
}

// Pipe sizing data (nominal size in inches, ID in inches)
const PIPE_DATA = {
  steel: [
    { nominal: 0.5, id: 0.622 },
    { nominal: 0.75, id: 0.824 },
    { nominal: 1, id: 1.049 },
    { nominal: 1.25, id: 1.38 },
    { nominal: 1.5, id: 1.61 },
    { nominal: 2, id: 2.067 },
    { nominal: 2.5, id: 2.469 },
    { nominal: 3, id: 3.068 },
    { nominal: 4, id: 4.026 },
    { nominal: 5, id: 5.047 },
    { nominal: 6, id: 6.065 },
    { nominal: 8, id: 7.981 },
    { nominal: 10, id: 10.02 },
    { nominal: 12, id: 11.938 },
  ],
  copper: [
    { nominal: 0.5, id: 0.545 },
    { nominal: 0.75, id: 0.785 },
    { nominal: 1, id: 1.025 },
    { nominal: 1.25, id: 1.265 },
    { nominal: 1.5, id: 1.505 },
    { nominal: 2, id: 1.985 },
    { nominal: 2.5, id: 2.465 },
    { nominal: 3, id: 2.945 },
    { nominal: 4, id: 3.905 },
  ],
  pvc: [
    { nominal: 0.5, id: 0.602 },
    { nominal: 0.75, id: 0.804 },
    { nominal: 1, id: 1.029 },
    { nominal: 1.25, id: 1.36 },
    { nominal: 1.5, id: 1.59 },
    { nominal: 2, id: 2.047 },
    { nominal: 2.5, id: 2.445 },
    { nominal: 3, id: 3.042 },
    { nominal: 4, id: 3.998 },
    { nominal: 6, id: 5.993 },
  ],
};

// Fluid properties (base values at standard conditions)
const FLUID_PROPS = {
  'chilled-water': { density: 62.4, viscosity: 0.000672, temp: '44°F' },
  'hot-water': { density: 60.1, viscosity: 0.000316, temp: '180°F' },
  'condenser-water': { density: 61.8, viscosity: 0.000548, temp: '85°F' },
};

// Glycol correction factors (approximate for propylene glycol at 40°F)
const GLYCOL_CORRECTIONS = {
  0: { viscosityMultiplier: 1.0, densityMultiplier: 1.0, specificHeatMultiplier: 1.0 },
  10: { viscosityMultiplier: 1.15, densityMultiplier: 1.01, specificHeatMultiplier: 0.98 },
  20: { viscosityMultiplier: 1.35, densityMultiplier: 1.02, specificHeatMultiplier: 0.95 },
  25: { viscosityMultiplier: 1.50, densityMultiplier: 1.025, specificHeatMultiplier: 0.93 },
  30: { viscosityMultiplier: 1.70, densityMultiplier: 1.03, specificHeatMultiplier: 0.91 },
  35: { viscosityMultiplier: 1.95, densityMultiplier: 1.035, specificHeatMultiplier: 0.88 },
  40: { viscosityMultiplier: 2.30, densityMultiplier: 1.04, specificHeatMultiplier: 0.85 },
  50: { viscosityMultiplier: 3.20, densityMultiplier: 1.05, specificHeatMultiplier: 0.78 },
};

// Get glycol correction factors (interpolate if needed)
const getGlycolCorrection = (glycolPercent: number): { viscosityMultiplier: number; densityMultiplier: number; specificHeatMultiplier: number } => {
  const percentages = Object.keys(GLYCOL_CORRECTIONS).map(Number).sort((a, b) => a - b);
  
  if (glycolPercent <= 0) return GLYCOL_CORRECTIONS[0];
  if (glycolPercent >= 50) return GLYCOL_CORRECTIONS[50];
  
  // Find surrounding percentages for interpolation
  let lowerPct = 0;
  let upperPct = 50;
  for (const pct of percentages) {
    if (pct <= glycolPercent) lowerPct = pct;
    if (pct >= glycolPercent && upperPct > glycolPercent) upperPct = pct;
  }
  
  if (lowerPct === upperPct) return GLYCOL_CORRECTIONS[lowerPct as keyof typeof GLYCOL_CORRECTIONS];
  
  // Linear interpolation
  const ratio = (glycolPercent - lowerPct) / (upperPct - lowerPct);
  const lower = GLYCOL_CORRECTIONS[lowerPct as keyof typeof GLYCOL_CORRECTIONS];
  const upper = GLYCOL_CORRECTIONS[upperPct as keyof typeof GLYCOL_CORRECTIONS];
  
  return {
    viscosityMultiplier: lower.viscosityMultiplier + ratio * (upper.viscosityMultiplier - lower.viscosityMultiplier),
    densityMultiplier: lower.densityMultiplier + ratio * (upper.densityMultiplier - lower.densityMultiplier),
    specificHeatMultiplier: lower.specificHeatMultiplier + ratio * (upper.specificHeatMultiplier - lower.specificHeatMultiplier),
  };
};

// Hazen-Williams C factors
const C_FACTORS = {
  steel: 120,
  copper: 130,
  pvc: 150,
};

const calculateVelocity = (gpm: number, id: number): number => {
  const area = Math.PI * Math.pow(id / 2, 2) / 144; // ft²
  const velocity = (gpm * 0.002228) / area; // fps
  return velocity;
};

// Modified friction calculation that accounts for glycol viscosity
const calculateFriction = (gpm: number, id: number, c: number, glycolPercent: number = 0): number => {
  // Hazen-Williams formula: hf = 10.44 * L * Q^1.85 / (C^1.85 * d^4.87)
  // Returns ft per 100 ft of pipe
  let baseFriction = (10.44 * 100 * Math.pow(gpm, 1.85)) / (Math.pow(c, 1.85) * Math.pow(id, 4.87));
  
  // Apply glycol correction - higher viscosity increases friction loss
  if (glycolPercent > 0) {
    const correction = getGlycolCorrection(glycolPercent);
    // Approximate correction: friction increases roughly proportional to viscosity ratio
    baseFriction *= Math.pow(correction.viscosityMultiplier, 0.35);
  }
  
  return baseFriction;
};

const selectPipeSize = (
  gpm: number,
  material: 'steel' | 'copper' | 'pvc',
  maxVelocity: number,
  maxFriction: number,
  glycolPercent: number = 0
): { nominal: number; id: number; velocity: number; friction: number } | null => {
  const pipes = PIPE_DATA[material];
  const c = C_FACTORS[material];

  for (const pipe of pipes) {
    const velocity = calculateVelocity(gpm, pipe.id);
    const friction = calculateFriction(gpm, pipe.id, c, glycolPercent);

    if (velocity <= maxVelocity && friction <= maxFriction) {
      return { ...pipe, velocity, friction };
    }
  }

  // Return largest available if none meet criteria
  const largest = pipes[pipes.length - 1];
  return {
    ...largest,
    velocity: calculateVelocity(gpm, largest.id),
    friction: calculateFriction(gpm, largest.id, c, glycolPercent),
  };
};

export default function PipeSizing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Zone context persistence
  const { projectId: storedProjectId, setContext } = useZoneContext();
  const projectIdFromUrl = searchParams.get('project') || storedProjectId;
  
  // Sync context when project changes
  useEffect(() => {
    if (projectIdFromUrl) {
      setContext(projectIdFromUrl, null, { replace: true });
    }
  }, [projectIdFromUrl, setContext]);
  const { exportToPDF, exportToExcel } = usePipeSizingExport();

  const { data: projects } = useProjects();
  const linkedProject = projects?.find(p => p.id === projectIdFromUrl);

  // Phase 17: Stage locking and validation
  const { canSave, isLocked } = useToolValidation(
    projectIdFromUrl || null,
    'pipe-sizing',
    { checkStageLock: true }
  );

  const [maxVelocity, setMaxVelocity] = useState(8); // fps
  const [maxFriction, setMaxFriction] = useState(4); // ft/100ft
  const [defaultMaterial, setDefaultMaterial] = useState<'steel' | 'copper' | 'pvc'>('steel');
  const [defaultFluid, setDefaultFluid] = useState<'chilled-water' | 'hot-water' | 'condenser-water'>('chilled-water');

  const [sections, setSections] = useState<PipeSection[]>([
    { id: '1', name: 'Chiller Supply', flowGpm: 500, length: 100, fittings: 50, fluid: 'chilled-water', material: 'steel' },
    { id: '2', name: 'Chiller Return', flowGpm: 500, length: 100, fittings: 50, fluid: 'chilled-water', material: 'steel' },
    { id: '3', name: 'AHU Branch', flowGpm: 150, length: 60, fittings: 30, fluid: 'chilled-water', material: 'steel' },
    { id: '4', name: 'FCU Riser', flowGpm: 50, length: 40, fittings: 20, fluid: 'chilled-water', material: 'copper' },
  ]);

  const [newSection, setNewSection] = useState({
    name: '',
    flowGpm: 100,
    length: 50,
    fittings: 25,
  });

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [loadedSystemId, setLoadedSystemId] = useState<string | null>(null);
  const [glycolDialogOpen, setGlycolDialogOpen] = useState(false);
  const [pumpDialogOpen, setPumpDialogOpen] = useState(false);
  const [glycolPercent, setGlycolPercent] = useState(0);
  const [selectedPump, setSelectedPump] = useState<PumpCurve | null>(null);

  // Concurrent Editing Awareness
  const queryClient = useQueryClient();
  const { hasConflict, latestRevision, clearConflict } = useConflictDetection({
    entityType: 'pipe_sizing',
    entityId: loadedSystemId,
    currentRevisionNumber: 0,
  });

  const handleReloadLatest = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['pipe_systems'] });
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
    if (data.sections) setSections(data.sections as PipeSection[]);
    if (data.maxVelocity) setMaxVelocity(data.maxVelocity as number);
    if (data.maxFriction) setMaxFriction(data.maxFriction as number);
    if (data.defaultMaterial) setDefaultMaterial(data.defaultMaterial as 'steel' | 'copper' | 'pvc');
    if (data.defaultFluid) setDefaultFluid(data.defaultFluid as 'chilled-water' | 'hot-water' | 'condenser-water');
    if (data.glycolPercent !== undefined) setGlycolPercent(data.glycolPercent as number);
    setShowAlternativesManager(false);
    toast.success('Alternative loaded');
  }, []);

  const handleCompareAlternatives = useCallback((alternatives: DesignAlternative[]) => {
    setAlternativesToCompare(alternatives);
    setShowAlternativeComparison(true);
    setShowAlternativesManager(false);
  }, []);

  // Fetch segments when loading a system
  const { data: loadedSegments } = usePipeSegments(loadedSystemId || undefined);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Load segments when a system is loaded
  useEffect(() => {
    if (loadedSegments && loadedSegments.length > 0) {
      setSections(
        loadedSegments.map((seg) => ({
          id: seg.id,
          name: seg.segment_name,
          flowGpm: seg.flow_gpm,
          length: seg.length_ft || 0,
          fittings: seg.fittings_equivalent_length_ft || 0,
          fluid: defaultFluid,
          material: defaultMaterial,
          nominalSize: seg.nominal_size_in || undefined,
          velocity: seg.velocity_fps || undefined,
          frictionLoss: seg.friction_loss_per_100ft || undefined,
          totalPressureDrop: seg.total_pressure_drop_ft || undefined,
        }))
      );
      setLoadedSystemId(null);
    }
  }, [loadedSegments, defaultFluid, defaultMaterial]);

  const handleLoadSystem = (system: PipeSystem) => {
    setMaxVelocity(system.max_velocity_fps || 8);
    setMaxFriction(system.max_friction_ft_per_100ft || 4);
    setDefaultMaterial((system.pipe_material || 'steel') as 'steel' | 'copper' | 'pvc');
    setDefaultFluid((system.fluid_type || 'chilled-water') as 'chilled-water' | 'hot-water' | 'condenser-water');
    setLoadedSystemId(system.id);
    toast.success(`Loaded: ${system.system_name}`);
  };

  // Get glycol correction for display
  const glycolCorrection = getGlycolCorrection(glycolPercent);

  // Calculate pipe sizes with glycol corrections applied
  const calculatedSections = sections.map((section) => {
    const result = selectPipeSize(section.flowGpm, section.material, maxVelocity, maxFriction, glycolPercent);
    if (!result) return section;

    const totalLength = section.length + section.fittings;
    const totalPressureDrop = (result.friction / 100) * totalLength;

    return {
      ...section,
      nominalSize: result.nominal,
      velocity: result.velocity,
      frictionLoss: result.friction,
      totalPressureDrop,
    };
  });

  const totalSystemHead = calculatedSections.reduce(
    (sum, s) => Math.max(sum, s.totalPressureDrop || 0),
    0
  );

  const addSection = () => {
    if (!newSection.name.trim()) {
      toast.error('Please enter a section name');
      return;
    }

    setSections([
      ...sections,
      {
        id: crypto.randomUUID(),
        name: newSection.name,
        flowGpm: newSection.flowGpm,
        length: newSection.length,
        fittings: newSection.fittings,
        fluid: defaultFluid,
        material: defaultMaterial,
      },
    ]);
    setNewSection({ name: '', flowGpm: 100, length: 50, fittings: 25 });
    toast.success('Section added');
  };

  const removeSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
  };

  const breadcrumbItems = useMemo(() => {
    const items = [];
    if (linkedProject) {
      items.push({ label: linkedProject.name, href: `/projects/${linkedProject.id}` });
    }
    items.push(
      { label: 'Design Tools', href: '/design' },
      { label: 'Water Distribution' },
      { label: 'Pipe Sizing' }
    );
    return items;
  }, [linkedProject]);

  const handleBack = () => {
    if (projectIdFromUrl) {
      navigate(`/projects/${projectIdFromUrl}`);
    } else {
      navigate('/design');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <Breadcrumbs items={breadcrumbItems} className="mb-2" />

        {/* Phase 17: Unified Tool Header with Stage Locking */}
        <ToolPageHeader
          toolType="pipe-sizing"
          toolName="Pipe Sizing Calculator"
          projectId={projectIdFromUrl}
          showLockButton={true}
          showValidation={true}
        />

        {/* Project Context Banner */}
        {linkedProject && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <FolderKanban className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">Linked to Project</p>
              <Link 
                to={`/projects/${linkedProject.id}`}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {linkedProject.name}
              </Link>
            </div>
            <Badge variant="outline">{linkedProject.status}</Badge>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Pipe Sizing Calculator</h1>
            <p className="text-muted-foreground">
              Size hydronic piping using Hazen-Williams formula
            </p>
          </div>
          <ActiveEditorsIndicator
            entityType="pipe_sizing"
            entityId={loadedSystemId}
            projectId={projectIdFromUrl || undefined}
          />
          <div className="flex gap-2">
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
            <Button variant="outline" className="gap-2" onClick={() => setGlycolDialogOpen(true)}>
              <Thermometer className="w-4 h-4" />
              Glycol
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setPumpDialogOpen(true)}>
              <Activity className="w-4 h-4" />
              Pump
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setLoadDialogOpen(true)}>
              <FolderOpen className="w-4 h-4" />
              Load
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setSaveDialogOpen(true)}>
              <Save className="w-4 h-4" />
              Save
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => exportToPDF({
                sections: calculatedSections,
                maxVelocity,
                maxFriction,
                defaultMaterial,
                defaultFluid,
                totalSystemHead,
                glycolPercent,
              })}
            >
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => exportToExcel({
                sections: calculatedSections,
                maxVelocity,
                maxFriction,
                defaultMaterial,
                defaultFluid,
                totalSystemHead,
                glycolPercent,
              })}
            >
              <Download className="w-4 h-4" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Conflict Warning */}
        {hasConflict && (
          <EditConflictWarning
            entityType="pipe_sizing"
            entityId={loadedSystemId}
            currentRevisionNumber={0}
            onReload={handleReloadLatest}
            onForceSave={handleForceSave}
          />
        )}

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Settings Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Design Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Max Velocity (fps)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={maxVelocity}
                  onChange={(e) => setMaxVelocity(parseFloat(e.target.value) || 8)}
                />
                <p className="text-xs text-muted-foreground">
                  Typical: 4-8 fps for mains, 2-4 fps for branches
                </p>
              </div>

              <div className="space-y-2">
                <Label>Max Friction (ft/100ft)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={maxFriction}
                  onChange={(e) => setMaxFriction(parseFloat(e.target.value) || 4)}
                />
                <p className="text-xs text-muted-foreground">
                  Typical: 1-4 ft per 100 ft
                </p>
              </div>

              <div className="space-y-2">
                <Label>Default Pipe Material</Label>
                <Select value={defaultMaterial} onValueChange={(v) => setDefaultMaterial(v as typeof defaultMaterial)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="steel">Steel (Schedule 40)</SelectItem>
                    <SelectItem value="copper">Copper (Type L)</SelectItem>
                    <SelectItem value="pvc">PVC (Schedule 40)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Default Fluid</Label>
                <Select value={defaultFluid} onValueChange={(v) => setDefaultFluid(v as typeof defaultFluid)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chilled-water">Chilled Water (44°F)</SelectItem>
                    <SelectItem value="hot-water">Hot Water (180°F)</SelectItem>
                    <SelectItem value="condenser-water">Condenser Water (85°F)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm font-medium text-primary">System Head Loss</p>
                  <p className="text-2xl font-bold">{totalSystemHead.toFixed(1)} ft</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Add Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add Pipe Section</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="col-span-2 md:col-span-1 space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="Section name"
                      value={newSection.name}
                      onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Flow (GPM)</Label>
                    <Input
                      type="number"
                      value={newSection.flowGpm}
                      onChange={(e) => setNewSection({ ...newSection, flowGpm: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Length (ft)</Label>
                    <Input
                      type="number"
                      value={newSection.length}
                      onChange={(e) => setNewSection({ ...newSection, length: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fittings EL (ft)</Label>
                    <Input
                      type="number"
                      value={newSection.fittings}
                      onChange={(e) => setNewSection({ ...newSection, fittings: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full gap-2" onClick={addSection}>
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="w-5 h-5" />
                  Pipe Sizing Results
                </CardTitle>
                <CardDescription>
                  Calculated pipe sizes based on velocity and friction limits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Section</TableHead>
                        <TableHead className="text-right">Flow (GPM)</TableHead>
                        <TableHead className="text-right">Size</TableHead>
                        <TableHead className="text-right">Velocity (fps)</TableHead>
                        <TableHead className="text-right">Friction/100ft</TableHead>
                        <TableHead className="text-right">Total ΔP (ft)</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calculatedSections.map((section) => (
                        <TableRow key={section.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{section.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {section.material} • {section.fluid.replace('-', ' ')}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{section.flowGpm}</TableCell>
                          <TableCell className="text-right font-mono">
                            {section.nominalSize}"
                          </TableCell>
                          <TableCell className="text-right">{section.velocity?.toFixed(1)}</TableCell>
                          <TableCell className="text-right">{section.frictionLoss?.toFixed(2)} ft</TableCell>
                          <TableCell className="text-right font-medium">
                            {section.totalPressureDrop?.toFixed(1)} ft
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removeSection(section.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Velocity Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommended Velocities (fps)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="font-medium">Pump Suction</p>
                    <p className="text-muted-foreground">4-6 fps</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="font-medium">Pump Discharge</p>
                    <p className="text-muted-foreground">8-12 fps</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="font-medium">Mains & Risers</p>
                    <p className="text-muted-foreground">4-8 fps</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="font-medium">Branches</p>
                    <p className="text-muted-foreground">2-4 fps</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-info/5 border-info/20">
          <CardContent className="flex gap-3 pt-4">
            <Info className="w-5 h-5 text-info shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">About Pipe Sizing</p>
              <p>
                This calculator uses the <strong>Hazen-Williams formula</strong> for friction loss calculations.
                The tool selects the smallest pipe size that meets both velocity and friction criteria.
                Equivalent length accounts for fittings and valves. For glycol systems, apply a correction factor.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <SavePipeDesignDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          projectId={projectIdFromUrl || undefined}
          systemType={defaultFluid}
          fluidType={defaultFluid}
          pipeMaterial={defaultMaterial}
          maxVelocity={maxVelocity}
          maxFriction={maxFriction}
          totalHead={totalSystemHead}
          sections={calculatedSections}
        />
        <LoadPipeDesignDialog
          open={loadDialogOpen}
          onOpenChange={setLoadDialogOpen}
          projectId={projectIdFromUrl || undefined}
          onLoad={handleLoadSystem}
        />
        <GlycolCalculatorDialog
          open={glycolDialogOpen}
          onOpenChange={setGlycolDialogOpen}
          onApply={(percent) => {
            setGlycolPercent(percent);
            toast.success(`Applied ${percent}% glycol correction`);
          }}
          currentGlycolPercent={glycolPercent}
        />
        <PumpSelectionDialog
          open={pumpDialogOpen}
          onOpenChange={setPumpDialogOpen}
          requiredFlow={sections.reduce((max, s) => Math.max(max, s.flowGpm), 0)}
          requiredHead={totalSystemHead}
        />

        {/* Design Workflow Next Step */}
        <DesignWorkflowNextStep
          currentPath="/design/pipe-sizing"
          projectId={projectIdFromUrl}
          stageComplete={calculatedSections.length > 0}
        />

        {/* Design Alternatives */}
        {projectIdFromUrl && (
          <>
            <SaveAsAlternativeDialog
              open={showSaveAlternative}
              onOpenChange={setShowSaveAlternative}
              projectId={projectIdFromUrl}
              entityType="pipe_sizing"
              entityId={loadedSystemId || undefined}
              data={{ sections, maxVelocity, maxFriction, defaultMaterial, defaultFluid, glycolPercent, totalSystemHead }}
              suggestedName={`Pipe Sizing - ${sections.length} sections`}
            />

            <DesignAlternativesManager
              open={showAlternativesManager}
              onOpenChange={setShowAlternativesManager}
              entityType="pipe_sizing"
              entityId={loadedSystemId || undefined}
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
