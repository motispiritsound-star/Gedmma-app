import { db } from './index.ts';

/**
 * Rechtsvormen en of ze onder de telemarketingregels vallen.
 *
 * Sinds 1 juli 2026 geldt in Nederland een opt-in voor telemarketing aan
 * natuurlijke personen. Daar vallen ook eenmanszaken, vof's, maatschappen en
 * cv's onder — precies de groep die dit soort leads grotendeels vormt. Bellen
 * mag dan alleen met aantoonbare voorafgaande toestemming; de bewijslast ligt
 * bij degene die belt. Voor rechtspersonen (bv, nv, stichting, vereniging,
 * coöperatie) verandert er niets: die mag je gewoon bellen.
 *
 * Dit is geen juridisch advies. Laat je opzet toetsen voordat je begint.
 */
export const RECHTSVORMEN = [
  { id: 'bv',           label: 'Besloten vennootschap',  natuurlijkPersoon: false },
  { id: 'nv',           label: 'Naamloze vennootschap',  natuurlijkPersoon: false },
  { id: 'stichting',    label: 'Stichting',              natuurlijkPersoon: false },
  { id: 'vereniging',   label: 'Vereniging',             natuurlijkPersoon: false },
  { id: 'cooperatie',   label: 'Coöperatie',             natuurlijkPersoon: false },
  { id: 'eenmanszaak',  label: 'Eenmanszaak',            natuurlijkPersoon: true },
  { id: 'vof',          label: 'Vennootschap onder firma', natuurlijkPersoon: true },
  { id: 'maatschap',    label: 'Maatschap',              natuurlijkPersoon: true },
  { id: 'cv',           label: 'Commanditaire vennootschap', natuurlijkPersoon: true },
] as const;

export type RechtsvormId = (typeof RECHTSVORMEN)[number]['id'];

const OP_ID = new Map(RECHTSVORMEN.map((vorm) => [vorm.id, vorm]));

/** Herkent de rechtsvorm in vrije tekst, zoals die uit de KVK of een CSV komt. */
export function herkenRechtsvorm(tekst: string | null | undefined): RechtsvormId | null {
  if (!tekst) return null;
  const schoon = tekst.toLowerCase().replace(/[.\s-]/g, '');
  if (/beslotenvennootschap|^bv$|\bbv\b/.test(schoon)) return 'bv';
  if (/naamlozevennootschap|^nv$/.test(schoon)) return 'nv';
  if (/stichting/.test(schoon)) return 'stichting';
  if (/vereniging/.test(schoon)) return 'vereniging';
  if (/cooperatie|coöperatie/.test(schoon)) return 'cooperatie';
  if (/eenmanszaak|zzp/.test(schoon)) return 'eenmanszaak';
  if (/vennootschaponderfirma|^vof$/.test(schoon)) return 'vof';
  if (/maatschap/.test(schoon)) return 'maatschap';
  if (/commanditairevennootschap|^cv$/.test(schoon)) return 'cv';
  return null;
}

export type Benaderregels = {
  bel_toestemming: number;
  toestemming_op: string | null;
  toestemming_via: string | null;
  toestemming_bewijs: string | null;
  geblokkeerd: number;
  geblokkeerd_op: string | null;
  geblokkeerd_reden: string | null;
};

export type Oordeel = {
  mag: boolean;
  reden: string;
  /** Wat je moet doen om het wél te mogen. */
  route?: string;
};

/**
 * Mag dit bedrijf gebeld worden? Bij twijfel is het antwoord nee — een boete
 * van de ACM loopt op tot 900.000 euro of 1% van de jaaromzet.
 */
export function magBellen(bedrijf: {
  rechtsvorm?: string | null; bel_toestemming?: number | null; geblokkeerd?: number | null;
}): Oordeel {
  if (bedrijf.geblokkeerd) {
    return { mag: false, reden: 'Dit bedrijf heeft aangegeven niet benaderd te willen worden.' };
  }
  if (bedrijf.bel_toestemming) {
    return { mag: true, reden: 'Toestemming om te bellen is vastgelegd.' };
  }

  const vorm = bedrijf.rechtsvorm ? OP_ID.get(bedrijf.rechtsvorm as RechtsvormId) : undefined;
  if (!vorm) {
    return {
      mag: false,
      reden: 'De rechtsvorm is onbekend, dus we weten niet of bellen mag.',
      route: 'Zoek de rechtsvorm op in het KVK-register, of vraag eerst per mail om toestemming.',
    };
  }
  if (vorm.natuurlijkPersoon) {
    return {
      mag: false,
      reden: `Een ${vorm.label.toLowerCase()} valt onder de telemarketingregels: bellen mag alleen met vooraf gegeven toestemming.`,
      route: 'Mail eerst en vraag om toestemming; leg het antwoord hieronder vast.',
    };
  }
  return { mag: true, reden: `Een ${vorm.label.toLowerCase()} is een rechtspersoon; die mag je zakelijk bellen.` };
}

/** Mailen mag zakelijk wel, zolang het bedrijf zich niet heeft afgemeld. */
export function magMailen(bedrijf: { geblokkeerd?: number | null }): Oordeel {
  return bedrijf.geblokkeerd
    ? { mag: false, reden: 'Dit bedrijf heeft aangegeven niet benaderd te willen worden.' }
    : { mag: true, reden: 'Zakelijke mail mag, met een afmeldmogelijkheid in elk bericht.' };
}

// --- vastleggen -------------------------------------------------------------

const zorgVoorRij = (companyId: number): void => {
  db().prepare('INSERT OR IGNORE INTO benaderregels (company_id) VALUES (?)').run(companyId);
};

export function legToestemmingVast(companyId: number, input: {
  via: string; bewijs: string; door?: number | null;
}): void {
  if (!input.bewijs?.trim()) {
    throw new Error('Noteer waar de toestemming uit blijkt — bij een controle moet je het kunnen aantonen.');
  }
  zorgVoorRij(companyId);
  db().prepare(`
    UPDATE benaderregels SET bel_toestemming = 1, toestemming_op = datetime('now'),
      toestemming_via = ?, toestemming_bewijs = ?, toestemming_door = ?
    WHERE company_id = ?
  `).run(input.via, input.bewijs.trim(), input.door ?? null, companyId);
}

export function trekToestemmingIn(companyId: number): void {
  zorgVoorRij(companyId);
  db().prepare(`
    UPDATE benaderregels SET bel_toestemming = 0, toestemming_op = NULL,
      toestemming_via = NULL, toestemming_bewijs = NULL WHERE company_id = ?
  `).run(companyId);
}

/** Zet een bedrijf op de niet-benaderen-lijst. Geldt voor iedereen, voorgoed. */
export function blokkeer(companyId: number, reden: string, door?: number | null): void {
  zorgVoorRij(companyId);
  db().prepare(`
    UPDATE benaderregels SET geblokkeerd = 1, geblokkeerd_op = datetime('now'),
      geblokkeerd_reden = ?, geblokkeerd_door = ?, bel_toestemming = 0
    WHERE company_id = ?
  `).run(reden || 'op eigen verzoek', door ?? null, companyId);
}

export function deblokkeer(companyId: number): void {
  db().prepare("UPDATE benaderregels SET geblokkeerd = 0, geblokkeerd_op = NULL, geblokkeerd_reden = NULL WHERE company_id = ?")
    .run(companyId);
}

export const benaderregels = (companyId: number): Benaderregels | null =>
  (db().prepare('SELECT * FROM benaderregels WHERE company_id = ?').get(companyId) ?? null) as never;

export function zetRechtsvorm(companyId: number, rechtsvorm: RechtsvormId | null): void {
  db().prepare('UPDATE companies SET rechtsvorm = ? WHERE id = ?').run(rechtsvorm, companyId);
}

/** Cijfers voor het dashboard: hoeveel mag je bellen, hoeveel alleen mailen. */
export function benaderbaarheid(): { magBellen: number; alleenMailen: number; onbekend: number; geblokkeerd: number } {
  const rechtspersonen = RECHTSVORMEN.filter((vorm) => !vorm.natuurlijkPersoon).map((vorm) => `'${vorm.id}'`).join(',');
  const natuurlijk = RECHTSVORMEN.filter((vorm) => vorm.natuurlijkPersoon).map((vorm) => `'${vorm.id}'`).join(',');
  const rij = db().prepare(`
    SELECT
      SUM(CASE WHEN COALESCE(b.geblokkeerd,0) = 0 AND (b.bel_toestemming = 1
            OR c.rechtsvorm IN (${rechtspersonen})) THEN 1 ELSE 0 END) AS bellen,
      SUM(CASE WHEN COALESCE(b.geblokkeerd,0) = 0 AND COALESCE(b.bel_toestemming,0) = 0
            AND c.rechtsvorm IN (${natuurlijk}) THEN 1 ELSE 0 END) AS mailen,
      SUM(CASE WHEN COALESCE(b.geblokkeerd,0) = 0 AND COALESCE(b.bel_toestemming,0) = 0
            AND c.rechtsvorm IS NULL THEN 1 ELSE 0 END) AS onbekend,
      SUM(CASE WHEN COALESCE(b.geblokkeerd,0) = 1 THEN 1 ELSE 0 END) AS geblokkeerd
    FROM companies c LEFT JOIN benaderregels b ON b.company_id = c.id
  `).get() as Record<string, number | null>;
  return {
    magBellen: Number(rij.bellen ?? 0),
    alleenMailen: Number(rij.mailen ?? 0),
    onbekend: Number(rij.onbekend ?? 0),
    geblokkeerd: Number(rij.geblokkeerd ?? 0),
  };
}
