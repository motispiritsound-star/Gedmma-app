/**
 * Wat is de pijplijn waard, en wat komt er aan?
 *
 * Een lijst met duizend leads zegt niets; wat zegt hoeveel er per maand
 * binnenkomt, is: hoeveel leads staan er in welke fase, hoe vaak wordt zo'n fase
 * uiteindelijk een betalende klant, en wat brengt een klant per maand op.
 *
 * De kansen worden uit je eigen historie gemeten zodra je er genoeg van hebt.
 * Tot die tijd staan er startwaarden die aan de voorzichtige kant zijn — liever
 * een prognose die meevalt dan een die je laat rekenen op geld dat niet komt.
 */
import { db } from './index.ts';
import { FASES, VANAF_OPDRACHT } from './pipeline.ts';
import { leesAanbod } from './instellingen.ts';

/** Startwaarden tot je eigen cijfers genoeg zeggen. */
const START_KANS: Record<string, number> = {
  nieuw: 0.02,
  toegewezen: 0.05,
  gebeld: 0.12,
  geen_gehoor: 0.04,
  afspraak: 0.35,
  opdracht: 0.80,
  in_aanbouw: 0.92,
  live: 0.97,
};

/** Vanaf hoeveel leads in een fase we onze eigen cijfers vertrouwen. */
const GENOEG = 25;

export type FaseKans = {
  fase: string;
  label: string;
  aantal: number;
  kans: number;
  /** 'gemeten' als het uit je eigen historie komt, anders 'startwaarde'. */
  bron: 'gemeten' | 'startwaarde';
  /** Waarop de meting berust: hoeveel leads deze fase ooit bereikten. */
  waargenomen: number;
  verwachteKlanten: number;
  verwachteMrrCent: number;
};

export type Prognose = {
  fases: FaseKans[];
  /** Verwachte extra maandomzet uit alles wat nu in behandeling is. */
  verwachteMrrCent: number;
  verwachteKlanten: number;
  /**
   * Wat er nog onaangeroerd op de plank ligt. Bewust apart: bedrijven waar
   * niemand iets mee doet zijn geen pijplijn maar voorraad, en meetellen zou de
   * prognose laten rekenen op omzet waar nog geen mens aan gewerkt heeft.
   */
  voorraad: { aantal: number; potentieelMrrCent: number };
  /** Wat de pijplijn waard is over twaalf maanden. */
  pijplijnJaarCent: number;
  huidigeMrrCent: number;
  doelMrrCent: number;
  /** Hoeveel maandomzet er nog bij moet om het doel te halen. */
  tekortCent: number;
  /** Hoeveel opdrachten dat nog vraagt bij het huidige maandbedrag. */
  opdrachtenNodig: number;
  maandbedragCent: number;
};

/**
 * Hoe vaak een lead die ooit in deze fase kwam uiteindelijk klant werd.
 * De fasewissels staan in de activiteiten, dus dit is echt gemeten gedrag en
 * geen aanname over hoe het zou moeten gaan.
 */
function gemetenKansen(): Map<string, { kans: number; waargenomen: number }> {
  const rijen = db().prepare(`
    SELECT a.uitkomst AS fase,
           COUNT(DISTINCT a.company_id) AS bereikt,
           COUNT(DISTINCT CASE WHEN k.status IN ('actief','proef') THEN a.company_id END) AS klant
    FROM activiteiten a
    LEFT JOIN klanten k ON k.company_id = a.company_id
    WHERE a.soort = 'fase' AND a.uitkomst IS NOT NULL
    GROUP BY a.uitkomst
  `).all() as unknown as { fase: string; bereikt: number; klant: number }[];

  const uit = new Map<string, { kans: number; waargenomen: number }>();
  for (const rij of rijen) {
    const bereikt = Number(rij.bereikt);
    if (bereikt <= 0) continue;
    uit.set(rij.fase, { kans: Number(rij.klant) / bereikt, waargenomen: bereikt });
  }
  return uit;
}

/** Het doel voor de maandomzet, in centen. Nul betekent: geen doel gesteld. */
export function leesDoel(): number {
  const rij = db().prepare("SELECT waarde FROM instellingen WHERE sleutel = 'doel_mrr_cent'")
    .get() as { waarde: string } | undefined;
  const waarde = Number(rij?.waarde);
  return Number.isFinite(waarde) && waarde >= 0 ? waarde : 0;
}

export function bewaarDoel(centPerMaand: number): number {
  db().prepare(`
    INSERT INTO instellingen (sleutel, waarde, bijgewerkt_op) VALUES ('doel_mrr_cent', ?, datetime('now'))
    ON CONFLICT(sleutel) DO UPDATE SET waarde = excluded.waarde, bijgewerkt_op = datetime('now')
  `).run(String(Math.max(0, Math.round(centPerMaand))));
  return leesDoel();
}

export function prognose(agentId: number | null = null): Prognose {
  const aanbod = leesAanbod();
  const maandbedrag = aanbod.maandbedragCent;
  const gemeten = gemetenKansen();

  const rijen = db().prepare(`
    SELECT COALESCE(o.fase, 'nieuw') AS fase, COUNT(*) AS aantal
    FROM companies c
    LEFT JOIN opvolging o ON o.company_id = c.id
    LEFT JOIN benaderregels b ON b.company_id = c.id
    WHERE c.score IS NOT NULL AND COALESCE(b.geblokkeerd, 0) = 0
      AND (? IS NULL OR o.toegewezen_aan = ?)
    GROUP BY 1
  `).all(agentId, agentId) as unknown as { fase: string; aantal: number }[];
  const perFase = new Map(rijen.map((rij) => [rij.fase, Number(rij.aantal)]));

  const fases: FaseKans[] = [];
  for (const fase of FASES) {
    if (fase.id === 'klant' || fase.id === 'afgewezen') continue;
    const aantal = perFase.get(fase.id) ?? 0;
    const meting = gemeten.get(fase.id);
    const gebruikMeting = meting !== undefined && meting.waargenomen >= GENOEG;
    const kans = gebruikMeting ? meting.kans : (START_KANS[fase.id] ?? 0);
    const verwachteKlanten = aantal * kans;

    fases.push({
      fase: fase.id,
      label: fase.label,
      aantal,
      kans,
      bron: gebruikMeting ? 'gemeten' : 'startwaarde',
      waargenomen: meting?.waargenomen ?? 0,
      verwachteKlanten,
      verwachteMrrCent: Math.round(verwachteKlanten * maandbedrag),
    });
  }

  // Alles vanaf "toegewezen" is pijplijn; "nieuw" is voorraad.
  const inBehandeling = fases.filter((rij) => rij.fase !== 'nieuw');
  const verwachteKlanten = inBehandeling.reduce((som, rij) => som + rij.verwachteKlanten, 0);
  const verwachteMrrCent = inBehandeling.reduce((som, rij) => som + rij.verwachteMrrCent, 0);
  const nieuw = fases.find((rij) => rij.fase === 'nieuw');

  const huidig = db().prepare(
    "SELECT COALESCE(SUM(maandbedrag_cent), 0) AS mrr FROM klanten WHERE status = 'actief'")
    .get() as { mrr: number };
  const huidigeMrrCent = Number(huidig.mrr ?? 0);

  const doelMrrCent = leesDoel();
  const tekortCent = Math.max(0, doelMrrCent - huidigeMrrCent);

  return {
    fases,
    verwachteMrrCent,
    verwachteKlanten,
    voorraad: { aantal: nieuw?.aantal ?? 0, potentieelMrrCent: nieuw?.verwachteMrrCent ?? 0 },
    pijplijnJaarCent: verwachteMrrCent * 12,
    huidigeMrrCent,
    doelMrrCent,
    tekortCent,
    opdrachtenNodig: maandbedrag > 0 ? Math.ceil(tekortCent / maandbedrag) : 0,
    maandbedragCent: maandbedrag,
  };
}

/** Hoeveel opdrachten er per maand binnenkomen, over de laatste zes maanden. */
export function tempo(): { maand: string; opdrachten: number; klanten: number }[] {
  return db().prepare(`
    WITH maanden AS (
      SELECT strftime('%Y-%m', 'now', '-' || n || ' months') AS maand
      FROM (SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5)
    )
    SELECT m.maand,
      (SELECT COUNT(*) FROM activiteiten a
        WHERE a.soort = 'fase' AND a.uitkomst = 'opdracht' AND strftime('%Y-%m', a.op) = m.maand) AS opdrachten,
      (SELECT COUNT(*) FROM klanten k
        WHERE strftime('%Y-%m', k.gestart_op) = m.maand) AS klanten
    FROM maanden m
    ORDER BY m.maand
  `).all() as unknown as { maand: string; opdrachten: number; klanten: number }[];
}

export { VANAF_OPDRACHT };
