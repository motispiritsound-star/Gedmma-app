import { Badge, Card, EmptyState, PageHeading } from '../../../components/ui.tsx';
import { requirePermissionPage } from '../../../lib/auth/guard.ts';
import { requestTranslator } from '../../../lib/ui/locale.ts';
import { caseQueue } from '../../../server/support.ts';
import { resolveCaseAction } from '../../../server/actions/ops.ts';

/**
 * The support queue, ordered safety-first. A CONTENT_CONCERN or SAFETY_REPORT
 * arrives already triaged at WARNING severity so it cannot sit behind a
 * question about a late parcel.
 */
export default async function OpsSupportPage() {
  await requirePermissionPage('support.read', '/ops/support');
  const { locale, t } = await requestTranslator();
  const cases = await caseQueue();
  const dates = new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <>
      <PageHeading title={t('support.title')} />
      {cases.length === 0 ? (
        <EmptyState>{t('common.none')}</EmptyState>
      ) : (
        <ul className="space-y-3">
          {cases.map((supportCase) => (
            <Card key={supportCase.id} as="li">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge tone={supportCase.severity === 'WARNING' ? 'warn' : 'muted'}>
                  {supportCase.severity}
                </Badge>
                <Badge tone="neutral">{supportCase.kind}</Badge>
                <span className="font-mono text-xs">{supportCase.reference}</span>
                <span className="text-sm text-[var(--color-ink-soft)]">
                  {supportCase.reporter?.displayName ?? (locale === 'nl' ? 'Onbekend' : 'Unknown')}
                </span>
                <span className="ms-auto text-xs text-[var(--color-ink-soft)]">
                  {dates.format(supportCase.createdAt)}
                </span>
              </div>
              <h2 className="font-bold">{supportCase.subject}</h2>
              <p className="mt-1 whitespace-pre-line text-sm text-[var(--color-ink-soft)]">
                {supportCase.body}
              </p>
              {supportCase.relatedNodeId ? (
                <p className="mt-2 text-xs">
                  {locale === 'nl' ? 'Gaat over dialoognode' : 'About dialogue node'}{' '}
                  <code>{supportCase.relatedNodeId}</code>
                </p>
              ) : null}
              <form action={resolveCaseAction} className="mt-3 flex items-end gap-2">
                <input type="hidden" name="caseId" value={supportCase.id} />
                <div className="flex-1">
                  <label className="wb-label" htmlFor={`note-${supportCase.id}`}>
                    {locale === 'nl' ? 'Afhandeling' : 'Resolution'}
                  </label>
                  <input id={`note-${supportCase.id}`} name="note" className="wb-input" />
                </div>
                <button type="submit" className="wb-button wb-button-primary">
                  {locale === 'nl' ? 'Afronden' : 'Resolve'}
                </button>
              </form>
            </Card>
          ))}
        </ul>
      )}
    </>
  );
}
