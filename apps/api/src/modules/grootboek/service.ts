/**
 * Het boeken zelf: van een gevalideerde post uit de rekenkern naar rijen in de
 * database, en van daar naar definitief of gestorneerd.
 *
 * De rekenkern (@gedmma/accounting) bepaalt of een post mag bestaan; deze laag
 * bepaalt waar hij terechtkomt en zorgt dat de database dezelfde regels nog een
 * keer afdwingt. Dubbel, met opzet.
 */
import { Money } from '@gedmma/money';
import {
  bouwPost,
  keerPostOm,
  type GeldigePost,
  type Rekeningregister,
  type Systeemrol,
} from '@gedmma/accounting';
import type { Db, TenantContext } from '../../db/pool.ts';
import { ApiFout, fout } from '../../http/fout.ts';
import { auditeer } from '../audit/service.ts';
import {
  alleRekeningen,
  dagboekOpCode,
  leesPost,
  periodeVoorDatum,
  volgendNummer,
  type RekeningRij,
} from './repo.ts';

/**
 * Bouwt het rekeningregister dat de boekingspatronen nodig hebben. Ontbreekt er
 * een systeemrol, dan is dat een fout in de opzet van de administratie en niet
 * iets waar de gebruiker omheen moet kunnen werken.
 */
export async function rekeningregister(client: Db, administratieId: string): Promise<
  Rekeningregister & { opId(id: string): RekeningRij | undefined; opCode(code: string): RekeningRij | undefined; alle(): RekeningRij[] }
> {
  const rekeningen = await alleRekeningen(client, administratieId);
  const perRol = new Map<string, RekeningRij>();
  const perId = new Map<string, RekeningRij>();
  const perCode = new Map<string, RekeningRij>();
  for (const rekening of rekeningen) {
    perId.set(rekening.id, rekening);
    perCode.set(rekening.code, rekening);
    if (rekening.rol) perRol.set(rekening.rol, rekening);
  }
  return {
    vindRol(rol: Systeemrol) {
      const rekening = perRol.get(rol);
      if (!rekening) {
        throw new ApiFout(
          'validation_failed',
          `Het rekeningschema van deze administratie mist de rekening voor "${rol}".`,
          'Wijs in de instellingen een grootboekrekening aan voor deze rol.',
          { rol },
        );
      }
      return { id: rekening.id, code: rekening.code };
    },
    opId: (id: string) => perId.get(id),
    opCode: (code: string) => perCode.get(code),
    alle: () => rekeningen,
  };
}

export type BoekOpties = {
  /** Meteen definitief maken; anders blijft de post concept. */
  definitief?: boolean;
  /** Nummerreeks voor het postnummer; standaard de dagboekcode. */
  nummerSleutel?: string;
  /**
   * Bij een tegenboeking: de post die hiermee wordt gestorneerd. Dit wordt bij
   * het aanmaken meegegeven en niet achteraf bijgewerkt, want een definitieve
   * post is onveranderbaar - ook voor onszelf.
   */
  storneertId?: string;
};

/**
 * Slaat een gevalideerde post op. De post krijgt pas een nummer als hij
 * definitief wordt: een concept dat wordt weggegooid mag geen gat in de reeks
 * achterlaten.
 */
export async function boek(
  client: Db,
  context: TenantContext & { administratieId: string },
  post: GeldigePost,
  opties: BoekOpties = {},
): Promise<{ postId: string; postnummer: string | null }> {
  const dagboek = await dagboekOpCode(client, context.administratieId, post.dagboekCode);
  const periode = await periodeVoorDatum(client, context.administratieId, post.boekdatum);

  if (opties.definitief && periode.status !== 'open') {
    throw new ApiFout(
      'period_closed',
      `De periode ${periode.naam} is ${periode.status === 'gesloten' ? 'gesloten' : 'geblokkeerd'}.`,
      'Kies een datum in een open periode, of laat iemand met het recht "periode heropenen" de periode openen.',
      { periode: periode.naam, status: periode.status },
    );
  }

  const jaar = Number(post.boekdatum.slice(0, 4));
  const postnummer = opties.definitief
    ? await volgendNummer(client, context.administratieId, opties.nummerSleutel ?? dagboek.code, jaar)
    : null;

  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO journal_entry
       (administration_id, journal_id, period_id, postnummer, boekdatum, omschrijving, valuta,
        status, totaal_debet, totaal_credit, bron_soort, bron_id, storneert_id, aangemaakt_door)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'concept',0,0,$8,$9,$10,$11)
     RETURNING id`,
    [
      context.administratieId,
      dagboek.id,
      periode.id,
      postnummer,
      post.boekdatum,
      post.omschrijving,
      post.valuta,
      post.bronSoort ?? 'manual',
      post.bronId ?? null,
      opties.storneertId ?? null,
      context.gebruikerId,
    ],
  );
  const postId = rows[0]?.id;
  if (!postId) throw new Error('De journaalpost kon niet worden aangemaakt.');

  for (const regel of post.regels) {
    await client.query(
      `INSERT INTO journal_line
         (administration_id, entry_id, regelnummer, ledger_account_id, debet, credit, omschrijving,
          tax_code_id, btw_grondslag, contact_id, cost_center_id, bedrag_valuta, valuta, wisselkoers)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        context.administratieId,
        postId,
        regel.regelnummer,
        regel.rekeningId,
        regel.debet.toString(),
        regel.credit.toString(),
        regel.omschrijving ?? null,
        regel.btwCodeId ?? null,
        regel.btwGrondslag?.toString() ?? null,
        regel.relatieId ?? null,
        regel.kostenplaatsId ?? null,
        regel.bedragVreemdeValuta?.toString() ?? null,
        regel.bedragVreemdeValuta?.valuta ?? null,
        regel.wisselkoers?.toString() ?? null,
      ],
    );
  }

  await client.query(
    'UPDATE journal_entry SET totaal_debet = $2, totaal_credit = $3 WHERE id = $1',
    [postId, post.totaalDebet.toString(), post.totaalCredit.toString()],
  );

  await auditeer(client, context, {
    actie: 'journaal.aangemaakt',
    onderwerpSoort: 'journal_entry',
    onderwerpId: postId,
    gegevens: {
      dagboek: dagboek.code,
      boekdatum: post.boekdatum,
      totaal: post.totaalDebet.toString(),
      regels: post.regels.length,
      bron: post.bronSoort,
    },
  });

  if (opties.definitief) {
    await maakDefinitief(client, context, postId);
  }

  return { postId, postnummer };
}

/**
 * Maakt een post definitief. Vanaf dat moment is hij onveranderbaar; de
 * database bewaakt dat met een trigger, ook als deze code ooit fout gaat.
 */
export async function maakDefinitief(
  client: Db,
  context: TenantContext & { administratieId: string },
  postId: string,
): Promise<void> {
  const { rows } = await client.query<{ status: string; postnummer: string | null; journal_id: string; boekdatum: string }>(
    `SELECT status, postnummer, journal_id, boekdatum::text AS boekdatum
       FROM journal_entry WHERE administration_id = $1 AND id = $2`,
    [context.administratieId, postId],
  );
  const post = rows[0];
  if (!post) throw fout.nietGevonden('Deze boeking');
  if (post.status === 'definitief') return;
  if (post.status === 'gestorneerd') {
    throw new ApiFout('entry_immutable', 'Deze boeking is al gestorneerd.', 'Maak zo nodig een nieuwe boeking.');
  }

  let postnummer = post.postnummer;
  if (!postnummer) {
    const dagboek = await client.query<{ code: string }>('SELECT code FROM journal WHERE id = $1', [post.journal_id]);
    postnummer = await volgendNummer(
      client,
      context.administratieId,
      dagboek.rows[0]?.code ?? 'MEM',
      Number(post.boekdatum.slice(0, 4)),
    );
  }

  await client.query(
    `UPDATE journal_entry
        SET status = 'definitief', postnummer = $3, definitief_op = now(), definitief_door = $4,
            versie = versie + 1
      WHERE administration_id = $1 AND id = $2`,
    [context.administratieId, postId, postnummer, context.gebruikerId],
  );

  await auditeer(client, context, {
    actie: 'journaal.definitief',
    onderwerpSoort: 'journal_entry',
    onderwerpId: postId,
    gegevens: { postnummer },
  });
}

/**
 * Maakt een tegenboeking. De originele post blijft staan en krijgt de status
 * 'gestorneerd' met een verwijzing naar de tegenboeking: de geschiedenis wordt
 * nooit gladgestreken.
 */
export async function storneer(
  client: Db,
  context: TenantContext & { administratieId: string },
  postId: string,
  opties: { boekdatum?: string; omschrijving?: string } = {},
): Promise<{ postId: string; postnummer: string | null }> {
  const gelezen = await leesPost(client, context.administratieId, postId);
  if (!gelezen) throw fout.nietGevonden('Deze boeking');
  if (gelezen.post.status !== 'definitief') {
    throw new ApiFout(
      'validation_failed',
      'Alleen een definitieve boeking kan worden gestorneerd.',
      'Een concept kun je gewoon aanpassen of verwijderen.',
    );
  }

  const origineel = bouwPost({
    dagboekCode: gelezen.post.journal_code,
    boekdatum: gelezen.post.boekdatum,
    omschrijving: gelezen.post.omschrijving,
    valuta: gelezen.post.valuta,
    bronSoort: (gelezen.post.bron_soort as GeldigePost['bronSoort']) ?? 'manual',
    bronId: gelezen.post.bron_id,
    regels: gelezen.regels.map((regel) => ({
      rekeningId: regel.ledger_account_id,
      rekeningCode: regel.rekening_code,
      debet: Money.vanTekst(regel.debet, gelezen.post.valuta),
      credit: Money.vanTekst(regel.credit, gelezen.post.valuta),
      omschrijving: regel.omschrijving ?? undefined,
      btwCodeId: regel.tax_code_id,
      btwGrondslag: regel.btw_grondslag ? Money.vanTekst(regel.btw_grondslag, gelezen.post.valuta) : null,
      relatieId: regel.contact_id,
    })),
  });

  const boekdatum = opties.boekdatum ?? (await eersteOpenDatum(client, context.administratieId, gelezen.post.boekdatum));
  const tegen = keerPostOm(origineel, {
    boekdatum,
    omschrijving: opties.omschrijving ?? `Tegenboeking van ${gelezen.post.postnummer ?? gelezen.post.omschrijving}`,
  });

  const resultaat = await boek(client, context, tegen, { definitief: true, storneertId: postId });

  await client.query(
    `UPDATE journal_entry SET status = 'gestorneerd', gestorneerd_door_id = $3
      WHERE administration_id = $1 AND id = $2`,
    [context.administratieId, postId, resultaat.postId],
  );

  await auditeer(client, context, {
    actie: 'journaal.gestorneerd',
    onderwerpSoort: 'journal_entry',
    onderwerpId: postId,
    gegevens: { tegenboeking: resultaat.postId, boekdatum },
  });

  return resultaat;
}

/**
 * Zoekt de datum waarop een tegenboeking terechtkan: de oorspronkelijke datum
 * als die periode nog open is, anders de eerste dag van de eerstvolgende open
 * periode.
 */
async function eersteOpenDatum(client: Db, administratieId: string, voorkeur: string): Promise<string> {
  const periode = await periodeVoorDatum(client, administratieId, voorkeur);
  if (periode.status === 'open') return voorkeur;

  const { rows } = await client.query<{ begint_op: string }>(
    `SELECT begint_op::text AS begint_op FROM accounting_period
      WHERE administration_id = $1 AND status = 'open' AND begint_op > $2::date
      ORDER BY begint_op LIMIT 1`,
    [administratieId, voorkeur],
  );
  const volgende = rows[0]?.begint_op;
  if (!volgende) {
    throw new ApiFout(
      'period_closed',
      'Er is geen open periode waarin de tegenboeking kan worden geplaatst.',
      'Open een periode of maak een nieuw boekjaar aan.',
    );
  }
  return volgende;
}

/** Verwijdert een concept-post. Definitieve posten kunnen niet worden verwijderd. */
export async function verwijderConcept(
  client: Db,
  context: TenantContext & { administratieId: string },
  postId: string,
): Promise<void> {
  const { rows } = await client.query<{ status: string }>(
    'SELECT status FROM journal_entry WHERE administration_id = $1 AND id = $2',
    [context.administratieId, postId],
  );
  const status = rows[0]?.status;
  if (!status) throw fout.nietGevonden('Deze boeking');
  if (status !== 'concept') {
    throw new ApiFout(
      'entry_immutable',
      'Een definitieve boeking kan niet worden verwijderd.',
      'Maak een tegenboeking als de boeking niet klopt; dan blijft de geschiedenis compleet.',
    );
  }
  await client.query('DELETE FROM journal_line WHERE administration_id = $1 AND entry_id = $2', [
    context.administratieId,
    postId,
  ]);
  await client.query('DELETE FROM journal_entry WHERE administration_id = $1 AND id = $2', [
    context.administratieId,
    postId,
  ]);
}

/** Blokkeert of sluit een periode. */
export async function wijzigPeriodestatus(
  client: Db,
  context: TenantContext & { administratieId: string },
  periodeId: string,
  nieuweStatus: 'open' | 'geblokkeerd' | 'gesloten',
  reden?: string,
): Promise<void> {
  const { rows } = await client.query<{ status: string; naam: string }>(
    'SELECT status, naam FROM accounting_period WHERE administration_id = $1 AND id = $2',
    [context.administratieId, periodeId],
  );
  const huidige = rows[0];
  if (!huidige) throw fout.nietGevonden('Deze periode');

  const heropenen = huidige.status !== 'open' && nieuweStatus === 'open';
  if (heropenen && !reden) {
    throw fout.validatie(
      [{ veld: 'reden', probleem: 'Een gesloten periode heropenen kan alleen met een motivatie.' }],
      'Waarom moet deze periode weer open?',
    );
  }

  await client.query(
    `UPDATE accounting_period
        SET status = $3,
            gesloten_op = CASE WHEN $3 = 'gesloten' THEN now() ELSE NULL END,
            gesloten_door = CASE WHEN $3 = 'gesloten' THEN $4::uuid ELSE NULL END,
            heropen_reden = CASE WHEN $3 = 'open' THEN $5 ELSE heropen_reden END
      WHERE administration_id = $1 AND id = $2`,
    [context.administratieId, periodeId, nieuweStatus, context.gebruikerId, reden ?? null],
  );

  await auditeer(client, context, {
    actie: heropenen ? 'periode.heropend' : nieuweStatus === 'gesloten' ? 'periode.gesloten' : 'periode.geblokkeerd',
    onderwerpSoort: 'accounting_period',
    onderwerpId: periodeId,
    gegevens: { periode: huidige.naam, van: huidige.status, naar: nieuweStatus, reden: reden ?? null },
  });
}
