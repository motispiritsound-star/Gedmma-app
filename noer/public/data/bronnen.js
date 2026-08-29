// Waar geluid vandaan komt. Alles is optioneel: de app werkt ook zonder.
//
// 1. Eigen opnames uit de studio (IndexedDB) gaan voor alles.
// 2. Daarna bestanden in public/audio/. Zet ze neer als:
//      audio/letters/<letter-id>.mp3        bijv. audio/letters/ba.mp3
//      audio/letters/<letter-id>-klank.mp3  de klank in plaats van de naam
//      audio/woorden/<thema>/<index>.mp3    bijv. audio/woorden/kleuren/0.mp3
//      audio/koran/<soera>/<aya>.mp3        bijv. audio/koran/114/1.mp3
// 3. Voor de Koran daarna een externe reciteur, als je die aanzet.
// 4. Voor letters en woorden tot slot de stem van het apparaat.
//    Voor de Koran gebeurt dat NOOIT: recitatie is geen voorleesstem.

/**
 * Reciteurs die je kunt gebruiken, met het adres waar hun aya-bestanden staan.
 *
 * LET OP — dit is een adreslijst, geen licentie. Een recitatie is een opname
 * van een mens; of jij die mag downloaden, meeleveren of streamen hangt af van
 * de reciteur en de uitgever, niet van hoe bekend de opname is. Zoek dat uit
 * voordat je een app uitgeeft, en vermeld altijd wie er reciteert.
 *
 * De mapnamen hieronder zijn niet ter plekke gecontroleerd. Controleer ze in
 * één seconde met:  node tools/haal-recitatie.js --bron alafasy --proef
 */
export const RECITEURS = {
  alafasy: {
    naam: 'Mishary Rashid Alafasy',
    stijl: 'Murattal — rustig en helder, veel gebruikt bij kinderen',
    sjabloon: 'https://everyayah.com/data/Alafasy_128kbps/{soera}{aya}.mp3',
  },
  sudais: {
    naam: 'Abdurrahman As-Sudais',
    stijl: 'Murattal — imam van de Masjid al-Haram',
    sjabloon: 'https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/{soera}{aya}.mp3',
  },
  husary_muallim: {
    naam: 'Mahmoud Khalil Al-Husary (muʿallim)',
    stijl: 'De leraar-opname: hij reciteert langzaam, met ruimte om na te zeggen',
    sjabloon: 'https://everyayah.com/data/Husary_Muallim_128kbps/{soera}{aya}.mp3',
  },
  husary: {
    naam: 'Mahmoud Khalil Al-Husary',
    stijl: 'Murattal — de klassieke leesopname',
    sjabloon: 'https://everyayah.com/data/Husary_128kbps/{soera}{aya}.mp3',
  },
  minshawi: {
    naam: 'Mohamed Siddiq El-Minshawi',
    stijl: 'Murattal — warm en langzaam',
    sjabloon: 'https://everyayah.com/data/Minshawy_Murattal_128kbps/{soera}{aya}.mp3',
  },
};

export const AUDIO = {
  /** Map met eigen opnames, relatief aan public/. */
  eigenBasis: 'audio',

  /**
   * Streamen tijdens het spelen. Standaard uit: de app is offline-first, en
   * gedownloade bestanden in public/audio/koran/ zijn sneller en betrouwbaarder.
   * Zet `aan: true` en kies een sleutel uit RECITEURS als je wilt streamen.
   */
  reciteur: {
    aan: false,
    keuze: 'alafasy',
  },

  /** Stem van het apparaat, voor letters en losse woorden. */
  spraak: {
    aan: true,
    taal: 'ar-SA',
    snelheid: 0.75,
  },
};

/** De reciteur die nu aanstaat, of null. */
export function reciteurNu() {
  if (!AUDIO.reciteur.aan) return null;
  return RECITEURS[AUDIO.reciteur.keuze] || null;
}

const drie = (n) => String(n).padStart(3, '0');

/** Vult {soera} {aya} (drie cijfers) en {soera2} {aya2} (kaal) in. */
export const vulIn = (sjabloon, soeraNr, ayaNr) => sjabloon
  .replaceAll('{soera}', drie(soeraNr)).replaceAll('{aya}', drie(ayaNr))
  .replaceAll('{soera2}', String(soeraNr)).replaceAll('{aya2}', String(ayaNr));

/** URL van een eigen opname van een letter. */
export const letterUrl = (id) => `${AUDIO.eigenBasis}/letters/${id}.mp3`;

/** URL van een eigen opname van een woord uit een thema. */
export const woordUrl = (thema, i) => `${AUDIO.eigenBasis}/woorden/${thema}/${i}.mp3`;

/** URL's voor een aya: eerst de eigen opname, daarna de reciteur als die aanstaat. */
export function ayaUrls(soeraNr, ayaNr) {
  const uit = [`${AUDIO.eigenBasis}/koran/${soeraNr}/${ayaNr}.mp3`];
  const r = reciteurNu();
  if (r?.sjabloon) uit.push(vulIn(r.sjabloon, soeraNr, ayaNr));
  return uit;
}
