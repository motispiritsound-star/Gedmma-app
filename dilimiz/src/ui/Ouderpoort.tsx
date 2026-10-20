import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useT } from '../i18n'
import { Kaart, Knop, Kop } from './kit'

/**
 * De ouderpoort.
 *
 * Alles wat een kind niet alleen mag doen zit hierachter: het
 * abonnementsscherm, elke koop, het ouderoverzicht, gegevens verwijderen of
 * exporteren, en elke link naar buiten.
 *
 * Een rekenvraag en geen pincode. Een pincode die een ouder vergeet is een
 * ouder die niet meer bij het ouderoverzicht komt -- en er is geen server om
 * hem te herstellen. De poort houdt geen gemotiveerde twaalfjarige tegen en
 * doet ook niet alsof; hij voorkomt de onbedoelde aankoop en de onbedoelde
 * klik naar buiten, en dat is wat de winkels eisen en wat er werkelijk
 * misgaat.
 *
 * De som wordt per keer opnieuw gekozen, zodat het antwoord niet te onthouden
 * is. Twee getallen boven de vijf: te veel voor hoofdrekenen op die leeftijd,
 * te weinig om een volwassene op te houden.
 */

export const maakSom = (rnd: () => number = Math.random) => {
  const a = 6 + Math.floor(rnd() * 4) // 6…9
  const b = 6 + Math.floor(rnd() * 4)
  return { a, b, antwoord: a * b }
}

export function Ouderpoort({ children, onTerug }: { children: ReactNode; onTerug?: () => void }) {
  const t = useT()
  const [door, zetDoor] = useState(false)
  const [getypt, zetGetypt] = useState('')
  const [fout, zetFout] = useState(false)
  const som = useMemo(() => maakSom(), [])

  if (door) return <>{children}</>

  const probeer = () => {
    if (Number(getypt.trim()) === som.antwoord) zetDoor(true)
    else { zetFout(true); zetGetypt('') }
  }

  return (
    <div className="kolom kolom--wijd">
      <Kop onder={t.ouderpoort.uitleg}>{t.ouderpoort.kop}</Kop>
      <Kaart>
        <div className="kolom">
          <label htmlFor="poort" style={{ fontSize: '1.3rem', fontFamily: 'var(--font-kop)', fontWeight: 800 }}>
            {t.ouderpoort.vraag} {som.a} × {som.b}?
          </label>
          <input
            id="poort"
            className="invoer"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={getypt}
            onChange={(e) => { zetGetypt(e.target.value); zetFout(false) }}
            onKeyDown={(e) => { if (e.key === 'Enter') probeer() }}
            aria-describedby={fout ? 'poort-fout' : undefined}
            aria-invalid={fout || undefined}
          />
          {fout ? <p id="poort-fout" role="alert" className="klein" style={{ color: 'var(--gul-500)', margin: 0 }}>{t.ouderpoort.fout}</p> : null}
          <Knop breed onClick={probeer} disabled={!getypt.trim()}>{t.algemeen.verder}</Knop>
          {onTerug ? <Knop soort="stil" breed onClick={onTerug}>{t.ouderpoort.terug}</Knop> : null}
        </div>
      </Kaart>
    </div>
  )
}
