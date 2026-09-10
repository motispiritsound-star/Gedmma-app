import { CATEGORY_BY_SLUG } from './catalog/categories.js';
import { CITY_BY_SLUG } from './catalog/cities.js';
import { distanceKm } from './geo.js';

/**
 * Who gets to hear about whom.
 *
 * The marketplace proper will do this on jobs and quotes in PostgreSQL. This
 * runs a step earlier, on the sign-up list itself: somebody says they need a
 * painter in Utrecht, and the question is which of the painters who signed up
 * should be told. Same question, smaller data, and it is the whole product
 * until the app exists.
 *
 * Deliberately pure and in shared, so the ranking can be tested without a
 * database and reused when the API takes this over.
 */

export interface SignupRecord {
  id: string;
  role: 'CUSTOMER' | 'PRO';
  email: string;
  name: string | null;
  phone: string | null;
  citySlug: string | null;
  categorySlugs: string[];
  kvk: string | null;
  jobNote: string | null;
  createdAt: string;
  handledAt: string | null;
  unsubscribedAt: string | null;
}

export interface Match {
  pro: SignupRecord;
  /** Trades this pro and this request have in common, as slugs. */
  sharedCategories: string[];
  /** Kilometres between the two municipalities, or null if either is unknown. */
  distanceKm: number | null;
  /** Close enough to call it the neighbourhood. */
  nearby: boolean;
}

/**
 * What counts as "in de buurt". Wide enough that a request in a small
 * municipality still reaches somebody, narrow enough that "buurt" stays an
 * honest word: 25 km is about half an hour's drive with a van.
 */
export const MATCH_RADIUS_KM = 25;

function coordinates(slug: string | null) {
  if (!slug) return null;
  const city = CITY_BY_SLUG.get(slug);
  return city ? { lat: city.lat, lng: city.lng } : null;
}

/**
 * The pros to tell about one request, best first.
 *
 * Ordered by how well they fit rather than by a score nobody can argue with:
 * more trades in common first, then nearer, then whoever signed up earliest —
 * because when two are equal, the one who has been waiting longest should not
 * keep losing to the one who joined yesterday.
 *
 * Pros beyond the radius are returned too, marked `nearby: false`. A new
 * marketplace has too few of them to throw any away; it is the page that
 * decides how far down to look.
 */
export function matchPros(request: SignupRecord, pros: readonly SignupRecord[]): Match[] {
  const wanted = new Set(request.categorySlugs.filter((slug) => CATEGORY_BY_SLUG.has(slug)));
  const from = coordinates(request.citySlug);

  const matches: Match[] = [];
  for (const pro of pros) {
    if (pro.role !== 'PRO') continue;
    if (pro.unsubscribedAt) continue;
    if (pro.email === request.email) continue;

    const shared = pro.categorySlugs.filter((slug) => wanted.has(slug));
    // A request that names no trade is matched on place alone: better to show
    // somebody and let a human judge than to show nothing.
    if (wanted.size > 0 && shared.length === 0) continue;

    const to = coordinates(pro.citySlug);
    const km = from && to ? Math.round(distanceKm(from, to)) : null;
    matches.push({ pro, sharedCategories: shared, distanceKm: km, nearby: km !== null && km <= MATCH_RADIUS_KM });
  }

  return matches.sort((a, b) => {
    if (a.sharedCategories.length !== b.sharedCategories.length) {
      return b.sharedCategories.length - a.sharedCategories.length;
    }
    // An unknown distance sorts after every known one rather than as zero.
    const aKm = a.distanceKm ?? Number.POSITIVE_INFINITY;
    const bKm = b.distanceKm ?? Number.POSITIVE_INFINITY;
    if (aKm !== bKm) return aKm - bKm;
    return a.pro.createdAt.localeCompare(b.pro.createdAt);
  });
}

/** The open requests one pro would be told about, for the pro's own row. */
export function requestsForPro(pro: SignupRecord, requests: readonly SignupRecord[]): SignupRecord[] {
  return requests.filter(
    (request) =>
      request.role === 'CUSTOMER' &&
      !request.handledAt &&
      matchPros(request, [pro]).length > 0,
  );
}
