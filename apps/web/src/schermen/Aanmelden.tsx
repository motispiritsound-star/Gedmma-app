/** Aanmelden, registreren en de tweede stap. */
import { useState, type FormEvent } from 'react';
import { verzoek } from '../api/client.ts';
import { useApp } from '../context/App.tsx';
import { toonFout, veldfouten } from '../context/fouten.ts';
import { Knop, Melding, Veld } from '../ontwerp/index.tsx';

type Modus = 'aanmelden' | 'registreren' | 'mfa';

export function Aanmelden() {
  const { t, taal, ververs, ik } = useApp();
  const [modus, zetModus] = useState<Modus>(ik?.aangemeld && !ik.gebruiker?.mfaVoldaan ? 'mfa' : 'aanmelden');
  const [email, zetEmail] = useState('');
  const [naam, zetNaam] = useState('');
  const [wachtwoord, zetWachtwoord] = useState('');
  const [code, zetCode] = useState('');
  const [bezig, zetBezig] = useState(false);
  const [fout, zetFout] = useState<{ titel: string; uitleg: string } | null>(null);
  const [gelukt, zetGelukt] = useState<string | null>(null);
  const [velden, zetVelden] = useState<Record<string, string>>({});

  async function verstuur(gebeurtenis: FormEvent) {
    gebeurtenis.preventDefault();
    zetBezig(true);
    zetFout(null);
    zetVelden({});
    try {
      if (modus === 'registreren') {
        await verzoek('/api/v1/auth/register', {
          methode: 'POST',
          body: { email, naam, wachtwoord, locale: taal },
          taal,
        });
        zetGelukt(t('auth.registratieGelukt'));
        zetModus('aanmelden');
      } else if (modus === 'aanmelden') {
        const antwoord = await verzoek<{ mfaNodig: boolean }>('/api/v1/auth/login', {
          methode: 'POST',
          body: { email, wachtwoord },
          taal,
        });
        if (antwoord.mfaNodig) {
          zetModus('mfa');
          await ververs();
        } else {
          await ververs();
        }
      } else {
        await verzoek('/api/v1/auth/mfa/verify', { methode: 'POST', body: { code }, taal });
        await ververs();
      }
    } catch (foutje) {
      zetFout(toonFout(foutje, t));
      zetVelden(veldfouten(foutje));
    } finally {
      zetBezig(false);
    }
  }

  return (
    <main className="inhoud" style={{ maxWidth: '26rem', paddingTop: 'var(--ruimte-7)' }}>
      <h1>{t('app.naam')}</h1>
      <p className="uitleg" style={{ marginBottom: 'var(--ruimte-5)' }}>
        {t('app.slogan')}
      </p>

      {gelukt && <Melding soort="goed">{gelukt}</Melding>}
      {fout && (
        <Melding soort="fout" titel={fout.titel}>
          {fout.uitleg}
        </Melding>
      )}

      <form onSubmit={verstuur} noValidate>
        {modus === 'mfa' ? (
          <>
            <h2>{t('auth.mfaTitel')}</h2>
            <p className="uitleg">{t('auth.mfaUitleg')}</p>
            <Veld
              label={t('auth.mfaCode')}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(gebeurtenis) => zetCode(gebeurtenis.target.value)}
              verplicht
              fout={velden.code}
            />
            <Knop type="submit" breed bezig={bezig}>
              {t('auth.mfaBevestigen')}
            </Knop>
          </>
        ) : (
          <>
            {modus === 'registreren' && (
              <Veld
                label={t('auth.naam')}
                autoComplete="name"
                value={naam}
                onChange={(gebeurtenis) => zetNaam(gebeurtenis.target.value)}
                verplicht
                fout={velden.naam}
              />
            )}
            <Veld
              label={t('auth.email')}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(gebeurtenis) => zetEmail(gebeurtenis.target.value)}
              verplicht
              fout={velden.email}
            />
            <Veld
              label={t('auth.wachtwoord')}
              type="password"
              autoComplete={modus === 'registreren' ? 'new-password' : 'current-password'}
              value={wachtwoord}
              onChange={(gebeurtenis) => zetWachtwoord(gebeurtenis.target.value)}
              uitleg={modus === 'registreren' ? t('auth.wachtwoordEis') : undefined}
              verplicht
              fout={velden.wachtwoord}
            />
            <Knop type="submit" breed bezig={bezig}>
              {modus === 'registreren' ? t('auth.registreren') : t('auth.aanmelden')}
            </Knop>
            <p style={{ marginTop: 'var(--ruimte-4)', textAlign: 'center' }}>
              <Knop
                soort="stil"
                klein
                onClick={() => {
                  zetModus(modus === 'registreren' ? 'aanmelden' : 'registreren');
                  zetFout(null);
                }}
              >
                {modus === 'registreren' ? t('auth.welAccount') : t('auth.nogGeenAccount')}
              </Knop>
            </p>
          </>
        )}
      </form>
    </main>
  );
}
