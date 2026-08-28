import { describe, expect, it } from 'vitest';
import {
  formatIban,
  formatPostcode,
  formatVatId,
  isValidDutchIban,
  isValidDutchVatId,
  isValidKvk,
  isValidPostcode,
} from './identifiers.js';

describe('KvK number', () => {
  it('accepts eight digits, however they are spaced', () => {
    expect(isValidKvk('12345678')).toBe(true);
    expect(isValidKvk('1234 5678')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isValidKvk('1234567')).toBe(false);
    expect(isValidKvk('123456789')).toBe(false);
    expect(isValidKvk('ABCDEFGH')).toBe(false);
  });
});

describe('VAT identification number', () => {
  it('accepts the Dutch format', () => {
    expect(isValidDutchVatId('NL123456789B01')).toBe(true);
    expect(isValidDutchVatId('nl123456789b01')).toBe(true);
    expect(formatVatId('NL123456789B01')).toBe('NL 123456789 B01');
  });

  it('rejects a Belgian or malformed number', () => {
    expect(isValidDutchVatId('BE0123456789')).toBe(false);
    expect(isValidDutchVatId('NL123456789')).toBe(false);
  });
});

describe('IBAN', () => {
  it('accepts a valid Dutch IBAN and catches a transposition', () => {
    // ING's published example account.
    expect(isValidDutchIban('NL91ABNA0417164300')).toBe(true);
    expect(isValidDutchIban('NL91 ABNA 0417 1643 00')).toBe(true);
    // Two digits swapped: the mod-97 check is what catches this.
    expect(isValidDutchIban('NL91ABNA0417164003')).toBe(false);
  });

  it('rejects a foreign or malformed IBAN', () => {
    expect(isValidDutchIban('BE68539007547034')).toBe(false);
    expect(isValidDutchIban('NL91ABNA')).toBe(false);
  });

  it('groups an IBAN in fours for display', () => {
    expect(formatIban('NL91ABNA0417164300')).toBe('NL91 ABNA 0417 1643 00');
  });
});

describe('postcode', () => {
  it('accepts four digits and two letters', () => {
    expect(isValidPostcode('1012AB')).toBe(true);
    expect(isValidPostcode('1012 ab')).toBe(true);
    expect(isValidPostcode('101 AB')).toBe(false);
    expect(formatPostcode('1012ab')).toBe('1012 AB');
  });
});
