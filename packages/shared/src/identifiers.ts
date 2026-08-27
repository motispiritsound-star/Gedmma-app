/**
 * Moroccan business identifiers used to verify a professional account.
 *
 * - ICE: Identifiant Commun de l'Entreprise, 15 digits, mandatory for every
 *   registered business and the identifier customers can check publicly.
 * - RC:  Registre de Commerce number, issued by the commercial court.
 * - IF:  Identifiant Fiscal, issued by the tax authority.
 * - CNSS: social security affiliation number, present when the pro has staff.
 */
export const ICE_LENGTH = 15;

export function normalizeIce(input: string): string {
  return input.replace(/\D/g, '');
}

export function isValidIce(input: string): boolean {
  return new RegExp(`^\\d{${ICE_LENGTH}}$`).test(normalizeIce(input));
}

export function formatIce(input: string): string {
  const ice = normalizeIce(input);
  if (ice.length !== ICE_LENGTH) return input;
  // Displayed as 9 + 4 + 2: establishment, then sequence, then check digits.
  return `${ice.slice(0, 9)} ${ice.slice(9, 13)} ${ice.slice(13)}`;
}

export function isValidRc(input: string): boolean {
  return /^\d{1,12}$/.test(input.replace(/\s/g, ''));
}

export function isValidTaxId(input: string): boolean {
  return /^\d{6,10}$/.test(input.replace(/\s/g, ''));
}

export function isValidCnss(input: string): boolean {
  return /^\d{7,10}$/.test(input.replace(/\s/g, ''));
}

/**
 * Moroccan national identity card ("CIN"): one or two letters then digits,
 * e.g. `AB123456`. Used for sole traders who have no ICE yet.
 */
export function isValidCin(input: string): boolean {
  return /^[A-Za-z]{1,2}\d{4,8}$/.test(input.replace(/\s/g, ''));
}
