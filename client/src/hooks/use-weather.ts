import { useState, useEffect } from "react";

interface WeatherData {
  temperature: number;
  weatherCode: number;
  description: string;
  icon: string;
}

const WMO_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: "Clear", icon: "sunny" },
  1: { description: "Mostly Clear", icon: "sunny" },
  2: { description: "Partly Cloudy", icon: "partly_cloudy" },
  3: { description: "Overcast", icon: "cloudy" },
  45: { description: "Foggy", icon: "foggy" },
  48: { description: "Icy Fog", icon: "foggy" },
  51: { description: "Light Drizzle", icon: "drizzle" },
  53: { description: "Drizzle", icon: "drizzle" },
  55: { description: "Heavy Drizzle", icon: "drizzle" },
  56: { description: "Freezing Drizzle", icon: "drizzle" },
  57: { description: "Heavy Freezing Drizzle", icon: "drizzle" },
  61: { description: "Light Rain", icon: "rainy" },
  63: { description: "Rain", icon: "rainy" },
  65: { description: "Heavy Rain", icon: "rainy" },
  66: { description: "Freezing Rain", icon: "rainy" },
  67: { description: "Heavy Freezing Rain", icon: "rainy" },
  71: { description: "Light Snow", icon: "snowy" },
  73: { description: "Snow", icon: "snowy" },
  75: { description: "Heavy Snow", icon: "snowy" },
  77: { description: "Snow Grains", icon: "snowy" },
  80: { description: "Light Showers", icon: "rainy" },
  81: { description: "Showers", icon: "rainy" },
  82: { description: "Heavy Showers", icon: "rainy" },
  85: { description: "Light Snow Showers", icon: "snowy" },
  86: { description: "Heavy Snow Showers", icon: "snowy" },
  95: { description: "Thunderstorm", icon: "stormy" },
  96: { description: "Thunderstorm w/ Hail", icon: "stormy" },
  99: { description: "Thunderstorm w/ Heavy Hail", icon: "stormy" },
};

function getWeatherEmoji(icon: string, isNight: boolean): string {
  switch (icon) {
    case "sunny": return isNight ? "\u{1F319}" : "\u2600\uFE0F";
    case "partly_cloudy": return isNight ? "\u{1F319}" : "\u26C5";
    case "cloudy": return "\u2601\uFE0F";
    case "foggy": return "\u{1F32B}\uFE0F";
    case "drizzle": return "\u{1F326}\uFE0F";
    case "rainy": return "\u{1F327}\uFE0F";
    case "snowy": return "\u{1F328}\uFE0F";
    case "stormy": return "\u26C8\uFE0F";
    default: return "\u{1F321}\uFE0F";
  }
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.006&current=temperature_2m,weather_code,is_day&temperature_unit=fahrenheit&timezone=America%2FNew_York"
        );
        if (!res.ok) return;
        const data = await res.json();
        const current = data.current;
        const code = current.weather_code as number;
        const info = WMO_CODES[code] || { description: "Unknown", icon: "sunny" };
        const isNight = current.is_day === 0;

        setWeather({
          temperature: Math.round(current.temperature_2m),
          weatherCode: code,
          description: info.description,
          icon: getWeatherEmoji(info.icon, isNight),
        });
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { weather, loading };
}
