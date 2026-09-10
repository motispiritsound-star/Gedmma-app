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
import { createMimeMessage } from 'mimetext';
import {
  contactSchema,
  documentVersion,
  signupSchema,
  type ContactInput,
  type SignupInput,
} from '@buurklus/shared';

export interface Env {
  DB: D1Database;
  NOTIFY: { send(message: EmailMessage): Promise<void> };
  ASSETS: { fetch(request: Request): Promise<Response> };
  /** Where notifications go. Must be a verified address in Email Routing. */
  NOTIFY_TO: string;
  /** The address they appear to come from. Must be on this domain. */
  NOTIFY_FROM: string;
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

async function notify(env: Env, subject: string, lines: string[]) {
  const message = createMimeMessage();
  message.setSender({ name: 'Buurklus', addr: env.NOTIFY_FROM });
  message.setRecipient(env.NOTIFY_TO);
  message.setSubject(subject);
  message.addMessage({ contentType: 'text/plain', data: lines.join('\n') });

  await env.NOTIFY.send(new EmailMessage(env.NOTIFY_FROM, env.NOTIFY_TO, message.asRaw()));
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
  };

  if (existing) {
    await env.DB.prepare(
      `UPDATE signups SET updated_at = ?, role = ?, name = ?, phone = ?, city_slug = ?,
       category_slugs = ?, kvk = ?, locale = ?, consent_at = ?, consent_ip = ?,
       consent_version = ?, unsubscribed_at = NULL WHERE id = ?`,
    )
      .bind(
        now, row.role, row.name, row.phone, row.city_slug, row.category_slugs, row.kvk,
        row.locale, now, ip, documentVersion('PRIVACY'), existing.id,
      )
      .run();
  } else {
    await env.DB.prepare(
      `INSERT INTO signups (id, created_at, updated_at, role, email, name, phone, city_slug,
       category_slugs, kvk, locale, consent_at, consent_ip, consent_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        crypto.randomUUID(), now, now, row.role, row.email, row.name, row.phone, row.city_slug,
        row.category_slugs, row.kvk, row.locale, now, ip, documentVersion('PRIVACY'),
      )
      .run();
  }

  // The sign-up is saved before the notification is attempted. A mail server
  // having a bad minute must never cost somebody their place on the list.
  await notify(env, `Aanmelding: ${row.role === 'PRO' ? 'vakman' : 'klant'} — ${input.email}`, [
    `Rol:       ${row.role === 'PRO' ? 'Vakman of bedrijf' : 'Klant met een klus'}`,
    `E-mail:    ${input.email}`,
    `Naam:      ${row.name ?? '—'}`,
    `Gemeente:  ${row.city_slug ?? '—'}`,
    `Telefoon:  ${row.phone ?? '—'}`,
    row.kvk ? `KvK:       ${row.kvk}` : null,
    row.category_slugs ? `Vakgebied: ${row.category_slugs}` : null,
    '',
    existing ? 'Dit adres stond al op de lijst; de gegevens zijn bijgewerkt.' : 'Nieuw op de lijst.',
    `Tijdstip:  ${now}`,
  ].filter((line): line is string => line !== null)).catch(() => {});

  return json({ ok: true, alreadyRegistered: Boolean(existing) });
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

  await notify(env, `Bericht van ${input.name}`, [
    `Van:      ${input.name} <${input.email}>`,
    `Tijdstip: ${now}`,
    '',
    input.message,
    '',
    '— Antwoorden kan rechtstreeks naar het adres hierboven.',
  ]).catch(() => {});

  return json({ ok: true });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

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
