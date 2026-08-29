import type { LocalizedText } from '@focusfamily/domain';
import { api } from '@/lib/api';
import { getSiteText } from '@/lib/i18n';
import { requireFamilyMe } from '@/lib/session';

interface ActivitiesResponse {
  age: number;
  includeExtraPacks: boolean;
  activities: Array<{
    id: string;
    category: string;
    title: LocalizedText;
    body: LocalizedText;
    minutes: number;
    needsAdult: boolean;
    pack: string;
  }>;
  questly: { status: string; connected: boolean };
}

export default async function ActivitiesPage() {
  const { locale } = await getSiteText();
  await requireFamilyMe();
  const result = await api.get<ActivitiesResponse>('/activities');
  const data = result.data;
  const nl = locale === 'nl';

  return (
    <div className="stack-lg">
      <section className="stack">
        <h1>{nl ? 'Iets doen zonder scherm' : 'Something to do without a screen'}</h1>
        <p style={{ color: 'var(--ink-soft)' }}>
          {nl
            ? `Voorstellen die passen bij de jongste in huis (${data?.age ?? '—'} jaar). Alles werkt zonder voorbereiding.`
            : `Suggestions that suit the youngest in the house (${data?.age ?? '—'}). Everything works with no preparation.`}
        </p>
      </section>

      <ul className="list-plain grid">
        {(data?.activities ?? []).map((activity) => (
          <li key={activity.id} className="card stack">
            <p className="card__label">{activity.category}</p>
            <h2 style={{ fontSize: '1.15rem' }}>{activity.title[locale]}</h2>
            <p style={{ color: 'var(--ink-soft)' }}>{activity.body[locale]}</p>
            <p style={{ marginBottom: 0, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge--quiet">
                {activity.minutes} {nl ? 'min' : 'min'}
              </span>
              {activity.needsAdult ? (
                <span className="badge">
                  {nl ? 'Met een volwassene' : 'With a grown-up'}
                </span>
              ) : null}
              {activity.pack === 'extra' ? (
                <span className="badge badge--quiet">Premium</span>
              ) : null}
            </p>
          </li>
        ))}
      </ul>

      <p className="notice">
        {nl
          ? 'Een koppeling met Questly staat op de planning. Er wordt vandaag niets naar Questly gestuurd.'
          : 'A Questly integration is planned. Nothing is sent to Questly today.'}{' '}
        <code>status: {data?.questly.status ?? 'planned'}</code>
      </p>
    </div>
  );
}
