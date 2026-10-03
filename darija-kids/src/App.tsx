import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, HashRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Landing } from './pages/Landing'
import { Learn } from './pages/Learn'
import { LessonPlayer } from './pages/LessonPlayer'
/*
 * Deze drie stonden hier als `lazy()`, en dat deed niets.
 *
 * `Learn` en `LessonPlayer` hierboven worden gewoon geïmporteerd -- het
 * leerpad is het eerste scherm, dus dat hoort in het eerste stuk -- en die
 * twee halen `Bonus`, `Film` en `HistoryCard` zelf al binnen. Een module die
 * ergens vast geïmporteerd wordt, komt in dat stuk terecht; een `lazy()`
 * elders verplaatst hem niet alsnog. De bouw zei het ook, drie keer:
 * "INEFFECTIVE_DYNAMIC_IMPORT ... dynamic import will not move module into
 * another chunk."
 *
 * Ze staan er nu zoals ze werken. Dat scheelt geen byte -- ze zaten al in het
 * eerste stuk -- maar het scheelt een regel code die iets belooft wat niet
 * gebeurt, en drie waarschuwingen die bij de volgende bouw weer voorbijkomen.
 */
import { Bonus } from './pages/Bonus'
import { FilmPreview } from './ui/Film'
import { HistoryPreview } from './ui/HistoryCard'
const Review = lazy(() => import('./pages/Review').then((m) => ({ default: m.Review })))
const Words = lazy(() => import('./pages/Words').then((m) => ({ default: m.Words })))
const Alphabet = lazy(() => import('./pages/Alphabet').then((m) => ({ default: m.Alphabet })))
const Stories = lazy(() => import('./pages/Stories').then((m) => ({ default: m.Stories })))
const StoryReader = lazy(() => import('./pages/Stories').then((m) => ({ default: m.StoryReader })))
const Games = lazy(() => import('./pages/Games').then((m) => ({ default: m.Games })))
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })))
const History = lazy(() => import('./pages/History').then((m) => ({ default: m.History })))
const Diplomas = lazy(() => import('./pages/Diplomas').then((m) => ({ default: m.Diplomas })))
const Parents = lazy(() => import('./pages/Parents').then((m) => ({ default: m.Parents })))
const Unlock = lazy(() => import('./pages/Unlock').then((m) => ({ default: m.Unlock })))
const Boek = lazy(() => import('./pages/Boek').then((m) => ({ default: m.Boek })))
const Privacy = lazy(() => import('./pages/Privacy').then((m) => ({ default: m.Privacy })))
const Terms = lazy(() => import('./pages/Terms').then((m) => ({ default: m.Terms })))
const SettingsPage = lazy(() => import('./pages/Settings').then((m) => ({ default: m.SettingsPage })))
import { NotFound } from './pages/NotFound'
const Speech = lazy(() => import('./pages/Speech').then((m) => ({ default: m.Speech })))
const Record = lazy(() => import('./pages/Record').then((m) => ({ default: m.Record })))
import { GeluidUit } from './ui/GeluidUit'
import { TopBar } from './ui/TopBar'
import { MotionConfig } from 'framer-motion'
import { platform } from './engine/platform'
import { Welcome } from './ui/Welcome'
import { BoekTeken, Jij, Kompas, Rond, Steen } from './ui/tekens'
import { Aanbod } from './ui/Aanbod'
import { useStore } from './engine/store'
import { listenForFirstGesture, sfx } from './engine/audio'
import { initBilling } from './engine/billing'
import { herstelHerinnering } from './engine/herinnering'
import { meldVoortgang } from './engine/post'
import { reikDiplomasUit } from './engine/diploma'
import { localeOf, useLang, useT } from './i18n'
import { opPauze } from './engine/pauze'
import { poortVergeet } from './ui/OuderPoort'

const TABS = [
  { to: '/leren', key: 'leren', Icoon: Kompas },
  { to: '/herhalen', key: 'herhalen', Icoon: Rond },
  { to: '/woorden', key: 'woorden', Icoon: BoekTeken },
  { to: '/spelen', key: 'spelen', Icoon: Steen },
  { to: '/profiel', key: 'jij', Icoon: Jij },
] as const

function useTheme() {
  const { theme, accent, motion: motionPref, reading } = useStore((s) => s.settings)
  useEffect(() => {
    const root = document.documentElement
    // In the standalone demo the host stamps its own theme on the root; leave
    // that stamp alone until the learner picks a theme here.
    if (theme === 'system') { if (!DEMO) root.removeAttribute('data-theme') }
    else root.setAttribute('data-theme', theme)
    // Saffraan is wat `:root` al zegt, dus daar hoort geen stempel bij: zonder
    // attribuut ziet een oude opslag er precies zo uit als altijd.
    if (accent === 'saffraan') root.removeAttribute('data-accent')
    else root.setAttribute('data-accent', accent)
    root.setAttribute('data-motion', motionPref)
    root.setAttribute('data-reading', reading)
  }, [theme, accent, motionPref, reading])
}

function Chrome() {
  const t = useT()
  const lang = useLang()
  const location = useLocation()
  // A round is a round: no tabs along the bottom to tap out of it by accident.
  const inLesson = location.pathname.startsWith('/les/')
    || location.pathname.startsWith('/herhalen/')
    || location.pathname.startsWith('/bonus/')
  const isLanding = location.pathname === '/'
  useTheme()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  // Browsers keep a page silent until somebody has interacted with it.
  useEffect(listenForFirstGesture, [])

  // Connects to the App Store or Play Store; does nothing on the web.
  useEffect(() => { void initBilling() }, [])
  // De wekker opnieuw zetten bij elke start. iOS bewaart hem over een
  // herstart heen maar niet over een herinstallatie, en Android is er per
  // fabrikant wisselend in; opnieuw zetten kost niets. De tekst moet mee,
  // want de melding staat in de taal die nu gekozen is.
  useEffect(() => {
    void herstelHerinnering({ titel: t.settings.herinneringTitel, body: t.settings.herinneringBody })
  }, [t])
  // Once a day at most, and only for a parent who asked for the weekly note.
  useEffect(() => { void meldVoortgang() }, [])
  /*
   * De plank bijwerken bij elke start.
   *
   * Niet alleen aan het eind van een les, en dat is de kern van deze regel:
   * toen het alleen daar hing, begon de plank van iemand die de app al een
   * jaar heeft bij de unit die hij hierna doet -- zestien lege vakken voor een
   * kind dat alles al had gehaald. `reikDiplomasUit` loopt alle units na en
   * zet de datum van de laatste les van die unit op het diploma, niet die van
   * vandaag.
   */
  useEffect(() => { reikDiplomasUit() }, [])
  /*
   * De ouderpoort vergeet zijn antwoord zodra de app van het scherm af gaat.
   *
   * Hij vraagt de som één keer per keer dat de app open is, en dat is met
   * opzet: wie de app aan het inrichten is doet hem anders tien keer op een
   * avond, en een poort die zo vaak komt wordt een poort waar men blind langs
   * klikt. Maar "één keer per keer dat de app open is" was zonder deze regel
   * in de praktijk één keer en daarna nooit meer — een app op een tablet gaat
   * niet dicht, hij gaat weg. Een ouder maakt de som, geeft de tablet aan zijn
   * kind, en een uur later staat de poort nog steeds open.
   */
  useEffect(() => opPauze(poortVergeet), [])

  // The document language follows the interface, for screen readers and hyphenation.
  useEffect(() => {
    document.documentElement.lang = localeOf(lang)
  }, [lang])

  return (
    <div className="min-h-full pb-24 sm:pb-0">
      <Welcome />
      <Aanbod />
      {!inLesson && !isLanding && <TopBar />}
      {/* Overal, niet alleen op het pad: wie in het woordenboek op een woord
          tikt en niets hoort, komt daar anders nooit achter waarom. */}
      {!isLanding && <GeluidUit />}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          <Suspense fallback={<div className="px-4 py-20 text-center text-[var(--ink-soft)]">{t.common.laden}</div>}>
          <Routes location={location}>
            {/*
              In de app begint het bij het leerpad, op de website bij de
              landingsbladzijde.

              Die bladzijde is een verkooppagina: zeventien units op een rij,
              waarom je kind het onthoudt, wat het kost. Op darijaforkids.eu is
              dat precies goed — daar staat een bezoeker die de app nog niet
              heeft. In de app is het zes schermen scrollen voordat een kind bij
              zijn les is, elke keer dat het de app opent, om iets te lezen
              waarvan het antwoord al ja was: hij staat er immers al op.

              `replace`, zodat de terugknop van Android niet terugvalt op een
              bladzijde waar hij nooit is geweest.
            */}
            <Route path="/" element={platform() === 'web' ? <Landing /> : <Navigate to="/leren" replace />} />
            <Route path="/leren" element={<Learn />} />
            <Route path="/les/:lessonId" element={<LessonPlayer />} />
            <Route path="/herhalen/:running?" element={<Review />} />
            <Route path="/woorden" element={<Words />} />
            <Route path="/letters" element={<Alphabet />} />
            <Route path="/verhalen" element={<Stories />} />
            <Route path="/verhalen/:storyId" element={<StoryReader />} />
            <Route path="/spelen" element={<Games />} />
            {/* One route with an optional part, not two: a second Route would
                be a second element, and the page would be thrown away and
                rebuilt on the way out of a round — taking the score with it. */}
            <Route path="/bonus/:bonusId?" element={<Bonus />} />
            <Route path="/profiel" element={<Profile />} />
            <Route path="/geschiedenis" element={<History />} />
            <Route path="/diplomas" element={<Diplomas />} />
            <Route path="/ouders" element={<Parents />} />
            <Route path="/instellingen" element={<SettingsPage />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/voorwaarden" element={<Terms />} />
            <Route path="/volledig" element={<Unlock />} />
            <Route path="/boek" element={<Boek />} />
            {/* Working on a scene of the film is otherwise a matter of
                finishing a lesson to see one frame of it. */}
            {/* Also in the demo build: the point of the demo is that somebody
                can look at the thing, and reaching a history fragment the long
                way round means sitting a whole checkpoint first. */}
            {PREVIEWS && <Route path="/film/:scene" element={<FilmPreview />} />}
            {PREVIEWS && <Route path="/kaart/:cardId" element={<HistoryPreview />} />}
            {PREVIEWS && <Route path="/uitspraak" element={<Speech />} />}
            {PREVIEWS && <Route path="/opname" element={<Record />} />}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </motion.main>
      </AnimatePresence>

      {!inLesson && !isLanding && (
        <nav
          aria-label={t.nav.menu}
          /* `niet-op-papier`: de tabbalk staat vast aan de onderrand en kwam
             op elk afgedrukt vel terug. Zie de afdrukstijl in index.css. */
          className="niet-op-papier fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--surface-raised)]/95 backdrop-blur sm:hidden"
          style={{ paddingBottom: 'var(--rand-onder)' }}
        >
          <ul className="mx-auto flex max-w-lg">
            {TABS.map((tab) => (
              <li key={tab.to} className="flex-1">
                <NavLink
                  to={tab.to}
                  onClick={() => sfx.nav()}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold ${isActive ? 'text-[var(--ink)]' : 'text-[var(--ink-soft)]'}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="relative grid h-9 w-9 place-items-center">
                        {/*
                          De ruit onder de tab waar je staat.

                          Waar je bent was alleen aan een kleur te zien:
                          hetzelfde plaatje, hetzelfde woord, groen in plaats
                          van grijs. Dat is één signaal, en het valt weg voor
                          wie kleur niet goed ziet -- en juist deze balk is waar
                          een kind op kijkt om te weten waar het is.

                          Nu zijn het er drie: de ruit staat eronder, het woord
                          wordt donkerder in plaats van alleen anders gekleurd,
                          en het teken staat in de inkt van die ruit. De ruit
                          haalt tegen de balk minstens 3,19 op 1 in de lichte
                          stand en 4,83 in de donkere -- zie `--accent-vlak` in
                          index.css voor alle acht de metingen.

                          De ruit en niet een rondje of een streepje: dat is de
                          grondvorm van het zelligewerk dat op het pad, in de
                          medaillons en op het handvat van elk paneel al staat.

                          En hij verschijnt op zijn plek, hij schuift er niet
                          naartoe. Dat was eerst wel zo, met `layoutId`, en het
                          zag er beter uit dan het was: de ruit is een gevuld
                          vlak dat ónder de tekens door reist, terwijl die
                          tekens hun kleur al bij de tik veranderen. Nagemeten
                          en gefotografeerd op 390, van Leren naar Spelen: in de
                          donkere stand staat het teken van de tab die je net
                          aantikte meteen op `--accent-ink` terwijl de ruit er
                          nog niet is -- 1,14 op 1, dus een kwart seconde
                          onzichtbaar. En de tekens waar hij langs komt staan in
                          `--ink-soft` op het accentvlak: 1,32 tot 2,26 in het
                          licht, 1,01 tot 1,39 in het donker. Tien keer per
                          sessie werd er onderweg een teken uitgegumd. Een
                          overgang die uitlegt waar je vandaan komt is mooi; een
                          die drie tekens wist is dat niet.
                        */}
                        {isActive && (
                          <span aria-hidden="true" className="absolute inset-0 grid place-items-center">
                            <span className="block h-[26px] w-[26px] rotate-45 rounded-[5px] bg-[var(--accent-vlak)]" />
                          </span>
                        )}
                        <span className={isActive ? 'text-[var(--accent-ink)]' : undefined}>
                          <tab.Icoon />
                        </span>
                      </span>
                      {t.nav[tab.key]}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}

/**
 * The demo build is one HTML file with no server behind it, so it routes on the
 * hash instead of on the path.
 */
const DEMO = import.meta.env.VITE_DEMO === '1'
const PREVIEWS = import.meta.env.DEV || DEMO
const Router = DEMO ? HashRouter : BrowserRouter

export default function App() {
  return (
    /*
     * `reducedMotion="user"` laat framer-motion naar de voorkeur van het
     * toestel luisteren.
     *
     * In `index.css` staat al een regel die bij "beperk beweging" elke
     * css-animatie stilzet, en die dekt framer-motion niet: die rekent zijn
     * beelden in javascript uit en trekt zich van een css-regel niets aan. De
     * zwevende mascotte, de schuivende panelen en de voortgangsbalk bleven dus
     * bewegen voor precies de persoon die had gevraagd of dat niet hoefde.
     *
     * Op "user" laat hij verplaatsingen weg en houdt hij vervagingen: dat is
     * wat Apple en Google met de instelling bedoelen, niet alles doodslaan.
     */
    <MotionConfig reducedMotion="user">
      <Router>
        <Chrome />
      </Router>
    </MotionConfig>
  )
}
