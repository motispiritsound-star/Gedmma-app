/** Instellingen: onderneming, gebruikers, beveiliging, perioden en audit trail. */
import { useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { toonTijdstip } from '@gedmma/i18n';
import { useApp } from '../context/App.tsx';
import { Etiket, Kaart, Keuzeveld, Knop, Laden, Melding, Tabelomhulsel, Veld } from '../ontwerp/index.tsx';
import { useActie, useHaal } from './gebruik.ts';

export function Instellingen() {
  const { t } = useApp();
  return (
    <div className="stapel">
      <div className="paginakop">
        <h1>{t('instellingen.titel')}</h1>
      </div>

      <nav aria-label={t('instellingen.titel')}>
        <ul className="rij" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {[
            { pad: '/instellingen', tekst: t('instellingen.administratie'), einde: true },
            { pad: '/instellingen/gebruikers', tekst: t('instellingen.gebruikers') },
            { pad: '/instellingen/beveiliging', tekst: t('instellingen.beveiliging') },
            { pad: '/instellingen/perioden', tekst: t('instellingen.perioden') },
            { pad: '/instellingen/audit', tekst: t('instellingen.auditTrail') },
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
        <Route index element={<Onderneming />} />
        <Route path="gebruikers" element={<Gebruikers />} />
        <Route path="beveiliging" element={<Beveiliging />} />
        <Route path="perioden" element={<Perioden />} />
        <Route path="audit" element={<Audit />} />
      </Routes>
    </div>
  );
}

function Onderneming() {
  const { t, administratie, administratieId, magIk } = useApp();
  const actie = useActie();
  const gegevens = administratie?.administratie;
  const [velden, zetVelden] = useState({
    naam: gegevens?.naam ?? '',
    kvkNummer: gegevens?.kvk_nummer ?? '',
    btwNummer: gegevens?.btw_nummer ?? '',
    adres: gegevens?.adres ?? '',
    postcodePlaats: gegevens?.postcode_plaats ?? '',
    email: gegevens?.email ?? '',
    telefoon: gegevens?.telefoon ?? '',
    iban: gegevens?.iban ?? '',
    factuurVoettekst: gegevens?.factuur_voettekst ?? '',
  });
  const [bewaard, zetBewaard] = useState(false);

  async function bewaar() {
    const uitkomst = await actie.voerUit(`/api/v1/administraties/${administratieId}`, {
      methode: 'PATCH',
      body: {
        naam: velden.naam,
        kvkNummer: velden.kvkNummer || null,
        btwNummer: velden.btwNummer || null,
        adres: velden.adres || null,
        postcodePlaats: velden.postcodePlaats || null,
        email: velden.email || null,
        telefoon: velden.telefoon || null,
        iban: velden.iban || null,
        factuurVoettekst: velden.factuurVoettekst || null,
      },
    });
    if (uitkomst) zetBewaard(true);
  }

  const mag = magIk('administratie.beheren');

  return (
    <Kaart titel={t('instellingen.administratie')}>
      {actie.fout && <Melding soort="fout" titel={actie.fout.titel}>{actie.fout.uitleg}</Melding>}
      {bewaard && <Melding soort="goed">{t('algemeen.opslaan')}</Melding>}

      <p className="uitleg">
        Deze gegevens komen op je facturen te staan. Het btw-identificatienummer en je adres zijn wettelijk verplicht
        op een factuur.
      </p>

      <div className="veldrij">
        <Veld label={t('admin.naam')} value={velden.naam} disabled={!mag} onChange={(g) => zetVelden({ ...velden, naam: g.target.value })} />
        <Veld label={t('org.kvk')} value={velden.kvkNummer} disabled={!mag} onChange={(g) => zetVelden({ ...velden, kvkNummer: g.target.value })} />
        <Veld label={t('admin.btwNummer')} value={velden.btwNummer} disabled={!mag} onChange={(g) => zetVelden({ ...velden, btwNummer: g.target.value })} />
      </div>
      <div className="veldrij">
        <Veld label={t('admin.adres')} value={velden.adres} disabled={!mag} onChange={(g) => zetVelden({ ...velden, adres: g.target.value })} />
        <Veld label={t('admin.postcodePlaats')} value={velden.postcodePlaats} disabled={!mag} onChange={(g) => zetVelden({ ...velden, postcodePlaats: g.target.value })} />
      </div>
      <div className="veldrij">
        <Veld label={t('relaties.email')} type="email" value={velden.email} disabled={!mag} onChange={(g) => zetVelden({ ...velden, email: g.target.value })} />
        <Veld label={t('relaties.telefoon')} value={velden.telefoon} disabled={!mag} onChange={(g) => zetVelden({ ...velden, telefoon: g.target.value })} />
        <Veld label={t('admin.iban')} value={velden.iban} disabled={!mag} onChange={(g) => zetVelden({ ...velden, iban: g.target.value })} />
      </div>
      <Veld
        label="Voettekst op de factuur"
        value={velden.factuurVoettekst}
        disabled={!mag}
        onChange={(g) => zetVelden({ ...velden, factuurVoettekst: g.target.value })}
      />

      {mag && (
        <Knop onClick={() => void bewaar()} bezig={actie.bezig}>
          {t('algemeen.opslaan')}
        </Knop>
      )}
    </Kaart>
  );
}

type Lid = {
  membership_id: string;
  user_id: string;
  naam: string;
  email: string;
  rol: string;
  status: string;
};

function Gebruikers() {
  const { t, ik, administratie } = useApp();
  const organisatieId = ik?.organisaties?.find((organisatie) =>
    organisatie.administraties.some((admin) => admin.id === administratie?.administratie.id),
  )?.id;
  const leden = useHaal<{ leden: Lid[] }>(organisatieId ? `/api/v1/organisaties/${organisatieId}/leden` : null);
  const actie = useActie();
  const [email, zetEmail] = useState('');
  const [rol, zetRol] = useState('bookkeeper');
  const [melding, zetMelding] = useState<string | null>(null);

  async function nodigUit() {
    const uitkomst = await actie.voerUit<{ melding: string }>(`/api/v1/organisaties/${organisatieId}/leden`, {
      methode: 'POST',
      body: { email, rol },
    });
    if (uitkomst) {
      zetMelding(uitkomst.melding);
      zetEmail('');
      leden.opnieuw();
    }
  }

  if (leden.fout) {
    return (
      <Melding soort="let-op" titel={leden.fout.titel}>
        {leden.fout.uitleg}
      </Melding>
    );
  }

  return (
    <div className="stapel">
      <Kaart titel={t('instellingen.uitnodigen')}>
        {actie.fout && <Melding soort="fout" titel={actie.fout.titel}>{actie.fout.uitleg}</Melding>}
        {melding && <Melding soort="goed">{melding}</Melding>}
        <p className="uitleg">
          De genodigde krijgt een e-mail met een link. Wachtwoorden worden nooit gedeeld; iedereen meldt zich met een
          eigen account aan.
        </p>
        <div className="veldrij">
          <Veld label={t('relaties.email')} type="email" value={email} onChange={(g) => zetEmail(g.target.value)} />
          <Keuzeveld
            label={t('instellingen.rol')}
            value={rol}
            onChange={(g) => zetRol(g.target.value)}
            opties={[
              { waarde: 'admin', tekst: t('rol.admin') },
              { waarde: 'bookkeeper', tekst: t('rol.bookkeeper') },
              { waarde: 'accountant', tekst: t('rol.accountant') },
              { waarde: 'employee', tekst: t('rol.employee') },
              { waarde: 'viewer', tekst: t('rol.viewer') },
            ]}
          />
        </div>
        <Knop onClick={() => void nodigUit()} bezig={actie.bezig} disabled={!email.includes('@')}>
          {t('instellingen.uitnodigen')}
        </Knop>
      </Kaart>

      <Kaart strak titel={t('instellingen.gebruikers')}>
        {leden.bezig ? (
          <Laden tekst={t('algemeen.laden')} />
        ) : (
          <Tabelomhulsel bijschrift={t('instellingen.gebruikers')}>
            <table className="tabel tabel--stapelbaar">
              <thead>
                <tr>
                  <th scope="col">{t('relaties.naam')}</th>
                  <th scope="col">{t('relaties.email')}</th>
                  <th scope="col">{t('instellingen.rol')}</th>
                  <th scope="col">{t('algemeen.status')}</th>
                </tr>
              </thead>
              <tbody>
                {leden.gegevens?.leden.map((lid) => (
                  <tr key={lid.membership_id}>
                    <td data-label={t('relaties.naam')}>{lid.naam}</td>
                    <td data-label={t('relaties.email')}>{lid.email}</td>
                    <td data-label={t('instellingen.rol')}>
                      <Etiket soort="info">{t(`rol.${lid.rol}` as 'rol.owner')}</Etiket>
                    </td>
                    <td data-label={t('algemeen.status')}>
                      <Etiket soort={lid.status === 'actief' ? 'goed' : 'let-op'}>{lid.status}</Etiket>
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

function Beveiliging() {
  const { t, taal, ik, ververs } = useApp();
  const actie = useActie();
  const sessies = useHaal<{
    sessies: { id: string; huidige: boolean; laatstGezienOp: string; apparaat: string }[];
  }>('/api/v1/auth/sessions');

  const [opzet, zetOpzet] = useState<{ geheim: string; uri: string } | null>(null);
  const [code, zetCode] = useState('');
  const [herstelcodes, zetHerstelcodes] = useState<string[] | null>(null);

  const mfaAan = ik?.gebruiker?.mfaIngeschakeld ?? false;

  async function startOpzet() {
    const uitkomst = await actie.voerUit<{ geheim: string; uri: string }>('/api/v1/auth/mfa/setup', {
      methode: 'POST',
      body: {},
    });
    if (uitkomst) zetOpzet(uitkomst);
  }

  async function bevestig() {
    const uitkomst = await actie.voerUit<{ herstelcodes: string[] }>('/api/v1/auth/mfa/confirm', {
      methode: 'POST',
      body: { code },
    });
    if (uitkomst) {
      zetHerstelcodes(uitkomst.herstelcodes);
      zetOpzet(null);
      zetCode('');
      await ververs();
    }
  }

  return (
    <div className="stapel">
      <Kaart titel={t('auth.mfaInstellen')}>
        {actie.fout && <Melding soort="fout" titel={actie.fout.titel}>{actie.fout.uitleg}</Melding>}

        <p>
          <Etiket soort={mfaAan ? 'goed' : 'let-op'}>{mfaAan ? t('auth.mfaAan') : t('auth.mfaUit')}</Etiket>
        </p>
        <p className="uitleg">{t('auth.mfaUitleglang')}</p>

        {!mfaAan && !opzet && (
          <Knop onClick={() => void startOpzet()} bezig={actie.bezig}>
            {t('auth.mfaInstellen')}
          </Knop>
        )}

        {opzet && (
          <>
            <p className="uitleg">{t('auth.mfaGeheim')}</p>
            <p style={{ fontFamily: 'var(--lettertype-cijfers)', wordBreak: 'break-all' }}>{opzet.geheim}</p>
            <p className="uitleg">
              <a href={opzet.uri}>otpauth-link openen</a>
            </p>
            <Veld
              label={t('auth.mfaCode')}
              inputMode="numeric"
              value={code}
              onChange={(gebeurtenis) => zetCode(gebeurtenis.target.value)}
            />
            <Knop onClick={() => void bevestig()} bezig={actie.bezig}>
              {t('auth.mfaBevestigen')}
            </Knop>
          </>
        )}

        {herstelcodes && (
          <Melding soort="let-op" titel={t('auth.mfaHerstelcodes')}>
            <p>{t('auth.mfaHerstelcodesUitleg')}</p>
            <ul style={{ fontFamily: 'var(--lettertype-cijfers)', columns: 2 }}>
              {herstelcodes.map((herstelcode) => (
                <li key={herstelcode}>{herstelcode}</li>
              ))}
            </ul>
          </Melding>
        )}
      </Kaart>

      <Kaart strak titel={t('auth.sessies')}>
        {sessies.bezig ? (
          <Laden tekst={t('algemeen.laden')} />
        ) : (
          <Tabelomhulsel bijschrift={t('auth.sessies')}>
            <table className="tabel tabel--stapelbaar">
              <thead>
                <tr>
                  <th scope="col">Apparaat</th>
                  <th scope="col">Laatst gezien</th>
                  <th scope="col" />
                </tr>
              </thead>
              <tbody>
                {sessies.gegevens?.sessies.map((sessie) => (
                  <tr key={sessie.id}>
                    <td data-label="Apparaat">{sessie.apparaat}</td>
                    <td data-label="Laatst gezien">{toonTijdstip(sessie.laatstGezienOp, taal)}</td>
                    <td>{sessie.huidige && <Etiket soort="goed">Dit apparaat</Etiket>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Tabelomhulsel>
        )}
        <div style={{ padding: 'var(--ruimte-4) var(--ruimte-5)' }}>
          <Knop
            soort="tweede"
            onClick={async () => {
              await actie.voerUit('/api/v1/auth/sessions', { methode: 'DELETE' });
              sessies.opnieuw();
            }}
            bezig={actie.bezig}
          >
            {t('auth.sessiesIntrekken')}
          </Knop>
        </div>
      </Kaart>
    </div>
  );
}

function Perioden() {
  const { t, administratieId, magIk } = useApp();
  const boekjaren = useHaal<{
    boekjaren: { id: string; naam: string; begint_op: string; eindigt_op: string; status: string }[];
    perioden: { id: string; nummer: number; naam: string; status: string }[];
  }>(`/api/v1/administraties/${administratieId}/boekjaren`);
  const actie = useActie();
  const [reden, zetReden] = useState('');

  async function wijzig(periodeId: string, status: 'open' | 'geblokkeerd' | 'gesloten') {
    const uitkomst = await actie.voerUit(`/api/v1/administraties/${administratieId}/perioden/${periodeId}/status`, {
      methode: 'POST',
      body: { status, reden: status === 'open' ? reden : undefined },
    });
    if (uitkomst) {
      zetReden('');
      boekjaren.opnieuw();
    }
  }

  return (
    <Kaart strak titel={t('instellingen.perioden')}>
      {actie.fout && (
        <div style={{ padding: 'var(--ruimte-4) var(--ruimte-5) 0' }}>
          <Melding soort="fout" titel={actie.fout.titel}>{actie.fout.uitleg}</Melding>
        </div>
      )}
      {boekjaren.bezig ? (
        <Laden tekst={t('algemeen.laden')} />
      ) : (
        <>
          {magIk('periode.heropenen') && (
            <div style={{ padding: 'var(--ruimte-4) var(--ruimte-5) 0' }}>
              <Veld
                label={t('instellingen.heropenReden')}
                uitleg="Verplicht bij het heropenen; de reden komt in de audit trail."
                value={reden}
                onChange={(gebeurtenis) => zetReden(gebeurtenis.target.value)}
              />
            </div>
          )}
          <Tabelomhulsel bijschrift={t('instellingen.perioden')}>
            <table className="tabel tabel--stapelbaar">
              <thead>
                <tr>
                  <th scope="col">{t('algemeen.periode')}</th>
                  <th scope="col">{t('algemeen.status')}</th>
                  <th scope="col" />
                </tr>
              </thead>
              <tbody>
                {boekjaren.gegevens?.perioden.map((periode) => (
                  <tr key={periode.id}>
                    <td data-label={t('algemeen.periode')}>{periode.naam}</td>
                    <td data-label={t('algemeen.status')}>
                      <Etiket soort={periode.status === 'open' ? 'goed' : periode.status === 'gesloten' ? 'fout' : 'let-op'}>
                        {periode.status}
                      </Etiket>
                    </td>
                    <td>
                      <div className="rij">
                        {periode.status === 'open' && magIk('periode.sluiten') && (
                          <>
                            <Knop soort="stil" klein onClick={() => void wijzig(periode.id, 'geblokkeerd')}>
                              {t('instellingen.periodeBlokkeren')}
                            </Knop>
                            <Knop soort="stil" klein onClick={() => void wijzig(periode.id, 'gesloten')}>
                              {t('instellingen.periodeSluiten')}
                            </Knop>
                          </>
                        )}
                        {periode.status !== 'open' && magIk('periode.heropenen') && (
                          <Knop soort="stil" klein onClick={() => void wijzig(periode.id, 'open')} disabled={!reden}>
                            {t('instellingen.periodeHeropenen')}
                          </Knop>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Tabelomhulsel>
        </>
      )}
    </Kaart>
  );
}

function Audit() {
  const { t, taal, administratieId, magIk } = useApp();
  const regels = useHaal<{
    regels: {
      id: string;
      op: string;
      actie: string;
      actor_naam: string | null;
      actor_soort: string;
      onderwerp_soort: string | null;
      gegevens: Record<string, unknown>;
    }[];
  }>(magIk('audit.lezen') ? `/api/v1/administraties/${administratieId}/audit?limiet=100` : null);
  const controle = useHaal<{ ongeschonden: boolean; uitleg: string }>(
    magIk('audit.lezen') ? `/api/v1/administraties/${administratieId}/audit/controle` : null,
  );

  if (!magIk('audit.lezen')) {
    return <Melding soort="let-op" titel={t('fout.forbidden')}>{t('instellingen.auditUitleg')}</Melding>;
  }

  return (
    <div className="stapel">
      <p className="uitleg">{t('instellingen.auditUitleg')}</p>

      {controle.gegevens && (
        <Melding soort={controle.gegevens.ongeschonden ? 'goed' : 'fout'} titel={t('instellingen.auditControle')}>
          {controle.gegevens.uitleg}
        </Melding>
      )}

      <Kaart strak titel={t('instellingen.auditTrail')}>
        {regels.bezig ? (
          <Laden tekst={t('algemeen.laden')} />
        ) : (
          <Tabelomhulsel bijschrift={t('instellingen.auditTrail')}>
            <table className="tabel tabel--stapelbaar">
              <thead>
                <tr>
                  <th scope="col">Wanneer</th>
                  <th scope="col">Wie</th>
                  <th scope="col">Wat</th>
                  <th scope="col">Details</th>
                </tr>
              </thead>
              <tbody>
                {regels.gegevens?.regels.map((regel) => (
                  <tr key={regel.id}>
                    <td data-label="Wanneer">{toonTijdstip(regel.op, taal)}</td>
                    <td data-label="Wie">
                      {regel.actor_naam ?? '—'}
                      {regel.actor_soort !== 'gebruiker' && (
                        <>
                          {' '}
                          <Etiket soort="let-op">{regel.actor_soort}</Etiket>
                        </>
                      )}
                    </td>
                    <td data-label="Wat">{regel.actie}</td>
                    <td data-label="Details" className="uitleg">
                      {Object.entries(regel.gegevens)
                        .slice(0, 4)
                        .map(([sleutel, waarde]) => `${sleutel}: ${String(waarde)}`)
                        .join(' · ')}
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
