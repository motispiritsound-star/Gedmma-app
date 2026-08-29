import { NextResponse } from 'next/server';
import { api } from '@/lib/api';

/**
 * Hands the caller their own export bundle as a file.
 *
 * The API decides whether this request belongs to this person; this handler
 * only turns the JSON into a download, so "download my data" is a real button
 * rather than a promise on a settings page.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;
  const result = await api.get<{ request: { scope: string }; bundle: unknown }>(
    `/account/export/${encodeURIComponent(id)}`,
  );
  if (!result.ok || !result.data) {
    return NextResponse.json(result.error ?? { error: 'not_found' }, {
      status: result.status,
    });
  }
  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(result.data.bundle, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="focusfamily-${result.data.request.scope}-${day}.json"`,
      'cache-control': 'no-store',
    },
  });
}
