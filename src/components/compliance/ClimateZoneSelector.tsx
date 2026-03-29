import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Thermometer, Droplets } from 'lucide-react';
import { SAUDI_CITIES, SAUDI_CLIMATE_ZONES, type ClimateZone, type SaudiCity } from '@/lib/ashrae-90-1-data';

interface ClimateZoneSelectorProps {
  selectedCityId: string;
  onCityChange: (cityId: string) => void;
  climateZone?: ClimateZone;
  city?: SaudiCity;
}

export function ClimateZoneSelector({
  selectedCityId,
  onCityChange,
  climateZone,
  city,
}: ClimateZoneSelectorProps) {
  const getClimateTypeColor = (type: string) => {
    switch (type) {
      case 'hot_humid': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'hot_dry': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'moderate': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Project Location
        </CardTitle>
        <CardDescription>
          Select project city to determine applicable climate zone requirements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Select value={selectedCityId} onValueChange={onCityChange}>
            <SelectTrigger id="city">
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              {SAUDI_CITIES.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nameEn} ({c.nameAr})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {climateZone && city && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Climate Zone</span>
              <Badge variant="outline" className="font-mono">
                {climateZone.ashraeZone}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Zone Type</span>
              <Badge className={getClimateTypeColor(climateZone.type)}>
                {climateZone.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Thermometer className="h-3 w-3" />
                Cooling Degree Days
              </span>
              <span className="font-medium">{climateZone.coolingDegreeDays.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Droplets className="h-3 w-3" />
                Heating Degree Days
              </span>
              <span className="font-medium">{climateZone.heatingDegreeDays.toLocaleString()}</span>
            </div>

            <p className="text-xs text-muted-foreground pt-2 border-t">
              {climateZone.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
