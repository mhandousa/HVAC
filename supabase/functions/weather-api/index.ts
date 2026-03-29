import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherResponse {
  city: string;
  temperature_c: number;
  temperature_f: number;
  humidity: number;
  pressure_hpa: number;
  wind_speed_ms: number;
  condition: string;
  icon: string;
  fetched_at: string;
  is_cached: boolean;
}

// Saudi Arabia city coordinates
const SAUDI_CITIES: Record<string, { lat: number; lon: number }> = {
  'riyadh': { lat: 24.7136, lon: 46.6753 },
  'jeddah': { lat: 21.4858, lon: 39.1925 },
  'dammam': { lat: 26.4207, lon: 50.0888 },
  'makkah': { lat: 21.4225, lon: 39.8262 },
  'madinah': { lat: 24.5247, lon: 39.5692 },
  'khobar': { lat: 26.2172, lon: 50.1971 },
  'jubail': { lat: 27.0046, lon: 49.6225 },
  'yanbu': { lat: 24.0895, lon: 38.0618 },
  'tabuk': { lat: 28.3835, lon: 36.5662 },
  'abha': { lat: 18.2164, lon: 42.5053 },
  'khamis mushait': { lat: 18.3000, lon: 42.7333 },
  'najran': { lat: 17.4933, lon: 44.1277 },
  'hail': { lat: 27.5114, lon: 41.7208 },
  'taif': { lat: 21.2703, lon: 40.4158 },
  'buraidah': { lat: 26.3260, lon: 43.9750 },
  'dhahran': { lat: 26.2361, lon: 50.0393 },
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const city = url.searchParams.get('city')?.toLowerCase();
    const lat = url.searchParams.get('lat');
    const lon = url.searchParams.get('lon');
    const forecast = url.searchParams.get('forecast') === 'true';

    if (!city && (!lat || !lon)) {
      return new Response(
        JSON.stringify({ error: 'Either city or lat/lon coordinates are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get coordinates
    let latitude: number;
    let longitude: number;
    let cityName: string;

    if (city && SAUDI_CITIES[city]) {
      latitude = SAUDI_CITIES[city].lat;
      longitude = SAUDI_CITIES[city].lon;
      cityName = city.charAt(0).toUpperCase() + city.slice(1);
    } else if (lat && lon) {
      latitude = parseFloat(lat);
      longitude = parseFloat(lon);
      cityName = 'Custom Location';
    } else {
      return new Response(
        JSON.stringify({ error: `City "${city}" not found. Available cities: ${Object.keys(SAUDI_CITIES).join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first (only for current weather, not forecast)
    if (!forecast) {
      const { data: cachedData } = await supabase
        .from('weather_cache')
        .select('*')
        .eq('city_name', cityName)
        .gt('expires_at', new Date().toISOString())
        .order('fetched_at', { ascending: false })
        .limit(1)
        .single();

      if (cachedData) {
        console.log(`Returning cached weather for ${cityName}`);
        const response: WeatherResponse = {
          city: cachedData.city_name,
          temperature_c: cachedData.temperature_c,
          temperature_f: (cachedData.temperature_c * 9/5) + 32,
          humidity: cachedData.humidity_percent,
          pressure_hpa: cachedData.pressure_hpa,
          wind_speed_ms: cachedData.wind_speed_ms,
          condition: cachedData.weather_condition,
          icon: cachedData.weather_icon,
          fetched_at: cachedData.fetched_at,
          is_cached: true,
        };
        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Fetch from OpenWeatherMap API
    const apiKey = Deno.env.get('OPENWEATHERMAP_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenWeatherMap API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let apiUrl: string;
    if (forecast) {
      apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
    } else {
      apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
    }

    console.log(`Fetching weather from OpenWeatherMap for ${cityName}`);
    const weatherResponse = await fetch(apiUrl);

    if (!weatherResponse.ok) {
      const errorText = await weatherResponse.text();
      console.error('OpenWeatherMap API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch weather data', details: errorText }),
        { status: weatherResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const weatherData = await weatherResponse.json();

    if (forecast) {
      // Return forecast data directly
      const forecastResponse = weatherData.list.slice(0, 8).map((item: any) => ({
        datetime: item.dt_txt,
        temperature_c: item.main.temp,
        temperature_f: (item.main.temp * 9/5) + 32,
        humidity: item.main.humidity,
        condition: item.weather[0].main,
        icon: item.weather[0].icon,
      }));
      return new Response(JSON.stringify({ city: cityName, forecast: forecastResponse }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cache the current weather data
    const fetchedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    await supabase.from('weather_cache').insert({
      city_name: cityName,
      latitude,
      longitude,
      temperature_c: weatherData.main.temp,
      humidity_percent: weatherData.main.humidity,
      pressure_hpa: weatherData.main.pressure,
      wind_speed_ms: weatherData.wind.speed,
      weather_condition: weatherData.weather[0].main,
      weather_icon: weatherData.weather[0].icon,
      fetched_at: fetchedAt,
      expires_at: expiresAt,
    });

    const response: WeatherResponse = {
      city: cityName,
      temperature_c: weatherData.main.temp,
      temperature_f: (weatherData.main.temp * 9/5) + 32,
      humidity: weatherData.main.humidity,
      pressure_hpa: weatherData.main.pressure,
      wind_speed_ms: weatherData.wind.speed,
      condition: weatherData.weather[0].main,
      icon: weatherData.weather[0].icon,
      fetched_at: fetchedAt,
      is_cached: false,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in weather-api function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
