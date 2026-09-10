import { describe, expect, it } from 'vitest';
import type { SignupRecord } from '@buurklus/shared';
import {
  customerUpdateMail,
  dayLabel,
  mailtoLink,
  MAX_RECIPIENTS_PER_MAIL,
  proInviteMail,
  renderAdminPage,
  type AdminData,
  type ContactMessage,
} from './admin.js';

const NOW = new Date('2026-09-10T12:00:00.000Z');

function signup(over: Partial<SignupRecord> & { id: string }): SignupRecord {
  return {
    role: 'PRO',
    email: `${over.id}@example.nl`,
    name: over.id,
    phone: null,
    citySlug: 'utrecht',
    categorySlugs: ['schilderwerk'],
    kvk: '12345678',
    jobNote: null,
    createdAt: '2026-09-09T09:00:00.000Z',
    handledAt: null,
    unsubscribedAt: null,
    ...over,
  };
}

const klant = signup({
  id: 'klant',
  role: 'CUSTOMER',
  name: 'Fatima',
  kvk: null,
  jobNote: 'Woonkamer schilderen, muren en plafond.',
});

function page(over: Partial<AdminData> = {}): string {
  return renderAdminPage({
    viewer: 'abekkali@live.nl',
    now: NOW,
    signups: [],
    messages: [],
    ...over,
  });
}

describe('the page the operator opens', () => {
  it('counts what is waiting', () => {
    const html = page({ signups: [klant, signup({ id: 'schilder' })] });
    expect(html).toContain('open aanvragen');
    expect(html).toMatch(/<span class="total">1<\/span><span>open aanvragen/);
    expect(html).toMatch(/<span class="total">1<\/span><span>vakmensen/);
  });

  it('shows a request with the pros who could do it', () => {
    const html = page({ signups: [klant, signup({ id: 'schilder', name: 'Verf & Co' })] });
    expect(html).toContain('Fatima');
    expect(html).toContain('Woonkamer schilderen');
    expect(html).toContain('Verf &amp; Co');
    expect(html).toContain('Mail 1 vakman');
  });

  it('says so plainly when nobody can do the work yet', () => {
    // The empty case is the normal case in the first weeks. A blank space
    // there reads as a broken page.
    const html = page({ signups: [klant] });
    expect(html).toContain('Nog geen vakman aangemeld');
    expect(html).not.toContain('Mail 1 vakman');
  });

  it('drops a request once it has been dealt with', () => {
    const done = { ...klant, handledAt: '2026-09-10T08:00:00.000Z' };
    const html = page({ signups: [done, signup({ id: 'schilder' })] });
    expect(html).toContain('Alles is afgehandeld');
    expect(html).not.toContain('Woonkamer schilderen');
  });

  it('leaves out anybody who unsubscribed, on both sides', () => {
    const gone = signup({ id: 'weg', unsubscribedAt: '2026-09-01T00:00:00.000Z' });
    const html = page({ signups: [klant, gone] });
    expect(html).not.toContain('weg@example.nl');
    expect(html).toContain('Nog geen vakman aangemeld');
  });

  it('tells each pro how many requests are waiting for them', () => {
    const html = page({ signups: [klant, signup({ id: 'schilder' })] });
    const row = html.slice(html.indexOf('<tbody>'), html.indexOf('</tbody>'));
    expect(row).toContain('schilder@example.nl');
    expect(row).toContain('<td class="num">1</td>');
  });

  it('escapes anything a stranger typed', () => {
    // Every name, note and message on this page was typed by somebody else.
    const nasty = { ...klant, name: '<script>alert(1)</script>' };
    const html = page({ signups: [nasty] });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('names who is looking at it', () => {
    expect(page()).toContain('abekkali@live.nl');
  });

  it('keeps handled messages, greyed out, and unhandled ones on top', () => {
    const messages: ContactMessage[] = [
      { id: 'a', createdAt: '2026-09-01T10:00:00.000Z', name: 'Oud', email: 'a@b.nl', message: 'eerst', handledAt: '2026-09-02T10:00:00.000Z' },
      { id: 'b', createdAt: '2026-09-09T10:00:00.000Z', name: 'Nieuw', email: 'b@b.nl', message: 'later', handledAt: null },
    ];
    const html = page({ messages });
    expect(html.indexOf('Nieuw')).toBeLessThan(html.indexOf('Oud'));
    expect(html).toContain('card--done');
  });
});

describe('the mail that is already written', () => {
  it('bccs the pros, so none of them sees the others', () => {
    const pros = [signup({ id: 'een' }), signup({ id: 'twee' })];
    const invite = proInviteMail(klant, pros.map((pro) => ({ pro, sharedCategories: ['schilderwerk'], distanceKm: 0, nearby: true })));
    expect(invite.href.startsWith('mailto:?')).toBe(true);
    expect(invite.href).toContain('bcc=een%40example.nl%2Ctwee%40example.nl');
    expect(invite.count).toBe(2);
  });

  it('carries the job, the place and no way to reach the customer', () => {
    // The pro is invited to answer us, not handed somebody's phone number
    // before they have agreed to anything.
    const invite = proInviteMail(klant, [
      { pro: signup({ id: 'een' }), sharedCategories: ['schilderwerk'], distanceKm: 0, nearby: true },
    ]);
    const decoded = decodeURIComponent(invite.href);
    expect(decoded).toContain('Utrecht');
    expect(decoded).toContain('Woonkamer schilderen');
    expect(decoded).not.toContain(klant.email);
  });

  it('stops at a number of recipients one mail can carry', () => {
    const many = Array.from({ length: MAX_RECIPIENTS_PER_MAIL + 5 }, (_, index) => ({
      pro: signup({ id: `pro${index}` }),
      sharedCategories: ['schilderwerk'],
      distanceKm: 0,
      nearby: true,
    }));
    const invite = proInviteMail(klant, many);
    expect(invite.count).toBe(MAX_RECIPIENTS_PER_MAIL);
    expect(invite.capped).toBe(true);
  });

  it('writes a different letter to the customer depending on the answer', () => {
    const withPros = decodeURIComponent(
      customerUpdateMail(klant, [
        { pro: signup({ id: 'een' }), sharedCategories: ['schilderwerk'], distanceKm: 3, nearby: true },
      ]),
    );
    const without = decodeURIComponent(customerUpdateMail(klant, []));
    expect(withPros).toContain('1 vakmensen in en rond Utrecht');
    expect(without).toContain('nog geen vakmensen');
    expect(without).not.toContain('Goed nieuws');
  });

  it('keeps spaces out of the subject line', () => {
    // URLSearchParams writes a space as "+", which mail clients show literally.
    const href = mailtoLink({ to: ['a@b.nl'], subject: 'twee woorden', body: 'x' });
    expect(href).toContain('subject=twee%20woorden');
    expect(href).not.toContain('+');
  });
});

describe('dates a person can read', () => {
  it('says today, yesterday, or the date', () => {
    expect(dayLabel('2026-09-10T08:00:00.000Z', NOW)).toBe('vandaag');
    expect(dayLabel('2026-09-09T23:00:00.000Z', NOW)).toBe('gisteren');
    expect(dayLabel('2026-09-07T09:00:00.000Z', NOW)).toBe('3 dagen geleden');
    expect(dayLabel('2026-08-01T09:00:00.000Z', NOW)).toBe('1 augustus 2026');
  });
});
