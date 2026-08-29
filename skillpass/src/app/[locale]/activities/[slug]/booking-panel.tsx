'use client';

import { useActionState, useState } from 'react';
import { bookSessionAction, joinWaitlistAction, type ActionState } from '@/app/actions/guardian';
import { translator, type Locale } from '@/lib/i18n';

interface SessionRow {
  id: string;
  startsAt: string;
  seatsLeft: number;
  waitlistCount: number;
}

interface ChildRow {
  id: string;
  nickname: string;
}

export function BookingPanel({
  locale,
  childProfiles,
  sessions,
}: {
  locale: Locale;
  childProfiles: ChildRow[];
  sessions: SessionRow[];
}) {
  const t = translator(locale);
  const [childProfileId, setChildProfileId] = useState(childProfiles[0]?.id ?? '');
  const [bookState, bookAction, booking] = useActionState<ActionState, FormData>(bookSessionAction, {});
  const [waitState, waitAction, waiting] = useActionState<ActionState, FormData>(joinWaitlistAction, {});

  const state = bookState.error || bookState.success ? bookState : waitState;

  return (
    <div className="space-y-3">
      <div>
        <label className="label" htmlFor="childProfileId">
          {t('activity.selectChild')}
        </label>
        <select
          id="childProfileId"
          className="field"
          value={childProfileId}
          onChange={(event) => setChildProfileId(event.target.value)}
        >
          {childProfiles.map((child) => (
            <option key={child.id} value={child.id}>
              {child.nickname}
            </option>
          ))}
        </select>
      </div>

      {state.error ? (
        <p role="alert" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" data-testid="booking-status" className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.success === 'booked' ? t('booking.confirmed') : t('booking.waitlisted', { position: waitState.success ? 1 : 1 })}
        </p>
      ) : null}

      <ul className="space-y-2">
        {sessions.length === 0 ? <li className="text-sm text-slate-500">{t('common.none')}</li> : null}
        {sessions.map((session) => (
          <li key={session.id} className="card flex items-center justify-between gap-3 p-3">
            <div>
              <p className="text-sm font-medium">{session.startsAt}</p>
              <p className="text-xs text-slate-500">
                {session.seatsLeft > 0 ? t('activity.seatsLeft', { count: session.seatsLeft }) : t('activity.full')}
              </p>
            </div>
            {session.seatsLeft > 0 ? (
              <form action={bookAction}>
                <input type="hidden" name="sessionId" value={session.id} />
                <input type="hidden" name="childProfileId" value={childProfileId} />
                <button type="submit" className="btn-primary" disabled={booking}>
                  {booking ? t('common.loading') : t('activity.book')}
                </button>
              </form>
            ) : (
              <form action={waitAction}>
                <input type="hidden" name="sessionId" value={session.id} />
                <input type="hidden" name="childProfileId" value={childProfileId} />
                <button type="submit" className="btn-secondary" disabled={waiting}>
                  {waiting ? t('common.loading') : t('activity.joinWaitlist')}
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
