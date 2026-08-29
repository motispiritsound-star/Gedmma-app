'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { z } from 'zod';
import { prisma } from '../../lib/db.ts';
import { clientIp, requireFamily, requirePermission } from '../../lib/auth/session.ts';
import { hashIp } from '../../lib/crypto.ts';
import { env } from '../../lib/env.ts';
import { audit } from '../../lib/audit.ts';
import { activateBox } from '../activation.ts';
import {
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
  skipNextRenewal,
} from '../subscriptions.ts';
import { deleteFamilyData, exportFamilyData, recordConsent } from '../privacy.ts';
import { openCase } from '../support.ts';
import { requestLocale } from '../../lib/ui/locale.ts';

/**
 * Parent-facing mutations. Every one of these re-derives the family from the
 * session rather than trusting an id in the form, so a crafted post cannot
 * touch someone else's data.
 */

const ChildSchema = z.object({
  displayName: z.string().trim().min(1).max(60),
  birthYear: z.coerce.number().int().min(new Date().getFullYear() - 14).max(new Date().getFullYear()),
  interests: z.string().optional(),
  narrationSpeed: z.enum(['normal', 'slow']).default('normal'),
  extraPauseSeconds: z.coerce.number().int().min(0).max(15).default(0),
});

function bandFor(birthYear: number): 'AGE_5_6' | 'AGE_7_8' | 'AGE_9_10' | 'AGE_11_12' {
  const age = new Date().getFullYear() - birthYear;
  if (age <= 6) return 'AGE_5_6';
  if (age <= 8) return 'AGE_7_8';
  if (age <= 10) return 'AGE_9_10';
  return 'AGE_11_12';
}

export async function addChildAction(formData: FormData): Promise<void> {
  const actor = await requireFamily();
  const parsed = ChildSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/account/children?error=invalid');

  await prisma.childProfile.create({
    data: {
      familyId: actor.familyId,
      displayName: parsed.data.displayName,
      birthYear: parsed.data.birthYear,
      ageBand: bandFor(parsed.data.birthYear),
      interests: (parsed.data.interests ?? '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .slice(0, 8),
      accessibility: {
        narrationSpeed: parsed.data.narrationSpeed,
        extraPauseSeconds: parsed.data.extraPauseSeconds,
      },
    },
  });
  revalidatePath('/account/children');
}

export async function removeChildAction(formData: FormData): Promise<void> {
  const actor = await requireFamily();
  const childId = String(formData.get('childId') ?? '');
  // Scoped delete: the where clause is the authorisation.
  await prisma.childProfile.deleteMany({ where: { id: childId, familyId: actor.familyId } });
  revalidatePath('/account/children');
}

const AddressSchema = z.object({
  label: z.string().trim().max(30).default('home'),
  recipient: z.string().trim().min(2).max(80),
  line1: z.string().trim().min(2).max(120),
  line2: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().min(3).max(12),
  city: z.string().trim().min(2).max(80),
  country: z.string().trim().length(2).default('NL'),
  phone: z.string().trim().max(30).optional(),
});

export async function saveAddressAction(formData: FormData): Promise<void> {
  const actor = await requireFamily();
  const parsed = AddressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/account/addresses?error=invalid');

  const isFirst = (await prisma.address.count({ where: { familyId: actor.familyId } })) === 0;
  await prisma.address.create({
    data: {
      familyId: actor.familyId,
      label: parsed.data.label,
      recipient: parsed.data.recipient,
      line1: parsed.data.line1,
      line2: parsed.data.line2 || null,
      postalCode: parsed.data.postalCode.toUpperCase(),
      city: parsed.data.city,
      country: parsed.data.country.toUpperCase(),
      phone: parsed.data.phone || null,
      isDefaultShipping: isFirst,
    },
  });
  revalidatePath('/account/addresses');
}

export async function setDefaultAddressAction(formData: FormData): Promise<void> {
  const actor = await requireFamily();
  const addressId = String(formData.get('addressId') ?? '');
  const owned = await prisma.address.findFirst({
    where: { id: addressId, familyId: actor.familyId },
  });
  if (!owned) return;
  await prisma.$transaction([
    prisma.address.updateMany({
      where: { familyId: actor.familyId },
      data: { isDefaultShipping: false },
    }),
    prisma.address.update({ where: { id: addressId }, data: { isDefaultShipping: true } }),
  ]);
  revalidatePath('/account/addresses');
}

async function ownedSubscription(familyId: string, subscriptionId: string) {
  return prisma.subscription.findFirst({ where: { id: subscriptionId, familyId } });
}

export async function skipRenewalAction(formData: FormData): Promise<void> {
  const actor = await requireFamily();
  const id = String(formData.get('subscriptionId') ?? '');
  const skip = String(formData.get('skip') ?? 'true') === 'true';
  if (!(await ownedSubscription(actor.familyId, id))) return;
  await skipNextRenewal(id, skip, actor.id);
  revalidatePath('/account/subscription');
}

export async function pauseSubscriptionAction(formData: FormData): Promise<void> {
  const actor = await requireFamily();
  const id = String(formData.get('subscriptionId') ?? '');
  const months = Math.min(Math.max(Number(formData.get('months') ?? 1), 1), 6);
  if (!(await ownedSubscription(actor.familyId, id))) return;
  const until = new Date();
  until.setUTCMonth(until.getUTCMonth() + months);
  await pauseSubscription(id, until, actor.id);
  revalidatePath('/account/subscription');
}

export async function resumeSubscriptionAction(formData: FormData): Promise<void> {
  const actor = await requireFamily();
  const id = String(formData.get('subscriptionId') ?? '');
  if (!(await ownedSubscription(actor.familyId, id))) return;
  await resumeSubscription(id, actor.id);
  revalidatePath('/account/subscription');
}

export async function cancelSubscriptionAction(formData: FormData): Promise<void> {
  const actor = await requireFamily();
  const id = String(formData.get('subscriptionId') ?? '');
  if (!(await ownedSubscription(actor.familyId, id))) return;
  await cancelSubscription(id, actor.id);
  revalidatePath('/account/subscription');
}

export async function activateBoxAction(formData: FormData): Promise<void> {
  const actor = await requireFamily();
  const locale = await requestLocale();
  const code = String(formData.get('code') ?? '');
  const outcome = await activateBox({
    code,
    familyId: actor.familyId,
    userId: actor.id,
    locale,
  });
  if (!outcome.ok) redirect(`/account/activate?error=${outcome.error}`);
  redirect(`/play/${outcome.activatedBox.id}?activated=1`);
}

export async function setConsentAction(formData: FormData): Promise<void> {
  const actor = await requireFamily();
  const type = String(formData.get('type') ?? '');
  const granted = String(formData.get('granted') ?? 'false') === 'true';
  if (!['SPEECH_TO_TEXT', 'MARKETING_EMAIL'].includes(type)) return;

  const headerBag = await headers();
  await recordConsent({
    familyId: actor.familyId,
    type: type as 'SPEECH_TO_TEXT' | 'MARKETING_EMAIL',
    granted,
    grantedByUserId: actor.id,
    ipHash: hashIp(clientIp(headerBag), env.SESSION_SECRET),
    userAgent: headerBag.get('user-agent')?.slice(0, 255) ?? null,
  });
  revalidatePath('/account/privacy');
}

export async function exportDataAction(): Promise<void> {
  const actor = await requireFamily();
  await exportFamilyData(actor.familyId, actor.id);
  // The download itself is served by /api/privacy/export; this action only
  // records that a copy was taken.
  redirect('/api/privacy/export');
}

export async function deleteDataAction(formData: FormData): Promise<void> {
  const actor = await requireFamily();
  if (String(formData.get('confirm') ?? '') !== 'DELETE') {
    redirect('/account/privacy?error=confirm');
  }
  await deleteFamilyData(actor.familyId, actor.id);
  redirect('/api/auth/logout');
}

const SupportSchema = z.object({
  kind: z.enum(['QUESTION', 'DELIVERY', 'BILLING', 'SAFETY_REPORT', 'CONTENT_CONCERN', 'DATA_REQUEST']),
  subject: z.string().trim().min(3).max(140),
  body: z.string().trim().min(10).max(4000),
  relatedNodeId: z.string().trim().max(64).optional(),
});

export async function openSupportCaseAction(formData: FormData): Promise<void> {
  const actor = await requirePermission('support.create');
  const parsed = SupportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/support?error=invalid');

  await openCase({
    familyId: actor.familyId,
    reporterUserId: actor.id,
    kind: parsed.data.kind,
    subject: parsed.data.subject,
    body: parsed.data.body,
    relatedNodeId: parsed.data.relatedNodeId || null,
  });
  await audit({
    actorUserId: actor.id,
    action: 'support.submitted',
    entityType: 'Family',
    entityId: actor.familyId ?? 'none',
  });
  redirect('/support?sent=1');
}
