/**
 * Verrijken via de KVK: bij een bedrijf dat je al hebt (uit OSM of je eigen
 * lijst) het KVK-nummer en vooral de **rechtsvorm** ophalen. Die rechtsvorm
 * bepaalt of je mag bellen, dus dit is het verschil tussen "onbekend, dus niet
 * bellen" en een lead die je gewoon kunt benaderen.
 *
 * Twee API's, allebei van developers.kvk.nl:
 *   - Zoeken       — naam en plaats erin, KVK-nummer eruit. Zonder kosten per bevraging.
 *   - Basisprofiel — KVK-nummer erin, rechtsvorm eruit. Per bevraging betaald.
 *
 * Daarom verrijken we per lead die je echt gaat benaderen, niet je hele bestand:
 * duizend bedrijven verrijken kost een paar tientjes, de honderd die je deze week
 * belt kost twee euro.
 */
import { config } from '../config.ts';
import { db } from '../db/index.ts';
import { herkenRechtsvorm, zetRechtsvorm, type RechtsvormId } from '../db/contact.ts';

/** Prijs per betaalde bevraging, om de kosten vooraf te kunnen tonen. */
export const CENT_PER_BEVRAGING = 2;

const BASIS = process.env.KVK_API_URL ?? 'https://api.kvk.nl/api';

export type KvkTreffer = {
  kvkNummer: string;
  naam: string;
  plaats: string | null;
  straat: string | null;
  type: string | null;
};

export type Verrijking = {
  kvkNummer: string | null;
  rechtsvorm: RechtsvormId | null;
  rechtsvormTekst: string | null;
  naam: string | null;
  /** Hoeveel betaalde bevragingen dit heeft gekost. */
  bevragingen: number;
  reden?: string;
};

function sleutel(): string {
  if (!config.kvkApiKey) {
    throw new Error('Zet KVK_API_KEY in je .env — aanvragen via developers.kvk.nl.');
  }
  return config.kvkApiKey;
}

async function haal(pad: string, params: Record<string, string>): Promise<any> {
  const url = new URL(`${BASIS}${pad}`);
  for (const [naam, waarde] of Object.entries(params)) url.searchParams.set(naam, waarde);

  const antwoord = await fetch(url, {
    headers: { apikey: sleutel(), 'user-agent': config.userAgent },
    signal: AbortSignal.timeout(config.timeoutMs),
  });
  if (antwoord.status === 404) return null;
  if (antwoord.status === 429) throw new Error('De KVK houdt je even tegen (429). Verlaag het tempo.');
  if (!antwoord.ok) throw new Error(`KVK gaf ${antwoord.status} ${antwoord.statusText}`);
  return antwoord.json();
}

/** Zoekt op handelsnaam (en plaats) en geeft de treffers terug. Zoeken is gratis. */
export async function zoek(naam: string, plaats?: string | null): Promise<KvkTreffer[]> {
  const params: Record<string, string> = { naam, resultatenPerPagina: '10' };
  if (plaats) params.plaats = plaats;

  const body = await haal('/v2/zoeken', params);
  const resultaten = (body?.resultaten ?? []) as any[];
  return resultaten.map((rij) => ({
    kvkNummer: String(rij.kvkNummer ?? ''),
    naam: String(rij.naam ?? ''),
    plaats: rij.adres?.binnenlandsAdres?.plaats ?? rij.plaats ?? null,
    straat: rij.adres?.binnenlandsAdres?.straatnaam ?? null,
    type: rij.type ?? null,
  })).filter((rij) => rij.kvkNummer);
}

/** Haalt het basisprofiel op. Dit is de bevraging waar je voor betaalt. */
export async function basisprofiel(kvkNummer: string): Promise<{ naam: string | null; rechtsvormTekst: string | null }> {
  const body = await haal(`/v1/basisprofielen/${encodeURIComponent(kvkNummer)}`, {});
  if (!body) return { naam: null, rechtsvormTekst: null };
  const eigenaar = body._embedded?.eigenaar ?? {};
  return {
    naam: body.naam ?? body.statutaireNaam ?? null,
    // De KVK geeft zowel een korte als een uitgebreide omschrijving; de korte is
    // "Besloten Vennootschap", de uitgebreide bijvoorbeeld "Besloten Vennootschap
    // met gewone structuur". Voor onze vraag — natuurlijk persoon of niet — is de
    // korte genoeg, met de uitgebreide als terugval.
    rechtsvormTekst: eigenaar.rechtsvorm ?? eigenaar.uitgebreideRechtsvorm ?? body.rechtsvorm ?? null,
  };
}

/**
 * Hoeveel lijkt een KVK-treffer op het bedrijf dat wij hebben? Alleen bij een
 * duidelijke match nemen we het nummer over; liever geen rechtsvorm dan de
 * rechtsvorm van de buurman.
 */
export function gelijkenis(onze: { naam: string; plaats?: string | null }, treffer: KvkTreffer): number {
  const schoon = (tekst: string) => tekst.toLowerCase()
    .replace(/\b(b\.?v\.?|v\.?o\.?f\.?|n\.?v\.?|holding|beheer)\b/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

  const onsWoorden = new Set(schoon(onze.naam).split(' ').filter((woord) => woord.length > 2));
  const hunWoorden = new Set(schoon(treffer.naam).split(' ').filter((woord) => woord.length > 2));
  if (onsWoorden.size === 0 || hunWoorden.size === 0) return 0;

  let raak = 0;
  for (const woord of onsWoorden) if (hunWoorden.has(woord)) raak++;
  const overlap = raak / Math.max(onsWoorden.size, hunWoorden.size);

  const plaatsGelijk = onze.plaats && treffer.plaats
    ? onze.plaats.toLowerCase() === treffer.plaats.toLowerCase()
    : null;
  if (plaatsGelijk === false) return overlap * 0.5;
  return plaatsGelijk ? Math.min(1, overlap + 0.15) : overlap;
}

/** De drempel waarboven we een treffer vertrouwen. */
export const DREMPEL = 0.6;

/**
 * Zoekt één bedrijf op bij de KVK en schrijft KVK-nummer en rechtsvorm weg.
 * Geeft ook terug wat het gekost heeft, zodat het dashboard dat kan tonen.
 */
export async function verrijkBedrijf(
  bedrijf: { id: number; name: string; city?: string | null; kvk_number?: string | null },
): Promise<Verrijking> {
  let kvkNummer = bedrijf.kvk_number ?? null;
  let bevragingen = 0;

  if (!kvkNummer) {
    const treffers = await zoek(bedrijf.name, bedrijf.city);
    const beste = treffers
      .map((treffer) => ({ treffer, score: gelijkenis({ naam: bedrijf.name, plaats: bedrijf.city }, treffer) }))
      .sort((a, b) => b.score - a.score)[0];

    if (!beste || beste.score < DREMPEL) {
      return { kvkNummer: null, rechtsvorm: null, rechtsvormTekst: null, naam: null, bevragingen,
        reden: treffers.length === 0
          ? 'Geen bedrijf met deze naam gevonden bij de KVK.'
          : 'Wel treffers, maar geen die zeker genoeg bij dit bedrijf hoort.' };
    }
    kvkNummer = beste.treffer.kvkNummer;
  }

  const profiel = await basisprofiel(kvkNummer);
  bevragingen++;
  const rechtsvorm = herkenRechtsvorm(profiel.rechtsvormTekst);

  db().prepare('UPDATE companies SET kvk_number = ? WHERE id = ?').run(kvkNummer, bedrijf.id);
  if (rechtsvorm) zetRechtsvorm(bedrijf.id, rechtsvorm);

  return {
    kvkNummer,
    rechtsvorm,
    rechtsvormTekst: profiel.rechtsvormTekst,
    naam: profiel.naam,
    bevragingen,
    reden: rechtsvorm ? undefined : 'KVK-nummer gevonden, maar de rechtsvorm was niet te herleiden.',
  };
}

/** De bedrijven die het meest te winnen hebben bij verrijking: geen rechtsvorm. */
export function zonderRechtsvorm(limit: number, plaats?: string | null): {
  id: number; name: string; city: string | null; kvk_number: string | null;
}[] {
  const waar = plaats ? 'AND city = ?' : '';
  const params: (string | number)[] = plaats ? [plaats, limit] : [limit];
  return db().prepare(`
    SELECT id, name, city, kvk_number FROM companies
    WHERE rechtsvorm IS NULL ${waar}
    ORDER BY prioriteit DESC NULLS LAST, id
    LIMIT ?`).all(...params) as never;
}
