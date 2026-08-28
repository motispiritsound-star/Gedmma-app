/**
 * Haalt de omtrek van Nederland uit Natural Earth (via world-atlas, publiek
 * domein) en schrijft hem weg als een compacte GeoJSON die de kaart in het
 * dashboard inlaadt. Eenmalig te draaien; de uitvoer staat in de repo.
 *
 *   node tools/build-map.ts
 */
import { writeFileSync } from 'node:fs';
import { feature } from 'topojson-client';
import atlas from 'world-atlas/countries-10m.json' with { type: 'json' };

type Ring = [number, number][];

const wereld = feature(atlas as never, (atlas as never as { objects: { countries: unknown } }).objects.countries) as unknown as {
  features: { properties: { name: string }; geometry: { type: string; coordinates: Ring[][] } }[];
};

const nederland = wereld.features.find((f) => f.properties.name === 'Netherlands');
if (!nederland) throw new Error('Nederland niet gevonden in de dataset');

// Natural Earth rekent ook Caribisch Nederland tot het land; voor deze kaart
// houden we alleen het Europese deel over.
const europees = (nederland.geometry.coordinates as Ring[][]).filter((polygoon) => {
  const punten = polygoon[0]!;
  const lat = punten.reduce((sum, [, y]) => sum + y, 0) / punten.length;
  const lon = punten.reduce((sum, [x]) => sum + x, 0) / punten.length;
  return lat > 50 && lat < 54.5 && lon > 3 && lon < 8;
});

/** Douglas-Peucker; de kaart is een paar honderd pixels breed, dus detail is verspilling. */
function vereenvoudig(punten: Ring, tolerantie: number): Ring {
  if (punten.length < 3) return punten;
  const eerste = punten[0]!;
  const laatste = punten[punten.length - 1]!;
  let index = 0;
  let grootste = 0;

  for (let i = 1; i < punten.length - 1; i++) {
    const afstand = afstandTotLijn(punten[i]!, eerste, laatste);
    if (afstand > grootste) { grootste = afstand; index = i; }
  }
  if (grootste <= tolerantie) return [eerste, laatste];
  return [
    ...vereenvoudig(punten.slice(0, index + 1), tolerantie).slice(0, -1),
    ...vereenvoudig(punten.slice(index), tolerantie),
  ];
}

function afstandTotLijn([x, y]: [number, number], [x1, y1]: [number, number], [x2, y2]: [number, number]): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengte = dx * dx + dy * dy;
  if (lengte === 0) return Math.hypot(x - x1, y - y1);
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengte));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

const ronde = (punten: Ring): Ring =>
  punten.map(([x, y]) => [Number(x.toFixed(3)), Number(y.toFixed(3))] as [number, number]);

const polygonen = europees
  .map((polygoon) => ronde(vereenvoudig(polygoon[0]!, 0.004)))
  .filter((ring) => ring.length > 12);

const uitvoer = {
  bron: 'Natural Earth 1:10m via world-atlas (publiek domein)',
  polygonen,
};

writeFileSync('src/server/public/nederland.json', JSON.stringify(uitvoer));
console.log(`${polygonen.length} polygonen, ${polygonen.reduce((n, p) => n + p.length, 0)} punten, ` +
  `${Math.round(JSON.stringify(uitvoer).length / 1024)} kB`);
