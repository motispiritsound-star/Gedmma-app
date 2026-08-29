import { NextResponse, type NextRequest } from 'next/server';

const LOCALES = ['nl', 'en'];

/** Every page lives under /nl or /en; requests without one are negotiated. */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (LOCALES.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`))) {
    return NextResponse.next();
  }

  const header = request.headers.get('accept-language')?.toLowerCase() ?? '';
  const locale = header.split(',').some((part) => part.trim().startsWith('en')) && !header.includes('nl') ? 'en' : 'nl';

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip API routes, the mock checkout page and Next's own assets.
  matcher: ['/((?!api|checkout|_next/static|_next/image|favicon.ico|robots.txt).*)'],
};
