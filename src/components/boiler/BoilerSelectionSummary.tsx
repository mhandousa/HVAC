import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Save, Download, Flame, AlertTriangle, Check, DollarSign, Thermometer, Droplets } from 'lucide-react';
import {
  type BoilerCatalogItem,
  type BoilerRequirements,
  calculateBoilerFitScore,
  calculateHWFlowGpm,
  calculateAnnualFuelConsumption,
  calculateAdjustedBoilerEfficiency,
  getBoilerTypeDisplayName,
  getFuelTypeDisplayName,
  ASHRAE_90_1_BOILER_MINIMUMS,
  CONDENSING_THRESHOLD_TEMP,
} from '@/lib/boiler-selection-calculations';

interface BoilerSelectionSummaryProps {
  selectedBoiler: BoilerCatalogItem | null;
  requirements: BoilerRequirements;
  onSave?: () => void;
  onExport?: () => void;
  isSaving?: boolean;
}

export function BoilerSelectionSummary({
  selectedBoiler,
  requirements,
  onSave,
  onExport,
  isSaving,
}: BoilerSelectionSummaryProps) {
  if (!selectedBoiler) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Selection Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No boiler selected. Click a row in the catalog to select a boiler.
          </p>
        </CardContent>
      </Card>
    );
  }

  const fitScore = calculateBoilerFitScore(selectedBoiler, requirements);
  const baseline = ASHRAE_90_1_BOILER_MINIMUMS[selectedBoiler.boilerType];
  const deltaT = (requirements.hwSupplyTempF || 180) - (requirements.hwReturnTempF || 160);
  const hwFlowGpm = calculateHWFlowGpm(selectedBoiler.capacityBtuh, deltaT > 0 ? deltaT : 20);
  const capacityRatio = requirements.requiredCapacityBtuh > 0 
    ? selectedBoiler.capacityBtuh / requirements.requiredCapacityBtuh 
    : 1;
  
  // Calculate adjusted efficiency
  const adjustedResult = requirements.hwReturnTempF 
    ? calculateAdjustedBoilerEfficiency(
        selectedBoiler.afue,
        selectedBoiler.boilerType,
        requirements.hwReturnTempF,
        requirements.hwSupplyTempF,
        requirements.combustionAirTempF
      )
    : null;
  
  const effectiveAfue = adjustedResult ? adjustedResult.adjustedAfue : selectedBoiler.afue;
  const afueRatio = effectiveAfue / baseline.afue;
  const hasAdjustment = adjustedResult && Math.abs(adjustedResult.correctionFactor) > 0.1;
  
  const fuelConsumption = calculateAnnualFuelConsumption(
    selectedBoiler.capacityBtuh,
    effectiveAfue, // Use adjusted efficiency for cost calculation
    selectedBoiler.fuelType
  );

  const getFitScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Selection Summary
          </CardTitle>
          <Badge 
            variant={fitScore >= 85 ? 'default' : fitScore >= 70 ? 'secondary' : 'destructive'}
            className="text-sm"
          >
            Fit Score: {fitScore}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Boiler */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Selected Boiler</h4>
          <p className="font-semibold text-lg">{selectedBoiler.manufacturer} {selectedBoiler.model}</p>
          <p className="text-sm text-muted-foreground">
            {getBoilerTypeDisplayName(selectedBoiler.boilerType)} • {getFuelTypeDisplayName(selectedBoiler.fuelType)}
          </p>
        </div>

        <Separator />

        {/* Capacity Analysis */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Capacity</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Selected:</div>
            <div className="font-medium text-right">{(selectedBoiler.capacityBtuh / 1000).toFixed(0)} MBH</div>
            <div>Required:</div>
            <div className="font-medium text-right">{(requirements.requiredCapacityBtuh / 1000).toFixed(0)} MBH</div>
            <div>Ratio:</div>
            <div className={`font-medium text-right ${capacityRatio >= 1.1 && capacityRatio <= 1.25 ? 'text-green-600' : capacityRatio < 1 ? 'text-red-600' : ''}`}>
              {(capacityRatio * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        <Separator />

        {/* Efficiency with Temperature Correction */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Efficiency</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Base AFUE:</div>
            <div className="font-medium text-right">{selectedBoiler.afue}%</div>
            {hasAdjustment && adjustedResult && (
              <>
                <div>Adjusted AFUE:</div>
                <div className="font-medium text-right flex items-center justify-end gap-1">
                  {adjustedResult.adjustedAfue.toFixed(1)}%
                  <Badge 
                    variant={adjustedResult.correctionFactor >= 0 ? 'default' : 'secondary'}
                    className="text-xs px-1 py-0"
                  >
                    {adjustedResult.correctionFactor >= 0 ? '+' : ''}{adjustedResult.correctionFactor.toFixed(1)}%
                  </Badge>
                </div>
              </>
            )}
            <div>Thermal Eff:</div>
            <div className="font-medium text-right">{selectedBoiler.thermalEfficiency}%</div>
            <div>ASHRAE 90.1 Baseline:</div>
            <div className="font-medium text-right">{baseline.afue}%</div>
            <div>vs. Baseline:</div>
            <div className={`font-medium text-right ${afueRatio >= 1 ? 'text-green-600' : 'text-red-600'}`}>
              {afueRatio >= 1 ? '+' : ''}{((afueRatio - 1) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
        
        {/* Efficiency Correction Card */}
        {hasAdjustment && adjustedResult && (
          <>
            <div className="bg-muted/50 rounded-lg p-3">
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Thermometer className="h-4 w-4 text-orange-500" />
                Efficiency Temperature Correction
                <Badge 
                  variant={adjustedResult.correctionFactor >= 0 ? 'default' : 'destructive'}
                  className={adjustedResult.correctionFactor >= 0 ? 'bg-green-600' : ''}
                >
                  {adjustedResult.correctionFactor >= 0 ? '+' : ''}{adjustedResult.correctionFactor.toFixed(1)}%
                </Badge>
              </h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                {adjustedResult.corrections.returnTemp.effect !== 0 && (
                  <p>
                    {adjustedResult.corrections.returnTemp.effect >= 0 ? '+' : ''}
                    {adjustedResult.corrections.returnTemp.effect.toFixed(1)}% from {Math.abs(adjustedResult.corrections.returnTemp.deviation).toFixed(0)}°F 
                    {adjustedResult.corrections.returnTemp.deviation > 0 ? ' lower' : ' higher'} return water temp
                  </p>
                )}
                {adjustedResult.corrections.combustionAir.effect !== 0 && (
                  <p>
                    {adjustedResult.corrections.combustionAir.effect >= 0 ? '+' : ''}
                    {adjustedResult.corrections.combustionAir.effect.toFixed(1)}% from {Math.abs(adjustedResult.corrections.combustionAir.deviation).toFixed(0)}°F 
                    {adjustedResult.corrections.combustionAir.deviation > 0 ? ' colder' : ' warmer'} combustion air
                  </p>
                )}
              </div>
              {adjustedResult.isCondensingMode && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Condensing Mode Active - Optimal Efficiency
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        <Separator />

        {/* Operating Parameters */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Operating Parameters</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>HW Flow:</div>
            <div className="font-medium text-right">{hwFlowGpm.toFixed(1)} GPM</div>
            <div>Turndown:</div>
            <div className="font-medium text-right">{selectedBoiler.turndownRatio}:1</div>
            <div>Sound Level:</div>
            <div className="font-medium text-right">{selectedBoiler.soundDb} dB</div>
            <div>Weight:</div>
            <div className="font-medium text-right">{selectedBoiler.weightLbs.toLocaleString()} lbs</div>
          </div>
        </div>

        <Separator />

        {/* Annual Operating Costs */}
        <div className="bg-muted/50 rounded-lg p-3">
          <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            Annual Operating Cost Estimate
            {hasAdjustment && (
              <Badge variant="outline" className="text-xs">
                Based on Adj. AFUE
              </Badge>
            )}
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Fuel Consumption:</div>
            <div className="font-medium text-right">
              {fuelConsumption.consumption.toLocaleString()} {fuelConsumption.unit}
            </div>
            <div>Annual Fuel Cost:</div>
            <div className="font-medium text-right text-green-600">
              SAR {fuelConsumption.costSar.toLocaleString()}
            </div>
          </div>
        </div>

        <Separator />

        {/* Compliance Status */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Compliance</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant={effectiveAfue >= baseline.afue ? 'default' : 'destructive'}>
              {effectiveAfue >= baseline.afue ? (
                <><Check className="h-3 w-3 mr-1" /> ASHRAE 90.1</>
              ) : (
                <><AlertTriangle className="h-3 w-3 mr-1" /> Below 90.1</>
              )}
            </Badge>
            {hasAdjustment && (
              <Badge variant="outline" className="text-xs">
                Using Adjusted AFUE
              </Badge>
            )}
            {selectedBoiler.asmeCompliant && (
              <Badge variant="outline">
                <Check className="h-3 w-3 mr-1" /> ASME
              </Badge>
            )}
            {selectedBoiler.ahriCertified && (
              <Badge variant="outline">
                <Check className="h-3 w-3 mr-1" /> AHRI
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Pricing */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">List Price</h4>
          <p className="text-2xl font-bold text-primary">
            SAR {selectedBoiler.listPriceSar.toLocaleString()}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button onClick={onSave} disabled={isSaving} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Selection'}
          </Button>
          <Button variant="outline" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}