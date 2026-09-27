/**
 * Wat er in de kop van een mail staat, en wanneer juist niet.
 *
 * `List-Unsubscribe` werd altijd meegestuurd, ook als er geen adres was om
 * naartoe te wijzen. Dan stond er `List-Unsubscribe: <>` in de kop van de
 * koopmail — en dat is geen lege regel maar een kapotte, in de enige mail die
 * echt moet aankomen, want daar zit de sleutel van de koper in.
 *
 * En `One-Click` belooft dat een POST naar dat adres de afmelding regelt. De
 * inlogmail liet hem wijzen naar de portaalpagina, waar een POST niets doet:
 * de mailclient zegt "uitgeschreven" en er gebeurt niets.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { verstuur } from './mail'

const brief = {
  aan: 'koper@ergens.nl',
  onderwerp: 'Je boeken',
  html: '<p>hallo</p>',
  tekst: 'hallo',
}
const afzender = { naam: 'Darijaforkids', email: 'post@darijaforkids.eu' }

/** Vangt wat er naar de mailpartner zou gaan. */
function vang() {
  const gezien: { body: Record<string, unknown> }[] = []
  vi.stubGlobal('fetch', async (_url: string, opties: { body: string }) => {
    gezien.push({ body: JSON.parse(opties.body) })
    return new Response('{}', { status: 201 })
  })
  return gezien
}

afterEach(() => vi.unstubAllGlobals())

describe('de afmeldkop', () => {
  it('gaat mee als er een adres is', async () => {
    const gezien = vang()
    await verstuur({ ...brief, afmeldUrl: 'https://darijaforkids.eu/uitschrijven?t=abc' },
      afzender, 'sleutel', 'https://mail.test/')
    const koppen = gezien[0]!.body.headers as Record<string, string>
    expect(koppen['List-Unsubscribe']).toBe('<https://darijaforkids.eu/uitschrijven?t=abc>')
    expect(koppen['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')
  })

  it('blijft helemaal weg als er geen adres is', async () => {
    const gezien = vang()
    await verstuur({ ...brief, afmeldUrl: '' }, afzender, 'sleutel', 'https://mail.test/')
    // Niet leeg meesturen: helemaal niet meesturen.
    expect(gezien[0]!.body.headers).toBeUndefined()
    expect(JSON.stringify(gezien[0]!.body)).not.toContain('List-Unsubscribe')
  })

  it('stuurt nooit een lege haak mee', async () => {
    const gezien = vang()
    for (const url of ['', undefined as unknown as string]) {
      await verstuur({ ...brief, afmeldUrl: url }, afzender, 'sleutel', 'https://mail.test/')
    }
    for (const g of gezien) expect(JSON.stringify(g.body)).not.toContain('<>')
  })
})
