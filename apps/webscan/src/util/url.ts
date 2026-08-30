/** Maakt van vrije invoer ("www.bakker.nl", "bakker.nl/index.html") een bruikbare URL. */
export function normalizeUrl(input: string): string | null {
  const trimmed = (input ?? '').trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (!url.hostname.includes('.') || url.hostname.endsWith('.')) return null;
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

/** Domein zonder www, gebruikt als sleutel om dubbele bedrijven te ontdubbelen. */
export function registrableDomain(input: string): string | null {
  const url = normalizeUrl(input);
  if (!url) return null;
  return new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
}

const PLATFORM_HOSTS = [
  'facebook.com', 'instagram.com', 'linkedin.com', 'x.com', 'twitter.com',
  'youtube.com', 'tiktok.com', 'wixsite.com', 'business.site', 'google.com',
  'marktplaats.nl', 'werkspot.nl', 'thuisbezorgd.nl', 'booking.com',
];

/** True als de "website" eigenlijk een social- of platformpagina is — geen eigen site. */
export function isPlatformPage(input: string): boolean {
  const domain = registrableDomain(input);
  if (!domain) return false;
  return PLATFORM_HOSTS.some((host) => domain === host || domain.endsWith(`.${host}`));
}

export function sameHost(a: string, b: string): boolean {
  try {
    return new URL(a).hostname.replace(/^www\./, '') === new URL(b).hostname.replace(/^www\./, '');
  } catch {
    return false;
  }
}
