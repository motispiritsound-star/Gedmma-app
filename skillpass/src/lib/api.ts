import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from './errors';

export interface ApiError {
  error: { code: string; message: string; details?: unknown };
}

/** Maps a thrown error onto a stable JSON response. Never leaks a stack trace. */
export function apiError(error: unknown): NextResponse<ApiError> {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: 'validation_error',
          message: 'The submitted data is invalid',
          details: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
        },
      },
      { status: 422 },
    );
  }
  console.error('[api] unhandled error', error);
  return NextResponse.json({ error: { code: 'internal_error', message: 'Something went wrong' } }, { status: 500 });
}

export function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'unknown';
}
