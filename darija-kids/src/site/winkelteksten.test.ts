/**
 * Elke winkel hoort alleen over zichzelf te gaan.
 *
 * Apple wees versie 1.0 (build 5) af op richtlijn 2.3.10, Accurate Metadata:
 *
 *   "The app or metadata includes information about third-party platforms that
 *    may not be relevant for App Store users."
 *   "Revise the app's description to remove Google Play references."
 *
 * De zin die dat veroorzaakte stond in alle zes de talen, midden in de
 * App Store-beschrijving: *Opzegbaar in je eigen App Store- of
 * Google Play-account*. Bedoeld als service — één tekst die overal klopt — en
 * precies daarom fout: een lezer in de App Store heeft niets aan een winkel
 * waar hij niet is.
 *
 * Andersom geldt hetzelfde, en dat is de reden dat deze toets twee kanten op
 * kijkt. De Play-beschrijving werd in die bestanden beschreven als "dezelfde
 * tekst als hierboven". Was alleen de Apple-kant gerepareerd, dan had er
 * daarna "App Store" in de Play-winkel gestaan — dezelfde fout, andere kant.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const TALEN = ['nl', 'fr', 'de', 'es', 'it', 'en'] as const

/** Per taal: wat er bij Apple hoort te staan, en wat bij Google. */
const OPZEGGEN: Record<(typeof TALEN)[number], { apple: string; play: string }> = {
  nl: { apple: 'Opzegbaar in je eigen App Store-account', play: 'Opzegbaar in je eigen Google Play-account' },
  fr: { apple: 'Résiliable dans ton compte App Store', play: 'Résiliable dans ton compte Google Play' },
  de: { apple: 'Kündbar im eigenen App-Store-Konto', play: 'Kündbar im eigenen Google-Play-Konto' },
  es: { apple: 'Cancelable en tu cuenta de la App Store', play: 'Cancelable en tu cuenta de Google Play' },
  it: { apple: 'Disdicibile dal tuo account App Store', play: 'Disdicibile dal tuo account Google Play' },
  en: { apple: 'Cancel in your own App Store account', play: 'Cancel in your own Google Play account' },
}

const bestand = (taal: string) =>
  readFileSync(new URL(`../../store/listing.${taal}.md`, import.meta.url), 'utf8')

/**
 * De twee helften. Alles vóór `## App Store` is een notitie aan onszelf over
 * waar de tekst heen gaat, en die hoort nergens in een winkel — vandaar dat de
 * kop pas daar begint.
 */
const helften = (tekst: string) => {
  const a = tekst.indexOf('## App Store')
  const g = tekst.indexOf('## Google Play')
  expect(a, 'geen App Store-kop in dit bestand').toBeGreaterThan(-1)
  expect(g, 'geen Google Play-kop in dit bestand').toBeGreaterThan(a)
  return { apple: tekst.slice(a, g), play: tekst.slice(g) }
}

describe('de winkelteksten noemen geen andere winkel', () => {
  it.each(TALEN)('%s: de App Store-helft zwijgt over Google', (taal) => {
    const { apple } = helften(bestand(taal))
    const fout = apple
      .split('\n')
      .map((r, i) => [i + 1, r] as const)
      .filter(([, r]) => /Google[ -]Play|Android|Play Store/i.test(r))
      .map(([nr, r]) => `regel ${nr}: ${r.trim().slice(0, 90)}`)
    expect(fout, `richtlijn 2.3.10 — Apple wees hier al een keer op af`).toEqual([])
  })

  it.each(TALEN)('%s: de opzegzin wijst naar de juiste winkel', (taal) => {
    const { apple, play } = helften(bestand(taal))
    const { apple: bijApple, play: bijPlay } = OPZEGGEN[taal]
    expect(apple, `de App Store-tekst mist "${bijApple}"`).toContain(bijApple)
    // De Play-helft beschrijft zijn tekst als "dezelfde als hierboven"; daar
    // hoort de uitzondering bij te staan, anders raakt hij bij het volgende
    // overtypen stilletjes kwijt.
    expect(play, `de Play-aantekening mist "${bijPlay}"`).toContain(bijPlay)
  })
})
