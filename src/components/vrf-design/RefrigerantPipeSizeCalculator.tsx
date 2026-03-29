import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useVRFPipingSizing } from '@/hooks/useVRFPipingSizing';
import type { RefrigerantType, LineType } from '@/lib/vrf-refrigerant-calculations';

interface RefrigerantPipeSizeCalculatorProps {
  refrigerant?: RefrigerantType;
  onApplySize?: (lineType: LineType, sizeOd: number) => void;
}

export function RefrigerantPipeSizeCalculator({
  refrigerant = 'R410A',
  onApplySize,
}: RefrigerantPipeSizeCalculatorProps) {
  const [capacityKw, setCapacityKw] = useState(14);
  const [lengthFt, setLengthFt] = useState(50);
  const [equivLengthFt, setEquivLengthFt] = useState(10);
  const [lineType, setLineType] = useState<LineType>('liquid');
  const [isRiser, setIsRiser] = useState(false);
  const [elevationFt, setElevationFt] = useState(0);
  
  const { sizeLiquidLine, sizeSuctionLine, sizeDischargeLine } = useVRFPipingSizing(refrigerant);
  
  const result = useMemo(() => {
    const input = {
      capacityKw,
      lengthFt,
      equivalentLengthFt: equivLengthFt,
      isRiser,
      elevationChangeFt: elevationFt,
    };
    
    switch (lineType) {
      case 'liquid':
        return sizeLiquidLine(input);
      case 'suction':
        return sizeSuctionLine(input);
      case 'discharge':
        return sizeDischargeLine(input);
    }
  }, [capacityKw, lengthFt, equivLengthFt, lineType, isRiser, elevationFt, sizeLiquidLine, sizeSuctionLine, sizeDischargeLine]);
  
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5" />
          Refrigerant Pipe Size Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity (kW)</Label>
            <Input
              id="capacity"
              type="number"
              step="0.1"
              value={capacityKw}
              onChange={(e) => setCapacityKw(parseFloat(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              {(capacityKw / 3.517).toFixed(1)} Tons
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lineType">Line Type</Label>
            <Select value={lineType} onValueChange={(v) => setLineType(v as LineType)}>
              <SelectTrigger id="lineType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="liquid">Liquid Line</SelectItem>
                <SelectItem value="suction">Suction Line</SelectItem>
                <SelectItem value="discharge">Discharge Line</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="length">Actual Length (ft)</Label>
            <Input
              id="length"
              type="number"
              step="1"
              value={lengthFt}
              onChange={(e) => setLengthFt(parseFloat(e.target.value) || 0)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="equivLength">Equiv. Length from Fittings (ft)</Label>
            <Input
              id="equivLength"
              type="number"
              step="1"
              value={equivLengthFt}
              onChange={(e) => setEquivLengthFt(parseFloat(e.target.value) || 0)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="elevation">Elevation Change (ft)</Label>
            <Input
              id="elevation"
              type="number"
              step="1"
              value={elevationFt}
              onChange={(e) => setElevationFt(parseFloat(e.target.value) || 0)}
            />
          </div>
          
          <div className="flex items-center space-x-4 pt-6">
            <Switch
              id="isRiser"
              checked={isRiser}
              onCheckedChange={setIsRiser}
            />
            <Label htmlFor="isRiser">Includes Vertical Riser</Label>
          </div>
        </div>
        
        {/* Results */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Recommended Size:</span>
            <Badge variant="default" className="text-lg px-4 py-1">
              {result.recommendedSize.name}
            </Badge>
          </div>
          
          <div className="grid gap-3 md:grid-cols-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Velocity:</span>
              <span>{result.velocity_fpm.toFixed(0)} fpm ({result.velocity_fps.toFixed(1)} fps)</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mass Flow:</span>
              <span>{result.massFlow_lb_hr.toFixed(0)} lb/hr</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pressure Drop:</span>
              <span>{result.pressureDrop_psi.toFixed(2)} psi</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Per 100 ft:</span>
              <span>{result.pressureDrop_psi_per_100ft.toFixed(2)} psi/100ft</span>
            </div>
          </div>
          
          {/* Oil Return Status */}
          {lineType !== 'liquid' && (
            <div className="flex items-center gap-2 pt-2 border-t">
              {result.oilReturnOk ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Oil return velocity OK</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-yellow-600">
                    Low velocity - min {result.oilReturnMinVelocity_fpm.toFixed(0)} fpm required
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Warnings */}
        {result.warnings.length > 0 && (
          <div className="space-y-2">
            {result.warnings.map((warning, i) => (
              <Alert key={i} variant="default">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{warning}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}
        
        {onApplySize && (
          <Button
            onClick={() => onApplySize(lineType, result.recommendedSize.od)}
            className="w-full"
          >
            Apply {result.recommendedSize.name} to Selected Unit
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
