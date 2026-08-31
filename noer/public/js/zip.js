// Een minimale zip-schrijver: alleen opslaan, niet comprimeren. Audio is al
// gecomprimeerd, dus daar valt niets te winnen — en dit scheelt een
// afhankelijkheid van een halve megabyte.

const CRC_TABEL = (() => {
  const tabel = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabel[i] = c >>> 0;
  }
  return tabel;
})();

export function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABEL[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Datum en tijd in het formaat dat zip uit MS-DOS heeft geërfd. */
function dosTijd(datum) {
  const jaar = Math.max(1980, datum.getFullYear());
  return {
    tijd: (datum.getHours() << 11) | (datum.getMinutes() << 5) | (datum.getSeconds() >> 1),
    datum: ((jaar - 1980) << 9) | ((datum.getMonth() + 1) << 5) | datum.getDate(),
  };
}

/**
 * @param bestanden [{ naam, data: Uint8Array }]
 * @returns Uint8Array met de hele zip
 */
export function zipBytes(bestanden, opTijdstip = new Date()) {
  const { tijd, datum } = dosTijd(opTijdstip);
  const coderen = new TextEncoder();

  const stukken = [];
  const centraal = [];
  let verschuiving = 0;

  for (const bestand of bestanden) {
    const naam = coderen.encode(bestand.naam);
    const data = bestand.data;
    const som = crc32(data);

    const kop = new DataView(new ArrayBuffer(30));
    kop.setUint32(0, 0x04034b50, true);
    kop.setUint16(4, 20, true);
    kop.setUint16(6, 0x0800, true); // namen in UTF-8
    kop.setUint16(8, 0, true);      // methode 0 = opslaan
    kop.setUint16(10, tijd, true);
    kop.setUint16(12, datum, true);
    kop.setUint32(14, som, true);
    kop.setUint32(18, data.length, true);
    kop.setUint32(22, data.length, true);
    kop.setUint16(26, naam.length, true);
    kop.setUint16(28, 0, true);

    stukken.push(new Uint8Array(kop.buffer), naam, data);

    const regel = new DataView(new ArrayBuffer(46));
    regel.setUint32(0, 0x02014b50, true);
    regel.setUint16(4, 20, true);
    regel.setUint16(6, 20, true);
    regel.setUint16(8, 0x0800, true);
    regel.setUint16(10, 0, true);
    regel.setUint16(12, tijd, true);
    regel.setUint16(14, datum, true);
    regel.setUint32(16, som, true);
    regel.setUint32(20, data.length, true);
    regel.setUint32(24, data.length, true);
    regel.setUint16(28, naam.length, true);
    regel.setUint32(42, verschuiving, true);
    centraal.push(new Uint8Array(regel.buffer), naam);

    verschuiving += 30 + naam.length + data.length;
  }

  const centraalLengte = centraal.reduce((n, s) => n + s.length, 0);
  const staart = new DataView(new ArrayBuffer(22));
  staart.setUint32(0, 0x06054b50, true);
  staart.setUint16(8, bestanden.length, true);
  staart.setUint16(10, bestanden.length, true);
  staart.setUint32(12, centraalLengte, true);
  staart.setUint32(16, verschuiving, true);

  const alles = [...stukken, ...centraal, new Uint8Array(staart.buffer)];
  const totaal = alles.reduce((n, s) => n + s.length, 0);
  const uit = new Uint8Array(totaal);
  let waar = 0;
  for (const stuk of alles) { uit.set(stuk, waar); waar += stuk.length; }
  return uit;
}

export const zipBlob = (bestanden) =>
  new Blob([zipBytes(bestanden)], { type: 'application/zip' });
