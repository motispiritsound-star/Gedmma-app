import type { Prisma, PrismaClient } from '@prisma/client';
import { ANONYMISED, retentionCutoff } from '@buurklus/shared';
import { AppError } from '../lib/errors.js';
import type { NotificationService } from './notification.service.js';

/**
 * The rights side of the GDPR, in code: what someone can take with them
 * (Articles 15 and 20), what they can have erased (Article 17), the consent
 * they can withdraw (Article 7(3)), and the storage limitation that applies
 * whether or not anyone asks (Article 5(1)(e)).
 *
 * Erasure here means anonymisation, not DELETE. Three things point at a user
 * row and must survive: an invoice, which Dutch tax law says is kept for seven
 * years; a review, which the professional it describes is entitled to keep;
 * and the other side of a conversation, whose own messages are not the
 * requester's to delete. Article 17(3) allows exactly this. A cascading DELETE
 * would take all three down, which is why none is used.
 */

/** Warning a dormant account gets before it is erased. */
export const INACTIVE_NOTICE_DAYS = 30;

export class PrivacyService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly notifications: NotificationService,
  ) {}

  /**
   * Everything held about one account, in the structure it is stored in.
   *
   * Article 20 asks for a "structured, commonly used, machine-readable
   * format", which JSON is. Article 15 asks for the personal data itself
   * rather than a summary of it, so this is a dump and not a report -- the
   * point is that the person can check it, not that it reads nicely.
   */
  async exportAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        city: { select: { slug: true, nameNl: true, nameEn: true } },
        agreements: { orderBy: { acceptedAt: 'asc' } },
        devices: { select: { platform: true, createdAt: true } },
        notifications: { orderBy: { createdAt: 'asc' } },
        proProfile: {
          include: {
            trades: { include: { category: { select: { slug: true } } } },
            coverage: { include: { city: { select: { slug: true } } } },
            subscriptions: {
              include: { plan: { select: { slug: true } }, payments: true },
            },
            creditEntries: { orderBy: { createdAt: 'asc' } },
            quotes: true,
            reviews: true,
          },
        },
      },
    });
    if (!user) throw new AppError('not_found');

    const [jobs, messages, reviewsWritten] = await Promise.all([
      this.prisma.job.findMany({
        where: { customerId: userId },
        include: {
          category: { select: { slug: true } },
          city: { select: { slug: true } },
          quotes: {
            // Another business's price is that business's data, not the
            // customer's. What the customer is entitled to is the fact that
            // they received it, and from whom.
            select: {
              id: true,
              amountCents: true,
              status: true,
              createdAt: true,
              pro: { select: { displayName: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.message.findMany({
        where: { senderId: userId },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.review.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Refresh tokens are deliberately not included anywhere above: their
    // hashes are ours, not theirs, and putting them in a file the holder may
    // email to themselves would turn an export into a session store. What the
    // holder is actually owed -- which devices are signed in -- is the devices
    // list, and that is there.
    return {
      exportedAt: new Date().toISOString(),
      format: 'buurklus-account-export/1',
      account: user,
      jobs,
      messages,
      reviewsWritten,
    };
  }

  /**
   * Carries out an erasure request. The account row survives, emptied of
   * everything that identifies a person, and can never be signed into again:
   * the phone number that was the sign-in identifier is gone.
   *
   * Everything runs in one transaction. A half-erased account -- name gone,
   * phone number still there -- is worse than either outcome, because it looks
   * done to whoever ordered it.
   */
  async eraseAccount(userId: string, now = new Date()) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { proProfile: { select: { id: true } } },
    });
    if (!user) throw new AppError('not_found');
    if (user.anonymisedAt) throw new AppError('conflict');

    const proId = user.proProfile?.id;
    // The sign-in identifier is unique and cannot simply be blanked, so it is
    // replaced by something that is obviously not a phone number and cannot
    // collide with a real one or with another erased account.
    const placeholder = (prefix: string) => `${prefix}:${user.id}`;

    return this.prisma.$transaction(async (tx) => {
      // Sessions and push tokens first: whatever else happens, the account
      // must stop being reachable from a device that is still signed in.
      await tx.refreshToken.deleteMany({ where: { userId } });
      await tx.deviceToken.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { userId } });

      await tx.message.updateMany({
        where: { senderId: userId },
        data: { body: ANONYMISED },
      });

      // The rating stays -- it is the professional's reputation and the other
      // customers' basis for choosing -- but the words go, because a review
      // often names the street, the house or the family that wrote it.
      await tx.review.updateMany({
        where: { authorId: userId },
        data: { comment: ANONYMISED },
      });

      await tx.job.updateMany({
        where: { customerId: userId },
        data: {
          title: ANONYMISED,
          description: ANONYMISED,
          addressLine: null,
          district: null,
          contactPhone: null,
          lat: null,
          lng: null,
          photoUrls: [],
        },
      });

      if (proId) {
        await tx.proProfile.update({
          where: { id: proId },
          data: {
            displayName: ANONYMISED,
            bio: ANONYMISED,
            logoUrl: null,
            websiteUrl: null,
            portfolioUrls: [],
            documentUrls: [],
            verificationNotes: null,
            // A KvK number identifies a one-person business as surely as a
            // name does. It is unique in this table, so it gets the same
            // collision-proof placeholder treatment as the phone number.
            kvk: placeholder('erased'),
            vatId: null,
            iban: null,
          },
        });
      }

      const erased = await tx.user.update({
        where: { id: userId },
        data: {
          phone: placeholder('erased'),
          email: null,
          firstName: null,
          lastName: null,
          avatarUrl: null,
          cityId: null,
          phoneVerifiedAt: null,
          lastSeenAt: null,
          marketingOptInAt: null,
          anonymisedAt: now,
        },
      });

      return { id: erased.id, anonymisedAt: erased.anonymisedAt };
    });
  }

  /**
   * Marketing consent, on or off. Withdrawing is as easy as giving, which
   * Article 7(3) requires, and it costs nothing else: the account keeps
   * working, because the service never depended on this consent.
   */
  async setMarketingConsent(userId: string, optIn: boolean, now = new Date()) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { marketingOptInAt: optIn ? now : null },
      select: { marketingOptInAt: true },
    });
    return { optIn: user.marketingOptInAt !== null, since: user.marketingOptInAt };
  }

  /**
   * Enforces the retention schedule. Everything it does is derived from
   * RETENTION in @buurklus/shared, which is the same list the privacy
   * statement is generated from -- so the page cannot promise a deletion the
   * code does not perform.
   *
   * Runs from `node --run retention`, on a nightly schedule. It is idempotent
   * and safe to run twice, and reports what it touched so a missed night is
   * visible rather than silent.
   */
  async sweep(now = new Date()) {
    const otp = await this.prisma.otpChallenge.deleteMany({
      where: { createdAt: { lt: retentionCutoff('otpChallenge', now) } },
    });

    // Expired sessions, kept a while past expiry so a stolen device shows up
    // in an investigation, then removed.
    const sessions = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: retentionCutoff('refreshToken', now) } },
    });

    // The dormant-account warning is exempt: it is the record that proves the
    // holder was told before their account was erased, and purging it would
    // restart the notice period every quarter and mean nobody was ever erased.
    const notifications = await this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: retentionCutoff('notification', now) },
        type: { not: 'ACCOUNT_INACTIVE' },
      },
    });

    const jobs = await this.anonymiseOldJobs(now);
    const accounts = await this.handleInactiveAccounts(now);

    return {
      sweptAt: now.toISOString(),
      otpChallenges: otp.count,
      expiredSessions: sessions.count,
      notifications: notifications.count,
      ...jobs,
      ...accounts,
    };
  }

  /**
   * Strips the free text and the address out of jobs that finished long ago.
   * The row stays: the category, the municipality and the dates are what the
   * marketplace is measured by, and none of them identifies anybody.
   */
  private async anonymiseOldJobs(now: Date) {
    const cutoff = retentionCutoff('closedJob', now);
    const result = await this.prisma.job.updateMany({
      where: {
        status: { in: ['COMPLETED', 'CANCELLED', 'EXPIRED'] },
        updatedAt: { lt: cutoff },
        // Nothing is gained by rewriting a job that is already stripped, and
        // skipping them keeps the reported count honest.
        addressLine: { not: null },
      },
      data: {
        title: ANONYMISED,
        description: ANONYMISED,
        addressLine: null,
        contactPhone: null,
        photoUrls: [],
      },
    });
    return { anonymisedJobs: result.count };
  }

  /**
   * An account nobody has signed into for three years is erased -- but only
   * after it has been told. Deleting first and explaining afterwards is how a
   * tradesperson loses their reviews the week they come back from a long
   * illness, so the sweep warns, waits, and only then erases.
   */
  private async handleInactiveAccounts(now: Date) {
    const cutoff = retentionCutoff('inactiveAccount', now);
    const noticePeriodMs = INACTIVE_NOTICE_DAYS * 86_400_000;

    const dormant = await this.prisma.user.findMany({
      where: {
        anonymisedAt: null,
        OR: [{ lastSeenAt: { lt: cutoff } }, { lastSeenAt: null, createdAt: { lt: cutoff } }],
      },
      select: {
        id: true,
        notifications: {
          where: { type: 'ACCOUNT_INACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    let warned = 0;
    let erased = 0;
    for (const user of dormant) {
      const notice = user.notifications[0];
      if (!notice) {
        // Sent through the notification service so it reaches the device as a
        // push in the holder's own language, not just the in-app list.
        await this.notifications.notify({
          userId: user.id,
          type: 'ACCOUNT_INACTIVE',
          params: { days: INACTIVE_NOTICE_DAYS },
        });
        warned += 1;
        continue;
      }
      if (now.getTime() - notice.createdAt.getTime() >= noticePeriodMs) {
        await this.eraseAccount(user.id, now);
        erased += 1;
      }
    }

    return { inactiveWarned: warned, inactiveErased: erased };
  }
}

/** The billing details frozen onto an invoice, so it stays legible after erasure. */
export function billingSnapshot(pro: {
  displayName: string;
  kvk: string;
  vatId: string | null;
}): Prisma.InputJsonValue {
  return { displayName: pro.displayName, kvk: pro.kvk, vatId: pro.vatId };
}
