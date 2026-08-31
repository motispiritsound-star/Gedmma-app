import { NextResponse } from 'next/server';
import { familyActor } from '../../../../lib/auth/session.ts';
import { exportFamilyData } from '../../../../server/privacy.ts';

/** Streams the family's own data as a download. Never cached anywhere. */
export async function GET(): Promise<NextResponse> {
  const actor = await familyActor();
  if (!actor) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  const data = await exportFamilyData(actor.familyId, actor.id);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="wonderbox-export-${actor.familyId}.json"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
