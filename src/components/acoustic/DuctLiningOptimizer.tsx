import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calculator, CheckCircle2, AlertTriangle, Star, Info, Layers } from 'lucide-react';
import { analyzeDuctLining, DUCT_LINING_TYPES, DuctLiningResult } from '@/lib/duct-lining-calculations';
import { OctaveBandData } from '@/lib/nc-reference-curves';

export interface DuctLiningOptimizerProps {
  onResultCalculated?: (result: DuctLiningResult) => void;
}

const DEFAULT_SOURCE_LEVELS: OctaveBandData = {
  '63Hz': 75, '125Hz': 72, '250Hz': 68, '500Hz': 65, '1kHz': 62, '2kHz': 58, '4kHz': 54, '8kHz': 50
};

export const DuctLiningOptimizer: React.FC<DuctLiningOptimizerProps> = ({ onResultCalculated }) => {
  const [targetNC, setTargetNC] = useState<number>(40);
  const [ductWidth, setDuctWidth] = useState<number>(24);
  const [ductHeight, setDuctHeight] = useState<number>(18);
  const [velocity, setVelocity] = useState<number>(1500);
  const [maxPressureDrop, setMaxPressureDrop] = useState<number>(25);
  const [availableLength, setAvailableLength] = useState<number>(20);
  const [result, setResult] = useState<DuctLiningResult | null>(null);

  const handleCalculate = () => {
    const analysisResult = analyzeDuctLining({
      sourceLevels: DEFAULT_SOURCE_LEVELS,
      targetNC,
      ductWidthIn: ductWidth,
      ductHeightIn: ductHeight,
      velocityFpm: velocity,
      maxPressureDropPa: maxPressureDrop,
      availableLengthFt: availableLength,
    });
    setResult(analysisResult);
    onResultCalculated?.(analysisResult);
  };

  const recommended = result?.recommendedOption;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Noise Reduction Target</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Target NC Level</Label>
              <Input type="number" value={targetNC} onChange={(e) => setTargetNC(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Available Duct Length (ft)</Label>
              <Input type="number" value={availableLength} onChange={(e) => setAvailableLength(parseFloat(e.target.value) || 0)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Duct Parameters</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Width (inches)</Label>
                <Input type="number" value={ductWidth} onChange={(e) => setDuctWidth(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Height (inches)</Label>
                <Input type="number" value={ductHeight} onChange={(e) => setDuctHeight(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Velocity (FPM)</Label>
                <Input type="number" value={velocity} onChange={(e) => setVelocity(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Max Pressure Drop (Pa)</Label>
                <Input type="number" value={maxPressureDrop} onChange={(e) => setMaxPressureDrop(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleCalculate} className="w-full">
        <Calculator className="w-4 h-4 mr-2" />Analyze Lining Options
      </Button>

      {result && (
        <div className="space-y-4">
          {recommended && (
            <Card className="border-primary/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary fill-primary" />
                    Recommended: {recommended.liningType.name}
                  </CardTitle>
                  <Badge>{recommended.isSuitable ? 'Target Met' : 'Best Available'}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><p className="text-muted-foreground">Required Length</p><p className="text-xl font-semibold">{recommended.requiredLengthFt.toFixed(1)} ft</p></div>
                  <div><p className="text-muted-foreground">Pressure Drop</p><p className="text-xl font-semibold">{recommended.pressureDropPa.toFixed(1)} Pa</p></div>
                  <div><p className="text-muted-foreground">Final NC</p><p className="text-xl font-semibold">NC-{Math.round(recommended.resultingNC)}</p></div>
                  <div><p className="text-muted-foreground">Self-Noise</p><p className="text-xl font-semibold">NC-{Math.round(recommended.selfNoiseNC)}</p></div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">All Options Comparison</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lining Type</TableHead>
                    <TableHead className="text-right">Length (ft)</TableHead>
                    <TableHead className="text-right">Δ Pressure (Pa)</TableHead>
                    <TableHead className="text-right">Final NC</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.options.map((opt) => (
                    <TableRow key={opt.liningType.id}>
                      <TableCell className="font-medium">{opt.liningType.name}</TableCell>
                      <TableCell className="text-right">{opt.requiredLengthFt.toFixed(1)}</TableCell>
                      <TableCell className="text-right">
                        <span className={opt.isWithinPressure ? '' : 'text-destructive'}>{opt.pressureDropPa.toFixed(1)}</span>
                      </TableCell>
                      <TableCell className="text-right">NC-{Math.round(opt.resultingNC)}</TableCell>
                      <TableCell className="text-center">
                        {opt.isSuitable ? <CheckCircle2 className="w-4 h-4 text-green-500 inline" /> : <AlertTriangle className="w-4 h-4 text-amber-500 inline" />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {result.alternativeRecommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Info className="w-4 h-4" />Recommendations</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.alternativeRecommendations.map((rec, idx) => <li key={idx} className="flex items-start gap-2 text-sm"><span className="text-primary">•</span>{rec}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default DuctLiningOptimizer;
