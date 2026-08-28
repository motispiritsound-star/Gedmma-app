// Waar geluid vandaan komt. Alles is optioneel: de app werkt ook zonder.
//
// 1. Eigen opnames in public/audio/ hebben altijd voorrang. Zet ze neer als:
//      audio/letters/<letter-id>.mp3        bijv. audio/letters/ba.mp3
//      audio/woorden/<thema>/<index>.mp3    bijv. audio/woorden/kleuren/0.mp3
//      audio/koran/<soera>/<aya>.mp3        bijv. audio/koran/114/1.mp3
// 2. Is er geen opname, dan leest de spraakmodule van het apparaat de
//    letter of het woord voor — als er een Arabische stem beschikbaar is.
// 3. Voor de Koran gebeurt dat NOOIT. Recitatie is geen voorleesstem.
//    Zonder opname blijft het stil en zie je een nette melding.

export const AUDIO = {
  /** Map met eigen opnames, relatief aan public/. */
  eigenBasis: 'audio',

  /**
   * Optionele externe reciteur. Uit gezet: zet `aan: true` en kies een bron
   * die je zelf mag gebruiken. De app vult {soera} (3 cijfers) en {aya}
   * (3 cijfers) in. Zet dit alleen aan als je weet dat het mag én werkt.
   */
  reciteur: {
    aan: false,
    naam: '',
    sjabloon: '',
  },

  /** Stem van het apparaat, voor letters en losse woorden. */
  spraak: {
    aan: true,
    taal: 'ar-SA',
    snelheid: 0.75,
  },
};

/** URL van een eigen opname van een letter. */
export const letterUrl = (id) => `${AUDIO.eigenBasis}/letters/${id}.mp3`;

/** URL van een eigen opname van een woord uit een thema. */
export const woordUrl = (thema, i) => `${AUDIO.eigenBasis}/woorden/${thema}/${i}.mp3`;

/** URL's voor een aya: eerst de eigen opname, daarna de externe reciteur. */
export function ayaUrls(soeraNr, ayaNr) {
  const uit = [`${AUDIO.eigenBasis}/koran/${soeraNr}/${ayaNr}.mp3`];
  const r = AUDIO.reciteur;
  if (r.aan && r.sjabloon) {
    uit.push(
      r.sjabloon
        .replace('{soera}', String(soeraNr).padStart(3, '0'))
        .replace('{aya}', String(ayaNr).padStart(3, '0')),
    );
  }
  return uit;
}
