import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudSnow, 
  Wind, 
  Droplets, 
  Thermometer,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useWeatherAPI, WeatherData } from '@/hooks/useWeatherAPI';
import { useTranslation } from 'react-i18next';

interface LiveWeatherCardProps {
  city: string;
  compact?: boolean;
  showToggle?: boolean;
}

const getWeatherIcon = (condition: string) => {
  const conditionLower = condition.toLowerCase();
  if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
    return <CloudRain className="h-8 w-8 text-blue-500" />;
  }
  if (conditionLower.includes('snow')) {
    return <CloudSnow className="h-8 w-8 text-blue-200" />;
  }
  if (conditionLower.includes('cloud')) {
    return <Cloud className="h-8 w-8 text-gray-500" />;
  }
  return <Sun className="h-8 w-8 text-yellow-500" />;
};

export function LiveWeatherCard({ city, compact = false, showToggle = true }: LiveWeatherCardProps) {
  const { t } = useTranslation();
  const { weather, isLoading, error, useLiveData, toggleLiveData, refetch } = useWeatherAPI(city);

  if (isLoading) {
    return (
      <Card className={compact ? 'p-3' : ''}>
        <CardContent className={compact ? 'p-0' : 'pt-6'}>
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        {getWeatherIcon(weather.condition)}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">{Math.round(weather.temperatureC)}°C</span>
            <span className="text-muted-foreground text-sm">{weather.city}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Droplets className="h-3 w-3" />
              {weather.humidity}%
            </span>
            <span className="flex items-center gap-1">
              <Wind className="h-3 w-3" />
              {weather.windSpeedMs.toFixed(1)} m/s
            </span>
          </div>
        </div>
        <Badge variant={weather.isLive ? 'default' : 'secondary'} className="text-xs">
          {weather.isLive ? (
            <>
              <Wifi className="h-3 w-3 mr-1" />
              Live
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 mr-1" />
              Static
            </>
          )}
        </Badge>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Thermometer className="h-4 w-4" />
            {t('Outdoor Conditions')}
          </CardTitle>
          <div className="flex items-center gap-2">
            {showToggle && (
              <div className="flex items-center gap-2">
                <Switch
                  id="live-weather"
                  checked={useLiveData}
                  onCheckedChange={toggleLiveData}
                />
                <Label htmlFor="live-weather" className="text-xs">
                  {t('Live')}
                </Label>
              </div>
            )}
            {useLiveData && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          {getWeatherIcon(weather.condition)}
          <div>
            <div className="text-3xl font-bold">{Math.round(weather.temperatureC)}°C</div>
            <div className="text-sm text-muted-foreground">
              {weather.condition} • {weather.city}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
              <Droplets className="h-3 w-3" />
              {t('Humidity')}
            </div>
            <div className="font-semibold">{weather.humidity}%</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
              <Wind className="h-3 w-3" />
              {t('Wind')}
            </div>
            <div className="font-semibold">{weather.windSpeedMs.toFixed(1)} m/s</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground text-xs mb-1">
              {t('Pressure')}
            </div>
            <div className="font-semibold">{Math.round(weather.pressureHpa)} hPa</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <Badge variant={weather.isLive ? 'default' : 'secondary'}>
            {weather.isLive ? (
              <>
                <Wifi className="h-3 w-3 mr-1" />
                {weather.isCached ? 'Cached' : 'Live'}
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 mr-1" />
                Static Data
              </>
            )}
          </Badge>
          {weather.isLive && (
            <span>
              Updated: {new Date(weather.fetchedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        {error && (
          <div className="text-xs text-destructive mt-2">
            {t('Weather API unavailable, using static data')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
