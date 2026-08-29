import { notFound, redirect } from 'next/navigation';
import { isLocale, translator } from '@/lib/i18n';
import { viewerContext } from '@/lib/auth/context';
import { auditTrail } from '@/modules/admin/service';
import { EmptyState, PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function AuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ action?: string }>;
}) {
  const { locale } = await params;
  const { action } = await searchParams;
  if (!isLocale(locale)) notFound();
  const t = translator(locale);

  const { user } = await viewerContext();
  if (!user) redirect(`/${locale}/auth/login`);
  if (user.role !== 'ADMIN' && user.role !== 'SAFEGUARDING_OFFICER') notFound();

  const entries = await auditTrail(user, { action, limit: 150 });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('admin.audit')}
        description={
          locale === 'nl'
            ? 'Het auditlog is append-only: regels kunnen niet worden gewijzigd of verwijderd (afgedwongen door een databasetrigger).'
            : 'The audit log is append-only: rows cannot be changed or deleted (enforced by a database trigger).'
        }
      />

      <form className="flex gap-2" role="search">
        <label className="sr-only" htmlFor="action">
          {t('search.query')}
        </label>
        <input id="action" name="action" defaultValue={action ?? ''} placeholder="booking." className="field max-w-xs" />
        <button type="submit" className="btn-secondary">
          {t('search.apply')}
        </button>
      </form>

      {entries.length === 0 ? (
        <EmptyState>{t('common.none')}</EmptyState>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{t('admin.audit')}</caption>
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-2">{locale === 'nl' ? 'Tijd' : 'Time'}</th>
                <th scope="col" className="px-4 py-2">{locale === 'nl' ? 'Actie' : 'Action'}</th>
                <th scope="col" className="px-4 py-2">{locale === 'nl' ? 'Entiteit' : 'Entity'}</th>
                <th scope="col" className="px-4 py-2">{locale === 'nl' ? 'Actor' : 'Actor'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="whitespace-nowrap px-4 py-2 text-slate-500">
                    {new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-GB', {
                      dateStyle: 'short',
                      timeStyle: 'medium',
                    }).format(entry.createdAt)}
                  </td>
                  <td className="px-4 py-2 font-medium">{entry.action}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {entry.entityType}
                    {entry.entityId ? <span className="text-slate-400"> {entry.entityId.slice(0, 8)}…</span> : null}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{entry.actor?.displayName ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
