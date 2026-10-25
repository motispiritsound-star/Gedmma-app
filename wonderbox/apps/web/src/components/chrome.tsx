import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Actor } from '../lib/auth/session.ts';
import { OPS_ROLES, STUDIO_ROLES } from '../lib/auth/roles.ts';
import type { Translate } from '../lib/i18n/dictionary.ts';
import type { Locale } from '../lib/i18n/locale.ts';

/**
 * The application shell. The navigation is built from the actor's roles, so a
 * content editor never even sees a link to a family's orders.
 */
export function Chrome({
  actor,
  locale,
  t,
  children,
}: {
  actor: Actor | null;
  locale: Locale;
  t: Translate;
  children: ReactNode;
}) {
  const roles = actor?.roles ?? [];
  const showStudio = roles.some((role) => STUDIO_ROLES.includes(role));
  const showOps = roles.some((role) => OPS_ROLES.includes(role));
  const isParent = roles.includes('PARENT') || roles.includes('ADMIN');

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="sr-only-focusable absolute z-50 m-2 rounded bg-white px-3 py-2">
        {locale === 'nl' ? 'Naar de inhoud' : 'Skip to content'}
      </a>
      <header className="border-b border-[var(--color-line)] bg-[var(--color-card)]">
        <nav
          aria-label={locale === 'nl' ? 'Hoofdnavigatie' : 'Main navigation'}
          className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3"
        >
          <Link href="/" className="text-lg font-bold tracking-tight">
            {t('app.name')}
          </Link>
          <Link href="/boxes" className="text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
            {t('nav.boxes')}
          </Link>
          {isParent ? (
            <>
              <Link href="/play" className="text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                {t('nav.play')}
              </Link>
              <Link href="/account" className="text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                {t('nav.account')}
              </Link>
            </>
          ) : null}
          {showStudio ? (
            <Link href="/studio" className="text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
              {t('nav.studio')}
            </Link>
          ) : null}
          {showOps ? (
            <Link href="/ops" className="text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
              {t('nav.ops')}
            </Link>
          ) : null}

          <div className="ms-auto flex items-center gap-3">
            <LocaleSwitch current={locale} />
            {actor ? (
              <form action="/api/auth/logout" method="post">
                <button type="submit" className="text-sm font-medium underline">
                  {t('nav.logout')}
                </button>
              </form>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium underline">
                  {t('nav.login')}
                </Link>
                <Link href="/signup" className="wb-button wb-button-primary text-sm">
                  {t('nav.signup')}
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-[var(--color-line)] bg-[var(--color-card)] py-6 text-sm text-[var(--color-ink-soft)]">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2 px-4">
          <span>© {new Date().getFullYear()} WonderBox</span>
          <Link href="/support" className="underline">
            {t('nav.support')}
          </Link>
          <Link href="/privacy" className="underline">
            {locale === 'nl' ? 'Privacy' : 'Privacy'}
          </Link>
          <span className="ms-auto">
            {locale === 'nl'
              ? 'Geen advertenties. Geen profielen. Geen opnames van je kind.'
              : 'No ads. No profiles. No recordings of your child.'}
          </span>
        </div>
      </footer>
    </div>
  );
}

function LocaleSwitch({ current }: { current: Locale }) {
  return (
    <form action="/api/locale" method="post" className="flex items-center gap-1">
      <label htmlFor="locale" className="sr-only-focusable absolute">
        Taal / Language
      </label>
      <select
        id="locale"
        name="locale"
        defaultValue={current}
        className="rounded border border-[var(--color-line)] bg-transparent px-2 py-1 text-sm"
      >
        <option value="nl">Nederlands</option>
        <option value="en">English</option>
      </select>
      <button type="submit" className="text-sm underline">
        OK
      </button>
    </form>
  );
}
