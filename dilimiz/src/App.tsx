import { useEffect } from 'react'
import { HashRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { useStaat } from './engine/opslag'
import { localeVan } from './i18n/talen'
import { useT, useTaal } from './i18n'
import { wekStemmen } from './engine/audio'
import { Welkom } from './pages/Welkom'
import { Pad, NietGevonden } from './pages/Pad'
import { Les } from './pages/Les'
import { Herhalen } from './pages/Herhalen'
import { Woorden } from './pages/Woorden'
import { Alfabet } from './pages/Alfabet'
import { Jij } from './pages/Jij'
import { Ouders } from './pages/Ouders'
import { Abonnement } from './pages/Abonnement'

/**
 * De app.
 *
 * `HashRouter` en niet `BrowserRouter`: in een Capacitor-schil staat de app op
 * `capacitor://localhost` en is er geen server die een pad als `/les/aile-1`
 * naar index.html kan sturen. Een gewone router geeft daar een leeg scherm bij
 * het verversen.
 */
export function App() {
  return (
    <HashRouter>
      <Schil />
    </HashRouter>
  )
}

/**
 * Het thema, het accent en de taal op <html> zetten.
 *
 * Op het element en niet in een context: de CSS leest ze als attributen, en
 * dan hoeft er geen component opnieuw te tekenen om een kleur te veranderen.
 */
function useChroom() {
  const inst = useStaat((s) => s.instellingen)
  const taal = useTaal()

  useEffect(() => {
    const w = document.documentElement
    w.dataset.thema = inst.thema === 'systeem' ? '' : inst.thema
    w.dataset.accent = inst.accent
    w.dataset.beweging = inst.beweging
    w.dataset.lezen = inst.lezen
    w.lang = localeVan(taal)
  }, [inst.thema, inst.accent, inst.beweging, inst.lezen, taal])
}

function Schil() {
  const welkomGedaan = useStaat((s) => s.welkomGedaan)
  const plek = useLocation()
  useChroom()

  useEffect(() => { wekStemmen() }, [])

  // Bovenaan beginnen bij een nieuw scherm. Zonder dit begint een les
  // halverwege als het vorige scherm gescrold was.
  useEffect(() => { window.scrollTo(0, 0) }, [plek.pathname])

  if (!welkomGedaan) {
    return (
      <div className="schil">
        <Welkom onKlaar={() => { /* de staat schakelt dit scherm zelf uit */ }} />
      </div>
    )
  }

  const inLes = plek.pathname.startsWith('/les/')

  return (
    <div className="schil">
      <Routes>
        <Route path="/" element={<Pad />} />
        <Route path="/les/:id" element={<Les />} />
        <Route path="/herhalen" element={<Herhalen />} />
        <Route path="/woorden" element={<Woorden />} />
        <Route path="/alfabet" element={<Alfabet />} />
        <Route path="/jij" element={<Jij />} />
        <Route path="/ouders" element={<Ouders />} />
        <Route path="/abonnement" element={<Abonnement />} />
        <Route path="/404" element={<NietGevonden />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
      {/* Geen tabbalk tijdens een les: dan is wegklikken één misgetikte duim. */}
      {inLes ? null : <Tabbalk />}
    </div>
  )
}

function Tabbalk() {
  const t = useT()
  const tabs = [
    { naar: '/', emoji: '🗺', label: t.nav.leren },
    { naar: '/herhalen', emoji: '🔁', label: t.nav.herhalen },
    { naar: '/woorden', emoji: '📘', label: t.nav.woorden },
    { naar: '/alfabet', emoji: '🔤', label: t.nav.letters },
    { naar: '/jij', emoji: '🙂', label: t.nav.jij },
  ]
  return (
    <nav className="tabs" aria-label={t.nav.leren}>
      {tabs.map((tab) => (
        <NavLink key={tab.naar} to={tab.naar} end className="tab">
          <span aria-hidden>{tab.emoji}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
