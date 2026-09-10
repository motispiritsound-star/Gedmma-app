// Alle instellingen op één plek, allemaal uit omgevingsvariabelen. Zo draait
// dezelfde code op je laptop, op een VPS en bij een hostingpartij zonder dat
// er ergens een bestand met sleutels in de repository belandt.
//
//   NOER_MOLLIE_SLEUTEL   test_... of live_... uit je Mollie-dashboard
//   NOER_BASISURL         https://noer.nl — waar de site staat. Mollie stuurt
//                         de ouder hierheen terug en roept hier de webhook aan.
//   NOER_GEHEIM           lange willekeurige tekst; ondertekent de sessiekoekjes
//   NOER_DATA             map voor de gegevens (standaard ./gegevens)
//   PORT                  standaard 5173
//   NOER_PROEF            1 = nep-Mollie, voor de tests en om droog te oefenen
//   NOER_MAIL             resend of postmark; leeg = mail alleen in de log
//   NOER_MAIL_SLEUTEL     de sleutel van die dienst
//   NOER_MAIL_VAN         "Noer <noer@jouwdomein.nl>"

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WORTEL = fileURLToPath(new URL('..', import.meta.url));

/**
 * De eerste week is gratis, daarna gaat de incasso lopen.
 *
 * Om elke maand te kunnen incasseren is er een machtiging nodig, en een
 * machtiging ontstaat bij Mollie alleen uit een echte eerste betaling. Die kan
 * niet nul zijn. Daarom staat er een verificatiebedrag van één cent: de ouder
 * ziet die afschrijving, weet dat zijn rekening klopt, en de proefweek begint.
 * Het eerste maandbedrag valt pas op dag acht.
 *
 * Dat ene cent moet je wél overal noemen waar je "gratis" zegt. Een afschrijving
 * die iemand niet verwacht, kost je meer vertrouwen dan hij oplevert.
 */
export const PROEF = {
  dagen: 7,
  verificatiebedrag: '0.01',
  omschrijving: 'Noer — controle van je rekening (proefweek)',
};

export const PLANNEN = {
  maand: {
    id: 'maand',
    naam: 'Noer, per maand',
    bedrag: '7.99',
    interval: '1 month',
    omschrijving: 'Noer — maandabonnement',
    periode: 'per maand',
  },
  jaar: {
    id: 'jaar',
    naam: 'Noer, per jaar',
    bedrag: '79.00',
    interval: '12 months',
    omschrijving: 'Noer — jaarabonnement',
    periode: 'per jaar',
  },
};

export const instellingen = {
  poort: Number(process.env.PORT || 5173),
  basisUrl: (process.env.NOER_BASISURL || `http://localhost:${process.env.PORT || 5173}`).replace(/\/$/, ''),
  mollieSleutel: process.env.NOER_MOLLIE_SLEUTEL || '',
  geheim: process.env.NOER_GEHEIM || '',
  gegevensMap: process.env.NOER_DATA || join(WORTEL, 'gegevens'),
  proef: process.env.NOER_PROEF === '1',
  mailDienst: process.env.NOER_MAIL || '',
  mailSleutel: process.env.NOER_MAIL_SLEUTEL || '',
  mailVan: process.env.NOER_MAIL_VAN || 'Noer <noer@voorbeeld.nl>',
  wortel: WORTEL,
};

/**
 * Wat er ontbreekt om echt geld te kunnen ontvangen. De server start ook
 * zonder dit — dan kun je de site en de app bekijken — maar hij zegt het wel,
 * want stilletjes geen betalingen aannemen is het ergste wat er kan gebeuren.
 */
export function watOntbreekt() {
  const gemist = [];
  if (!instellingen.proef && !instellingen.mollieSleutel) gemist.push('NOER_MOLLIE_SLEUTEL');
  if (!instellingen.geheim) gemist.push('NOER_GEHEIM');
  if (!instellingen.proef && instellingen.basisUrl.startsWith('http://localhost')) {
    gemist.push('NOER_BASISURL (Mollie kan geen webhook naar localhost sturen)');
  }
  if (!instellingen.proef && !instellingen.mailDienst) {
    gemist.push('NOER_MAIL (zonder maildienst krijgt niemand een bevestiging — dat moet wettelijk)');
  }
  return gemist;
}

/** Live of testsleutel? Dat bepaalt of er echt geld verschuift. */
export const isLive = () => instellingen.mollieSleutel.startsWith('live_');
