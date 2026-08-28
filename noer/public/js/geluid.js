// Drie lagen geluid, in deze volgorde:
//   1. een eigen opname (mp3 in public/audio/)
//   2. de spraakmodule van het apparaat — alleen voor letters en woorden
//   3. stilte, met een nette melding in beeld
// Voor de Koran wordt laag 2 nooit gebruikt: recitatie is geen voorleesstem.

import { AUDIO, letterUrl, woordUrl, ayaUrls } from '../data/bronnen.js';

let ctx = null;
const audioCtx = () => (ctx ||= new (window.AudioContext || window.webkitAudioContext)());

const bestaat = new Map(); // url -> Promise<boolean>

function heeftBestand(url) {
  if (!bestaat.has(url)) {
    bestaat.set(url, fetch(url, { method: 'HEAD' }).then((r) => r.ok).catch(() => false));
  }
  return bestaat.get(url);
}

let huidig = null;

/** Speelt de eerste url die echt bestaat. Geeft true als er geluid klonk. */
async function speelEerste(urls) {
  for (const url of urls) {
    if (!(await heeftBestand(url))) continue;
    try {
      huidig?.pause();
      const a = new Audio(url);
      huidig = a;
      await a.play();
      return true;
    } catch {
      // Autoplay geweigerd of bestand stuk: probeer de volgende.
    }
  }
  return false;
}

let stemmen = [];
const laadStemmen = () => { stemmen = window.speechSynthesis?.getVoices?.() || []; };
if (window.speechSynthesis) {
  laadStemmen();
  window.speechSynthesis.addEventListener('voiceschanged', laadStemmen);
}

export const heeftArabischeStem = () => stemmen.some((s) => s.lang?.startsWith('ar'));

/** Laat het apparaat Arabische tekst voorlezen. Geeft true als dat lukte. */
export function spreekUit(tekst) {
  if (!AUDIO.spraak.aan || !window.speechSynthesis) return false;
  const stem = stemmen.find((s) => s.lang?.startsWith('ar'));
  if (!stem) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(tekst);
  u.voice = stem;
  u.lang = stem.lang;
  u.rate = AUDIO.spraak.snelheid;
  window.speechSynthesis.speak(u);
  return true;
}

/** Resultaat: 'opname' | 'stem' | 'stil' — het scherm kan dat laten zien. */
export async function zegLetter(letter) {
  if (await speelEerste([letterUrl(letter.id)])) return 'opname';
  return spreekUit(letter.letter) ? 'stem' : 'stil';
}

export async function zegWoord(tekst, { themaId = null, index = null } = {}) {
  const urls = themaId !== null && index !== null ? [woordUrl(themaId, index)] : [];
  if (urls.length && (await speelEerste(urls))) return 'opname';
  return spreekUit(tekst) ? 'stem' : 'stil';
}

/** Koran: alleen echte recitatie, nooit een computerstem. */
export async function speelAya(soeraNr, ayaNr) {
  return (await speelEerste(ayaUrls(soeraNr, ayaNr))) ? 'opname' : 'stil';
}

export function stop() {
  huidig?.pause();
  huidig = null;
  window.speechSynthesis?.cancel();
}

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
