import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { storageProvider, verifyMediaSignature } from '@/lib/adapters/storage';
import { audit } from '@/lib/audit';
import { apiError } from '@/lib/api';
import { AuthorizationError, NotFoundError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * Private media. Three checks, all required:
 *   1. a valid, unexpired HMAC signature bound to this asset and viewer,
 *   2. a live session belonging to that same viewer,
 *   3. authorisation for the asset (own provider, or platform staff).
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const viewer = url.searchParams.get('viewer') ?? '';
    const expires = Number(url.searchParams.get('expires') ?? '0');
    const signature = url.searchParams.get('signature') ?? '';

    if (!verifyMediaSignature(id, viewer, expires, signature)) {
      throw new AuthorizationError('This media link is invalid or has expired');
    }

    const user = await getCurrentUser();
    if (!user || user.id !== viewer) throw new AuthorizationError('This media link is not for you');

    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundError('Media not found');

    if (asset.visibility === 'PRIVATE') {
      const isStaff = user.role === 'ADMIN' || user.role === 'SAFEGUARDING_OFFICER';
      const ownsProvider = asset.providerId
        ? (await prisma.providerStaff.findFirst({ where: { providerId: asset.providerId, userId: user.id } })) !== null
        : false;
      if (!isStaff && !ownsProvider) throw new AuthorizationError('You do not have access to this file');
    }

    const data = await storageProvider().get(asset.storageKey);
    await audit({ actorUserId: user.id, actorRole: user.role, action: 'media.viewed', entityType: 'MediaAsset', entityId: id });

    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': asset.mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(asset.originalName)}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
