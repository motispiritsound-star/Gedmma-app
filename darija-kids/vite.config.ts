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
      target: 'es2022',
      outDir: demo ? 'dist-demo' : 'dist',
      cssCodeSplit: !demo,
      assetsInlineLimit: demo ? 100_000_000 : 4096,
      rollupOptions: demo ? { output: { inlineDynamicImports: true } } : undefined,
    },
    test: { environment: 'node', include: ['src/**/*.test.ts'] },
  }
})
