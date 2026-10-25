import Link from 'next/link';
import { Card, EmptyState, Notice, PageHeading } from '../../../components/ui.tsx';
import { requireFamilyPage } from '../../../lib/auth/guard.ts';
import { requestTranslator } from '../../../lib/ui/locale.ts';
import { familyBoxes } from '../../../server/activation.ts';
import { buildSummary } from '../../../server/progress.ts';

/**
 * The parent learning summary.
 *
 * Read the copy carefully before changing anything here: this page reports
 * activity, never attainment. No score, no level, no "ahead of / behind",
 * no claim about what a child has learned. See CONTENT_SAFETY.md.
 */
export default async function SummaryPage() {
  const actor = await requireFamilyPage('/account/summary');
  const { locale, t } = await requestTranslator();

  const boxes = await familyBoxes(actor.familyId);
  const summaries = (
    await Promise.all(boxes.map((box) => buildSummary(box.id, actor.familyId, locale)))
  ).flatMap((summary) => (summary ? [summary] : []));

  const dates = new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-GB', { dateStyle: 'long' });

  return (
    <>
      <PageHeading title={t('summary.title')} />
      <Notice>{t('summary.noGrades')}</Notice>

      {summaries.length === 0 ? (
        <EmptyState>
          {t('summary.empty')}{' '}
          <Link href="/account/activate" className="underline">
            {t('account.activate')}
          </Link>
        </EmptyState>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {summaries.map((summary) => (
            <Card key={summary.activatedBoxId} as="li">
              <h2 className="font-bold">{summary.boxTitle}</h2>
              {summary.childName ? (
                <p className="text-sm text-[var(--color-ink-soft)]">{summary.childName}</p>
              ) : null}

              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-[var(--color-brand-soft)] p-3">
                  <dd className="text-2xl font-bold">
                    {summary.chaptersCompleted}
                    <span className="text-base font-normal">/{summary.chaptersTotal}</span>
                  </dd>
                  <dt className="text-xs">{t('summary.chapters')}</dt>
                </div>
                <div className="rounded-lg bg-[var(--color-brand-soft)] p-3">
                  <dd className="text-2xl font-bold">{summary.experimentsCompleted}</dd>
                  <dt className="text-xs">{t('summary.experiments')}</dt>
                </div>
                <div className="rounded-lg bg-[var(--color-brand-soft)] p-3">
                  <dd className="text-2xl font-bold">{summary.minutesListened}</dd>
                  <dt className="text-xs">{t('summary.minutes')}</dt>
                </div>
              </dl>

              {summary.topics.length > 0 ? (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold">{t('summary.topics')}</h3>
                  <ul className="mt-1 flex flex-wrap gap-2">
                    {summary.topics.map((topic) => (
                      <li
                        key={topic}
                        className="rounded-full bg-[oklch(95%_0.005_260)] px-2.5 py-0.5 text-xs"
                      >
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {summary.conversationStarters.length > 0 ? (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold">{t('summary.talkAbout')}</h3>
                  <ul className="mt-1 space-y-1 text-sm text-[var(--color-ink-soft)]">
                    {summary.conversationStarters.map((starter) => (
                      <li key={starter}>“{starter}”</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {summary.lastPlayedAt ? (
                <p className="mt-4 text-xs text-[var(--color-ink-soft)]">
                  {locale === 'nl' ? 'Laatst geluisterd' : 'Last listened'}:{' '}
                  {dates.format(summary.lastPlayedAt)}
                </p>
              ) : null}
            </Card>
          ))}
        </ul>
      )}
    </>
  );
}
