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

  it('telt de mail pas als hij ook echt weg is', () => {
    const start = index.indexOf('async function portaalAanmelden(')
    const eind = index.indexOf('\nasync function ', start + 10)
    const lichaam = index.slice(start, eind === -1 ? undefined : eind)
    // `telMail` hoort ná de try te staan. Binnen de try zou een omgevallen
    // mail meetellen voor de rem per plek, en dan remt een storing bij de
    // postdienst ook de mensen die niets fout deden.
    const catchEind = lichaam.indexOf('}', lichaam.indexOf('throw fout'))
    expect(lichaam.indexOf('telMail(env.DB, plek)')).toBeGreaterThan(catchEind)
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
