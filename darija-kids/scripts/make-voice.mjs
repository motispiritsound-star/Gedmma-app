/**
 * Fills the app with spoken audio, one clip per letter, word and sentence.
 *
 * Why this exists: no phone speaks Darija. Every speech engine on every
 * handset is trained on Modern Standard Arabic — a different language wearing
 * the same letters — so the app cannot synthesise its way to a right answer at
 * playback time. The only thing that works is a file. This renders those files
 * once, here, where they can be listened to and thrown away before anybody
 * ships them.
 *
 * It is deliberately not the last word. What comes out is as good as the
 * chosen voice, and the chosen voice is at best Moroccan-accented Standard
 * Arabic. So:
 *
 *   - a human recording always wins. Anything already in `src/audio/` is left
 *     alone; this only fills gaps.
 *   - what it makes is meant to be checked, item by item, with `npm run sheet`,
 *     and whatever a Moroccan ear rejects gets recorded by a person at
 *     `/opname` and dropped in with `npm run add-clip`.
 *
 * Run with:
 *   AZURE_SLEUTEL=... node scripts/make-voice.mjs --stem azure
 *   ELEVEN_SLEUTEL=... node scripts/make-voice.mjs --stem eleven
 *   node scripts/make-voice.mjs --stem azure --alleen letters --opnieuw
 *
 * Flags:
 *   --stem <azure|eleven>  which engine speaks
 *   --alleen <map>         letters, woorden or zinnen; default all three
 *   --opnieuw              also overwrite clips this script made earlier
 *   --hoeveel <n>          stop after n clips, to hear a handful first
 *   --lijst                print what there is to say and stop, no key needed
 *   --schrift <soort>      arabisch (standaard) of latijn
 *   --proef <map>          schrijf naar die map in plaats van naar src/audio,
 *                          om eerst te luisteren zonder iets te vervangen
 *
 * Over `--schrift`: een motor die op Standaardarabisch is getraind moet het
 * Arabische schrift krijgen, want daar is hij op getraind. Een stem die Darija
 * kent doet het vaak beter met de Latijnse schrijfwijze die Marokkanen zelf in
 * berichten gebruiken — "bzaf" in plaats van بزاف — omdat daar staat wat er
 * gezegd wordt en niet wat er geschreven wordt. Het is twee keer draaien en
 * luisteren; welke wint hangt van de stem af.
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { bewerk, readWav, writeWav } from './lib/wav.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const PORT = 4362

const arg = (naam, terug) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 ? process.argv[i + 1] : terug
}
const vlag = (naam) => process.argv.includes(`--${naam}`)

const STEM = arg('stem', 'azure')
const ALLEEN = arg('alleen', null)
const OPNIEUW = vlag('opnieuw')
const HOEVEEL = Number(arg('hoeveel', 0)) || Infinity
const SCHRIFT = arg('schrift', 'arabisch')
/** Een proef gaat ergens anders heen en raakt de app niet aan. */
const PROEF = arg('proef', null)
const MAPPEN = ALLEEN ? [ALLEEN] : ['letters', 'woorden', 'zinnen']

/**
 * Which voices to ask for.
 *
 * Azure is the only big engine with a Moroccan locale at all (ar-MA). It is
 * still a Standard Arabic voice with a Moroccan accent rather than a Darija
 * one, which is exactly why everything it makes has to be listened to.
 */
const STEMMEN = {
  azure: {
    naam: 'ar-MA-JamalNeural',
    /** Azure wants a region in the hostname. */
    regio: process.env.AZURE_REGIO ?? 'westeurope',
    sleutel: process.env.AZURE_SLEUTEL,
    sleutelNaam: 'AZURE_SLEUTEL',
  },
  /**
   * ElevenLabs, en dit is de interessante.
   *
   * Azure heeft een Marokkaanse stem die Standaardarabisch spreekt. ElevenLabs
   * heeft stemmen die op Darija zelf zijn getraind — een gekloonde stem van een
   * Marokkaanse spreker. Dat is een ander soort ding: geen accent over een
   * andere taal heen, maar de taal.
   *
   * Zet ELEVEN_STEM op de id van de stem uit je eigen bibliotheek. Twee dingen
   * om eerst te regelen, want ze zijn geen detail:
   *
   *  - **Commercieel gebruik.** Wat een gratis account maakt mag niet in een
   *    app die geld kost. Dat komt met een betaald abonnement, en je hebt het
   *    zwart op wit nodig voordat dit meegaat naar de winkel.
   *  - **De stem zelf.** Een stem uit de Voice Library heeft eigen voorwaarden
   *    van degene die hem deelde. Lees die, ook als het abonnement in orde is.
   */
  eleven: {
    naam: process.env.ELEVEN_STEM ?? '',
    sleutel: process.env.ELEVEN_SLEUTEL,
    sleutelNaam: 'ELEVEN_SLEUTEL',
    model: process.env.ELEVEN_MODEL ?? 'eleven_multilingual_v2',
    /** De drie schuiven, als getallen tussen 0 en 1. */
    vast: Number(process.env.ELEVEN_STABILITY ?? 0.5),
    gelijkend: Number(process.env.ELEVEN_SIMILARITY ?? 0.75),
    tempo: Number(process.env.ELEVEN_SPEED ?? 0.92),
  },
}

/* ------------------------------------------------------------- the engines */

/** Azure returns a 16 kHz mono WAV, which is exactly what the app wants. */
async function azure(tekst, stem) {
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ar-MA">`
    + `<voice name="${stem.naam}"><prosody rate="-8%">${tekst.replace(/[&<>]/g, '')}</prosody></voice></speak>`
  const antwoord = await fetch(`https://${stem.regio}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': stem.sleutel,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'riff-16khz-16bit-mono-pcm',
    },
    body: ssml,
  })
  if (!antwoord.ok) throw new Error(`azure ${antwoord.status}: ${(await antwoord.text()).slice(0, 160)}`)
  return Buffer.from(await antwoord.arrayBuffer())
}

async function eleven(tekst, stem) {
  if (!stem.naam) throw new Error('zet ELEVEN_STEM op de id van een stem die je mag gebruiken')
  const antwoord = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${stem.naam}?output_format=pcm_16000`,
    {
      method: 'POST',
      headers: { 'xi-api-key': stem.sleutel, 'content-type': 'application/json' },
      body: JSON.stringify({
        text: tekst,
        model_id: stem.model,
        voice_settings: {
          stability: stem.vast,
          similarity_boost: stem.gelijkend,
          speed: stem.tempo,
        },
      }),
    },
  )
  if (!antwoord.ok) throw new Error(`eleven ${antwoord.status}: ${(await antwoord.text()).slice(0, 160)}`)
  // Raw PCM, so it needs a header before the rest of the pipeline sees it.
  const pcm = Buffer.from(await antwoord.arrayBuffer())
  const samples = new Float32Array(pcm.length / 2)
  for (let i = 0; i < samples.length; i++) samples[i] = pcm.readInt16LE(i * 2) / 32768
  return writeWav(16000, samples)
}

const MOTOREN = { azure, eleven }

/* ------------------------------------------------- what there is to say */

const server = await createServer({
  configFile: 'vite.config.ts',
  server: { port: PORT, strictPort: true, hmr: false },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({ executablePath: CHROME })
const page = await browser.newPage()
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })

/**
 * Every id the app can ask for, with the text a voice should be given.
 *
 * For a letter that is its Arabic *name* — أَلِف, not ا — because that is what
 * the alphabet screen says out loud. For words and sentences it is the word
 * itself, in the spelling the app shows, including the vowel marks that
 * `SPOKEN_WORD` adds for the ones that need them.
 */
const werk = await page.evaluate(async () => {
  const [alphabet, lexicon, sentences, pronunciation] = await Promise.all([
    import('/src/content/alphabet.ts'),
    import('/src/content/lexicon.ts'),
    import('/src/content/sentences.ts'),
    import('/src/content/pronunciation.ts'),
  ])
  return {
    letters: alphabet.LETTERS.map((l) => {
      const spraak = pronunciation.letterSpeech(l.id, l.ar, l.name)
      // De Latijnse vorm van een letter is zijn náám — "alif", niet "a". Een
      // stem die "a" krijgt zegt een klank waar een letternaam hoort.
      return { id: l.id, ar: spraak.ar, tr: spraak.tr }
    }),
    woorden: lexicon.allWords.filter((w) => !w.phrase).map((w) => ({
      id: w.id, ar: pronunciation.spokenForm(w.ar), tr: w.tr,
    })),
    zinnen: [
      ...lexicon.allWords.filter((w) => w.phrase).map((w) => ({
        id: w.id, ar: pronunciation.spokenForm(w.ar), tr: w.tr,
      })),
      ...sentences.ALL_SENTENCES.map((z) => ({
        id: z.id, ar: pronunciation.spokenForm(z.ar), tr: z.tr,
      })),
    ],
  }
})

// Welke van de twee schrijfwijzen de motor krijgt.
for (const map of Object.keys(werk)) {
  for (const rij of werk[map]) rij.tekst = SCHRIFT === 'latijn' ? rij.tr : rij.ar
}
await browser.close()
await server.close()

if (vlag('lijst')) {
  for (const map of MAPPEN) {
    const rijen = werk[map] ?? []
    console.log(`${map}: ${rijen.length}`)
    for (const rij of rijen.slice(0, 4)) console.log(`  ${rij.id.padEnd(18)} ${rij.tekst}`)
    if (rijen.length > 4) console.log('  …')
  }
  process.exit(0)
}

/* -------------------------------------------------------------- the render */

const stem = STEMMEN[STEM]
if (!stem) {
  console.error(`--stem moet ${Object.keys(STEMMEN).join(' of ')} zijn`)
  process.exit(1)
}
if (!stem.sleutel) {
  console.error(`zet ${stem.sleutelNaam} in de omgeving; zonder sleutel praat er niemand`)
  process.exit(1)
}

/**
 * Which clips were made by a machine.
 *
 * A human take must never be overwritten by an engine, and after a few rounds
 * nobody remembers which is which — so this file remembers, and the app never
 * reads it.
 */
const BOEKJE = path.join(ROOT, 'src', 'audio', 'gemaakt.json')
const boekje = JSON.parse(await readFile(BOEKJE, 'utf8').catch(() => '{}'))

let gedaan = 0
let over = 0
let stuk = 0

for (const map of MAPPEN) {
  const rijen = werk[map]
  if (!rijen) { console.error(`onbekende map: ${map}`); continue }
  const uit = PROEF ? path.join(ROOT, PROEF, map) : path.join(ROOT, 'src', 'audio', map)
  await mkdir(uit, { recursive: true })
  // Een proef vervangt niets, dus daar telt niet wat er al staat.
  const aanwezig = PROEF
    ? new Set()
    : new Set((await readdir(uit).catch(() => [])).map((f) => f.replace(/\.[^.]+$/, '')))

  for (const rij of rijen) {
    if (gedaan >= HOEVEEL) break
    const gemaakt = boekje[`${map}/${rij.id}`]
    if (aanwezig.has(rij.id) && !(OPNIEUW && gemaakt)) {
      // Somebody said this into a microphone. Leave it exactly as it is.
      over++
      continue
    }
    try {
      const rauw = await MOTOREN[STEM](rij.tekst, stem)
      const { rate, samples } = readWav(rauw)
      const klaar = bewerk(rate, samples)
      if (!klaar) { console.error(`${rij.id}: alleen stilte`); stuk++; continue }
      await writeFile(path.join(uit, `${rij.id}.wav`), writeWav(rate, klaar.samples))
      if (!PROEF) boekje[`${map}/${rij.id}`] = { stem: stem.naam, op: new Date().toISOString().slice(0, 10) }
      gedaan++
      process.stdout.write(`\r${map}: ${gedaan} gemaakt, ${over} overgeslagen`)
    } catch (e) {
      stuk++
      console.error(`\n${rij.id}: ${e.message}`)
      // A key that is refused will be refused four hundred more times.
      if (String(e.message).match(/40[13]/)) break
    }
  }
  process.stdout.write('\n')
}

if (!PROEF) await writeFile(BOEKJE, `${JSON.stringify(boekje, null, 2)}\n`)

console.log(`\n${gedaan} gemaakt · ${over} al aanwezig · ${stuk} mislukt`)
console.log(PROEF
  ? `Het staat in ${PROEF}/ en de app is niet aangeraakt. Luister het door; deugt het, draai dan zonder --proef.`
  : 'Luister ze na met `npm run sheet` en vervang alles wat fout klinkt door een echte opname.')
