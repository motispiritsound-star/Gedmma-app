import { api } from '@/lib/api';
import { getSiteText } from '@/lib/i18n';
import { requireMe } from '@/lib/session';

interface Metrics {
  families: number;
  guardians: number;
  children: number;
  activeAgreements: number;
  focusSessions: number;
  plans: Array<{ plan: string; count: number }>;
  note: string;
}

export default async function AdminPage() {
  const { locale } = await getSiteText();
  const me = await requireMe();
  const result = await api.get<Metrics>('/admin/metrics');
  const nl = locale === 'nl';

  if (!result.ok) {
    return (
      <div className="stack" style={{ maxWidth: '40rem' }}>
        <h1>{nl ? 'Beheer' : 'Admin'}</h1>
        <p className="notice notice--warm" role="alert">
          {nl
            ? 'Dit scherm is alleen voor medewerkers van de helpdesk. Gezinsinhoud staat er sowieso niet in.'
            : 'This screen is for support staff only. It never contains family content anyway.'}
        </p>
        <p style={{ color: 'var(--ink-soft)' }}>
          {nl ? 'Ingelogd als' : 'Signed in as'} {me.user.displayName} (
          {me.user.platformRole})
        </p>
      </div>
    );
  }

  const metrics = result.data as Metrics;

  return (
    <div className="stack-lg" style={{ maxWidth: '44rem' }}>
      <section className="stack">
        <h1>{nl ? 'Beheer' : 'Admin'}</h1>
        <p className="notice">{metrics.note}</p>
      </section>

      <div className="card">
        <div className="figure-row">
          <div>{nl ? 'Gezinnen' : 'Families'}</div>
          <div className="figure-row__value">{metrics.families}</div>
        </div>
        <div className="figure-row">
          <div>{nl ? 'Volwassenen' : 'Grown-ups'}</div>
          <div className="figure-row__value">{metrics.guardians}</div>
        </div>
        <div className="figure-row">
          <div>{nl ? 'Kinderen' : 'Children'}</div>
          <div className="figure-row__value">{metrics.children}</div>
        </div>
        <div className="figure-row">
          <div>{nl ? 'Afspraken die gelden' : 'Agreements in force'}</div>
          <div className="figure-row__value">{metrics.activeAgreements}</div>
        </div>
        <div className="figure-row">
          <div>{nl ? 'Focusmomenten' : 'Focus moments'}</div>
          <div className="figure-row__value">{metrics.focusSessions}</div>
        </div>
      </div>
    </div>
  );
}
