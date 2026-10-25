import { Badge, Card, EmptyState, Field, Notice, PageHeading } from '../../../components/ui.tsx';
import { prisma } from '../../../lib/db.ts';
import { requirePermissionPage } from '../../../lib/auth/guard.ts';
import { requestTranslator } from '../../../lib/ui/locale.ts';
import { env } from '../../../lib/env.ts';
import { requestAiDraftAction, submitVersionAction } from '../../../server/actions/studio.ts';

/**
 * AI drafting, for adult editors only.
 *
 * The rule this page exists to make visible: a model can help an editor write,
 * and can never speak to a child. Everything produced here is a DRAFT that has
 * to go through the same human approval as anything else.
 */
export default async function DraftsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  await requirePermissionPage('content.aiDraft', '/studio/drafts');
  const { created, error } = await searchParams;
  const { locale, t } = await requestTranslator();

  const [themes, drafts] = await Promise.all([
    prisma.theme.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.contentVersion.findMany({
      where: { source: 'AI_DRAFT' },
      include: { createdBy: { select: { displayName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  return (
    <>
      <PageHeading title={t('studio.drafts')} />
      <Notice tone="warn" title={locale === 'nl' ? 'Let op' : 'Note'}>
        {t('studio.aiNotice')}
      </Notice>
      {created ? (
        <Notice tone="ok">
          {locale === 'nl'
            ? 'Concept opgeslagen als DRAFT. Bied het aan ter review om verder te gaan.'
            : 'Draft saved as DRAFT. Submit it for review to go further.'}
        </Notice>
      ) : null}
      {error ? <Notice tone="warn">{t('common.error')}</Notice> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-bold">
            {locale === 'nl' ? 'Nieuw concept vragen' : 'Request a draft'}
          </h2>
          <p className="mb-4 text-sm text-[var(--color-ink-soft)]">
            {locale === 'nl'
              ? `Provider: ${env.AI_DRAFT_PROVIDER} · model: ${env.AI_DRAFT_MODEL}`
              : `Provider: ${env.AI_DRAFT_PROVIDER} · model: ${env.AI_DRAFT_MODEL}`}
          </p>
          <form action={requestAiDraftAction}>
            <Field label={locale === 'nl' ? 'Soort' : 'Kind'} name="kind">
              <select id="kind" name="kind" className="wb-input">
                <option value="chapterOutline">chapterOutline</option>
                <option value="dialogueNode">dialogueNode</option>
                <option value="experimentSteps">experimentSteps</option>
                <option value="translation">translation</option>
              </select>
            </Field>
            <Field label={t('studio.themes')} name="themeSlug">
              <select id="themeSlug" name="themeSlug" className="wb-input">
                {themes.map((theme) => (
                  <option key={theme.id} value={theme.slug}>
                    {theme.slug}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-x-4 sm:grid-cols-3">
              <Field label="ageMin" name="ageMin">
                <input
                  id="ageMin"
                  name="ageMin"
                  type="number"
                  min={5}
                  max={12}
                  defaultValue={7}
                  className="wb-input"
                />
              </Field>
              <Field label="ageMax" name="ageMax">
                <input
                  id="ageMax"
                  name="ageMax"
                  type="number"
                  min={5}
                  max={12}
                  defaultValue={10}
                  className="wb-input"
                />
              </Field>
              <Field label={t('common.language')} name="locale">
                <select id="locale" name="locale" className="wb-input" defaultValue={locale}>
                  <option value="nl">nl</option>
                  <option value="en">en</option>
                </select>
              </Field>
            </div>
            <Field label="brief" name="brief">
              <textarea id="brief" name="brief" rows={4} required minLength={10} className="wb-input" />
            </Field>
            <Field
              label="sourceText"
              name="sourceText"
              hint={
                locale === 'nl'
                  ? 'Alleen invullen bij een vertaling of herschrijving.'
                  : 'Only for a translation or a rewrite.'
              }
            >
              <textarea
                id="sourceText"
                name="sourceText"
                rows={3}
                className="wb-input"
                aria-describedby="sourceText-hint"
              />
            </Field>
            <button type="submit" className="wb-button wb-button-primary">
              {locale === 'nl' ? 'Concept genereren' : 'Generate draft'}
            </button>
          </form>
        </Card>

        <div>
          <h2 className="mb-3 font-bold">
            {locale === 'nl' ? 'Recente AI-concepten' : 'Recent AI drafts'}
          </h2>
          {drafts.length === 0 ? (
            <EmptyState>{t('common.none')}</EmptyState>
          ) : (
            <ul className="space-y-3">
              {drafts.map((draft) => (
                <Card key={draft.id} as="li">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge tone={draft.state === 'PUBLISHED' ? 'ok' : 'caution'}>{draft.state}</Badge>
                    <Badge tone="muted">{draft.aiModel ?? draft.aiProvider}</Badge>
                    <span className="text-sm text-[var(--color-ink-soft)]">
                      {draft.createdBy.displayName}
                    </span>
                  </div>
                  {draft.notes ? <p className="text-sm">{draft.notes}</p> : null}
                  {draft.state === 'DRAFT' ? (
                    <form action={submitVersionAction} className="mt-3">
                      <input type="hidden" name="versionId" value={draft.id} />
                      <button type="submit" className="wb-button wb-button-secondary">
                        {t('studio.submit')}
                      </button>
                    </form>
                  ) : null}
                </Card>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
