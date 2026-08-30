/**
 * Het overzicht. Grote cijfers in gewone taal, met daaronder wat er nog moet
 * gebeuren. Elk cijfer heeft een uitleg, want niet iedereen weet wat "omzet"
 * precies betekent.
 */
import { Link } from 'react-router-dom';
import { toonBedrag, toonDatum } from '@gedmma/i18n';
import { useApp } from '../context/App.tsx';
import { Etiket, Kaart, Kerncijfer, Laden, Leegstaat, Melding, Tabelomhulsel } from '../ontwerp/index.tsx';
import { huidigJaar, useHaal } from './gebruik.ts';
import type { Dashboardgegevens } from '../api/client.ts';

export function Dashboard() {
  const { t, taal, administratieId } = useApp();
  const periode = huidigJaar();
  const { gegevens, bezig, fout } = useHaal<Dashboardgegevens>(
    `/api/v1/administraties/${administratieId}/dashboard?vanaf=${periode.vanaf}&tot=${periode.tot}`,
  );

  if (bezig) return <Laden tekst={t('algemeen.laden')} />;
  if (fout) {
    return (
      <Melding soort="fout" titel={fout.titel}>
        {fout.uitleg}
      </Melding>
    );
  }
  if (!gegevens) return null;

  const valuta = gegevens.valuta;
  const bedrag = (waarde: string) => toonBedrag(waarde, valuta, taal);
  const aandacht = gegevens.facturenDieAandachtVragen;
  const nietsTeDoen =
    aandacht.length === 0 && gegevens.teBoekenTransacties === 0 && gegevens.ontbrekendeBonnen === 0;

  return (
    <div className="stapel">
      <div className="paginakop">
        <div>
          <h1>{t('dashboard.titel')}</h1>
          <p className="uitleg">
            {t('algemeen.van')} {toonDatum(gegevens.periode.vanaf, taal)} {t('algemeen.tot')}{' '}
            {toonDatum(gegevens.periode.tot, taal)}
          </p>
        </div>
      </div>

      <div className="raster">
        <Kerncijfer label={t('dashboard.omzet')} waarde={bedrag(gegevens.omzet)} uitleg={t('dashboard.omzetUitleg')} />
        <Kerncijfer label={t('dashboard.kosten')} waarde={bedrag(gegevens.kosten)} uitleg={t('dashboard.kostenUitleg')} />
        <Kerncijfer
          label={t('dashboard.winst')}
          waarde={bedrag(gegevens.winst)}
          uitleg={t('dashboard.winstUitleg')}
          toon={gegevens.winst.startsWith('-') ? 'let-op' : 'goed'}
        />
        <Kerncijfer
          label={t('dashboard.banksaldo')}
          waarde={bedrag(gegevens.banksaldo)}
          uitleg={t('dashboard.banksaldoUitleg')}
        />
      </div>

      <div className="raster">
        <Kerncijfer
          label={t('dashboard.teOntvangen')}
          waarde={bedrag(gegevens.openstaandeDebiteuren)}
          uitleg={t('dashboard.teOntvangenUitleg')}
        />
        <Kerncijfer
          label={t('dashboard.teBetalen')}
          waarde={bedrag(gegevens.openstaandeCrediteuren)}
          uitleg={t('dashboard.teBetalenUitleg')}
        />
        <Kerncijfer label={t('dashboard.btw')} waarde={bedrag(gegevens.verwachteBtw)} uitleg={t('dashboard.btwUitleg')} />
      </div>

      {gegevens.btwWaarschuwingen > 0 && (
        <Melding soort="let-op" titel={t('rapport.btw')}>
          <Link to="/cijfers/btw">
            Er zijn {gegevens.btwWaarschuwingen} punt(en) om te controleren in je btw-overzicht.
          </Link>
        </Melding>
      )}

      <Kaart titel={t('dashboard.aandacht')} strak>
        {nietsTeDoen ? (
          <Leegstaat titel={t('dashboard.geenAandacht')} />
        ) : (
          <>
            <ul style={{ listStyle: 'none', margin: 0, padding: 'var(--ruimte-4) var(--ruimte-5) 0' }}>
              {gegevens.teBoekenTransacties > 0 && (
                <li style={{ marginBottom: 'var(--ruimte-2)' }}>
                  <Link to="/bank">
                    {t('dashboard.teBoeken')}: {gegevens.teBoekenTransacties}
                  </Link>
                </li>
              )}
              {gegevens.ontbrekendeBonnen > 0 && (
                <li style={{ marginBottom: 'var(--ruimte-2)' }}>
                  <Link to="/inkoop">
                    {t('dashboard.ontbrekendeBonnen')}: {gegevens.ontbrekendeBonnen}
                  </Link>
                </li>
              )}
            </ul>

            {aandacht.length > 0 && (
              <Tabelomhulsel bijschrift={t('facturen.titel')}>
                <table className="tabel tabel--stapelbaar">
                  <thead>
                    <tr>
                      <th scope="col">{t('facturen.nummer')}</th>
                      <th scope="col">{t('facturen.klant')}</th>
                      <th scope="col">{t('facturen.vervaldatum')}</th>
                      <th scope="col" className="rechts">
                        {t('facturen.openstaand')}
                      </th>
                      <th scope="col">{t('algemeen.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aandacht.map((factuur) => (
                      <tr key={factuur.id}>
                        <td data-label={t('facturen.nummer')}>
                          <Link to={`/facturen/${factuur.id}`}>{factuur.documentnummer ?? '—'}</Link>
                        </td>
                        <td data-label={t('facturen.klant')}>{factuur.relatie}</td>
                        <td data-label={t('facturen.vervaldatum')}>
                          {factuur.vervaldatum ? toonDatum(factuur.vervaldatum, taal) : '—'}
                        </td>
                        <td data-label={t('facturen.openstaand')} className="rechts bedrag">
                          {bedrag(factuur.openstaand)}
                        </td>
                        <td data-label={t('algemeen.status')}>
                          <Etiket soort={factuur.status === 'vervallen' ? 'fout' : 'let-op'}>
                            {t(`facturen.status.${factuur.status}` as 'facturen.status.definitief')}
                          </Etiket>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Tabelomhulsel>
            )}
          </>
        )}
      </Kaart>
    </div>
  );
}
