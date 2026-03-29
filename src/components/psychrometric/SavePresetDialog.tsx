import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Snowflake, 
  Flame, 
  Wind, 
  Waves, 
  Droplets, 
  Zap, 
  Settings2,
  Save
} from 'lucide-react';
import { 
  useCreatePsychrometricPreset, 
  PresetCategory, 
  PresetAirState 
} from '@/hooks/usePsychrometricPresets';

const CATEGORY_OPTIONS: { value: PresetCategory; label: string; icon: React.ElementType }[] = [
  { value: 'cooling', label: 'Cooling', icon: Snowflake },
  { value: 'heating', label: 'Heating', icon: Flame },
  { value: 'mixing', label: 'Mixing', icon: Wind },
  { value: 'humidification', label: 'Humidification', icon: Waves },
  { value: 'dehumidification', label: 'Dehumidification', icon: Droplets },
  { value: 'custom', label: 'Custom', icon: Settings2 },
];

const ICON_OPTIONS = [
  { value: 'Snowflake', icon: Snowflake },
  { value: 'Flame', icon: Flame },
  { value: 'Wind', icon: Wind },
  { value: 'Waves', icon: Waves },
  { value: 'Droplets', icon: Droplets },
  { value: 'Zap', icon: Zap },
  { value: 'Settings2', icon: Settings2 },
];

interface SavePresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  airStates: PresetAirState[];
  altitudeFt?: number;
  climateZone?: string;
}

export function SavePresetDialog({
  open,
  onOpenChange,
  airStates,
  altitudeFt,
  climateZone,
}: SavePresetDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PresetCategory>('custom');
  const [iconName, setIconName] = useState('Settings2');
  const [isPublic, setIsPublic] = useState(true);
  const [includeAltitude, setIncludeAltitude] = useState(false);

  const createPreset = useCreatePsychrometricPreset();

  const handleSave = async () => {
    if (!name.trim() || airStates.length === 0) return;

    await createPreset.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      icon_name: iconName,
      air_states: airStates,
      altitude_ft: includeAltitude ? altitudeFt : undefined,
      climate_zone: includeAltitude ? climateZone : undefined,
      is_public: isPublic,
    });

    // Reset form
    setName('');
    setDescription('');
    setCategory('custom');
    setIconName('Settings2');
    setIsPublic(true);
    setIncludeAltitude(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save as Preset
          </DialogTitle>
          <DialogDescription>
            Save this configuration as a reusable preset for future projects.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="preset-name">Preset Name *</Label>
            <Input
              id="preset-name"
              placeholder="e.g., Desert Cooling Coil"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preset-description">Description</Label>
            <Textarea
              id="preset-description"
              placeholder="Describe when to use this preset..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as PresetCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(({ value, label, icon: Icon }) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex gap-1 flex-wrap">
                {ICON_OPTIONS.map(({ value, icon: Icon }) => (
                  <Button
                    key={value}
                    type="button"
                    size="icon"
                    variant={iconName === value ? 'default' : 'outline'}
                    className="h-8 w-8"
                    onClick={() => setIconName(value)}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is-public">Share with Organization</Label>
                <p className="text-xs text-muted-foreground">
                  Others in your organization can use this preset
                </p>
              </div>
              <Switch
                id="is-public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>

            {altitudeFt !== undefined && (
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="include-altitude">Include Altitude Settings</Label>
                  <p className="text-xs text-muted-foreground">
                    {altitudeFt} ft {climateZone && `• ${climateZone}`}
                  </p>
                </div>
                <Switch
                  id="include-altitude"
                  checked={includeAltitude}
                  onCheckedChange={setIncludeAltitude}
                />
              </div>
            )}
          </div>

          <div className="rounded-lg border p-3 bg-muted/50">
            <Label className="text-xs text-muted-foreground">State Points Included</Label>
            <div className="flex flex-wrap gap-1 mt-2">
              {airStates.map((state, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {state.name}: {state.dryBulb}°C
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!name.trim() || airStates.length === 0 || createPreset.isPending}
          >
            {createPreset.isPending ? 'Saving...' : 'Save Preset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
