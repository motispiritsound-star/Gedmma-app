import { describe, expect, it } from 'vitest'
import { STRINGS } from '../i18n'
import type { Lang } from '../i18n/languages'

// Apple wees de app af op 2.3.10: "The app or metadata includes information
// about third-party platforms". Het koopscherm is metadata die de reviewer
// ziet, dus daar mag op iOS geen Google Play staan — en op Android geen App
// Store. Sinds dat gerepareerd is loopt de winkelnaam via winkelVan(), en
// niets anders houdt tegen dat iemand de naam weer vast in de zin typt.

const codes = Object.keys(STRINGS) as Lang[]

// Precies de teksten die vóór het kopen op het scherm staan.
const zinnen = (taal: Lang, winkel: string) => {
  const u = STRINGS[taal].unlock
  return [
    u.voorwaardenJaar(3, '€ 59,99', winkel),
    u.voorwaarden(3, '€ 6,99', winkel),
    u.beheerHint(winkel),
  ]
}

describe('de winkelnaam in het koopscherm', () => {
  it.each(codes)('%s noemt op iOS geen Google Play', (taal) => {
    const winkel = STRINGS[taal].unlock.winkelnaam.ios
    for (const zin of zinnen(taal, winkel)) {
      expect(zin, `${taal}: iOS-koopscherm noemt Google Play`).not.toMatch(/Google Play/i)
    }
  })

  it.each(codes)('%s noemt op Android geen App Store', (taal) => {
    const winkel = STRINGS[taal].unlock.winkelnaam.android
    for (const zin of zinnen(taal, winkel)) {
      expect(zin, `${taal}: Android-koopscherm noemt de App Store`).not.toMatch(/App Store/i)
    }
  })

  it.each(codes)('%s zet de naam er echt in, niet vast in de zin', (taal) => {
    const u = STRINGS[taal].unlock
    const opIos = zinnen(taal, u.winkelnaam.ios)
    const opAndroid = zinnen(taal, u.winkelnaam.android)
    opIos.forEach((zin, i) => {
      expect(zin, `${taal}: zin ${i} verandert niet mee met de winkel`).not.toBe(opAndroid[i])
    })
  })

  it.each(codes)('%s noemt op het web wél beide winkels', (taal) => {
    // Op het web weet je niet waar de klant betaalt, dus daar horen ze er
    // allebei te staan — anders is de tekst onvolledig in plaats van veilig.
    const winkel = STRINGS[taal].unlock.winkelnaam.beide
    expect(winkel, `${taal}: beide noemt de App Store niet`).toMatch(/App Store/i)
    expect(winkel, `${taal}: beide noemt Google Play niet`).toMatch(/Google Play/i)
  })

  it.each(codes)('%s laat geen dubbel voorzetsel of koppelteken achter', (taal) => {
    for (const winkel of Object.values<string>(STRINGS[taal].unlock.winkelnaam)) {
      for (const zin of zinnen(taal, winkel)) {
        // 'bij de App Store' is goed; 'bij bij', 'bei dem' en 'de de' niet.
        expect(zin, `${taal}: dubbel voorzetsel in "${zin}"`).not.toMatch(
          /\b(bij|bei|van|di|de|of)\s+\1\b|\bbei\s+dem\b/i,
        )
        // "Google Play-account" is goed, "App Store of Google Play-account" niet:
        // het koppelteken pakt dan alleen de laatste winkel.
        expect(zin, `${taal}: koppelteken na twee winkels in "${zin}"`).not.toMatch(
          /(?:of|oder|or|ou|o)\s+Google Play[-‑]/i,
        )
      }
    }
  })
})
