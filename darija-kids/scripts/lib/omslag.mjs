/**
 * De omslag van een boek als plaatje, voor de website.
 *
 * De boekenpagina liet twee vectortekeningen zien — een leeuw en een gele
 * sleutel op een cirkel — omdat er geen geschilderde plaat was. Maar de
 * boeken hebben allang een omslag: de zetter tekent hem, en hij staat alleen
 * in de pdf. Dit haalt hem daaruit, zodat een bezoeker het boek ziet dat hij
 * koopt en niet iets wat erop lijkt.
 *
 * Het gebeurt hier en niet in `make-siteassets.mjs`, omdat de pagina op dat
 * moment al in een browser staat: de omslag nog een keer opbouwen zou een
 * tweede plek zijn waar dezelfde vormgeving staat, en die twee lopen uit
 * elkaar zodra er één verandert.
 */
import { execFile } from 'node:child_process'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { promisify } from 'node:util'
import ffmpeg from 'ffmpeg-static'

const run = promisify(execFile)

/**
 * @param bladzijde een Playwright-pagina waarop het boek al staat
 * @param uit       pad van het .webp-bestand dat eruit moet komen
 */
export async function schrijfOmslag(bladzijde, uit) {
  // Het scherm, niet de printer: `emulateMedia('print')` laat @page-regels
  // meedoen en die knippen de omslag op een paginagrens af.
  await bladzijde.emulateMedia({ media: 'screen' })
  const omslag = bladzijde.locator('.omslag').first()
  const png = path.join(tmpdir(), `.omslag-${Date.now()}.png`)
  await omslag.screenshot({ path: png, scale: 'device' })

  await mkdir(path.dirname(uit), { recursive: true })
  await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', png,
    '-vf', 'scale=640:-1', '-quality', '82', uit], { maxBuffer: 1 << 24 })
  await rm(png, { force: true })
  await bladzijde.emulateMedia({ media: 'print' })
  return uit
}
