import {
  assertCan,
  describeSource,
  hasFeature,
  suggestionsForAge,
  type ActivitySuggestion,
  type EducationalArticle,
  type LocalizedParagraphs,
  type LocalizedText,
} from '@focusfamily/domain';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireFamily, requireSession, type Services } from '../context.js';
import { toDomainSubscription } from '../mappers.js';

export async function registerContentRoutes(
  app: FastifyInstance,
  services: Services,
): Promise<void> {
  const { prisma } = services;

  /** The parent library is readable without a family: it is public guidance. */
  app.get('/education', async (request) => {
    const query = z
      .object({ topic: z.string().optional(), locale: z.enum(['nl', 'en']).default('nl') })
      .parse(request.query ?? {});
    const rows = await prisma.educationalArticle.findMany({
      where: query.topic ? { topic: query.topic as never } : undefined,
      orderBy: { slug: 'asc' },
    });
    return {
      articles: rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        topic: row.topic,
        title: row.title as unknown as LocalizedText,
        summary: row.summary as unknown as LocalizedText,
        readMinutes: row.readMinutes,
        audience: row.audience,
      })),
    };
  });

  app.get('/education/:slug', async (request) => {
    const { slug } = z.object({ slug: z.string().min(1) }).parse(request.params);
    const row = await prisma.educationalArticle.findUnique({ where: { slug } });
    if (!row) return { article: null };
    const article: Omit<EducationalArticle, 'updatedAt'> & { updatedAt: Date } = {
      id: row.id,
      slug: row.slug,
      topic: row.topic as EducationalArticle['topic'],
      title: row.title as unknown as LocalizedText,
      summary: row.summary as unknown as LocalizedText,
      body: row.body as unknown as LocalizedParagraphs,
      readMinutes: row.readMinutes,
      audience: row.audience as EducationalArticle['audience'],
      sourceNote: row.sourceNote as unknown as LocalizedText,
      updatedAt: row.updatedAt,
    };
    return { article };
  });

  /**
   * Offline activities, filtered by the age of the youngest child so a
   * suggestion is never one a family cannot actually use together.
   */
  app.get('/activities', async (request) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'activity.read', { familyId: session.familyId });
    const query = z
      .object({ age: z.coerce.number().int().min(4).max(99).optional() })
      .parse(request.query ?? {});

    const [rows, subscription, children] = await Promise.all([
      prisma.activitySuggestion.findMany(),
      prisma.subscription.findFirst({
        where: { familyId: session.familyId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.childProfile.findMany({ where: { familyId: session.familyId } }),
    ]);

    const includeExtraPacks = hasFeature({
      subscription: toDomainSubscription(subscription),
      feature: 'activities.extra_packs',
    });
    const youngest = children.reduce<number>(
      (min, child) => Math.min(min, new Date().getFullYear() - child.birthYear),
      99,
    );
    const age = query.age ?? (children.length > 0 ? youngest : 12);

    const suggestions: ActivitySuggestion[] = rows.map((row) => ({
      id: row.id,
      category: row.category as ActivitySuggestion['category'],
      title: row.title as unknown as LocalizedText,
      body: row.body as unknown as LocalizedText,
      minutes: row.minutes,
      minAge: row.minAge,
      maxAge: row.maxAge,
      needsAdult: row.needsAdult,
      pack: row.pack as 'core' | 'extra',
      questlyRef: row.questlyRef,
    }));

    return {
      age,
      includeExtraPacks,
      activities: suggestionsForAge(suggestions, age, { includeExtraPacks }),
      // Questly is a planned integration; nothing is sent anywhere today.
      questly: { status: 'planned', connected: false },
    };
  });

  /** What is being measured, in plain language, for whoever is asking. */
  app.get('/measurements/explained', async (request) => {
    const session = requireSession(request);
    if (!session.actor.familyId) return { sources: [] };
    const rows = await prisma.measurementSource.findMany({
      where: { familyId: session.actor.familyId },
    });
    return {
      sources: rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        provider: row.provider,
        enabled: row.enabled,
        label: describeSource(row.kind as never),
      })),
    };
  });
}
