import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { Grens } from './ui/Grens'
import { platform } from './engine/platform'
import './index.css'

// Waar de app op draait, op <html>, zodat de opmaak erop kan reageren. Dit
// staat vóór het renderen: `--rand-boven` en `--rand-onder` in index.css
// hangen ervan af, en die worden bij het eerste scherm al gebruikt.
document.documentElement.dataset.stelsel = platform()

// `Grens` staat binnen StrictMode maar buiten `App`, want een fout in App zelf
// moet hij ook opvangen — en dat kan alleen van buitenaf. Zonder deze regel
// ontkoppelt React bij een onafgevangen fout de hele boom en houdt een kind een
// wit scherm over: geen tekst, geen knop, en niets om aan een ouder te vertellen.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Grens>
      <App />
    </Grens>
  </StrictMode>,
)

// The service worker makes the web app installable and usable without a
// network. In the App Store and Play Store builds the shell already bundles
// everything, so it would only add a second cache that can go stale.
const native = 'Capacitor' in window && (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()

if ('serviceWorker' in navigator && import.meta.env.PROD && import.meta.env.VITE_DEMO !== '1' && !native) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js')
  })
}
