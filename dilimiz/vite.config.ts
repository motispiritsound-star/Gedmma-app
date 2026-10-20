// defineConfig uit vitest/config in plaats van uit vite: dat is dezelfde functie
// met het -blok erbij in de typen. Zonder dit klaagt tsc over .
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * De bouw. Eén uitkomst, drie bestemmingen: de webdemo, en via Capacitor de
 * iOS- en Android-app. Alles wordt gebundeld — er is geen server om iets
 * vandaan te halen, en de app hoort te werken in een vliegtuig en in een dorp
 * zonder bereik.
 */
export default defineConfig({
  plugins: [react()],
  // Relatieve paden: in een Capacitor-schil staat de app niet op de wortel
  // van een domein maar op `capacitor://localhost`, en een absoluut pad naar
  // `/assets/...` vindt daar niets.
  base: './',
  build: {
    outDir: 'dist',
    // Een kinderapp op een oude Android-telefoon. Chrome 90 is de ondergrens
    // die de winkels in de praktijk nog opleveren.
    target: ['es2020', 'chrome90', 'safari15'],
    sourcemap: false,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // De paar tests die een DOM nodig hebben zeggen dat bovenaan met
    // `// @vitest-environment jsdom`. De rest draait in node, en dat is
    // sneller en dwingt af dat `engine/` en `content/` geen browser nodig
    // hebben.
    globals: true,
  },
})
