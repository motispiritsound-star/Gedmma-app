import { describe, expect, it } from 'vitest';
import {
  InvalidPhoneNumberError,
  formatDutchPhone,
  isDutchMobile,
  maskPhone,
  normalizeDutchPhone,
} from './phone.js';

describe('normalizeDutchPhone', () => {
  it('accepts every local spelling of the same number', () => {
    const expected = '+31612345678';
    for (const input of [
      '0612345678',
      '06 12345678',
      '06-12345678',
      '+31612345678',
      '+31 6 12345678',
      '0031612345678',
      '31612345678',
    ]) {
      expect(normalizeDutchPhone(input), input).toBe(expected);
    }
  });

  it('normalises landlines too', () => {
    expect(normalizeDutchPhone('010 1234567')).toBe('+31101234567');
    expect(normalizeDutchPhone('020-1234567')).toBe('+31201234567');
  });

  it('rejects numbers with the wrong digit count', () => {
    expect(() => normalizeDutchPhone('061234567')).toThrow(InvalidPhoneNumberError);
    expect(() => normalizeDutchPhone('06123456789')).toThrow(InvalidPhoneNumberError);
    expect(() => normalizeDutchPhone('')).toThrow(InvalidPhoneNumberError);
  });

  it('distinguishes mobile numbers from landlines', () => {
    expect(isDutchMobile('0612345678')).toBe(true);
    expect(isDutchMobile('+31612345678')).toBe(true);
    // 010 is Rotterdam, and a landline cannot receive the sign-in SMS.
    expect(isDutchMobile('0101234567')).toBe(false);
    expect(isDutchMobile('0201234567')).toBe(false);
    expect(isDutchMobile('not a number')).toBe(false);
  });
});

describe('formatDutchPhone', () => {
  it('renders a mobile number the way it is written here', () => {
    expect(formatDutchPhone('+31612345678')).toBe('06 12345678');
  });

  it('groups a landline by its area code', () => {
    expect(formatDutchPhone('+31101234567')).toBe('010 1234567');
  });

  it('leaves foreign numbers untouched', () => {
    expect(formatDutchPhone('+4915112345678')).toBe('+4915112345678');
  });

  it('masks all but the final two digits', () => {
    expect(maskPhone('+31612345678')).toBe('•• ••••••78');
  });
});
