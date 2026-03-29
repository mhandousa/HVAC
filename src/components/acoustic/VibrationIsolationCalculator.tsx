import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calculator, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import {
  analyzeVibrationIsolation,
  EQUIPMENT_TYPES,
  FLOOR_TYPES,
  LOCATION_SENSITIVITIES,
  ISOLATOR_SPECS,
  VibrationIsolationResult,
} from '@/lib/vibration-isolation-calculations';

export interface VibrationIsolationCalculatorProps {
  onResultCalculated?: (result: VibrationIsolationResult) => void;
}

export const VibrationIsolationCalculator: React.FC<VibrationIsolationCalculatorProps> = ({
  onResultCalculated,
}) => {
  const [equipmentType, setEquipmentType] = useState<string>('ahu_small');
  const [weight, setWeight] = useState<number>(500);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [operatingSpeed, setOperatingSpeed] = useState<number>(1000);
  const [floorType, setFloorType] = useState<string>('slab_on_grade');
  const [locationSensitivity, setLocationSensitivity] = useState<string>('mechanical_room');
  const [numberOfMounts, setNumberOfMounts] = useState<number>(4);
  const [result, setResult] = useState<VibrationIsolationResult | null>(null);

  const equipmentOptions = Object.entries(EQUIPMENT_TYPES).map(([key, eq]) => ({
    value: key, label: eq.name, typicalRPM: eq.typicalRPM,
  }));

  const floorOptions = Object.entries(FLOOR_TYPES).map(([key, floor]) => ({
    value: key, label: floor.name, factor: floor.stiffnessFactor,
  }));

  const locationOptions = Object.entries(LOCATION_SENSITIVITIES).map(([key, loc]) => ({
    value: key, label: loc.name, requiredEfficiency: loc.requiredEfficiency,
  }));

  const handleEquipmentChange = (type: string) => {
    setEquipmentType(type);
    const eq = EQUIPMENT_TYPES[type];
    if (eq) setOperatingSpeed(Math.round((eq.typicalRPM.min + eq.typicalRPM.max) / 2));
  };

  const handleCalculate = () => {
    const weightKg = weightUnit === 'lbs' ? weight * 0.453592 : weight;
    const analysisResult = analyzeVibrationIsolation({
      equipmentType,
      equipmentWeight: weightKg,
      operatingSpeedRPM: operatingSpeed,
      floorType,
      locationSensitivity,
      numberOfMounts,
    });
    setResult(analysisResult);
    onResultCalculated?.(analysisResult);
  };

  const preferred = result?.preferredOption;
  const meetsReq = preferred?.isSuitable ?? false;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Equipment Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Equipment Type</Label>
              <Select value={equipmentType} onValueChange={handleEquipmentChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {equipmentOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label} ({opt.typicalRPM.min}-{opt.typicalRPM.max} RPM)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Equipment Weight</Label>
                <Input type="number" value={weight} onChange={(e) => setWeight(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={weightUnit} onValueChange={(v) => setWeightUnit(v as 'kg' | 'lbs')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lbs">lbs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Operating Speed (RPM)</Label>
                <Input type="number" value={operatingSpeed} onChange={(e) => setOperatingSpeed(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Number of Mounts</Label>
                <Input type="number" value={numberOfMounts} onChange={(e) => setNumberOfMounts(parseInt(e.target.value) || 4)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Installation Location</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Floor Construction</Label>
              <Select value={floorType} onValueChange={setFloorType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {floorOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label} (Factor: {opt.factor})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location Sensitivity</Label>
              <Select value={locationSensitivity} onValueChange={setLocationSensitivity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {locationOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label} ({opt.requiredEfficiency}% req.)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleCalculate} className="w-full">
        <Calculator className="w-4 h-4 mr-2" />Calculate Isolation Requirements
      </Button>

      {result && preferred && (
        <div className="space-y-4">
          <Card className={meetsReq ? 'border-green-500/50' : 'border-destructive/50'}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {meetsReq ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertTriangle className="w-5 h-5 text-destructive" />}
                  {meetsReq ? 'Requirements Met' : 'Requirements Not Met'}
                </CardTitle>
                <Badge variant={meetsReq ? 'default' : 'destructive'}>{preferred.isolationEfficiency.toFixed(1)}% Isolation</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Isolation Efficiency</span>
                    <span>{preferred.isolationEfficiency.toFixed(1)}% / {result.requiredEfficiency}% required</span>
                  </div>
                  <Progress value={Math.min(preferred.isolationEfficiency, 100)} className="h-2" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><p className="text-muted-foreground">Disturbing Freq.</p><p className="text-xl font-semibold">{result.disturbingFrequency.toFixed(1)} Hz</p></div>
                  <div><p className="text-muted-foreground">Natural Freq.</p><p className="text-xl font-semibold">{preferred.naturalFrequency.toFixed(1)} Hz</p></div>
                  <div><p className="text-muted-foreground">Transmissibility</p><p className="text-xl font-semibold">{preferred.transmissibility.toFixed(3)}</p></div>
                  <div><p className="text-muted-foreground">Static Deflection</p><p className="text-xl font-semibold">{preferred.staticDeflection.toFixed(1)} mm</p></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Recommended Isolator</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-semibold text-lg">{ISOLATOR_SPECS[preferred.type]?.name || preferred.type}</p>
                </div>
                <div><p className="text-muted-foreground">Load per Mount</p><p className="text-xl font-semibold">{preferred.loadPerMount.toFixed(0)} kg</p></div>
                <div><p className="text-muted-foreground">Spring Rate</p><p className="text-xl font-semibold">{preferred.springRate.toFixed(1)} N/mm</p></div>
              </div>
            </CardContent>
          </Card>

          {result.warnings.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Info className="w-4 h-4" />Warnings</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.warnings.map((w, idx) => <li key={idx} className="flex items-start gap-2 text-sm"><span className="text-amber-500">⚠</span>{w}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default VibrationIsolationCalculator;
