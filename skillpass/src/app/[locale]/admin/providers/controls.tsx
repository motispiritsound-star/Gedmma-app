'use client';

import { useActionState } from 'react';
import { decideVerificationAction, providerDecisionAction } from '@/app/actions/admin';
import type { ActionState } from '@/app/actions/guardian';
import { translator, type Locale } from '@/lib/i18n';

interface VerificationRow {
  id: string;
  documentType: string;
  reference: string | null;
  decision: string;
}

export function VerificationControls({
  locale,
  providerId,
  verifications,
}: {
  locale: Locale;
  providerId: string;
  verifications: VerificationRow[];
}) {
  const t = translator(locale);
  const [itemState, decideItem, decidingItem] = useActionState<ActionState, FormData>(decideVerificationAction, {});
  const [providerState, decideProvider, decidingProvider] = useActionState<ActionState, FormData>(providerDecisionAction, {});

  return (
    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
      <ul className="space-y-2">
        {verifications.map((verification) => (
          <li key={verification.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>
              <span className="font-medium">{verification.documentType}</span>{' '}
              <span className="text-slate-500">{verification.reference ?? '—'}</span>{' '}
              <span className="text-xs uppercase text-slate-400">{verification.decision}</span>
            </span>
            <form action={decideItem} className="flex gap-2">
              <input type="hidden" name="verificationId" value={verification.id} />
              <input type="hidden" name="note" value="checked manually" />
              <button name="decision" value="APPROVED" className="btn-secondary" disabled={decidingItem}>
                {t('admin.approve')}
              </button>
              <button name="decision" value="MORE_INFO_REQUIRED" className="btn-secondary" disabled={decidingItem}>
                {locale === 'nl' ? 'Meer info' : 'More info'}
              </button>
              <button name="decision" value="REJECTED" className="btn-danger" disabled={decidingItem}>
                {t('admin.reject')}
              </button>
            </form>
          </li>
        ))}
      </ul>
      {itemState.error ? <p role="alert" className="text-sm text-red-700">{itemState.error}</p> : null}

      <form action={decideProvider} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="providerId" value={providerId} />
        <div className="flex-1">
          <label className="label" htmlFor={`note-${providerId}`}>
            {locale === 'nl' ? 'Toelichting' : 'Note'}
          </label>
          <input id={`note-${providerId}`} name="note" className="field" />
        </div>
        <button name="intent" value="approve" className="btn-primary" disabled={decidingProvider} data-testid="approve-provider">
          {t('admin.approve')}
        </button>
        <button name="intent" value="reject" className="btn-danger" disabled={decidingProvider}>
          {t('admin.reject')}
        </button>
      </form>
      {providerState.error ? <p role="alert" className="text-sm text-red-700">{providerState.error}</p> : null}
      {providerState.success ? (
        <p role="status" className="text-sm text-emerald-700">
          {locale === 'nl' ? 'Besluit vastgelegd.' : 'Decision recorded.'}
        </p>
      ) : null}
    </div>
  );
}
