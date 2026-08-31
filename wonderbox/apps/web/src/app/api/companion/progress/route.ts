import { NextResponse, type NextRequest } from 'next/server';
import { SyncWhenOnlineCommandSchema } from '@wonderbox/hardware-protocol';
import { z } from 'zod';
import { familyActor } from '../../../../lib/auth/session.ts';
import { prisma } from '../../../../lib/db.ts';
import { syncProgress } from '../../../../server/progress.ts';
import { DomainError } from '../../../../lib/errors.ts';

/**
 * `syncWhenOnline` over HTTP.
 *
 * The device posts its whole queue. Because every entry carries a stable
 * clientEventId and the column is UNIQUE, replaying the same queue any number
 * of times produces exactly the same rows — which is what makes it safe for a
 * box that has been offline for a week to just fire everything at once.
 */
const BodySchema = SyncWhenOnlineCommandSchema.extend({
  childProfileId: z.string().min(1).optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const actor = await familyActor();
  if (!actor) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  const json: unknown = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { type: 'error', code: 'badRequest', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // A child profile can only be attributed within the same family.
  let childProfileId: string | null = null;
  if (parsed.data.childProfileId) {
    const child = await prisma.childProfile.findFirst({
      where: { id: parsed.data.childProfileId, familyId: actor.familyId },
      select: { id: true },
    });
    childProfileId = child?.id ?? null;
  }

  try {
    const result = await syncProgress({
      activatedBoxId: parsed.data.activatedBoxId,
      familyId: actor.familyId,
      childProfileId,
      deviceId: parsed.data.deviceId ?? null,
      events: parsed.data.events,
    });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ type: 'error', code: error.code }, { status: error.status });
    }
    throw error;
  }
}
