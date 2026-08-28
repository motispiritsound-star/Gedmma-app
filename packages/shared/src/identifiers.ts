/**
 * Dutch business identifiers used to verify a professional account.
 *
 * - KvK: the Chamber of Commerce number, eight digits. Every business in the
 *   Netherlands has one, including a one-person zzp business, and the register
 *   is public — which makes it a far better trust anchor than a badge the
 *   platform invents. It is required for every professional on Buurklus.
 * - BTW-identificatienummer: the VAT identification number, `NL` followed by
 *   nine digits, `B`, and a two-digit sequence. Optional: a business under the
 *   small-business scheme (KOR) may not charge VAT at all.
 * - IBAN: used for subscriptions paid by SEPA direct debit.
 */
export const KVK_LENGTH = 8;

export function normalizeKvk(input: string): string {
  return input.replace(/\D/g, '');
}

export function isValidKvk(input: string): boolean {
  return new RegExp(`^\\d{${KVK_LENGTH}}$`).test(normalizeKvk(input));
}

export function formatKvk(input: string): string {
  const kvk = normalizeKvk(input);
  return kvk.length === KVK_LENGTH ? kvk : input;
}

export function normalizeVatId(input: string): string {
  return input.replace(/\s/g, '').toUpperCase();
}

export function isValidDutchVatId(input: string): boolean {
  return /^NL\d{9}B\d{2}$/.test(normalizeVatId(input));
}

export function formatVatId(input: string): string {
  const vat = normalizeVatId(input);
  return isValidDutchVatId(vat) ? `${vat.slice(0, 2)} ${vat.slice(2, 11)} ${vat.slice(11)}` : input;
}

/**
 * Validates a Dutch IBAN: `NL`, two check digits, a four-letter bank code and
 * ten digits — then the mod-97 check that catches transposed characters.
 */
export function isValidDutchIban(input: string): boolean {
  const iban = input.replace(/\s/g, '').toUpperCase();
  if (!/^NL\d{2}[A-Z]{4}\d{10}$/.test(iban)) return false;

  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (char) => String(char.charCodeAt(0) - 55));

  // The number is longer than Number.MAX_SAFE_INTEGER, so take the modulus in
  // chunks rather than converting the whole string at once.
  let remainder = 0;
  for (const digit of numeric) {
    remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

export function formatIban(input: string): string {
  const iban = input.replace(/\s/g, '').toUpperCase();
  return iban.match(/.{1,4}/g)?.join(' ') ?? input;
}

/** Dutch postcode: four digits and two letters, e.g. `1012 AB`. */
export function isValidPostcode(input: string): boolean {
  return /^\d{4}\s?[A-Za-z]{2}$/.test(input.trim());
}

export function formatPostcode(input: string): string {
  const compact = input.replace(/\s/g, '').toUpperCase();
  return /^\d{4}[A-Z]{2}$/.test(compact) ? `${compact.slice(0, 4)} ${compact.slice(4)}` : input;
}
