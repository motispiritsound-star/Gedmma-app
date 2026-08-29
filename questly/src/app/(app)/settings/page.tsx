import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { FamilySettingsForm } from '@/components/family/FamilySettingsForm'
import { getTranslations } from '@/modules/localisation/server'
import { formatDate } from '@/modules/localisation/format'
import { requireFamilyPage } from '@/modules/auth/guards'

export const metadata: Metadata = { title: 'Family settings' }

export default async function SettingsPage() {
  const [{ locale, d }, context] = await Promise.all([
    getTranslations(),
    requireFamilyPage('/settings'),
  ])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">{d.settings.title}</h1>
      </header>

      <Card>
        <CardHeader title={d.settings.accountSection} />
        <dl className="space-y-2 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-ink-muted">{d.auth.displayName}</dt>
            <dd className="font-medium">{context.user.displayName}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-ink-muted">{d.auth.email}</dt>
            <dd className="font-medium">
              {context.user.email}{' '}
              {context.user.emailVerifiedAt ? (
                <Badge tone="success">{d.auth.verifiedBadge}</Badge>
              ) : (
                <Link href="/verify-email">
                  <Badge tone="ember">{d.auth.unverifiedBadge}</Badge>
                </Link>
              )}
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-ink-muted">{d.nav.account}</dt>
            <dd className="font-medium">{formatDate(context.user.createdAt, locale)}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <CardHeader title={d.settings.preferencesSection} />
        <FamilySettingsForm
          locale={locale}
          values={{
            name: context.family.name,
            environment: context.family.environment,
            adultCount: context.family.adultCount,
            preferredDuration: context.family.preferredDuration,
            preferredDifficulty: context.family.preferredDifficulty,
            preferredSetting: context.family.preferredSetting,
            prefersFamilyActivity: context.family.prefersFamilyActivity,
            requireParentApproval: context.family.requireParentApproval,
            locale: context.family.locale,
          }}
          labels={{
            familyName: d.auth.familyName,
            environment: d.onboarding.environment,
            adults: locale === 'nl' ? 'Aantal volwassenen' : 'Number of adults',
            duration: d.onboarding.duration,
            difficulty: d.onboarding.difficulty,
            setting: d.onboarding.setting,
            familyActivity: d.onboarding.familyActivity,
            approval: d.onboarding.approval,
            approvalHint: d.onboarding.approvalHint,
            language: d.common.language,
            save: d.common.save,
            saving: d.common.saving,
            saved: d.settings.saved,
          }}
        />
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader title={d.subscription.title} />
          <p className="text-sm text-ink-soft">{d.subscription.subtitle}</p>
          <Link
            href="/settings/subscription"
            className="mt-4 inline-block font-semibold text-moss-700 underline"
          >
            {d.subscription.manage}
          </Link>
        </Card>
        <Card>
          <CardHeader title={d.settings.privacySection} />
          <p className="text-sm text-ink-soft">{d.settings.exportBody}</p>
          <Link
            href="/settings/data"
            className="mt-4 inline-block font-semibold text-moss-700 underline"
          >
            {d.settings.exportTitle}
          </Link>
        </Card>
      </div>
    </div>
  )
}
