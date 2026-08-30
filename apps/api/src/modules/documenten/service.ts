/**
 * Documentarchief. Het originele bestand blijft ongewijzigd bewaard en elke
 * handeling erop wordt geregistreerd — dat is zowel een boekhoudkundige eis
 * (bewijsstuk bij de administratie) als een privacy-eis.
 */
import type { Db, TenantContext } from '../../db/pool.ts';
import { ApiFout, fout } from '../../http/fout.ts';
import { auditeer } from '../audit/service.ts';
import { opslag } from '../../opslag/index.ts';

export type DocumentRij = {
  id: string;
  opslag_sleutel: string;
  bestandsnaam: string;
  mime: string;
  grootte: string;
  sha256: string;
  classificatie: 'normaal' | 'gevoelig';
  soort: string;
  bewaren_tot: string | null;
  legal_hold: boolean;
  aangemaakt_op: string;
};

export async function uploadDocument(
  client: Db,
  context: TenantContext & { administratieId: string },
  invoer: {
    inhoud: Buffer;
    bestandsnaam: string;
    mime: string;
    soort?: string;
    classificatie?: 'normaal' | 'gevoelig';
  },
): Promise<{ id: string; bestaandeId?: string }> {
  const bewaard = await opslag().bewaar(context.administratieId, invoer.inhoud, invoer.mime);

  // Hetzelfde bestand twee keer uploaden levert hetzelfde document op in plaats
  // van een dubbele bon in het archief.
  const bestaand = await client.query<{ id: string }>(
    'SELECT id FROM document WHERE administration_id = $1 AND sha256 = $2 AND verwijderd_op IS NULL LIMIT 1',
    [context.administratieId, bewaard.sha256],
  );
  if (bestaand.rows[0]) {
    await opslag().verwijder(bewaard.sleutel);
    return { id: bestaand.rows[0].id, bestaandeId: bestaand.rows[0].id };
  }

  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO document
       (administration_id, opslag_sleutel, bestandsnaam, mime, grootte, sha256, classificatie, soort, geupload_door)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [
      context.administratieId,
      bewaard.sleutel,
      invoer.bestandsnaam.slice(0, 255),
      invoer.mime,
      bewaard.grootte,
      bewaard.sha256,
      invoer.classificatie ?? 'normaal',
      invoer.soort ?? 'bijlage',
      context.gebruikerId,
    ],
  );
  const id = rows[0]?.id;
  if (!id) throw new Error('Het document kon niet worden vastgelegd.');

  await schrijfDocumentgebeurtenis(client, context, id, 'geupload', { bestandsnaam: invoer.bestandsnaam });
  await auditeer(client, context, {
    actie: 'document.geupload',
    onderwerpSoort: 'document',
    onderwerpId: id,
    gegevens: { soort: invoer.soort ?? 'bijlage', grootte: bewaard.grootte, mime: invoer.mime },
  });

  return { id };
}

export async function schrijfDocumentgebeurtenis(
  client: Db,
  context: TenantContext & { administratieId: string },
  documentId: string,
  actie: string,
  details: Record<string, unknown> = {},
): Promise<void> {
  await client.query(
    `INSERT INTO document_event (administration_id, document_id, actie, user_id, details)
     VALUES ($1,$2,$3,$4,$5)`,
    [context.administratieId, documentId, actie, context.gebruikerId, JSON.stringify(details)],
  );
}

export async function leesDocument(
  client: Db,
  administratieId: string,
  documentId: string,
): Promise<DocumentRij> {
  const { rows } = await client.query<DocumentRij>(
    `SELECT id, opslag_sleutel, bestandsnaam, mime, grootte::text AS grootte, sha256, classificatie,
            soort, bewaren_tot::text AS bewaren_tot, legal_hold, aangemaakt_op::text AS aangemaakt_op
       FROM document WHERE administration_id = $1 AND id = $2 AND verwijderd_op IS NULL`,
    [administratieId, documentId],
  );
  const rij = rows[0];
  if (!rij) throw fout.nietGevonden('Dit document');
  return rij;
}

/**
 * Haalt de inhoud op en registreert de download. Gevoelige documenten vereisen
 * een apart recht.
 */
export async function downloadDocument(
  client: Db,
  context: TenantContext & { administratieId: string },
  documentId: string,
  rechten: ReadonlySet<string>,
): Promise<{ document: DocumentRij; inhoud: Buffer }> {
  const document = await leesDocument(client, context.administratieId, documentId);
  if (document.classificatie === 'gevoelig' && !rechten.has('document.gevoelig.lezen')) {
    throw fout.geenRecht('document.gevoelig.lezen');
  }
  const inhoud = await opslag().lees(document.opslag_sleutel);
  await schrijfDocumentgebeurtenis(client, context, documentId, 'gedownload');
  await auditeer(client, context, {
    actie: 'document.gedownload',
    onderwerpSoort: 'document',
    onderwerpId: documentId,
    gegevens: { classificatie: document.classificatie },
  });
  return { document, inhoud };
}

/**
 * Verwijdert een document. Staat er een legal hold op of loopt de wettelijke
 * bewaartermijn nog, dan gebeurt dat niet: de fiscale bewaarplicht gaat voor.
 */
export async function verwijderDocument(
  client: Db,
  context: TenantContext & { administratieId: string },
  documentId: string,
): Promise<void> {
  const document = await leesDocument(client, context.administratieId, documentId);
  if (document.legal_hold) {
    throw new ApiFout(
      'forbidden',
      'Op dit document staat een bewaarplicht (legal hold).',
      'Zolang die geldt kan het niet worden verwijderd. Neem contact op met de beheerder.',
    );
  }
  if (document.bewaren_tot && document.bewaren_tot > new Date().toISOString().slice(0, 10)) {
    throw new ApiFout(
      'forbidden',
      `Dit document moet nog bewaard worden tot ${document.bewaren_tot}.`,
      'De fiscale bewaarplicht gaat voor op verwijderen. Zie de bewaartermijnen in de instellingen.',
    );
  }
  const gekoppeld = await client.query(
    'SELECT 1 FROM purchase_invoice WHERE administration_id = $1 AND document_id = $2 LIMIT 1',
    [context.administratieId, documentId],
  );
  if (gekoppeld.rowCount > 0) {
    throw new ApiFout(
      'forbidden',
      'Dit document hoort bij een inkoopfactuur en is het bewijsstuk daarvan.',
      'Ontkoppel het eerst van de factuur, of verwijder de factuur.',
    );
  }

  await client.query(
    'UPDATE document SET verwijderd_op = now() WHERE administration_id = $1 AND id = $2',
    [context.administratieId, documentId],
  );
  await schrijfDocumentgebeurtenis(client, context, documentId, 'verwijderd');
  await auditeer(client, context, {
    actie: 'document.verwijderd',
    onderwerpSoort: 'document',
    onderwerpId: documentId,
  });
}

export async function zoekDocumenten(
  client: Db,
  administratieId: string,
  opties: { soort?: string; limiet?: number } = {},
): Promise<DocumentRij[]> {
  const { rows } = await client.query<DocumentRij>(
    `SELECT id, opslag_sleutel, bestandsnaam, mime, grootte::text AS grootte, sha256, classificatie,
            soort, bewaren_tot::text AS bewaren_tot, legal_hold, aangemaakt_op::text AS aangemaakt_op
       FROM document
      WHERE administration_id = $1 AND verwijderd_op IS NULL AND ($2::text IS NULL OR soort = $2)
      ORDER BY aangemaakt_op DESC LIMIT $3`,
    [administratieId, opties.soort ?? null, Math.min(opties.limiet ?? 50, 200)],
  );
  return rows;
}
