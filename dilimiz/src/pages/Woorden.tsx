import { useMemo, useState } from 'react'
import { WOORDEN } from '../content/woorden'
import { sterkteNaam } from '../engine/srs'
import { haalStaat, useStaat } from '../engine/opslag'
import { woordOpSlot } from '../engine/toegang'
import { naarKlein, turksSorteren } from '../engine/turks'
import { useT, useTaal } from '../i18n'
import { Kaart, Kop, Lint, Tr } from '../ui/kit'

/**
 * De woordenlijst, met per woord hoe vast het zit.
 *
 * Woorden buiten het gratis deel staan er mét slotje. Zonder dat is de
 * woordenlijst een gratis cursus: wie daarheen loopt komt bij alle woorden,
 * ook zonder ooit een les te doen -- en dan is het pad een formaliteit.
 *
 * Wat je wél hebt geleerd kun je altijd zien en horen. De regel is simpel en
 * uit te leggen.
 */
export function Woorden() {
  const t = useT()
  const taal = useTaal()
  const kaarten = useStaat((s) => s.kaarten)
  const [zoek, zetZoek] = useState('')

  const lijst = useMemo(() => {
    const term = naarKlein(zoek.trim())
    return WOORDEN
      .filter((w) => !term
        || naarKlein(w.tr).includes(term)
        || naarKlein(w.betekenis[taal]).includes(term))
      .sort((a, b) => turksSorteren(a.tr, b.tr))
  }, [zoek, taal])

  const geleerd = Object.keys(kaarten).length

  return (
    <div className="blad blad--met-tabs">
      <Kop onder={`${geleerd} ${t.ouders.woordenGeleerd}`}>{t.woordenlijst.kop}</Kop>

      <input
        className="invoer"
        type="search"
        placeholder={t.woordenlijst.zoek}
        value={zoek}
        onChange={(e) => zetZoek(e.target.value)}
        aria-label={t.woordenlijst.zoek}
        style={{ marginBottom: 'var(--ruimte-4)', fontFamily: 'var(--font-tekst)' }}
      />

      <div className="kolom" style={{ gap: 'var(--ruimte-2)' }}>
        {lijst.map((w) => {
          const opSlot = woordOpSlot(w.id, haalStaat())
          const kaart = kaarten[w.id]
          const sterkte = kaart ? sterkteNaam(kaart.sterkte) : 'nieuw'
          return (
            <Kaart key={w.id} in>
              <div className={`rij rij--tussen${opSlot ? ' slot' : ''}`}>
                <div className="rij">
                  {w.emoji ? <span aria-hidden style={{ fontSize: '1.3rem' }}>{w.emoji}</span> : null}
                  <div className="kolom" style={{ gap: 0 }}>
                    <Tr>{w.tr}</Tr>
                    <span className="zacht klein">
                      {opSlot ? t.woordenlijst.opSlot : w.betekenis[taal]}
                    </span>
                  </div>
                </div>
                {opSlot ? <span aria-hidden>🔒</span> : <Lint>{t.woordenlijst.sterkte[sterkte]}</Lint>}
              </div>
            </Kaart>
          )
        })}
        {lijst.length === 0 ? <p className="zacht">{t.woordenlijst.leeg}</p> : null}
      </div>
    </div>
  )
}
