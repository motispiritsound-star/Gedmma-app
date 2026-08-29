import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { generateToken, hashPassword, hashToken, verifyPassword } from "@/lib/crypto";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { AUDIT_ACTIONS, recordAudit } from "@/modules/audit";
import { emailSender } from "@/modules/notifications";
import type { RegisterInput, SignInInput } from "./schemas";

export type RegistrationResult = {
  userId: string;
  familyId: string;
  /**
   * Returned only when AUTH_SHOW_VERIFICATION_LINK is on (development and
   * tests), so the link can be clicked without an inbox.
   */
  verificationToken: string | null;
};

const VERIFICATION_TTL_MS = 24 * 3600_000;

/**
 * Creates the parent user, their family, the owner membership, a free
 * subscription and default preferences in one transaction. A half-created
 * family would leave the onboarding flow stuck, so it is all or nothing.
 */
export async function registerParent(input: RegisterInput, ip: string | null): Promise<RegistrationResult> {
  const passwordHash = await hashPassword(input.password);
  const verificationToken = generateToken(32);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          displayName: input.displayName,
          role: "PARENT",
          locale: input.locale === "en" ? "EN" : "NL",
        },
      });

      const family = await tx.family.create({
        data: {
          name: input.familyName,
          locale: input.locale === "en" ? "EN" : "NL",
          memberships: { create: { userId: user.id, role: "OWNER" } },
          preference: { create: {} },
          subscription: { create: { plan: "FREE", status: "ACTIVE", provider: "MOCK" } },
        },
      });

      await tx.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(verificationToken),
          expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
        },
      });

      return { userId: user.id, familyId: family.id };
    });

    await recordAudit({
      action: AUDIT_ACTIONS.userRegistered,
      targetType: "user",
      targetId: result.userId,
      actorUserId: result.userId,
      actorRole: "PARENT",
      familyId: result.familyId,
      ip,
    });

    await sendVerificationEmail(input.email, verificationToken);

    return {
      ...result,
      verificationToken: env().AUTH_SHOW_VERIFICATION_LINK ? verificationToken : null,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("An account with this email address already exists.", "email_taken", 409);
    }
    throw error;
  }
}

/**
 * Verifies credentials. Always performs a hash comparison, even for unknown
 * addresses, so response timing does not reveal which emails are registered.
 */
const DUMMY_HASH = "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA$" + "A".repeat(86);

export async function authenticate(input: SignInInput, ip: string | null): Promise<{ userId: string } | null> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const stored = user?.passwordHash ?? DUMMY_HASH;
  const valid = await verifyPassword(input.password, stored);

  if (!user || !valid || user.deletedAt) {
    await recordAudit({
      action: AUDIT_ACTIONS.userSignInFailed,
      targetType: "user",
      targetId: user?.id ?? null,
      ip,
      metadata: { reason: user ? "bad_password" : "unknown_email" },
    });
    return null;
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await recordAudit({
    action: AUDIT_ACTIONS.userSignedIn,
    targetType: "user",
    targetId: user.id,
    actorUserId: user.id,
    actorRole: user.role,
    ip,
  });

  return { userId: user.id };
}

export async function verifyEmail(token: string, ip: string | null): Promise<boolean> {
  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.consumedAt || record.expiresAt <= new Date()) return false;

  await prisma.$transaction([
    prisma.emailVerificationToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } }),
    prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
  ]);

  await recordAudit({
    action: AUDIT_ACTIONS.userEmailVerified,
    targetType: "user",
    targetId: record.userId,
    actorUserId: record.userId,
    ip,
  });
  return true;
}

async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const url = `${env().APP_URL}/verify?token=${encodeURIComponent(token)}`;
  await emailSender().send({
    to: email,
    subject: "Bevestig je Questly-account / Confirm your Questly account",
    body: "Open de link om je e-mailadres te bevestigen. / Open the link to confirm your email address.",
    sensitiveUrl: url,
  });
}

/** Issues a fresh verification token, invalidating older unused ones. */
export async function issueVerificationToken(userId: string): Promise<string> {
  const token = generateToken(32);
  await prisma.$transaction([
    prisma.emailVerificationToken.updateMany({
      where: { userId, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    prisma.emailVerificationToken.create({
      data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS) },
    }),
  ]);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } });
  await sendVerificationEmail(user.email, token);
  logger.info("auth.verification_token_issued", { userId });
  return token;
}
