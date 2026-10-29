/**
 * `npm run beeldkosten -- [--generatief 30] [--lengte 900] [--per-maand 4]`
 *
 * Zet de vraag "zijn er goedkopere alternatieven" om in de enige beslissing
 * die hem beantwoordt: hoeveel seconden laat je genereren.
 */
import { MANIEREN, maxSeconden, raam } from './studio/beeldkosten.js'

const getal = (naam: string, standaard: number): number => {
  const i = process.argv.indexOf(`--${naam}`)
  const v = i >= 0 ? Number(process.argv[i + 1]) : NaN
  return Number.isFinite(v) ? v : standaard
}

const eur = (c: number) => `EUR ${(c / 100).toFixed(2)}`

const opzet = {
  videoSeconden: getal('lengte', 900),
  generatieveSeconden: getal('generatief', 30),
  beelden: getal('beelden', 31),
  videosPerMaand: getal('per-maand', 4),
  budgetCentsPerMaand: getal('budget', 10000),
}

console.log('\n============== WAT BEELD KOST ==============\n')
console.log(`  Aflevering:      ${opzet.videoSeconden} s (${(opzet.videoSeconden / 60).toFixed(0)} min)`)
console.log(`  Generatief:      ${opzet.generatieveSeconden} s per video`)
console.log(`  Per maand:       ${opzet.videosPerMaand} video's`)
console.log(`  Budget:          ${eur(opzet.budgetCentsPerMaand)}\n`)

for (const r of raam(opzet)) {
  const merk = r.past ? ' OK ' : 'STOP'
  console.log(`  [${merk}] ${r.manier.naam}`)
  console.log(`         ${eur(r.centsPerVideo)} per video · ${eur(r.centsPerMaand)} per maand`)
  console.log(`         ${r.manier.risico}\n`)
}

console.log('  Wat er in je budget past, per manier:\n')
for (const m of MANIEREN.filter((x) => x.centsPerSeconde > 0)) {
  const s = maxSeconden(m.centsPerSeconde, opzet.videosPerMaand, opzet.budgetCentsPerMaand)
  console.log(`    ${m.naam}: ${s} seconden per video`)
}
console.log('\n  De knop die telt is het aantal seconden, niet de prijs per seconde.')
console.log('  Van 900 naar 30 seconden scheelt een factor dertig; van 10 naar')
console.log('  4 cent een factor 2,5.\n')
