/** Errors that are safe to show to an end user. */
export class AppError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class AuthError extends AppError {
  constructor(message = "You need to sign in to continue.") {
    super(message, "unauthenticated", 401);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have access to this.") {
    super(message, "forbidden", 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found.") {
    super(message, "not_found", 404);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends AppError {
  constructor(readonly retryAfterSeconds: number) {
    super(`Too many attempts. Try again in ${retryAfterSeconds} seconds.`, "rate_limited", 429);
    this.name = "RateLimitError";
  }
}

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: string; fieldErrors?: Record<string, string[]> };

export function ok(): ActionResult<undefined>;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function fail(error: string, code = "invalid", fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, code, ...(fieldErrors ? { fieldErrors } : {}) };
}

export function toActionResult(error: unknown): ActionResult<never> {
  if (error instanceof AppError) return fail(error.message, error.code);
  return fail("Something went wrong. Please try again.", "internal");
}
