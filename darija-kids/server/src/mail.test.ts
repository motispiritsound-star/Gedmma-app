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
import { TIJDSLIMIET, verstuur } from './mail'

const brief = {
  aan: 'koper@ergens.nl',
  onderwerp: 'Je boeken',
  html: '<p>hallo</p>',
  tekst: 'hallo',
}
const afzender = { naam: 'Darijaforkids', email: 'info@darijaforkids.eu' }

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

/**
 * Hier zat een gat dat geen fout was: er stond geen tijdslimiet op de
 * verbinding met de postdienst. `naDeVerkoop()` vangt een omgevallen mail op,
 * maar een verbinding die blijft hangen gooit niets — hij wacht. Dus vangt
 * niemand hem, staat er niets in het logboek, en wacht de Gumroad-ping mee.
 *
 * En bij deze producten ís de mail de levering: er gaat geen PDF de deur uit,
 * de koper krijgt een sleutel.
 */
describe('de tijdslimiet', () => {
  it('hangt een tijdslimiet aan elke verbinding', async () => {
    let signaal: AbortSignal | undefined
    vi.stubGlobal('fetch', async (_url: string, opties: { signal?: AbortSignal }) => {
      signaal = opties.signal
      return new Response('{}', { status: 201 })
    })
    await verstuur({ ...brief, afmeldUrl: '' }, afzender, 'sleutel', 'https://mail.test/')

    // Niet "er staat iets in het veld", maar: het is een signaal dat vanzelf
    // afgaat. Een AbortSignal dat nooit afgaat is precies het gat van hiervoor.
    expect(signaal).toBeInstanceOf(AbortSignal)
    expect(signaal!.aborted).toBe(false)
    expect(TIJDSLIMIET).toBeGreaterThan(0)
    expect(TIJDSLIMIET).toBeLessThanOrEqual(30_000)
  })

  it('maakt van een afgebroken verbinding een leesbare fout', async () => {
    // Zoals de runtime hem geeft: de naam zegt wat er gebeurde, de melding niet.
    for (const naam of ['TimeoutError', 'AbortError']) {
      vi.stubGlobal('fetch', () =>
        Promise.reject(Object.assign(new Error('The operation was aborted'), { name: naam })))

      await expect(verstuur({ ...brief, afmeldUrl: '' }, afzender, 'sleutel', 'https://mail.test/'))
        .rejects.toThrow(/geen antwoord van de postdienst binnen 10 seconden/)
    }
  })

  it('laat een echte fout van de postdienst staan zoals hij is', async () => {
    // Alleen een afbreking wordt hertaald. Een 401 moet zijn eigen tekst
    // houden: die zei "Key not found", en dat was precies de aanwijzing.
    vi.stubGlobal('fetch', async () => new Response('{"message":"Key not found"}', { status: 401 }))
    await expect(verstuur({ ...brief, afmeldUrl: '' }, afzender, 'sleutel', 'https://mail.test/'))
      .rejects.toThrow(/mail 401.*Key not found/)
  })
})
