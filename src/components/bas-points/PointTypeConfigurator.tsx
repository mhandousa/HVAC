import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings2, 
  CheckSquare, 
  Square, 
  RotateCcw,
  Info,
} from 'lucide-react';
import { getPointTemplatesByEquipmentType, PointTemplate } from '@/lib/bas-point-templates';
import { useTranslation } from 'react-i18next';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PointTypeConfiguratorProps {
  uniqueEquipmentTypes: string[];
  isPointEnabled: (equipmentType: string, pointId: string) => boolean;
  togglePointType: (equipmentType: string, pointId: string) => void;
  enableAllPoints: (equipmentType: string) => void;
  disableAllPoints: (equipmentType: string) => void;
  resetToDefaults: (equipmentType: string) => void;
}

export function PointTypeConfigurator({
  uniqueEquipmentTypes,
  isPointEnabled,
  togglePointType,
  enableAllPoints,
  disableAllPoints,
  resetToDefaults,
}: PointTypeConfiguratorProps) {
  const { t } = useTranslation();

  const getPointTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'AI': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'AO': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'BI': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'BO': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'AV': return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
      case 'BV': return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      case 'MSV': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (uniqueEquipmentTypes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Settings2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">
            {t('Add equipment to configure point types', 'أضف معدات لتكوين أنواع النقاط')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          {t('Configure Point Types', 'تكوين أنواع النقاط')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={uniqueEquipmentTypes[0]} className="w-full">
          <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {uniqueEquipmentTypes.map((type) => (
              <TabsTrigger key={type} value={type} className="text-xs">
                {type}
              </TabsTrigger>
            ))}
          </TabsList>

          {uniqueEquipmentTypes.map((equipmentType) => {
            const templates = getPointTemplatesByEquipmentType(equipmentType);
            const enabledCount = templates.filter(t => isPointEnabled(equipmentType, t.id)).length;

            return (
              <TabsContent key={equipmentType} value={equipmentType} className="mt-4">
                {/* Actions */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {enabledCount}/{templates.length} {t('points', 'نقطة')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => enableAllPoints(equipmentType)}
                    >
                      <CheckSquare className="h-4 w-4 mr-1" />
                      {t('All', 'الكل')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => disableAllPoints(equipmentType)}
                    >
                      <Square className="h-4 w-4 mr-1" />
                      {t('None', 'لا شيء')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resetToDefaults(equipmentType)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      {t('Defaults', 'افتراضي')}
                    </Button>
                  </div>
                </div>

                {/* Point List */}
                <ScrollArea className="h-[350px]">
                  <div className="space-y-1">
                    {templates.map((template) => (
                      <PointTypeRow
                        key={template.id}
                        template={template}
                        isEnabled={isPointEnabled(equipmentType, template.id)}
                        onToggle={() => togglePointType(equipmentType, template.id)}
                        getPointTypeBadgeColor={getPointTypeBadgeColor}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface PointTypeRowProps {
  template: PointTemplate;
  isEnabled: boolean;
  onToggle: () => void;
  getPointTypeBadgeColor: (type: string) => string;
}

function PointTypeRow({ template, isEnabled, onToggle, getPointTypeBadgeColor }: PointTypeRowProps) {
  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
        isEnabled ? 'bg-muted/30' : ''
      }`}
      onClick={onToggle}
    >
      <Checkbox checked={isEnabled} />
      <Badge variant="outline" className={`text-xs font-mono ${getPointTypeBadgeColor(template.type)}`}>
        {template.type}
      </Badge>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{template.id}</span>
          <span className="text-sm text-muted-foreground">- {template.name}</span>
          {template.unit && (
            <Badge variant="outline" className="text-xs">
              {template.unit}
            </Badge>
          )}
        </div>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-[300px]">
            <div className="space-y-1">
              <p className="font-medium">{template.name}</p>
              <p className="text-xs text-muted-foreground">{template.description}</p>
              <p className="text-xs text-muted-foreground" dir="rtl">{template.nameAr}</p>
              {template.range && (
                <p className="text-xs">
                  Range: {template.range.min} - {template.range.max} {template.unit}
                </p>
              )}
              {template.alarmLimits && (
                <p className="text-xs">
                  Alarms: {template.alarmLimits.low !== undefined && `Low: ${template.alarmLimits.low}`}
                  {template.alarmLimits.high !== undefined && ` High: ${template.alarmLimits.high}`}
                </p>
              )}
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-xs">{template.bacnetObjectType}</Badge>
                <Badge variant="outline" className="text-xs">{template.protocol}</Badge>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
