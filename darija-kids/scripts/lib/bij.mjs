/**
 * Loopt deze map achter op wat er op GitHub staat?
 *
 * Nodig omdat het antwoord daarop vier keer op rij "ja" was zonder dat iemand
 * het merkte. Een opdracht die net is toegevoegd bestaat dan nog niet
 * ("Missing script"), een opdracht die net is gerepareerd draait nog in zijn
 * oude vorm, en — het vervelendst — `npm run deploy` zet dan een worker live
 * van dagen geleden terwijl je denkt dat je de reparatie uitrolt.
 *
 * Dat is geen vergeetachtigheid maar een ontwerpfout: als de enige manier om
 * te weten of je bij bent, is dat je eraan denkt, dan weet je het niet.
 *
 * Eén `git fetch` kost een seconde of twee. Dat is goedkoper dan één ronde
 * verkeerd zoeken.
 */
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

const git = (argumenten) =>
  execFileSync('git', ['-C', ROOT, ...argumenten], { encoding: 'utf8', stdio: 'pipe' }).trim()

/**
 * Hoeveel commits deze map achterloopt, of `null` als het niet te zeggen is.
 *
 * Geen git, geen netwerk, geen bovenstroom: dan zeggen we niets. Een opdracht
 * hoort niet om te vallen omdat de wifi even weg is.
 */
export function hoeveelAchter() {
  try {
    git(['fetch', '--quiet'])
    const achter = git(['rev-list', '--count', 'HEAD..@{u}'])
    return Number(achter) || 0
  } catch {
    return null
  }
}

/**
 * Zegt het als je achterloopt. Geeft terug of dat zo is.
 *
 * `streng` zet er een vraag achter: doorgaan of niet. Dat is voor het
 * uitrollen — daar is achterlopen niet vervelend maar verkeerd.
 */
export async function kijkOfJeBijBent({ streng = false } = {}) {
  const achter = hoeveelAchter()
  if (!achter) return false

  console.log('\n' + '─'.repeat(60))
  console.log(`\nDeze map loopt ${achter} ${achter === 1 ? 'commit' : 'commits'} achter op GitHub.`)
  console.log('\nJe draait dus een oudere versie dan er klaarstaat. Ophalen:\n')
  console.log(`  git -C ${ROOT} pull\n`)
  console.log('─'.repeat(60) + '\n')

  if (!streng || !process.stdin.isTTY) return true

  const { createInterface } = await import('node:readline/promises')
  const lezer = createInterface({ input: process.stdin, output: process.stdout })
  let antwoord = 'n'
  try {
    antwoord = (await lezer.question('Toch doorgaan met de oude versie? (j/n): ')).trim().toLowerCase()
  } catch { /* afgebroken telt als nee */ }
  lezer.close()
  if (antwoord !== 'j' && antwoord !== 'ja') {
    console.log('\nGestopt. Haal eerst op.\n')
    process.exit(0)
  }
  return true
}
