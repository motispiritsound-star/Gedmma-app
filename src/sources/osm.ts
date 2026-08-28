import { config } from '../config.ts';
import { normalizeUrl, registrableDomain, isPlatformPage } from '../util/url.ts';
import { herkenRechtsvorm } from '../db/contact.ts';
import type { CompanyInput, Source, SourceOptions } from './types.ts';

const ENDPOINT = process.env.OVERPASS_URL ?? 'https://overpass-api.de/api/interpreter';

/** Categorieën vertaald naar OSM-tags. `all` pakt alle bedrijfsachtige objecten. */
const CATEGORIES: Record<string, string[]> = {
  shop: ['shop'],
  horeca: ['amenity~"^(restaurant|cafe|bar|fast_food|pub|ice_cream)$"'],
  office: ['office'],
  craft: ['craft'],
  zorg: ['healthcare'],
  toerisme: ['tourism~"^(hotel|guest_house|apartment|camp_site|attraction)$"'],
  all: ['shop', 'office', 'craft', 'healthcare', 'amenity~"^(restaurant|cafe|bar|fast_food|pub|dentist|veterinary|driving_school)$"'],
};

type OverpassElement = {
  type: string;
  id: number;
  /** Nodes hebben lat/lon zelf; ways en relations krijgen een center mee. */
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function buildQuery({ area, category, limit }: SourceOptions): string {
  const tags = CATEGORIES[category ?? 'all'] ?? CATEGORIES.all!;
  const scope = area
    ? `area["name"="${area.replace(/"/g, '')}"]["boundary"="administrative"]->.zone;`
    : `area["ISO3166-1"="NL"]["admin_level"="2"]->.zone;`;
  const cap = Math.min(limit ?? 1000, 25_000);
  const clauses = tags
    .map((tag) => `  nwr["name"]["website"][${tag}](area.zone);`)
    .join('\n');

  return `[out:json][timeout:180];
${scope}
(
${clauses}
);
out tags center ${cap};`;
}

/**
 * OpenStreetMap via de Overpass API. Gratis en open (ODbL), bevat voor NL
 * honderdduizenden bedrijven mét website-tag. Wees zuinig: de Overpass-servers
 * zijn een gratis voorziening — draai grote uitvragen per gemeente, niet in één klap.
 */
export const osmSource: Source = {
  name: 'osm',
  description: 'OpenStreetMap/Overpass — gratis bedrijfsgegevens incl. website (ODbL)',

  async fetch(options: SourceOptions): Promise<CompanyInput[]> {
    const query = buildQuery(options);
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'user-agent': config.userAgent,
      },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(190_000),
    });

    if (!response.ok) {
      const detail = response.status === 429 || response.status === 504
        ? ' — Overpass is overbelast of je bent gerate-limit; probeer het later of per gemeente.'
        : '';
      throw new Error(`Overpass gaf ${response.status} ${response.statusText}${detail}`);
    }

    const body = (await response.json()) as { elements?: OverpassElement[] };
    const elements = body.elements ?? [];
    const seen = new Set<string>();
    const out: CompanyInput[] = [];

    for (const element of elements) {
      const tags = element.tags ?? {};
      const rawSite = tags.website ?? tags['contact:website'] ?? '';
      const website = normalizeUrl(rawSite);
      const domain = registrableDomain(rawSite);
      if (!website || !domain || seen.has(domain)) continue;
      if (isPlatformPage(website)) continue;
      seen.add(domain);

      out.push({
        name: tags.name ?? domain,
        rechtsvorm: herkenRechtsvorm(tags.name),
        website,
        domain,
        city: tags['addr:city'] ?? null,
        province: null,
        branch: tags.shop ?? tags.office ?? tags.craft ?? tags.amenity ?? tags.healthcare ?? tags.tourism ?? null,
        phone: tags.phone ?? tags['contact:phone'] ?? null,
        email: tags.email ?? tags['contact:email'] ?? null,
        lat: element.lat ?? element.center?.lat ?? null,
        lon: element.lon ?? element.center?.lon ?? null,
        source: 'osm',
        sourceRef: `${element.type}/${element.id}`,
      });
    }
    return out;
  },
};
