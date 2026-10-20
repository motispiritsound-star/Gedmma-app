import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './stijl.css'
import { App } from './App'
import { laad } from './engine/opslag'
import { MERK } from './merk/merk'

/**
 * Het begin.
 *
 * `laad()` vóór de eerste render, en niet in een effect: anders tekent de app
 * één keer met een lege staat en springt hij daarna naar het welkomstscherm —
 * of erger, naar het pad met nul voortgang, en dan ziet een kind even dat
 * alles weg is.
 */
laad()

// De titel komt uit merk.ts en niet uit index.html, zodat de merknaam op één
// plek staat. Zie docs/decisions.md A-2.
document.title = MERK.naam

const wortel = document.getElementById('wortel')
if (!wortel) throw new Error('Geen #wortel in index.html')

createRoot(wortel).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
