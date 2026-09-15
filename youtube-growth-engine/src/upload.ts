/**
 * `npm run upload -- --production <id>`
 *
 * Zet de video PRIVÉ op je kanaal. Nooit openbaar: dat doe jij in YouTube
 * Studio, of het systeem plant het in nadat jij hebt goedgekeurd.
 *
 * Een tweede keer draaien met dezelfde inhoud doet niets en geeft hetzelfde
 * videoId terug, dus je kunt het veilig herhalen als je twijfelt.
 */
import { JsonFileStore } from './store/json-file.js'
import { FileTokenStore } from './providers/youtube/file-token-store.js'
import { YouTubeUploader } from './providers/youtube/upload.js'
import { OAuthRevokedError } from './providers/youtube/auth.js'
import {
  besluit, leesStand, leesUren, type Claimprofiel,
} from './domain/publicatie.js'

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    console.error(`\n${name} ontbreekt. Zie stap 4 van docs/HANDLEIDING.md.\n`)
    process.exit(1)
  }
  return value
}

async function main(): Promise<void> {
  const productionId = arg('production')
  if (!productionId) {
    console.error('\nGebruik: npm run upload -- --production <id>\n')
    process.exit(1)
  }

  const store = new JsonFileStore(process.env['STORE_PATH'] ?? '.data/producties.json')
  const production = await store.get(productionId)
  if (!production) {
    console.error(`\nProductie ${productionId} bestaat niet.\n`)
    process.exit(1)
  }

  // Publiceren kan alleen na de reviewer en na jou. Dit is geen waarschuwing
  // maar een stop.
  const ready = production.state === 'approved' || process.env['SKIP_APPROVAL'] === 'true'
  if (!ready) {
    console.error(
      `\nProductie staat op "${production.state}" en niet op "approved".\n\n` +
      'Eerst de reviewer, dan jij. Wil je bewust een testupload doen met de\n' +
      'placeholderbeelden, zet dan SKIP_APPROVAL=true — de video gaat dan nog\n' +
      'steeds privé en wordt niet gepubliceerd.\n',
    )
    process.exit(1)
  }

  const config = {
    clientId: required('GOOGLE_OAUTH_CLIENT_ID'),
    clientSecret: required('GOOGLE_OAUTH_CLIENT_SECRET'),
    redirectUri: process.env['GOOGLE_OAUTH_REDIRECT_URI'] ?? 'http://localhost:4400/oauth/callback',
  }
  const tokens = new FileTokenStore(process.env['YOUTUBE_TOKEN_PATH'] ?? '.tokens/youtube.json')

  const uploader = new YouTubeUploader(config, tokens, store, {
    onQuota: (units) => console.log(`  quotumverbruik (schatting): ${units} eenheden`),
  })

  // Het claimprofiel komt uit de instellingen, maar staat standaard op
  // 'oordeel'. Een kanaal moet zichzelf dus uitdrukkelijk als controleerbaar
  // aanmerken voordat er iets vanzelf online kan gaan; vergeten betekent hier
  // veilig, niet snel.
  const profiel: Claimprofiel =
    process.env['CLAIM_PROFILE'] === 'controleerbaar' ? 'controleerbaar' : 'oordeel'
  const plan = besluit({
    stand: leesStand(process.env['PUBLISH_MODE']),
    profiel,
    urenUitstel: leesUren(process.env['PUBLISH_DELAY_HOURS']),
  })

  console.log(`\nPublicatie: ${plan.stand}`)
  console.log(`  ${plan.uitleg}`)
  if (plan.teruggezet) {
    console.log('  (De gevraagde stand is teruggezet. Dat kan niet met een ' +
      'instelling ongedaan worden gemaakt.)')
  }

  for (const variant of production.variants) {
    if (!variant.videoPath || !variant.metadata) continue
    const title = variant.metadata.titleOptions[0]
    if (!title) {
      console.error(`  ${variant.language}: geen titel die de poort haalde. Overgeslagen.`)
      continue
    }

    console.log(`\n${variant.language}: "${title}"`)
    try {
      const outcome = await uploader.upload({
        productionId: production.id,
        language: variant.language,
        videoPath: variant.videoPath,
        title,
        description: variant.metadata.description,
        tags: variant.metadata.tags,
        categoryId: process.env['YOUTUBE_CATEGORY_ID'] ?? '27',
        privacyStatus: plan.privacyStatus,
        ...(plan.publishAt ? { publishAt: plan.publishAt } : {}),
        containsSyntheticMedia: variant.metadata.aiDisclosureRequired,
        madeForKids: process.env['MADE_FOR_KIDS'] === 'true',
      })
      if (outcome.created) {
        console.log(`  geupload: https://studio.youtube.com/video/${outcome.videoId}/edit`)
      } else {
        console.log(`  al eerder geupload: ${outcome.videoId} — geen tweede upload`)
      }
      if (variant.srtPath) {
        console.log(`  ondertiteling: upload ${variant.srtPath} met de hand in Studio`)
      }
    } catch (error) {
      if (error instanceof OAuthRevokedError) {
        console.error(`\n${error.message}\n`)
        process.exitCode = 1
        return
      }
      throw error
    }
  }

  console.log(`\n${plan.uitleg}\n`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
