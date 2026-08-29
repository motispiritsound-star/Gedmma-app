'use client';

import { useActionState } from 'react';
import { adjustCreditsAction, refundAction } from '@/app/actions/admin';
import type { ActionState } from '@/app/actions/guardian';
import type { Locale } from '@/lib/i18n';

export function RefundForm({
  locale,
  paymentId,
  maxCents,
  familyId,
}: {
  locale: Locale;
  paymentId: string;
  maxCents: number;
  familyId: string;
}) {
  const [refundState, refund, refunding] = useActionState<ActionState, FormData>(refundAction, {});
  const [creditState, adjust, adjusting] = useActionState<ActionState, FormData>(adjustCreditsAction, {});
  const nl = locale === 'nl';

  return (
    <div className="space-y-2 text-sm">
      <form action={refund} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="paymentId" value={paymentId} />
        <div>
          <label className="label" htmlFor={`amount-${paymentId}`}>
            {nl ? 'Bedrag (centen)' : 'Amount (cents)'}
          </label>
          <input
            id={`amount-${paymentId}`}
            name="amountCents"
            type="number"
            min={1}
            max={maxCents}
            defaultValue={maxCents}
            className="field w-32"
          />
        </div>
        <div>
          <label className="label" htmlFor={`reason-${paymentId}`}>
            {nl ? 'Reden' : 'Reason'}
          </label>
          <input id={`reason-${paymentId}`} name="reason" className="field w-48" defaultValue="goodwill" />
        </div>
        <button type="submit" className="btn-secondary" disabled={refunding || maxCents <= 0}>
          {nl ? 'Terugbetalen' : 'Refund'}
        </button>
      </form>
      {refundState.error ? <p role="alert" className="text-xs text-red-700">{refundState.error}</p> : null}

      {familyId ? (
        <form action={adjust} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="familyId" value={familyId} />
          <div>
            <label className="label" htmlFor={`delta-${paymentId}`}>
              {nl ? 'Credits bijstellen' : 'Adjust credits'}
            </label>
            <input id={`delta-${paymentId}`} name="delta" type="number" defaultValue={2} className="field w-24" />
          </div>
          <input type="hidden" name="reason" value="goodwill adjustment" />
          <button type="submit" className="btn-secondary" disabled={adjusting}>
            {nl ? 'Toepassen' : 'Apply'}
          </button>
        </form>
      ) : null}
      {creditState.error ? <p role="alert" className="text-xs text-red-700">{creditState.error}</p> : null}
    </div>
  );
}
