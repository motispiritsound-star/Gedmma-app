import type { Locale as DbLocale } from '@prisma/client';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { generateToken, hashPassword, sha256, verifyPassword } from '@/lib/crypto';
import { AuthenticationError, ConflictError, ValidationError } from '@/lib/errors';
import { audit } from '@/lib/audit';
import { notify } from '@/modules/notifications/service';
import { toDbLocale } from '@/lib/i18n';
import type { RegisterInput } from './schemas';

const VERIFY_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
const MAX_FAILED_LOGINS = 8;
const LOCKOUT_MS = 15 * 60_000;

/** Emails are compared case-insensitively; the original casing is preserved. */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export interface RegisterResult {
  userId: string;
  familyId: string;
  /** Returned so development/tests can complete verification without an inbox. */
  verificationToken: string;
}

export async function registerGuardian(
  input: RegisterInput,
  meta: { ip?: string | null; userAgent?: string | null } = {},
): Promise<RegisterResult> {
  const emailNormalised = normaliseEmail(input.email);
  const existing = await prisma.user.findUnique({ where: { emailNormalised } });
  if (existing) {
    throw new ConflictError('email_taken', 'An account with this email address already exists');
  }

  const passwordHash = await hashPassword(input.password);
  const locale: DbLocale = toDbLocale(input.locale);
  const rawToken = generateToken(32);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email.trim(),
        emailNormalised,
        passwordHash,
        displayName: input.displayName,
        role: 'GUARDIAN',
        status: 'PENDING_VERIFICATION',
        locale,
      },
    });

    const family = await tx.family.create({
      data: {
        name: input.familyName,
        locale,
        currency: env().DEFAULT_CURRENCY,
        cityId: input.cityId ?? null,
        memberships: { create: { userId: user.id, role: 'OWNER' } },
      },
    });

    await tx.emailToken.create({
      data: {
        tokenHash: sha256(rawToken),
        userId: user.id,
        purpose: 'verify_email',
        expiresAt: new Date(Date.now() + VERIFY_TTL_MS),
      },
    });

    // Consent is recorded as evidence, with the policy version in force.
    await tx.consent.createMany({
      data: [
        { userId: user.id, type: 'TERMS_OF_SERVICE', granted: true, version: '2026-01' },
        { userId: user.id, type: 'PRIVACY_POLICY', granted: true, version: '2026-01' },
        { userId: user.id, type: 'CHILD_DATA_PROCESSING', granted: true, version: '2026-01' },
      ],
    });

    await audit(
      {
        actorUserId: user.id,
        actorRole: 'GUARDIAN',
        action: 'auth.register',
        entityType: 'User',
        entityId: user.id,
        metadata: { familyId: family.id },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
      tx,
    );

    return { userId: user.id, familyId: family.id };
  });

  const link = `${env().APP_URL}/${input.locale}/auth/verify?token=${rawToken}`;
  await notify({
    userId: result.userId,
    category: 'ACCOUNT',
    titleNl: 'Bevestig je e-mailadres',
    titleEn: 'Confirm your email address',
    bodyNl: `Welkom bij SkillPass. Bevestig je e-mailadres via deze link: ${link}`,
    bodyEn: `Welcome to SkillPass. Confirm your email address using this link: ${link}`,
    link,
  });

  return { ...result, verificationToken: rawToken };
}

export async function verifyEmail(rawToken: string): Promise<{ userId: string }> {
  const record = await prisma.emailToken.findUnique({ where: { tokenHash: sha256(rawToken) } });
  if (!record || record.purpose !== 'verify_email') throw new ValidationError('This verification link is not valid');
  if (record.usedAt) throw new ValidationError('This verification link has already been used');
  if (record.expiresAt.getTime() < Date.now()) throw new ValidationError('This verification link has expired');

  await prisma.$transaction(async (tx) => {
    await tx.emailToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    await tx.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date(), status: 'ACTIVE' },
    });
    await audit({ actorUserId: record.userId, action: 'auth.email_verified', entityType: 'User', entityId: record.userId }, tx);
  });

  return { userId: record.userId };
}

export async function authenticate(
  email: string,
  password: string,
  meta: { ip?: string | null; userAgent?: string | null } = {},
): Promise<{ userId: string }> {
  const user = await prisma.user.findUnique({ where: { emailNormalised: normaliseEmail(email) } });

  // Constant-ish work regardless of whether the account exists.
  const stored = user?.passwordHash ?? 'scrypt$00$00';
  const ok = await verifyPassword(password, stored);

  if (!user || !ok || user.status === 'DELETED') {
    if (user) {
      const failed = user.failedLoginCount + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: failed,
          lockedUntil: failed >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCKOUT_MS) : user.lockedUntil,
        },
      });
      await audit({ actorUserId: user.id, action: 'auth.login_failed', entityType: 'User', entityId: user.id, ip: meta.ip });
    }
    throw new AuthenticationError('Email address or password is incorrect');
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    throw new AuthenticationError('This account is temporarily locked after too many attempts');
  }
  if (user.status === 'SUSPENDED') {
    throw new AuthenticationError('This account is suspended. Contact support.');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  await audit({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'auth.login',
    entityType: 'User',
    entityId: user.id,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return { userId: user.id };
}

/** GDPR art. 20 — a machine-readable copy of everything tied to the account. */
export async function exportAccountData(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      consents: true,
      memberships: { include: { family: true } },
      reviews: true,
      favourites: true,
      notifications: { where: { channel: 'IN_APP' } },
    },
  });

  const familyIds = user.memberships.map((m) => m.familyId);
  const [children, bookings, ledger, payments] = await Promise.all([
    prisma.childProfile.findMany({ where: { familyId: { in: familyIds } }, include: { interests: true } }),
    prisma.booking.findMany({
      where: { familyId: { in: familyIds } },
      include: { session: { include: { activity: { include: { translations: true } } } }, attendance: true },
    }),
    prisma.creditLedgerEntry.findMany({ where: { familyId: { in: familyIds } } }),
    prisma.payment.findMany({ where: { familyId: { in: familyIds } } }),
  ]);

  await audit({ actorUserId: userId, action: 'privacy.data_exported', entityType: 'User', entityId: userId });

  return {
    exportedAt: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      locale: user.locale,
      createdAt: user.createdAt,
    },
    consents: user.consents,
    families: user.memberships.map((m) => m.family),
    children,
    bookings,
    creditLedger: ledger,
    payments,
    reviews: user.reviews,
    favourites: user.favourites,
    notifications: user.notifications,
  };
}

/**
 * GDPR art. 17 erasure. Child data is deleted outright. Financial records are
 * retained but severed from the person: ledger and payment rows stay for
 * bookkeeping, with every identifying reference removed. Documented in
 * SECURITY_AND_PRIVACY.md.
 */
export async function deleteAccount(userId: string, reason = 'guardian_request') {
  const memberships = await prisma.familyMembership.findMany({ where: { userId }, select: { familyId: true } });
  const familyIds = memberships.map((m) => m.familyId);

  await prisma.$transaction(async (tx) => {
    // Child profiles and everything that identifies a child.
    await tx.childProfile.deleteMany({ where: { familyId: { in: familyIds } } });
    await tx.favourite.deleteMany({ where: { userId } });
    await tx.notification.deleteMany({ where: { userId } });
    await tx.authSession.deleteMany({ where: { userId } });
    await tx.emailToken.deleteMany({ where: { userId } });

    // Reviews are public content: keep the text, drop the authorship link.
    await tx.review.updateMany({ where: { authorId: userId }, data: { status: 'HIDDEN' } });

    const stamp = Date.now();
    await tx.user.update({
      where: { id: userId },
      data: {
        email: `deleted+${stamp}@skillpass.invalid`,
        emailNormalised: `deleted+${stamp}@skillpass.invalid`,
        displayName: 'Deleted account',
        phone: null,
        passwordHash: 'scrypt$deleted$deleted',
        status: 'DELETED',
        anonymisedAt: new Date(),
      },
    });

    await audit(
      { actorUserId: null, action: 'privacy.account_deleted', entityType: 'User', entityId: userId, metadata: { reason } },
      tx,
    );
  });
}
