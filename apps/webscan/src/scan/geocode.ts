import { config } from '../config.ts';
import { sleep } from '../util/pool.ts';
import { bewaarCoordinaten, companiesZonderCoordinaten, type CompanyRow } from '../db/index.ts';
import { log, progress } from '../util/log.ts';

const NOMINATIM = process.env.NOMINATIM_URL ?? 'https://nominatim.openstreetmap.org/search';

type Treffer = { lat: string; lon: string };

/**
 * Zoekt de coördinaten van een plaats op via Nominatim. De gebruiksvoorwaarden
 * staan maximaal één verzoek per seconde toe en vragen om een herkenbare
 * User-Agent — beide worden hier nageleefd. Resultaten worden per plaats
 * onthouden, zodat honderd bedrijven in Utrecht samen één verzoek kosten.
 */
export async function geocodePlaats(plaats: string, cache: Map<string, [number, number] | null>):
  Promise<[number, number] | null> {
  const sleutel = plaats.trim().toLowerCase();
  if (cache.has(sleutel)) return cache.get(sleutel)!;

  const url = new URL(NOMINATIM);
  url.searchParams.set('q', plaats);
  url.searchParams.set('countrycodes', 'nl');
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  let gevonden: [number, number] | null = null;
  try {
    const response = await fetch(url, {
      headers: { 'user-agent': config.userAgent, 'accept-language': 'nl' },
      signal: AbortSignal.timeout(config.timeoutMs),
    });
    if (response.ok) {
      const [treffer] = (await response.json()) as Treffer[];
      if (treffer) gevonden = [Number(treffer.lat), Number(treffer.lon)];
    } else if (response.status === 429) {
      log.warn('Nominatim rate-limit geraakt; wacht even en probeer opnieuw.');
    }
  } catch {
    gevonden = null;
  }

  cache.set(sleutel, gevonden);
  await sleep(1100); // Nominatim: maximaal 1 verzoek per seconde.
  return gevonden;
}

/**
 * Zet bedrijven zonder coördinaten op de kaart, op basis van hun plaatsnaam.
 * Dat is een grove positie — alle bedrijven in Zeist komen op hetzelfde punt.
 * Bedrijven uit OpenStreetMap hebben hun eigen exacte positie al.
 */
export async function geocodeBedrijven(limit = 200): Promise<{ gelukt: number; mislukt: number }> {
  const bedrijven: CompanyRow[] = companiesZonderCoordinaten(limit);
  if (bedrijven.length === 0) {
    log.ok('Alle bedrijven met een plaatsnaam staan al op de kaart.');
    return { gelukt: 0, mislukt: 0 };
  }

  const plaatsen = new Set(bedrijven.map((bedrijf) => bedrijf.city!.trim().toLowerCase()));
  log.step(`${bedrijven.length} bedrijven in ${plaatsen.size} plaatsen opzoeken (ongeveer ${plaatsen.size} seconden)…`);

  const cache = new Map<string, [number, number] | null>();
  const balk = progress(bedrijven.length, 'geplaatst');
  let gelukt = 0;
  let mislukt = 0;

  for (const bedrijf of bedrijven) {
    const punt = await geocodePlaats(bedrijf.city!, cache);
    if (punt) {
      // Een kleine spreiding rond het middelpunt, anders liggen alle bedrijven
      // uit dezelfde plaats exact op elkaar en zie je er maar één.
      const spreiding = 0.012;
      bewaarCoordinaten(
        bedrijf.id,
        punt[0] + (Math.random() - 0.5) * spreiding,
        punt[1] + (Math.random() - 0.5) * spreiding * 1.6,
      );
      gelukt++;
    } else {
      mislukt++;
    }
    balk.tick(bedrijf.city ?? '');
  }
  balk.done();
  return { gelukt, mislukt };
}
