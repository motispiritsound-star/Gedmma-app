/**
 * Moroccan phone numbers. The national plan uses a leading 0 followed by nine
 * digits; 06 and 07 are mobile ranges, 05 is fixed line. Khidma authenticates
 * with mobile numbers only, since sign-in is by SMS one-time code.
 */
export const MOROCCO_COUNTRY_CODE = '212';
export const MOROCCO_DIAL_PREFIX = `+${MOROCCO_COUNTRY_CODE}`;

const MOBILE_PREFIXES = ['6', '7'];

export class InvalidPhoneNumberError extends Error {
  constructor(readonly input: string) {
    super(`"${input}" is not a valid Moroccan phone number`);
    this.name = 'InvalidPhoneNumberError';
  }
}

/**
 * Normalises any local spelling of a Moroccan number to E.164.
 * Accepts `0612345678`, `+212612345678`, `00212 6 12 34 56 78`, `212-612345678`.
 */
export function normalizeMoroccanPhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, '');
  let national: string;

  if (digits.startsWith('+212')) national = digits.slice(4);
  else if (digits.startsWith('00212')) national = digits.slice(5);
  else if (digits.startsWith('212')) national = digits.slice(3);
  else if (digits.startsWith('0')) national = digits.slice(1);
  else national = digits;

  if (!/^\d{9}$/.test(national)) throw new InvalidPhoneNumberError(input);
  return `${MOROCCO_DIAL_PREFIX}${national}`;
}

export function isValidMoroccanPhone(input: string): boolean {
  try {
    normalizeMoroccanPhone(input);
    return true;
  } catch {
    return false;
  }
}

export function isMoroccanMobile(input: string): boolean {
  try {
    const national = normalizeMoroccanPhone(input).slice(MOROCCO_DIAL_PREFIX.length);
    return MOBILE_PREFIXES.includes(national.charAt(0));
  } catch {
    return false;
  }
}

/** `+212612345678` -> `06 12 34 56 78`, the way a number is written in Morocco. */
export function formatMoroccanPhone(e164: string): string {
  const national = e164.startsWith(MOROCCO_DIAL_PREFIX)
    ? e164.slice(MOROCCO_DIAL_PREFIX.length)
    : e164.replace(/\D/g, '');
  if (national.length !== 9) return e164;
  const pairs = national.slice(1).match(/.{1,2}/g) ?? [];
  return `0${national.charAt(0)} ${pairs.join(' ')}`;
}

/** Masks all but the last two digits, for showing a number back to its owner. */
export function maskPhone(e164: string): string {
  const formatted = formatMoroccanPhone(e164);
  const totalDigits = (formatted.match(/\d/g) ?? []).length;
  let seen = 0;
  // Counts digits across the whole string, since the national format groups
  // them in pairs and a lookahead would stop at each separating space.
  return formatted.replace(/\d/g, (digit) => {
    seen += 1;
    return seen <= totalDigits - 2 ? '•' : digit;
  });
}
