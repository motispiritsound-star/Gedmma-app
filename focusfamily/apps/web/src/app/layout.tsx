import type { Metadata } from 'next';
import Link from 'next/link';
import { FORBIDDEN_CAPABILITIES } from '@focusfamily/domain';
import { LocaleSwitch } from '@/components/LocaleSwitch';
import { getSiteText } from '@/lib/i18n';
import { isSignedIn } from '@/lib/api';
import './globals.css';

export const metadata: Metadata = {
  title: 'FocusFamily',
  description:
    'Gezamenlijke digitale balans voor gezinnen. Afspraken in plaats van controle. / Collaborative digital wellbeing for families.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { s, locale } = await getSiteText();
  const signedIn = await isSignedIn();

  return (
    <html lang={locale}>
      <body>
        <a className="skip-link" href="#main">
          {s('nav.skip')}
        </a>
        <div className="shell">
          <header className="masthead">
            <div className="container masthead__inner">
              <Link className="brand" href="/">
                <span className="brand__mark" aria-hidden="true">
                  FF
                </span>
                FocusFamily
              </Link>
              <nav aria-label={locale === 'nl' ? 'Hoofdmenu' : 'Main'}>
                <ul>
                  <li>
                    <Link href="/">{s('nav.home')}</Link>
                  </li>
                  <li>
                    <Link href="/education">{s('nav.education')}</Link>
                  </li>
                  <li>
                    <Link href="/pricing">{s('nav.pricing')}</Link>
                  </li>
                  <li>
                    <Link href="/privacy">{s('nav.privacy')}</Link>
                  </li>
                  <li>
                    <Link href={signedIn ? '/app' : '/signin'}>
                      {signedIn ? s('nav.app') : s('nav.signin')}
                    </Link>
                  </li>
                </ul>
              </nav>
              <LocaleSwitch locale={locale} label={s('nav.language')} />
            </div>
          </header>

          <main id="main" tabIndex={-1}>
            <div className="container">{children}</div>
          </main>

          <footer className="site-footer">
            <div className="container">
              <p>
                {locale === 'nl'
                  ? 'FocusFamily is een hulpmiddel voor afspraken in een gezin. Het is geen zorgverlener en geeft geen medisch advies.'
                  : 'FocusFamily is a tool for making agreements in a family. It is not a care provider and gives no medical advice.'}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-faint)' }}>
                {locale === 'nl' ? 'Nooit: ' : 'Never: '}
                {FORBIDDEN_CAPABILITIES.slice(0, 6).join(' · ')}
                {' · '}
                <Link href="/privacy">
                  {locale === 'nl' ? 'de volledige lijst' : 'the full list'}
                </Link>
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
