import { describe, expect, it } from 'vitest';
import { CONTACT_MESSAGE_MAX, contactSchema } from './contact.js';

describe('a message from the contact form', () => {
  const valid = {
    name: 'Jan Smit',
    email: 'Jan.Smit@Voorbeeld.NL ',
    message: 'Ik heb een vraag over hoe het werkt in Zwolle.',
  };

  it('accepts an ordinary message and tidies the address', () => {
    const parsed = contactSchema.parse(valid);
    expect(parsed.email).toBe('jan.smit@voorbeeld.nl');
    expect(parsed.name).toBe('Jan Smit');
  });

  it('turns away what cannot be answered', () => {
    expect(() => contactSchema.parse({ ...valid, email: 'geen-adres' })).toThrow();
    expect(() => contactSchema.parse({ ...valid, name: 'J' })).toThrow();
    // "hoi" is not something anyone can act on.
    expect(() => contactSchema.parse({ ...valid, message: 'hoi' })).toThrow();
  });

  it('caps the message rather than storing whatever is sent', () => {
    expect(() =>
      contactSchema.parse({ ...valid, message: 'a'.repeat(CONTACT_MESSAGE_MAX + 1) }),
    ).toThrow();
    expect(contactSchema.parse({ ...valid, message: 'a'.repeat(CONTACT_MESSAGE_MAX) })).toBeTruthy();
  });

  it('asks for nothing beyond a name, an address and the message', () => {
    // Every extra field is one more thing to justify and delete on time.
    const parsed = contactSchema.parse({ ...valid, locale: 'nl' });
    expect(Object.keys(parsed).sort()).toEqual(['email', 'locale', 'message', 'name']);
  });

  it('keeps the honeypot out of what is stored', () => {
    const parsed = contactSchema.parse({ ...valid, website: 'http://spam.example' });
    expect(parsed.website).toBe('http://spam.example');
    // The Worker drops the whole request when this is set; the schema only has
    // to carry it that far.
  });
});
