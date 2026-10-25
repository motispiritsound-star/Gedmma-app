import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Chrome } from '../components/chrome.tsx';
import { currentActor } from '../lib/auth/session.ts';
import { requestTranslator } from '../lib/ui/locale.ts';

export const metadata: Metadata = {
  title: 'WonderBox',
  description:
    'Maandelijkse ontdekdozen voor kinderen van 5 tot 12, met een schermloos audiomaatje.',
  manifest: '/manifest.webmanifest',
  applicationName: 'WonderBox',
  // No third-party analytics, no social pixels. There is nothing to declare.
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4c5fd5',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const actor = await currentActor();
  const { locale, t } = await requestTranslator();

  return (
    <html lang={locale}>
      <body>
        <Chrome actor={actor} locale={locale} t={t}>
          {children}
        </Chrome>
      </body>
    </html>
  );
}
