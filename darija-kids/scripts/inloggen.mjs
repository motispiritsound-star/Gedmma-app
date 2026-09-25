/**
 * Eén keer inloggen bij Cloudflare, vanuit de projectmap.
 *
 * Zelfde reden als `deploy.mjs`: wrangler moet in de servermap draaien, en dat
 * hoort geen `cd` te zijn die je moet onthouden.
 *
 *   npm run inloggen
 */
import { wrangler } from './lib/wrangler.mjs'

/**
 * Wrangler heeft zijn fout al op het scherm gezet.
 *
 * `stdio: 'inherit'` betekent dat alles wat hij zegt rechtstreeks naar de
 * terminal gaat. Zou de fout hier ook nog gegooid worden, dan komt er een
 * javascript-object met een pid en een stack onder die melding te staan, en
 * dan lees je de verkeerde helft.
 */
try {
  wrangler(['login'], { stdio: 'inherit' })
} catch (fout) {
  process.exit(typeof fout.status === 'number' ? fout.status : 1)
}
