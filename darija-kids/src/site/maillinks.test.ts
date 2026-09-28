/**
 * De drie links in een mail die iets veranderen, en de regel eronder.
 *
 * `/bevestig`, `/uitschrijven` en `/wissen` deden hun werk op een GET. Daar was
 * geen aanvaller voor nodig: mailclients en virusscanners halen links in een
 * bericht vooruit op om ze te controleren — Outlook Safe Links, de scanner van
 * een bedrijf, het linkvoorbeeld van Slack en WhatsApp. Zo'n prefetch is een
 * gewone GET, en een GET was hier een verwijdering. Iemand kreeg de mail,
 * klikte nergens op, en zijn aanmelding was weg.
 *
 * Nu toont de GET een bladzijde met een knop, en pas de POST erachter doet het.
 * Dat is één regel per endpoint, en precies het soort regel dat bij een
 * volgende opruiming sneuvelt omdat niemand meer weet waarom hij er stond.
 * Vandaar deze test, die de bron leest in plaats van het gedrag: hij valt om
 * zodra een van de drie zijn methode niet meer nakijkt.
 *
 * Deze bewaker staat hier en niet in de worker-map, omdat de tsconfig daar
 * alleen de workers-types kent — een test die `node:fs` gebruikt haalt die
 * typecheck niet.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const bron = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8')

/** De drie, met wat er gebeurt als je er per ongeluk langs komt. */
const ENDPOINTS = ['bevestig', 'uitschrijven', 'wissen'] as const

describe('de links uit de mail', () => {
  const index = bron('../../server/src/index.ts')

  it('geven alle drie de methode door aan hun afhandeling', () => {
    for (const naam of ENDPOINTS) {
      const route = new RegExp(
        `url\\.pathname === '/${naam}'\\) return metAdres\\(await ${naam}\\(url, env, verzoek\\.method === 'POST'\\)\\)`,
      )
      expect(index, `/${naam} kijkt niet meer naar de methode`).toMatch(route)
    }
  })

  it('tonen bij een GET eerst de vraag, vóór er iets wordt geschreven', () => {
    for (const naam of ENDPOINTS) {
      const start = index.indexOf(`async function ${naam}(`)
      expect(start, `${naam}() niet gevonden`).toBeGreaterThan(-1)
      const eind = index.indexOf('\nasync function ', start + 10)
      const lichaam = index.slice(start, eind === -1 ? undefined : eind)

      // De uitweg voor een GET moet er zijn ...
      expect(lichaam, `${naam}() vraagt niet eerst`).toContain('if (!doen)')
      expect(lichaam).toContain('vraagPagina(')

      // ... en hij moet vóór de eerste schrijfopdracht staan, anders is hij
      // decoratie: dan is de rij al gewijzigd tegen de tijd dat we het vragen.
      const vraag = lichaam.indexOf('if (!doen)')
      const schrijf = lichaam.search(/UPDATE |DELETE FROM /)
      expect(schrijf, `${naam}() schrijft niets meer?`).toBeGreaterThan(-1)
      expect(vraag, `${naam}() schrijft vóórdat hij vraagt`).toBeLessThan(schrijf)
    }
  })

  it('houden hun eigen adres aan, zodat oude mails blijven werken', () => {
    // Het formulier post terug naar dezelfde route. Wees dat een ander adres,
    // dan werkt elke link in elke al verstuurde mail vanaf nu op niets uit.
    for (const naam of ENDPOINTS) {
      expect(index).toContain(`\`/${naam}?t=\${encodeURIComponent(token)}\``)
    }
  })

  it('hebben in elke taal een tekst voor die vraag', () => {
    const mails = bron('../../server/src/mails.ts')
    const velden = ['vraagBevestigKop', 'vraagBevestigBody', 'vraagAfmeldKop',
      'vraagAfmeldBody', 'vraagWisKop', 'vraagWisBody']
    for (const veld of velden) {
      // Eén keer in de interface en één keer per taal.
      const keer = mails.split(`${veld}:`).length - 1
      expect(keer, `${veld} staat ${keer}× in mails.ts`).toBe(7)
    }
    expect(mails).not.toMatch(/vraag[A-Za-z]+:\s*''/)
  })
})

/**
 * En wat er níet in het logboek hoort.
 *
 * `console.error('terugbetaling zonder bestelnummer', email)` zette een adres
 * in de logs van Cloudflare. Dat is een uitzondering die de rest van deze
 * database nergens maakt: `opening` en `mailteller` bewaren een hash van het ip
 * en niet het ip, `bestelling` een hash van de sleutel en niet de sleutel.
 *
 * Een log heeft een eigen bewaartermijn, een eigen toegangslijst en geen
 * verwijderknop per regel — en voor de AVG maakt het niet uit dat het in een
 * log staat en niet in een tabel.
 */
describe('het logboek van de worker', () => {
  const index = readFileSync(new URL('../../server/src/index.ts', import.meta.url), 'utf8')

  it('schrijft nergens een e-mailadres weg', () => {
    const regels = index.split('\n')
    regels.forEach((regel, i) => {
      if (!/console\.(error|log|warn)\(/.test(regel)) return
      // Geen kale `email` of `.email` als argument. Een hash ervan mag wel:
      // die is nodig om te zien dat het twee keer dezelfde persoon is.
      const argumenten = regel.slice(regel.indexOf('(') + 1)
      expect(argumenten, `regel ${i + 1} logt een adres: ${regel.trim()}`)
        .not.toMatch(/(^|[\s,(])(email|rij\.email|body\.email|lid\.email)([\s,)]|$)/)
    })
  })

  it('zout de hash, want een kale hash van een adres is door te rekenen', () => {
    // De verzameling e-mailadressen is klein genoeg om af te lopen. Zonder
    // zout is zo'n hash het adres zelf, alleen minder leesbaar.
    expect(index).toContain('hashVan(email + env.ZOUT)')
  })
})

/**
 * En de inloglink die nooit verstuurd werd.
 *
 * `maakLink` schrijft de rij vóórdat de mail weggaat — dat moet, want het
 * token hoort in die mail. Viel het versturen om, dan bleef de rij staan, en
 * `magOpnieuw` zag een link van nog geen minuut oud. De tweede poging sloeg
 * het versturen dus over en antwoordde `{ goed: true }`, waarna het portaal
 * "kijk in je mail" toonde terwijl er niets onderweg was.
 *
 * Nagelopen tegen een echte worker met een post die het niet deed:
 *
 *   zonder de opruiming  poging 1 → 500, poging 2 → 200 {"goed":true}
 *   met de opruiming     poging 1 → 500, poging 2 → 500
 *
 * `vergeetLink` is apart getest in `server/src/inloglink.test.ts`. Wat hier
 * wordt bewaakt is dat hij ook wordt aangeroepen, en op de juiste plek.
 */
describe('de inloglink van het portaal', () => {
  const index = readFileSync(new URL('../../server/src/index.ts', import.meta.url), 'utf8')

  it('wordt opgeruimd als het versturen omvalt', () => {
    const start = index.indexOf('async function portaalAanmelden(')
    expect(start, 'portaalAanmelden() niet gevonden').toBeGreaterThan(-1)
    const eind = index.indexOf('\nasync function ', start + 10)
    const lichaam = index.slice(start, eind === -1 ? undefined : eind)

    // Het versturen staat in een try, en de catch ruimt de link op.
    expect(lichaam, 'het versturen staat niet in een try').toMatch(/try \{[\s\S]*await verstuur\(/)
    expect(lichaam, 'de catch ruimt de link niet op').toMatch(/catch[\s\S]*vergeetLink\(env\.DB, token\)/)
    // En hij geeft de fout door: stil opruimen zou een 200 opleveren, en dan
    // is de melding "kijk in je mail" nog steeds niet waar.
    expect(lichaam, 'de fout wordt niet doorgegeven').toMatch(/vergeetLink\(env\.DB, token\)\s*\n\s*throw /)
  })

  it('maakt onderscheid tussen een weigering en een tijdslimiet', () => {
    // Hier stond eerst: opruimen bij elke fout, en tellen alleen na de try.
    // Allebei te grof.
    //
    // Een tijdslimiet zegt niet dat er niets gebeurd is, alleen dat we het
    // antwoord niet kregen. Brevo kan de mail hebben aangenomen. De link dan
    // weggooien maakt een bezorgde mail onbruikbaar — de ouder tikt op de knop
    // en krijgt "werkt niet meer" terwijl hij precies deed wat er stond. En
    // niet meetellen voor de rem betekent dat een trage postdienst niemand
    // meer remt, terwijl er wél post uitgaat.
    //
    // Bij een weigering van Brevo staat wél vast dat er niets uitging, en dan
    // hoort de rij weg.
    const start = index.indexOf('async function portaalAanmelden(')
    const lichaam = index.slice(start, index.indexOf('\nasync function ', start + 10))

    expect(lichaam, 'het onderscheid tussen zeker en onzeker is weg')
      .toMatch(/if \(fout instanceof PostOnzeker\) await telMail\(env\.DB, plek\)\s*\n\s*else await vergeetLink\(env\.DB, token\)/)

    // En het geslaagde pad telt nog steeds, ná de try.
    const catchEind = lichaam.indexOf('}', lichaam.indexOf('throw fout'))
    expect(lichaam.indexOf('telMail(env.DB, plek)', catchEind),
      'na een geslaagde verzending wordt niet meer geteld').toBeGreaterThan(catchEind)
  })

  it('kent PostOnzeker alleen toe aan een tijdslimiet, niet aan een weigering', () => {
    const mail = readFileSync(new URL('../../server/src/mail.ts', import.meta.url), 'utf8')
    // De afgebroken verbinding wordt een PostOnzeker ...
    expect(mail).toMatch(/TimeoutError' \|\| naam === 'AbortError'\) \{\s*\n\s*throw new PostOnzeker\(/)
    // ... en een foutcode van Brevo een gewone fout, want die is wel zeker.
    expect(mail).toMatch(/if \(!antwoord\.ok\) \{\s*\n\s*throw new Error\(/)
  })
})

/**
 * En de vierde link, die we bij de vorige ronde hebben overgeslagen.
 *
 * `/bevestig`, `/uitschrijven` en `/wissen` gingen achter een POST omdat een
 * prefetch een schrijfopdracht was. `/portaal/binnen` bleef staan, en dat is de
 * duurste van de vier: `wisselIn` zet `gebruikt_op`, dus de ophaling ván de
 * scanner is de inlog. De koper klikt daarna zelf en krijgt `?fout=link` — en
 * een nieuwe link vragen helpt niet, want die brandt net zo op.
 *
 * Deze bladzijde gaat één stap verder dan de andere drie: de GET doet ook geen
 * leesvraag. Geen query betekent geen spoor en geen orakel — de knop staat er
 * ook bij een token dat niet bestaat, dus je kunt hier niet navragen welke
 * tokens geldig zijn.
 */
describe('de inloglink naar het portaal', () => {
  const index = readFileSync(new URL('../../server/src/index.ts', import.meta.url), 'utf8')

  const lichaamVan = (naam: string) => {
    const start = index.indexOf(`async function ${naam}(`)
    expect(start, `${naam}() niet gevonden`).toBeGreaterThan(-1)
    const eind = index.indexOf('\nasync function ', start + 10)
    return index.slice(start, eind === -1 ? undefined : eind)
  }

  it('geeft de methode door aan de afhandeling', () => {
    expect(index, '/portaal/binnen kijkt niet naar de methode').toContain(
      "if (url.pathname === '/portaal/binnen') return metAdres(await portaalBinnen(url, env, verzoek.method === 'POST'))",
    )
  })

  it('wisselt het token pas in bij een POST', () => {
    const lichaam = lichaamVan('portaalBinnen')
    const vraag = lichaam.indexOf('if (!doen)')
    const wissel = lichaam.indexOf('wisselIn(')
    expect(vraag, 'portaalBinnen() vraagt niet eerst').toBeGreaterThan(-1)
    expect(wissel, 'portaalBinnen() wisselt niets meer in?').toBeGreaterThan(-1)
    expect(vraag, 'portaalBinnen() wisselt in vóórdat hij vraagt').toBeLessThan(wissel)
  })

  it('raakt de database niet aan bij een GET', () => {
    // Het stuk tussen `if (!doen)` en de `return` erna. Staat daar een `env.DB`,
    // dan is de bladzijde weer een orakel: dan verschilt het antwoord tussen
    // een geldig en een onbekend token, en dan laat een scanner weer een spoor
    // achter in de logs van de database.
    const lichaam = lichaamVan('portaalBinnen')
    const start = lichaam.indexOf('if (!doen)')
    const eind = lichaam.indexOf('\n  }', start)
    expect(eind, 'de tak voor een GET is niet te vinden').toBeGreaterThan(start)
    const tak = lichaam.slice(start, eind)
    expect(tak, 'de GET stelt een databasevraag').not.toContain('env.DB')
    expect(tak, 'de GET wacht op iets').not.toContain('await')
    expect(tak).toContain('vraagPagina(')
  })

  it('post terug naar hetzelfde pad, zodat oude mails blijven werken', () => {
    const lichaam = lichaamVan('portaalBinnen')
    expect(lichaam).toContain('`/portaal/binnen?t=${encodeURIComponent(token)}')
    // En de mail wijst naar datzelfde pad.
    expect(index).toContain('`${env.BASIS}/portaal/binnen?t=${token}')
  })

  it('werkt ook zonder de taalparameter, want die zit niet in oude mails', () => {
    const lichaam = lichaamVan('portaalBinnen')
    // Geen taal in de URL mag geen lege bladzijde geven: er hoort een terugval
    // te staan, en de waarde moet langs isTaal() zodat er geen onzin in het
    // lang-attribuut belandt.
    expect(lichaam).toMatch(/isTaal\(l\) \? l : 'nl'/)
    expect(lichaam).toMatch(/INLOGMAIL\[taal\] \?\? INLOGMAIL\.nl!/)
  })

  it('heeft in elke taal een tekst voor die tussenbladzijde', () => {
    for (const veld of ['vraagKop', 'vraagBody', 'vraagKnop']) {
      // Eén keer in het type en één keer per taal.
      const keer = index.split(`${veld}:`).length - 1
      expect(keer, `${veld} staat ${keer}× in index.ts`).toBe(7)
    }
    // En geen lege: een knop zonder opschrift is een knop die niemand vindt.
    const blok = index.slice(index.indexOf('const INLOGMAIL'), index.indexOf('\n}\n', index.indexOf('const INLOGMAIL')))
    expect(blok).not.toMatch(/vraag[A-Za-z]+: ''/)
  })
})

/**
 * En wie er post krijgt van het portaal.
 *
 * Het lézen was al dicht: `blad()` toetst `mag.reeksen.includes(reeks)` op élke
 * bladzijde, dus zonder bestelling is het overal een 403. Maar de inlogmail ging
 * naar elk adres dat iemand in het formulier typte, met een knop "Naar mijn
 * boeken" erin. Voor de ontvanger onbegrijpelijk, en voor een vreemde een
 * manier om post te versturen onder onze naam.
 *
 * Nagelopen tegen een draaiende worker met één koper en één terugbetaalde koper
 * in de database, met de post geblokkeerd door het netwerkbeleid hier:
 *
 *   koper@example.com     500 "ging-mis"  → kwam tot de postdienst
 *   vreemde@example.com   200 {goed:true} → geen lid-rij, geen link, geen post
 *   terug@example.com     200 {goed:true} → een terugbetaling sluit de deur
 *   Koper@Example.COM     500 "ging-mis"  → netjes() vangt hoofdletters op
 *
 * Twee dingen moeten samen blijven kloppen, anders is het geen poort maar een
 * vertraging: er mag geen post uit vóór de toets, en het antwoord mag niet
 * verschillen — anders is dit formulier een manier om na te vragen wie hier
 * gekocht heeft.
 */
describe('de poort van het portaal', () => {
  const index = readFileSync(new URL('../../server/src/index.ts', import.meta.url), 'utf8')
  const start = index.indexOf('async function portaalAanmelden(')
  const lichaam = index.slice(start, index.indexOf('\nasync function ', start + 10))

  it('kijkt naar de bestelling vóórdat er een link of een mail komt', () => {
    const toets = lichaam.indexOf('bezit(env.DB, email)')
    expect(toets, 'portaalAanmelden() kijkt niet meer naar een bestelling').toBeGreaterThan(-1)
    for (const daad of ['schrijfIn(', 'maakLink(', 'verstuur(']) {
      const waar = lichaam.indexOf(daad)
      expect(waar, `${daad} staat er niet meer`).toBeGreaterThan(-1)
      expect(toets, `${daad} staat vóór de toets op een bestelling`).toBeLessThan(waar)
    }
  })

  it('stopt bij geen bestelling, met hetzelfde antwoord als anders', () => {
    // `{ goed: true }` en geen foutcode: een afwijkend antwoord maakt dit
    // formulier een manier om adressen af te lopen.
    expect(lichaam).toMatch(/if \(!gekocht\.reeksen\.length\) return portaalJson\(env, \{ goed: true \}\)/)
  })

  it('vraagt de vinkjes aan iedereen, niet alleen aan een onbekend adres', () => {
    // Hier stond `!bestaat && !(...)`. Dan verschilde het antwoord op een
    // inzending zonder vinkjes tussen een bekend en een onbekend adres, en dat
    // is met de poort erbij precies de vraag die niemand mag kunnen stellen.
    expect(lichaam, 'de vinkjescontrole hangt weer aan een bestaand lid')
      .not.toMatch(/if \(!\w+ && !\(body\.voorwaarden/)
    expect(lichaam).toMatch(/if \(!\(body\.voorwaarden && body\.leeftijd\)\) return portaalJson\(env, \{ fout: 'vinkjes' \}, 400\)/)
  })
})

/**
 * Het recht om vergeten te worden, en de vier gaten die erin zaten.
 *
 * De wisknop is deze week gebouwd en gaat nu pas live, dus dit is het moment.
 * Nagelopen tegen een draaiende worker met een koper die in álle drie de
 * tafels stond — een bestelling, een portaalaccount en een nieuwsbrief:
 *
 *   wissen zonder sessie   401, er verandert niets
 *   wissen met sessie      gewist_op gezet, nieuws 0, ip_hash leeg,
 *                          aanmelding en voortgang weg, alle sessies weg,
 *                          de bestelling onaangeroerd
 *   daarna een vreemde     200 {goed:true}, gewist_op blijft, nul inloglinks,
 *   met datzelfde adres    nul pogingen naar de postdienst
 *   nieuwsbrieflijst       nul rijen
 */
describe('het wissen van een portaalaccount', () => {
  const index = readFileSync(new URL('../../server/src/index.ts', import.meta.url), 'utf8')
  const portaal = readFileSync(new URL('../../server/src/portaal.ts', import.meta.url), 'utf8')

  /**
   * Zonder het commentaar.
   *
   * Deze twee toetsen kijken of iets er níet staat, en dan is een toelichting
   * die de oude fout beschrijft genoeg om ze te laten omvallen. Dat gebeurde
   * hier ook meteen: de uitleg bij `schrijfIn` noemt `gewist_op = NULL` en die
   * bij `wisLid` het woord bestelling, allebei juist om te zeggen dat het daar
   * niet meer hoort.
   */
  const zonderUitleg = (tekst: string) =>
    tekst.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, '')

  it('is niet terug te draaien door een vreemde die het adres intypt', () => {
    // `schrijfIn` zette `gewist_op = NULL` bij elk bestaand lid. Typ het adres
    // van een gewist persoon in het formulier en zijn rij leefde weer op — met
    // het nieuwsvinkje erbij zelfs terug op de lijst, want `wisLid` raakt
    // `laatste_bezoek` niet aan en die geldt daar als bewijs.
    const start = portaal.indexOf('export async function schrijfIn(')
    const lichaam = portaal.slice(start, portaal.indexOf('\nexport ', start + 10))
    expect(zonderUitleg(lichaam), 'schrijfIn zet gewist_op weer op NULL').not.toMatch(/gewist_op\s*=\s*NULL/i)
  })

  it('stuurt geen post meer naar wie gewist wil worden', () => {
    const start = index.indexOf('async function portaalAanmelden(')
    const lichaam = index.slice(start, index.indexOf('\nasync function ', start + 10))
    const toets = lichaam.search(/bestaand\?\.gewist_op/)
    expect(toets, 'er wordt niet op gewist_op gekeken').toBeGreaterThan(-1)
    // En vóór de mailstap, anders is het geen controle maar een opmerking.
    expect(toets, 'de controle staat ná het versturen').toBeLessThan(lichaam.indexOf('verstuur('))
    // Met hetzelfde antwoord als anders.
    expect(lichaam).toMatch(/if \(bestaand\?\.gewist_op\) return portaalJson\(env, \{ goed: true \}\)/)
  })

  it('neemt ook de aanmelding voor de nieuwsbrief mee', () => {
    // Twee tafels: `lid` is het portaal, `aanmelding` de nieuwsbrief van de
    // site. De weekmail leest uit de tweede, dus wie in allebei stond kreeg na
    // "je gegevens zijn gewist" gewoon post.
    const start = portaal.indexOf('export async function wisLid(')
    const lichaam = portaal.slice(start, portaal.indexOf('\nexport ', start + 10))
    expect(lichaam).toContain('DELETE FROM voortgang WHERE id = ?')
    expect(lichaam).toContain('DELETE FROM aanmelding WHERE id = ?')
    expect(lichaam).toContain('SELECT id FROM aanmelding WHERE email = ?')
    // En nog steeds niet aan de bestellingen. Die horen bij een koop, niet bij
    // een account, en de koper houdt zijn boeken.
    expect(zonderUitleg(lichaam), 'wisLid komt aan de bestellingen').not.toMatch(/bestelling/i)
  })

  it('zegt niet "gewist" tegen iemand die niet binnen is', () => {
    // Hier stond `{ goed: true }` ook zonder sessie, met de reden die bij de
    // maillinks hoort: een afwijkend antwoord verklapt welke adressen bestaan.
    // Maar dit gaat op een koekje, dus een 401 verklapt niets — en zonder die
    // 401 las je "je gegevens zijn gewist" terwijl je sessie net verlopen was.
    const start = index.indexOf('async function portaalWissen(')
    const lichaam = index.slice(start, index.indexOf('\nasync function ', start + 10))
    expect(lichaam).toMatch(/if \(!lid\) return portaalJson\(env, \{ fout: 'niet-binnen' \}, 401\)/)
  })

  it('laat de knop op de site pas juichen als het antwoord goed is', () => {
    const site = readFileSync(new URL('../../scripts/make-site.mjs', import.meta.url), 'utf8')
    const start = site.indexOf("el('wis').addEventListener")
    expect(start, 'de wisknop is weg').toBeGreaterThan(-1)
    const lichaam = site.slice(start, site.indexOf('})', site.indexOf('location.reload()', start)))
    // `if (!antwoord)` alleen is waar zodra er geldige JSON terugkomt — ook bij
    // een 401. Dan las je "gewist" terwijl er niets gebeurd was.
    expect(lichaam).toContain('!antwoord || !antwoord.goed')
  })
})

/**
 * Belooft de wisknop wat hij werkelijk doet?
 *
 * Hier stond in alle zes de talen: "Dit haalt je e-mailadres en je aanmelding
 * weg." De aanmelding klopt — `wisLid` verwijdert die rij en de voortgang. Het
 * adres niet: dat blijft in `lid` staan.
 *
 * En het moet blijven staan. Haal je het weg, dan vindt `lidVanEmail` de rij
 * niet meer, valt de controle op `gewist_op` in `portaalAanmelden` weg, en
 * laat de poort de gewiste koper door — want zijn bestelling staat er nog.
 * Dan gaat er weer post naar iemand die gevraagd heeft vergeten te worden, en
 * is de wis opnieuw door een vreemde ongedaan te maken. Het adres ís de
 * bescherming; weghalen maakt het erger, niet beter.
 *
 * De tekst was dus fout, niet de code. Deze toets houdt die twee bij elkaar:
 * zolang `wisLid` het adres laat staan, mag geen enkele taal beweren dat het
 * weggaat.
 */
describe('wat de wisknop belooft', () => {
  const portaal = readFileSync(new URL('../../server/src/portaal.ts', import.meta.url), 'utf8')
  const copy = readFileSync(new URL('./copy.ts', import.meta.url), 'utf8')

  const wisLichaam = () => {
    const start = portaal.indexOf('export async function wisLid(')
    return portaal.slice(start, portaal.indexOf('\nexport ', start + 10))
  }

  it('laat het adres staan, want dat is wat de gewiste persoon beschermt', () => {
    const lichaam = wisLichaam()
    // Geen UPDATE die email leegmaakt, en geen DELETE van de lid-rij.
    expect(lichaam, 'wisLid haalt het adres weg; lees de toelichting hierboven')
      .not.toMatch(/UPDATE lid SET[^`]*\bemail\s*=/)
    expect(lichaam, 'wisLid verwijdert de lid-rij; dan is de blokkade weg')
      .not.toMatch(/DELETE FROM lid\b/)
  })

  it('zegt in geen enkele taal dat het adres weggaat', () => {
    const teksten = [...copy.matchAll(/wisUitleg: '([^']*)'/g)].map((m) => m[1]!)
    expect(teksten.length, 'de uitleg bij de wisknop is niet in zes talen gevonden').toBe(6)

    // Per taal het woord voor e-mail, en de werkwoorden waarmee je belooft dat
    // iets weggaat. Staan die twee in één zin, dan belooft de tekst te veel.
    const adres = /e-?mail|correo|indirizzo|adres|adresse/i
    const weg = /haalt[^.]*weg|verwijder|supprime|entfernt|elimina|rimuove|removes/i
    for (const t of teksten) {
      for (const zin of t.split(/(?<=\.)\s+/)) {
        const belooft = adres.test(zin) && weg.test(zin)
        expect(belooft, `deze zin belooft dat het adres weggaat: ${zin}`).toBe(false)
      }
    }
  })

  it('zegt wél waarom het adres blijft', () => {
    // Anders is het stilte over precies het punt dat iemand wil weten.
    const teksten = [...copy.matchAll(/wisUitleg: '([^']*)'/g)].map((m) => m[1]!)
    const noemt = /aantekening|trace|Vermerk|constancia|nota|note/i
    for (const t of teksten) {
      expect(noemt.test(t), `deze uitleg legt niet uit waarom het adres blijft: ${t.slice(0, 70)}`).toBe(true)
    }
  })
})
