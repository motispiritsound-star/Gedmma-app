import { NextResponse, type NextRequest } from 'next/server';
import { env } from '../../../lib/env.ts';
import { isLocale } from '../../../lib/i18n/locale.ts';
import { LOCALE_COOKIE } from '../../../lib/ui/locale.ts';

/** Stores an explicit language choice. Nothing else is kept in this cookie. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const form = await request.formData();
  const chosen = String(form.get('locale') ?? '');
  const referer = request.headers.get('referer');
  const target = referer && referer.startsWith(env.APP_URL) ? referer : new URL('/', env.APP_URL);

  const response = NextResponse.redirect(target, { status: 303 });
  if (isLocale(chosen)) {
    response.cookies.set(LOCALE_COOKIE, chosen, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}
