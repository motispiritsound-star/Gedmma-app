/**
 * Er is geen gratis deel meer, en dat moet overal waar zijn.
 *
 * Dit bestand kwam in de plaats van `gratisop.test.ts`, dat precies het
 * omgekeerde bewaakte: dat er acht gratis lessen waren, dat er genoeg gratis
 * woorden waren om de deelkaart te halen, en dat het scorescherm op de juiste
 * les over geld begon. Op 23 november is dat besluit teruggedraaid — zie de
 * aantekening boven `magLeren` in store.ts.
 *
 * Wat hier bewaakt wordt is niet "nul" als getal. Het is de regel eronder:
 * **zonder abonnement staat alleen open wat deze leerling al heeft gedaan.**
 * Die regel heeft twee kanten, en ze zijn allebei nodig. De ene kant houdt de
 * app dicht voor wie vandaag binnenkomt. De andere houdt hem open voor wie de
 * app al had, en dat is geen vriendelijkheid: de voorwaarden die hij gelezen
 * heeft zeiden over precies die lessen "zijn gratis en blijven gratis".
 *
 * En één sluitstuk: de regel werkt alleen zolang er geen enkele manier is om
 * zonder abonnement een les af te ronden. Anders groeit een nieuwe gebruiker
 * zichzelf langs de muur. Daarom staat het letterspel er ook in.
 */
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { LESSONS, UNITS } from '../content/curriculum'
import {
  geleerd, getState, isDone, lessonBehindPaywall, lessonUnlocked, magLeren, nextLesson,
  setState, unitBehindPaywall, unitUnlocked,
} from './store'

/** Alsof deze lessen gedaan zijn, zonder de rest van de staat aan te raken. */
const gedaan = (ids: string[]) =>
  setState({ lessons: Object.fromEntries(ids.map((id) => [id, { stars: 3, runs: 1, bestScore: 1, lastDone: 0 }])) as never })

/** De acht lessen die tot 23 november gratis waren: `{ hruf: 3, groeten: 5 }`. */
const OUDE_GRATIS = [
  ...UNITS[0]!.lessons.slice(0, 3),
  ...UNITS.find((u) => u.id === 'groeten')!.lessons.slice(0, 5),
].map((l) => l.id)

beforeEach(() => setState({ lessons: {} as never, unlocked: false }))

describe('een verse installatie zonder abonnement', () => {
  it('heeft geen enkele les open', () => {
    for (const les of LESSONS) {
      expect(lessonBehindPaywall(les.id, getState()), les.id).toBe(true)
      expect(lessonUnlocked(les.id, getState()), les.id).toBe(false)
    }
  })

  it('heeft geen enkele unit open', () => {
    for (const unit of UNITS) {
      expect(unitBehindPaywall(unit.id, getState()), unit.id).toBe(true)
      expect(unitUnlocked(unit.id, getState()), unit.id).toBe(false)
    }
  })

  /**
   * En dus is er niets om naartoe te gaan.
   *
   * Hier zat de scherpste fout van het eerste ontwerp. `nextLesson` gaf
   * `LESSONS[0]!.id` terug als er niets open stond -- de eerste les van het
   * alfabet, die achter het slot zit. Elke "ga verder"-knop in de app wees
   * daarmee naar het slotscherm, en de knop op de website net zo.
   */
  it('geeft geen les terug om verder te gaan', () => {
    expect(nextLesson(getState())).toBeNull()
  })

  it('mag niet leren, dus stuurt de poort hem naar het abonnement', () => {
    expect(magLeren(getState())).toBe(false)
  })

  it('kan geen woord en geen letter horen', () => {
    const g = geleerd(getState())
    expect(g.woorden.size).toBe(0)
    expect(g.letters.size).toBe(0)
  })
})

describe('wie de app al had', () => {
  beforeEach(() => gedaan(OUDE_GRATIS))

  /**
   * Zijn acht lessen blijven open. Het alternatief -- ze met terugwerkende
   * kracht op slot zetten -- levert niets op, want hij had ze al, en het is
   * het soort besluit dat je terugleest in de beoordelingen op precies de
   * winkelbladzijde waar een campagne naartoe wijst.
   */
  it('houdt elke les die hij heeft afgerond', () => {
    for (const id of OUDE_GRATIS) {
      expect(isDone(id, getState()), id).toBe(true)
      expect(lessonBehindPaywall(id, getState()), id).toBe(false)
      expect(lessonUnlocked(id, getState()), id).toBe(true)
    }
  })

  it('krijgt er geen enkele nieuwe les bij', () => {
    const nieuw = LESSONS.filter((l) => !OUDE_GRATIS.includes(l.id))
    expect(nieuw.length).toBeGreaterThan(60)
    for (const les of nieuw) {
      expect(lessonBehindPaywall(les.id, getState()), les.id).toBe(true)
    }
  })

  /**
   * En zijn afgeronde unit blijft een unit en wordt geen grijze strook.
   *
   * `Learn.tsx` hangt de volle kop -- met de voortgangsbalk en het
   * honderd-procentstempel -- aan `unitUnlocked`. Zonder deze ruimere regel
   * zag iemand die `groeten` helemaal af had zijn eigen werk terug als een
   * streep met een hangslot, zonder balk en zonder stempel.
   */
  it('ziet de units waarin hij iets gedaan heeft als open', () => {
    expect(unitBehindPaywall('hruf', getState())).toBe(false)
    expect(unitBehindPaywall('groeten', getState())).toBe(false)
    const rest = UNITS.filter((u) => u.id !== 'hruf' && u.id !== 'groeten')
    for (const unit of rest) expect(unitBehindPaywall(unit.id, getState()), unit.id).toBe(true)
  })

  it('mag leren, dus de poort laat hem door', () => {
    expect(magLeren(getState())).toBe(true)
  })

  /**
   * En `nextLesson` wijst nooit naar een slot.
   *
   * Voor hem is elke open les ook een gedane les, dus er is geen volgende --
   * `nextLesson` geeft dan de laatste die hij af heeft, zodat "ga verder" hem
   * laat herhalen in plaats van tegen een slotje te lopen.
   */
  it('wordt nooit naar een les op slot gestuurd', () => {
    const volgende = nextLesson(getState())
    expect(volgende).not.toBeNull()
    expect(lessonBehindPaywall(volgende!, getState())).toBe(false)
  })

  /**
   * Hij hoort nog wat hij geleerd heeft. Dat is de regel die boven
   * `geleerd()` staat, en hij was tot nu toe een benadering: het waren de
   * woorden uit de gratis lessen, of iemand ze gedaan had of niet.
   */
  it('hoort de woorden en letters uit zijn eigen lessen, en geen andere', () => {
    const g = geleerd(getState())
    const eigen = LESSONS.filter((l) => OUDE_GRATIS.includes(l.id))
    expect(g.woorden.size).toBeGreaterThan(20)
    for (const les of eigen) {
      for (const w of les.words) expect(g.woorden.has(w), w).toBe(true)
      for (const l of les.letters ?? []) expect(g.letters.has(l), l).toBe(true)
    }
    const vreemd = LESSONS.filter((l) => !OUDE_GRATIS.includes(l.id)).flatMap((l) => l.words)
    const eigenWoorden = new Set(eigen.flatMap((l) => l.words))
    for (const w of vreemd.filter((w) => !eigenWoorden.has(w)).slice(0, 40)) {
      expect(g.woorden.has(w), w).toBe(false)
    }
  })

  /** En het alfabet blijft voor een deel dicht: dertien van de achtentwintig. */
  it('ziet niet het hele alfabet', () => {
    expect(geleerd(getState()).letters.size).toBeLessThan(28)
  })
})

describe('wie betaald heeft', () => {
  beforeEach(() => setState({ unlocked: true }))

  it('krijgt alles in één keer, zonder één les te hebben gedaan', () => {
    for (const les of LESSONS) expect(lessonBehindPaywall(les.id, getState()), les.id).toBe(false)
    for (const unit of UNITS) expect(unitBehindPaywall(unit.id, getState()), unit.id).toBe(false)
    expect(magLeren(getState())).toBe(true)
  })

  it('begint bij de eerste les van het pad', () => {
    expect(nextLesson(getState())).toBe(LESSONS[0]!.id)
  })
})

/**
 * De onthouden sets moeten meebewegen.
 *
 * `geleerd()` bouwt zijn twee sets één keer en bewaart ze op de identiteit van
 * `lessons`, omdat `woordOpSlot` driehonderd keer achter elkaar wordt
 * aangeroepen op het woordenboekscherm. Vergeet `setState` ooit een nieuw
 * `lessons`-object te maken, dan blijft het woordenboek stil op slot staan
 * nadat een les is afgerond -- en dat is precies het soort fout dat niemand
 * ziet tot een kind zich erover beklaagt.
 */
describe('de onthouden sets', () => {
  it('vernieuwen zodra er een les bij komt', () => {
    expect(geleerd(getState()).woorden.size).toBe(0)
    gedaan([LESSONS[0]!.id])
    expect(geleerd(getState()).woorden.size).toBe(LESSONS[0]!.words.length)
    gedaan([LESSONS[0]!.id, LESSONS[1]!.id])
    const samen = new Set([...LESSONS[0]!.words, ...LESSONS[1]!.words])
    expect(geleerd(getState()).woorden.size).toBe(samen.size)
  })
})

/**
 * En het sluitstuk: er is geen weg om zonder abonnement voortgang te maken.
 *
 * `magLeren` onderscheidt oude gebruikers van nieuwe aan hun voortgang, en dat
 * is alleen sluitend zolang nieuwe voortgang onmogelijk is. Het letterspel op
 * `/letters` was precies dat gat: het koos uit alle 28 letters, keek niet naar
 * `unlocked`, en schreef via `completeLesson('letters', ...)` een voortgang
 * weg zonder dat er ooit een les open was gegaan.
 */
describe('het letterspel', () => {
  const bron = readFileSync(new URL('../pages/Alphabet.tsx', import.meta.url), 'utf8')
    .replace(/\r\n/g, '\n')

  it('staat achter het abonnement', () => {
    expect(bron).toContain("completeLesson('letters'")
    const knop = /\{gekocht[\s\S]{0,300}?setGame\(true\)[\s\S]{0,300}?<\/Card>/.exec(bron)?.[0]
    expect(knop, 'de speelknop hangt niet aan `gekocht`').toBeTruthy()
    expect(knop).toContain('/volledig')
  })
})

/**
 * De poort: zonder abonnement is het abonnementsscherm het eerste scherm.
 *
 * Zonder deze poort kwam een nieuwe gebruiker na het welkomstscherm op
 * `/leren` terecht: zeventien units met een hangslot, geen les die opengaat,
 * en geen enkel scherm dat nog een prijs noemde. Het aanbodblad is daar geen
 * antwoord op -- dat is wegklikbaar, `aanbodGezien` blijft bewaard, en op het
 * web komt het helemaal niet.
 */
describe('de poort in App.tsx', () => {
  const bron = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n')

  it('stuurt naar /volledig zolang er niets te leren is', () => {
    expect(bron).toContain('const mag = useStore(magLeren)')
    expect(bron).toContain('if (!mag && platform() !== \'web\') return <Navigate to="/volledig" replace />')
  })

  /**
   * Elke bladzijde met cursusinhoud staat erachter. Eén vergeten route is een
   * gat in de muur: wie het adres weet, loopt eromheen.
   */
  it('staat voor elke bladzijde met cursusinhoud', () => {
    for (const pad of ['/leren', '/les/:lessonId', '/herhalen/:running?', '/woorden', '/letters', '/verhalen', '/verhalen/:storyId', '/spelen', '/bonus/:bonusId?']) {
      const regel = new RegExp(`path="${pad.replace(/[?:/]/g, (c) => `\\${c}`)}" element=\\{<Poort>`)
      expect(regel.test(bron), `${pad} staat niet achter de poort`).toBe(true)
    }
  })

  /**
   * En níet voor de bladzijden die iemand zonder abonnement nodig heeft. Een
   * poort die ook voor de instellingen, de voorwaarden en de knop om een
   * eerdere aankoop terug te zetten staat, is een app die je niet meer uit
   * komt.
   */
  it('staat niet voor de uitgangen', () => {
    for (const pad of ['/volledig', '/instellingen', '/voorwaarden', '/privacy', '/ouders', '/profiel', '/boek']) {
      expect(bron).toContain(`path="${pad}" element={<`)
      expect(bron).not.toContain(`path="${pad}" element={<Poort>`)
    }
  })
})

/**
 * Het scorescherm, voor wie geen abonnement heeft.
 *
 * Hier stond `gratisOp`: of dit de laatste gratis les was. Die vraag bestaat
 * niet meer. Zonder abonnement staat alleen open wat al gedaan is, dus is er
 * na élke les geen volgende -- en hoort de mededeling er élke keer bij.
 */
describe('het scorescherm', () => {
  const bron = readFileSync(new URL('../pages/LessonPlayer.tsx', import.meta.url), 'utf8')
    .replace(/\r\n/g, '\n')
  /** Zonder commentaar, want commentaar mag het verleden uitleggen. */
  const code = bron.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')

  it('zegt waarom het pad ophoudt, en pas ná de beloningen', () => {
    expect(bron).toContain('{!gekocht && (')
    expect(bron).toContain('t.lesson.abonnementTitel')
    expect(bron).toContain('t.lesson.abonnementBody')
    expect(bron.indexOf('t.lesson.abonnementTitel')).toBeGreaterThan(bron.indexOf('{won.length > 0'))
  })

  /**
   * De bovenste knop doet wat de lezer nu wil, en de weg terug blijft staan:
   * een scherm met één uitgang is geen scherm maar een fuik.
   */
  it('wisselt de knoppen om, maar houdt de weg terug', () => {
    expect(bron).toContain('{!gekocht ? (')
    expect(bron).toContain('<Link to="/volledig" className="block">')
    expect(bron).toContain("{!gekocht && (\n            <Button variant=\"secondary\" className=\"w-full\" onClick={() => navigate('/leren')}>")
    expect(bron).toContain('{gekocht && volgende && (')
    expect(bron.match(/t\.lesson\.verderOpPad/g)?.length).toBe(3)
  })

  /** En nergens meer een proefperiode of een gratis les. */
  it('rekent nergens meer met een gratis deel', () => {
    for (const dood of ['gratisOp', 'gratisDeelOp', 'TRIAL_DAYS', 'proefDagen', 'seintjeGratisOp']) {
      expect(code, `${dood} staat er nog in`).not.toContain(dood)
    }
  })
})

/**
 * En niets in de app rekent nog op het gratis deel.
 *
 * Een losse verwijzing naar `FREE_LESSONS` die blijft staan is geen
 * compilerfout als iemand de constante opnieuw invoert, en dan staat er weer
 * een getal in een tekst over geld. Dit is de rem daarop.
 */
describe('de hele broncode', () => {
  const bestanden = ['engine/store.ts', 'engine/billing.ts', 'ui/Welcome.tsx', 'ui/Aanbod.tsx', 'pages/Unlock.tsx', 'pages/Learn.tsx', 'pages/Landing.tsx']

  it.each(bestanden)('kent geen gratis deel meer (%s)', (naam) => {
    const bron = readFileSync(new URL(`../${naam}`, import.meta.url), 'utf8')
      // Commentaar mag het verleden uitleggen; code niet.
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
    for (const dood of ['FREE_LESSONS', 'GRATIS_LESSEN', 'GRATIS_WOORDEN', 'GRATIS_LETTERS', 'gratisDeelOp', 'gratisOpGemeld']) {
      expect(bron, `${dood} staat nog in ${naam}`).not.toContain(dood)
    }
  })
})
