// Eén icoonset voor de hele app: zelfde raster (24), zelfde lijndikte, zelfde
// ronde uiteinden. Ze erven hun kleur van de tekst eromheen (currentColor),
// dus ze kloppen vanzelf in licht en donker.
//
// Emoji blijft waar het inhoud is — dieren, kleuren, badges. Voor knoppen,
// menu's en statusjes zijn het iconen: die moeten er overal hetzelfde uitzien.

import { svg, el } from './ui.js';

const VORMEN = {
  thuis: { d: ['M3 11.2 12 4l9 7.2', 'M5.4 9.6V20h13.2V9.6', 'M10 20v-5h4v5'] },

  // De achtpuntige ster is het motief van de app; hij staat hier voor "letters".
  ster8: { d: ['M 12.00 3.40 L 14.53 5.90 L 18.08 5.92 L 18.10 9.47 L 20.60 12.00 L 18.10 14.53 L 18.08 18.08 L 14.53 18.10 L 12.00 20.60 L 9.47 18.10 L 5.92 18.08 L 5.90 14.53 L 3.40 12.00 L 5.90 9.47 L 5.92 5.92 L 9.47 5.90 Z'] },

  boek: { d: ['M12 6.2C10 4.8 7.6 4.2 4 4.2v13.6c3.6 0 6 .6 8 2 2-1.4 4.4-2 8-2V4.2c-3.6 0-6 .6-8 2z', 'M12 6.2v13.6'] },

  koran: { d: ['M6.5 3h11a1.5 1.5 0 0 1 1.5 1.5v15a1.5 1.5 0 0 1-1.5 1.5h-11A2.5 2.5 0 0 1 4 18.5v-13A2.5 2.5 0 0 1 6.5 3z', 'M9.5 3v6.5L12 8l2.5 1.5V3'] },

  praatwolk: { d: ['M4.5 6.5A2.5 2.5 0 0 1 7 4h10a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 17 16H9.5L5 20v-4a2.5 2.5 0 0 1-.5-1.5z'] },

  vlam: { gevuld: true, d: ['M12.4 2.4c.7 2.5 2 3.7 3.3 5.1 1.2 1.3 1.9 2.7 1.9 4.5a5.6 5.6 0 0 1-11.2 0c0-1.4.4-2.6 1.2-3.6.2 1.1.7 1.8 1.6 2.2.2-3.4 1.1-6 3.2-8.2z'] },

  ster: { gevuld: true, d: ['m12 4 2.4 5 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 9.8 9.6 9z'] },

  instellingen: { d: ['M4 7.5h9', 'M17.5 7.5H20', 'M4 16.5h3.5', 'M12 16.5h8'], cirkels: [[15, 7.5, 2.2], [9.5, 16.5, 2.2]] },

  terug: { d: ['M14.5 5.5 8 12l6.5 6.5'] },
  sluiten: { d: ['M6.5 6.5l11 11', 'M17.5 6.5l-11 11'] },
  vink: { d: ['M5 12.6 9.6 17 19 6.8'] },
  slot: { d: ['M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5', 'M5.8 10.5h12.4a1 1 0 0 1 1 1v7.5a1 1 0 0 1-1 1H5.8a1 1 0 0 1-1-1v-7.5a1 1 0 0 1 1-1z'] },

  geluid: { d: ['M4.5 9.3h3L11.6 6v12L7.5 14.7h-3a.8.8 0 0 1-.8-.8v-3.8a.8.8 0 0 1 .8-.8z', 'M15 9.6a3.6 3.6 0 0 1 0 4.8', 'M17.6 7a7.2 7.2 0 0 1 0 10'] },

  hart: { gevuld: true, d: ['M12 20s-7.2-4.4-7.2-9.2A4 4 0 0 1 12 8.4a4 4 0 0 1 7.2 2.4C19.2 15.6 12 20 12 20z'] },

  pijlRechts: { d: ['M5 12h13', 'm12.5 6.5 6 5.5-6 5.5'] },
  plus: { d: ['M12 5.5v13', 'M5.5 12h13'] },
};

/**
 * @param naam   sleutel uit VORMEN
 * @param maat   pixels (het raster is 24, dus 24 = 1:1)
 */
export function icoon(naam, { maat = 24, klasse = '' } = {}) {
  const vorm = VORMEN[naam];
  if (!vorm) throw new Error(`Onbekend icoon: ${naam}`);
  return svg('svg', {
    class: `icoon ${klasse}`.trim(),
    width: maat, height: maat, viewBox: '0 0 24 24',
    fill: vorm.gevuld ? 'currentColor' : 'none',
    stroke: 'currentColor',
    'stroke-width': vorm.gevuld ? 0 : 1.9,
    'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    'aria-hidden': 'true', focusable: 'false',
  },
    ...vorm.d.map((d) => svg('path', { d })),
    ...(vorm.cirkels || []).map(([cx, cy, r]) => svg('circle', { cx, cy, r })),
  );
}

/** Ronde icoonknop — overal dezelfde maat, dus altijd goed aan te tikken. */
export function icoonKnop(naam, { label, opklik, klasse = '', maat = 22, tag = 'button', href = null } = {}) {
  return el(tag, {
    class: `icoonknop ${klasse}`.trim(),
    'aria-label': label, title: label,
    href, type: tag === 'button' ? 'button' : null,
    opclick: opklik,
  }, icoon(naam, { maat }));
}
