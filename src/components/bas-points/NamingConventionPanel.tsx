import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Tag, 
  Building2,
  Globe,
  Code,
} from 'lucide-react';
import { 
  NamingConvention, 
  NamingConfig,
  NAMING_CONVENTIONS,
  SAUDI_CITY_CODES,
  MODON_INDUSTRIAL_CITIES,
} from '@/lib/bas-naming-conventions';
import { useTranslation } from 'react-i18next';

interface NamingConventionPanelProps {
  config: NamingConfig;
  onConfigChange: (config: Partial<NamingConfig>) => void;
}

export function NamingConventionPanel({ config, onConfigChange }: NamingConventionPanelProps) {
  const { t } = useTranslation();

  const allCityCodes = { ...SAUDI_CITY_CODES, ...MODON_INDUSTRIAL_CITIES };

  return (
    <div className="space-y-4">
      {/* Convention Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Tag className="h-4 w-4" />
            {t('Naming Convention', 'اتفاقية التسمية')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={config.convention}
            onValueChange={(value) => onConfigChange({ convention: value as NamingConvention })}
            className="space-y-3"
          >
            {NAMING_CONVENTIONS.map((conv) => (
              <div
                key={conv.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  config.convention === conv.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onConfigChange({ convention: conv.id })}
              >
                <RadioGroupItem value={conv.id} id={conv.id} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Label htmlFor={conv.id} className="font-medium cursor-pointer">
                      {conv.name}
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      {conv.nameAr}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{conv.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Pattern:</span>
                    <code className="text-xs bg-muted px-2 py-0.5 rounded">{conv.pattern}</code>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">Example:</span>
                    <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{conv.example}</code>
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Configuration Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {t('Location Configuration', 'تكوين الموقع')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* City Code */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('City/Site Code', 'رمز المدينة/الموقع')}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={config.cityCode || ''}
                onChange={(e) => onConfigChange({ cityCode: e.target.value })}
              >
                <option value="">{t('Select City...', 'اختر المدينة...')}</option>
                <optgroup label="Saudi Cities">
                  {Object.entries(SAUDI_CITY_CODES).map(([city, code]) => (
                    <option key={code} value={code}>{city} ({code})</option>
                  ))}
                </optgroup>
                <optgroup label="MODON Industrial Cities">
                  {Object.entries(MODON_INDUSTRIAL_CITIES).map(([city, code]) => (
                    <option key={code} value={code}>{city} ({code})</option>
                  ))}
                </optgroup>
              </select>
              <Input
                placeholder={t('Or enter custom code', 'أو أدخل رمزاً مخصصاً')}
                value={config.sitePrefix || ''}
                onChange={(e) => onConfigChange({ sitePrefix: e.target.value.toUpperCase() })}
                maxLength={6}
              />
            </div>
          </div>

          {/* Building Code */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {t('Building Code', 'رمز المبنى')}
            </Label>
            <Input
              placeholder="B01"
              value={config.buildingCode || ''}
              onChange={(e) => onConfigChange({ buildingCode: e.target.value.toUpperCase() })}
              maxLength={6}
            />
          </div>

          {/* Custom Pattern (if custom convention selected) */}
          {config.convention === 'custom' && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                {t('Custom Pattern', 'نمط مخصص')}
              </Label>
              <Input
                placeholder="{CITY}-{BLDG}-{FLR}-{TAG}-{PT}"
                value={config.customPattern || ''}
                onChange={(e) => onConfigChange({ customPattern: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                {t('Available variables: {CITY}, {SITE}, {BLDG}, {FLR}, {ZONE}, {TAG}, {PT}', 
                   'المتغيرات المتاحة: {CITY}, {SITE}, {BLDG}, {FLR}, {ZONE}, {TAG}, {PT}')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {t('Preview', 'معاينة')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-muted rounded-md">
              <span className="text-sm text-muted-foreground">AHU Supply Air Temp:</span>
              <code className="text-sm font-mono">
                {generatePreview(config, 'AHU01', 'SA_TEMP')}
              </code>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted rounded-md">
              <span className="text-sm text-muted-foreground">Chiller Status:</span>
              <code className="text-sm font-mono">
                {generatePreview(config, 'CH01', 'CH_SS')}
              </code>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted rounded-md">
              <span className="text-sm text-muted-foreground">FCU Room Temp:</span>
              <code className="text-sm font-mono">
                {generatePreview(config, 'FCU01', 'ROOM_TEMP')}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function generatePreview(config: NamingConfig, tag: string, pointId: string): string {
  const site = config.sitePrefix || config.cityCode || 'RYD';
  const building = config.buildingCode || 'B01';
  
  switch (config.convention) {
    case 'saudi_modon':
      return `${site}-${building}-01-Z01-${tag}-${pointId}`;
    case 'ashrae36':
      return `${site}.${building}.HVAC.${tag}.${pointId}`;
    case 'haystack':
      return `${site.toLowerCase()}-${tag.toLowerCase()}-${pointId.toLowerCase().replace(/_/g, '-')}`;
    case 'custom':
      if (config.customPattern) {
        return config.customPattern
          .replace('{CITY}', site)
          .replace('{SITE}', site)
          .replace('{BLDG}', building)
          .replace('{FLR}', '01')
          .replace('{ZONE}', 'Z01')
          .replace('{TAG}', tag)
          .replace('{PT}', pointId);
      }
      return `${site}-${building}-${tag}-${pointId}`;
    default:
      return `${site}-${tag}-${pointId}`;
  }
}
