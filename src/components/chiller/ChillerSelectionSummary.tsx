import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  FileSpreadsheet,
  Zap,
  Droplets,
  Volume2,
  Weight,
  Thermometer,
} from 'lucide-react';
import type { ChillerCatalogItem, ChillerRequirements } from '@/lib/chiller-selection-calculations';
import { 
  calculateFitScore, 
  calculateChwFlowGpm, 
  calculateCwFlowGpm,
  getChillerTypeDisplayName,
  calculateAdjustedIplv,
  ASHRAE_90_1_MINIMUMS,
  AHRI_STANDARD_CONDITIONS,
} from '@/lib/chiller-selection-calculations';

interface ChillerSelectionSummaryProps {
  selectedChiller: ChillerCatalogItem | null;
  requirements: ChillerRequirements;
  onSave?: () => void;
  onExport?: () => void;
  isSaving?: boolean;
}

export function ChillerSelectionSummary({
  selectedChiller,
  requirements,
  onSave,
  onExport,
  isSaving,
}: ChillerSelectionSummaryProps) {
  if (!selectedChiller) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selection Summary</CardTitle>
          <CardDescription>Select a chiller from the catalog</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            No chiller selected
          </div>
        </CardContent>
      </Card>
    );
  }

  const fitScore = calculateFitScore(selectedChiller, requirements);
  const baseline = ASHRAE_90_1_MINIMUMS[selectedChiller.chillerType];
  const chwFlowGpm = calculateChwFlowGpm(selectedChiller.capacityTons, selectedChiller.chwDeltaT);
  const cwFlowGpm = selectedChiller.cwDeltaT > 0 
    ? calculateCwFlowGpm(selectedChiller.capacityTons, selectedChiller.cwDeltaT)
    : null;
  
  const capacityRatio = requirements.requiredCapacityTons 
    ? selectedChiller.capacityTons / requirements.requiredCapacityTons
    : 1;

  // Calculate adjusted IPLV based on operating temperatures
  const isWaterCooled = selectedChiller.chillerType.startsWith('water-cooled');
  const standardConditions = isWaterCooled 
    ? AHRI_STANDARD_CONDITIONS.waterCooled 
    : AHRI_STANDARD_CONDITIONS.airCooled;

  const adjustedIplvResult = calculateAdjustedIplv(
    selectedChiller.iplv,
    selectedChiller.chillerType,
    requirements.chwSupplyF || 44,
    isWaterCooled ? requirements.cwSupplyF : undefined,
    !isWaterCooled ? requirements.ambientDesignF : undefined
  );

  // Check if temperatures differ from AHRI standard conditions
  const hasTemperatureDeviation = 
    (requirements.chwSupplyF && requirements.chwSupplyF !== standardConditions.lchwt) ||
    (isWaterCooled && requirements.cwSupplyF && requirements.cwSupplyF !== 85) ||
    (!isWaterCooled && requirements.ambientDesignF && requirements.ambientDesignF !== 95);

  // Use adjusted IPLV for compliance when deviation exists
  const effectiveIplv = hasTemperatureDeviation 
    ? adjustedIplvResult.adjustedIplv 
    : selectedChiller.iplv;
  const iplvRatio = effectiveIplv / baseline.iplv;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Selection Summary</CardTitle>
            <CardDescription>
              {selectedChiller.manufacturer} {selectedChiller.model}
            </CardDescription>
          </div>
          <Badge
            variant={fitScore >= 80 ? 'default' : fitScore >= 60 ? 'secondary' : 'destructive'}
            className="text-lg px-3 py-1"
          >
            {fitScore}% Fit
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chiller Details */}
        <div className="rounded-md border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type</span>
            <span className="text-sm font-medium">
              {getChillerTypeDisplayName(selectedChiller.chillerType)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Compressor</span>
            <span className="text-sm font-medium capitalize">
              {selectedChiller.compressorType}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Refrigerant</span>
            <span className="text-sm font-medium">{selectedChiller.refrigerant}</span>
          </div>
        </div>
        
        {/* Capacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Capacity</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{selectedChiller.capacityTons} Tons</span>
              {requirements.requiredCapacityTons && (
                <Badge
                  variant={
                    capacityRatio >= 0.95 && capacityRatio <= 1.25
                      ? 'default'
                      : capacityRatio < 0.95
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {Math.round((capacityRatio - 1) * 100)}% 
                  {capacityRatio >= 1 ? ' over' : ' under'}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Efficiency */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-muted/50 p-2">
            <div className="text-xs text-muted-foreground">EER</div>
            <div className="text-lg font-bold">{selectedChiller.eer.toFixed(2)}</div>
          </div>
          <div className="rounded-md bg-muted/50 p-2">
            <div className="text-xs text-muted-foreground">COP</div>
            <div className="text-lg font-bold">{selectedChiller.cop.toFixed(2)}</div>
          </div>
          <div className="rounded-md bg-muted/50 p-2">
            <div className="text-xs text-muted-foreground">IPLV</div>
            <div className={`text-lg font-bold ${iplvRatio >= 1 ? 'text-green-600' : 'text-destructive'}`}>
              {hasTemperatureDeviation 
                ? effectiveIplv.toFixed(2)
                : selectedChiller.iplv.toFixed(2)}
            </div>
            {hasTemperatureDeviation && (
              <div className="text-xs text-muted-foreground">
                (Base: {selectedChiller.iplv.toFixed(2)})
              </div>
            )}
          </div>
        </div>

        {/* IPLV Temperature Correction Card */}
        {hasTemperatureDeviation && (
          <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">IPLV Temperature Correction</span>
              <Badge 
                variant={adjustedIplvResult.correctionFactor >= 0 ? 'default' : 'secondary'}
                className="ml-auto"
              >
                {adjustedIplvResult.correctionFactor >= 0 ? '+' : ''}
                {adjustedIplvResult.correctionFactor.toFixed(1)}%
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base IPLV:</span>
                <span className="font-medium">{selectedChiller.iplv.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Adjusted IPLV:</span>
                <span className="font-medium text-blue-600">
                  {adjustedIplvResult.adjustedIplv.toFixed(2)}
                </span>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              {adjustedIplvResult.explanation}
            </p>

            {Math.abs(adjustedIplvResult.correctionFactor) > 15 && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 pt-1">
                <AlertTriangle className="h-3 w-3" />
                <span>Operating far from rated conditions - verify manufacturer data</span>
              </div>
            )}
          </div>
        )}
        
        <Separator />
        
        {/* Operating Parameters */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Droplets className="h-4 w-4 text-blue-500" />
            <span className="text-muted-foreground">CHW Flow:</span>
            <span className="font-medium">{Math.round(chwFlowGpm)} GPM</span>
          </div>
          {cwFlowGpm && (
            <div className="flex items-center gap-2 text-sm">
              <Droplets className="h-4 w-4 text-cyan-500" />
              <span className="text-muted-foreground">CW Flow:</span>
              <span className="font-medium">{Math.round(cwFlowGpm)} GPM</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-muted-foreground">Power Input:</span>
            <span className="font-medium">{selectedChiller.powerInputKw} kW</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Volume2 className="h-4 w-4 text-purple-500" />
            <span className="text-muted-foreground">Sound:</span>
            <span className="font-medium">{selectedChiller.soundDb} dB</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Weight className="h-4 w-4 text-gray-500" />
            <span className="text-muted-foreground">Weight:</span>
            <span className="font-medium">{selectedChiller.weightOperatingLbs.toLocaleString()} lbs</span>
          </div>
        </div>
        
        <Separator />
        
        {/* Compliance Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">ASHRAE 90.1 Compliant</span>
            {iplvRatio >= 1 ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">SASO Certified</span>
            {selectedChiller.sasoCompliant ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">AHRI Certified</span>
            {selectedChiller.ahriCertified ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
          </div>
        </div>
        
        <Separator />
        
        {/* Price */}
        <div className="flex items-center justify-between rounded-md bg-muted/50 p-3">
          <span className="text-sm font-medium">List Price</span>
          <span className="text-xl font-bold">
            {selectedChiller.listPriceSar.toLocaleString()} SAR
          </span>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            className="flex-1" 
            onClick={onSave}
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Selection'}
          </Button>
          <Button variant="outline" onClick={onExport}>
            <FileSpreadsheet className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
