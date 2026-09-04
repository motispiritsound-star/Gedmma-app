/**
 * De audit trail.
 *
 * Elke regel bevat de hash van de vorige regel binnen dezelfde administratie.
 * Knoeien achteraf is daardoor detecteerbaar zonder externe dienst; de tabel is
 * bovendien append-only (geen UPDATE/DELETE-recht voor de applicatierol, plus
 * een trigger). Zie docs/security.md.
 */
import type { Db, TenantContext } from '../../db/pool.ts';
import { sha256 } from '../../util/crypto.ts';
import { maskeer } from '../../util/log.ts';

export type AuditActie =
  | 'auth.geregistreerd'
  | 'auth.aangemeld'
  | 'auth.aanmelden_mislukt'
  | 'auth.afgemeld'
  | 'auth.sessie_ingetrokken'
  | 'auth.mfa_ingeschakeld'
  | 'auth.mfa_uitgeschakeld'
  | 'auth.mfa_herstelcode_gebruikt'
  | 'auth.wachtwoord_gewijzigd'
  | 'support.impersonatie_gestart'
  | 'support.impersonatie_beeindigd'
  | 'organisatie.aangemaakt'
  | 'administratie.aangemaakt'
  | 'administratie.gewijzigd'
  | 'gebruiker.uitgenodigd'
  | 'gebruiker.rol_gewijzigd'
  | 'gebruiker.verwijderd'
  | 'relatie.aangemaakt'
  | 'relatie.gewijzigd'
  | 'relatie.verwijderd'
  | 'accountant.toegang_verleend'
  | 'accountant.toegang_ingetrokken'
  | 'journaal.aangemaakt'
  | 'journaal.definitief'
  | 'journaal.gestorneerd'
  | 'periode.geblokkeerd'
  | 'periode.gesloten'
  | 'periode.heropend'
  | 'rekening.aangemaakt'
  | 'rekening.gewijzigd'
  | 'btwcode.gewijzigd'
  | 'verkoopfactuur.aangemaakt'
  | 'verkoopfactuur.definitief'
  | 'verkoopfactuur.verzonden'
  | 'verkoopfactuur.gecrediteerd'
  | 'inkoopfactuur.aangemaakt'
  | 'inkoopfactuur.definitief'
  | 'inkoopfactuur.goedgekeurd'
  | 'project.aangemaakt'
  | 'project.gewijzigd'
  | 'uur.geschreven'
  | 'uur.gewijzigd'
  | 'uur.verwijderd'
  | 'uur.ingediend'
  | 'uur.goedgekeurd'
  | 'uur.afgekeurd'
  | 'uur.gefactureerd'
  | 'bank.rekening_gekoppeld'
  | 'bank.import'
  | 'bank.transactie_geboekt'
  | 'bank.koppeling_verwijderd'
  | 'betaling.voorbereid'
  | 'betaling.goedgekeurd'
  | 'document.geupload'
  | 'document.gedownload'
  | 'document.verwijderd'
  | 'rapport.geexporteerd'
  | 'administratie.geexporteerd'
  | 'privacy.verzoek_ontvangen'
  | 'privacy.verzoek_afgehandeld'
  | 'privacy.instelling_gewijzigd'
  | 'toestemming.gegeven'
  | 'toestemming.ingetrokken'
  | 'bewaartermijn.gewijzigd'
  | 'gegevens.verwijderd'
  | 'ai.voorstel_gemaakt'
  | 'ai.voorstel_besloten'
  | 'ai.ingeschakeld'
  | 'ai.uitgeschakeld'
  | 'feedback.gegeven'
  | 'feedback.behandeld'
  | 'beveiliging.incident_geregistreerd'
  | 'beveiliging.veel_gegevens_geraadpleegd';

export type AuditInvoer = {
  actie: AuditActie;
  onderwerpSoort?: string;
  onderwerpId?: string;
  gegevens?: Record<string, unknown>;
  administratieId?: string | null;
  organisatieId?: string | null;
  ipHash?: string | null;
};

/**
 * Canonieke JSON: sleutels alfabetisch, zodat de tekst waarover we hashen
 * onafhankelijk is van de volgorde waarin PostgreSQL jsonb teruggeeft. Zonder
 * dit zou de ketting na een rondje door de database niet meer kloppen.
 */
function canoniek(waarde: unknown): unknown {
  if (Array.isArray(waarde)) return waarde.map(canoniek);
  if (waarde && typeof waarde === 'object') {
    const uitkomst: Record<string, unknown> = {};
    for (const sleutel of Object.keys(waarde as Record<string, unknown>).sort()) {
      uitkomst[sleutel] = canoniek((waarde as Record<string, unknown>)[sleutel]);
    }
    return uitkomst;
  }
  return waarde;
}

/** Bouwt de genormaliseerde tekst waarover de hash wordt berekend. */
function kernVan(velden: {
  administratieId: string | null;
  organisatieId: string | null;
  op: string;
  actor: string | null;
  actorSoort: string;
  actie: string;
  onderwerpSoort: string | null;
  onderwerpId: string | null;
  gegevens: unknown;
}): string {
  return JSON.stringify(canoniek(velden));
}

/**
 * Schrijft een auditregel binnen de lopende transactie. Loopt de transactie
 * terug, dan verdwijnt ook de auditregel: een gebeurtenis die niet is gebeurd
 * hoort niet in het log.
 */
export async function auditeer(
  client: Db,
  context: TenantContext,
  invoer: AuditInvoer,
): Promise<void> {
  const administratieId =
    invoer.administratieId !== undefined ? invoer.administratieId : context.administratieId;
  const organisatieId =
    invoer.organisatieId !== undefined ? invoer.organisatieId : context.organisatieId;

  const { rows } = await client.query<{ hash: string }>(
    `SELECT hash FROM audit_event
      WHERE administration_id IS NOT DISTINCT FROM $1
      ORDER BY id DESC LIMIT 1`,
    [administratieId],
  );
  const vorigeHash = rows[0]?.hash ?? null;

  const gegevens = maskeer(invoer.gegevens ?? {}) as Record<string, unknown>;
  const op = new Date().toISOString();
  const kern = kernVan({
    administratieId,
    organisatieId,
    op,
    actor: context.gebruikerId,
    actorSoort: context.actorSoort ?? 'gebruiker',
    actie: invoer.actie,
    onderwerpSoort: invoer.onderwerpSoort ?? null,
    onderwerpId: invoer.onderwerpId ?? null,
    gegevens,
  });
  const hash = sha256(`${vorigeHash ?? ''}|${kern}`);

  await client.query(
    `INSERT INTO audit_event
       (administration_id, organization_id, op, actor_user_id, actor_soort, actie,
        onderwerp_soort, onderwerp_id, gegevens, request_id, ip_hash, vorige_hash, hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      administratieId,
      organisatieId,
      op,
      context.gebruikerId,
      context.actorSoort ?? 'gebruiker',
      invoer.actie,
      invoer.onderwerpSoort ?? null,
      invoer.onderwerpId ?? null,
      JSON.stringify(gegevens),
      context.requestId ?? null,
      invoer.ipHash ?? null,
      vorigeHash,
      hash,
    ],
  );
}

export type AuditRegel = {
  id: string;
  op: string;
  actie: string;
  actor_soort: string;
  actor_user_id: string | null;
  actor_naam: string | null;
  onderwerp_soort: string | null;
  onderwerp_id: string | null;
  gegevens: Record<string, unknown>;
  vorige_hash: string | null;
  hash: string;
};

/** Leest de audit trail van de actieve administratie. */
export async function leesAudit(
  client: Db,
  opties: { limiet?: number; voorId?: string; onderwerpSoort?: string; onderwerpId?: string } = {},
): Promise<AuditRegel[]> {
  const limiet = Math.min(opties.limiet ?? 50, 200);
  const voorwaarden: string[] = [];
  const parameters: unknown[] = [];
  if (opties.voorId) {
    parameters.push(opties.voorId);
    voorwaarden.push(`a.id < $${parameters.length}`);
  }
  if (opties.onderwerpSoort) {
    parameters.push(opties.onderwerpSoort);
    voorwaarden.push(`a.onderwerp_soort = $${parameters.length}`);
  }
  if (opties.onderwerpId) {
    parameters.push(opties.onderwerpId);
    voorwaarden.push(`a.onderwerp_id = $${parameters.length}`);
  }
  parameters.push(limiet);

  const { rows } = await client.query<AuditRegel>(
    `SELECT a.id::text AS id, a.op, a.actie, a.actor_soort, a.actor_user_id,
            u.naam AS actor_naam, a.onderwerp_soort, a.onderwerp_id, a.gegevens,
            a.vorige_hash, a.hash
       FROM audit_event a
       LEFT JOIN app_user u ON u.id = a.actor_user_id
      ${voorwaarden.length > 0 ? `WHERE ${voorwaarden.join(' AND ')}` : ''}
      ORDER BY a.id DESC
      LIMIT $${parameters.length}`,
    parameters,
  );
  return rows;
}

/**
 * Controleert de hash-ketting van een administratie. Levert de eerste regel op
 * die niet klopt, of null als alles klopt.
 */
export async function controleerKetting(
  client: Db,
  administratieId: string | null,
): Promise<{ id: string; actie: string; op: string; reden: string } | null> {
  const { rows } = await client.query<{
    id: string;
    op: Date | string;
    actor_user_id: string | null;
    actor_soort: string;
    actie: string;
    onderwerp_soort: string | null;
    onderwerp_id: string | null;
    gegevens: Record<string, unknown>;
    organization_id: string | null;
    administration_id: string | null;
    vorige_hash: string | null;
    hash: string;
  }>(
    // Let op: de alias `id` is tekst, dus zonder tabelprefix zou PostgreSQL op
    // die uitvoerkolom sorteren en dus alfabetisch ("10" voor "4"). Daarom
    // expliciet op de kolom van de tabel sorteren.
    `SELECT a.id::text AS id, a.op, a.actor_user_id, a.actor_soort, a.actie, a.onderwerp_soort,
            a.onderwerp_id, a.gegevens, a.organization_id, a.administration_id, a.vorige_hash, a.hash
       FROM audit_event a
      WHERE a.administration_id IS NOT DISTINCT FROM $1
      ORDER BY a.id ASC`,
    [administratieId],
  );

  let verwachteVorige: string | null = null;
  for (const rij of rows) {
    if (rij.vorige_hash !== verwachteVorige) {
      return {
        id: rij.id,
        actie: rij.actie,
        op: new Date(rij.op).toISOString(),
        reden: 'De verwijzing naar de vorige regel klopt niet.',
      };
    }
    const kern = kernVan({
      administratieId: rij.administration_id,
      organisatieId: rij.organization_id,
      op: new Date(rij.op).toISOString(),
      actor: rij.actor_user_id,
      actorSoort: rij.actor_soort,
      actie: rij.actie,
      onderwerpSoort: rij.onderwerp_soort,
      onderwerpId: rij.onderwerp_id,
      gegevens: rij.gegevens,
    });
    if (sha256(`${rij.vorige_hash ?? ''}|${kern}`) !== rij.hash) {
      return {
        id: rij.id,
        actie: rij.actie,
        op: new Date(rij.op).toISOString(),
        reden: 'De inhoud van deze regel komt niet overeen met de hash.',
      };
    }
    verwachteVorige = rij.hash;
  }
  return null;
}
