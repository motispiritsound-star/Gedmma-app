/**
 * Cijfers: balans, winst en verlies, saldibalans, btw en ouderdomsanalyse.
 * Elk bedrag is doorklikbaar naar de grootboekkaart en van daar naar de boeking.
 */
import { useState } from 'react';
import { NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toonBedrag, toonDatum } from '@gedmma/i18n';
import { useApp } from '../context/App.tsx';
import { Etiket, Kaart, Knop, Laden, Leegstaat, Melding, Tabelomhulsel, Veld } from '../ontwerp/index.tsx';
import { huidigJaar, useHaal } from './gebruik.ts';

export function Rapporten() {
  const { t } = useApp();
  return (
    <div className="stapel">
      <div className="paginakop">
        <h1>{t('rapport.titel')}</h1>
      </div>

      <nav aria-label={t('rapport.titel')}>
        <ul className="rij" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {[
            { pad: '/cijfers', tekst: t('rapport.balans'), einde: true },
            { pad: '/cijfers/winst-en-verlies', tekst: t('rapport.winstEnVerlies') },
            { pad: '/cijfers/saldibalans', tekst: t('rapport.saldibalans') },
            { pad: '/cijfers/btw', tekst: t('rapport.btw') },
            { pad: '/cijfers/ouderdom', tekst: t('rapport.ouderdom') },
          ].map((item) => (
            <li key={item.pad}>
              <NavLink to={item.pad} end={item.einde} className="knop knop--tweede knop--klein">
                {item.tekst}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <Routes>
        <Route index element={<Balans />} />
        <Route path="winst-en-verlies" element={<WinstEnVerlies />} />
        <Route path="saldibalans" element={<Saldibalans />} />
        <Route path="btw" element={<BtwOverzicht />} />
        <Route path="ouderdom" element={<Ouderdom />} />
        <Route path="grootboek/:rekeningId" element={<Grootboekkaart />} />
      </Routes>
    </div>
  );
}

function usePeriode() {
  const jaar = huidigJaar();
  const [zoek, zetZoek] = useSearchParams();
  return {
    vanaf: zoek.get('vanaf') ?? jaar.vanaf,
    tot: zoek.get('tot') ?? jaar.tot,
    zet: (velden: { vanaf?: string; tot?: string }) => {
      const nieuw = new URLSearchParams(zoek);
      if (velden.vanaf) nieuw.set('vanaf', velden.vanaf);
      if (velden.tot) nieuw.set('tot', velden.tot);
      zetZoek(nieuw, { replace: true });
    },
  };
}

function Periodekiezer({ vanaf, tot, zet, alleenPeildatum }: ReturnType<typeof usePeriode> & { alleenPeildatum?: boolean }) {
  const { t } = useApp();
  return (
    <div className="veldrij" style={{ maxWidth: '32rem' }}>
      {!alleenPeildatum && (
        <Veld label={t('algemeen.van')} type="date" value={vanaf} onChange={(g) => zet({ vanaf: g.target.value })} />
      )}
      <Veld
        label={alleenPeildatum ? 'Peildatum' : t('algemeen.tot')}
        type="date"
        value={tot}
        onChange={(g) => zet({ tot: g.target.value })}
      />
    </div>
  );
}

// --- Balans ----------------------------------------------------------------

type BalansRegel = {
  rekeningId: string;
  code: string;
  naam: string;
  rubriek: string;
  saldo: string;
  drilldown: { rekeningId: string; vanaf: string | null; tot: string };
};

function Balans() {
  const { t, taal, administratieId } = useApp();
  const periode = usePeriode();
  const navigeer = useNavigate();
  const { gegevens, bezig, fout } = useHaal<{
    peildatum: string;
    valuta: string;
    activa: BalansRegel[];
    passiva: BalansRegel[];
    totaalActiva: string;
    totaalPassiva: string;
    inBalans: boolean;
  }>(`/api/v1/administraties/${administratieId}/rapporten/balans?peildatum=${periode.tot}`);

  if (bezig) return <Laden tekst={t('algemeen.laden')} />;
  if (fout) return <Melding soort="fout" titel={fout.titel}>{fout.uitleg}</Melding>;
  if (!gegevens) return null;

  const kant = (titel: string, regels: BalansRegel[], totaal: string) => (
    <Kaart titel={titel} strak>
      <Tabelomhulsel bijschrift={titel}>
        <table className="tabel">
          <tbody>
            {regels.map((regel) => (
              <tr key={regel.rekeningId}>
                <td>
                  {regel.rekeningId === 'resultaat' ? (
                    regel.naam
                  ) : (
                    <button
                      type="button"
                      className="knop knop--stil knop--klein"
                      onClick={() =>
                        navigeer(
                          `/cijfers/grootboek/${regel.rekeningId}?vanaf=${periode.vanaf}&tot=${regel.drilldown.tot}`,
                        )
                      }
                    >
                      {regel.naam}
                    </button>
                  )}
                  <div className="uitleg">{regel.code}</div>
                </td>
                <td className="rechts bedrag">{toonBedrag(regel.saldo, gegevens.valuta, taal)}</td>
              </tr>
            ))}
            <tr className="tabel__totaal">
              <td>{t('algemeen.totaal')}</td>
              <td className="rechts bedrag">{toonBedrag(totaal, gegevens.valuta, taal)}</td>
            </tr>
          </tbody>
        </table>
      </Tabelomhulsel>
    </Kaart>
  );

  return (
    <div className="stapel">
      <p className="uitleg">{t('rapport.balansUitleg')}</p>
      <Periodekiezer {...periode} alleenPeildatum />
      {gegevens.inBalans ? (
        <Melding soort="goed">{t('rapport.inBalans')}</Melding>
      ) : (
        <Melding soort="fout">{t('rapport.nietInBalans')}</Melding>
      )}
      <p className="uitleg">{t('rapport.doorklikken')}</p>
      <div className="raster" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))' }}>
        {kant(t('rapport.activa'), gegevens.activa, gegevens.totaalActiva)}
        {kant(t('rapport.passiva'), gegevens.passiva, gegevens.totaalPassiva)}
      </div>
    </div>
  );
}

// --- Winst en verlies ------------------------------------------------------

type ResultaatRegel = {
  rekeningId: string;
  code: string;
  naam: string;
  bedrag: string;
  drilldown: { rekeningId: string; vanaf: string; tot: string };
};

function WinstEnVerlies() {
  const { t, taal, administratieId } = useApp();
  const periode = usePeriode();
  const navigeer = useNavigate();
  const { gegevens, bezig, fout } = useHaal<{
    valuta: string;
    opbrengsten: ResultaatRegel[];
    kosten: ResultaatRegel[];
    totaalOpbrengsten: string;
    totaalKosten: string;
    resultaat: string;
  }>(
    `/api/v1/administraties/${administratieId}/rapporten/winst-en-verlies?vanaf=${periode.vanaf}&tot=${periode.tot}`,
  );

  if (bezig) return <Laden tekst={t('algemeen.laden')} />;
  if (fout) return <Melding soort="fout" titel={fout.titel}>{fout.uitleg}</Melding>;
  if (!gegevens) return null;

  const blok = (titel: string, regels: ResultaatRegel[], totaal: string) => (
    <Kaart titel={titel} strak>
      {regels.length === 0 ? (
        <Leegstaat titel={t('rapport.geenGegevens')} />
      ) : (
        <Tabelomhulsel bijschrift={titel}>
          <table className="tabel">
            <tbody>
              {regels.map((regel) => (
                <tr key={regel.rekeningId}>
                  <td>
                    <button
                      type="button"
                      className="knop knop--stil knop--klein"
                      onClick={() =>
                        navigeer(
                          `/cijfers/grootboek/${regel.rekeningId}?vanaf=${regel.drilldown.vanaf}&tot=${regel.drilldown.tot}`,
                        )
                      }
                    >
                      {regel.naam}
                    </button>
                    <div className="uitleg">{regel.code}</div>
                  </td>
                  <td className="rechts bedrag">{toonBedrag(regel.bedrag, gegevens.valuta, taal)}</td>
                </tr>
              ))}
              <tr className="tabel__totaal">
                <td>{t('algemeen.totaal')}</td>
                <td className="rechts bedrag">{toonBedrag(totaal, gegevens.valuta, taal)}</td>
              </tr>
            </tbody>
          </table>
        </Tabelomhulsel>
      )}
    </Kaart>
  );

  return (
    <div className="stapel">
      <p className="uitleg">{t('rapport.winstEnVerliesUitleg')}</p>
      <Periodekiezer {...periode} />
      <div className="raster" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))' }}>
        {blok(t('rapport.opbrengsten'), gegevens.opbrengsten, gegevens.totaalOpbrengsten)}
        {blok(t('rapport.kosten'), gegevens.kosten, gegevens.totaalKosten)}
      </div>
      <Kaart>
        <div className="rij rij--eind" style={{ fontSize: 'var(--tekst-xl)' }}>
          <span>{t('rapport.resultaat')}</span>
          <strong className={`bedrag${gegevens.resultaat.startsWith('-') ? ' bedrag--negatief' : ''}`}>
            {toonBedrag(gegevens.resultaat, gegevens.valuta, taal)}
          </strong>
        </div>
      </Kaart>
    </div>
  );
}

// --- Saldibalans -----------------------------------------------------------

function Saldibalans() {
  const { t, taal, administratieId } = useApp();
  const periode = usePeriode();
  const { gegevens, bezig } = useHaal<{
    valuta: string;
    regels: { rekeningId: string; code: string; naam: string; debet: string; credit: string; saldoDebet: string; saldoCredit: string }[];
    totaalDebet: string;
    totaalCredit: string;
    sluit: boolean;
  }>(`/api/v1/administraties/${administratieId}/rapporten/saldibalans?vanaf=${periode.vanaf}&tot=${periode.tot}`);

  if (bezig) return <Laden tekst={t('algemeen.laden')} />;
  if (!gegevens) return null;

  return (
    <div className="stapel">
      <Periodekiezer {...periode} />
      {gegevens.sluit ? <Melding soort="goed">{t('rapport.inBalans')}</Melding> : <Melding soort="fout">{t('rapport.nietInBalans')}</Melding>}
      <Kaart strak>
        <Tabelomhulsel bijschrift={t('rapport.saldibalans')}>
          <table className="tabel">
            <thead>
              <tr>
                <th scope="col">{t('rapport.grootboek')}</th>
                <th scope="col" className="rechts">Debet</th>
                <th scope="col" className="rechts">Credit</th>
                <th scope="col" className="rechts">Saldo debet</th>
                <th scope="col" className="rechts">Saldo credit</th>
              </tr>
            </thead>
            <tbody>
              {gegevens.regels.map((regel) => (
                <tr key={regel.rekeningId}>
                  <td>
                    {regel.naam}
                    <div className="uitleg">{regel.code}</div>
                  </td>
                  <td className="rechts bedrag">{toonBedrag(regel.debet, gegevens.valuta, taal)}</td>
                  <td className="rechts bedrag">{toonBedrag(regel.credit, gegevens.valuta, taal)}</td>
                  <td className="rechts bedrag">{toonBedrag(regel.saldoDebet, gegevens.valuta, taal)}</td>
                  <td className="rechts bedrag">{toonBedrag(regel.saldoCredit, gegevens.valuta, taal)}</td>
                </tr>
              ))}
              <tr className="tabel__totaal">
                <td>{t('algemeen.totaal')}</td>
                <td className="rechts bedrag">{toonBedrag(gegevens.totaalDebet, gegevens.valuta, taal)}</td>
                <td className="rechts bedrag">{toonBedrag(gegevens.totaalCredit, gegevens.valuta, taal)}</td>
                <td colSpan={2} />
              </tr>
            </tbody>
          </table>
        </Tabelomhulsel>
      </Kaart>
    </div>
  );
}

// --- Btw -------------------------------------------------------------------

function BtwOverzicht() {
  const { t, taal, administratieId } = useApp();
  const periode = usePeriode();
  const { gegevens, bezig } = useHaal<{
    valuta: string;
    vakken: { vak: string; omschrijving: string; grondslag: string; btw: string }[];
    teBetalen: string;
    teVorderen: string;
    saldo: string;
    aansluiting: { sluitAan: boolean; verschil: string };
    waarschuwingen: { soort: string; melding: string; hint: string }[];
    voorbehoud: string;
  }>(`/api/v1/administraties/${administratieId}/rapporten/btw?vanaf=${periode.vanaf}&tot=${periode.tot}`);

  if (bezig) return <Laden tekst={t('algemeen.laden')} />;
  if (!gegevens) return null;

  return (
    <div className="stapel">
      <Periodekiezer {...periode} />

      <Melding soort="info" titel={t('rapport.btw')}>
        {gegevens.voorbehoud}
      </Melding>

      {gegevens.waarschuwingen.map((waarschuwing) => (
        <Melding key={waarschuwing.soort + waarschuwing.melding} soort="let-op" titel={waarschuwing.melding}>
          {waarschuwing.hint}
        </Melding>
      ))}

      <Kaart strak>
        {gegevens.vakken.length === 0 ? (
          <Leegstaat titel={t('rapport.geenGegevens')} />
        ) : (
          <Tabelomhulsel bijschrift={t('rapport.btw')}>
            <table className="tabel tabel--stapelbaar">
              <thead>
                <tr>
                  <th scope="col">Vak</th>
                  <th scope="col">{t('algemeen.omschrijving')}</th>
                  <th scope="col" className="rechts">Grondslag</th>
                  <th scope="col" className="rechts">{t('algemeen.btw')}</th>
                </tr>
              </thead>
              <tbody>
                {gegevens.vakken.map((vak) => (
                  <tr key={vak.vak}>
                    <td data-label="Vak"><Etiket>{vak.vak}</Etiket></td>
                    <td data-label={t('algemeen.omschrijving')}>{vak.omschrijving}</td>
                    <td data-label="Grondslag" className="rechts bedrag">
                      {toonBedrag(vak.grondslag, gegevens.valuta, taal)}
                    </td>
                    <td data-label={t('algemeen.btw')} className="rechts bedrag">
                      {toonBedrag(vak.btw, gegevens.valuta, taal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Tabelomhulsel>
        )}
      </Kaart>

      <div className="raster">
        <Kaart titel={t('rapport.btwTeBetalen')}>
          <strong className="bedrag" style={{ fontSize: 'var(--tekst-xl)' }}>
            {toonBedrag(gegevens.teBetalen, gegevens.valuta, taal)}
          </strong>
        </Kaart>
        <Kaart titel={t('rapport.btwTeVorderen')}>
          <strong className="bedrag" style={{ fontSize: 'var(--tekst-xl)' }}>
            {toonBedrag(gegevens.teVorderen, gegevens.valuta, taal)}
          </strong>
        </Kaart>
        <Kaart titel={t('rapport.btwSaldo')}>
          <strong className="bedrag" style={{ fontSize: 'var(--tekst-xl)' }}>
            {toonBedrag(gegevens.saldo, gegevens.valuta, taal)}
          </strong>
        </Kaart>
      </div>

      <Kaart titel={t('rapport.btwAansluiting')}>
        {gegevens.aansluiting.sluitAan ? (
          <Melding soort="goed">{t('rapport.btwSluitAan')}</Melding>
        ) : (
          <Melding soort="let-op">
            {t('bank.verschil')}: {toonBedrag(gegevens.aansluiting.verschil, gegevens.valuta, taal)}
          </Melding>
        )}
      </Kaart>
    </div>
  );
}

// --- Ouderdomsanalyse ------------------------------------------------------

function Ouderdom() {
  const { t, taal, administratieId } = useApp();
  const periode = usePeriode();
  const [soort, zetSoort] = useState<'debiteuren' | 'crediteuren'>('debiteuren');
  const { gegevens, bezig } = useHaal<{
    valuta: string;
    totaal: string;
    regels: {
      contactId: string;
      relatie: string;
      totaal: string;
      nietVervallen: string;
      tot30: string;
      tot60: string;
      tot90: string;
      ouder: string;
    }[];
  }>(
    `/api/v1/administraties/${administratieId}/rapporten/ouderdomsanalyse?soort=${soort}&peildatum=${periode.tot}`,
  );

  return (
    <div className="stapel">
      <div className="rij">
        <Knop soort={soort === 'debiteuren' ? 'eerste' : 'tweede'} klein onClick={() => zetSoort('debiteuren')}>
          {t('dashboard.teOntvangen')}
        </Knop>
        <Knop soort={soort === 'crediteuren' ? 'eerste' : 'tweede'} klein onClick={() => zetSoort('crediteuren')}>
          {t('dashboard.teBetalen')}
        </Knop>
      </div>
      <Periodekiezer {...periode} alleenPeildatum />

      <Kaart strak>
        {bezig ? (
          <Laden tekst={t('algemeen.laden')} />
        ) : (gegevens?.regels.length ?? 0) === 0 ? (
          <Leegstaat titel={t('rapport.geenGegevens')} />
        ) : (
          <Tabelomhulsel bijschrift={t('rapport.ouderdom')}>
            <table className="tabel tabel--stapelbaar">
              <thead>
                <tr>
                  <th scope="col">{t('relaties.naam')}</th>
                  <th scope="col" className="rechts">Nog niet vervallen</th>
                  <th scope="col" className="rechts">1-30 dagen</th>
                  <th scope="col" className="rechts">31-60 dagen</th>
                  <th scope="col" className="rechts">61-90 dagen</th>
                  <th scope="col" className="rechts">Ouder</th>
                  <th scope="col" className="rechts">{t('algemeen.totaal')}</th>
                </tr>
              </thead>
              <tbody>
                {gegevens?.regels.map((regel) => (
                  <tr key={regel.contactId}>
                    <td data-label={t('relaties.naam')}>{regel.relatie}</td>
                    <td data-label="Nog niet vervallen" className="rechts bedrag">{toonBedrag(regel.nietVervallen, gegevens.valuta, taal)}</td>
                    <td data-label="1-30" className="rechts bedrag">{toonBedrag(regel.tot30, gegevens.valuta, taal)}</td>
                    <td data-label="31-60" className="rechts bedrag">{toonBedrag(regel.tot60, gegevens.valuta, taal)}</td>
                    <td data-label="61-90" className="rechts bedrag">{toonBedrag(regel.tot90, gegevens.valuta, taal)}</td>
                    <td data-label="Ouder" className="rechts bedrag">{toonBedrag(regel.ouder, gegevens.valuta, taal)}</td>
                    <td data-label={t('algemeen.totaal')} className="rechts bedrag"><strong>{toonBedrag(regel.totaal, gegevens.valuta, taal)}</strong></td>
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

// --- Grootboekkaart (de drilldown) ----------------------------------------

function Grootboekkaart() {
  const { rekeningId } = useParams<{ rekeningId: string }>();
  const { t, taal, administratieId } = useApp();
  const periode = usePeriode();
  const { gegevens, bezig } = useHaal<{
    rekening: { code: string; naam: string };
    valuta: string;
    beginsaldo: string;
    eindsaldo: string;
    mutaties: {
      postId: string;
      postnummer: string | null;
      boekdatum: string;
      dagboek: string;
      omschrijving: string;
      relatie: string | null;
      debet: string;
      credit: string;
      saldoNa: string;
      bronSoort: string | null;
      bronId: string | null;
      documentId: string | null;
    }[];
  }>(
    `/api/v1/administraties/${administratieId}/rapporten/grootboekkaart/${rekeningId}?vanaf=${periode.vanaf}&tot=${periode.tot}`,
  );

  if (bezig) return <Laden tekst={t('algemeen.laden')} />;
  if (!gegevens) return null;

  return (
    <div className="stapel">
      <div className="paginakop">
        <div>
          <h2>
            {gegevens.rekening.naam} <span className="uitleg">({gegevens.rekening.code})</span>
          </h2>
          <p className="uitleg">
            {t('algemeen.van')} {toonDatum(periode.vanaf, taal)} {t('algemeen.tot')} {toonDatum(periode.tot, taal)}
          </p>
        </div>
      </div>

      <Kaart strak>
        <Tabelomhulsel bijschrift={t('rapport.grootboek')}>
          <table className="tabel tabel--stapelbaar">
            <thead>
              <tr>
                <th scope="col">{t('algemeen.datum')}</th>
                <th scope="col">Boekstuk</th>
                <th scope="col">{t('algemeen.omschrijving')}</th>
                <th scope="col" className="rechts">Debet</th>
                <th scope="col" className="rechts">Credit</th>
                <th scope="col" className="rechts">Saldo</th>
                <th scope="col">Bewijs</th>
              </tr>
            </thead>
            <tbody>
              {gegevens.mutaties.map((mutatie, index) => (
                <tr key={`${mutatie.postId}-${index}`}>
                  <td data-label={t('algemeen.datum')}>{toonDatum(mutatie.boekdatum, taal)}</td>
                  <td data-label="Boekstuk">
                    <Etiket>{mutatie.dagboek}</Etiket> {mutatie.postnummer ?? ''}
                  </td>
                  <td data-label={t('algemeen.omschrijving')}>
                    {mutatie.omschrijving}
                    {mutatie.relatie && <div className="uitleg">{mutatie.relatie}</div>}
                  </td>
                  <td data-label="Debet" className="rechts bedrag">{toonBedrag(mutatie.debet, gegevens.valuta, taal)}</td>
                  <td data-label="Credit" className="rechts bedrag">{toonBedrag(mutatie.credit, gegevens.valuta, taal)}</td>
                  <td data-label="Saldo" className="rechts bedrag">{toonBedrag(mutatie.saldoNa, gegevens.valuta, taal)}</td>
                  <td data-label="Bewijs">
                    {mutatie.bronSoort === 'sales_invoice' && mutatie.bronId && (
                      <a href={`/facturen/${mutatie.bronId}`}>{t('facturen.titel')}</a>
                    )}
                    {mutatie.documentId && (
                      <a
                        href={`/api/v1/administraties/${administratieId}/documenten/${mutatie.documentId}/inhoud`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t('inkoop.document')}
                      </a>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="tabel__totaal">
                <td colSpan={5}>{t('algemeen.totaal')}</td>
                <td className="rechts bedrag">{toonBedrag(gegevens.eindsaldo, gegevens.valuta, taal)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </Tabelomhulsel>
      </Kaart>
    </div>
  );
}
