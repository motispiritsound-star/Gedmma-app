/** Bonnen en inkoopfacturen vastleggen, met het originele document erbij. */
import { useMemo, useState } from 'react';
import { toonBedrag, toonDatum } from '@gedmma/i18n';
import { useApp } from '../context/App.tsx';
import { Etiket, Kaart, Keuzeveld, Knop, Laden, Leegstaat, Melding, Tabelomhulsel, Veld } from '../ontwerp/index.tsx';
import { useActie, useHaal, vandaag } from './gebruik.ts';
import { nieuweIdempotencyKey, type BtwCode, type Rekening, type Relatie } from '../api/client.ts';

type Inkoopfactuur = {
  id: string;
  contact_naam: string;
  leveranciersnummer: string | null;
  status: string;
  factuurdatum: string;
  vervaldatum: string | null;
  valuta: string;
  totaal_inclusief: string;
  betaald_bedrag: string;
  document_id: string | null;
};

export function Inkoop() {
  const { t, taal, administratieId, magIk } = useApp();
  const basis = `/api/v1/administraties/${administratieId}`;
  const lijst = useHaal<{ items: Inkoopfactuur[] }>(`${basis}/inkoopfacturen?limiet=100`);
  const relaties = useHaal<{ items: Relatie[] }>(`${basis}/relaties?soort=leverancier&limiet=200`);
  const rekeningen = useHaal<{ rekeningen: Rekening[] }>(`${basis}/rekeningen`);
  const btwcodes = useHaal<{ btwcodes: BtwCode[] }>(`${basis}/btwcodes`);
  const ontbrekend = useHaal<{ items: { id: string; boekdatum: string; bedrag: string; tegenpartij: string | null }[] }>(
    `${basis}/ontbrekende-bonnen`,
  );
  const actie = useActie();

  const [open, zetOpen] = useState(false);
  const [contactId, zetContactId] = useState('');
  const [nummer, zetNummer] = useState('');
  const [datum, zetDatum] = useState(vandaag());
  const [omschrijving, zetOmschrijving] = useState('');
  const [bedrag, zetBedrag] = useState('');
  const [inclusiefBtw, zetInclusiefBtw] = useState(true);
  const [btwCodeId, zetBtwCodeId] = useState('');
  const [rekeningId, zetRekeningId] = useState('');
  const [bestand, zetBestand] = useState<File | null>(null);
  const [melding, zetMelding] = useState<string | null>(null);

  const inkoopcodes = useMemo(
    () => (btwcodes.gegevens?.btwcodes ?? []).filter((code) => code.soort !== 'verkoop' && code.geldig_tot === null),
    [btwcodes.gegevens],
  );
  const kostenrekeningen = useMemo(
    () => (rekeningen.gegevens?.rekeningen ?? []).filter((rekening) => rekening.soort === 'expense' && !rekening.geblokkeerd),
    [rekeningen.gegevens],
  );

  async function bewaar() {
    let documentId: string | null = null;

    if (bestand) {
      const inhoud = await bestand.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(inhoud)));
      const document = await actie.voerUit<{ id: string }>(`${basis}/documenten`, {
        methode: 'POST',
        body: {
          bestandsnaam: bestand.name,
          mime: bestand.type || 'application/pdf',
          soort: 'inkoopfactuur',
          inhoudBase64: base64,
        },
      });
      if (!document) return;
      documentId = document.id;
    }

    const uitkomst = await actie.voerUit<{ id: string }>(`${basis}/inkoopfacturen`, {
      methode: 'POST',
      idempotencyKey: nieuweIdempotencyKey(),
      body: {
        contactId,
        leveranciersnummer: nummer || null,
        factuurdatum: datum,
        omschrijving: omschrijving || null,
        documentId,
        regels: [
          {
            omschrijving: omschrijving || t('inkoop.titel'),
            prijs: bedrag.replace(',', '.'),
            btwCodeId,
            rekeningId,
            inclusiefBtw,
          },
        ],
      },
    });

    if (!uitkomst) return;

    if (magIk('journaal.definitief')) {
      await actie.voerUit(`${basis}/inkoopfacturen/${uitkomst.id}/definitief`, {
        methode: 'POST',
        body: {},
        idempotencyKey: nieuweIdempotencyKey(),
      });
    }

    zetMelding(t('algemeen.opslaan'));
    zetOpen(false);
    zetNummer('');
    zetBedrag('');
    zetOmschrijving('');
    zetBestand(null);
    lijst.opnieuw();
    ontbrekend.opnieuw();
  }

  const klaarOmOpTeSlaan = contactId && bedrag && btwCodeId && rekeningId;

  return (
    <div className="stapel">
      <div className="paginakop">
        <h1>{t('inkoop.titel')}</h1>
        {magIk('inkoop.schrijven') && (
          <Knop onClick={() => zetOpen(!open)} aria-expanded={open}>
            {t('inkoop.nieuw')}
          </Knop>
        )}
      </div>

      {actie.fout && (
        <Melding soort="fout" titel={actie.fout.titel}>
          {actie.fout.uitleg}
        </Melding>
      )}
      {melding && <Melding soort="goed">{melding}</Melding>}

      {(ontbrekend.gegevens?.items.length ?? 0) > 0 && (
        <Melding soort="let-op" titel={t('dashboard.ontbrekendeBonnen')}>
          Er zijn {ontbrekend.gegevens?.items.length} uitgaven op je bankrekening waar nog geen bon bij zit. Bewaar
          bonnetjes bij je administratie; dat is wettelijk verplicht.
        </Melding>
      )}

      {open && (
        <Kaart titel={t('inkoop.nieuw')}>
          <div className="veldrij">
            <Keuzeveld
              label={t('inkoop.leverancier')}
              value={contactId}
              onChange={(g) => zetContactId(g.target.value)}
              verplicht
              opties={[
                { waarde: '', tekst: '—' },
                ...(relaties.gegevens?.items ?? []).map((relatie) => ({ waarde: relatie.id, tekst: relatie.naam })),
              ]}
            />
            <Veld
              label={t('inkoop.factuurnummer')}
              uitleg="Hiermee herkennen we of je dezelfde factuur al eerder hebt vastgelegd."
              value={nummer}
              onChange={(g) => zetNummer(g.target.value)}
            />
            <Veld label={t('algemeen.datum')} type="date" value={datum} onChange={(g) => zetDatum(g.target.value)} verplicht />
          </div>

          <div className="veldrij">
            <Veld
              label={t('algemeen.omschrijving')}
              value={omschrijving}
              onChange={(g) => zetOmschrijving(g.target.value)}
            />
            <Veld
              label={t('algemeen.bedrag')}
              inputMode="decimal"
              value={bedrag}
              onChange={(g) => zetBedrag(g.target.value)}
              uitleg={inclusiefBtw ? 'Bedrag inclusief btw, zoals op de bon staat.' : 'Bedrag exclusief btw.'}
              verplicht
            />
            <Keuzeveld
              label={t('algemeen.btw')}
              value={btwCodeId}
              onChange={(g) => zetBtwCodeId(g.target.value)}
              verplicht
              opties={[
                { waarde: '', tekst: '—' },
                ...inkoopcodes.map((code) => ({ waarde: code.id, tekst: code.naam })),
              ]}
            />
          </div>

          <div className="veldrij">
            <Keuzeveld
              label="Waar hoort dit bij?"
              uitleg="Kies de kostensoort. Weet je het niet zeker, kies dan Algemene kosten; je kunt het later corrigeren."
              value={rekeningId}
              onChange={(g) => zetRekeningId(g.target.value)}
              verplicht
              opties={[
                { waarde: '', tekst: '—' },
                ...kostenrekeningen.map((rekening) => ({
                  waarde: rekening.id,
                  tekst: `${rekening.naam} (${rekening.code})`,
                })),
              ]}
            />
            <div className="veld">
              <span className="veld__label">{t('inkoop.document')}</span>
              <input
                className="veld__invoer"
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(gebeurtenis) => zetBestand(gebeurtenis.target.files?.[0] ?? null)}
                style={{ paddingTop: '0.55rem' }}
              />
              <span className="veld__uitleg">{t('inkoop.documentUitleg')}</span>
            </div>
          </div>

          <label className="rij" style={{ marginBottom: 'var(--ruimte-4)' }}>
            <input
              type="checkbox"
              checked={inclusiefBtw}
              onChange={(gebeurtenis) => zetInclusiefBtw(gebeurtenis.target.checked)}
            />
            <span>Het bedrag is inclusief btw</span>
          </label>

          <div className="rij">
            <Knop onClick={() => void bewaar()} bezig={actie.bezig} disabled={!klaarOmOpTeSlaan}>
              {t('algemeen.opslaan')}
            </Knop>
            <Knop soort="stil" onClick={() => zetOpen(false)}>
              {t('algemeen.annuleren')}
            </Knop>
          </div>
        </Kaart>
      )}

      <Kaart strak titel={t('inkoop.titel')}>
        {lijst.bezig ? (
          <Laden tekst={t('algemeen.laden')} />
        ) : (lijst.gegevens?.items.length ?? 0) === 0 ? (
          <Leegstaat titel={t('inkoop.leeg')} />
        ) : (
          <Tabelomhulsel bijschrift={t('inkoop.titel')}>
            <table className="tabel tabel--stapelbaar">
              <thead>
                <tr>
                  <th scope="col">{t('inkoop.leverancier')}</th>
                  <th scope="col">{t('inkoop.factuurnummer')}</th>
                  <th scope="col">{t('algemeen.datum')}</th>
                  <th scope="col" className="rechts">
                    {t('algemeen.totaal')}
                  </th>
                  <th scope="col">{t('algemeen.status')}</th>
                  <th scope="col">{t('inkoop.document')}</th>
                </tr>
              </thead>
              <tbody>
                {lijst.gegevens?.items.map((factuur) => (
                  <tr key={factuur.id}>
                    <td data-label={t('inkoop.leverancier')}>{factuur.contact_naam}</td>
                    <td data-label={t('inkoop.factuurnummer')}>{factuur.leveranciersnummer ?? '—'}</td>
                    <td data-label={t('algemeen.datum')}>{toonDatum(factuur.factuurdatum, taal)}</td>
                    <td data-label={t('algemeen.totaal')} className="rechts bedrag">
                      {toonBedrag(factuur.totaal_inclusief, factuur.valuta, taal)}
                    </td>
                    <td data-label={t('algemeen.status')}>
                      <Etiket soort={factuur.status === 'betaald' ? 'goed' : 'neutraal'}>{factuur.status}</Etiket>
                    </td>
                    <td data-label={t('inkoop.document')}>
                      {factuur.document_id ? (
                        <a href={`${basis}/documenten/${factuur.document_id}/inhoud`} target="_blank" rel="noreferrer">
                          {t('algemeen.downloaden')}
                        </a>
                      ) : (
                        <Etiket soort="let-op">—</Etiket>
                      )}
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
