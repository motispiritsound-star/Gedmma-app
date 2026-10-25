import { randomUUID } from 'node:crypto';
import type { UserRole } from '@prisma/client';
import { prisma } from '../../src/lib/db.ts';
import { hashPassword } from '../../src/lib/crypto.ts';
import { addMonths } from '../../src/server/subscriptions.ts';

/**
 * Test fixtures.
 *
 * Small on purpose: each test builds exactly the world it needs, so a failure
 * points at one thing. `resetDatabase` runs between files rather than between
 * tests, and every factory takes a unique suffix, so tests inside a file can
 * coexist.
 */

export async function resetDatabase(): Promise<void> {
  // TRUNCATE ... CASCADE in one statement is far faster than 30 deleteMany
  // round trips and does not care about foreign-key order.
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
     WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  if (tables.length === 0) return;
  const list = tables.map((row) => `"public"."${row.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

let counter = 0;
export function unique(prefix = 'x'): string {
  counter += 1;
  return `${prefix}-${counter}-${randomUUID().slice(0, 8)}`;
}

export async function makeUser(options: {
  roles?: UserRole[];
  familyId?: string | null;
  email?: string;
  password?: string;
}) {
  return prisma.user.create({
    data: {
      email: options.email ?? `${unique('user')}@wonderbox.test`,
      displayName: 'Test person',
      passwordHash: await hashPassword(options.password ?? 'correct horse battery staple'),
      roles: options.roles ?? ['PARENT'],
      familyId: options.familyId ?? null,
    },
  });
}

export async function makeFamily(name = 'Test family') {
  const family = await prisma.family.create({ data: { name } });
  const address = await prisma.address.create({
    data: {
      familyId: family.id,
      recipient: 'Test recipient',
      line1: 'Teststraat 1',
      postalCode: '1000 AA',
      city: 'Amsterdam',
      country: 'NL',
      isDefaultShipping: true,
    },
  });
  const parent = await makeUser({ roles: ['PARENT'], familyId: family.id });
  return { family, address, parent };
}

export interface BoxOptions {
  /** Units of every component put on the shelf. Controls how many boxes sell. */
  stock?: number;
  priceCents?: number;
  /** Create a chapter with a small branching graph. */
  withChapter?: boolean;
}

/**
 * A minimal but complete sellable box: a theme, a product with translations,
 * one component with stock, and optionally a chapter with a real branch.
 */
export async function makeBox(options: BoxOptions = {}) {
  const stock = options.stock ?? 50;
  const slug = unique('box');

  const theme = await prisma.theme.create({
    data: {
      slug: unique('theme'),
      name: { nl: 'Testthema', en: 'Test theme' },
      blurb: { nl: 'Uitleg', en: 'Blurb' },
    },
  });

  const product = await prisma.boxProduct.create({
    data: {
      sku: slug.toUpperCase(),
      slug,
      themeId: theme.id,
      status: 'ACTIVE',
      ageMin: 7,
      ageMax: 10,
      priceCents: options.priceCents ?? 3495,
      translations: {
        create: [
          { locale: 'nl', name: 'Testdoos', tagline: 'Tagline', description: 'Beschrijving' },
          { locale: 'en', name: 'Test box', tagline: 'Tagline', description: 'Description' },
        ],
      },
    },
  });

  const item = await prisma.inventoryItem.create({
    data: { sku: unique('SKU').toUpperCase(), name: 'Test component' },
  });
  await prisma.inventoryBatch.create({
    data: { inventoryItemId: item.id, batchCode: 'B1', quantityOnHand: stock },
  });
  await prisma.kitComponent.create({
    data: { boxProductId: product.id, inventoryItemId: item.id, quantity: 1 },
  });

  let chapterId: string | null = null;
  let journeyId: string | null = null;
  if (options.withChapter !== false) {
    const journey = await prisma.learningJourney.create({
      data: {
        boxProductId: product.id,
        slug: unique('journey'),
        title: { nl: 'Reis', en: 'Journey' },
        summary: { nl: 'Samenvatting', en: 'Summary' },
      },
    });
    journeyId = journey.id;
    chapterId = await makeChapter(journey.id);
  }

  return { theme, product, inventoryItem: item, chapterId, journeyId };
}

/**
 * A four-node chapter shaped like the real ones:
 *
 *   intro → question ─┬─ "right"  → celebrate (terminal)
 *                     └─ "unsure" → hint → celebrate
 *
 * plus a repeat and a slower choice on the question, so branch traversal,
 * repeats and speed changes all have something to exercise.
 */
export async function makeChapter(journeyId: string, orderIndex = 0): Promise<string> {
  const chapter = await prisma.chapter.create({
    data: {
      journeyId,
      key: unique('chapter'),
      orderIndex,
      title: { nl: 'Hoofdstuk', en: 'Chapter' },
      intro: { nl: 'Intro nl', en: 'Intro en' },
      entryNodeKey: 'intro',
    },
  });

  const intro = await prisma.dialogueNode.create({
    data: {
      chapterId: chapter.id,
      key: 'intro',
      kind: 'NARRATION',
      orderIndex: 0,
      text: { nl: 'Welkom', en: 'Welcome' },
    },
  });
  const question = await prisma.dialogueNode.create({
    data: {
      chapterId: chapter.id,
      key: 'question',
      kind: 'QUESTION',
      orderIndex: 1,
      // Deliberately Dutch-only: this is what the fallback test leans on.
      text: { nl: 'Wat denk je?' },
    },
  });
  const hint = await prisma.dialogueNode.create({
    data: {
      chapterId: chapter.id,
      key: 'hint',
      kind: 'HINT',
      orderIndex: 2,
      text: { nl: 'Kleine tip', en: 'Small hint' },
    },
  });
  const celebrate = await prisma.dialogueNode.create({
    data: {
      chapterId: chapter.id,
      key: 'celebrate',
      kind: 'CELEBRATION',
      orderIndex: 3,
      isTerminal: true,
      text: { nl: 'Goed gedaan', en: 'Well done' },
    },
  });

  await prisma.dialogueChoice.createMany({
    data: [
      { nodeId: intro.id, key: 'go', label: { nl: 'Verder', en: 'Go on' }, targetNodeId: question.id },
      {
        nodeId: question.id,
        key: 'right',
        label: { nl: 'Ik weet het', en: 'I know it' },
        targetNodeId: celebrate.id,
        orderIndex: 0,
      },
      {
        nodeId: question.id,
        key: 'unsure',
        label: { nl: 'Geen idee', en: 'No idea' },
        targetNodeId: hint.id,
        orderIndex: 1,
      },
      {
        nodeId: question.id,
        key: 'again',
        label: { nl: 'Nog eens', en: 'Again' },
        isRepeat: true,
        orderIndex: 2,
      },
      {
        nodeId: question.id,
        key: 'slower',
        label: { nl: 'Langzamer', en: 'Slower' },
        isSlower: true,
        orderIndex: 3,
      },
      { nodeId: hint.id, key: 'go', label: { nl: 'Aha', en: 'Aha' }, targetNodeId: celebrate.id },
    ],
  });

  return chapter.id;
}

/** Runs a chapter through the real workflow so it becomes playable. */
export async function publishChapter(chapterId: string): Promise<void> {
  const { createDraftVersion, submitForReview, decideOnVersion, publishVersion } = await import(
    '../../src/server/content.ts'
  );
  const author = await makeUser({ roles: ['CONTENT_EDITOR'] });
  const reviewer = await makeUser({ roles: ['CONTENT_APPROVER'] });

  const version = await createDraftVersion({
    entityType: 'Chapter',
    entityId: chapterId,
    snapshot: { chapterId },
    createdById: author.id,
  });
  await submitForReview(version.id, author.id);
  await decideOnVersion({
    versionId: version.id,
    reviewerId: reviewer.id,
    decision: 'APPROVED',
  });
  await publishVersion(version.id, reviewer.id);
}

export async function makePlan(code = unique('plan'), priceCents = 3295, intervalMonths = 1) {
  return prisma.subscriptionPlan.create({
    data: {
      code,
      name: { nl: 'Plan', en: 'Plan' },
      description: { nl: 'Uitleg', en: 'Description' },
      priceCents,
      intervalMonths,
    },
  });
}

/**
 * A subscription whose period ended yesterday: due once, and not due again
 * after a single renewal. (A subscription that missed several cycles catches
 * up one order per cycle, which is correct but is a different test.)
 */
export async function makeDueSubscription(familyId: string, planId: string) {
  const end = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const start = addMonths(end, -1);
  return prisma.subscription.create({
    data: {
      familyId,
      planId,
      status: 'ACTIVE',
      startedAt: start,
      currentPeriodStart: start,
      currentPeriodEnd: end,
      providerRef: unique('sub'),
    },
  });
}
