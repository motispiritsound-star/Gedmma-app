// Kleine hulpjes voor de site. Geen framework: het zijn vier formulieren.

/** Een verzoek aan de eigen API. Geeft altijd { status, ...gegevens } terug. */
export async function verstuur(pad, lichaam, methode = 'POST') {
  const antwoord = await fetch(pad, {
    method: methode,
    headers: lichaam ? { 'content-type': 'application/json' } : undefined,
    credentials: 'same-origin',
    body: lichaam ? JSON.stringify(lichaam) : undefined,
  });
  let uit = {};
  try { uit = await antwoord.json(); } catch { /* leeg antwoord */ }
  return { status: antwoord.status, ...uit };
}

export const haal = (pad) => verstuur(pad, null, 'GET');

/**
 * Een melding onder een formulier. Altijd tekst, nooit alleen een kleur:
 * kleurenblind of niet, je moet kunnen lezen wat er mis is.
 */
export function meld(node, tekst, soort = 'fout') {
  node.textContent = tekst;
  node.className = `melding ${soort}`;
}

/** Zet een knop op slot zolang er een verzoek loopt, zodat niemand dubbel betaalt. */
export function bezig(knop, aan, tekstBezig = 'Even geduld…') {
  if (aan) {
    knop.dataset.tekst = knop.textContent;
    knop.textContent = tekstBezig;
    knop.disabled = true;
  } else {
    if (knop.dataset.tekst) knop.textContent = knop.dataset.tekst;
    knop.disabled = false;
  }
}

/**
 * De knop rechtsboven wijst naar je account als je ingelogd bent, en anders
 * naar inloggen. Zonder server (of offline) blijft staan wat er staat.
 */
export async function vulKopbalk() {
  const knop = document.querySelector('[data-account-knop]');
  if (!knop) return;
  // Als los bestand (een gebundelde pagina om te mailen) is er geen server om
  // iets aan te vragen; dan blijft de knop staan zoals hij staat.
  if (!window.location.protocol.startsWith('http')) return;
  const uit = await haal('/api/account').catch(() => ({ status: 0 }));
  if (uit.status === 200) {
    knop.textContent = 'Mijn account';
    knop.href = 'account.html';
  }
}

export const euro = (bedrag) =>
  `€ ${Number(bedrag).toFixed(2).replace('.', ',')}`;

export const datum = (iso) => new Date(iso).toLocaleDateString('nl-NL',
  { day: 'numeric', month: 'long', year: 'numeric' });
