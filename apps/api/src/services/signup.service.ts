import type { PrismaClient } from '@prisma/client';
import type { Locale, SignupInput } from '@buurklus/shared';
import { AppError } from '../lib/errors.js';

/**
 * The waiting list the website's registration page writes to.
 *
 * A marketplace's first day is its hardest: the first customer in a
 * municipality needs a tradesperson already there, and the first tradesperson
 * needs a reason to look. Collecting both sides before launch is how that
 * chicken-and-egg gets solved, and it is the only thing this service does.
 */
export class SignupService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Records an interest registration. Signing up twice with the same address
   * updates the entry rather than failing: someone who fills the form in again
   * because they were not sure it went through should not be told off.
   */
  async register(
    input: SignupInput,
    context: { locale: Locale; ip?: string; userAgent?: string },
  ) {
    // A filled honeypot means a bot. Answering "ok" rather than "rejected"
    // keeps it from learning what tripped it.
    if (input.website) return { ok: true, alreadyRegistered: false };

    const city = input.citySlug
      ? await this.prisma.city.findFirst({
          where: { slug: input.citySlug, isActive: true },
          select: { id: true },
        })
      : null;
    if (input.citySlug && !city) throw new AppError('not_found', { details: { field: 'citySlug' } });

    if (input.role === 'PRO' && input.categorySlugs?.length) {
      const known = await this.prisma.category.count({
        where: { slug: { in: input.categorySlugs }, isActive: true },
      });
      if (known !== input.categorySlugs.length) {
        throw new AppError('not_found', { details: { field: 'categorySlugs' } });
      }
    }

    const existing = await this.prisma.signup.findUnique({
      where: { email_role: { email: input.email, role: input.role } },
      select: { id: true },
    });

    const data = {
      phone: input.phone ?? null,
      name: input.name?.trim() || null,
      cityId: city?.id ?? null,
      categorySlugs: input.role === 'PRO' ? (input.categorySlugs ?? []) : [],
      kvk: input.kvk ?? null,
      locale: input.locale ?? context.locale,
      ip: context.ip ?? null,
      userAgent: context.userAgent?.slice(0, 500) ?? null,
      // Re-submitting is a fresh act of consent, so the timestamp moves.
      consentAt: new Date(),
      // And it undoes an earlier unsubscribe, because that is what asking
      // again means.
      unsubscribedAt: null,
    };

    await this.prisma.signup.upsert({
      where: { email_role: { email: input.email, role: input.role } },
      create: { email: input.email, role: input.role, ...data },
      update: data,
    });

    return { ok: true, alreadyRegistered: existing !== null };
  }

  /**
   * How many people are waiting, by side and by municipality. This is what
   * tells you whether a launch in Utrecht would work yet; it names nobody.
   */
  async counts() {
    const [byRole, byCity] = await Promise.all([
      this.prisma.signup.groupBy({
        by: ['role'],
        _count: { _all: true },
        where: { unsubscribedAt: null },
      }),
      this.prisma.signup.groupBy({
        by: ['cityId', 'role'],
        _count: { _all: true },
        where: { unsubscribedAt: null, cityId: { not: null } },
      }),
    ]);

    return {
      customers: byRole.find((row) => row.role === 'CUSTOMER')?._count._all ?? 0,
      pros: byRole.find((row) => row.role === 'PRO')?._count._all ?? 0,
      byCity,
    };
  }

  /** Takes someone off the list at their own request (Article 7(3)). */
  async unsubscribe(email: string) {
    const result = await this.prisma.signup.updateMany({
      where: { email: email.trim().toLowerCase(), unsubscribedAt: null },
      data: { unsubscribedAt: new Date() },
    });
    // The count is deliberately not reported back: answering "that address is
    // not on our list" would turn this into a way to test addresses.
    return { ok: true, entries: result.count };
  }
}
