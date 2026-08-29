import { notFound, redirect } from 'next/navigation';
import { isLocale, translator } from '@/lib/i18n';
import { viewerContext } from '@/lib/auth/context';
import { listNotifications } from '@/modules/notifications/service';
import { markNotificationsReadAction } from '@/app/actions/guardian';
import { Badge, EmptyState, PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = translator(locale);

  const { user } = await viewerContext();
  if (!user) redirect(`/${locale}/auth/login`);

  const notifications = await listNotifications(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('notifications.title')}
        action={
          notifications.some((n) => !n.readAt) ? (
            <form action={markNotificationsReadAction}>
              <button type="submit" className="btn-secondary">
                {t('notifications.markRead')}
              </button>
            </form>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState>{t('notifications.empty')}</EmptyState>
      ) : (
        <ul className="space-y-3">
          {notifications.map((notification) => (
            <li key={notification.id} className={`card p-4 ${notification.readAt ? '' : 'border-brand-300'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-medium">{locale === 'nl' ? notification.titleNl : notification.titleEn}</h2>
                <Badge tone={notification.readAt ? 'neutral' : 'info'}>{notification.category}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-700">{locale === 'nl' ? notification.bodyNl : notification.bodyEn}</p>
              <p className="mt-2 text-xs text-slate-400">
                {new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(
                  notification.createdAt,
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
