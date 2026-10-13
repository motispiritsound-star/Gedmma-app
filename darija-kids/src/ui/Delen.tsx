import { useState } from 'react'
import { deelNaarWhatsApp, nieuweMijlpaal, onthoudMijlpaal, woordenVast } from '../engine/delen'
import { useStore } from '../engine/store'
import { sfx } from '../engine/audio'
import { useT } from '../i18n'
import { Button, Card } from './kit'
import { OuderPoort, poortAl } from './OuderPoort'

/**
 * Delen, in twee gedaantes en met één knop eronder.
 *
 * `docs/LANCERING.md` §12 vraagt om twee dingen die bij nadere beschouwing
 * hetzelfde zijn: een deelkaart bij een mijlpaal, en "laat het aan oma zien"
 * op het ouderscherm. Het verschil is de aanleiding, niet de handeling.
 *
 * Wat ze delen is een zin over het kind, niet over de app. "Nour kent al 100
 * woorden Darija" is iets waar een oma blij van wordt; "ik gebruik deze app"
 * is een advertentie die je je familie aandoet. Dat de app eronder staat is
 * genoeg — §2 van hetzelfde draaiboek zegt het zo: raakt dit de snaar, of leg
 * ik een functie uit.
 *
 * De poort zit ertussen omdat dit de app uit gaat, en omdat het een ouder is
 * die dit stuurt en geen kind.
 */
function useDeelPoort(tekst: () => string) {
  const [poort, setPoort] = useState(false)
  const deel = () => { sfx.tap(); deelNaarWhatsApp(tekst()) }
  return {
    poort,
    vraag: () => { sfx.tap(); poortAl() ? deel() : setPoort(true) },
    sluit: () => setPoort(false),
    door: () => { setPoort(false); deel() },
  }
}

/** Het bericht zelf: over het kind, met de app eronder. */
function useBericht(aantal: number) {
  const t = useT()
  const naam = useStore((s) => s.name)
  return () => (naam ? t.delen.bericht(naam, aantal) : t.delen.berichtZonderNaam(aantal))
}

/**
 * De kaart die verschijnt bij vijfentwintig, vijftig, honderd, tweehonderd en
 * alle woorden. Eén keer per mijlpaal; zie `engine/delen.ts`.
 */
export function MijlpaalKaart() {
  const t = useT()
  const state = useStore((s) => s)
  const mijlpaal = nieuweMijlpaal(state)
  const bericht = useBericht(mijlpaal)
  const p = useDeelPoort(bericht)

  if (!mijlpaal) return null

  return (
    <>
      <Card className="mb-6 p-5">
        <h2 className="font-display text-xl font-extrabold">{t.delen.mijlpaalTitel(mijlpaal)}</h2>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">{t.delen.mijlpaalUitleg}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={() => { onthoudMijlpaal(mijlpaal); p.vraag() }}>{t.delen.knop}</Button>
          <Button variant="ghost" onClick={() => { sfx.tap(); onthoudMijlpaal(mijlpaal) }}>
            {t.delen.nietNu}
          </Button>
        </div>
      </Card>
      <OuderPoort open={p.poort} reden="uit" onClose={p.sluit} onGoed={p.door} />
    </>
  )
}

/**
 * Hetzelfde bericht, zonder mijlpaal: op het ouderscherm, altijd.
 *
 * Verschijnt pas zodra er iets te melden valt. Een appje met "mijn kind kent
 * 0 woorden" is geen appje.
 */
export function OmaKaart() {
  const t = useT()
  const state = useStore((s) => s)
  const vast = woordenVast(state)
  const bericht = useBericht(vast)
  const p = useDeelPoort(bericht)

  if (vast < 1) return null

  return (
    <>
      <Card className="mb-6 flex flex-wrap items-center gap-3 p-5">
        <div className="min-w-0 grow basis-64">
          <h2 className="font-display text-xl font-extrabold">{t.delen.omaTitel}</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">{t.delen.omaUitleg}</p>
        </div>
        <Button variant="secondary" onClick={p.vraag}>{t.delen.knop}</Button>
      </Card>
      <OuderPoort open={p.poort} reden="uit" onClose={p.sluit} onGoed={p.door} />
    </>
  )
}
