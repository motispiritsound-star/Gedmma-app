import type { ContentState } from '@prisma/client';
import { prisma, type Db } from '../lib/db.ts';
import { ConflictError, NotFoundError } from '../lib/errors.ts';
import { audit } from '../lib/audit.ts';
import type { Locale } from '../lib/i18n/locale.ts';
import { text, tryResolve } from '../lib/i18n/localised.ts';
import type { ChapterLoadedEvent } from '@wonderbox/hardware-protocol';

/**
 * The publication gate.
 *
 * Exactly one function decides whether a chapter may be played:
 * `publishedChapterVersion`. Everything a child hears has to come through it,
 * so "unapproved content is never playable" is one testable claim rather than
 * a habit spread across route handlers.
 */

export const CHAPTER_ENTITY = 'Chapter';

export interface VersionSummary {
  readonly id: string;
  readonly version: number;
  readonly state: ContentState;
  readonly source: string;
  readonly createdAt: Date;
  readonly createdBy: string;
  readonly approvals: number;
}

/** Creates the next draft version of an entity, snapshotting its current state. */
export async function createDraftVersion(input: {
  entityType: string;
  entityId: string;
  snapshot: unknown;
  createdById: string;
  notes?: string;
  source?: 'HUMAN' | 'AI_DRAFT' | 'IMPORT';
  aiProvider?: string;
  aiModel?: string;
}): Promise<{ id: string; version: number }> {
  const latest = await prisma.contentVersion.findFirst({
    where: { entityType: input.entityType, entityId: input.entityId },
    orderBy: { version: 'desc' },
    select: { version: true },
  });
  const version = (latest?.version ?? 0) + 1;
  const created = await prisma.contentVersion.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      version,
      state: 'DRAFT',
      source: input.source ?? 'HUMAN',
      aiProvider: input.aiProvider ?? null,
      aiModel: input.aiModel ?? null,
      snapshot: input.snapshot as object,
      notes: input.notes ?? null,
      createdById: input.createdById,
    },
  });
  return { id: created.id, version };
}

export async function submitForReview(versionId: string, actorUserId: string): Promise<void> {
  const version = await prisma.contentVersion.findUnique({ where: { id: versionId } });
  if (!version) throw new NotFoundError('Content version');
  if (version.state !== 'DRAFT' && version.state !== 'REJECTED') {
    throw new ConflictError('notDraft', `Version is ${version.state}`);
  }
  await prisma.contentVersion.update({ where: { id: versionId }, data: { state: 'IN_REVIEW' } });
  await audit({
    actorUserId,
    actorRole: 'CONTENT_EDITOR',
    action: 'content.submitted',
    entityType: version.entityType,
    entityId: version.entityId,
    metadata: { versionId, version: version.version },
  });
}

/**
 * Records a human decision. The reviewer must be a different person than the
 * author: an editor cannot wave their own draft through.
 */
export async function decideOnVersion(input: {
  versionId: string;
  reviewerId: string;
  decision: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
  comment?: string;
}): Promise<void> {
  const version = await prisma.contentVersion.findUnique({ where: { id: input.versionId } });
  if (!version) throw new NotFoundError('Content version');
  if (version.state !== 'IN_REVIEW') {
    throw new ConflictError('notInReview', `Version is ${version.state}`);
  }
  if (version.createdById === input.reviewerId) {
    throw new ConflictError('selfApproval', 'Content must be reviewed by someone other than its author');
  }

  await prisma.$transaction(async (tx) => {
    await tx.approval.create({
      data: {
        contentVersionId: input.versionId,
        reviewerId: input.reviewerId,
        decision: input.decision,
        comment: input.comment ?? null,
      },
    });
    await tx.contentVersion.update({
      where: { id: input.versionId },
      data: { state: input.decision === 'APPROVED' ? 'APPROVED' : 'REJECTED' },
    });
    await audit(
      {
        actorUserId: input.reviewerId,
        actorRole: 'CONTENT_APPROVER',
        action: `content.${input.decision.toLowerCase()}`,
        entityType: version.entityType,
        entityId: version.entityId,
        metadata: { versionId: input.versionId },
      },
      tx,
    );
  });
}

/**
 * Publishes an approved version. Refuses anything without a real APPROVED
 * decision from a second person — including, explicitly, an AI draft.
 */
export async function publishVersion(versionId: string, actorUserId: string): Promise<void> {
  const version = await prisma.contentVersion.findUnique({
    where: { id: versionId },
    include: { approvals: true },
  });
  if (!version) throw new NotFoundError('Content version');
  if (version.state !== 'APPROVED') {
    throw new ConflictError('notApproved', `Version is ${version.state}, not APPROVED`);
  }
  const humanApproval = version.approvals.find(
    (approval) => approval.decision === 'APPROVED' && approval.reviewerId !== version.createdById,
  );
  if (!humanApproval) {
    throw new ConflictError(
      'noHumanApproval',
      'A version can only be published after a human other than its author approved it',
    );
  }

  await prisma.$transaction(async (tx) => {
    // Only one version of an entity is live at a time.
    await tx.contentVersion.updateMany({
      where: { entityType: version.entityType, entityId: version.entityId, state: 'PUBLISHED' },
      data: { state: 'ARCHIVED' },
    });
    await tx.contentVersion.update({
      where: { id: versionId },
      data: { state: 'PUBLISHED', publishedAt: new Date() },
    });
    await audit(
      {
        actorUserId,
        actorRole: 'CONTENT_APPROVER',
        action: 'content.published',
        entityType: version.entityType,
        entityId: version.entityId,
        metadata: { versionId, version: version.version },
      },
      tx,
    );
  });
}

/**
 * The gate. Returns the live version number of a chapter, or null when the
 * chapter has never been approved and published. Playback callers must treat
 * null as "does not exist" — never as "serve the draft".
 */
export async function publishedChapterVersion(
  chapterId: string,
  db: Db = prisma,
): Promise<number | null> {
  const version = await db.contentVersion.findFirst({
    where: { entityType: CHAPTER_ENTITY, entityId: chapterId, state: 'PUBLISHED' },
    orderBy: { version: 'desc' },
    select: { version: true },
  });
  return version?.version ?? null;
}

export async function versionsFor(
  entityType: string,
  entityId: string,
): Promise<VersionSummary[]> {
  const versions = await prisma.contentVersion.findMany({
    where: { entityType, entityId },
    include: { createdBy: { select: { displayName: true } }, approvals: true },
    orderBy: { version: 'desc' },
  });
  return versions.map((version) => ({
    id: version.id,
    version: version.version,
    state: version.state,
    source: version.source,
    createdAt: version.createdAt,
    createdBy: version.createdBy.displayName,
    approvals: version.approvals.length,
  }));
}

export interface ChapterPayloadOptions {
  readonly locale: Locale;
  /**
   * Studio preview only. Bypasses the publication gate and is reachable only
   * behind `content.read`; the companion API never sets it.
   */
  readonly allowUnpublished?: boolean;
}

export class ChapterNotPublishedError extends ConflictError {
  constructor(chapterId: string) {
    super('notApproved', `Chapter ${chapterId} has no published, approved version`);
  }
}

/**
 * Builds the exact `chapterLoaded` event the companion consumes — the same
 * shape whether it is served to the browser simulator, the PWA or a device.
 */
export async function chapterPayload(
  chapterId: string,
  activatedBoxId: string,
  options: ChapterPayloadOptions,
): Promise<ChapterLoadedEvent> {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      nodes: {
        orderBy: { orderIndex: 'asc' },
        include: {
          choices: { orderBy: { orderIndex: 'asc' } },
          audioAssets: true,
        },
      },
    },
  });
  if (!chapter) throw new NotFoundError('Chapter');

  const version = await publishedChapterVersion(chapterId);
  if (version === null && !options.allowUnpublished) {
    throw new ChapterNotPublishedError(chapterId);
  }

  const entry = chapter.nodes.find((node) => node.key === chapter.entryNodeKey);
  if (!entry) throw new NotFoundError(`Entry node "${chapter.entryNodeKey}"`);

  const kindMap = {
    NARRATION: 'narration',
    QUESTION: 'question',
    HINT: 'hint',
    PAUSE: 'pause',
    EXPERIMENT_STEP: 'experimentStep',
    SAFETY: 'safety',
    CELEBRATION: 'celebration',
  } as const;

  return {
    type: 'chapterLoaded',
    activatedBoxId,
    chapterId: chapter.id,
    title: text(chapter.title, options.locale, chapter.key),
    entryNodeId: entry.id,
    locale: options.locale,
    contentVersion: version ?? 1,
    nodes: chapter.nodes.map((node) => {
      const resolved = tryResolve(node.text, options.locale);
      return {
        id: node.id,
        key: node.key,
        kind: kindMap[node.kind],
        text: resolved?.value ?? '',
        servedLocale: resolved?.locale ?? options.locale,
        pauseSeconds: node.pauseSeconds,
        isTerminal: node.isTerminal,
        choices: node.choices.map((choice) => ({
          key: choice.key,
          label: text(choice.label, options.locale, choice.key),
          targetNodeId: choice.targetNodeId,
          isRepeat: choice.isRepeat,
          isSlower: choice.isSlower,
        })),
      };
    }),
    audio: chapter.nodes.flatMap((node) => {
      const asset =
        node.audioAssets.find((candidate) => candidate.locale === options.locale) ??
        node.audioAssets.find((candidate) => candidate.locale === 'en') ??
        node.audioAssets[0];
      if (!asset) return [];
      return [
        {
          nodeId: node.id,
          locale: options.locale,
          servedLocale: (asset.locale === 'nl' || asset.locale === 'en' ? asset.locale : 'en') as
            | 'nl'
            | 'en',
          // Resolved into a signed, short-lived URL by the companion API.
          url: `/api/audio/${asset.id}`,
          durationMs: asset.durationMs,
          checksum: asset.checksum,
          bytes: asset.bytes,
        },
      ];
    }),
  };
}

/** Chapters of a journey, with whether each one is live. Used by /play. */
export async function journeyChapters(journeyId: string, locale: Locale) {
  const chapters = await prisma.chapter.findMany({
    where: { journeyId },
    orderBy: { orderIndex: 'asc' },
    include: { experiments: true, _count: { select: { nodes: true } } },
  });
  const published = await prisma.contentVersion.findMany({
    where: {
      entityType: CHAPTER_ENTITY,
      entityId: { in: chapters.map((chapter) => chapter.id) },
      state: 'PUBLISHED',
    },
    select: { entityId: true, version: true },
  });
  const liveVersions = new Map(published.map((row) => [row.entityId, row.version]));

  return chapters.map((chapter) => ({
    id: chapter.id,
    key: chapter.key,
    orderIndex: chapter.orderIndex,
    title: text(chapter.title, locale, chapter.key),
    intro: text(chapter.intro, locale, ''),
    estimatedMinutes: chapter.estimatedMinutes,
    nodeCount: chapter._count.nodes,
    experiments: chapter.experiments.map((experiment) => ({
      id: experiment.id,
      title: text(experiment.title, locale, experiment.key),
    })),
    publishedVersion: liveVersions.get(chapter.id) ?? null,
    isPlayable: liveVersions.has(chapter.id),
  }));
}
