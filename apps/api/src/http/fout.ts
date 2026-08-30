/**
 * Foutafhandeling. Elke fout die de gebruiker bereikt heeft een stabiele code,
 * een uitleg in gewone taal en waar mogelijk een concrete volgende stap.
 * Zie docs/api.md voor de volledige lijst.
 */
import { BoekhoudFout } from '@gedmma/accounting';

export type FoutCode =
  | 'validation_failed'
  | 'unauthenticated'
  | 'mfa_required'
  | 'forbidden'
  | 'not_found'
  | 'version_conflict'
  | 'idempotency_key_reused'
  | 'duplicate_document'
  | 'period_closed'
  | 'entry_not_balanced'
  | 'entry_immutable'
  | 'invoice_requirements_missing'
  | 'limit_reached'
  | 'rate_limited'
  | 'payload_too_large'
  | 'unsupported_media_type'
  | 'conflict'
  | 'internal_error';

const STATUS: Record<FoutCode, number> = {
  validation_failed: 400,
  unauthenticated: 401,
  mfa_required: 401,
  forbidden: 403,
  not_found: 404,
  version_conflict: 409,
  idempotency_key_reused: 409,
  duplicate_document: 409,
  conflict: 409,
  period_closed: 422,
  entry_not_balanced: 422,
  entry_immutable: 422,
  invoice_requirements_missing: 422,
  limit_reached: 402,
  rate_limited: 429,
  payload_too_large: 413,
  unsupported_media_type: 415,
  internal_error: 500,
};

export class ApiFout extends Error {
  readonly code: FoutCode;
  readonly status: number;
  readonly hint: string;
  readonly details: unknown;

  constructor(code: FoutCode, message: string, hint = '', details: unknown = undefined) {
    super(message);
    this.name = 'ApiFout';
    this.code = code;
    this.status = STATUS[code];
    this.hint = hint;
    this.details = details;
  }
}

/** Kortere schrijfwijzen voor de fouten die het vaakst voorkomen. */
export const fout = {
  validatie: (details: unknown, melding = 'De gegevens die je hebt ingevuld kloppen niet.') =>
    new ApiFout('validation_failed', melding, 'Kijk bij de gemarkeerde velden wat er mis is.', details),
  nietAangemeld: () =>
    new ApiFout('unauthenticated', 'Je bent niet aangemeld.', 'Meld je opnieuw aan om verder te gaan.'),
  mfaNodig: () =>
    new ApiFout('mfa_required', 'Er is nog een tweede stap nodig.', 'Vul de code uit je authenticator-app in.'),
  geenRecht: (recht: string) =>
    new ApiFout(
      'forbidden',
      'Je hebt geen toestemming voor deze handeling.',
      `Hiervoor is het recht "${recht}" nodig. Vraag een beheerder van deze administratie om toegang.`,
      { recht },
    ),
  nietGevonden: (wat = 'Dit item') =>
    new ApiFout('not_found', `${wat} bestaat niet (meer).`, 'Ververs de pagina; misschien is het verwijderd of hoort het bij een andere administratie.'),
  versieConflict: (huidigeVersie: number) =>
    new ApiFout(
      'version_conflict',
      'Iemand anders heeft dit intussen gewijzigd.',
      'Ververs de pagina om de laatste versie te zien en probeer het opnieuw.',
      { huidigeVersie },
    ),
  limiet: (wat: string) =>
    new ApiFout('limit_reached', `De grens van je abonnement voor ${wat} is bereikt.`, 'Verhoog je abonnement of maak ruimte vrij.'),
  teVeel: (herhaalNa: number) =>
    new ApiFout('rate_limited', 'Er zijn te veel verzoeken achter elkaar gedaan.', `Probeer het over ${herhaalNa} seconden opnieuw.`, { herhaalNa }),
};

/** Vertaalt een fout uit de rekenkern naar een API-fout. */
export function vanBoekhoudFout(bron: BoekhoudFout): ApiFout {
  const codes: Record<string, FoutCode> = {
    entry_not_balanced: 'entry_not_balanced',
    entry_too_few_lines: 'entry_not_balanced',
    line_debit_and_credit: 'validation_failed',
    line_no_amount: 'validation_failed',
    line_negative_amount: 'validation_failed',
    mixed_currencies: 'validation_failed',
    invalid_exchange_rate: 'validation_failed',
    tax_code_not_valid_on_date: 'validation_failed',
    tax_base_missing: 'validation_failed',
    unknown_account: 'not_found',
    account_blocked: 'validation_failed',
    period_closed: 'period_closed',
    date_outside_period: 'period_closed',
    invoice_requirements_missing: 'invoice_requirements_missing',
  };
  return new ApiFout(codes[bron.code] ?? 'validation_failed', bron.message, bron.hint, bron.details);
}

/** Herkent databasefouten die eigenlijk gebruikersfouten zijn. */
export function vanDatabaseFout(bron: unknown): ApiFout | null {
  if (typeof bron !== 'object' || bron === null) return null;
  const fouten = bron as { code?: string; constraint?: string; message?: string; detail?: string };

  if (fouten.code === '23505') {
    if (fouten.constraint === 'idx_purchase_dubbel') {
      return new ApiFout(
        'duplicate_document',
        'Deze leverancier heeft dit factuurnummer al eerder gestuurd.',
        'Controleer of je de factuur al hebt vastgelegd. Klopt het nummer niet, pas het dan aan.',
      );
    }
    if (fouten.constraint?.includes('bank_transaction')) {
      return new ApiFout(
        'duplicate_document',
        'Deze banktransactie staat er al in.',
        'Dezelfde regel is eerder geimporteerd; hij wordt overgeslagen.',
      );
    }
    return new ApiFout('conflict', 'Deze waarde bestaat al.', 'Kies een andere waarde.', {
      constraint: fouten.constraint,
    });
  }

  if (fouten.code === 'P0001' && fouten.message) {
    const melding = fouten.message;
    if (melding.includes('definitief') || melding.includes('gewijzigd')) {
      return new ApiFout('entry_immutable', melding, 'Corrigeer met een tegenboeking in plaats van een wijziging.');
    }
    if (melding.includes('Periode') || melding.includes('periode')) {
      return new ApiFout('period_closed', melding, 'Kies een datum in een open periode, of laat de periode heropenen.');
    }
    if (melding.includes('balans')) {
      return new ApiFout('entry_not_balanced', melding, 'Debet en credit moeten exact gelijk zijn.');
    }
    return new ApiFout('validation_failed', melding);
  }

  return null;
}
