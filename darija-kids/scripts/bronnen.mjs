/**
 * Haalt de bronnen van Marokko 360° op, en legt vast wat er terugkwam.
 *
 * De poort van de encyclopedie (`waaromNietPubliceerbaar`) laat een hoofdstuk
 * pas door als er onder elke bewering minstens één bron staat die is ingezien.
 * Niet gevonden — ingezien. Een bron waarvan alleen de URL bekend is, draagt
 * niets, en een zoekresultaat is geen inzage: dat is een samenvatting die een
 * andere machine van de bladzijde heeft gemaakt.
 *
 * Dit script doet de helft die een machine wél kan: het ophalen. Het zet elk
 * document op schijf in `bronnen/`, zodat het daarna werkelijk gelezen kan
 * worden, en het schrijft op wat er terugkwam — datum, status, omvang en een
 * vingerafdruk van de inhoud. Die vingerafdruk is er voor later: een
 * naslagwerk dat jaren meegaat, krijgt te maken met bladzijden die verhuizen
 * of verdwijnen, en dan wil je kunnen zien dát er iets veranderd is.
 *
 * Wat het niet doet is `stand` omzetten naar `gelezen`. Ophalen is geen lezen.
 * Die stap blijft een redactionele beslissing, met `gelezenOp`, `gelezenDoor`
 * en `plek` erbij — waar in de bron het precies staat.
 *
 * Draaien: npm run bronnen
 *          npm run bronnen -- --alleen walili      (één hoofdstuk of één id)
 *          npm run bronnen -- --stand              (alleen kijken, niets ophalen)
 */
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { viaProxy } from './lib/proxy.mjs'

viaProxy(import.meta.url)

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MAP = path.join(ROOT, 'bronnen')

const arg = (naam) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i === -1 ? '' : (process.argv[i + 1] ?? '')
}

const server = await createServer({
  configFile: path.join(ROOT, 'vite.config.ts'),
  root: ROOT,
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
})
const { BRONNEN } = await server.ssrLoadModule('/src/content/encyclopedie/bronnen.ts')
const encyclopedie = await server.ssrLoadModule('/src/content/encyclopedie/index.ts')

/**
 * Wat er precies tussen hier en een gepubliceerd hoofdstuk staat.
 *
 * `waaromNietPubliceerbaar` geeft die lijst al, maar hij staat in de test en
 * in de code en niet op een plek waar je hem even opvraagt. En er zit een
 * onderscheid in dat je niet ziet als je de klachten alleen opsomt: een blok
 * dat wacht op een bron met een URL gaat open zodra het netwerk open is, en
 * een blok dat alleen op een papieren boek rust niet. Die twee door elkaar
 * lezen als "nog zeven dingen te doen" geeft een verkeerd beeld van hoe ver
 * het is — en van wat eraan te doen valt.
 */
if (process.argv.includes('--stand')) {
  const stand = encyclopedie.bronnenstand()
  console.log(`\nBronnen: ${stand.gelezen} van de ${stand.totaal} gelezen` +
    `, ${stand.gevonden} wel gevonden maar nog niet ingezien.`)

  const zonderUrl = new Set(Object.values(BRONNEN).filter((b) => !b.url).map((b) => b.id))
  if (zonderUrl.size) {
    console.log('\nNiet op te halen, want er is geen adres — hiervoor moet iemand')
    console.log('het werk zelf inzien:\n')
    for (const id of zonderUrl) {
      const b = Object.values(BRONNEN).find((x) => x.id === id)
      console.log(`  ${id}`)
      console.log(`    ${b.wie ?? ''} — ${b.titel}`)
      if (b.waar) console.log(`    ${b.waar}`)
    }
  }

  let online = 0
  let papier = 0
  for (const h of encyclopedie.HOOFDSTUKKEN) {
    const klachten = encyclopedie.waaromNietPubliceerbaar(h)
    console.log(`\n[${h.id}] ${h.titel}`)
    console.log(`  stand: ${h.stand}` + (klachten.length ? '' : ' — niets staat meer in de weg'))
    for (const k of klachten) {
      // "blok 5: geen van de bronnen is gelezen (fentress-limane-2019)"
      const ids = (k.match(/\(([^)]*)\)/)?.[1] ?? '').split(', ').filter(Boolean)
      const online_ = ids.filter((id) => !zonderUrl.has(id))
      if (ids.length && !online_.length) {
        papier++
        console.log(`  ✗ ${k}`)
        console.log('      ↳ alleen op papier; het netwerk helpt hier niet')
      } else {
        if (ids.length) online++
        console.log(`  ✗ ${k}`)
      }
    }
  }

  console.log(`\n${online} hiervan gaan open zodra de bronnen op te halen zijn.`)
  if (papier) console.log(`${papier} niet: daar is een boek voor nodig.`)
  console.log('')
  await server.close()
  process.exit(0)
}
await server.close()

const alleen = arg('alleen')
const lijst = Object.values(BRONNEN)
  .filter((b) => b.url)
  .filter((b) => !alleen || b.id.includes(alleen))

if (!lijst.length) {
  console.log(alleen ? `Geen bron met "${alleen}" in zijn id.` : 'Geen enkele bron heeft een adres.')
  process.exit(0)
}

await mkdir(MAP, { recursive: true })

/**
 * De extensie die bij het teruggekomen soort hoort.
 *
 * Een pdf met `.html` eraan is een bestand dat niemand opent, en de helft van
 * de erfgoeddossiers is een pdf.
 */
const extensieVan = (soort) => {
  if (!soort) return 'bin'
  if (soort.includes('pdf')) return 'pdf'
  if (soort.includes('json')) return 'json'
  if (soort.includes('xml')) return 'xml'
  if (soort.includes('html')) return 'html'
  if (soort.startsWith('text/')) return 'txt'
  return 'bin'
}

const titelUit = (tekst) => {
  const m = tekst.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return m ? m[1].replace(/\s+/g, ' ').trim().slice(0, 120) : ''
}

const vandaag = new Date().toISOString().slice(0, 10)
const uitslagen = []

for (const bron of lijst) {
  const begin = Date.now()
  try {
    const antwoord = await fetch(bron.url, {
      redirect: 'follow',
      headers: { 'user-agent': 'darijaforkids-bronnen/1 (+https://darijaforkids.eu)' },
      signal: AbortSignal.timeout(45_000),
    })
    const body = Buffer.from(await antwoord.arrayBuffer())
    const soort = antwoord.headers.get('content-type') ?? ''
    const bestand = path.join(MAP, `${bron.id}.${extensieVan(soort)}`)
    if (antwoord.ok) await writeFile(bestand, body)
    uitslagen.push({
      id: bron.id,
      status: antwoord.status,
      eind: antwoord.url,
      soort: soort.split(';')[0].trim(),
      bytes: body.length,
      sha256: createHash('sha256').update(body).digest('hex'),
      titel: soort.includes('html') ? titelUit(body.toString('utf8')) : '',
      bestand: antwoord.ok ? path.relative(ROOT, bestand) : '',
      ms: Date.now() - begin,
    })
  } catch (fout) {
    uitslagen.push({ id: bron.id, status: 0, fout: String(fout.message ?? fout), ms: Date.now() - begin })
  }
}

const gelukt = uitslagen.filter((u) => u.status >= 200 && u.status < 300)

console.log('')
for (const u of uitslagen) {
  const kop = u.status ? String(u.status) : 'weg'
  const rest = u.fout ? u.fout : `${(u.bytes / 1024).toFixed(0)} kB  ${u.soort}  ${u.titel}`
  console.log(`  ${kop.padEnd(4)} ${u.id.padEnd(26)} ${rest}`)
}
console.log('')

if (!gelukt.length) {
  console.log('Geen enkele bron opgehaald.')
  console.log('')
  /**
   * Een 403 op elk adres tegelijk komt niet van de bronnen.
   *
   * UNESCO, de UCL en het World Monuments Fund weigeren niet op dezelfde
   * seconde dezelfde bezoeker. Dat is de uitgaande proxy van de omgeving, en
   * die antwoordt met 403 of laat de verbinding helemaal niet tot stand komen.
   */
  const alles403 = uitslagen.every((u) => u.status === 403 || u.status === 0)
  if (alles403) {
    console.log('Alle adressen weigeren tegelijk. Dat komt niet van de bronnen zelf maar')
    console.log('van de uitgaande toegang van deze omgeving — een instelling van de')
    console.log('omgeving en niet van dit script.')
    console.log('')
    console.log('Let op: een gewijzigd netwerkbeleid geldt pas in een nieuwe sessie.')
    console.log('De sessie die nu draait houdt het beleid waarmee hij begonnen is.')
  }
  process.exitCode = 1
} else {
  console.log(`${gelukt.length} van de ${uitslagen.length} opgehaald, in bronnen/.`)
  console.log('')
  console.log('Opgehaald is niet gelezen. De stand in bronnen.ts blijft "gevonden"')
  console.log('tot er iemand in het document gekeken heeft en kan opschrijven waar')
  console.log('in de bron het staat — dat is het veld `plek`.')
}

const regels = [
  '# Ophaallog van de bronnen',
  '',
  'Geschreven door `npm run bronnen`. Dit is geen leesverslag maar een',
  'ophaalverslag: het zegt dat het document er op die dag stond en hoe het',
  'eruitzag, niet dat er iemand in gekeken heeft.',
  '',
  'De vingerafdruk staat erbij voor later. Een naslagwerk gaat jaren mee en',
  'bladzijden verhuizen; verandert de vingerafdruk, dan is het document niet',
  'meer hetzelfde als toen de bewering erop gebouwd werd.',
  '',
  `Laatst gedraaid: ${vandaag}`,
  '',
  '| Bron | Status | Soort | Omvang | Vingerafdruk (eerste 16) |',
  '|---|---|---|---|---|',
  ...uitslagen.map((u) => {
    if (u.fout) return `| \`${u.id}\` | niet opgehaald | — | — | ${u.fout.replace(/\|/g, '/')} |`
    if (u.status < 200 || u.status >= 300) return `| \`${u.id}\` | ${u.status} | — | — | geen document |`
    return `| \`${u.id}\` | ${u.status} | ${u.soort || '—'} | ${(u.bytes / 1024).toFixed(0)} kB | \`${u.sha256.slice(0, 16)}\` |`
  }),
  '',
]
await writeFile(path.join(ROOT, 'docs', 'MAROKKO360_OPHAALLOG.md'), `${regels.join('\n')}`)
console.log('')
console.log('docs/MAROKKO360_OPHAALLOG.md bijgewerkt.')
