/**
 * Bank: afschrift inlezen, voorstellen bekijken en transacties boeken.
 *
 * Het voorstel legt uit waarom het er is; de gebruiker bevestigt. Automatisch
 * boeken gebeurt alleen als iemand daar een regel voor heeft ingesteld.
 */
import { useState } from 'react';
import { toonBedrag, toonDatum } from '@gedmma/i18n';
import { useApp } from '../context/App.tsx';
import { Etiket, Kaart, Knop, Laden, Leegstaat, Melding, Tabelomhulsel } from '../ontwerp/index.tsx';
import { useActie, useHaal } from './gebruik.ts';
import { nieuweIdempotencyKey, type Banktransactie, type Matchvoorstel, type Rekening } from '../api/client.ts';

type Bankrekening = { id: string; naam: string; iban: string | null; valuta: string };

export function Bank() {
  const { t, taal, administratieId, magIk } = useApp();
  const basis = `/api/v1/administraties/${administratieId}`;
  const rekeningen = useHaal<{ bankrekeningen: Bankrekening[] }>(`${basis}/bankrekeningen`);
  const transacties = useHaal<{ items: Banktransactie[] }>(`${basis}/banktransacties?status=nieuw&limiet=100`);
  const grootboek = useHaal<{ rekeningen: Rekening[] }>(`${basis}/rekeningen`);
  const actie = useActie();

  const [melding, zetMelding] = useState<string | null>(null);
  const [geopend, zetGeopend] = useState<string | null>(null);

  const bankrekening = rekeningen.gegevens?.bankrekeningen[0];

  const reconciliatie = useHaal<{
    saldoGrootboek: string;
    eindsaldoAfschrift: string | null;
    verschil: string | null;
    ongeboekteTransacties: number;
    sluitAan: boolean;
  }>(bankrekening ? `${basis}/bankrekeningen/${bankrekening.id}/reconciliatie` : null);

  async function importeer(bestand: File) {
    if (!bankrekening) return;
    const inhoud = await bestand.text();
    const uitkomst = await actie.voerUit<{ toegevoegd: number; overgeslagen: number; waarschuwingen: string[] }>(
      `${basis}/bankrekeningen/${bankrekening.id}/import`,
      { methode: 'POST', body: { bestandsnaam: bestand.name, inhoud } },
    );
    if (uitkomst) {
      zetMelding(
        t('bank.geimporteerd', { toegevoegd: uitkomst.toegevoegd, overgeslagen: uitkomst.overgeslagen }),
      );
      transacties.opnieuw();
      reconciliatie.opnieuw();
    }
  }

  return (
    <div className="stapel">
      <div className="paginakop">
        <h1>{t('bank.titel')}</h1>
        {magIk('bank.schrijven') && bankrekening && (
          <label className="knop" style={{ cursor: 'pointer' }}>
            {t('bank.importeren')}
            <input
              type="file"
              accept=".csv,.txt,.sta,.940,.xml,text/csv,application/xml,text/xml"
              style={{ display: 'none' }}
              onChange={(gebeurtenis) => {
                const bestand = gebeurtenis.target.files?.[0];
                if (bestand) void importeer(bestand);
                gebeurtenis.target.value = '';
              }}
            />
          </label>
        )}
      </div>

      <p className="uitleg">{t('bank.importUitleg')}</p>

      {actie.fout && (
        <Melding soort="fout" titel={actie.fout.titel}>
          {actie.fout.uitleg}
        </Melding>
      )}
      {melding && <Melding soort="goed">{melding}</Melding>}

      {reconciliatie.gegevens && (
        <Kaart titel={t('bank.reconciliatie')}>
          <div className="raster">
            <div>
              <span className="kerncijfer__label">{t('bank.saldoGrootboek')}</span>
              <div className="bedrag" style={{ fontSize: 'var(--tekst-xl)' }}>
                {toonBedrag(reconciliatie.gegevens.saldoGrootboek, bankrekening?.valuta ?? 'EUR', taal)}
              </div>
            </div>
            <div>
              <span className="kerncijfer__label">{t('bank.saldoAfschrift')}</span>
              <div className="bedrag" style={{ fontSize: 'var(--tekst-xl)' }}>
                {reconciliatie.gegevens.eindsaldoAfschrift
                  ? toonBedrag(reconciliatie.gegevens.eindsaldoAfschrift, bankrekening?.valuta ?? 'EUR', taal)
                  : '—'}
              </div>
            </div>
            <div>
              <span className="kerncijfer__label">{t('bank.teVerwerken')}</span>
              <div style={{ fontSize: 'var(--tekst-xl)' }}>{reconciliatie.gegevens.ongeboekteTransacties}</div>
            </div>
          </div>
          <p className="uitleg" style={{ marginTop: 'var(--ruimte-3)' }}>
            {reconciliatie.gegevens.sluitAan ? t('bank.sluitAan') : t('bank.sluitNietAan')}
          </p>
        </Kaart>
      )}

      <Kaart strak titel={t('bank.teVerwerken')}>
        {transacties.bezig ? (
          <Laden tekst={t('algemeen.laden')} />
        ) : (transacties.gegevens?.items.length ?? 0) === 0 ? (
          <Leegstaat titel={t('bank.leeg')} />
        ) : (
          <Tabelomhulsel bijschrift={t('bank.teVerwerken')}>
            <table className="tabel tabel--stapelbaar">
              <thead>
                <tr>
                  <th scope="col">{t('algemeen.datum')}</th>
                  <th scope="col">{t('relaties.naam')}</th>
                  <th scope="col">{t('algemeen.omschrijving')}</th>
                  <th scope="col" className="rechts">
                    {t('algemeen.bedrag')}
                  </th>
                  <th scope="col" />
                </tr>
              </thead>
              <tbody>
                {transacties.gegevens?.items.map((transactie) => (
                  <tr key={transactie.id}>
                    <td data-label={t('algemeen.datum')}>{toonDatum(transactie.boekdatum, taal)}</td>
                    <td data-label={t('relaties.naam')}>{transactie.tegenpartij ?? '—'}</td>
                    <td data-label={t('algemeen.omschrijving')}>{transactie.omschrijving}</td>
                    <td
                      data-label={t('algemeen.bedrag')}
                      className={`rechts bedrag${transactie.bedrag.startsWith('-') ? ' bedrag--negatief' : ''}`}
                    >
                      {toonBedrag(transactie.bedrag, transactie.valuta, taal)}
                    </td>
                    <td>
                      <Knop
                        soort="tweede"
                        klein
                        onClick={() => zetGeopend(geopend === transactie.id ? null : transactie.id)}
                        aria-expanded={geopend === transactie.id}
                      >
                        {t('bank.koppelen')}
                      </Knop>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Tabelomhulsel>
        )}
      </Kaart>

      {geopend && (
        <Voorstellen
          transactieId={geopend}
          basis={basis}
          grootboekrekeningen={grootboek.gegevens?.rekeningen ?? []}
          onKlaar={() => {
            zetGeopend(null);
            transacties.opnieuw();
            reconciliatie.opnieuw();
            zetMelding(t('bank.boeken'));
          }}
        />
      )}
    </div>
  );
}

function Voorstellen({
  transactieId,
  basis,
  grootboekrekeningen,
  onKlaar,
}: {
  transactieId: string;
  basis: string;
  grootboekrekeningen: Rekening[];
  onKlaar: () => void;
}) {
  const { t, taal } = useApp();
  const actie = useActie();
  const { gegevens, bezig } = useHaal<{
    transactie: Banktransactie;
    matches: Matchvoorstel[];
    regel: { rekeningId: string; regelNaam: string } | null;
  }>(`${basis}/banktransacties/${transactieId}/voorstellen`);

  const [rekeningId, zetRekeningId] = useState('');

  if (bezig) return <Laden tekst={t('algemeen.laden')} />;
  if (!gegevens) return null;

  async function koppel(voorstel: Matchvoorstel) {
    const uitkomst = await actie.voerUit(`${basis}/banktransacties/${transactieId}/boek`, {
      methode: 'POST',
      idempotencyKey: nieuweIdempotencyKey(),
      body: {
        afletteringen: [
          { factuurSoort: voorstel.soort, factuurId: voorstel.factuurId, bedrag: voorstel.bedrag },
        ],
      },
    });
    if (uitkomst) onKlaar();
  }

  async function boekOpRekening() {
    if (!gegevens) return;
    const bedrag = gegevens.transactie.bedrag.replace('-', '');
    const uitkomst = await actie.voerUit(`${basis}/banktransacties/${transactieId}/boek`, {
      methode: 'POST',
      idempotencyKey: nieuweIdempotencyKey(),
      body: {
        directeBoekingen: [
          { rekeningId, bedrag, omschrijving: gegevens.transactie.omschrijving },
        ],
      },
    });
    if (uitkomst) onKlaar();
  }

  return (
    <Kaart titel={t('bank.voorstel')}>
      {actie.fout && (
        <Melding soort="fout" titel={actie.fout.titel}>
          {actie.fout.uitleg}
        </Melding>
      )}

      {gegevens.matches.length === 0 ? (
        <p className="uitleg">Geen openstaande factuur gevonden die hierbij past.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: '0 0 var(--ruimte-4)', padding: 0 }}>
          {gegevens.matches.map((voorstel) => (
            <li
              key={voorstel.factuurId}
              style={{
                display: 'flex',
                gap: 'var(--ruimte-3)',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--ruimte-3) 0',
                borderBottom: '1px solid var(--kleur-rand)',
              }}
            >
              <div>
                <strong>{voorstel.documentnummer ?? voorstel.relatie}</strong>
                <div className="uitleg">
                  {voorstel.relatie} · {t('facturen.openstaand')}:{' '}
                  {toonBedrag(voorstel.openstaand, gegevens.transactie.valuta, taal)}
                </div>
                <div className="uitleg">
                  <Etiket soort={voorstel.zekerheid >= 0.8 ? 'goed' : 'let-op'}>
                    {Math.round(voorstel.zekerheid * 100)}%
                  </Etiket>{' '}
                  {voorstel.motivatie}
                </div>
              </div>
              <Knop klein onClick={() => void koppel(voorstel)} bezig={actie.bezig}>
                {t('bank.koppelen')}
              </Knop>
            </li>
          ))}
        </ul>
      )}

      <div className="veld">
        <label className="veld__label" htmlFor="rekening-keuze">
          {t('bank.opRekening')}
        </label>
        <select
          id="rekening-keuze"
          className="veld__invoer"
          value={rekeningId}
          onChange={(gebeurtenis) => zetRekeningId(gebeurtenis.target.value)}
        >
          <option value="">—</option>
          {grootboekrekeningen
            .filter((rekening) => ['expense', 'revenue'].includes(rekening.soort) && !rekening.geblokkeerd)
            .map((rekening) => (
              <option key={rekening.id} value={rekening.id}>
                {rekening.naam} ({rekening.code})
              </option>
            ))}
        </select>
      </div>

      <Knop soort="tweede" disabled={!rekeningId} onClick={() => void boekOpRekening()} bezig={actie.bezig}>
        {t('bank.boeken')}
      </Knop>
    </Kaart>
  );
}
