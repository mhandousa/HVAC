import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Wand2, RotateCcw, Info } from 'lucide-react';
import { 
  FrequencyBandRequirements, 
  FREQUENCY_BANDS, 
  REQUIREMENT_PRESETS,
  ncGapToFrequencyRequirements,
  getDefaultRequirements,
} from '@/lib/silencer-frequency-matching';

interface FrequencyBandRequirementsInputProps {
  requirements: FrequencyBandRequirements;
  onRequirementsChange: (requirements: FrequencyBandRequirements) => void;
  currentNC?: number;
  targetNC?: number;
}

const BAND_LABELS: Record<string, string> = {
  '63Hz': '63',
  '125Hz': '125',
  '250Hz': '250',
  '500Hz': '500',
  '1kHz': '1k',
  '2kHz': '2k',
  '4kHz': '4k',
  '8kHz': '8k',
};

export function FrequencyBandRequirementsInput({
  requirements,
  onRequirementsChange,
  currentNC,
  targetNC,
}: FrequencyBandRequirementsInputProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  
  const handleBandChange = (band: keyof FrequencyBandRequirements, value: string) => {
    const numValue = Math.max(0, Math.min(50, parseInt(value) || 0));
    onRequirementsChange({
      ...requirements,
      [band]: numValue,
    });
    setSelectedPreset(''); // Clear preset when manually editing
  };
  
  const handlePresetSelect = (presetKey: string) => {
    if (presetKey === 'from-nc' && currentNC && targetNC) {
      const ncRequirements = ncGapToFrequencyRequirements(currentNC, targetNC);
      onRequirementsChange(ncRequirements);
    } else if (REQUIREMENT_PRESETS[presetKey]) {
      onRequirementsChange(REQUIREMENT_PRESETS[presetKey].requirements);
    }
    setSelectedPreset(presetKey);
  };
  
  const handleReset = () => {
    onRequirementsChange({
      '63Hz': 0,
      '125Hz': 0,
      '250Hz': 0,
      '500Hz': 0,
      '1kHz': 0,
      '2kHz': 0,
      '4kHz': 0,
      '8kHz': 0,
    });
    setSelectedPreset('');
  };
  
  // Calculate max value for bar chart scaling
  const maxValue = Math.max(...Object.values(requirements), 10);
  
  // Calculate total attenuation (average)
  const totalAttenuation = Math.round(
    Object.values(requirements).reduce((a, b) => a + b, 0) / 8
  );
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              Required Attenuation by Frequency Band
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Specify the required insertion loss at each octave band frequency.
                  Higher values indicate more attenuation needed.</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <CardDescription>
              Avg: {totalAttenuation} dB across all bands
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visual Bar Chart */}
        <div className="grid grid-cols-8 gap-1 h-24 items-end bg-muted/30 rounded-lg p-2">
          {FREQUENCY_BANDS.map(band => (
            <div key={band} className="flex flex-col items-center gap-1">
              <div 
                className="w-full bg-primary/80 rounded-t transition-all"
                style={{ 
                  height: `${Math.max(4, (requirements[band] / maxValue) * 100)}%`,
                  minHeight: requirements[band] > 0 ? '4px' : '0px',
                }}
              />
              <span className="text-[10px] text-muted-foreground">{BAND_LABELS[band]}</span>
            </div>
          ))}
        </div>
        
        {/* Numeric Inputs */}
        <div className="grid grid-cols-8 gap-1">
          {FREQUENCY_BANDS.map(band => (
            <div key={band} className="space-y-1">
              <Label className="text-[10px] text-muted-foreground block text-center">
                {BAND_LABELS[band]}Hz
              </Label>
              <Input
                type="number"
                min={0}
                max={50}
                value={requirements[band]}
                onChange={(e) => handleBandChange(band, e.target.value)}
                className="h-8 text-center text-xs px-1"
              />
            </div>
          ))}
        </div>
        
        {/* Presets */}
        <div className="flex flex-wrap gap-2 items-center pt-2 border-t">
          <Wand2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Presets:</span>
          
          <Select value={selectedPreset} onValueChange={handlePresetSelect}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="Select preset..." />
            </SelectTrigger>
            <SelectContent>
              {currentNC && targetNC && (
                <SelectItem value="from-nc">
                  From NC Gap (NC-{currentNC} → NC-{targetNC})
                </SelectItem>
              )}
              {Object.entries(REQUIREMENT_PRESETS).map(([key, preset]) => (
                <SelectItem key={key} value={key}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedPreset && REQUIREMENT_PRESETS[selectedPreset] && (
            <span className="text-xs text-muted-foreground">
              {REQUIREMENT_PRESETS[selectedPreset].description}
            </span>
          )}
        </div>
        
        {/* Quick preset badges */}
        <div className="flex flex-wrap gap-1">
          {Object.entries(REQUIREMENT_PRESETS).slice(0, 4).map(([key, preset]) => (
            <Badge
              key={key}
              variant={selectedPreset === key ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => handlePresetSelect(key)}
            >
              {preset.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
