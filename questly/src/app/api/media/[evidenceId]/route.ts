import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getSessionUser } from "@/modules/auth/session";
import { readEvidenceFor, verifyMediaToken } from "@/modules/media";

export const dynamic = "force-dynamic";

/**
 * Private family media.
 *
 * Two independent checks must both pass:
 *  1. the caller has a session whose family owns the evidence;
 *  2. the URL carries an unexpired signature bound to that evidence and family.
 *
 * Either check alone would be enough for the happy path; requiring both means a
 * leaked link is useless to a signed-out stranger, and a signed-in member of
 * another family cannot enumerate ids.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ evidenceId: string }> },
): Promise<Response> {
  const { evidenceId } = await context.params;
  const user = await getSessionUser();
  if (!user?.familyId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const url = new URL(request.url);
  const valid = verifyMediaToken(
    {
      evidenceId,
      familyId: user.familyId,
      exp: url.searchParams.get("exp"),
      sig: url.searchParams.get("sig"),
    },
    env().MEDIA_SECRET,
  );
  if (!valid) {
    return NextResponse.json({ error: "invalid_or_expired_link" }, { status: 403 });
  }

  try {
    const { bytes, mimeType } = await readEvidenceFor({ evidenceId, familyId: user.familyId, userId: user.id });
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    logger.error("media.read_failed", { evidenceId, error: String(error) });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
