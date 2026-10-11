/**
 * Belooft het bijschrift bij het alfabet hetzelfde aantal letters als er staat?
 *
 * Het stond er jarenlang naast. `alphabet.uitleg` zei in alle zes talen
 * "28 letters plus drie Marokkaanse extra's", en `Alphabet.tsx` rendert
 * `LETTERS.map()` -- achtentwintig tegels, eindigend op ي. De drie extra's
 * zijn er met opzet uit: `src/content/alphabet.ts` legt uit waarom, en
 * `content.test.ts` zet `LETTERS.length` op 28 vast.
 *
 * Alleen het bijschrift wist het niet. Elke ouder op het alfabetscherm las
 * een belofte die de app bewust niet waarmaakt, en wie Arabisch leest ziet
 * in één oogopslag dat de rij bij ي ophoudt. Het stond ook in de promofilm,
 * die naar de App Store, Google Play en TikTok gaat.
 *
 * Gevonden op 11 oktober door elk beeld van die film na te kijken -- niet
 * door een test, want er was er geen. Deze dus: het getal in het bijschrift
 * wordt naast `LETTERS.length` gelegd, in elke taal.
 */
import { describe, expect, it } from 'vitest'
import { STRINGS } from '.'
import { LANG_CODES } from './languages'
import { LETTERS } from '../content/alphabet'

describe('het bijschrift bij het alfabet', () => {
  it('noemt in elke taal het aantal letters dat er echt is', () => {
    for (const taal of LANG_CODES) {
      const tekst = STRINGS[taal].alphabet.uitleg
      const getallen = (tekst.match(/\d+/g) ?? []).map(Number)
      expect(getallen, `${taal}: ${tekst}`).toEqual([LETTERS.length])
    }
  })

  /**
   * Niet alleen "het eerste getal klopt": er mag geen tweede getal in staan.
   * De oude tekst had er twee -- 28 én drie -- en het eerste was juist.
   */
  it('en belooft er niet stiekem nog een paar bij', () => {
    for (const taal of LANG_CODES) {
      const tekst = STRINGS[taal].alphabet.uitleg
      expect(tekst, taal).not.toMatch(/\bdrie\b|\btrois\b|\bdrei\b|\btres\b|\btre\b|\bthree\b/i)
    }
  })
})
