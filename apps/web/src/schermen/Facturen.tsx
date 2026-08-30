/** Overzicht van offertes, facturen en creditnota's. */
import { Link, useNavigate } from 'react-router-dom';
import { toonBedrag, toonDatum } from '@gedmma/i18n';
import { useApp } from '../context/App.tsx';
import { Etiket, Kaart, Knop, Laden, Leegstaat, Melding, Tabelomhulsel } from '../ontwerp/index.tsx';
import { useHaal } from './gebruik.ts';
import type { Factuur } from '../api/client.ts';

const STATUSKLEUR: Record<string, 'neutraal' | 'goed' | 'let-op' | 'fout' | 'info'> = {
  concept: 'neutraal',
  definitief: 'info',
  verzonden: 'info',
  deels_betaald: 'let-op',
  betaald: 'goed',
  vervallen: 'fout',
  geannuleerd: 'neutraal',
};

export function Facturen() {
  const { t, taal, administratieId, magIk } = useApp();
  const navigeer = useNavigate();
  const { gegevens, bezig, fout } = useHaal<{ items: Factuur[] }>(
    `/api/v1/administraties/${administratieId}/verkoopfacturen?limiet=100`,
  );

  return (
    <div className="stapel">
      <div className="paginakop">
        <h1>{t('facturen.titel')}</h1>
        {magIk('verkoop.schrijven') && (
          <div className="paginakop__acties">
            <Knop soort="tweede" onClick={() => navigeer('/facturen/nieuw?soort=offerte')}>
              {t('facturen.nieuweOfferte')}
            </Knop>
            <Knop onClick={() => navigeer('/facturen/nieuw')}>{t('facturen.nieuw')}</Knop>
          </div>
        )}
      </div>

      {fout && (
        <Melding soort="fout" titel={fout.titel}>
          {fout.uitleg}
        </Melding>
      )}

      <Kaart strak>
        {bezig ? (
          <div style={{ padding: 'var(--ruimte-5)' }}>
            <Laden tekst={t('algemeen.laden')} />
          </div>
        ) : (gegevens?.items.length ?? 0) === 0 ? (
          <Leegstaat
            titel={t('facturen.leeg')}
            uitleg={t('facturen.leegUitleg')}
            actie={
              magIk('verkoop.schrijven') ? (
                <Knop onClick={() => navigeer('/facturen/nieuw')}>{t('facturen.nieuw')}</Knop>
              ) : undefined
            }
          />
        ) : (
          <Tabelomhulsel bijschrift={t('facturen.titel')}>
            <table className="tabel tabel--stapelbaar">
              <thead>
                <tr>
                  <th scope="col">{t('facturen.nummer')}</th>
                  <th scope="col">{t('facturen.klant')}</th>
                  <th scope="col">{t('facturen.factuurdatum')}</th>
                  <th scope="col" className="rechts">
                    {t('algemeen.totaal')}
                  </th>
                  <th scope="col" className="rechts">
                    {t('facturen.openstaand')}
                  </th>
                  <th scope="col">{t('algemeen.status')}</th>
                </tr>
              </thead>
              <tbody>
                {gegevens?.items.map((factuur) => {
                  const openstaand = (
                    Number(factuur.totaal_inclusief) - Number(factuur.betaald_bedrag)
                  ).toFixed(2);
                  return (
                    <tr key={factuur.id}>
                      <td data-label={t('facturen.nummer')}>
                        <Link to={`/facturen/${factuur.id}`}>
                          {factuur.documentnummer ?? t('facturen.status.concept')}
                        </Link>
                        {factuur.soort !== 'factuur' && (
                          <>
                            {' '}
                            <Etiket>{factuur.soort}</Etiket>
                          </>
                        )}
                      </td>
                      <td data-label={t('facturen.klant')}>{factuur.contact_naam}</td>
                      <td data-label={t('facturen.factuurdatum')}>{toonDatum(factuur.factuurdatum, taal)}</td>
                      <td data-label={t('algemeen.totaal')} className="rechts bedrag">
                        {toonBedrag(factuur.totaal_inclusief, factuur.valuta, taal)}
                      </td>
                      <td data-label={t('facturen.openstaand')} className="rechts bedrag">
                        {factuur.status === 'concept' ? '—' : toonBedrag(openstaand, factuur.valuta, taal)}
                      </td>
                      <td data-label={t('algemeen.status')}>
                        <Etiket soort={STATUSKLEUR[factuur.status] ?? 'neutraal'}>
                          {t(`facturen.status.${factuur.status}` as 'facturen.status.concept')}
                        </Etiket>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Tabelomhulsel>
        )}
      </Kaart>
    </div>
  );
}
