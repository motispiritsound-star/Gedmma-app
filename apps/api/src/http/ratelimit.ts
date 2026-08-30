/**
 * Snelheidsbegrenzing per sleutel (IP, gebruiker, endpoint).
 *
 * De teller staat in de database, zodat hij ook klopt als er meerdere instanties
 * draaien. Voor de zwaarste paden (login) is dat belangrijker dan de extra query.
 */
import { db } from '../db/pool.ts';
import { fout } from './fout.ts';

export type Limiet = { aantal: number; vensterSeconden: number };

export const LIMIETEN = {
  aanmelden: { aantal: 10, vensterSeconden: 900 },
  aanmeldenPerAccount: { aantal: 5, vensterSeconden: 900 },
  registreren: { aantal: 5, vensterSeconden: 3600 },
  schrijven: { aantal: 120, vensterSeconden: 60 },
  lezen: { aantal: 600, vensterSeconden: 60 },
  export: { aantal: 30, vensterSeconden: 60 },
} as const satisfies Record<string, Limiet>;

export type Uitkomst = { toegestaan: boolean; over: number; herstelNa: number };

/**
 * Telt een verzoek en zegt of het mag. Het venster is vast (geen sliding window):
 * eenvoudig, voorspelbaar, en voor misbruikbestrijding voldoende.
 */
export async function tel(sleutel: string, limiet: Limiet): Promise<Uitkomst> {
  const { rows } = await db().query<{ teller: number; venster_tot: Date }>(
    `INSERT INTO rate_limit (sleutel, teller, venster_tot)
     VALUES ($1, 1, now() + make_interval(secs => $2))
     ON CONFLICT (sleutel) DO UPDATE SET
       teller = CASE WHEN rate_limit.venster_tot < now() THEN 1 ELSE rate_limit.teller + 1 END,
       venster_tot = CASE WHEN rate_limit.venster_tot < now()
                          THEN now() + make_interval(secs => $2)
                          ELSE rate_limit.venster_tot END
     RETURNING teller, venster_tot`,
    [sleutel, limiet.vensterSeconden],
  );
  const rij = rows[0];
  const teller = Number(rij?.teller ?? 1);
  const herstelNa = Math.max(0, Math.ceil(((rij?.venster_tot?.getTime() ?? Date.now()) - Date.now()) / 1000));
  return { toegestaan: teller <= limiet.aantal, over: Math.max(0, limiet.aantal - teller), herstelNa };
}

/** Telt en gooit meteen als de grens is bereikt. */
export async function eisRuimte(sleutel: string, limiet: Limiet): Promise<Uitkomst> {
  const uitkomst = await tel(sleutel, limiet);
  if (!uitkomst.toegestaan) throw fout.teVeel(uitkomst.herstelNa);
  return uitkomst;
}

/** Zet de teller terug, bijvoorbeeld na een geslaagde aanmelding. */
export async function reset(sleutel: string): Promise<void> {
  await db().query('DELETE FROM rate_limit WHERE sleutel = $1', [sleutel]);
}
