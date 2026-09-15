import type { CapacitorConfig } from '@capacitor/cli'

/**
 * The native shells for the App Store and Google Play.
 *
 * The app inside is the same build that runs on the web: `npm run build`
 * writes dist/, and `npx cap sync` copies it into the iOS and Android
 * projects. No server is involved — the whole app, fonts included, is bundled,
 * so it works on a plane and in Morocco without a signal.
 */
const config: CapacitorConfig = {
  appId: 'app.gedmma.learn',
  appName: 'Gedmma',
  webDir: 'dist',
  backgroundColor: '#0d1220',
  android: {
    backgroundColor: '#0d1220',
    // The app has no account and no uploads; nothing needs cleartext HTTP.
    allowMixedContent: false,
  },
  ios: {
    backgroundColor: '#0d1220',
    contentInset: 'always',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 900,
      backgroundColor: '#0d1220',
      showSpinner: false,
    },
  },
}

export default config
