import { env } from '../../env';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeocodeResult extends Coordinates {
  label: string;
  postalCode?: string;
  city?: string;
}

export interface GeoProvider {
  readonly name: string;
  geocode(query: string): Promise<GeocodeResult | null>;
  /** Map tile/style URL template for the client-side map. */
  tileUrl(): string;
  attribution(): string;
}

const EARTH_RADIUS_KM = 6371;

export function distanceKm(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Coarsens coordinates to a ~500 m grid. Used for every pre-booking display so
 * a venue that is somebody's home address is not pinpointed publicly.
 */
export function approximate(point: Coordinates): Coordinates {
  const grid = 0.005; // ~555 m latitude
  return {
    latitude: Math.round(point.latitude / grid) * grid,
    longitude: Math.round(point.longitude / grid) * grid,
  };
}

/** Offline gazetteer covering the launch region; no network, no rate limits. */
const GAZETTEER: Record<string, GeocodeResult> = {
  utrecht: { label: 'Utrecht', latitude: 52.0907, longitude: 5.1214, city: 'Utrecht' },
  'utrecht centrum': { label: 'Utrecht Centrum', latitude: 52.0894, longitude: 5.1101, city: 'Utrecht', postalCode: '3511' },
  overvecht: { label: 'Utrecht Overvecht', latitude: 52.1176, longitude: 5.1063, city: 'Utrecht', postalCode: '3524' },
  leidsche_rijn: { label: 'Leidsche Rijn', latitude: 52.0942, longitude: 5.0421, city: 'Utrecht', postalCode: '3543' },
  zuilen: { label: 'Utrecht Zuilen', latitude: 52.1118, longitude: 5.0836, city: 'Utrecht', postalCode: '3554' },
  lombok: { label: 'Utrecht Lombok', latitude: 52.0895, longitude: 5.0999, city: 'Utrecht', postalCode: '3531' },
  amsterdam: { label: 'Amsterdam', latitude: 52.3676, longitude: 4.9041, city: 'Amsterdam' },
  rotterdam: { label: 'Rotterdam', latitude: 51.9244, longitude: 4.4777, city: 'Rotterdam' },
};

export class MockGeoProvider implements GeoProvider {
  readonly name = 'mock';

  async geocode(query: string): Promise<GeocodeResult | null> {
    const key = query.trim().toLowerCase().replace(/\s+/g, ' ');
    return GAZETTEER[key] ?? GAZETTEER[key.replace(/\s/g, '_')] ?? null;
  }

  tileUrl(): string {
    // Rendered by the built-in SVG map so the app needs no tile server.
    return 'internal://static-map';
  }

  attribution(): string {
    return 'SkillPass offline map';
  }
}

export class OsmGeoProvider implements GeoProvider {
  readonly name = 'osm';
  constructor(private readonly baseUrl: string) {}

  async geocode(query: string): Promise<GeocodeResult | null> {
    const url = `${this.baseUrl}/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, { headers: { 'User-Agent': 'SkillPass/0.1 (contact: ops@skillpass.local)' } });
    if (!response.ok) return null;
    const results = (await response.json()) as { lat: string; lon: string; display_name: string }[];
    const first = results[0];
    if (!first) return null;
    return { latitude: Number(first.lat), longitude: Number(first.lon), label: first.display_name };
  }

  tileUrl(): string {
    return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  }

  attribution(): string {
    return '© OpenStreetMap contributors';
  }
}

export class MapboxGeoProvider implements GeoProvider {
  readonly name = 'mapbox';
  constructor(private readonly token: string) {}

  async geocode(query: string): Promise<GeocodeResult | null> {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?limit=1&access_token=${this.token}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const body = (await response.json()) as { features: { center: [number, number]; place_name: string }[] };
    const feature = body.features[0];
    if (!feature) return null;
    return { longitude: feature.center[0], latitude: feature.center[1], label: feature.place_name };
  }

  tileUrl(): string {
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${this.token}`;
  }

  attribution(): string {
    return '© Mapbox © OpenStreetMap';
  }
}

let instance: GeoProvider | null = null;

export function geoProvider(): GeoProvider {
  if (instance) return instance;
  const config = env();
  if (config.GEO_PROVIDER === 'mapbox' && config.MAPBOX_TOKEN) instance = new MapboxGeoProvider(config.MAPBOX_TOKEN);
  else if (config.GEO_PROVIDER === 'osm') instance = new OsmGeoProvider(config.NOMINATIM_URL);
  else instance = new MockGeoProvider();
  return instance;
}

export function resetGeoProvider(): void {
  instance = null;
}
