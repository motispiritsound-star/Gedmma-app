import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HET_PLAN, koopRegels, legKoopVast, platformNu, proefRest, useAbonnement, winkelNaam,
} from '../engine/abonnement'
import { winkel, type WinkelProduct } from '../engine/winkel'
import { AANTAL_GRATIS } from '../engine/toegang'
import { useT, vul } from '../i18n'
import { Kaart, Knop, Kop, Lint, Melding } from '../ui/kit'
import { Ouderpoort } from '../ui/Ouderpoort'

/**
 * Het abonnementsscherm, achter de ouderpoort.
 *
 * Eén plan: € 5,99 per maand, maandelijks opzegbaar. Alle vier de dingen staan
 * vóór de koopknop -- prijs, proefduur, verlenging en opzeggen -- en dat is
 * een winkeleis van beide partijen én het eerlijke minimum.
 *
 * Geen aftelklok en geen kunstmatige haast. En het scherm belooft GEEN
 * proefperiode tenzij de winkel er bij dit product ook een meldt: dat is de
 * duurste les uit de overdracht van de vorige app, waar het scherm drie gratis
 * dagen aan iedereen beloofde die op het jaarplan niet waren ingesteld.
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

type Stand = 'laden' | 'gereed' | 'bezig'

function AbonnementBlad() {
  const t = useT()
  const navigeer = useNavigate()
  const abonnement = useAbonnement()
  const platform = platformNu()

  const [stand, zetStand] = useState<Stand>('laden')
  const [product, zetProduct] = useState<WinkelProduct | null>(null)
  const [melding, zetMelding] = useState<string | null>(null)

  /*
   * De winkel wordt pas hier aangesproken en niet bij het starten van de app.
   *
   * Dat is met opzet: een kind dat de app opent hoort geen winkelverbinding te
   * veroorzaken, en op Android verschijnt bij `initialize` soms een
   * accountkeuze. Achter de ouderpoort is dat wél verwacht.
   */
  useEffect(() => {
    let nogGeldig = true
    const w = winkel()
    w.start()
      .then(() => { if (nogGeldig) zetProduct(w.product(HET_PLAN.product)) })
      .catch(() => { /* geen winkel: het scherm zegt dat hieronder zelf */ })
      .finally(() => { if (nogGeldig) zetStand('gereed') })
    return () => { nogGeldig = false }
  }, [])

  const regels = koopRegels(HET_PLAN, product)
  const kanKopen = winkel().beschikbaar() && product !== null

  /* -- al een abonnement -------------------------------------------------- */

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

  /* -- kopen -------------------------------------------------------------- */

  const koop = async () => {
    zetStand('bezig')
    zetMelding(null)
    const uitkomst = await winkel().koop(HET_PLAN.product)
    zetStand('gereed')

    if (uitkomst.stand === 'gekocht') {
      // De proefvlag komt van de winkel en wordt hier vastgelegd, want zodra
      // de koop rond is laat de winkel de aanbieding bij dit product weg.
      legKoopVast('maand', uitkomst.metProef)
      navigeer('/')
      return
    }
    // Afgebroken is geen fout: de gebruiker heeft nee gezegd, en daar hoort
    // geen rode melding bij.
    if (uitkomst.stand === 'afgebroken') return
    zetMelding(uitkomst.stand === 'nietBeschikbaar' ? t.abonnement.nietBeschikbaar : t.abonnement.mislukt)
  }

  const herstel = async () => {
    zetStand('bezig')
    const gevonden = await winkel().herstel()
    zetStand('gereed')
    if (gevonden) {
      // Hersteld, dus niet opnieuw een proefperiode beloven.
      legKoopVast('maand', false)
      zetMelding(t.abonnement.herstelGelukt)
    } else {
      zetMelding(t.abonnement.herstelNiets)
    }
  }

  return (
    <div className="kolom kolom--wijd">
      <Kop onder={vul(t.abonnement.intro, { gratis: AANTAL_GRATIS })}>{t.abonnement.kop}</Kop>
      {melding ? <Melding tekst={melding} /> : null}

      <Kaart>
        <div className="kolom">
          <div className="rij rij--tussen">
            <strong style={{ fontFamily: 'var(--font-kop)', fontSize: '1.4rem' }}>
              {regels.prijs}{' '}
              <span className="zacht klein" style={{ fontWeight: 400 }}>{t.abonnement.perMaand}</span>
            </strong>
            <Lint>{t.abonnement.maandelijksOpzegbaar}</Lint>
          </div>

          {/*
            De proefperiode staat hier alleen als de winkel hem meldt. Bij de
            lancering staat er geen op het product, dus staat hier niets --
            geen "mogelijk gratis", geen kleine lettertjes.
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

          <Knop breed disabled={!kanKopen || stand !== 'gereed'} onClick={koop}>
            {stand === 'bezig' ? t.abonnement.bezig : t.abonnement.kies}
          </Knop>
        </div>
      </Kaart>

      {stand === 'laden' ? <p className="zacht klein midden">{t.abonnement.bezig}</p> : null}
      {stand === 'gereed' && !kanKopen ? <Melding tekst={t.abonnement.nietBeschikbaar} /> : null}

      <Knop soort="stil" breed disabled={stand === 'bezig'} onClick={herstel}>
        {t.abonnement.herstel}
      </Knop>
      <Knop soort="stil" breed onClick={() => navigeer('/')}>{t.algemeen.terug}</Knop>
    </div>
  )
}
