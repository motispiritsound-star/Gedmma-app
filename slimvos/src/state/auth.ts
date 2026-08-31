import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { gratisAbonnement } from '../core/abonnement/toegang';
import { AuthFout, type Aanmeldgegevens, type AuthPoort, type Ouder } from '../core/account/types';
import { controleerEmail, controleerNaam, controleerWachtwoord, normaliseerEmail } from '../core/account/validatie';

const OUDERS = 'slimvos.ouders.v1';
const SESSIE = 'slimvos.sessie.v1';

/**
 * Accountbeheer op het toestel zelf.
 *
 * LET OP — dit is een volwaardige implementatie van de flow, maar geen
 * volwaardige beveiliging: de gegevens staan lokaal en er is geen server die
 * iets verifieert. Voor de winkelversie hoort hier een echte dienst achter
 * (Supabase, Firebase of een eigen API). Omdat alles via `AuthPoort` loopt,
 * is dat één bestand vervangen — de schermen hoeven niet mee te veranderen.
 */
async function hash(wachtwoord: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${wachtwoord}`);
}

function nieuwSalt(): string {
  return Array.from(Crypto.getRandomBytes(16))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function alleOuders(): Promise<Ouder[]> {
  try {
    const ruw = await AsyncStorage.getItem(OUDERS);
    const lijst = ruw ? JSON.parse(ruw) : [];
    return Array.isArray(lijst) ? lijst : [];
  } catch {
    return [];
  }
}

async function bewaarAlle(lijst: Ouder[]): Promise<void> {
  await AsyncStorage.setItem(OUDERS, JSON.stringify(lijst));
}

export const lokaleAuth: AuthPoort = {
  async huidigeOuder() {
    const id = await AsyncStorage.getItem(SESSIE);
    if (!id) return null;
    return (await alleOuders()).find((o) => o.id === id) ?? null;
  },

  async registreer(gegevens: Aanmeldgegevens) {
    const emailFout = controleerEmail(gegevens.email);
    if (emailFout) throw new AuthFout(emailFout, 'email');
    const naamFout = controleerNaam(gegevens.naam);
    if (naamFout) throw new AuthFout(naamFout, 'naam');
    const wwFout = controleerWachtwoord(gegevens.wachtwoord);
    if (wwFout) throw new AuthFout(wwFout, 'wachtwoord');

    const email = normaliseerEmail(gegevens.email);
    const ouders = await alleOuders();
    if (ouders.some((o) => o.email === email)) {
      throw new AuthFout('Er bestaat al een account met dit e-mailadres.', 'email');
    }

    const salt = nieuwSalt();
    const ouder: Ouder = {
      id: `o_${Date.now().toString(36)}`,
      email,
      naam: gegevens.naam.trim(),
      wachtwoordHash: await hash(gegevens.wachtwoord, salt),
      salt,
      aangemaakt: Date.now(),
      abonnement: gratisAbonnement(),
      pincode: null,
      nieuwsbrief: gegevens.nieuwsbrief,
    };
    await bewaarAlle([...ouders, ouder]);
    await AsyncStorage.setItem(SESSIE, ouder.id);
    return ouder;
  },

  async logIn(email: string, wachtwoord: string) {
    const ouders = await alleOuders();
    const ouder = ouders.find((o) => o.email === normaliseerEmail(email));
    // Bewust dezelfde melding voor een onbekend adres en een fout wachtwoord,
    // zodat je niet kunt uitvissen welke adressen bestaan.
    const misluk = () => new AuthFout('E-mailadres of wachtwoord klopt niet.', 'wachtwoord');
    if (!ouder) throw misluk();
    if ((await hash(wachtwoord, ouder.salt)) !== ouder.wachtwoordHash) throw misluk();
    await AsyncStorage.setItem(SESSIE, ouder.id);
    return ouder;
  },

  async logUit() {
    await AsyncStorage.removeItem(SESSIE);
  },

  async vraagHerstel(email: string) {
    const fout = controleerEmail(email);
    if (fout) throw new AuthFout(fout, 'email');
    // Zonder server valt er niets te mailen. De schermen tonen daarom altijd
    // dezelfde bevestiging — wat ook het gedrag is dat je uiteindelijk wilt.
  },

  async wijzigWachtwoord(oud: string, nieuw: string) {
    const ouder = await this.huidigeOuder();
    if (!ouder) throw new AuthFout('Je bent niet ingelogd.');
    if ((await hash(oud, ouder.salt)) !== ouder.wachtwoordHash) {
      throw new AuthFout('Je huidige wachtwoord klopt niet.', 'wachtwoord');
    }
    const fout = controleerWachtwoord(nieuw);
    if (fout) throw new AuthFout(fout, 'wachtwoord');
    const salt = nieuwSalt();
    await this.bewaarOuder({ ...ouder, salt, wachtwoordHash: await hash(nieuw, salt) });
  },

  async bewaarOuder(ouder: Ouder) {
    const ouders = await alleOuders();
    await bewaarAlle(ouders.map((o) => (o.id === ouder.id ? ouder : o)));
  },

  async verwijderAccount() {
    const ouder = await this.huidigeOuder();
    if (!ouder) return;
    const ouders = await alleOuders();
    await bewaarAlle(ouders.filter((o) => o.id !== ouder.id));
    await AsyncStorage.removeItem(SESSIE);
  },
};
