import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WeatherData {
  city: string;
  temperatureC: number;
  temperatureF: number;
  humidity: number;
  pressureHpa: number;
  windSpeedMs: number;
  condition: string;
  icon: string;
  fetchedAt: string;
  isCached: boolean;
  isLive: boolean;
}

export interface WeatherForecast {
  datetime: string;
  temperatureC: number;
  temperatureF: number;
  humidity: number;
  condition: string;
  icon: string;
}

// Saudi Arabia cities
export const SAUDI_CITIES = [
  { name: 'Riyadh', nameAr: 'الرياض', code: 'RYD' },
  { name: 'Jeddah', nameAr: 'جدة', code: 'JED' },
  { name: 'Dammam', nameAr: 'الدمام', code: 'DMM' },
  { name: 'Makkah', nameAr: 'مكة المكرمة', code: 'MKH' },
  { name: 'Madinah', nameAr: 'المدينة المنورة', code: 'MED' },
  { name: 'Khobar', nameAr: 'الخبر', code: 'KHB' },
  { name: 'Jubail', nameAr: 'الجبيل', code: 'JUB' },
  { name: 'Yanbu', nameAr: 'ينبع', code: 'YNB' },
  { name: 'Tabuk', nameAr: 'تبوك', code: 'TBK' },
  { name: 'Abha', nameAr: 'أبها', code: 'ABH' },
  { name: 'Khamis Mushait', nameAr: 'خميس مشيط', code: 'KMX' },
  { name: 'Najran', nameAr: 'نجران', code: 'EAM' },
  { name: 'Hail', nameAr: 'حائل', code: 'HAS' },
  { name: 'Taif', nameAr: 'الطائف', code: 'TIF' },
  { name: 'Buraidah', nameAr: 'بريدة', code: 'ELQ' },
  { name: 'Dhahran', nameAr: 'الظهران', code: 'DHA' },
];

// Static fallback data for when API is unavailable
const STATIC_WEATHER_DATA: Record<string, { tempC: number; humidity: number }> = {
  'Riyadh': { tempC: 35, humidity: 20 },
  'Jeddah': { tempC: 32, humidity: 65 },
  'Dammam': { tempC: 34, humidity: 55 },
  'Makkah': { tempC: 36, humidity: 40 },
  'Madinah': { tempC: 35, humidity: 25 },
  'Khobar': { tempC: 33, humidity: 60 },
  'Jubail': { tempC: 34, humidity: 50 },
  'Yanbu': { tempC: 31, humidity: 55 },
  'Tabuk': { tempC: 28, humidity: 25 },
  'Abha': { tempC: 22, humidity: 45 },
};

async function fetchWeatherFromAPI(city: string): Promise<WeatherData> {
  // Use query parameters via GET request
  const response = await fetch(
    `https://ltqhdbovwiepvgziyaya.supabase.co/functions/v1/weather-api?city=${encodeURIComponent(city)}`,
    {
      headers: {
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cWhkYm92d2llcHZneml5YXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNzc5ODAsImV4cCI6MjA4MTY1Mzk4MH0.yEFNYBPq756W8QP8Gw36cETPrmw_o6Ojrn0tV3fzr08`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const weatherData = await response.json();

  return {
    city: weatherData.city,
    temperatureC: weatherData.temperature_c,
    temperatureF: weatherData.temperature_f,
    humidity: weatherData.humidity,
    pressureHpa: weatherData.pressure_hpa,
    windSpeedMs: weatherData.wind_speed_ms,
    condition: weatherData.condition,
    icon: weatherData.icon,
    fetchedAt: weatherData.fetched_at,
    isCached: weatherData.is_cached,
    isLive: true,
  };
}

function getStaticWeatherData(city: string): WeatherData {
  const cityData = STATIC_WEATHER_DATA[city] || { tempC: 30, humidity: 40 };
  
  return {
    city,
    temperatureC: cityData.tempC,
    temperatureF: (cityData.tempC * 9/5) + 32,
    humidity: cityData.humidity,
    pressureHpa: 1013,
    windSpeedMs: 3,
    condition: 'Clear',
    icon: '01d',
    fetchedAt: new Date().toISOString(),
    isCached: false,
    isLive: false,
  };
}

export function useWeatherAPI(city: string, enabled: boolean = true) {
  const [useLiveData, setUseLiveData] = useState(true);

  const { data: liveWeather, isLoading, error, refetch } = useQuery({
    queryKey: ['weather', city],
    queryFn: () => fetchWeatherFromAPI(city),
    enabled: enabled && useLiveData && !!city,
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
    refetchInterval: 15 * 60 * 1000, // Auto-refresh every 15 minutes
  });

  const weather = useLiveData && liveWeather ? liveWeather : getStaticWeatherData(city);

  const toggleLiveData = useCallback(() => {
    setUseLiveData(prev => !prev);
  }, []);

  return {
    weather,
    isLoading: useLiveData ? isLoading : false,
    error: useLiveData ? error : null,
    useLiveData,
    toggleLiveData,
    refetch,
  };
}

export function useWeatherForecast(city: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['weather-forecast', city],
    queryFn: async () => {
      const response = await fetch(
        `https://ltqhdbovwiepvgziyaya.supabase.co/functions/v1/weather-api?city=${encodeURIComponent(city)}&forecast=true`,
        {
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cWhkYm92d2llcHZneml5YXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNzc5ODAsImV4cCI6MjA4MTY1Mzk4MH0.yEFNYBPq756W8QP8Gw36cETPrmw_o6Ojrn0tV3fzr08`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Weather forecast API error: ${response.status}`);
      }

      const data = await response.json();
      return data.forecast as WeatherForecast[];
    },
    enabled: enabled && !!city,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Hook for ERV calculations with weather data
export function useERVWeatherConditions(city: string, enabled: boolean = true) {
  const { weather, isLoading, error, useLiveData, toggleLiveData } = useWeatherAPI(city, enabled);

  // Calculate outdoor air conditions for ERV sizing
  const outdoorConditions = {
    dryBulbF: weather.temperatureF,
    dryBulbC: weather.temperatureC,
    relativeHumidity: weather.humidity,
    // Approximate wet bulb based on dry bulb and RH (simplified calculation)
    wetBulbF: weather.temperatureF - ((100 - weather.humidity) / 5),
    // Approximate enthalpy (simplified)
    enthalpyBtuLb: 0.24 * weather.temperatureF + (weather.humidity / 100) * (1061 + 0.444 * weather.temperatureF),
    condition: weather.condition,
    isLive: weather.isLive,
    fetchedAt: weather.fetchedAt,
  };

  return {
    outdoorConditions,
    isLoading,
    error,
    useLiveData,
    toggleLiveData,
  };
}
