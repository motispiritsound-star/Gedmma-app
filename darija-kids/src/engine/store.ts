import { useSyncExternalStore } from 'react'
import type { Card } from './srs'
import { newCard, review, type Grade } from './srs'
import { LESSONS, UNITS } from '../content/curriculum'
import { WORDS } from '../content/words'
import { ALL_SENTENCES } from '../content/sentences'
import { LETTERS } from '../content/alphabet'
import { detectLang, isLang, type Lang } from '../i18n/languages'
import type { Strings } from '../i18n/nl'

/**
 * All progress lives in the browser. Nothing is uploaded, there is no account,
 * and a child can use the app without anyone collecting a thing.
 */

const KEY = 'darijakids.v1'
export const MAX_HEARTS = 5

/**
 * What is free, per unit: the first so many lessons, not whole units.
 *
 * Three pieces of the alphabet and the first lesson of greetings. That is
 * about twelve minutes: long enough to read a handful of Arabic letters and
 * to say hello, thank you and goodbye — something a child can show to someone
 * the same evening — and short enough that the question "and then?" arrives
 * while they are still enjoying it.
 *
 * A whole unit free was too much: finishing one is weeks of work, and by then
 * nobody is trying the thing out any more. Counting in lessons instead of in
 * units also lets the free part end inside the alphabet, so what comes next is
 * visible on the path rather than hidden behind a unit that never opens.
 *
 * Everything past this is the subscription, with three free days first.
 */
export const GRATIS_LESSEN: Record<string, number> = { hruf: 3, groeten: 1 }

/** How many lessons that is altogether — the number the app quotes. */
export const FREE_LESSONS = Object.values(GRATIS_LESSEN).reduce((a, b) => a + b, 0)

/** The lessons themselves, in the order of the path. */
const gratisLes = UNITS.flatMap((u) => u.lessons.slice(0, GRATIS_LESSEN[u.id] ?? 0))

/**
 * Wat er buiten de lessen om open staat: precies wat in een gratis les zit.
 *
 * Het woordenboek, het alfabet, de verhalen en de spelletjes hangen niet aan
 * het pad — wie daarheen loopt komt bij alle 304 woorden en alle 28 letters,
 * ook zonder ooit een les te doen. Dan is het pad een formaliteit en de hele
 * cursus gratis, en dat is precies waarom iemand zou blijven hangen zonder
 * ooit te betalen.
 *
 * De regel is nu simpel en uit te leggen: je kunt horen wat je geleerd hebt.
 * De rest staat er wel, zichtbaar en met slotje, want zien wat er nog komt is
 * de beste reden om verder te willen.
 */
export const GRATIS_WOORDEN = new Set(gratisLes.flatMap((l) => l.words))
export const GRATIS_LETTERS = new Set(gratisLes.flatMap((l) => l.letters ?? []))

/** True als dit woord buiten de gratis lessen valt en er niet is betaald. */
export const woordOpSlot = (id: string, s: State = state): boolean =>
  !s.unlocked && !GRATIS_WOORDEN.has(id)

/** Idem voor een letter van het alfabet. */
export const letterOpSlot = (id: string, s: State = state): boolean =>
  !s.unlocked && !GRATIS_LETTERS.has(id)

/** What one right answer is worth, paid out the moment it happens. */
export const XP_PER_CORRECT = 2

/** A gem every time a run reaches another multiple of this. */
export const COMBO_GEM_EVERY = 5
export const HEART_REFILL_MS = 20 * 60_000

/**
 * De kleuren die een gebruiker voor zichzelf kan kiezen.
 *
 * Vier, en niet meer: elke kleur moet op de donkere inkt leesbaar zijn en in
 * allebei de standen kloppen, en vier is genoeg om het van jezelf te laten
 * voelen zonder dat er een die nergens op lijkt tussen zit.
 */
export const ACCENTEN = ['saffraan', 'zellige', 'terra', 'mint'] as const
export type Accent = (typeof ACCENTEN)[number]

/**
 * De kleur zelf, voor het bolletje dat je aantikt.
 *
 * Een naam als "zellige" zegt een kind niets, dus staat de kleur in de knop en
 * de naam eronder voor wie hem voorleest. Deze waarden horen gelijk te lopen
 * met `--accent-500` in `index.css`; `kleurkeuze.test.ts` legt ze naast elkaar.
 */
export const ACCENTKLEUR: Record<Accent, string> = {
  saffraan: '#f59e0b',
  zellige: '#14b8a6',
  terra: '#e2603c',
  mint: '#22c55e',
}

/**
 * De dieren waaruit je kiest.
 *
 * Stond twee keer: op het startscherm en op het profiel. Twee lijsten die
 * hetzelfde horen te zijn lopen uit elkaar zodra er eentje bijkomt, en dan
 * heeft een kind een dier dat hij later niet terugvindt.
 */
export const AVATARS = ['🦊', '🦉', '🐪', '🦁', '🐈', '🦋', '⭐', '🌙', '🫖', '⚽'] as const

export interface Settings {
  theme: 'system' | 'light' | 'dark'
  /** De kleur van de knoppen, de voortgang en je avatar. Zie `ACCENTEN`. */
  accent: Accent
  /** Interface and meanings; the Darija itself never changes. */
  lang: Lang
  showScript: boolean
  showTranslit: boolean
  sound: boolean
  /**
   * Play the effects as little files through the media channel instead of
   * synthesising them live. Slower to react, but an iPhone with the side
   * switch on silent mutes the live mixer and not this.
   */
  mediaSound: boolean
  /**
   * True once somebody has actually flipped the switch above. Until then the
   * app keeps deciding for itself, so a device that turns out to need the
   * media channel gets it on the next visit rather than never.
   */
  mediaSoundPicked: boolean
  /** The short animated scene after a finished lesson. */
  film: boolean
  /**
   * Whether a history card is read aloud in the interface language.
   *
   * Separate from `sound`, because the two are different wishes: a classroom
   * may want the tune and not the narrator, and a child who reads slowly
   * wants the narrator most of all. Silent when the device has no voice for
   * the language, and the card says nothing about it — the text is there.
   */
  voorlezen: boolean
  /**
   * The tracing bonus: drawing a letter over a ghost of itself.
   *
   * On by default, off for a child who cannot draw on a screen — a finger on
   * glass is not everybody's hand, and nothing else in the app needs it.
   */
  schrijven: boolean
  speech: boolean
  /**
   * Trillen bij een goed of fout antwoord, en onder je vinger bij het
   * natekenen.
   *
   * Aan, want het is een van de weinige dingen die een app kan en een
   * browser niet. Uit voor wie er niet tegen kan, en vanzelf stil op een
   * toestel zonder trilmotor.
   */
  trillen: boolean
  /**
   * Eén melding per dag, op een tijd die de ouder kiest.
   *
   * Uit tot iemand er zelf om vraagt. Een app die ongevraagd om toestemming
   * voor meldingen vraagt bij de eerste start, krijgt van de helft van de
   * ouders nee — en die nee is daarna moeilijk terug te draaien.
   */
  herinnering: boolean
  /** Hoe laat, als "18:30". */
  herinneringTijd: string
  hearts: boolean
  /** The voice the learner picked, by voiceURI. Empty means: pick the best. */
  voiceURI: string
  /** Read the Latin spelling with a European voice when there is no Arabic one. */
  fallbackVoice: boolean
  motion: 'full' | 'calm'
  reading: 'normal' | 'dyslexia'
  dailyGoal: number
  voiceRate: number
}

export interface LessonRecord {
  stars: number
  runs: number
  bestScore: number
  lastDone: number
}

/** What a parent chose on the "for parents" screen, kept on the device. */
export interface Aanmelding {
  id: string
  email: string
  status: 'wacht' | 'bevestigd'
  nieuws: boolean
  voortgang: boolean
  /** When the five counts last went out, so they go at most once a day. */
  gemeld?: number
}

export interface State {
  version: 1
  name: string
  avatar: string
  createdAt: number
  xp: number
  gems: number
  hearts: number
  heartsAt: number
  streak: number
  bestStreak: number
  lastDay: string | null
  freezes: number
  daily: Record<string, number>
  lessons: Record<string, LessonRecord>
  cards: Record<string, Card>
  /**
   * The scheduler for everything that is not a word: letters as `l:ba`,
   * sentences as `z:groeten-1-a`. Kept apart from `cards` so that "words seen"
   * stays a count of words.
   */
  extraCards: Record<string, Card>
  /** How many sentences have been answered, ever. */
  sentencesDone: number
  quests: QuestProgress
  bonus: BonusProgress
  badges: string[]
  /** True once the full course has been bought, in either store. */
  unlocked: boolean
  unlockedAt: number | null
  /**
   * True once the e-book has been paid for — with the year up front, which has
   * it in the price, or bought on its own.
   *
   * Kept apart from `unlocked` because it never expires: a book that was paid
   * for stays paid for, also when the subscription that came with it ends.
   */
  ebook: boolean
  /**
   * Vanaf wanneer het e-boek geopend mag worden, of null als er geen recht is.
   *
   * Los gekocht is dat meteen. Bij het jaarabonnement is het drie dagen later,
   * want zolang de proefperiode loopt is er nog niets betaald — en een boek is
   * een bestand dat je één keer opslaat en houdt. Zonder dit kon iemand het
   * jaar afsluiten, het boek openen en binnen drie dagen opzeggen.
   */
  ebookVanaf: number | null
  /**
   * The parent's sign-up for mail, or null when nobody asked for any.
   *
   * Only what the screen needs to say what was chosen, plus the id the weekly
   * counts go under. The list lives on the server; this is the receipt.
   */
  post: Aanmelding | null
  langPicked: boolean
  /**
   * True zodra het keuzescherm na de taalkeuze één keer is getoond.
   *
   * Eén keer, en daarna nooit meer. Wie "eerst de gratis lessen" kiest heeft
   * antwoord gegeven, en dezelfde vraag nog eens stellen is zeuren — de weg
   * naar het abonnement staat de rest van de tijd gewoon op het pad, bij les
   * vijf.
   */
  aanbodGezien: boolean
  seenTips: string[]
  /**
   * Which history cards have been earned, oldest first.
   *
   * A checkpoint hands one out, and it stays: the collection page is the only
   * place they can be read back, and a card that vanished with the film would
   * be a reward that evaporates.
   */
  history: string[]
  /**
   * Eén diploma per afgeronde unit, op de unit-id.
   *
   * De vorm en alles wat ermee gebeurt staat in `engine/diploma.ts`; hier
   * staat alleen het veld, omdat `hydrate` de enige plek is waar een opslag
   * van een oudere versie het erbij krijgt. Zonder dat is `diplomas`
   * `undefined` bij iedereen die de app al heeft, en dan werpt de plank op de
   * eerste `Object.keys`.
   */
  diplomas: Record<string, Diploma>
  /**
   * Welke ondertekende diploma's het kind al gezien heeft.
   *
   * Alleen om "nieuw" te kunnen zeggen op de kaart naar de plank. Een
   * handtekening die een ouder zet terwijl het kind naar de telefoon kijkt
   * ziet het meteen; een die hij 's avonds zet moet het de volgende dag nog
   * kunnen vinden, en zonder dit is er niets dat het verschil weet.
   */
  diplomaGezien: string[]
  settings: Settings
}

/**
 * Het diploma van één unit.
 *
 * Zo kort als het kan. Wat af te leiden is staat er niet in: hoeveel khatims
 * er gehaald zijn komt uit `lessons`, en hoeveel er te halen waren uit
 * `UNITS`. Dat is geen zuinigheid maar juistheid — een kind dat een les
 * overdoet en van twee naar drie sterren gaat, hoort dat op zijn diploma
 * terug te zien, en een opgeslagen aantal zou voor altijd de oude stand
 * houden.
 */
export interface Diploma {
  /** Wanneer de laatste les van de unit af was. */
  op: number
  /** Wie ondertekende, zoals de volwassene het zelf opschreef. Leeg: nog niet. */
  door: string
  /** Wanneer er ondertekend is, of null. */
  getekendOp: number | null
  /** Het compliment erbij. Mag leeg: een naam eronder is ook iets. */
  woord: string
}

/**
 * The missions of the day.
 *
 * Counting is the whole trick: a child can see the number go up while they
 * answer, which is a different feeling from a number that only appears at the
 * end of a lesson. The counters reset at midnight; the gems, once claimed, do
 * not.
 */
export interface QuestProgress {
  day: string
  /** Right answers today. */
  goed: number
  /** Answers given in a review round today. */
  herhaald: number
  /** Sentences answered today. */
  zinnen: number
  /** Lessons finished today. */
  lessen: number
  /** Bonus rounds finished today. */
  bonus: number
  claimed: QuestId[]
}

export type QuestId = 'lessen' | 'goed' | 'herhaald' | 'zinnen' | 'bonus'

export interface Quest {
  id: QuestId
  emoji: string
  goal: number
  gems: number
}

/**
 * Five missions, the same five every day: predictable beats surprising.
 *
 * The last one is the one that still works when the course is finished — there
 * is always a bonus round to do, and there always will be.
 */
export const QUESTS: Quest[] = [
  { id: 'lessen', emoji: '📗', goal: 1, gems: 3 },
  { id: 'goed', emoji: '✅', goal: 20, gems: 5 },
  { id: 'herhaald', emoji: '🔁', goal: 10, gems: 5 },
  { id: 'zinnen', emoji: '💬', goal: 4, gems: 4 },
  { id: 'bonus', emoji: '⭐', goal: 1, gems: 4 },
]

const emptyQuests = (day: string): QuestProgress =>
  ({ day, goed: 0, herhaald: 0, zinnen: 0, lessen: 0, bonus: 0, claimed: [] })

/**
 * What the bonus rounds have added up to.
 *
 * `reeks` and `getekend` never reset: they are the two numbers a child can
 * keep beating after every unit is done.
 */
export interface BonusProgress {
  day: string
  /** Bonus rounds finished today. */
  today: number
  /** Bonus rounds finished, ever. */
  total: number
  /** The longest run of right answers in a marathon, ever. */
  reeks: number
  /** Letters and words traced, ever. */
  getekend: number
}

const emptyBonus = (day: string): BonusProgress =>
  ({ day, today: 0, total: 0, reeks: 0, getekend: 0 })

export const today = (d = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const dayBefore = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y!, m! - 1, d!)
  dt.setDate(dt.getDate() - 1)
  return today(dt)
}

/**
 * True on an iPhone or iPad.
 *
 * There the switch on the side mutes the synthesiser and leaves the speech
 * engine alone — the exact shape of "I hear the words but none of the sounds".
 * Asking for a playback audio session is supposed to settle it, and on paper
 * it does; in practice the only route that reliably gets past that switch is
 * the media channel, and a few milliseconds of extra delay is a cheap price
 * for a button that can be heard.
 */
/**
 * Of dit toestel een stilteschakelaar heeft die de mixer dempt.
 *
 * Geëxporteerd omdat de uitleg over geluid dat niet klinkt er ook van
 * afhangt: het schuifje aan de zijkant bestaat op een iPhone en op een iPad,
 * en nergens anders. Op Android is het advies een ander — daar zit het in het
 * mediavolume, dat losstaat van het belvolume.
 */
export function heeftStilteschakelaar(): boolean {
  return prefersMediaChannel()
}

function prefersMediaChannel(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

const initial = (): State => ({
  version: 1,
  name: '',
  avatar: '🦉',
  createdAt: Date.now(),
  xp: 0,
  gems: 0,
  hearts: MAX_HEARTS,
  heartsAt: Date.now(),
  streak: 0,
  bestStreak: 0,
  lastDay: null,
  freezes: 0,
  daily: {},
  lessons: {},
  cards: {},
  extraCards: {},
  sentencesDone: 0,
  quests: emptyQuests(today()),
  bonus: emptyBonus(today()),
  badges: [],
  unlocked: false,
  unlockedAt: null,
  ebook: false,
  ebookVanaf: null,
  post: null,
  /** False until somebody has picked a language on the welcome screen. */
  langPicked: false,
  aanbodGezien: false,
  seenTips: [],
  history: [],
  diplomas: {},
  diplomaGezien: [],
  settings: {
    theme: 'system',
    accent: 'saffraan',
    lang: detectLang(),
    showScript: true,
    showTranslit: true,
    sound: true,
    mediaSound: prefersMediaChannel(),
    mediaSoundPicked: false,
    film: true,
    voorlezen: true,
    schrijven: true,
    speech: true,
    trillen: true,
    herinnering: false,
    herinneringTijd: '18:30',
    hearts: true,
    voiceURI: '',
    fallbackVoice: true,
    motion: 'full',
    reading: 'normal',
    dailyGoal: 30,
    voiceRate: 0.85,
  },
})

/**
 * A saved game, brought up to the shape this version expects.
 *
 * Every nested object is merged field by field rather than replaced, because a
 * save written by an older version is missing whatever was added since — and a
 * counter that is missing rather than zero turns into NaN the first time
 * something adds one to it, which is how a mission silently stops working for
 * everybody who already had the app.
 */

/* --------------------------------------- een opslag die niet meer klopt */

/**
 * Deze drie nemen een bewaarde waarde alleen over als hij de vorm heeft die
 * deze versie verwacht, en vallen anders terug op de beginwaarde.
 *
 * Het lijkt overdreven totdat je het meet. Veertien kapotte staten door de app
 * gehaald, en vier lieten hem omvallen bij het opstarten: `daily`, `cards`,
 * `lessons` of `extraCards` op `null` zetten is genoeg. `Object.keys(null)`
 * werpt, en dat gebeurt in de eerste tekening van het leerpad.
 *
 * Het foutscherm ving het op en biedt de ouder een uitweg, dus niemand zat
 * voorgoed vast — maar die uitweg is "wis alles", en dan is er een jaar
 * voortgang weg om één kapot veld. Nu blijft alles overeind wat nog wél
 * klopt, en valt alleen het kapotte veld terug op nul.
 *
 * Hoe komt een opslag kapot? Een versie die later iets anders schrijft en dan
 * wordt teruggedraaid, een browser die bij een volle schijf half wegschrijft,
 * of gewoon een fout van ons. Het hoeft niet vaak te gebeuren om vervelend te
 * zijn: dit is de enige plek waar de voortgang van een kind staat.
 */
const voorwerp = <T,>(waarde: unknown, terugval: T): T =>
  waarde !== null && typeof waarde === 'object' && !Array.isArray(waarde) ? (waarde as T) : terugval

const lijst = <T,>(waarde: unknown, terugval: T[]): T[] =>
  Array.isArray(waarde) ? (waarde as T[]) : terugval

const getal = (waarde: unknown, terugval: number): number =>
  typeof waarde === 'number' && Number.isFinite(waarde) ? waarde : terugval

/**
 * Kaarten voor woorden die niet meer bestaan.
 *
 * `word(id)` werpt bij een onbekend id, en dat gebeurt op /herhalen in de
 * lijst "deze zitten nog het minst vast" — dus bij een opslag met één zo'n
 * kaart is de hele bladzijde weg, met foutscherm en al. Nagemeten met een
 * verzonnen id: precies dat.
 *
 * Het is geen verzonnen geval. Een woord-id dat we hernoemen of weghalen
 * laat bij iedereen die dat woord al geleerd had zo'n kaart achter, en die
 * opslag staat op het toestel — hij komt met de volgende versie gewoon weer
 * binnen. Een kaart zonder woord kan niets meer: niet getoond, niet
 * overhoord, niet gepland. Hier valt hij af, en alles eromheen blijft staan.
 */
const WOORD_IDS = new Set(WORDS.map((w) => w.id))

/**
 * Hetzelfde geldt voor de letters en de zinnen, die met hun voorvoegsel in
 * `extraCards` staan. `sentence(id)` werpt net zo goed, en die wordt
 * aangeroepen in `buildReviewRound` — dus een zin-id dat we weghalen laat de
 * herhaalronde omvallen op het moment dat je hem start.
 *
 * Een sleutel zonder `l:` of `z:` ervoor hoort er helemaal niet te zijn en
 * valt hier ook af.
 */
const EXTRA_IDS = new Set([
  ...LETTERS.map((l) => `l:${l.id}`),
  ...ALL_SENTENCES.map((z) => `z:${z.id}`),
])

const alleenBekend = (kaarten: Record<string, Card>, bekend: Set<string>): Record<string, Card> => {
  const uit: Record<string, Card> = {}
  for (const id of Object.keys(kaarten)) if (bekend.has(id)) uit[id] = kaarten[id]!
  return uit
}

/**
 * Geëxporteerd om hem te kunnen nameten, niet om hem elders te gebruiken.
 * `hydratatie.test.ts` voert hier de veertien kapotte staten doorheen die de
 * app eerder lieten omvallen.
 */
export function hydrate(parsed: Partial<State>): State {
  const base = initial()
  // Ook het geheel kan iets anders zijn dan een voorwerp -- een opslag met
  // alleen een tekst erin bijvoorbeeld.
  const p = voorwerp<Partial<State>>(parsed, {})
  return {
    ...base,
    ...p,
    cards: alleenBekend(voorwerp(p.cards, base.cards), WOORD_IDS),
    extraCards: alleenBekend(voorwerp(p.extraCards, base.extraCards), EXTRA_IDS),
    lessons: voorwerp(p.lessons, base.lessons),
    daily: voorwerp(p.daily, base.daily),
    badges: lijst(p.badges, base.badges),
    history: lijst(p.history, base.history),
    seenTips: lijst(p.seenTips, base.seenTips),
    /*
     * De plank. Een opslag van vóór deze versie heeft hem niet, en dan werpt
     * `Object.keys(undefined)` op de bladzijde zelf -- precies de fout die
     * `daily` en `cards` hierboven al vier keer hebben gemaakt.
     *
     * Leeg betekent niet "nog niets gehaald": `reikDiplomasUit` loopt bij het
     * opstarten alle units na en reikt uit wat er al af was. Zonder dat zou
     * iemand die de app een jaar heeft een plank krijgen die begint bij de
     * unit die hij hierna doet.
     */
    diplomas: voorwerp(p.diplomas, base.diplomas),
    diplomaGezien: lijst(p.diplomaGezien, base.diplomaGezien),
    // Een teller die geen getal is wordt NaN zodra er iets bij opgeteld wordt,
    // en NaN komt daarna nooit meer terug naar een getal.
    xp: getal(p.xp, base.xp),
    gems: getal(p.gems, base.gems),
    hearts: getal(p.hearts, base.hearts),
    heartsAt: getal(p.heartsAt, base.heartsAt),
    streak: getal(p.streak, base.streak),
    /*
     * Een record kan nooit lager zijn dan wat er nu staat.
     *
     * `bestStreak` wordt alleen bijgewerkt in `addXp`, op de dag dat de reeks
     * groeit. Raakt dat ene veld kwijt of beschadigd, dan staat er op /profiel
     * "41 / 0" bij REEKS / RECORD -- en verliest iemand met een reeks van
     * eenenveertig dagen ook zijn drie vlambeloningen, want die kijken naar
     * het record. Hier staat het weer recht, en het kan nooit de verkeerde
     * kant op: het neemt de hoogste van de twee.
     */
    bestStreak: Math.max(getal(p.bestStreak, base.bestStreak), getal(p.streak, base.streak)),
    freezes: getal(p.freezes, base.freezes),
    sentencesDone: getal(p.sentencesDone, base.sentencesDone),
    settings: { ...base.settings, ...voorwerp(p.settings, {}) },
    quests: { ...base.quests, ...voorwerp(p.quests, {}) },
    bonus: { ...base.bonus, ...voorwerp(p.bonus, {}) },
  }
}

/** Keys this app used under its earlier names, newest first. */
const OLD_KEYS = ['bladi.v1', 'gedmma.v1']

function load(): State {
  if (typeof localStorage === 'undefined') return initial()
  try {
    const raw = localStorage.getItem(KEY) ?? OLD_KEYS.map((k) => localStorage.getItem(k)).find(Boolean)
    if (!raw) return initial()
    const merged = hydrate(JSON.parse(raw) as Partial<State>)
    const base = initial()
    if (!isLang(merged.settings.lang)) merged.settings.lang = base.settings.lang
    // Nobody has chosen yet, so the app is still allowed to change its mind —
    // otherwise a visitor who opened the app before this existed would be
    // stuck with whatever the default happened to be that day.
    if (!merged.settings.mediaSoundPicked) merged.settings.mediaSound = prefersMediaChannel()
    return merged
  } catch {
    return initial()
  }
}

let state: State = load()
const listeners = new Set<() => void>()

const emit = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* private mode, a full disk — the session still works, it just forgets */
  }
  listeners.forEach((l) => l())
}

export function setState(next: Partial<State> | ((s: State) => Partial<State>)): void {
  const patch = typeof next === 'function' ? next(state) : next
  state = { ...state, ...patch }
  emit()
}

export const getState = (): State => state

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => void listeners.delete(l)
}

/**
 * Selectors must return something stable: a primitive, or a slice of state
 * that keeps its identity between updates. Building a new array or object in
 * the selector makes every render look like a change, and React will loop.
 */
export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(state),
  )
}

/* ------------------------------------------------------------------ hearts */

/** Hearts regrow with time; work it out on read rather than on a timer. */
export function heartsNow(s: State = state, now = Date.now()): number {
  if (!s.settings.hearts) return MAX_HEARTS
  if (s.hearts >= MAX_HEARTS) return MAX_HEARTS
  const grown = Math.floor((now - s.heartsAt) / HEART_REFILL_MS)
  return Math.min(MAX_HEARTS, s.hearts + grown)
}

export function msUntilNextHeart(s: State = state, now = Date.now()): number {
  if (heartsNow(s, now) >= MAX_HEARTS) return 0
  const elapsed = (now - s.heartsAt) % HEART_REFILL_MS
  return HEART_REFILL_MS - elapsed
}

export function loseHeart(): void {
  if (!state.settings.hearts) return
  const have = heartsNow()
  setState({ hearts: Math.max(0, have - 1), heartsAt: Date.now() })
}

export function refillHearts(cost = 0): void {
  setState((s) => ({ hearts: MAX_HEARTS, heartsAt: Date.now(), gems: Math.max(0, s.gems - cost) }))
}

/* ------------------------------------------------- waar de edelstenen heen gaan */

/**
 * Edelstenen werden verdiend en nergens uitgegeven.
 *
 * Vijf missies per dag leveren er eenentwintig op, en elke reeks van vijf
 * goede antwoorden nog één. Ze stapelden zich op tot een getal in de kopbalk
 * dat niets deed. Een beloning die nergens voor telt is na een week geen
 * beloning meer, en dat is precies het stuk dat de grote taalapps wél hebben:
 * verdienen en uitgeven horen bij elkaar.
 *
 * Dus twee dingen om te kopen, allebei op het moment dat ze helpen. Niet met
 * geld — nóóit met geld. Dit is een kinderapp, en edelstenen komen er alleen
 * in door te spelen. Het kostenplaatje is daarop gezet: een dag missies is
 * eenentwintig stenen, dus een rij hartjes is ongeveer drie missies en een
 * vriesdag ongeveer een hele dag.
 */
export const PRIJS_HARTEN = 15
export const PRIJS_VRIESDAG = 25

/**
 * Hoeveel vriesdagen je hoogstens op zak hebt.
 *
 * Twee, en niet meer. Een voorraad van tien maakt de reeks betekenisloos — dan
 * is er geen dag meer die telt. Twee is een weekend weg zijn.
 */
export const MAX_VRIESDAGEN = 2

export const kanHartenKopen = (s: State = state, now = Date.now()): boolean =>
  s.settings.hearts && heartsNow(s, now) < MAX_HEARTS && s.gems >= PRIJS_HARTEN

/** Geeft terug of het gelukt is, zodat de knop weet of er iets te vieren valt. */
export function koopHarten(now = Date.now()): boolean {
  if (!kanHartenKopen(state, now)) return false
  refillHearts(PRIJS_HARTEN)
  return true
}

export const kanVriesdagKopen = (s: State = state): boolean =>
  s.freezes < MAX_VRIESDAGEN && s.gems >= PRIJS_VRIESDAG

/**
 * Een vriesdag: één gemiste dag die de reeks niet breekt.
 *
 * De regel ervoor stond al in `addXp` -- `freezes > 0` en de dag ervóór de dag
 * ervoor -- maar er was geen enkele plek waar het getal omhoog ging. Die tak
 * kon dus nooit uitgevoerd worden. Nu wel.
 */
export function koopVriesdag(): boolean {
  if (!kanVriesdagKopen()) return false
  setState((s) => ({ freezes: s.freezes + 1, gems: s.gems - PRIJS_VRIESDAG }))
  return true
}

/* -------------------------------------------------------------- streak, xp */

export function addXp(amount: number): void {
  const day = today()
  setState((s) => {
    const daily = { ...s.daily, [day]: (s.daily[day] ?? 0) + amount }
    let { streak, bestStreak, freezes } = s
    if (s.lastDay !== day) {
      const continued = s.lastDay === dayBefore(day)
      if (continued) streak += 1
      else if (s.lastDay && freezes > 0 && s.lastDay === dayBefore(dayBefore(day))) {
        freezes -= 1
        streak += 1
      } else streak = 1
      bestStreak = Math.max(bestStreak, streak)
    }
    return { xp: s.xp + amount, daily, streak, bestStreak, freezes, lastDay: day }
  })
}

/**
 * De reeks zoals hij vandaag is, niet zoals hij was toen je wegging.
 *
 * `streak` wordt alleen bijgewerkt in `addXp`, en die draait pas als je een
 * antwoord geeft. Tot dat moment staat het oude getal er gewoon: wie veertig
 * dagen wegblijft en de app opent, ziet in de kopbalk nog steeds 🔥 12.
 * Nagemeten met vijf profielen — gisteren, eergisteren met en zonder
 * vriesdag, acht dagen en veertig dagen weg: alle vijf toonden 12.
 *
 * Dat is niet alleen onwaar, het maakt het moment van terugkomen naar. Je
 * doet een les in het vertrouwen dat je reeks doorloopt, en bij het eerste
 * goede antwoord springt hij naar 1 zonder dat er iets wordt gezegd.
 *
 * Dit is dezelfde regel als in `addXp`, maar dan om te laten zien: een reeks
 * leeft als je vandaag of gisteren geoefend hebt, of eergisteren met een
 * vriesdag achter de hand. Anders is hij voorbij en staat er 0 — en zet het
 * eerste goede antwoord hem weer op 1.
 *
 * Alleen om te tonen. De opgeslagen waarde blijft staan tot `addXp` hem
 * fatsoenlijk bijwerkt, zodat er niets te migreren valt.
 */
export function reeksNu(s: State = state, dag = today()): number {
  if (s.streak <= 0 || !s.lastDay) return s.streak
  if (s.lastDay === dag || s.lastDay === dayBefore(dag)) return s.streak
  if (s.freezes > 0 && s.lastDay === dayBefore(dayBefore(dag))) return s.streak
  return 0
}

export const xpToday = (s: State = state): number => s.daily[today()] ?? 0

export const goalMet = (s: State = state): boolean => xpToday(s) >= s.settings.dailyGoal

/**
 * De dagen waarop een reeks gevierd wordt.
 *
 * Een dagdoel dat niemand ooit "gehaald" noemt is geen doel maar een balkje,
 * en een reeks die stilletjes doortelt is een getal. `goalMet` stond hier al
 * en werd door geen enkel scherm gelezen; een mijlpaal bestond helemaal niet.
 *
 * Niet te dicht op elkaar: drie om op gang te komen, dan zeven, en daarna
 * steeds verder uit elkaar. Elke dag feest is geen feest meer.
 */
export const REEKS_MIJLPALEN = [3, 7, 14, 30, 50, 100, 200, 365]

export const isMijlpaal = (dagen: number): boolean => REEKS_MIJLPALEN.includes(dagen)

/** Level curve: each level costs a little more than the one before. */
export function levelOf(xp: number): { level: number; into: number; span: number } {
  let level = 1
  let span = 60
  let into = xp
  while (into >= span) {
    into -= span
    level += 1
    span = Math.round(span * 1.25)
  }
  return { level, into, span }
}

/* ------------------------------------------------------------- the missions */

/** Today's counters, rolled over if the app was last open yesterday. */
export function questsToday(s: State = state): QuestProgress {
  return s.quests.day === today() ? s.quests : emptyQuests(today())
}

type Counter = 'goed' | 'herhaald' | 'zinnen' | 'lessen' | 'bonus'

export function bumpQuest(counter: Counter, by = 1): void {
  setState((s) => {
    const q = questsToday(s)
    return { quests: { ...q, [counter]: q[counter] + by } }
  })
}

export interface QuestState extends Quest {
  done: number
  claimed: boolean
  /** Reached, and the gems are still on the table. */
  claimable: boolean
}

export function questState(quest: Quest, s: State = state): QuestState {
  const q = questsToday(s)
  const done = Math.min(q[quest.id], quest.goal)
  const claimed = q.claimed.includes(quest.id)
  return { ...quest, done, claimed, claimable: !claimed && q[quest.id] >= quest.goal }
}

/** Hands over the gems of a finished mission. Returns how many, or 0. */
export function claimQuest(id: QuestId): number {
  const quest = QUESTS.find((q) => q.id === id)
  if (!quest || !questState(quest).claimable) return 0
  setState((s) => {
    const q = questsToday(s)
    return { gems: s.gems + quest.gems, quests: { ...q, claimed: [...q.claimed, id] } }
  })
  return quest.gems
}

export const questsLeft = (s: State = state): number =>
  QUESTS.filter((q) => !questState(q, s).claimed).length

/* --------------------------------------------------------------- the bonus */

/** Today's bonus counters, rolled over if the app was last open yesterday. */
export function bonusToday(s: State = state): BonusProgress {
  return s.bonus.day === today() ? s.bonus : { ...s.bonus, day: today(), today: 0 }
}

/**
 * A finished bonus round.
 *
 * `reeks` is the longest run of right answers it contained, and only a longer
 * one replaces it; `getekend` counts the letters and words that were traced,
 * which is the number the writing badge watches.
 */
export function finishBonus(bestCombo: number, traced = 0): void {
  bumpQuest('bonus')
  setState((s) => {
    const b = bonusToday(s)
    return {
      bonus: {
        ...b,
        today: b.today + 1,
        total: b.total + 1,
        reeks: Math.max(b.reeks, bestCombo),
        getekend: b.getekend + traced,
      },
    }
  })
}

/**
 * How much of everything met is standing up right now.
 *
 * Deliberately a number that can fall: a card counts only while it is both
 * strong and not yet due back, so a week away from the app lowers it without
 * anybody being punished for it. That is the whole point — there is no state
 * of the app in which there is nothing left to do.
 */
export function mastery(s: State = state, now = Date.now()): { strong: number; met: number; share: number } {
  const cards = [...Object.values(s.cards), ...Object.values(s.extraCards)]
  const strong = cards.filter((c) => c.strength >= 0.6 && c.due > now).length
  const met = cards.length
  return { strong, met, share: met === 0 ? 0 : strong / met }
}

export function addGems(n: number): void {
  if (n > 0) setState((s) => ({ gems: s.gems + n }))
}

/**
 * A right answer, paid immediately.
 *
 * Returns the gems this answer happened to earn, so the screen can show them
 * rising off the button rather than quietly adding them to a counter in the
 * corner.
 */
export function scoreCorrect(combo: number, review = false): { xp: number; gems: number } {
  addXp(XP_PER_CORRECT)
  bumpQuest('goed')
  if (review) bumpQuest('herhaald')
  const gems = combo > 0 && combo % COMBO_GEM_EVERY === 0 ? 1 : 0
  addGems(gems)
  return { xp: XP_PER_CORRECT, gems }
}

/** A sentence was answered — for the daily mission and the badge. */
export function countSentence(): void {
  bumpQuest('zinnen')
  setState((s) => ({ sentencesDone: s.sentencesDone + 1 }))
}

/* -------------------------------------------------------------- vocabulary */

/**
 * Een bewaarde kaart, maar alleen als er nog mee te rekenen valt.
 *
 * `review` telt bij elk veld iets op. Mist er één getal -- een kaart uit een
 * beschadigde opslag, of uit een versie die een veld nog niet kende -- dan is
 * de uitkomst NaN, en NaN komt daarna nooit meer terug naar een getal. Die ene
 * kaart blijft dan voor altijd stuk: hij komt nooit meer terug om te herhalen
 * en zijn sterkte blijft leeg.
 *
 * Teruggeven we hier niets, dan begint `newCard` hem opnieuw. Dat kost de
 * geschiedenis van één woord en redt al het andere, en het is wat er toch al
 * gebeurt voor een woord dat nog nooit langskwam.
 *
 * Hier en niet in `review` zelf: dat is het rekenhart van het herhaalschema en
 * daar hoort geen controlewerk in.
 */
const heelOfNiets = (kaart: Card | undefined): Card | undefined =>
  kaart
    && [kaart.ease, kaart.interval, kaart.due, kaart.reps, kaart.lapses, kaart.strength]
      .every((n) => typeof n === 'number' && Number.isFinite(n))
    ? kaart
    : undefined

export function gradeWord(wordId: string, grade: Grade): void {
  setState((s) => {
    const card = heelOfNiets(s.cards[wordId]) ?? newCard(wordId)
    return { cards: { ...s.cards, [wordId]: review(card, grade) } }
  })
}

/** Letters and sentences share one scheduler, keyed by a prefixed id. */
export const letterKey = (id: string) => `l:${id}`
export const sentenceKey = (id: string) => `z:${id}`

export function gradeExtra(key: string, grade: Grade): void {
  setState((s) => {
    const card = heelOfNiets(s.extraCards[key]) ?? newCard(key)
    return { extraCards: { ...s.extraCards, [key]: review(card, grade) } }
  })
}

export const extraStrength = (key: string, s: State = state): number => s.extraCards[key]?.strength ?? 0

/** The sentences the scheduler wants back, strongest-forgotten first. */
export function dueSentenceIds(s: State = state, now = Date.now()): string[] {
  return Object.values(s.extraCards)
    .filter((c) => c.id.startsWith('z:') && c.due <= now)
    .sort((a, b) => a.strength - b.strength || a.due - b.due)
    .map((c) => c.id.slice(2))
}

export const knownWordIds = (s: State = state): Set<string> => new Set(Object.keys(s.cards))

/**
 * Everything already met, whatever kind of thing it is: words by id, letters
 * and sentences with their prefix stripped back off. A round uses this to
 * decide which teaching cards to skip.
 */
export const knownIds = (s: State = state): Set<string> =>
  new Set([...Object.keys(s.cards), ...Object.keys(s.extraCards).map((k) => k.slice(2))])

export function dueWordIds(s: State = state, now = Date.now()): string[] {
  return Object.values(s.cards)
    .filter((c) => c.due <= now)
    .sort((a, b) => a.strength - b.strength || a.due - b.due)
    .map((c) => c.id)
}

/* ------------------------------------------------------------------ lessons */

export function completeLesson(lessonId: string, score: number, xp: number): void {
  const stars = score >= 0.95 ? 3 : score >= 0.8 ? 2 : 1
  setState((s) => {
    const prev = s.lessons[lessonId]
    return {
      lessons: {
        ...s.lessons,
        [lessonId]: {
          stars: Math.max(stars, prev?.stars ?? 0),
          runs: (prev?.runs ?? 0) + 1,
          bestScore: Math.max(score, prev?.bestScore ?? 0),
          lastDone: Date.now(),
        },
      },
      gems: s.gems + (prev ? 1 : 5),
    }
  })
  addXp(xp)
  bumpQuest('lessen')
  awardBadges()
}

export const isDone = (lessonId: string, s: State = state): boolean => !!s.lessons[lessonId]

/** True when this lesson is past the free part and has not been bought. */
export function lessonBehindPaywall(lessonId: string, s: State = state): boolean {
  if (s.unlocked) return false
  const unit = UNITS.find((u) => u.lessons.some((l) => l.id === lessonId))
  if (!unit) return false
  return unit.lessons.findIndex((l) => l.id === lessonId) >= (GRATIS_LESSEN[unit.id] ?? 0)
}

/**
 * Alle gratis lessen gedaan, en niet betaald: hier houdt het pad op.
 *
 * Dit is het enige moment waarop de app ongevraagd over geld begint, en het
 * is ook het eerlijke moment: er is letterlijk geen volgende les. Zonder dit
 * loopt iemand van zijn laatste gratis les rechtstreeks tegen een slotje aan
 * waar niemand hem voor gewaarschuwd heeft.
 *
 * Het telt de lessen en niet de dagen. Wie er drie weken over doet krijgt
 * hetzelfde scherm als wie het in één avond doet — de app rekent nergens met
 * een klok, en de drie gratis dagen beginnen pas bij het abonnement zelf.
 */
export const gratisDeelOp = (s: State = state): boolean =>
  !s.unlocked && gratisLes.every((l) => isDone(l.id, s))

/** True when nothing in this unit is free and it has not been bought. */
export function unitBehindPaywall(unitId: string, s: State = state): boolean {
  return !s.unlocked && !(GRATIS_LESSEN[unitId] ?? 0)
}

/**
 * A unit opens once the one before it is finished — and, past the free part,
 * once the course has been bought. The first unit is always open.
 *
 * "Finished" means everything that was open to this learner. Without that, a
 * free learner who has done the three free alphabet lessons would never reach
 * the greetings lesson underneath: the rest of the alphabet is behind the
 * paywall and can never be ticked off.
 */
export function unitUnlocked(unitId: string, s: State = state): boolean {
  if (unitBehindPaywall(unitId, s)) return false
  const i = UNITS.findIndex((u) => u.id === unitId)
  if (i <= 0) return true
  return UNITS[i - 1]!.lessons.every((l) => lessonBehindPaywall(l.id, s) || isDone(l.id, s))
}

export function lessonUnlocked(lessonId: string, s: State = state): boolean {
  const unit = UNITS.find((u) => u.lessons.some((l) => l.id === lessonId))
  if (!unit || !unitUnlocked(unit.id, s)) return false
  if (lessonBehindPaywall(lessonId, s)) return false
  const i = unit.lessons.findIndex((l) => l.id === lessonId)
  return i === 0 || isDone(unit.lessons[i - 1]!.id, s)
}

/**
 * The lesson the “continue” button should open: the first unfinished one that
 * is actually open. When everything open is finished it points back at the
 * last one rather than at something locked — the path itself offers the way
 * past the paywall.
 */
export function nextLesson(s: State = state): string {
  let last = LESSONS[0]!.id
  for (const unit of UNITS) {
    if (!unitUnlocked(unit.id, s)) break
    for (const lesson of unit.lessons) {
      // Voorbij het slot houdt deze unit op; de volgende kan nog open staan.
      if (lessonBehindPaywall(lesson.id, s)) break
      if (!isDone(lesson.id, s)) return lesson.id
      last = lesson.id
    }
  }
  return last
}

export function progressOfUnit(unitId: string, s: State = state): number {
  const unit = UNITS.find((u) => u.id === unitId)
  if (!unit) return 0
  return unit.lessons.filter((l) => isDone(l.id, s)).length / unit.lessons.length
}

/* ------------------------------------------------------------------ badges */

/** Badge names and hints are interface text; they live in the string files. */
export type BadgeId = keyof Strings['badges']

export interface Badge {
  id: BadgeId
  emoji: string
  earned: (s: State) => boolean
}

export const BADGES: Badge[] = [
  { id: 'eerste-stap', emoji: '👣', earned: (s) => Object.keys(s.lessons).length >= 1 },
  { id: 'salam', emoji: '👋', earned: (s) => UNITS[0]!.lessons.every((l) => isDone(l.id, s)) },
  { id: 'vlam-3', emoji: '🔥', earned: (s) => s.bestStreak >= 3 },
  { id: 'vlam-7', emoji: '🔥', earned: (s) => s.bestStreak >= 7 },
  { id: 'vlam-30', emoji: '🏆', earned: (s) => s.bestStreak >= 30 },
  { id: 'honderd', emoji: '📚', earned: (s) => Object.keys(s.cards).length >= 100 },
  { id: 'alle-woorden', emoji: '🎯', earned: (s) => Object.keys(s.cards).length >= 250 },
  { id: 'perfect', emoji: '💎', earned: (s) => Object.values(s.lessons).some((l) => l.bestScore >= 1) },
  { id: 'letters', emoji: '🔤', earned: (s) => isDone('letters', s) },
  { id: 'alfabet', emoji: '🅰️', earned: (s) => UNITS[0]!.lessons.every((l) => isDone(l.id, s)) },
  { id: 'zinnen-50', emoji: '💬', earned: (s) => s.sentencesDone >= 50 },
  { id: 'missies', emoji: '🎯', earned: (s) => questsToday(s).claimed.length >= QUESTS.length },
  { id: 'schrijver', emoji: '✍️', earned: (s) => s.bonus.getekend >= 25 },
  { id: 'reeks-20', emoji: '⚡', earned: (s) => s.bonus.reeks >= 20 },
  { id: 'bonus-25', emoji: '⭐', earned: (s) => s.bonus.total >= 25 },
  { id: 'verhaal', emoji: '📖', earned: (s) => Object.keys(s.lessons).some((id) => id.startsWith('verhaal-')) },
  { id: 'niveau-5', emoji: '⭐', earned: (s) => levelOf(s.xp).level >= 5 },
  { id: 'niveau-10', emoji: '🌟', earned: (s) => levelOf(s.xp).level >= 10 },
]

/** Returns the badges won by this action, so the UI can celebrate them. */
export function awardBadges(): Badge[] {
  const won = BADGES.filter((b) => !state.badges.includes(b.id) && b.earned(state))
  if (won.length) setState((s) => ({ badges: [...s.badges, ...won.map((b) => b.id)] }))
  return won
}

/* ---------------------------------------------------------------- settings */

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  setState((s) => ({ settings: { ...s.settings, [key]: value } }))
}

export function markTipSeen(id: string): void {
  if (!state.seenTips.includes(id)) setState((s) => ({ seenTips: [...s.seenTips, id] }))
}

/** Adds a history card to the collection. Re-earning one changes nothing. */
export function collectHistory(id: string): void {
  if (!state.history.includes(id)) setState((s) => ({ history: [...s.history, id] }))
}

/** How many checkpoints have been passed — which card comes next. */
export const checkpointsDone = (s: State = state): number =>
  Object.keys(s.lessons).filter((id) => id.endsWith('-toets')).length

export function resetProgress(): void {
  const { settings, unlocked, unlockedAt, ebook } = state
  // Starting over is about progress, not about the purchase.
  state = { ...initial(), settings, unlocked, unlockedAt, ebook }
  emit()
}

export function exportProgress(): string {
  return JSON.stringify(state, null, 2)
}

/**
 * Een bewaard spel terugzetten, van een ander toestel of van na een herinstallatie.
 *
 * Wat er terugkomt is de voortgang, en niet de aankoop — dezelfde grens die
 * `resetProgress` hierboven al trekt. Dat is hier geen nettigheid maar het
 * verschil tussen een back-up en een sleutel: het bestand is gewone tekst die
 * een kind van twaalf in Kladblok openmaakt, en `"unlocked": true` intikken
 * duurt één regel. Of het abonnement loopt, weet de winkel; dat komt uit
 * `billing.ts` en niet uit een bestand.
 *
 * Voor wie het eerlijk doet verandert er niets: op het nieuwe toestel hangt
 * dezelfde winkelrekening, dus zodra de bonnen binnen zijn staat de cursus
 * gewoon open.
 */
export function importProgress(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as State
    if (parsed.version !== 1) return false
    /*
     * De instellingen blijven van dít toestel, net als bij `resetProgress`.
     *
     * Ze gingen eerst mee, en dat gaf het ergste geval dat een terugzetknop
     * kan geven: de taal zat erbij. Wie een bestand van een Frans sprekend
     * neefje terugzette, kreeg een Franse app — en moest zijn eigen taal
     * terugzoeken in een menu dat hij niet meer kon lezen. Hij heeft die knop
     * net ingedrukt om voortgang terug te halen, niet om de app om te zetten.
     *
     * De knop heet ook "Voortgang terugzetten" en niet "Alles terugzetten",
     * en dat is wat hij hoort te doen. Daar komt bij dat een deel van deze
     * instellingen alleen op dit toestel iets betekent: `voice` is de naam van
     * een stem die op de andere telefoon stond, en die hier dus niet bestaat.
     *
     * `langPicked` hoort bij hetzelfde: dat is de vraag of het welkomstscherm
     * al geweest is op dit toestel, en niet iets uit een bestand.
     */
    const { unlocked, unlockedAt, ebook, settings, langPicked } = state
    state = { ...hydrate(parsed), unlocked, unlockedAt, ebook, settings, langPicked }
    emit()
    return true
  } catch {
    return false
  }
}
