/**
 * Gebruikers binnen een organisatie: uitnodigen, rollen wijzigen, toegang
 * beperken tot bepaalde administraties en toegang weer intrekken.
 *
 * Een uitnodiging bevat een token dat alleen als hash wordt bewaard en dat
 * verloopt. Zo kan een accountant toegang krijgen zonder dat er ooit een
 * wachtwoord wordt gedeeld.
 */
import { inTransactie, type Db, type TenantContext } from '../../db/pool.ts';
import { nieuwToken, sha256 } from '../../util/crypto.ts';
import { ApiFout, fout } from '../../http/fout.ts';
import { auditeer } from '../audit/service.ts';
import { mail } from '../../mail/index.ts';
import { config } from '../../config.ts';
import { scryptHasher, beoordeelWachtwoord } from '../../auth/wachtwoord.ts';

export type Lid = {
  membership_id: string;
  user_id: string;
  naam: string;
  email: string;
  rol: string;
  status: string;
  administraties: { id: string; naam: string; rol: string | null; geldig_tot: string | null }[];
};

export async function ledenVan(client: Db, organisatieId: string): Promise<Lid[]> {
  const { rows } = await client.query<{
    membership_id: string;
    user_id: string;
    naam: string;
    email: string;
    rol: string;
    status: string;
  }>(
    `SELECT m.id AS membership_id, u.id AS user_id, u.naam, u.email::text AS email,
            r.sleutel AS rol, m.status
       FROM membership m
       JOIN app_user u ON u.id = m.user_id
       JOIN role r ON r.id = m.role_id
      WHERE m.organization_id = $1
      ORDER BY u.naam`,
    [organisatieId],
  );

  const leden: Lid[] = [];
  for (const rij of rows) {
    const toegang = await client.query<{ id: string; naam: string; rol: string | null; geldig_tot: string | null }>(
      `SELECT a.id, a.naam, r.sleutel AS rol, aa.geldig_tot::text AS geldig_tot
         FROM administration_access aa
         JOIN administration a ON a.id = aa.administration_id
         LEFT JOIN role r ON r.id = aa.role_id
        WHERE aa.membership_id = $1
        ORDER BY a.naam`,
      [rij.membership_id],
    );
    leden.push({ ...rij, administraties: toegang.rows });
  }
  return leden;
}

export type Uitnodiging = {
  email: string;
  rol: string;
  /** Beperk de toegang tot deze administraties; leeg betekent alle. */
  administratieIds?: string[];
  /** Einddatum van de toegang, bijvoorbeeld voor een externe adviseur. */
  geldigTot?: string | null;
};

export async function nodigUit(
  client: Db,
  context: TenantContext & { organisatieId: string },
  invoer: Uitnodiging,
): Promise<{ membershipId: string; uitnodigingsLink: string }> {
  const email = invoer.email.trim().toLowerCase();

  const rol = await client.query<{ id: string; sleutel: string }>(
    'SELECT id, sleutel FROM role WHERE sleutel = $1 AND organization_id IS NULL',
    [invoer.rol],
  );
  const rolId = rol.rows[0]?.id;
  if (!rolId) {
    throw fout.validatie([{ veld: 'rol', probleem: `De rol "${invoer.rol}" bestaat niet.` }]);
  }
  if (invoer.rol === 'owner') {
    throw new ApiFout(
      'forbidden',
      'De rol Eigenaar kan niet worden uitgedeeld via een uitnodiging.',
      'Draag het eigenaarschap over via de instellingen van de organisatie.',
    );
  }

  const grens = await client.query<{ max_gebruikers: number | null; aantal: string }>(
    `SELECT o.max_gebruikers,
            (SELECT count(*)::text FROM membership m WHERE m.organization_id = o.id AND m.status <> 'geschorst') AS aantal
       FROM organization o WHERE o.id = $1`,
    [context.organisatieId],
  );
  const rij = grens.rows[0];
  if (rij?.max_gebruikers !== null && rij?.max_gebruikers !== undefined && Number(rij.aantal) >= rij.max_gebruikers) {
    throw fout.limiet('het aantal gebruikers');
  }

  // Bestaat de gebruiker al, dan koppelen we die; anders maken we een account
  // zonder bruikbaar wachtwoord dat via de uitnodiging wordt geactiveerd.
  let gebruikerId: string;
  const bestaand = await client.query<{ id: string }>('SELECT id FROM app_user WHERE email = $1', [email]);
  if (bestaand.rows[0]) {
    gebruikerId = bestaand.rows[0].id;
  } else {
    const nieuw = await client.query<{ id: string }>(
      `INSERT INTO app_user (email, naam, wachtwoord_hash, email_bevestigd)
       VALUES ($1, $2, $3, false) RETURNING id`,
      [email, email.split('@')[0] ?? 'Genodigde', `uitnodiging$${nieuwToken(16)}`],
    );
    gebruikerId = nieuw.rows[0]?.id ?? '';
  }

  const token = nieuwToken();
  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO membership (user_id, organization_id, role_id, status, uitgenodigd_door, uitnodiging_hash, uitnodiging_tot)
     VALUES ($1, $2, $3, 'uitgenodigd', $4, $5, now() + interval '14 days')
     ON CONFLICT (user_id, organization_id)
     DO UPDATE SET role_id = EXCLUDED.role_id, uitnodiging_hash = EXCLUDED.uitnodiging_hash,
                   uitnodiging_tot = EXCLUDED.uitnodiging_tot
     RETURNING id`,
    [gebruikerId, context.organisatieId, rolId, context.gebruikerId, sha256(token)],
  );
  const membershipId = rows[0]?.id ?? '';

  await client.query('DELETE FROM administration_access WHERE membership_id = $1', [membershipId]);
  for (const administratieId of invoer.administratieIds ?? []) {
    await client.query(
      `INSERT INTO administration_access (membership_id, administration_id, role_id, geldig_tot)
       VALUES ($1, $2, $3, $4)`,
      [membershipId, administratieId, rolId, invoer.geldigTot ?? null],
    );
  }

  const link = `${config.webUrl}/uitnodiging?token=${token}`;
  await mail().verstuur({
    aan: email,
    onderwerp: 'Je bent uitgenodigd voor een administratie in Gedmma',
    tekst: [
      'Hallo,',
      '',
      'Je bent uitgenodigd om mee te werken in een administratie in Gedmma.',
      `Klik op de volgende link om de uitnodiging te accepteren: ${link}`,
      '',
      'De uitnodiging verloopt over veertien dagen.',
    ].join('\n'),
  });

  await auditeer(client, context, {
    actie: invoer.rol === 'accountant' ? 'accountant.toegang_verleend' : 'gebruiker.uitgenodigd',
    onderwerpSoort: 'membership',
    onderwerpId: membershipId,
    gegevens: {
      email,
      rol: invoer.rol,
      administraties: invoer.administratieIds?.length ?? 0,
      geldigTot: invoer.geldigTot ?? null,
    },
  });

  return { membershipId, uitnodigingsLink: link };
}

/**
 * Accepteert een uitnodiging; bij een nieuw account wordt meteen het wachtwoord
 * gezet.
 *
 * Dit gebeurt in twee stappen. Eerst zoeken we de uitnodiging op met de hash van
 * het token als sleutel (zie migratie 007); daarna schrijven we binnen de
 * context van de gevonden organisatie. Zo blijft de schrijfregel van de policy
 * onveranderd streng: alleen binnen de eigen organisatie.
 */
export async function accepteerUitnodiging(invoer: {
  token: string;
  naam?: string;
  wachtwoord?: string;
}): Promise<{ organisatieId: string }> {
  const tokenHash = sha256(invoer.token);

  const uitnodiging = await inTransactie(
    { organisatieId: null, administratieId: null, gebruikerId: null, actorSoort: 'systeem' },
    async (client) => {
      await client.query(`SELECT set_config('gedmma.uitnodiging_hash', $1, true)`, [tokenHash]);
      const { rows } = await client.query<{
        id: string;
        user_id: string;
        organization_id: string;
        email_bevestigd: boolean;
      }>(
        `SELECT m.id, m.user_id, m.organization_id, u.email_bevestigd
           FROM membership m JOIN app_user u ON u.id = m.user_id
          WHERE m.uitnodiging_hash = $1 AND m.uitnodiging_tot > now() AND m.status = 'uitgenodigd'`,
        [tokenHash],
      );
      return rows[0] ?? null;
    },
  );

  if (!uitnodiging) {
    throw new ApiFout(
      'not_found',
      'Deze uitnodiging is niet meer geldig.',
      'Vraag degene die je uitnodigde om een nieuwe uitnodiging te sturen.',
    );
  }

  if (!uitnodiging.email_bevestigd && !invoer.wachtwoord) {
    throw fout.validatie([{ veld: 'wachtwoord', probleem: 'Kies een wachtwoord om je account te activeren.' }]);
  }

  const nieuweHash =
    !uitnodiging.email_bevestigd && invoer.wachtwoord
      ? await (async () => {
          const oordeel = beoordeelWachtwoord(invoer.wachtwoord!);
          if (!oordeel.goed) {
            throw new ApiFout('validation_failed', 'Dit wachtwoord is niet sterk genoeg.', oordeel.meldingen.join(' '));
          }
          return scryptHasher.hash(invoer.wachtwoord!);
        })()
      : null;

  const context: TenantContext = {
    organisatieId: uitnodiging.organization_id,
    administratieId: null,
    gebruikerId: uitnodiging.user_id,
    actorSoort: 'gebruiker',
  };

  await inTransactie(context, async (client) => {
    if (nieuweHash) {
      await client.query(
        `UPDATE app_user SET wachtwoord_hash = $2, naam = COALESCE($3, naam), email_bevestigd = true
          WHERE id = $1`,
        [uitnodiging.user_id, nieuweHash, invoer.naam ?? null],
      );
    }
    await client.query(
      `UPDATE membership SET status = 'actief', uitnodiging_hash = NULL, uitnodiging_tot = NULL
        WHERE id = $1`,
      [uitnodiging.id],
    );
    await auditeer(client, context, {
      actie: 'gebruiker.uitgenodigd',
      onderwerpSoort: 'membership',
      onderwerpId: uitnodiging.id,
      gegevens: { geaccepteerd: true },
    });
  });

  return { organisatieId: uitnodiging.organization_id };
}

export async function wijzigRol(
  client: Db,
  context: TenantContext & { organisatieId: string },
  membershipId: string,
  rolSleutel: string,
): Promise<void> {
  const { rows } = await client.query<{ user_id: string; huidige_rol: string }>(
    `SELECT m.user_id, r.sleutel AS huidige_rol
       FROM membership m JOIN role r ON r.id = m.role_id
      WHERE m.id = $1 AND m.organization_id = $2`,
    [membershipId, context.organisatieId],
  );
  const lid = rows[0];
  if (!lid) throw fout.nietGevonden('Dit lidmaatschap');

  // Je eigen rechten uitbreiden mag niet: dat is de klassieke manier om
  // functiescheiding te omzeilen.
  if (lid.user_id === context.gebruikerId) {
    throw new ApiFout(
      'forbidden',
      'Je kunt je eigen rol niet wijzigen.',
      'Vraag een andere beheerder van deze organisatie om de wijziging te doen.',
    );
  }
  if (lid.huidige_rol === 'owner') {
    throw new ApiFout('forbidden', 'De rol van de eigenaar kan niet worden gewijzigd.', '');
  }

  const rol = await client.query<{ id: string }>(
    'SELECT id FROM role WHERE sleutel = $1 AND organization_id IS NULL',
    [rolSleutel],
  );
  const rolId = rol.rows[0]?.id;
  if (!rolId) throw fout.validatie([{ veld: 'rol', probleem: `De rol "${rolSleutel}" bestaat niet.` }]);

  await client.query('UPDATE membership SET role_id = $2 WHERE id = $1', [membershipId, rolId]);

  // Rechten gewijzigd: alle sessies van die gebruiker verlopen, zodat de nieuwe
  // rechten meteen gelden en een oude sessie geen oude rechten meeneemt.
  await client.query(
    'UPDATE session SET ingetrokken_op = now() WHERE user_id = $1 AND ingetrokken_op IS NULL',
    [lid.user_id],
  );

  await auditeer(client, context, {
    actie: 'gebruiker.rol_gewijzigd',
    onderwerpSoort: 'membership',
    onderwerpId: membershipId,
    gegevens: { van: lid.huidige_rol, naar: rolSleutel },
  });
}

export async function trekToegangIn(
  client: Db,
  context: TenantContext & { organisatieId: string },
  membershipId: string,
): Promise<void> {
  const { rows } = await client.query<{ user_id: string; rol: string }>(
    `SELECT m.user_id, r.sleutel AS rol FROM membership m JOIN role r ON r.id = m.role_id
      WHERE m.id = $1 AND m.organization_id = $2`,
    [membershipId, context.organisatieId],
  );
  const lid = rows[0];
  if (!lid) throw fout.nietGevonden('Dit lidmaatschap');
  if (lid.rol === 'owner') {
    throw new ApiFout('forbidden', 'De eigenaar kan zichzelf niet uit de organisatie verwijderen.', '');
  }

  await client.query('DELETE FROM membership WHERE id = $1', [membershipId]);
  await client.query(
    'UPDATE session SET ingetrokken_op = now() WHERE user_id = $1 AND ingetrokken_op IS NULL',
    [lid.user_id],
  );

  await auditeer(client, context, {
    actie: lid.rol === 'accountant' ? 'accountant.toegang_ingetrokken' : 'gebruiker.verwijderd',
    onderwerpSoort: 'membership',
    onderwerpId: membershipId,
    gegevens: { rol: lid.rol },
  });
}
