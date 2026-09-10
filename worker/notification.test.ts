import { describe, expect, it } from 'vitest';
import { buildNotification } from './notification.js';

/**
 * The notification went missing for a day and nothing said so. `setHeader`
 * with a plain string throws — mimetext validates Reply-To against a Mailbox
 * instance — and the caller was swallowing the error, so every sign-up and
 * every contact message was stored and silently never announced. These tests
 * are the part that was missing.
 */
const base = {
  from: 'no-reply@buurklus.nl',
  to: 'operator@example.com',
  subject: 'Bericht van Jan Smit',
  lines: ['Van: Jan Smit', '', 'Mijn keuken lekt.'],
};

const headerOf = (raw: string, name: string) =>
  raw.split(/\r?\n/).find((line) => line.toLowerCase().startsWith(`${name.toLowerCase()}:`));

describe('the notification that goes to the operator', () => {
  it('builds without throwing when a reply address is given', () => {
    expect(() =>
      buildNotification({ ...base, replyTo: { name: 'Jan Smit', addr: 'jan@voorbeeld.nl' } }),
    ).not.toThrow();
  });

  it('can be replied to', () => {
    // This is the whole point: pressing reply must write to the person who
    // filled in the form, not to an address nobody reads.
    const raw = buildNotification({
      ...base,
      replyTo: { name: 'Jan Smit', addr: 'jan@voorbeeld.nl' },
    });
    expect(headerOf(raw, 'Reply-To')).toContain('<jan@voorbeeld.nl>');
    expect(headerOf(raw, 'From')).toContain('<no-reply@buurklus.nl>');
    expect(headerOf(raw, 'To')).toContain('<operator@example.com>');
  });

  it('works without a reply address too', () => {
    const raw = buildNotification(base);
    expect(headerOf(raw, 'Reply-To')).toBeUndefined();
    expect(raw).toContain('Mijn keuken lekt.');
  });

  it('survives a name with an accent or a quote in it', () => {
    // Real names break naive header building. The subject and the reply name
    // both go through base64 encoding, so this must not throw or corrupt.
    const raw = buildNotification({
      ...base,
      subject: 'Bericht van José "Pepe" Ångström',
      replyTo: { name: 'José "Pepe" Ångström', addr: 'jose@voorbeeld.nl' },
    });
    expect(headerOf(raw, 'Reply-To')).toContain('<jose@voorbeeld.nl>');
    expect(raw).toContain('Subject:');
  });

  it('keeps the body lines in the order they were given', () => {
    const raw = buildNotification({ ...base, lines: ['een', 'twee', 'drie'] });
    const body = raw.slice(raw.indexOf('een'));
    expect(body.indexOf('een')).toBeLessThan(body.indexOf('twee'));
    expect(body.indexOf('twee')).toBeLessThan(body.indexOf('drie'));
  });
});
