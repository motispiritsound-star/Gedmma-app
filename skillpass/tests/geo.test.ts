import { describe, expect, it } from 'vitest';
import { MockGeoProvider, approximate, distanceKm, geoProvider } from '@/lib/adapters/geo';

describe('geo adapter', () => {
  it('defaults to the offline provider so no request leaves the machine', () => {
    expect(geoProvider().name).toBe('mock');
  });

  it('geocodes the launch region from the built-in gazetteer', async () => {
    const provider = new MockGeoProvider();
    const utrecht = await provider.geocode('Utrecht');
    expect(utrecht?.latitude).toBeCloseTo(52.09, 1);
    expect(await provider.geocode('Atlantis')).toBeNull();
  });

  it('measures distance between two points', () => {
    const utrecht = { latitude: 52.0907, longitude: 5.1214 };
    const amsterdam = { latitude: 52.3676, longitude: 4.9041 };
    expect(distanceKm(utrecht, utrecht)).toBe(0);
    // Utrecht to Amsterdam is roughly 35 km as the crow flies.
    expect(distanceKm(utrecht, amsterdam)).toBeGreaterThan(30);
    expect(distanceKm(utrecht, amsterdam)).toBeLessThan(40);
  });

  it('coarsens a venue position to a ~500 m grid', () => {
    const exact = { latitude: 52.09371, longitude: 5.12374 };
    const coarse = approximate(exact);

    expect(coarse.latitude).not.toBe(exact.latitude);
    expect(coarse.longitude).not.toBe(exact.longitude);
    // Still close enough to be useful for discovery…
    expect(distanceKm(exact, coarse)).toBeLessThan(0.6);
    // …but the same grid cell for two nearby addresses, so a home address in
    // that cell is not pinpointed.
    expect(approximate({ latitude: 52.0938, longitude: 5.1238 })).toEqual(coarse);
  });
});
