import { NextResponse } from 'next/server'
import { getAuthContext } from '@/modules/auth/session'
import { readEvidenceForFamily, verifyMediaSignature } from '@/modules/media/service'
import { isAppError } from '@/lib/errors'
import { logger } from '@/lib/logger'

/**
 * Serves a private family photograph.
 *
 * Two independent checks, both required:
 *   1. a valid, unexpired HMAC signature bound to this evidence id and family;
 *   2. a live session belonging to that same family.
 *
 * There is deliberately no administrator bypass.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const context = await getAuthContext()
  if (!context?.family) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const url = new URL(request.url)
  const signatureValid = verifyMediaSignature({
    evidenceId: id,
    familyId: context.family.id,
    expires: url.searchParams.get('expires'),
    signature: url.searchParams.get('signature'),
  })

  if (!signatureValid) {
    return NextResponse.json({ error: 'invalid_or_expired_link' }, { status: 403 })
  }

  try {
    const { buffer, mimeType } = await readEvidenceForFamily({
      evidenceId: id,
      familyId: context.family.id,
      userId: context.user.id,
    })

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(buffer.byteLength),
        // Private, and never stored by a shared cache.
        'Cache-Control': 'private, max-age=60, no-store',
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json({ error: error.code }, { status: error.status })
    }
    logger.error('media.read_failed', { evidenceId: id, error })
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
