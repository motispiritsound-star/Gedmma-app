import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { HARMONIE_LES, les_, unitVan } from '../content/curriculum'
import { maakRonde, RONDE_LENGTE } from '../engine/oefeningen'
import { antwoord, haalStaat, rondLesAf, tipGezien, useStaat } from '../engine/opslag'
import { lesOpen } from '../engine/toegang'
import { useT, useTaal } from '../i18n'
import { Balk, Kaart, Knop, Kop, Tr, Uitleg } from '../ui/kit'
import { Oefening, type Uitkomst } from '../ui/Oefening'

/**
 * De lesspeler.
 *
 * Eén oefening per keer, een balk erboven, en aan het eind de uitkomst. Geen
 * harten die opraken en geen aftelklok: het doel is dat een kind de les
 * afmaakt, niet dat het faalt.
 *
 * Een fout antwoord kost niets behalve dat het woord terugkomt. Dat is de hele
 * straf, en het is de juiste: de planner zet het over acht minuten weer voor
 * je neus.
 */
export function Les() {
  const { id = '' } = useParams()
  const navigeer = useNavigate()
  const t = useT()
  const taal = useTaal()
  const tipsGezien = useStaat((s) => s.tipsGezien)
  const groep = useStaat((s) => s.profiel.groep)
  const typen = useStaat((s) => s.instellingen.typen)
  const spreken = useStaat((s) => s.instellingen.spreken)

  const les = id === HARMONIE_LES.id ? HARMONIE_LES : les_(id)
  const unit = les ? unitVan(les.id) : undefined

  const [stap, zetStap] = useState(0)
  const [goed, zetGoed] = useState(0)
  const [tipOpen, zetTipOpen] = useState(() => !!les?.tip && !tipsGezien.includes(id))

  /*
   * De ronde wordt één keer gemaakt en daarna niet meer.
   *
   * Het zaadje komt uit de les-id plus het aantal eerdere pogingen, zodat een
   * tweede keer dezelfde les een ándere ronde geeft -- maar binnen één poging
   * dezelfde, ook als het scherm opnieuw tekent.
   */
  const ronde = useMemo(() => {
    if (!les) return []
    const keren = haalStaat().lessen[les.id]?.keren ?? 0
    const bekend = new Set([
      ...Object.keys(haalStaat().kaarten),
      ...Object.keys(haalStaat().extraKaarten),
    ])
    return maakRonde(les, {
      bekend,
      hoogstens: RONDE_LENGTE[groep],
      zaadje: les.id.length * 7919 + keren,
      typen,
      spreken,
    })
  }, [les?.id, groep, typen, spreken])

  if (!les) {
    return (
      <div className="blad">
        <Kop>{t.fout.kop}</Kop>
        <Knop breed onClick={() => navigeer('/')}>{t.les.naarPad}</Knop>
      </div>
    )
  }

  if (!lesOpen(les.id, haalStaat())) {
    return (
      <div className="blad">
        <Kop onder={t.pad.opSlotUitleg}>{t.pad.opSlot}</Kop>
        <Knop breed onClick={() => navigeer('/')}>{t.les.naarPad}</Knop>
      </div>
    )
  }

  /* -- de tip, vóór de ronde en één keer ---------------------------------- */

  if (tipOpen && les.tip) {
    return (
      <div className="blad">
        <div className="kolom kolom--wijd">
          <Kop niveau="h2">{les.tip.titel[taal]}</Kop>
          <Kaart>
            <p style={{ margin: 0 }}><Uitleg tekst={les.tip.tekst[taal]} /></p>
          </Kaart>
          <Knop breed onClick={() => { tipGezien(les.id); zetTipOpen(false) }}>
            {t.les.tipBegrepen}
          </Knop>
        </div>
      </div>
    )
  }

  /* -- klaar -------------------------------------------------------------- */

  if (stap >= ronde.length) {
    const score = ronde.length ? goed / ronde.length : 0
    const sterren = score >= 0.95 ? 3 : score >= 0.8 ? 2 : score >= 0.6 ? 1 : 0
    return (
      <div className="blad">
        <div className="kolom kolom--wijd midden" style={{ alignItems: 'center' }}>
          <div style={{ fontSize: '3rem' }} aria-hidden>🎉</div>
          <h1>{t.les.lesKlaar}</h1>
          <p style={{ fontSize: '1.6rem', margin: 0 }} aria-label={`${sterren} ${t.pad.sterren}`}>
            {'★'.repeat(sterren)}{'☆'.repeat(3 - sterren)}
          </p>
          <p className="zacht" style={{ margin: 0 }}>
            {goed} {t.les.lesKlaarGoed} {ronde.length}
          </p>
          {unit?.gezinsopdracht ? (
            <Kaart in>
              <p className="klein" style={{ margin: 0 }}>
                <strong>{t.pad.gezinsopdracht}</strong><br />{unit.gezinsopdracht[taal]}
              </p>
            </Kaart>
          ) : null}
          <Knop breed onClick={() => navigeer('/')}>{t.les.naarPad}</Knop>
        </div>
      </div>
    )
  }

  /* -- de ronde ----------------------------------------------------------- */

  const huidig = ronde[stap]!

  const verwerk = (uitkomst: Uitkomst) => {
    // Harmonie en plakken hebben geen kaart-id: ze oefenen een regel en geen
    // item, en horen niet in de herhaalplanner.
    if (huidig.kaartId) antwoord(huidig.kaartId, uitkomst === 'goed' ? 'goed' : 'fout')
    if (uitkomst === 'goed') zetGoed(goed + 1)

    const volgende = stap + 1
    zetStap(volgende)
    if (volgende >= ronde.length) {
      rondLesAf(les.id, (goed + (uitkomst === 'goed' ? 1 : 0)) / ronde.length)
    }
  }

  return (
    <div className="blad">
      <div className="kolom kolom--wijd">
        <div className="rij" style={{ gap: 'var(--ruimte-3)' }}>
          <Knop soort="stil" klein onClick={() => navigeer('/')} aria-label={t.algemeen.sluiten}>✕</Knop>
          <div style={{ flex: 1 }}>
            <Balk deel={stap / ronde.length} label={les.titel[taal]} />
          </div>
          <span className="zacht klein">{stap + 1}/{ronde.length}</span>
        </div>
        <h2 className="alleen-lezer">{les.titel[taal]} — <Tr>{unit?.tr}</Tr></h2>
        <Oefening key={huidig.id} oefening={huidig} onKlaar={verwerk} />
      </div>
    </div>
  )
}
