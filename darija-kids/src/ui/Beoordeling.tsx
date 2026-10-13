import { useState } from 'react'
import { magOmBeoordelingVragen, onthoudGevraagd, openBeoordeling } from '../engine/beoordeling'
import { useStore } from '../engine/store'
import { sfx } from '../engine/audio'
import { useT } from '../i18n'
import { Button, Card } from './kit'
import { OuderPoort, poortAl } from './OuderPoort'

/**
 * De vraag om een beoordeling, op het ouderscherm.
 *
 * Waarom hij daar staat en niet in het pad van het kind, en waarom hij pas na
 * drie diploma's komt, staat in `engine/beoordeling.ts`. Hier staat alleen
 * hoe hij eruitziet, en één ding dat daar niet in past: **"nu niet" is een
 * echt antwoord.**
 *
 * Die knop doet hetzelfde als de andere -- hij onthoudt dat de vraag gesteld
 * is -- en daarmee komt hij nooit meer terug. Dat is met opzet duurder dan
 * een kruisje dat hem volgende week opnieuw laat verschijnen: wie nee zegt
 * heeft nee gezegd, en een app die daar overheen walst verdient de
 * beoordeling die hij dan krijgt.
 */
export function BeoordelingKaart() {
  const t = useT()
  const state = useStore((s) => s)
  const [poort, setPoort] = useState(false)

  if (!magOmBeoordelingVragen(state)) return null

  const naarDeWinkel = () => { sfx.tap(); openBeoordeling() }

  return (
    <>
      <Card className="mb-6 p-5">
        <h2 className="font-display text-xl font-extrabold">{t.beoordeling.titel}</h2>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">{t.beoordeling.uitleg}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {/* De app uit, dus de poort ervoor -- tenzij er net een volwassene langs was. */}
          <Button onClick={() => { sfx.tap(); poortAl() ? naarDeWinkel() : setPoort(true) }}>
            {t.beoordeling.knop}
          </Button>
          <Button variant="ghost" onClick={() => { sfx.tap(); onthoudGevraagd() }}>
            {t.beoordeling.nietNu}
          </Button>
        </div>
      </Card>
      <OuderPoort
        open={poort}
        reden="uit"
        onClose={() => setPoort(false)}
        onGoed={() => { setPoort(false); naarDeWinkel() }}
      />
    </>
  )
}
