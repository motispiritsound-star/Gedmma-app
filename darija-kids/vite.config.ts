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
       * Waarom een bouwdoel, en niet es2022.
       *
       * `minSdkVersion` staat op 24: de app mág op Android 7 geïnstalleerd
       * worden. Maar op es2022 zat er `?.`, `??` en `??=` in de bundel, en dat
       * is syntaxis van Chrome 80 tot 85. Een WebView die ouder is leest het
       * bestand niet eens in — geen foutmelding op het scherm, geen halve app,
       * gewoon niets. Precies wat Google's beleid "apps that install, but
       * don't load" noemt.
       *
       * Met een bouwdoel garandeert esbuild dat er niets nieuwers in staat, en
       * dat kost bijna niets: 1123 kB op es2022, 1138 kB op het doel dat hier
       * nu staat. Vijftien kilobyte op elfhonderd. En het kan een modern
       * toestel niet schaden — oude syntaxis draait overal waar nieuwe draait.
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
      /*
       * En dan de vraag: hoe laag is laag genoeg?
       *
       * Eerst stond dit op es2019, omdat dat `?.` en `??` weghaalde en dat de
       * syntaxis was die de bundel van Chrome 85 liet afhangen. Dat loste het
       * gevonden geval op en niet de vraag. es2019 is Chrome 69, september
       * 2018 -- een datum die nergens uit volgt.
       *
       * De drempel die wél ergens uit volgt staat in variables.gradle:
       * minSdkVersion 24, Android 7. Die is uitgekomen met WebView Chrome 51,
       * en op een toestel waar de WebView nooit is bijgewerkt is dat nog
       * steeds wat er draait. Chrome 51 is es2015. Daar hoort dit dus te
       * staan, en niet op een versie die toevallig het laatste probleem
       * afdekte.
       *
       * Het verschil is gemeten en niet geschat: es2019 gaf 1130 kB, es2015
       * geeft 1137. Zeven kilobyte op elfhonderd, oftewel een half procent,
       * voor het wegnemen van drie jaar aan gokwerk over welke WebView er op
       * het toestel van een ouder staat.
       */
      target: 'es2015',
      outDir: demo ? 'dist-demo' : 'dist',
      cssCodeSplit: !demo,
      assetsInlineLimit: demo ? 100_000_000 : 4096,
      rollupOptions: demo ? { output: { inlineDynamicImports: true } } : undefined,
    },
    // De worker hoort erbij. Hij staat in een eigen map met een eigen
    // package.json, maar de winkelmelding die hij verwerkt is het stuk waar
    // een vergissing op diefstal lijkt — dat hoort onder dezelfde tests.
    /*
     * De toetsen krijgen twintig seconden in plaats van vijf.
     *
     * Niet omdat ze traag zijn, maar omdat een deel van ze echt werk doet: een
     * Node-proces starten, `git ls-files` draaien, honderden bestanden lezen.
     * Vitest draait honderdzes werkers, elk met zijn eigen opstarttijd, en op
     * een drukke machine duurt het starten van nóg een proces makkelijk tien
     * keer zo lang als op een stille.
     *
     * Dat heeft drie keer een rode suite opgeleverd waar niets mis was. De
     * eerste twee keer is de uitvoer weggefilterd en is het afgedaan als
     * flakiness; de derde keer stond er gewoon:
     *
     *     Error: Test timed out in 5000ms.
     *     106 workers spawned · ~154ms startup each
     *
     * Vijf seconden is de standaard van de bibliotheek en niet een keuze die
     * hier ooit gemaakt is. Twintig is dat wel: ruim genoeg dat drukte op de
     * machine geen storing meer meldt, en krap genoeg dat een toets die echt
     * blijft hangen nog steeds omvalt in plaats van de bouw op te houden.
     */
    test: { environment: 'node', include: ['src/**/*.test.ts', 'server/src/**/*.test.ts'], testTimeout: 20_000 },
  }
})
