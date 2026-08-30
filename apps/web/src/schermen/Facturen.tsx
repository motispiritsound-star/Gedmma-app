/**
 * Overzicht van offertes, facturen en creditnota's.
 *
 * Het overzicht is de plek waar iemand de vraag "wie moet mij nog betalen?"
 * beantwoordt. Daarom staan de totalen bovenaan, gaan ze over het hele filter
 * en niet over de zichtbare pagina, en is "te laat" een eigen filter in plaats
 * van iets dat je zelf uit de datums moet halen.
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toonBedrag, toonDatum } from '@gedmma/i18n';
import { Money } from '@gedmma/money';
import { useApp } from '../context/App.tsx';
import { Etiket, Kaart, Kerncijfer, Knop, Laden, Leegstaat, Melding, Tabelomhulsel } from '../ontwerp/index.tsx';
import { useHaal } from './gebruik.ts';
import type { Factuurlijst } from '../api/client.ts';

const STATUSKLEUR: Record<string, 'neutraal' | 'goed' | 'let-op' | 'fout' | 'info'> = {
  concept: 'neutraal',
  definitief: 'info',
  verzonden: 'info',
  deels_betaald: 'let-op',
  betaald: 'goed',
  vervallen: 'fout',
  vervallen_offerte: 'neutraal',
  geannuleerd: 'neutraal',
};

type Sortering = 'datum' | 'nummer' | 'klant' | 'bedrag' | 'vervaldatum' | 'openstaand';

type Filters = {
  zoek: string;
  soort: string;
  status: string;
  alleen: '' | 'openstaand' | 'vervallen';
  sorteer: Sortering;
  richting: 'op' | 'af';
};

const LEEG: Filters = { zoek: '', soort: '', status: '', alleen: '', sorteer: 'datum', richting: 'af' };

const PAGINA = 25;

/** Hoeveel dagen is deze factuur te laat? Negatief of nul betekent: nog niet. */
function dagenTeLaat(vervaldatum: string | null): number {
  if (!vervaldatum) return 0;
  const verschil = Date.now() - Date.parse(`${vervaldatum}T23:59:59Z`);
  return Math.floor(verschil / 86_400_000);
}

export function Facturen() {
  const { t, taal, administratieId, magIk } = useApp();
  const navigeer = useNavigate();

  const [filters, zetFilters] = useState<Filters>(LEEG);
  const [limiet, zetLimiet] = useState(PAGINA);

  const pad = useMemo(() => {
    const vraag = new URLSearchParams();
    if (filters.zoek.trim()) vraag.set('zoek', filters.zoek.trim());
    if (filters.soort) vraag.set('soort', filters.soort);
    if (filters.status) vraag.set('status', filters.status);
    if (filters.alleen === 'openstaand') vraag.set('openstaand', 'true');
    if (filters.alleen === 'vervallen') vraag.set('vervallen', 'true');
    vraag.set('sorteer', filters.sorteer);
    vraag.set('richting', filters.richting);
    vraag.set('limiet', String(limiet));
    return `/api/v1/administraties/${administratieId}/verkoopfacturen?${vraag.toString()}`;
  }, [administratieId, filters, limiet]);

  const { gegevens, bezig, fout } = useHaal<Factuurlijst>(pad);

  /** Wijzigt een filter en begint weer bovenaan de lijst. */
  function stel<K extends keyof Filters>(sleutel: K, waarde: Filters[K]): void {
    zetFilters((huidig) => ({ ...huidig, [sleutel]: waarde }));
    zetLimiet(PAGINA);
  }

  /** Klikken op een kolomkop sorteert erop; nog een keer klikken draait om. */
  function sorteerOp(kolom: Sortering): void {
    zetFilters((huidig) => ({
      ...huidig,
      sorteer: kolom,
      richting: huidig.sorteer === kolom && huidig.richting === 'af' ? 'op' : 'af',
    }));
    zetLimiet(PAGINA);
  }

  const gefilterd = filters.zoek !== '' || filters.soort !== '' || filters.status !== '' || filters.alleen !== '';
  const totalen = gegevens?.totalen;
  const valuta = gegevens?.items[0]?.valuta ?? 'EUR';

  /** Kolomkop die tegelijk een sorteerknop is, met de richting voor schermlezers. */
  function Kop({ kolom, tekst, rechts }: { kolom: Sortering; tekst: string; rechts?: boolean }) {
    const actief = filters.sorteer === kolom;
    return (
      <th
        scope="col"
        className={rechts ? 'rechts' : undefined}
        aria-sort={actief ? (filters.richting === 'op' ? 'ascending' : 'descending') : 'none'}
      >
        <button type="button" className="tabel__sorteer" onClick={() => sorteerOp(kolom)}>
          {tekst}
          <span aria-hidden="true">{actief ? (filters.richting === 'op' ? ' ↑' : ' ↓') : ''}</span>
        </button>
      </th>
    );
  }

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

      {totalen && (
        <div className="raster">
          <Kerncijfer
            label={t('facturen.totaalBedrag')}
            waarde={toonBedrag(totalen.totaal, valuta, taal)}
            uitleg={`${totalen.aantal} ${t('facturen.aantalGevonden')}`}
          />
          <Kerncijfer
            label={t('facturen.totaalOpenstaand')}
            waarde={toonBedrag(totalen.openstaand, valuta, taal)}
          />
          <Kerncijfer
            label={t('facturen.totaalVervallen')}
            waarde={toonBedrag(totalen.vervallen, valuta, taal)}
            toon={Money.vanTekst(totalen.vervallen, valuta).isNul() ? 'goed' : 'let-op'}
          />
        </div>
      )}

      <Kaart>
        <div className="filterbalk">
          <label className="filterbalk__zoek">
            <span className="alleen-schermlezer">{t('facturen.zoeken')}</span>
            <input
              type="search"
              className="veld__invoer"
              placeholder={t('facturen.zoeken')}
              value={filters.zoek}
              onChange={(gebeurtenis) => stel('zoek', gebeurtenis.target.value)}
            />
          </label>

          <label>
            <span className="alleen-schermlezer">{t('facturen.soort')}</span>
            <select
              className="veld__invoer"
              value={filters.soort}
              onChange={(gebeurtenis) => stel('soort', gebeurtenis.target.value)}
            >
              <option value="">{t('facturen.alles')}</option>
              <option value="factuur">{t('facturen.soort.factuur')}</option>
              <option value="offerte">{t('facturen.soort.offerte')}</option>
              <option value="creditnota">{t('facturen.soort.creditnota')}</option>
            </select>
          </label>

          <label>
            <span className="alleen-schermlezer">{t('algemeen.status')}</span>
            <select
              className="veld__invoer"
              value={filters.alleen}
              onChange={(gebeurtenis) => stel('alleen', gebeurtenis.target.value as Filters['alleen'])}
            >
              <option value="">{t('facturen.alles')}</option>
              <option value="openstaand">{t('facturen.alleenOpenstaand')}</option>
              <option value="vervallen">{t('facturen.alleenVervallen')}</option>
            </select>
          </label>

          {gefilterd && (
            <Knop soort="stil" klein onClick={() => { zetFilters(LEEG); zetLimiet(PAGINA); }}>
              {t('facturen.filtersWissen')}
            </Knop>
          )}
        </div>
      </Kaart>

      <Kaart strak>
        {bezig && !gegevens ? (
          <div style={{ padding: 'var(--ruimte-5)' }}>
            <Laden tekst={t('algemeen.laden')} />
          </div>
        ) : (gegevens?.items.length ?? 0) === 0 ? (
          <Leegstaat
            titel={gefilterd ? t('facturen.geenResultaat') : t('facturen.leeg')}
            uitleg={gefilterd ? t('facturen.geenResultaatUitleg') : t('facturen.leegUitleg')}
            actie={
              gefilterd ? (
                <Knop soort="tweede" onClick={() => { zetFilters(LEEG); zetLimiet(PAGINA); }}>
                  {t('facturen.filtersWissen')}
                </Knop>
              ) : magIk('verkoop.schrijven') ? (
                <Knop onClick={() => navigeer('/facturen/nieuw')}>{t('facturen.nieuw')}</Knop>
              ) : undefined
            }
          />
        ) : (
          <>
            <Tabelomhulsel bijschrift={t('facturen.titel')}>
              <table className="tabel tabel--stapelbaar">
                <thead>
                  <tr>
                    <Kop kolom="nummer" tekst={t('facturen.nummer')} />
                    <Kop kolom="klant" tekst={t('facturen.klant')} />
                    <Kop kolom="datum" tekst={t('facturen.factuurdatum')} />
                    <Kop kolom="vervaldatum" tekst={t('facturen.vervaldatum')} />
                    <Kop kolom="bedrag" tekst={t('algemeen.totaal')} rechts />
                    <Kop kolom="openstaand" tekst={t('facturen.openstaand')} rechts />
                    <th scope="col">{t('algemeen.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {gegevens?.items.map((factuur) => {
                    // Exact rekenen; een bedrag gaat nooit door een double.
                    const openstaand = Money.vanTekst(factuur.totaal_inclusief, factuur.valuta)
                      .min(Money.vanTekst(factuur.betaald_bedrag, factuur.valuta))
                      .toString();
                    const teLaat =
                      factuur.status !== 'betaald' && factuur.status !== 'concept'
                        ? dagenTeLaat(factuur.vervaldatum)
                        : 0;

                    return (
                      <tr key={factuur.id}>
                        <td data-label={t('facturen.nummer')}>
                          <Link to={`/facturen/${factuur.id}`}>
                            {factuur.documentnummer ?? t('facturen.status.concept')}
                          </Link>
                          {factuur.soort !== 'factuur' && (
                            <>
                              {' '}
                              <Etiket>{t(`facturen.soort.${factuur.soort}` as 'facturen.soort.factuur')}</Etiket>
                            </>
                          )}
                        </td>
                        <td data-label={t('facturen.klant')}>{factuur.contact_naam}</td>
                        <td data-label={t('facturen.factuurdatum')}>{toonDatum(factuur.factuurdatum, taal)}</td>
                        <td data-label={t('facturen.vervaldatum')}>
                          {factuur.vervaldatum ? toonDatum(factuur.vervaldatum, taal) : '—'}
                          {teLaat > 0 && (
                            <>
                              {' '}
                              <span className="tabel__waarschuwing">
                                {teLaat} {t('facturen.dagenTeLaat')}
                              </span>
                            </>
                          )}
                        </td>
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

            {gegevens?.meer && (
              <div className="rij rij--eind" style={{ padding: 'var(--ruimte-4)' }}>
                <Knop soort="tweede" bezig={bezig} onClick={() => zetLimiet((huidig) => huidig + PAGINA)}>
                  {t('facturen.meerLaden')}
                </Knop>
              </div>
            )}
          </>
        )}
      </Kaart>
    </div>
  );
}
