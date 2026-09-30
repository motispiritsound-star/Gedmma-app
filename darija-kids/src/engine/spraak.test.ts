/**
 * De stem van een kind blijft op het toestel.
 *
 * De app had een spreekoefening die `webkitSpeechRecognition` gebruikte. Die
 * doet de herkenning niet op het toestel: Chrome stuurt het geluidsfragment
 * naar Google. In de app gebeurde dat nooit — een WKWebView kent die API niet,
 * dus daar draaide altijd de opnemen-oefening — maar op de website wel.
 *
 * En het oordeel dat terugkwam kon niet kloppen. Er bestaat geen motor die
 * Darija kent; ze zijn allemaal getraind op Standaardarabisch, een andere taal
 * met dezelfde letters. Een kind dat het goed zei kreeg "fout" te horen van een
 * computer die de taal niet spreekt.
 *
 * Weg dus, allebei de redenen. Wat blijft is `NaZeggen`: opnemen en jezelf
 * terughoren vlak na de stem die het goed zegt. Dat is wat een leraar doet.
 *
 * Deze test bewaakt dat niemand het per ongeluk terugzet — het is precies het
 * soort gemak dat er in een volgende ronde weer in glijdt.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

/** Alle bronbestanden van de app. De site is een aparte bouw. */
function appBestanden(map = 'src'): string[] {
  const uit: string[] = []
  for (const naam of readdirSync(map)) {
    const pad = join(map, naam)
    if (statSync(pad).isDirectory()) {
      if (naam === 'site' || naam === 'content') continue
      uit.push(...appBestanden(pad))
    } else if (/\.tsx?$/.test(naam) && !naam.includes('.test.')) {
      // Met schuine strepen, ook op Windows: dit pad komt in een foutmelding
      // terecht, en die hoort op elke machine hetzelfde te lezen.
      uit.push(pad.split(sep).join('/'))
    }
  }
  return uit
}

describe('spraakherkenning', () => {
  const bestanden = appBestanden()

  it('wordt nergens meer aangeroepen', () => {
    expect(bestanden.length).toBeGreaterThan(20)
    const fout: string[] = []
    for (const pad of bestanden) {
      const bron = readFileSync(pad, 'utf8')
      // Het commentaar in audio.ts legt uit waaróm hij weg is; dat mag.
      const code = bron.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
      if (/\bwebkitSpeechRecognition\b|\bSpeechRecognition\b|\blistenOnce\b|\bcanListen\b/.test(code)) {
        fout.push(pad)
      }
    }
    expect(fout, 'hier staat de herkenning weer in').toEqual([])
  })

  it('heeft de spreekoefening vervangen door opnemen en terughoren', () => {
    const oefeningen = readFileSync('src/ui/exercises.tsx', 'utf8')
    expect(oefeningen).toContain("case 'spreek': return speechOn ? <NaZeggen {...props} /> : <Type {...props} />")
    // En `NaZeggen` bestaat nog echt.
    expect(oefeningen).toMatch(/function NaZeggen\(/)
  })

  it('laat de microfoon niets versturen', () => {
    // De opname blijft in het geheugen van het toestel: geen enkele uitgaande
    // aanroep in het bestand dat de microfoon beheert.
    const mic = readFileSync('src/engine/microfoon.ts', 'utf8')
    expect(mic).not.toMatch(/\bfetch\(|XMLHttpRequest|sendBeacon|FormData/)
  })
})
