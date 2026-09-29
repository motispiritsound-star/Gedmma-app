import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `vite build --mode demo` reads .env.demo, which sets VITE_DEMO=1 for the app:
// one chunk, one stylesheet, hash routing, no service worker — everything
// scripts/make-demo.mjs then folds into a single HTML file.
export default defineConfig(({ mode }) => {
  const demo = mode === 'demo'

  return {
    plugins: [react(), tailwindcss()],
    server: { port: 4310, host: true },
    build: {
      /*
       * Waarom es2019 en niet es2022.
       *
       * `minSdkVersion` staat op 24: de app mág op Android 7 geïnstalleerd
       * worden. Maar op es2022 zat er `?.`, `??` en `??=` in de bundel, en dat
       * is syntaxis van Chrome 80 tot 85. Een WebView die ouder is leest het
       * bestand niet eens in — geen foutmelding op het scherm, geen halve app,
       * gewoon niets. Precies wat Google's beleid "apps that install, but
       * don't load" noemt.
       *
       * Op es2019 garandeert esbuild dat er niets nieuwers dan ES2019 in staat,
       * en dat is Chrome 73 (maart 2019). Nagemeten wat dat kost aan javascript:
       * 1123 kB op es2022, 1131 kB op es2019. Acht kilobyte. En het kan een
       * modern toestel niet schaden — oude syntaxis draait overal waar nieuwe
       * draait.
       *
       * Wat esbuild niet doet is functies bijmaken die er nog niet waren.
       * Dat is een tweede soort gat, en het valt later om — niet bij het
       * inlezen maar bij het uitvoeren. Op dit moment gebruikt de bundel er
       * geen enkele; scripts/bundelcheck.mjs telt ze bij elke bouw na en
       * laat de bouw omvallen zodra een afhankelijkheid er een meebrengt.
       *
       * Ik dacht eerst dat framer-motion `Object.hasOwn` gebruikte en schreef
       * er een polyfill voor. Dat was verkeerd gelezen: daar staat
       * `Object.hasOwnProperty`, en mijn patroon matchte het begin daarvan.
       * De polyfill is weer weg; de controle kijkt nu op een woordgrens.
       */
      target: 'es2019',
      outDir: demo ? 'dist-demo' : 'dist',
      cssCodeSplit: !demo,
      assetsInlineLimit: demo ? 100_000_000 : 4096,
      rollupOptions: demo ? { output: { inlineDynamicImports: true } } : undefined,
    },
    // De worker hoort erbij. Hij staat in een eigen map met een eigen
    // package.json, maar de winkelmelding die hij verwerkt is het stuk waar
    // een vergissing op diefstal lijkt — dat hoort onder dezelfde tests.
    test: { environment: 'node', include: ['src/**/*.test.ts', 'server/src/**/*.test.ts'] },
  }
})
