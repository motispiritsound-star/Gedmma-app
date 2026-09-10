// Wat er in deze uitgave zit. Eén plek, zodat het colofon, de service worker
// en de documentatie niet uit elkaar lopen.
//
// VUL IN VOORDAT JE UITGEEFT: `houder` en `contact`. Die staan in het colofon
// en zijn wat een ouder ziet als die wil weten wie hierachter zit.

export const UITGAVE = {
  versie: '1.1.0',
  datum: '2026-09-09',

  /**
   * Hoe deze uitgave wordt aangeboden.
   *
   *   'open'        alles staat open voor iedereen. Geen server nodig, geen
   *                 account, geen betaling — de app is dan een map met
   *                 bestanden die je gratis ergens neerzet.
   *   'abonnement'  het gratis deel staat open, de rest achter het slot. Dit
   *                 heeft de server nodig (server.js, Mollie, een account).
   *
   * Begin bij 'open' als je alleen online wilt zijn, en zet hem op
   * 'abonnement' zodra KvK en Mollie geregeld zijn. Zie ONLINE.md.
   */
  modus: 'abonnement',

  /** Wie de app uitgeeft. Verschijnt in het colofon bij het auteursrecht. */
  houder: '',

  /** Waar een ouder terecht kan met een vraag. Leeg = niet tonen. */
  contact: '',
};

export const versieRegel = () =>
  `Noer ${UITGAVE.versie}${UITGAVE.datum ? ` · ${UITGAVE.datum}` : ''}`;
