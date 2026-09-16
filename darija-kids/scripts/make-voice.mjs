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
  eleven: {
    /** Set ELEVEN_STEM to the id of a Moroccan voice you have the rights to. */
    naam: process.env.ELEVEN_STEM ?? '',
    sleutel: process.env.ELEVEN_SLEUTEL,
    sleutelNaam: 'ELEVEN_SLEUTEL',
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
      body: JSON.stringify({ text: tekst, model_id: 'eleven_multilingual_v2' }),
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
    letters: alphabet.LETTERS.map((l) => ({
      id: l.id, tekst: pronunciation.letterSpeech(l.id, l.ar, l.name).ar, tr: l.tr,
    })),
    woorden: lexicon.allWords.filter((w) => !w.phrase).map((w) => ({
      id: w.id, tekst: pronunciation.spokenForm(w.ar), tr: w.tr,
    })),
    zinnen: [
      ...lexicon.allWords.filter((w) => w.phrase).map((w) => ({
        id: w.id, tekst: pronunciation.spokenForm(w.ar), tr: w.tr,
      })),
      ...sentences.ALL_SENTENCES.map((z) => ({
        id: z.id, tekst: pronunciation.spokenForm(z.ar), tr: z.tr,
      })),
    ],
  }
})
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
  const uit = path.join(ROOT, 'src', 'audio', map)
  await mkdir(uit, { recursive: true })
  const aanwezig = new Set((await readdir(uit).catch(() => [])).map((f) => f.replace(/\.[^.]+$/, '')))

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
      boekje[`${map}/${rij.id}`] = { stem: stem.naam, op: new Date().toISOString().slice(0, 10) }
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

await writeFile(BOEKJE, `${JSON.stringify(boekje, null, 2)}\n`)

console.log(`\n${gedaan} gemaakt · ${over} al aanwezig · ${stuk} mislukt`)
console.log('Luister ze na met `npm run sheet` en vervang alles wat fout klinkt door een echte opname.')
