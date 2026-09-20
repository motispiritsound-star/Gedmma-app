/**
 * De verschoven knip rechtzetten.
 *
 * Honderdzesentwintig woorden zijn in negen spraakmemo's achter elkaar
 * ingesproken en daarna op de stiltes uit elkaar geknipt. Op twee plekken
 * kwam er een stuk te veel in — een woord dat opnieuw werd gezegd, een
 * verspreking die werd hersteld — en vanaf dat punt schoof alles op: elke
 * opname belandde onder de naam van een woord dat eerder aan de beurt was.
 *
 * Uitrekenen kon niet. Losse woorden duren allemaal ongeveer even lang, dus
 * een lengtemodel wees een streek aan en geen grens; een model op de
 * aanzetklank raadde op de bekende opnames niet beter dan de helft. Wat wel
 * werkte was luisteren, en dan gericht: een pagina die per woord vroeg
 * *welk* woord eruit kwam en telkens de vraag stelde die het meeste
 * verraadde. Daar komt de kaart hieronder vandaan.
 *
 * Wat dit script doet is dan ook geen gok maar een boekhouding: verschuif de
 * bestanden in elk stuk net zo ver terug als daar gemeten is.
 *
 * Draaien met:
 *   node scripts/repareer-knip.mjs --proef    laat zien wat er zou gebeuren
 *   node scripts/repareer-knip.mjs            doe het
 */
import { copyFile, mkdtemp, readdir, rm, unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MAP = path.join(ROOT, 'src', 'audio', 'woorden')
const PROEF = process.argv.includes('--proef')

/**
 * De volgorde waarin deze honderdzesentwintig zijn ingesproken.
 *
 * Niet de volgorde van de woordenlijst en niet die van de cursus: de volgorde
 * waarin ze zijn voorgelezen, en dus de enige waarin "een plaats opgeschoven"
 * iets betekent. Afgeleid uit de commit die ze toevoegde — de woorden die er
 * toen bij kwamen, in de volgorde van `words.ts`.
 */
const VOLGORDE = [
  'hiya', 'huma', 'aila', 'baba', 'walidin', 'khoya',
  'jeddi', 'jedda', 'khali', 'weld', 'bent', 'wahed',
  'jouj', 'tlata', 'khamsa', 'setta', 'seb3a', 'ts3ud',
  'rb3tach', '3achrin', 'mya', 'shhal', 'zreq', 'qehwi',
  'wardi', 'brtqali', 'makla', 'atay', 'qehwa', 'hlib',
  'khobz', 'bid', 'tfah', 'banan', 'limun', 'hamd',
  'btata', 'bsla', 'sokkar', 'tajine', 'msemmen', 'bnin',
  'ju3an', 'bsseha', 'bit', 'kuzina', 'hemmam', 'bab',
  'tebla', 'kursi', 'telfaza', 'telifun', 'dou', 'medrasa',
  'telmid', 'ktab', 'stilu', 'qlem', 'memha', 'wajib',
  '3otla', 'imtihan', 'hayawanat', 'mesh', 'kelb', 'khruf',
  'jmel', 'far', 'nemla', 'sba3', 'qerd', 'lyum',
  'lbareh', 'daba', 'sbah', 'sa3a', 'simana', 'jjem3a',
  'ssebt', 'lhedd', 'jjaw', 'shems', 'bred', 'wden',
  'snan', 'yedd', 'kersh', 'qelb', 'ferhan', 'hzin',
  'mrid', 'khayf', 'kanmshi', 'kanji', 'kanqra', 'kanl3eb',
  'kan3es', 'kanshuf', 'kanhder', 'kandhek', 'kanjri', '3endi',
  'khessni', 'aji', 'shuf', 'shnu', 'fin', 'hanut',
  'sghir', 'lisar', 'nishan', 'qeddam', 'medina', 'jbel',
  'mustashfa', 'tobis', 'tomobil', 'ramadan', '3id', 'henna',
  'jellaba', 'gnawa', 'casablanca', 'marrakech', 'fas', 'agadir',
]

/**
 * Wat er per stuk gemeten is, met een oor.
 *
 * `schuif` is hoeveel plaatsen de opnames in dat stuk zijn opgeschoven: bij 2
 * zegt het bestand op plek 4 het woord van plek 2.
 */
const STUKKEN = [
  { van: 0, tot: 3, schuif: 0 },
  { van: 4, tot: 6, schuif: 2 },
  { van: 7, tot: 40, schuif: 0 },
  { van: 42, tot: 66, schuif: 1 },
  { van: 67, tot: 125, schuif: 0 },
]

/**
 * Plekken waar inmiddels een verse opname staat, ingesproken nadat de fout
 * gevonden was. Die zijn goed en mogen door niets worden overschreven.
 */
const OPNIEUW_INGESPROKEN = new Set(['aila', 'baba', 'ldid'])

/** Plek 41 heette bnin; dat woord is vervangen door ldid met een eigen opname. */
const VERVALLEN = new Set(['bnin'])

const bestand = (id) => path.join(MAP, `${id}.wav`)

/* ------------------------------------------------ wat waar naartoe moet */

/** Voor elke plek: welk bestand de klank van dat woord bevat, of niets. */
const bron = new Map()
for (const { van, tot, schuif } of STUKKEN) {
  if (!schuif) continue
  for (let i = van; i <= tot; i++) {
    const doel = i - schuif
    if (doel < 0) continue
    bron.set(VOLGORDE[doel], VOLGORDE[i])
  }
}

const verplaatsingen = []
const weg = []
for (const [doel, van] of bron) {
  if (OPNIEUW_INGESPROKEN.has(doel)) continue      // al goed, niet aankomen
  if (VERVALLEN.has(doel)) continue                // het woord bestaat niet meer
  if (VERVALLEN.has(van) || !existsSync(bestand(van))) continue
  verplaatsingen.push({ van, doel })
}
/** Aan het eind van elk verschoven stuk valt een woord zonder klank. */
for (const { van, tot, schuif } of STUKKEN) {
  if (!schuif) continue
  for (let i = tot - schuif + 1; i <= tot; i++) {
    const id = VOLGORDE[i]
    if (!bron.has(id) && !OPNIEUW_INGESPROKEN.has(id) && existsSync(bestand(id))) weg.push(id)
  }
}

console.log(`${verplaatsingen.length} opnames krijgen hun goede naam:`)
for (const { van, doel } of verplaatsingen) console.log(`  ${van.padEnd(12)} → ${doel}`)
console.log(`\n${weg.length} woorden houden geen opname over en moeten opnieuw:`)
for (const id of weg) console.log(`  ${id}`)

if (PROEF) {
  console.log('\n--proef: er is niets gewijzigd.')
  process.exit(0)
}

/* Eerst alles apart zetten, dan pas schrijven: bron en doel overlappen, en
   half werk is erger dan geen werk. */
const tijdelijk = await mkdtemp(path.join(tmpdir(), 'knip-'))
for (const { van } of verplaatsingen) await copyFile(bestand(van), path.join(tijdelijk, `${van}.wav`))
for (const { van, doel } of verplaatsingen) await copyFile(path.join(tijdelijk, `${van}.wav`), bestand(doel))
for (const id of weg) await unlink(bestand(id))
await rm(tijdelijk, { recursive: true, force: true })

const over = (await readdir(MAP)).filter((f) => f.endsWith('.wav')).length
console.log(`\nKlaar. ${over} opnames in ${path.relative(ROOT, MAP)}.`)
