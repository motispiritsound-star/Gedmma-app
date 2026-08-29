import type { Metadata } from 'next'
import { Card, CardHeader } from '@/components/ui/Card'
import { Callout } from '@/components/ui/States'
import { buttonClassName } from '@/components/ui/Button'
import { DeleteAccountForm } from '@/components/family/DeleteAccountForm'
import { fill } from '@/modules/localisation'
import { getTranslations } from '@/modules/localisation/server'
import { requireFamilyPage } from '@/modules/auth/guards'
import { getEnv } from '@/env'

export const metadata: Metadata = { title: 'Data export and deletion' }

export default async function DataSettingsPage() {
  const [{ locale, d }] = await Promise.all([getTranslations(), requireFamilyPage('/settings/data')])
  const graceDays = getEnv().RETENTION_DELETION_GRACE_DAYS

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">{d.settings.privacySection}</h1>
      </header>

      <Card>
        <CardHeader title={d.settings.exportTitle} description={d.settings.exportBody} />
        {/*
          A plain anchor, not a Next.js <Link>: this URL streams a file rather
          than rendering a route, and routing it through the client router would
          leave the router waiting for a navigation that never happens.
        */}
        <a
          href="/api/family/export"
          download
          className={buttonClassName('secondary')}
        >
          {d.settings.exportButton}
        </a>
        <p className="mt-3 text-xs text-ink-muted">
          {locale === 'nl'
            ? 'Het bestand bevat geen foto’s zelf; die staan er als lijst in met id, type en grootte.'
            : 'The file does not embed photographs; they are listed by id, type and size.'}
        </p>
      </Card>

      <Card className="border-danger-500/30">
        <CardHeader title={d.settings.deleteTitle} />
        <Callout tone="warning">{fill(d.settings.deleteBody, { days: graceDays })}</Callout>
        <div className="mt-5">
          <DeleteAccountForm
            labels={{
              confirmLabel: d.settings.deleteConfirmLabel,
              confirmError: d.settings.deleteConfirmError,
              button: d.settings.deleteButton,
              saving: d.common.saving,
            }}
          />
        </div>
      </Card>
    </div>
  )
}
