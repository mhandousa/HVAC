import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Shield, Wrench } from 'lucide-react';
import { SupportEstimationSettings as SupportSettings } from '@/types/boq';

interface SupportEstimationSettingsProps {
  settings: SupportSettings;
  onChange: (settings: SupportSettings) => void;
}

const SEISMIC_ZONES = [
  { id: 'low', name: 'Low', description: 'SDS < 0.167' },
  { id: 'moderate', name: 'Moderate', description: 'SDS 0.167 - 0.50' },
  { id: 'high', name: 'High', description: 'SDS 0.50 - 1.0' },
  { id: 'very_high', name: 'Very High', description: 'SDS > 1.0' },
] as const;

const PRESSURE_CLASSES = [
  { id: '0.5_in_wg', name: '0.5" WG (125 Pa)' },
  { id: '1_in_wg', name: '1" WG (250 Pa)' },
  { id: '2_in_wg', name: '2" WG (500 Pa)' },
  { id: '3_in_wg', name: '3" WG (750 Pa)' },
  { id: '4_in_wg', name: '4" WG (1000 Pa)' },
  { id: '6_in_wg', name: '6" WG (1500 Pa)' },
  { id: '10_in_wg', name: '10" WG (2500 Pa)' },
] as const;

const INSTALLATION_TYPES = [
  { id: 'overhead', name: 'Overhead (Ceiling/Deck)' },
  { id: 'wall', name: 'Wall Mounted' },
  { id: 'floor', name: 'Floor Mounted' },
] as const;

export function SupportEstimationSettings({ settings, onChange }: SupportEstimationSettingsProps) {
  const updateSetting = <K extends keyof SupportSettings>(key: K, value: SupportSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          Support Estimation Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pressure Class */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Duct Pressure Class</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Higher pressure classes require closer hanger spacing per SMACNA guidelines.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select
            value={settings.pressureClass}
            onValueChange={(v) => updateSetting('pressureClass', v)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESSURE_CLASSES.map(pc => (
                <SelectItem key={pc.id} value={pc.id}>{pc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Installation Type */}
        <div className="space-y-1">
          <Label className="text-xs">Installation Type</Label>
          <Select
            value={settings.installationType}
            onValueChange={(v) => updateSetting('installationType', v as SupportSettings['installationType'])}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INSTALLATION_TYPES.map(it => (
                <SelectItem key={it.id} value={it.id}>{it.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Has Insulation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="has-insulation" className="text-xs">
              Duct Insulation
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Insulated ducts are heavier and require closer hanger spacing (10% reduction).</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Switch
            id="has-insulation"
            checked={settings.hasInsulation}
            onCheckedChange={(checked) => updateSetting('hasInsulation', checked)}
          />
        </div>

        {/* Seismic Bracing */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="seismic-bracing" className="text-xs font-medium">
                Seismic Bracing
              </Label>
            </div>
            <Switch
              id="seismic-bracing"
              checked={settings.includeSeismicBracing}
              onCheckedChange={(checked) => updateSetting('includeSeismicBracing', checked)}
            />
          </div>

          {settings.includeSeismicBracing && (
            <div className="space-y-1">
              <Label className="text-xs">Seismic Zone</Label>
              <Select
                value={settings.seismicZone}
                onValueChange={(v) => updateSetting('seismicZone', v as SupportSettings['seismicZone'])}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEISMIC_ZONES.map(sz => (
                    <SelectItem key={sz.id} value={sz.id}>
                      <span className="flex items-center gap-2">
                        {sz.name}
                        <span className="text-muted-foreground text-xs">({sz.description})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
