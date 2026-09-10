// Accounts: een e-mailadres, een wachtwoord, en een sessie die dertig dagen
// meegaat. Meer heeft een abonnement niet nodig.
//
// Het account is van de ouder, niet van het kind. In de app zelf zit geen
// account en geen naam van een kind: de voortgang blijft op het apparaat staan.
// Wat hier ligt is een mailadres en een betaalstatus, en dat is bewust het
// minimum — het scheelt een berg verplichtingen onder de AVG.

import { createHmac, randomBytes, scrypt as scryptTerug, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptTerug);

const SESSIE_DUUR = 30 * 24 * 3600 * 1000;   // dertig dagen

// --- Wachtwoorden ---------------------------------------------------------

/**
 * scrypt met de standaardkosten van Node: langzaam genoeg dat een gestolen
 * bestand niet in een middag te kraken is, snel genoeg om bij het inloggen
 * niet op te vallen. Het zout staat bij de hash; er is geen tweede geheim
 * nodig om te kunnen controleren.
 */
export async function hashWachtwoord(wachtwoord) {
  const zout = randomBytes(16);
  const sleutel = await scrypt(wachtwoord.normalize('NFKC'), zout, 64);
  return `scrypt$${zout.toString('base64')}$${sleutel.toString('base64')}`;
}

export async function klopWachtwoord(wachtwoord, opgeslagen) {
  const [soort, zout, sleutel] = String(opgeslagen || '').split('$');
  if (soort !== 'scrypt' || !zout || !sleutel) return false;
  const verwacht = Buffer.from(sleutel, 'base64');
  const gekregen = await scrypt(String(wachtwoord).normalize('NFKC'), Buffer.from(zout, 'base64'), verwacht.length);
  return timingSafeEqual(verwacht, gekregen);
}

/**
 * Wat een wachtwoord minstens moet zijn. Geen eisen over hoofdletters en
 * leestekens: die leveren aantoonbaar zwakkere wachtwoorden op dan gewoon
 * "maak het langer".
 */
export function keurWachtwoord(wachtwoord) {
  const w = String(wachtwoord || '');
  if (w.length < 10) return 'Kies een wachtwoord van minstens tien tekens.';
  if (w.length > 200) return 'Dat wachtwoord is wel erg lang.';
  return null;
}

/** Genoeg om te weten dat er een @ en een punt in zit; de rest bewijst de mail. */
export function keurEmail(email) {
  const e = String(email || '').trim();
  if (e.length < 5 || e.length > 254) return 'Vul een geldig e-mailadres in.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return 'Vul een geldig e-mailadres in.';
  return null;
}

// --- Sessies --------------------------------------------------------------

/**
 * Een sessie is een ondertekend koekje, geen rij in een tabel. Dat scheelt
 * opslag en maakt uitloggen op de server een non-event; de keerzijde is dat
 * een gestolen koekje geldig blijft tot het verloopt. Voor een abonnement op
 * een leer-app is die afweging in orde.
 */
export function maakSessie(accountId, geheim, nu = Date.now()) {
  const romp = `${accountId}.${nu}`;
  return `${romp}.${onderteken(romp, geheim)}`;
}

export function leesSessie(koekje, geheim, nu = Date.now()) {
  const stukken = String(koekje || '').split('.');
  if (stukken.length !== 3) return null;
  const [accountId, uitgegeven, handtekening] = stukken;
  const verwacht = onderteken(`${accountId}.${uitgegeven}`, geheim);
  if (!gelijk(handtekening, verwacht)) return null;
  const tijd = Number(uitgegeven);
  if (!Number.isFinite(tijd) || nu - tijd > SESSIE_DUUR) return null;
  return accountId;
}

const onderteken = (tekst, geheim) =>
  createHmac('sha256', geheim).update(tekst).digest('base64url');

/** Vergelijken zonder te verklappen hoeveel tekens er klopten. */
function gelijk(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

export const nieuwId = () => `a${Date.now().toString(36)}${randomBytes(6).toString('hex')}`;

// --- Te veel pogingen -----------------------------------------------------

/**
 * Een teller per sleutel (e-mailadres of IP) die vanzelf leegloopt. Houdt het
 * gokken van wachtwoorden tegen zonder dat er een dienst bij moet.
 */
export class Teller {
  constructor({ max = 10, venster = 15 * 60 * 1000 } = {}) {
    this.max = max;
    this.venster = venster;
    this.pogingen = new Map();
  }

  teVaak(sleutel, nu = Date.now()) {
    const lijst = (this.pogingen.get(sleutel) || []).filter((t) => nu - t < this.venster);
    if (lijst.length) this.pogingen.set(sleutel, lijst); else this.pogingen.delete(sleutel);
    return lijst.length >= this.max;
  }

  tel(sleutel, nu = Date.now()) {
    const lijst = (this.pogingen.get(sleutel) || []).filter((t) => nu - t < this.venster);
    lijst.push(nu);
    this.pogingen.set(sleutel, lijst);
    // De kaart mag niet eindeloos groeien als iemand met duizend adressen komt.
    if (this.pogingen.size > 5000) this.ruimOp(nu);
  }

  vergeet(sleutel) { this.pogingen.delete(sleutel); }

  ruimOp(nu = Date.now()) {
    for (const [sleutel, lijst] of this.pogingen) {
      if (!lijst.some((t) => nu - t < this.venster)) this.pogingen.delete(sleutel);
    }
  }
}
