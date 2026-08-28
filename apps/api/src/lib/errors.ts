import { DEFAULT_LOCALE, type Locale } from '@buurklus/shared';

/**
 * Error codes are stable identifiers; the API returns both the code and a
 * message already translated into the caller's language, so the app can show
 * something useful even for a code it does not know yet.
 */
export type ErrorCode =
  | 'validation_failed'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'rate_limited'
  | 'otp_invalid'
  | 'otp_expired'
  | 'otp_too_many_attempts'
  | 'account_blocked'
  | 'pro_profile_required'
  | 'pro_profile_exists'
  | 'subscription_required'
  | 'no_credits_remaining'
  | 'plan_limit_categories'
  | 'plan_limit_cities'
  | 'job_not_open'
  | 'job_quote_limit_reached'
  | 'job_already_quoted'
  | 'lead_not_released'
  | 'quote_not_pending'
  | 'quote_expired'
  | 'review_already_exists'
  | 'review_requires_completed_job'
  | 'conflict'
  | 'internal_error';

const MESSAGES: Record<ErrorCode, Record<Locale, string>> = {
  validation_failed: {
    nl: 'Sommige gegevens kloppen niet.',
    en: 'Some of the information provided is invalid.',
  },
  unauthorized: {
    nl: 'Log in om verder te gaan.',
    en: 'Please sign in to continue.',
  },
  forbidden: {
    nl: 'Je hebt geen toegang tot dit onderdeel.',
    en: 'You do not have access to this resource.',
  },
  not_found: {
    nl: 'Niet gevonden.',
    en: 'Not found.',
  },
  rate_limited: {
    nl: 'Te veel pogingen. Probeer het over een paar minuten opnieuw.',
    en: 'Too many attempts. Try again in a few minutes.',
  },
  otp_invalid: {
    nl: 'Onjuiste code.',
    en: 'Incorrect code.',
  },
  otp_expired: {
    nl: 'Deze code is verlopen. Vraag een nieuwe aan.',
    en: 'That code has expired. Request a new one.',
  },
  otp_too_many_attempts: {
    nl: 'Te veel pogingen. Vraag een nieuwe code aan.',
    en: 'Too many attempts. Request a new code.',
  },
  account_blocked: {
    nl: 'Dit account is geblokkeerd. Neem contact op met de klantenservice.',
    en: 'This account has been suspended. Please contact support.',
  },
  pro_profile_required: {
    nl: 'Maak je bedrijfsprofiel af om verder te gaan.',
    en: 'Complete your business profile to continue.',
  },
  pro_profile_exists: {
    nl: 'Er bestaat al een bedrijfsprofiel voor dit account.',
    en: 'A business profile already exists for this account.',
  },
  subscription_required: {
    nl: 'Je hebt een actief abonnement nodig om een offerte te sturen.',
    en: 'An active subscription is required to send a quote.',
  },
  no_credits_remaining: {
    nl: 'Je offertes voor deze maand zijn op. Kies een groter pakket voor meer.',
    en: 'You have used all of this month’s quotes. Upgrade your plan for more.',
  },
  plan_limit_categories: {
    nl: 'Je pakket staat niet zoveel vakgebieden toe.',
    en: 'Your plan does not allow that many trades.',
  },
  plan_limit_cities: {
    nl: 'Je pakket staat niet zoveel gemeenten toe.',
    en: 'Your plan does not allow that many municipalities.',
  },
  job_not_open: {
    nl: 'Deze klus neemt geen offertes meer aan.',
    en: 'This job is no longer accepting quotes.',
  },
  job_quote_limit_reached: {
    nl: 'Deze klus heeft het maximale aantal offertes al ontvangen.',
    en: 'This job has already received the maximum number of quotes.',
  },
  job_already_quoted: {
    nl: 'Je hebt al een offerte gestuurd voor deze klus.',
    en: 'You have already sent a quote for this job.',
  },
  lead_not_released: {
    nl: 'Deze klus is nog niet vrijgegeven voor jouw pakket.',
    en: 'This job has not been released to your plan yet.',
  },
  quote_not_pending: {
    nl: 'Deze offerte staat niet meer open.',
    en: 'That quote is no longer pending.',
  },
  quote_expired: {
    nl: 'Deze offerte is verlopen.',
    en: 'That quote has expired.',
  },
  review_already_exists: {
    nl: 'Je hebt deze klus al beoordeeld.',
    en: 'You have already reviewed this job.',
  },
  review_requires_completed_job: {
    nl: 'Je kunt een beoordeling achterlaten zodra de klus is afgerond.',
    en: 'You can leave a review once the work is complete.',
  },
  conflict: {
    nl: 'Deze actie past niet bij de huidige status.',
    en: 'That action conflicts with the current state.',
  },
  internal_error: {
    nl: 'Er ging iets mis. Probeer het later opnieuw.',
    en: 'Something went wrong. Please try again later.',
  },
};

const DEFAULT_STATUS: Record<ErrorCode, number> = {
  validation_failed: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  rate_limited: 429,
  otp_invalid: 400,
  otp_expired: 410,
  otp_too_many_attempts: 429,
  account_blocked: 403,
  pro_profile_required: 403,
  pro_profile_exists: 409,
  subscription_required: 402,
  no_credits_remaining: 402,
  plan_limit_categories: 403,
  plan_limit_cities: 403,
  job_not_open: 409,
  job_quote_limit_reached: 409,
  job_already_quoted: 409,
  lead_not_released: 403,
  quote_not_pending: 409,
  quote_expired: 410,
  review_already_exists: 409,
  review_requires_completed_job: 409,
  conflict: 409,
  internal_error: 500,
};

export class AppError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(readonly code: ErrorCode, options: { status?: number; details?: unknown } = {}) {
    super(code);
    this.name = 'AppError';
    this.statusCode = options.status ?? DEFAULT_STATUS[code];
    this.details = options.details;
  }

  localizedMessage(locale: Locale = DEFAULT_LOCALE): string {
    return MESSAGES[this.code][locale] ?? MESSAGES[this.code][DEFAULT_LOCALE];
  }
}

export function errorMessage(code: ErrorCode, locale: Locale = DEFAULT_LOCALE): string {
  return MESSAGES[code][locale] ?? MESSAGES[code][DEFAULT_LOCALE];
}
