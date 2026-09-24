/**
 * Builds the e-book: every word, every letter, and the grammar in one PDF.
 *
 * It is generated rather than written, for the same reason the store copy is
 * generated: a book that drifts from the app is worse than no book. Every
 * word here comes out of `words.ts`, every letter out of `alphabet.ts`, and
 * every grammar note out of the lesson tips the app already shows — so a word
 * added to the course is in the next print without anybody remembering to
 * put it there.
 *
 * Laid out for A4 and for reading on a screen, with the Arabic set in the
 * same face the app uses, so the shapes a child traced are the shapes they
 * read here.
 *
 * Run with: node scripts/make-ebook.mjs [--lang nl] [--out <bestand>]
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { startChroom } from './lib/chroom.mjs'
import { createServer } from 'vite'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 4360
const BASE = `http://127.0.0.1:${PORT}`

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] : fallback
}
const LANG = arg('lang', 'nl')
/**
 * Het boek gaat mee in de app zelf: wie het koopt heeft het offline, zonder
 * account en zonder downloadlink die ooit verloopt. Vandaar `public/`.
 */
const OUT = arg('out', path.join(ROOT, 'public', 'ebook', `darijaforkids-${LANG}.pdf`))

const server = await createServer({
  configFile: 'vite.config.ts',
  server: { port: PORT, strictPort: true, hmr: false },
  logLevel: 'error',
})
await server.listen()

const browser = await startChroom()
const page = await browser.newPage()
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })

/** Everything the book is made of, straight out of the app's own modules. */
const book = await page.evaluate(async (lang) => {
  const [curriculum, lexicon, alphabet, sentences, localise, i18n] = await Promise.all([
    import('/src/content/curriculum.ts'),
    import('/src/content/lexicon.ts'),
    import('/src/content/alphabet.ts'),
    import('/src/content/sentences.ts'),
    import('/src/content/localise.ts'),
    import('/src/i18n/index.ts'),
  ])
  const t = i18n.STRINGS[lang]

  return {
    taal: lang,
    titel: t.common.appName,
    units: curriculum.UNITS.map((u) => ({
      id: u.id,
      ar: u.ar,
      title: u.title,
      subtitle: localise.unitSubtitle(u, lang),
      emoji: u.emoji,
      level: u.level,
      lessen: u.lessons.map((l) => localise.lessonTitle(l, lang)),
      tips: u.lessons
        .map((l) => localise.tipOf(l, lang))
        .filter(Boolean)
        .map((tip) => ({ title: tip.title, body: tip.body })),
    })),
    letters: alphabet.LETTERS.map((l) => ({
      ar: l.ar, naam: l.name, tr: l.tr, klank: l.sound, forms: l.forms,
      voorbeeld: l.exampleWordId ? lexicon.maybeWord(l.exampleWordId) : null,
    })),
    groepen: alphabet.LETTER_GROUPS,
    topics: lexicon.TOPICS.map((topic) => ({
      id: topic,
      emoji: lexicon.TOPIC_EMOJI[topic],
      naam: t.topics[topic],
      woorden: lexicon.allWords
        .filter((w) => w.topic === topic && !w.phrase)
        .map((w) => ({
          ar: w.ar, tr: w.tr, nl: localise.meaningOf(w, lang), note: localise.noteOf(w, lang) ?? '',
        })),
      zinnen: lexicon.allWords
        .filter((w) => w.topic === topic && w.phrase)
        .map((w) => ({ ar: w.ar, tr: w.tr, nl: localise.meaningOf(w, lang) })),
    })).filter((g) => g.woorden.length || g.zinnen.length),
    zinnen: sentences.ALL_SENTENCES.map((z) => ({
      ar: z.ar, tr: z.tr, nl: localise.sentenceMeaning(z, lang),
    })),
  }
}, LANG)

await browser.close()

const telling = {
  woorden: book.topics.reduce((n, g) => n + g.woorden.length, 0),
  uitdrukkingen: book.topics.reduce((n, g) => n + g.zinnen.length, 0),
  zinnen: book.zinnen.length,
  letters: book.letters.length,
  units: book.units.length,
}
console.log(
  `${telling.units} units · ${telling.letters} letters · ${telling.woorden} woorden · `
  + `${telling.uitdrukkingen} uitdrukkingen · ${telling.zinnen} zinnen`,
)

/* ------------------------------------------------------- de tekst van het boek */

/**
 * De woorden komen uit de app en zijn dus al vertaald; de zes koppen en
 * inleidingen van het boek zelf staan hier. Het boek wordt in zes talen
 * verkocht en een Franse koper hoort geen Nederlandse hoofdstuktitel te zien.
 */
const BOEK = {
  nl: {
    slogan: 'Alle woorden, alle letters en de grammatica — het hele pad op papier.',
    telwoorden: ['units', 'letters', 'woorden', 'uitdrukkingen', 'zinnen'],
    alfabet: 'Het alfabet',
    alfabetIntro: 'Achtentwintig letters, in de groepjes waarin de app ze leert: letters die hetzelfde skelet delen staan bij elkaar, want ب ت ث verschillen alleen in puntjes. Per letter staan de drie vormen — aan het begin, in het midden en aan het eind van een woord.',
    pad: 'Het pad',
    padIntro: 'Zeventien units, elk gebouwd op de vorige. Hieronder per unit wat erin zit en de uitleg die de app onderweg geeft — de grammatica, bij elkaar.',
    woorden: 'Alle woorden',
    woordenIntro: 'Op onderwerp, zoals in de app. De middelste kolom is de Latijnse schrijfwijze die Marokkanen zelf in berichten gebruiken: 3\u00a0=\u00a0ع, 7\u00a0=\u00a0ح, 9\u00a0=\u00a0ق.',
    zinnen: 'Alle zinnen',
    zinnenIntro: 'Honderd zinnen, in de volgorde waarin het pad ze tegenkomt.',
    colofonKop: 'Over dit boek',
    colofonTekst: 'Dit boek wordt uit de app zelf gezet: elk woord, elke letter en elke uitleg komt uit dezelfde bron als de lessen. Komt er een woord bij de cursus, dan staat het in de volgende druk.',
    colofonHoren: 'Horen hoort erbij. Elk woord hier staat ook in de app, ingesproken door een Marokkaanse stem — lees hier, luister daar.',
  },
  fr: {
    slogan: 'Tous les mots, toutes les lettres et la grammaire — tout le parcours sur papier.',
    telwoorden: ['unités', 'lettres', 'mots', 'expressions', 'phrases'],
    alfabet: "L'alphabet",
    alfabetIntro: "Vingt-huit lettres, dans les groupes où l'app les enseigne : celles qui partagent le même squelette sont réunies, car ب ت ث ne diffèrent que par les points. Pour chaque lettre, les trois formes — au début, au milieu et à la fin d'un mot.",
    pad: 'Le parcours',
    padIntro: "Dix-sept unités, chacune bâtie sur la précédente. Ci-dessous, le contenu de chaque unité et les explications que l'app donne en chemin — la grammaire, rassemblée.",
    woorden: 'Tous les mots',
    woordenIntro: "Par thème, comme dans l'app. La colonne du milieu est la graphie latine que les Marocains utilisent eux-mêmes dans leurs messages : 3\u00a0=\u00a0ع, 7\u00a0=\u00a0ح, 9\u00a0=\u00a0ق.",
    zinnen: 'Toutes les phrases',
    zinnenIntro: "Cent phrases, dans l'ordre où le parcours les rencontre.",
    colofonKop: 'À propos de ce livre',
    colofonTekst: "Ce livre est composé à partir de l'app elle-même : chaque mot, chaque lettre et chaque explication vient de la même source que les leçons. Un mot ajouté au cours figure dans le tirage suivant.",
    colofonHoren: "Écouter fait partie de l'apprentissage. Chaque mot d'ici se trouve aussi dans l'app, enregistré par une voix marocaine — lisez ici, écoutez là-bas.",
  },
  de: {
    slogan: 'Alle Wörter, alle Buchstaben und die Grammatik — der ganze Weg auf Papier.',
    telwoorden: ['Einheiten', 'Buchstaben', 'Wörter', 'Wendungen', 'Sätze'],
    alfabet: 'Das Alphabet',
    alfabetIntro: 'Achtundzwanzig Buchstaben, in den Gruppen, in denen die App sie lehrt: Buchstaben mit demselben Grundgerüst stehen beieinander, denn ب ت ث unterscheiden sich nur in den Punkten. Zu jedem Buchstaben die drei Formen — am Anfang, in der Mitte und am Ende eines Wortes.',
    pad: 'Der Weg',
    padIntro: 'Siebzehn Einheiten, jede auf der vorigen aufgebaut. Unten steht pro Einheit, was darin vorkommt, und die Erklärungen, die die App unterwegs gibt — die Grammatik, beisammen.',
    woorden: 'Alle Wörter',
    woordenIntro: 'Nach Thema, wie in der App. Die mittlere Spalte ist die lateinische Schreibweise, die Marokkaner selbst in Nachrichten benutzen: 3\u00a0=\u00a0ع, 7\u00a0=\u00a0ح, 9\u00a0=\u00a0ق.',
    zinnen: 'Alle Sätze',
    zinnenIntro: 'Hundert Sätze, in der Reihenfolge, in der der Weg sie trifft.',
    colofonKop: 'Über dieses Buch',
    colofonTekst: 'Dieses Buch wird aus der App selbst gesetzt: jedes Wort, jeder Buchstabe und jede Erklärung stammt aus derselben Quelle wie die Lektionen. Kommt ein Wort zum Kurs dazu, steht es in der nächsten Auflage.',
    colofonHoren: 'Hören gehört dazu. Jedes Wort hier steht auch in der App, gesprochen von einer marokkanischen Stimme — hier lesen, dort hören.',
  },
  es: {
    slogan: 'Todas las palabras, todas las letras y la gramática: el camino entero en papel.',
    telwoorden: ['unidades', 'letras', 'palabras', 'expresiones', 'frases'],
    alfabet: 'El alfabeto',
    alfabetIntro: 'Veintiocho letras, en los grupos en que la app las enseña: las que comparten el mismo esqueleto van juntas, porque ب ت ث solo se distinguen por los puntos. De cada letra, las tres formas: al principio, en medio y al final de una palabra.',
    pad: 'El camino',
    padIntro: 'Diecisiete unidades, cada una construida sobre la anterior. Abajo, qué hay en cada unidad y las explicaciones que la app da por el camino: la gramática, toda junta.',
    woorden: 'Todas las palabras',
    woordenIntro: 'Por tema, como en la app. La columna del medio es la grafía latina que los propios marroquíes usan en sus mensajes: 3\u00a0=\u00a0ع, 7\u00a0=\u00a0ح, 9\u00a0=\u00a0ق.',
    zinnen: 'Todas las frases',
    zinnenIntro: 'Cien frases, en el orden en que el camino las encuentra.',
    colofonKop: 'Sobre este libro',
    colofonTekst: 'Este libro se compone desde la propia app: cada palabra, cada letra y cada explicación sale de la misma fuente que las lecciones. Si una palabra entra en el curso, aparece en la siguiente edición.',
    colofonHoren: 'Escuchar forma parte. Cada palabra de aquí está también en la app, grabada por una voz marroquí: lee aquí, escucha allí.',
  },
  it: {
    slogan: "Tutte le parole, tutte le lettere e la grammatica: l'intero percorso su carta.",
    telwoorden: ['unità', 'lettere', 'parole', 'espressioni', 'frasi'],
    alfabet: "L'alfabeto",
    alfabetIntro: "Ventotto lettere, nei gruppi in cui l'app le insegna: quelle che condividono lo stesso scheletro stanno insieme, perché ب ت ث si distinguono solo per i puntini. Di ogni lettera le tre forme: all'inizio, in mezzo e alla fine di una parola.",
    pad: 'Il percorso',
    padIntro: "Diciassette unità, ognuna costruita sulla precedente. Qui sotto, per ogni unità, che cosa contiene e le spiegazioni che l'app dà lungo la strada: la grammatica, tutta insieme.",
    woorden: 'Tutte le parole',
    woordenIntro: "Per argomento, come nell'app. La colonna centrale è la grafia latina che i marocchini usano nei messaggi: 3\u00a0=\u00a0ع, 7\u00a0=\u00a0ح, 9\u00a0=\u00a0ق.",
    zinnen: 'Tutte le frasi',
    zinnenIntro: 'Cento frasi, nell\u2019ordine in cui il percorso le incontra.',
    colofonKop: 'Su questo libro',
    colofonTekst: "Questo libro è composto dall'app stessa: ogni parola, ogni lettera e ogni spiegazione viene dalla stessa fonte delle lezioni. Se una parola entra nel corso, è nella stampa successiva.",
    colofonHoren: "Ascoltare fa parte del gioco. Ogni parola qui è anche nell'app, registrata da una voce marocchina: leggi qui, ascolta lì.",
  },
  en: {
    slogan: 'Every word, every letter and the grammar — the whole path on paper.',
    telwoorden: ['units', 'letters', 'words', 'phrases', 'sentences'],
    alfabet: 'The alphabet',
    alfabetIntro: 'Twenty-eight letters, in the groups the app teaches them in: letters that share a skeleton sit together, because ب ت ث differ only in dots. Each letter shows its three shapes — at the start, in the middle and at the end of a word.',
    pad: 'The path',
    padIntro: 'Seventeen units, each built on the one before. Below, what is in each unit and the notes the app gives along the way — the grammar, in one place.',
    woorden: 'Every word',
    woordenIntro: 'By topic, as in the app. The middle column is the Latin spelling Moroccans use in their own messages: 3\u00a0=\u00a0ع, 7\u00a0=\u00a0ح, 9\u00a0=\u00a0ق.',
    zinnen: 'Every sentence',
    zinnenIntro: 'A hundred sentences, in the order the path meets them.',
    colofonKop: 'About this book',
    colofonTekst: 'This book is typeset from the app itself: every word, every letter and every note comes from the same source as the lessons. A word added to the course is in the next printing.',
    colofonHoren: 'Hearing is half of it. Every word here is in the app too, recorded by a Moroccan voice — read here, listen there.',
  },
}
const T = BOEK[LANG] ?? BOEK.nl

/* ------------------------------------------------------------------ the book */

const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))

const woordRij = (w) => `
  <tr>
    <td class="ar">${esc(w.ar)}</td>
    <td class="tr">${esc(w.tr)}</td>
    <td class="nl">${esc(w.nl)}${w.note ? `<span class="note">${esc(w.note)}</span>` : ''}</td>
  </tr>`

const letterKaart = (l) => `
  <div class="letter">
    <div class="glyph">${esc(l.ar)}</div>
    <div class="over">
      <div class="naam">${esc(l.naam)} <span class="lat">${esc(l.tr)}</span></div>
      <div class="klank">${esc(l.klank)}</div>
      <div class="vormen">
        <span>${esc(l.forms.initial)}</span><span>${esc(l.forms.medial)}</span><span>${esc(l.forms.final)}</span>
      </div>
      ${l.voorbeeld ? `<div class="vb"><span class="ar">${esc(l.voorbeeld.ar)}</span> ${esc(l.voorbeeld.tr)}</div>` : ''}
    </div>
  </div>`

const html = `<!doctype html>
<html lang="${LANG}"><head><meta charset="utf-8">
<title>${esc(book.titel)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=IBM+Plex+Sans:wght@400;600&family=Noto+Naskh+Arabic:wght@400;700&display=swap">
<style>
  @page { size: A4; margin: 18mm 16mm 20mm; }
  :root {
    --ink:#221a16; --soft:#5f5449; --faint:#8b8075; --line:#e4d8c5;
    --saffron:#d97706; --zellige:#0f766e; --alam:#c1272d; --khatim:#006233;
  }
  * { box-sizing: border-box; }
  body { margin:0; font-family:"IBM Plex Sans",sans-serif; color:var(--ink); font-size:10.5pt; line-height:1.5; }
  h1,h2,h3 { font-family:"Baloo 2",sans-serif; font-weight:800; margin:0; line-height:1.15; }
  .ar { font-family:"Noto Naskh Arabic",serif; direction:rtl; font-weight:700; }

  .cover { height:calc(297mm - 38mm); display:flex; flex-direction:column; justify-content:center; gap:14mm; page-break-after:always; }
  .cover h1 { font-size:34pt; }
  .cover .slogan { font-size:14pt; color:var(--soft); max-width:120mm; }
  .cover .cijfers { font-size:10pt; color:var(--faint); font-family:"IBM Plex Sans"; }
  .vlag { width:26mm; }

  h2.deel { font-size:20pt; margin:0 0 2mm; page-break-before:always; padding-top:2mm; }
  h2.deel + .intro { color:var(--soft); margin:0 0 6mm; max-width:150mm; }
  h3 { font-size:12pt; margin:6mm 0 2mm; color:var(--zellige); }

  table { width:100%; border-collapse:collapse; page-break-inside:auto; }
  tr { page-break-inside:avoid; }
  td { padding:1.6mm 2mm; border-bottom:.3pt solid var(--line); vertical-align:top; }
  td.ar { width:34mm; font-size:14pt; text-align:right; }
  td.tr { width:34mm; font-weight:600; color:var(--zellige); }
  td.nl { color:var(--soft); }
  .note { display:block; font-size:8.5pt; color:var(--faint); }
  /* Hele zinnen zijn te lang voor een woordkolom en breken dan over drie regels. */
  table.zinnen td.ar { width:62mm; }
  table.zinnen td.tr { width:48mm; }

  .slot { page-break-before:always; padding-top:4mm; }
  .slot h2 { font-size:20pt; margin-bottom:3mm; }
  .slot p { color:var(--soft); max-width:150mm; }

  .letters { display:grid; grid-template-columns:1fr 1fr; gap:3mm; }
  .letter { display:flex; gap:3mm; border:.4pt solid var(--line); border-radius:3mm; padding:2.5mm; page-break-inside:avoid; }
  .letter .glyph { font-family:"Noto Naskh Arabic",serif; font-size:22pt; font-weight:700; width:12mm; text-align:center; }
  .letter .naam { font-family:"Baloo 2"; font-weight:800; }
  .letter .lat { color:var(--faint); font-weight:400; }
  .letter .klank { font-size:8.5pt; color:var(--soft); }
  .letter .vormen { font-family:"Noto Naskh Arabic",serif; direction:rtl; display:flex; gap:4mm; font-size:13pt; margin-top:1mm; }
  .letter .vb { font-size:8.5pt; color:var(--faint); margin-top:1mm; }
  .letter .vb .ar { font-size:11pt; }

  .unit { page-break-inside:avoid; margin-bottom:5mm; }
  .unit .kop { display:flex; align-items:baseline; gap:3mm; }
  .unit .level { font-size:8pt; font-weight:600; color:var(--alam); border:.4pt solid var(--alam); border-radius:2mm; padding:.3mm 1.6mm; }
  .unit .lessen { color:var(--faint); font-size:9pt; }
  .tip { border-left:1mm solid var(--saffron); padding:1.5mm 0 1.5mm 3mm; margin:2mm 0; page-break-inside:avoid; }
  .tip b { font-family:"Baloo 2"; }
  .tip p { margin:.5mm 0 0; color:var(--soft); }

  footer { position:fixed; bottom:-12mm; left:0; right:0; font-size:8pt; color:var(--faint); text-align:center; }
</style></head><body>

<section class="cover">
  <svg class="vlag" viewBox="0 0 60 40"><rect width="60" height="40" rx="4" fill="#c1272d"></rect>
    <g transform="translate(30 20) scale(0.3) translate(-50 -50)">
      <path d="M50 2 L78.5 89.7 L3.8 35.5 L96.2 35.5 L21.5 89.7 Z" fill="none" stroke="#006233" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"></path>
    </g></svg>
  <div>
    <h1>${esc(book.titel)}</h1>
    <p class="slogan">${esc(T.slogan)}</p>
  </div>
  <p class="cijfers">
    ${[telling.units, telling.letters, telling.woorden, telling.uitdrukkingen, telling.zinnen]
      .map((n, i) => `${n} ${esc(T.telwoorden[i])}`).join(' &middot; ')}
  </p>
</section>

<h2 class="deel">${esc(T.alfabet)}</h2>
<p class="intro">${esc(T.alfabetIntro)}</p>
<div class="letters">${book.letters.map(letterKaart).join('')}</div>

<h2 class="deel">${esc(T.pad)}</h2>
<p class="intro">${esc(T.padIntro)}</p>
${book.units.map((u) => `
  <div class="unit">
    <div class="kop">
      <h3>${esc(u.emoji)} ${esc(u.title)}</h3>
      <span class="level">${esc(u.level)}</span>
      <span class="ar">${esc(u.ar)}</span>
    </div>
    <div class="lessen">${esc(u.subtitle)} &mdash; ${u.lessen.map(esc).join(' &middot; ')}</div>
    ${u.tips.map((tip) => `<div class="tip"><b>${esc(tip.title)}</b><p>${esc(tip.body)}</p></div>`).join('')}
  </div>`).join('')}

<h2 class="deel">${esc(T.woorden)}</h2>
<p class="intro">${esc(T.woordenIntro)}</p>
${book.topics.map((g) => `
  <h3>${esc(g.emoji)} ${esc(g.naam)}</h3>
  <table>${g.woorden.map(woordRij).join('')}${g.zinnen.map(woordRij).join('')}</table>`).join('')}

<h2 class="deel">${esc(T.zinnen)}</h2>
<p class="intro">${esc(T.zinnenIntro)}</p>
<table class="zinnen">${book.zinnen.map(woordRij).join('')}</table>

<div class="slot">
  <h2>${esc(T.colofonKop)}</h2>
  <p>${esc(T.colofonTekst)}</p>
  <p>${esc(T.colofonHoren)}</p>
</div>

</body></html>`

await mkdir(path.dirname(OUT), { recursive: true })
const tmp = path.join(tmpdir(), `.${path.basename(OUT)}.html`)
await writeFile(tmp, html)

const printer = await startChroom()
const sheet = await printer.newPage()
await sheet.goto(`file://${tmp}`, { waitUntil: 'networkidle' })
await sheet.emulateMedia({ media: 'print' })
await sheet.pdf({
  path: OUT,
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate:
    '<div style="width:100%;font-size:8px;color:#8b8075;text-align:center;font-family:sans-serif">'
    + `${book.titel} &middot; <span class="pageNumber"></span></div>`,
  margin: { top: '18mm', bottom: '20mm', left: '16mm', right: '16mm' },
})
await printer.close()
await server.close()

const bytes = (await readFile(OUT)).length
console.log(`${path.relative(ROOT, OUT)} — ${(bytes / 1024 / 1024).toFixed(1)} MB`)
