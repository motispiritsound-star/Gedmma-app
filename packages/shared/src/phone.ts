/**
 * Dutch phone numbers. The national significant number is nine digits after
 * the trunk zero; mobile numbers start with 6, landlines with an area code
 * (10 for Rotterdam, 20 for Amsterdam, 30 for Utrecht, and so on).
 *
 * Buurklus authenticates with mobile numbers only, since sign-in is by SMS.
 */
export const NETHERLANDS_COUNTRY_CODE = '31';
export const NETHERLANDS_DIAL_PREFIX = `+${NETHERLANDS_COUNTRY_CODE}`;

const MOBILE_PREFIX = '6';

export class InvalidPhoneNumberError extends Error {
  constructor(readonly input: string) {
    super(`"${input}" is not a valid Dutch phone number`);
    this.name = 'InvalidPhoneNumberError';
  }
}

/**
 * Normalises any local spelling of a Dutch number to E.164.
 * Accepts `0612345678`, `+31612345678`, `0031 6 12345678`, `06-12345678`.
 */
export function normalizeDutchPhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, '');
  let national: string;

  if (digits.startsWith('+31')) national = digits.slice(3);
  else if (digits.startsWith('0031')) national = digits.slice(4);
  else if (digits.startsWith('31') && digits.length === 11) national = digits.slice(2);
  else if (digits.startsWith('0')) national = digits.slice(1);
  else national = digits;

  if (!/^\d{9}$/.test(national)) throw new InvalidPhoneNumberError(input);
  return `${NETHERLANDS_DIAL_PREFIX}${national}`;
}

export function isValidDutchPhone(input: string): boolean {
  try {
    normalizeDutchPhone(input);
    return true;
  } catch {
    return false;
  }
}

export function isDutchMobile(input: string): boolean {
  try {
    const national = normalizeDutchPhone(input).slice(NETHERLANDS_DIAL_PREFIX.length);
    return national.startsWith(MOBILE_PREFIX);
  } catch {
    return false;
  }
}

/** `+31612345678` -> `06 12345678`, the way a mobile number is written here. */
export function formatDutchPhone(e164: string): string {
  const national = e164.startsWith(NETHERLANDS_DIAL_PREFIX)
    ? e164.slice(NETHERLANDS_DIAL_PREFIX.length)
    : e164.replace(/\D/g, '');
  if (national.length !== 9) return e164;

  if (national.startsWith(MOBILE_PREFIX)) return `0${national.slice(0, 1)} ${national.slice(1)}`;
  // Landlines group as area code then subscriber number: 010 1234567.
  return `0${national.slice(0, 2)} ${national.slice(2)}`;
}

/** Masks all but the last two digits, for showing a number back to its owner. */
export function maskPhone(e164: string): string {
  const formatted = formatDutchPhone(e164);
  const totalDigits = (formatted.match(/\d/g) ?? []).length;
  let seen = 0;
  // Counts digits across the whole string, since the national format groups
  // them and a lookahead would stop at each separating space.
  return formatted.replace(/\d/g, (digit) => {
    seen += 1;
    return seen <= totalDigits - 2 ? '•' : digit;
  });
}
