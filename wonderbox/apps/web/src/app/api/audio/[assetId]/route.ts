import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db.ts';
import { familyActor } from '../../../../lib/auth/session.ts';
import { objectStorage } from '../../../../lib/providers/storage/index.ts';
import { publishedChapterVersion } from '../../../../server/content.ts';

/**
 * Serves one narration file.
 *
 * Even here the approval gate applies: audio attached to a chapter that has no
 * published version is a 404, not a stream. Otherwise "unapproved content is
 * not playable" would be true of the API and false of the audio behind it.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assetId: string }> },
): Promise<NextResponse> {
  const { assetId } = await params;
  const actor = await familyActor();
  if (!actor) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  const asset = await prisma.audioAsset.findUnique({
    where: { id: assetId },
    select: { objectKey: true, mimeType: true, chapterId: true },
  });
  if (!asset) return NextResponse.json({ error: 'notFound' }, { status: 404 });

  if (asset.chapterId) {
    const version = await publishedChapterVersion(asset.chapterId);
    if (version === null) return NextResponse.json({ error: 'notApproved' }, { status: 404 });
  }

  // The family must own a box whose journey contains this chapter.
  const owned = await prisma.activatedBox.findFirst({
    where: {
      familyId: actor.familyId,
      boxProduct: { journey: { chapters: { some: { id: asset.chapterId ?? '' } } } },
    },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ error: 'notFound' }, { status: 404 });

  const object = await objectStorage().get(asset.objectKey);
  if (!object) return NextResponse.json({ error: 'notFound' }, { status: 404 });

  return new NextResponse(Buffer.from(object.body), {
    headers: {
      'Content-Type': asset.mimeType || object.contentType,
      'Content-Length': String(object.body.byteLength),
      'Cache-Control': 'private, no-store',
      'Accept-Ranges': 'none',
    },
  });
}
