import { describe, expect, it } from 'vitest'
import { briefHtml, briefTekst } from './sjabloon'
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
})
