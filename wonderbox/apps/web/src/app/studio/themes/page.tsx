import { Badge, Card, PageHeading } from '../../../components/ui.tsx';
import { prisma } from '../../../lib/db.ts';
import { requirePermissionPage } from '../../../lib/auth/guard.ts';
import { requestTranslator } from '../../../lib/ui/locale.ts';
import { missingLocales, text } from '../../../lib/i18n/localised.ts';

export default async function ThemesPage() {
  await requirePermissionPage('content.read', '/studio/themes');
  const { locale, t } = await requestTranslator();
  const themes = await prisma.theme.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { boxProducts: { include: { translations: true } } },
  });

  return (
    <>
      <PageHeading
        title={t('studio.themes')}
        description={
          locale === 'nl'
            ? 'Thema’s bepalen de leerlijn. Een doos hoort bij precies één thema.'
            : 'Themes shape the curriculum. A box belongs to exactly one theme.'
        }
      />
      <ul className="grid gap-4 sm:grid-cols-2">
        {themes.map((theme) => {
          const gaps = missingLocales(theme.name);
          return (
            <Card key={theme.id} as="li">
              <div className="mb-1 flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-3 w-3 rounded-full"
                  style={{ background: `var(--color-${theme.colorToken})` }}
                />
                <h2 className="font-bold">{text(theme.name, locale, theme.slug)}</h2>
                {gaps.length > 0 ? <Badge tone="caution">{gaps.join(', ')}</Badge> : null}
              </div>
              <p className="text-sm text-[var(--color-ink-soft)]">{text(theme.blurb, locale, '')}</p>
              <p className="mt-3 text-xs text-[var(--color-ink-soft)]">
                {theme.boxProducts.length}{' '}
                {locale === 'nl' ? 'doos/dozen' : theme.boxProducts.length === 1 ? 'box' : 'boxes'}
                {theme.boxProducts.length > 0
                  ? `: ${theme.boxProducts
                      .map(
                        (box) =>
                          box.translations.find((entry) => entry.locale === locale)?.name ?? box.sku,
                      )
                      .join(', ')}`
                  : ''}
              </p>
            </Card>
          );
        })}
      </ul>
    </>
  );
}
