// De koppeling met Mollie. Geen sdk: de API is REST en Node kan fetch.
//
// De volgorde die Mollie voorschrijft voor een abonnement met iDEAL:
//
//   1. een klant aanmaken                       -> cst_...
//   2. een EERSTE betaling met sequenceType 'first'; die vraagt de ouder
//      onderweg om een machtiging (mandaat) af te geven
//   3. is die betaling geslaagd, dan staat er een geldig mandaat en mag je
//      een abonnement aanmaken                  -> sub_...
//   4. elke maand incasseert Mollie zelf en roept de webhook aan
//
// Stap 2 kan niet worden overgeslagen: zonder eerste betaling is er geen
// mandaat, en zonder mandaat weigert Mollie het abonnement.

const BASIS = 'https://api.mollie.com/v2';

export class MollieFout extends Error {
  constructor(bericht, status, lichaam) {
    super(bericht);
    this.naam = 'MollieFout';
    this.status = status;
    this.lichaam = lichaam;
  }
}

export class Mollie {
  constructor(sleutel, { basis = BASIS, haal = fetch } = {}) {
    this.sleutel = sleutel;
    this.basis = basis;
    this.haal = haal;
  }

  async verzoek(methode, pad, lichaam) {
    const antwoord = await this.haal(`${this.basis}${pad}`, {
      method: methode,
      headers: {
        authorization: `Bearer ${this.sleutel}`,
        'content-type': 'application/json',
      },
      body: lichaam ? JSON.stringify(lichaam) : undefined,
    });
    const tekst = await antwoord.text();
    const uit = tekst ? JSON.parse(tekst) : {};
    if (!antwoord.ok) {
      throw new MollieFout(uit.detail || `Mollie gaf ${antwoord.status}`, antwoord.status, uit);
    }
    return uit;
  }

  maakKlant({ naam, email }) {
    return this.verzoek('POST', '/customers', { name: naam || email, email });
  }

  /**
   * De eerste betaling. `sequenceType: 'first'` is het hele verschil: daarmee
   * vraagt Mollie de ouder om een machtiging voor de maanden erna.
   */
  maakEersteBetaling(klantId, { bedrag, omschrijving, terugUrl, webhookUrl, metadata }) {
    return this.verzoek('POST', `/customers/${klantId}/payments`, {
      amount: { currency: 'EUR', value: bedrag },
      description: omschrijving,
      redirectUrl: terugUrl,
      webhookUrl,
      sequenceType: 'first',
      metadata,
    });
  }

  betaling(id) { return this.verzoek('GET', `/payments/${encodeURIComponent(id)}`); }

  mandaten(klantId) { return this.verzoek('GET', `/customers/${klantId}/mandates`); }

  maakAbonnement(klantId, { bedrag, interval, omschrijving, startDatum, webhookUrl, mandaatId }) {
    return this.verzoek('POST', `/customers/${klantId}/subscriptions`, {
      amount: { currency: 'EUR', value: bedrag },
      interval,
      description: omschrijving,
      startDate: startDatum,
      webhookUrl,
      mandateId: mandaatId,
    });
  }

  zegAbonnementOp(klantId, abonnementId) {
    return this.verzoek('DELETE', `/customers/${klantId}/subscriptions/${abonnementId}`);
  }

  abonnement(klantId, abonnementId) {
    return this.verzoek('GET', `/customers/${klantId}/subscriptions/${abonnementId}`);
  }
}

/**
 * Een Mollie die niet bestaat, voor de tests en om droog te oefenen. Hij houdt
 * dezelfde volgorde aan als de echte: een eerste betaling staat op 'open' tot
 * iemand hem betaalt, en pas daarna is er een mandaat.
 *
 * `betaal(id)` is wat in het echt de ouder in zijn bank doet.
 */
export class NepMollie {
  constructor() {
    this.klanten = new Map();
    this.betalingen = new Map();
    this.abonnementen = new Map();
    this.teller = 0;
  }

  #id(voorvoegsel) { return `${voorvoegsel}_${(++this.teller).toString().padStart(6, '0')}`; }

  async maakKlant({ naam, email }) {
    const klant = { id: this.#id('cst'), name: naam || email, email, mandaten: [] };
    this.klanten.set(klant.id, klant);
    return klant;
  }

  async maakEersteBetaling(klantId, { bedrag, omschrijving, terugUrl, webhookUrl, metadata }) {
    const betaling = {
      id: this.#id('tr'),
      status: 'open',
      amount: { currency: 'EUR', value: bedrag },
      description: omschrijving,
      customerId: klantId,
      sequenceType: 'first',
      metadata,
      webhookUrl,
      _links: { checkout: { href: `https://nep.mollie/betalen/${this.teller}?terug=${encodeURIComponent(terugUrl)}` } },
    };
    this.betalingen.set(betaling.id, betaling);
    return betaling;
  }

  async betaling(id) {
    const b = this.betalingen.get(id);
    if (!b) throw new MollieFout('Betaling bestaat niet', 404, {});
    return b;
  }

  async mandaten(klantId) {
    const klant = this.klanten.get(klantId);
    return { _embedded: { mandates: klant ? klant.mandaten : [] }, count: klant ? klant.mandaten.length : 0 };
  }

  async maakAbonnement(klantId, { bedrag, interval, omschrijving, startDatum, webhookUrl, mandaatId }) {
    const klant = this.klanten.get(klantId);
    if (!klant || !klant.mandaten.some((m) => m.status === 'valid')) {
      throw new MollieFout('Klant heeft geen geldig mandaat', 422, {});
    }
    const abonnement = {
      id: this.#id('sub'), status: 'active', customerId: klantId,
      amount: { currency: 'EUR', value: bedrag },
      interval, description: omschrijving, startDate: startDatum, webhookUrl, mandateId: mandaatId,
    };
    this.abonnementen.set(abonnement.id, abonnement);
    return abonnement;
  }

  async abonnement(klantId, id) {
    const a = this.abonnementen.get(id);
    if (!a) throw new MollieFout('Abonnement bestaat niet', 404, {});
    return a;
  }

  async zegAbonnementOp(klantId, id) {
    const a = this.abonnementen.get(id);
    if (!a) throw new MollieFout('Abonnement bestaat niet', 404, {});
    a.status = 'canceled';
    return a;
  }

  // --- Wat in het echt buiten de server om gebeurt ------------------------

  /** De ouder rondt de betaling af in zijn bank. */
  betaal(betalingId) {
    const b = this.betalingen.get(betalingId);
    if (!b) throw new Error(`Onbekende betaling ${betalingId}`);
    b.status = 'paid';
    b.paidAt = new Date().toISOString();
    if (b.sequenceType === 'first') {
      const klant = this.klanten.get(b.customerId);
      const mandaat = { id: this.#id('mdt'), status: 'valid', method: 'directdebit' };
      klant.mandaten.push(mandaat);
      b.mandateId = mandaat.id;
    }
    return b;
  }

  /** De ouder klikt weg, of de bank weigert. */
  mislukt(betalingId, status = 'failed') {
    const b = this.betalingen.get(betalingId);
    b.status = status;
    return b;
  }

  /** Mollie incasseert een maand later: dat is een nieuwe betaling. */
  maandelijkseIncasso(abonnementId) {
    const a = this.abonnementen.get(abonnementId);
    const betaling = {
      id: this.#id('tr'), status: 'paid', amount: a.amount, customerId: a.customerId,
      subscriptionId: a.id, sequenceType: 'recurring', description: a.description,
      paidAt: new Date().toISOString(),
    };
    this.betalingen.set(betaling.id, betaling);
    return betaling;
  }
}
