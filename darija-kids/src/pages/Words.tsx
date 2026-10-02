import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Topic } from '../content/types'
import { allWords, searchWords, TOPIC_EMOJI, TOPICS } from '../content/lexicon'
import { meaningOf, noteOf } from '../content/localise'
import { useLang, useT } from '../i18n'
import { strengthLabel } from '../engine/srs'
import { sfx } from '../engine/audio'
import { useStore, woordOpSlot } from '../engine/store'
import { Button, Card, Pill, SectionTitle } from '../ui/kit'
import { SpeakButton, WordText } from '../ui/WordChip'
import { WordFeedback } from '../ui/Feedback'

/** The dictionary: every word the app knows, searchable in four ways. */
export function Words() {
  const t = useT()
  const lang = useLang()
  const navigate = useNavigate()
  const state = useStore((s) => s)
  const cards = state.cards
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState<Topic | 'alles'>('alles')
  const [open, setOpen] = useState<string | null>(null)

  /**
   * De onderwerpenbalk schuift opzij als hij niet past, en dat moet te zien
   * zijn.
   *
   * Zonder iets staat er een knop half over de rand — "Huis" die rechtsboven
   * afgesneden is — en dat leest als een fout in de opmaak in plaats van als
   * "er komt nog meer". Twee dingen helpen daartegen, en allebei zijn ze
   * nodig: een zachte waas aan de kant waar nog iets staat, zodat je ziet dat
   * er verder te schuiven valt, en de balk die zelf meeschuift zodra je een
   * onderwerp kiest, zodat wat je net hebt aangetikt ook helemaal in beeld
   * staat.
   *
   * En een pijltje aan elke kant waar nog iets staat. Een waas alleen bleek te
   * stil: wie met een muis kijkt ziet een afgesneden knop en geen uitnodiging.
   * Het pijltje zegt het ronduit — hier gaat het verder — en schuift een
   * schermbreedte op, zodat er met één tik iets nieuws staat in plaats van een
   * halve knop.
   */
  const balk = useRef<HTMLUListElement>(null)
  const [waas, setWaas] = useState({ links: false, rechts: false })

  const meetRanden = () => {
    const el = balk.current
    if (!el) return
    const speling = el.scrollWidth - el.clientWidth
    setWaas({
      links: el.scrollLeft > 4,
      rechts: speling > 4 && el.scrollLeft < speling - 4,
    })
  }

  useLayoutEffect(meetRanden, [])
  useEffect(() => {
    const el = balk.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const kijker = new ResizeObserver(meetRanden)
    kijker.observe(el)
    return () => kijker.disconnect()
  }, [])

  /** Een scherm opzij, min een knop overlap zodat je ziet waar je vandaan komt. */
  const schuif = (kant: 1 | -1) => {
    const el = balk.current
    if (!el) return
    sfx.nav()
    el.scrollBy({ left: kant * Math.round(el.clientWidth * 0.8), behavior: 'smooth' })
  }

  // Wat je aantikt hoort daarna helemaal in beeld te staan.
  useEffect(() => {
    const gekozen = balk.current?.querySelector('[aria-pressed="true"]')
    gekozen?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }, [topic])

  const results = useMemo(() => {
    const base = query ? searchWords(query, lang) : allWords
    return topic === 'alles' ? base : base.filter((w) => w.topic === topic)
  }, [query, topic, lang])

  /*
   * Het woordenboek bouwt zich op in stukken van veertig.
   *
   * Alle 304 woorden tegelijk neerzetten is 29 341px pagina en 3 161 knopen,
   * en dat kost op een trage telefoon meer dan je denkt: nagemeten met de
   * processor zes keer vertraagd stond het eerste woord er pas na 2,6
   * seconde, en elke toetsaanslag in het zoekveld kostte 200 tot 560ms —
   * want bij elke letter mogen 304 kaarten weer weg. Zo loopt het veld
   * achter je vingers aan.
   *
   * Veertig is ruim vier schermen, en er komen er veertig bij zodra het
   * baken 800px voor het eind in beeld komt. Je merkt er dus niets van bij
   * het scrollen; alleen het typen is weer vlot.
   */
  const STAP = 40
  const [toon, setToon] = useState(STAP)
  const baken = useRef<HTMLDivElement>(null)

  // Een nieuwe zoekvraag begint weer bovenaan, dus ook weer bij veertig.
  useEffect(() => setToon(STAP), [query, topic])

  useEffect(() => {
    const el = baken.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const kijker = new IntersectionObserver(
      (rijen) => { if (rijen.some((r) => r.isIntersecting)) setToon((n) => n + STAP) },
      { rootMargin: '800px 0px' },
    )
    kijker.observe(el)
    return () => kijker.disconnect()
  }, [results.length, toon])

  const zichtbaar = toon >= results.length ? results : results.slice(0, toon)

  return (
    <div className="mx-auto max-w-3xl lg:max-w-4xl px-4 py-6">
      <SectionTitle kop="h1" sub={t.words.uitleg(allWords.length)}>{t.words.titel}</SectionTitle>

      {/*
        Het zoekveld blijft staan.

        Het woordenboek is 304 woorden; wie doorscrollt is na een paar vegen
        twintig schermen van het veld vandaan, en een tweede woord opzoeken
        begon dan met helemaal terugscrollen. Nu plakt het onder de kopbalk,
        waarvan TopBar de hoogte doorgeeft in `--kop-hoogte` — die hoogte
        verschilt per toestel en per letterinstelling, dus een vast getal zou
        het veld half onder de balk schuiven.

        De negatieve marge en de opvulling eromheen zijn er zodat de
        achtergrond tijdens het plakken doorloopt tot de rand van het scherm
        en de kaarten er niet onderdoor schijnen.
      */}
      <div className="sticky z-30 -mx-4 bg-[var(--surface)] px-4 pb-2 pt-1" style={{ top: 'var(--kop-hoogte)' }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.words.zoek}
          aria-label={t.words.zoekLabel}
          className="w-full rounded-2xl border-2 border-[var(--line)] bg-[var(--surface-raised)] px-4 py-3 text-lg outline-none focus:border-zellige-500"
        />
      </div>

      <div className="relative -mx-4 mt-3">
        <ul
          ref={balk}
          onScroll={meetRanden}
          /* scroll-px-8: even breed als de waas, zodat een knop die in beeld
             wordt geschoven er niet half onder verdwijnt. */
          className="no-scrollbar flex gap-2 overflow-x-auto scroll-px-12 px-4 pb-1"
        >
          <li>
            <button
              onClick={() => { sfx.nav(); setTopic('alles') }}
              aria-pressed={topic === 'alles'}
              className={`inline-flex h-11 items-center whitespace-nowrap rounded-full border-2 px-4 text-sm font-bold ${topic === 'alles' ? 'border-zellige-500 bg-zellige-500/10' : 'border-[var(--line)]'}`}
            >
              {t.words.alles}
            </button>
          </li>
          {TOPICS.map((topicKey) => (
            <li key={topicKey}>
              <button
                onClick={() => { sfx.nav(); setTopic(topicKey) }}
                aria-pressed={topic === topicKey}
                className={`inline-flex h-11 items-center whitespace-nowrap rounded-full border-2 px-4 text-sm font-bold ${topic === topicKey ? 'border-zellige-500 bg-zellige-500/10' : 'border-[var(--line)]'}`}
              >
                {TOPIC_EMOJI[topicKey]} {t.topics[topicKey]}
              </button>
            </li>
          ))}
        </ul>
        {waas.links && (
          <>
            <div className="pointer-events-none absolute inset-y-0 start-0 w-10 bg-gradient-to-r from-[var(--surface)] to-transparent" aria-hidden="true" />
            <Pijl kant={-1} label={t.words.vorigeOnderwerpen} onClick={() => schuif(-1)} />
          </>
        )}
        {waas.rechts && (
          <>
            <div className="pointer-events-none absolute inset-y-0 end-0 w-10 bg-gradient-to-l from-[var(--surface)] to-transparent" aria-hidden="true" />
            <Pijl kant={1} label={t.words.meerOnderwerpen} onClick={() => schuif(1)} />
          </>
        )}
      </div>

      <p className="mt-4 text-sm text-[var(--ink-soft)]">{t.words.resultaten(results.length)}</p>

      {/* Alleen bij een lijst om over te praten: bij nul treffers gaat deze
          kaart over woorden die er niet staan, en staat hij tussen de vraag
          en het antwoord in. */}
      {!state.unlocked && results.length > 0 && (
        <Card className="mt-3 flex flex-wrap items-center gap-3 p-4">
          <span className="text-xl" aria-hidden="true">🔒</span>
          {/* Een basis, anders krimpt deze zin tot 158px naast de knop:
              twintig woorden over vijf regels. */}
          <p className="min-w-0 grow basis-48 text-sm">{t.words.slotUitleg}</p>
          <Link to="/volledig"><Button variant="secondary">{t.unlock.slotKnop}</Button></Link>
        </Card>
      )}

      <ul className="mt-2 space-y-2">
        {zichtbaar.map((w) => {
          const card = cards[w.id]
          const isOpen = open === w.id
          // Het woordenboek toont alles, ook wat nog niet van jou is: zien wat
          // er komt is de beste reden om verder te willen. Horen en openklappen
          // kan alleen bij wat in een gratis les zat.
          const opSlot = woordOpSlot(w.id, state)
          return (
            <li key={w.id}>
              <Card className={`overflow-hidden ${opSlot ? 'opacity-70' : ''}`}>
                <button
                  className="flex w-full items-center gap-3 p-3 text-start"
                  onClick={() => {
                    if (opSlot) { sfx.back(); navigate('/volledig'); return }
                    if (isOpen) sfx.back(); else sfx.tap()
                    setOpen(isOpen ? null : w.id)
                  }}
                  aria-expanded={opSlot ? undefined : isOpen}
                >
                  <span className="text-2xl" aria-hidden="true">{w.emoji ?? '•'}</span>
                  <span className="min-w-0 flex-1">
                    <span className="ar text-xl font-bold">{w.ar}</span>
                    <span className="block text-sm">
                      <span className="font-display font-bold text-zellige-600 dark:text-zellige-300">{w.tr}</span>
                      <span className="text-[var(--ink-soft)]"> — {meaningOf(w, lang)}</span>
                    </span>
                  </span>
                  {opSlot ? (
                    <span className="shrink-0 text-lg" aria-label={t.unlock.slotTitel}>🔒</span>
                  ) : (
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${card ? 'bg-mint-500/15 text-mint-600' : 'bg-[var(--surface-sunken)] text-[var(--ink-soft)]'}`}>
                      {t.strength[strengthLabel(card?.strength ?? 0)]}
                    </span>
                  )}
                </button>
                {isOpen && !opSlot && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-[var(--line)] p-4">
                    <div className="flex items-center gap-4">
                      <WordText word={w} size="md" />
                      <SpeakButton ar={w.ar} tr={w.tr} />
                      <div className="ms-auto text-end text-sm text-[var(--ink-soft)]">
                        <div>{lang === 'en' ? w.nl : w.en}</div>
                        <Pill className="mt-1">{TOPIC_EMOJI[w.topic]} {t.topics[w.topic]}</Pill>
                      </div>
                    </div>
                    {noteOf(w, lang) && <p className="mt-3 rounded-2xl bg-saffron-500/10 px-4 py-2 text-sm">💡 {noteOf(w, lang)}</p>}
                    {/* The feedback that actually improves a language app:
                        somebody whose family says this word differently. */}
                    <WordFeedback word={`${w.tr} (${w.ar})`} />
                  </motion.div>
                )}
              </Card>
            </li>
          )
        })}
      </ul>

      {/* Het baken. Geen tekst en geen knop: het hoort een lijst te zijn die
          gewoon doorloopt, niet een lijst met een drempel erin. */}
      {toon < results.length && <div ref={baken} aria-hidden="true" className="h-px" />}

      {results.length === 0 && (
        <Card className="mt-6 p-6 text-center text-[var(--ink-soft)]">
          {t.words.nietsGevonden}
        </Card>
      )}
    </div>
  )
}

/**
 * Het pijltje aan de rand van de onderwerpenbalk.
 *
 * Klein genoeg om de knop eronder niet te verbergen, groot genoeg om met een
 * duim te raken: veertig bij veertig, op de rand en verticaal in het midden.
 * Hij staat er alleen als er die kant op iets te halen valt.
 *
 * Die veertig is met opzet net onder de vierenveertig die Apple en Google
 * aanhouden: de strook eronder is zelf vierenveertig hoog, en een pijl die
 * daar overheen steekt verbergt precies de knop die je wilde zien. Hij is
 * bovendien een snelkoppeling en geen enige weg -- de strook schuift ook met
 * een veeg.
 */
function Pijl({ kant, label, onClick }: { kant: 1 | -1; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`absolute top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border-2 border-[var(--line)] bg-[var(--surface-raised)] text-[var(--ink-soft)] shadow-sm transition hover:border-zellige-500 hover:text-zellige-600 dark:hover:text-zellige-300 ${kant === 1 ? 'end-1' : 'start-1'}`}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="rtl:-scale-x-100">
        {kant === 1 ? <path d="m9 5 7 7-7 7" /> : <path d="m15 5-7 7 7 7" />}
      </svg>
    </button>
  )
}
