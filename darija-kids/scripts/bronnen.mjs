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
 */
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

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
