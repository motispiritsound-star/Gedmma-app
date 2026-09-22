/**
 * Schrijft voor elke bladzijde de opdracht aan de tekenaar.
 *
 * Honderdvierenveertig platen die er als één reeks uit moeten zien, is geen
 * kwestie van honderdvierenveertig keer iets moois maken. Het is één keer de
 * stijl en het personage vastleggen en die daarna honderdvierenveertig keer
 * woordelijk herhalen — daarom staat de stijlregel hier één keer in code en
 * niet honderdvierenveertig keer in een document dat langzaam uit elkaar
 * loopt.
 *
 * De lijst is in het Engels: dat is de taal waarin beeldmodellen en de meeste
 * illustrators buiten Nederland werken. Wat eruit komt gaat in
 * `store/prentenboek/platen/<deel>/<nummer>.jpg`, en dan zit hij in het boek.
 *
 * Run with: node scripts/make-platenlijst.mjs [--deel 1]
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const arg = (naam, terugval = null) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : terugval
}

/** Eén keer opschrijven, honderdvierenveertig keer herhalen. */
const STIJL = 'Warm painterly children\'s picture book illustration, storybook oil-and-gouache look, '
  + 'soft golden Moroccan light, rich saturated colours, detailed but friendly, '
  + 'gentle depth of field, no text anywhere in the image, landscape format 3:2'

const SBAA = 'Sbaa is a young Atlas lion cub with honey-coloured fur and a soft lighter mane, '
  + 'large friendly dark eyes and rosy cheeks. He always wears: a red fez with a gold band and a tassel, '
  + 'a cobalt-blue open djellaba with colourful Amazigh diamond patterns over a white under-robe, '
  + 'a red sash at the waist, a brown leather satchel with a gold buckle on a strap across his chest, '
  + 'and red pointed babouches. He never bares his teeth'

const KINDEREN = {
  adil: 'Adil, a 9-year-old Moroccan boy, green backpack, a folded paper map in his hand',
  yousra: 'Yousra, an 8-year-old Moroccan girl, red tunic, a sketchbook under her arm and a pencil behind her ear',
  amir: 'Amir, a 7-year-old Moroccan boy in a striped shirt and red shoes, always running ahead',
  yassine: 'Yassine, a 6-year-old Moroccan boy with a blue cap and bulging pockets',
  adam: 'Adam, a 5-year-old Moroccan boy in a yellow shirt with crumbs on it',
  rayan: 'Rayan, a 3-year-old Moroccan boy in a small purple coat, holding someone\'s hand',
}

/** Waar elke plaat zich afspeelt. De namen komen uit `prentenboek.ts`. */
const TAFEREEL = {
  atlas: 'high in the Atlas mountains, snow-capped peaks, a wide valley below, cedar trees',
  bergpad: 'a narrow stony mountain path with juniper bushes, clouds drifting below',
  sneeuw: 'a snowfield high on the mountain, bright sun, footprints in fresh snow',
  weide: 'a green mountain meadow with goats, low stone walls, an argan tree',
  tent: 'inside a Berber nomad tent, woollen rugs on the ground, a small fire, copper pot',
  top: 'a rocky summit at the end of the day, the whole valley spread out below',
  poort: 'the great blue gate of Fes, an enormous horseshoe arch, zellige tilework, crowds passing',
  welkom: 'a doorway in a sunlit alley, a woman offering a tray of mint tea',
  medina: 'a narrow shaded alley of the Fes medina, whitewashed walls, hanging lanterns, a cat',
  ezel: 'a loaded donkey coming through a narrow alley, baskets on its back, a man calling out',
  brood: 'a neighbourhood bakery: an arched opening in a wall, round breads on a wooden board',
  babouches: 'a shoemaker\'s stall, a wall of babouches in yellow, red, white and green',
  souq: 'the bustling souk, striped awnings, olives, pottery, spices in cones',
  thee: 'a low table on a rug, mint tea poured from a great height into a glass',
  zon: 'rooftops at sunset, the walls turning orange then pink',
  jedda: 'an open door at the end of an alley, an old woman with flour on her hands in warm light',
  afscheid: 'the medina at night under a sky full of stars, one lit gateway',
  duin: 'the first sight of the ocean over a low dune, wind in the grass',
  strand: 'a wide windy Atlantic beach near Essaouira, spray in the air',
  haven: 'the blue fishing harbour of Essaouira, blue boats, nets, seagulls, cats',
  stadje: 'the white and blue lanes of Essaouira, bougainvillea over a wall',
  vuur: 'grilled fish on a charcoal grill at a harbour stall, lemons, wooden tables',
  zonsondergang: 'the sun going down into the Atlantic, the harbour in silhouette',
  plein: 'a great square in Marrakech in the evening, musicians, lanterns, crowds',
  kraam: 'a market stall piled high with fruit, a vendor weighing something',
  huis: 'a traditional riad: rooms around an open courtyard with a tree and a fountain',
  keuken: 'a busy Moroccan kitchen, steam, a couscous pot, a tagine with its lid lifted',
  binnenhof: 'the tiled courtyard of a riad, a lemon tree, laundry on a line',
  tafel: 'a crowded low round table, too many people, one big shared dish',
  nacht: 'the rooftop terrace at night, laundry lines, the city humming below, stars',
  stah: 'a flat rooftop terrace in the evening, the medina stretching to the horizon',
  schoolplein: 'a school gate in a Moroccan town, children streaming out',
  klas: 'a simple classroom, wooden desks, a blackboard with Arabic letters',
  woestijn: 'the edge of the Sahara, orange dunes, a camel kneeling',
}

/** Wie er op die bladzijde te zien is, afgeleid uit de tekst. */
const wieErOpStaat = (tekst) => {
  const namen = Object.keys(KINDEREN).filter((id) => tekst.join(' ').toLowerCase().includes(id))
  return namen.length ? namen : ['rayan']
}

const server = await createServer({
  configFile: path.join(ROOT, 'vite.config.ts'),
  root: ROOT, server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error',
})
const { DELEN } = await server.ssrLoadModule('/src/content/prentenboek.ts')
await server.close()

const welke = arg('deel') ? DELEN.filter((d) => d.nummer === Number(arg('deel'))) : DELEN

const regels = [
  '# Opdrachten voor de platen',
  '',
  'Eén plaat per bladzijde. Wat eruit komt gaat in',
  '`store/prentenboek/platen/<deel>/<nummer>.jpg` — dan staat hij in het boek.',
  '',
  '**Liggend, 3:2, minstens 2100 × 1400 pixels.** Dat is 300 dpi op A5-liggend, en',
  'daaronder wordt een drukker ongelukkig.',
  '',
  '**Geen tekst in het beeld.** De woorden komen in het boek eroverheen; een plaat',
  'met letters erin is in zes talen niet te gebruiken.',
  '',
  '## De vaste regel — staat in elke opdracht',
  '',
  '```', STIJL, '```', '',
  '## Het personage — staat in elke opdracht',
  '',
  '```', SBAA, '```', '',
]

for (const deel of welke) {
  regels.push(`## Deel ${deel.nummer} — ${deel.titel}`, '', `*${deel.waar}*`, '')
  deel.bladen.forEach((blad, i) => {
    const wie = wieErOpStaat(blad.tekst).map((id) => KINDEREN[id]).join('. ')
    const waar = TAFEREEL[blad.scene] ?? blad.scene
    regels.push(
      `### ${i + 1}. ${blad.woord.tr} — ${blad.woord.nl}`, '',
      '> ' + blad.tekst.join(' '), '',
      '```',
      `${STIJL}.`,
      `${SBAA}.`,
      `With him: ${wie}.`,
      `Scene: ${waar}.`,
      `The moment: the children discover the word "${blad.woord.tr}" (${blad.woord.nl}). Show that thing clearly in the picture.`,
      '```', '',
    )
  })
}

const uit = path.join(ROOT, 'store', 'prentenboek', `platenlijst${arg('deel') ? `-deel${arg('deel')}` : ''}.md`)
await mkdir(path.dirname(uit), { recursive: true })
await writeFile(uit, regels.join('\n'))
console.log(`\n${path.relative(ROOT, uit)} — ${welke.reduce((n, d) => n + d.bladen.length, 0)} opdrachten\n`)
