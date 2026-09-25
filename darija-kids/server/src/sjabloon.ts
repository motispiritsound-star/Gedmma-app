/**
 * How a mail and a landing page look.
 *
 * Mail clients threw out the last twenty years of CSS, so this is tables and
 * inline styles on purpose — and it stays one column, because most of these
 * are read on a phone between two other things.
 */

const KLEUR = { inkt: '#221a16', zacht: '#5f5449', vaag: '#8b8075', lijn: '#e4d8c5', saffraan: '#d97706', zellige: '#0f766e' }

export const esc = (s: string): string =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

interface Brief {
  kop: string
  body: string
  knop?: { tekst: string; url: string }
  /** Label/value pairs, for the weekly one. */
  regels?: [string, string][]
  staart?: string
  afmeldUrl: string
  afmeldTekst: string
  wisUrl: string
  wisTekst: string
  voet: string
}

/**
 * Een lege regel in de tekst is een lege regel in de mail.
 *
 * `body` wordt geschreven als gewone tekst, met `\n\n` tussen de alinea's —
 * zo staat hij ook in `briefTekst`, en daar klopt dat. In HTML niet: daar
 * vallen regeleindes weg. De mail na het afrekenen heeft drie alinea's en die
 * liepen in een mailprogramma aan elkaar tot één blok van zes regels.
 *
 * Dat is de eerste mail die iemand krijgt die net heeft betaald, en de zin die
 * ertoe doet — "deze link is je sleutel, bewaar deze mail" — stond midden in
 * dat blok.
 *
 * Eerst ontsnappen, dan pas opdelen: anders zou tekst uit de mail zelf een
 * alinea kunnen beginnen.
 */
const alineas = (tekst: string, stijl: string): string => esc(tekst)
  .split(/\n\s*\n/)
  .map((deel) => `<p style="${stijl}">${deel.replace(/\n/g, '<br>')}</p>`)
  .join('')

export function briefHtml(b: Brief): string {
  /**
   * Geen uitschrijfregel onder een mail waar je je niet voor hebt aangemeld.
   *
   * De mail na het afrekenen is geen nieuwsbrief: die krijg je omdat je iets
   * hebt gekocht, en er valt niets uit te schrijven. Hij gaf die velden dus
   * leeg mee, en dan stond er onderaan een kale `·` met aan weerszijden een
   * link zonder tekst en zonder adres — zichtbaar, aanklikbaar, en nergens
   * heen.
   */
  const uitschrijven = b.afmeldTekst && b.wisTekst
    ? `<br>
    <a href="${esc(b.afmeldUrl)}" style="color:${KLEUR.zellige}">${esc(b.afmeldTekst)}</a> &middot;
    <a href="${esc(b.wisUrl)}" style="color:${KLEUR.zellige}">${esc(b.wisTekst)}</a>`
    : ''

  const regels = (b.regels ?? []).map(([label, waarde]) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid ${KLEUR.lijn};color:${KLEUR.zacht};font-size:15px">${esc(label)}</td>
      <td style="padding:8px 0;border-bottom:1px solid ${KLEUR.lijn};text-align:right;font-weight:700;font-size:15px">${esc(waarde)}</td>
    </tr>`).join('')

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:24px 12px;background:#faf6ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${KLEUR.inkt}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#fffdf8;border:1px solid ${KLEUR.lijn};border-radius:16px">
  <tr><td style="padding:28px 28px 8px">
    <div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${KLEUR.saffraan}">Darijaforkids</div>
    <h1 style="margin:10px 0 0;font-size:24px;line-height:1.2">${esc(b.kop)}</h1>
  </td></tr>
  <tr><td style="padding:12px 28px 0;font-size:16px;line-height:1.55;color:${KLEUR.zacht}">${alineas(b.body, 'margin:0 0 14px')}</td></tr>
  ${regels ? `<tr><td style="padding:16px 28px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${regels}</table></td></tr>` : ''}
  ${b.knop ? `<tr><td style="padding:22px 28px 0">
    <a href="${esc(b.knop.url)}" style="display:inline-block;background:${KLEUR.saffraan};color:#221a16;font-weight:800;font-size:16px;text-decoration:none;padding:13px 22px;border-radius:12px">${esc(b.knop.tekst)}</a>
  </td></tr>` : ''}
  ${b.staart ? `<tr><td style="padding:18px 28px 0;font-size:14px;line-height:1.5;color:${KLEUR.vaag}">${esc(b.staart)}</td></tr>` : ''}
  <tr><td style="padding:24px 28px 28px;font-size:12px;line-height:1.6;color:${KLEUR.vaag};border-top:1px solid ${KLEUR.lijn};margin-top:16px">
    ${esc(b.voet)}${uitschrijven}
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}

/** The same letter as plain text, for clients that show that instead. */
export function briefTekst(b: Brief): string {
  return [
    b.kop,
    '',
    b.body,
    ...(b.regels ?? []).map(([l, w]) => `- ${l}: ${w}`),
    b.knop ? `\n${b.knop.tekst}: ${b.knop.url}` : '',
    b.staart ? `\n${b.staart}` : '',
    '',
    '—',
    b.voet,
    `${b.afmeldTekst}: ${b.afmeldUrl}`,
    `${b.wisTekst}: ${b.wisUrl}`,
  ].filter((l) => l !== '').join('\n')
}

/** The page somebody lands on after clicking a link in a mail. */
/**
 * Waar de website staat voor deze taal.
 *
 * Het Nederlands woont op de wortel, de rest achter zijn eigen code. Dat is
 * dezelfde indeling als `make-site.mjs` schrijft.
 */
const naarSite = (site: string, taal: string): string =>
  taal === 'nl' ? site : `${site}/${taal}`

/**
 * Een bladzijde die de worker zelf toont, na een tik in een mail.
 *
 * Met een weg terug. Zonder stond iemand die net zijn adres had bevestigd op
 * een leeg vlak op post.darijaforkids.eu — geen menu, geen link, niets. Het
 * enige wat hij op dat moment wil is naar de site, en dat was precies wat er
 * niet stond.
 */
export function pagina(taal: string, kop: string, body: string, site?: string, terug?: string): Response {
  const html = `<!doctype html>
<html lang="${esc(taal)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(kop)}</title></head>
<body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#faf6ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${KLEUR.inkt};padding:24px">
<div style="max-width:420px;text-align:center">
  <div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${KLEUR.saffraan}">Darijaforkids</div>
  <h1 style="margin:12px 0 0;font-size:26px;line-height:1.2">${esc(kop)}</h1>
  <p style="margin:12px 0 0;font-size:16px;line-height:1.55;color:${KLEUR.zacht}">${esc(body)}</p>
  ${site && terug ? `<p style="margin:24px 0 0">
    <a href="${esc(naarSite(site, taal))}" style="display:inline-block;background:${KLEUR.saffraan};color:#221a16;font-weight:800;font-size:15px;text-decoration:none;padding:11px 20px;border-radius:12px">${esc(terug)}</a>
  </p>` : ''}
</div>
</body></html>`
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}
