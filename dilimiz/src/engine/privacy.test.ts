import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Privacy als meting in plaats van als belofte.
 *
 * docs/privacy-and-safety.md zegt dat deze app geen advertenties heeft, geen
 * analytics, geen tracking en geen enkele aanroep naar buiten behalve de
 * winkel. Een belofte in een document houdt zichzelf niet na; deze test wel.
 *
 * Hij draait over de BRONBESTANDEN. Over de gebouwde bundel draaien is beter
 * en staat op de lijst (docs/mvp-backlog.md #32) -- dan wordt ook gevangen wat
 * een afhankelijkheid meesmokkelt.
 */

const WORTEL = join(import.meta.dirname, '..', '..')

const bron = (): string[] => {
  const uit: string[] = []
  const loop = (pad: string) => {
    for (const naam of readdirSync(pad)) {
      if (naam === 'node_modules' || naam === 'dist' || naam.startsWith('.')) continue
      const vol = join(pad, naam)
      if (statSync(vol).isDirectory()) loop(vol)
      else if (/\.(ts|tsx|css|html)$/.test(naam) && !naam.endsWith('privacy.test.ts')) uit.push(vol)
    }
  }
  loop(join(WORTEL, 'src'))
  uit.push(join(WORTEL, 'index.html'))
  return uit
}

const inhoud = (): { bestand: string; tekst: string }[] =>
  bron().map((bestand) => ({ bestand, tekst: readFileSync(bestand, 'utf8') }))

describe('geen tracking en geen advertenties', () => {
  it('bevat geen enkele bekende analytics- of advertentie-SDK', () => {
    const verboden = [
      'google-analytics', 'googletagmanager', 'gtag(', 'firebase', 'sentry',
      'mixpanel', 'amplitude', 'segment.com', 'posthog', 'plausible',
      'facebook.net', 'fbq(', 'admob', 'applovin', 'unityads', 'appsflyer',
      'adjust.com', 'onesignal', 'hotjar', 'clarity.ms', 'doubleclick',
    ]
    for (const { bestand, tekst } of inhoud()) {
      const klein = tekst.toLowerCase()
      for (const naam of verboden) {
        expect(klein, `${bestand} bevat ${naam}`).not.toContain(naam)
      }
    }
  })

  it('doet geen enkel netwerkverzoek vanuit de app', () => {
    // Geen fetch, geen XMLHttpRequest, geen WebSocket, geen beacon. De app
    // werkt offline en heeft geen server -- dus hoort hier niets te staan.
    for (const { bestand, tekst } of inhoud()) {
      if (bestand.endsWith('.test.ts') || bestand.endsWith('.test.tsx')) continue
      expect(tekst, `${bestand} gebruikt fetch`).not.toMatch(/\bfetch\s*\(/)
      expect(tekst, `${bestand} gebruikt XMLHttpRequest`).not.toContain('XMLHttpRequest')
      expect(tekst, `${bestand} opent een WebSocket`).not.toContain('new WebSocket')
      expect(tekst, `${bestand} gebruikt sendBeacon`).not.toContain('sendBeacon')
    }
  })

  it('laadt niets van een adres buiten de app', () => {
    // Een lettertype of script van een cdn is een verzoek naar buiten én een
    // app die zonder verbinding niet werkt. Alles hoort gebundeld te zijn.
    for (const { bestand, tekst } of inhoud()) {
      if (bestand.endsWith('.test.ts')) continue
      const adressen = [...tekst.matchAll(/https?:\/\/[^\s'"`)]+/g)].map((m) => m[0])
      for (const adres of adressen) {
        // In commentaar en documentatie mag een adres staan; in code niet.
        const inCode = new RegExp(`(src|href|url|import)\\s*[=(:]\\s*['"\`]${adres.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
        expect(inCode.test(tekst), `${bestand} laadt ${adres}`).toBe(false)
      }
    }
  })
})

describe('geen stemopnames die blijven staan', () => {
  it('slaat geen opname op en verstuurt er geen', () => {
    for (const { bestand, tekst } of inhoud()) {
      expect(tekst, `${bestand} gebruikt MediaRecorder`).not.toContain('MediaRecorder')
      expect(tekst, `${bestand} gebruikt een cloud-spraakherkenner`).not.toContain('SpeechRecognition')
    }
  })
})

describe('wat er niet gevraagd wordt', () => {
  it('vraagt nergens om een geboortedatum, e-mailadres of adres van een kind', () => {
    for (const { bestand, tekst } of inhoud()) {
      if (bestand.includes('/i18n/') || bestand.endsWith('.test.ts')) continue
      expect(tekst.toLowerCase(), `${bestand}`).not.toContain('type="date"')
      expect(tekst.toLowerCase(), `${bestand}`).not.toContain("type: 'email'")
      expect(tekst.toLowerCase(), `${bestand}`).not.toContain('type="email"')
    }
  })

  it('zet geen cookie', () => {
    for (const { bestand, tekst } of inhoud()) {
      expect(tekst, `${bestand}`).not.toContain('document.cookie')
    }
  })
})

describe('de privacydocumentatie bestaat en zegt wat de code doet', () => {
  it('heeft een privacydocument', () => {
    const doc = readFileSync(join(WORTEL, 'docs', 'privacy-and-safety.md'), 'utf8')
    expect(doc.length).toBeGreaterThan(2000)
    expect(doc).toContain('Geen advertenties')
    expect(doc).toContain('Stemopnames')
    expect(doc).toContain('Inzage en verwijdering')
  })

  it('benoemt dat de juridische controle nog moet gebeuren', () => {
    // Deze app is niet publicatieklaar, en het document mag niet suggereren
    // dat de analyse juridisch advies is.
    const doc = readFileSync(join(WORTEL, 'docs', 'privacy-and-safety.md'), 'utf8')
    expect(doc).toContain('geen juridisch advies')
    expect(doc).toContain('Wat juridisch nagekeken moet worden')
  })
})
