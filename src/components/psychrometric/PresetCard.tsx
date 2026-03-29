import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Snowflake, 
  Flame, 
  Wind, 
  Waves, 
  Droplets, 
  Zap, 
  Settings2,
  Trash2,
  Edit,
  TrendingUp,
  Lock,
  Globe
} from 'lucide-react';
import { PsychrometricPreset, PresetAirState, PresetCategory } from '@/hooks/usePsychrometricPresets';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Snowflake,
  Flame,
  Wind,
  Waves,
  Droplets,
  Zap,
  Settings2,
};

const CATEGORY_COLORS: Record<PresetCategory, string> = {
  cooling: 'text-blue-500',
  heating: 'text-orange-500',
  mixing: 'text-cyan-500',
  humidification: 'text-teal-500',
  dehumidification: 'text-purple-500',
  custom: 'text-muted-foreground',
};

interface PresetCardProps {
  preset: PsychrometricPreset | {
    name: string;
    description: string | null;
    category: PresetCategory;
    icon_name: string;
    air_states: PresetAirState[];
    altitude_ft?: number | null;
  };
  onLoad: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isSystemPreset?: boolean;
  compact?: boolean;
}

export function PresetCard({
  preset,
  onLoad,
  onEdit,
  onDelete,
  isSystemPreset = false,
  compact = false,
}: PresetCardProps) {
  const IconComponent = CATEGORY_ICONS[preset.icon_name] || Settings2;
  const colorClass = CATEGORY_COLORS[preset.category];
  const fullPreset = preset as PsychrometricPreset;

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center justify-center h-16 w-20 p-2 gap-1"
            onClick={onLoad}
          >
            <IconComponent className={`h-5 w-5 ${colorClass}`} />
            <span className="text-[10px] text-center leading-tight line-clamp-2">
              {preset.name}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <div className="font-medium">{preset.name}</div>
            {preset.description && (
              <p className="text-xs text-muted-foreground">{preset.description}</p>
            )}
            <div className="text-xs">
              <span className="font-medium">States: </span>
              {preset.air_states.map(s => s.name).join(' → ')}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Card className="p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-muted ${colorClass}`}>
          <IconComponent className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium truncate">{preset.name}</h4>
            {isSystemPreset && (
              <Badge variant="secondary" className="text-[10px]">System</Badge>
            )}
            {!isSystemPreset && 'is_public' in preset && (
              preset.is_public ? (
                <Globe className="h-3 w-3 text-muted-foreground" />
              ) : (
                <Lock className="h-3 w-3 text-muted-foreground" />
              )
            )}
          </div>
          {preset.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {preset.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-[10px] capitalize">
              {preset.category}
            </Badge>
            <span>{preset.air_states.length} states</span>
            {!isSystemPreset && 'usage_count' in fullPreset && fullPreset.usage_count > 0 && (
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {fullPreset.usage_count}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Button size="sm" onClick={onLoad}>
            Load
          </Button>
          {!isSystemPreset && (
            <div className="flex gap-1">
              {onEdit && (
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
                  <Edit className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={onDelete}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
