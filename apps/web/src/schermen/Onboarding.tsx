/** Eerste keer: kies een administratie, of maak een organisatie en administratie aan. */
import { useState, type FormEvent } from 'react';
import { verzoek } from '../api/client.ts';
import { useApp } from '../context/App.tsx';
import { toonFout } from '../context/fouten.ts';
import { Kaart, Keuzeveld, Knop, Melding, Veld } from '../ontwerp/index.tsx';

export function Onboarding() {
  const { t, taal, ik, ververs, kiesAdministratie, afmelden } = useApp();
  const [orgNaam, zetOrgNaam] = useState('');
  const [adminNaam, zetAdminNaam] = useState('');
  const [sjabloon, zetSjabloon] = useState('zzp');
  const [kvk, zetKvk] = useState('');
  const [btwNummer, zetBtwNummer] = useState('');
  const [adres, zetAdres] = useState('');
  const [postcodePlaats, zetPostcodePlaats] = useState('');
  const [iban, zetIban] = useState('');
  const [bezig, zetBezig] = useState(false);
  const [fout, zetFout] = useState<{ titel: string; uitleg: string } | null>(null);

  const bestaande = (ik?.organisaties ?? []).flatMap((organisatie) =>
    organisatie.administraties.map((admin) => ({ ...admin, organisatie: organisatie.naam })),
  );

  async function maakAan(gebeurtenis: FormEvent) {
    gebeurtenis.preventDefault();
    zetBezig(true);
    zetFout(null);
    try {
      const jaar = new Date().getUTCFullYear();
      const organisatie = await verzoek<{ organisatieId: string }>('/api/v1/organisaties', {
        methode: 'POST',
        body: { naam: orgNaam || adminNaam, abonnement: 'zzp' },
        taal,
      });
      const administratie = await verzoek<{ administratieId: string }>(
        `/api/v1/organisaties/${organisatie.organisatieId}/administraties`,
        {
          methode: 'POST',
          body: {
            naam: adminNaam,
            schemaSjabloon: sjabloon,
            kvkNummer: kvk || null,
            btwNummer: btwNummer || null,
            adres: adres || null,
            postcodePlaats: postcodePlaats || null,
            iban: iban || null,
            boekjaarBegint: `${jaar}-01-01`,
            boekjaarEindigt: `${jaar}-12-31`,
          },
          taal,
        },
      );
      await ververs();
      kiesAdministratie(administratie.administratieId);
    } catch (foutje) {
      zetFout(toonFout(foutje, t));
    } finally {
      zetBezig(false);
    }
  }

  return (
    <main className="inhoud" style={{ maxWidth: '44rem', paddingTop: 'var(--ruimte-6)' }}>
      <div className="paginakop">
        <div>
          <h1>{t('admin.kiezen')}</h1>
          <p className="uitleg">{t('admin.geenAdministraties')}</p>
        </div>
        <Knop soort="stil" klein onClick={() => void afmelden()}>
          {t('nav.afmelden')}
        </Knop>
      </div>

      {fout && (
        <Melding soort="fout" titel={fout.titel}>
          {fout.uitleg}
        </Melding>
      )}

      {bestaande.length > 0 && (
        <div style={{ marginBottom: 'var(--ruimte-5)' }}>
          <Kaart titel={t('admin.kiezen')} strak>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {bestaande.map((admin) => (
                <li key={admin.id} style={{ borderBottom: '1px solid var(--kleur-rand)' }}>
                  <button
                    type="button"
                    className="knop knop--stil knop--breed"
                    style={{ justifyContent: 'space-between', borderRadius: 0, minHeight: '3.25rem' }}
                    onClick={() => kiesAdministratie(admin.id)}
                  >
                    <span>{admin.naam}</span>
                    <span className="uitleg">{admin.organisatie}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Kaart>
        </div>
      )}

      <Kaart titel={t('admin.nieuw')}>
        <form onSubmit={maakAan} noValidate>
          <Veld
            label={t('admin.naam')}
            value={adminNaam}
            onChange={(gebeurtenis) => zetAdminNaam(gebeurtenis.target.value)}
            verplicht
            autoComplete="organization"
          />
          <Veld
            label={t('org.naam')}
            uitleg="Laat leeg om dezelfde naam te gebruiken. Handig als je later meerdere ondernemingen onder een organisatie wilt hangen."
            value={orgNaam}
            onChange={(gebeurtenis) => zetOrgNaam(gebeurtenis.target.value)}
          />
          <Keuzeveld
            label={t('admin.schema')}
            uitleg={t('admin.schemaUitleg')}
            value={sjabloon}
            onChange={(gebeurtenis) => zetSjabloon(gebeurtenis.target.value)}
            opties={[
              { waarde: 'zzp', tekst: 'Zzp, eenmanszaak of vof' },
              { waarde: 'bv', tekst: 'Besloten vennootschap' },
              { waarde: 'stichting', tekst: 'Stichting' },
              { waarde: 'vereniging', tekst: 'Vereniging' },
            ]}
          />
          <div className="veldrij">
            <Veld label={t('org.kvk')} value={kvk} onChange={(g) => zetKvk(g.target.value)} />
            <Veld label={t('admin.btwNummer')} value={btwNummer} onChange={(g) => zetBtwNummer(g.target.value)} />
          </div>
          <div className="veldrij">
            <Veld label={t('admin.adres')} value={adres} onChange={(g) => zetAdres(g.target.value)} autoComplete="street-address" />
            <Veld
              label={t('admin.postcodePlaats')}
              value={postcodePlaats}
              onChange={(g) => zetPostcodePlaats(g.target.value)}
            />
          </div>
          <Veld
            label={t('admin.iban')}
            uitleg="Komt op je facturen te staan, zodat klanten weten waar ze naartoe moeten betalen."
            value={iban}
            onChange={(g) => zetIban(g.target.value)}
          />
          <Knop type="submit" bezig={bezig} disabled={adminNaam.trim().length < 2}>
            {t('admin.nieuw')}
          </Knop>
        </form>
      </Kaart>
    </main>
  );
}
