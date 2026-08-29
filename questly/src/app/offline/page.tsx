import type { Metadata } from 'next'
import { Logo } from '@/components/layout/Logo'
import { getTranslations } from '@/modules/localisation/server'

export const metadata: Metadata = { title: 'Offline', robots: { index: false } }

/** Shown by the service worker when a page is requested with no connection. */
export default async function OfflinePage() {
  const { locale, d } = await getTranslations()
  return (
    <main id="main" className="q-topo flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      <Logo size={44} />
      <h1 className="text-2xl font-semibold">
        {locale === 'nl' ? 'Je bent offline' : 'You are offline'}
      </h1>
      <p className="q-prose text-ink-soft">
        {locale === 'nl'
          ? 'Een actief avontuur blijft leesbaar zonder verbinding. Zodra je weer online bent, gaat de rest van Questly gewoon verder.'
          : 'An adventure you already opened stays readable without a connection. The rest of Questly picks up again as soon as you are back online.'}
      </p>
      <p className="text-sm text-ink-muted">{d.adventure.honestNote}</p>
    </main>
  )
}
