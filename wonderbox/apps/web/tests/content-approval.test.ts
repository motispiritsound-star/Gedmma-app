import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/db.ts';
import { ConflictError } from '../src/lib/errors.ts';
import {
  ChapterNotPublishedError,
  chapterPayload,
  createDraftVersion,
  decideOnVersion,
  journeyChapters,
  publishVersion,
  publishedChapterVersion,
  submitForReview,
} from '../src/server/content.ts';
import { aiDraftProvider } from '../src/lib/providers/ai/index.ts';
import { makeBox, makeUser, resetDatabase } from './helpers/fixtures.ts';

/**
 * The publication gate.
 *
 * "Unapproved content is never playable" is the single most important safety
 * claim in the product, so it is tested from several directions: the gate
 * function, the payload builder, and the AI drafting path that a reasonable
 * person would most suspect of routing around it.
 */
describe('content approval', () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  async function draft(chapterId: string, authorId: string) {
    return createDraftVersion({
      entityType: 'Chapter',
      entityId: chapterId,
      snapshot: { chapterId },
      createdById: authorId,
    });
  }

  it('reports a chapter as unplayable until it is published', async () => {
    const box = await makeBox();
    const chapterId = box.chapterId!;
    const editor = await makeUser({ roles: ['CONTENT_EDITOR'] });
    const approver = await makeUser({ roles: ['CONTENT_APPROVER'] });

    expect(await publishedChapterVersion(chapterId)).toBeNull();
    await expect(
      chapterPayload(chapterId, 'box-1', { locale: 'nl' }),
    ).rejects.toBeInstanceOf(ChapterNotPublishedError);

    const version = await draft(chapterId, editor.id);
    expect(await publishedChapterVersion(chapterId)).toBeNull();

    await submitForReview(version.id, editor.id);
    expect(await publishedChapterVersion(chapterId)).toBeNull();

    await decideOnVersion({ versionId: version.id, reviewerId: approver.id, decision: 'APPROVED' });
    // Approved is still not published: a person has to press publish.
    expect(await publishedChapterVersion(chapterId)).toBeNull();
    await expect(
      chapterPayload(chapterId, 'box-1', { locale: 'nl' }),
    ).rejects.toBeInstanceOf(ChapterNotPublishedError);

    await publishVersion(version.id, approver.id);
    expect(await publishedChapterVersion(chapterId)).toBe(1);
    const payload = await chapterPayload(chapterId, 'box-1', { locale: 'nl' });
    expect(payload.type).toBe('chapterLoaded');
    expect(payload.contentVersion).toBe(1);
  });

  it('refuses to publish a version nobody approved', async () => {
    const box = await makeBox();
    const editor = await makeUser({ roles: ['CONTENT_EDITOR'] });
    const version = await draft(box.chapterId!, editor.id);

    await expect(publishVersion(version.id, editor.id)).rejects.toBeInstanceOf(ConflictError);
    expect(await publishedChapterVersion(box.chapterId!)).toBeNull();
  });

  it('refuses to let an author approve their own draft', async () => {
    const box = await makeBox();
    const editor = await makeUser({ roles: ['CONTENT_EDITOR', 'CONTENT_APPROVER'] });
    const version = await draft(box.chapterId!, editor.id);
    await submitForReview(version.id, editor.id);

    await expect(
      decideOnVersion({ versionId: version.id, reviewerId: editor.id, decision: 'APPROVED' }),
    ).rejects.toThrow(/reviewed by someone other than its author/);
    expect(await publishedChapterVersion(box.chapterId!)).toBeNull();
  });

  it('cannot publish an AI draft without a human approving it first', async () => {
    const box = await makeBox();
    const editor = await makeUser({ roles: ['CONTENT_EDITOR'] });
    const approver = await makeUser({ roles: ['CONTENT_APPROVER'] });

    const result = await aiDraftProvider().draft({
      kind: 'dialogueNode',
      themeSlug: 'space',
      ageMin: 7,
      ageMax: 10,
      locale: 'nl',
      brief: 'Schrijf een vraag over zwaartekracht voor een kind van acht.',
    });
    expect(result.suggestions[0]?.reviewNotes.length).toBeGreaterThan(0);

    const version = await createDraftVersion({
      entityType: 'Chapter',
      entityId: box.chapterId!,
      snapshot: result as unknown,
      createdById: editor.id,
      source: 'AI_DRAFT',
      aiProvider: result.provider,
      aiModel: result.model,
    });

    const stored = await prisma.contentVersion.findUniqueOrThrow({ where: { id: version.id } });
    expect(stored.state).toBe('DRAFT');
    expect(stored.source).toBe('AI_DRAFT');

    // Straight to publish: refused.
    await expect(publishVersion(version.id, approver.id)).rejects.toBeInstanceOf(ConflictError);
    expect(await publishedChapterVersion(box.chapterId!)).toBeNull();

    // The only route through is the same one a human draft takes.
    await submitForReview(version.id, editor.id);
    await decideOnVersion({ versionId: version.id, reviewerId: approver.id, decision: 'APPROVED' });
    await publishVersion(version.id, approver.id);
    expect(await publishedChapterVersion(box.chapterId!)).toBe(1);
  });

  it('keeps the live version playing while an edit is in review', async () => {
    const box = await makeBox();
    const chapterId = box.chapterId!;
    const editor = await makeUser({ roles: ['CONTENT_EDITOR'] });
    const approver = await makeUser({ roles: ['CONTENT_APPROVER'] });

    const first = await draft(chapterId, editor.id);
    await submitForReview(first.id, editor.id);
    await decideOnVersion({ versionId: first.id, reviewerId: approver.id, decision: 'APPROVED' });
    await publishVersion(first.id, approver.id);
    expect(await publishedChapterVersion(chapterId)).toBe(1);

    const second = await draft(chapterId, editor.id);
    await submitForReview(second.id, editor.id);
    // The edit is in review; children still hear version 1.
    expect(await publishedChapterVersion(chapterId)).toBe(1);

    await decideOnVersion({ versionId: second.id, reviewerId: approver.id, decision: 'APPROVED' });
    await publishVersion(second.id, approver.id);
    expect(await publishedChapterVersion(chapterId)).toBe(2);

    // Exactly one version is live at a time.
    expect(
      await prisma.contentVersion.count({
        where: { entityType: 'Chapter', entityId: chapterId, state: 'PUBLISHED' },
      }),
    ).toBe(1);
  });

  it('records a rejection and leaves the chapter unplayable', async () => {
    const box = await makeBox();
    const editor = await makeUser({ roles: ['CONTENT_EDITOR'] });
    const approver = await makeUser({ roles: ['CONTENT_APPROVER'] });

    const version = await draft(box.chapterId!, editor.id);
    await submitForReview(version.id, editor.id);
    await decideOnVersion({
      versionId: version.id,
      reviewerId: approver.id,
      decision: 'REJECTED',
      comment: 'Step three contradicts the safety card.',
    });

    const stored = await prisma.contentVersion.findUniqueOrThrow({ where: { id: version.id } });
    expect(stored.state).toBe('REJECTED');
    expect(await publishedChapterVersion(box.chapterId!)).toBeNull();
    await expect(publishVersion(version.id, approver.id)).rejects.toBeInstanceOf(ConflictError);
  });

  it('marks unpublished chapters as not playable in the chapter list', async () => {
    const box = await makeBox();
    const chapters = await journeyChapters(box.journeyId!, 'nl');
    expect(chapters).toHaveLength(1);
    expect(chapters[0]?.isPlayable).toBe(false);
    expect(chapters[0]?.publishedVersion).toBeNull();
  });

  it('lets the studio preview an unpublished chapter without publishing it', async () => {
    const box = await makeBox();
    const payload = await chapterPayload(box.chapterId!, 'preview', {
      locale: 'nl',
      allowUnpublished: true,
    });
    expect(payload.nodes.length).toBeGreaterThan(0);
    // Previewing changed nothing about what a child may hear.
    expect(await publishedChapterVersion(box.chapterId!)).toBeNull();
  });

  it('serves a fallback locale for a node the translator has not reached', async () => {
    const box = await makeBox();
    const editor = await makeUser({ roles: ['CONTENT_EDITOR'] });
    const approver = await makeUser({ roles: ['CONTENT_APPROVER'] });
    const version = await draft(box.chapterId!, editor.id);
    await submitForReview(version.id, editor.id);
    await decideOnVersion({ versionId: version.id, reviewerId: approver.id, decision: 'APPROVED' });
    await publishVersion(version.id, approver.id);

    const payload = await chapterPayload(box.chapterId!, 'box-1', { locale: 'en' });
    const question = payload.nodes.find((node) => node.key === 'question');
    // The fixture leaves this node Dutch-only on purpose.
    expect(question?.text).toBe('Wat denk je?');
    expect(question?.servedLocale).toBe('nl');

    const welcome = payload.nodes.find((node) => node.key === 'intro');
    expect(welcome?.servedLocale).toBe('en');
  });

  it('exposes the branch graph the companion needs to traverse', async () => {
    const box = await makeBox();
    const payload = await chapterPayload(box.chapterId!, 'preview', {
      locale: 'nl',
      allowUnpublished: true,
    });

    const question = payload.nodes.find((node) => node.key === 'question')!;
    expect(question.kind).toBe('question');
    expect(question.choices.map((choice) => choice.key).sort()).toEqual([
      'again',
      'right',
      'slower',
      'unsure',
    ]);
    expect(question.choices.find((choice) => choice.key === 'again')?.isRepeat).toBe(true);
    expect(question.choices.find((choice) => choice.key === 'slower')?.isSlower).toBe(true);
    expect(payload.nodes.find((node) => node.key === 'celebrate')?.isTerminal).toBe(true);
    expect(payload.entryNodeId).toBe(payload.nodes.find((node) => node.key === 'intro')?.id);
  });
});
