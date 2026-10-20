import { Link } from 'react-router-dom'
import { UNITS } from '../content/curriculum'
import { slotVan, volgendeLes } from '../engine/toegang'
import { useStaat, haalStaat } from '../engine/opslag'
import { useT, useTaal } from '../i18n'
import { Balk, Kaart, Knop, Kop, Lint, Tr } from '../ui/kit'

/**
 * Het lespad.
 *
 * Alles staat erop, ook wat op slot zit. Zien wat er nog komt is de beste
 * reden om verder te willen -- en het verschil tussen "nog niet aan de beurt"
 * en "hoort bij het abonnement" staat er met andere woorden bij, omdat het
 * eerste iets is wat een kind zelf kan oplossen en het tweede niet.
 */
export function Pad() {
  const t = useT()
  const taal = useTaal()
  const lessen = useStaat((s) => s.lessen)
  const reeks = useStaat((s) => s.reeks)
  const staat = haalStaat()
  const verder = volgendeLes(staat)

  return (
    <div className="blad blad--met-tabs">
      <Kop onder={reeks > 0 ? `🔥 ${reeks} ${t.profiel.reeks}` : undefined}>{t.pad.kop}</Kop>

      <Link to={`/les/${verder}`} className="knop knop--breed" style={{ marginBottom: 'var(--ruimte-5)' }}>
        {Object.keys(lessen).length ? t.pad.vervolg : t.pad.beginnen}
      </Link>

      <div className="kolom kolom--wijd">
        {UNITS.map((unit) => {
          const af = unit.lessen.filter((l) => (lessen[l.id]?.keren ?? 0) > 0).length
          return (
            <section key={unit.id} className="kolom">
              <div className="rij rij--tussen">
                <div className="rij">
                  <span aria-hidden style={{ fontSize: '1.6rem' }}>{unit.emoji}</span>
                  <div className="kolom" style={{ gap: 0 }}>
                    <strong style={{ fontFamily: 'var(--font-kop)' }}>{unit.titel[taal]}</strong>
                    <span className="zacht klein"><Tr>{unit.tr}</Tr> · {unit.ondertitel[taal]}</span>
                  </div>
                </div>
                <Lint>{unit.niveau}</Lint>
              </div>

              <Balk deel={af / unit.lessen.length} label={unit.titel[taal]} />

              <div className="kolom" style={{ gap: 'var(--ruimte-2)' }}>
                {unit.lessen.map((les) => {
                  const slot = slotVan(les.id, staat)
                  const stand = lessen[les.id]
                  const sterren = stand?.sterren ?? 0
                  if (slot === 'open') {
                    return (
                      <Link
                        key={les.id}
                        to={`/les/${les.id}`}
                        className="keuze"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <span className="kolom" style={{ gap: 0, flex: 1 }}>
                          <strong>{les.titel[taal]}</strong>
                          {stand ? (
                            <span className="zacht klein" aria-label={`${sterren} ${t.pad.sterren}`}>
                              {'★'.repeat(sterren)}{'☆'.repeat(3 - sterren)}
                            </span>
                          ) : null}
                        </span>
                        <span aria-hidden>›</span>
                      </Link>
                    )
                  }
                  return (
                    <div key={les.id} className="keuze slot" aria-disabled="true">
                      <span className="kolom" style={{ gap: 0, flex: 1 }}>
                        <strong>{les.titel[taal]}</strong>
                        <span className="zacht klein">
                          {slot === 'betaald' ? t.pad.betaaldSlot : t.pad.opSlotUitleg}
                        </span>
                      </span>
                      <span aria-hidden>{slot === 'betaald' ? '🔒' : '·'}</span>
                    </div>
                  )
                })}
              </div>

              {unit.gezinsopdracht && af === unit.lessen.length ? (
                <Kaart in>
                  <p className="klein" style={{ margin: 0 }}>
                    <strong>{t.pad.gezinsopdracht}</strong><br />{unit.gezinsopdracht[taal]}
                  </p>
                </Kaart>
              ) : null}
            </section>
          )
        })}

        {/* De weg naar het abonnement staat op het pad en niet in een pop-up. */}
        <Link to="/abonnement" className="knop knop--stil knop--breed">
          🔓 {t.abonnement.kop}
        </Link>
      </div>
    </div>
  )
}

export function NietGevonden() {
  const t = useT()
  return (
    <div className="blad">
      <Kop onder={t.fout.uitleg}>{t.fout.kop}</Kop>
      <Link to="/" className="knop">{t.les.naarPad}</Link>
      <Knop soort="stil" breed onClick={() => location.reload()} style={{ marginTop: 'var(--ruimte-3)' }}>
        {t.fout.opnieuw}
      </Knop>
    </div>
  )
}
