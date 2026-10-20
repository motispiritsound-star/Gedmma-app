/**
 * Schrijft de hele Turkse inhoud als één leesbaar bestand, om door een
 * moedertaalspreker of Turkse taaldocent te laten nakijken.
 *
 * `npm run nakijklijst` -> nakijklijst.md
 *
 * Eén bestand en geen zes: wie dit nakijkt doet het in één zitting, op papier
 * of op een tablet, en moet niet door een repository hoeven klikken. De
 * twijfelpunten uit nakijken.ts staan bovenaan, want dat is waar de aandacht
 * het meest waard is.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const wortel = join(hier, '..')

/**
 * De inhoud wordt uit de bronbestanden gelezen met een kleine ontleder in
 * plaats van met een import.
 *
 * Reden: deze bestanden zijn TypeScript, en Node kan die niet zonder bouwstap
 * laden. Een bouwstap voor een nakijklijst is een bouwstap die omvalt op het
 * moment dat je hem nodig hebt.
 */
const lees = (pad) => readFileSync(join(wortel, pad), 'utf8')

const regels = []
const bij = (s = '') => regels.push(s)

bij('# Dilimiz — nakijklijst Turkse inhoud')
bij()
bij('Deze lijst is gegenereerd met `npm run nakijklijst`. Niets hierin is')
bij('nagekeken door iemand met Turks als moedertaal.')
bij()
bij('**Wat ik vraag:** loop de Turkse kolom door en zet erbij wat fout,')
bij('onnatuurlijk of ongepast voor een kind is. Vooral: klinkt het als iets wat')
bij('een kind werkelijk zegt, of als een lesboekzin?')
bij()

/* De twijfelpunten, letterlijk uit nakijken.ts. */
const nak = lees('src/content/nakijken.ts')
bij('## Waar ik zelf heb getwijfeld')
bij()
for (const m of nak.matchAll(/'([a-z]+\.ts)': \{[\s\S]*?twijfel: \[([\s\S]*?)\],?\s*\},/g)) {
  bij(`### ${m[1]}`)
  bij()
  for (const t of m[2].matchAll(/'([^']*(?:''[^']*)*)'/g)) bij(`- ${t[1].replaceAll("''", "'")}`)
  bij()
}

/* De woorden. */
bij('## Woorden')
bij()
bij('| Turks | Nederlands | Uitleg erbij |')
bij('|---|---|---|')
const woorden = lees('src/content/woorden.ts')
for (const m of woorden.matchAll(/^\s{2}(?:g|ij|c|f)\('([^']+)',\s*'((?:[^'\\]|\\.)*)'/gm)) {
  bij(`| **${m[1]}** | ${m[2]} | |`)
}
bij()

/* De zinnen. */
bij('## Zinnen')
bij()
bij('| Turks | Nederlands | Klopt het? |')
bij('|---|---|---|')
const zinnen = lees('src/content/zinnen.ts')
for (const m of zinnen.matchAll(/z\('[^']+',\s*'[^']+',\s*'((?:[^'\\]|\\.)*)',\s*\n\s*\['((?:[^'\\]|\\.)*)'/g)) {
  bij(`| **${m[1]}** | ${m[2]} | |`)
}
bij()

/* De klankparen. */
bij('## Klankparen')
bij()
bij('| Links | Rechts | Soort | Echt minimaal? Geschikt voor een kind? |')
bij('|---|---|---|---|')
const paren = lees('src/content/klankparen.ts')
for (const m of paren.matchAll(/paar\('([^']+)',\s*\[[^\]]*\],\s*\n\s*\['([^']+)',\s*'([^']*)'[\s\S]*?\n\s*\['([^']+)',\s*'([^']*)'[^\]]*\](?:,\s*\n?\s*'(\w+)')?\)/g)) {
  bij(`| **${m[2]}** (${m[3]}) | **${m[4]}** (${m[5]}) | ${m[6] ?? 'minimaal'} | |`)
}
bij()

bij('## Letters')
bij()
bij('| Letter | Naam | Klankbeschrijving (NL) | Klopt de naam? |')
bij('|---|---|---|---|')
const letters = lees('src/content/letters.ts')
for (const m of letters.matchAll(/l\('[^']+',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*\{\s*\n?\s*nl: '((?:[^'\\]|\\.)*)'/g)) {
  bij(`| ${m[1]} / ${m[2]} | ${m[3]} | ${m[4]} | |`)
}
bij()

const uit = join(wortel, 'nakijklijst.md')
writeFileSync(uit, regels.join('\n') + '\n', 'utf8')
console.log(`nakijklijst.md geschreven: ${regels.length} regels`)
console.log('Stuur dit bestand naar een moedertaalspreker of Turkse taaldocent.')
console.log('Zie docs/decisions.md B-1.')
