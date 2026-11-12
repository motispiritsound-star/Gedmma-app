/**
 * De campagnelinks, en waarom elke bewering hier een eis van buiten is.
 *
 * Attributie is het enige dat je met terugwerkende kracht nooit meer kunt
 * repareren -- dat staat sinds 17 oktober in `docs/WINKELGEREEDSCHAP.md` en
 * het is sindsdien twee grote Facebook-campagnes lang waar gebleven. Een link
 * die stil verkeerd is gevormd, meet niets en zegt dat niet. Vandaar deze
 * test: elke regel hier komt uit de documentatie van Apple of Google, niet uit
 * smaak.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  APP_ID,
  APPLE_ID,
  KANAAL_MAX,
  KANALEN,
  PROVIDER_TOKEN,
  STORE,
  appleKanaalUrl,
  appleStoreUrl,
  playKanaalUrl,
  playStoreUrl,
  type Kanaal,
} from './links'

const namen = Object.keys(KANALEN) as Kanaal[]

describe('de kanaalnamen', () => {
  /*
   * Apple spreekt zichzelf tegen: de twee Analytics-pagina's zeggen 30 tekens,
   * de glossary zegt 40. De glossary verwijst nog naar analytics.itunes.apple.com,
   * een adres dat jaren weg is, dus 30 is de veilige waarde en die staat in
   * KANAAL_MAX.
   */
  it('blijven binnen wat Apple toestaat', () => {
    expect(KANAAL_MAX).toBe(30)
    for (const naam of namen) expect(naam.length, naam).toBeLessThanOrEqual(KANAAL_MAX)
  })

  /*
   * De doorsnede van beide winkels. Apple staat spaties en leestekens toe,
   * maar alles buiten a-z0-9- moet aan de Google-kant door een coderingslaag
   * en maakt de link onleesbaar voor wie hem met het oog nakijkt. En Apple's
   * regel dat een spatie niet vooraan of achteraan mag, wordt zo irrelevant.
   */
  it('gebruiken alleen tekens die in beide winkels ongecodeerd overleven', () => {
    for (const naam of namen) expect(naam, naam).toMatch(/^[a-z0-9-]+$/)
  })

  /*
   * Apple laat een campagne pas zien bij eerste-downloads van minstens vijf
   * verschillende personen, en Google rolt kleine waarden op in "Other". Bij
   * drie downloads per dag haalt een naam met een week of een datum erin die
   * drempel nooit. De tijdas zit al in beide dashboards.
   */
  it('dragen geen datum of weeknummer', () => {
    for (const naam of namen) {
      expect(naam, `${naam} lijkt een periode te bevatten`).not.toMatch(/\d{4}|w\d{1,2}$|-\d{2}$/)
    }
  })

  it('hebben allemaal een source, een medium en een plek', () => {
    for (const naam of namen) {
      const k = KANALEN[naam]
      expect(k.source, naam).toMatch(/^[a-z0-9-]+$/)
      expect(k.medium, naam).toMatch(/^[a-z0-9-]+$/)
      expect(k.waar.length, naam).toBeGreaterThan(8)
    }
  })
})

describe('de Apple-link', () => {
  /*
   * Apple documenteert `ct` uitsluitend op /app/apple-store/id<id>. Of de
   * parameter meereist op de korte /app/id<id> die `appleStoreUrl` bouwt,
   * staat nergens zwart op wit -- dus gebruiken we de vorm die wél
   * gedocumenteerd is. "apple-store" is daarin vaste tekst en niet de naam van
   * onze app, dus we leveren geen landneutraliteit in.
   */
  it('staat op de vorm die Apple werkelijk documenteert', () => {
    const url = appleKanaalUrl('fb-nl', '1234567')
    expect(url).toBe(`https://apps.apple.com/app/apple-store/id${APPLE_ID}?pt=1234567&ct=fb-nl&mt=8`)
    expect(url).toContain('/app/apple-store/')
  })

  /*
   * Leeg betekent nog niet klaar -- dezelfde afspraak als STORE en SHOP.
   * Liever een link die werkt zonder meting dan een link die meet en niet
   * werkt: zonder providercode noemt Apple de campagne incompleet, en dan
   * heb je een adres met rommel erachter en nog steeds geen cijfer.
   */
  it('valt terug op het gewone winkeladres zolang er geen providercode is', () => {
    expect(appleKanaalUrl('fb-nl', '')).toBe(STORE.apple)
  })

  it('leest het Apple-nummer uit STORE en niet uit een tweede plek', () => {
    // `scripts/live.mjs` herschrijft het STORE-blok machinaal. Een tweede, met
    // de hand getypt nummer loopt daar stil achter.
    expect(APPLE_ID).toMatch(/^\d{8,}$/)
    expect(STORE.apple).toContain(APPLE_ID)
  })
})

describe('de Play-link', () => {
  /*
   * De utm-tekst gaat gecodeerd als wáárde van referrer. Laat je de & ertussen
   * onverpakt staan, dan ziet Play losse queryparameters en breekt de
   * verwijzing af bij de eerste -- en dan krijgt de app
   * utm_source=google-play&utm_medium=organic terug in plaats van wat wij
   * erin zetten.
   */
  it('verpakt de utm-tekst als één gecodeerde waarde', () => {
    const url = playKanaalUrl('fb-fr')
    expect(url).toBe(
      `https://play.google.com/store/apps/details?id=${APP_ID}` +
        '&referrer=utm_source%3Dfacebook%26utm_medium%3Dgroep%26utm_campaign%3Dfb-fr',
    )
    // Precies één losse &: die van referrer zelf.
    expect(url.split('&').length - 1).toBe(1)
    expect(url).not.toMatch(/referrer=[^&]*&utm/)
  })

  it('zet utm_source, utm_medium en utm_campaign, want Play leest source en campaign', () => {
    for (const naam of namen) {
      const referrer = decodeURIComponent(playKanaalUrl(naam).split('&referrer=')[1]!)
      expect(referrer, naam).toMatch(/^utm_source=[a-z0-9-]+&utm_medium=[a-z0-9-]+&utm_campaign=[a-z0-9-]+$/)
      expect(referrer, naam).toContain(`utm_campaign=${naam}`)
    }
  })

  /* 512 tekens gecodeerd is het enige officiële getal dat Google noemt. */
  it('blijft ruim onder de 512 tekens', () => {
    for (const naam of namen) {
      const referrer = playKanaalUrl(naam).split('&referrer=')[1]!
      expect(referrer.length, naam).toBeLessThan(512)
    }
  })

  it('werkt zonder enige code uit een console', () => {
    // Dit is het verschil met Apple en de reden dat de Android-helft van elke
    // post vandaag al te taggen is.
    expect(PROVIDER_TOKEN === '' || /^\d+$/.test(PROVIDER_TOKEN)).toBe(true)
    // Gecodeerd, want het hoort één waarde te zijn: %3D en niet =.
    expect(playKanaalUrl('whatsapp')).toContain('utm_campaign%3Dwhatsapp')
    expect(playKanaalUrl('whatsapp')).not.toContain('utm_campaign=')
  })
})

describe('de bestaande adressen', () => {
  /*
   * Dit is de kern van het ontwerp: de twee kanonieke bouwers blijven schoon.
   * `scripts/live.mjs` herschrijft STORE met een reguliere uitdrukking, en
   * `site.test.ts` eist exacte gelijkheid op playStoreUrl(). Een parameter die
   * dáár standaard in gaat, breekt allebei -- en die adressen komen ook in App
   * Store Connect en de Play Console te staan, waar een campagnestaart niet
   * hoort.
   */
  it('blijven zonder campagnestaart', () => {
    expect(playStoreUrl()).toBe(`https://play.google.com/store/apps/details?id=${APP_ID}`)
    expect(playStoreUrl()).not.toContain('referrer')
    expect(appleStoreUrl('id6813964474')).toBe('https://apps.apple.com/app/id6813964474')
    expect(appleStoreUrl('id6813964474')).not.toContain('ct=')
    expect(STORE.apple).not.toContain('ct=')
    expect(STORE.google).not.toContain('referrer')
  })
})

describe('het script', () => {
  const script = readFileSync(new URL('../../scripts/kanaallinks.mjs', import.meta.url), 'utf8')
    .replace(/\r\n/g, '\n')

  it('vraagt om de providercode in plaats van hem tussen punthaken te zetten', () => {
    // CLAUDE.md: een waarde tussen punthaken is één keer letterlijk, mét
    // punthaken, in een veld bij Gumroad beland.
    expect(script).toContain("process.argv.indexOf('--pt')")
    /*
     * Alleen in wat het script afdrukt, niet in het hele bestand: de
     * toelichting bovenaan noemt dat Gumroad-voorbeeld juist als de fout die
     * niet meer gemaakt moet worden, en een test die dáárover valt verbiedt
     * het opschrijven van de les in plaats van de fout.
     */
    const afgedrukt = [...script.matchAll(/console\.(?:log|error)\((['`])([\s\S]*?)\1\)/g)]
      .map((m) => m[2])
      .join('\n')
    expect(afgedrukt.length).toBeGreaterThan(200)
    expect(afgedrukt).not.toMatch(/<[a-z]/i)
  })

  it('weigert een code die geen getal is', () => {
    expect(script).toMatch(/if \(vlag !== -1 && !\/\^\\d\{4,\}\$\/\.test/)
    expect(script).toContain('process.exit(1)')
  })

  it('schrijft terug met het regeleinde dat het bestand al had', () => {
    // Op Windows zet git \r\n in de werkmap; een script dat op \n zoekt vindt
    // daar niets en meldt iets heel anders dan wat er aan de hand is.
    expect(script).toMatch(/export const PROVIDER_TOKEN = '\[\^'\]\*'/)
  })

  it('start npm of npx niet via execFileSync', () => {
    // Op Windows heten die npm.cmd en npx.cmd, en Node vindt ze dan niet.
    expect(script).not.toContain('execFileSync')
  })

  it('gebruikt geen /tmp', () => {
    expect(script).not.toContain('/tmp')
  })
})

describe('de knop op de website', () => {
  /*
   * De campagnelink naar Play is het eerste adres op de hele site met een `&`
   * erin. `storeButton` in make-site.mjs interpoleerde zijn href ongeëscaped,
   * en dat was tot nu toe nooit een probleem omdat er nooit iets te escapen
   * was. In een attribuut hoort `&` als `&amp;`.
   */
  const gen = readFileSync(new URL('../../scripts/make-site.mjs', import.meta.url), 'utf8')
    .replace(/\r\n/g, '\n')

  it('escapet de href van de winkelknop, want die draagt nu een &', () => {
    /*
     * Alleen deze knop, niet elke href in de generator: de taalwisselaar even
     * hogerop interpoleert ook een `href`, en die krijgt een intern pad uit
     * PATHS waar geen `&` in voorkomt. Een site-brede eis zou dus iets
     * verbieden wat nergens stukgaat -- en zou bij de eerste aanpassing aan de
     * taalwisselaar omvallen om een reden die niets met campagnelinks te maken
     * heeft.
     */
    const knop = gen.match(/const storeButton = [\s\S]*?\n\n/)?.[0] ?? ''
    expect(knop).toContain('class="store"')
    expect(knop).toContain('href="${esc(href)}"')
    expect(knop).not.toContain('href="${href}"')
  })

  it('draagt het kanaal web, en houdt STORE als aan/uit-vlag', () => {
    expect(gen).toContain("STORE.apple && appleKanaalUrl('web')")
    expect(gen).toContain("STORE.google && playKanaalUrl('web')")
    // Zonder adres hoort er een uitgeschakelde knop te staan, geen link naar niets.
    expect(gen).toContain('const LIVE = Boolean(STORE.apple || STORE.google)')
  })
})
