import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, MapPin, Moon, Sun, Sunrise, Sunset } from 'lucide-react';
import { usePrayerTimes, SAUDI_CITIES, formatPrayerTime, type SaudiCity } from '@/hooks/usePrayerTimes';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface PrayerTimeSchedulerProps {
  onPrayerTimeSelect?: (prayer: string, time: string) => void;
  showCitySelector?: boolean;
}

const PRAYER_ICONS = {
  Fajr: Sunrise,
  Sunrise: Sun,
  Dhuhr: Sun,
  Asr: Sun,
  Maghrib: Sunset,
  Isha: Moon,
};

const PRAYER_NAMES: Record<string, { en: string; ar: string }> = {
  Fajr: { en: 'Fajr', ar: 'الفجر' },
  Sunrise: { en: 'Sunrise', ar: 'الشروق' },
  Dhuhr: { en: 'Dhuhr', ar: 'الظهر' },
  Asr: { en: 'Asr', ar: 'العصر' },
  Maghrib: { en: 'Maghrib', ar: 'المغرب' },
  Isha: { en: 'Isha', ar: 'العشاء' },
};

export function PrayerTimeScheduler({ onPrayerTimeSelect, showCitySelector = true }: PrayerTimeSchedulerProps) {
  const { t } = useTranslation();
  const { language, isRTL } = useLanguage();
  const [city, setCity] = useState<SaudiCity>('riyadh');
  const { prayerTimes, loading, error, nextPrayer } = usePrayerTimes(city);

  const renderPrayerTime = (prayer: keyof typeof PRAYER_ICONS, time: string) => {
    const Icon = PRAYER_ICONS[prayer];
    const isNext = nextPrayer?.name === prayer;
    const prayerName = PRAYER_NAMES[prayer];
    
    return (
      <div
        key={prayer}
        onClick={() => onPrayerTimeSelect?.(prayer, time)}
        className={cn(
          'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors',
          isNext 
            ? 'bg-primary/10 border border-primary/30' 
            : 'hover:bg-muted',
          isRTL && 'flex-row-reverse'
        )}
      >
        <div className={cn('flex items-center gap-3', isRTL && 'flex-row-reverse')}>
          <Icon className={cn('h-5 w-5', isNext ? 'text-primary' : 'text-muted-foreground')} />
          <span className={cn('font-medium', isNext && 'text-primary')}>
            {language === 'ar' ? prayerName.ar : prayerName.en}
          </span>
          {isNext && (
            <Badge variant="secondary" className="text-xs">
              {language === 'ar' ? 'القادمة' : 'Next'}
            </Badge>
          )}
        </div>
        <span className={cn('font-mono', isNext ? 'text-primary font-semibold' : 'text-muted-foreground')}>
          {formatPrayerTime(time, language)}
        </span>
      </div>
    );
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className={cn('pb-3', isRTL && 'text-right')}>
        <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
          <CardTitle className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
            <Clock className="h-5 w-5 text-primary" />
            {t('dispatch.prayerTimes')}
          </CardTitle>
          {showCitySelector && (
            <Select value={city} onValueChange={(v) => setCity(v as SaudiCity)}>
              <SelectTrigger className="w-[140px]">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SAUDI_CITIES).map(([key, cityData]) => (
                  <SelectItem key={key} value={key}>
                    {language === 'ar' ? cityData.nameAr : cityData.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {loading ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </>
        ) : prayerTimes ? (
          <>
            {renderPrayerTime('Fajr', prayerTimes.Fajr)}
            {renderPrayerTime('Dhuhr', prayerTimes.Dhuhr)}
            {renderPrayerTime('Asr', prayerTimes.Asr)}
            {renderPrayerTime('Maghrib', prayerTimes.Maghrib)}
            {renderPrayerTime('Isha', prayerTimes.Isha)}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
