/**
 * Een zip schrijven, zonder afhankelijkheden.
 *
 * De twee bundels moeten als één bestand naar de betaalpartner, en dat moet
 * lukken op de laptop van de schrijver. `zip` bestaat niet op Windows,
 * `Compress-Archive` niet op een Mac, en een pakket uit npm erbij halen om
 * drie bestanden te maken is zwaarder gereedschap dan het werk.
 *
 * Dus: het formaat zelf. Een zip is niet meer dan elk bestand met een kopje
 * ervoor, en achteraan een inhoudsopgave die zegt waar elk kopje begint.
 *
 * Wat hier met opzet niet in zit: zip64. Dat is nodig boven de vier gigabyte
 * of boven 65.535 bestanden, en de grootste bundel hier is negentig pdf's van
 * samen een halve gigabyte. Loopt dat ooit op, dan zegt deze code het eerlijk
 * in plaats van een stukke zip te schrijven.
 */
import { createWriteStream } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { deflateRawSync } from 'node:zlib'

const CRC_TABEL = (() => {
  const t = new Int32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  return t
})()

const crc32 = (buf) => {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = CRC_TABEL[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

/** De tijd zoals MS-DOS hem in 1980 opschreef; een zip kent niets anders. */
const dosTijd = (d) => ({
  tijd: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
  datum: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
})

/**
 * @param {string} pad waar de zip komt te staan
 * @param {{naam: string, bron?: string, inhoud?: Buffer|string}[]} bestanden
 *   `naam` is wat de koper straks ziet, met schuine strepen voor mappen.
 */
export async function schrijfZip(pad, bestanden) {
  if (bestanden.length > 0xffff) throw new Error('zip: meer dan 65.535 bestanden vraagt om zip64')

  const uit = createWriteStream(pad)
  const schrijf = (buf) => new Promise((klaar, fout) => uit.write(buf, (e) => (e ? fout(e) : klaar())))
  const { tijd, datum } = dosTijd(new Date())
  const inhoudsopgave = []
  let plek = 0

  for (const bestand of bestanden) {
    const rauw = bestand.inhoud !== undefined
      ? Buffer.from(bestand.inhoud)
      : await readFile(bestand.bron)
    // Een pdf is al ingepakt; nog eens persen kost tijd en levert niets op.
    const geperst = deflateRawSync(rauw)
    const inpakken = geperst.length < rauw.length * 0.98
    const data = inpakken ? geperst : rauw
    const methode = inpakken ? 8 : 0
    const naam = Buffer.from(bestand.naam, 'utf8')
    const som = crc32(rauw)

    const kop = Buffer.alloc(30)
    kop.writeUInt32LE(0x04034b50, 0)
    kop.writeUInt16LE(20, 4)
    kop.writeUInt16LE(0x0800, 6) // de naam staat in utf-8
    kop.writeUInt16LE(methode, 8)
    kop.writeUInt16LE(tijd, 10)
    kop.writeUInt16LE(datum, 12)
    kop.writeUInt32LE(som, 14)
    kop.writeUInt32LE(data.length, 18)
    kop.writeUInt32LE(rauw.length, 22)
    kop.writeUInt16LE(naam.length, 26)

    await schrijf(kop)
    await schrijf(naam)
    await schrijf(data)

    inhoudsopgave.push({ naam, methode, som, ingepakt: data.length, uitgepakt: rauw.length, plek })
    plek += kop.length + naam.length + data.length
    if (plek > 0xffffffff) throw new Error('zip: boven de vier gigabyte vraagt om zip64')
  }

  const begin = plek
  for (const r of inhoudsopgave) {
    const regel = Buffer.alloc(46)
    regel.writeUInt32LE(0x02014b50, 0)
    regel.writeUInt16LE(20, 4)
    regel.writeUInt16LE(20, 6)
    regel.writeUInt16LE(0x0800, 8)
    regel.writeUInt16LE(r.methode, 10)
    regel.writeUInt16LE(tijd, 12)
    regel.writeUInt16LE(datum, 14)
    regel.writeUInt32LE(r.som, 16)
    regel.writeUInt32LE(r.ingepakt, 20)
    regel.writeUInt32LE(r.uitgepakt, 24)
    regel.writeUInt16LE(r.naam.length, 28)
    regel.writeUInt32LE(r.plek, 42)
    await schrijf(regel)
    await schrijf(r.naam)
    plek += regel.length + r.naam.length
  }

  const slot = Buffer.alloc(22)
  slot.writeUInt32LE(0x06054b50, 0)
  slot.writeUInt16LE(inhoudsopgave.length, 8)
  slot.writeUInt16LE(inhoudsopgave.length, 10)
  slot.writeUInt32LE(plek - begin, 12)
  slot.writeUInt32LE(begin, 16)
  await schrijf(slot)

  await new Promise((klaar, fout) => uit.end((e) => (e ? fout(e) : klaar())))
}
