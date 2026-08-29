// Geluid, in vier lagen. De eerste die iets oplevert wint:
//
//   1. een eigen opname uit de studio (IndexedDB op dit apparaat)
//   2. een bestand in public/audio/
//   3. een externe reciteur — alleen voor de Koran, en alleen als hij aan staat
//   4. de stem van het apparaat — nooit voor de Koran
//
// Levert geen van vieren iets op, dan blijft het stil en zegt het scherm dat.
// Recitatie is geen voorleesstem: laag 4 komt bij de Koran niet aan bod.

import { AUDIO, letterUrl, woordUrl, ayaUrls } from '../data/bronnen.js';
import { sleutels, urlVan } from './opnames.js';

// Browsers nemen op in verschillende formaten, dus we proberen er meer dan één.
const EXTENSIES = ['mp3', 'm4a', 'ogg', 'webm', 'wav'];

let ctx = null;
const audioCtx = () => (ctx ||= new (window.AudioContext || window.webkitAudioContext)());

const bestaat = new Map(); // url -> Promise<boolean>

function heeftBestand(url) {
  if (!bestaat.has(url)) {
    bestaat.set(url, fetch(url, { method: 'HEAD' }).then((r) => r.ok).catch(() => false));
  }
  return bestaat.get(url);
}

/** Zet audio/letters/ba.mp3 om in dezelfde naam met elke bekende extensie. */
const metExtensies = (url) => {
  const kaal = url.replace(/\.[a-z0-9]+$/i, '');
  return EXTENSIES.map((e) => `${kaal}.${e}`);
};

let huidig = null;

function speelUrl(url) {
  return new Promise((klaar) => {
    try {
      huidig?.pause();
      const a = new Audio(url);
      huidig = a;
      a.onended = () => klaar(true);
      a.onerror = () => klaar(false);
      a.play().then(() => {}, () => klaar(false));
      // Niet wachten tot het einde: de aanroeper wil weten of het start.
      setTimeout(() => klaar(true), 120);
    } catch {
      klaar(false);
    }
  });
}

/** Speelt de eerste url die echt bestaat. */
async function speelEerste(urls) {
  for (const url of urls) {
    if (!(await heeftBestand(url))) continue;
    if (await speelUrl(url)) return true;
  }
  return false;
}

/** Laag 1: een opname uit de studio. */
async function speelOpname(sleutel) {
  const url = await urlVan(sleutel);
  if (!url) return false;
  return speelUrl(url);
}

// --- De stem van het apparaat --------------------------------------------

let stemmenBelofte = null;

/**
 * Stemmen komen op de meeste apparaten pas ná de eerste vraag binnen. Eén keer
 * netjes wachten scheelt een luisterknop die het "de eerste keer nooit doet".
 */
function stemmen() {
  if (stemmenBelofte) return stemmenBelofte;
  stemmenBelofte = new Promise((klaar) => {
    const synth = window.speechSynthesis;
    if (!synth) return klaar([]);
    const nu = synth.getVoices();
    if (nu.length) return klaar(nu);
    const opnieuw = () => {
      const lijst = synth.getVoices();
      if (lijst.length) { synth.removeEventListener('voiceschanged', opnieuw); klaar(lijst); }
    };
    synth.addEventListener('voiceschanged', opnieuw);
    setTimeout(() => { synth.removeEventListener('voiceschanged', opnieuw); klaar(synth.getVoices()); }, 2000);
  });
  return stemmenBelofte;
}

/** Liefst een stem uit Saoedi-Arabië; anders elke Arabische stem. */
async function besteStem() {
  const lijst = await stemmen();
  return lijst.find((s) => s.lang === 'ar-SA')
    || lijst.find((s) => s.lang?.replace('_', '-').startsWith('ar-'))
    || lijst.find((s) => s.lang?.startsWith('ar'))
    || null;
}

export async function heeftArabischeStem() {
  return Boolean(await besteStem());
}

/** Laat het apparaat Arabische tekst voorlezen. Geeft terug of dat lukte. */
export async function spreekUit(tekst, { snelheid = AUDIO.spraak.snelheid } = {}) {
  if (!AUDIO.spraak.aan || !window.speechSynthesis) return false;
  const stem = await besteStem();
  if (!stem) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(tekst);
  u.voice = stem;
  u.lang = stem.lang;
  u.rate = snelheid;
  u.pitch = 1;
  window.speechSynthesis.speak(u);
  return true;
}

// --- Wat de app aanroept --------------------------------------------------

const FATHA = 'َ';

/**
 * De naam van de letter: "baa", "taa". Dat is wat een kind eerst leert.
 */
export async function zegLetterNaam(letter) {
  const sleutel = sleutels.letter(letter.id);
  if (await speelOpname(sleutel)) return 'opname';
  if (await speelEerste(metExtensies(letterUrl(letter.id)))) return 'bestand';
  return (await spreekUit(letter.naamAr)) ? 'stem' : 'stil';
}

/**
 * De klank van de letter: "ba", "ta". We zetten er een fatha op, anders spelt
 * de voorleesstem de letternaam in plaats van de klank.
 */
export async function zegLetterKlank(letter) {
  const sleutel = sleutels.letter(`${letter.id}-klank`);
  if (await speelOpname(sleutel)) return 'opname';
  if (await speelEerste(metExtensies(letterUrl(`${letter.id}-klank`)))) return 'bestand';
  return (await spreekUit(letter.letter + FATHA)) ? 'stem' : 'stil';
}

/** Standaard doet de luisterknop de klank; dat is wat je nodig hebt om te lezen. */
export const zegLetter = zegLetterKlank;

export async function zegWoord(tekst, { themaId = null, index = null } = {}) {
  if (themaId !== null && index !== null) {
    if (await speelOpname(sleutels.woord(themaId, index))) return 'opname';
    if (await speelEerste(metExtensies(woordUrl(themaId, index)))) return 'bestand';
  }
  return (await spreekUit(tekst)) ? 'stem' : 'stil';
}

/** Koran: opname, bestand of reciteur — nooit een voorleesstem. */
export async function speelAya(soeraNr, ayaNr) {
  if (await speelOpname(sleutels.aya(soeraNr, ayaNr))) return 'opname';
  const [eigen, ...extern] = ayaUrls(soeraNr, ayaNr);
  if (await speelEerste(metExtensies(eigen))) return 'bestand';
  if (extern.length && await speelEerste(extern)) return 'reciteur';
  return 'stil';
}

export function stop() {
  huidig?.pause();
  huidig = null;
  window.speechSynthesis?.cancel();
}

/** Onthoudt niet dat een bestand ontbrak — na een import wil je opnieuw kijken. */
export const vergeetBestanden = () => bestaat.clear();

// --- Effectgeluidjes, opgewekt in de browser: geen bestanden nodig --------

function toon(frequenties, { duur = 0.12, volume = 0.18, vorm = 'sine' } = {}) {
  let c;
  try { c = audioCtx(); } catch { return; }
  if (c.state === 'suspended') c.resume();
  frequenties.forEach((f, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    const start = c.currentTime + i * duur;
    osc.type = vorm;
    osc.frequency.setValueAtTime(f, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duur);
    osc.connect(gain).connect(c.destination);
    osc.start(start);
    osc.stop(start + duur);
  });
}

export const klinkGoed = () => toon([660, 880], { duur: 0.11 });
export const klinkFout = () => toon([220, 165], { duur: 0.14, vorm: 'triangle', volume: 0.12 });
export const klinkKlaar = () => toon([523, 659, 784, 1047], { duur: 0.13 });
export const klinkTik = () => toon([440], { duur: 0.05, volume: 0.08 });
