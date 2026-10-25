import { NextResponse, type NextRequest } from 'next/server';
import { objectStorage } from '../../../lib/providers/storage/index.ts';

/**
 * Resolves a signed storage reference produced by `ObjectStorage.sign()`.
 *
 * The signature carries the key and an expiry, so this route needs no session:
 * possession of a fresh, correctly signed link is the authorisation, exactly
 * as it would be with a presigned S3 URL. Links live for
 * STORAGE_URL_TTL_SECONDS (five minutes by default).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const key = request.nextUrl.searchParams.get('key');
  const expires = request.nextUrl.searchParams.get('expires');
  const signature = request.nextUrl.searchParams.get('sig');

  if (!key || !expires || !signature) {
    return NextResponse.json({ error: 'badRequest' }, { status: 400 });
  }

  const storage = objectStorage();
  if (!storage.verify(key, expires, signature)) {
    return NextResponse.json({ error: 'expiredOrInvalid' }, { status: 403 });
  }

  const object = await storage.get(key);
  if (!object) return NextResponse.json({ error: 'notFound' }, { status: 404 });

  return new NextResponse(Buffer.from(object.body), {
    headers: {
      'Content-Type': object.contentType,
      'Content-Length': String(object.body.byteLength),
      // Cacheable by the browser and the service worker only for as long as
      // the signature is valid; never by a shared cache.
      'Cache-Control': 'private, max-age=240',
    },
  });
}
