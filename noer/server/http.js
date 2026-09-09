// Kleine hulpjes voor het HTTP-werk. Geen framework: de server heeft twaalf
// eindpunten en een map met bestanden.

const MAX_LICHAAM = 64 * 1024;

/** Leest het verzoek uit, maar stopt bij 64 kB — niemand stuurt hier boeken heen. */
export function leesLichaam(verzoek) {
  return new Promise((klaar, mis) => {
    let uit = '';
    verzoek.on('data', (stuk) => {
      uit += stuk;
      if (uit.length > MAX_LICHAAM) {
        mis(Object.assign(new Error('Te groot'), { status: 413 }));
        verzoek.destroy();
      }
    });
    verzoek.on('end', () => klaar(uit));
    verzoek.on('error', mis);
  });
}

export async function leesJson(verzoek) {
  const tekst = await leesLichaam(verzoek);
  if (!tekst) return {};
  try {
    const uit = JSON.parse(tekst);
    return uit && typeof uit === 'object' ? uit : {};
  } catch {
    throw Object.assign(new Error('Onleesbaar verzoek'), { status: 400 });
  }
}

export async function leesFormulier(verzoek) {
  return Object.fromEntries(new URLSearchParams(await leesLichaam(verzoek)));
}

export function stuurJson(antwoord, status, gegevens, koppen = {}) {
  const lichaam = JSON.stringify(gegevens);
  antwoord.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...koppen,
  });
  antwoord.end(lichaam);
}

export const koekjes = (verzoek) => Object.fromEntries(
  (verzoek.headers.cookie || '').split(';').map((deel) => {
    const streep = deel.indexOf('=');
    if (streep < 0) return null;
    return [deel.slice(0, streep).trim(), decodeURIComponent(deel.slice(streep + 1).trim())];
  }).filter(Boolean));

export function koekje(naam, waarde, { maxLeeftijd, veilig }) {
  const delen = [
    `${naam}=${encodeURIComponent(waarde)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxLeeftijd}`,
  ];
  if (veilig) delen.push('Secure');
  return delen.join('; ');
}
