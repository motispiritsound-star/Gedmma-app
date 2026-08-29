import { notFound, redirect } from 'next/navigation';
import { isLocale, translator } from '@/lib/i18n';
import { viewerContext } from '@/lib/auth/context';
import { activeSubscription, listPlans } from '@/modules/billing/subscriptions';
import { creditBalance, listLedger } from '@/modules/billing/credits';
import { subscribeAction } from '@/app/actions/guardian';
import { Alert, Badge, Card, EmptyState, PageHeader, Stat, formatMoney } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function PlansPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  const { status } = await searchParams;
  if (!isLocale(locale)) notFound();
  const t = translator(locale);

  const { user, familyId } = await viewerContext();
  if (!user) redirect(`/${locale}/auth/login`);
  if (!familyId) redirect(`/${locale}`);

  const [plans, current, balance, ledger] = await Promise.all([
    listPlans('GUARDIAN'),
    activeSubscription(familyId),
    creditBalance(familyId),
    listLedger(familyId, 20),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title={t('plans.title')} description={t('plans.subtitle')} />

      <Alert tone="warning">{t('plans.mockNotice')}</Alert>

      {status === 'paid' ? <Alert tone="success">{locale === 'nl' ? 'Betaling ontvangen.' : 'Payment received.'}</Alert> : null}
      {status === 'cancelled' ? <Alert>{locale === 'nl' ? 'Betaling geannuleerd.' : 'Payment cancelled.'}</Alert> : null}

      <dl className="grid gap-4 sm:grid-cols-2">
        <Stat label={t('plans.balance')} value={`${balance} ${t('common.credits')}`} />
        <Stat
          label={t('plans.current')}
          value={current ? (locale === 'nl' ? current.plan.nameNl : current.plan.nameEn) : '—'}
          hint={current ? `${current.status}` : undefined}
        />
      </dl>

      <section aria-labelledby="plans">
        <h2 id="plans" className="mb-3 text-lg font-semibold">
          {t('plans.title')}
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = current?.planId === plan.id;
            return (
              <li key={plan.id}>
                <Card className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold">{locale === 'nl' ? plan.nameNl : plan.nameEn}</h3>
                    {isCurrent ? <Badge tone="success">{t('plans.current')}</Badge> : null}
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-brand-700">
                    {formatMoney(plan.priceCents, plan.currency, locale)}
                    <span className="ml-1 text-sm font-normal text-slate-500">{t('plans.perMonth')}</span>
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{locale === 'nl' ? plan.descriptionNl : plan.descriptionEn}</p>
                  <p className="mt-2 text-sm font-medium">{t('plans.creditsPerMonth', { count: plan.monthlyCredits })}</p>

                  <form action={subscribeAction} className="mt-auto pt-4">
                    <input type="hidden" name="planSlug" value={plan.slug} />
                    <input type="hidden" name="locale" value={locale} />
                    <button type="submit" className="btn-primary w-full" disabled={isCurrent}>
                      {isCurrent ? t('plans.current') : t('plans.choose')}
                    </button>
                  </form>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="ledger">
        <h2 id="ledger" className="mb-3 text-lg font-semibold">
          {t('plans.ledger')}
        </h2>
        {ledger.length === 0 ? (
          <EmptyState>{t('common.none')}</EmptyState>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{t('plans.ledger')}</caption>
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-2">
                    {locale === 'nl' ? 'Datum' : 'Date'}
                  </th>
                  <th scope="col" className="px-4 py-2">
                    {locale === 'nl' ? 'Omschrijving' : 'Description'}
                  </th>
                  <th scope="col" className="px-4 py-2 text-right">
                    +/−
                  </th>
                  <th scope="col" className="px-4 py-2 text-right">
                    {t('plans.balance')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-2 text-slate-500">
                      {new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-GB').format(entry.createdAt)}
                    </td>
                    <td className="px-4 py-2">{entry.description}</td>
                    <td className={`px-4 py-2 text-right font-medium ${entry.delta > 0 ? 'text-emerald-700' : 'text-slate-800'}`}>
                      {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                    </td>
                    <td className="px-4 py-2 text-right">{entry.balanceAfter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
