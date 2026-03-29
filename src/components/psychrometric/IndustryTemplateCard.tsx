import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { 
  Building2, 
  HeartPulse, 
  Hotel, 
  Store, 
  GraduationCap, 
  Factory, 
  Home, 
  Church,
  Building,
  Eye,
  Star,
  BookOpen,
} from 'lucide-react';
import {
  IndustryTemplate,
  CLIMATE_ZONE_LABELS,
  CLIMATE_ZONE_COLORS,
  BUILDING_TYPE_LABELS,
} from '@/lib/psychrometric-industry-templates';
import { TinyPsychrometricChart } from './TinyPsychrometricChart';

const BUILDING_ICONS: Record<string, React.ElementType> = {
  Building2,
  HeartPulse,
  Hotel,
  Store,
  GraduationCap,
  Factory,
  Home,
  Church,
  Building,
};

interface IndustryTemplateCardProps {
  template: IndustryTemplate;
  onLoad: () => void;
  onPreview: () => void;
  isRecommended?: boolean;
  compact?: boolean;
  showThumbnail?: boolean;
}

export function IndustryTemplateCard({
  template,
  onLoad,
  onPreview,
  isRecommended = false,
  compact = false,
  showThumbnail = true,
}: IndustryTemplateCardProps) {
  const IconComponent = BUILDING_ICONS[template.iconName] || Building2;
  const climateColorClass = CLIMATE_ZONE_COLORS[template.climateZone];

  // Convert template airStates to the format expected by TinyPsychrometricChart
  // Assume humidity is RH when humidityType is 'relative', otherwise approximate
  const chartAirStates = template.airStates.map((state) => ({
    name: state.name,
    tempC: state.dryBulb,
    rh: state.humidityType === 'relative' ? state.humidity : state.humidity, // TODO: convert other types
  }));

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex flex-col items-center justify-center h-24 w-28 p-2 gap-1 relative"
              onClick={onLoad}
            >
              {isRecommended && (
                <Star className="absolute top-1 right-1 h-3 w-3 text-amber-500 fill-amber-500" />
              )}
              {showThumbnail ? (
                <TinyPsychrometricChart
                  airStates={chartAirStates}
                  altitudeFt={template.altitudeFt}
                  width={56}
                  height={36}
                />
              ) : (
                <IconComponent className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-[9px] text-center leading-tight line-clamp-2">
                {template.name}
              </span>
              <Badge 
                variant="outline" 
                className={`text-[8px] px-1 py-0 h-4 ${climateColorClass}`}
              >
                {CLIMATE_ZONE_LABELS[template.climateZone]}
              </Badge>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <div className="font-medium">{template.name}</div>
              <p className="text-xs text-muted-foreground">{template.description}</p>
              <div className="text-xs">
                <span className="font-medium">States: </span>
                {template.airStates.map(s => s.name).join(' → ')}
              </div>
              <div className="flex gap-1 flex-wrap">
                {template.standards.map(std => (
                  <Badge key={std} variant="secondary" className="text-[10px]">
                    {std}
                  </Badge>
                ))}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className="p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-muted flex-shrink-0">
          <IconComponent className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium truncate">{template.name}</h4>
            {isRecommended && (
              <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Recommended
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {template.description}
          </p>
          
          {/* Badges Row */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <Badge 
              variant="outline" 
              className={`text-[10px] ${climateColorClass}`}
            >
              {CLIMATE_ZONE_LABELS[template.climateZone]}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {BUILDING_TYPE_LABELS[template.buildingType]}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {template.airStates.length} states
            </span>
          </div>
          
          {/* Standards */}
          <div className="flex items-center gap-1 mt-2">
            <BookOpen className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              {template.standards.slice(0, 2).join(', ')}
              {template.standards.length > 2 && ` +${template.standards.length - 2}`}
            </span>
          </div>
        </div>
        
        {/* Thumbnail Chart */}
        {showThumbnail && (
          <div className="flex-shrink-0 rounded overflow-hidden">
            <TinyPsychrometricChart
              airStates={chartAirStates}
              altitudeFt={template.altitudeFt}
              width={80}
              height={50}
            />
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          <Button size="sm" onClick={onLoad}>
            Load
          </Button>
          <Button size="sm" variant="outline" onClick={onPreview}>
            <Eye className="h-3 w-3 mr-1" />
            Preview
          </Button>
        </div>
      </div>
    </Card>
  );
}
