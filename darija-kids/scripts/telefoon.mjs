/**
 * De app op je eigen telefoon openen, over je wifi.
 *
 * Er is één test die geen laptop kan doen: de app in een hand, met geluid,
 * met een duim. Op iOS is dat bovendien de enige plek waar je ziet wat de
 * spraakengine met de audiosessie doet — een browser op een laptop doet dat
 * anders, en juist daar zaten de fouten.
 *
 *   npm run telefoon
 *
 * Hij bouwt de app, zet hem op het netwerk en zegt welk adres je op je
 * telefoon moet intikken. Telefoon en laptop moeten op hetzelfde wifi zitten.
 * Windows vraagt de eerste keer of node door de firewall mag: ja, en dan
 * "privé-netwerken" aangevinkt laten.
 *
 * Stoppen met Ctrl+C.
 */
import { execFileSync, spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const POORT = 4173

/** De adressen waarop een ander apparaat deze machine kan vinden. */
function adressen() {
  const uit = []
  for (const [naam, lijst] of Object.entries(os.networkInterfaces())) {
    for (const net of lijst ?? []) {
      if (net.family !== 'IPv4' || net.internal) continue
      uit.push({ naam, adres: net.address })
    }
  }
  // Een thuisnetwerk zit bijna altijd in 192.168.x.x; die eerst, want dat is
  // negen van de tien keer de goede.
  return uit.sort((a, b) => Number(b.adres.startsWith('192.168.')) - Number(a.adres.startsWith('192.168.')))
}

console.log('\nDe app bouwen ...\n')
execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build:app'], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

const gevonden = adressen()
console.log('\n' + '─'.repeat(52))
if (gevonden.length === 0) {
  console.log('\nGeen netwerkadres gevonden. Zit deze computer wel op wifi?\n')
} else {
  console.log('\nTik dit in op je telefoon, in Safari of Chrome:\n')
  for (const { naam, adres } of gevonden) {
    console.log(`    http://${adres}:${POORT}${gevonden.length > 1 ? `      (${naam})` : ''}`)
  }
  if (gevonden.length > 1) console.log('\nWerkt de eerste niet, probeer dan de volgende.')
}
console.log('\nTelefoon en computer moeten op hetzelfde wifi zitten.')
console.log('\nWat je hier niet ziet, en wat dus geen fout is: de naspreekoefening')
console.log('zegt "geen microfoon". Een browser geeft de microfoon alleen vrij op')
console.log('https, en dit adres is http. Ook het startscherm en de abonnementen')
console.log('horen bij de winkelversie; die test je via TestFlight, zie docs/MAC.md.')
console.log('\nStoppen: Ctrl+C\n')
console.log('─'.repeat(52) + '\n')

spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', 'preview', '--port', String(POORT), '--host'], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})
