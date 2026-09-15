/**
 * Welke woorden een Nederlandse spraakcomputer waarschijnlijk verkeerd doet.
 *
 * Het nut hiervan zit in één ding: de testpassage. Elke aanbieder heeft een
 * demotekst die is uitgekozen om goed te klinken — korte zinnen, gewone
 * woorden, geen cijfers. Daarmee klinkt alles goed. Je hoort pas wat een stem
 * waard is op de zinnen die jij werkelijk gaat inspreken.
 *
 * Dus: lees het echte script, zoek de stukken met de meeste struikelwoorden,
 * en test dáárop. De regels hieronder zijn grof met opzet. Ze hoeven niet te
 * voorspellen wat er misgaat, alleen aan te wijzen waar je moet luisteren.
 */

export type Reden =
  | 'cijfer' | 'samenstelling' | 'leenwoord' | 'eigennaam' | 'afkorting' | 'eenheid'

export interface Struikelwoord {
  woord: string
  reden: Reden
  uitleg: string
}

/**
 * Woorden die er buitenlands uitzien voor een Nederlands stemmodel.
 *
 * De `th` staat er alleen aan het woordbegin of na een klinker in. Anders vangt
 * hij "onthoud" en "ontheffing", waar de t en de h bij verschillende
 * woorddelen horen en er dus niets bijzonders aan de hand is.
 */
const LEEN = /(^|[^aeiou])y|c[eiy]|ph|(^|[aeiou])th[aeiou]|qu|x[aeiou]|ée|è|ï/i

/** Eenheden en symbolen worden zelden uitgesproken zoals je bedoelt. */
const EENHEID = /(m³|km²|%|°|€|\$|\/)/

const GEWOON = new Set([
  'de', 'het', 'een', 'en', 'van', 'dat', 'die', 'is', 'in', 'op', 'te', 'voor',
  'niet', 'met', 'als', 'maar', 'dan', 'je', 'er', 'aan', 'ook', 'naar', 'uit',
])

function beoordeel(woord: string, eerste: boolean): Struikelwoord | undefined {
  const kaal = woord.replace(/^[^\p{L}\p{N}€$%]+|[^\p{L}\p{N}³²%]+$/gu, '')
  if (kaal.length === 0 || GEWOON.has(kaal.toLowerCase())) return undefined

  if (EENHEID.test(kaal)) {
    return { woord: kaal, reden: 'eenheid',
      uitleg: 'Een eenheid of symbool. Luister of hij hem uitspreekt en niet spelt.' }
  }
  if (/\d/.test(kaal)) {
    return { woord: kaal, reden: 'cijfer',
      uitleg: 'Een cijfer. Nederlandse stemmen lezen getallen vaak als losse cijfers, ' +
        'of zetten de klemtoon fout. Schrijf hem voluit als het misgaat.' }
  }
  if (/^[A-Z]{2,}$/.test(kaal)) {
    return { woord: kaal, reden: 'afkorting',
      uitleg: 'Een afkorting. Wordt hij gespeld of als woord gelezen?' }
  }
  if (!eerste && /^\p{Lu}/u.test(kaal)) {
    return { woord: kaal, reden: 'eigennaam',
      uitleg: 'Een eigennaam. Plaatsnamen zijn waar de meeste stemmen op vallen.' }
  }
  if (LEEN.test(kaal)) {
    return { woord: kaal, reden: 'leenwoord',
      uitleg: 'Ziet er niet-Nederlands uit. Let op of hij niet in het Engels schiet.' }
  }
  if (kaal.length >= 14) {
    return { woord: kaal, reden: 'samenstelling',
      uitleg: 'Lange samenstelling. Nederlands legt de klemtoon op het eerste deel; ' +
        'een stem die dat niet weet, hakt het woord doormidden.' }
  }
  return undefined
}

/** Alle struikelwoorden in een tekst, zonder dubbele. */
export function struikelwoorden(tekst: string): Struikelwoord[] {
  const gezien = new Set<string>()
  const uit: Struikelwoord[] = []
  for (const zin of tekst.split(/(?<=[.!?])\s+/)) {
    const woorden = zin.trim().split(/\s+/)
    for (const [i, w] of woorden.entries()) {
      const oordeel = beoordeel(w, i === 0)
      if (oordeel && !gezien.has(oordeel.woord.toLowerCase())) {
        gezien.add(oordeel.woord.toLowerCase())
        uit.push(oordeel)
      }
    }
  }
  return uit
}

export interface Passage {
  tekst: string
  woorden: number
  struikelwoorden: Struikelwoord[]
  /** Struikelwoorden per honderd woorden. Hoger is een strengere test. */
  dichtheid: number
}

/**
 * Kiest het aaneengesloten stuk met de meeste struikelwoorden.
 *
 * Aaneengesloten en niet de losse moeilijke zinnen bij elkaar geplakt: een stem
 * klapt vaak niet op één woord maar op de overgang ertussen, en een geknipte
 * tekst verbergt precies dat.
 */
export function kiesTestpassage(tekst: string, doelWoorden = 90): Passage {
  const zinnen = tekst.split(/(?<=[.!?])\s+/).map((z) => z.trim()).filter(Boolean)
  if (zinnen.length === 0) {
    return { tekst: '', woorden: 0, struikelwoorden: [], dichtheid: 0 }
  }

  let beste: Passage | undefined
  for (let start = 0; start < zinnen.length; start++) {
    let stuk = ''
    for (let eind = start; eind < zinnen.length; eind++) {
      stuk = `${stuk} ${zinnen[eind]}`.trim()
      const woorden = stuk.split(/\s+/).length
      if (woorden < doelWoorden * 0.6) continue
      const lastig = struikelwoorden(stuk)
      const dichtheid = (lastig.length / woorden) * 100
      const kandidaat: Passage = { tekst: stuk, woorden, struikelwoorden: lastig, dichtheid }
      // Bij gelijke dichtheid wint de passage die het dichtst bij de doellengte
      // ligt: een test die te kort is, hoor je niet uitzakken.
      const beterDan = !beste || dichtheid > beste.dichtheid + 0.01 ||
        (Math.abs(dichtheid - beste.dichtheid) <= 0.01 &&
          Math.abs(woorden - doelWoorden) < Math.abs(beste.woorden - doelWoorden))
      if (beterDan) beste = kandidaat
      if (woorden >= doelWoorden * 1.4) break
    }
  }
  return beste ?? { tekst: zinnen.join(' '), woorden: zinnen.join(' ').split(/\s+/).length,
    struikelwoorden: [], dichtheid: 0 }
}
