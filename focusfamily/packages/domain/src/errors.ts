/**
 * Domain-level errors. They are deliberately boring: a stable machine code, a
 * bilingual message key, and optional details. Presentation layers translate
 * `messageKey` through the i18n catalogue so that the same failure reads warmly
 * in Dutch and in English.
 */

export type DomainErrorCode =
  | 'forbidden'
  | 'consent_required'
  | 'not_found'
  | 'invalid_input'
  | 'conflict'
  | 'entitlement_required'
  | 'capability_unavailable'
  | 'policy_violation';

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly messageKey: string;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    code: DomainErrorCode,
    messageKey: string,
    details: Record<string, unknown> = {},
  ) {
    super(`${code}: ${messageKey}`);
    this.name = 'DomainError';
    this.code = code;
    this.messageKey = messageKey;
    this.details = Object.freeze({ ...details });
  }

  static forbidden(messageKey: string, details?: Record<string, unknown>): DomainError {
    return new DomainError('forbidden', messageKey, details);
  }

  static consentRequired(messageKey: string, details?: Record<string, unknown>): DomainError {
    return new DomainError('consent_required', messageKey, details);
  }

  static invalid(messageKey: string, details?: Record<string, unknown>): DomainError {
    return new DomainError('invalid_input', messageKey, details);
  }

  static policy(messageKey: string, details?: Record<string, unknown>): DomainError {
    return new DomainError('policy_violation', messageKey, details);
  }
}

/** HTTP status mapping kept in the domain so every transport agrees. */
export const HTTP_STATUS_BY_CODE: Readonly<Record<DomainErrorCode, number>> = Object.freeze({
  forbidden: 403,
  consent_required: 451,
  not_found: 404,
  invalid_input: 422,
  conflict: 409,
  entitlement_required: 402,
  capability_unavailable: 501,
  policy_violation: 400,
});
