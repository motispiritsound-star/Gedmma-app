import { NextResponse } from 'next/server';
import { api, WEB_ORIGIN } from '@/lib/api';

/**
 * Same-origin proxy for the focus timer's offline queue.
 *
 * The session cookie is httpOnly and scoped to this origin, so the browser
 * cannot call the API directly - and that is the point: authorisation stays
 * server side and the page never holds a bearer token.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
): Promise<NextResponse> {
  const origin = request.headers.get('origin');
  if (origin && origin !== WEB_ORIGIN) {
    return NextResponse.json({ error: 'origin_not_allowed' }, { status: 403 });
  }
  const { sessionId } = await context.params;
  const body: unknown = await request.json();
  const result = await api.post(`/focus/sessions/${encodeURIComponent(sessionId)}/sync`, body);
  return NextResponse.json(result.ok ? result.data : result.error, {
    status: result.status,
  });
}
