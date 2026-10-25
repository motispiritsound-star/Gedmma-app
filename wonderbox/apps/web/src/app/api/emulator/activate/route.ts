import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { familyActor } from '../../../../lib/auth/session.ts';
import { activateBox } from '../../../../server/activation.ts';

/**
 * `activateBox` for the emulator.
 *
 * It is the same service call the parent-facing form makes — deliberately, so
 * the emulator cannot accidentally be given a laxer path than a real user. The
 * session still decides which family is claiming the box.
 */
const BodySchema = z.object({ code: z.string().min(3).max(32) });

export async function POST(request: NextRequest): Promise<NextResponse> {
  const actor = await familyActor();
  if (!actor) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'invalidCode' });

  const outcome = await activateBox({
    code: parsed.data.code,
    familyId: actor.familyId,
    userId: actor.id,
  });

  return NextResponse.json(
    outcome.ok
      ? { ok: true, activatedBoxId: outcome.activatedBox.id, boxTitle: outcome.boxTitle }
      : { ok: false, error: outcome.error },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
