/** Kop, navigatie en inhoud. Werkt als zijmenu op groot scherm en als tabbalk op mobiel. */
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { TALEN, type Taal } from '@gedmma/i18n';
import { useApp, type Thema } from '../context/App.tsx';
import { Knop, Melding } from '../ontwerp/index.tsx';

const MENU: { pad: string; sleutel: 'nav.dashboard' | 'nav.verkoop' | 'nav.inkoop' | 'nav.bank' | 'nav.relaties' | 'nav.rapporten' | 'nav.instellingen'; teken: string }[] = [
  { pad: '/', sleutel: 'nav.dashboard', teken: '◧' },
  { pad: '/facturen', sleutel: 'nav.verkoop', teken: '↗' },
  { pad: '/inkoop', sleutel: 'nav.inkoop', teken: '↙' },
  { pad: '/bank', sleutel: 'nav.bank', teken: '≡' },
  { pad: '/relaties', sleutel: 'nav.relaties', teken: '☺' },
  { pad: '/cijfers', sleutel: 'nav.rapporten', teken: '▦' },
  { pad: '/instellingen', sleutel: 'nav.instellingen', teken: '⚙' },
];

export function Schil({ children }: { children: ReactNode }) {
  const { t, taal, zetTaal, thema, zetThema, administratie, ik, kiesAdministratie, afmelden } = useApp();

  const alleAdministraties = (ik?.organisaties ?? []).flatMap((organisatie) =>
    organisatie.administraties.map((admin) => ({ ...admin, organisatie: organisatie.naam })),
  );

  return (
    <div className="app">
      <a className="overslaan" href="#inhoud">
        {t('nav.naarInhoud')}
      </a>

      <header className="kop">
        <NavLink to="/" className="kop__merk">
          {t('app.naam')}
        </NavLink>

        {alleAdministraties.length > 1 ? (
          <label>
            <span className="alleen-schermlezer">{t('nav.administratieKiezen')}</span>
            <select
              className="veld__invoer"
              style={{ minHeight: '2.25rem', maxWidth: '16rem' }}
              value={administratie?.administratie.id ?? ''}
              onChange={(gebeurtenis) => kiesAdministratie(gebeurtenis.target.value)}
            >
              {alleAdministraties.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.naam}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <span className="uitleg">{administratie?.administratie.naam}</span>
        )}

        <div className="kop__rechts">
          <label className="kop__voorkeur">
            <span className="alleen-schermlezer">{t('instellingen.taal')}</span>
            <select
              className="veld__invoer"
              style={{ minHeight: '2.25rem', width: 'auto' }}
              value={taal}
              onChange={(gebeurtenis) => zetTaal(gebeurtenis.target.value as Taal)}
            >
              {TALEN.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.naam}
                </option>
              ))}
            </select>
          </label>

          <label className="kop__voorkeur">
            <span className="alleen-schermlezer">{t('instellingen.thema')}</span>
            <select
              className="veld__invoer"
              style={{ minHeight: '2.25rem', width: 'auto' }}
              value={thema}
              onChange={(gebeurtenis) => zetThema(gebeurtenis.target.value as Thema)}
            >
              <option value="systeem">{t('instellingen.themaSysteem')}</option>
              <option value="licht">{t('instellingen.themaLicht')}</option>
              <option value="donker">{t('instellingen.themaDonker')}</option>
            </select>
          </label>

          <Knop soort="stil" klein onClick={() => void afmelden()}>
            {t('nav.afmelden')}
          </Knop>
        </div>
      </header>

      {ik?.gebruiker?.impersonatie && (
        <div style={{ padding: 'var(--ruimte-3) var(--ruimte-4)' }}>
          <Melding soort="let-op" titel="Ondersteuning kijkt mee">
            Een medewerker van de ondersteuning werkt op dit moment in jouw administratie. Alles wat er gebeurt
            wordt vastgelegd en de toegang stopt automatisch.
          </Melding>
        </div>
      )}

      <div className="romp">
        <nav className="menu" aria-label={t('nav.hoofdmenu')}>
          <ul className="menu__lijst">
            {MENU.map((item) => (
              <li key={item.pad}>
                <NavLink
                  to={item.pad}
                  end={item.pad === '/'}
                  className="menu__link"
                  aria-current={undefined}
                >
                  <span aria-hidden="true">{item.teken}</span>
                  <span className="menu__tekst">{t(item.sleutel)}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main className="inhoud" id="inhoud" tabIndex={-1}>
          {administratie?.administratie.status === 'alleen_lezen' && (
            <Melding soort="let-op" titel="Deze administratie staat op alleen lezen">
              Je kunt alles bekijken en exporteren, maar niets meer wijzigen.
            </Melding>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
