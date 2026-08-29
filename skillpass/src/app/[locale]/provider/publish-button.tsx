'use client';

import { useActionState } from 'react';
import { publishActivityAction } from '@/app/actions/provider';
import type { ActionState } from '@/app/actions/guardian';
import type { Locale } from '@/lib/i18n';

export function PublishButton({
  locale,
  activityId,
  published,
  disabled,
}: {
  locale: Locale;
  activityId: string;
  published: boolean;
  disabled: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(publishActivityAction, {});
  const nl = locale === 'nl';

  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="activityId" value={activityId} />
      <input type="hidden" name="intent" value={published ? 'unpublish' : 'publish'} />
      <button type="submit" className="btn-secondary" disabled={pending || disabled}>
        {published ? (nl ? 'Offline halen' : 'Unpublish') : nl ? 'Publiceren' : 'Publish'}
      </button>
      {state.error ? (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
