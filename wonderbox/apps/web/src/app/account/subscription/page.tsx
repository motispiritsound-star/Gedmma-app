import Link from 'next/link';
import { Badge, Card, EmptyState, Notice, PageHeading } from '../../../components/ui.tsx';
import { prisma } from '../../../lib/db.ts';
import { requireFamilyPage } from '../../../lib/auth/guard.ts';
import { formatCents } from '../../../lib/money.ts';
import { text } from '../../../lib/i18n/localised.ts';
import { requestTranslator } from '../../../lib/ui/locale.ts';
import { previewRenewal } from '../../../server/subscriptions.ts';
import {
  cancelSubscriptionAction,
  pauseSubscriptionAction,
  resumeSubscriptionAction,
  skipRenewalAction,
} from '../../../server/actions/account.ts';

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ started?: string; error?: string }>;
}) {
  const { started, error } = await searchParams;
  const actor = await requireFamilyPage('/account/subscription');
  const { locale, t } = await requestTranslator();

  const subscription = await prisma.subscription.findFirst({
    where: { familyId: actor.familyId },
    include: { plan: true, nextBox: { include: { translations: true } } },
    orderBy: { createdAt: 'desc' },
  });

  if (!subscription) {
    return (
      <>
        <PageHeading title={t('account.subscription')} />
        {error ? <Notice tone="warn">{error}</Notice> : null}
        <EmptyState>
          {t('subscription.none')}{' '}
          <Link href="/boxes" className="underline">
            {t('catalogue.subscribe')}
          </Link>
        </EmptyState>
      </>
    );
  }

  const preview = await previewRenewal(subscription.id);
  const money = (cents: number) => formatCents(cents, 'EUR', locale === 'nl' ? 'nl-NL' : 'en-IE');
  const dates = new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-GB', { dateStyle: 'long' });

  const reasonCopy: Record<string, string> = {
    ok: locale === 'nl' ? 'Wordt verlengd' : 'Will renew',
    skipped: t('subscription.skipped'),
    paused: locale === 'nl' ? 'Gepauzeerd' : 'Paused',
    cancelled: locale === 'nl' ? 'Stopt na deze periode' : 'Stops after this period',
    pastDue: locale === 'nl' ? 'Betaling mislukt' : 'Payment failed',
  };

  return (
    <>
      <PageHeading title={t('account.subscription')} />
      {started ? (
        <Notice tone="ok">
          {locale === 'nl' ? 'Je abonnement staat klaar.' : 'Your subscription is set up.'}
        </Notice>
      ) : null}
      {error ? <Notice tone="warn">{error}</Notice> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-bold">{t('subscription.preview')}</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>{t('subscription.status')}</dt>
              <dd>
                <Badge tone={preview.willRenew ? 'ok' : 'caution'}>
                  {reasonCopy[preview.reason] ?? preview.reason}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>{t('subscription.plan')}</dt>
              <dd>{text(subscription.plan.name, locale, subscription.plan.code)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t('subscription.nextRenewal')}</dt>
              <dd>{dates.format(preview.renewsOn)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{locale === 'nl' ? 'Bedrag' : 'Amount'}</dt>
              <dd className="font-semibold">{money(preview.amount.cents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t('subscription.nextBox')}</dt>
              <dd>{preview.nextBox?.name ?? t('common.none')}</dd>
            </div>
            <div className="flex justify-between text-[var(--color-ink-soft)]">
              <dt>{locale === 'nl' ? 'Periode daarna' : 'Period after that'}</dt>
              <dd>
                {dates.format(preview.periodAfterRenewal.start)} –{' '}
                {dates.format(preview.periodAfterRenewal.end)}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="mb-3 font-bold">{locale === 'nl' ? 'Aanpassen' : 'Change'}</h2>
          <div className="space-y-3">
            <form action={skipRenewalAction} className="flex items-center justify-between gap-3">
              <input type="hidden" name="subscriptionId" value={subscription.id} />
              <input type="hidden" name="skip" value={String(!subscription.skipNextRenewal)} />
              <span className="text-sm">
                {subscription.skipNextRenewal ? t('subscription.skipped') : t('subscription.skip')}
              </span>
              <button type="submit" className="wb-button wb-button-secondary">
                {subscription.skipNextRenewal ? t('subscription.unskip') : t('subscription.skip')}
              </button>
            </form>

            {subscription.status === 'PAUSED' ? (
              <form action={resumeSubscriptionAction} className="flex items-center justify-between gap-3">
                <input type="hidden" name="subscriptionId" value={subscription.id} />
                <span className="text-sm">
                  {locale === 'nl' ? 'Gepauzeerd tot' : 'Paused until'}{' '}
                  {subscription.pausedUntil ? dates.format(subscription.pausedUntil) : '—'}
                </span>
                <button type="submit" className="wb-button wb-button-primary">
                  {t('subscription.resume')}
                </button>
              </form>
            ) : (
              <form action={pauseSubscriptionAction} className="flex items-end gap-3">
                <input type="hidden" name="subscriptionId" value={subscription.id} />
                <div className="flex-1">
                  <label htmlFor="months" className="wb-label">
                    {t('subscription.pause')}
                  </label>
                  <select id="months" name="months" className="wb-input" defaultValue="1">
                    {[1, 2, 3, 6].map((month) => (
                      <option key={month} value={month}>
                        {month} {locale === 'nl' ? 'maand(en)' : 'month(s)'}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="wb-button wb-button-secondary">
                  {t('subscription.pause')}
                </button>
              </form>
            )}

            {subscription.status === 'CANCELLED' || subscription.cancelAt ? (
              <p className="text-sm text-[var(--color-ink-soft)]">
                {locale === 'nl'
                  ? `Stopt op ${subscription.cancelAt ? dates.format(subscription.cancelAt) : '—'}.`
                  : `Stops on ${subscription.cancelAt ? dates.format(subscription.cancelAt) : '—'}.`}
              </p>
            ) : (
              <form action={cancelSubscriptionAction}>
                <input type="hidden" name="subscriptionId" value={subscription.id} />
                <button type="submit" className="text-sm underline">
                  {t('subscription.cancel')}
                </button>
              </form>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
