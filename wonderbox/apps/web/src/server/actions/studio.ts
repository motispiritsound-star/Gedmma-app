'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '../../lib/db.ts';
import { requirePermission } from '../../lib/auth/session.ts';
import { DraftRequestSchema, aiDraftProvider } from '../../lib/providers/ai/index.ts';
import {
  createDraftVersion,
  decideOnVersion,
  publishVersion,
  submitForReview,
} from '../content.ts';
import { DomainError } from '../../lib/errors.ts';

/**
 * Content studio mutations.
 *
 * Note what is *not* here: nothing in this file can read a family, an address
 * or an order. The permissions used — content.write, content.approve,
 * content.publish, content.aiDraft — are granted to roles that have no
 * commerce permissions at all, which is the role separation made concrete.
 */

const NodeTextSchema = z.object({
  nodeId: z.string().min(1),
  nl: z.string().trim().max(2000),
  en: z.string().trim().max(2000),
  pauseSeconds: z.coerce.number().int().min(0).max(300).optional(),
});

export async function saveNodeTextAction(formData: FormData): Promise<void> {
  const actor = await requirePermission('content.write');
  const parsed = NodeTextSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/studio?error=invalid');

  const node = await prisma.dialogueNode.findUnique({
    where: { id: parsed.data.nodeId },
    select: { id: true, chapterId: true },
  });
  if (!node) redirect('/studio?error=notFound');

  await prisma.dialogueNode.update({
    where: { id: node.id },
    data: {
      text: { nl: parsed.data.nl, en: parsed.data.en },
      pauseSeconds: parsed.data.pauseSeconds ?? null,
    },
  });

  // Editing a live chapter creates a new draft; the published version keeps
  // playing until a second person approves the change.
  const chapter = await prisma.chapter.findUniqueOrThrow({
    where: { id: node.chapterId },
    include: { nodes: { include: { choices: true } } },
  });
  await createDraftVersion({
    entityType: 'Chapter',
    entityId: node.chapterId,
    snapshot: chapter as unknown,
    createdById: actor.id,
    notes: `Edited node ${node.id}`,
  });

  revalidatePath(`/studio/chapters/${node.chapterId}`);
}

export async function submitVersionAction(formData: FormData): Promise<void> {
  const actor = await requirePermission('content.submit');
  const versionId = String(formData.get('versionId') ?? '');
  try {
    await submitForReview(versionId, actor.id);
  } catch (error) {
    if (error instanceof DomainError) redirect(`/studio/approvals?error=${error.code}`);
    throw error;
  }
  revalidatePath('/studio/approvals');
}

export async function decideVersionAction(formData: FormData): Promise<void> {
  const actor = await requirePermission('content.approve');
  const versionId = String(formData.get('versionId') ?? '');
  const decision = String(formData.get('decision') ?? '');
  const comment = String(formData.get('comment') ?? '');
  if (!['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'].includes(decision)) return;

  try {
    await decideOnVersion({
      versionId,
      reviewerId: actor.id,
      decision: decision as 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED',
      comment: comment || undefined,
    });
  } catch (error) {
    if (error instanceof DomainError) redirect(`/studio/approvals?error=${error.code}`);
    throw error;
  }
  revalidatePath('/studio/approvals');
}

export async function publishVersionAction(formData: FormData): Promise<void> {
  const actor = await requirePermission('content.publish');
  const versionId = String(formData.get('versionId') ?? '');
  try {
    await publishVersion(versionId, actor.id);
  } catch (error) {
    if (error instanceof DomainError) redirect(`/studio/approvals?error=${error.code}`);
    throw error;
  }
  revalidatePath('/studio/approvals');
}

/**
 * Asks the configured provider for a draft and files it as a DRAFT version
 * with source=AI_DRAFT. There is no code path from here to PUBLISHED that does
 * not pass through `publishVersion`, which requires a human approval by
 * someone other than the author.
 */
export async function requestAiDraftAction(formData: FormData): Promise<void> {
  const actor = await requirePermission('content.aiDraft');
  const parsed = DraftRequestSchema.safeParse({
    kind: formData.get('kind'),
    themeSlug: formData.get('themeSlug'),
    ageMin: Number(formData.get('ageMin')),
    ageMax: Number(formData.get('ageMax')),
    locale: formData.get('locale'),
    brief: formData.get('brief'),
    sourceText: formData.get('sourceText') || undefined,
  });
  if (!parsed.success) redirect('/studio/drafts?error=invalid');

  const provider = aiDraftProvider();
  const result = await provider.draft(parsed.data);
  const chapterId = String(formData.get('chapterId') ?? '');

  await createDraftVersion({
    entityType: chapterId ? 'Chapter' : 'Idea',
    entityId: chapterId || `idea:${parsed.data.themeSlug}`,
    snapshot: result as unknown,
    createdById: actor.id,
    source: 'AI_DRAFT',
    aiProvider: result.provider,
    aiModel: result.model,
    notes: parsed.data.brief.slice(0, 400),
  });

  redirect('/studio/drafts?created=1');
}
