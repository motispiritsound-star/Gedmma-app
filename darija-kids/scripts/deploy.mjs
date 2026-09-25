/**
 * De worker uitrollen, vanuit de projectmap.
 *
 * Dit was `cd server` en dan `npm run deploy`, en die `cd` is precies waar het
 * misgaat: hij hoeft maar één keer verkeerd te staan en npm klaagt over een
 * ontbrekende `package.json`, een melding die niets zegt over wat er echt aan
 * de hand is.
 *
 * `scripts/lib/wrangler.mjs` weet zelf waar de servermap staat, en draait daar.
 * Dus hoeft er nergens meer een pad ingevuld te worden.
 *
 *   npm run deploy
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
  wrangler(['deploy'], { stdio: 'inherit' })
} catch (fout) {
  process.exit(typeof fout.status === 'number' ? fout.status : 1)
}
