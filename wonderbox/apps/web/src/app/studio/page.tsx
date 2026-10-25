import Link from 'next/link';
import { Badge, Card, PageHeading } from '../../components/ui.tsx';
import { prisma } from '../../lib/db.ts';
import { requirePermissionPage } from '../../lib/auth/guard.ts';
import { requestTranslator } from '../../lib/ui/locale.ts';
import { missingLocales, text } from '../../lib/i18n/localised.ts';

export default async function StudioHomePage() {
  await requirePermissionPage('content.read', '/studio');
  const { locale, t } = await requestTranslator();

  const [journeys, pending, drafts] = await Promise.all([
    prisma.learningJourney.findMany({
      include: {
        boxProduct: { include: { translations: true, theme: true } },
        chapters: { orderBy: { orderIndex: 'asc' }, include: { _count: { select: { nodes: true } } } },
      },
    }),
    prisma.contentVersion.count({ where: { state: 'IN_REVIEW' } }),
    prisma.contentVersion.count({ where: { state: 'DRAFT' } }),
  ]);

  const published = await prisma.contentVersion.findMany({
    where: { entityType: 'Chapter', state: 'PUBLISHED' },
    select: { entityId: true },
  });
  const live = new Set(published.map((row) => row.entityId));

  return (
    <>
      <PageHeading
        title={t('studio.title')}
        description={
          locale === 'nl'
            ? 'Elk hoofdstuk is een dialooggraaf. Niets bereikt een kind zonder dat een ander mens het heeft goedgekeurd.'
            : 'Every chapter is a dialogue graph. Nothing reaches a child without another person approving it.'
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-3xl font-bold">{pending}</p>
          <p className="text-sm text-[var(--color-ink-soft)]">{t('studio.approvals')}</p>
          <Link href="/studio/approvals" className="mt-2 inline-block text-sm underline">
            {locale === 'nl' ? 'Naar de wachtrij' : 'Go to the queue'}
          </Link>
        </Card>
        <Card>
          <p className="text-3xl font-bold">{drafts}</p>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {locale === 'nl' ? 'Concepten' : 'Drafts'}
          </p>
        </Card>
        <Card>
          <p className="text-3xl font-bold">{live.size}</p>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {locale === 'nl' ? 'Live hoofdstukken' : 'Live chapters'}
          </p>
        </Card>
      </div>

      <h2 className="mb-3 text-xl font-bold">{t('studio.journeys')}</h2>
      <ul className="space-y-4">
        {journeys.map((journey) => {
          const name =
            journey.boxProduct.translations.find((entry) => entry.locale === locale)?.name ??
            journey.boxProduct.sku;
          const gaps = journey.chapters.flatMap((chapter) => missingLocales(chapter.title));
          return (
            <Card key={journey.id} as="li">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge>{text(journey.boxProduct.theme.name, locale, journey.boxProduct.theme.slug)}</Badge>
                <h3 className="font-bold">{name}</h3>
                {gaps.length > 0 ? (
                  <Badge tone="caution">
                    {t('studio.translationGaps')}: {[...new Set(gaps)].join(', ')}
                  </Badge>
                ) : null}
              </div>
              <ol className="grid gap-2 sm:grid-cols-2">
                {journey.chapters.map((chapter) => (
                  <li key={chapter.id} className="flex items-center justify-between gap-2 text-sm">
                    <Link href={`/studio/chapters/${chapter.id}`} className="underline">
                      {text(chapter.title, locale, chapter.key)}
                    </Link>
                    <span className="flex items-center gap-2 text-[var(--color-ink-soft)]">
                      {chapter._count.nodes} nodes
                      {live.has(chapter.id) ? (
                        <Badge tone="ok">live</Badge>
                      ) : (
                        <Badge tone="muted">draft</Badge>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            </Card>
          );
        })}
      </ul>
    </>
  );
}
