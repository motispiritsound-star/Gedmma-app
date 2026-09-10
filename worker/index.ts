/**
 * The website's own small back end.
 *
 * Everything the marketplace itself will need lives in apps/api — Fastify,
 * Prisma, PostgreSQL — and none of it is deployed yet. What the *website*
 * needs before then is much smaller: remember who wants to be told when
 * Buurklus opens, take a message from the contact form, and tell the operator
 * that something came in. Three things, two tables, no server to keep alive.
 *
 * Requests for anything else fall through to the static site.
 */
import { EmailMessage } from 'cloudflare:email';
import { buildNotification } from './notification.js';
import { accessTokenFrom, verifyAccessJwt } from './access.js';
import { ADMIN_STYLES, renderAdminPage, type ContactMessage } from './admin.js';
import {
  contactSchema,
  documentVersion,
  signupSchema,
  type ContactInput,
  type SignupInput,
  type SignupRecord,
} from '@buurklus/shared';

export interface Env {
  DB: D1Database;
  NOTIFY: { send(message: EmailMessage): Promise<void> };
  ASSETS: { fetch(request: Request): Promise<Response> };
  /** Where notifications go. Must be a verified address in Email Routing. */
  NOTIFY_TO: string;
  /** The address they appear to come from. Must be on this domain. */
  NOTIFY_FROM: string;
  /** The Cloudflare Access team name, e.g. "buurklus". Guards /beheer. */
  ACCESS_TEAM_DOMAIN?: string;
  /** The Access application's Audience tag. */
  ACCESS_AUD?: string;
}

/** How many submissions one address may make in an hour before we stop. */
const MAX_PER_IP_PER_HOUR = 5;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const fail = (code: string, status = 400) => json({ error: { code } }, status);

function clientIp(request: Request): string | null {
  return request.headers.get('CF-Connecting-IP');
}

/**
 * A crude throttle, counted in the database rather than in memory: a Worker
 * has no memory between requests. It is not a defence against a determined
 * attacker — that is what Cloudflare's own rate limiting is for — but it does
 * stop the accidental double-click and the trivial script.
 */
async function overLimit(env: Env, table: 'signups' | 'contact_messages', ip: string | null) {
  if (!ip) return false;
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const column = table === 'signups' ? 'consent_ip' : 'ip';
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM ${table} WHERE ${column} = ? AND created_at > ?`,
  )
    .bind(ip, since)
    .first<{ n: number }>();
  return (row?.n ?? 0) >= MAX_PER_IP_PER_HOUR;
}

/**
 * Sends it, and says whether it went. The caller must not let a failure here
 * cost somebody their place on the list — but it must not hide it either, so
 * the reason is logged where `wrangler tail` and the dashboard can show it.
 */
async function notify(
  env: Env,
  subject: string,
  lines: string[],
  replyTo?: { name?: string; addr: string },
): Promise<boolean> {
  try {
    const raw = buildNotification({
      from: env.NOTIFY_FROM,
      to: env.NOTIFY_TO,
      subject,
      lines,
      replyTo,
    });
    await env.NOTIFY.send(new EmailMessage(env.NOTIFY_FROM, env.NOTIFY_TO, raw));
    return true;
  } catch (error) {
    console.error('notification failed', { subject, error: String(error) });
    return false;
  }
}

async function handleSignup(request: Request, env: Env): Promise<Response> {
  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'invalid');

  const input: SignupInput = parsed.data;
  // A bot filled the field no person can see. Answer as if all is well: a bot
  // told it failed simply tries again with the field left empty.
  if (input.website) return json({ ok: true, alreadyRegistered: false });

  const ip = clientIp(request);
  if (await overLimit(env, 'signups', ip)) return fail('too_many_requests', 429);

  const now = new Date().toISOString();
  const existing = await env.DB.prepare('SELECT id FROM signups WHERE email = ?')
    .bind(input.email)
    .first<{ id: string }>();

  const row = {
    role: input.role,
    email: input.email,
    name: input.name || null,
    phone: input.phone ?? null,
    city_slug: input.citySlug || null,
    category_slugs: input.categorySlugs?.length ? input.categorySlugs.join(',') : null,
    kvk: input.kvk ?? null,
    locale: input.locale ?? 'nl',
    job_note: input.jobNote || null,
  };

  if (existing) {
    await env.DB.prepare(
      `UPDATE signups SET updated_at = ?, role = ?, name = ?, phone = ?, city_slug = ?,
       category_slugs = ?, kvk = ?, locale = ?, job_note = ?, consent_at = ?, consent_ip = ?,
       consent_version = ?, unsubscribed_at = NULL,
       -- A new request from the same address is a new request, even if the
       -- last one was dealt with weeks ago.
       handled_at = NULL WHERE id = ?`,
    )
      .bind(
        now, row.role, row.name, row.phone, row.city_slug, row.category_slugs, row.kvk,
        row.locale, row.job_note, now, ip, documentVersion('PRIVACY'), existing.id,
      )
      .run();
  } else {
    await env.DB.prepare(
      `INSERT INTO signups (id, created_at, updated_at, role, email, name, phone, city_slug,
       category_slugs, kvk, locale, job_note, consent_at, consent_ip, consent_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        crypto.randomUUID(), now, now, row.role, row.email, row.name, row.phone, row.city_slug,
        row.category_slugs, row.kvk, row.locale, row.job_note, now, ip, documentVersion('PRIVACY'),
      )
      .run();
  }

  // The sign-up is saved before the notification is attempted. A mail server
  // having a bad minute must never cost somebody their place on the list.
  const notified = await notify(env, `Aanmelding: ${row.role === 'PRO' ? 'vakman' : 'klant'} — ${input.email}`, [
    `Rol:       ${row.role === 'PRO' ? 'Vakman of bedrijf' : 'Klant met een klus'}`,
    `E-mail:    ${input.email}`,
    `Naam:      ${row.name ?? '—'}`,
    `Gemeente:  ${row.city_slug ?? '—'}`,
    `Telefoon:  ${row.phone ?? '—'}`,
    row.kvk ? `KvK:       ${row.kvk}` : null,
    row.category_slugs ? `Vakgebied: ${row.category_slugs}` : null,
    row.job_note ? `Klus:      ${row.job_note}` : null,
    '',
    existing ? 'Dit adres stond al op de lijst; de gegevens zijn bijgewerkt.' : 'Nieuw op de lijst.',
    `Tijdstip:  ${now}`,
  ].filter((line): line is string => line !== null), { name: row.name ?? undefined, addr: input.email });

  return json({ ok: true, alreadyRegistered: Boolean(existing), notified });
}

async function handleContact(request: Request, env: Env): Promise<Response> {
  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'invalid');

  const input: ContactInput = parsed.data;
  if (input.website) return json({ ok: true });

  const ip = clientIp(request);
  if (await overLimit(env, 'contact_messages', ip)) return fail('too_many_requests', 429);

  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO contact_messages (id, created_at, name, email, message, locale, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(crypto.randomUUID(), now, input.name, input.email, input.message, input.locale ?? 'nl', ip)
    .run();

  const notified = await notify(env, `Bericht van ${input.name}`, [
    `Van:      ${input.name} <${input.email}>`,
    `Tijdstip: ${now}`,
    '',
    input.message,
    '',
    '— Druk op beantwoorden; dat gaat rechtstreeks naar de afzender.',
  ], { name: input.name, addr: input.email });

  return json({ ok: true, notified });
}


// ---------------------------------------------------------------------------
// The operator's own page
// ---------------------------------------------------------------------------

/** Rows come out of SQLite as strings; the rest of the code wants a record. */
function toSignup(row: Record<string, unknown>): SignupRecord {
  const text = (key: string) => (typeof row[key] === 'string' ? (row[key] as string) : null);
  return {
    id: String(row.id),
    role: row.role === 'PRO' ? 'PRO' : 'CUSTOMER',
    email: String(row.email),
    name: text('name'),
    phone: text('phone'),
    citySlug: text('city_slug'),
    categorySlugs: (text('category_slugs') ?? '').split(',').filter(Boolean),
    kvk: text('kvk'),
    jobNote: text('job_note'),
    createdAt: String(row.created_at),
    handledAt: text('handled_at'),
    unsubscribedAt: text('unsubscribed_at'),
  };
}

/**
 * No valid Access token, no page — including when Access was never configured.
 * The alternative is a page that is public exactly when somebody forgot to
 * protect it, which is the moment it must not be.
 */
async function requireOperator(request: Request, env: Env): Promise<string | Response> {
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) {
    console.error('beheer: ACCESS_TEAM_DOMAIN or ACCESS_AUD is not set');
    return new Response('Beheer is niet ingeschakeld.', {
      status: 503,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  const token = accessTokenFrom(request);
  if (!token) return new Response('Niet ingelogd.', { status: 401, headers: { 'cache-control': 'no-store' } });

  try {
    const identity = await verifyAccessJwt(token, {
      teamDomain: env.ACCESS_TEAM_DOMAIN,
      aud: env.ACCESS_AUD,
    });
    return identity.email;
  } catch (error) {
    console.error('beheer: token rejected', String(error));
    return new Response('Geen toegang.', { status: 403, headers: { 'cache-control': 'no-store' } });
  }
}

/** Nothing on this page may be cached, indexed, framed or scripted. */
function adminResponse(body: string, contentType: string): Response {
  return new Response(body, {
    headers: {
      'content-type': contentType,
      'cache-control': 'no-store, private',
      'x-robots-tag': 'noindex, nofollow',
      'referrer-policy': 'no-referrer',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'content-security-policy':
        "default-src 'none'; style-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    },
  });
}

async function handleAdmin(request: Request, env: Env, viewer: string): Promise<Response> {
  const [signups, messages] = await Promise.all([
    env.DB.prepare('SELECT * FROM signups ORDER BY created_at DESC LIMIT 1000').all(),
    env.DB.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 200').all(),
  ]);

  const html = renderAdminPage({
    viewer,
    now: new Date(),
    signups: (signups.results as Record<string, unknown>[]).map(toSignup),
    messages: (messages.results as Record<string, unknown>[]).map((row) => ({
      id: String(row.id),
      createdAt: String(row.created_at),
      name: String(row.name),
      email: String(row.email),
      message: String(row.message),
      handledAt: typeof row.handled_at === 'string' ? row.handled_at : null,
    })) satisfies ContactMessage[],
  });

  return adminResponse(html, 'text/html; charset=utf-8');
}

/** Marking something done is a plain form post: no script, nothing to hash. */
async function handleAdminHandled(request: Request, env: Env): Promise<Response> {
  const form = await request.formData();
  const id = String(form.get('id') ?? '');
  const kind = String(form.get('soort') ?? '');
  const table = kind === 'bericht' ? 'contact_messages' : kind === 'aanvraag' ? 'signups' : null;
  if (!table || !id) return fail('invalid');

  await env.DB.prepare(`UPDATE ${table} SET handled_at = ? WHERE id = ?`)
    .bind(new Date().toISOString(), id)
    .run();

  // See Other, so a reload of the page does not repeat the post.
  return new Response(null, { status: 303, headers: { location: '/beheer', 'cache-control': 'no-store' } });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/beheer/stijl.css') {
      return adminResponse(ADMIN_STYLES, 'text/css; charset=utf-8');
    }

    if (url.pathname === '/beheer' || url.pathname === '/beheer/afgehandeld') {
      const operator = await requireOperator(request, env);
      if (operator instanceof Response) return operator;
      try {
        if (url.pathname === '/beheer') return await handleAdmin(request, env, operator);
        if (request.method !== 'POST') return fail('method_not_allowed', 405);
        return await handleAdminHandled(request, env);
      } catch (error) {
        console.error(error);
        return fail('server_error', 500);
      }
    }

    if (url.pathname === '/api/signup' || url.pathname === '/api/contact') {
      if (request.method !== 'POST') return fail('method_not_allowed', 405);
      try {
        return url.pathname === '/api/signup'
          ? await handleSignup(request, env)
          : await handleContact(request, env);
      } catch (error) {
        // Never hand a database message to a visitor.
        console.error(error);
        return fail('server_error', 500);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
