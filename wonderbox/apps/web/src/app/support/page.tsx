import { Badge, Card, EmptyState, Field, Notice, PageHeading } from '../../components/ui.tsx';
import { currentActor } from '../../lib/auth/session.ts';
import { requestTranslator } from '../../lib/ui/locale.ts';
import { casesForFamily } from '../../server/support.ts';
import { openSupportCaseAction } from '../../server/actions/account.ts';

/**
 * Support and safety reporting for parents.
 *
 * The safety route is deliberately the same form as the billing route: making
 * a report should not require finding a special page, and a parent who is
 * upset about something their child heard should not have to work out which
 * channel is correct.
 */
export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;
  const actor = await currentActor();
  const { locale, t } = await requestTranslator();
  const cases = actor?.familyId ? await casesForFamily(actor.familyId) : [];

  const kinds: [string, string][] =
    locale === 'nl'
      ? [
          ['QUESTION', 'Vraag'],
          ['DELIVERY', 'Bezorging'],
          ['BILLING', 'Betaling of abonnement'],
          ['CONTENT_CONCERN', 'Melding over content'],
          ['SAFETY_REPORT', 'Veiligheidsmelding'],
          ['DATA_REQUEST', 'Verzoek over gegevens'],
        ]
      : [
          ['QUESTION', 'Question'],
          ['DELIVERY', 'Delivery'],
          ['BILLING', 'Payment or subscription'],
          ['CONTENT_CONCERN', 'Content concern'],
          ['SAFETY_REPORT', 'Safety report'],
          ['DATA_REQUEST', 'Data request'],
        ];

  const dates = new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-GB', { dateStyle: 'medium' });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading title={t('support.title')} />
      {sent ? <Notice tone="ok">{t('support.sent')}</Notice> : null}
      {error ? <Notice tone="warn">{t('common.error')}</Notice> : null}
      <Notice>{t('support.safetyNote')}</Notice>

      {actor ? (
        <Card className="mb-8">
          <h2 className="mb-4 font-bold">{t('support.newCase')}</h2>
          <form action={openSupportCaseAction}>
            <Field label={t('support.kind')} name="kind">
              <select id="kind" name="kind" className="wb-input">
                {kinds.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('support.subject')} name="subject">
              <input id="subject" name="subject" required minLength={3} maxLength={140} className="wb-input" />
            </Field>
            <Field label={t('support.body')} name="body">
              <textarea id="body" name="body" rows={6} required minLength={10} className="wb-input" />
            </Field>
            <Field
              label={locale === 'nl' ? 'Dialoognode (optioneel)' : 'Dialogue node (optional)'}
              name="relatedNodeId"
              hint={
                locale === 'nl'
                  ? 'Als je weet om welk stukje verhaal het gaat, helpt dat ons enorm.'
                  : 'If you know which bit of the story it was about, that helps us a great deal.'
              }
            >
              <input
                id="relatedNodeId"
                name="relatedNodeId"
                className="wb-input font-mono"
                aria-describedby="relatedNodeId-hint"
              />
            </Field>
            <button type="submit" className="wb-button wb-button-primary">
              {t('support.submit')}
            </button>
          </form>
        </Card>
      ) : (
        <Notice>
          {locale === 'nl'
            ? 'Log in om een bericht te sturen, dan kunnen we het aan je bestelling koppelen.'
            : 'Log in to send a message, so we can tie it to your order.'}
        </Notice>
      )}

      {cases.length > 0 ? (
        <>
          <h2 className="mb-3 text-xl font-bold">
            {locale === 'nl' ? 'Jouw berichten' : 'Your messages'}
          </h2>
          <ul className="space-y-3">
            {cases.map((supportCase) => (
              <Card key={supportCase.id} as="li">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge tone={supportCase.status === 'RESOLVED' ? 'ok' : 'muted'}>
                    {supportCase.status}
                  </Badge>
                  <span className="font-mono text-xs">{supportCase.reference}</span>
                  <span className="ms-auto text-xs text-[var(--color-ink-soft)]">
                    {dates.format(supportCase.createdAt)}
                  </span>
                </div>
                <h3 className="font-semibold">{supportCase.subject}</h3>
                {supportCase.resolutionNote ? (
                  <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
                    {supportCase.resolutionNote}
                  </p>
                ) : null}
              </Card>
            ))}
          </ul>
        </>
      ) : (
        actor ? <EmptyState>{t('common.none')}</EmptyState> : null
      )}
    </div>
  );
}
