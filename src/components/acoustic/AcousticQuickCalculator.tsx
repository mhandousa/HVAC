import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Wind, Droplets, Plus, X, Calculator, CheckCircle2, AlertTriangle, Search } from 'lucide-react';
import { useFittingsLibrary, FITTING_CATEGORY_LABELS, DuctFitting } from '@/hooks/useFittingsLibrary';
import { SAUDI_NC_STANDARDS } from '@/hooks/useAcousticCalculator';
import {
  calculateDuctVelocity,
  calculateDuctArea,
  calculateDuctVelocityNoise,
  calculateDuctFittingNoise,
  calculatePipeVelocity,
  calculatePipeVelocityNoise,
  calculatePipeFittingNoise,
  combineNoiseLevels,
  dbToNC,
  getNCComplianceStatus,
} from '@/lib/acoustic-noise-calculations';
import { FittingNoiseBreakdown } from './FittingNoiseBreakdown';

interface SelectedFitting {
  id: string;
  code: string;
  name: string;
  category: string;
  coefficient: number;
  quantity: number;
  noiseDb: number;
}

interface QuickCalcState {
  systemType: 'duct' | 'pipe';
  spaceType: string;
  // Duct inputs
  airflowCfm: number;
  ductShape: 'round' | 'rectangular';
  diameterIn: number;
  widthIn: number;
  heightIn: number;
  // Pipe inputs
  flowGpm: number;
  pipeSizeIn: number;
}

const PIPE_SIZES = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12];

export function AcousticQuickCalculator() {
  const [state, setState] = useState<QuickCalcState>({
    systemType: 'duct',
    spaceType: 'open-office',
    airflowCfm: 1000,
    ductShape: 'round',
    diameterIn: 12,
    widthIn: 16,
    heightIn: 10,
    flowGpm: 50,
    pipeSizeIn: 2,
  });

  const [selectedFittings, setSelectedFittings] = useState<SelectedFitting[]>([]);
  const [fittingDialogOpen, setFittingDialogOpen] = useState(false);
  const [fittingSearch, setFittingSearch] = useState('');

  // Fetch fittings library
  const { data: libraryFittings = [] } = useFittingsLibrary({
    shape: state.ductShape,
    searchTerm: fittingSearch || undefined,
  });

  // Calculate results
  const results = useMemo(() => {
    const targetNC = SAUDI_NC_STANDARDS[state.spaceType]?.nc || 40;

    if (state.systemType === 'duct') {
      // Calculate duct velocity and noise
      const area = calculateDuctArea(
        state.ductShape,
        state.ductShape === 'round' ? state.diameterIn : undefined,
        state.ductShape === 'rectangular' ? state.widthIn : undefined,
        state.ductShape === 'rectangular' ? state.heightIn : undefined
      );
      const velocity = calculateDuctVelocity(state.airflowCfm, area);
      const velocityNoise = calculateDuctVelocityNoise(velocity, area);

      // Calculate fitting noises
      const fittingNoises = selectedFittings.map(f => f.noiseDb);
      const combinedFittingNoise = combineNoiseLevels(fittingNoises);
      const totalNoise = combineNoiseLevels([velocityNoise, combinedFittingNoise]);
      const ncRating = dbToNC(totalNoise);
      const status = getNCComplianceStatus(ncRating, targetNC);

      return {
        velocity: Math.round(velocity),
        velocityUnit: 'FPM',
        velocityNoise: Math.round(velocityNoise * 10) / 10,
        fittingNoise: Math.round(combinedFittingNoise * 10) / 10,
        totalNoise: Math.round(totalNoise * 10) / 10,
        ncRating,
        targetNC,
        status,
        attenuationRequired: Math.max(0, ncRating - targetNC),
      };
    } else {
      // Calculate pipe velocity and noise
      // Approximate inside diameter (Schedule 40)
      const insideDiameter = state.pipeSizeIn * 0.9;
      const velocity = calculatePipeVelocity(state.flowGpm, insideDiameter);
      const velocityNoise = calculatePipeVelocityNoise(velocity, state.pipeSizeIn);

      // Calculate fitting noises
      const fittingNoises = selectedFittings.map(f => f.noiseDb);
      const combinedFittingNoise = combineNoiseLevels(fittingNoises);
      const totalNoise = combineNoiseLevels([velocityNoise, combinedFittingNoise]);
      const ncRating = dbToNC(totalNoise);
      const status = getNCComplianceStatus(ncRating, targetNC);

      return {
        velocity: Math.round(velocity * 10) / 10,
        velocityUnit: 'FPS',
        velocityNoise: Math.round(velocityNoise * 10) / 10,
        fittingNoise: Math.round(combinedFittingNoise * 10) / 10,
        totalNoise: Math.round(totalNoise * 10) / 10,
        ncRating,
        targetNC,
        status,
        attenuationRequired: Math.max(0, ncRating - targetNC),
      };
    }
  }, [state, selectedFittings]);

  // Add fitting from library
  const addFitting = (fitting: DuctFitting) => {
    const velocity = state.systemType === 'duct' ? results.velocity : results.velocity * 100;
    const noiseDb = calculateDuctFittingNoise(
      fitting.fitting_category,
      fitting.loss_coefficient,
      velocity,
      1
    );

    const newFitting: SelectedFitting = {
      id: `${fitting.id}-${Date.now()}`,
      code: fitting.fitting_code,
      name: fitting.fitting_name,
      category: fitting.fitting_category,
      coefficient: fitting.loss_coefficient,
      quantity: 1,
      noiseDb: Math.round(noiseDb * 10) / 10,
    };

    setSelectedFittings(prev => [...prev, newFitting]);
    setFittingDialogOpen(false);
    setFittingSearch('');
  };

  // Update fitting quantity
  const updateFittingQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedFittings(prev =>
      prev.map(f => {
        if (f.id !== id) return f;
        const velocity = state.systemType === 'duct' ? results.velocity : results.velocity * 100;
        const noiseDb = calculateDuctFittingNoise(f.category, f.coefficient, velocity, quantity);
        return { ...f, quantity, noiseDb: Math.round(noiseDb * 10) / 10 };
      })
    );
  };

  // Remove fitting
  const removeFitting = (id: string) => {
    setSelectedFittings(prev => prev.filter(f => f.id !== id));
  };

  // Group library fittings by category
  const groupedFittings = useMemo(() => {
    return libraryFittings.reduce((acc, fitting) => {
      const category = fitting.fitting_category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(fitting);
      return acc;
    }, {} as Record<string, DuctFitting[]>);
  }, [libraryFittings]);

  const getStatusIcon = () => {
    switch (results.status) {
      case 'compliant':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'marginal':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case 'exceeds':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusText = () => {
    switch (results.status) {
      case 'compliant':
        return 'Compliant';
      case 'marginal':
        return 'Marginal';
      case 'exceeds':
        return 'Exceeds Target';
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Quick Noise Calculator
          </CardTitle>
          <CardDescription>
            Calculate noise levels for duct or pipe systems with manual inputs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* System Type Tabs */}
          <Tabs
            value={state.systemType}
            onValueChange={v => {
              setState(s => ({ ...s, systemType: v as 'duct' | 'pipe' }));
              setSelectedFittings([]);
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="duct" className="flex items-center gap-2">
                <Wind className="h-4 w-4" />
                Duct System
              </TabsTrigger>
              <TabsTrigger value="pipe" className="flex items-center gap-2">
                <Droplets className="h-4 w-4" />
                Pipe System
              </TabsTrigger>
            </TabsList>

            <TabsContent value="duct" className="space-y-4 pt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Airflow (CFM)</Label>
                  <Input
                    type="number"
                    value={state.airflowCfm}
                    onChange={e => setState(s => ({ ...s, airflowCfm: Number(e.target.value) }))}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duct Shape</Label>
                  <Select
                    value={state.ductShape}
                    onValueChange={v => setState(s => ({ ...s, ductShape: v as 'round' | 'rectangular' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round">Round</SelectItem>
                      <SelectItem value="rectangular">Rectangular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {state.ductShape === 'round' ? (
                <div className="space-y-2">
                  <Label>Diameter (in)</Label>
                  <Input
                    type="number"
                    value={state.diameterIn}
                    onChange={e => setState(s => ({ ...s, diameterIn: Number(e.target.value) }))}
                    min={4}
                    max={60}
                  />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Width (in)</Label>
                    <Input
                      type="number"
                      value={state.widthIn}
                      onChange={e => setState(s => ({ ...s, widthIn: Number(e.target.value) }))}
                      min={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Height (in)</Label>
                    <Input
                      type="number"
                      value={state.heightIn}
                      onChange={e => setState(s => ({ ...s, heightIn: Number(e.target.value) }))}
                      min={4}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pipe" className="space-y-4 pt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Flow Rate (GPM)</Label>
                  <Input
                    type="number"
                    value={state.flowGpm}
                    onChange={e => setState(s => ({ ...s, flowGpm: Number(e.target.value) }))}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pipe Size (in)</Label>
                  <Select
                    value={String(state.pipeSizeIn)}
                    onValueChange={v => setState(s => ({ ...s, pipeSizeIn: Number(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PIPE_SIZES.map(size => (
                        <SelectItem key={size} value={String(size)}>
                          {size}"
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Space Type */}
          <div className="space-y-2">
            <Label>Target Space Type</Label>
            <Select value={state.spaceType} onValueChange={v => setState(s => ({ ...s, spaceType: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SAUDI_NC_STANDARDS).map(([key, { nc, description }]) => (
                  <SelectItem key={key} value={key}>
                    NC-{nc}: {description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Analysis Results</span>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <Badge
                variant={results.status === 'compliant' ? 'default' : results.status === 'marginal' ? 'secondary' : 'destructive'}
                className={results.status === 'compliant' ? 'bg-green-600' : ''}
              >
                {getStatusText()}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">Velocity</p>
              <p className="text-2xl font-bold">{results.velocity.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{results.velocityUnit}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">Velocity Noise</p>
              <p className="text-2xl font-bold">{results.velocityNoise}</p>
              <p className="text-xs text-muted-foreground">dB</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">Fitting Noise</p>
              <p className="text-2xl font-bold">{results.fittingNoise}</p>
              <p className="text-xs text-muted-foreground">dB</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">Combined</p>
              <p className="text-2xl font-bold">{results.totalNoise}</p>
              <p className="text-xs text-muted-foreground">dB</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mt-4">
            <div className="p-4 rounded-lg border text-center">
              <p className="text-sm text-muted-foreground">NC Rating</p>
              <p className={`text-3xl font-bold ${
                results.status === 'compliant' ? 'text-green-600' : 
                results.status === 'marginal' ? 'text-amber-600' : 'text-red-600'
              }`}>
                NC-{results.ncRating}
              </p>
            </div>
            <div className="p-4 rounded-lg border text-center">
              <p className="text-sm text-muted-foreground">Target NC</p>
              <p className="text-3xl font-bold">NC-{results.targetNC}</p>
            </div>
            <div className="p-4 rounded-lg border text-center">
              <p className="text-sm text-muted-foreground">Attenuation Required</p>
              <p className={`text-3xl font-bold ${results.attenuationRequired > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {results.attenuationRequired > 0 ? `${results.attenuationRequired} dB` : 'None'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fittings Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Fittings</span>
            <Dialog open={fittingDialogOpen} onOpenChange={setFittingDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Fitting
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Fitting from Library</DialogTitle>
                  <DialogDescription>
                    Select a fitting to add to the noise calculation
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search fittings..."
                      value={fittingSearch}
                      onChange={e => setFittingSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {Object.entries(groupedFittings).map(([category, fittings]) => (
                        <div key={category}>
                          <h4 className="font-medium text-sm mb-2 text-muted-foreground">
                            {FITTING_CATEGORY_LABELS[category] || category}
                          </h4>
                          <div className="grid gap-2">
                            {fittings.map(fitting => (
                              <Button
                                key={fitting.id}
                                variant="outline"
                                className="justify-between h-auto py-2"
                                onClick={() => addFitting(fitting)}
                              >
                                <div className="text-left">
                                  <p className="font-medium">{fitting.fitting_name}</p>
                                  <p className="text-xs text-muted-foreground">{fitting.fitting_code}</p>
                                </div>
                                <Badge variant="secondary">C = {fitting.loss_coefficient}</Badge>
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>
            Add fittings to see their noise contribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedFittings.length > 0 ? (
            <div className="space-y-2">
              {selectedFittings.map(fitting => (
                <div
                  key={fitting.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex-1">
                    <p className="font-medium">{fitting.name}</p>
                    <p className="text-xs text-muted-foreground">{fitting.code}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateFittingQuantity(fitting.id, fitting.quantity - 1)}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{fitting.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateFittingQuantity(fitting.id, fitting.quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {fitting.noiseDb} dB
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => removeFitting(fitting.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No fittings added yet</p>
              <p className="text-sm">Click "Add Fitting" to select from the library</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fitting Breakdown */}
      {selectedFittings.length > 0 && (
        <FittingNoiseBreakdown
          fittings={selectedFittings}
          totalNoise={results.totalNoise}
          targetNC={results.targetNC}
          systemType={state.systemType}
        />
      )}
    </div>
  );
}
