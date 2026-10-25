/**
 * Domain errors. Each carries a stable `code` so the UI can translate it and
 * the API can map it to a status without string-matching messages.
 */
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(what: string) {
    super('notFound', `${what} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends DomainError {
  constructor(code: string, message: string) {
    super(code, message, 409);
    this.name = 'ConflictError';
  }
}

export class OutOfStockError extends ConflictError {
  constructor(public readonly sku: string) {
    super('outOfStock', `Not enough stock for ${sku}`);
    this.name = 'OutOfStockError';
  }
}

/** The shape a server action returns to a form. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; code: string; message: string; fieldErrors?: Record<string, string[]> };

export function failure(error: unknown): ActionResult<never> {
  if (error instanceof DomainError) {
    return { ok: false, code: error.code, message: error.message };
  }
  if (error instanceof Error) {
    return { ok: false, code: 'unexpected', message: error.message };
  }
  return { ok: false, code: 'unexpected', message: 'Something went wrong' };
}
