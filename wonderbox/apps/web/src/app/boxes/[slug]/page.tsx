import { notFound } from 'next/navigation';
import { Badge, Card, PageHeading } from '../../../components/ui.tsx';
import { boxDetail } from '../../../server/catalogue.ts';
import { formatCents } from '../../../lib/money.ts';
import { requestTranslator } from '../../../lib/ui/locale.ts';

export default async function BoxDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { locale, t } = await requestTranslator();
  const box = await boxDetail(slug, locale);
  if (!box) notFound();

  const money = (cents: number) => formatCents(cents, 'EUR', locale === 'nl' ? 'nl-NL' : 'en-IE');
  const severityTone = { WARNING: 'warn', CAUTION: 'caution', INFO: 'muted' } as const;

  return (
    <>
      <PageHeading
        title={box.name}
        description={box.tagline}
        action={
          <form action="/api/checkout/box" method="post" className="flex items-end gap-3">
            <input type="hidden" name="boxProductId" value={box.id} />
            <div>
              <p className="text-2xl font-bold">{money(box.priceCents)}</p>
              <p className="text-xs text-[var(--color-ink-soft)]">{t('catalogue.perBox')}</p>
            </div>
            <button
              type="submit"
              className="wb-button wb-button-primary"
              disabled={!box.inStock}
            >
              {box.inStock ? t('catalogue.orderOnce') : t('catalogue.outOfStock')}
            </button>
          </form>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Badge>{box.themeName}</Badge>
        <Badge tone="muted">{t('catalogue.ages', { min: box.ageMin, max: box.ageMax })}</Badge>
        <Badge tone="muted">{t('catalogue.chapters', { count: box.chapterCount })}</Badge>
        <Badge tone="muted">{t('catalogue.experiments', { count: box.experimentCount })}</Badge>
        {box.availableLocales.map((available) => (
          <Badge key={available} tone="muted">
            {available.toUpperCase()}
          </Badge>
        ))}
      </div>

      <p className="mb-8 max-w-3xl text-lg text-[var(--color-ink-soft)]">{box.description}</p>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2" aria-labelledby="chapters">
          <h2 id="chapters" className="mb-3 text-xl font-bold">
            {t('play.chapters')}
          </h2>
          <ol className="space-y-3">
            {box.chapters.map((chapter, index) => (
              <Card key={chapter.id} as="li">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-brand)]">
                  {index + 1} · {chapter.estimatedMinutes} min
                </p>
                <h3 className="mt-1 font-bold">{chapter.title}</h3>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{chapter.intro}</p>
                {chapter.experiments.length > 0 ? (
                  <ul className="mt-3 space-y-2 border-s-2 border-[var(--color-line)] ps-3">
                    {chapter.experiments.map((experiment) => (
                      <li key={experiment.title}>
                        <p className="text-sm font-semibold">{experiment.title}</p>
                        <p className="text-sm text-[var(--color-ink-soft)]">
                          {experiment.objective}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Card>
            ))}
          </ol>
        </section>

        <div className="space-y-6">
          <section aria-labelledby="materials">
            <h2 id="materials" className="mb-3 text-xl font-bold">
              {t('catalogue.materials')}
            </h2>
            <Card>
              <ul className="space-y-1 text-sm">
                {box.materials.map((material) => (
                  <li key={material.name} className="flex justify-between gap-3">
                    <span>{material.name}</span>
                    <span className="text-[var(--color-ink-soft)]">×{material.quantity}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          {box.safety.length > 0 ? (
            <section aria-labelledby="safety">
              <h2 id="safety" className="mb-3 text-xl font-bold">
                {t('catalogue.safety')}
              </h2>
              <Card>
                <ul className="space-y-3 text-sm">
                  {box.safety.map((instruction) => (
                    <li key={instruction.id}>
                      <Badge tone={severityTone[instruction.severity as 'WARNING'] ?? 'muted'}>
                        {instruction.severity}
                      </Badge>
                      <p className="mt-1">{instruction.text}</p>
                      {instruction.requiresAdult ? (
                        <p className="mt-1 text-xs font-semibold text-[var(--color-warn-ink)]">
                          {locale === 'nl' ? 'Met een volwassene' : 'With a grown-up'}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}
