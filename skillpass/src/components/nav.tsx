import Link from 'next/link';
import type { SessionUser } from '@/lib/auth/session';
import { translator, type Locale } from '@/lib/i18n';
import { logoutAction } from '@/app/actions/auth';

export function SiteHeader({
  locale,
  user,
  unread,
  currentPath,
}: {
  locale: Locale;
  user: SessionUser | null;
  unread: number;
  currentPath: string;
}) {
  const t = translator(locale);
  const other: Locale = locale === 'nl' ? 'en' : 'nl';
  const switchTo = `/${other}${currentPath.replace(/^\/(nl|en)/, '')}`;

  const links: { href: string; label: string }[] = [{ href: `/${locale}/search`, label: t('nav.search') }];
  if (user?.role === 'GUARDIAN') {
    links.push(
      { href: `/${locale}/bookings`, label: t('nav.bookings') },
      { href: `/${locale}/family`, label: t('nav.family') },
      { href: `/${locale}/favourites`, label: t('nav.favourites') },
      { href: `/${locale}/plans`, label: t('nav.plans') },
    );
  }
  if (user?.role === 'PROVIDER_STAFF') links.push({ href: `/${locale}/provider`, label: t('nav.provider') });
  if (user?.role === 'ADMIN' || user?.role === 'SAFEGUARDING_OFFICER') {
    links.push({ href: `/${locale}/admin`, label: t('nav.admin') });
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href={`/${locale}`} className="text-lg font-semibold tracking-tight text-brand-700">
          SkillPass
        </Link>

        <nav aria-label="Main" className="flex flex-1 flex-wrap items-center gap-4 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-slate-700 hover:text-brand-700">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-sm">
          <Link href={switchTo} className="rounded border border-slate-300 px-2 py-1 text-xs uppercase text-slate-600" hrefLang={other}>
            {other}
          </Link>

          {user ? (
            <>
              <Link href={`/${locale}/notifications`} className="text-slate-700 hover:text-brand-700">
                {t('nav.notifications')}
                {unread > 0 ? (
                  <span className="ml-1 rounded-full bg-brand-600 px-1.5 py-0.5 text-xs text-white">{unread}</span>
                ) : null}
              </Link>
              <span className="hidden text-slate-500 sm:inline">{user.displayName}</span>
              <form action={logoutAction}>
                <input type="hidden" name="locale" value={locale} />
                <button type="submit" className="text-slate-600 underline hover:text-brand-700">
                  {t('nav.logout')}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href={`/${locale}/auth/login`} className="text-slate-700 hover:text-brand-700">
                {t('nav.login')}
              </Link>
              <Link href={`/${locale}/auth/register`} className="btn-primary">
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = translator(locale);
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-600">
        <p className="max-w-3xl">{t('safety.noChildContact')}</p>
        <p className="mt-3 text-xs text-slate-500">
          {locale === 'nl'
            ? 'SkillPass MVP — betalingen draaien in test-/mockmodus. Geen echte transacties.'
            : 'SkillPass MVP — payments run in test/mock mode. No real transactions.'}
        </p>
      </div>
    </footer>
  );
}
