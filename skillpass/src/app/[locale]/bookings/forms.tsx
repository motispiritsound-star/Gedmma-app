'use client';

import { useActionState } from 'react';
import { cancelBookingAction, reviewAction, type ActionState } from '@/app/actions/guardian';
import { translator, type Locale } from '@/lib/i18n';

export function CancelBookingForm({ locale, bookingId }: { locale: Locale; bookingId: string }) {
  const t = translator(locale);
  const [state, action, pending] = useActionState<ActionState, FormData>(cancelBookingAction, {});

  return (
    <form action={action} className="text-right">
      <input type="hidden" name="bookingId" value={bookingId} />
      <button type="submit" className="btn-danger" disabled={pending}>
        {pending ? t('common.loading') : t('booking.cancel')}
      </button>
      {state.error ? (
        <p role="alert" className="mt-1 text-xs text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

export function ReviewForm({ locale, bookingId }: { locale: Locale; bookingId: string }) {
  const t = translator(locale);
  const [state, action, pending] = useActionState<ActionState, FormData>(reviewAction, {});

  if (state.success) {
    return <p role="status" className="text-sm text-emerald-700">{locale === 'nl' ? 'Bedankt voor je beoordeling.' : 'Thank you for your review.'}</p>;
  }

  return (
    <form action={action} className="space-y-3" data-testid="review-form">
      <input type="hidden" name="bookingId" value={bookingId} />
      <h4 className="font-medium">{t('review.title')}</h4>

      {state.error ? (
        <p role="alert" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-4">
        <div>
          <label className="label" htmlFor={`rating-${bookingId}`}>
            {t('review.rating')}
          </label>
          <select id={`rating-${bookingId}`} name="rating" className="field" defaultValue="5">
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {'★'.repeat(value)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="label" htmlFor={`title-${bookingId}`}>
            {locale === 'nl' ? 'Titel' : 'Title'} ({t('common.optional')})
          </label>
          <input id={`title-${bookingId}`} name="title" maxLength={120} className="field" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor={`body-${bookingId}`}>
          {t('review.body')}
        </label>
        <textarea id={`body-${bookingId}`} name="body" rows={3} required minLength={20} className="field" />
        <p className="hint">{t('review.bodyHint')}</p>
      </div>

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? t('common.loading') : t('review.submit')}
      </button>
    </form>
  );
}
