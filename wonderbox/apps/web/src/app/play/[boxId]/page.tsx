import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, Card, EmptyState, Notice, PageHeading } from '../../../components/ui.tsx';
import { prisma } from '../../../lib/db.ts';
import { requireFamilyPage } from '../../../lib/auth/guard.ts';
import { requestTranslator } from '../../../lib/ui/locale.ts';
import { requireBoxOwnership } from '../../../server/activation.ts';
import { journeyChapters } from '../../../server/content.ts';
import { completedChapterIds, resumePoint } from '../../../server/progress.ts';

export default async function BoxPlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ boxId: string }>;
  searchParams: Promise<{ activated?: string; child?: string }>;
}) {
  const { boxId } = await params;
  const { activated, child } = await searchParams;
  const actor = await requireFamilyPage('/play');
  const { locale, t } = await requestTranslator();

  const box = await requireBoxOwnership(boxId, actor.familyId);
  if (!box?.boxProduct.journey) notFound();

  const [chapters, completed, resume, children] = await Promise.all([
    journeyChapters(box.boxProduct.journey.id, locale),
    completedChapterIds(box.id),
    resumePoint(box.id),
    prisma.childProfile.findMany({ where: { familyId: actor.familyId }, orderBy: { createdAt: 'asc' } }),
  ]);

  const title =
    box.boxProduct.translations.find((entry) => entry.locale === locale)?.name ??
    box.boxProduct.sku;
  const selectedChild = child ?? children[0]?.id ?? '';
  const childQuery = selectedChild ? `?child=${encodeURIComponent(selectedChild)}` : '';

  return (
    <>
      <PageHeading title={title} />
      {activated ? <Notice tone="ok">{t('activate.success')}</Notice> : null}

      {children.length > 1 ? (
        <form method="get" className="mb-6 flex items-end gap-3">
          <div>
            <label htmlFor="child" className="wb-label">
              {t('play.chooseChild')}
            </label>
            <select id="child" name="child" defaultValue={selectedChild} className="wb-input">
              {children.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.displayName}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="wb-button wb-button-secondary">
            {t('common.save')}
          </button>
        </form>
      ) : null}

      {resume ? (
        <Notice>
          <Link href={`/play/${box.id}/${resume.chapterId}${childQuery}`} className="underline">
            {t('play.resume')}
          </Link>
        </Notice>
      ) : null}

      {chapters.length === 0 ? (
        <EmptyState>{t('common.none')}</EmptyState>
      ) : (
        <ol className="space-y-3">
          {chapters.map((chapter, index) => {
            const isDone = completed.has(chapter.id);
            return (
              <Card key={chapter.id} as="li" className="flex flex-wrap items-center gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-soft)] font-bold text-[var(--color-brand-strong)]"
                >
                  {index + 1}
                </span>
                <div className="min-w-48 flex-1">
                  <h2 className="font-bold">{chapter.title}</h2>
                  <p className="text-sm text-[var(--color-ink-soft)]">{chapter.intro}</p>
                  <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                    {chapter.estimatedMinutes} min
                    {chapter.experiments.length > 0
                      ? ` · ${t('catalogue.experiments', { count: chapter.experiments.length })}`
                      : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {isDone ? <Badge tone="ok">{t('play.chapterDone')}</Badge> : null}
                  {chapter.isPlayable ? (
                    <Link
                      href={`/play/${box.id}/${chapter.id}${childQuery}`}
                      className="wb-button wb-button-primary"
                    >
                      {t('play.start')}
                    </Link>
                  ) : (
                    <Badge tone="muted">
                      {locale === 'nl' ? 'Nog niet vrijgegeven' : 'Not released yet'}
                    </Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </ol>
      )}
    </>
  );
}
