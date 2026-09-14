import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { parse } from 'yaml'

interface Punt {
  nr: number; claim: string; klasse: string
  blokkerend: boolean; status: string; bron?: string
}

describe('bronnencheck van video 001', () => {
  const laden = async () =>
    parse(await readFile('content/video-001/bronnencheck.yaml', 'utf8')) as {
      punten: Punt[]; reviewer: string
    }

  it('heeft precies de zeven punten uit het dossier', async () => {
    const { punten } = await laden()
    expect(punten).toHaveLength(7)
    expect(punten.map((p) => p.nr)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('markeert de twee punten waar de stelling op rust als blokkerend', async () => {
    const { punten } = await laden()
    const blokkerend = punten.filter((p) => p.blokkerend).map((p) => p.nr)
    expect(blokkerend).toEqual([1, 2])
  })

  it('geeft elk punt een claimklasse die de poort kent', async () => {
    const bekend = ['quran', 'hadith', 'fiqh', 'history', 'general']
    const { punten } = await laden()
    for (const p of punten) expect(bekend).toContain(p.klasse)
  })

  it('begint met alles open en zonder bron — niets is vooraf afgevinkt', async () => {
    const { punten } = await laden()
    for (const p of punten) {
      expect(p.status).toBe('open')
      expect(p.bron ?? '').toBe('')
    }
  })

  it('laat de reviewer leeg tot er iemand tekent', async () => {
    expect((await laden()).reviewer).toBe('')
  })
})
