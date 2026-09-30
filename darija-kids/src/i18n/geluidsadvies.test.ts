import { describe, expect, it } from 'vitest'
import { STRINGS } from '.'
import { LANGS } from './languages'
import type { Lang } from './languages'

/**
 * Het advies bij geluid dat niet klinkt, per soort toestel.
 *
 * Drie teksten vertelden op elk toestel over "het schuifje aan de zijkant".
 * Dat bestaat op een iPhone en op een iPad, en nergens anders. Een ouder met
 * een Android die de app stil krijgt, werd zo naar een knop gestuurd die zijn
 * toestel niet heeft — terwijl het daar in het mediavolume zit, dat losstaat
 * van het belvolume.
 *
 * `heeftStilteschakelaar()` in engine/store.ts is de voorwaarde. Die bepaalt
 * ook of de mediakanaal-schakelaar getoond wordt: die speelt het geluid via
 * losse bestanden in plaats van de mixer, en dat helpt alleen tegen datzelfde
 * schuifje. Elders levert hij niets op behalve vertraging.
 */

const codes = LANGS.map((l) => l.code) as Lang[]

const adviezen = (lang: Lang, stilte: boolean) => {
  const t = STRINGS[lang]
  return [
    t.learn.geluidUitUitleg(stilte),
    t.settings.mixerStil(stilte),
    t.settings.checkGoed('0.42', stilte),
  ]
}

describe('het advies bij geluid dat niet klinkt', () => {
  it.each(codes)('%s noemt geen Apple-toestel waar dat schuifje niet bestaat', (lang) => {
    for (const zin of adviezen(lang, false)) {
      expect(zin, `${lang}: "${zin.slice(0, 110)}"`).not.toMatch(/iPhone|iPad|\biOS\b|Apple/i)
    }
  })

  it.each(codes)('%s geeft op een iPhone juist wél dat advies', (lang) => {
    // Daar is het schuifje de eerste plek om te kijken, dus het hoort erin.
    const alles = adviezen(lang, true).join(' ')
    expect(alles, `${lang}: het schuifje wordt nergens genoemd`).toMatch(/iPhone/i)
  })

  it.each(codes)('%s zegt op een ander toestel echt iets anders', (lang) => {
    // Niet dezelfde zin met de naam eruit geknipt: het advies zelf verschilt.
    const metSchuifje = adviezen(lang, true)
    const zonder = adviezen(lang, false)
    metSchuifje.forEach((zin, i) => {
      expect(zin, `${lang}: advies ${i} is op beide toestellen hetzelfde`).not.toBe(zonder[i])
    })
  })

  it.each(codes)('%s wijst zonder schuifje naar het mediavolume', (lang) => {
    // Dat is waar het op Android zit, en het is de hele reden van de splitsing.
    const alles = adviezen(lang, false).join(' ')
    expect(alles, `${lang}: het mediavolume wordt nergens genoemd`)
      .toMatch(/mediavolume|volume multimédia|Medienlautstärke|volumen multimedia|volume multimediale|media volume/i)
  })
})
