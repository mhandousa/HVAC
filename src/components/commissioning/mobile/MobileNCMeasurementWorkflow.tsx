import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  Minus,
  Plus,
  Save,
  Send,
  Home,
  Mic,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type WorkflowStep = 
  | 'zone-selection'
  | 'pre-checks'
  | 'equipment-setup'
  | 'measurements'
  | 'photos'
  | 'review';

interface MeasurementPosition {
  id: string;
  position: string;
  ncReading: number | null;
}

interface WorkflowState {
  currentStep: WorkflowStep;
  zoneId: string | null;
  zoneName: string;
  targetNC: number;
  floorName: string;
  preChecksCompleted: boolean[];
  equipmentModel: string;
  calibrationDate: string;
  measurements: MeasurementPosition[];
  currentPositionIndex: number;
  photos: string[];
  notes: string;
  hvacMode: string;
  backgroundNC: number | null;
}

interface Zone {
  id: string;
  name: string;
  floorName: string;
  targetNC: number;
  status: 'pending' | 'completed';
}

interface MobileNCMeasurementWorkflowProps {
  zones: Zone[];
  onSubmit: (data: {
    zoneId: string;
    measuredNC: number;
    positions: { position: string; nc_reading: number }[];
    notes: string;
    equipmentModel: string;
    hvacMode: string;
    backgroundNC: number | null;
    photos: string[];
  }) => void;
  onClose: () => void;
  initialZoneId?: string;
  autoStart?: boolean;
}

const PRE_CHECKS = [
  'HVAC system running in design mode',
  'Space unoccupied / doors closed',
  'Sound meter calibrated today',
  'Background noise acceptable',
  'Windows and doors sealed',
];

const DEFAULT_POSITIONS: MeasurementPosition[] = [
  { id: '1', position: 'Room Center', ncReading: null },
  { id: '2', position: 'Near Diffuser 1', ncReading: null },
  { id: '3', position: 'Near Diffuser 2', ncReading: null },
  { id: '4', position: 'Workstation Area', ncReading: null },
];

const EQUIPMENT_MODELS = [
  'Extech SL130G',
  'NIOSH SLM App',
  'Brüel & Kjær Type 2250',
  'Larson Davis SoundTrack LxT',
  'Quest SoundPro SE/DL',
  'Other',
];

export function MobileNCMeasurementWorkflow({ zones, onSubmit, onClose, initialZoneId, autoStart }: MobileNCMeasurementWorkflowProps) {
  const [state, setState] = useState<WorkflowState>({
    currentStep: 'zone-selection',
    zoneId: null,
    zoneName: '',
    targetNC: 40,
    floorName: '',
    preChecksCompleted: PRE_CHECKS.map(() => false),
    equipmentModel: '',
    calibrationDate: '',
    measurements: DEFAULT_POSITIONS,
    currentPositionIndex: 0,
    photos: [],
    notes: '',
    hvacMode: 'cooling',
    backgroundNC: null,
  });

  // Auto-save to localStorage
  useEffect(() => {
    if (state.zoneId) {
      localStorage.setItem(`nc-measurement-draft-${state.zoneId}`, JSON.stringify(state));
    }
  }, [state]);

  // Auto-select zone if initialZoneId provided (QR code deep link)
  useEffect(() => {
    if (initialZoneId && autoStart && state.currentStep === 'zone-selection') {
      const targetZone = zones.find(z => z.id === initialZoneId);
      if (targetZone) {
        const draft = localStorage.getItem(`nc-measurement-draft-${initialZoneId}`);
        if (draft) {
          try {
            const parsed = JSON.parse(draft);
            setState(parsed);
          } catch (e) {
            console.error('Failed to load draft:', e);
            selectZone(targetZone);
          }
        } else {
          selectZone(targetZone);
        }
      }
    }
  }, [initialZoneId, autoStart, zones]);

  // Load draft on zone selection
  const loadDraft = (zoneId: string) => {
    const draft = localStorage.getItem(`nc-measurement-draft-${zoneId}`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setState(parsed);
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  };

  const selectZone = (zone: Zone) => {
    const draft = localStorage.getItem(`nc-measurement-draft-${zone.id}`);
    if (draft) {
      loadDraft(zone.id);
    } else {
      setState(prev => ({
        ...prev,
        zoneId: zone.id,
        zoneName: zone.name,
        targetNC: zone.targetNC,
        floorName: zone.floorName,
        currentStep: 'pre-checks',
      }));
    }
  };

  const togglePreCheck = (index: number) => {
    setState(prev => ({
      ...prev,
      preChecksCompleted: prev.preChecksCompleted.map((v, i) => i === index ? !v : v),
    }));
  };

  const updateMeasurement = (value: number) => {
    setState(prev => ({
      ...prev,
      measurements: prev.measurements.map((m, i) => 
        i === prev.currentPositionIndex ? { ...m, ncReading: value } : m
      ),
    }));
  };

  const adjustMeasurement = (delta: number) => {
    const current = state.measurements[state.currentPositionIndex].ncReading ?? 35;
    updateMeasurement(Math.max(15, Math.min(80, current + delta)));
  };

  const nextPosition = () => {
    if (state.currentPositionIndex < state.measurements.length - 1) {
      setState(prev => ({
        ...prev,
        currentPositionIndex: prev.currentPositionIndex + 1,
      }));
    } else {
      setState(prev => ({ ...prev, currentStep: 'photos' }));
    }
  };

  const prevPosition = () => {
    if (state.currentPositionIndex > 0) {
      setState(prev => ({
        ...prev,
        currentPositionIndex: prev.currentPositionIndex - 1,
      }));
    }
  };

  const goToStep = (step: WorkflowStep) => {
    setState(prev => ({ ...prev, currentStep: step }));
  };

  const calculateAverageNC = (): number | null => {
    const validReadings = state.measurements.filter(m => m.ncReading !== null);
    if (validReadings.length === 0) return null;
    const sum = validReadings.reduce((acc, m) => acc + (m.ncReading ?? 0), 0);
    return Math.round(sum / validReadings.length);
  };

  const getVerificationStatus = (): 'pass' | 'marginal' | 'fail' | 'pending' => {
    const avgNC = calculateAverageNC();
    if (avgNC === null) return 'pending';
    const delta = avgNC - state.targetNC;
    if (delta <= 0) return 'pass';
    if (delta <= 5) return 'marginal';
    return 'fail';
  };

  const handleSubmit = () => {
    const avgNC = calculateAverageNC();
    if (avgNC === null || !state.zoneId) return;

    onSubmit({
      zoneId: state.zoneId,
      measuredNC: avgNC,
      positions: state.measurements
        .filter(m => m.ncReading !== null)
        .map(m => ({ position: m.position, nc_reading: m.ncReading! })),
      notes: state.notes,
      equipmentModel: state.equipmentModel,
      hvacMode: state.hvacMode,
      backgroundNC: state.backgroundNC,
      photos: state.photos,
    });

    // Clear draft
    if (state.zoneId) {
      localStorage.removeItem(`nc-measurement-draft-${state.zoneId}`);
    }
  };

  const saveDraft = () => {
    if (state.zoneId) {
      localStorage.setItem(`nc-measurement-draft-${state.zoneId}`, JSON.stringify(state));
    }
  };

  // Progress calculation
  const getProgress = (): number => {
    const steps = ['zone-selection', 'pre-checks', 'equipment-setup', 'measurements', 'photos', 'review'];
    const currentIndex = steps.indexOf(state.currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const allPreChecksCompleted = state.preChecksCompleted.every(Boolean);
  const hasEquipment = state.equipmentModel.length > 0;
  const hasValidMeasurements = state.measurements.some(m => m.ncReading !== null);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Home className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <p className="text-sm font-medium">NC Measurement</p>
            {state.zoneName && (
              <p className="text-xs text-muted-foreground">
                {initialZoneId && autoStart && '📱 '}{state.zoneName}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={saveDraft}>
            <Save className="h-4 w-4" />
          </Button>
        </div>
        <Progress value={getProgress()} className="h-1 mt-2" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Step: Zone Selection */}
        {state.currentStep === 'zone-selection' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Select Zone</h2>
            <p className="text-muted-foreground">
              Choose a zone to begin NC measurement verification.
            </p>
            
            <div className="space-y-2">
              {zones.map((zone) => (
                <Card 
                  key={zone.id}
                  className={cn(
                    'cursor-pointer transition-colors',
                    zone.status === 'completed' && 'opacity-60'
                  )}
                  onClick={() => selectZone(zone)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{zone.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {zone.floorName} • Target NC-{zone.targetNC}
                      </p>
                    </div>
                    <Badge variant={zone.status === 'completed' ? 'secondary' : 'outline'}>
                      {zone.status === 'completed' ? 'Done' : 'Pending'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step: Pre-Checks */}
        {state.currentStep === 'pre-checks' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Pre-Measurement Checks</h2>
            <p className="text-muted-foreground">
              Verify conditions before taking measurements.
            </p>

            <div className="space-y-3">
              {PRE_CHECKS.map((check, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-lg border transition-colors',
                    state.preChecksCompleted[index] 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-muted/30'
                  )}
                  onClick={() => togglePreCheck(index)}
                >
                  <Checkbox 
                    checked={state.preChecksCompleted[index]}
                    className="h-6 w-6"
                  />
                  <span className="text-sm">{check}</span>
                </div>
              ))}
            </div>

            <Button 
              className="w-full h-14 text-lg"
              disabled={!allPreChecksCompleted}
              onClick={() => goToStep('equipment-setup')}
            >
              Continue
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Step: Equipment Setup */}
        {state.currentStep === 'equipment-setup' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Equipment Setup</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Sound Level Meter</Label>
                <Select 
                  value={state.equipmentModel} 
                  onValueChange={(v) => setState(prev => ({ ...prev, equipmentModel: v }))}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select meter model" />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_MODELS.map(model => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>HVAC Operating Mode</Label>
                <Select 
                  value={state.hvacMode} 
                  onValueChange={(v) => setState(prev => ({ ...prev, hvacMode: v }))}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cooling">Cooling Mode</SelectItem>
                    <SelectItem value="heating">Heating Mode</SelectItem>
                    <SelectItem value="ventilation">Ventilation Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Background NC (HVAC Off) - Optional</Label>
                <Input
                  type="number"
                  placeholder="e.g., 25"
                  className="h-12 text-lg"
                  value={state.backgroundNC ?? ''}
                  onChange={(e) => setState(prev => ({ 
                    ...prev, 
                    backgroundNC: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="flex-1 h-14"
                onClick={() => goToStep('pre-checks')}
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back
              </Button>
              <Button 
                className="flex-1 h-14"
                disabled={!hasEquipment}
                onClick={() => goToStep('measurements')}
              >
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Measurements */}
        {state.currentStep === 'measurements' && (
          <div className="space-y-4">
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                {state.floorName} • Target NC-{state.targetNC}
              </Badge>
              <h2 className="text-xl font-bold">{state.zoneName}</h2>
            </div>

            <Card className="p-6">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground mb-1">Position</p>
                <p className="text-lg font-semibold">
                  {state.measurements[state.currentPositionIndex].position}
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 my-6">
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-16 w-16 rounded-full text-2xl"
                  onClick={() => adjustMeasurement(-1)}
                >
                  <Minus className="h-8 w-8" />
                </Button>
                
                <div className="relative">
                  <Input
                    type="number"
                    className="h-24 w-32 text-4xl font-bold text-center"
                    value={state.measurements[state.currentPositionIndex].ncReading ?? ''}
                    onChange={(e) => updateMeasurement(parseInt(e.target.value) || 0)}
                  />
                  <span className="absolute -bottom-4 left-0 right-0 text-center text-sm text-muted-foreground">
                    NC
                  </span>
                </div>

                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-16 w-16 rounded-full text-2xl"
                  onClick={() => adjustMeasurement(1)}
                >
                  <Plus className="h-8 w-8" />
                </Button>
              </div>

              {/* Position indicators */}
              <div className="flex justify-center gap-2 mt-6">
                {state.measurements.map((m, i) => (
                  <button
                    key={m.id}
                    className={cn(
                      'h-3 w-3 rounded-full transition-colors',
                      i === state.currentPositionIndex 
                        ? 'bg-primary' 
                        : m.ncReading !== null 
                          ? 'bg-green-500' 
                          : 'bg-muted'
                    )}
                    onClick={() => setState(prev => ({ ...prev, currentPositionIndex: i }))}
                  />
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground mt-2">
                {state.currentPositionIndex + 1} of {state.measurements.length}
              </p>
            </Card>

            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="flex-1 h-14"
                onClick={prevPosition}
                disabled={state.currentPositionIndex === 0}
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Previous
              </Button>
              <Button 
                className="flex-1 h-14"
                onClick={nextPosition}
              >
                {state.currentPositionIndex === state.measurements.length - 1 ? 'Continue' : 'Next'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Photos */}
        {state.currentStep === 'photos' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Photo Documentation</h2>
            <p className="text-muted-foreground">
              Capture photos of measurement setup (optional).
            </p>

            <div className="grid grid-cols-2 gap-3">
              {state.photos.map((photo, index) => (
                <div key={index} className="aspect-square bg-muted rounded-lg relative">
                  <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                </div>
              ))}
              <Button 
                variant="outline" 
                className="aspect-square flex flex-col items-center justify-center gap-2"
                onClick={() => {
                  // In a real app, this would open camera
                  // For now, we'll just show a placeholder
                  console.log('Open camera');
                }}
              >
                <Camera className="h-8 w-8" />
                <span className="text-xs">Add Photo</span>
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional observations..."
                className="min-h-[100px]"
                value={state.notes}
                onChange={(e) => setState(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="flex-1 h-14"
                onClick={() => goToStep('measurements')}
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back
              </Button>
              <Button 
                className="flex-1 h-14"
                onClick={() => goToStep('review')}
              >
                Review
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Review */}
        {state.currentStep === 'review' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Review & Submit</h2>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{state.zoneName}</span>
                  <Badge 
                    className={cn(
                      getVerificationStatus() === 'pass' && 'bg-green-100 text-green-800',
                      getVerificationStatus() === 'marginal' && 'bg-yellow-100 text-yellow-800',
                      getVerificationStatus() === 'fail' && 'bg-red-100 text-red-800',
                    )}
                  >
                    {getVerificationStatus() === 'pass' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {getVerificationStatus() === 'marginal' && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {getVerificationStatus() === 'fail' && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {getVerificationStatus().toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Target</p>
                    <p className="text-2xl font-bold">NC-{state.targetNC}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Measured</p>
                    <p className={cn(
                      'text-2xl font-bold',
                      getVerificationStatus() === 'pass' && 'text-green-600',
                      getVerificationStatus() === 'marginal' && 'text-yellow-600',
                      getVerificationStatus() === 'fail' && 'text-destructive',
                    )}>
                      NC-{calculateAverageNC() ?? '-'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm font-medium">Position Readings</p>
                  {state.measurements.map(m => (
                    <div key={m.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{m.position}</span>
                      <span className="font-medium">
                        {m.ncReading !== null ? `NC-${m.ncReading}` : '-'}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Equipment</span>
                    <span>{state.equipmentModel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">HVAC Mode</span>
                    <span className="capitalize">{state.hvacMode}</span>
                  </div>
                  {state.backgroundNC && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Background NC</span>
                      <span>NC-{state.backgroundNC}</span>
                    </div>
                  )}
                </div>

                {state.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-1">Notes</p>
                      <p className="text-sm text-muted-foreground">{state.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="flex-1 h-14"
                onClick={() => goToStep('photos')}
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back
              </Button>
              <Button 
                className="flex-1 h-14"
                disabled={!hasValidMeasurements}
                onClick={handleSubmit}
              >
                <Send className="mr-2 h-5 w-5" />
                Submit
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
