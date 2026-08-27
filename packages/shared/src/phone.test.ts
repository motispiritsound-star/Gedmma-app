import { describe, expect, it } from 'vitest';
import {
  InvalidPhoneNumberError,
  formatMoroccanPhone,
  isMoroccanMobile,
  maskPhone,
  normalizeMoroccanPhone,
} from './phone.js';

describe('normalizeMoroccanPhone', () => {
  it('accepts every local spelling of the same number', () => {
    const expected = '+212612345678';
    for (const input of [
      '0612345678',
      '06 12 34 56 78',
      '06-12-34-56-78',
      '+212612345678',
      '+212 6 12 34 56 78',
      '00212612345678',
      '212612345678',
    ]) {
      expect(normalizeMoroccanPhone(input)).toBe(expected);
    }
  });

  it('rejects numbers with the wrong digit count', () => {
    expect(() => normalizeMoroccanPhone('061234567')).toThrow(InvalidPhoneNumberError);
    expect(() => normalizeMoroccanPhone('06123456789')).toThrow(InvalidPhoneNumberError);
    expect(() => normalizeMoroccanPhone('')).toThrow(InvalidPhoneNumberError);
  });

  it('distinguishes mobile ranges from landlines', () => {
    expect(isMoroccanMobile('0612345678')).toBe(true);
    expect(isMoroccanMobile('0712345678')).toBe(true);
    // 05 is a fixed line, which cannot receive the sign-in SMS.
    expect(isMoroccanMobile('0522123456')).toBe(false);
    expect(isMoroccanMobile('not a number')).toBe(false);
  });
});

describe('formatMoroccanPhone', () => {
  it('renders the national format used in Morocco', () => {
    expect(formatMoroccanPhone('+212612345678')).toBe('06 12 34 56 78');
  });

  it('leaves foreign numbers untouched', () => {
    expect(formatMoroccanPhone('+33612345678')).toBe('+33612345678');
  });

  it('masks all but the final two digits', () => {
    expect(maskPhone('+212612345678')).toBe('•• •• •• •• 78');
  });
});
