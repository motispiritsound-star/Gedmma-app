import { notFound } from 'next/navigation';
import { pauseReasons, translate } from '@focusfamily/domain';
import { api } from '@/lib/api';
import { getSiteText } from '@/lib/i18n';
import { requireFamilyMe } from '@/lib/session';
import { FocusTimer } from '@/components/FocusTimer';

interface SchedulesResponse {
  schedules: Array<{
    id: string;
    title: string;
    durationMinutes: number;
    participantIds: string[];
  }>;
}

export default async function FocusSessionPage({
  params,
}: {
  params: Promise<{ scheduleId: string }>;
}) {
  const { scheduleId } = await params;
  const { locale } = await getSiteText();
  await requireFamilyMe();

  const schedulesResult = await api.get<SchedulesResponse>('/focus/schedules');
  const schedule = schedulesResult.data?.schedules.find((item) => item.id === scheduleId);
  if (!schedule) notFound();

  // One session per schedule per day, so reopening the page rejoins rather
  // than starting a second timer.
  const clientSessionId = `${scheduleId}-${new Date().toISOString().slice(0, 10)}`;
  const started = await api.post<{ session: { id: string } }>('/focus/sessions', {
    scheduleId,
    participantIds: schedule.participantIds,
    plannedMinutes: schedule.durationMinutes,
    clientSessionId,
  });

  if (!started.ok || !started.data) {
    return (
      <p className="notice notice--warm" role="alert">
        {translate(locale, started.error?.messageKey ?? 'error.unexpected')}
      </p>
    );
  }

  return (
    <FocusTimer
      sessionId={started.data.session.id}
      plannedMinutes={schedule.durationMinutes}
      title={schedule.title}
      syncUrl={`/api/focus/${encodeURIComponent(started.data.session.id)}/sync`}
      labels={{
        start: translate(locale, 'focus.start'),
        pause: translate(locale, 'focus.pause'),
        resume: translate(locale, 'focus.resume'),
        complete: translate(locale, 'focus.complete'),
        abandon: translate(locale, 'focus.abandon'),
        offlineNote: translate(locale, 'focus.offline_note'),
        pausePrompt: translate(locale, 'focus.pause.prompt'),
        reasons: pauseReasons.map((reason) => ({
          value: reason,
          label: translate(locale, `focus.pause.${reason}`),
        })),
        focused: locale === 'nl' ? 'Gefocust' : 'Focused',
        paused: locale === 'nl' ? 'Gepauzeerd' : 'Paused',
        offlineQueued:
          locale === 'nl' ? 'Wacht op verbinding' : 'Waiting for a connection',
        synced: locale === 'nl' ? 'Bijgewerkt' : 'Synced',
      }}
    />
  );
}
