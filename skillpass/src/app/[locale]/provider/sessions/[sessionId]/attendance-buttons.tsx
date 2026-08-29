'use client';

import { useActionState } from 'react';
import { attendanceAction } from '@/app/actions/provider';
import type { ActionState } from '@/app/actions/guardian';
import { translator, type Locale } from '@/lib/i18n';

export function AttendanceButtons({ locale, bookingId }: { locale: Locale; bookingId: string }) {
  const t = translator(locale);
  const [state, action, pending] = useActionState<ActionState, FormData>(attendanceAction, {});

  return (
    <form action={action} className="flex flex-wrap gap-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <button type="submit" name="status" value="ATTENDED" className="btn-primary" disabled={pending} data-testid="mark-attended">
        {locale === 'nl' ? 'Aanwezig' : 'Attended'}
      </button>
      <button type="submit" name="status" value="ABSENT" className="btn-secondary" disabled={pending}>
        {locale === 'nl' ? 'Afwezig' : 'Absent'}
      </button>
      {state.error ? (
        <p role="alert" className="w-full text-right text-xs text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? <span className="sr-only">{t('common.save')}</span> : null}
    </form>
  );
}
