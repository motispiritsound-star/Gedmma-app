import Link from 'next/link';
import { Card, EmptyState, PageHeading } from '../../components/ui.tsx';
import { requireFamilyPage } from '../../lib/auth/guard.ts';
import { requestTranslator } from '../../lib/ui/locale.ts';
import { familyBoxes } from '../../server/activation.ts';
import { text } from '../../lib/i18n/localised.ts';
import { ServiceWorkerRegistrar } from '../../components/service-worker.tsx';

export default async function PlayIndexPage() {
  const actor = await requireFamilyPage('/play');
  const { locale, t } = await requestTranslator();
  const boxes = await familyBoxes(actor.familyId);

  return (
    <>
      <ServiceWorkerRegistrar />
      <PageHeading
        title={t('play.title')}
        description={
          locale === 'nl'
            ? 'Kies een doos. Daarna kan het scherm wat ons betreft omgedraaid op tafel liggen.'
            : 'Pick a box. After that the screen can lie face down on the table as far as we are concerned.'
        }
      />
      {boxes.length === 0 ? (
        <EmptyState>
          {t('play.noBoxes')}{' '}
          <Link href="/account/activate" className="underline">
            {t('account.activate')}
          </Link>
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {boxes.map((box) => {
            const name =
              box.boxProduct.translations.find((entry) => entry.locale === locale)?.name ??
              box.boxProduct.sku;
            const chapters = box.boxProduct.journey?.chapters ?? [];
            return (
              <Card key={box.id} as="li">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-brand)]">
                  {text(box.boxProduct.theme.name, locale, box.boxProduct.theme.slug)}
                </p>
                <h2 className="mt-1 text-xl font-bold">{name}</h2>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                  {t('catalogue.chapters', { count: chapters.length })}
                </p>
                <Link href={`/play/${box.id}`} className="wb-button wb-button-primary mt-4">
                  {t('play.start')}
                </Link>
              </Card>
            );
          })}
        </ul>
      )}
    </>
  );
}
