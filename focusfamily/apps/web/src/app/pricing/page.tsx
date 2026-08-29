import { FEATURES_BY_PLAN, MONETISATION_POLICY, translate } from '@focusfamily/domain';
import { getSiteText } from '@/lib/i18n';

const featureCopy: Record<string, { nl: string; en: string }> = {
  'agreements.multiple': {
    nl: 'Meerdere afspraken naast elkaar (bijvoorbeeld schoolweek en vakantie)',
    en: 'Several agreements side by side (school weeks and holidays, say)',
  },
  'insights.history_90d': {
    nl: 'Weekoverzichten van de afgelopen negentig dagen teruglezen',
    en: 'Read back weekly reviews from the past ninety days',
  },
  'programmes.guided': {
    nl: 'Begeleide programma’s van twee weken, bijvoorbeeld over de avondroutine',
    en: 'Guided two-week programmes, for instance about the evening routine',
  },
  'activities.extra_packs': {
    nl: 'Extra pakketten met activiteiten zonder scherm',
    en: 'Extra packs of screen-free activities',
  },
  'review.export_pdf': {
    nl: 'Het weekoverzicht als pdf bewaren of meenemen naar een gesprek op school',
    en: 'Save the weekly review as a PDF, or take it to a meeting at school',
  },
  'focus.custom_schedules': {
    nl: 'Meer dan drie eigen focusmomenten in de agenda',
    en: 'More than three focus moments of your own in the calendar',
  },
};

export default async function PricingPage() {
  const { s, locale } = await getSiteText();

  return (
    <div className="stack-lg">
      <section className="stack">
        <h1>{s('pricing.title')}</h1>
        <p className="notice notice--good">{translate(locale, 'billing.free_forever')}</p>
        <p className="notice">{translate(locale, 'billing.no_ads')}</p>
      </section>

      <div className="grid">
        <article className="card stack">
          <h2>{s('pricing.free.title')}</h2>
          <p style={{ color: 'var(--ink-soft)' }}>
            {locale === 'nl'
              ? 'Eén afspraak, focusmomenten, check-ins, het weekoverzicht, de bibliotheek, exporteren en verwijderen.'
              : 'One agreement, focus moments, check-ins, the weekly review, the library, export and deletion.'}
          </p>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 0 }}>
            € 0
          </p>
        </article>

        <article className="card stack">
          <h2>{s('pricing.premium.title')}</h2>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 0 }}>
            € 4,99{' '}
            <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--ink-soft)' }}>
              {locale === 'nl' ? 'per maand, per gezin' : 'per month, per family'}
            </span>
          </p>
          <ul className="list-plain">
            {FEATURES_BY_PLAN.family_premium.map((feature) => (
              <li key={feature}>· {featureCopy[feature]?.[locale] ?? feature}</li>
            ))}
          </ul>
          <p className="badge badge--quiet">{translate(locale, 'billing.test_mode')}</p>
        </article>

        <article className="card stack">
          <h2>{s('pricing.sponsored.title')}</h2>
          <p style={{ color: 'var(--ink-soft)' }}>
            {locale === 'nl'
              ? 'Een werkgever of school koopt licenties en geeft een code uit. De sponsor ziet alleen hoeveel plekken er gebruikt zijn - nooit wie meedoet en nooit wat een gezin afspreekt.'
              : 'An employer or school buys licences and hands out a code. The sponsor sees only how many seats are used - never who takes part, and never what a family agrees.'}
          </p>
          <ul className="list-plain">
            {FEATURES_BY_PLAN.sponsored.map((feature) => (
              <li key={feature}>· {featureCopy[feature]?.[locale] ?? feature}</li>
            ))}
          </ul>
        </article>
      </div>

      <section className="stack">
        <h2>{locale === 'nl' ? 'Wat we niet doen om geld te verdienen' : 'What we do not do for money'}</h2>
        <div className="table-scroll">
          <table>
            <caption className="visually-hidden">
              {locale === 'nl' ? 'Ons verdienmodel' : 'Our business model'}
            </caption>
            <thead>
              <tr>
                <th scope="col">{locale === 'nl' ? 'Praktijk' : 'Practice'}</th>
                <th scope="col">FocusFamily</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{locale === 'nl' ? 'Persoonsgegevens verkopen' : 'Selling personal data'}</td>
                <td>{MONETISATION_POLICY.sellsPersonalData ? 'Ja' : locale === 'nl' ? 'Nee' : 'No'}</td>
              </tr>
              <tr>
                <td>{locale === 'nl' ? 'Gegevens van kinderen verkopen' : 'Selling data about children'}</td>
                <td>{MONETISATION_POLICY.sellsChildData ? 'Ja' : locale === 'nl' ? 'Nee' : 'No'}</td>
              </tr>
              <tr>
                <td>{locale === 'nl' ? 'Advertenties op gedrag' : 'Behavioural advertising'}</td>
                <td>
                  {MONETISATION_POLICY.behaviouralAdvertising ? 'Ja' : locale === 'nl' ? 'Nee' : 'No'}
                </td>
              </tr>
              <tr>
                <td>{locale === 'nl' ? 'Advertentie-SDK’s in de app' : 'Ad SDKs in the app'}</td>
                <td>
                  {MONETISATION_POLICY.thirdPartyAdSdks.length === 0
                    ? locale === 'nl'
                      ? 'Geen'
                      : 'None'
                    : MONETISATION_POLICY.thirdPartyAdSdks.join(', ')}
                </td>
              </tr>
              <tr>
                <td>
                  {locale === 'nl'
                    ? 'Sponsor ziet inhoud van een gezin'
                    : 'Sponsor sees a family’s content'}
                </td>
                <td>
                  {MONETISATION_POLICY.sponsorSeesFamilyContent ? 'Ja' : locale === 'nl' ? 'Nee' : 'No'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
