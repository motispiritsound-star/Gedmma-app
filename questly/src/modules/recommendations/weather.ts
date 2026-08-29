import type { Season, WeatherSuitability } from "@prisma/client";
import { seasonFor } from "./engine";

/**
 * Weather is a recommendation signal, not a promise. The MVP ships a
 * deterministic seasonal provider so nothing depends on an external API; a real
 * forecast provider implements the same interface.
 */
export interface WeatherProvider {
  readonly name: string;
  forecast(input: { season: Season; date: Date }): Promise<WeatherSuitability>;
}

const SEASON_DEFAULT: Record<Season, WeatherSuitability> = {
  SPRING: "DRY",
  SUMMER: "WARM",
  AUTUMN: "RAIN_FRIENDLY",
  WINTER: "COLD",
};

export class SeasonalWeatherProvider implements WeatherProvider {
  readonly name = "seasonal";
  async forecast({ season }: { season: Season; date: Date }): Promise<WeatherSuitability> {
    return SEASON_DEFAULT[season];
  }
}

let cached: WeatherProvider | null = null;

export function weatherProvider(): WeatherProvider {
  cached ??= new SeasonalWeatherProvider();
  return cached;
}

export function setWeatherProvider(provider: WeatherProvider | null): void {
  cached = provider;
}

export async function currentWeather(date = new Date()): Promise<{ season: Season; weather: WeatherSuitability }> {
  const season = seasonFor(date);
  return { season, weather: await weatherProvider().forecast({ season, date }) };
}
