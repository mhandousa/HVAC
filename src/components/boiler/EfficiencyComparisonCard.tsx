import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Award, Thermometer, Droplets } from 'lucide-react';
import {
  type BoilerCatalogItem,
  type BoilerRequirements,
  ASHRAE_90_1_BOILER_MINIMUMS,
  calculateAdjustedBoilerEfficiency,
  CONDENSING_THRESHOLD_TEMP,
} from '@/lib/boiler-selection-calculations';

interface EfficiencyComparisonCardProps {
  selectedBoiler: BoilerCatalogItem | null;
  requirements?: BoilerRequirements;
}

export function EfficiencyComparisonCard({ selectedBoiler, requirements }: EfficiencyComparisonCardProps) {
  if (!selectedBoiler) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Efficiency Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Select a boiler to see efficiency comparison
          </p>
        </CardContent>
      </Card>
    );
  }

  const baseline = ASHRAE_90_1_BOILER_MINIMUMS[selectedBoiler.boilerType];
  
  // Calculate adjusted efficiency if requirements are provided
  const adjustedResult = requirements?.hwReturnTempF 
    ? calculateAdjustedBoilerEfficiency(
        selectedBoiler.afue,
        selectedBoiler.boilerType,
        requirements.hwReturnTempF,
        requirements.hwSupplyTempF,
        requirements.combustionAirTempF
      )
    : null;
  
  const effectiveAfue = adjustedResult ? adjustedResult.adjustedAfue : selectedBoiler.afue;
  const hasAdjustment = adjustedResult && Math.abs(adjustedResult.correctionFactor) > 0.1;
  
  const afueVsBaseline = effectiveAfue - baseline.afue;
  const thermalVsBaseline = selectedBoiler.thermalEfficiency - baseline.thermalEfficiency;

  const getIcon = (diff: number) => {
    if (diff > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (diff < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getColor = (diff: number) => {
    if (diff > 0) return 'text-green-600';
    if (diff < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Efficiency Comparison
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            vs. ASHRAE 90.1-2019
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AFUE Comparison */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              {hasAdjustment ? 'Adjusted AFUE' : 'AFUE'}
              {hasAdjustment && <Thermometer className="h-3 w-3" />}
            </span>
            <div className="flex items-center gap-2">
              {getIcon(afueVsBaseline)}
              <span className={`font-medium ${getColor(afueVsBaseline)}`}>
                {afueVsBaseline > 0 ? '+' : ''}{afueVsBaseline.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="relative">
            <Progress value={(effectiveAfue / 100) * 100} className="h-3" />
            <div 
              className="absolute top-0 h-3 w-0.5 bg-destructive"
              style={{ left: `${baseline.afue}%` }}
            />
            {/* Show base AFUE marker if adjusted */}
            {hasAdjustment && (
              <div 
                className="absolute top-0 h-3 w-0.5 bg-muted-foreground/50"
                style={{ left: `${selectedBoiler.afue}%` }}
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {hasAdjustment 
                ? `Adjusted: ${effectiveAfue.toFixed(1)}% (Base: ${selectedBoiler.afue}%)`
                : `Selected: ${selectedBoiler.afue}%`
              }
            </span>
            <span>Baseline: {baseline.afue}%</span>
          </div>
        </div>
        
        {/* Temperature Correction Info */}
        {hasAdjustment && adjustedResult && (
          <div className="bg-muted/50 rounded-md p-2 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Thermometer className="h-3 w-3" />
              <span className="font-medium">Temperature Correction Applied</span>
            </div>
            <p className="text-muted-foreground">
              {adjustedResult.explanation}
            </p>
          </div>
        )}

        {/* Thermal Efficiency Comparison */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Thermal Efficiency</span>
            <div className="flex items-center gap-2">
              {getIcon(thermalVsBaseline)}
              <span className={`font-medium ${getColor(thermalVsBaseline)}`}>
                {thermalVsBaseline > 0 ? '+' : ''}{thermalVsBaseline.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="relative">
            <Progress value={(selectedBoiler.thermalEfficiency / 100) * 100} className="h-3" />
            <div 
              className="absolute top-0 h-3 w-0.5 bg-destructive"
              style={{ left: `${baseline.thermalEfficiency}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Selected: {selectedBoiler.thermalEfficiency}%</span>
            <span>Baseline: {baseline.thermalEfficiency}%</span>
          </div>
        </div>

        {/* Condensing Threshold Indicator (for condensing boilers) */}
        {selectedBoiler.boilerType === 'condensing-gas' && requirements?.hwReturnTempF && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Droplets className="h-4 w-4" />
                Condensing Mode
              </span>
              <Badge 
                variant={requirements.hwReturnTempF < CONDENSING_THRESHOLD_TEMP ? 'default' : 'secondary'}
                className={requirements.hwReturnTempF < CONDENSING_THRESHOLD_TEMP ? 'bg-blue-600' : ''}
              >
                {requirements.hwReturnTempF < CONDENSING_THRESHOLD_TEMP ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="relative mt-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    requirements.hwReturnTempF < CONDENSING_THRESHOLD_TEMP 
                      ? 'bg-blue-500' 
                      : 'bg-muted-foreground/30'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, 100 - (requirements.hwReturnTempF - 100) / 0.8))}%` }}
                />
              </div>
              <div 
                className="absolute top-0 h-2 w-0.5 bg-blue-600"
                style={{ left: `${100 - (CONDENSING_THRESHOLD_TEMP - 100) / 0.8}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Return: {requirements.hwReturnTempF}°F</span>
              <span>Threshold: {CONDENSING_THRESHOLD_TEMP}°F</span>
            </div>
          </div>
        )}

        {/* Turndown Advantage */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Turndown Ratio</span>
            <span className="font-medium">{selectedBoiler.turndownRatio}:1</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedBoiler.turndownRatio >= 10 
              ? 'Excellent modulation for part-load efficiency'
              : selectedBoiler.turndownRatio >= 5
              ? 'Good modulation capability'
              : 'Limited modulation range'}
          </p>
        </div>

        {/* Emissions */}
        {selectedBoiler.noxEmissions > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">NOx Emissions</span>
              <Badge variant={selectedBoiler.noxEmissions <= 20 ? 'default' : 'secondary'}>
                {selectedBoiler.noxEmissions} ppm
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedBoiler.noxEmissions <= 9 
                ? 'Ultra-low NOx (meets strictest standards)'
                : selectedBoiler.noxEmissions <= 20
                ? 'Low NOx compliant'
                : 'Standard emissions'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}