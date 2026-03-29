import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useZoneContext } from '@/hooks/useZoneContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { CrossToolValidationAlert } from '@/components/design/CrossToolValidationAlert';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Gauge,
  Loader2,
  Plus,
  Trash2,
  Wind,
  Droplets,
  Download,
  RotateCcw,
  Save,
  FolderOpen,
} from 'lucide-react';
import { SavePressureDropDialog } from '@/components/design/SavePressureDropDialog';
import { LoadPressureDropDialog } from '@/components/design/LoadPressureDropDialog';
import { PressureComponent as PressureComponentType } from '@/hooks/usePressureDropCalculations';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { toast } from 'sonner';

// Duct fittings with K-factors (ASHRAE)
const DUCT_FITTINGS = [
  { id: 'elbow-90-round', name: '90° Elbow (Round)', kFactor: 0.22, category: 'elbow' },
  { id: 'elbow-90-rect', name: '90° Elbow (Rectangular)', kFactor: 0.45, category: 'elbow' },
  { id: 'elbow-45', name: '45° Elbow', kFactor: 0.12, category: 'elbow' },
  { id: 'tee-straight', name: 'Tee (Straight Through)', kFactor: 0.25, category: 'tee' },
  { id: 'tee-branch', name: 'Tee (Branch)', kFactor: 1.0, category: 'tee' },
  { id: 'transition-div', name: 'Transition (Diverging)', kFactor: 0.25, category: 'transition' },
  { id: 'transition-conv', name: 'Transition (Converging)', kFactor: 0.10, category: 'transition' },
  { id: 'damper-fire', name: 'Fire Damper', kFactor: 0.35, category: 'damper' },
  { id: 'damper-volume', name: 'Volume Damper', kFactor: 0.50, category: 'damper' },
  { id: 'damper-balancing', name: 'Balancing Damper', kFactor: 0.50, category: 'damper' },
];

// Duct equipment with fixed pressure drops (in. w.g.)
const DUCT_EQUIPMENT = [
  { id: 'coil-cooling-4row', name: 'Cooling Coil (4-row)', fixedDrop: 0.50, category: 'coil' },
  { id: 'coil-cooling-6row', name: 'Cooling Coil (6-row)', fixedDrop: 0.75, category: 'coil' },
  { id: 'coil-heating-2row', name: 'Heating Coil (2-row)', fixedDrop: 0.20, category: 'coil' },
  { id: 'filter-merv8', name: 'Filter (MERV 8)', fixedDrop: 0.15, category: 'filter' },
  { id: 'filter-merv13', name: 'Filter (MERV 13)', fixedDrop: 0.35, category: 'filter' },
  { id: 'filter-hepa', name: 'HEPA Filter', fixedDrop: 1.00, category: 'filter' },
  { id: 'diffuser-supply', name: 'Supply Diffuser', fixedDrop: 0.10, category: 'terminal' },
  { id: 'grille-return', name: 'Return Grille', fixedDrop: 0.08, category: 'terminal' },
  { id: 'louver', name: 'Outdoor Air Louver', fixedDrop: 0.10, category: 'intake' },
  { id: 'silencer', name: 'Sound Attenuator', fixedDrop: 0.25, category: 'acoustic' },
];

// Pipe fittings with L/D ratios
const PIPE_FITTINGS = [
  { id: 'elbow-90-std', name: '90° Elbow (Standard)', lOverD: 30, category: 'elbow' },
  { id: 'elbow-90-lr', name: '90° Elbow (Long Radius)', lOverD: 16, category: 'elbow' },
  { id: 'elbow-45', name: '45° Elbow', lOverD: 16, category: 'elbow' },
  { id: 'tee-straight', name: 'Tee (Straight Through)', lOverD: 20, category: 'tee' },
  { id: 'tee-branch', name: 'Tee (Branch)', lOverD: 60, category: 'tee' },
  { id: 'valve-gate', name: 'Gate Valve (Open)', lOverD: 8, category: 'valve' },
  { id: 'valve-ball', name: 'Ball Valve (Open)', lOverD: 3, category: 'valve' },
  { id: 'valve-globe', name: 'Globe Valve (Open)', lOverD: 340, category: 'valve' },
  { id: 'valve-check', name: 'Check Valve (Swing)', lOverD: 75, category: 'valve' },
  { id: 'valve-butterfly', name: 'Butterfly Valve (Open)', lOverD: 20, category: 'valve' },
  { id: 'strainer', name: 'Y-Strainer', lOverD: 100, category: 'strainer' },
  { id: 'reducer', name: 'Reducer', lOverD: 10, category: 'reducer' },
];

// Pipe equipment with fixed pressure drops (ft. w.g.)
const PIPE_EQUIPMENT = [
  { id: 'chiller-evap', name: 'Chiller Evaporator', fixedDrop: 15, category: 'chiller' },
  { id: 'chiller-cond', name: 'Chiller Condenser', fixedDrop: 12, category: 'chiller' },
  { id: 'ahu-coil', name: 'AHU Coil', fixedDrop: 8, category: 'coil' },
  { id: 'fcu-coil', name: 'FCU Coil', fixedDrop: 5, category: 'coil' },
  { id: 'heat-exchanger', name: 'Plate Heat Exchanger', fixedDrop: 10, category: 'hx' },
  { id: 'cooling-tower', name: 'Cooling Tower', fixedDrop: 15, category: 'tower' },
];

interface PressureComponent {
  id: string;
  componentId: string;
  type: 'fitting' | 'equipment';
  name: string;
  kFactor?: number;
  lOverD?: number;
  fixedDrop?: number;
  quantity: number;
  pressureDrop: number;
}

export default function PressureDropCalculator() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { projectId: storedProjectId, setContext } = useZoneContext();
  const projectIdFromUrl = searchParams.get('project') || storedProjectId;

  useEffect(() => {
    if (projectIdFromUrl) {
      setContext(projectIdFromUrl, null, { replace: true });
    }
  }, [projectIdFromUrl, setContext]);

  // Phase 17: Stage locking and validation
  const { canSave, isLocked } = useToolValidation(
    projectIdFromUrl || null,
    'pressure-drop',
    { checkStageLock: true }
  );

  const [activeTab, setActiveTab] = useState<'air' | 'water'>('air');
  
  // Save/Load dialogs
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [loadedId, setLoadedId] = useState<string | undefined>();
  const [loadedName, setLoadedName] = useState<string | undefined>();
  const [loadedDescription, setLoadedDescription] = useState<string | undefined>();
  const [loadedProjectId, setLoadedProjectId] = useState<string | undefined>();
  const [loadedStatus, setLoadedStatus] = useState<'draft' | 'final' | undefined>();
  
  // Air system inputs
  const [airFlowRate, setAirFlowRate] = useState<number>(1000); // CFM
  const [ductSize, setDuctSize] = useState<number>(12); // inches diameter
  const [airComponents, setAirComponents] = useState<PressureComponent[]>([]);
  
  // Water system inputs
  const [waterFlowRate, setWaterFlowRate] = useState<number>(100); // GPM
  const [pipeSize, setPipeSize] = useState<number>(4); // inches diameter
  const [waterComponents, setWaterComponents] = useState<PressureComponent[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Calculate velocity (fpm for air, fps for water)
  const airVelocity = useMemo(() => {
    const area = Math.PI * Math.pow(ductSize / 24, 2); // sq ft
    return airFlowRate / area;
  }, [airFlowRate, ductSize]);

  const waterVelocity = useMemo(() => {
    const area = Math.PI * Math.pow(pipeSize / 24, 2); // sq ft
    return (waterFlowRate / 7.48) / area / 60; // GPM to fps
  }, [waterFlowRate, pipeSize]);

  // Velocity pressure for air (in. w.g.)
  const velocityPressure = useMemo(() => {
    return Math.pow(airVelocity / 4005, 2);
  }, [airVelocity]);

  // Recalculate pressure drops when conditions change
  useEffect(() => {
    setAirComponents(prev => prev.map(comp => ({
      ...comp,
      pressureDrop: comp.fixedDrop ?? (comp.kFactor ?? 0) * velocityPressure * comp.quantity,
    })));
  }, [velocityPressure]);

  useEffect(() => {
    // For pipe, use Hazen-Williams approximation: ΔP ≈ 4.52 × Q^1.85 / (C^1.85 × d^4.87) per 100 ft
    // Simplified: equivalent length method
    const frictionLossPer100ft = 2.5; // ft head per 100 ft (typical for 4" steel pipe at 100 GPM)
    setWaterComponents(prev => prev.map(comp => {
      if (comp.fixedDrop) {
        return { ...comp, pressureDrop: comp.fixedDrop * comp.quantity };
      }
      const equivalentLength = ((comp.lOverD ?? 0) * pipeSize) / 12; // ft
      return {
        ...comp,
        pressureDrop: (equivalentLength / 100) * frictionLossPer100ft * comp.quantity,
      };
    }));
  }, [waterFlowRate, pipeSize]);

  // Totals
  const airTotal = useMemo(() => 
    airComponents.reduce((sum, c) => sum + c.pressureDrop, 0),
  [airComponents]);

  const waterTotal = useMemo(() => 
    waterComponents.reduce((sum, c) => sum + c.pressureDrop, 0),
  [waterComponents]);

  const addAirComponent = (type: 'fitting' | 'equipment', componentId: string) => {
    const source = type === 'fitting' ? DUCT_FITTINGS : DUCT_EQUIPMENT;
    const item = source.find(i => i.id === componentId);
    if (!item) return;

    const pressureDrop = 'fixedDrop' in item 
      ? item.fixedDrop 
      : (item as any).kFactor * velocityPressure;

    const newComponent: PressureComponent = {
      id: crypto.randomUUID(),
      componentId,
      type,
      name: item.name,
      kFactor: 'kFactor' in item ? (item as any).kFactor : undefined,
      fixedDrop: 'fixedDrop' in item ? item.fixedDrop : undefined,
      quantity: 1,
      pressureDrop,
    };
    setAirComponents(prev => [...prev, newComponent]);
    toast.success(`Added ${item.name}`);
  };

  const addWaterComponent = (type: 'fitting' | 'equipment', componentId: string) => {
    const source = type === 'fitting' ? PIPE_FITTINGS : PIPE_EQUIPMENT;
    const item = source.find(i => i.id === componentId);
    if (!item) return;

    const frictionLossPer100ft = 2.5;
    let pressureDrop: number;
    
    if ('fixedDrop' in item) {
      pressureDrop = item.fixedDrop;
    } else {
      const equivalentLength = ((item as any).lOverD * pipeSize) / 12;
      pressureDrop = (equivalentLength / 100) * frictionLossPer100ft;
    }

    const newComponent: PressureComponent = {
      id: crypto.randomUUID(),
      componentId,
      type,
      name: item.name,
      lOverD: 'lOverD' in item ? (item as any).lOverD : undefined,
      fixedDrop: 'fixedDrop' in item ? item.fixedDrop : undefined,
      quantity: 1,
      pressureDrop,
    };
    setWaterComponents(prev => [...prev, newComponent]);
    toast.success(`Added ${item.name}`);
  };

  const updateQuantity = (id: string, quantity: number, isAir: boolean) => {
    if (isAir) {
      setAirComponents(prev => prev.map(c => {
        if (c.id !== id) return c;
        const baseDrop = c.fixedDrop ?? (c.kFactor ?? 0) * velocityPressure;
        return { ...c, quantity, pressureDrop: baseDrop * quantity };
      }));
    } else {
      setWaterComponents(prev => prev.map(c => {
        if (c.id !== id) return c;
        const frictionLossPer100ft = 2.5;
        let baseDrop: number;
        if (c.fixedDrop) {
          baseDrop = c.fixedDrop;
        } else {
          const equivalentLength = ((c.lOverD ?? 0) * pipeSize) / 12;
          baseDrop = (equivalentLength / 100) * frictionLossPer100ft;
        }
        return { ...c, quantity, pressureDrop: baseDrop * quantity };
      }));
    }
  };

  const removeComponent = (id: string, isAir: boolean) => {
    if (isAir) {
      setAirComponents(prev => prev.filter(c => c.id !== id));
    } else {
      setWaterComponents(prev => prev.filter(c => c.id !== id));
    }
    toast.success('Component removed');
  };

  const resetAll = () => {
    if (activeTab === 'air') {
      setAirComponents([]);
      setAirFlowRate(1000);
      setDuctSize(12);
    } else {
      setWaterComponents([]);
      setWaterFlowRate(100);
      setPipeSize(4);
    }
    // Clear loaded state
    setLoadedId(undefined);
    setLoadedName(undefined);
    setLoadedDescription(undefined);
    setLoadedProjectId(undefined);
    setLoadedStatus(undefined);
    toast.success('Calculator reset');
  };

  const handleLoadCalculation = (calc: {
    id: string;
    name: string;
    description: string | null;
    projectId: string | null;
    status: 'draft' | 'final';
    flowRate: number;
    sizeInches: number;
    velocity: number | null;
    velocityPressure: number | null;
    components: PressureComponent[];
    totalPressureDrop: number;
    unit: string;
  }) => {
    // Set tab based on calculation type (infer from unit)
    const isAir = calc.unit.includes('w.g.');
    setActiveTab(isAir ? 'air' : 'water');
    
    if (isAir) {
      setAirFlowRate(calc.flowRate);
      setDuctSize(calc.sizeInches);
      setAirComponents(calc.components);
    } else {
      setWaterFlowRate(calc.flowRate);
      setPipeSize(calc.sizeInches);
      setWaterComponents(calc.components);
    }
    
    // Store loaded metadata for updating
    setLoadedId(calc.id);
    setLoadedName(calc.name);
    setLoadedDescription(calc.description || undefined);
    setLoadedProjectId(calc.projectId || undefined);
    setLoadedStatus(calc.status);
    
    toast.success(`Loaded: ${calc.name}`);
  };

  const exportResults = () => {
    const components = activeTab === 'air' ? airComponents : waterComponents;
    const total = activeTab === 'air' ? airTotal : waterTotal;
    const unit = activeTab === 'air' ? 'in. w.g.' : 'ft. head';
    
    const csv = [
      ['Component', 'Type', 'Quantity', `Pressure Drop (${unit})`],
      ...components.map(c => [c.name, c.type, c.quantity.toString(), c.pressureDrop.toFixed(3)]),
      ['', '', 'TOTAL', total.toFixed(3)],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pressure-drop-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Results exported');
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
        {/* Workflow Progress Bar */}
        {projectIdFromUrl && (
          <DesignWorkflowProgressBar
            projectId={projectIdFromUrl}
            variant="compact"
            showLabels={false}
            showPercentages={true}
            className="mb-2"
          />
        )}

        {/* Cross-Tool Validation Alert */}
        {projectIdFromUrl && (
          <CrossToolValidationAlert
            projectId={projectIdFromUrl}
            currentTool="duct-system"
            variant="alert"
            className="mb-2"
          />
        )}

        {/* Phase 17: Unified Tool Header with Stage Locking */}
        <ToolPageHeader
          toolType="pressure-drop"
          toolName="Pressure Drop Calculator"
          projectId={projectIdFromUrl}
          showLockButton={true}
          showValidation={true}
        />

        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Gauge className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pressure Drop Calculator</h1>
              <p className="text-muted-foreground">
                Calculate pressure drops for fittings and equipment
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowLoadDialog(true)}>
              <FolderOpen className="w-4 h-4 mr-2" />
              Load
            </Button>
            <Button variant="outline" onClick={() => setShowSaveDialog(true)}>
              <Save className="w-4 h-4 mr-2" />
              {loadedId ? 'Update' : 'Save'}
            </Button>
            <Button variant="outline" onClick={resetAll}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={exportResults}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'air' | 'water')}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="air" className="gap-2">
              <Wind className="w-4 h-4" />
              Air System
            </TabsTrigger>
            <TabsTrigger value="water" className="gap-2">
              <Droplets className="w-4 h-4" />
              Water System
            </TabsTrigger>
          </TabsList>

          {/* Air System Tab */}
          <TabsContent value="air" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Flow Conditions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Flow Conditions</CardTitle>
                  <CardDescription>Enter duct size and airflow</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="airflow">Airflow Rate (CFM)</Label>
                    <Input
                      id="airflow"
                      type="number"
                      value={airFlowRate}
                      onChange={(e) => setAirFlowRate(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ductsize">Duct Diameter (in)</Label>
                    <Input
                      id="ductsize"
                      type="number"
                      value={ductSize}
                      onChange={(e) => setDuctSize(Number(e.target.value))}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Velocity</span>
                      <span className="font-medium">{airVelocity.toFixed(0)} fpm</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Velocity Pressure</span>
                      <span className="font-medium">{velocityPressure.toFixed(4)} in. w.g.</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Component Builder */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Component Builder</CardTitle>
                  <CardDescription>Add fittings and equipment to calculate total</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Add Fitting</Label>
                      <Select onValueChange={(v) => addAirComponent('fitting', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fitting..." />
                        </SelectTrigger>
                        <SelectContent>
                          {DUCT_FITTINGS.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name} (K={f.kFactor})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Add Equipment</Label>
                      <Select onValueChange={(v) => addAirComponent('equipment', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select equipment..." />
                        </SelectTrigger>
                        <SelectContent>
                          {DUCT_EQUIPMENT.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.name} ({e.fixedDrop}" w.g.)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <ScrollArea className="h-[300px]">
                    {airComponents.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Plus className="w-8 h-8 mb-2" />
                        <p className="text-sm">Add components to calculate pressure drop</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {airComponents.map((comp) => (
                          <div
                            key={comp.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                          >
                            <div className="flex items-center gap-3">
                              <Badge variant={comp.type === 'fitting' ? 'default' : 'secondary'}>
                                {comp.type}
                              </Badge>
                              <span className="font-medium text-sm">{comp.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Label className="text-xs text-muted-foreground">Qty:</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  value={comp.quantity}
                                  onChange={(e) => updateQuantity(comp.id, Number(e.target.value), true)}
                                  className="w-16 h-8"
                                />
                              </div>
                              <span className="font-mono text-sm w-24 text-right">
                                {comp.pressureDrop.toFixed(3)} in.
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => removeComponent(comp.id, true)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  <Separator />

                  <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Components: {airComponents.length}</p>
                      <p className="text-lg font-bold text-primary">
                        Total Pressure Drop: {airTotal.toFixed(3)} in. w.g.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Equivalent to</p>
                      <p className="font-medium">{(airTotal * 249.09).toFixed(1)} Pa</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Water System Tab */}
          <TabsContent value="water" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Flow Conditions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Flow Conditions</CardTitle>
                  <CardDescription>Enter pipe size and flow rate</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="waterflow">Flow Rate (GPM)</Label>
                    <Input
                      id="waterflow"
                      type="number"
                      value={waterFlowRate}
                      onChange={(e) => setWaterFlowRate(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pipesize">Pipe Diameter (in)</Label>
                    <Input
                      id="pipesize"
                      type="number"
                      value={pipeSize}
                      onChange={(e) => setPipeSize(Number(e.target.value))}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Velocity</span>
                      <span className="font-medium">{waterVelocity.toFixed(2)} fps</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Friction (est.)</span>
                      <span className="font-medium">2.5 ft/100ft</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Component Builder */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Component Builder</CardTitle>
                  <CardDescription>Add fittings and equipment to calculate total</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Add Fitting</Label>
                      <Select onValueChange={(v) => addWaterComponent('fitting', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fitting..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PIPE_FITTINGS.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name} (L/D={f.lOverD})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Add Equipment</Label>
                      <Select onValueChange={(v) => addWaterComponent('equipment', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select equipment..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PIPE_EQUIPMENT.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.name} ({e.fixedDrop} ft)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <ScrollArea className="h-[300px]">
                    {waterComponents.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Plus className="w-8 h-8 mb-2" />
                        <p className="text-sm">Add components to calculate pressure drop</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {waterComponents.map((comp) => (
                          <div
                            key={comp.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                          >
                            <div className="flex items-center gap-3">
                              <Badge variant={comp.type === 'fitting' ? 'default' : 'secondary'}>
                                {comp.type}
                              </Badge>
                              <span className="font-medium text-sm">{comp.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Label className="text-xs text-muted-foreground">Qty:</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  value={comp.quantity}
                                  onChange={(e) => updateQuantity(comp.id, Number(e.target.value), false)}
                                  className="w-16 h-8"
                                />
                              </div>
                              <span className="font-mono text-sm w-24 text-right">
                                {comp.pressureDrop.toFixed(2)} ft
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => removeComponent(comp.id, false)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  <Separator />

                  <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Components: {waterComponents.length}</p>
                      <p className="text-lg font-bold text-primary">
                        Total Pressure Drop: {waterTotal.toFixed(2)} ft head
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Equivalent to</p>
                      <p className="font-medium">{(waterTotal * 0.4335).toFixed(2)} psi</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Reference</CardTitle>
            <CardDescription>Common K-factors and L/D ratios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Wind className="w-4 h-4" /> Duct Fittings (ASHRAE)
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {DUCT_FITTINGS.slice(0, 6).map((f) => (
                    <div key={f.id} className="flex justify-between text-muted-foreground">
                      <span>{f.name}</span>
                      <span className="font-mono">K={f.kFactor}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Droplets className="w-4 h-4" /> Pipe Fittings
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {PIPE_FITTINGS.slice(0, 6).map((f) => (
                    <div key={f.id} className="flex justify-between text-muted-foreground">
                      <span>{f.name}</span>
                      <span className="font-mono">L/D={f.lOverD}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save/Load Dialogs */}
      <SavePressureDropDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        calculationType={activeTab}
        flowRate={activeTab === 'air' ? airFlowRate : waterFlowRate}
        sizeInches={activeTab === 'air' ? ductSize : pipeSize}
        velocity={activeTab === 'air' ? airVelocity : waterVelocity}
        velocityPressure={activeTab === 'air' ? velocityPressure : undefined}
        components={activeTab === 'air' ? airComponents : waterComponents}
        totalPressureDrop={activeTab === 'air' ? airTotal : waterTotal}
        unit={activeTab === 'air' ? 'in. w.g.' : 'ft. head'}
        existingId={loadedId}
        existingName={loadedName}
        existingDescription={loadedDescription}
        existingProjectId={loadedProjectId}
        existingStatus={loadedStatus}
        onSaved={(id) => {
          setLoadedId(id);
        }}
      />

      <LoadPressureDropDialog
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        onLoad={handleLoadCalculation}
      />

      <DesignWorkflowNextStep
        currentPath="/design/pressure-drop"
        projectId={projectIdFromUrl || loadedProjectId}
      />
    </DashboardLayout>
  );
}
