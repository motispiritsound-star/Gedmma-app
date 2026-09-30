import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { EBOOK, PRODUCTS } from '../engine/billing'

/**
 * De promotieafbeeldingen van de aankopen, tegen Apples eigen eisen.
 *
 * Apple wees versie 1.0 (build 5) hierop af. Bij alle drie de aankopen stond
 * het app-icoon in het veld "Image (Optional)" — dus niet uniek, en precies
 * het ene beeld dat er niet mag staan. Hun tekst:
 *
 *   "Each promoted in-app purchase requires a unique promotional image.
 *    Promotional images should not be screenshots, and should not be confused
 *    with your app icon. [...] PNG or high-quality JPEG at 1024 x 1024 pixels."
 *
 * Gemaakt met `npm run iapbeeld`. Deze test is de reden dat je dat niet
 * vergeet: hij valt zodra er een aankoop bij komt zonder eigen beeld.
 */

const MAP = path.resolve(__dirname, '../../store/iap-beelden')
const AANKOPEN = [...PRODUCTS, EBOOK.product]
const bestand = (id: string) => path.join(MAP, `${id}.png`)

/** De maat uit de IHDR-brok van een PNG, zonder er een pakket bij te halen. */
const maatVan = (pad: string) => {
  const bytes = readFileSync(pad)
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  return {
    isPng: bytes.subarray(0, 8).equals(png),
    breed: bytes.readUInt32BE(16),
    hoog: bytes.readUInt32BE(20),
  }
}

describe('de promotieafbeeldingen van de aankopen', () => {
  it('er is er één per aankoop, en niet één meer of minder', () => {
    const missen = AANKOPEN.filter((id) => !existsSync(bestand(id)))
    expect(missen.join(', '), 'draai `npm run iapbeeld`').toBe('')
  })

  it.each(AANKOPEN)('%s is een PNG van 1024×1024', (id) => {
    const { isPng, breed, hoog } = maatVan(bestand(id))
    expect(isPng, `${id} is geen PNG`).toBe(true)
    expect(`${breed}×${hoog}`, `${id} heeft de verkeerde maat`).toBe('1024×1024')
  })

  it('de drie zijn niet hetzelfde beeld', () => {
    // "a unique promotional image" — drie keer dezelfde plaat is geen drie.
    const inhoud = AANKOPEN.map((id) => readFileSync(bestand(id)).toString('base64'))
    expect(new Set(inhoud).size, 'twee aankopen delen hetzelfde beeld').toBe(AANKOPEN.length)
  })

  it('geen van de drie is een schermafdruk uit de oude map', () => {
    const oud = path.resolve(__dirname, '../../store/iap-schermen')
    if (!existsSync(oud)) return
    for (const id of AANKOPEN) {
      const { breed, hoog } = maatVan(bestand(id))
      expect(`${breed}×${hoog}`, `${id} heeft de maat van een schermafdruk`).not.toBe('1290×2796')
    }
  })
})
