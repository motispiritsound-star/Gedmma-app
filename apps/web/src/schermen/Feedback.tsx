/**
 * Feedback: de knop waarmee iemand iets kan opmerken, en het overzicht waarin
 * de beheerder die opmerkingen leest.
 *
 * De knop staat in de schil en is dus overal bereikbaar. Hij stuurt mee op welk
 * scherm de melder stond en welke versie hij zag, want dat is precies wat er
 * anders achteraf ontbreekt.
 */
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toonDatum } from '@gedmma/i18n';
import { useApp } from '../context/App.tsx';
import {
  Dialoog,
  Etiket,
  Kaart,
  Keuzeveld,
  Knop,
  Laden,
  Leegstaat,
  Melding,
  Tekstveld,
  Veld,
} from '../ontwerp/index.tsx';
import { useActie, useHaal } from './gebruik.ts';
import type { Feedback as FeedbackItem } from '../api/client.ts';

const STATUSKLEUR: Record<string, 'neutraal' | 'goed' | 'let-op' | 'fout' | 'info'> = {
  nieuw: 'info',
  opgepakt: 'let-op',
  verwerkt: 'goed',
  afgewezen: 'neutraal',
};

// --- De knop ---------------------------------------------------------------

export function Feedbackknop() {
  const { t, ik, administratieId } = useApp();
  const plek = useLocation();
  const actie = useActie();

  const [open, zetOpen] = useState(false);
  const [gelukt, zetGelukt] = useState(false);
  const [soort, zetSoort] = useState<'opmerking' | 'fout' | 'wens' | 'vraag'>('opmerking');
  const [bericht, zetBericht] = useState('');
  const [naam, zetNaam] = useState('');

  const organisatieId = ik?.organisaties?.[0]?.id;
  if (!organisatieId) return null;

  async function verstuur(): Promise<void> {
    const uitkomst = await actie.voerUit(`/api/v1/organisaties/${organisatieId}/feedback`, {
      methode: 'POST',
      body: {
        soort,
        bericht,
        naam: naam || null,
        scherm: plek.pathname,
        versieApp: ik?.omgeving?.versie ?? null,
        administratieId,
      },
    });
    if (uitkomst) {
      zetGelukt(true);
      zetBericht('');
    }
  }

  function sluit(): void {
    zetOpen(false);
    zetGelukt(false);
    actie.wisFout();
  }

  return (
    <>
      <Knop soort="tweede" klein onClick={() => zetOpen(true)}>
        {t('feedback.knop')}
      </Knop>

      <Dialoog
        open={open}
        titel={t('feedback.titel')}
        onSluiten={sluit}
        voet={
          gelukt ? (
            <Knop onClick={sluit}>{t('algemeen.sluiten')}</Knop>
          ) : (
            <>
              <Knop soort="stil" onClick={sluit}>
                {t('algemeen.annuleren')}
              </Knop>
              <Knop bezig={actie.bezig} disabled={bericht.trim().length < 3} onClick={() => void verstuur()}>
                {t('feedback.versturen')}
              </Knop>
            </>
          )
        }
      >
        {gelukt ? (
          <Melding soort="goed">{t('feedback.verstuurd')}</Melding>
        ) : (
          <div className="stapel">
            {actie.fout && (
              <Melding soort="fout" titel={actie.fout.titel}>
                {actie.fout.uitleg}
              </Melding>
            )}

            <p className="uitleg">{t('feedback.uitleg')}</p>

            <Keuzeveld
              label={t('feedback.soort')}
              value={soort}
              onChange={(gebeurtenis) => zetSoort(gebeurtenis.target.value as typeof soort)}
              opties={[
                { waarde: 'opmerking', tekst: t('feedback.soort.opmerking') },
                { waarde: 'fout', tekst: t('feedback.soort.fout') },
                { waarde: 'wens', tekst: t('feedback.soort.wens') },
                { waarde: 'vraag', tekst: t('feedback.soort.vraag') },
              ]}
            />

            <Tekstveld
              label={t('feedback.bericht')}
              value={bericht}
              rows={5}
              onChange={(gebeurtenis) => zetBericht(gebeurtenis.target.value)}
            />

            <Veld
              label={t('feedback.naam')}
              uitleg={t('feedback.naamUitleg')}
              value={naam}
              onChange={(gebeurtenis) => zetNaam(gebeurtenis.target.value)}
            />

            <p className="uitleg">
              {t('feedback.scherm')}: <code>{plek.pathname}</code>
            </p>
          </div>
        )}
      </Dialoog>
    </>
  );
}

// --- Het overzicht ---------------------------------------------------------

export function Feedbackoverzicht() {
  const { t, taal, ik } = useApp();
  const organisatieId = ik?.organisaties?.[0]?.id;

  const [status, zetStatus] = useState('');
  const lijst = useHaal<{ items: FeedbackItem[]; aantalNieuw: number }>(
    organisatieId
      ? `/api/v1/organisaties/${organisatieId}/feedback${status ? `?status=${status}` : ''}`
      : null,
  );
  const actie = useActie();

  async function behandel(id: string, nieuweStatus: string, antwoord?: string): Promise<void> {
    const uitkomst = await actie.voerUit(`/api/v1/organisaties/${organisatieId}/feedback/${id}`, {
      methode: 'PATCH',
      body: { status: nieuweStatus, antwoord: antwoord ?? null },
    });
    if (uitkomst) lijst.opnieuw();
  }

  return (
    <div className="stapel">
      <div className="rij">
        <h2 style={{ margin: 0 }}>{t('feedback.overzicht')}</h2>
        {(lijst.gegevens?.aantalNieuw ?? 0) > 0 && (
          <Etiket soort="info">
            {lijst.gegevens?.aantalNieuw} {t('feedback.aantalNieuw')}
          </Etiket>
        )}
      </div>

      {(lijst.fout ?? actie.fout) && (
        <Melding soort="fout" titel={(lijst.fout ?? actie.fout)!.titel}>
          {(lijst.fout ?? actie.fout)!.uitleg}
        </Melding>
      )}

      <Kaart>
        <Keuzeveld
          label={t('algemeen.status')}
          value={status}
          onChange={(gebeurtenis) => zetStatus(gebeurtenis.target.value)}
          opties={[
            { waarde: '', tekst: t('feedback.alles') },
            { waarde: 'nieuw', tekst: t('feedback.status.nieuw') },
            { waarde: 'opgepakt', tekst: t('feedback.status.opgepakt') },
            { waarde: 'verwerkt', tekst: t('feedback.status.verwerkt') },
            { waarde: 'afgewezen', tekst: t('feedback.status.afgewezen') },
          ]}
        />
      </Kaart>

      {lijst.bezig && !lijst.gegevens ? (
        <Kaart>
          <Laden tekst={t('algemeen.laden')} />
        </Kaart>
      ) : (lijst.gegevens?.items.length ?? 0) === 0 ? (
        <Kaart strak>
          <Leegstaat titel={t('feedback.leeg')} uitleg={t('feedback.leegUitleg')} />
        </Kaart>
      ) : (
        lijst.gegevens?.items.map((item) => (
          <Kaart key={item.id}>
            <div className="stapel">
              <div className="rij">
                <Etiket soort={STATUSKLEUR[item.status] ?? 'neutraal'}>
                  {t(`feedback.status.${item.status}` as 'feedback.status.nieuw')}
                </Etiket>
                <Etiket>{t(`feedback.soort.${item.soort}` as 'feedback.soort.opmerking')}</Etiket>
                <span className="uitleg">
                  {[
                    item.naam || item.gebruiker_naam || '—',
                    toonDatum(item.aangemaakt_op.slice(0, 10), taal),
                    item.scherm ? `${t('feedback.scherm').toLowerCase()} ${item.scherm}` : null,
                    item.versie_app ? `v${item.versie_app}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>

              {/* Vrije tekst van een mens: als tekst tonen, nooit als opmaak. */}
              <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{item.bericht}</p>

              {item.antwoord && (
                <Melding soort="info" titel={t('feedback.antwoord')}>
                  {item.antwoord}
                </Melding>
              )}

              <div className="rij rij--eind">
                {item.status !== 'opgepakt' && (
                  <Knop soort="tweede" klein onClick={() => void behandel(item.id, 'opgepakt')}>
                    {t('feedback.status.opgepakt')}
                  </Knop>
                )}
                {item.status !== 'verwerkt' && (
                  <Knop
                    klein
                    onClick={() => {
                      const antwoord = window.prompt(t('feedback.antwoordPlaatsen')) ?? '';
                      void behandel(item.id, 'verwerkt', antwoord);
                    }}
                  >
                    {t('feedback.status.verwerkt')}
                  </Knop>
                )}
                {item.status !== 'afgewezen' && (
                  <Knop soort="stil" klein onClick={() => void behandel(item.id, 'afgewezen')}>
                    {t('feedback.status.afgewezen')}
                  </Knop>
                )}
              </div>
            </div>
          </Kaart>
        ))
      )}
    </div>
  );
}
