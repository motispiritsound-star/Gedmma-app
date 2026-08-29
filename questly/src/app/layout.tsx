import type { Metadata, Viewport } from 'next'
import { getTranslations } from '@/modules/localisation/server'
import { RegisterServiceWorker } from '@/components/RegisterServiceWorker'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Questly - real adventures for families',
    template: '%s · Questly',
  },
  description:
    'Questly gives families a library of educational missions to do away from the screen. Choose an adventure, put the device away, and experience something real.',
  applicationName: 'Questly',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Questly', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#1f6f5c',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, d } = await getTranslations()

  return (
    <html lang={locale}>
      <body>
        <a href="#main" className="q-skip-link">
          {d.common.skipToContent}
        </a>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  )
}
