import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Volume2, ArrowRight, AlertTriangle, CheckCircle, Info, ExternalLink } from 'lucide-react';
import { calculateSilencerSize, SilencerSizingInput, SilencerSizingResult } from '@/lib/silencer-sizing-calculations';
import { useNavigate } from 'react-router-dom';

interface SilencerSizingCalculatorProps {
  initialAirflow?: number;
  initialAttenuation?: number;
  ductType?: 'round' | 'rectangular';
  onSizingComplete?: (result: SilencerSizingResult) => void;
}

export const SilencerSizingCalculator: React.FC<SilencerSizingCalculatorProps> = ({
  initialAirflow = 2000,
  initialAttenuation = 15,
  ductType = 'rectangular',
  onSizingComplete,
}) => {
  const navigate = useNavigate();
  
  const [inputs, setInputs] = useState<SilencerSizingInput>({
    airflowCfm: initialAirflow,
    maxVelocityFpm: 2500,
    maxPressureDropIn: 0.5,
    requiredAttenuationDb: initialAttenuation,
    ductType: ductType,
    targetFrequency: '500',
  });

  const result = useMemo(() => calculateSilencerSize(inputs), [inputs]);

  // Notify parent whenever result changes
  useEffect(() => {
    if (result && onSizingComplete) {
      onSizingComplete(result);
    }
  }, [result, onSizingComplete]);

  const updateInput = <K extends keyof SilencerSizingInput>(key: K, value: SilencerSizingInput[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const handleFindProducts = () => {
    const params = new URLSearchParams({
      type: 'silencer',
      minAttenuation: inputs.requiredAttenuationDb.toString(),
      airflow: inputs.airflowCfm.toString(),
    });
    navigate(`/design/silencer-selection?${params.toString()}`);
  };

  const meetsRequirements = result.performance.meetsAttenuationRequirement && 
                            result.performance.meetsPressureRequirement && 
                            result.performance.meetsVelocityRequirement;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary" />
          <CardTitle>Silencer Sizing Calculator</CardTitle>
        </div>
        <CardDescription>Calculate optimal silencer dimensions based on airflow, pressure, and attenuation requirements</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="airflow">Airflow (CFM)</Label>
            <Input id="airflow" type="number" value={inputs.airflowCfm} onChange={(e) => updateInput('airflowCfm', Number(e.target.value))} min={100} max={100000} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attenuation">Required Attenuation (dB)</Label>
            <Input id="attenuation" type="number" value={inputs.requiredAttenuationDb} onChange={(e) => updateInput('requiredAttenuationDb', Number(e.target.value))} min={5} max={50} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxVelocity">Max Velocity (FPM)</Label>
            <Input id="maxVelocity" type="number" value={inputs.maxVelocityFpm} onChange={(e) => updateInput('maxVelocityFpm', Number(e.target.value))} min={500} max={4000} />
            <p className="text-xs text-muted-foreground">Recommended: 1500-2500 FPM for low noise</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pressureDrop">Max Pressure Drop (in. w.g.)</Label>
            <Input id="pressureDrop" type="number" step="0.1" value={inputs.maxPressureDropIn} onChange={(e) => updateInput('maxPressureDropIn', Number(e.target.value))} min={0.1} max={2.0} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ductType">Duct Type</Label>
            <Select value={inputs.ductType} onValueChange={(v) => updateInput('ductType', v as 'round' | 'rectangular')}>
              <SelectTrigger id="ductType"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rectangular">Rectangular</SelectItem>
                <SelectItem value="round">Round</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetFrequency">Target Frequency</Label>
            <Select value={inputs.targetFrequency} onValueChange={(v) => updateInput('targetFrequency', v as SilencerSizingInput['targetFrequency'])}>
              <SelectTrigger id="targetFrequency"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="125">125 Hz (Low)</SelectItem>
                <SelectItem value="250">250 Hz</SelectItem>
                <SelectItem value="500">500 Hz (Mid)</SelectItem>
                <SelectItem value="1000">1 kHz</SelectItem>
                <SelectItem value="2000">2 kHz (High)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {result && (
          <div className="space-y-6">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Recommended Silencer</h3>
                <Badge variant={meetsRequirements ? 'default' : 'destructive'}>
                  {meetsRequirements ? <><CheckCircle className="h-3 w-3 mr-1" /> Meets Requirements</> : <><AlertTriangle className="h-3 w-3 mr-1" /> Check Alternatives</>}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {inputs.ductType === 'rectangular' ? (
                  <>
                    <div><p className="text-sm text-muted-foreground">Width</p><p className="text-2xl font-bold">{result.recommended.widthIn}"</p></div>
                    <div><p className="text-sm text-muted-foreground">Height</p><p className="text-2xl font-bold">{result.recommended.heightIn}"</p></div>
                  </>
                ) : (
                  <div><p className="text-sm text-muted-foreground">Diameter</p><p className="text-2xl font-bold">{result.recommended.diameterIn}"</p></div>
                )}
                <div><p className="text-sm text-muted-foreground">Length</p><p className="text-2xl font-bold">{result.recommended.lengthIn}"</p></div>
                <div><p className="text-sm text-muted-foreground">Type</p><p className="text-lg font-semibold">{result.recommended.type}</p></div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Attenuation</p>
                <p className="text-xl font-bold text-primary">{result.performance.expectedAttenuationDb.toFixed(1)} dB</p>
                <p className="text-xs text-muted-foreground">Target: {inputs.requiredAttenuationDb} dB</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Pressure Drop</p>
                <p className="text-xl font-bold">{result.performance.expectedPressureDropIn.toFixed(2)}" w.g.</p>
                <p className="text-xs text-muted-foreground">Max: {inputs.maxPressureDropIn}" w.g.</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Face Velocity</p>
                <p className="text-xl font-bold">{result.performance.velocityFpm.toFixed(0)} FPM</p>
                <p className="text-xs text-muted-foreground">Max: {inputs.maxVelocityFpm} FPM</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Self-Noise</p>
                <p className="text-xl font-bold">NC-{result.performance.selfNoiseNC}</p>
                <p className="text-xs text-muted-foreground">Generated noise</p>
              </Card>
            </div>

            {result.warnings.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {result.warnings.map((warning, i) => <li key={i}>{warning}</li>)}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {result.sizingNotes.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {result.sizingNotes.map((note, i) => <li key={i}>{note}</li>)}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button onClick={handleFindProducts} className="flex-1">
                <ExternalLink className="h-4 w-4 mr-2" />Find Matching Products
              </Button>
              {onSizingComplete && (
                <Button variant="outline" onClick={() => onSizingComplete(result)}>
                  Use This Size<ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SilencerSizingCalculator;
