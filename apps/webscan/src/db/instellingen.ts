import { db } from './index.ts';

/**
 * Wat je aanbiedt, in één plek. De mailsjablonen lezen dit uit, zodat je je
 * propositie kunt bijstellen zonder teksten te herschrijven.
 *
 * De keuze tussen "gratis" en "startbedrag" is een echte keuze, geen detail.
 * Gratis bouwt de drempel weg maar legt de hele kostprijs vooraf bij jou; met
 * een startbedrag verdien je de bouw meteen terug en filter je bovendien de
 * mensen eruit die toch nooit gingen betalen. Reken door wat een herbouw je aan
 * uren kost voordat je kiest.
 */
export type Aanbod = {
  soort: 'gratis' | 'startbedrag';
  startbedragCent: number;
  maandbedragCent: number;
  /** Wat er in het maandbedrag zit — komt letterlijk in de mail. */
  inbegrepen: string;
  bedrijfsnaam: string;
  telefoon: string;
};

/**
 * Wat een agent verdient. Een vast bedrag zodra de opdracht binnen is, en een
 * deel van wat die klant maandelijks opbrengt zolang hij klant blijft. Die
 * tweede helft is het punt: een agent die meedeelt in de hosting heeft er belang
 * bij dat de klant tevreden blijft, niet alleen dat hij ja zegt.
 */
export type Provisie = {
  perOpdrachtCent: number;
  /** Percentage van de maandomzet van eigen klanten, 0-100. */
  mrrPercentage: number;
};

const STANDAARD: Aanbod = {
  soort: 'gratis',
  startbedragCent: 0,
  maandbedragCent: 2450,
  inbegrepen: 'hosting, onderhoud, updates en kleine wijzigingen',
  bedrijfsnaam: '',
  telefoon: '',
};

const STANDAARD_PROVISIE: Provisie = { perOpdrachtCent: 5000, mrrPercentage: 10 };

/** Alle instellingen in één keer uit de tabel, als map. */
function opgeslagenWaarden(): Map<string, string> {
  const rijen = db().prepare('SELECT sleutel, waarde FROM instellingen').all() as
    unknown as { sleutel: string; waarde: string }[];
  return new Map(rijen.map((rij) => [rij.sleutel, rij.waarde]));
}

export function leesProvisie(): Provisie {
  const opgeslagen = opgeslagenWaarden();
  const getal = (sleutel: string, standaard: number, max = Infinity): number => {
    const waarde = Number(opgeslagen.get(sleutel));
    return Number.isFinite(waarde) && waarde >= 0 && waarde <= max ? waarde : standaard;
  };
  return {
    perOpdrachtCent: getal('provisie_per_opdracht_cent', STANDAARD_PROVISIE.perOpdrachtCent),
    mrrPercentage: getal('provisie_mrr_percentage', STANDAARD_PROVISIE.mrrPercentage, 100),
  };
}

export function bewaarProvisie(nieuw: Partial<Provisie>): Provisie {
  const zet = db().prepare(`
    INSERT INTO instellingen (sleutel, waarde, bijgewerkt_op) VALUES (?, ?, datetime('now'))
    ON CONFLICT(sleutel) DO UPDATE SET waarde = excluded.waarde, bijgewerkt_op = datetime('now')
  `);
  if (nieuw.perOpdrachtCent !== undefined) {
    zet.run('provisie_per_opdracht_cent', String(Math.max(0, Math.round(nieuw.perOpdrachtCent))));
  }
  if (nieuw.mrrPercentage !== undefined) {
    zet.run('provisie_mrr_percentage', String(Math.min(100, Math.max(0, Math.round(nieuw.mrrPercentage)))));
  }
  return leesProvisie();
}

/** Wat een agent aan één regel uit het teamoverzicht verdient. */
export function provisieVan(
  regel: { opdrachten: number; mrr_cent: number }, provisie = leesProvisie(),
): { eenmaligCent: number; perMaandCent: number } {
  return {
    eenmaligCent: regel.opdrachten * provisie.perOpdrachtCent,
    perMaandCent: Math.round((regel.mrr_cent * provisie.mrrPercentage) / 100),
  };
}

export function leesAanbod(): Aanbod {
  const rijen = db().prepare('SELECT sleutel, waarde FROM instellingen').all() as
    unknown as { sleutel: string; waarde: string }[];
  const opgeslagen = new Map(rijen.map((rij) => [rij.sleutel, rij.waarde]));
  const getal = (sleutel: string, standaard: number): number => {
    const waarde = Number(opgeslagen.get(sleutel));
    return Number.isFinite(waarde) && waarde >= 0 ? waarde : standaard;
  };
  const soort = opgeslagen.get('aanbod_soort');
  return {
    soort: soort === 'startbedrag' ? 'startbedrag' : 'gratis',
    startbedragCent: getal('aanbod_startbedrag_cent', STANDAARD.startbedragCent),
    maandbedragCent: getal('aanbod_maandbedrag_cent', STANDAARD.maandbedragCent),
    inbegrepen: opgeslagen.get('aanbod_inbegrepen') ?? STANDAARD.inbegrepen,
    bedrijfsnaam: opgeslagen.get('bedrijfsnaam') ?? STANDAARD.bedrijfsnaam,
    telefoon: opgeslagen.get('telefoon') ?? STANDAARD.telefoon,
  };
}

export function bewaarAanbod(nieuw: Partial<Aanbod>): Aanbod {
  const paren: [string, string][] = [];
  if (nieuw.soort) paren.push(['aanbod_soort', nieuw.soort]);
  if (nieuw.startbedragCent !== undefined) paren.push(['aanbod_startbedrag_cent', String(Math.round(nieuw.startbedragCent))]);
  if (nieuw.maandbedragCent !== undefined) paren.push(['aanbod_maandbedrag_cent', String(Math.round(nieuw.maandbedragCent))]);
  if (nieuw.inbegrepen !== undefined) paren.push(['aanbod_inbegrepen', nieuw.inbegrepen.trim()]);
  if (nieuw.bedrijfsnaam !== undefined) paren.push(['bedrijfsnaam', nieuw.bedrijfsnaam.trim()]);
  if (nieuw.telefoon !== undefined) paren.push(['telefoon', nieuw.telefoon.trim()]);

  const zet = db().prepare(`
    INSERT INTO instellingen (sleutel, waarde, bijgewerkt_op) VALUES (?, ?, datetime('now'))
    ON CONFLICT(sleutel) DO UPDATE SET waarde = excluded.waarde, bijgewerkt_op = datetime('now')
  `);
  for (const [sleutel, waarde] of paren) zet.run(sleutel, waarde);
  return leesAanbod();
}

const euro = (cent: number): string =>
  `€ ${(cent / 100).toFixed(2).replace('.', ',').replace(/,00$/, ',-')}`;

/** De zin die in elke mail het aanbod uitlegt. */
export function aanbodTekst(aanbod: Aanbod): string {
  if (aanbod.soort === 'startbedrag') {
    return `Mijn voorstel: ik bouw uw website opnieuw op voor eenmalig ${euro(aanbod.startbedragCent)}. ` +
      `Daarna staat hij op onze eigen hosting voor ${euro(aanbod.maandbedragCent)} per maand, ` +
      `inclusief ${aanbod.inbegrepen}. Geen contract — u kunt maandelijks stoppen en krijgt alle bestanden mee. ` +
      `U ziet de nieuwe site eerst, en betaalt pas als u tevreden bent.`;
  }
  return 'Mijn voorstel is simpel: ik bouw uw website kosteloos opnieuw op en zet hem op onze eigen hosting. ' +
    'U betaalt vooraf niets en zit nergens aan vast. Bevalt het niet, dan stopt het daar en houdt u gewoon uw huidige site.';
}
