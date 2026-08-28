import type { AgreementsInput, Locale, UserRole } from '@buurklus/shared';
import { DEFAULT_LOCALE } from '@buurklus/shared';
import type { Prisma, PrismaClient } from '@prisma/client';
import { AppError } from '../lib/errors.js';
import {
  generateOpaqueToken,
  generateOtpCode,
  hashesEqual,
  sha256,
} from '../lib/crypto.js';
import { otpMessage, type SmsAdapter } from '../adapters/sms.js';

export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
/** A new code may not be requested more often than this. */
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
/** Codes a single number may request per hour, to blunt SMS-pumping abuse. */
export const OTP_MAX_PER_HOUR = 5;

export interface IssuedOtp {
  expiresAt: Date;
  resendAvailableAt: Date;
  /** Returned only outside production, so the app can prefill during demos. */
  debugCode?: string;
}

export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly sms: SmsAdapter,
    private readonly isProduction: boolean,
  ) {}

  async requestOtp(phone: string, locale: Locale = DEFAULT_LOCALE, requestIp?: string): Promise<IssuedOtp> {
    const now = new Date();

    const existingUser = await this.prisma.user.findUnique({ where: { phone } });
    if (existingUser?.isBlocked) throw new AppError('account_blocked');

    const recent = await this.prisma.otpChallenge.findMany({
      where: { phone, createdAt: { gte: new Date(now.getTime() - 3_600_000) } },
      orderBy: { createdAt: 'desc' },
    });
    if (recent.length >= OTP_MAX_PER_HOUR) throw new AppError('rate_limited');

    const last = recent[0];
    if (last && now.getTime() - last.createdAt.getTime() < OTP_RESEND_COOLDOWN_SECONDS * 1000) {
      throw new AppError('rate_limited');
    }

    const code = generateOtpCode();
    const expiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * 60_000);

    await this.prisma.otpChallenge.create({
      data: { phone, codeHash: sha256(code), expiresAt, requestIp },
    });

    await this.sms.send({ to: phone, body: otpMessage(code, locale) });

    return {
      expiresAt,
      resendAvailableAt: new Date(now.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000),
      ...(this.isProduction ? {} : { debugCode: code }),
    };
  }

  /**
   * Checks the code and returns the account, creating it on first sign-in.
   * Consuming a challenge is one statement so two devices racing the same code
   * cannot both succeed.
   */
  async verifyOtp(params: {
    phone: string;
    code: string;
    role?: Exclude<UserRole, 'ADMIN'>;
    locale?: Locale;
    agreements?: AgreementsInput;
    ip?: string;
    userAgent?: string;
  }) {
    const now = new Date();
    const challenge = await this.prisma.otpChallenge.findFirst({
      where: { phone: params.phone, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge) throw new AppError('otp_invalid');
    if (challenge.expiresAt < now) throw new AppError('otp_expired');
    if (challenge.attempts >= OTP_MAX_ATTEMPTS) throw new AppError('otp_too_many_attempts');

    if (!hashesEqual(challenge.codeHash, sha256(params.code))) {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      throw new AppError('otp_invalid');
    }

    const consumed = await this.prisma.otpChallenge.updateMany({
      where: { id: challenge.id, consumedAt: null },
      data: { consumedAt: now },
    });
    if (consumed.count === 0) throw new AppError('otp_invalid');

    const existing = await this.prisma.user.findUnique({
      where: { phone: params.phone },
      select: { id: true },
    });

    // An account cannot come into existence without a record of what its
    // holder agreed to: the terms have to be agreed before the contract
    // exists, and the record is the only evidence it happened.
    if (!existing && !params.agreements) throw new AppError('agreements_required');

    const user = await this.prisma.user.upsert({
      where: { phone: params.phone },
      create: {
        phone: params.phone,
        phoneVerifiedAt: now,
        role: params.role ?? 'CUSTOMER',
        locale: params.locale ?? DEFAULT_LOCALE,
        termsVersion: params.agreements?.terms,
        privacyVersion: params.agreements?.privacy,
        ageConfirmedAt: params.agreements ? now : undefined,
      },
      update: { phoneVerifiedAt: now, lastSeenAt: now },
      include: { proProfile: { select: { id: true, verificationStatus: true } } },
    });

    if (user.isBlocked) throw new AppError('account_blocked');

    if (params.agreements) {
      await this.recordAgreements({
        userId: user.id,
        agreements: params.agreements,
        current: { terms: user.termsVersion, privacy: user.privacyVersion },
        isNewAccount: !existing,
        ip: params.ip,
        userAgent: params.userAgent,
        now,
      });
    }

    return user;
  }

  /**
   * Writes an append-only row for each document whose version has moved, and
   * updates the copy on the user so a later sign-in can tell in one read
   * whether anything new needs showing.
   *
   * Re-agreeing to a version already on file writes nothing: a row per sign-in
   * would bury the moments that actually matter under thousands of duplicates.
   */
  private async recordAgreements(params: {
    userId: string;
    agreements: AgreementsInput;
    current: { terms: string | null; privacy: string | null };
    isNewAccount: boolean;
    ip?: string;
    userAgent?: string;
    now: Date;
  }) {
    const changed: { document: 'TERMS' | 'PRIVACY'; version: string }[] = [];
    if (params.isNewAccount || params.current.terms !== params.agreements.terms) {
      changed.push({ document: 'TERMS', version: params.agreements.terms });
    }
    if (params.isNewAccount || params.current.privacy !== params.agreements.privacy) {
      changed.push({ document: 'PRIVACY', version: params.agreements.privacy });
    }
    if (changed.length === 0) return;

    await this.prisma.$transaction([
      this.prisma.agreementRecord.createMany({
        data: changed.map((entry) => ({
          userId: params.userId,
          document: entry.document,
          version: entry.version,
          acceptedAt: params.now,
          ip: params.ip,
          userAgent: params.userAgent?.slice(0, 500),
        })),
      }),
      this.prisma.user.update({
        where: { id: params.userId },
        data: {
          termsVersion: params.agreements.terms,
          privacyVersion: params.agreements.privacy,
          ageConfirmedAt: params.now,
        },
      }),
    ]);
  }

  /**
   * Issues an opaque refresh token. Only its hash is stored, so a database
   * leak does not hand out sessions.
   */
  async issueRefreshToken(userId: string, ttlMs: number, userAgent?: string) {
    const token = generateOpaqueToken();
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + ttlMs),
        userAgent,
      },
    });
    return token;
  }

  /** Rotates a refresh token: the presented one is revoked and a new one issued. */
  async rotateRefreshToken(token: string, ttlMs: number, userAgent?: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: sha256(token) },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new AppError('unauthorized');
    }
    if (stored.user.isBlocked) throw new AppError('account_blocked');

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const nextToken = await this.issueRefreshToken(stored.userId, ttlMs, userAgent);
    return { user: stored.user, token: nextToken };
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async updateProfile(userId: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  async registerDevice(userId: string, token: string, platform: string) {
    await this.prisma.deviceToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId },
    });
  }
}
