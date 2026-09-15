import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
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
