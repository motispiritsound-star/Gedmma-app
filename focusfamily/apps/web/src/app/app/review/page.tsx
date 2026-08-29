import { translate } from '@focusfamily/domain';
import { api } from '@/lib/api';
import { getSiteText } from '@/lib/i18n';
import { requireFamilyMe } from '@/lib/session';
import { FigureRow } from '@/components/Figure';
import { SourceLabel } from '@/components/SourceLabel';

interface ReviewResponse {
  review: {
    weekStartDayKey: string;
    weekEndDayKey: string;
    wentWell: string[];
    conversationStarters: string[];
    figures: Array<{
      labelKey: string;
      value: number | string | null;
      source: { kind: 'self_reported' | 'app_observed' | 'os_verified' | 'simulated'; confidence: string };
    }>;
    goals: Array<{ goalId: string; target: number; achieved: number; reached: boolean; adultsTookPart: boolean }>;
    adultParticipation: { adultsInFocusSessions: number; totalFocusSessions: number };
    dataNote: { sourcesUsed: string[]; noteKey: string };
  };
  recommendation: {
    kind: string;
    titleKey: string;
    bodyKey: string;
    reasonKey: string;
    confidence: string;
    evidence: Array<{
      factKey: string;
      value: string | number;
      label: { kind: 'self_reported' | 'app_observed' | 'os_verified' | 'simulated'; confidence: string };
    }>;
  } | null;
  recommendationEngine: string;
  aiAdvisorEnabled: boolean;
}

export default async function ReviewPage() {
  const { locale } = await getSiteText();
  await requireFamilyMe();
  const result = await api.get<ReviewResponse>('/review/week');
  const nl = locale === 'nl';

  if (!result.ok || !result.data) {
    return (
      <p className="notice notice--warm" role="alert">
        {translate(locale, result.error?.messageKey ?? 'error.unexpected')}
      </p>
    );
  }

  const { review, recommendation } = result.data;

  return (
    <div className="stack-lg" style={{ maxWidth: '52rem' }}>
      <section className="stack">
        <h1>{translate(locale, 'review.title')}</h1>
        <p style={{ color: 'var(--ink-soft)' }}>{translate(locale, 'review.intro')}</p>
        <p className="badge badge--quiet">
          {review.weekStartDayKey} – {review.weekEndDayKey}
        </p>
      </section>

      <section className="stack">
        <h2>{nl ? 'Wat ging goed' : 'What went well'}</h2>
        <ul className="list-plain stack">
          {review.wentWell.map((key) => (
            <li key={key} className="notice notice--good">
              {translate(locale, key)}
            </li>
          ))}
        </ul>
      </section>

      <section className="stack">
        <h2>{nl ? 'Om over te praten' : 'To talk about'}</h2>
        <ol>
          {review.conversationStarters.map((key) => (
            <li key={key} style={{ marginBottom: '8px' }}>
              {translate(locale, key)}
            </li>
          ))}
        </ol>
      </section>

      <section className="stack">
        <h2>{nl ? 'De cijfers, met hun herkomst' : 'The figures, with their provenance'}</h2>
        <div className="card">
          {review.figures.map((figure) => (
            <FigureRow
              key={figure.labelKey}
              labelKey={figure.labelKey}
              value={figure.value}
              sourceKind={figure.source.kind}
              confidence={figure.source.confidence}
              locale={locale}
            />
          ))}
        </div>
        <p className="notice">{translate(locale, review.dataNote.noteKey)}</p>
      </section>

      <section className="stack">
        <h2>{nl ? 'Deden de volwassenen mee?' : 'Did the grown-ups take part?'}</h2>
        <p>
          {nl
            ? `Bij ${review.adultParticipation.adultsInFocusSessions} van de ${review.adultParticipation.totalFocusSessions} focusmomenten deze week was er minstens één volwassene bij.`
            : `A grown-up took part in ${review.adultParticipation.adultsInFocusSessions} of the ${review.adultParticipation.totalFocusSessions} focus moments this week.`}
        </p>
      </section>

      {recommendation ? (
        <section className="stack" aria-labelledby="suggestion">
          <h2 id="suggestion">{nl ? 'Eén klein voorstel' : 'One small suggestion'}</h2>
          <article className="card stack">
            <h3>{translate(locale, recommendation.titleKey)}</h3>
            <p>{translate(locale, recommendation.bodyKey)}</p>
            <div className="notice">
              <strong>{nl ? 'Waarom je dit ziet' : 'Why you are seeing this'}</strong>
              <p style={{ marginBottom: '8px' }}>{translate(locale, recommendation.reasonKey)}</p>
              <ul className="list-plain">
                {recommendation.evidence.map((item) => (
                  <li key={item.factKey} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <code style={{ fontSize: '0.85rem' }}>{item.factKey}</code>
                    <strong>{item.value}</strong>
                    <SourceLabel
                      kind={item.label.kind}
                      confidence={item.label.confidence}
                      locale={locale}
                    />
                  </li>
                ))}
              </ul>
            </div>
            <p style={{ color: 'var(--ink-faint)', fontSize: '0.85rem', marginBottom: 0 }}>
              {translate(locale, 'recommendation.engine_note')} (
              <code>{result.data.recommendationEngine}</code>
              {result.data.aiAdvisorEnabled
                ? ''
                : nl
                  ? ', AI-hulp staat uit'
                  : ', AI help is switched off'}
              )
            </p>
          </article>
        </section>
      ) : (
        <p className="notice">
          {nl
            ? 'Nog geen voorstel. In de rustige eerste week houdt de app zich met opzet stil.'
            : 'No suggestion yet. During the quiet first week the app deliberately keeps quiet.'}
        </p>
      )}
    </div>
  );
}
