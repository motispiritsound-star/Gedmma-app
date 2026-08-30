/** Klanten en leveranciers beheren. */
import { useState } from 'react';
import { useApp } from '../context/App.tsx';
import { Etiket, Kaart, Keuzeveld, Knop, Laden, Leegstaat, Melding, Tabelomhulsel, Veld } from '../ontwerp/index.tsx';
import { useActie, useHaal } from './gebruik.ts';
import { nieuweIdempotencyKey, type Relatie } from '../api/client.ts';

export function Relaties() {
  const { t, administratieId, magIk } = useApp();
  const basis = `/api/v1/administraties/${administratieId}`;
  const [zoek, zetZoek] = useState('');
  const lijst = useHaal<{ items: Relatie[] }>(`${basis}/relaties?limiet=200${zoek ? `&zoek=${encodeURIComponent(zoek)}` : ''}`);
  const actie = useActie();

  const [formulierOpen, zetFormulierOpen] = useState(false);
  const [naam, zetNaam] = useState('');
  const [soort, zetSoort] = useState<'klant' | 'leverancier' | 'beide'>('klant');
  const [email, zetEmail] = useState('');
  const [btwNummer, zetBtwNummer] = useState('');
  const [iban, zetIban] = useState('');
  const [land, zetLand] = useState('NL');
  const [adres, zetAdres] = useState('');
  const [postcode, zetPostcode] = useState('');
  const [plaats, zetPlaats] = useState('');
  const [termijn, zetTermijn] = useState('30');
  const [negeerDubbel, zetNegeerDubbel] = useState(false);

  function leegFormulier() {
    zetNaam('');
    zetEmail('');
    zetBtwNummer('');
    zetIban('');
    zetAdres('');
    zetPostcode('');
    zetPlaats('');
    zetNegeerDubbel(false);
  }

  async function bewaar() {
    const uitkomst = await actie.voerUit(`${basis}/relaties`, {
      methode: 'POST',
      idempotencyKey: nieuweIdempotencyKey(),
      body: {
        naam,
        soort,
        email: email || null,
        btwNummer: btwNummer || null,
        iban: iban || null,
        land,
        betalingstermijnDagen: Number(termijn) || 30,
        adres: adres || postcode || plaats ? { adres, postcode, plaats, land } : null,
        negeerDubbel,
      },
    });
    if (uitkomst) {
      leegFormulier();
      zetFormulierOpen(false);
      lijst.opnieuw();
    }
  }

  return (
    <div className="stapel">
      <div className="paginakop">
        <h1>{t('relaties.titel')}</h1>
        {magIk('relatie.schrijven') && (
          <Knop onClick={() => zetFormulierOpen(!formulierOpen)} aria-expanded={formulierOpen}>
            {t('relaties.nieuw')}
          </Knop>
        )}
      </div>

      {actie.fout && (
        <Melding
          soort={actie.fout.code === 'conflict' ? 'let-op' : 'fout'}
          titel={actie.fout.titel}
          actie={
            actie.fout.code === 'conflict' ? (
              <Knop
                soort="tweede"
                klein
                onClick={() => {
                  zetNegeerDubbel(true);
                  actie.wisFout();
                }}
              >
                {t('relaties.tochAanmaken')}
              </Knop>
            ) : undefined
          }
        >
          {actie.fout.uitleg}
        </Melding>
      )}

      {formulierOpen && (
        <Kaart titel={t('relaties.nieuw')}>
          <div className="veldrij">
            <Veld label={t('relaties.naam')} value={naam} onChange={(g) => zetNaam(g.target.value)} verplicht />
            <Keuzeveld
              label={t('relaties.soort')}
              value={soort}
              onChange={(g) => zetSoort(g.target.value as 'klant')}
              opties={[
                { waarde: 'klant', tekst: t('relaties.klant') },
                { waarde: 'leverancier', tekst: t('relaties.leverancier') },
                { waarde: 'beide', tekst: t('relaties.beide') },
              ]}
            />
          </div>
          <div className="veldrij">
            <Veld label={t('relaties.email')} type="email" value={email} onChange={(g) => zetEmail(g.target.value)} />
            <Veld
              label={t('relaties.betalingstermijn')}
              type="number"
              min={0}
              max={365}
              value={termijn}
              onChange={(g) => zetTermijn(g.target.value)}
            />
          </div>
          <div className="veldrij">
            <Veld label={t('admin.adres')} value={adres} onChange={(g) => zetAdres(g.target.value)} />
            <Veld label="Postcode" value={postcode} onChange={(g) => zetPostcode(g.target.value)} />
            <Veld label="Plaats" value={plaats} onChange={(g) => zetPlaats(g.target.value)} />
          </div>
          <div className="veldrij">
            <Veld
              label={t('relaties.btwNummer')}
              uitleg="Verplicht bij btw verlegd en bij leveringen naar een ander EU-land."
              value={btwNummer}
              onChange={(g) => zetBtwNummer(g.target.value)}
            />
            <Veld label={t('relaties.iban')} value={iban} onChange={(g) => zetIban(g.target.value)} />
            <Veld label="Land" value={land} onChange={(g) => zetLand(g.target.value.toUpperCase())} maxLength={2} />
          </div>
          <div className="rij">
            <Knop onClick={() => void bewaar()} bezig={actie.bezig} disabled={naam.trim().length < 2}>
              {t('algemeen.opslaan')}
            </Knop>
            <Knop soort="stil" onClick={() => zetFormulierOpen(false)}>
              {t('algemeen.annuleren')}
            </Knop>
          </div>
        </Kaart>
      )}

      <Kaart
        strak
        acties={
          <label>
            <span className="alleen-schermlezer">{t('algemeen.zoeken')}</span>
            <input
              className="veld__invoer"
              type="search"
              placeholder={t('algemeen.zoeken')}
              value={zoek}
              onChange={(gebeurtenis) => zetZoek(gebeurtenis.target.value)}
              style={{ minHeight: '2.25rem' }}
            />
          </label>
        }
        titel={t('relaties.titel')}
      >
        {lijst.bezig ? (
          <Laden tekst={t('algemeen.laden')} />
        ) : (lijst.gegevens?.items.length ?? 0) === 0 ? (
          <Leegstaat titel={t('relaties.leeg')} />
        ) : (
          <Tabelomhulsel bijschrift={t('relaties.titel')}>
            <table className="tabel tabel--stapelbaar">
              <thead>
                <tr>
                  <th scope="col">{t('relaties.naam')}</th>
                  <th scope="col">{t('relaties.soort')}</th>
                  <th scope="col">{t('relaties.email')}</th>
                  <th scope="col">{t('relaties.btwNummer')}</th>
                  <th scope="col" className="rechts">
                    {t('relaties.betalingstermijn')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {lijst.gegevens?.items.map((relatie) => (
                  <tr key={relatie.id}>
                    <td data-label={t('relaties.naam')}>
                      <strong>{relatie.naam}</strong>
                      {relatie.nummer && <div className="uitleg">{relatie.nummer}</div>}
                    </td>
                    <td data-label={t('relaties.soort')}>
                      <Etiket soort={relatie.soort === 'leverancier' ? 'info' : 'neutraal'}>
                        {t(`relaties.${relatie.soort}` as 'relaties.klant')}
                      </Etiket>
                    </td>
                    <td data-label={t('relaties.email')}>{relatie.email ?? '—'}</td>
                    <td data-label={t('relaties.btwNummer')}>{relatie.btw_nummer ?? '—'}</td>
                    <td data-label={t('relaties.betalingstermijn')} className="rechts">
                      {relatie.betalingstermijn_dagen}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Tabelomhulsel>
        )}
      </Kaart>
    </div>
  );
}
