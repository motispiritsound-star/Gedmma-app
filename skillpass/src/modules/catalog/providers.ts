import { z } from 'zod';
import { prisma } from '@/lib/db';
import { audit } from '@/lib/audit';
import { ConflictError, ValidationError } from '@/lib/errors';
import { requireProviderAccess } from '@/lib/auth/rbac';
import type { SessionUser } from '@/lib/auth/session';
import { notify } from '@/modules/notifications/service';
import { slugify } from '@/lib/slug';

/** KVK numbers are 8 digits. Format only — see the caveat below. */
const kvkSchema = z
  .string()
  .trim()
  .regex(/^\d{8}$/, 'A Dutch KVK number has 8 digits')
  .optional()
  .or(z.literal(''));

export const providerOnboardingSchema = z.object({
  legalName: z.string().trim().min(2).max(160),
  displayName: z.string().trim().min(2).max(80),
  description: z.string().trim().min(40, 'Tell parents what you offer (at least 40 characters)').max(2000),
  chamberOfCommerceNo: kvkSchema,
  vatNumber: z.string().trim().max(20).optional().or(z.literal('')),
  contactPersonName: z.string().trim().min(2).max(80),
  contactEmail: z.string().trim().email(),
  contactPhone: z.string().trim().max(30).optional().or(z.literal('')),
  websiteUrl: z.string().trim().url().optional().or(z.literal('')),
  liabilityInsurer: z.string().trim().max(120).optional().or(z.literal('')),
  liabilityPolicyNo: z.string().trim().max(60).optional().or(z.literal('')),
  insuranceExpiresAt: z.string().optional().or(z.literal('')),
  safeguardingPolicyUrl: z.string().trim().url().optional().or(z.literal('')),
  /** Self-declaration that staff working with minors hold a valid Dutch VOG. */
  vogDeclared: z.boolean().default(false),
});

export type ProviderOnboardingInput = z.infer<typeof providerOnboardingSchema>;


async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base) || 'provider';
  let suffix = 1;
  while (await prisma.provider.findUnique({ where: { slug } })) {
    slug = `${slugify(base)}-${++suffix}`;
  }
  return slug;
}

/**
 * Creates a provider in DRAFT and makes the applicant its OWNER. Nothing is
 * publishable until a human administrator approves it.
 *
 * IMPORTANT: none of the identity fields collected here are verified
 * automatically. A KVK number is format-checked, not looked up; an insurance
 * policy number is a string. Approval is a human decision recorded in
 * ProviderVerification. See SAFEGUARDING.md.
 */
export async function createProviderApplication(user: SessionUser, input: ProviderOnboardingInput) {
  const existing = await prisma.providerStaff.findFirst({ where: { userId: user.id } });
  if (existing) throw new ConflictError('provider_exists', 'This account is already linked to a provider');

  const slug = await uniqueSlug(input.displayName);

  const provider = await prisma.$transaction(async (tx) => {
    const created = await tx.provider.create({
      data: {
        slug,
        legalName: input.legalName,
        displayName: input.displayName,
        description: input.description,
        chamberOfCommerceNo: input.chamberOfCommerceNo || null,
        vatNumber: input.vatNumber || null,
        contactPersonName: input.contactPersonName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone || null,
        websiteUrl: input.websiteUrl || null,
        liabilityInsurer: input.liabilityInsurer || null,
        liabilityPolicyNo: input.liabilityPolicyNo || null,
        insuranceExpiresAt: input.insuranceExpiresAt ? new Date(input.insuranceExpiresAt) : null,
        safeguardingPolicyUrl: input.safeguardingPolicyUrl || null,
        vogDeclared: input.vogDeclared,
        status: 'PENDING_REVIEW',
        staff: { create: { userId: user.id, role: 'OWNER' } },
      },
    });

    // The verification checklist an administrator has to work through.
    await tx.providerVerification.createMany({
      data: [
        { providerId: created.id, documentType: 'CHAMBER_OF_COMMERCE', reference: input.chamberOfCommerceNo || null },
        { providerId: created.id, documentType: 'LIABILITY_INSURANCE', reference: input.liabilityPolicyNo || null },
        { providerId: created.id, documentType: 'VOG_DECLARATION', reference: input.vogDeclared ? 'self-declared' : null },
        { providerId: created.id, documentType: 'SAFEGUARDING_POLICY', reference: input.safeguardingPolicyUrl || null },
      ],
    });

    await tx.user.update({ where: { id: user.id }, data: { role: 'PROVIDER_STAFF' } });

    await audit(
      {
        actorUserId: user.id,
        actorRole: 'PROVIDER_STAFF',
        action: 'provider.application_submitted',
        entityType: 'Provider',
        entityId: created.id,
        metadata: { slug },
      },
      tx,
    );
    return created;
  });

  return provider;
}

export const venueSchema = z.object({
  name: z.string().trim().min(2).max(120),
  addressLine1: z.string().trim().min(4).max(160),
  postalCode: z.string().trim().min(4).max(12),
  cityId: z.string().cuid(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  accessibilityNotes: z.string().trim().max(500).optional().or(z.literal('')),
  wheelchairAccessible: z.boolean().default(false),
});

export async function createVenue(user: SessionUser, providerId: string, input: z.infer<typeof venueSchema>) {
  await requireProviderAccess(user, providerId, 'venues:write');
  const { approximate } = await import('@/lib/adapters/geo');
  const coarse = approximate({ latitude: input.latitude, longitude: input.longitude });
  const venue = await prisma.venue.create({
    data: {
      providerId,
      name: input.name,
      addressLine1: input.addressLine1,
      postalCode: input.postalCode,
      cityId: input.cityId,
      latitude: input.latitude,
      longitude: input.longitude,
      approxLatitude: coarse.latitude,
      approxLongitude: coarse.longitude,
      accessibilityNotes: input.accessibilityNotes || null,
      wheelchairAccessible: input.wheelchairAccessible,
    },
  });
  await audit({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'provider.venue_created',
    entityType: 'Venue',
    entityId: venue.id,
    metadata: { providerId },
  });
  return venue;
}

/** Administrator decision on a single verification item. */
export async function decideVerification(
  admin: SessionUser,
  verificationId: string,
  decision: 'APPROVED' | 'REJECTED' | 'MORE_INFO_REQUIRED',
  note?: string,
) {
  const verification = await prisma.providerVerification.findUniqueOrThrow({
    where: { id: verificationId },
    include: { provider: true },
  });

  await prisma.providerVerification.update({
    where: { id: verificationId },
    data: { decision, reviewerId: admin.id, reviewerNote: note ?? null, decidedAt: new Date() },
  });

  await audit({
    actorUserId: admin.id,
    actorRole: admin.role,
    action: 'admin.verification_decided',
    entityType: 'ProviderVerification',
    entityId: verificationId,
    metadata: { providerId: verification.providerId, decision, documentType: verification.documentType },
  });

  return verification.providerId;
}

/**
 * Approves the provider itself. Requires every verification item to be
 * APPROVED first: an administrator cannot skip the checklist.
 */
export async function approveProvider(admin: SessionUser, providerId: string, note?: string) {
  const items = await prisma.providerVerification.findMany({ where: { providerId } });
  const outstanding = items.filter((item) => item.decision !== 'APPROVED');
  if (outstanding.length > 0) {
    throw new ValidationError('Every verification item must be approved before the provider can be approved', {
      outstanding: outstanding.map((i) => i.documentType),
    });
  }

  const provider = await prisma.provider.update({
    where: { id: providerId },
    data: { status: 'APPROVED', approvedAt: new Date(), suspendedAt: null },
    include: { staff: { include: { user: true } } },
  });

  await audit({
    actorUserId: admin.id,
    actorRole: admin.role,
    action: 'admin.provider_approved',
    entityType: 'Provider',
    entityId: providerId,
    metadata: { note: note ?? null },
  });

  for (const staff of provider.staff) {
    await notify({
      userId: staff.userId,
      category: 'PROVIDER_VERIFICATION',
      titleNl: 'Je aanmelding is goedgekeurd',
      titleEn: 'Your application has been approved',
      bodyNl: `${provider.displayName} is geverifieerd. Je kunt nu activiteiten publiceren.`,
      bodyEn: `${provider.displayName} has been verified. You can now publish activities.`,
      link: '/nl/provider',
    });
  }

  return provider;
}

export async function rejectProvider(admin: SessionUser, providerId: string, reason: string) {
  const provider = await prisma.provider.update({
    where: { id: providerId },
    data: { status: 'REJECTED' },
    include: { staff: true },
  });
  // Rejecting takes everything off the marketplace immediately.
  await prisma.activity.updateMany({ where: { providerId }, data: { status: 'ARCHIVED' } });

  await audit({
    actorUserId: admin.id,
    actorRole: admin.role,
    action: 'admin.provider_rejected',
    entityType: 'Provider',
    entityId: providerId,
    metadata: { reason },
  });

  for (const staff of provider.staff) {
    await notify({
      userId: staff.userId,
      category: 'PROVIDER_VERIFICATION',
      titleNl: 'Je aanmelding is afgewezen',
      titleEn: 'Your application was rejected',
      bodyNl: `Reden: ${reason}`,
      bodyEn: `Reason: ${reason}`,
    });
  }
  return provider;
}

export async function suspendProvider(admin: SessionUser, providerId: string, reason: string) {
  const provider = await prisma.provider.update({
    where: { id: providerId },
    data: { status: 'SUSPENDED', suspendedAt: new Date() },
  });
  await prisma.activity.updateMany({ where: { providerId, status: 'PUBLISHED' }, data: { status: 'PENDING_REVIEW' } });
  await audit({
    actorUserId: admin.id,
    actorRole: admin.role,
    action: 'admin.provider_suspended',
    entityType: 'Provider',
    entityId: providerId,
    metadata: { reason },
  });
  return provider;
}

export async function verificationQueue() {
  return prisma.provider.findMany({
    where: { status: { in: ['PENDING_REVIEW', 'DRAFT'] } },
    include: { verifications: { orderBy: { documentType: 'asc' } }, staff: { include: { user: true } } },
    orderBy: { createdAt: 'asc' },
  });
}
