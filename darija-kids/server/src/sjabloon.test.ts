import { describe, expect, it } from 'vitest'
import { briefHtml, briefTekst, pagina, vraagPagina } from './sjabloon'
import { MAILS } from './mails'

/**
 * Hoe een mail eruitziet als hij aankomt.
 *
 * Hier stond niets op, en dat was te zien: de mail na het afrekenen kwam aan
 * als één blok van zes regels. De tekst heeft drie alinea's, met lege regels
 * ertussen, en in HTML vallen die weg. De zin die ertoe doet — "deze link is
 * je sleutel, bewaar deze mail" — stond midden in dat blok.
 */
const basis = {
  kop: 'Je boeken staan klaar',
  body: 'Eerste alinea.\n\nTweede alinea.\n\nDerde alinea.',
  knop: { tekst: 'Open je boeken', url: 'https://darijaforkids.eu/lezen#abc' },
  staart: 'Lukt er iets niet, antwoord dan op deze mail.',
  voet: 'Darijaforkids',
}
/** De html uit een Response; beide bladzijden geven er een terug. */
const tekst = (r: Response): Promise<string> => r.text()

/** De html van zo'n bladzijde; `pagina` geeft een Response terug. */
const paginaHtml = (taal: string, site?: string): Promise<string> =>
  pagina(taal, 'Kop', 'Body', site, site ? 'Terug' : undefined).text()

const koop = { ...basis, afmeldTekst: '', afmeldUrl: '', wisTekst: '', wisUrl: '' }
const nieuws = {
  ...basis,
  afmeldTekst: MAILS.nl.afmelden, afmeldUrl: 'https://post.darijaforkids.eu/af?t=x',
  wisTekst: MAILS.nl.wissen, wisUrl: 'https://post.darijaforkids.eu/wis?t=x',
}

describe('de opmaak van een mail', () => {
  it('maakt van elke lege regel een alinea', () => {
    const html = briefHtml(koop)
    expect(html.match(/<p style="margin:0 0 14px">/g)).toHaveLength(3)
    expect(html).toContain('>Eerste alinea.<')
    expect(html).toContain('>Derde alinea.<')
    // En geen losse regeleindes meer die nergens op uitkomen.
    expect(html).not.toContain('Eerste alinea.\n')
  })

  it('maakt van één regeleinde een regelafbreking', () => {
    expect(briefHtml({ ...koop, body: 'Een regel.\nDe volgende.' }))
      .toContain('Een regel.<br>De volgende.')
  })

  it('laat tekst uit de mail zelf geen opmaak worden', () => {
    // Eerst ontsnappen, dan pas opdelen.
    const html = briefHtml({ ...koop, body: 'Een <b>vette</b> poging.' })
    expect(html).toContain('&lt;b&gt;')
    expect(html).not.toContain('<b>vette</b>')
  })

  it('zet geen uitschrijfregel onder een mail waar je je niet voor aanmeldde', () => {
    // De mail na het afrekenen is geen nieuwsbrief. Die velden kwamen leeg
    // binnen, en dan stond er een kale · met twee links zonder tekst eronder.
    const html = briefHtml(koop)
    expect(html).not.toContain('&middot;')
    expect(html).not.toContain('href=""')
  })

  it('maar wel onder een mail waar je je wél voor aanmeldde', () => {
    const html = briefHtml(nieuws)
    expect(html).toContain(MAILS.nl.afmelden)
    expect(html).toContain(MAILS.nl.wissen)
    expect(html).toContain('&middot;')
  })

  it('laat de platte tekst met rust', () => {
    // Die wordt getoond door wie geen HTML aanneemt, en daar is \n\n juist goed.
    expect(briefTekst(koop)).toContain('Eerste alinea.\n\nTweede alinea.')
  })

  it('zet er ook in platte tekst een witregel tussen', () => {
    // `briefTekst` bouwt een lijst regels, met lege tekenreeksen op de plekken
    // waar een witregel hoort: onder de kop, en boven de streep van de voet.
    // Daar stond `.filter((l) => l !== '')` achter, bedoeld om de onderdelen te
    // laten vallen die er niet zijn — maar die kan het verschil niet zien
    // tussen "leeg omdat hij er niet is" en "leeg omdat hier een witregel
    // hoort". In elke mail plakte de kop dus aan de tekst en de streep aan de
    // laatste regel. Gezien in een echte weekmail.
    const t = briefTekst(nieuws)
    const regels = t.split('\n')
    expect(regels[0], 'de kop staat niet bovenaan').toBe(nieuws.kop)
    expect(regels[1], 'de kop plakt aan de tekst eronder').toBe('')
    const streep = regels.indexOf('—')
    expect(streep, 'de streep van de voet is weg').toBeGreaterThan(0)
    expect(regels[streep - 1], 'de streep plakt aan de regel erboven').toBe('')
  })

  it('zet geen lege verwijzing onder een mail zonder afmeldlink', () => {
    // De tegenhanger van de HTML-toets hierboven. Een koopmail geeft die vier
    // velden leeg mee, en onvoorwaardelijk gebouwd stond er `": "` onder.
    const t = briefTekst(koop)
    for (const r of t.split('\n')) {
      expect(r.trim(), `losse regel in de platte tekst: ${JSON.stringify(r)}`).not.toBe(':')
    }
    expect(t.trimEnd(), 'de mail eindigt op een lege verwijzing').not.toMatch(/:\s*$/)
  })
})

/**
 * De bladzijden die na een tik in een mail verschijnen.
 *
 * Er stond geen enkele link op. Wie net zijn adres had bevestigd stond op een
 * leeg vlak op post.darijaforkids.eu, met geen menu en geen weg terug — en het
 * enige wat hij op dat moment wil is naar de site.
 *
 * En de tekst zei het tegendeel van wat er gebeurd was: als kop het woord van
 * de link ("Uitschrijven", een werkwoord) en als body de voetregel van een
 * mail ("je krijgt deze mail omdat je je hebt aangemeld").
 */
describe('een bladzijde van de worker', () => {
  const TALEN = ['nl', 'fr', 'de', 'es', 'it', 'en'] as const

  it('wijst terug naar de website, in de goede taal', async () => {
    const site = 'https://darijaforkids.eu'
    expect(pagina('nl', 'k', 'b', site, 'terug').headers.get('content-type')).toContain('text/html')
    for (const taal of TALEN) {
      const html = await paginaHtml(taal, site)
      const verwacht = taal === 'nl' ? site : `${site}/${taal}`
      expect(html, taal).toContain(`href="${verwacht}"`)
    }
  })

  it('doet het ook zonder, en zet dan geen lege knop neer', async () => {
    expect(await paginaHtml('nl')).not.toContain('<a href')
  })

  it.each(TALEN)('zegt in het %s wat er gebeurd is, niet wat de link heette', (taal) => {
    const m = MAILS[taal]
    // De kop is een mededeling, geen werkwoord uit een linktekst.
    expect(m.afgemeldKop).not.toBe(m.afmelden)
    expect(m.gewistKop).not.toBe(m.wissen)
    // En de body is niet de voetregel van een mail.
    expect(m.afgemeldBody).not.toBe(m.voet)
    expect(m.gewistBody).not.toBe(m.voet)
  })
})

/**
 * En de bladzijde die eerst vraagt.
 *
 * `/wissen`, `/uitschrijven` en `/bevestig` deden hun werk op een GET, met een
 * token uit een mail. Daar was geen aanvaller voor nodig: mailclients en
 * virusscanners halen links in een bericht vooruit op om ze te controleren —
 * Outlook Safe Links, de scanner van een bedrijf, het linkvoorbeeld van Slack.
 * Zo'n prefetch is een gewone GET, en een GET was hier een verwijdering.
 *
 * Wat hieronder vastligt is niet hoe de bladzijde eruitziet, maar het ene ding
 * dat hem veilig maakt: er staat een formulier op dat POST.
 */

describe('de vraagbladzijde', () => {
  it('zet een formulier neer dat POST, niet een link die je kunt volgen', async () => {
    const html = await tekst(vraagPagina('nl', 'Je gegevens wissen?', 'Dit kunnen we niet terugdraaien.',
      'Mijn gegevens wissen', '/wissen?t=abc123'))

    expect(html).toContain('method="post"')
    expect(html).toContain('action="/wissen?t=abc123"')
    expect(html).toContain('<button type="submit"')
    // Geen anker naar de handeling: dat is precies wat een scanner zou volgen.
    expect(html).not.toMatch(/<a [^>]*href="\/wissen/)
  })

  it('zet de woorden erop die de lezer verwacht', async () => {
    const html = await tekst(vraagPagina('nl', 'Uitschrijven?', 'Dan halen we dit adres van de lijst.',
      'Uitschrijven', '/uitschrijven?t=x'))
    expect(html).toContain('Uitschrijven?')
    expect(html).toContain('Dan halen we dit adres van de lijst.')
    expect(html).toContain('>Uitschrijven</button>')
    expect(html).toContain('<html lang="nl"')
  })

  it('laat geen opmaak door, ook niet uit de taal of het adres', async () => {
    const html = await tekst(vraagPagina(
      '"><script>x()</script>',
      'Kop <b>vet</b>',
      'Body & "aanhalingstekens"',
      'Knop <i>schuin</i>',
      '/wissen?t="><script>y()</script>',
    ))
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<b>vet</b>')
    expect(html).toContain('&lt;b&gt;vet&lt;/b&gt;')
    expect(html).toContain('&amp;')
    // Het attribuut mag niet vroegtijdig gesloten kunnen worden.
    expect(html).toContain('&quot;')
  })

  it('antwoordt als html, zodat de knop ook echt een knop is', async () => {
    const r = vraagPagina('en', 'k', 'b', 'doe', '/x')
    expect(r.headers.get('content-type')).toBe('text/html; charset=utf-8')
    expect(r.status).toBe(200)
  })
})
