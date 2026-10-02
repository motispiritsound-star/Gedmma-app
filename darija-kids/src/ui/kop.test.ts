/**
 * Elke bladzijde begint met één `h1`.
 *
 * Nagelopen over vijftien bladzijden: op elf stond er helemaal geen. Een
 * schermlezer springt met één toets naar de kop van een bladzijde — VoiceOver
 * en TalkBack beginnen daar allebei — en op die elf landde je dan nergens. Je
 * moest je vanaf de kopbalk omlaag werken om te horen waar je was.
 *
 * `SectionTitle` zette altijd een `h2`, en dat klopt waar hij een tussenkop
 * is: op /profiel is de `h1` de naam van het kind en hoort "Beloningen"
 * daaraan vast. Hij blijft dus `h2` tenzij de bladzijde zegt dat dit zijn
 * titel is.
 *
 * Nagemeten na afloop in de browser: alle vijftien bladzijden precies één
 * `h1`, geen enkele twee.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const lees = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8').replace(/\r\n/g, '\n')

/** De bladzijden waar `SectionTitle` de titel van de bladzijde is. */
const TITELS = [
  'Alphabet', 'Review', 'Unlock', 'Stories', 'Bonus', 'Parents',
  'Words', 'Privacy', 'Games', 'Settings', 'Terms', 'History',
]

describe('SectionTitle', () => {
  const kit = lees('./kit.tsx')

  it('zet een h2 tenzij je om een h1 vraagt', () => {
    expect(kit).toMatch(/kop = 'h2'/)
    expect(kit).toMatch(/kop\?: 'h1' \| 'h2'/)
    expect(kit).toMatch(/<Kop className=/)
  })
})

describe('de bladzijden die hun titel zo zetten', () => {
  it.each(TITELS)('%s vraagt om een h1', (naam) => {
    expect(lees(`../pages/${naam}.tsx`)).toMatch(/<SectionTitle kop="h1"/)
  })

  /**
   * En niet twee. Een bladzijde met twee `h1`'s is net zo verwarrend als een
   * zonder: de schermlezer springt dan naar de eerste die hij tegenkomt, en
   * dat is niet per se de titel.
   */
  it.each(TITELS)('%s vraagt er maar om één', (naam) => {
    const bron = lees(`../pages/${naam}.tsx`)
    expect(bron.match(/<SectionTitle kop="h1"/g)).toHaveLength(1)
  })

  /** Op /profiel staat de naam van het kind al als h1 boven de tussenkoppen. */
  it('Profile houdt zijn tussenkoppen op h2', () => {
    expect(lees('../pages/Profile.tsx')).not.toMatch(/<SectionTitle kop="h1"/)
    expect(lees('../pages/Profile.tsx')).toMatch(/<h1 /)
  })
})
