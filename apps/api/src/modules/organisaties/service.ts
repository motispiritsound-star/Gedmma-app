/**
 * Organisaties, administraties en toegang.
 *
 * Bij het aanmaken van een organisatie of administratie genereert de applicatie
 * het id zelf en zet dat als tenantcontext voordat er wordt ingevoegd. Daardoor
 * klopt de row-level security-policy ook bij het aanmaken en hoeft er nergens
 * een uitzondering op de isolatie te bestaan.
 */
import { randomUUID } from 'node:crypto';
import { sjabloonVoor, type RekeningSjabloon } from '@gedmma/accounting';
import { inTransactie, type Db, type TenantContext } from '../../db/pool.ts';
import { ApiFout, fout } from '../../http/fout.ts';
import { auditeer } from '../audit/service.ts';
import { STANDAARD_BTWCODES } from '../btw/codes.ts';

export type Organisatie = {
  id: string;
  naam: string;
  kvk_nummer: string | null;
  land: string;
  abonnement: string;
  status: string;
};

export type Administratie = {
  id: string;
  organization_id: string;
  naam: string;
  rechtsvorm: string;
  kvk_nummer: string | null;
  btw_nummer: string | null;
  adres: string | null;
  postcode_plaats: string | null;
  land: string;
  email: string | null;
  telefoon: string | null;
  iban: string | null;
  valuta: string;
  schema_sjabloon: string;
  locale: string;
  geblokkeerd_tot: string | null;
  betalingsverschil_tolerantie: string;
  factuur_voettekst: string | null;
  huisstijl_kleur: string | null;
  ai_ingeschakeld: boolean;
  status: string;
};

/** Grenzen per abonnement. Zie docs/functional-requirements.md (S-03). */
export const ABONNEMENTSGRENZEN: Record<string, { administraties: number | null; gebruikers: number | null; opslagBytes: number | null }> = {
  starter: { administraties: 1, gebruikers: 1, opslagBytes: 1_000_000_000 },
  zzp: { administraties: 1, gebruikers: 2, opslagBytes: 5_000_000_000 },
  mkb: { administraties: 3, gebruikers: 10, opslagBytes: 25_000_000_000 },
  professional: { administraties: 10, gebruikers: 25, opslagBytes: 100_000_000_000 },
  accountant: { administraties: null, gebruikers: 50, opslagBytes: null },
  enterprise: { administraties: null, gebruikers: null, opslagBytes: null },
};

export async function maakOrganisatie(
  gebruikerId: string,
  invoer: { naam: string; kvkNummer?: string | null; land?: string; abonnement?: string },
): Promise<{ organisatieId: string; membershipId: string }> {
  const organisatieId = randomUUID();
  const abonnement = invoer.abonnement ?? 'zzp';
  const grenzen = ABONNEMENTSGRENZEN[abonnement] ?? ABONNEMENTSGRENZEN.zzp!;

  const context: TenantContext = {
    organisatieId,
    administratieId: null,
    gebruikerId,
    actorSoort: 'gebruiker',
  };

  return inTransactie(context, async (client) => {
    await client.query(
      `INSERT INTO organization (id, naam, kvk_nummer, land, abonnement, max_administraties, max_gebruikers, max_opslag_bytes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        organisatieId,
        invoer.naam.trim(),
        invoer.kvkNummer ?? null,
        invoer.land ?? 'NL',
        abonnement,
        grenzen.administraties,
        grenzen.gebruikers,
        grenzen.opslagBytes,
      ],
    );

    const rolId = await rolIdVoorSleutel(client, 'owner');
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO membership (user_id, organization_id, role_id, status)
       VALUES ($1, $2, $3, 'actief') RETURNING id`,
      [gebruikerId, organisatieId, rolId],
    );

    await auditeer(client, context, {
      actie: 'organisatie.aangemaakt',
      onderwerpSoort: 'organization',
      onderwerpId: organisatieId,
      gegevens: { naam: invoer.naam, abonnement },
    });

    return { organisatieId, membershipId: rows[0]?.id ?? '' };
  });
}

async function rolIdVoorSleutel(client: Db, sleutel: string): Promise<string> {
  const { rows } = await client.query<{ id: string }>(
    'SELECT id FROM role WHERE sleutel = $1 AND organization_id IS NULL',
    [sleutel],
  );
  const id = rows[0]?.id;
  if (!id) throw new Error(`Ingebouwde rol ${sleutel} ontbreekt; draai "npm run db:seed".`);
  return id;
}

export type NieuweAdministratie = {
  naam: string;
  rechtsvorm?: string;
  schemaSjabloon?: 'zzp' | 'bv' | 'stichting' | 'vereniging';
  valuta?: string;
  kvkNummer?: string | null;
  btwNummer?: string | null;
  adres?: string | null;
  postcodePlaats?: string | null;
  email?: string | null;
  telefoon?: string | null;
  iban?: string | null;
  /** Eerste boekjaar; standaard het kalenderjaar van vandaag. */
  boekjaarBegint?: string;
  boekjaarEindigt?: string;
};

/**
 * Maakt een administratie inclusief rekeningschema, btw-codes, dagboeken,
 * boekjaar en perioden. Alles in een transactie: een half opgezette
 * administratie bestaat niet.
 */
export async function maakAdministratie(
  context: TenantContext & { organisatieId: string },
  invoer: NieuweAdministratie,
): Promise<{ administratieId: string }> {
  const administratieId = randomUUID();
  const sjabloonSleutel = invoer.schemaSjabloon ?? 'zzp';
  const sjabloon = sjabloonVoor(sjabloonSleutel);
  const valuta = (invoer.valuta ?? 'EUR').toUpperCase();

  const vandaag = new Date();
  const begint = invoer.boekjaarBegint ?? `${vandaag.getUTCFullYear()}-01-01`;
  const eindigt = invoer.boekjaarEindigt ?? `${vandaag.getUTCFullYear()}-12-31`;

  const werkContext: TenantContext = { ...context, administratieId };

  return inTransactie(werkContext, async (client) => {
    const grens = await client.query<{ max_administraties: number | null; aantal: string }>(
      `SELECT o.max_administraties,
              (SELECT count(*)::text FROM administration a WHERE a.organization_id = o.id) AS aantal
         FROM organization o WHERE o.id = $1`,
      [context.organisatieId],
    );
    const rij = grens.rows[0];
    if (rij?.max_administraties !== null && rij?.max_administraties !== undefined) {
      if (Number(rij.aantal) >= rij.max_administraties) {
        throw fout.limiet('het aantal administraties');
      }
    }

    await client.query(
      `INSERT INTO administration
         (id, organization_id, naam, rechtsvorm, kvk_nummer, btw_nummer, adres, postcode_plaats,
          email, telefoon, iban, valuta, schema_sjabloon)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        administratieId,
        context.organisatieId,
        invoer.naam.trim(),
        invoer.rechtsvorm ?? sjabloonSleutel,
        invoer.kvkNummer ?? null,
        invoer.btwNummer ?? null,
        invoer.adres ?? null,
        invoer.postcodePlaats ?? null,
        invoer.email ?? null,
        invoer.telefoon ?? null,
        invoer.iban ?? null,
        valuta,
        sjabloonSleutel,
      ],
    );

    const rekeningIds = await maakRekeningschema(client, administratieId, sjabloon.rekeningen);
    await maakBtwCodes(client, administratieId, rekeningIds);
    await koppelStandaardBtwAanRekeningen(client, administratieId, sjabloon.rekeningen);
    await maakDagboeken(client, administratieId, rekeningIds);
    await maakBoekjaar(client, administratieId, begint, eindigt);
    await maakBankrekening(client, administratieId, invoer.iban ?? null, valuta, rekeningIds);
    await maakStandaardBewaartermijnen(client, context.organisatieId, administratieId);

    await auditeer(client, werkContext, {
      actie: 'administratie.aangemaakt',
      onderwerpSoort: 'administration',
      onderwerpId: administratieId,
      gegevens: { naam: invoer.naam, sjabloon: sjabloonSleutel, valuta, boekjaar: `${begint}/${eindigt}` },
    });

    return { administratieId };
  });
}

async function maakRekeningschema(
  client: Db,
  administratieId: string,
  rekeningen: readonly RekeningSjabloon[],
): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const rekening of rekeningen) {
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO ledger_account
         (administration_id, code, naam, soort, rubriek, rol, btw_standaard, rgs_code, uitleg)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [
        administratieId,
        rekening.code,
        rekening.naam,
        rekening.soort,
        rekening.rubriek,
        rekening.rol ?? null,
        rekening.btwStandaard ?? null,
        rekening.rgs ?? null,
        rekening.uitleg ?? null,
      ],
    );
    ids.set(rekening.code, rows[0]?.id ?? '');
  }
  return ids;
}

async function maakBtwCodes(client: Db, administratieId: string, rekeningIds: Map<string, string>): Promise<void> {
  for (const code of STANDAARD_BTWCODES) {
    await client.query(
      `INSERT INTO tax_code
         (administration_id, code, naam, soort, tarief, vak, verlegd, ic_levering,
          geldig_vanaf, geldig_tot, btw_rekening_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        administratieId,
        code.code,
        code.naam,
        code.soort,
        code.tarief,
        code.vak,
        code.verlegd,
        code.icLevering,
        code.geldigVanaf,
        code.geldigTot,
        code.rekeningCode ? (rekeningIds.get(code.rekeningCode) ?? null) : null,
      ],
    );
  }
}

/** Zet de standaard-btw-code per rekening om naar een verwijzing. */
async function koppelStandaardBtwAanRekeningen(
  client: Db,
  administratieId: string,
  rekeningen: readonly RekeningSjabloon[],
): Promise<void> {
  const gebruikt = new Set(rekeningen.map((r) => r.btwStandaard).filter(Boolean) as string[]);
  for (const code of gebruikt) {
    const { rows } = await client.query<{ id: string }>(
      `SELECT id FROM tax_code WHERE administration_id = $1 AND code = $2 ORDER BY geldig_vanaf DESC LIMIT 1`,
      [administratieId, code],
    );
    if (rows.length === 0) {
      throw new Error(`Rekeningschema verwijst naar onbekende btw-code ${code}.`);
    }
  }
}

async function maakDagboeken(client: Db, administratieId: string, rekeningIds: Map<string, string>): Promise<void> {
  const dagboeken: { code: string; naam: string; soort: string; rekeningCode?: string }[] = [
    { code: 'VRK', naam: 'Verkoop', soort: 'verkoop' },
    { code: 'INK', naam: 'Inkoop', soort: 'inkoop' },
    { code: 'BNK', naam: 'Bank', soort: 'bank', rekeningCode: '1100' },
    { code: 'KAS', naam: 'Kas', soort: 'kas', rekeningCode: '1000' },
    { code: 'MEM', naam: 'Memoriaal', soort: 'memoriaal' },
    { code: 'OPEN', naam: 'Openingsbalans', soort: 'opening' },
  ];
  for (const dagboek of dagboeken) {
    await client.query(
      `INSERT INTO journal (administration_id, code, naam, soort, ledger_account_id)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        administratieId,
        dagboek.code,
        dagboek.naam,
        dagboek.soort,
        dagboek.rekeningCode ? (rekeningIds.get(dagboek.rekeningCode) ?? null) : null,
      ],
    );
  }
}

/**
 * Maakt een boekjaar met maandperioden. Een gebroken boekjaar krijgt evenveel
 * perioden als het maanden beslaat, met de juiste begin- en einddatums.
 */
export async function maakBoekjaar(
  client: Db,
  administratieId: string,
  begint: string,
  eindigt: string,
): Promise<string> {
  const naam = begint.slice(0, 4) === eindigt.slice(0, 4) ? begint.slice(0, 4) : `${begint.slice(0, 4)}/${eindigt.slice(0, 4)}`;
  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO fiscal_year (administration_id, naam, begint_op, eindigt_op)
     VALUES ($1,$2,$3,$4) RETURNING id`,
    [administratieId, naam, begint, eindigt],
  );
  const boekjaarId = rows[0]?.id ?? '';

  const start = new Date(`${begint}T00:00:00Z`);
  const einde = new Date(`${eindigt}T00:00:00Z`);
  let nummer = 1;
  let periodeStart = start;

  while (periodeStart <= einde && nummer <= 24) {
    const volgendeMaand = new Date(Date.UTC(periodeStart.getUTCFullYear(), periodeStart.getUTCMonth() + 1, 1));
    const periodeEinde = new Date(Math.min(volgendeMaand.getTime() - 86_400_000, einde.getTime()));
    const maandNaam = new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(periodeStart);

    await client.query(
      `INSERT INTO accounting_period
         (administration_id, fiscal_year_id, nummer, naam, begint_op, eindigt_op)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        administratieId,
        boekjaarId,
        nummer,
        maandNaam,
        periodeStart.toISOString().slice(0, 10),
        periodeEinde.toISOString().slice(0, 10),
      ],
    );

    nummer += 1;
    periodeStart = volgendeMaand;
  }

  return boekjaarId;
}

async function maakBankrekening(
  client: Db,
  administratieId: string,
  iban: string | null,
  valuta: string,
  rekeningIds: Map<string, string>,
): Promise<void> {
  const grootboek = rekeningIds.get('1100');
  if (!grootboek) return;
  const { rows } = await client.query<{ id: string }>(
    `SELECT id FROM journal WHERE administration_id = $1 AND code = 'BNK'`,
    [administratieId],
  );
  await client.query(
    `INSERT INTO bank_account (administration_id, naam, iban, valuta, ledger_account_id, journal_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [administratieId, 'Zakelijke rekening', iban, valuta, grootboek, rows[0]?.id ?? null],
  );
}

/**
 * Standaard bewaartermijnen. De algemene Nederlandse fiscale bewaarplicht is
 * zeven jaar; voor gegevens over onroerende zaken tien. Zie
 * docs/data-retention-policy.md en docs/legal-source-register.md voor de bron
 * en de datum van raadpleging.
 */
async function maakStandaardBewaartermijnen(
  client: Db,
  organisatieId: string,
  administratieId: string,
): Promise<void> {
  const termijnen: { categorie: string; maanden: number; grondslag: string; actie: string }[] = [
    { categorie: 'financiele_administratie', maanden: 84, grondslag: 'Fiscale bewaarplicht basisgegevens', actie: 'archiveren' },
    { categorie: 'onroerende_zaken', maanden: 120, grondslag: 'Herzieningstermijn onroerende zaken', actie: 'archiveren' },
    { categorie: 'documenten_inkoop', maanden: 84, grondslag: 'Bewijsstuk bij de administratie', actie: 'archiveren' },
    { categorie: 'auditlog_financieel', maanden: 84, grondslag: 'Controleerbaarheid van de administratie', actie: 'archiveren' },
    { categorie: 'auditlog_technisch', maanden: 12, grondslag: 'Beveiliging en foutopsporing', actie: 'verwijderen' },
    { categorie: 'sessies_en_apparaten', maanden: 12, grondslag: 'Beveiliging', actie: 'verwijderen' },
    { categorie: 'supportdossier', maanden: 24, grondslag: 'Uitvoering van de overeenkomst', actie: 'pseudonimiseren' },
  ];
  for (const termijn of termijnen) {
    await client.query(
      `INSERT INTO retention_policy
         (organization_id, administration_id, categorie, bewaartermijn_maanden, grondslag, actie_na_afloop)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [organisatieId, administratieId, termijn.categorie, termijn.maanden, termijn.grondslag, termijn.actie],
    );
  }
}

/** De organisaties waar een gebruiker lid van is, met de administraties erbij. */
export async function organisatiesVan(
  gebruikerId: string,
): Promise<{ organisatie: Organisatie; rol: string; administraties: { id: string; naam: string }[] }[]> {
  return inTransactie(
    { organisatieId: null, administratieId: null, gebruikerId, actorSoort: 'gebruiker' },
    async (client) => {
      const { rows } = await client.query<{
        id: string;
        naam: string;
        kvk_nummer: string | null;
        land: string;
        abonnement: string;
        status: string;
        rol: string;
      }>(
        `SELECT o.id, o.naam, o.kvk_nummer, o.land, o.abonnement, o.status, r.sleutel AS rol
           FROM organization o
           JOIN membership m ON m.organization_id = o.id
           JOIN role r ON r.id = m.role_id
          WHERE m.user_id = $1 AND m.status = 'actief'
          ORDER BY o.naam`,
        [gebruikerId],
      );

      const uitkomst = [];
      for (const rij of rows) {
        const administraties = await client.query<{ id: string; naam: string }>(
          `SELECT a.id, a.naam FROM administration a
            WHERE a.organization_id = $1 AND a.status <> 'gearchiveerd'
            ORDER BY a.naam`,
          [rij.id],
        );
        uitkomst.push({
          organisatie: {
            id: rij.id,
            naam: rij.naam,
            kvk_nummer: rij.kvk_nummer,
            land: rij.land,
            abonnement: rij.abonnement,
            status: rij.status,
          },
          rol: rij.rol,
          administraties: administraties.rows,
        });
      }
      return uitkomst;
    },
  );
}

/**
 * Bepaalt de rechten van een gebruiker in een administratie. Levert null als de
 * gebruiker er niets te zoeken heeft — de aanroeper vertaalt dat naar een 404,
 * zodat het bestaan van de administratie niet afleidbaar is.
 */
export async function toegangVan(
  gebruikerId: string,
  administratieId: string,
): Promise<{ organisatieId: string; rolSleutel: string; rechten: Set<string> } | null> {
  return inTransactie(
    { organisatieId: null, administratieId: null, gebruikerId, actorSoort: 'gebruiker' },
    async (client) => {
      const { rows } = await client.query<{
        organization_id: string;
        membership_id: string;
        membership_rol: string;
        toegang_rol: string | null;
        geldig_tot: Date | null;
        heeft_beperking: boolean;
      }>(
        `SELECT a.organization_id,
                m.id AS membership_id,
                mr.sleutel AS membership_rol,
                ar.sleutel AS toegang_rol,
                aa.geldig_tot,
                EXISTS (SELECT 1 FROM administration_access x WHERE x.membership_id = m.id) AS heeft_beperking
           FROM administration a
           JOIN membership m ON m.organization_id = a.organization_id AND m.user_id = $1 AND m.status = 'actief'
           JOIN role mr ON mr.id = m.role_id
           LEFT JOIN administration_access aa ON aa.membership_id = m.id AND aa.administration_id = a.id
           LEFT JOIN role ar ON ar.id = aa.role_id
          WHERE a.id = $2 AND a.status <> 'gearchiveerd'`,
        [gebruikerId, administratieId],
      );
      const rij = rows[0];
      if (!rij) return null;

      // Is de toegang beperkt tot bepaalde administraties, dan moet er een rij
      // zijn voor juist deze administratie, en mag hij niet verlopen zijn.
      if (rij.heeft_beperking) {
        if (!rij.toegang_rol && rij.geldig_tot === null && rij.toegang_rol === null) {
          const heeftRij = await client.query(
            `SELECT 1 FROM administration_access aa
              WHERE aa.membership_id = $1 AND aa.administration_id = $2`,
            [rij.membership_id, administratieId],
          );
          if (heeftRij.rowCount === 0) return null;
        }
        if (rij.geldig_tot && rij.geldig_tot.getTime() < Date.now()) return null;
      }

      const rolSleutel = rij.toegang_rol ?? rij.membership_rol;
      const rechten = await client.query<{ permission_sleutel: string }>(
        `SELECT rp.permission_sleutel
           FROM role r JOIN role_permission rp ON rp.role_id = r.id
          WHERE r.sleutel = $1 AND r.organization_id IS NULL`,
        [rolSleutel],
      );

      return {
        organisatieId: rij.organization_id,
        rolSleutel,
        rechten: new Set(rechten.rows.map((r) => r.permission_sleutel)),
      };
    },
  );
}

/** Haalt de administratie op binnen de actieve context. */
export async function leesAdministratie(client: Db, administratieId: string): Promise<Administratie> {
  const { rows } = await client.query<Administratie>(
    `SELECT id, organization_id, naam, rechtsvorm, kvk_nummer, btw_nummer, adres, postcode_plaats,
            land, email, telefoon, iban, valuta, schema_sjabloon, locale,
            geblokkeerd_tot::text AS geblokkeerd_tot, betalingsverschil_tolerantie::text AS betalingsverschil_tolerantie,
            factuur_voettekst, huisstijl_kleur, ai_ingeschakeld, status
       FROM administration WHERE id = $1`,
    [administratieId],
  );
  const rij = rows[0];
  if (!rij) throw fout.nietGevonden('Deze administratie');
  return rij;
}

/** Weigert schrijfacties als de administratie alleen-lezen is. */
export function eisSchrijfbaar(administratie: Administratie): void {
  if (administratie.status !== 'actief') {
    throw new ApiFout(
      'forbidden',
      'Deze administratie staat op alleen lezen.',
      'Je kunt gegevens bekijken en exporteren, maar niets meer wijzigen. Neem contact op met de beheerder van de organisatie.',
    );
  }
}
