import { execFile } from 'node:child_process'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { join } from 'node:path'
import { promisify } from 'node:util'
import type { EbookProvider, ProviderResult } from './contracts.js'
import type { LanguageCode } from '../domain/types.js'

const run = promisify(execFile)

/** Kandidaten voor een headless browser, in volgorde van voorkeur. */
const CHROME_CANDIDATES = [
  process.env['CHROME_PATH'],
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
].filter((p): p is string => typeof p === 'string' && p.length > 0)

async function findChrome(): Promise<string | undefined> {
  for (const path of CHROME_CANDIDATES) {
    try {
      await access(path, constants.X_OK)
      return path
    } catch { /* volgende kandidaat */ }
  }
  return undefined
}

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const LABELS: Record<LanguageCode, { questions: string; sources: string; page: string }> = {
  nl: { questions: 'Vragen om samen te bespreken', sources: 'Bronnen', page: 'Pagina' },
  de: { questions: 'Fragen zum gemeinsamen Gespräch', sources: 'Quellen', page: 'Seite' },
  en: { questions: 'Questions to discuss together', sources: 'Sources', page: 'Page' },
}

/**
 * Bouwt een drukklaar werkboek en zet het om naar PDF als er een headless
 * browser op de machine staat. Is die er niet, dan blijft de HTML over — die
 * is zelf al bruikbaar en in elke browser af te drukken. Geen stille fout.
 */
export class LocalEbookProvider implements EbookProvider {
  readonly name = 'ebook-local'
  readonly simulated = false

  async compile(input: Parameters<EbookProvider['compile']>[0]) {
    await mkdir(input.outDir, { recursive: true })
    const labels = LABELS[input.language]

    const chapters = await Promise.all(input.chapters.map(async (c, i) => {
      let img = ''
      if (c.imagePath) {
        try {
          const data = await readFile(c.imagePath)
          img = `<img alt="" src="data:image/png;base64,${data.toString('base64')}">`
        } catch { /* zonder illustratie is het hoofdstuk nog steeds bruikbaar */ }
      }
      return `
  <section class="chapter">
    <h2><span class="num">${i + 1}</span>${escapeHtml(c.heading)}</h2>
    ${img}
    <p>${escapeHtml(c.body)}</p>
    <div class="questions">
      <h3>${labels.questions}</h3>
      <ol>${c.questions.map((q) => `<li>${escapeHtml(q)}</li>`).join('')}</ol>
    </div>
    <div class="sources">
      <h3>${labels.sources}</h3>
      <ul>${c.sources.map((s) =>
        `<li>${escapeHtml(s.work)} — ${escapeHtml(s.locator)}</li>`).join('')}</ul>
    </div>
  </section>`
    }))

    const html = `<!doctype html>
<html lang="${input.language}"><head><meta charset="utf-8">
<title>${escapeHtml(input.title)}</title>
<style>
  @page { size: A4; margin: 22mm 18mm; }
  * { box-sizing: border-box; }
  body { font: 11.5pt/1.65 Georgia, 'DejaVu Serif', serif; color: #1c1c1a; margin: 0; }
  .cover { height: 247mm; display: flex; flex-direction: column; justify-content: center;
           text-align: center; page-break-after: always; }
  .cover h1 { font-size: 30pt; line-height: 1.15; margin: 0 0 10mm; }
  .cover p { font-size: 13pt; color: #55524b; margin: 0; }
  .chapter { page-break-before: always; }
  .chapter h2 { font-size: 17pt; margin: 0 0 6mm; display: flex; gap: 5mm; align-items: baseline; }
  .num { font-size: 11pt; color: #8a8578; border: 1px solid #cfc9ba; border-radius: 50%;
         width: 9mm; height: 9mm; display: inline-flex; align-items: center;
         justify-content: center; flex: none; }
  img { width: 100%; border-radius: 2mm; margin: 0 0 6mm; }
  .questions, .sources { margin-top: 7mm; padding: 5mm 6mm; border-radius: 2mm; }
  .questions { background: #f4f1e8; }
  .sources { border: 1px solid #e2ded1; }
  .questions h3, .sources h3 { font-size: 10pt; letter-spacing: .06em;
    text-transform: uppercase; color: #6d6759; margin: 0 0 3mm; }
  .sources { font-size: 9.5pt; color: #55524b; }
  ol, ul { margin: 0; padding-left: 5mm; }
  li { margin-bottom: 2mm; }
</style></head><body>
  <div class="cover">
    <h1>${escapeHtml(input.title)}</h1>
    <p>${escapeHtml(input.subtitle)}</p>
  </div>
  ${chapters.join('\n')}
</body></html>`

    const htmlPath = join(input.outDir, 'werkboek.html')
    await writeFile(htmlPath, html, 'utf8')

    const chrome = await findChrome()
    if (!chrome) {
      return {
        value: { htmlPath },
        costCents: 0, latencyMs: 5, providerRef: 'ebook:html-only',
      } satisfies ProviderResult<{ htmlPath: string; pdfPath?: string }>
    }

    const pdfPath = join(input.outDir, 'werkboek.pdf')
    await run(chrome, [
      '--headless', '--no-sandbox', '--disable-gpu',
      '--no-pdf-header-footer', `--print-to-pdf=${pdfPath}`,
      `file://${htmlPath}`,
    ], { maxBuffer: 32 * 1024 * 1024 })

    return {
      value: { htmlPath, pdfPath },
      costCents: 0, latencyMs: 900, providerRef: 'ebook:chromium',
    }
  }
}
