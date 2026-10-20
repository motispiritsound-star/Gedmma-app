import { useMemo, useState } from 'react'
import { aanDeBeurt } from '../engine/srs'
import { maakHerhaalronde, RONDE_LENGTE } from '../engine/oefeningen'
import { antwoord, useStaat } from '../engine/opslag'
import { useT } from '../i18n'
import { Balk, Kaart, Knop, Kop } from '../ui/kit'
import { Oefening, type Uitkomst } from '../ui/Oefening'

/**
 * De herhaalronde.
 *
 * Alles wat aan de beurt is, door elkaar, zonder leerkaarten. Dat is met opzet
 * anders dan een les: herhalen hoort te voelen als een quiz en niet als een
 * les opnieuw doen.
 *
 * Staat er niets klaar, dan zegt het scherm dat ook en stuurt het niemand een
 * ronde in. Een herhaalronde met woorden die nog stevig zitten is verspilde
 * tijd, en dat ondermijnt het vertrouwen in de planner.
 */
export function Herhalen() {
  const t = useT()
  const kaarten = useStaat((s) => s.kaarten)
  const extra = useStaat((s) => s.extraKaarten)
  const groep = useStaat((s) => s.profiel.groep)
  const typen = useStaat((s) => s.instellingen.typen)
  const spreken = useStaat((s) => s.instellingen.spreken)

  const [bezig, zetBezig] = useState(false)
  const [stap, zetStap] = useState(0)
  const [goed, zetGoed] = useState(0)

  const klaarVoor = useMemo(
    () => aanDeBeurt([...Object.values(kaarten), ...Object.values(extra)], Date.now(), RONDE_LENGTE[groep]),
    [kaarten, extra, groep],
  )

  const ronde = useMemo(
    () => (bezig
      ? maakHerhaalronde(klaarVoor.map((k) => k.id), { hoogstens: RONDE_LENGTE[groep], typen, spreken })
      : []),
    [bezig],
  )

  if (!bezig) {
    return (
      <div className="blad blad--met-tabs">
        <Kop onder={t.herhalen.uitleg}>{t.herhalen.kop}</Kop>
        {klaarVoor.length === 0 ? (
          <Kaart>
            <strong>{t.herhalen.niksTeDoen}</strong>
            <p className="zacht klein" style={{ margin: '6px 0 0' }}>{t.herhalen.niksTeDoenUitleg}</p>
          </Kaart>
        ) : (
          <div className="kolom kolom--wijd">
            <Kaart>
              <div className="midden kolom" style={{ alignItems: 'center' }}>
                <div style={{ fontSize: '2.4rem', fontFamily: 'var(--font-kop)', fontWeight: 800 }}>
                  {klaarVoor.length}
                </div>
                <span className="zacht">{t.herhalen.klaarVoor}</span>
              </div>
            </Kaart>
            <Knop breed onClick={() => zetBezig(true)}>{t.herhalen.startRonde}</Knop>
          </div>
        )}
      </div>
    )
  }

  if (stap >= ronde.length) {
    return (
      <div className="blad blad--met-tabs">
        <div className="kolom kolom--wijd midden" style={{ alignItems: 'center' }}>
          <div style={{ fontSize: '3rem' }} aria-hidden>✅</div>
          <h1>{t.algemeen.klaar}</h1>
          <p className="zacht" style={{ margin: 0 }}>{goed} {t.les.lesKlaarGoed} {ronde.length}</p>
          <Knop breed onClick={() => { zetBezig(false); zetStap(0); zetGoed(0) }}>
            {t.les.naarPad}
          </Knop>
        </div>
      </div>
    )
  }

  const huidig = ronde[stap]!
  const verwerk = (uitkomst: Uitkomst) => {
    if (huidig.kaartId) antwoord(huidig.kaartId, uitkomst === 'goed' ? 'goed' : 'fout')
    if (uitkomst === 'goed') zetGoed(goed + 1)
    zetStap(stap + 1)
  }

  return (
    <div className="blad">
      <div className="kolom kolom--wijd">
        <div className="rij" style={{ gap: 'var(--ruimte-3)' }}>
          <Knop soort="stil" klein onClick={() => { zetBezig(false); zetStap(0) }} aria-label={t.algemeen.sluiten}>✕</Knop>
          <div style={{ flex: 1 }}><Balk deel={stap / ronde.length} label={t.herhalen.kop} /></div>
          <span className="zacht klein">{stap + 1}/{ronde.length}</span>
        </div>
        <Oefening key={huidig.id} oefening={huidig} onKlaar={verwerk} />
      </div>
    </div>
  )
}
