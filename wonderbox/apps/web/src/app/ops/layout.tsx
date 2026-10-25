import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentActor } from '../../lib/auth/session.ts';
import { OPS_ROLES } from '../../lib/auth/roles.ts';
import { requestTranslator } from '../../lib/ui/locale.ts';

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const actor = await currentActor();
  if (!actor) redirect(`/login?next=${encodeURIComponent('/ops')}`);
  if (!actor.roles.some((role) => OPS_ROLES.includes(role))) redirect('/');

  const { locale, t } = await requestTranslator();
  const links: [string, string][] = [
    ['/ops', t('ops.title')],
    ['/ops/inventory', t('ops.inventory')],
    ['/ops/costing', locale === 'nl' ? 'Kostprijs en marge' : 'Cost and margin'],
    ['/ops/purchasing', locale === 'nl' ? 'Inkoop' : 'Purchasing'],
    ['/ops/orders', t('ops.orders')],
    ['/ops/shipments', t('ops.shipments')],
    ['/ops/codes', t('ops.codes')],
    ['/ops/renewals', locale === 'nl' ? 'Verlengingen' : 'Renewals'],
    ['/ops/support', t('support.title')],
    ['/ops/jobs', locale === 'nl' ? 'Automatische taken' : 'Scheduled jobs'],
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
      <nav aria-label={t('ops.title')}>
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
