import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  DELETION_GRACE_DAYS,
  NOT_COLLECTED,
  translate,
  type DataSourceKind,
} from '@focusfamily/domain';
import { api } from '@/lib/api';
import { getSiteText } from '@/lib/i18n';
import { may, requireFamilyMe } from '@/lib/session';
import { SourceLabel } from '@/components/SourceLabel';

interface ConsentResponse {
  subjectUserId: string;
  ageBand: string;
  states: Array<{
    scope: string;
    effective: boolean;
    guardianGranted: boolean;
    subjectGranted: boolean;
    reasonKey: string;
    assentRequired: boolean;
    statementKey: string;
  }>;
  history: Array<{
    id: string;
    scope: string;
    decision: string;
    actorUserId: string;
    statementKey: string;
    statementVersion: string;
    recordedAt: string;
  }>;
}

interface FamilyResponse {
  members: Array<{ userId: string; displayName: string; role: string }>;
  measurements: Array<{
    id: string;
    userId: string | null;
    provider: string;
    enabled: boolean;
    label: { kind: DataSourceKind; confidence: string };
  }>;
}

interface DeletionResponse {
  requests: Array<{ id: string; scope: string; status: string; executeAfter: string }>;
  graceDays: number;
}

/**
 * Send the result of a server action back to the page as a query parameter.
 * A refusal here - "this measurement needs the young person's own yes" - is
 * the product working, so it has to be visible rather than swallowed.
 */
function reportBack(
  subject: string,
  ok: boolean,
  messageKey: string | undefined,
  successKey = 'action.saved',
): string {
  const params = new URLSearchParams({ subject });
  params.set(ok ? 'notice' : 'problem', ok ? successKey : (messageKey ?? 'error.unexpected'));
  return `/app/data?${params.toString()}`;
}

interface ExportListResponse {
  requests: Array<{
    id: string;
    scope: string;
    status: string;
    requestedAt: string;
    expiresAt: string | null;
    expired: boolean;
  }>;
}

export default async function DataPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; notice?: string; problem?: string }>;
}) {
  const { locale } = await getSiteText();
  const me = await requireFamilyMe();
  const params = await searchParams;
  const subject = params.subject ?? me.user.id;

  const [consentResult, familyResult, deletionResult, exportResult] = await Promise.all([
    api.get<ConsentResponse>(`/consent?subjectUserId=${encodeURIComponent(subject)}`),
    api.get<FamilyResponse>('/family'),
    api.get<DeletionResponse>('/account/deletion'),
    api.get<ExportListResponse>('/account/export'),
  ]);
  const nl = locale === 'nl';
  const members = familyResult.data?.members ?? [];

  async function decide(formData: FormData): Promise<void> {
    'use server';
    const subjectUserId = String(formData.get('subjectUserId'));
    const result = await api.post('/consent', {
      subjectUserId,
      scope: String(formData.get('scope')),
      decision: String(formData.get('decision')),
    });
    revalidatePath('/app/data');
    redirect(reportBack(subjectUserId, result.ok, result.error?.messageKey));
  }

  async function toggleMeasurement(formData: FormData): Promise<void> {
    'use server';
    const result = await api.patch('/measurements', {
      sourceId: String(formData.get('sourceId')),
      enabled: formData.get('enabled') === 'true',
    });
    revalidatePath('/app/data');
    // A refusal here is the point of the product, not an edge case: say why.
    redirect(reportBack(String(formData.get('subjectUserId') ?? me.user.id), result.ok, result.error?.messageKey));
  }

  async function requestExport(formData: FormData): Promise<void> {
    'use server';
    const result = await api.post('/account/export', {
      scope: String(formData.get('scope') ?? 'self'),
    });
    revalidatePath('/app/data');
    redirect(reportBack(subject, result.ok, result.error?.messageKey, 'rights.export.ready'));
  }

  async function requestDeletion(formData: FormData): Promise<void> {
    'use server';
    await api.post('/account/deletion', { scope: String(formData.get('scope') ?? 'self') });
    revalidatePath('/app/data');
  }

  async function cancelDeletion(formData: FormData): Promise<void> {
    'use server';
    await api.delete(`/account/deletion/${String(formData.get('id'))}`);
    revalidatePath('/app/data');
  }

  return (
    <div className="stack-lg" style={{ maxWidth: '54rem' }}>
      <section className="stack">
        <h1>{nl ? 'Gegevens en toestemming' : 'Data and consent'}</h1>
        <p style={{ color: 'var(--ink-soft)' }}>
          {nl
            ? 'Elk gezinslid ziet dit scherm voor zichzelf. Volwassenen kunnen bovendien de toestemming van een kind bekijken - en het kind ziet dat ook.'
            : 'Every family member sees this screen for themselves. Grown-ups can also view a child’s consent - and the child sees that too.'}
        </p>
        {params.problem ? (
          <p className="notice notice--warm" role="alert">
            {translate(locale, params.problem)}
          </p>
        ) : null}
        {params.notice ? (
          <p className="notice notice--good" role="status">
            {translate(locale, params.notice)}
          </p>
        ) : null}
      </section>

      {members.length > 1 ? (
        <nav aria-label={nl ? 'Kies een gezinslid' : 'Choose a family member'}>
          <ul style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', listStyle: 'none', padding: 0 }}>
            {members.map((member) => (
              <li key={member.userId}>
                <a
                  className="btn btn--secondary"
                  style={{ minHeight: '38px', padding: '4px 14px' }}
                  href={`/app/data?subject=${encodeURIComponent(member.userId)}`}
                  aria-current={member.userId === subject ? 'page' : undefined}
                >
                  {member.displayName}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <section className="stack">
        <h2>{nl ? 'Waar is toestemming voor gegeven?' : 'What has been agreed to?'}</h2>
        <ul className="list-plain stack">
          {(consentResult.data?.states ?? []).map((state) => (
            <li key={state.scope} className="card stack">
              <div style={{ display: 'flex', gap: '12px', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <strong>
                  <code style={{ fontSize: '0.9rem' }}>{state.scope}</code>
                </strong>
                <span className={state.effective ? 'badge' : 'badge badge--quiet'}>
                  {state.effective ? (nl ? 'Actief' : 'Active') : nl ? 'Niet actief' : 'Not active'}
                </span>
                {state.assentRequired ? (
                  <span className="badge badge--quiet">
                    {nl ? 'Kind moet ook ja zeggen' : 'The young person must agree too'}
                  </span>
                ) : null}
              </div>
              <p style={{ marginBottom: 0 }}>{translate(locale, state.statementKey)}</p>
              <p style={{ marginBottom: 0, color: 'var(--ink-soft)', fontSize: '0.9rem' }}>
                {translate(locale, state.reasonKey)}
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(subject === me.user.id || (me.membership.role === 'guardian' && may(me, 'consent.grant'))) &&
                state.scope !== 'account.basic' ? (
                  <>
                    <form action={decide}>
                      <input type="hidden" name="subjectUserId" value={subject} />
                      <input type="hidden" name="scope" value={state.scope} />
                      <input type="hidden" name="decision" value="granted" />
                      <button className="btn btn--secondary" type="submit" style={{ minHeight: '38px' }}>
                        {nl ? 'Ja, dat mag' : 'Yes, that is fine'}
                      </button>
                    </form>
                    <form action={decide}>
                      <input type="hidden" name="subjectUserId" value={subject} />
                      <input type="hidden" name="scope" value={state.scope} />
                      <input type="hidden" name="decision" value="withdrawn" />
                      <button className="btn btn--secondary" type="submit" style={{ minHeight: '38px' }}>
                        {nl ? 'Intrekken' : 'Withdraw'}
                      </button>
                    </form>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        <p className="notice">{translate(locale, 'consent.withdraw.hint')}</p>
      </section>

      <section className="stack">
        <h2>{nl ? 'Metingen aan- en uitzetten' : 'Turning measurements on and off'}</h2>
        <ul className="list-plain stack">
          {(familyResult.data?.measurements ?? []).map((source) => {
            const about = members.find((member) => member.userId === source.userId);
            return (
              <li key={source.id} className="card">
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ flex: '1 1 220px' }}>
                    <strong>{about?.displayName ?? (nl ? 'Hele gezin' : 'Whole family')}</strong>
                    <div>
                      <code style={{ fontSize: '0.85rem', color: 'var(--ink-faint)' }}>
                        {source.provider}
                      </code>
                    </div>
                    <SourceLabel
                      kind={source.label.kind}
                      confidence={source.label.confidence}
                      locale={locale}
                    />
                  </div>
                  {may(me, 'measurement.enable') ? (
                    <form action={toggleMeasurement}>
                      <input type="hidden" name="sourceId" value={source.id} />
                      <input type="hidden" name="subjectUserId" value={source.userId ?? subject} />
                      <input type="hidden" name="enabled" value={source.enabled ? 'false' : 'true'} />
                      <button className="btn btn--secondary" type="submit" style={{ minHeight: '38px' }}>
                        {source.enabled ? (nl ? 'Uitzetten' : 'Turn off') : nl ? 'Aanzetten' : 'Turn on'}
                      </button>
                    </form>
                  ) : (
                    <span className={source.enabled ? 'badge' : 'badge badge--quiet'}>
                      {source.enabled ? (nl ? 'Aan' : 'On') : nl ? 'Uit' : 'Off'}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="stack">
        <h2>{translate(locale, 'rights.consent_history.title')}</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">{nl ? 'Wanneer' : 'When'}</th>
                <th scope="col">{nl ? 'Onderdeel' : 'Area'}</th>
                <th scope="col">{nl ? 'Besluit' : 'Decision'}</th>
                <th scope="col">{nl ? 'Door wie' : 'By whom'}</th>
                <th scope="col">{nl ? 'Wat er stond' : 'What it said'}</th>
              </tr>
            </thead>
            <tbody>
              {(consentResult.data?.history ?? []).map((entry) => (
                <tr key={entry.id}>
                  <td>
                    {new Date(entry.recordedAt).toLocaleDateString(
                      locale === 'nl' ? 'nl-NL' : 'en-GB',
                    )}
                  </td>
                  <td>
                    <code style={{ fontSize: '0.85rem' }}>{entry.scope}</code>
                  </td>
                  <td>{entry.decision}</td>
                  <td>
                    {members.find((member) => member.userId === entry.actorUserId)?.displayName ??
                      entry.actorUserId}
                  </td>
                  <td style={{ color: 'var(--ink-soft)' }}>
                    {translate(locale, entry.statementKey)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="stack">
        <h2>{translate(locale, 'rights.not_collected.title')}</h2>
        <ul className="list-plain grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
          {NOT_COLLECTED.map((item) => (
            <li key={item} className="card card--quiet" style={{ padding: '10px 14px' }}>
              <code style={{ fontSize: '0.85rem' }}>{item}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid">
        <form action={requestExport} className="card stack">
          <h2 style={{ fontSize: '1.1rem' }}>{translate(locale, 'rights.export.title')}</h2>
          <p style={{ color: 'var(--ink-soft)' }}>{translate(locale, 'rights.export.body')}</p>
          <div className="field">
            <label htmlFor="export-scope">{nl ? 'Wat wil je meenemen?' : 'What do you want?'}</label>
            <select id="export-scope" name="scope" defaultValue="self">
              <option value="self">{nl ? 'Alleen mijn eigen gegevens' : 'Only my own data'}</option>
              {me.membership.role === 'guardian' ? (
                <option value="family">{nl ? 'Het hele gezin' : 'The whole family'}</option>
              ) : null}
            </select>
          </div>
          <button className="btn" type="submit">
            {nl ? 'Export aanvragen' : 'Request export'}
          </button>

          {(exportResult.data?.requests ?? []).length > 0 ? (
            <ul className="list-plain" style={{ marginTop: '8px' }}>
              {(exportResult.data?.requests ?? []).slice(0, 3).map((request) => (
                <li key={request.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>
                    {new Date(request.requestedAt).toLocaleDateString(
                      locale === 'nl' ? 'nl-NL' : 'en-GB',
                    )}{' '}
                    · {request.scope}
                  </span>
                  {request.expired ? (
                    <span className="badge badge--quiet">
                      {nl ? 'Verlopen' : 'Expired'}
                    </span>
                  ) : (
                    <a
                      className="btn btn--secondary"
                      style={{ minHeight: '36px', padding: '4px 14px' }}
                      href={`/api/export/${request.id}`}
                    >
                      {translate(locale, 'rights.export.download')}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </form>

        <form action={requestDeletion} className="card stack">
          <h2 style={{ fontSize: '1.1rem' }}>{translate(locale, 'rights.deletion.title')}</h2>
          <p style={{ color: 'var(--ink-soft)' }}>{translate(locale, 'rights.deletion.body')}</p>
          <div className="field">
            <label htmlFor="deletion-scope">{nl ? 'Wat wil je verwijderen?' : 'What do you want deleted?'}</label>
            <select id="deletion-scope" name="scope" defaultValue="self">
              <option value="self">{nl ? 'Mijn eigen account' : 'My own account'}</option>
              {me.membership.role === 'guardian' ? (
                <option value="family">{nl ? 'Het hele gezinsaccount' : 'The whole family account'}</option>
              ) : null}
            </select>
          </div>
          <button className="btn btn--secondary" type="submit">
            {nl ? `Verwijderen over ${DELETION_GRACE_DAYS} dagen` : `Delete in ${DELETION_GRACE_DAYS} days`}
          </button>
        </form>
      </section>

      {(deletionResult.data?.requests ?? []).filter((request) => request.status === 'scheduled')
        .length > 0 ? (
        <section className="stack">
          <h2>{nl ? 'Gepland om te verwijderen' : 'Scheduled for deletion'}</h2>
          <ul className="list-plain stack">
            {(deletionResult.data?.requests ?? [])
              .filter((request) => request.status === 'scheduled')
              .map((request) => (
                <li key={request.id} className="notice notice--warm">
                  <p>
                    {translate(locale, 'rights.deletion.scheduled')} ({request.scope},{' '}
                    {new Date(request.executeAfter).toLocaleDateString(
                      locale === 'nl' ? 'nl-NL' : 'en-GB',
                    )}
                    )
                  </p>
                  <form action={cancelDeletion}>
                    <input type="hidden" name="id" value={request.id} />
                    <button className="btn btn--secondary" type="submit">
                      {nl ? 'Toch niet verwijderen' : 'Do not delete after all'}
                    </button>
                  </form>
                </li>
              ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
