import {
  CATEGORY_BY_SLUG,
  CITY_BY_SLUG,
  MATCH_RADIUS_KM,
  matchPros,
  requestsForPro,
  type Match,
  type SignupRecord,
} from '@buurklus/shared';

/**
 * The one page that runs Buurklus until the app does.
 *
 * It answers three questions in the order they matter: which requests are
 * waiting for somebody, who could do them, and what is the next click. That
 * last part is the point -- a list of sign-ups is a report, and a report does
 * not get anybody a painter. Every request here carries a mail that is already
 * written, addressed and ready to send.
 *
 * The mails leave from the operator's own mailbox by design. Cloudflare can
 * only send to a verified address, and buying a way to send to everyone is a
 * decision to take once the first dozen introductions have shown what the
 * message should actually say.
 *
 * Kept pure: HTML out of data in, so all of it can be tested without a Worker,
 * a database, or a browser.
 */

export interface ContactMessage {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  message: string;
  handledAt: string | null;
}

export interface AdminData {
  signups: SignupRecord[];
  messages: ContactMessage[];
  /** Who is signed in, shown so a shared screen is never a mystery. */
  viewer: string;
  now: Date;
}

const esc = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const cityName = (slug: string | null): string =>
  (slug && CITY_BY_SLUG.get(slug)?.name.nl) || 'onbekend';

const tradeName = (slug: string): string => CATEGORY_BY_SLUG.get(slug)?.name.nl ?? slug;

const tradeNames = (slugs: string[]): string =>
  slugs.length ? slugs.map(tradeName).join(', ') : 'niet opgegeven';

/** "vandaag", "gisteren", or a plain date. Nobody counts back from a timestamp. */
export function dayLabel(iso: string, now: Date): string {
  const then = new Date(iso);
  const days = Math.floor((startOfDay(now) - startOfDay(then)) / 86_400_000);
  if (days === 0) return 'vandaag';
  if (days === 1) return 'gisteren';
  if (days < 7) return `${days} dagen geleden`;
  return then.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function startOfDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function mailtoLink(mail: {
  to?: string[];
  bcc?: string[];
  subject: string;
  body: string;
}): string {
  const params = new URLSearchParams();
  if (mail.bcc?.length) params.set('bcc', mail.bcc.join(','));
  params.set('subject', mail.subject);
  params.set('body', mail.body);
  // URLSearchParams encodes a space as "+", which a mail client shows as a
  // literal plus in the subject line.
  const query = params.toString().replace(/\+/g, '%20');
  return `mailto:${(mail.to ?? []).join(',')}?${query}`;
}

/**
 * Long mailto links are cut off by some mail clients, and a truncated bcc
 * silently drops the last few recipients. Better to send two mails than to
 * wonder later why somebody never heard from us.
 */
export const MAX_RECIPIENTS_PER_MAIL = 25;

export function proInviteMail(request: SignupRecord, matches: Match[]): {
  href: string;
  count: number;
  capped: boolean;
} {
  const chosen = matches.slice(0, MAX_RECIPIENTS_PER_MAIL);
  const where = cityName(request.citySlug);
  const what = tradeNames(request.categorySlugs);

  const body = [
    'Beste vakman,',
    '',
    `Er staat een klus open in ${where}${request.categorySlugs.length ? `: ${what}` : ''}.`,
    ...(request.jobNote ? ['', `Wat de klant erover schrijft:`, `"${request.jobNote}"`] : []),
    '',
    'Wil je hierop reageren? Antwoord op deze mail, dan breng ik je in contact met de klant.',
    'Reageren kost je niets en verplicht je tot niets.',
    '',
    'Met vriendelijke groet,',
    'Buurklus',
    'https://buurklus.nl',
  ].join('\n');

  return {
    href: mailtoLink({
      bcc: chosen.map((match) => match.pro.email),
      subject: `Klus in ${where}${request.categorySlugs.length ? `: ${what}` : ''}`,
      body,
    }),
    count: chosen.length,
    capped: matches.length > chosen.length,
  };
}

export function customerUpdateMail(request: SignupRecord, matches: Match[]): string {
  const nearby = matches.filter((match) => match.nearby).length || matches.length;
  const where = cityName(request.citySlug);
  const greeting = request.name ? `Beste ${request.name},` : 'Beste,';

  const body = [
    greeting,
    '',
    nearby > 0
      ? `Goed nieuws: er zijn ${nearby} vakmensen in en rond ${where} die je klus kunnen doen. Ik heb ze jouw aanvraag gestuurd.`
      : `Je aanvraag staat genoteerd. Er zijn nog geen vakmensen in en rond ${where} aangemeld die dit doen — zodra dat verandert, hoor je het van me.`,
    '',
    'Zij nemen zelf contact met je op. Je zit nergens aan vast en je kiest zelf of je met iemand in zee gaat.',
    '',
    'Met vriendelijke groet,',
    'Buurklus',
    'https://buurklus.nl',
  ].join('\n');

  return mailtoLink({ to: [request.email], subject: 'Je klus op Buurklus', body });
}

export function replyMail(message: ContactMessage): string {
  const body = ['', '', '--- Je schreef ---', message.message].join('\n');
  return mailtoLink({ to: [message.email], subject: `Re: je bericht aan Buurklus`, body });
}

function handleForm(kind: 'aanvraag' | 'bericht', id: string, label: string): string {
  return `<form method="post" action="/beheer/afgehandeld" class="inline">
    <input type="hidden" name="soort" value="${kind}">
    <input type="hidden" name="id" value="${esc(id)}">
    <button type="submit" class="btn btn--quiet">${esc(label)}</button>
  </form>`;
}

function matchRow(match: Match): string {
  const pro = match.pro;
  const distance =
    match.distanceKm === null ? 'afstand onbekend' : match.distanceKm === 0 ? 'zelfde gemeente' : `${match.distanceKm} km`;
  return `<li>
    <strong>${esc(pro.name ?? pro.email)}</strong>
    <span class="muted">${esc(cityName(pro.citySlug))} · ${esc(distance)}</span>
    <span class="muted">${esc(tradeNames(match.sharedCategories))}</span>
    <a href="mailto:${esc(pro.email)}">${esc(pro.email)}</a>
    ${pro.phone ? `<a href="tel:${esc(pro.phone)}">${esc(pro.phone)}</a>` : ''}
  </li>`;
}

function requestCard(request: SignupRecord, pros: SignupRecord[], now: Date): string {
  const matches = matchPros(request, pros);
  const near = matches.filter((match) => match.nearby);
  const far = matches.filter((match) => !match.nearby);
  const invite = proInviteMail(request, near.length ? near : matches);

  const contact = [
    `<a href="mailto:${esc(request.email)}">${esc(request.email)}</a>`,
    request.phone ? `<a href="tel:${esc(request.phone)}">${esc(request.phone)}</a>` : null,
  ]
    .filter((part): part is string => part !== null)
    .join(' · ');

  return `<article class="card">
    <header class="card__head">
      <h3>${esc(request.name ?? 'Klant')} — ${esc(cityName(request.citySlug))}</h3>
      <span class="muted">${esc(dayLabel(request.createdAt, now))}</span>
    </header>
    <p class="what"><strong>Vraagt:</strong> ${esc(tradeNames(request.categorySlugs))}</p>
    ${request.jobNote ? `<blockquote>${esc(request.jobNote)}</blockquote>` : ''}
    <p class="muted">${contact}</p>

    ${
      matches.length === 0
        ? `<p class="empty">Nog geen vakman aangemeld die dit doet. Zodra er één is, verschijnt hij hier vanzelf.</p>`
        : `<p class="count">${near.length} in de buurt (binnen ${MATCH_RADIUS_KM} km)${
            far.length ? `, ${far.length} verder weg` : ''
          }</p>
      <ul class="matches">${(near.length ? near : far).map(matchRow).join('')}</ul>
      ${
        far.length && near.length
          ? `<details><summary>${far.length} verder weg</summary><ul class="matches">${far
              .map(matchRow)
              .join('')}</ul></details>`
          : ''
      }`
    }

    <div class="actions">
      ${
        invite.count > 0
          ? `<a class="btn btn--primary" href="${esc(invite.href)}">Mail ${invite.count} ${
              invite.count === 1 ? 'vakman' : 'vakmensen'
            }</a>`
          : ''
      }
      <a class="btn" href="${esc(customerUpdateMail(request, matches))}">Mail de klant</a>
      ${handleForm('aanvraag', request.id, 'Afgehandeld')}
    </div>
    ${
      invite.capped
        ? `<p class="muted">Er passen er ${MAX_RECIPIENTS_PER_MAIL} in één mail; de rest staat hieronder en kun je apart mailen.</p>`
        : ''
    }
  </article>`;
}

function proRow(pro: SignupRecord, requests: SignupRecord[], now: Date): string {
  const waiting = requestsForPro(pro, requests).length;
  return `<tr>
    <td>${esc(pro.name ?? '—')}<br><a href="mailto:${esc(pro.email)}">${esc(pro.email)}</a></td>
    <td>${esc(cityName(pro.citySlug))}</td>
    <td>${esc(tradeNames(pro.categorySlugs))}</td>
    <td>${esc(pro.kvk ?? '—')}</td>
    <td class="num">${waiting || '—'}</td>
    <td>${esc(dayLabel(pro.createdAt, now))}</td>
  </tr>`;
}

function messageRow(message: ContactMessage, now: Date): string {
  return `<article class="card${message.handledAt ? ' card--done' : ''}">
    <header class="card__head">
      <h3>${esc(message.name)}</h3>
      <span class="muted">${esc(dayLabel(message.createdAt, now))}</span>
    </header>
    <blockquote>${esc(message.message)}</blockquote>
    <div class="actions">
      <a class="btn btn--primary" href="${esc(replyMail(message))}">Beantwoorden</a>
      ${message.handledAt ? '<span class="muted">Afgehandeld</span>' : handleForm('bericht', message.id, 'Afgehandeld')}
    </div>
  </article>`;
}

export function renderAdminPage(data: AdminData): string {
  const live = data.signups.filter((row) => !row.unsubscribedAt);
  const pros = live.filter((row) => row.role === 'PRO');
  const customers = live.filter((row) => row.role === 'CUSTOMER');
  const open = customers
    .filter((row) => !row.handledAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const openMessages = data.messages.filter((message) => !message.handledAt);

  const cards = open.map((request) => requestCard(request, pros, data.now)).join('');
  const proRows = [...pros]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((pro) => proRow(pro, customers, data.now))
    .join('');
  const messages = [...data.messages]
    .sort((a, b) => Number(Boolean(a.handledAt)) - Number(Boolean(b.handledAt)) || b.createdAt.localeCompare(a.createdAt))
    .map((message) => messageRow(message, data.now))
    .join('');

  return `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Beheer — Buurklus</title>
    <link rel="stylesheet" href="/beheer/stijl.css">
  </head>
  <body>
    <header class="top">
      <h1>Buurklus beheer</h1>
      <p class="muted">Ingelogd als ${esc(data.viewer)} · <a href="/cdn-cgi/access/logout">uitloggen</a></p>
    </header>

    <div class="totals">
      <div><span class="total">${open.length}</span><span>open aanvragen</span></div>
      <div><span class="total">${customers.length}</span><span>klanten</span></div>
      <div><span class="total">${pros.length}</span><span>vakmensen</span></div>
      <div><span class="total">${openMessages.length}</span><span>onbeantwoorde berichten</span></div>
    </div>

    <section>
      <h2>Klussen die op een vakman wachten</h2>
      ${
        cards ||
        '<p class="empty">Geen openstaande aanvragen. Alles is afgehandeld — of er heeft nog niemand een klus geplaatst.</p>'
      }
    </section>

    <section>
      <h2>Vakmensen (${pros.length})</h2>
      ${
        proRows
          ? `<table>
        <thead><tr><th>Naam</th><th>Gemeente</th><th>Vakgebieden</th><th>KvK</th><th class="num">Wacht op</th><th>Aangemeld</th></tr></thead>
        <tbody>${proRows}</tbody>
      </table>`
          : '<p class="empty">Nog geen vakmensen aangemeld.</p>'
      }
    </section>

    <section>
      <h2>Berichten</h2>
      ${messages || '<p class="empty">Geen berichten.</p>'}
    </section>
  </body>
</html>
`;
}

export const ADMIN_STYLES = `
:root { color-scheme: light; --ink: #12211E; --muted: #5C6B67; --line: #E4EBE9; --green: #146B57; --bg: #F7F9F8; }
* { box-sizing: border-box; }
body { margin: 0; padding: 1.5rem; font: 15px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif; color: var(--ink); background: var(--bg); }
.top { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; align-items: baseline; margin-block-end: 1.5rem; }
h1 { font-size: 1.4rem; margin: 0; }
h2 { font-size: 1.1rem; margin-block: 2rem 0.75rem; }
h3 { font-size: 1rem; margin: 0; }
a { color: var(--green); }
.muted { color: var(--muted); font-size: 0.9rem; }
.totals { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; }
.totals div { background: #fff; border: 1px solid var(--line); border-radius: 10px; padding: 0.9rem 1rem; display: grid; gap: 0.15rem; }
.total { font-size: 1.7rem; font-weight: 700; color: var(--green); }
.totals span:last-child { color: var(--muted); font-size: 0.85rem; }
.card { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 1rem 1.15rem; margin-block-end: 0.9rem; }
.card--done { opacity: 0.6; }
.card__head { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; justify-content: space-between; align-items: baseline; }
blockquote { margin: 0.6rem 0; padding-inline-start: 0.9rem; border-inline-start: 3px solid var(--line); color: #33433F; white-space: pre-wrap; }
.what { margin: 0.5rem 0 0.3rem; }
.count { color: var(--muted); font-size: 0.9rem; margin-block: 0.8rem 0.3rem; }
.matches { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.4rem; }
.matches li { display: flex; flex-wrap: wrap; gap: 0.3rem 0.9rem; align-items: baseline; padding-block: 0.35rem; border-block-start: 1px solid var(--line); }
.actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-block-start: 0.9rem; }
.inline { display: inline; margin: 0; }
.btn { display: inline-block; border: 1px solid var(--line); background: #fff; color: var(--ink); border-radius: 8px; padding: 0.45rem 0.9rem; font: inherit; text-decoration: none; cursor: pointer; }
.btn--primary { background: var(--green); border-color: var(--green); color: #fff; }
.btn--quiet { color: var(--muted); }
.empty { color: var(--muted); background: #fff; border: 1px dashed var(--line); border-radius: 10px; padding: 1rem; }
table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
th, td { text-align: left; padding: 0.6rem 0.7rem; border-block-end: 1px solid var(--line); vertical-align: top; font-size: 0.92rem; }
th { background: #EFF4F2; font-weight: 600; white-space: nowrap; }
.num { text-align: right; }
details summary { cursor: pointer; color: var(--muted); margin-block-start: 0.6rem; }
@media (max-width: 640px) { body { padding: 1rem; } table { display: block; overflow-x: auto; } }
`;
