/**
 * Wie wat gekocht heeft, en of een sleutel rondgaat.
 *
 * De database telde al bij elke opening vanaf hoeveel verschillende plekken
 * een sleutel wordt gebruikt — `plekken()` in `server/src/lezer.ts` — maar
 * niets riep die functie ooit aan. Er werd dus geteld en nooit gekeken. Dit
 * is het kijken.
 *
 * Eén gezin leest vanaf twee of drie plekken: telefoon, tablet, de computer
 * van opa. Veertig is iets anders, en dan wil je het weten zonder eerst een
 * zoekopdracht te moeten verzinnen.
 *
 *   npm run bestellingen            — de laatste vijfentwintig
 *   npm run bestellingen -- --alles — allemaal
 *   npm run bestellingen -- --hier  — op de lokale kopie
 */
import { wrangler } from './lib/wrangler.mjs'

const HIER = process.argv.includes('--hier')
const ALLES = process.argv.includes('--alles')

/** Dertig dagen terug, als `2026-09-27`, net als `plekken()` rekent. */
const grens = () => new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)

const VRAAG = `
SELECT b.bestelnummer, b.email, b.reeksen,
       date(b.gekocht_op / 1000, 'unixepoch') AS gekocht,
       b.ingetrokken, b.reden,
       (SELECT COUNT(DISTINCT o.ip_hash) FROM opening o
         WHERE o.bestelling_id = b.id AND o.dag >= '${grens()}') AS plekken
  FROM bestelling b
 ORDER BY b.gekocht_op DESC
 ${ALLES ? '' : 'LIMIT 25'}`

const uit = wrangler(['d1', 'execute', 'darijaforkids',
  HIER ? '--local' : '--remote', '--yes', '--json', '--command', VRAAG])

/** Wrangler zet er soms een regel tekst boven; het json begint bij de haak. */
const rijen = JSON.parse(uit.slice(uit.indexOf('[')))[0]?.results ?? []

if (!rijen.length) {
  console.log('\nNog geen bestellingen.\n')
  process.exit(0)
}

const kolom = (naam, breedte) => String(naam ?? '').padEnd(breedte).slice(0, breedte)
console.log('')
console.log([kolom('gekocht', 11), kolom('bestelnummer', 20), kolom('e-mailadres', 30),
             kolom('reeksen', 15), kolom('plekken', 8), 'staat'].join(' '))
console.log('─'.repeat(100))

let verdacht = 0
for (const r of rijen) {
  const staat = r.ingetrokken ? `ingetrokken (${r.reden ?? 'geen reden'})` : 'geldig'
  // Zeven plekken in dertig dagen is ruim voor één gezin en krap voor een
  // sleutel die op een forum staat. Het is een wenkbrauw, geen oordeel.
  const let_op = !r.ingetrokken && Number(r.plekken) >= 7
  if (let_op) verdacht += 1
  console.log([kolom(r.gekocht, 11), kolom(r.bestelnummer ?? '—', 20), kolom(r.email, 30),
               kolom(r.reeksen, 15), kolom(r.plekken, 8), staat + (let_op ? '   ← kijk hier' : '')].join(' '))
}

console.log('')
if (verdacht) {
  console.log(`${verdacht === 1 ? 'Eén sleutel wordt' : `${verdacht} sleutels worden`} vanaf zeven of meer plekken gelezen.`)
  console.log('Wil je er een intrekken:\n')
  console.log('  npm run intrekken\n')
} else {
  console.log('Niets bijzonders: geen sleutel komt boven de zeven plekken.\n')
}
