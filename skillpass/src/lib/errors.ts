/** Application-level errors that map onto stable HTTP responses. */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'The submitted data is invalid', details?: unknown) {
    super('validation_error', message, 422, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super('authentication_required', message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'You do not have access to this resource') {
    super('forbidden', message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super('not_found', message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(code: string, message: string, details?: unknown) {
    super(code, message, 409, details);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfterSeconds: number) {
    super('rate_limited', 'Too many requests, please slow down', 429, { retryAfterSeconds });
  }
}

/** Raised whenever code attempts to open an adult -> child communication path. */
export class ChildContactBlockedError extends AppError {
  constructor(message = 'Direct contact with a child profile is not permitted on SkillPass') {
    super('child_contact_blocked', message, 403);
  }
}

export class InsufficientCreditsError extends AppError {
  constructor(required: number, available: number) {
    super('insufficient_credits', 'Not enough credits for this booking', 409, { required, available });
  }
}

export class SessionFullError extends AppError {
  constructor() {
    super('session_full', 'This session is fully booked', 409);
  }
}
