import { useState, useEffect } from 'react';

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface UsePrayerTimesResult {
  prayerTimes: PrayerTimes | null;
  loading: boolean;
  error: string | null;
  nextPrayer: { name: string; time: string } | null;
}

// Saudi Arabia cities with coordinates
export const SAUDI_CITIES = {
  riyadh: { name: 'Riyadh', nameAr: 'الرياض', lat: 24.7136, lng: 46.6753 },
  jeddah: { name: 'Jeddah', nameAr: 'جدة', lat: 21.4858, lng: 39.1925 },
  makkah: { name: 'Makkah', nameAr: 'مكة المكرمة', lat: 21.3891, lng: 39.8579 },
  madinah: { name: 'Madinah', nameAr: 'المدينة المنورة', lat: 24.5247, lng: 39.5692 },
  dammam: { name: 'Dammam', nameAr: 'الدمام', lat: 26.4207, lng: 50.0888 },
  khobar: { name: 'Khobar', nameAr: 'الخبر', lat: 26.2172, lng: 50.1971 },
  abha: { name: 'Abha', nameAr: 'أبها', lat: 18.2164, lng: 42.5053 },
  tabuk: { name: 'Tabuk', nameAr: 'تبوك', lat: 28.3838, lng: 36.5550 },
};

export type SaudiCity = keyof typeof SAUDI_CITIES;

export function usePrayerTimes(city: SaudiCity = 'riyadh', date?: Date): UsePrayerTimesResult {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string } | null>(null);

  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        setLoading(true);
        const cityData = SAUDI_CITIES[city];
        const targetDate = date || new Date();
        const dateStr = `${targetDate.getDate()}-${targetDate.getMonth() + 1}-${targetDate.getFullYear()}`;
        
        // Using Aladhan API (free, no API key required)
        const response = await fetch(
          `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${cityData.lat}&longitude=${cityData.lng}&method=4`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch prayer times');
        }
        
        const data = await response.json();
        const timings = data.data.timings;
        
        const times: PrayerTimes = {
          Fajr: timings.Fajr,
          Sunrise: timings.Sunrise,
          Dhuhr: timings.Dhuhr,
          Asr: timings.Asr,
          Maghrib: timings.Maghrib,
          Isha: timings.Isha,
        };
        
        setPrayerTimes(times);
        
        // Calculate next prayer
        const now = new Date();
        const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
        
        for (const prayer of prayers) {
          const [hours, minutes] = times[prayer].split(':').map(Number);
          const prayerTime = new Date(now);
          prayerTime.setHours(hours, minutes, 0, 0);
          
          if (prayerTime > now) {
            setNextPrayer({ name: prayer, time: times[prayer] });
            break;
          }
        }
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch prayer times');
      } finally {
        setLoading(false);
      }
    };

    fetchPrayerTimes();
  }, [city, date]);

  return { prayerTimes, loading, error, nextPrayer };
}

// Convert 24h time to 12h format
export function formatPrayerTime(time: string, locale: 'en' | 'ar' = 'en'): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? (locale === 'ar' ? 'م' : 'PM') : (locale === 'ar' ? 'ص' : 'AM');
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}
