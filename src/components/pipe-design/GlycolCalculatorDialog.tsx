import React, { useState, useMemo } from 'react';
import { Calculator, Thermometer, AlertTriangle, Droplets, Snowflake } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GlycolCalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (glycolPercent: number) => void;
  currentGlycolPercent?: number;
}

type GlycolType = 'propylene' | 'ethylene';

// Freeze point data (°F) for glycol solutions
const GLYCOL_FREEZE_POINTS: Record<GlycolType, Record<number, number>> = {
  propylene: {
    0: 32, 10: 26, 20: 18, 25: 13, 30: 7, 35: 0, 40: -8, 45: -18, 50: -29, 55: -45, 60: -60,
  },
  ethylene: {
    0: 32, 10: 25, 20: 15, 25: 10, 30: 2, 35: -6, 40: -15, 45: -27, 50: -40, 55: -55, 60: -70,
  },
};

// Burst protection is typically 15°F below freeze point
const BURST_PROTECTION_DELTA = 15;

// Fluid property changes per % glycol (approximate)
const PROPERTY_CHANGES: Record<GlycolType, { density: number; viscosity: number; specificHeat: number }> = {
  propylene: { density: 0.3, viscosity: 2.5, specificHeat: -0.7 },
  ethylene: { density: 0.25, viscosity: 2.0, specificHeat: -0.5 },
};

function interpolateFreezePoint(glycolPercent: number, glycolType: GlycolType): number {
  const points = GLYCOL_FREEZE_POINTS[glycolType];
  const percentages = Object.keys(points).map(Number).sort((a, b) => a - b);

  if (glycolPercent <= percentages[0]) return points[percentages[0]];
  if (glycolPercent >= percentages[percentages.length - 1]) return points[percentages[percentages.length - 1]];

  for (let i = 0; i < percentages.length - 1; i++) {
    if (glycolPercent >= percentages[i] && glycolPercent <= percentages[i + 1]) {
      const ratio = (glycolPercent - percentages[i]) / (percentages[i + 1] - percentages[i]);
      return points[percentages[i]] + ratio * (points[percentages[i + 1]] - points[percentages[i]]);
    }
  }

  return 32;
}

function calculateRequiredGlycolPercent(minTempF: number, glycolType: GlycolType): number {
  const points = GLYCOL_FREEZE_POINTS[glycolType];
  const percentages = Object.keys(points).map(Number).sort((a, b) => a - b);

  // Find the minimum glycol % where freeze point is below required temp
  for (let i = 0; i < percentages.length; i++) {
    if (points[percentages[i]] <= minTempF) {
      // Interpolate for more accuracy
      if (i > 0) {
        const prevPercent = percentages[i - 1];
        const currPercent = percentages[i];
        const prevTemp = points[prevPercent];
        const currTemp = points[currPercent];
        
        if (minTempF <= prevTemp && minTempF >= currTemp) {
          const ratio = (prevTemp - minTempF) / (prevTemp - currTemp);
          return Math.ceil(prevPercent + ratio * (currPercent - prevPercent));
        }
      }
      return percentages[i];
    }
  }

  return 60; // Max protection
}

export function GlycolCalculatorDialog({
  open,
  onOpenChange,
  onApply,
  currentGlycolPercent = 0,
}: GlycolCalculatorDialogProps) {
  const [minTempF, setMinTempF] = useState<number>(20);
  const [glycolType, setGlycolType] = useState<GlycolType>('propylene');
  const [calculatedPercent, setCalculatedPercent] = useState<number>(currentGlycolPercent);

  const results = useMemo(() => {
    const requiredPercent = calculateRequiredGlycolPercent(minTempF, glycolType);
    const freezePoint = interpolateFreezePoint(requiredPercent, glycolType);
    const burstProtection = freezePoint - BURST_PROTECTION_DELTA;
    const propertyChanges = PROPERTY_CHANGES[glycolType];

    return {
      requiredPercent,
      freezePoint,
      burstProtection,
      densityChange: requiredPercent * propertyChanges.density,
      viscosityChange: requiredPercent * propertyChanges.viscosity,
      specificHeatChange: requiredPercent * propertyChanges.specificHeat,
    };
  }, [minTempF, glycolType]);

  const handleCalculate = () => {
    setCalculatedPercent(results.requiredPercent);
  };

  const handleApply = () => {
    onApply(calculatedPercent);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Glycol Calculator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Snowflake className="h-3 w-3" />
                Minimum Temperature (°F)
              </Label>
              <Input
                type="number"
                value={minTempF}
                onChange={(e) => setMinTempF(parseFloat(e.target.value) || 20)}
              />
            </div>
            <div className="space-y-2">
              <Label>Glycol Type</Label>
              <Select value={glycolType} onValueChange={(v) => setGlycolType(v as GlycolType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="propylene">Propylene Glycol</SelectItem>
                  <SelectItem value="ethylene">Ethylene Glycol</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleCalculate} className="w-full">
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Required Glycol
          </Button>

          <Separator />

          {/* Results */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Droplets className="h-4 w-4" />
                Recommended Solution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Required Glycol:</span>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {results.requiredPercent}%
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Freeze Point:</span>
                  <span>{results.freezePoint.toFixed(0)}°F</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Burst Protection:</span>
                  <span>{results.burstProtection.toFixed(0)}°F</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Changes */}
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Thermometer className="h-4 w-4" />
                Fluid Property Changes
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Density:</span>
                <span className={results.densityChange > 0 ? 'text-amber-600' : ''}>
                  +{results.densityChange.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Viscosity:</span>
                <span className="text-amber-600">
                  +{results.viscosityChange.toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Specific Heat:</span>
                <span className="text-amber-600">
                  {results.specificHeatChange.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Warnings */}
          {results.requiredPercent >= 40 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                High glycol concentrations (&gt;40%) significantly increase pumping costs due to higher viscosity. 
                Consider lower velocity limits and larger pipe sizes.
              </AlertDescription>
            </Alert>
          )}

          {glycolType === 'ethylene' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Ethylene glycol is toxic. Propylene glycol is recommended for HVAC systems, 
                especially where food processing or potable water cross-connections are possible.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply {calculatedPercent}% Glycol
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
