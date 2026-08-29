import { sign, verifySignature } from "@/lib/crypto";

export type MediaGrant = { evidenceId: string; familyId: string; expiresAt: number };

function payload(grant: MediaGrant): string {
  return `${grant.evidenceId}.${grant.familyId}.${grant.expiresAt}`;
}

/**
 * Short-lived, family-scoped token for one evidence object. The token alone is
 * not sufficient - the media route also re-checks the caller's session and
 * family membership - but it stops a leaked URL from working indefinitely.
 */
export function signMediaUrl(grant: MediaGrant, secret: string): string {
  const signature = sign(payload(grant), secret);
  return `/api/media/${grant.evidenceId}?exp=${grant.expiresAt}&sig=${signature}`;
}

export function verifyMediaToken(
  params: { evidenceId: string; familyId: string; exp: string | null; sig: string | null },
  secret: string,
  now = Date.now(),
): boolean {
  if (!params.exp || !params.sig) return false;
  const expiresAt = Number(params.exp);
  if (!Number.isFinite(expiresAt) || expiresAt < now) return false;
  return verifySignature(
    payload({ evidenceId: params.evidenceId, familyId: params.familyId, expiresAt }),
    params.sig,
    secret,
  );
}
