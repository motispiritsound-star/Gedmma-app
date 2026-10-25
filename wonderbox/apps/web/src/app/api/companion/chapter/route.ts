import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { familyActor } from '../../../../lib/auth/session.ts';
import { LocaleSchema } from '../../../../lib/i18n/locale.ts';
import { DomainError } from '../../../../lib/errors.ts';
import { requireBoxOwnership } from '../../../../server/activation.ts';
import { chapterPayload } from '../../../../server/content.ts';
import { objectStorage } from '../../../../lib/providers/storage/index.ts';
import { prisma } from '../../../../lib/db.ts';

/**
 * `loadChapter` over HTTP.
 *
 * Two gates, both mandatory and both here rather than in the client:
 *   1. The family must own the activated box.
 *   2. The chapter must have a PUBLISHED, human-approved content version.
 *
 * Audio comes back as short-lived signed URLs, never as storage keys.
 */
const QuerySchema = z.object({
  activatedBoxId: z.string().min(1),
  chapterId: z.string().min(1),
  locale: LocaleSchema,
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const actor = await familyActor();
  if (!actor) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  const parsed = QuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json({ type: 'error', code: 'badRequest' }, { status: 400 });
  }

  const box = await requireBoxOwnership(parsed.data.activatedBoxId, actor.familyId);
  if (!box) {
    return NextResponse.json({ type: 'error', code: 'notFound' }, { status: 404 });
  }

  try {
    const payload = await chapterPayload(parsed.data.chapterId, box.id, {
      locale: parsed.data.locale,
    });

    // Swap the placeholder /api/audio/<id> references for signed URLs the
    // browser (and the service worker) can cache for the length of a session.
    const storage = objectStorage();
    const assets = await prisma.audioAsset.findMany({
      where: { id: { in: payload.audio.map((track) => track.url.split('/').pop() ?? '') } },
      select: { id: true, objectKey: true },
    });
    const keys = new Map(assets.map((asset) => [asset.id, asset.objectKey]));

    const audio = await Promise.all(
      payload.audio.map(async (track) => {
        const assetId = track.url.split('/').pop() ?? '';
        const key = keys.get(assetId);
        if (!key) return track;
        const signed = await storage.sign(key);
        return { ...track, url: signed.url };
      }),
    );

    return NextResponse.json(
      { ...payload, audio },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json(
        { type: 'error', code: error.code, message: error.message },
        { status: error.status },
      );
    }
    throw error;
  }
}
