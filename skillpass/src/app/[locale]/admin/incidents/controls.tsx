'use client';

import { useActionState } from 'react';
import { incidentAction } from '@/app/actions/admin';
import type { ActionState } from '@/app/actions/guardian';
import type { Locale } from '@/lib/i18n';

export function IncidentControls({
  locale,
  incidentId,
  caseId,
  isOfficer,
}: {
  locale: Locale;
  incidentId: string;
  caseId: string | null;
  isOfficer: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(incidentAction, {});
  const nl = locale === 'nl';

  return (
    <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
      <form action={action} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="incidentId" value={incidentId} />
        {caseId ? <input type="hidden" name="caseId" value={caseId} /> : null}
        <div className="flex-1">
          <label className="label" htmlFor={`note-${incidentId}`}>
            {nl ? 'Notitie' : 'Note'}
          </label>
          <input id={`note-${incidentId}`} name="note" className="field" />
        </div>
        {!caseId ? (
          <button name="intent" value="escalate" className="btn-danger" disabled={pending}>
            {nl ? 'Escaleren naar safeguarding' : 'Escalate to safeguarding'}
          </button>
        ) : null}
        <button name="intent" value="resolve" className="btn-secondary" disabled={pending}>
          {nl ? 'Afronden' : 'Resolve'}
        </button>
        {caseId && isOfficer ? (
          <>
            <select name="status" className="field w-44" defaultValue="INVESTIGATING" aria-label={nl ? 'Dossierstatus' : 'Case status'}>
              <option value="OPEN">OPEN</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="REFERRED_TO_AUTHORITY">REFERRED_TO_AUTHORITY</option>
              <option value="CLOSED">CLOSED</option>
            </select>
            <button name="intent" value="case" className="btn-primary" disabled={pending}>
              {nl ? 'Dossier bijwerken' : 'Update case'}
            </button>
          </>
        ) : null}
      </form>
      {state.error ? <p role="alert" className="text-sm text-red-700">{state.error}</p> : null}
      {state.success ? <p role="status" className="text-sm text-emerald-700">{nl ? 'Opgeslagen.' : 'Saved.'}</p> : null}
    </div>
  );
}
