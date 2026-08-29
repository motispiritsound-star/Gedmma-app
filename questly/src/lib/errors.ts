/** Application-level errors that route handlers and server actions map to HTTP. */

export type AppErrorCode =
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'validation'
  | 'conflict'
  | 'rate_limited'
  | 'plan_limit'
  | 'internal'

const STATUS: Record<AppErrorCode, number> = {
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  validation: 422,
  conflict: 409,
  rate_limited: 429,
  plan_limit: 402,
  internal: 500,
}

export class AppError extends Error {
  readonly code: AppErrorCode
  readonly status: number
  readonly details?: Record<string, string[]>

  constructor(code: AppErrorCode, message: string, details?: Record<string, string[]>) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = STATUS[code]
    this.details = details
  }
}

export const unauthenticated = (message = 'Sign in to continue.') =>
  new AppError('unauthenticated', message)
export const forbidden = (message = 'You do not have access to this resource.') =>
  new AppError('forbidden', message)
export const notFound = (message = 'Not found.') => new AppError('not_found', message)
export const validationError = (message: string, details?: Record<string, string[]>) =>
  new AppError('validation', message, details)
export const conflict = (message: string) => new AppError('conflict', message)
export const rateLimited = (message = 'Too many attempts. Try again later.') =>
  new AppError('rate_limited', message)
export const planLimit = (message: string) => new AppError('plan_limit', message)

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}
