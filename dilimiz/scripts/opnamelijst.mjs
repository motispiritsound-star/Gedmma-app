/**
 * Het opnamescript voor de stemacteurs.
 *
 * `npm run opnamelijst` -> opnamelijst.md
 *
 * Elke regel heeft de bestandsnaam erbij, want die bestandsnaam is de id uit
 * de inhoud en daar zoekt de app op. Een opname die `merhaba (1).wav` heet
 * vindt de app niet, en dat valt pas op bij een kind.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const wortel = join(hier, '..')
const lees = (pad) => readFileSync(join(wortel, pad), 'utf8')

const regels = []
const bij = (s = '') => regels.push(s)

bij('# Dilimiz — opnamelijst')
bij()
bij('## Voor wie dit inspreekt')
bij()
bij('- **Twee stemmen graag:** een volwassen vrouwenstem en een kinderstem.')
bij('  Een kind spreekt een kinderstem beter na.')
bij('- **Natuurlijk tempo**, niet overdreven langzaam. De app vertraagt zelf als')
bij('  een kind op de schildpadknop drukt.')
bij('- **Eén bestand per regel**, met exact de bestandsnaam die erbij staat.')
bij('  De app zoekt op die naam; `merhaba (1).wav` wordt niet gevonden.')
bij('- **Stille kamer**, geen muziek, geen galm. Wav, 48 kHz, mono is genoeg.')
bij('- Bij twijfel over de uitspraak: zeg het zoals je het thuis zegt, en zet er')
bij('  een opmerking bij. Dat is waardevoller dan een lesboekuitspraak.')
bij()
bij('> Zolang deze opnames er niet zijn, gebruikt de app de computerstem van de')
bij('> telefoon en zegt dat er met zoveel woorden bij. Dat is een tijdelijke')
bij('> terugval en geen lanceerbare stand — zie docs/decisions.md B-7.')
bij()

const tel = { woord: 0, zin: 0, letter: 0, paar: 0 }

bij('## Woorden')
bij()
bij('| # | Bestand | Turks | Betekenis |')
bij('|---|---|---|---|')
for (const m of lees('src/content/woorden.ts').matchAll(/^\s{2}(?:g|ij|c|f)\('([^']+)',\s*'((?:[^'\\]|\\.)*)'/gm)) {
  const id = m[1].normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[çğıİöşüÇĞIÖŞÜ]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', İ: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', I: 'i', Ö: 'o', Ş: 's', Ü: 'u' })[c] ?? c)
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  bij(`| ${++tel.woord} | \`${id}.wav\` | **${m[1]}** | ${m[2]} |`)
}
bij()

bij('## Zinnen')
bij()
bij('| # | Bestand | Turks |')
bij('|---|---|---|')
for (const m of lees('src/content/zinnen.ts').matchAll(/z\('([^']+)',\s*'[^']+',\s*'((?:[^'\\]|\\.)*)'/g)) {
  bij(`| ${++tel.zin} | \`z-${m[1]}.wav\` | **${m[2]}** |`)
}
bij()

bij('## Losse letters — het voorbeeldwoord bij elke letter')
bij()
bij('| # | Bestand | Woord |')
bij('|---|---|---|')
for (const m of lees('src/content/letters.ts').matchAll(/l\('([^']+)',[\s\S]*?voorbeeld: '([^']+)'/g)) {
  bij(`| ${++tel.letter} | \`l-${m[1]}.wav\` | **${m[2]}** |`)
}
bij()

bij('## Klankparen — deze zijn de belangrijkste')
bij()
bij('Twee woorden die in één letter verschillen. Spreek ze **apart** in, niet')
bij('achter elkaar: het kind hoort er één en moet aanwijzen welke het was. Hier')
bij('mag het verschil gerust iets duidelijker dan normaal.')
bij()
bij('| # | Bestand | Woord |')
bij('|---|---|---|')
const paren = lees('src/content/klankparen.ts')
for (const m of paren.matchAll(/paar\('([^']+)',\s*\[[^\]]*\],\s*\n\s*\['([^']+)'[\s\S]*?\n\s*\['([^']+)'/g)) {
  bij(`| ${++tel.paar} | \`p-${m[1]}-links.wav\` | **${m[2]}** |`)
  bij(`| ${++tel.paar} | \`p-${m[1]}-rechts.wav\` | **${m[3]}** |`)
}
bij()
bij(`**Totaal: ${tel.woord + tel.zin + tel.letter + tel.paar} opnames per stem.**`)
bij()
bij('Reken op ongeveer twee uur per stem, inclusief opnieuw doen.')

writeFileSync(join(wortel, 'opnamelijst.md'), regels.join('\n') + '\n', 'utf8')
console.log(`opnamelijst.md geschreven: ${tel.woord} woorden, ${tel.zin} zinnen, ${tel.letter} letters, ${tel.paar} klankparen`)
