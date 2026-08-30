/**
 * Aanmelden, sessies en tweefactorauthenticatie.
 *
 * Sessietokens worden alleen als hash opgeslagen: een gestolen database levert
 * geen bruikbare sessies op. Bij elke wijziging van rechten of factoren wordt de
 * sessie geroteerd.
 */
import { db, inTransactie, SYSTEEM_CONTEXT, type TenantContext } from '../db/pool.ts';
import { config } from '../config.ts';
import { gelijkInConstanteTijd, hashIp, nieuwToken, ontsleutel, sha256, versleutel } from '../util/crypto.ts';
import { beoordeelWachtwoord, scryptHasher } from './wachtwoord.ts';
import { berekenCode, controleerCode, nieuweHerstelcodes, nieuwGeheim, otpauthUri } from './totp.ts';
import { ApiFout } from '../http/fout.ts';
import { auditeer } from '../modules/audit/service.ts';
import { eisRuimte, LIMIETEN, reset } from '../http/ratelimit.ts';

export type GebruikerRij = {
  id: string;
  email: string;
  naam: string;
  wachtwoord_hash: string;
  locale: string;
  status: string;
  email_bevestigd: boolean;
  mislukte_pogingen: number;
  geblokkeerd_tot: Date | null;
};

export type SessieResultaat = {
  token: string;
  sessieId: string;
  mfaNodig: boolean;
  verlooptOp: string;
};

const MAX_MISLUKT = 8;

function sessieVerloop(): Date {
  return new Date(Date.now() + config.beveiliging.sessieDuurUren * 3600_000);
}

/**
 * Registreert een gebruiker. Levert altijd hetzelfde antwoord op, ook als het
 * adres al bestaat: anders is af te leiden wie er een account heeft.
 */
export async function registreer(invoer: {
  email: string;
  naam: string;
  wachtwoord: string;
  locale?: string;
  ip?: string;
}): Promise<{ gebruikerId: string | null }> {
  const email = invoer.email.trim().toLowerCase();
  await eisRuimte(`registreren:${hashIp(invoer.ip) ?? 'onbekend'}`, LIMIETEN.registreren);

  const oordeel = beoordeelWachtwoord(invoer.wachtwoord, [invoer.naam, email.split('@')[0] ?? '']);
  if (!oordeel.goed) {
    throw new ApiFout(
      'validation_failed',
      'Dit wachtwoord is niet sterk genoeg.',
      oordeel.meldingen.join(' '),
      { veld: 'wachtwoord', meldingen: oordeel.meldingen },
    );
  }

  const hash = await scryptHasher.hash(invoer.wachtwoord);

  return inTransactie(SYSTEEM_CONTEXT, async (client) => {
    const bestaand = await client.query<{ id: string }>('SELECT id FROM app_user WHERE email = $1', [email]);
    if (bestaand.rows.length > 0) {
      // Geen fout: het antwoord mag niet verraden dat dit adres bestaat.
      return { gebruikerId: null };
    }
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO app_user (email, naam, wachtwoord_hash, locale, email_bevestigd)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [email, invoer.naam.trim(), hash, invoer.locale ?? 'nl', config.isProductie ? false : true],
    );
    const gebruikerId = rows[0]?.id ?? null;
    await auditeer(
      client,
      { ...SYSTEEM_CONTEXT, gebruikerId },
      { actie: 'auth.geregistreerd', onderwerpSoort: 'app_user', onderwerpId: gebruikerId ?? undefined, gegevens: { email }, ipHash: hashIp(invoer.ip) },
    );
    return { gebruikerId };
  });
}

/** Meldt aan met e-mail en wachtwoord. De tweede factor komt daarna. */
export async function meldAan(invoer: {
  email: string;
  wachtwoord: string;
  ip?: string;
  userAgent?: string;
}): Promise<SessieResultaat> {
  const email = invoer.email.trim().toLowerCase();
  const ipHash = hashIp(invoer.ip);
  await eisRuimte(`aanmelden:ip:${ipHash ?? 'onbekend'}`, LIMIETEN.aanmelden);
  await eisRuimte(`aanmelden:account:${sha256(email)}`, LIMIETEN.aanmeldenPerAccount);

  const gebruiker = await inTransactie(SYSTEEM_CONTEXT, async (client) => {
    const { rows } = await client.query<GebruikerRij>(
      `SELECT id, email, naam, wachtwoord_hash, locale, status, email_bevestigd,
              mislukte_pogingen, geblokkeerd_tot
         FROM app_user WHERE email = $1 AND verwijderd_op IS NULL`,
      [email],
    );
    return rows[0] ?? null;
  });

  const onjuist = new ApiFout(
    'unauthenticated',
    'Het e-mailadres of wachtwoord klopt niet.',
    'Controleer je gegevens. Weet je het wachtwoord niet meer, vraag dan een nieuw wachtwoord aan.',
  );

  if (!gebruiker) {
    // Even lang wachten als bij een bestaand account, zodat het verschil niet
    // meetbaar is.
    await scryptHasher.controleer(invoer.wachtwoord, `scrypt$16384$8$1$${'A'.repeat(22)}$${'A'.repeat(43)}`);
    throw onjuist;
  }

  if (gebruiker.geblokkeerd_tot && gebruiker.geblokkeerd_tot.getTime() > Date.now()) {
    throw new ApiFout(
      'rate_limited',
      'Dit account is tijdelijk geblokkeerd na te veel mislukte pogingen.',
      'Probeer het over een kwartier opnieuw, of stel een nieuw wachtwoord in.',
    );
  }
  if (gebruiker.status !== 'actief') {
    throw new ApiFout('forbidden', 'Dit account is niet actief.', 'Neem contact op met de beheerder van je organisatie.');
  }

  const klopt = await scryptHasher.controleer(invoer.wachtwoord, gebruiker.wachtwoord_hash);
  if (!klopt) {
    await inTransactie(SYSTEEM_CONTEXT, async (client) => {
      const pogingen = gebruiker.mislukte_pogingen + 1;
      await client.query(
        `UPDATE app_user SET mislukte_pogingen = $2::int,
                geblokkeerd_tot = CASE WHEN $2::int >= $3::int
                                       THEN now() + interval '15 minutes'
                                       ELSE geblokkeerd_tot END
          WHERE id = $1`,
        [gebruiker.id, pogingen, MAX_MISLUKT],
      );
      await auditeer(
        client,
        { ...SYSTEEM_CONTEXT, gebruikerId: gebruiker.id },
        { actie: 'auth.aanmelden_mislukt', onderwerpSoort: 'app_user', onderwerpId: gebruiker.id, gegevens: { pogingen }, ipHash },
      );
    });
    throw onjuist;
  }

  const heeftMfa = await heeftBevestigdeMfa(gebruiker.id);
  const token = nieuwToken();
  const verlooptOp = sessieVerloop();

  const sessieId = await inTransactie(SYSTEEM_CONTEXT, async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO session (user_id, token_hash, mfa_voldaan, ip_hash, user_agent, verloopt_op)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [gebruiker.id, sha256(token), !heeftMfa, ipHash, invoer.userAgent?.slice(0, 300) ?? null, verlooptOp],
    );
    await client.query(
      'UPDATE app_user SET mislukte_pogingen = 0, geblokkeerd_tot = NULL, laatste_login_op = now() WHERE id = $1',
      [gebruiker.id],
    );
    // Herhashen als de parameters intussen zwaarder zijn geworden (ADR-008).
    if (scryptHasher.moetHerhashen(gebruiker.wachtwoord_hash)) {
      const nieuweHash = await scryptHasher.hash(invoer.wachtwoord);
      await client.query('UPDATE app_user SET wachtwoord_hash = $2 WHERE id = $1', [gebruiker.id, nieuweHash]);
    }
    await auditeer(
      client,
      { ...SYSTEEM_CONTEXT, gebruikerId: gebruiker.id },
      { actie: 'auth.aangemeld', onderwerpSoort: 'app_user', onderwerpId: gebruiker.id, gegevens: { mfa: heeftMfa }, ipHash },
    );
    return rows[0]?.id ?? '';
  });

  await reset(`aanmelden:account:${sha256(email)}`);

  return { token, sessieId, mfaNodig: heeftMfa, verlooptOp: verlooptOp.toISOString() };
}

/** Heeft deze gebruiker een bevestigde tweede factor? */
export async function heeftMfa(gebruikerId: string): Promise<boolean> {
  return heeftBevestigdeMfa(gebruikerId);
}

export type ActieveSessie = {
  id: string;
  aangemaaktOp: string;
  laatstGezienOp: string;
  verlooptOp: string;
  apparaat: string;
};

/** De sessies waarmee een gebruiker op dit moment is aangemeld. */
export async function actieveSessies(gebruikerId: string): Promise<ActieveSessie[]> {
  const { rows } = await db().query<{
    id: string;
    aangemaakt_op: Date;
    laatst_gezien_op: Date;
    verloopt_op: Date;
    user_agent: string | null;
  }>(
    `SELECT id, aangemaakt_op, laatst_gezien_op, verloopt_op, user_agent
       FROM session
      WHERE user_id = $1 AND ingetrokken_op IS NULL AND verloopt_op > now()
      ORDER BY laatst_gezien_op DESC`,
    [gebruikerId],
  );
  return rows.map((rij) => ({
    id: rij.id,
    aangemaaktOp: rij.aangemaakt_op.toISOString(),
    laatstGezienOp: rij.laatst_gezien_op.toISOString(),
    verlooptOp: rij.verloopt_op.toISOString(),
    apparaat: rij.user_agent ?? 'Onbekend apparaat',
  }));
}

async function heeftBevestigdeMfa(gebruikerId: string): Promise<boolean> {
  const { rows } = await db().query<{ aantal: string }>(
    `SELECT count(*)::text AS aantal FROM user_credential
      WHERE user_id = $1 AND soort = 'totp' AND bevestigd_op IS NOT NULL`,
    [gebruikerId],
  );
  return Number(rows[0]?.aantal ?? '0') > 0;
}

export type SessieGegevens = {
  sessieId: string;
  gebruikerId: string;
  email: string;
  naam: string;
  locale: string;
  mfaVoldaan: boolean;
  supportGebruikerId: string | null;
};

/** Zoekt de sessie bij een token en werkt de laatst-gezien-tijd bij. */
export async function leesSessie(token: string): Promise<SessieGegevens | null> {
  const { rows } = await db().query<{
    id: string;
    user_id: string;
    email: string;
    naam: string;
    locale: string;
    mfa_voldaan: boolean;
    laatst_gezien_op: Date;
    support_user_id: string | null;
    support_tot: Date | null;
  }>(
    `SELECT s.id, s.user_id, u.email, u.naam, u.locale, s.mfa_voldaan, s.laatst_gezien_op,
            s.support_user_id, s.support_tot
       FROM session s JOIN app_user u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.ingetrokken_op IS NULL
        AND s.verloopt_op > now()
        AND u.status = 'actief'
        AND u.verwijderd_op IS NULL`,
    [sha256(token)],
  );
  const rij = rows[0];
  if (!rij) return null;

  const inactiefMs = Date.now() - rij.laatst_gezien_op.getTime();
  if (inactiefMs > config.beveiliging.sessieInactiviteitMinuten * 60_000) {
    await db().query('UPDATE session SET ingetrokken_op = now() WHERE id = $1', [rij.id]);
    return null;
  }
  if (rij.support_tot && rij.support_tot.getTime() < Date.now()) {
    await db().query('UPDATE session SET ingetrokken_op = now() WHERE id = $1', [rij.id]);
    return null;
  }

  await db().query('UPDATE session SET laatst_gezien_op = now() WHERE id = $1', [rij.id]);

  return {
    sessieId: rij.id,
    gebruikerId: rij.user_id,
    email: rij.email,
    naam: rij.naam,
    locale: rij.locale,
    mfaVoldaan: rij.mfa_voldaan,
    supportGebruikerId: rij.support_user_id,
  };
}

export async function meldAf(sessieId: string, context: TenantContext): Promise<void> {
  await inTransactie(context, async (client) => {
    await client.query('UPDATE session SET ingetrokken_op = now() WHERE id = $1', [sessieId]);
    await auditeer(client, context, { actie: 'auth.afgemeld', onderwerpSoort: 'session', onderwerpId: sessieId });
  });
}

/** Trekt alle sessies van een gebruiker in, behalve eventueel de huidige. */
export async function trekSessiesIn(
  gebruikerId: string,
  context: TenantContext,
  behoudSessieId?: string,
): Promise<number> {
  return inTransactie(context, async (client) => {
    const { rowCount } = await client.query(
      `UPDATE session SET ingetrokken_op = now()
        WHERE user_id = $1 AND ingetrokken_op IS NULL AND ($2::uuid IS NULL OR id <> $2)`,
      [gebruikerId, behoudSessieId ?? null],
    );
    await auditeer(client, context, {
      actie: 'auth.sessie_ingetrokken',
      onderwerpSoort: 'app_user',
      onderwerpId: gebruikerId,
      gegevens: { aantal: rowCount },
    });
    return rowCount;
  });
}

// --- Tweefactorauthenticatie ---------------------------------------------

export type MfaOpzet = { geheim: string; uri: string };

/** Zet MFA klaar; hij wordt pas actief als de gebruiker een code bevestigt. */
export async function begintMfaOpzet(gebruikerId: string, email: string): Promise<MfaOpzet> {
  const geheim = nieuwGeheim();
  await db().query(
    `INSERT INTO user_credential (user_id, soort, label, geheim) VALUES ($1, 'totp', $2, $3)`,
    [gebruikerId, 'Authenticator', versleutel(geheim)],
  );
  return { geheim, uri: otpauthUri(geheim, email) };
}

/** Bevestigt de opzet met een code uit de app en levert de herstelcodes op. */
export async function bevestigMfa(
  gebruikerId: string,
  code: string,
  context: TenantContext,
): Promise<{ herstelcodes: string[] }> {
  return inTransactie(context, async (client) => {
    const { rows } = await client.query<{ id: string; geheim: string }>(
      `SELECT id, geheim FROM user_credential
        WHERE user_id = $1 AND soort = 'totp' AND bevestigd_op IS NULL
        ORDER BY aangemaakt_op DESC LIMIT 1`,
      [gebruikerId],
    );
    const rij = rows[0];
    if (!rij) {
      throw new ApiFout(
        'not_found',
        'Er staat geen tweestapsverificatie klaar om te bevestigen.',
        'Begin opnieuw met instellen.',
      );
    }
    if (!controleerCode(ontsleutel(rij.geheim), code)) {
      throw new ApiFout(
        'validation_failed',
        'Deze code klopt niet.',
        'Controleer of de tijd op je telefoon goed staat en probeer de nieuwste code.',
      );
    }

    await client.query('UPDATE user_credential SET bevestigd_op = now() WHERE id = $1', [rij.id]);
    await client.query(
      `DELETE FROM user_credential WHERE user_id = $1 AND soort = 'totp' AND bevestigd_op IS NULL`,
      [gebruikerId],
    );

    const codes = nieuweHerstelcodes();
    await client.query(`DELETE FROM user_credential WHERE user_id = $1 AND soort = 'herstelcode'`, [gebruikerId]);
    for (const herstelcode of codes) {
      await client.query(
        `INSERT INTO user_credential (user_id, soort, geheim) VALUES ($1, 'herstelcode', $2)`,
        [gebruikerId, sha256(herstelcode)],
      );
    }
    await client.query('UPDATE session SET mfa_voldaan = true WHERE user_id = $1 AND ingetrokken_op IS NULL', [gebruikerId]);
    await auditeer(client, context, { actie: 'auth.mfa_ingeschakeld', onderwerpSoort: 'app_user', onderwerpId: gebruikerId });
    return { herstelcodes: codes };
  });
}

/** Voldoet aan de tweede stap tijdens het aanmelden. */
export async function voldoeMfa(
  sessieId: string,
  gebruikerId: string,
  code: string,
  context: TenantContext,
): Promise<void> {
  await eisRuimte(`mfa:${gebruikerId}`, { aantal: 10, vensterSeconden: 900 });

  await inTransactie(context, async (client) => {
    const { rows } = await client.query<{ id: string; geheim: string; soort: string }>(
      `SELECT id, geheim, soort FROM user_credential
        WHERE user_id = $1 AND ((soort = 'totp' AND bevestigd_op IS NOT NULL) OR soort = 'herstelcode')`,
      [gebruikerId],
    );

    const schoon = code.replace(/\s/g, '').toUpperCase();
    for (const rij of rows) {
      const goed =
        rij.soort === 'totp'
          ? controleerCode(ontsleutel(rij.geheim), code)
          : gelijkInConstanteTijd(rij.geheim, sha256(schoon));
      if (!goed) continue;

      if (rij.soort === 'herstelcode') {
        await client.query('DELETE FROM user_credential WHERE id = $1', [rij.id]);
        await auditeer(client, context, {
          actie: 'auth.mfa_herstelcode_gebruikt',
          onderwerpSoort: 'app_user',
          onderwerpId: gebruikerId,
        });
      } else {
        await client.query('UPDATE user_credential SET gebruikt_op = now() WHERE id = $1', [rij.id]);
      }
      await client.query('UPDATE session SET mfa_voldaan = true WHERE id = $1', [sessieId]);
      return;
    }

    throw new ApiFout(
      'validation_failed',
      'Deze code klopt niet.',
      'Vul de code uit je authenticator-app in, of gebruik een van je herstelcodes.',
    );
  });
}

/** Zet MFA uit; vereist het huidige wachtwoord. */
export async function schakelMfaUit(
  gebruikerId: string,
  wachtwoord: string,
  context: TenantContext,
): Promise<void> {
  await inTransactie(context, async (client) => {
    const { rows } = await client.query<{ wachtwoord_hash: string }>(
      'SELECT wachtwoord_hash FROM app_user WHERE id = $1',
      [gebruikerId],
    );
    const hash = rows[0]?.wachtwoord_hash;
    if (!hash || !(await scryptHasher.controleer(wachtwoord, hash))) {
      throw new ApiFout('forbidden', 'Het wachtwoord klopt niet.', 'Vul je huidige wachtwoord in om dit te wijzigen.');
    }
    await client.query(
      `DELETE FROM user_credential WHERE user_id = $1 AND soort IN ('totp', 'herstelcode')`,
      [gebruikerId],
    );
    await auditeer(client, context, { actie: 'auth.mfa_uitgeschakeld', onderwerpSoort: 'app_user', onderwerpId: gebruikerId });
  });
}

/** Wijzigt het wachtwoord en trekt alle andere sessies in. */
export async function wijzigWachtwoord(
  gebruikerId: string,
  huidig: string,
  nieuw: string,
  context: TenantContext,
  huidigeSessieId?: string,
): Promise<void> {
  const oordeel = beoordeelWachtwoord(nieuw);
  if (!oordeel.goed) {
    throw new ApiFout('validation_failed', 'Dit wachtwoord is niet sterk genoeg.', oordeel.meldingen.join(' '));
  }
  await inTransactie(context, async (client) => {
    const { rows } = await client.query<{ wachtwoord_hash: string }>(
      'SELECT wachtwoord_hash FROM app_user WHERE id = $1',
      [gebruikerId],
    );
    const hash = rows[0]?.wachtwoord_hash;
    if (!hash || !(await scryptHasher.controleer(huidig, hash))) {
      throw new ApiFout('forbidden', 'Je huidige wachtwoord klopt niet.', 'Probeer het opnieuw.');
    }
    await client.query('UPDATE app_user SET wachtwoord_hash = $2, gewijzigd_op = now() WHERE id = $1', [
      gebruikerId,
      await scryptHasher.hash(nieuw),
    ]);
    await client.query(
      `UPDATE session SET ingetrokken_op = now()
        WHERE user_id = $1 AND ingetrokken_op IS NULL AND ($2::uuid IS NULL OR id <> $2)`,
      [gebruikerId, huidigeSessieId ?? null],
    );
    await auditeer(client, context, { actie: 'auth.wachtwoord_gewijzigd', onderwerpSoort: 'app_user', onderwerpId: gebruikerId });
  });
}

/** Alleen voor tests en de seed: een geldige code voor een geheim. */
export const testHulp = { berekenCode };
