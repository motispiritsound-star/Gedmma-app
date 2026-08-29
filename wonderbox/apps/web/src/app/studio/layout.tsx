import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentActor } from '../../lib/auth/session.ts';
import { STUDIO_ROLES } from '../../lib/auth/roles.ts';
import { requestTranslator } from '../../lib/ui/locale.ts';

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const actor = await currentActor();
  if (!actor) redirect(`/login?next=${encodeURIComponent('/studio')}`);
  if (!actor.roles.some((role) => STUDIO_ROLES.includes(role))) redirect('/');

  const { locale, t } = await requestTranslator();
  const links: [string, string][] = [
    ['/studio', t('studio.title')],
    ['/studio/themes', t('studio.themes')],
    ['/studio/approvals', t('studio.approvals')],
    ['/studio/drafts', t('studio.drafts')],
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
      <nav aria-label={t('studio.title')}>
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
        <p className="mt-6 rounded-lg bg-[oklch(95%_0.005_260)] p-3 text-xs text-[var(--color-ink-soft)]">
          {locale === 'nl'
            ? 'Deze rol heeft geen toegang tot gezinnen, adressen of bestellingen. Dat is met opzet.'
            : 'This role has no access to families, addresses or orders. That is deliberate.'}
        </p>
      </nav>
      <div>{children}</div>
    </div>
  );
}
