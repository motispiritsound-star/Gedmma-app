import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // De API draait apart; de proxy voorkomt CORS-gedoe tijdens ontwikkelen.
    proxy: {
      '/api': { target: process.env.API_URL ?? 'http://127.0.0.1:4000', changeOrigin: true },
      '/health': { target: process.env.API_URL ?? 'http://127.0.0.1:4000', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Splitsen zodat het eerste scherm snel laadt.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  }
});
