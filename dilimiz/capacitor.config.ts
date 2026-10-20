import type { CapacitorConfig } from '@capacitor/cli'

/**
 * De native schillen voor de App Store en Google Play.
 *
 * De app erin is dezelfde bouw die op het web draait: `npm run build` schrijft
 * dist/, en `npx cap sync` kopieert dat in de iOS- en Android-projecten. Geen
 * server, dus de app werkt offline.
 *
 * De naam staat vast (Dilimiz), dus deze waarden zijn definitief. De mappen
 * `android/` en `ios/` bestaan nog niet: `npx cap add` schrijft de app-id in
 * tientallen projectbestanden, en dat is nu met één opdracht in één keer goed
 * te doen. Zie docs/mvp-backlog.md #26.
 *
 * Deze waarden komen uit src/merk/merk.ts. Houd ze gelijk —
 * src/merk/merk.test.ts legt ze naast elkaar.
 */
const config: CapacitorConfig = {
  appId: 'app.dilimiz.learn',
  appName: 'Dilimiz',
  webDir: 'dist',
  backgroundColor: '#f6f8fd',
  android: {
    backgroundColor: '#f6f8fd',
    // Geen account en geen uploads; niets heeft onversleuteld HTTP nodig.
    allowMixedContent: false,
  },
  ios: {
    backgroundColor: '#f6f8fd',
    contentInset: 'always',
  },
}

export default config
