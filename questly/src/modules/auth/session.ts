import "server-only";
import { cookies, headers } from "next/headers";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { generateToken, hashToken } from "@/lib/crypto";
import { AuthError, ForbiddenError } from "@/lib/errors";

export const SESSION_COOKIE = "questly_session";

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  emailVerified: boolean;
  familyId: string | null;
  familyName: string | null;
  familyRole: "OWNER" | "GUARDIAN" | null;
  onboardingCompleted: boolean;
};

export async function createSession(userId: string): Promise<string> {
  const token = generateToken(32);
  const headerStore = await headers();
  const expiresAt = new Date(Date.now() + env().SESSION_TTL_HOURS * 3600_000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      userAgent: headerStore.get("user-agent")?.slice(0, 250) ?? null,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env().NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** Removes every session for a user - used after deletion requests. */
export async function destroyAllSessionsFor(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: {
          memberships: { include: { family: true }, orderBy: { createdAt: "asc" }, take: 1 },
        },
      },
    },
  });

  if (!session || session.expiresAt <= new Date()) return null;
  const user = session.user;
  if (user.deletedAt) return null;

  const membership = user.memberships[0];
  const family = membership?.family && !membership.family.deletedAt ? membership.family : null;

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    emailVerified: user.emailVerifiedAt !== null,
    familyId: family?.id ?? null,
    familyName: family?.name ?? null,
    familyRole: family ? membership!.role : null,
    onboardingCompleted: family?.onboardingCompletedAt !== null && family?.onboardingCompletedAt !== undefined,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError();
  return user;
}

export type FamilyContext = SessionUser & { familyId: string };

/** Guarantees an authenticated parent who belongs to a family. */
export async function requireFamily(): Promise<FamilyContext> {
  const user = await requireUser();
  if (!user.familyId) throw new ForbiddenError("Create a family first.");
  return user as FamilyContext;
}

export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new ForbiddenError("This area is for administrators.");
  return user;
}

export function isAdmin(role: UserRole): boolean {
  return role === "CONTENT_ADMIN" || role === "PLATFORM_ADMIN";
}

/** Best-effort client IP from proxy headers, used only for rate limiting. */
export async function clientIp(): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headerStore.get("x-real-ip") ?? "unknown";
}
