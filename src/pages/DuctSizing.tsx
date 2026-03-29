import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useZoneContext } from '@/hooks/useZoneContext';
import { useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Loader2,
  Wind,
  Calculator,
  Plus,
  Trash2,
  Info,
  Download,
  FolderKanban,
  ChevronLeft,
  MapPin,
  GitBranch,
} from 'lucide-react';
import { toast } from 'sonner';
import { SaveDuctDesignDialog, LoadDuctDesignDialog } from '@/components/design/DuctDesignDialogs';
import { ZoneAssignmentPanel, type ZoneAssignment } from '@/components/design/ZoneAssignmentPanel';
import { useDuctSizingExport } from '@/hooks/useDuctSizingExport';
import { FanSelectionDialog } from '@/components/duct-design/FanSelectionDialog';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { useConflictDetection } from '@/hooks/useConflictDetection';
import { SaveAsAlternativeDialog } from '@/components/design/SaveAsAlternativeDialog';
import { DesignAlternativesManager } from '@/components/design/DesignAlternativesManager';
import { AlternativeComparisonView } from '@/components/design/AlternativeComparisonView';
import { DesignAlternative } from '@/hooks/useDesignAlternatives';
import { usePreSaveValidation } from '@/hooks/usePreSaveValidation';
import { PreSaveValidationAlert } from '@/components/design/PreSaveValidationAlert';
import type { FanCurve } from '@/hooks/useFanCurves';

interface DuctSection {
  id: string;
  name: string;
  cfm: number;
  length: number;
  fittings: number; // Equivalent length of fittings
  shape: 'round' | 'rectangular';
  width?: number;
  height?: number;
  diameter?: number;
  velocity?: number;
  frictionLoss?: number;
  totalPressureDrop?: number;
}

// Duct sizing calculations
const AIR_DENSITY = 0.075; // lb/ft³ at standard conditions
const FRICTION_FACTOR = 0.0003; // for galvanized steel

const calculateRoundDuct = (cfm: number, velocity: number): number => {
  const area = cfm / velocity; // ft²
  const diameter = Math.sqrt((4 * area) / Math.PI) * 12; // inches
  return Math.ceil(diameter / 2) * 2; // Round up to nearest 2"
};

const calculateVelocity = (cfm: number, diameter: number): number => {
  const area = Math.PI * Math.pow(diameter / 12 / 2, 2); // ft²
  return cfm / area; // fpm
};

const calculateFriction = (cfm: number, diameter: number): number => {
  const velocity = calculateVelocity(cfm, diameter);
  const velocityPressure = Math.pow(velocity / 4005, 2); // in. w.g.
  // Darcy-Weisbach approximation
  return 0.109136 * Math.pow(cfm, 1.9) / Math.pow(diameter, 5.02);
};

const roundToRectangular = (diameter: number, aspectRatio: number = 2): { width: number; height: number } => {
  const area = Math.PI * Math.pow(diameter / 2, 2);
  // Find rectangular equivalent
  const height = Math.sqrt(area / aspectRatio);
  const width = height * aspectRatio;
  return {
    width: Math.ceil(width / 2) * 2,
    height: Math.ceil(height / 2) * 2,
  };
};

const calculateEquivalentDiameter = (width: number, height: number): number => {
  return 1.3 * Math.pow(width * height, 0.625) / Math.pow(width + height, 0.25);
};

// Static regain calculation - calculates downstream velocity to regain friction loss
const calculateStaticRegainVelocity = (
  upstreamVelocity: number,
  frictionLoss: number,
  regainFactor: number = 0.75
): number => {
  // Velocity pressure = (V/4005)² in. w.g.
  const vpUpstream = Math.pow(upstreamVelocity / 4005, 2);
  
  // Required velocity pressure reduction to regain friction loss
  const vpReduction = frictionLoss / regainFactor;
  
  // New velocity pressure
  const vpDownstream = Math.max(vpUpstream - vpReduction, Math.pow(500 / 4005, 2)); // Min 500 fpm
  
  // Calculate new velocity from velocity pressure
  return 4005 * Math.sqrt(vpDownstream);
};

// Size duct for static regain method
const calculateStaticRegainDuct = (
  cfm: number,
  upstreamVelocity: number,
  upstreamDiameter: number,
  length: number,
  fittings: number
): { diameter: number; velocity: number } => {
  // Calculate friction loss at upstream velocity for the segment
  const frictionLoss = calculateFriction(cfm, upstreamDiameter) * (length + fittings);
  
  // Calculate downstream velocity to regain the friction loss
  const targetVelocity = calculateStaticRegainVelocity(upstreamVelocity, frictionLoss);
  
  // Size duct for the new velocity
  const diameter = calculateRoundDuct(cfm, targetVelocity);
  const actualVelocity = calculateVelocity(cfm, diameter);
  
  return { diameter, velocity: actualVelocity };
};

export default function DuctSizing() {
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
  const { exportToPDF, exportToExcel } = useDuctSizingExport();

  const { data: projects } = useProjects();
  const linkedProject = projects?.find(p => p.id === projectIdFromUrl);

  // Pre-save validation
  const { blockers, warnings } = usePreSaveValidation(
    projectIdFromUrl || null,
    'duct-sizing'
  );

  const [method, setMethod] = useState<'equal-friction' | 'velocity' | 'static-regain'>('equal-friction');
  const [targetFriction, setTargetFriction] = useState(0.08); // in. w.g. per 100 ft
  const [targetVelocity, setTargetVelocity] = useState(1200); // fpm
  const [ductShape, setDuctShape] = useState<'round' | 'rectangular'>('round');
  const [aspectRatio, setAspectRatio] = useState(2);
  const [zoneAssignments, setZoneAssignments] = useState<ZoneAssignment[]>([]);
  const [fanDialogOpen, setFanDialogOpen] = useState(false);
  const [selectedFan, setSelectedFan] = useState<FanCurve | null>(null);
  const [loadedDesignId, setLoadedDesignId] = useState<string | null>(null);

  // Concurrent Editing Awareness
  const queryClient = useQueryClient();
  const { hasConflict, latestRevision, clearConflict } = useConflictDetection({
    entityType: 'duct_sizing',
    entityId: loadedDesignId,
    currentRevisionNumber: 0,
  });

  const handleReloadLatest = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['duct_systems'] });
    clearConflict();
    toast.info('Reloaded latest version');
  }, [queryClient, clearConflict]);

  const handleForceSave = useCallback(() => {
    clearConflict();
  }, [clearConflict]);

  const [sections, setSections] = useState<DuctSection[]>([
    { id: '1', name: 'Main Supply', cfm: 5000, length: 50, fittings: 30, shape: 'round' },
    { id: '2', name: 'Branch 1', cfm: 2000, length: 30, fittings: 20, shape: 'round' },
    { id: '3', name: 'Branch 2', cfm: 1500, length: 40, fittings: 25, shape: 'round' },
    { id: '4', name: 'Terminal 1', cfm: 500, length: 20, fittings: 15, shape: 'round' },
  ]);

  // Design Alternatives state
  const [showSaveAlternative, setShowSaveAlternative] = useState(false);
  const [showAlternativesManager, setShowAlternativesManager] = useState(false);
  const [showAlternativeComparison, setShowAlternativeComparison] = useState(false);
  const [alternativesToCompare, setAlternativesToCompare] = useState<DesignAlternative[]>([]);

  // Design Alternatives handlers
  const handleLoadAlternative = useCallback((data: Record<string, unknown>) => {
    if (data.sections) setSections(data.sections as DuctSection[]);
    if (data.method) setMethod(data.method as 'equal-friction' | 'velocity' | 'static-regain');
    if (data.targetFriction) setTargetFriction(data.targetFriction as number);
    if (data.targetVelocity) setTargetVelocity(data.targetVelocity as number);
    if (data.ductShape) setDuctShape(data.ductShape as 'round' | 'rectangular');
    setShowAlternativesManager(false);
    toast.success('Alternative loaded');
  }, []);

  const handleCompareAlternatives = useCallback((alternatives: DesignAlternative[]) => {
    setAlternativesToCompare(alternatives);
    setShowAlternativeComparison(true);
    setShowAlternativesManager(false);
  }, []);

  const [newSection, setNewSection] = useState({
    name: '',
    cfm: 1000,
    length: 20,
    fittings: 10,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Calculate duct sizes
  const calculatedSections = useMemo(() => {
    // For static regain, we need to process sections sequentially
    // First section uses velocity method, subsequent sections use regain
    let previousVelocity = targetVelocity;
    let previousDiameter = 0;
    
    return sections.map((section, index) => {
      let diameter: number;
      let velocity: number;
      
      if (method === 'velocity') {
        diameter = calculateRoundDuct(section.cfm, targetVelocity);
        velocity = calculateVelocity(section.cfm, diameter);
      } else if (method === 'static-regain') {
        if (index === 0) {
          // First section: use initial velocity (like velocity method)
          diameter = calculateRoundDuct(section.cfm, targetVelocity);
          velocity = calculateVelocity(section.cfm, diameter);
        } else {
          // Subsequent sections: use static regain
          const result = calculateStaticRegainDuct(
            section.cfm,
            previousVelocity,
            previousDiameter,
            section.length,
            section.fittings
          );
          diameter = result.diameter;
          velocity = result.velocity;
        }
        // Store for next iteration
        previousVelocity = velocity;
        previousDiameter = diameter;
      } else {
        // Equal friction method - iterate to find diameter
        diameter = 6;
        for (let d = 6; d <= 60; d += 2) {
          const friction = calculateFriction(section.cfm, d);
          if (friction <= targetFriction / 100) {
            diameter = d;
            break;
          }
        }
        velocity = calculateVelocity(section.cfm, diameter);
      }

      const frictionLoss = calculateFriction(section.cfm, diameter);
      const totalLength = section.length + section.fittings;
      const totalPressureDrop = frictionLoss * totalLength;

      let width: number | undefined;
      let height: number | undefined;

      if (ductShape === 'rectangular') {
        const rect = roundToRectangular(diameter, aspectRatio);
        width = rect.width;
        height = rect.height;
      }

      return {
        ...section,
        diameter,
        velocity: Math.round(velocity),
        frictionLoss: frictionLoss * 100, // per 100 ft
        totalPressureDrop,
        width,
        height,
        shape: ductShape,
      };
    });
  }, [sections, method, targetVelocity, targetFriction, ductShape, aspectRatio]);

  const totalSystemPressure = calculatedSections.reduce(
    (sum, s) => Math.max(sum, s.totalPressureDrop || 0),
    0
  );

  const totalSystemCfm = calculatedSections.reduce(
    (sum, s) => sum + s.cfm,
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
        cfm: newSection.cfm,
        length: newSection.length,
        fittings: newSection.fittings,
        shape: ductShape,
      },
    ]);
    setNewSection({ name: '', cfm: 1000, length: 20, fittings: 10 });
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
      { label: 'Air Distribution' },
      { label: 'Duct Sizing' }
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

        {/* Pre-Save Validation Alert */}
        <PreSaveValidationAlert blockers={blockers} warnings={warnings} className="mb-4" />

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
            {zoneAssignments.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="w-3 h-3" />
                {zoneAssignments.length} zone{zoneAssignments.length !== 1 ? 's' : ''}
              </Badge>
            )}
            <Badge variant="outline">{linkedProject.status}</Badge>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Duct Sizing Calculator</h1>
            <p className="text-muted-foreground">
              Size ducts using equal friction or velocity methods
            </p>
          </div>
          <ActiveEditorsIndicator
            entityType="duct_sizing"
            entityId={loadedDesignId}
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
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowSaveAlternative(true)}>
                  Save as Alternative...
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowAlternativesManager(true)}>
                  View Alternatives
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" className="gap-2" onClick={() => setFanDialogOpen(true)}>
              <Wind className="w-4 h-4" />
              Fan
            </Button>
            <LoadDuctDesignDialog
              onLoad={(system) => {
                // Update state from loaded design
                setMethod(system.design_method === 'equal_friction' ? 'equal-friction' : 'velocity');
                if (system.target_friction_rate) setTargetFriction(system.target_friction_rate);
                if (system.design_velocity_fpm) setTargetVelocity(system.design_velocity_fpm);
                
                if (system.segments.length > 0) {
                  setSections(system.segments.map((seg, i) => ({
                    id: crypto.randomUUID(),
                    name: seg.segment_name,
                    cfm: seg.cfm,
                    length: seg.length_ft || 0,
                    fittings: seg.fittings_equivalent_length_ft,
                    shape: (seg.duct_shape as 'round' | 'rectangular') || 'round',
                    diameter: seg.diameter_in || undefined,
                    width: seg.width_in || undefined,
                    height: seg.height_in || undefined,
                  })));
                  setDuctShape(system.segments[0].duct_shape as 'round' | 'rectangular' || 'round');
                }
                toast.success(`Loaded: ${system.system_name}`);
              }}
            />
            <SaveDuctDesignDialog
              sections={calculatedSections}
              method={method}
              targetFriction={targetFriction}
              targetVelocity={targetVelocity}
              ductShape={ductShape}
              totalSystemPressure={totalSystemPressure}
              zoneAssignments={zoneAssignments}
              onSave={() => toast.success('Design saved successfully')}
            />
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => exportToPDF({
                sections: calculatedSections,
                method: method === 'static-regain' ? 'equal-friction' : method,
                targetFriction,
                targetVelocity,
                ductShape,
                totalSystemPressure,
                totalSystemCfm,
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
                method: method === 'static-regain' ? 'equal-friction' : method,
                targetFriction,
                targetVelocity,
                ductShape,
                totalSystemPressure,
                totalSystemCfm,
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
            entityType="duct_sizing"
            entityId={loadedDesignId}
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
                <Label>Sizing Method</Label>
                <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal-friction">Equal Friction</SelectItem>
                    <SelectItem value="velocity">Velocity Reduction</SelectItem>
                    <SelectItem value="static-regain">Static Regain</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {method === 'equal-friction' ? (
                <div className="space-y-2">
                  <Label>Target Friction (in. w.g./100ft)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={targetFriction}
                    onChange={(e) => setTargetFriction(parseFloat(e.target.value) || 0.08)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Typical: 0.08-0.10 for low velocity systems
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Target Velocity (fpm)</Label>
                  <Input
                    type="number"
                    value={targetVelocity}
                    onChange={(e) => setTargetVelocity(parseFloat(e.target.value) || 1200)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Main: 1200-2000, Branch: 800-1200
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Duct Shape</Label>
                <Select value={ductShape} onValueChange={(v) => setDuctShape(v as typeof ductShape)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round">Round</SelectItem>
                    <SelectItem value="rectangular">Rectangular</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {ductShape === 'rectangular' && (
                <div className="space-y-2">
                  <Label>Aspect Ratio</Label>
                  <Select value={aspectRatio.toString()} onValueChange={(v) => setAspectRatio(parseFloat(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1:1</SelectItem>
                      <SelectItem value="1.5">1.5:1</SelectItem>
                      <SelectItem value="2">2:1</SelectItem>
                      <SelectItem value="3">3:1</SelectItem>
                      <SelectItem value="4">4:1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm font-medium text-primary">System Pressure</p>
                  <p className="text-2xl font-bold">{totalSystemPressure.toFixed(2)} in. w.g.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Zones Served Section */}
            {projectIdFromUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Zones Served
                  </CardTitle>
                  <CardDescription>
                    Assign zones that this duct system will serve
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ZoneAssignmentPanel
                    projectId={projectIdFromUrl}
                    selectedZones={zoneAssignments}
                    onZonesChange={setZoneAssignments}
                    totalCfm={totalSystemCfm}
                  />
                </CardContent>
              </Card>
            )}

            {/* Add Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add Duct Section</CardTitle>
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
                    <Label>CFM</Label>
                    <Input
                      type="number"
                      value={newSection.cfm}
                      onChange={(e) => setNewSection({ ...newSection, cfm: parseFloat(e.target.value) || 0 })}
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
                  <Wind className="w-5 h-5" />
                  Duct Sizing Results
                </CardTitle>
                <CardDescription>
                  Calculated duct sizes based on {method === 'equal-friction' ? 'equal friction' : 'velocity'} method
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Section</TableHead>
                        <TableHead className="text-right">CFM</TableHead>
                        <TableHead className="text-right">Size</TableHead>
                        <TableHead className="text-right">Velocity (fpm)</TableHead>
                        <TableHead className="text-right">Friction/100ft</TableHead>
                        <TableHead className="text-right">Total ΔP</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calculatedSections.map((section) => (
                        <TableRow key={section.id}>
                          <TableCell className="font-medium">{section.name}</TableCell>
                          <TableCell className="text-right">{section.cfm.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono">
                            {section.shape === 'round' ? (
                              <span>{section.diameter}" Ø</span>
                            ) : (
                              <span>{section.width}" × {section.height}"</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{section.velocity?.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{section.frictionLoss?.toFixed(3)}"</TableCell>
                          <TableCell className="text-right font-medium">
                            {section.totalPressureDrop?.toFixed(3)}"
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
                <CardTitle className="text-base">Recommended Velocities (fpm)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="font-medium">Main Ducts</p>
                    <p className="text-muted-foreground">1200-2000</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="font-medium">Branch Ducts</p>
                    <p className="text-muted-foreground">800-1200</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="font-medium">Risers</p>
                    <p className="text-muted-foreground">1000-1500</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="font-medium">Supply Outlets</p>
                    <p className="text-muted-foreground">600-800</p>
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
              <p className="font-medium text-foreground mb-1">About Duct Sizing</p>
              <p>
                The <strong>Equal Friction Method</strong> sizes ducts for constant pressure drop per unit length,
                resulting in self-balancing systems. The <strong>Velocity Reduction Method</strong> progressively
                reduces velocity from main to branches to control noise. Equivalent length accounts for fittings.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Fan Selection Dialog */}
        <FanSelectionDialog
          open={fanDialogOpen}
          onOpenChange={setFanDialogOpen}
          requiredCfm={totalSystemCfm}
          requiredStaticPressure={totalSystemPressure}
          onSelectFan={(fan) => {
            setSelectedFan(fan);
            toast.success(`Selected fan: ${fan.manufacturer} ${fan.model}`);
          }}
        />

        {/* Design Workflow Next Step */}
        <DesignWorkflowNextStep
          currentPath="/design/duct-sizing"
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
              entityType="duct_sizing"
              entityId={loadedDesignId || undefined}
              data={{ sections: calculatedSections, method, targetFriction, targetVelocity, ductShape, totalSystemPressure }}
              suggestedName={`Duct Design - ${calculatedSections.length} sections`}
            />

            <DesignAlternativesManager
              open={showAlternativesManager}
              onOpenChange={setShowAlternativesManager}
              entityType="duct_sizing"
              entityId={loadedDesignId || undefined}
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
