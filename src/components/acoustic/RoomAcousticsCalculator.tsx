import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  analyzeRoomAcoustics,
  SURFACE_MATERIALS,
  DIRECTIVITY_FACTORS,
  ROOM_PRESETS,
  RoomAcousticsResult,
} from '@/lib/room-acoustics-calculations';
import { OctaveBandData } from '@/lib/nc-reference-curves';
import { OctaveBandChart } from './OctaveBandChart';

export interface RoomAcousticsCalculatorProps {
  onResultCalculated?: (result: RoomAcousticsResult) => void;
  initialSourceLevel?: number;
}

const DEFAULT_SOURCE_LEVELS: OctaveBandData = {
  '63Hz': 85, '125Hz': 82, '250Hz': 78, '500Hz': 75, '1kHz': 72, '2kHz': 68, '4kHz': 64, '8kHz': 60
};

export const RoomAcousticsCalculator: React.FC<RoomAcousticsCalculatorProps> = ({
  onResultCalculated,
}) => {
  const [length, setLength] = useState<number>(10);
  const [width, setWidth] = useState<number>(8);
  const [height, setHeight] = useState<number>(3);
  const [unit, setUnit] = useState<'m' | 'ft'>('m');
  const [floorMaterial, setFloorMaterial] = useState<string>('carpet_heavy');
  const [wallMaterial, setWallMaterial] = useState<string>('drywall');
  const [ceilingMaterial, setCeilingMaterial] = useState<string>('acoustic_tile');
  const [sourcePosition, setSourcePosition] = useState<string>('floor');
  const [receiverDistance, setReceiverDistance] = useState<number>(5);
  const [roomPreset, setRoomPreset] = useState<string>('office_private');
  const [result, setResult] = useState<RoomAcousticsResult | null>(null);

  const surfaceMaterialOptions = Object.entries(SURFACE_MATERIALS).map(([key, mat]) => ({
    value: key, label: mat.name,
  }));

  const directivityOptions = Object.entries(DIRECTIVITY_FACTORS).map(([key, df]) => ({
    value: key, label: df.description, Q: df.Q,
  }));

  const roomPresetOptions = Object.entries(ROOM_PRESETS).map(([key, preset]) => ({
    value: key, label: preset.name, targetNC: preset.targetNC,
  }));

  const handleCalculate = () => {
    const dimMultiplier = unit === 'ft' ? 0.3048 : 1;
    const distMultiplier = unit === 'ft' ? 0.3048 : 1;
    const preset = ROOM_PRESETS[roomPreset];

    const analysisResult = analyzeRoomAcoustics({
      dimensions: {
        length: length * dimMultiplier,
        width: width * dimMultiplier,
        height: height * dimMultiplier,
      },
      surfaces: { floor: floorMaterial, walls: wallMaterial, ceiling: ceilingMaterial },
      sourcePosition,
      sourceLw: DEFAULT_SOURCE_LEVELS,
      receiverDistance: receiverDistance * distMultiplier,
      targetNC: preset?.targetNC || 40,
    });

    setResult(analysisResult);
    onResultCalculated?.(analysisResult);
  };

  const handlePresetChange = (presetKey: string) => {
    setRoomPreset(presetKey);
    const preset = ROOM_PRESETS[presetKey];
    if (preset) {
      setFloorMaterial(preset.floor);
      setWallMaterial(preset.walls);
      setCeilingMaterial(preset.ceiling);
    }
  };

  const targetNC = ROOM_PRESETS[roomPreset]?.targetNC || 40;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="inputs" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inputs">Room Configuration</TabsTrigger>
          <TabsTrigger value="results" disabled={!result}>Results</TabsTrigger>
          <TabsTrigger value="frequency" disabled={!result}>Frequency Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="inputs" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Room Type Preset</CardTitle>
              <CardDescription>Select a preset to auto-configure typical materials</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={roomPreset} onValueChange={handlePresetChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roomPresetOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label} (Target: NC-{opt.targetNC})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Room Dimensions</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Length</Label>
                  <Input type="number" value={length} onChange={(e) => setLength(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Width</Label>
                  <Input type="number" value={width} onChange={(e) => setWidth(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Height</Label>
                  <Input type="number" value={height} onChange={(e) => setHeight(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="w-24 space-y-2">
                  <Label>Unit</Label>
                  <Select value={unit} onValueChange={(v) => setUnit(v as 'm' | 'ft')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="m">meters</SelectItem>
                      <SelectItem value="ft">feet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Surface Materials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Floor</Label>
                  <Select value={floorMaterial} onValueChange={setFloorMaterial}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {surfaceMaterialOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Walls</Label>
                  <Select value={wallMaterial} onValueChange={setWallMaterial}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {surfaceMaterialOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ceiling</Label>
                  <Select value={ceilingMaterial} onValueChange={setCeilingMaterial}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {surfaceMaterialOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Source Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source Position</Label>
                  <Select value={sourcePosition} onValueChange={setSourcePosition}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {directivityOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label} (Q={opt.Q})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Receiver Distance ({unit})</Label>
                  <Input type="number" value={receiverDistance} onChange={(e) => setReceiverDistance(parseFloat(e.target.value) || 0)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleCalculate} className="w-full">
            <Calculator className="w-4 h-4 mr-2" />Calculate Room Acoustics
          </Button>
        </TabsContent>

        <TabsContent value="results" className="space-y-4 mt-4">
          {result && (
            <>
              <Card className={result.isCompliant ? 'border-green-500/50' : 'border-destructive/50'}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {result.isCompliant ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertTriangle className="w-5 h-5 text-destructive" />}
                      {result.isCompliant ? 'Target Met' : 'Target Exceeded'}
                    </CardTitle>
                    <Badge variant={result.isCompliant ? 'default' : 'destructive'}>NC-{Math.round(result.calculatedNC)} at Receiver</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><p className="text-muted-foreground">Target NC</p><p className="text-xl font-semibold">NC-{targetNC}</p></div>
                    <div><p className="text-muted-foreground">Calculated NC</p><p className="text-xl font-semibold">NC-{Math.round(result.calculatedNC)}</p></div>
                    <div>
                      <p className="text-muted-foreground">Margin</p>
                      <p className={`text-xl font-semibold ${result.complianceMargin >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {result.complianceMargin >= 0 ? '+' : ''}{result.complianceMargin.toFixed(1)} dB
                      </p>
                    </div>
                    <div><p className="text-muted-foreground">RT60</p><p className="text-xl font-semibold">{result.averageRT60.toFixed(2)} s</p></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Room Properties</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><p className="text-muted-foreground">Volume</p><p className="font-medium">{result.volume.toFixed(1)} m³</p></div>
                    <div><p className="text-muted-foreground">Surface Area</p><p className="font-medium">{result.totalSurfaceArea.toFixed(1)} m²</p></div>
                    <div><p className="text-muted-foreground">Mean Free Path</p><p className="font-medium">{result.meanFreePathLength.toFixed(2)} m</p></div>
                  </div>
                </CardContent>
              </Card>

              {result.recommendations.length > 0 && (
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Info className="w-4 h-4" />Recommendations</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.recommendations.map((rec, idx) => <li key={idx} className="flex items-start gap-2 text-sm"><span className="text-primary">•</span>{rec}</li>)}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="frequency" className="space-y-4 mt-4">
          {result && (
            <OctaveBandChart
              measured={result.lpTotal}
              targetNC={result.targetNC}
              zoneName="Receiver Position"
              showComplianceZone={true}
              showReferenceNCCurves={true}
              referenceNCLevels={[25, 35, 45]}
              height={400}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoomAcousticsCalculator;
