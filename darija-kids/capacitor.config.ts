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
  appId: 'app.darijaforkids.learn',
  appName: 'Darijaforkids',
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
  /*
   * Hier stond een blok instellingen voor `SplashScreen`, en dat deed niets:
   * `@capacitor/splash-screen` staat niet in `package.json`. Alleen de plugin
   * zelf leest die instellingen.
   *
   * Het startscherm komt van de kant van het toestel. Op Android uit
   * `res/values/styles.xml` (`AppTheme.NoActionBarLaunch` → `@drawable/splash`),
   * en die tekening bestaat in een dag- en een nachtversie: crème met het
   * sterretje, of nachtblauw met hetzelfde sterretje. Android kiest zelf welke.
   * Op iOS doet `LaunchScreen.storyboard` hetzelfde.
   */
}

export default config
