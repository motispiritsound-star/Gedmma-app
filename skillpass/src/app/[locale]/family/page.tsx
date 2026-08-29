import { notFound, redirect } from 'next/navigation';
import { isLocale, translator } from '@/lib/i18n';
import { viewerContext } from '@/lib/auth/context';
import { getFamilyOverview, listInterests } from '@/modules/family/service';
import { creditBalance } from '@/modules/billing/credits';
import { AGE_BAND_LABELS, ageBandLabel } from '@/lib/i18n/labels';
import { Alert, Badge, Card, EmptyState, PageHeader, Stat } from '@/components/ui';
import { AddChildForm } from './add-child-form';

export const dynamic = 'force-dynamic';

export default async function FamilyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = translator(locale);

  const { user, familyId } = await viewerContext();
  if (!user) redirect(`/${locale}/auth/login`);
  if (!familyId) redirect(`/${locale}`);

  const [family, interests, balance] = await Promise.all([
    getFamilyOverview(familyId),
    listInterests(),
    creditBalance(familyId),
  ]);

  const subscription = family.subscriptions.find((s) => s.status === 'ACTIVE' || s.status === 'TRIALING');

  return (
    <div className="space-y-8">
      <PageHeader title={t('family.title')} description={family.name} />

      {!user.emailVerified ? (
        <Alert tone="warning">
          {locale === 'nl'
            ? 'Je e-mailadres is nog niet bevestigd. Boeken kan zodra dat gebeurd is.'
            : 'Your email address is not confirmed yet. You can book once it is.'}
        </Alert>
      ) : null}

      <dl className="grid gap-4 sm:grid-cols-3">
        <Stat label={t('family.credits')} value={balance} />
        <Stat
          label={t('nav.plans')}
          value={subscription ? (locale === 'nl' ? subscription.plan.nameNl : subscription.plan.nameEn) : '—'}
        />
        <Stat label={t('family.children')} value={family.children.length} />
      </dl>

      <section aria-labelledby="children">
        <h2 id="children" className="mb-3 text-lg font-semibold">
          {t('family.children')}
        </h2>
        {family.children.length === 0 ? (
          <EmptyState>{t('common.none')}</EmptyState>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {family.children.map((child) => (
              <li key={child.id}>
                <Card>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{child.nickname}</h3>
                    <Badge tone="info">{ageBandLabel(child.ageBand, locale)}</Badge>
                  </div>
                  {child.pronouns ? <p className="mt-1 text-sm text-slate-500">{child.pronouns}</p> : null}
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {child.interests.map((interest) => (
                      <li key={interest.id}>
                        <Badge>{locale === 'nl' ? interest.labelNl : interest.labelEn}</Badge>
                      </li>
                    ))}
                  </ul>
                  {child.accessibilityNeeds ? (
                    <p className="mt-3 text-sm text-slate-600">
                      <span className="font-medium">{t('family.accessibility')}: </span>
                      {child.accessibilityNeeds}
                    </p>
                  ) : null}
                  {child.medicalNotes ? (
                    <p className="mt-2 text-xs text-slate-500">{t('family.medicalHint')}</p>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="add-child">
        <h2 id="add-child" className="mb-3 text-lg font-semibold">
          {t('family.addChild')}
        </h2>
        <Card>
          <AddChildForm
            locale={locale}
            ageBands={Object.entries(AGE_BAND_LABELS).map(([value, labels]) => ({ value, label: labels[locale] }))}
            interests={interests.map((interest) => ({
              slug: interest.slug,
              label: locale === 'nl' ? interest.labelNl : interest.labelEn,
            }))}
          />
        </Card>
      </section>

      <section aria-labelledby="guardians">
        <h2 id="guardians" className="mb-3 text-lg font-semibold">
          {locale === 'nl' ? 'Ouders en verzorgers' : 'Parents and guardians'}
        </h2>
        <ul className="space-y-2 text-sm">
          {family.memberships.map((membership) => (
            <li key={membership.id} className="card flex items-center justify-between p-3">
              <span>{membership.user.displayName}</span>
              <Badge>{membership.role}</Badge>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="privacy" className="text-sm text-slate-600">
        <h2 id="privacy" className="mb-2 text-lg font-semibold text-slate-900">
          {locale === 'nl' ? 'Jouw gegevens' : 'Your data'}
        </h2>
        <p>
          {locale === 'nl'
            ? 'Je kunt al je gegevens downloaden of je account laten verwijderen.'
            : 'You can download all of your data or have your account erased.'}
        </p>
        <div className="mt-3 flex gap-3">
          <a href="/api/account/export" className="btn-secondary">
            {locale === 'nl' ? 'Gegevens downloaden' : 'Download my data'}
          </a>
        </div>
      </section>
    </div>
  );
}
