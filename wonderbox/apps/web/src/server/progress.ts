import type { Prisma, ProgressEventType } from '@prisma/client';
import { prisma } from '../lib/db.ts';
import { NotFoundError } from '../lib/errors.ts';
import type { Locale } from '../lib/i18n/locale.ts';
import { text } from '../lib/i18n/localised.ts';
import type { CommandOf, EventOf } from '@wonderbox/hardware-protocol';

/**
 * Progress recording and reconciliation.
 *
 * The device is offline half the time by design — it is a box in a bedroom.
 * So progress is a queue of client-generated events, each with a stable
 * `clientEventId`, and the server applies them with an insert that ignores
 * duplicates. Replaying the same queue ten times produces the same rows.
 */

const TYPE_MAP: Record<string, ProgressEventType> = {
  chapterStarted: 'CHAPTER_STARTED',
  nodePlayed: 'NODE_PLAYED',
  choiceSelected: 'CHOICE_SELECTED',
  repeated: 'REPEATED',
  chapterCompleted: 'CHAPTER_COMPLETED',
  journeyCompleted: 'JOURNEY_COMPLETED',
  paused: 'PAUSED',
  resumed: 'RESUMED',
};

export interface SyncInput {
  readonly activatedBoxId: string;
  readonly familyId: string;
  readonly childProfileId?: string | null;
  readonly deviceId?: string | null;
  readonly events: CommandOf<'syncWhenOnline'>['events'];
}

/**
 * Applies a batch. Returns which ids were newly stored and which were already
 * known — the companion drops both, and retries only what is in `rejected`.
 */
export async function syncProgress(input: SyncInput): Promise<EventOf<'progressRecorded'>> {
  const box = await prisma.activatedBox.findFirst({
    where: { id: input.activatedBoxId, familyId: input.familyId },
    include: { boxProduct: { include: { journey: { include: { chapters: true } } } } },
  });
  if (!box) throw new NotFoundError('Activated box');

  const chapterIds = new Set(box.boxProduct.journey?.chapters.map((chapter) => chapter.id) ?? []);
  const incomingIds = input.events.map((event) => event.clientEventId);

  const alreadyStored = await prisma.progressEvent.findMany({
    where: { clientEventId: { in: incomingIds } },
    select: { clientEventId: true },
  });
  const known = new Set(alreadyStored.map((row) => row.clientEventId));

  const accepted: string[] = [];
  const duplicates: string[] = [];
  const rejected: { clientEventId: string; reason: string }[] = [];
  const toInsert: Prisma.ProgressEventCreateManyInput[] = [];

  const seenInBatch = new Set<string>();
  for (const event of input.events) {
    if (known.has(event.clientEventId) || seenInBatch.has(event.clientEventId)) {
      duplicates.push(event.clientEventId);
      continue;
    }
    const type = TYPE_MAP[event.type];
    if (!type) {
      rejected.push({ clientEventId: event.clientEventId, reason: 'unknownType' });
      continue;
    }
    // A device may only report progress on chapters that belong to its box.
    if (event.chapterId && !chapterIds.has(event.chapterId)) {
      rejected.push({ clientEventId: event.clientEventId, reason: 'chapterNotInBox' });
      continue;
    }
    seenInBatch.add(event.clientEventId);
    accepted.push(event.clientEventId);
    toInsert.push({
      clientEventId: event.clientEventId,
      familyId: input.familyId,
      activatedBoxId: box.id,
      childProfileId: input.childProfileId ?? null,
      chapterId: event.chapterId ?? null,
      nodeId: event.nodeId ?? null,
      type,
      choiceKey: event.choiceKey ?? null,
      listenedMs: event.listenedMs ?? 0,
      occurredAt: new Date(event.occurredAt),
      deviceId: input.deviceId ?? null,
    });
  }

  if (toInsert.length > 0) {
    // skipDuplicates makes a concurrent replay of the same batch harmless.
    await prisma.progressEvent.createMany({ data: toInsert, skipDuplicates: true });
    await prisma.activatedBox.update({
      where: { id: box.id },
      data: { lastPlayedAt: new Date() },
    });
  }

  const completedChapters = await completedChapterIds(box.id);
  const journeyChapterCount = box.boxProduct.journey?.chapters.length ?? 0;

  return {
    type: 'progressRecorded',
    activatedBoxId: box.id,
    acceptedClientEventIds: accepted,
    duplicateClientEventIds: duplicates,
    rejected,
    chapterCompleted: input.events.some((event) => event.type === 'chapterCompleted'),
    journeyCompleted: journeyChapterCount > 0 && completedChapters.size >= journeyChapterCount,
  };
}

export async function completedChapterIds(activatedBoxId: string): Promise<Set<string>> {
  const rows = await prisma.progressEvent.findMany({
    where: { activatedBoxId, type: 'CHAPTER_COMPLETED', chapterId: { not: null } },
    select: { chapterId: true },
    distinct: ['chapterId'],
  });
  return new Set(rows.flatMap((row) => (row.chapterId ? [row.chapterId] : [])));
}

export interface ResumePoint {
  readonly chapterId: string;
  readonly nodeId: string | null;
  readonly occurredAt: Date;
}

/** Where a child left off, so the box picks up rather than restarting. */
export async function resumePoint(activatedBoxId: string): Promise<ResumePoint | null> {
  const last = await prisma.progressEvent.findFirst({
    where: {
      activatedBoxId,
      chapterId: { not: null },
      type: { in: ['NODE_PLAYED', 'CHOICE_SELECTED', 'REPEATED', 'PAUSED', 'CHAPTER_STARTED'] },
    },
    orderBy: [{ occurredAt: 'desc' }, { receivedAt: 'desc' }],
  });
  if (!last?.chapterId) return null;
  return { chapterId: last.chapterId, nodeId: last.nodeId, occurredAt: last.occurredAt };
}

export interface SummaryView {
  readonly activatedBoxId: string;
  readonly boxTitle: string;
  readonly childName: string | null;
  readonly chaptersCompleted: number;
  readonly chaptersTotal: number;
  readonly experimentsCompleted: number;
  readonly minutesListened: number;
  readonly topics: readonly string[];
  readonly conversationStarters: readonly string[];
  readonly lastPlayedAt: Date | null;
}

/**
 * The parent-facing summary.
 *
 * Deliberately descriptive. It reports what happened — chapters finished,
 * experiments done, minutes listened, topics that came up — and nothing else.
 * No score, no percentile, no claim about what a child has learned or how they
 * compare to anyone. See CONTENT_SAFETY.md for why that line is drawn here.
 */
export async function buildSummary(
  activatedBoxId: string,
  familyId: string,
  locale: Locale,
): Promise<SummaryView | null> {
  const box = await prisma.activatedBox.findFirst({
    where: { id: activatedBoxId, familyId },
    include: {
      boxProduct: {
        include: {
          theme: true,
          translations: true,
          journey: { include: { chapters: { include: { experiments: true } } } },
        },
      },
    },
  });
  if (!box) return null;

  const chapters = box.boxProduct.journey?.chapters ?? [];
  const completed = await completedChapterIds(activatedBoxId);
  const completedChapters = chapters.filter((chapter) => completed.has(chapter.id));

  const listened = await prisma.progressEvent.aggregate({
    where: { activatedBoxId },
    _sum: { listenedMs: true },
  });

  const child = await prisma.progressEvent.findFirst({
    where: { activatedBoxId, childProfileId: { not: null } },
    include: { childProfile: true },
    orderBy: { receivedAt: 'desc' },
  });

  const topics = [
    text(box.boxProduct.theme.name, locale, box.boxProduct.theme.slug),
    ...completedChapters.map((chapter) => text(chapter.title, locale, chapter.key)),
  ];

  return {
    activatedBoxId,
    boxTitle:
      box.boxProduct.translations.find((translation) => translation.locale === locale)?.name ??
      box.boxProduct.translations[0]?.name ??
      box.boxProduct.sku,
    childName: child?.childProfile?.displayName ?? null,
    chaptersCompleted: completedChapters.length,
    chaptersTotal: chapters.length,
    experimentsCompleted: completedChapters.reduce(
      (total, chapter) => total + chapter.experiments.length,
      0,
    ),
    minutesListened: Math.round((listened._sum.listenedMs ?? 0) / 60000),
    topics: [...new Set(topics)].filter(Boolean),
    conversationStarters: completedChapters
      .map((chapter) => text(chapter.intro, locale, ''))
      .filter(Boolean)
      .slice(0, 3),
    lastPlayedAt: box.lastPlayedAt,
  };
}

/**
 * Persists a summary snapshot. Run monthly so a parent can look back at a
 * period after the raw progress events have aged out under retention.
 */
export async function snapshotSummary(
  activatedBoxId: string,
  familyId: string,
  periodStart: Date,
  periodEnd: Date,
  locale: Locale,
): Promise<void> {
  const summary = await buildSummary(activatedBoxId, familyId, locale);
  if (!summary) return;

  const child = await prisma.progressEvent.findFirst({
    where: { activatedBoxId, childProfileId: { not: null } },
    select: { childProfileId: true },
  });
  const childProfileId = child?.childProfileId ?? null;

  const payload = {
    chaptersCompleted: summary.chaptersCompleted,
    experimentsCompleted: summary.experimentsCompleted,
    minutesListened: summary.minutesListened,
    topics: [...summary.topics],
    conversationStarters: [...summary.conversationStarters],
  };

  // Postgres treats NULLs as distinct in a unique index, so a box with no
  // child profile attached would collect a new row per run. Look it up by hand
  // rather than relying on the constraint in that case.
  const existing = await prisma.parentSummary.findFirst({
    where: { activatedBoxId, childProfileId, periodStart },
    select: { id: true },
  });

  if (existing) {
    await prisma.parentSummary.update({
      where: { id: existing.id },
      data: { ...payload, generatedAt: new Date() },
    });
    return;
  }

  await prisma.parentSummary.create({
    data: { familyId, activatedBoxId, childProfileId, periodStart, periodEnd, ...payload },
  });
}
