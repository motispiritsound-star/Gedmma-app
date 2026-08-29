import { NextResponse } from 'next/server';
import { searchActivities, searchSchema } from '@/modules/catalog/search';
import { toDbLocale, isLocale, DEFAULT_LOCALE } from '@/lib/i18n';
import { consumeRateLimit } from '@/lib/rate-limit';
import { apiError, clientIp } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    consumeRateLimit('search', clientIp(request));
    const url = new URL(request.url);
    const localeParam = url.searchParams.get('locale');
    const locale = isLocale(localeParam) ? localeParam : DEFAULT_LOCALE;

    const input = searchSchema.parse(Object.fromEntries(url.searchParams.entries()));
    const results = await searchActivities(input, toDbLocale(locale));
    return NextResponse.json(results);
  } catch (error) {
    return apiError(error);
  }
}
