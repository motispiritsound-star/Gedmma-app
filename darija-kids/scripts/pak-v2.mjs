/**
 * Haalt de geschilderde platen uit de v2-pdf's.
 *
 * De platen zijn met ChatGPT gemaakt en aangeleverd als pdf, niet als losse
 * bestanden. Ze zitten er wel in: elk deel heeft één groot geschilderd
 * tafereel van 1536 bij 1024, en dat wordt in de pdf op elke bladzijde
 * opnieuw gebruikt.
 *
 * Dit script pelt ze eruit en zet ze in `store/prentenboek/platen/<deel>/`,
 * waar de zetter ze al verwacht. Eén opdracht, en daarna staan de eigen
 * platen in de eigen boeken.
 *
 * Waarom een eigen uitpakker en geen bibliotheek: de streams zijn met
 * ASCII85 verpakt en daarna pas met JPEG of Flate. Dat is twee regels werk
 * en het scheelt een afhankelijkheid die alleen hiervoor zou bestaan.
 *
 * Run with: node scripts/pak-v2.mjs <map met de pdf's>
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import zlib from 'node:zlib'
import ffmpeg from 'ffmpeg-static'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BRON = process.argv[2]
if (!BRON) { console.error('geef de map met de pdf\'s op'); process.exit(1) }

/** ASCII85 zoals de pdf hem schrijft: vijf tekens worden vier bytes. */
const a85 = (tekst) => {
  const schoon = tekst.replace(/\s/g, '').replace(/^<~/, '').replace(/~>$/, '')
  const uit = []
  let groep = []
  for (const teken of schoon) {
    if (teken === 'z' && groep.length === 0) { uit.push(0, 0, 0, 0); continue }
    groep.push(teken.charCodeAt(0) - 33)
    if (groep.length === 5) {
      let n = 0
      for (const g of groep) n = n * 85 + g
      uit.push((n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255)
      groep = []
    }
  }
  if (groep.length) {
    const tekort = 5 - groep.length
    for (let i = 0; i < tekort; i++) groep.push(84)
    let n = 0
    for (const g of groep) n = n * 85 + g
    const bytes = [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]
    uit.push(...bytes.slice(0, 4 - tekort))
  }
  return Buffer.from(uit)
}

const uitpakken = async (pdf) => {
  const rauw = await readFile(pdf)
  const tekst = rauw.toString('latin1')
  const gevonden = []
  const patroon = /(\d+)\s+0\s+obj\s*(<<[\s\S]*?>>)\s*stream\r?\n/g
  let m
  while ((m = patroon.exec(tekst))) {
    const kop = m[2]
    if (!/\/Subtype\s*\/Image/.test(kop)) continue
    const lengte = Number((kop.match(/\/Length\s+(\d+)/) ?? [])[1])
    const breed = Number((kop.match(/\/Width\s+(\d+)/) ?? [])[1])
    const hoog = Number((kop.match(/\/Height\s+(\d+)/) ?? [])[1])
    if (!lengte || breed * hoog < 200_000) continue

    let data = rauw.subarray(m.index + m[0].length, m.index + m[0].length + lengte)
    if (kop.includes('/ASCII85Decode')) data = a85(data.toString('latin1'))
    if (kop.includes('/DCTDecode')) { gevonden.push({ breed, hoog, soort: 'jpg', data }); continue }
    try { gevonden.push({ breed, hoog, soort: 'rgb', data: zlib.inflateSync(data) }) } catch { /* geen beeld */ }
  }
  return gevonden.sort((a, b) => b.breed * b.hoog - a.breed * a.hoog)
}

/** Rauwe pixels gaan via ffmpeg naar jpeg; een png bouwen kan ook en weegt meer. */
const naarJpeg = (beeld, uit) => {
  if (beeld.soort === 'jpg') return writeFile(uit, beeld.data)
  const tijdelijk = uit + '.rgb'
  return writeFile(tijdelijk, beeld.data).then(() => {
    execFileSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error',
      '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${beeld.breed}x${beeld.hoog}`,
      '-i', tijdelijk, '-q:v', '3', uit])
  })
}

const pdfs = (await readdir(BRON)).filter((n) => /sba-deel-(\d+)-.*\.pdf$/i.test(n))
console.log(`\n${pdfs.length} pdf's gevonden\n`)

for (const naam of pdfs.sort()) {
  const nummer = Number(naam.match(/sba-deel-(\d+)/i)[1])
  const beelden = await uitpakken(path.join(BRON, naam))
  if (!beelden.length) { console.log(`deel ${nummer}: geen beeld gevonden`); continue }

  const map = path.join(ROOT, 'store', 'prentenboek', 'platen', String(nummer))
  await mkdir(map, { recursive: true })
  const groot = beelden[0]
  await naarJpeg(groot, path.join(map, 'achtergrond.jpg'))
  console.log(`deel ${String(nummer).padStart(2)}: ${groot.breed}×${groot.hoog}  →  platen/${nummer}/achtergrond.jpg`)
}

console.log('\nDraai nu `npm run prentenboek -- --deel 1` om het te zien.\n')
