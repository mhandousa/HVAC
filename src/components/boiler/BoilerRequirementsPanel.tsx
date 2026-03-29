import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Download, Flame, Info, Droplets } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  type BoilerRequirements,
  type BoilerType,
  type FuelType,
  getBoilerTypeDisplayName,
  getFuelTypeDisplayName,
  ASHRAE_90_1_BOILER_MINIMUMS,
  AHRI_STANDARD_CONDITIONS_BOILER,
  CONDENSING_THRESHOLD_TEMP,
} from '@/lib/boiler-selection-calculations';

interface BoilerRequirementsPanelProps {
  requirements: BoilerRequirements;
  onRequirementsChange: (requirements: BoilerRequirements) => void;
  onImportFromPlant?: () => void;
  hasPlantData?: boolean;
  plantName?: string;
}

const BOILER_TYPES: BoilerType[] = [
  'condensing-gas',
  'non-condensing-gas',
  'oil-fired',
  'electric',
  'steam',
];

const FUEL_TYPES: FuelType[] = [
  'natural-gas',
  'propane',
  'fuel-oil',
  'electric',
];

export function BoilerRequirementsPanel({
  requirements,
  onRequirementsChange,
  onImportFromPlant,
  hasPlantData,
  plantName,
}: BoilerRequirementsPanelProps) {
  const baseline = requirements.boilerType 
    ? ASHRAE_90_1_BOILER_MINIMUMS[requirements.boilerType]
    : null;

  const capacityMbh = requirements.requiredCapacityBtuh / 1000;
  
  // Calculate delta T
  const deltaT = (requirements.hwSupplyTempF || 180) - (requirements.hwReturnTempF || 160);
  
  // Check if in condensing mode (return temp below threshold)
  const isCondensingMode = requirements.boilerType === 'condensing-gas' && 
    (requirements.hwReturnTempF || 160) < CONDENSING_THRESHOLD_TEMP;
  
  // Get standard conditions for reference
  const standardConditions = requirements.boilerType === 'condensing-gas' 
    ? AHRI_STANDARD_CONDITIONS_BOILER.condensing 
    : AHRI_STANDARD_CONDITIONS_BOILER.nonCondensing;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <CardTitle className="text-lg">Boiler Requirements</CardTitle>
          </div>
          {hasPlantData && onImportFromPlant && (
            <Button variant="outline" size="sm" onClick={onImportFromPlant}>
              <Download className="h-4 w-4 mr-2" />
              Import from Plant
            </Button>
          )}
        </div>
        {plantName && (
          <p className="text-sm text-muted-foreground mt-1">
            Linked to: {plantName}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Capacity */}
        <div className="space-y-2">
          <Label htmlFor="capacity">Required Capacity</Label>
          <div className="flex gap-2">
            <Input
              id="capacity"
              type="number"
              value={capacityMbh || ''}
              onChange={(e) =>
                onRequirementsChange({
                  ...requirements,
                  requiredCapacityBtuh: parseFloat(e.target.value) * 1000 || 0,
                })
              }
              placeholder="Enter capacity"
              className="flex-1"
            />
            <span className="flex items-center text-sm text-muted-foreground px-2">MBH</span>
          </div>
        </div>

        <Separator />

        {/* Boiler Type */}
        <div className="space-y-2">
          <Label>Boiler Type</Label>
          <Select
            value={requirements.boilerType || ''}
            onValueChange={(v) =>
              onRequirementsChange({
                ...requirements,
                boilerType: v as BoilerType,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select boiler type" />
            </SelectTrigger>
            <SelectContent>
              {BOILER_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {getBoilerTypeDisplayName(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fuel Type */}
        <div className="space-y-2">
          <Label>Fuel Type</Label>
          <Select
            value={requirements.fuelType || ''}
            onValueChange={(v) =>
              onRequirementsChange({
                ...requirements,
                fuelType: v as FuelType,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select fuel type" />
            </SelectTrigger>
            <SelectContent>
              {FUEL_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {getFuelTypeDisplayName(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Temperature Inputs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Temperature Inputs</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[250px]">
                <p className="text-xs">
                  Efficiency is adjusted based on deviation from AHRI 1500 standard conditions 
                  ({standardConditions.hwSupplyTemp}°F supply / {standardConditions.hwReturnTemp}°F return).
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hw-supply" className="text-xs text-muted-foreground">HW Supply Temp</Label>
              <div className="flex gap-1">
                <Input
                  id="hw-supply"
                  type="number"
                  value={requirements.hwSupplyTempF || ''}
                  onChange={(e) =>
                    onRequirementsChange({
                      ...requirements,
                      hwSupplyTempF: parseFloat(e.target.value) || undefined,
                    })
                  }
                  placeholder="180"
                />
                <span className="flex items-center text-sm text-muted-foreground px-1">°F</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hw-return" className="text-xs text-muted-foreground">HW Return Temp</Label>
              <div className="flex gap-1">
                <Input
                  id="hw-return"
                  type="number"
                  value={requirements.hwReturnTempF || ''}
                  onChange={(e) =>
                    onRequirementsChange({
                      ...requirements,
                      hwReturnTempF: parseFloat(e.target.value) || undefined,
                    })
                  }
                  placeholder="160"
                />
                <span className="flex items-center text-sm text-muted-foreground px-1">°F</span>
              </div>
            </div>
          </div>
          
          {/* Delta T Display */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">ΔT:</span>
            <span className="font-medium">{deltaT}°F</span>
          </div>
          
          {/* Combustion Air Temperature */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="combustion-air" className="text-xs text-muted-foreground">Combustion Air Temp (optional)</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Entering air temperature affects efficiency. Standard: 60°F.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex gap-1">
              <Input
                id="combustion-air"
                type="number"
                value={requirements.combustionAirTempF || ''}
                onChange={(e) =>
                  onRequirementsChange({
                    ...requirements,
                    combustionAirTempF: parseFloat(e.target.value) || undefined,
                  })
                }
                placeholder="60"
              />
              <span className="flex items-center text-sm text-muted-foreground px-1">°F</span>
            </div>
          </div>
          
          {/* Condensing Mode Indicator */}
          {requirements.boilerType === 'condensing-gas' && (
            <div className={`flex items-center gap-2 p-2 rounded-md ${isCondensingMode ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-muted/50'}`}>
              <Droplets className={`h-4 w-4 ${isCondensingMode ? 'text-blue-500' : 'text-muted-foreground'}`} />
              <div className="flex-1">
                <p className={`text-xs font-medium ${isCondensingMode ? 'text-blue-700 dark:text-blue-400' : 'text-muted-foreground'}`}>
                  {isCondensingMode ? 'Condensing Mode Active' : 'Non-Condensing Operation'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isCondensingMode 
                    ? 'Return temp below 130°F enables flue gas condensation for maximum efficiency'
                    : 'Lower return temp below 130°F for optimal condensing efficiency'}
                </p>
              </div>
              {isCondensingMode && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  +Efficiency
                </Badge>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Efficiency Targets */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="min-afue">Minimum AFUE (%)</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Annual Fuel Utilization Efficiency</p>
                {baseline && (
                  <p className="text-xs mt-1">
                    ASHRAE 90.1 min: {baseline.afue}%
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="min-afue"
            type="number"
            value={requirements.minAfue || ''}
            onChange={(e) =>
              onRequirementsChange({
                ...requirements,
                minAfue: parseFloat(e.target.value) || undefined,
              })
            }
            placeholder={baseline ? `${baseline.afue} (ASHRAE min)` : 'Enter minimum'}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="min-turndown">Minimum Turndown Ratio</Label>
          <Select
            value={requirements.minTurndown?.toString() || ''}
            onValueChange={(v) =>
              onRequirementsChange({
                ...requirements,
                minTurndown: parseInt(v) || undefined,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select turndown" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">4:1</SelectItem>
              <SelectItem value="5">5:1</SelectItem>
              <SelectItem value="8">8:1</SelectItem>
              <SelectItem value="10">10:1</SelectItem>
              <SelectItem value="15">15:1</SelectItem>
              <SelectItem value="20">20:1</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Compliance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="asme">ASME Required</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>ASME Boiler and Pressure Vessel Code certification</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Switch
            id="asme"
            checked={requirements.asmeRequired || false}
            onCheckedChange={(checked) =>
              onRequirementsChange({
                ...requirements,
                asmeRequired: checked,
              })
            }
          />
        </div>

        {/* Manufacturer Preference */}
        <div className="space-y-2">
          <Label>Manufacturer Preference</Label>
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
              <SelectValue placeholder="Any manufacturer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Manufacturer</SelectItem>
              <SelectItem value="Lochinvar">Lochinvar</SelectItem>
              <SelectItem value="Weil-McLain">Weil-McLain</SelectItem>
              <SelectItem value="Cleaver-Brooks">Cleaver-Brooks</SelectItem>
              <SelectItem value="Fulton">Fulton</SelectItem>
              <SelectItem value="Chromalox">Chromalox</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}