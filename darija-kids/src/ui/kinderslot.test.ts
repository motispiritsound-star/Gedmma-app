/**
 * De belofte van de Kinderen-categorie, vastgezet.
 *
 * Apple wees versie 1.0 af omdat de naam zegt dat dit een kinderapp is
 * terwijl hij niet als kinderapp was ingediend. Het antwoord is dat hij dat
 * wél wordt — en dan geldt richtlijn 1.3: een kind mag zich niet met één tik
 * de app uit werken, en geld uitgeven gebeurt met een ouder erbij.
 *
 * Die belofte staat op acht plekken in de code, en code verhuist. Dus staat
 * hier een lijst van élke uitgang die de app heeft, met de reden waarom hij
 * mag bestaan. Komt er een nieuwe bij, dan valt deze test om, en dan is de
 * vraag niet "hoe krijg ik de test groen" maar "hoort daar een poort voor".
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, sep } from 'node:path'
import { describe, expect, it } from 'vitest'
import { STRINGS } from '../i18n'
import { LANG_CODES } from '../i18n/languages'

/** Alles wat een toestel buiten de app om iets laat doen. */
const UITGANGEN = /window\.open|location\.(?:href|assign)|openUrl|Browser\.open|mailto:|['"`]tel:|_blank/

/**
 * De uitgangen die er mogen zijn, en waarom.
 *
 * Elke regel is een bestand dat de poort zelf zet. Staat een bestand hier
 * niet in, dan hoort er geen uitgang in te zitten.
 */
const TOEGESTAAN: Record<string, string> = {
  'src/ui/Feedback.tsx': 'de mailknoppen — alle drie de ingangen staan achter useMailPoort()',
  'src/pages/Unlock.tsx': 'het e-boek openen en het abonnement beheren — allebei achter setPoort({ reden: "uit" })',
  /*
   * De enige uitgang die zijn eigen poort níét zet, en dat is met opzet.
   *
   * `wisselCodeIn` opent op Android de Play Store op het adres waar een code
   * ingewisseld wordt. Dat is een uitgang, maar hij hoort bij de koopmachine
   * en niet bij een scherm: Apple doet hetzelfde met een eigen venster in de
   * app, en welke van de twee het wordt kan alleen `billing.ts` weten.
   *
   * De poort staat dus bij de aanroep, in `Unlock.tsx`. Dat is geen gat maar
   * dezelfde opzet als `manageSubscription()`, die hier al jaren zo staat —
   * die viel alleen nooit op omdat de plugin het venster opent in plaats van
   * `window.open`. De test hieronder, "en roept niemand wisselCodeIn zonder
   * poort aan", houdt die belofte vast.
   */
  'src/engine/billing.ts': 'wisselCodeIn opent de Play Store; de poort staat bij elke aanroep',
  /*
   * Dezelfde opzet als billing.ts hierboven: `openBeoordeling` weet welk
   * adres bij welke winkel hoort en kan dat alleen daar weten. De poort staat
   * bij de aanroep, in `ui/Beoordeling.tsx`, en de test "en roept niemand
   * openBeoordeling zonder poort aan" houdt dat vast.
   */
  'src/engine/beoordeling.ts': 'openBeoordeling gaat naar de winkel; de poort staat bij de aanroep',
  /*
   * Derde van dezelfde soort. `deelNaarWhatsApp` opent `wa.me` met de tekst
   * erin -- een gewoon adres, zodat er geen deelplugin bij hoeft. De poort
   * staat in `ui/Delen.tsx`, bij allebei de kaarten, en de test hieronder
   * kijkt na dat niemand anders die functie aanroept.
   */
  'src/engine/delen.ts': 'deelNaarWhatsApp opent wa.me; de poort staat bij de aanroep',
}

/**
 * Alle app-bestanden. De site is een aparte bouw en valt niet onder de app.
 *
 * De paden komen eruit met schuine strepen, ook op Windows. `join` geeft daar
 * `src\\pages\\Unlock.tsx`, en dat is een ander woord dan de sleutel
 * `src/pages/Unlock.tsx` in `TOEGESTAAN` hieronder. De test viel daardoor om
 * op Adils laptop terwijl er niets mis was: hij las een nieuwe uitgang waar
 * alleen een andere scheidingsstreep stond.
 *
 * Een lijst die met een vaste lijst vergeleken wordt, moet in één schrijfwijze
 * staan. Die van de sleutels is de leesbare, dus zetten we de paden om.
 */
function appBestanden(map = 'src'): string[] {
  const uit: string[] = []
  for (const naam of readdirSync(map)) {
    const pad = join(map, naam)
    if (statSync(pad).isDirectory()) {
      // src/site is de website, src/content is tekst zonder code.
      if (pad === join('src', 'site') || pad === join('src', 'content')) continue
      uit.push(...appBestanden(pad))
    } else if (/\.tsx?$/.test(naam) && !naam.includes('.test.')) {
      uit.push(pad.split(sep).join('/'))
    }
  }
  return uit
}

describe('de app uit', () => {
  it('kan alleen op plekken die de ouderpoort zelf zetten', () => {
    const gevonden = appBestanden().filter((pad) => UITGANGEN.test(readFileSync(pad, 'utf8')))
    expect(gevonden.sort()).toEqual(Object.keys(TOEGESTAAN).sort())
  })

  it('zet in Feedback.tsx de poort voor elke ingang', () => {
    const bron = readFileSync('src/ui/Feedback.tsx', 'utf8')
    // Drie ingangen, en geen daarvan mag het venster rechtstreeks openen.
    for (const ingang of ['FeedbackButton', 'FeedbackLink', 'WordFeedback']) {
      expect(bron).toContain(`export function ${ingang}`)
    }
    expect(bron.match(/useMailPoort\(\)/g) ?? []).toHaveLength(4)
    expect(bron).toContain('<OuderPoort open={p.poort} reden="uit"')
  })

  /**
   * `billing.ts` staat op de lijst hierboven omdat het de enige plek is die
   * weet welke winkel welk venster opent. Die uitzondering is alleen te
   * verdedigen zolang elke aanroep de poort meebrengt, dus dat wordt hier
   * nagekeken en niet aangenomen.
   */
  it('en roept niemand wisselCodeIn zonder poort aan', () => {
    const aanroepen: string[] = []
    for (const pad of appBestanden()) {
      if (pad === 'src/engine/billing.ts') continue
      const bron = readFileSync(pad, 'utf8')
      for (const regel of bron.split('\n')) {
        if (regel.includes('wisselCodeIn(')) aanroepen.push(`${pad}: ${regel.trim()}`)
      }
    }
    expect(aanroepen.length, 'nergens aangeroepen is ook verdacht').toBeGreaterThan(0)
    for (const aanroep of aanroepen) {
      expect(aanroep).toMatch(/vraagPoort\(\{ reden: 'uit', doe: \(\) => wisselCodeIn\(/)
    }
  })

  /**
   * `Beoordeling.tsx` zet de poort zelf, maar in een andere vorm dan
   * `Unlock.tsx`: daar heet het `vraagPoort`, hier staat er een `OuderPoort`
   * in de boom met `poortAl()` ervoor voor wie er net een langs heeft gehad.
   * Allebei goed, en allebei moeten ze er zijn.
   */
  it('en roept niemand openBeoordeling zonder poort aan', () => {
    const bron = readFileSync('src/ui/Beoordeling.tsx', 'utf8')
    expect(bron).toContain('<OuderPoort')
    expect(bron).toContain('reden="uit"')
    expect(bron).toContain('poortAl()')
    // En nergens anders in de app, want dan staat er een deur zonder poort.
    const elders = appBestanden().filter(
      (pad) => pad !== 'src/engine/beoordeling.ts'
        && pad !== 'src/ui/Beoordeling.tsx'
        && /openBeoordeling\(/.test(readFileSync(pad, 'utf8')),
    )
    expect(elders).toEqual([])
  })

  it('en roept niemand deelNaarWhatsApp zonder poort aan', () => {
    const bron = readFileSync('src/ui/Delen.tsx', 'utf8')
    expect(bron).toContain('<OuderPoort')
    expect(bron).toContain('reden="uit"')
    expect(bron).toContain('poortAl()')
    // Twee kaarten, dus twee poorten -- een mijlpaal en "laat het aan oma zien".
    expect(bron.match(/<OuderPoort/g) ?? []).toHaveLength(2)
    const elders = appBestanden().filter(
      (pad) => pad !== 'src/engine/delen.ts'
        && pad !== 'src/ui/Delen.tsx'
        && /deelNaarWhatsApp\(/.test(readFileSync(pad, 'utf8')),
    )
    expect(elders).toEqual([])
  })

  it('laat op Unlock.tsx geen deur zonder poort staan', () => {
    const bron = readFileSync('src/pages/Unlock.tsx', 'utf8')
    /*
     * Drie handelingen: abonneren, het e-boek kopen, het abonnement beheren.
     *
     * Het waren er vier. "Het e-boek openen" hoorde erbij toen die knop het
     * bestand aan het toestel gaf — dat was een uitgang, en een uitgang hoort
     * achter de poort. Sinds het boek op `/boek` binnen de app opengaat, gaat
     * er niets meer uit, en dan is een rekensom vóór een boek dat je betaald
     * hebt geen bescherming maar een drempel.
     *
     * De poort is er voor de app uit gaan en voor geld uitgeven. Lezen is
     * geen van beide.
     */
    /*
     * Het waren er drie en het zijn er vijf. Erbij: "ik heb een code", twee
     * keer, omdat de winkels het verschillend doen — Apple opent zijn eigen
     * venster, Google vraagt hier om de code en gaat naar de Play Store. Dat
     * zijn twee knoppen in de bron, ook al ziet een kind er maar één.
     *
     * Allebei gaan ze de app uit en allebei staan ze achter reden "uit".
     */
    expect(bron.match(/vraagPoort\(\{ reden:/g) ?? []).toHaveLength(5)
    // En niets zet de poort nog rechtstreeks: dat zou hem bij elke tik
    // terugbrengen, ook als er net een volwassene langs is geweest.
    expect(bron).not.toMatch(/\bsetPoort\(\{ reden:/)
    // En niets doet ze nog rechtstreeks.
    expect(bron).not.toMatch(/onClick=\{manageSubscription\}/)
    expect(bron).not.toMatch(/onClick=\{\(\) => \{ sfx\.tap\(\); void buyEbook\(\) \}\}/)
  })

  it('drukt het handelsblok af in plaats van het te linken', () => {
    const bron = readFileSync('src/ui/Operator.tsx', 'utf8')
    // De gegevens blijven — de Digital Services Act vraagt erom.
    expect(bron).toContain('OPERATOR.phone')
    expect(bron).toContain('OPERATOR.email')
    // Maar een kind tikt er niet meer op weg.
    expect(bron).not.toMatch(UITGANGEN)
  })
})

describe('de ouderpoort', () => {
  it('vraagt in elke taal iets anders per deur', () => {
    for (const lang of LANG_CODES) {
      const t = STRINGS[lang].unlock
      const zinnen = [
        t.poortBody('3 × 4'),
        t.poortBodyPost('3 × 4'),
        t.poortBodyUit('3 × 4'),
        t.poortBodyDiploma('3 × 4'),
        t.poortBodyWissen('3 × 4'),
      ]
      for (const zin of zinnen) {
        expect(zin, `${lang}`).toContain('3 × 4')
        expect(zin.length, `${lang}`).toBeGreaterThan(20)
      }
      // Vijf redenen, vijf zinnen: een poort die overal hetzelfde zegt,
      // leert een ouder om eroverheen te lezen.
      expect(new Set(zinnen).size, `${lang}`).toBe(zinnen.length)
    }
  })
})
