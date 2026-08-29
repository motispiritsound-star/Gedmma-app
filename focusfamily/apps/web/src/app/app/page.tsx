import Link from 'next/link';
import { translate, type AgeBand, type DataSourceKind } from '@focusfamily/domain';
import { api } from '@/lib/api';
import { getSiteText } from '@/lib/i18n';
import { requireFamilyMe } from '@/lib/session';
import { SourceLabel } from '@/components/SourceLabel';

interface FamilyResponse {
  family: { id: string; name: string; locale: string; timeZone: string };
  baseline: {
    active: boolean;
    started: boolean;
    dayNumber: number;
    daysRemaining: number;
    messageKey: string;
  };
  members: Array<{ userId: string; displayName: string; role: string; ageBand: AgeBand }>;
  measurements: Array<{
    id: string;
    userId: string | null;
    provider: string;
    enabled: boolean;
    label: { kind: DataSourceKind; confidence: string };
  }>;
}

interface SchedulesResponse {
  schedules: Array<{
    id: string;
    title: string;
    kind: string;
    startsAt: string;
    durationMinutes: number;
    nextOccurrence: string | null;
    includesMe: boolean;
    participantIds: string[];
  }>;
}

export default async function TodayPage() {
  const { locale } = await getSiteText();
  const me = await requireFamilyMe();
  const [familyResult, schedulesResult] = await Promise.all([
    api.get<FamilyResponse>('/family'),
    api.get<SchedulesResponse>('/focus/schedules'),
  ]);

  const family = familyResult.data;
  const schedules = schedulesResult.data?.schedules ?? [];
  const nl = locale === 'nl';
  const next = schedules
    .filter((schedule) => schedule.nextOccurrence)
    .sort((a, b) => (a.nextOccurrence ?? '').localeCompare(b.nextOccurrence ?? ''))[0];

  return (
    <div className="stack-lg">
      <section className="stack">
        <h1>
          {nl ? `Hallo ${me.user.displayName}` : `Hello ${me.user.displayName}`}
        </h1>
        {family?.baseline.active ? (
          <p className="notice">
            {translate(locale, family.baseline.messageKey)}{' '}
            <strong>
              {nl
                ? `Dag ${family.baseline.dayNumber} van 7.`
                : `Day ${family.baseline.dayNumber} of 7.`}
            </strong>
          </p>
        ) : null}
      </section>

      <section className="grid">
        <article className="card stack">
          <p className="card__label">{nl ? 'Volgend focusmoment' : 'Next focus moment'}</p>
          {next ? (
            <>
              <h2 style={{ fontSize: '1.2rem' }}>{next.title}</h2>
              <p style={{ color: 'var(--ink-soft)' }}>
                {new Date(next.nextOccurrence as string).toLocaleString(
                  locale === 'nl' ? 'nl-NL' : 'en-GB',
                  { weekday: 'long', hour: '2-digit', minute: '2-digit' },
                )}{' '}
                · {next.durationMinutes} {nl ? 'minuten' : 'minutes'}
              </p>
              <p>
                <Link className="btn" href={`/app/focus/${next.id}`}>
                  {translate(locale, 'focus.start')}
                </Link>
              </p>
            </>
          ) : (
            <p style={{ color: 'var(--ink-soft)' }}>
              {nl ? 'Nog niets gepland.' : 'Nothing planned yet.'}{' '}
              <Link href="/app/focus">{nl ? 'Plan er een' : 'Plan one'}</Link>
            </p>
          )}
        </article>

        <article className="card stack">
          <p className="card__label">{nl ? 'Vandaag invullen' : 'Fill in today'}</p>
          <h2 style={{ fontSize: '1.2rem' }}>{translate(locale, 'checkin.title')}</h2>
          <p style={{ color: 'var(--ink-soft)' }}>{translate(locale, 'checkin.intro')}</p>
          <p>
            <Link className="btn btn--secondary" href="/app/checkin">
              {nl ? 'Naar de check-in' : 'Go to the check-in'}
            </Link>
          </p>
        </article>

        <article className="card stack">
          <p className="card__label">{nl ? 'Wie er meedoet' : 'Who takes part'}</p>
          <ul className="list-plain">
            {family?.members.map((member) => (
              <li key={member.userId}>
                <strong>{member.displayName}</strong>{' '}
                <span className="badge badge--quiet">
                  {member.role === 'guardian'
                    ? nl
                      ? 'volwassene'
                      : 'grown-up'
                    : member.ageBand}
                </span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="stack">
        <h2>{nl ? 'Wat er nu wordt bijgehouden' : 'What is being recorded right now'}</h2>
        <p style={{ color: 'var(--ink-soft)' }}>
          {nl
            ? 'Iedereen in het gezin ziet dit scherm, inclusief de kinderen. Er is geen meting die alleen een ouder kan zien.'
            : 'Everyone in the family sees this screen, children included. There is no measurement only a parent can see.'}
        </p>
        <ul className="list-plain stack">
          {(family?.measurements ?? []).map((source) => {
            const about = family?.members.find((member) => member.userId === source.userId);
            return (
              <li key={source.id} className="card card--quiet">
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <strong>
                      {about ? about.displayName : nl ? 'Hele gezin' : 'Whole family'}
                    </strong>
                    <div style={{ color: 'var(--ink-faint)', fontSize: '0.85rem' }}>
                      <code>{source.provider}</code>
                    </div>
                  </div>
                  <SourceLabel
                    kind={source.label.kind}
                    confidence={source.label.confidence}
                    locale={locale}
                  />
                  <span className={source.enabled ? 'badge' : 'badge badge--quiet'}>
                    {source.enabled
                      ? nl
                        ? 'Staat aan'
                        : 'On'
                      : nl
                        ? 'Staat uit'
                        : 'Off'}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
        <p>
          <Link className="btn btn--secondary" href="/app/data">
            {nl ? 'Toestemming en gegevens beheren' : 'Manage consent and data'}
          </Link>
        </p>
      </section>
    </div>
  );
}
