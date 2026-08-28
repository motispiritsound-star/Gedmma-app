/** Controles op invoer. Puur, zodat ze getest kunnen worden zonder app. */

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/** Geeft een foutmelding terug, of null als het goed is. */
export function controleerEmail(email: string): string | null {
  const schoon = email.trim();
  if (schoon === '') return 'Vul je e-mailadres in.';
  if (!EMAIL.test(schoon)) return 'Dit lijkt geen geldig e-mailadres.';
  return null;
}

export const MIN_WACHTWOORD = 8;

export function controleerWachtwoord(wachtwoord: string): string | null {
  if (wachtwoord.length < MIN_WACHTWOORD) {
    return `Gebruik minstens ${MIN_WACHTWOORD} tekens.`;
  }
  if (/^\d+$/.test(wachtwoord)) return 'Gebruik niet alleen cijfers.';
  if (/^(.)\1+$/.test(wachtwoord)) return 'Gebruik niet steeds hetzelfde teken.';
  return null;
}

export function controleerNaam(naam: string): string | null {
  if (naam.trim().length < 2) return 'Vul je naam in.';
  return null;
}

/** Ruwe indicatie van hoe sterk een wachtwoord is: 0 t/m 3. */
export function wachtwoordSterkte(wachtwoord: string): number {
  if (wachtwoord.length < MIN_WACHTWOORD) return 0;
  let punten = 1;
  if (/[a-z]/.test(wachtwoord) && /[A-Z]/.test(wachtwoord)) punten += 1;
  if (/\d/.test(wachtwoord) && /[^\w\s]/.test(wachtwoord)) punten += 1;
  if (wachtwoord.length >= 14) punten += 1;
  return Math.min(3, punten);
}

export function normaliseerEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function controleerPincode(pincode: string): string | null {
  if (!/^\d{4}$/.test(pincode)) return 'Kies vier cijfers.';
  if (/^(\d)\1{3}$/.test(pincode)) return 'Kies niet vier dezelfde cijfers.';
  if ('0123456789'.includes(pincode) || '9876543210'.includes(pincode)) {
    return 'Kies geen opeenvolgende cijfers.';
  }
  return null;
}
