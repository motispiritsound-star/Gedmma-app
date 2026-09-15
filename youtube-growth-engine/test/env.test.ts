import { describe, expect, it, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { laadEnv } from '../src/lib/env.js'

const gemaakt: string[] = []
function envBestand(inhoud: string): string {
  const map = mkdtempSync(join(tmpdir(), 'env-'))
  gemaakt.push(map)
  const pad = join(map, '.env')
  writeFileSync(pad, inhoud)
  return pad
}

afterEach(() => {
  for (const m of gemaakt.splice(0)) rmSync(m, { recursive: true, force: true })
  for (const naam of Object.keys(process.env)) {
    if (naam.startsWith('TEST_ENV_')) delete process.env[naam]
  }
})

describe('laadEnv', () => {
  it('leest gewone regels en slaat commentaar en lege regels over', () => {
    const pad = envBestand('# kop\n\nTEST_ENV_A=een\nTEST_ENV_B=twee\n')
    expect(laadEnv(pad)).toBe(2)
    expect(process.env['TEST_ENV_A']).toBe('een')
    expect(process.env['TEST_ENV_B']).toBe('twee')
  })

  it('haalt aanhalingstekens weg maar laat de spaties erbinnen staan', () => {
    const pad = envBestand('TEST_ENV_C="met spatie"\nTEST_ENV_D=\'ook zo\'\n')
    laadEnv(pad)
    expect(process.env['TEST_ENV_C']).toBe('met spatie')
    expect(process.env['TEST_ENV_D']).toBe('ook zo')
  })

  it('knipt commentaar achter een waarde weg, maar niet een # in de waarde zelf', () => {
    const pad = envBestand('TEST_ENV_E=waarde   # uitleg\nTEST_ENV_F=abc#def\n')
    laadEnv(pad)
    expect(process.env['TEST_ENV_E']).toBe('waarde')
    expect(process.env['TEST_ENV_F']).toBe('abc#def')
  })

  it('laat een variabele die al gezet is met rust', () => {
    process.env['TEST_ENV_G'] = 'van buiten'
    const pad = envBestand('TEST_ENV_G=uit bestand\n')
    expect(laadEnv(pad)).toBe(0)
    expect(process.env['TEST_ENV_G']).toBe('van buiten')
  })

  it('doet niets en klaagt niet als het bestand niet bestaat', () => {
    expect(laadEnv(join(tmpdir(), 'bestaat-echt-niet-12345', '.env'))).toBe(0)
  })

  it('negeert regels zonder = en met een ongeldige naam', () => {
    const pad = envBestand('kaal\n=leeg\n1FOUT=x\nTEST_ENV_H=goed\n')
    expect(laadEnv(pad)).toBe(1)
    expect(process.env['TEST_ENV_H']).toBe('goed')
  })

  it('accepteert een waarde met een = erin, zoals een base64-sleutel', () => {
    const pad = envBestand('TEST_ENV_I=abc=def==\n')
    laadEnv(pad)
    expect(process.env['TEST_ENV_I']).toBe('abc=def==')
  })
})
