/**
 * Een factuur maken, bekijken, definitief maken en versturen.
 *
 * Een concept is vrij bewerkbaar. Definitief maken is een aparte, bewuste stap
 * met uitleg erbij van wat er dan verandert.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Money } from '@gedmma/money';
import { toonBedrag, toonDatum } from '@gedmma/i18n';
import { nieuweIdempotencyKey } from '../api/client.ts';
import type { BtwCode, Factuur, Factuurregel, Rekening, Relatie } from '../api/client.ts';
import { useApp } from '../context/App.tsx';
import { Etiket, Kaart, Keuzeveld, Knop, Laden, Melding, Tekstveld, Veld } from '../ontwerp/index.tsx';
import { useActie, useHaal, vandaag } from './gebruik.ts';

type Regelinvoer = {
  omschrijving: string;
  aantal: string;
  prijs: string;
  btwCodeId: string;
  rekeningId: string;
};

function legeRegel(btwCodeId: string, rekeningId: string): Regelinvoer {
  return { omschrijving: '', aantal: '1', prijs: '', btwCodeId, rekeningId };
}

export function FactuurScherm() {
  const { id } = useParams<{ id: string }>();
  const [zoekparameters] = useSearchParams();
  const navigeer = useNavigate();
  const { t, taal, administratieId, administratie, magIk } = useApp();
  const basis = `/api/v1/administraties/${administratieId}`;
  const nieuw = !id;
  const soort = zoekparameters.get('soort') === 'offerte' ? 'offerte' : 'factuur';

  const relaties = useHaal<{ items: Relatie[] }>(`${basis}/relaties?soort=klant&limiet=200`);
  const rekeningen = useHaal<{ rekeningen: Rekening[] }>(`${basis}/rekeningen`);
  const btwcodes = useHaal<{ btwcodes: BtwCode[] }>(`${basis}/btwcodes`);
  const bestaand = useHaal<{ factuur: Factuur; regels: Factuurregel[] }>(nieuw ? null : `${basis}/verkoopfacturen/${id}`);
  const actie = useActie();

  const [contactId, zetContactId] = useState('');
  const [factuurdatum, zetFactuurdatum] = useState(vandaag());
  const [referentie, zetReferentie] = useState('');
  const [notitie, zetNotitie] = useState('');
  const [regels, zetRegels] = useState<Regelinvoer[]>([]);
  const [melding, zetMelding] = useState<{ soort: 'goed' | 'let-op'; tekst: string } | null>(null);

  const verkoopcodes = useMemo(
    () => (btwcodes.gegevens?.btwcodes ?? []).filter((code) => code.soort !== 'inkoop' && code.geldig_tot === null),
    [btwcodes.gegevens],
  );
  const omzetrekeningen = useMemo(
    () => (rekeningen.gegevens?.rekeningen ?? []).filter((rekening) => rekening.soort === 'revenue' && !rekening.geblokkeerd),
    [rekeningen.gegevens],
  );

  // Beginwaarden zodra de keuzelijsten binnen zijn.
  useEffect(() => {
    if (regels.length > 0 || verkoopcodes.length === 0 || omzetrekeningen.length === 0) return;
    const standaardBtw = verkoopcodes.find((code) => code.code === 'VK-21') ?? verkoopcodes[0];
    const standaardRekening = omzetrekeningen.find((rekening) => rekening.code === '8000') ?? omzetrekeningen[0];
    if (standaardBtw && standaardRekening) {
      zetRegels([legeRegel(standaardBtw.id, standaardRekening.id)]);
    }
  }, [verkoopcodes, omzetrekeningen, regels.length]);

  useEffect(() => {
    const gegevens = bestaand.gegevens;
    if (!gegevens) return;
    zetContactId(gegevens.factuur.contact_id);
    zetFactuurdatum(gegevens.factuur.factuurdatum);
    zetReferentie(gegevens.factuur.referentie ?? '');
    zetNotitie(gegevens.factuur.notitie ?? '');
    zetRegels(
      gegevens.regels.map((regel) => ({
        omschrijving: regel.omschrijving,
        aantal: regel.aantal.replace(/\.?0+$/, ''),
        prijs: regel.prijs,
        btwCodeId: regel.tax_code_id,
        rekeningId: regel.ledger_account_id,
      })),
    );
  }, [bestaand.gegevens]);

  const valuta = bestaand.gegevens?.factuur.valuta ?? administratie?.administratie.valuta ?? 'EUR';
  const isConcept = nieuw || bestaand.gegevens?.factuur.status === 'concept';

  // Live totaal, zodat de gebruiker meteen ziet wat er onder de streep staat.
  const totalen = useMemo(() => {
    let exclusief = Money.nul(valuta);
    let btw = Money.nul(valuta);
    for (const regel of regels) {
      const prijs = Number(regel.prijs.replace(',', '.'));
      const aantal = Number(regel.aantal.replace(',', '.'));
      if (!Number.isFinite(prijs) || !Number.isFinite(aantal)) continue;
      const centen = BigInt(Math.round(prijs * aantal * 100));
      const regelbedrag = Money.vanEenheden(centen, valuta);
      const code = verkoopcodes.find((item) => item.id === regel.btwCodeId);
      const tarief = code ? Number(code.tarief) : 0;
      exclusief = exclusief.plus(regelbedrag);
      if (!code?.verlegd) {
        btw = btw.plus(Money.vanEenheden(BigInt(Math.round(Number(centen) * tarief)), valuta));
      }
    }
    return { exclusief, btw, inclusief: exclusief.plus(btw) };
  }, [regels, verkoopcodes, valuta]);

  async function bewaar(): Promise<string | null> {
    const lichaam = {
      contactId,
      soort,
      factuurdatum,
      referentie: referentie || null,
      notitie: notitie || null,
      regels: regels
        .filter((regel) => regel.omschrijving.trim() !== '')
        .map((regel) => ({
          omschrijving: regel.omschrijving,
          aantal: regel.aantal.replace(',', '.'),
          prijs: regel.prijs.replace(',', '.'),
          btwCodeId: regel.btwCodeId,
          rekeningId: regel.rekeningId,
        })),
    };

    if (nieuw) {
      const uitkomst = await actie.voerUit<{ id: string }>(`${basis}/verkoopfacturen`, {
        methode: 'POST',
        body: lichaam,
        idempotencyKey: nieuweIdempotencyKey(),
      });
      if (uitkomst) navigeer(`/facturen/${uitkomst.id}`, { replace: true });
      return uitkomst?.id ?? null;
    }

    const uitkomst = await actie.voerUit(`${basis}/verkoopfacturen/${id}`, {
      methode: 'PUT',
      body: lichaam,
      versie: bestaand.gegevens?.factuur.versie,
    });
    if (uitkomst) {
      bestaand.opnieuw();
      zetMelding({ soort: 'goed', tekst: t('algemeen.opslaan') });
    }
    return uitkomst ? (id ?? null) : null;
  }

  async function maakDefinitief() {
    const factuurId = id ?? (await bewaar());
    if (!factuurId) return;
    const uitkomst = await actie.voerUit<{ documentnummer: string }>(
      `${basis}/verkoopfacturen/${factuurId}/definitief`,
      { methode: 'POST', body: {}, idempotencyKey: nieuweIdempotencyKey() },
    );
    if (uitkomst) {
      bestaand.opnieuw();
      zetMelding({ soort: 'goed', tekst: `${t('facturen.nummer')} ${uitkomst.documentnummer}` });
    }
  }

  async function verstuur() {
    const uitkomst = await actie.voerUit<{ verzondenNaar: string; melding: string }>(
      `${basis}/verkoopfacturen/${id}/verstuur`,
      { methode: 'POST', body: {} },
    );
    if (uitkomst) {
      bestaand.opnieuw();
      zetMelding({ soort: 'goed', tekst: `${t('facturen.versturen')}: ${uitkomst.verzondenNaar}` });
    }
  }

  async function crediteer() {
    const uitkomst = await actie.voerUit<{ id: string }>(`${basis}/verkoopfacturen/${id}/crediteer`, {
      methode: 'POST',
      body: {},
      idempotencyKey: nieuweIdempotencyKey(),
    });
    if (uitkomst) navigeer(`/facturen/${uitkomst.id}`);
  }

  if (relaties.bezig || rekeningen.bezig || btwcodes.bezig || bestaand.bezig) {
    return <Laden tekst={t('algemeen.laden')} />;
  }

  const factuur = bestaand.gegevens?.factuur;

  return (
    <div className="stapel">
      <div className="paginakop">
        <div>
          <h1>
            {factuur?.documentnummer ?? (soort === 'offerte' ? t('facturen.nieuweOfferte') : t('facturen.nieuw'))}
          </h1>
          {factuur && (
            <p className="uitleg">
              <Etiket soort={factuur.status === 'betaald' ? 'goed' : 'info'}>
                {t(`facturen.status.${factuur.status}` as 'facturen.status.concept')}
              </Etiket>{' '}
              {factuur.contact_naam} · {toonDatum(factuur.factuurdatum, taal)}
            </p>
          )}
        </div>
        <div className="paginakop__acties">
          {!isConcept && (
            <>
              <a className="knop knop--tweede" href={`${basis}/verkoopfacturen/${id}/pdf`} target="_blank" rel="noreferrer">
                {t('facturen.pdf')}
              </a>
              <a className="knop knop--stil" href={`${basis}/verkoopfacturen/${id}/ubl`}>
                {t('facturen.ubl')}
              </a>
            </>
          )}
          {!isConcept && magIk('verkoop.versturen') && factuur?.status !== 'betaald' && (
            <Knop soort="tweede" onClick={() => void verstuur()} bezig={actie.bezig}>
              {t('facturen.versturen')}
            </Knop>
          )}
          {!isConcept && factuur?.soort === 'factuur' && magIk('verkoop.schrijven') && (
            <Knop soort="stil" onClick={() => void crediteer()} bezig={actie.bezig}>
              {t('facturen.crediteren')}
            </Knop>
          )}
        </div>
      </div>

      {actie.fout && (
        <Melding soort="fout" titel={actie.fout.titel}>
          {actie.fout.uitleg}
        </Melding>
      )}
      {melding && <Melding soort={melding.soort}>{melding.tekst}</Melding>}
      {bestaand.fout && (
        <Melding soort="fout" titel={bestaand.fout.titel}>
          {bestaand.fout.uitleg}
        </Melding>
      )}

      <Kaart>
        <div className="veldrij">
          <Keuzeveld
            label={t('facturen.klant')}
            value={contactId}
            onChange={(gebeurtenis) => zetContactId(gebeurtenis.target.value)}
            disabled={!isConcept}
            verplicht
            opties={[
              { waarde: '', tekst: '—' },
              ...(relaties.gegevens?.items ?? []).map((relatie) => ({ waarde: relatie.id, tekst: relatie.naam })),
            ]}
          />
          <Veld
            label={t('facturen.factuurdatum')}
            type="date"
            value={factuurdatum}
            onChange={(gebeurtenis) => zetFactuurdatum(gebeurtenis.target.value)}
            disabled={!isConcept}
            verplicht
          />
          <Veld
            label={t('facturen.referentie')}
            value={referentie}
            onChange={(gebeurtenis) => zetReferentie(gebeurtenis.target.value)}
            disabled={!isConcept}
          />
        </div>
      </Kaart>

      <Kaart
        titel={t('facturen.regels')}
        acties={
          isConcept && (
            <Knop
              soort="tweede"
              klein
              onClick={() => {
                const laatste = regels[regels.length - 1];
                zetRegels([
                  ...regels,
                  legeRegel(laatste?.btwCodeId ?? verkoopcodes[0]?.id ?? '', laatste?.rekeningId ?? omzetrekeningen[0]?.id ?? ''),
                ]);
              }}
            >
              {t('facturen.regelToevoegen')}
            </Knop>
          )
        }
      >
        {regels.map((regel, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gap: 'var(--ruimte-3)',
              gridTemplateColumns: 'minmax(12rem, 3fr) 5rem 7rem minmax(9rem, 1fr) auto',
              alignItems: 'end',
              marginBottom: 'var(--ruimte-3)',
            }}
          >
            <Veld
              label={t('algemeen.omschrijving')}
              value={regel.omschrijving}
              disabled={!isConcept}
              onChange={(gebeurtenis) =>
                zetRegels(regels.map((r, i) => (i === index ? { ...r, omschrijving: gebeurtenis.target.value } : r)))
              }
            />
            <Veld
              label={t('algemeen.aantal')}
              inputMode="decimal"
              value={regel.aantal}
              disabled={!isConcept}
              onChange={(gebeurtenis) =>
                zetRegels(regels.map((r, i) => (i === index ? { ...r, aantal: gebeurtenis.target.value } : r)))
              }
            />
            <Veld
              label={t('algemeen.prijs')}
              inputMode="decimal"
              value={regel.prijs}
              disabled={!isConcept}
              onChange={(gebeurtenis) =>
                zetRegels(regels.map((r, i) => (i === index ? { ...r, prijs: gebeurtenis.target.value } : r)))
              }
            />
            <Keuzeveld
              label={t('algemeen.btw')}
              value={regel.btwCodeId}
              disabled={!isConcept}
              onChange={(gebeurtenis) =>
                zetRegels(regels.map((r, i) => (i === index ? { ...r, btwCodeId: gebeurtenis.target.value } : r)))
              }
              opties={verkoopcodes.map((code) => ({ waarde: code.id, tekst: code.naam }))}
            />
            {isConcept && regels.length > 1 && (
              <Knop
                soort="stil"
                klein
                onClick={() => zetRegels(regels.filter((_, i) => i !== index))}
                aria-label={`${t('algemeen.verwijderen')} ${index + 1}`}
              >
                ✕
              </Knop>
            )}
          </div>
        ))}

        <div style={{ borderTop: '1px solid var(--kleur-rand)', paddingTop: 'var(--ruimte-4)', marginTop: 'var(--ruimte-4)' }}>
          <div className="rij rij--eind">
            <span className="uitleg">{t('facturen.subtotaal')}</span>
            <strong className="bedrag">{toonBedrag(totalen.exclusief.toString(), valuta, taal)}</strong>
          </div>
          <div className="rij rij--eind">
            <span className="uitleg">{t('algemeen.btw')}</span>
            <strong className="bedrag">{toonBedrag(totalen.btw.toString(), valuta, taal)}</strong>
          </div>
          <div className="rij rij--eind" style={{ fontSize: 'var(--tekst-l)' }}>
            <span>{t('facturen.totaal')}</span>
            <strong className="bedrag">{toonBedrag(totalen.inclusief.toString(), valuta, taal)}</strong>
          </div>
        </div>
      </Kaart>

      {isConcept && (
        <Kaart>
          <Tekstveld
            label={t('facturen.notitie')}
            value={notitie}
            onChange={(gebeurtenis) => zetNotitie(gebeurtenis.target.value)}
          />
          <p className="uitleg">{t('facturen.definitiefUitleg')}</p>
          <div className="rij">
            <Knop soort="tweede" onClick={() => void bewaar()} bezig={actie.bezig} disabled={!contactId}>
              {t('algemeen.opslaan')}
            </Knop>
            {magIk('journaal.definitief') && (
              <Knop onClick={() => void maakDefinitief()} bezig={actie.bezig} disabled={!contactId}>
                {t('facturen.definitiefMaken')}
              </Knop>
            )}
          </div>
        </Kaart>
      )}
    </div>
  );
}
