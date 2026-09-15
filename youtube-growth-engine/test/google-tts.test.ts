import { describe, expect, it } from 'vitest'
import { splitZinnen, verdeelTekens } from '../src/providers/google/tts.js'
import { kiesStem } from '../src/providers/registry.js'

describe('splitZinnen', () => {
  it('knipt op zinsgrens en houdt de leestekens', () => {
    expect(splitZinnen('Eén. Twee! Drie?')).toEqual(['Eén.', 'Twee!', 'Drie?'])
  })

  it('laat een zin zonder eindpunt heel', () => {
    expect(splitZinnen('Zonder punt')).toEqual(['Zonder punt'])
  })

  it('gooit lege stukken weg', () => {
    expect(splitZinnen('  Een.   \n\n  Twee.  ')).toEqual(['Een.', 'Twee.'])
  })

  it('geeft niets terug bij lege invoer', () => {
    expect(splitZinnen('   ')).toEqual([])
  })
})

describe('verdeelTekens', () => {
  it('begint op de starttijd en blijft binnen de duur', () => {
    const t = verdeelTekens('abcd', 1000, 400)
    expect(t[0]).toEqual({ char: 'a', atMs: 1000 })
    expect(t.at(-1)?.atMs).toBeLessThan(1400)
    expect(t).toHaveLength(4)
  })

  it('verdeelt gelijkmatig', () => {
    const t = verdeelTekens('abcd', 0, 400)
    expect(t.map((x) => x.atMs)).toEqual([0, 100, 200, 300])
  })

  it('telt een samengesteld teken als één', () => {
    expect(verdeelTekens('é€', 0, 200)).toHaveLength(2)
  })

  it('doet niets bij een lege zin', () => {
    expect(verdeelTekens('', 0, 500)).toEqual([])
  })
})

describe('kiesStem', () => {
  it('herkent een Google-stem aan zijn vorm', () => {
    expect(kiesStem({ TTS_VOICE_ID: 'nl-NL-Chirp3-HD-Aoede' })).toBe('google')
  })

  it('houdt een ElevenLabs-sleutel bij ElevenLabs', () => {
    expect(kiesStem({ TTS_VOICE_ID: '21m00Tcm4TlvDq8ikWAM' })).toBe('elevenlabs')
  })

  it('laat TTS_PROVIDER altijd winnen', () => {
    expect(kiesStem({ TTS_PROVIDER: 'elevenlabs', TTS_VOICE_ID: 'nl-NL-Chirp3-HD-Aoede' }))
      .toBe('elevenlabs')
    expect(kiesStem({ TTS_PROVIDER: 'GOOGLE', TTS_VOICE_ID: 'abc' })).toBe('google')
  })

  it('negeert een onzinnige TTS_PROVIDER en kijkt naar de stem', () => {
    expect(kiesStem({ TTS_PROVIDER: 'azure', TTS_VOICE_ID: 'nl-NL-Chirp3-HD-Aoede' }))
      .toBe('google')
  })

  it('valt terug op elevenlabs als er niets staat', () => {
    expect(kiesStem({})).toBe('elevenlabs')
  })
})
