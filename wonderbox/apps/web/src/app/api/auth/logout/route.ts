import { NextResponse } from 'next/server';
import { destroySession } from '../../../../lib/auth/session.ts';
import { env } from '../../../../lib/env.ts';

export async function POST(): Promise<NextResponse> {
  await destroySession();
  return NextResponse.redirect(new URL('/', env.APP_URL), { status: 303 });
}
