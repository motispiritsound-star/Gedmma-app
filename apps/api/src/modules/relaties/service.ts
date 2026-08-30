/** Klanten en leveranciers. */
import type { Db, TenantContext } from '../../db/pool.ts';
import { ApiFout, fout } from '../../http/fout.ts';
import { auditeer } from '../audit/service.ts';
import { volgendNummer } from '../grootboek/repo.ts';

export type ContactRij = {
  id: string;
  nummer: string | null;
  naam: string;
  soort: 'klant' | 'leverancier' | 'beide';
  email: string | null;
  telefoon: string | null;
  website: string | null;
  kvk_nummer: string | null;
  btw_nummer: string | null;
  iban: string | null;
  land: string;
  betalingstermijn_dagen: number;
  kredietlimiet: string | null;
  valuta: string;
  notitie: string | null;
  tags: string[];
  status: string;
  versie: number;
};

export type ContactInvoer = {
  naam: string;
  soort?: 'klant' | 'leverancier' | 'beide';
  email?: string | null;
  telefoon?: string | null;
  website?: string | null;
  kvkNummer?: string | null;
  btwNummer?: string | null;
  iban?: string | null;
  land?: string;
  betalingstermijnDagen?: number;
  kredietlimiet?: string | null;
  valuta?: string;
  notitie?: string | null;
  tags?: string[];
  adres?: { adres?: string; postcode?: string; plaats?: string; land?: string } | null;
};

/** Genormaliseerde naam om dubbele relaties te herkennen. */
export function dedupeSleutel(naam: string): string {
  return naam
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\b(b\.?v\.?|n\.?v\.?|v\.?o\.?f\.?|holding|group|nederland)\b/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export async function zoekMogelijkeDubbelen(
  client: Db,
  administratieId: string,
  naam: string,
  behalveId?: string,
): Promise<{ id: string; naam: string }[]> {
  const { rows } = await client.query<{ id: string; naam: string }>(
    `SELECT id, naam FROM contact
      WHERE administration_id = $1 AND dedupe_sleutel = $2 AND ($3::uuid IS NULL OR id <> $3)
      LIMIT 5`,
    [administratieId, dedupeSleutel(naam), behalveId ?? null],
  );
  return rows;
}

export async function maakContact(
  client: Db,
  context: TenantContext & { administratieId: string },
  invoer: ContactInvoer,
  opties: { negeerDubbel?: boolean } = {},
): Promise<{ id: string; nummer: string }> {
  if (!opties.negeerDubbel) {
    const dubbelen = await zoekMogelijkeDubbelen(client, context.administratieId, invoer.naam);
    if (dubbelen.length > 0) {
      throw new ApiFout(
        'conflict',
        `Er bestaat al een relatie met (bijna) dezelfde naam: ${dubbelen.map((d) => d.naam).join(', ')}.`,
        'Gebruik de bestaande relatie, of geef aan dat het echt een andere partij is.',
        { dubbelen },
      );
    }
  }

  const jaar = new Date().getUTCFullYear();
  const soort = invoer.soort ?? 'klant';
  const nummer = await volgendNummer(
    client,
    context.administratieId,
    soort === 'leverancier' ? 'relatie-leverancier' : 'relatie-klant',
    jaar,
    soort === 'leverancier' ? 'L{nummer:5}' : 'K{nummer:5}',
  );

  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO contact
       (administration_id, nummer, naam, soort, email, telefoon, website, kvk_nummer, btw_nummer,
        iban, land, betalingstermijn_dagen, kredietlimiet, valuta, notitie, tags, dedupe_sleutel)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     RETURNING id`,
    [
      context.administratieId,
      nummer,
      invoer.naam.trim(),
      soort,
      invoer.email ?? null,
      invoer.telefoon ?? null,
      invoer.website ?? null,
      invoer.kvkNummer ?? null,
      invoer.btwNummer ?? null,
      invoer.iban ?? null,
      invoer.land ?? 'NL',
      invoer.betalingstermijnDagen ?? 30,
      invoer.kredietlimiet ?? null,
      (invoer.valuta ?? 'EUR').toUpperCase(),
      invoer.notitie ?? null,
      invoer.tags ?? [],
      dedupeSleutel(invoer.naam),
    ],
  );
  const id = rows[0]?.id;
  if (!id) throw new Error('De relatie kon niet worden aangemaakt.');

  if (invoer.adres) {
    await client.query(
      `INSERT INTO contact_address (administration_id, contact_id, soort, adres, postcode, plaats, land)
       VALUES ($1,$2,'bezoek',$3,$4,$5,$6)`,
      [
        context.administratieId,
        id,
        invoer.adres.adres ?? null,
        invoer.adres.postcode ?? null,
        invoer.adres.plaats ?? null,
        invoer.adres.land ?? invoer.land ?? 'NL',
      ],
    );
  }

  await auditeer(client, context, {
    actie: 'relatie.aangemaakt',
    onderwerpSoort: 'contact',
    onderwerpId: id,
    gegevens: { naam: invoer.naam, soort, nummer },
  });

  return { id, nummer };
}

export async function wijzigContact(
  client: Db,
  context: TenantContext & { administratieId: string },
  id: string,
  invoer: Partial<ContactInvoer>,
  verwachteVersie?: number,
): Promise<void> {
  const bestaand = await leesContact(client, context.administratieId, id);
  if (verwachteVersie !== undefined && bestaand.versie !== verwachteVersie) {
    throw fout.versieConflict(bestaand.versie);
  }

  await client.query(
    `UPDATE contact SET
       naam = COALESCE($3, naam),
       soort = COALESCE($4, soort),
       email = COALESCE($5, email),
       telefoon = COALESCE($6, telefoon),
       website = COALESCE($7, website),
       kvk_nummer = COALESCE($8, kvk_nummer),
       btw_nummer = COALESCE($9, btw_nummer),
       iban = COALESCE($10, iban),
       land = COALESCE($11, land),
       betalingstermijn_dagen = COALESCE($12, betalingstermijn_dagen),
       kredietlimiet = COALESCE($13, kredietlimiet),
       notitie = COALESCE($14, notitie),
       tags = COALESCE($15, tags),
       dedupe_sleutel = COALESCE($16, dedupe_sleutel),
       gewijzigd_op = now(),
       versie = versie + 1
     WHERE administration_id = $1 AND id = $2`,
    [
      context.administratieId,
      id,
      invoer.naam ?? null,
      invoer.soort ?? null,
      invoer.email ?? null,
      invoer.telefoon ?? null,
      invoer.website ?? null,
      invoer.kvkNummer ?? null,
      invoer.btwNummer ?? null,
      invoer.iban ?? null,
      invoer.land ?? null,
      invoer.betalingstermijnDagen ?? null,
      invoer.kredietlimiet ?? null,
      invoer.notitie ?? null,
      invoer.tags ?? null,
      invoer.naam ? dedupeSleutel(invoer.naam) : null,
    ],
  );
}

export async function leesContact(client: Db, administratieId: string, id: string): Promise<ContactRij> {
  const { rows } = await client.query<ContactRij>(
    `SELECT id, nummer, naam, soort, email, telefoon, website, kvk_nummer, btw_nummer, iban, land,
            betalingstermijn_dagen, kredietlimiet::text AS kredietlimiet, valuta, notitie, tags, status, versie
       FROM contact WHERE administration_id = $1 AND id = $2`,
    [administratieId, id],
  );
  const rij = rows[0];
  if (!rij) throw fout.nietGevonden('Deze relatie');
  return rij;
}

export type ContactZoekopdracht = {
  zoek?: string;
  soort?: 'klant' | 'leverancier';
  limiet?: number;
  cursor?: string;
};

export async function zoekContacten(
  client: Db,
  administratieId: string,
  opdracht: ContactZoekopdracht = {},
): Promise<{ items: ContactRij[]; volgendeCursor: string | null }> {
  const limiet = Math.min(opdracht.limiet ?? 50, 200);
  const parameters: unknown[] = [administratieId];
  const voorwaarden: string[] = ["c.status = 'actief'"];

  if (opdracht.zoek) {
    parameters.push(`%${opdracht.zoek.toLowerCase()}%`);
    voorwaarden.push(`(lower(c.naam) LIKE $${parameters.length} OR lower(coalesce(c.email,'')) LIKE $${parameters.length} OR coalesce(c.nummer,'') ILIKE $${parameters.length})`);
  }
  if (opdracht.soort) {
    parameters.push(opdracht.soort);
    voorwaarden.push(`(c.soort = $${parameters.length} OR c.soort = 'beide')`);
  }
  if (opdracht.cursor) {
    parameters.push(opdracht.cursor);
    voorwaarden.push(`c.naam > $${parameters.length}`);
  }
  parameters.push(limiet + 1);

  const { rows } = await client.query<ContactRij>(
    `SELECT c.id, c.nummer, c.naam, c.soort, c.email, c.telefoon, c.website, c.kvk_nummer, c.btw_nummer,
            c.iban, c.land, c.betalingstermijn_dagen, c.kredietlimiet::text AS kredietlimiet, c.valuta,
            c.notitie, c.tags, c.status, c.versie
       FROM contact c
      WHERE c.administration_id = $1 AND ${voorwaarden.join(' AND ')}
      ORDER BY c.naam
      LIMIT $${parameters.length}`,
    parameters,
  );

  const items = rows.slice(0, limiet);
  return {
    items,
    volgendeCursor: rows.length > limiet ? (items[items.length - 1]?.naam ?? null) : null,
  };
}

/** Het factuuradres van een relatie; valt terug op het bezoekadres. */
export async function factuuradres(
  client: Db,
  administratieId: string,
  contactId: string,
): Promise<{ adres: string | null; postcode: string | null; plaats: string | null; land: string } | null> {
  const { rows } = await client.query<{ adres: string | null; postcode: string | null; plaats: string | null; land: string }>(
    `SELECT adres, postcode, plaats, land FROM contact_address
      WHERE administration_id = $1 AND contact_id = $2
      ORDER BY CASE soort WHEN 'factuur' THEN 0 WHEN 'post' THEN 1 ELSE 2 END
      LIMIT 1`,
    [administratieId, contactId],
  );
  return rows[0] ?? null;
}
