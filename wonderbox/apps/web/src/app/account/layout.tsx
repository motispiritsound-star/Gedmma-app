import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentActor } from '../../lib/auth/session.ts';
import { can } from '../../lib/auth/roles.ts';
import { requestTranslator } from '../../lib/ui/locale.ts';

/** Everything under /account requires a parent with a family. */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const actor = await currentActor();
  if (!actor) redirect(`/login?next=${encodeURIComponent('/account')}`);
  if (!can(actor.roles, 'family.read') || !actor.familyId) redirect('/');

  const { t } = await requestTranslator();
  const links: [string, string][] = [
    ['/account', t('account.title')],
    ['/account/subscription', t('account.subscription')],
    ['/account/orders', t('account.orders')],
    ['/account/invoices', t('account.invoices')],
    ['/account/children', t('account.children')],
    ['/account/addresses', t('account.addresses')],
    ['/account/activate', t('account.activate')],
    ['/account/summary', t('account.summary')],
    ['/account/privacy', t('account.privacy')],
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
      <nav aria-label={t('account.title')}>
        <ul className="space-y-1">
          {links.map(([href, label]) => (
            <li key={href}>
              <Link
                href={href}
                className="block rounded px-3 py-2 text-sm font-medium hover:bg-[var(--color-brand-soft)]"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div>{children}</div>
    </div>
  );
}
