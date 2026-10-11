/**
 * Mag `npm run siteassets` wissen wat het niet terugzet?
 *
 * Nee, en dat was het jarenlang wel. Het script begon met
 * `rm(site-assets, { recursive: true })` — de hele map, in één keer. Dat
 * klopte toen het de enige was die daar schreef. Inmiddels zetten
 * `make-omslagen`, `make-deelplaat`, `make-sleutelplaat` en `make-citaten`
 * er ook hun werk neer: honderdeenentachtig bestanden die in git staan en die
 * `make-siteassets` niet terugmaakt.
 *
 * Eén run wiste ze dus allemaal. Het ergste is dat je dat niet merkt: de site
 * bouwt door zonder die platen, en wat je ziet is een lege plek waar een
 * boekomslag hoorde. Pas een `git status` met honderdtachtig verwijderde
 * bestanden vertelt het je, en dan alleen als je kijkt.
 *
 * Gevonden op 11 oktober, door dit script te willen draaien om een film met
 * een verkeerde prijs van de website te halen.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const WORTEL = new URL('../../', import.meta.url).pathname
const script = readFileSync(join(WORTEL, 'scripts', 'make-siteassets.mjs'), 'utf8').replace(/\r\n/g, '\n')

/** Wie schrijft er nog meer in site-assets, en zet dit script dat terug? */
const VAN_ANDEREN = ['boeken', 'sba', 'proefdeel', 'sleutels']
const EIGEN = ['shots', 'film']

describe('make-siteassets ruimt alleen zijn eigen werk op', () => {
  it('wist niet de hele map site-assets', () => {
    expect(script).not.toMatch(/rm\(\s*OUT\s*,/)
  })

  it('maar wel allebei de mappen die het zelf vult', () => {
    for (const map of EIGEN) {
      expect(script, map).toMatch(new RegExp(`rm\\(path\\.join\\(OUT, '${map}'`))
    }
  })

  /**
   * Niet "staat de naam er niet in" maar "wordt hij niet weggegooid": de
   * namen mogen in een uitleg staan, en in de uitleg hierboven staan ze ook.
   */
  it('en raakt niet aan wat vier andere scripts daar neerzetten', () => {
    for (const map of VAN_ANDEREN) {
      expect(script, map).not.toMatch(new RegExp(`rm\\([^)]*'${map}'`))
    }
  })

  /**
   * De schermen komen uit `store/screenshots/`, en die map is gitignored. In
   * een verse kloon staat hij er niet, en dan hoort wat er al in site-assets
   * ligt te blijven liggen in plaats van te verdwijnen.
   */
  it('en laat de schermen staan als er geen nieuwe zijn', () => {
    const blok = script.slice(script.indexOf("rm(path.join(OUT, 'film'"), script.indexOf('let total'))
    expect(blok).toMatch(/erZijnSchermen/)
    expect(blok).toMatch(/screenshots/)
  })
})
