// Wat er in deze uitgave zit. Eén plek, zodat het colofon, de service worker
// en de documentatie niet uit elkaar lopen.
//
// VUL IN VOORDAT JE UITGEEFT: `houder` en `contact`. Die staan in het colofon
// en zijn wat een ouder ziet als die wil weten wie hierachter zit.

export const UITGAVE = {
  versie: '1.0.0',
  datum: '2026-08-31',

  /** Wie de app uitgeeft. Verschijnt in het colofon bij het auteursrecht. */
  houder: '',

  /** Waar een ouder terecht kan met een vraag. Leeg = niet tonen. */
  contact: '',
};

export const versieRegel = () =>
  `Noer ${UITGAVE.versie}${UITGAVE.datum ? ` · ${UITGAVE.datum}` : ''}`;
