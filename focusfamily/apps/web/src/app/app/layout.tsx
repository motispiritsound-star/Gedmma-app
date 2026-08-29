import Link from 'next/link';
import { redirect } from 'next/navigation';
import { adoptCookies, api } from '@/lib/api';
import { getSiteText } from '@/lib/i18n';
import { requireMe, may } from '@/lib/session';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { s, locale } = await getSiteText();
  const me = await requireMe();

  async function signOut(): Promise<void> {
    'use server';
    const result = await api.post('/auth/sign-out');
    await adoptCookies(result.setCookies);
    redirect('/');
  }

  const links: Array<{ href: string; label: string; show: boolean }> = [
    { href: '/app', label: s('app.nav.today'), show: true },
    { href: '/app/agreements', label: s('app.nav.agreements'), show: true },
    { href: '/app/focus', label: s('app.nav.focus'), show: true },
    { href: '/app/checkin', label: s('app.nav.checkin'), show: true },
    { href: '/app/review', label: s('app.nav.review'), show: true },
    { href: '/app/goals', label: s('app.nav.goals'), show: true },
    { href: '/app/activities', label: s('app.nav.activities'), show: true },
    { href: '/app/data', label: s('app.nav.data'), show: true },
    { href: '/app/plan', label: s('app.nav.plan'), show: may(me, 'subscription.read') },
    { href: '/admin', label: s('app.nav.admin'), show: may(me, 'admin.metrics.read') },
  ];

  return (
    <div className="app-layout">
      <nav className="app-nav" aria-label={locale === 'nl' ? 'Appmenu' : 'App menu'}>
        <p className="card__label">
          {me.membership
            ? `${me.membership.familyName} · ${
                me.membership.role === 'guardian'
                  ? locale === 'nl'
                    ? 'volwassene'
                    : 'grown-up'
                  : locale === 'nl'
                    ? 'kind'
                    : 'child'
              }`
            : me.user.displayName}
        </p>
        <ul>
          {links
            .filter((link) => link.show)
            .map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
        </ul>
        <form action={signOut} style={{ marginTop: '16px' }}>
          <button type="submit" className="btn btn--secondary" style={{ width: '100%' }}>
            {s('nav.signout')}
          </button>
        </form>
      </nav>
      <div>{children}</div>
    </div>
  );
}
