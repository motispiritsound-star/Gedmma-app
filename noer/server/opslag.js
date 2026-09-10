// De opslag: één JSON-bestand, in het geheugen gehouden, atomair weggeschreven.
//
// Waarom geen database? Omdat dit een abonnementenlijst is en geen datawarehouse.
// Bij duizend abonnees is dit bestand nog geen megabyte. Schrijven gaat via een
// tijdelijk bestand en een rename, zodat een stroomstoring midden in het
// schrijven geen half bestand achterlaat. Groei je hieruit, dan vervang je dit
// bestand — de rest van de server raakt de opslag alleen via deze functies.

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const leeg = () => ({ versie: 1, accounts: {}, opEmail: {}, opKlant: {} });

export class Opslag {
  constructor(pad) {
    this.pad = pad;
    this.staat = leeg();
    this.schrijft = null;
    this.opnieuw = false;
  }

  async open() {
    try {
      this.staat = { ...leeg(), ...JSON.parse(await readFile(this.pad, 'utf8')) };
    } catch (fout) {
      if (fout.code !== 'ENOENT') throw fout;
      await mkdir(dirname(this.pad), { recursive: true });
      await this.bewaar();
    }
    return this;
  }

  /**
   * Wegschrijven, maar nooit twee keer tegelijk: loopt er al een schrijfbeurt,
   * dan wordt er één extra ingepland. Anders kunnen twee webhooks die vlak na
   * elkaar binnenkomen elkaars bestand overschrijven.
   */
  async bewaar() {
    if (this.schrijft) { this.opnieuw = true; return this.schrijft; }
    this.schrijft = (async () => {
      do {
        this.opnieuw = false;
        const tijdelijk = `${this.pad}.${process.pid}.tmp`;
        await writeFile(tijdelijk, JSON.stringify(this.staat, null, 2));
        await rename(tijdelijk, this.pad);
      } while (this.opnieuw);
    })().finally(() => { this.schrijft = null; });
    return this.schrijft;
  }

  account(id) { return this.staat.accounts[id] || null; }

  accountOpEmail(email) {
    const id = this.staat.opEmail[normaliseerEmail(email)];
    return id ? this.account(id) : null;
  }

  accountOpKlant(klantId) {
    const id = this.staat.opKlant[klantId];
    return id ? this.account(id) : null;
  }

  alleAccounts() { return Object.values(this.staat.accounts); }

  async zetAccount(account) {
    this.staat.accounts[account.id] = account;
    this.staat.opEmail[normaliseerEmail(account.email)] = account.id;
    if (account.mollieKlant) this.staat.opKlant[account.mollieKlant] = account.id;
    await this.bewaar();
    return account;
  }

  async verwijderAccount(id) {
    const account = this.account(id);
    if (!account) return false;
    delete this.staat.accounts[id];
    delete this.staat.opEmail[normaliseerEmail(account.email)];
    if (account.mollieKlant) delete this.staat.opKlant[account.mollieKlant];
    await this.bewaar();
    return true;
  }
}

/** Hoofdletters en spaties horen niet bij de identiteit van een e-mailadres. */
export const normaliseerEmail = (email) => String(email || '').trim().toLowerCase();

export const opslagIn = (map) => new Opslag(join(map, 'noer.json'));
