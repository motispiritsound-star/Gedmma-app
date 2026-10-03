/**
 * Of beweging uit moet.
 *
 * Er zijn twee schakelaars en geen van beide dekt alles. `MotionConfig
 * reducedMotion="user"` in App.tsx luistert naar het toestel, en de regel in
 * index.css zet css-overgangen stil bij "rustig" -- maar een kaart die naar je
 * vinger kantelt is geen animatie, het is een stánd, en die zetten ze allebei
 * niet uit. Nagemeten in Chromium met `prefers-reduced-motion: reduce`: de
 * kanteling stond er gewoon, alleen zonder overgang ernaartoe. En wat framer
 * doet is javascript dat elke tel een inline stijl schrijft; daar komt geen
 * stylesheet tussen.
 *
 * Dus allebei de voorkeuren, in één waarde, op één plek.
 *
 * Die ene plek is waarom dit bestand bestaat. De hook stond in
 * `exercises.tsx`, waar hij hoorde toen alleen de les bewoog. Daarna schreef
 * het startscherm zijn eigen versie: `useStore((s) => s.settings.motion) !==
 * 'full'` -- en dat leest alleen de knop in de app, niet de voorkeur van het
 * toestel. Gemeten op dat scherm met `prefers-reduced-motion: reduce`: de deur
 * deed er nog 297 milliseconde over, met een overgang van 240 die er niet had
 * moeten zijn. Wie die voorkeur aanzet heeft er een reden voor.
 *
 * En hier en niet in `exercises.tsx`, zodat het eerste scherm van de app niet
 * de hele lesmachine hoeft te laden om één vraag te stellen.
 */
import { useReducedMotion } from 'framer-motion'
import { useStore } from '../engine/store'

export function useRustig(): boolean {
  const vanToestel = useReducedMotion()
  return useStore((s) => s.settings.motion) !== 'full' || vanToestel === true
}
