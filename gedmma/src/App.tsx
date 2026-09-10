import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, HashRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Landing } from './pages/Landing'
import { Learn } from './pages/Learn'
import { LessonPlayer } from './pages/LessonPlayer'
const Review = lazy(() => import('./pages/Review').then((m) => ({ default: m.Review })))
const Words = lazy(() => import('./pages/Words').then((m) => ({ default: m.Words })))
const Alphabet = lazy(() => import('./pages/Alphabet').then((m) => ({ default: m.Alphabet })))
const Stories = lazy(() => import('./pages/Stories').then((m) => ({ default: m.Stories })))
const StoryReader = lazy(() => import('./pages/Stories').then((m) => ({ default: m.StoryReader })))
const Games = lazy(() => import('./pages/Games').then((m) => ({ default: m.Games })))
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })))
const Parents = lazy(() => import('./pages/Parents').then((m) => ({ default: m.Parents })))
const SettingsPage = lazy(() => import('./pages/Settings').then((m) => ({ default: m.SettingsPage })))
import { NotFound } from './pages/NotFound'
import { TopBar } from './ui/TopBar'
import { useStore } from './engine/store'

const TABS = [
  { to: '/leren', label: 'Leren', icon: '🧭' },
  { to: '/herhalen', label: 'Herhalen', icon: '🔁' },
  { to: '/woorden', label: 'Woorden', icon: '📚' },
  { to: '/spelen', label: 'Spelen', icon: '🎮' },
  { to: '/profiel', label: 'Jij', icon: '🦊' },
]

function useTheme() {
  const { theme, motion: motionPref, reading } = useStore((s) => s.settings)
  useEffect(() => {
    const root = document.documentElement
    // In the standalone demo the host stamps its own theme on the root; leave
    // that stamp alone until the learner picks a theme here.
    if (theme === 'system') { if (!DEMO) root.removeAttribute('data-theme') }
    else root.setAttribute('data-theme', theme)
    root.setAttribute('data-motion', motionPref)
    root.setAttribute('data-reading', reading)
  }, [theme, motionPref, reading])
}

function Chrome() {
  const location = useLocation()
  const inLesson = location.pathname.startsWith('/les/') || location.pathname.startsWith('/herhalen/')
  const isLanding = location.pathname === '/'
  useTheme()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="min-h-full pb-24 sm:pb-0">
      {!inLesson && !isLanding && <TopBar />}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          <Suspense fallback={<div className="px-4 py-20 text-center text-[var(--ink-soft)]">Even laden…</div>}>
          <Routes location={location}>
            <Route path="/" element={<Landing />} />
            <Route path="/leren" element={<Learn />} />
            <Route path="/les/:lessonId" element={<LessonPlayer />} />
            <Route path="/herhalen" element={<Review />} />
            <Route path="/woorden" element={<Words />} />
            <Route path="/letters" element={<Alphabet />} />
            <Route path="/verhalen" element={<Stories />} />
            <Route path="/verhalen/:storyId" element={<StoryReader />} />
            <Route path="/spelen" element={<Games />} />
            <Route path="/profiel" element={<Profile />} />
            <Route path="/ouders" element={<Parents />} />
            <Route path="/instellingen" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </motion.main>
      </AnimatePresence>

      {!inLesson && !isLanding && (
        <nav
          aria-label="Hoofdmenu"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--surface-raised)]/95 backdrop-blur sm:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <ul className="mx-auto flex max-w-lg">
            {TABS.map((tab) => (
              <li key={tab.to} className="flex-1">
                <NavLink
                  to={tab.to}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold ${isActive ? 'text-zellige-600 dark:text-zellige-300' : 'text-[var(--ink-soft)]'}`
                  }
                >
                  <span className="text-xl" aria-hidden="true">{tab.icon}</span>
                  {tab.label}
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
const Router = DEMO ? HashRouter : BrowserRouter

export default function App() {
  return (
    <Router>
      <Chrome />
    </Router>
  )
}
