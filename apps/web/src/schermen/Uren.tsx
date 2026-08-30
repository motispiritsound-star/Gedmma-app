/**
 * Uren en projecten.
 *
 * Twee schermen achter een tabblad: "Mijn uren" om te schrijven en in te
 * dienen, en "Projecten" om te zien wat er per project klaarstaat en om dat te
 * factureren.
 *
 * Wat hier bewust zichtbaar is gemaakt:
 *   - de duur wordt in uren en minuten ingevuld, want zo denkt een mens;
 *     onder water zijn het minuten, want zo rekent de administratie;
 *   - wie alleen zijn eigen uren mag zien, krijgt dat te lezen in plaats van
 *     een lege lijst zonder uitleg;
 *   - factureren maakt een concept en zegt dat er ook bij.
 */
import { useMemo, useState } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { toonDatum } from '@gedmma/i18n';
import { useApp } from '../context/App.tsx';
import {
  Etiket,
  Kaart,
  Kerncijfer,
  Keuzeveld,
  Knop,
  Laden,
  Leegstaat,
  Melding,
  Tabelomhulsel,
  Veld,
} from '../ontwerp/index.tsx';
import { huidigJaar, useActie, useHaal, vandaag } from './gebruik.ts';
import type {
  Project,
  Projectactiviteit,
  Projectsamenvatting,
  Relatie,
  Urenlijst,
} from '../api/client.ts';

const STATUSKLEUR: Record<string, 'neutraal' | 'goed' | 'let-op' | 'fout' | 'info'> = {
  concept: 'neutraal',
  ingediend: 'info',
  goedgekeurd: 'goed',
  afgekeurd: 'fout',
  gefactureerd: 'neutraal',
};

/** 150 minuten wordt "2:30". Zo leest een urenstaat prettiger dan "2,5". */
export function toonDuur(minuten: number): string {
  const uren = Math.floor(minuten / 60);
  return `${uren}:${String(minuten % 60).padStart(2, '0')}`;
}

export function Uren() {
  const { t } = useApp();
  return (
    <div className="stapel">
      <div className="paginakop">
        <h1>{t('uren.titel')}</h1>
      </div>

      <nav aria-label={t('uren.titel')}>
        <ul className="rij" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          <li>
            <NavLink to="/uren" end className="knop knop--tweede knop--klein">
              {t('uren.weekstaat')}
            </NavLink>
          </li>
          <li>
            <NavLink to="/uren/projecten" className="knop knop--tweede knop--klein">
              {t('uren.projecten')}
            </NavLink>
          </li>
        </ul>
      </nav>

      <Routes>
        <Route index element={<Urenstaat />} />
        <Route path="projecten" element={<Projecten />} />
      </Routes>
    </div>
  );
}

// --- Urenstaat -------------------------------------------------------------

function Urenstaat() {
  const { t, taal, administratieId, magIk } = useApp();
  const jaar = huidigJaar();

  const [vanaf, zetVanaf] = useState(jaar.vanaf);
  const [tot, zetTot] = useState(jaar.tot);
  const [gekozen, zetGekozen] = useState<Set<string>>(new Set());
  const [melding, zetMelding] = useState<string | null>(null);

  const projecten = useHaal<{ projecten: Project[] }>(
    `/api/v1/administraties/${administratieId}/projecten?status=actief`,
  );
  const uren = useHaal<Urenlijst>(
    `/api/v1/administraties/${administratieId}/uren?vanaf=${vanaf}&tot=${tot}`,
  );
  const actie = useActie();

  const teKiezen = useMemo(
    () => (uren.gegevens?.items ?? []).filter((uur) => uur.status === 'concept' || uur.status === 'ingediend'),
    [uren.gegevens],
  );

  function wissel(id: string): void {
    zetGekozen((huidig) => {
      const nieuw = new Set(huidig);
      if (nieuw.has(id)) nieuw.delete(id);
      else nieuw.add(id);
      return nieuw;
    });
  }

  async function verstuur(pad: string, body: Record<string, unknown>, gelukt: string): Promise<void> {
    const uitkomst = await actie.voerUit(`/api/v1/administraties/${administratieId}${pad}`, {
      methode: 'POST',
      body,
    });
    if (uitkomst) {
      zetMelding(gelukt);
      zetGekozen(new Set());
      uren.opnieuw();
    }
  }

  return (
    <div className="stapel">
      {melding && (
        <Melding soort="goed" titel={melding}>
          {t('uren.factureerUitleg')}
        </Melding>
      )}
      {(uren.fout ?? actie.fout) && (
        <Melding soort="fout" titel={(uren.fout ?? actie.fout)!.titel}>
          {(uren.fout ?? actie.fout)!.uitleg}
        </Melding>
      )}
      {uren.gegevens?.alleenEigenUren && <Melding soort="info">{t('uren.alleenEigen')}</Melding>}

      {magIk('uren.schrijven') && (
        <UurFormulier
          projecten={projecten.gegevens?.projecten ?? []}
          opGeschreven={() => {
            uren.opnieuw();
            zetMelding(null);
          }}
        />
      )}

      <Kaart>
        <div className="filterbalk">
          <Veld
            label={t('algemeen.van')}
            type="date"
            value={vanaf}
            onChange={(gebeurtenis) => zetVanaf(gebeurtenis.target.value)}
          />
          <Veld
            label={t('algemeen.tot')}
            type="date"
            value={tot}
            onChange={(gebeurtenis) => zetTot(gebeurtenis.target.value)}
          />
          <Kerncijfer
            label={t('uren.totaalDezeWeek')}
            waarde={`${toonDuur(uren.gegevens?.totaalMinuten ?? 0)} ${t('uren.uur')}`}
          />
        </div>
      </Kaart>

      {gekozen.size > 0 && (
        <Kaart>
          <div className="rij">
            <strong>
              {gekozen.size} {t('uren.selectie')}
            </strong>
            <Knop
              soort="tweede"
              klein
              bezig={actie.bezig}
              onClick={() => void verstuur('/uren/indienen', { ids: [...gekozen] }, t('uren.indienen'))}
            >
              {t('uren.indienen')}
            </Knop>
            {magIk('uren.goedkeuren') && (
              <>
                <Knop
                  klein
                  bezig={actie.bezig}
                  onClick={() =>
                    void verstuur('/uren/beoordelen', { ids: [...gekozen], goedgekeurd: true }, t('uren.goedkeuren'))
                  }
                >
                  {t('uren.goedkeuren')}
                </Knop>
                <Knop
                  soort="gevaar"
                  klein
                  bezig={actie.bezig}
                  onClick={() => {
                    const reden = window.prompt(t('uren.afkeurreden')) ?? '';
                    void verstuur(
                      '/uren/beoordelen',
                      { ids: [...gekozen], goedgekeurd: false, reden },
                      t('uren.afkeuren'),
                    );
                  }}
                >
                  {t('uren.afkeuren')}
                </Knop>
              </>
            )}
          </div>
        </Kaart>
      )}

      <Kaart strak>
        {uren.bezig && !uren.gegevens ? (
          <div style={{ padding: 'var(--ruimte-5)' }}>
            <Laden tekst={t('algemeen.laden')} />
          </div>
        ) : (uren.gegevens?.items.length ?? 0) === 0 ? (
          <Leegstaat titel={t('uren.leeg')} uitleg={t('uren.legUitleg')} />
        ) : (
          <Tabelomhulsel bijschrift={t('uren.titel')}>
            <table className="tabel tabel--stapelbaar">
              <thead>
                <tr>
                  <th scope="col">
                    <span className="alleen-schermlezer">{t('uren.selecteerAlles')}</span>
                    <input
                      type="checkbox"
                      aria-label={t('uren.selecteerAlles')}
                      checked={gekozen.size > 0 && gekozen.size === teKiezen.length}
                      onChange={(gebeurtenis) =>
                        zetGekozen(gebeurtenis.target.checked ? new Set(teKiezen.map((u) => u.id)) : new Set())
                      }
                    />
                  </th>
                  <th scope="col">{t('algemeen.datum')}</th>
                  <th scope="col">{t('uren.project')}</th>
                  <th scope="col">{t('algemeen.omschrijving')}</th>
                  <th scope="col">{t('uren.wie')}</th>
                  <th scope="col" className="rechts">
                    {t('uren.duur')}
                  </th>
                  <th scope="col">{t('algemeen.status')}</th>
                </tr>
              </thead>
              <tbody>
                {uren.gegevens?.items.map((uur) => (
                  <tr key={uur.id}>
                    <td data-label={t('uren.selectie')}>
                      <input
                        type="checkbox"
                        aria-label={`${uur.datum} ${uur.omschrijving}`}
                        disabled={uur.status === 'gefactureerd' || uur.status === 'goedgekeurd'}
                        checked={gekozen.has(uur.id)}
                        onChange={() => wissel(uur.id)}
                      />
                    </td>
                    <td data-label={t('algemeen.datum')}>{toonDatum(uur.datum, taal)}</td>
                    <td data-label={t('uren.project')}>
                      {uur.project_naam}
                      {uur.activiteit_naam && <span className="uitleg"> · {uur.activiteit_naam}</span>}
                    </td>
                    <td data-label={t('algemeen.omschrijving')}>{uur.omschrijving}</td>
                    <td data-label={t('uren.wie')}>{uur.gebruiker_naam}</td>
                    <td data-label={t('uren.duur')} className="rechts bedrag">
                      {toonDuur(uur.minuten)}
                    </td>
                    <td data-label={t('algemeen.status')}>
                      <Etiket soort={STATUSKLEUR[uur.status] ?? 'neutraal'}>
                        {t(`uren.status.${uur.status}` as 'uren.status.concept')}
                      </Etiket>
                      {uur.factuurnummer && <span className="uitleg"> {uur.factuurnummer}</span>}
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

// --- Uren schrijven --------------------------------------------------------

function UurFormulier({ projecten, opGeschreven }: { projecten: Project[]; opGeschreven: () => void }) {
  const { t, administratieId } = useApp();
  const actie = useActie();

  const [projectId, zetProjectId] = useState('');
  const [activiteitId, zetActiviteitId] = useState('');
  const [datum, zetDatum] = useState(vandaag());
  const [uren, zetUren] = useState('1');
  const [minuten, zetMinuten] = useState('0');
  const [omschrijving, zetOmschrijving] = useState('');

  const details = useHaal<{ project: Project; activiteiten: Projectactiviteit[] }>(
    projectId ? `/api/v1/administraties/${administratieId}/projecten/${projectId}` : null,
  );

  const totaalMinuten = Number.parseInt(uren || '0', 10) * 60 + Number.parseInt(minuten || '0', 10);

  async function bewaar(gebeurtenis: React.FormEvent): Promise<void> {
    gebeurtenis.preventDefault();
    const uitkomst = await actie.voerUit(`/api/v1/administraties/${administratieId}/uren`, {
      methode: 'POST',
      body: {
        projectId,
        activiteitId: activiteitId || null,
        datum,
        minuten: totaalMinuten,
        omschrijving,
      },
    });
    if (uitkomst) {
      zetOmschrijving('');
      opGeschreven();
    }
  }

  if (projecten.length === 0) {
    return (
      <Melding soort="info" titel={t('projecten.leeg')}>
        {t('projecten.leegUitleg')}
      </Melding>
    );
  }

  return (
    <Kaart titel={t('uren.nieuw')}>
      <form onSubmit={(gebeurtenis) => void bewaar(gebeurtenis)} className="stapel">
        {actie.fout && (
          <Melding soort="fout" titel={actie.fout.titel}>
            {actie.fout.uitleg}
          </Melding>
        )}

        <div className="veldrij">
          <Keuzeveld
            label={t('uren.project')}
            verplicht
            value={projectId}
            onChange={(gebeurtenis) => {
              zetProjectId(gebeurtenis.target.value);
              zetActiviteitId('');
            }}
            opties={[
              { waarde: '', tekst: '—' },
              ...projecten.map((project) => ({
                waarde: project.id,
                tekst: project.code ? `${project.code} · ${project.naam}` : project.naam,
              })),
            ]}
          />

          <Keuzeveld
            label={t('uren.activiteit')}
            value={activiteitId}
            disabled={!projectId || (details.gegevens?.activiteiten.length ?? 0) === 0}
            onChange={(gebeurtenis) => zetActiviteitId(gebeurtenis.target.value)}
            opties={[
              { waarde: '', tekst: t('uren.geenActiviteit') },
              ...(details.gegevens?.activiteiten ?? []).map((activiteit) => ({
                waarde: activiteit.id,
                tekst: activiteit.naam,
              })),
            ]}
          />

          <Veld
            label={t('algemeen.datum')}
            type="date"
            verplicht
            value={datum}
            onChange={(gebeurtenis) => zetDatum(gebeurtenis.target.value)}
          />
        </div>

        <div className="veldrij">
          <Veld
            label={t('uren.urenLabel')}
            type="number"
            min={0}
            max={24}
            value={uren}
            onChange={(gebeurtenis) => zetUren(gebeurtenis.target.value)}
          />
          <Veld
            label={t('uren.minutenLabel')}
            type="number"
            min={0}
            max={59}
            step={5}
            value={minuten}
            onChange={(gebeurtenis) => zetMinuten(gebeurtenis.target.value)}
          />
          <Veld
            label={t('algemeen.omschrijving')}
            verplicht
            value={omschrijving}
            onChange={(gebeurtenis) => zetOmschrijving(gebeurtenis.target.value)}
          />
        </div>

        <div className="rij rij--eind">
          <Knop type="submit" bezig={actie.bezig} disabled={!projectId || totaalMinuten <= 0}>
            {t('uren.opslaan')}
          </Knop>
        </div>
      </form>
    </Kaart>
  );
}

// --- Projecten -------------------------------------------------------------

function Projecten() {
  const { t, administratieId, magIk } = useApp();
  const navigeer = useNavigate();

  const [melding, zetMelding] = useState<string | null>(null);
  const overzicht = useHaal<{ projecten: Projectsamenvatting[] }>(
    `/api/v1/administraties/${administratieId}/projecten-overzicht`,
  );
  const actie = useActie();

  async function factureer(projectId: string): Promise<void> {
    const uitkomst = await actie.voerUit<{ factuurId: string }>(
      `/api/v1/administraties/${administratieId}/uren/factureren`,
      { methode: 'POST', body: { projectId } },
    );
    if (uitkomst) {
      zetMelding(t('uren.factureerUitleg'));
      overzicht.opnieuw();
      navigeer(`/facturen/${uitkomst.factuurId}`);
    }
  }

  return (
    <div className="stapel">
      {melding && <Melding soort="goed">{melding}</Melding>}
      {(overzicht.fout ?? actie.fout) && (
        <Melding soort="fout" titel={(overzicht.fout ?? actie.fout)!.titel}>
          {(overzicht.fout ?? actie.fout)!.uitleg}
        </Melding>
      )}

      {magIk('project.beheren') && <ProjectFormulier opGemaakt={() => overzicht.opnieuw()} />}

      <Kaart strak>
        {overzicht.bezig && !overzicht.gegevens ? (
          <div style={{ padding: 'var(--ruimte-5)' }}>
            <Laden tekst={t('algemeen.laden')} />
          </div>
        ) : (overzicht.gegevens?.projecten.length ?? 0) === 0 ? (
          <Leegstaat titel={t('projecten.leeg')} uitleg={t('projecten.leegUitleg')} />
        ) : (
          <Tabelomhulsel bijschrift={t('projecten.titel')}>
            <table className="tabel tabel--stapelbaar">
              <thead>
                <tr>
                  <th scope="col">{t('projecten.naam')}</th>
                  <th scope="col">{t('projecten.klant')}</th>
                  <th scope="col" className="rechts">
                    {t('projecten.geschreven')}
                  </th>
                  <th scope="col" className="rechts">
                    {t('projecten.teFactureren')}
                  </th>
                  <th scope="col" className="rechts">
                    {t('projecten.gefactureerd')}
                  </th>
                  <th scope="col">{t('algemeen.status')}</th>
                  <th scope="col" />
                </tr>
              </thead>
              <tbody>
                {overzicht.gegevens?.projecten.map((project) => {
                  const budget = project.budget_minuten;
                  const overschreden = budget !== null && project.geschreven_minuten > budget;
                  const bijnaOp =
                    budget !== null && !overschreden && project.geschreven_minuten > budget * 0.9;

                  return (
                    <tr key={project.project_id}>
                      <td data-label={t('projecten.naam')}>
                        {project.project_code && <span className="uitleg">{project.project_code} </span>}
                        {project.project_naam}
                      </td>
                      <td data-label={t('projecten.klant')}>{project.contact_naam ?? t('projecten.geenKlant')}</td>
                      <td data-label={t('projecten.geschreven')} className="rechts bedrag">
                        {toonDuur(project.geschreven_minuten)}
                        {budget !== null && (
                          <span className="uitleg">
                            {' '}
                            {t('algemeen.van')} {toonDuur(budget)}
                          </span>
                        )}
                        {overschreden && <div className="tabel__waarschuwing">{t('projecten.budgetOver')}</div>}
                        {bijnaOp && <div className="tabel__waarschuwing">{t('projecten.budgetOp')}</div>}
                      </td>
                      <td data-label={t('projecten.teFactureren')} className="rechts bedrag">
                        {toonDuur(project.ongefactureerde_minuten)}
                        {project.ongefactureerde_minuten > project.factureerbaar_nu_minuten && (
                          <div className="uitleg">
                            {toonDuur(project.ongefactureerde_minuten - project.factureerbaar_nu_minuten)}{' '}
                            {t('uren.wachtOpGoedkeuring')}
                          </div>
                        )}
                      </td>
                      <td data-label={t('projecten.gefactureerd')} className="rechts bedrag">
                        {toonDuur(project.gefactureerde_minuten)}
                      </td>
                      <td data-label={t('algemeen.status')}>
                        <Etiket soort={project.status === 'actief' ? 'goed' : 'neutraal'}>
                          {t(`projecten.status.${project.status}` as 'projecten.status.actief')}
                        </Etiket>
                      </td>
                      <td>
                        {magIk('verkoop.schrijven') && project.factureerbaar_nu_minuten > 0 && (
                          <Knop
                            soort="tweede"
                            klein
                            bezig={actie.bezig}
                            onClick={() => void factureer(project.project_id)}
                          >
                            {t('uren.factureren')}
                          </Knop>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Tabelomhulsel>
        )}
      </Kaart>

      <p className="uitleg">{t('uren.factureerUitleg')}</p>
    </div>
  );
}

function ProjectFormulier({ opGemaakt }: { opGemaakt: () => void }) {
  const { t, administratieId } = useApp();
  const actie = useActie();
  const [open, zetOpen] = useState(false);

  const [naam, zetNaam] = useState('');
  const [contactId, zetContactId] = useState('');
  const [facturatie, zetFacturatie] = useState<'uurtarief' | 'vaste_prijs' | 'niet'>('uurtarief');
  const [uurtarief, zetUurtarief] = useState('');
  const [budgetUren, zetBudgetUren] = useState('');

  const relaties = useHaal<{ items: Relatie[] }>(
    open ? `/api/v1/administraties/${administratieId}/relaties?soort=klant&limiet=200` : null,
  );
  const rekeningen = useHaal<{ rekeningen: { id: string; code: string; naam: string }[] }>(
    open ? `/api/v1/administraties/${administratieId}/rekeningen` : null,
  );
  const btwcodes = useHaal<{ btwcodes: { id: string; code: string; naam: string }[] }>(
    open ? `/api/v1/administraties/${administratieId}/btwcodes` : null,
  );

  async function bewaar(gebeurtenis: React.FormEvent): Promise<void> {
    gebeurtenis.preventDefault();
    // De omzetrekening en het btw-tarief van de standaardverkoop; zonder die
    // twee kan een uur later geen factuurregel worden.
    const omzet = rekeningen.gegevens?.rekeningen.find((rekening) => rekening.code === '8000');
    const btw = btwcodes.gegevens?.btwcodes.find((code) => code.code === 'VK-21');

    const uitkomst = await actie.voerUit(`/api/v1/administraties/${administratieId}/projecten`, {
      methode: 'POST',
      body: {
        naam,
        contactId: contactId || null,
        facturatie,
        uurtarief: facturatie === 'uurtarief' ? uurtarief : null,
        budgetMinuten: budgetUren ? Number.parseInt(budgetUren, 10) * 60 : null,
        rekeningId: omzet?.id ?? null,
        btwCodeId: btw?.id ?? null,
      },
    });
    if (uitkomst) {
      zetNaam('');
      zetUurtarief('');
      zetBudgetUren('');
      zetOpen(false);
      opGemaakt();
    }
  }

  if (!open) {
    return (
      <div className="rij rij--eind">
        <Knop onClick={() => zetOpen(true)}>{t('projecten.nieuw')}</Knop>
      </div>
    );
  }

  return (
    <Kaart titel={t('projecten.nieuw')}>
      <form onSubmit={(gebeurtenis) => void bewaar(gebeurtenis)} className="stapel">
        {actie.fout && (
          <Melding soort="fout" titel={actie.fout.titel}>
            {actie.fout.uitleg}
          </Melding>
        )}

        <div className="veldrij">
          <Veld
            label={t('projecten.naam')}
            verplicht
            value={naam}
            onChange={(gebeurtenis) => zetNaam(gebeurtenis.target.value)}
          />
          <Keuzeveld
            label={t('projecten.klant')}
            value={contactId}
            onChange={(gebeurtenis) => zetContactId(gebeurtenis.target.value)}
            opties={[
              { waarde: '', tekst: t('projecten.geenKlant') },
              ...(relaties.gegevens?.items ?? []).map((relatie) => ({
                waarde: relatie.id,
                tekst: relatie.naam,
              })),
            ]}
          />
        </div>

        <div className="veldrij">
          <Keuzeveld
            label={t('projecten.facturatie')}
            value={facturatie}
            onChange={(gebeurtenis) => zetFacturatie(gebeurtenis.target.value as typeof facturatie)}
            opties={[
              { waarde: 'uurtarief', tekst: t('projecten.facturatie.uurtarief') },
              { waarde: 'vaste_prijs', tekst: t('projecten.facturatie.vaste_prijs') },
              { waarde: 'niet', tekst: t('projecten.facturatie.niet') },
            ]}
          />
          {facturatie === 'uurtarief' && (
            <Veld
              label={t('projecten.uurtarief')}
              inputMode="decimal"
              verplicht
              value={uurtarief}
              onChange={(gebeurtenis) => zetUurtarief(gebeurtenis.target.value)}
            />
          )}
          <Veld
            label={t('projecten.budget')}
            uitleg={t('projecten.budgetUren')}
            type="number"
            min={0}
            value={budgetUren}
            onChange={(gebeurtenis) => zetBudgetUren(gebeurtenis.target.value)}
          />
        </div>

        <div className="rij rij--eind">
          <Knop soort="stil" type="button" onClick={() => zetOpen(false)}>
            {t('algemeen.annuleren')}
          </Knop>
          <Knop type="submit" bezig={actie.bezig} disabled={!naam}>
            {t('algemeen.opslaan')}
          </Knop>
        </div>
      </form>
    </Kaart>
  );
}
