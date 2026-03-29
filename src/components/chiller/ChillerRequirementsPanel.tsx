import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Factory, Thermometer, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ChillerType, ChillerRequirements, ChillerCatalogItem } from '@/lib/chiller-selection-calculations';
import { 
  getChillerTypeDisplayName, 
  ASHRAE_90_1_MINIMUMS,
  calculateAdjustedIplv,
  AHRI_STANDARD_CONDITIONS,
} from '@/lib/chiller-selection-calculations';

interface ChillerRequirementsPanelProps {
  requirements: ChillerRequirements;
  onRequirementsChange: (requirements: ChillerRequirements) => void;
  onImportFromPlant?: () => void;
  hasPlantData?: boolean;
  plantName?: string;
  selectedChiller?: ChillerCatalogItem | null;
}

export function ChillerRequirementsPanel({
  requirements,
  onRequirementsChange,
  onImportFromPlant,
  hasPlantData,
  plantName,
  selectedChiller,
}: ChillerRequirementsPanelProps) {
  const isWaterCooled = requirements.chillerType?.includes('water-cooled');
  const baseline = requirements.chillerType 
    ? ASHRAE_90_1_MINIMUMS[requirements.chillerType]
    : null;

  // Calculate adjusted IPLV if we have a selected chiller
  const adjustedIplvResult = selectedChiller ? calculateAdjustedIplv(
    selectedChiller.iplv,
    selectedChiller.chillerType,
    requirements.chwSupplyF || 44,
    isWaterCooled ? requirements.cwSupplyF : undefined,
    !isWaterCooled ? requirements.ambientDesignF : undefined
  ) : null;

  // Check if temperatures differ from standard
  const standardConditions = isWaterCooled 
    ? AHRI_STANDARD_CONDITIONS.waterCooled 
    : AHRI_STANDARD_CONDITIONS.airCooled;
  const hasTemperatureDeviation = selectedChiller && (
    (requirements.chwSupplyF || 44) !== standardConditions.lchwt ||
    (isWaterCooled && (requirements.cwSupplyF || 85) !== (standardConditions as any).ecwt) ||
    (!isWaterCooled && (requirements.ambientDesignF || 95) !== (standardConditions as any).ambient)
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Thermometer className="h-4 w-4" />
              Requirements
            </CardTitle>
            <CardDescription>Define chiller selection criteria</CardDescription>
          </div>
          {hasPlantData && onImportFromPlant && (
            <Button size="sm" variant="outline" onClick={onImportFromPlant}>
              <Download className="mr-2 h-4 w-4" />
              Import from Plant
            </Button>
          )}
        </div>
        {plantName && (
          <div className="mt-2 flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
            <Factory className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Linked to:</span>
            <span className="font-medium">{plantName}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Capacity */}
        <div className="space-y-2">
          <Label htmlFor="capacity">Required Capacity (Tons)</Label>
          <Input
            id="capacity"
            type="number"
            value={requirements.requiredCapacityTons || ''}
            onChange={(e) =>
              onRequirementsChange({
                ...requirements,
                requiredCapacityTons: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="Enter cooling load"
          />
        </div>
        
        {/* Chiller Type */}
        <div className="space-y-2">
          <Label>Chiller Type</Label>
          <Select
            value={requirements.chillerType || 'any'}
            onValueChange={(v) =>
              onRequirementsChange({
                ...requirements,
                chillerType: v === 'any' ? undefined : v as ChillerType,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Type</SelectItem>
              <SelectItem value="water-cooled-centrifugal">
                {getChillerTypeDisplayName('water-cooled-centrifugal')}
              </SelectItem>
              <SelectItem value="water-cooled-screw">
                {getChillerTypeDisplayName('water-cooled-screw')}
              </SelectItem>
              <SelectItem value="air-cooled-screw">
                {getChillerTypeDisplayName('air-cooled-screw')}
              </SelectItem>
              <SelectItem value="air-cooled-scroll">
                {getChillerTypeDisplayName('air-cooled-scroll')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Separator />
        
        {/* CHW Temperatures */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="chw-supply">CHW Supply (°F)</Label>
            <Input
              id="chw-supply"
              type="number"
              value={requirements.chwSupplyF || 44}
              onChange={(e) =>
                onRequirementsChange({
                  ...requirements,
                  chwSupplyF: parseFloat(e.target.value) || 44,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="chw-return">CHW Return (°F)</Label>
            <Input
              id="chw-return"
              type="number"
              value={requirements.chwReturnF || 54}
              onChange={(e) =>
                onRequirementsChange({
                  ...requirements,
                  chwReturnF: parseFloat(e.target.value) || 54,
                })
              }
            />
          </div>
        </div>
        
        {/* CW Temperatures (for water-cooled) */}
        {isWaterCooled && (
          <div className="space-y-2">
            <Label htmlFor="cw-supply">CW Entering Temp (°F)</Label>
            <Input
              id="cw-supply"
              type="number"
              value={requirements.cwSupplyF || 85}
              onChange={(e) =>
                onRequirementsChange({
                  ...requirements,
                  cwSupplyF: parseFloat(e.target.value) || 85,
                })
              }
            />
          </div>
        )}
        
        {/* Ambient Temp (for air-cooled) */}
        {!isWaterCooled && requirements.chillerType && (
          <div className="space-y-2">
            <Label htmlFor="ambient">Ambient Design Temp (°F)</Label>
            <Input
              id="ambient"
              type="number"
              value={requirements.ambientDesignF || 115}
              onChange={(e) =>
                onRequirementsChange({
                  ...requirements,
                  ambientDesignF: parseFloat(e.target.value) || 115,
                })
              }
            />
          </div>
        )}

        {/* IPLV Temperature Correction Display */}
        {selectedChiller && adjustedIplvResult && hasTemperatureDeviation && (
          <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Thermometer className="h-3 w-3" />
              AHRI 551/591 Temperature Correction
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Standard:</span>
                <span>LCHWT {standardConditions.lchwt}°F</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Actual:</span>
                <span>LCHWT {requirements.chwSupplyF || 44}°F</span>
              </div>
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Base IPLV:</span>
              <span className="font-medium">{adjustedIplvResult.baseIplv.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Adjusted IPLV:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold">{adjustedIplvResult.adjustedIplv.toFixed(2)}</span>
                {adjustedIplvResult.correctionFactor > 1 ? (
                  <Badge variant="default" className="text-xs gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +{((adjustedIplvResult.correctionFactor - 1) * 100).toFixed(1)}%
                  </Badge>
                ) : adjustedIplvResult.correctionFactor < 1 ? (
                  <Badge variant="destructive" className="text-xs gap-1">
                    <TrendingDown className="h-3 w-3" />
                    {((adjustedIplvResult.correctionFactor - 1) * 100).toFixed(1)}%
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Minus className="h-3 w-3" />
                    0%
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {adjustedIplvResult.explanation || 'No correction needed'}
            </p>
          </div>
        )}
        
        <Separator />
        
        {/* Efficiency Targets */}
        <div className="space-y-2">
          <Label htmlFor="min-iplv">
            Minimum IPLV Target
            {baseline && (
              <span className="ml-2 text-xs text-muted-foreground">
                (ASHRAE min: {baseline.iplv})
              </span>
            )}
          </Label>
          <Input
            id="min-iplv"
            type="number"
            step="0.1"
            value={requirements.minIplv || ''}
            onChange={(e) =>
              onRequirementsChange({
                ...requirements,
                minIplv: parseFloat(e.target.value) || undefined,
              })
            }
            placeholder={baseline ? `Min ${baseline.iplv}` : 'Optional'}
          />
        </div>
        
        <Separator />
        
        {/* Compliance Options */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>SASO Certification Required</Label>
            <p className="text-xs text-muted-foreground">
              Filter for Saudi-certified equipment
            </p>
          </div>
          <Switch
            checked={requirements.sasoRequired || false}
            onCheckedChange={(checked) =>
              onRequirementsChange({
                ...requirements,
                sasoRequired: checked,
              })
            }
          />
        </div>
        
        {/* Manufacturer Preference */}
        <div className="space-y-2">
          <Label htmlFor="manufacturer">Manufacturer Preference</Label>
          <Select
            value={requirements.manufacturerPreference || 'any'}
            onValueChange={(v) =>
              onRequirementsChange({
                ...requirements,
                manufacturerPreference: v === 'any' ? undefined : v,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="No preference" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">No Preference</SelectItem>
              <SelectItem value="Carrier">Carrier</SelectItem>
              <SelectItem value="Trane">Trane</SelectItem>
              <SelectItem value="York">York</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
