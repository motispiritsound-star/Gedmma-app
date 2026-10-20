import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  koopRegels, legKoopVast, PLANNEN, planVan, proefRest, useAbonnement,
  winkelNaam, type PlanId, type WinkelProduct,
} from '../engine/abonnement'
import { AANTAL_GRATIS } from '../engine/toegang'
import { WINKEL_NAGEBOOTST } from '../engine/abonnement'
import { useT, vul } from '../i18n'
import { Kaart, Knop, Kop, Lint, Melding } from '../ui/kit'
import { Ouderpoort } from '../ui/Ouderpoort'

/**
 * Het abonnementsscherm, achter de ouderpoort.
 *
 * Alle vier de dingen staan vóór de koopknop: prijs, proefduur, verlenging en
 * opzeggen. Dat is een winkeleis van beide partijen én het eerlijke minimum.
 *
 * Geen aftelklok, geen "nog maar vandaag", geen verborgen verlenging. En --
 * dit is de duurste les uit de overdracht van de vorige app -- het scherm
 * belooft GEEN proefperiode tenzij de winkel er bij dit product ook een meldt.
 * Daar stond de proef wekenlang alleen op het maandplan terwijl het scherm hem
 * aan iedereen beloofde. Zie docs/decisions.md B-6.
 */
export function Abonnement() {
  return (
    <div className="blad blad--met-tabs">
      <Ouderpoort>
        <AbonnementBlad />
      </Ouderpoort>
    </div>
  )
}

/**
 * Wat de winkel over elk product zegt.
 *
 * `cordova-plugin-purchase` bestaat alleen in de native schil, en die schil is
 * nog niet aangemaakt (docs/mvp-backlog.md #24, #26). Tot dan: in een
 * test-omgeving nagebootst, en op het web `null` -- dan zegt het scherm
 * "kopen kan alleen in de app" en belooft het niets.
 */
function winkelgegevens(): Record<PlanId, WinkelProduct | null> {
  if (!WINKEL_NAGEBOOTST) {
    // Hier komt de aanroep van de winkel. Zolang die er niet is: niets
    // beloven. Zwijgen is beter dan een belofte die niet nagekomen wordt.
    return { jaar: null, maand: null }
  }
  return {
    jaar: { product: planVan('jaar').product, prijs: planVan('jaar').lijst, heeftProef: true, proefDagen: 3 },
    maand: { product: planVan('maand').product, prijs: planVan('maand').lijst, heeftProef: true, proefDagen: 3 },
  }
}

function AbonnementBlad() {
  const t = useT()
  const navigeer = useNavigate()
  const abonnement = useAbonnement()
  const [melding, zetMelding] = useState<string | null>(null)
  const winkel = winkelgegevens()

  const platform: 'ios' | 'android' | 'web' = 'web'
  const kanKopen = WINKEL_NAGEBOOTST

  if (abonnement.actief) {
    const rest = proefRest()
    return (
      <div className="kolom kolom--wijd">
        <Kop>{t.abonnement.kop}</Kop>
        <Kaart>
          <p style={{ margin: 0 }}>✓ {t.abonnement.actief}</p>
          {rest > 0 ? (
            <p className="zacht klein" style={{ margin: '6px 0 0' }}>
              {vul(t.abonnement.inProef, { dagen: rest })}
            </p>
          ) : null}
          <p className="zacht klein" style={{ margin: '6px 0 0' }}>{t.abonnement.opzeggen}</p>
        </Kaart>
        <Knop soort="stil" breed onClick={() => navigeer('/')}>{t.les.naarPad}</Knop>
      </div>
    )
  }

  const koop = (plan: PlanId) => {
    const regels = koopRegels(planVan(plan), winkel[plan])
    if (!kanKopen) { zetMelding(t.abonnement.nietBeschikbaar); return }
    // De proefvlag komt van de winkel en niet van ons: `proefDagen` is null
    // als de winkel bij dit product geen proefperiode meldt.
    legKoopVast(plan, regels.proefDagen !== null)
    navigeer('/')
  }

  return (
    <div className="kolom kolom--wijd">
      <Kop onder={vul(t.abonnement.intro, { gratis: AANTAL_GRATIS })}>{t.abonnement.kop}</Kop>
      {melding ? <Melding tekst={melding} /> : null}

      {PLANNEN.map((plan) => {
        const regels = koopRegels(plan, winkel[plan.id])
        return (
          <Kaart key={plan.id}>
            <div className="kolom">
              <div className="rij rij--tussen">
                <strong style={{ fontFamily: 'var(--font-kop)', fontSize: '1.1rem' }}>
                  {regels.prijs} <span className="zacht klein">
                    {plan.id === 'jaar' ? t.abonnement.perJaar : t.abonnement.perMaand}
                  </span>
                </strong>
                {plan.beste ? <Lint>{t.abonnement.besteKeuze}</Lint> : null}
              </div>

              {plan.id === 'jaar' ? (
                <p className="zacht klein" style={{ margin: 0 }}>
                  {vul(t.abonnement.perMaandBijJaar, { prijs: plan.perMaand })}
                </p>
              ) : null}

              {/*
                De proefperiode staat hier alleen als de winkel hem meldt.
                `regels.proefDagen` is null zodra dat niet zo is, en dan staat
                er niets -- geen "mogelijk gratis", geen kleine lettertjes.
              */}
              {regels.proefDagen !== null ? (
                <p style={{ margin: 0 }}>
                  <strong>{vul(t.abonnement.proef, { dagen: regels.proefDagen, prijs: regels.prijs })}</strong>
                  <br />
                  <span className="zacht klein">{vul(t.abonnement.proefUitleg, { dagen: regels.proefDagen })}</span>
                </p>
              ) : null}

              {/* Verlenging en opzeggen, vóór de knop. Altijd. */}
              <p className="zacht klein" style={{ margin: 0 }}>{t.abonnement.verlenging}</p>
              <p className="zacht klein" style={{ margin: 0 }}>{t.abonnement.opzeggen}</p>
              {platform !== 'web' ? (
                <p className="zacht klein" style={{ margin: 0 }}>
                  {vul(t.abonnement.viaWinkel, { winkel: winkelNaam(platform) })}
                </p>
              ) : null}

              <Knop breed disabled={!kanKopen} onClick={() => koop(plan.id)}>
                {t.abonnement.kies}
              </Knop>
            </div>
          </Kaart>
        )
      })}

      {!kanKopen ? <Melding tekst={t.abonnement.nietBeschikbaar} /> : null}

      <Knop soort="stil" breed onClick={() => zetMelding(t.abonnement.herstelNiets)}>
        {t.abonnement.herstel}
      </Knop>
      <Knop soort="stil" breed onClick={() => navigeer('/')}>{t.algemeen.terug}</Knop>
    </div>
  )
}
