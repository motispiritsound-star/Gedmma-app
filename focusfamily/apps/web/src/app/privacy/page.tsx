import {
  FORBIDDEN_CAPABILITIES,
  NOT_COLLECTED,
  consentScopes,
  translate,
} from '@focusfamily/domain';
import { getSiteText } from '@/lib/i18n';
import { SourceLabel } from '@/components/SourceLabel';

export default async function PrivacyPage() {
  const { locale } = await getSiteText();
  const nl = locale === 'nl';

  return (
    <div className="stack-lg" style={{ maxWidth: '78ch' }}>
      <section className="stack">
        <h1>{nl ? 'Hoe we met gegevens omgaan' : 'How we handle data'}</h1>
        <p>
          {nl
            ? 'FocusFamily is gebouwd rond één keuze: afspraken in plaats van controle. Dat is geen belofte in de kleine lettertjes, maar iets wat je in het product terugziet. Deze pagina zegt precies wat we bewaren, wat we nooit bewaren, en wie waar toestemming voor moet geven.'
            : 'FocusFamily is built around one choice: agreements instead of surveillance. That is not a promise in the small print, it is something you can see in the product. This page says exactly what we keep, what we never keep, and who has to agree to what.'}
        </p>
      </section>

      <section className="stack">
        <h2>{nl ? 'Wat we nooit bewaren' : 'What we never keep'}</h2>
        <p>
          {nl
            ? 'Deze lijst staat in de broncode als een constante, wordt afgedwongen door de autorisatielaag en is openbaar op te vragen via /capabilities van onze API.'
            : 'This list lives in the source code as a constant, is enforced by the authorisation layer, and is publicly retrievable from our API at /capabilities.'}
        </p>
        <ul className="list-plain grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
          {NOT_COLLECTED.map((item) => (
            <li key={item} className="card card--quiet" style={{ padding: '10px 14px' }}>
              <code style={{ fontSize: '0.85rem' }}>{item}</code>
            </li>
          ))}
        </ul>
        <p className="notice notice--warm">{translate(locale, 'authz.capability_not_offered')}</p>
      </section>

      <section className="stack">
        <h2>{nl ? 'Vier soorten gegevens, altijd met een etiket' : 'Four kinds of data, always labelled'}</h2>
        <div className="stack">
          {(['self_reported', 'app_observed', 'os_verified', 'simulated'] as const).map((kind) => (
            <div className="card" key={kind}>
              <SourceLabel kind={kind} locale={locale} explain />
            </div>
          ))}
        </div>
      </section>

      <section className="stack">
        <h2>{nl ? 'Wie geeft waarvoor toestemming' : 'Who consents to what'}</h2>
        <div className="table-scroll">
          <table>
            <caption className="visually-hidden">
              {nl ? 'Toestemmingen per onderdeel' : 'Consent per area'}
            </caption>
            <thead>
              <tr>
                <th scope="col">{nl ? 'Onderdeel' : 'Area'}</th>
                <th scope="col">{nl ? 'Wat we vragen' : 'What we ask'}</th>
              </tr>
            </thead>
            <tbody>
              {consentScopes.map((scope) => (
                <tr key={scope}>
                  <th scope="row" style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--ink)' }}>
                    <code style={{ fontSize: '0.85rem' }}>{scope}</code>
                  </th>
                  <td>{translate(locale, `consent.statement.${scope}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          {nl
            ? 'Vanaf elf jaar vragen we het ook aan het kind zelf. Een ouder die ja zegt is dan niet genoeg: er wordt niets gemeten tot het kind zelf ja zegt, en iedereen kan dat op elk moment intrekken zonder de rest van de app kwijt te raken.'
            : 'From the age of eleven we also ask the child. A guardian saying yes is then not enough: nothing is measured until the young person agrees, and anyone can withdraw at any time without losing the rest of the app.'}
        </p>
      </section>

      <section className="stack">
        <h2>{nl ? 'Wat je altijd zelf kunt doen' : 'What you can always do yourself'}</h2>
        <ul>
          <li>{translate(locale, 'rights.export.body')}</li>
          <li>{translate(locale, 'rights.deletion.body')}</li>
          <li>{translate(locale, 'consent.withdraw.hint')}</li>
        </ul>
      </section>

      <section className="stack">
        <h2>{nl ? 'Mogelijkheden die we niet aanbieden' : 'Capabilities we do not offer'}</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">{nl ? 'Mogelijkheid' : 'Capability'}</th>
                <th scope="col">{nl ? 'Status' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {FORBIDDEN_CAPABILITIES.map((capability) => (
                <tr key={capability}>
                  <th scope="row" style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--ink)' }}>
                    <code style={{ fontSize: '0.85rem' }}>{capability}</code>
                  </th>
                  <td>{nl ? 'Wordt niet aangeboden' : 'Not offered'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
